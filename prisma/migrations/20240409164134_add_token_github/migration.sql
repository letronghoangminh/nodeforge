/*
  Warnings:

  - Added the required column `accessToken` to the `GithubProfile` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `GithubProfile` ADD COLUMN `accessToken` VARCHAR(191) NOT NULL;
