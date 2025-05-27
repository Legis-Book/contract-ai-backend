import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAdditionalFieldsToClauseSchema1748326782286
  implements MigrationInterface
{
  name = 'AddAdditionalFieldsToClauseSchema1748326782286';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "standard_clause" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "type" character varying NOT NULL, "contractType" character varying NOT NULL, "text" text NOT NULL, "jurisdiction" character varying, "version" character varying, "allowedDeviations" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9f629ce483d3edfccc75ca709a4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."risk_flags_flagtype_enum" AS ENUM('MISSING_CLAUSE', 'DEVIATION', 'COMPLIANCE_ISSUE', 'AMBIGUOUS_LANGUAGE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."risk_flags_severity_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."risk_flags_status_enum" AS ENUM('open', 'resolved', 'ignored')`,
    );
    await queryRunner.query(
      `CREATE TABLE "risk_flags" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "flagType" "public"."risk_flags_flagtype_enum" NOT NULL, "description" text NOT NULL, "severity" "public"."risk_flags_severity_enum" NOT NULL DEFAULT 'MEDIUM', "suggestedText" text, "notes" text, "status" "public"."risk_flags_status_enum" NOT NULL DEFAULT 'open', "isResolved" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "contractId" uuid, "clauseId" uuid, CONSTRAINT "PK_01362378bcc040917afecc52817" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."clauses_risklevel_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH')`,
    );
    await queryRunner.query(
      `CREATE TABLE "clauses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clauseNumber" character varying NOT NULL, "title" character varying, "text" text NOT NULL, "type" character varying, "classification" character varying, "riskLevel" "public"."clauses_risklevel_enum", "riskJustification" text, "obligation" character varying, "entities" text, "amounts" text, "dates" text, "legalReferences" text, "startIndex" integer, "endIndex" integer, "confidence" double precision, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "contractId" uuid, CONSTRAINT "PK_60852d3293ff91d684631a1a905" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "qnas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" text NOT NULL, "answer" text NOT NULL, "isAccepted" boolean NOT NULL DEFAULT false, "feedback" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "contractId" uuid, CONSTRAINT "PK_8615ff31cc9b1f7e99937318785" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."human_reviews_status_enum" AS ENUM('PENDING_REVIEW', 'REVIEWED_CHANGES', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TABLE "human_reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."human_reviews_status_enum" NOT NULL DEFAULT 'PENDING_REVIEW', "comments" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "contractId" uuid, "reviewerId" integer, CONSTRAINT "PK_89a8bb6ea6ba6c0eada06b04b55" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contracts_status_enum" AS ENUM('pending_review', 'in_review', 'reviewed', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TABLE "contracts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "filename" character varying NOT NULL, "contractType" character varying NOT NULL, "fullText" text, "governingLaw" character varying, "parties" character varying, "status" "public"."contracts_status_enum" NOT NULL DEFAULT 'pending_review', "language" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2c7b8f3a7b1acdd49497d83d0fb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."summaries_summarytype_enum" AS ENUM('FULL', 'RISKS', 'KEY_POINTS', 'OBLIGATIONS')`,
    );
    await queryRunner.query(
      `CREATE TABLE "summaries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "summaryType" "public"."summaries_summarytype_enum" NOT NULL, "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "contractId" uuid, CONSTRAINT "PK_448e2a87db98ce2a6ee8946f392" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "pattern" character varying, "similarityThreshold" double precision, "deviationAllowedPct" double precision, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_10fef696a7d61140361b1b23608" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "standard_clauses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "type" character varying NOT NULL, "content" text NOT NULL, "jurisdiction" character varying, "version" character varying, "description" text, "metadata" jsonb, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bbcd62cb6c4952b2763b835262b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "qna" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "question" text NOT NULL, "answer" text NOT NULL, "isAccepted" boolean NOT NULL DEFAULT false, "isFlagged" boolean NOT NULL DEFAULT false, "feedback" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "contractId" uuid, "clauseId" uuid, CONSTRAINT "PK_1439366984a11d62469a3d698e2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" DROP COLUMN "content"`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" DROP COLUMN "metadata"`,
    );
    await queryRunner.query(`ALTER TABLE "risk_flags" DROP COLUMN "flagType"`);
    await queryRunner.query(
      `ALTER TABLE "risk_flags" DROP COLUMN "suggestedText"`,
    );
    await queryRunner.query(`ALTER TABLE "risk_flags" DROP COLUMN "notes"`);
    await queryRunner.query(`ALTER TABLE "risk_flags" DROP COLUMN "status"`);
    await queryRunner.query(
      `ALTER TABLE "summaries" DROP COLUMN "summaryType"`,
    );
    await queryRunner.query(`ALTER TABLE "summaries" DROP COLUMN "content"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "clauseNumber"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "title"`);
    await queryRunner.query(
      `ALTER TABLE "clauses" DROP COLUMN "classification"`,
    );
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "riskLevel"`);
    await queryRunner.query(
      `ALTER TABLE "clauses" DROP COLUMN "riskJustification"`,
    );
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "obligation"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "entities"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "amounts"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "dates"`);
    await queryRunner.query(
      `ALTER TABLE "clauses" DROP COLUMN "legalReferences"`,
    );
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "startIndex"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "endIndex"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "confidence"`);
    await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "filename"`);
    await queryRunner.query(
      `ALTER TABLE "contracts" DROP COLUMN "contractType"`,
    );
    await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "fullText"`);
    /*await queryRunner.query(
      `CREATE TYPE "public"."risk_flags_flagtype_enum" AS ENUM('MISSING_CLAUSE', 'DEVIATION', 'COMPLIANCE_ISSUE', 'AMBIGUOUS_LANGUAGE', 'OTHER')`,
    );*/
    await queryRunner.query(
      `ALTER TABLE "risk_flags" ADD "flagType" "public"."risk_flags_flagtype_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_flags" ADD "suggestedText" text`,
    );
    await queryRunner.query(`ALTER TABLE "risk_flags" ADD "notes" text`);
    /*await queryRunner.query(
      `CREATE TYPE "public"."risk_flags_status_enum" AS ENUM('open', 'resolved', 'ignored')`,
    );*/
    await queryRunner.query(
      `ALTER TABLE "risk_flags" ADD "status" "public"."risk_flags_status_enum" NOT NULL DEFAULT 'open'`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "clauseNumber" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "title" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "classification" character varying`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."clauses_risklevel_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH')`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "riskLevel" "public"."clauses_risklevel_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "riskJustification" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "obligation" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "clauses" ADD "entities" text`);
    await queryRunner.query(`ALTER TABLE "clauses" ADD "amounts" text`);
    await queryRunner.query(`ALTER TABLE "clauses" ADD "dates" text`);
    await queryRunner.query(`ALTER TABLE "clauses" ADD "legalReferences" text`);
    await queryRunner.query(`ALTER TABLE "clauses" ADD "startIndex" integer`);
    await queryRunner.query(`ALTER TABLE "clauses" ADD "endIndex" integer`);
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "confidence" double precision`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD "filename" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD "contractType" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "contracts" ADD "fullText" text`);
    await queryRunner.query(
      `CREATE TYPE "public"."summaries_summarytype_enum" AS ENUM('FULL', 'RISKS', 'KEY_POINTS', 'OBLIGATIONS')`,
    );
    await queryRunner.query(
      `ALTER TABLE "summaries" ADD "summaryType" "public"."summaries_summarytype_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "summaries" ADD "content" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" ADD "content" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" ADD "metadata" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" ADD "text" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" ADD "allowedDeviations" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" ADD "isLatest" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" ADD "previousVersionId" uuid`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."risk_flags_type_enum" AS ENUM('MISSING_CLAUSE', 'DEVIATION', 'COMPLIANCE_ISSUE', 'AMBIGUOUS_LANGUAGE', 'UNFAIR_TERMS', 'DATA_PROTECTION', 'INTELLECTUAL_PROPERTY', 'LIABILITY', 'TERMINATION', 'OTHER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_flags" ADD "type" "public"."risk_flags_type_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_flags" ADD "suggestedResolution" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_flags" ADD "isReviewed" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_flags" ADD "reviewerComments" text`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."summaries_type_enum" AS ENUM('FULL', 'CLAUSE', 'RISK', 'COMPLIANCE')`,
    );
    await queryRunner.query(
      `ALTER TABLE "summaries" ADD "type" "public"."summaries_type_enum" NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "summaries" ADD "text" text NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "summaries" ADD "isReviewed" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "summaries" ADD "reviewerComments" text`,
    );
    await queryRunner.query(`ALTER TABLE "summaries" ADD "clauseId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "number" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "isReviewed" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "isApproved" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(`ALTER TABLE "clauses" ADD "suggestedText" text`);
    await queryRunner.query(
      `ALTER TABLE "human_reviews" ADD "startDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" ADD "completionDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."contracts_type_enum" AS ENUM('nda', 'employment', 'vendor', 'saas', 'sales', 'other')`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD "type" "public"."contracts_type_enum" NOT NULL DEFAULT 'other'`,
    );
    await queryRunner.query(`ALTER TABLE "contracts" ADD "originalText" text`);
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD "uploadDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD "reviewCompletionDate" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" ALTER COLUMN "jurisdiction" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" ALTER COLUMN "version" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_flags" ALTER COLUMN "severity" DROP DEFAULT`,
    );
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "type"`);
    await queryRunner.query(
      `CREATE TYPE "public"."clauses_type_enum" AS ENUM('TERMINATION', 'CONFIDENTIALITY', 'INDEMNIFICATION', 'LIABILITY', 'INTELLECTUAL_PROPERTY', 'GOVERNING_LAW', 'DISPUTE_RESOLUTION', 'FORCE_MAJEURE', 'ASSIGNMENT', 'NOTICES', 'SEVERABILITY', 'ENTIRE_AGREEMENT', 'AMENDMENT', 'WAIVER', 'COUNTERPARTS', 'HEADINGS', 'DEFINITIONS', 'OTHER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "type" "public"."clauses_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."human_reviews_status_enum" RENAME TO "human_reviews_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."human_reviews_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" ALTER COLUMN "status" TYPE "public"."human_reviews_status_enum" USING "status"::"text"::"public"."human_reviews_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."human_reviews_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" DROP COLUMN "reviewerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" ADD "reviewerId" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "parties"`);
    await queryRunner.query(`ALTER TABLE "contracts" ADD "parties" jsonb`);
    await queryRunner.query(
      `ALTER TABLE "risk_flags" ADD CONSTRAINT "FK_3c5fd7eb51262fbf892bfb4980d" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_flags" ADD CONSTRAINT "FK_fd3682284edeaaea5c32001130d" FOREIGN KEY ("clauseId") REFERENCES "clauses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD CONSTRAINT "FK_b4eba085cb5a960f325411e0331" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "qnas" ADD CONSTRAINT "FK_30e0651a487199d0c5b142fe77a" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" ADD CONSTRAINT "FK_7df891b92c846b472bb056e514b" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" ADD CONSTRAINT "FK_3d095681d4979bee4168a495f1c" FOREIGN KEY ("reviewerId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "summaries" ADD CONSTRAINT "FK_1f71b1f8ed1adcf35573371d299" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" ADD CONSTRAINT "FK_f116c91daf10d2007df29af4e66" FOREIGN KEY ("previousVersionId") REFERENCES "standard_clauses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "summaries" ADD CONSTRAINT "FK_694a2bf0f1a2d6c08891330f742" FOREIGN KEY ("clauseId") REFERENCES "clauses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "qna" ADD CONSTRAINT "FK_d8182bcbc58a3e9ec6c471c4d12" FOREIGN KEY ("contractId") REFERENCES "contracts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "qna" ADD CONSTRAINT "FK_22103b616de64c6deca212a4629" FOREIGN KEY ("clauseId") REFERENCES "clauses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "qna" DROP CONSTRAINT "FK_22103b616de64c6deca212a4629"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qna" DROP CONSTRAINT "FK_d8182bcbc58a3e9ec6c471c4d12"`,
    );
    await queryRunner.query(
      `ALTER TABLE "summaries" DROP CONSTRAINT "FK_694a2bf0f1a2d6c08891330f742"`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" DROP CONSTRAINT "FK_f116c91daf10d2007df29af4e66"`,
    );
    await queryRunner.query(
      `ALTER TABLE "summaries" DROP CONSTRAINT "FK_1f71b1f8ed1adcf35573371d299"`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" DROP CONSTRAINT "FK_3d095681d4979bee4168a495f1c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" DROP CONSTRAINT "FK_7df891b92c846b472bb056e514b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "qnas" DROP CONSTRAINT "FK_30e0651a487199d0c5b142fe77a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" DROP CONSTRAINT "FK_b4eba085cb5a960f325411e0331"`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_flags" DROP CONSTRAINT "FK_fd3682284edeaaea5c32001130d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_flags" DROP CONSTRAINT "FK_3c5fd7eb51262fbf892bfb4980d"`,
    );
    await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "parties"`);
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD "parties" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" DROP COLUMN "reviewerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" ADD "reviewerId" integer`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."human_reviews_status_enum_old" AS ENUM('PENDING_REVIEW', 'REVIEWED_CHANGES', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" ALTER COLUMN "status" TYPE "public"."human_reviews_status_enum_old" USING "status"::"text"::"public"."human_reviews_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" ALTER COLUMN "status" SET DEFAULT 'PENDING_REVIEW'`,
    );
    await queryRunner.query(`DROP TYPE "public"."human_reviews_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."human_reviews_status_enum_old" RENAME TO "human_reviews_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."clauses_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "type" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_flags" ALTER COLUMN "severity" SET DEFAULT 'MEDIUM'`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" ALTER COLUMN "version" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" ALTER COLUMN "jurisdiction" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" DROP COLUMN "reviewCompletionDate"`,
    );
    await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "uploadDate"`);
    await queryRunner.query(
      `ALTER TABLE "contracts" DROP COLUMN "originalText"`,
    );
    await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."contracts_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "human_reviews" DROP COLUMN "completionDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "human_reviews" DROP COLUMN "startDate"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" DROP COLUMN "suggestedText"`,
    );
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "isApproved"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "isReviewed"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "number"`);
    await queryRunner.query(`ALTER TABLE "summaries" DROP COLUMN "clauseId"`);
    await queryRunner.query(
      `ALTER TABLE "summaries" DROP COLUMN "reviewerComments"`,
    );
    await queryRunner.query(`ALTER TABLE "summaries" DROP COLUMN "isReviewed"`);
    await queryRunner.query(`ALTER TABLE "summaries" DROP COLUMN "text"`);
    await queryRunner.query(`ALTER TABLE "summaries" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."summaries_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "risk_flags" DROP COLUMN "reviewerComments"`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_flags" DROP COLUMN "isReviewed"`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_flags" DROP COLUMN "suggestedResolution"`,
    );
    await queryRunner.query(`ALTER TABLE "risk_flags" DROP COLUMN "type"`);
    await queryRunner.query(`DROP TYPE "public"."risk_flags_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" DROP COLUMN "previousVersionId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" DROP COLUMN "isLatest"`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" DROP COLUMN "allowedDeviations"`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" DROP COLUMN "text"`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" DROP COLUMN "metadata"`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" DROP COLUMN "content"`,
    );
    await queryRunner.query(`ALTER TABLE "summaries" DROP COLUMN "content"`);
    await queryRunner.query(
      `ALTER TABLE "summaries" DROP COLUMN "summaryType"`,
    );
    await queryRunner.query(`DROP TYPE "public"."summaries_summarytype_enum"`);
    await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "fullText"`);
    await queryRunner.query(
      `ALTER TABLE "contracts" DROP COLUMN "contractType"`,
    );
    await queryRunner.query(`ALTER TABLE "contracts" DROP COLUMN "filename"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "confidence"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "endIndex"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "startIndex"`);
    await queryRunner.query(
      `ALTER TABLE "clauses" DROP COLUMN "legalReferences"`,
    );
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "dates"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "amounts"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "entities"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "obligation"`);
    await queryRunner.query(
      `ALTER TABLE "clauses" DROP COLUMN "riskJustification"`,
    );
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "riskLevel"`);
    await queryRunner.query(`DROP TYPE "public"."clauses_risklevel_enum"`);
    await queryRunner.query(
      `ALTER TABLE "clauses" DROP COLUMN "classification"`,
    );
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "title"`);
    await queryRunner.query(`ALTER TABLE "clauses" DROP COLUMN "clauseNumber"`);
    await queryRunner.query(`ALTER TABLE "risk_flags" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."risk_flags_status_enum"`);
    await queryRunner.query(`ALTER TABLE "risk_flags" DROP COLUMN "notes"`);
    await queryRunner.query(
      `ALTER TABLE "risk_flags" DROP COLUMN "suggestedText"`,
    );
    await queryRunner.query(`ALTER TABLE "risk_flags" DROP COLUMN "flagType"`);
    await queryRunner.query(`DROP TYPE "public"."risk_flags_flagtype_enum"`);
    await queryRunner.query(`ALTER TABLE "contracts" ADD "fullText" text`);
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD "contractType" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "contracts" ADD "filename" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "confidence" double precision`,
    );
    await queryRunner.query(`ALTER TABLE "clauses" ADD "endIndex" integer`);
    await queryRunner.query(`ALTER TABLE "clauses" ADD "startIndex" integer`);
    await queryRunner.query(`ALTER TABLE "clauses" ADD "legalReferences" text`);
    await queryRunner.query(`ALTER TABLE "clauses" ADD "dates" text`);
    await queryRunner.query(`ALTER TABLE "clauses" ADD "amounts" text`);
    await queryRunner.query(`ALTER TABLE "clauses" ADD "entities" text`);
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "obligation" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "riskJustification" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "riskLevel" "public"."clauses_risklevel_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "classification" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "title" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "clauses" ADD "clauseNumber" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "summaries" ADD "content" text NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "summaries" ADD "summaryType" "public"."summaries_summarytype_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_flags" ADD "status" "public"."risk_flags_status_enum" NOT NULL DEFAULT 'open'`,
    );
    await queryRunner.query(`ALTER TABLE "risk_flags" ADD "notes" text`);
    await queryRunner.query(
      `ALTER TABLE "risk_flags" ADD "suggestedText" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "risk_flags" ADD "flagType" "public"."risk_flags_flagtype_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" ADD "metadata" jsonb`,
    );
    await queryRunner.query(
      `ALTER TABLE "standard_clauses" ADD "content" text NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "qna"`);
    await queryRunner.query(`DROP TABLE "standard_clauses"`);
    await queryRunner.query(`DROP TABLE "rules"`);
    await queryRunner.query(`DROP TABLE "summaries"`);
    await queryRunner.query(`DROP TYPE "public"."summaries_summarytype_enum"`);
    await queryRunner.query(`DROP TABLE "contracts"`);
    await queryRunner.query(`DROP TYPE "public"."contracts_status_enum"`);
    await queryRunner.query(`DROP TABLE "human_reviews"`);
    await queryRunner.query(`DROP TYPE "public"."human_reviews_status_enum"`);
    await queryRunner.query(`DROP TABLE "qnas"`);
    await queryRunner.query(`DROP TABLE "clauses"`);
    await queryRunner.query(`DROP TYPE "public"."clauses_risklevel_enum"`);
    await queryRunner.query(`DROP TABLE "risk_flags"`);
    await queryRunner.query(`DROP TYPE "public"."risk_flags_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."risk_flags_severity_enum"`);
    await queryRunner.query(`DROP TYPE "public"."risk_flags_flagtype_enum"`);
    await queryRunner.query(`DROP TABLE "standard_clause"`);
  }
}
