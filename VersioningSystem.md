# **Git-Style Version-Control Specification for Contracts & Templates**

This document augments the Contract Module and Template Module with **true, branch-based version control**—conceptually identical to Git, yet tailored to legal documents and the existing Node.js + Angular stack.

---

## 1  Objectives

| Goal                           | Why It Matters                                            |
| ------------------------------ | --------------------------------------------------------- |
| **Full history** of every byte | Audit, rollback, traceability, e-discovery.               |
| **Branch & merge** workflow    | Parallel edits (e.g., “Negotiation” vs “Internal Draft”). |
| **Content-addressed storage**  | Eliminates duplication, guarantees integrity.             |
| **Human-readable commits**     | Who changed what & why (commit message).                  |
| **Tag & release**              | Mark “v1.0 Signed”, “2025 Budget Template”, etc.          |
| **Diff & conflict UI**         | Show granular redlines; enable merge resolution.          |

---

## 2  Core Concepts (Mirrors Git Terminology)

| Concept               | Definition (in this system)                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Repository**        | Logical container for one Contract *or* Template.                                                                  |
| **Blob**              | SHA-256 hash of raw clause text or whole document (content-addressed).                                             |
| **Tree**              | Ordered list of blobs representing the document structure (clause order).                                          |
| **Commit**            | Snapshot object (`commitId`) that points to a tree + metadata (author, message, timestamp, parent commit).         |
| **Branch**            | Movable pointer (`ref`) to latest commit in a line of development (e.g., `main`, `negotiation`, `hotfix/2025-01`). |
| **Tag**               | Immutable pointer with semantic label (`signed-v1`, `template-2025-04`).                                           |
| **Merge**             | Operation combining two branch heads, producing a new commit with two parents.                                     |
| **Conflict**          | Occurs when same clause offset changed on both branches; requires manual resolution.                               |
| **Pull Request (PR)** | Optional review gate: propose merging branch → main; approvers resolve conflicts and complete merge.               |

---

## 3  Storage Model (Back-end)

### 3.1  Persistence Layers

1. **Object Store (table `vc_objects`)**
   *Columns*: `sha CHAR(64) PK`, `data BYTEA`, `type ENUM('blob','tree','commit','tag')`, `createdAt`.
   *Guarantee*: SHA is SHA-256 of `data`; duplication impossible.
2. **Refs (table `vc_refs`)**
   `refId VARCHAR PK`, `repoId`, `commitSha`, `refType ENUM('branch','tag')`, `isMutable BOOL`.
3. **Repositories (table `vc_repos`)**
   `repoId PK`, `entityType ENUM('contract','template')`, `entityId FK`, `defaultBranch VARCHAR`.
4. **PRs (table `vc_prs`)**
   `prId PK`, `repoId`, `sourceBranch`, `targetBranch`, `status`, `createdBy`, `createdAt`, `mergedCommitSha?`.
5. **Conflicts (table `vc_conflicts`)**
   Store unresolved diff hunks with clause indexes for UI resolution.

### 3.2  Migration Strategy

* Each existing `ContractVersion` or `TemplateVersion` becomes a **commit** in `main`.
* The `currentVersionId` pointer maps to `vc_refs.refId = 'main'`.

---

## 4  API Surface (Back-end REST)

| Verb & Path                                         | Description                                          | Auth     |
| --------------------------------------------------- | ---------------------------------------------------- | -------- |
| `POST /repos/:id/branches`                          | Create branch `{ name, fromCommit }`                 | Editor   |
| `POST /repos/:id/commits`                           | Commit staged changes `{ branch, treeSha, message }` | Editor   |
| `GET /repos/:id/commits?branch=negotiation&cursor=` | Paginated history                                    | Viewer   |
| `GET /repos/:id/diff?from=sha1&to=sha2`             | Clause-level diff                                    | Viewer   |
| `POST /repos/:id/merge`                             | Merge branches `{ source, target, message }`         | Editor   |
| `POST /repos/:id/tags`                              | Tag commit `{ name, commitSha }`                     | Admin    |
| `POST /repos/:id/pull-requests`                     | Open PR `{ source, target }`                         | Editor   |
| `PATCH /repos/:id/pull-requests/:pr/complete`       | Complete after conflicts resolved                    | Approver |
| `DELETE /repos/:id/branches/:name`                  | Delete stale branch                                  | Admin    |

