/*
  Warnings:

  - The values [LOST,IN,OUT,NEW] on the enum `TransponderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `state` column on the `Notification` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `runnerId` on the `Transponder` table. All the data in the column will be lost.
  - You are about to drop the column `runnerId` on the `TransponderTransaction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Edition` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `Runner` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Team` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `type` on the `Log` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `nbTour` on table `Team` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('ADD_USER', 'DELETE_USER', 'ADD_TRANSPONDER', 'DELETE_TRANSPONDER', 'GIVE_TRANSPONDER', 'LOOSE_TRANSPONDER', 'RETURN_TRANSPONDER');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'ALERT', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "NotificationState" AS ENUM ('SEEN', 'UNSEEN');

-- AlterEnum
BEGIN;
CREATE TYPE "TransponderStatus_new" AS ENUM ('EN_ATTENTE', 'ATTRIBUE', 'PERDU', 'RECUPERE');
ALTER TABLE "public"."Transponder" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Transponder" ALTER COLUMN "status" TYPE "TransponderStatus_new" USING ("status"::text::"TransponderStatus_new");
ALTER TABLE "TransponderTransaction" ALTER COLUMN "type" TYPE "TransponderStatus_new" USING ("type"::text::"TransponderStatus_new");
ALTER TYPE "TransponderStatus" RENAME TO "TransponderStatus_old";
ALTER TYPE "TransponderStatus_new" RENAME TO "TransponderStatus";
DROP TYPE "public"."TransponderStatus_old";
ALTER TABLE "Transponder" ALTER COLUMN "status" SET DEFAULT 'EN_ATTENTE';
COMMIT;

-- DropForeignKey
ALTER TABLE "Course" DROP CONSTRAINT "Course_editionId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "Transponder" DROP CONSTRAINT "Transponder_runnerId_fkey";

-- DropForeignKey
ALTER TABLE "TransponderTransaction" DROP CONSTRAINT "TransponderTransaction_runnerId_fkey";

-- AlterTable
ALTER TABLE "Log" DROP COLUMN "type",
ADD COLUMN     "type" "LogType" NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "type" "NotificationType" NOT NULL DEFAULT 'INFO',
DROP COLUMN "state",
ADD COLUMN     "state" "NotificationState" NOT NULL DEFAULT 'UNSEEN';

-- AlterTable
ALTER TABLE "Team" ALTER COLUMN "nbTour" SET NOT NULL,
ALTER COLUMN "nbTour" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "Transponder" DROP COLUMN "runnerId",
ALTER COLUMN "status" SET DEFAULT 'EN_ATTENTE';

-- AlterTable
ALTER TABLE "TransponderTransaction" DROP COLUMN "runnerId",
ADD COLUMN     "teamId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Edition_name_key" ON "Edition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Runner_email_key" ON "Runner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "Team"("name");

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "Edition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransponderTransaction" ADD CONSTRAINT "TransponderTransaction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
