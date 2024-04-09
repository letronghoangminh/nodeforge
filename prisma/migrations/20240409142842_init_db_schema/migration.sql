-- CreateTable
CREATE TABLE `Subscription` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('FREE', 'PRO') NOT NULL DEFAULT 'FREE',
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `Subscription_userId_key`(`userId`),
    INDEX `Subscription_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentInformation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subscriptionId` INTEGER NOT NULL,

    UNIQUE INDEX `PaymentInformation_subscriptionId_key`(`subscriptionId`),
    INDEX `PaymentInformation_subscriptionId_idx`(`subscriptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentInformationId` INTEGER NOT NULL,

    INDEX `PaymentHistory_paymentInformationId_idx`(`paymentInformationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GithubProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `insllationId` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `GithubProfile_userId_key`(`userId`),
    INDEX `GithubProfile_insllationId_idx`(`insllationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Repository` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `branch` VARCHAR(191) NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `githubProfileId` INTEGER NOT NULL,

    INDEX `Repository_githubProfileId_idx`(`githubProfileId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Deployment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('BACKEND', 'FRONTEND') NOT NULL,
    `framework` VARCHAR(191) NOT NULL,
    `status` ENUM('SUCCESS', 'FAILURE', 'PENDING') NOT NULL DEFAULT 'PENDING',
    `repositoryId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `Deployment_repositoryId_key`(`repositoryId`),
    INDEX `Deployment_repositoryId_idx`(`repositoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Environment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `envVars` JSON NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AmplifyConfiguration` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `appId` VARCHAR(191) NOT NULL,
    `webhookUrl` VARCHAR(191) NULL,
    `domain` VARCHAR(191) NOT NULL,
    `deploymentId` INTEGER NOT NULL,
    `environmentId` INTEGER NOT NULL,

    UNIQUE INDEX `AmplifyConfiguration_appId_key`(`appId`),
    UNIQUE INDEX `AmplifyConfiguration_deploymentId_key`(`deploymentId`),
    UNIQUE INDEX `AmplifyConfiguration_environmentId_key`(`environmentId`),
    INDEX `AmplifyConfiguration_deploymentId_domain_environmentId_idx`(`deploymentId`, `domain`, `environmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ECSConfiguration` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `serviceName` VARCHAR(191) NOT NULL,
    `cpu` VARCHAR(191) NOT NULL,
    `memory` VARCHAR(191) NOT NULL,
    `manifest` JSON NOT NULL,
    `dockerRepository` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `deploymentId` INTEGER NOT NULL,
    `environmentId` INTEGER NOT NULL,

    UNIQUE INDEX `ECSConfiguration_deploymentId_key`(`deploymentId`),
    UNIQUE INDEX `ECSConfiguration_environmentId_key`(`environmentId`),
    INDEX `ECSConfiguration_deploymentId_domain_environmentId_idx`(`deploymentId`, `domain`, `environmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `PaymentInformation` ADD CONSTRAINT `PaymentInformation_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `PaymentHistory` ADD CONSTRAINT `PaymentHistory_paymentInformationId_fkey` FOREIGN KEY (`paymentInformationId`) REFERENCES `PaymentInformation`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `GithubProfile` ADD CONSTRAINT `GithubProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Repository` ADD CONSTRAINT `Repository_githubProfileId_fkey` FOREIGN KEY (`githubProfileId`) REFERENCES `GithubProfile`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Deployment` ADD CONSTRAINT `Deployment_repositoryId_fkey` FOREIGN KEY (`repositoryId`) REFERENCES `Repository`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `Deployment` ADD CONSTRAINT `Deployment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `AmplifyConfiguration` ADD CONSTRAINT `AmplifyConfiguration_deploymentId_fkey` FOREIGN KEY (`deploymentId`) REFERENCES `Deployment`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `AmplifyConfiguration` ADD CONSTRAINT `AmplifyConfiguration_environmentId_fkey` FOREIGN KEY (`environmentId`) REFERENCES `Environment`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ECSConfiguration` ADD CONSTRAINT `ECSConfiguration_deploymentId_fkey` FOREIGN KEY (`deploymentId`) REFERENCES `Deployment`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `ECSConfiguration` ADD CONSTRAINT `ECSConfiguration_environmentId_fkey` FOREIGN KEY (`environmentId`) REFERENCES `Environment`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
