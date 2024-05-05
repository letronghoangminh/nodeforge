/*
  Warnings:

  - Added the required column `listenerRuleArn` to the `ECSConfiguration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secgroupId` to the `ECSConfiguration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetGroupArn` to the `ECSConfiguration` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `ECSConfiguration` ADD COLUMN `listenerRuleArn` VARCHAR(191) NOT NULL,
    ADD COLUMN `secgroupId` VARCHAR(191) NOT NULL,
    ADD COLUMN `targetGroupArn` VARCHAR(191) NOT NULL;
