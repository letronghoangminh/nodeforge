/*
  Warnings:

  - You are about to drop the `PaymentHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `PaymentHistory` DROP FOREIGN KEY `PaymentHistory_subscriptionId_fkey`;

-- DropTable
DROP TABLE `PaymentHistory`;
