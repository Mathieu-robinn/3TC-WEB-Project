-- TransponderStatus: INITIALISE, DONNE (ex-ATTRIBUE), EN_ATTENTE réservé à la liaison équipe
BEGIN;
CREATE TYPE "TransponderStatus_new" AS ENUM ('INITIALISE', 'EN_ATTENTE', 'DONNE', 'PERDU', 'RECUPERE', 'DEFAILLANT');

ALTER TABLE "Transponder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Transponder" ALTER COLUMN "status" TYPE "TransponderStatus_new" USING (
  CASE
    WHEN "status"::text = 'ATTRIBUE' THEN 'DONNE'::"TransponderStatus_new"
    WHEN "status"::text = 'EN_ATTENTE' AND "teamId" IS NULL THEN 'INITIALISE'::"TransponderStatus_new"
    WHEN "status"::text = 'EN_ATTENTE' AND "teamId" IS NOT NULL THEN 'EN_ATTENTE'::"TransponderStatus_new"
    ELSE "status"::text::"TransponderStatus_new"
  END
);

ALTER TABLE "TransponderTransaction" ALTER COLUMN "type" TYPE "TransponderStatus_new" USING (
  CASE
    WHEN "type"::text = 'ATTRIBUE' THEN 'DONNE'::"TransponderStatus_new"
    WHEN "type"::text = 'EN_ATTENTE' THEN 'INITIALISE'::"TransponderStatus_new"
    ELSE "type"::text::"TransponderStatus_new"
  END
);

ALTER TYPE "TransponderStatus" RENAME TO "TransponderStatus_old";
ALTER TYPE "TransponderStatus_new" RENAME TO "TransponderStatus";
DROP TYPE "public"."TransponderStatus_old";

ALTER TABLE "Transponder" ALTER COLUMN "status" SET DEFAULT 'INITIALISE';
COMMIT;
