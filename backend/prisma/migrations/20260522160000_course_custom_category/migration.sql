-- AlterEnum
ALTER TYPE "CourseCategory" ADD VALUE 'PERSONNALISE';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "customCategoryName" TEXT NOT NULL DEFAULT '';

-- DropIndex
DROP INDEX IF EXISTS "Course_editionId_name_category_key";

-- CreateIndex
CREATE UNIQUE INDEX "Course_editionId_name_category_customCategoryName_key" ON "Course"("editionId", "name", "category", "customCategoryName");
