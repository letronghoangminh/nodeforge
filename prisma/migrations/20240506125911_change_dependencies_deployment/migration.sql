-- DropForeignKey
ALTER TABLE `AmplifyConfiguration` DROP FOREIGN KEY `AmplifyConfiguration_deploymentId_fkey`;

-- DropForeignKey
ALTER TABLE `ECSConfiguration` DROP FOREIGN KEY `ECSConfiguration_deploymentId_fkey`;

-- AddForeignKey
ALTER TABLE `AmplifyConfiguration` ADD CONSTRAINT `AmplifyConfiguration_deploymentId_fkey` FOREIGN KEY (`deploymentId`) REFERENCES `Deployment`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ECSConfiguration` ADD CONSTRAINT `ECSConfiguration_deploymentId_fkey` FOREIGN KEY (`deploymentId`) REFERENCES `Deployment`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
