Hybrid Version-Control Layer — Technical Specification

(Neo4j + PostgreSQL + Object-Store for Contracts & Templates on the existing Node.js / Angular stack)

⸻

1 Solution Overview

Plane	Responsibility	Technology	Rationale
Graph	Commit DAG, branches, merges, tags, lineage queries	Neo4j Aura Enterprise (Bolt protocol via neo4j-driver)	O( hops ) ancestry & merge-base traversal; simple Cypher for graph analytics
Metadata / Business	Contracts, templates, rules, PRs, audit, RBAC	PostgreSQL 15	ACID, JSONB flexibility, existing schema & operational skillset
Blob Storage	Raw clause blobs, binary uploads, packfiles	S3-compatible bucket (AWS S3 or MinIO)	Infinitely scalable, cheap, built-in SHA‐keyed deduplication via object names
Event Bus	Cross-store propagation	Postgres “Transactional Outbox” + BullMQ (Redis)	Guarantees exactly-once replication to Neo4j without XA

The Node.js back-end remains the single API surface; clients are unaware that three data stores exist.

⸻

2 Data Model

2.1 PostgreSQL Additions

Table	Purpose	Key Columns
vc_repos	Map contract/template → repository	repo_id PK, entity_type ENUM, entity_id FK, default_branch
vc_commits_meta	Lightweight index for search/reporting	commit_sha PK, repo_id, author_id, message, timestamp, size_bytes, branch_hint
vc_prs	Pull-request metadata	pr_id PK, repo_id, source_branch, target_branch, status, created_by, created_at, merged_commit_sha
vc_outbox	Event queue for Neo4j sync	event_id PK, payload JSONB, status ENUM('NEW','SENT','ERR'), created_at

Everything else (rules, audit, users) continues unchanged.

2.2 Neo4j Schema

Node Label	Properties	Relationships
:Commit	sha, authorId, message, ts, sizeBytes	(:Commit)-[:PARENT]->(:Commit)
:Branch	name	(:Branch)-[:HEAD]->(:Commit)
:Tag	name, annotation	(:Tag)-[:POINTS_TO]->(:Commit)
:Repo	repoId	(:Repo)-[:DEFAULT]->(:Branch)

Trees are stored as JSON in :Commit.tree to keep graph shallow; each tree entry lists blob SHA & clause index.

2.3 Object-Store Layout

bucket/
 ┣━ blobs/
 ┃   ┣━ aa/aa12…sha
 ┃   ┗━ bb/bb34…sha
 ┗━ pack/
     ┣━ 2025-05-27/pack-1234.idx
     ┗━ 2025-05-27/pack-1234.pack

*Blob object key = blobs/${sha:0:2}/${sha} (content-addressed).
*Nightly packing job bundles cold blobs into Git-style packfiles and uploads to pack/.

⸻

3 Write Path (Create Commit)
	1.	Compute SHAs of new/changed blobs in Node.js service.
	2.	PutObjects to bucket iff HEAD /blobs/{sha} returns 404 (deduplication).
	3.	BEGIN Postgres txn
	•	Insert row into vc_commits_meta.
	•	Insert single outbox row:

{ "action":"WRITE_COMMIT",
  "repoId":"R123",
  "commit":{…full commit JSON…},
  "branch":"draft"
}


	4.	COMMIT Postgres.
	5.	Worker (BullMQ) picks NEW outbox rows → writes to Neo4j (Cypher MERGE commit node, branch HEAD advance) → updates outbox status to SENT.
	6.	SSE commitCreated event broadcast to clients with payload from Neo4j write.

Failure Handling
	•	If Neo4j write fails → outbox row marked ERR; retry with exponential back-off; alerts after N retries.
	•	Postgres commit ensures metadata is never lost even if Neo4j is temporarily down.

⸻

4 Read Path

