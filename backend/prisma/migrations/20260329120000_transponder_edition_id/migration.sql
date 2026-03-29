-- AlterTable
ALTER TABLE "Transponder" ADD COLUMN "editionId" INTEGER;

-- Backfill from team -> course -> edition
UPDATE "Transponder" AS t
SET "editionId" = c."editionId"
FROM "Team" AS tm
INNER JOIN "Course" AS c ON c.id = tm."courseId"
WHERE t."teamId" = tm.id;

-- Stock / orphans: latest edition that has at least one course
UPDATE "Transponder" AS t
SET "editionId" = sub.id
FROM (
  SELECT e.id
  FROM "Edition" e
  WHERE EXISTS (SELECT 1 FROM "Course" co WHERE co."editionId" = e.id)
  ORDER BY e."startDate" DESC, e.id DESC
  LIMIT 1
) AS sub
WHERE t."editionId" IS NULL;

-- Fallback: any edition (empty DB edge case)
UPDATE "Transponder" AS t
SET "editionId" = (SELECT id FROM "Edition" ORDER BY id ASC LIMIT 1)
WHERE t."editionId" IS NULL;

-- NotNull
ALTER TABLE "Transponder" ALTER COLUMN "editionId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Transponder" ADD CONSTRAINT "Transponder_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;
