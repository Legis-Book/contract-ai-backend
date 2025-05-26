Contract Module – Full Functional Blueprint

(Clear, code-free instructions for an AI coding agent; covers front-end and back-end layers.)

⸻

1  Purpose & High-Level Capabilities

The Contract Module is the “authoring” and “lifecycle” hub.
It must let users:
	1.	Create – start a blank contract or instantiate one from a pre-approved template/playbook.
	2.	Version – maintain immutable snapshots every time a contract is published or materially edited.
	3.	List / Search / Delete – surface all contracts with filters, allow soft-delete or restore, and expose version history.
	4.	Review – ingest third-party documents for AI review (already specified in Dashboard section) and expose these “review jobs” for Q&A, download, or removal.

Everything must interoperate with the Template Management, Dashboard, and Chat Assistant features defined earlier.

⸻

2  Conceptual Data Model (extends previous schema)

Entity	Key Fields & Notes
Contract	contractId, title, type (NDA, MSA…), partyA, partyB, jurisdiction, status, currentVersionId, deletedAt?
ContractVersion	versionId, contractId, versionNo, createdBy, createdAt, isPublished, bodyText, structuredClausesJson, changeLog
ContractTemplate	(already defined in Playbook section) reused here for “create from template”.
ReviewJob	reviewId, contractId, uploadFilePath, analysisStatus, createdAt, deletedAt?
ChatMessage	messageId, reviewId, author (user/AI), content, timestamp

*Contracts may exist without ReviewJobs (e.g., authored in-house and never sent for AI review).
*Deletion is soft (timestamp) to preserve audit trails.

⸻

3  Front-End Requirements (Angular)

3.1 Navigation & Routing

Route	Component	Guard
/contracts	ContractListPageComponent	AuthGuard
/contracts/new	ContractCreateWizardComponent	AuthGuard
/contracts/:id/edit	ContractEditorComponent	RoleGuard(Editor)
/contracts/:id/versions	VersionTimelineComponent	RoleGuard(Viewer)
/contracts/:id/reviews	ReviewJobListComponent	RoleGuard(Viewer)
/contracts/:id/reviews/:rid	ReviewDashboardComponent	(already built)

3.2 User Flows

A. Create Contract (Blank or Template)
	1.	Entry point: “New Contract” CTA.
	2.	Step 1 – Meta Form: title, type, parties, jurisdiction.
	3.	Step 2 – Source Selection
	•	Option A “Blank”: open Editor with empty body placeholder and auto-create Version 0 (Draft).
	•	Option B “From Template”: show TemplatePicker (search by name/type) → once selected, clone template clauses into new contract body and auto-create Version 1 (Draft).
	4.	Step 3 – Content Editing: Editor exposes structured-clause grid and plain-text toggle; live word count and “Unsaved Edits” chip.
	5.	Publish: click “Publish Draft” → contract status = Active, Version 1 flagged published.

B. Edit & Versioning
	•	“Edit Contract” opens the same Editor but read-only if user lacks Editor role.
	•	On first save after a published version, front-end calls “Create New Version” and opens an editable copy; older version becomes historical.
	•	VersionTimeline shows vertical timeline cards with diff summary, author, and “Restore” (creates Version N+1 identical to the selected snapshot).
	•	DiffViewer overlay compares any two versions via side-by-side highlighting.

