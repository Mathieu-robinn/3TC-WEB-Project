-- AlterTable
ALTER TABLE "Transponder" ADD COLUMN "numero" INTEGER;

-- Backfill: numéros 1..N par édition (ordre stable sur id)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "editionId" ORDER BY id) AS rn
  FROM "Transponder"
)
UPDATE "Transponder" t SET "numero" = ranked.rn FROM ranked WHERE t.id = ranked.id;

ALTER TABLE "Transponder" ALTER COLUMN "numero" SET NOT NULL;

CREATE UNIQUE INDEX "Transponder_editionId_numero_key" ON "Transponder"("editionId", "numero");
