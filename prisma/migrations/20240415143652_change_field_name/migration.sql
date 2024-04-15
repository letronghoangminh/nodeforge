/*
  Warnings:

  - You are about to drop the column `domain` on the `AmplifyConfiguration` table. All the data in the column will be lost.
  - You are about to drop the column `domain` on the `ECSConfiguration` table. All the data in the column will be lost.
  - Added the required column `subdomain` to the `AmplifyConfiguration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subdomain` to the `ECSConfiguration` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `AmplifyConfiguration_deploymentId_domain_environmentId_idx` ON `AmplifyConfiguration`;

-- DropIndex
DROP INDEX `ECSConfiguration_deploymentId_domain_environmentId_idx` ON `ECSConfiguration`;

-- AlterTable
ALTER TABLE `AmplifyConfiguration` DROP COLUMN `domain`,
    ADD COLUMN `subdomain` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `ECSConfiguration` DROP COLUMN `domain`,
    ADD COLUMN `subdomain` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `AmplifyConfiguration_deploymentId_subdomain_environmentId_idx` ON `AmplifyConfiguration`(`deploymentId`, `subdomain`, `environmentId`);

-- CreateIndex
CREATE INDEX `ECSConfiguration_deploymentId_subdomain_environmentId_idx` ON `ECSConfiguration`(`deploymentId`, `subdomain`, `environmentId`);
