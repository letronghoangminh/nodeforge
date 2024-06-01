/*
  Warnings:

  - Added the required column `command` to the `ECSConfiguration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taskExecutionRoleArn` to the `ECSConfiguration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taskRoleArn` to the `ECSConfiguration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ECSConfiguration` ADD COLUMN `command` VARCHAR(191) NOT NULL,
    ADD COLUMN `taskExecutionRoleArn` VARCHAR(191) NOT NULL,
    ADD COLUMN `taskRoleArn` VARCHAR(191) NOT NULL;