UI Action	Data Flow
Timeline / Branch graph	API asks Neo4j (`MATCH path = (:Branch {name})-[:HEAD
Diff two commits	Service retrieves commit JSONs from Neo4j (tree & blob SHAs) → streams required blobs from bucket → produces clause-level diff in memory, returns structured JSON to UI.
PR dashboard	Pure Postgres queries on vc_prs, vc_commits_meta with joins to contracts/templates.


⸻

5 Branch & Merge Semantics
	•	Branch creation: write Neo4j (:Branch)-[:HEAD]->(:Commit); store a small record in Postgres (vc_commits_meta.branch_hint) for faster list queries.
	•	Merge: Node service loads heads of source and target, calculates merge-base via Neo4j shortest path, spawns three-way diff; conflicts materialised to Postgres table vc_conflicts. Final merge commit follows Write Path.
	•	Tags: single Cypher MERGE for (:Tag {name})-[:POINTS_TO]->(:Commit) and outbox entry for durability.

⸻

6 API Additions (single façade)

Endpoint	Behaviour (under the hood)
GET /repos/:id/graph?branch&cursor	Pulls commit node batch from Neo4j (ordered by ts desc), hydrates author/user from Postgres, returns DTO.
POST /repos/:id/branches	Writes Postgres outbox → Neo4j branch.
POST /repos/:id/merge	Runs merge engine with blobs from bucket; writes merge commit via Write Path.
GET /repos/:id/diff?from&to	Utilises Neo4j + bucket for tree/blobs; streams “clause-patch” JSON.

All endpoints keep previous auth, pagination, and SSE semantics.

⸻

7 Dev Ops & Observability

Concern	Implementation
Back-ups	• Neo4j Aura daily TX dumps to S3. • Postgres WAL-G streaming. • Bucket versioning ON.
Metrics	• Neo4j Prometheus exporter (bolt sessions, tx time). • Postgres pgStat. • Outbox lag gauge.
Tracing	OpenTelemetry spans: REST handler → Postgres txn → Outbox publish → Neo4j write.
Disaster Recovery	If Neo4j unavailable, commits continue—queued in outbox; dashboard warns “Graph sync delayed” via SSE.
Garbage Collection	Weekly job queries Neo4j for (:Blob)<-[:TREE]-(:Commit) reachability; unreachable blobs older than gc_grace_days deleted from bucket after grace period.
Security	• Bucket policy: private, Server-Side Encryption – KMS. • Neo4j auth via IAM-style secrets, TLS on Bolt. • Postgres row-level security per tenant.


⸻

8 Migration Plan

Stage	Action
1 (Core Data Import)	For each ContractVersion/TemplateVersion: • compute tree + commit JSON • bulk-write to Neo4j via UNWIND Cypher • fill vc_commits_meta • point Branch main → last commit.
2 Enable Dual Writes	Activate outbox publishing for new commits; keep legacy version rows for 30 days.
3 Cut-over Reads	Switch UI endpoints from Postgres version tables to Neo4j graph queries.
4 Deprecate Legacy	Lock writes to old ContractVersion; after retention window drop table or retain for archive only.

Rollback: disable outbox consumers, continue to rely on Postgres‐only versions (no data loss).

⸻

9 Front-End Adaptations
	•	Branch Graph & Timeline Components already consume REST; no change needed.
	•	Diff Viewer uses clause-patch response; no assumption about DB technology.
	•	Status Banner: if SSE event graphDelay received (outbox backlog > threshold) show yellow warning to reviewers.

⸻

10 Developer Checklist

Backend
	1.	Add vc_outbox INSERT to existing commit service.
	2.	Implement OutboxDispatcher (BullMQ) with idempotent Neo4j upsert logic.
	3.	Harden merge engine with tree structure diff and conflict detection.
	4.	Add bucket client with SHA existence check and signed-URL download helper.
	5.	Implement garbage-collection scheduler using Neo4j traversal + bucket API.
	6.	Extend OpenAPI spec for new graph endpoints.

Frontend
	1.	Adapt CommitTimeline service to call /graph endpoint (supports cursor).
	2.	Add “Graph Sync” status indicator driven by SSE heartbeat.
	3.	QA regression on create, branch, merge, tag, and PR workflows.

⸻

Final Note

This hybrid architecture keeps graph-native speed for DAG analysis, relational guarantees for business operations, and cheap, deduplicated blob storage—mirroring the battle-tested pattern adopted by GitHub and GitLab while seamlessly embedding into the current Node.js / Angular solution.
