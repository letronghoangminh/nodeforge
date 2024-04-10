/*
  Warnings:

  - You are about to drop the column `paymentInformationId` on the `PaymentHistory` table. All the data in the column will be lost.
  - You are about to drop the `PaymentInformation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `subscriptionId` to the `PaymentHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subscriptionStatus` to the `PaymentHistory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `PaymentHistory` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `PaymentHistory` DROP FOREIGN KEY `PaymentHistory_paymentInformationId_fkey`;

-- DropForeignKey
ALTER TABLE `PaymentInformation` DROP FOREIGN KEY `PaymentInformation_subscriptionId_fkey`;

-- AlterTable
ALTER TABLE `AmplifyConfiguration` ADD COLUMN `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `Deployment` ADD COLUMN `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `ECSConfiguration` ADD COLUMN `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `Environment` ADD COLUMN `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `GithubProfile` ADD COLUMN `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `PaymentHistory` DROP COLUMN `paymentInformationId`,
    ADD COLUMN `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `subscriptionId` INTEGER NOT NULL,
    ADD COLUMN `subscriptionStatus` VARCHAR(191) NOT NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `Repository` ADD COLUMN `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- AlterTable
ALTER TABLE `Subscription` ADD COLUMN `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    ADD COLUMN `stripeCheckoutSessionId` VARCHAR(191) NULL,
    ADD COLUMN `updatedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0);

-- DropTable
DROP TABLE `PaymentInformation`;

-- CreateIndex
CREATE INDEX `PaymentHistory_subscriptionId_idx` ON `PaymentHistory`(`subscriptionId`);

-- CreateIndex
CREATE INDEX `Subscription_userId_stripeCheckoutSessionId_idx` ON `Subscription`(`userId`, `stripeCheckoutSessionId`);

-- AddForeignKey
ALTER TABLE `PaymentHistory` ADD CONSTRAINT `PaymentHistory_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION;
