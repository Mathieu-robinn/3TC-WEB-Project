-- Team: edition-scoped name uniqueness
ALTER TABLE "Team" ADD COLUMN "editionId" INTEGER;

UPDATE "Team" t
SET "editionId" = c."editionId"
FROM "Course" c
WHERE t."courseId" = c.id;

ALTER TABLE "Team" ALTER COLUMN "editionId" SET NOT NULL;

ALTER TABLE "Team" DROP CONSTRAINT IF EXISTS "Team_name_key";

ALTER TABLE "Team" ADD CONSTRAINT "Team_editionId_fkey"
  FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Team_editionId_name_key" ON "Team"("editionId", "name");

-- Course: unique name per edition
CREATE UNIQUE INDEX "Course_editionId_name_key" ON "Course"("editionId", "name");

-- Runner: email no longer globally unique
ALTER TABLE "Runner" DROP CONSTRAINT IF EXISTS "Runner_email_key";
