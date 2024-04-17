/*
  Warnings:

  - Added the required column `productionBranch` to the `AmplifyConfiguration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `AmplifyConfiguration` ADD COLUMN `productionBranch` VARCHAR(191) NOT NULL;
