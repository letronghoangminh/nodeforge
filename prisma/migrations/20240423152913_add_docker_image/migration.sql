/*
  Warnings:

  - You are about to drop the column `dockerRepository` on the `ECSConfiguration` table. All the data in the column will be lost.
  - Added the required column `dockerImage` to the `ECSConfiguration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ECSConfiguration` DROP COLUMN `dockerRepository`,
    ADD COLUMN `dockerImage` VARCHAR(191) NOT NULL;
