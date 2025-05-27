-- CreateEnum
CREATE TYPE "VcObjectType" AS ENUM ('blob','tree','commit','tag');
CREATE TYPE "VcRefType" AS ENUM ('branch','tag');
CREATE TYPE "VcEntityType" AS ENUM ('contract','template');
CREATE TYPE "VcPrStatus" AS ENUM ('open','in_review','merged','abandoned');
CREATE TYPE "VcOutboxStatus" AS ENUM ('NEW','SENT','ERR');

-- CreateTable
CREATE TABLE "VcObject" (
    "sha" CHAR(64) NOT NULL,
    "data" BYTEA NOT NULL,
    "type" "VcObjectType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VcObject_pkey" PRIMARY KEY ("sha")
);

CREATE TABLE "VcRepo" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "entityType" "VcEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    CONSTRAINT "VcRepo_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VcRef" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "commitSha" CHAR(64) NOT NULL,
    "refType" "VcRefType" NOT NULL,
    "isMutable" BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT "VcRef_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VcRef_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "VcRepo"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "VcPr" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "repoId" TEXT NOT NULL,
    "sourceBranch" TEXT NOT NULL,
    "targetBranch" TEXT NOT NULL,
    "status" "VcPrStatus" NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mergedCommitSha" CHAR(64),
    CONSTRAINT "VcPr_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VcPr_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "VcRepo"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VcPr_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "UserEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "VcConflict" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "prId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "hunk" TEXT,
    CONSTRAINT "VcConflict_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "VcConflict_prId_fkey" FOREIGN KEY ("prId") REFERENCES "VcPr"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "VcCommitMeta" (
    "commitSha" CHAR(64) NOT NULL,
    "repoId" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sizeBytes" INTEGER NOT NULL,
    "branchHint" TEXT,
    CONSTRAINT "VcCommitMeta_pkey" PRIMARY KEY ("commitSha"),
    CONSTRAINT "VcCommitMeta_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "VcRepo"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VcCommitMeta_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "UserEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "VcOutbox" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "payload" JSONB NOT NULL,
    "status" "VcOutboxStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "VcOutbox_pkey" PRIMARY KEY ("id")
);
