-- AlterTable
ALTER TABLE `Tenant` ADD COLUMN `whatsappAccessEnabled` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `WhatsAppMessageLog` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `direction` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WhatsAppMessageLog_tenantId_idx`(`tenantId`),
    INDEX `WhatsAppMessageLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WhatsAppMessageLog` ADD CONSTRAINT `WhatsAppMessageLog_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
