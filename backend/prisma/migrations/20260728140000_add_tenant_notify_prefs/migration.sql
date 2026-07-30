-- AlterTable
ALTER TABLE `Tenant` ADD COLUMN `notifyExpiry` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyPayments` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `notifyWhatsapp` BOOLEAN NOT NULL DEFAULT false;
