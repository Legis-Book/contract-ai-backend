-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('NDA', 'EMPLOYMENT', 'VENDOR', 'SAAS', 'SALES', 'OTHER');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('PENDING_REVIEW', 'IN_REVIEW', 'REVIEWED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ClauseType" AS ENUM ('TERMINATION', 'CONFIDENTIALITY', 'INDEMNIFICATION', 'LIABILITY', 'INTELLECTUAL_PROPERTY', 'GOVERNING_LAW', 'DISPUTE_RESOLUTION', 'FORCE_MAJEURE', 'ASSIGNMENT', 'NOTICES', 'SEVERABILITY', 'ENTIRE_AGREEMENT', 'AMENDMENT', 'WAIVER', 'COUNTERPARTS', 'HEADINGS', 'DEFINITIONS', 'OTHER');

-- CreateEnum
CREATE TYPE "RiskType" AS ENUM ('MISSING_CLAUSE', 'DEVIATION', 'COMPLIANCE_ISSUE', 'AMBIGUOUS_LANGUAGE', 'UNFAIR_TERMS', 'DATA_PROTECTION', 'INTELLECTUAL_PROPERTY', 'LIABILITY', 'TERMINATION', 'OTHER');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SummaryType" AS ENUM ('FULL', 'CLAUSE', 'RISK', 'COMPLIANCE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VcObjectType" AS ENUM ('blob', 'tree', 'commit', 'tag');

-- CreateEnum
CREATE TYPE "VcRefType" AS ENUM ('branch', 'tag');

-- CreateEnum
CREATE TYPE "VcEntityType" AS ENUM ('contract', 'template');

-- CreateEnum
CREATE TYPE "VcPrStatus" AS ENUM ('open', 'in_review', 'merged', 'abandoned');

-- CreateEnum
CREATE TYPE "VcOutboxStatus" AS ENUM ('NEW', 'SENT', 'ERR');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'email',
    "socialId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "photoId" TEXT,
    "roleId" INTEGER,
    "statusId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" INTEGER NOT NULL,
    "name" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Status" (
    "id" INTEGER NOT NULL,
    "name" TEXT,

    CONSTRAINT "Status_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ContractType" NOT NULL DEFAULT 'OTHER',
    "status" "ContractStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "originalText" TEXT,
    "governingLaw" TEXT,
    "parties" JSONB,
    "uploadDate" TIMESTAMP(3),
    "reviewCompletionDate" TIMESTAMP(3),
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clause" (
    "id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" "ClauseType",
    "isReviewed" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "suggestedText" TEXT,
    "contractId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskFlag" (
    "id" TEXT NOT NULL,
    "type" "RiskType" NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "description" TEXT NOT NULL,
    "suggestedResolution" TEXT,
    "isReviewed" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "reviewerComments" TEXT,
    "contractId" TEXT NOT NULL,
    "clauseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskFlag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Summary" (
    "id" TEXT NOT NULL,
    "type" "SummaryType" NOT NULL,
    "text" TEXT NOT NULL,
    "isReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewerComments" TEXT,
    "contractId" TEXT NOT NULL,
    "clauseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QnA" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "contractId" TEXT NOT NULL,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "clauseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QnA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HumanReview" (
    "id" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "startDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "reviewerId" INTEGER,
    "contractId" TEXT NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HumanReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pattern" TEXT,
    "similarityThreshold" DOUBLE PRECISION,
    "deviationAllowedPct" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandardClause" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contractType" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "jurisdiction" TEXT,
    "version" TEXT,
    "allowedDeviations" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "previousVersionId" INTEGER,

    CONSTRAINT "StandardClause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEntity" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "provider" TEXT NOT NULL DEFAULT 'email',
    "socialId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "photoId" TEXT,
    "roleId" INTEGER,
    "statusId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleEntity" (
    "id" INTEGER NOT NULL,
    "name" TEXT,

    CONSTRAINT "RoleEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusEntity" (
    "id" INTEGER NOT NULL,
    "name" TEXT,

    CONSTRAINT "StatusEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileEntity" (
    "id" TEXT NOT NULL,
    "path" TEXT NOT NULL,

    CONSTRAINT "FileEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VcObject" (
    "sha" CHAR(64) NOT NULL,
    "data" BYTEA NOT NULL,
    "type" "VcObjectType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VcObject_pkey" PRIMARY KEY ("sha")
);

-- CreateTable
CREATE TABLE "VcRepo" (
    "id" TEXT NOT NULL,
    "entityType" "VcEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,

    CONSTRAINT "VcRepo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VcRef" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "commitSha" CHAR(64) NOT NULL,
    "refType" "VcRefType" NOT NULL,
    "isMutable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VcRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VcPr" (
    "id" TEXT NOT NULL,
    "repoId" TEXT NOT NULL,
    "sourceBranch" TEXT NOT NULL,
    "targetBranch" TEXT NOT NULL,
    "status" "VcPrStatus" NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mergedCommitSha" TEXT,

    CONSTRAINT "VcPr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VcConflict" (
    "id" TEXT NOT NULL,
    "prId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "hunk" TEXT,

    CONSTRAINT "VcConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VcCommitMeta" (
    "commitSha" CHAR(64) NOT NULL,
    "repoId" TEXT NOT NULL,
    "authorId" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sizeBytes" INTEGER NOT NULL,
    "branchHint" TEXT,

    CONSTRAINT "VcCommitMeta_pkey" PRIMARY KEY ("commitSha")
);

-- CreateTable
CREATE TABLE "VcOutbox" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "VcOutboxStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VcOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserEntity_email_key" ON "UserEntity"("email");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "Status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Clause" ADD CONSTRAINT "Clause_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskFlag" ADD CONSTRAINT "RiskFlag_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskFlag" ADD CONSTRAINT "RiskFlag_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "Clause"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "Clause"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QnA" ADD CONSTRAINT "QnA_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QnA" ADD CONSTRAINT "QnA_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "Clause"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanReview" ADD CONSTRAINT "HumanReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanReview" ADD CONSTRAINT "HumanReview_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HumanReview" ADD CONSTRAINT "HumanReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardClause" ADD CONSTRAINT "StandardClause_previousVersionId_fkey" FOREIGN KEY ("previousVersionId") REFERENCES "StandardClause"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEntity" ADD CONSTRAINT "UserEntity_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "FileEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEntity" ADD CONSTRAINT "UserEntity_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "RoleEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEntity" ADD CONSTRAINT "UserEntity_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VcRef" ADD CONSTRAINT "VcRef_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "VcRepo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VcRef" ADD CONSTRAINT "VcRef_commitSha_fkey" FOREIGN KEY ("commitSha") REFERENCES "VcObject"("sha") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VcPr" ADD CONSTRAINT "VcPr_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "VcRepo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VcPr" ADD CONSTRAINT "VcPr_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "UserEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VcConflict" ADD CONSTRAINT "VcConflict_prId_fkey" FOREIGN KEY ("prId") REFERENCES "VcPr"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VcCommitMeta" ADD CONSTRAINT "VcCommitMeta_repoId_fkey" FOREIGN KEY ("repoId") REFERENCES "VcRepo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VcCommitMeta" ADD CONSTRAINT "VcCommitMeta_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "UserEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VcCommitMeta" ADD CONSTRAINT "VcCommitMeta_commitSha_fkey" FOREIGN KEY ("commitSha") REFERENCES "VcObject"("sha") ON DELETE RESTRICT ON UPDATE CASCADE;