C. Contract List
	•	Paginated table with columns: Title, Type, Parties, Status, Last Edited, Versions (#), Reviews (#).
	•	Multifilter chips (type, jurisdiction, status) plus global search bar.
	•	Row actions: Open, Edit, Version History, Review Jobs, Soft Delete.
	•	Deletion path: confirmation modal + rationale input; list shows strikethrough row for deleted with ability to “Restore”.

D. Review Job Management
	•	ReviewJobList (per contract) lists each upload with: file name, AI status, created date, # risks flagged, “Open Review”, “Delete Review”.
	•	Q&A access lives inside ReviewDashboard (already built).
	•	Deleting a review job asks confirmation; removes Chat history; does not touch contract versions.

UX Guarantees
	•	Auto-scroll & section bookmarks in Editor.
	•	Mobile breakpoint collapses left navigation into hamburger menu.
	•	ARIA live regions announce version creation, deletion, and publication events.

3.3 State Management
	•	New NgRx slice contracts: holds meta and lightweight currentVersion snapshot.
	•	Slice versions: entity dictionary keyed by versionId; loaded lazily when timeline opened.
	•	Slice reviewJobs: tracks each job’s progress via SSE to update status in table.

⸻

4  Back-End Requirements (Node.js)

4.1 Service Responsibilities

Service	Responsibilities
ContractService	• Create blank/template-based contracts.• Update meta.• Soft-delete/restore.• Search & list.
VersionService	• Generate new versions on demand (including restore flow).• Persist full body and structured clause JSON.• Provide diff metadata (changed clauses, word delta).
TemplateCloneService	• When creating from template, merge template body, rules, and default metadata into Version 1.
ReviewJobService	• Ingest upload; spawn AI pipeline (already defined).• Provide list/delete operations.• Cascade delete ChatMessage records on review deletion.
ChatService	(existing) • Tie messages to reviewId.

4.2 API Endpoints (contract-level)

Verb & Path	Purpose	Notes
POST /contracts	Create new contract	Body contains meta + source (“blank” or templateId).
GET /contracts	List / search	Supports query params type, status, q, page, pageSize.
GET /contracts/:id	Fetch meta + currentVersion	–
PATCH /contracts/:id	Update meta fields	Title, parties, jurisdiction.
DELETE /contracts/:id	Soft delete	Stores deletedAt; 410 if already deleted.
POST /contracts/:id/restore	Undo delete	Clears deletedAt.
GET /contracts/:id/versions	Paginated timeline	Returns summaries only (id, verNo, diffStats).
POST /contracts/:id/versions	Create new version	Body: baseVersionId + bodyText + structuredClausesJson.
GET /contracts/:id/versions/:vid	Full version payload	For diff viewer.
POST /contracts/:id/versions/:vid/restore	Restore snapshot	Creates new VersionN+1 duplicating snapshot.
GET /contracts/:id/reviews	List review jobs	–
POST /contracts/:id/reviews	Upload file for review	Multipart; returns reviewId.
DELETE /contracts/:id/reviews/:rid	Delete review job	Cascades chat delete; preserves contract.

All endpoints secured with JWT; ACL = user must have access to contract’s tenant and proper role.

4.3 Business Rules & Enforcement
	1.	Version Immutability – once a Version record is written it can never mutate; only new versions or restore copies.
	2.	Current Version Pointer – Contract table always points to latest published version.
	3.	Template Integrity – When cloning from a template, the link to the templateVersionId is stored for audit.
	4.	Deletion Windows – Soft-deleted contracts remain in trash 90 days before hard purge job removes files and data (configurable per tenant).
	5.	Concurrency Control – VersionService checks If-Match: etag header to avoid lost updates.
	6.	Search Index – BodyText of every published version is pushed to full-text index (PG tsvector, OpenSearch, etc.) for global search endpoint.
	7.	Audit Trail – Every mutation (create, update, delete, restore, version publish) emits AuditService event.

4.4 Event & Communication Flow
	•	Contract creation fires SSE contractCreated.
	•	New version fires versionCreated, diff summary payload for timeline.
	•	Review job creation fires reviewJobCreated, then AI pipeline pushes progress events.
	•	Deleting a contract triggers contractDeleted for subscribed UIs (list page updates immediately).

4.5 Performance & Storage
	•	Blob Storage – Large original files for review jobs stored in object storage bucket; Version body text stored in DB (≤ 10 MB typical).
	•	Document Size Limits – enforce 25 MB per upload; hard reject anything larger.
	•	Rate Limits – contract creations 100/day/user; review jobs 20/day/user; version saves 60/hr/contract.

⸻

5  End-to-End Developer Checklist

Front-End (Angular)
	1.	Scaffold ContractListPage with server-side pagination + query-param sync.
	2.	Build CreateWizard with 3 steps and guard unsaved navigation.
	3.	Integrate TemplatePicker (lazy search via /templates?q=).
	4.	Implement VersionTimeline with diff summary chips and “Restore” CTA.
	5.	Ensure soft-delete states handled (grey row, “Restore” action).
	6.	Add ReviewJobList table and connect to existing ReviewDashboard route.
	7.	Add global toasts for SSE events (new version available, AI review complete).
	8.	Internationalise labels via i18n JSON.

Back-End (Node.js)
	1.	Extend DB with ContractVersion & ReviewJob tables; back-fill existing data.
	2.	Implement TemplateCloneService to copy StandardClauses into contract body.
	3.	Add transactional boundaries: create contract + first version must commit atomically.
	4.	Update OpenAPI spec; generate client SDK for Angular.
	5.	Implement object-storage adaptor for review uploads; store signed URL in DB.
	6.	Build ReviewJob delete cascade (messages → flags → file purge).
	7.	Write integration tests: create → publish → new version → diff accuracy; restore; soft-delete; review pipeline.
	8.	Configure Cron for trash purge after retention window.

⸻

By following these explicit front-end and back-end guidelines, an AI coding agent can deliver a Contract Module that seamlessly supports drafting, versioning, review, and lifecycle management—fully aligned with the surrounding Dashboard and Template systems.