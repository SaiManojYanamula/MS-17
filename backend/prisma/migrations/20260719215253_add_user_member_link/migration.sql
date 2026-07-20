-- AlterTable
ALTER TABLE `User` ADD COLUMN `memberId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_memberId_key` ON `User`(`memberId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
