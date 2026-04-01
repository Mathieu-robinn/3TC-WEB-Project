-- AlterTable: responsable transpondeur désigné (coureur)
ALTER TABLE "Team" ADD COLUMN "transponderHolderRunnerId" INTEGER;

-- Coureurs sans équipe : libérer les FK équipe.capitaine avant suppression
UPDATE "Team"
SET "respRunnerId" = NULL
WHERE "respRunnerId" IN (SELECT "id" FROM "Runner" WHERE "teamId" IS NULL);

DELETE FROM "Runner" WHERE "teamId" IS NULL;

-- teamId obligatoire + suppression en cascade si l'équipe est supprimée
ALTER TABLE "Runner" DROP CONSTRAINT "Runner_teamId_fkey";

ALTER TABLE "Runner" ALTER COLUMN "teamId" SET NOT NULL;

ALTER TABLE "Runner" ADD CONSTRAINT "Runner_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Team_transponderHolderRunnerId_key" ON "Team"("transponderHolderRunnerId");

ALTER TABLE "Team" ADD CONSTRAINT "Team_transponderHolderRunnerId_fkey" FOREIGN KEY ("transponderHolderRunnerId") REFERENCES "Runner"("id") ON DELETE SET NULL ON UPDATE CASCADE;
