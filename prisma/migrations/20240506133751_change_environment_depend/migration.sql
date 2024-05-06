-- DropForeignKey
ALTER TABLE `AmplifyConfiguration` DROP FOREIGN KEY `AmplifyConfiguration_environmentId_fkey`;

-- DropForeignKey
ALTER TABLE `ECSConfiguration` DROP FOREIGN KEY `ECSConfiguration_environmentId_fkey`;

-- AddForeignKey
ALTER TABLE `AmplifyConfiguration` ADD CONSTRAINT `AmplifyConfiguration_environmentId_fkey` FOREIGN KEY (`environmentId`) REFERENCES `Environment`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ECSConfiguration` ADD CONSTRAINT `ECSConfiguration_environmentId_fkey` FOREIGN KEY (`environmentId`) REFERENCES `Environment`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;
