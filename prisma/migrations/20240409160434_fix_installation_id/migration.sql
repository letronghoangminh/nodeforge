/*
  Warnings:

  - You are about to drop the column `insllationId` on the `GithubProfile` table. All the data in the column will be lost.
  - Added the required column `installationId` to the `GithubProfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `GithubProfile_insllationId_idx` ON `GithubProfile`;

-- AlterTable
ALTER TABLE `GithubProfile` DROP COLUMN `insllationId`,
    ADD COLUMN `installationId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `GithubProfile_installationId_idx` ON `GithubProfile`(`installationId`);
