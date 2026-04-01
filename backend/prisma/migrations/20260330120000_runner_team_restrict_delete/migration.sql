-- Évite CASCADE équipe → coureurs (conflit avec respRunnerId / transponderHolderRunnerId).
ALTER TABLE "Runner" DROP CONSTRAINT "Runner_teamId_fkey";

ALTER TABLE "Runner" ADD CONSTRAINT "Runner_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