*All endpoints emit SSE events (`commitCreated`, `branchUpdated`, `prOpened`, `mergeCompleted`, etc.).*

---

## 5  Front-End UX & Workflow (Angular)

### 5.1  Repository Toolbar (inside Editor)

* **Branch Selector** (dropdown)
  *Default `main` selected; shows “Create Branch” plus list.*
* **Commit Panel**
  *Textarea for message → “Commit” button enabled when diffs exist.*
* **History** button → opens **CommitTimelineDrawer** (scrollable list).
* **PR / Merge**
  *If branch ≠ `main`, “Open Pull Request” appears; “Merge” in PR context after approval.*

### 5.2  Diff Viewer

* Clause-aware diff (side-by-side) coloured red/green.
* Dropdown: choose any two commits or branches.
* If conflict state, show **Resolution UI**:
  *Left = ours, Right = theirs, Middle = editable merge result.*
  *“Accept Ours”, “Accept Theirs”, or inline edits.*

### 5.3  Branch Badges

* On ContractList & TemplateList: indicator pills
  `main•2`, `negotiation•1` (branch count • unmerged commits).

### 5.4  PR Dashboard

* Kanban columns: **Open**, **In Review**, **Merged**, **Abandoned**.
* Card shows source→target, commits count, last activity, reviewers, merge button.

---

## 6  Business Rules & Policies

| Rule                      | Enforcement Detail                                               |
| ------------------------- | ---------------------------------------------------------------- |
| **Immutable commits**     | Never mutate `vc_objects` once written.                          |
| **Default branch**        | `main` for Contracts, `release` for Templates; cannot delete.    |
| **Mandatory PR for main** | Direct commit to `main` disabled except for Admin.               |
| **Conflict gating**       | Merge cannot complete while `vc_conflicts` rows exist for PR.    |
| **Tag locking**           | Tags are immutable (`isMutable = FALSE`).                        |
| **Audit**                 | Every commit, merge, tag, or deletion writes AuditService entry. |

---

## 7  Performance & Integrity

* **Deduplication**:  Many contracts share identical clause blocs; SHA storage saves >60 % space.
* **Content Size**:  Use delta compression in object store for large DOCX/PDF binary blobs.
* **Integrity Checks**:  Nightly job walks object graph; orphan detection and SHA verification.
* **Concurrency**:  Optimistic locking via branch tip SHA in `If-Match` header on commit.

---

## 8  Developer Implementation Checklist

### Back-end

1. Implement `VcObjectStore` helper for SHA hashing + insert-if-absent.
2. Build `RepoManager` service: branch CRUD, commit write, merge logic, conflict detect.
3. Integrate with existing AI analysis pipeline: after AI auto-redlines, stage changes -> commit “ai-analysis”.
4. Provide server-side diff endpoint using Myers algorithm on clause arrays.
5. Expose SSE multiplex channel `/repos/:id/events`.
6. Add RLS (row-level security) so repos respect contract/template ACL.

### Front-end

1. Create **BranchSelectorComponent**, **CommitDialogComponent**, **DiffViewerComponent**, **PrDashboardComponent**.
2. Extend NgRx slices: `branches`, `commits`, `prs`, integrate SSE updaters.
3. On Editor load: checkout selected branch (pull latest tree).
4. Stage changes live as user edits; prompt commit when leaving editor with unstaged changes.
5. Ensure DiffViewer supports navigation by clause number and search highlight.
6. Build ConflictResolutionForm with “Accept” toggles and combined preview.
7. Display toast on new commit (from collaborators) if currently viewing same repo.

---

## 9  Migration & Roll-Out

| Phase       | Action                                                                        |
| ----------- | ----------------------------------------------------------------------------- |
| **Phase 1** | Migrate existing version rows to baseline commits; lock new edits on `main`.  |
| **Phase 2** | Enable branch creation & commit; disable direct `main` writes (except Admin). |
| **Phase 3** | Introduce PR UI; educate users; enforce PR merge policy.                      |
| **Phase 4** | Enable tag & release automation; hook approvals into PDF sign-off flow.       |

Incremental phasing ensures no disruption to current users while gaining Git-class power.

---

Implementing this specification provides **true, auditable, branch-based version control**—empowering legal teams with developer-grade change tracking, safe parallel drafting, and frictionless rollback, all within the existing Node.js + Angular ecosystem.
