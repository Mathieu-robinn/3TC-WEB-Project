-- CreateEnum
CREATE TYPE "CourseCategory" AS ENUM ('SOLO', 'LOISIR', 'COMPETITION');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "category" "CourseCategory" NOT NULL DEFAULT 'LOISIR';

-- DropIndex
DROP INDEX IF EXISTS "Course_editionId_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "Course_editionId_name_category_key" ON "Course"("editionId", "name", "category");
