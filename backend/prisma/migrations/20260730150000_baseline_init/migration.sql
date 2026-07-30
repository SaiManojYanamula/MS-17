-- CreateTable
CREATE TABLE `Tenant` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'TRIAL') NOT NULL DEFAULT 'ACTIVE',
    `plan` ENUM('BASIC', 'STANDARD', 'PREMIUM') NOT NULL DEFAULT 'BASIC',
    `upiId` VARCHAR(191) NULL,
    `upiPhone` VARCHAR(191) NULL,
    `coverImageUrl` VARCHAR(191) NULL,
    `notifyExpiry` BOOLEAN NOT NULL DEFAULT true,
    `notifyPayments` BOOLEAN NOT NULL DEFAULT true,
    `notifyWhatsapp` BOOLEAN NOT NULL DEFAULT false,
    `whatsappAccessEnabled` BOOLEAN NOT NULL DEFAULT false,
    `enabledFeatures` VARCHAR(191) NOT NULL DEFAULT 'EXPENSES,NOTICES,REQUESTS,SEATING,REPORTS,ATTENDANCE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Tenant_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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

-- CreateTable
CREATE TABLE `Branch` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Branch_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NULL,
    `branchId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF', 'STUDENT') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `memberId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_memberId_key`(`memberId`),
    INDEX `User_tenantId_idx`(`tenantId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserBranchAccess` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,

    INDEX `UserBranchAccess_branchId_idx`(`branchId`),
    UNIQUE INDEX `UserBranchAccess_userId_branchId_key`(`userId`, `branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Zone` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startSeat` INTEGER NOT NULL,
    `endSeat` INTEGER NOT NULL,

    INDEX `Zone_tenantId_idx`(`tenantId`),
    INDEX `Zone_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Seat` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `zoneId` VARCHAR(191) NOT NULL,
    `seatNumber` INTEGER NOT NULL,
    `status` ENUM('FREE', 'OCCUPIED', 'EXPIRING_SOON') NOT NULL DEFAULT 'FREE',
    `memberId` VARCHAR(191) NULL,

    UNIQUE INDEX `Seat_memberId_key`(`memberId`),
    INDEX `Seat_tenantId_idx`(`tenantId`),
    UNIQUE INDEX `Seat_branchId_seatNumber_key`(`branchId`, `seatNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Member` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `displayId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `goalTag` VARCHAR(191) NULL,
    `plan` ENUM('MONTHLY', 'QUARTERLY', 'DAILY_PASS') NOT NULL,
    `batch` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Active',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `aadharUrl` VARCHAR(191) NULL,

    UNIQUE INDEX `Member_displayId_key`(`displayId`),
    INDEX `Member_tenantId_idx`(`tenantId`),
    INDEX `Member_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Application` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `applicant` VARCHAR(191) NOT NULL,
    `goalTag` VARCHAR(191) NULL,
    `plan` ENUM('MONTHLY', 'QUARTERLY', 'DAILY_PASS') NOT NULL,
    `batch` VARCHAR(191) NOT NULL,
    `aadharUrl` VARCHAR(191) NULL,
    `appliedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',

    INDEX `Application_tenantId_idx`(`tenantId`),
    INDEX `Application_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `method` ENUM('UPI', 'CASH', 'CARD', 'PENDING') NOT NULL,
    `status` ENUM('PAID', 'PENDING', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    `label` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Payment_tenantId_idx`(`tenantId`),
    INDEX `Payment_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Expense` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `note` VARCHAR(191) NULL,
    `receiptUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Expense_tenantId_idx`(`tenantId`),
    INDEX `Expense_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attendance` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'HOLIDAY') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Attendance_tenantId_idx`(`tenantId`),
    INDEX `Attendance_branchId_idx`(`branchId`),
    UNIQUE INDEX `Attendance_memberId_date_key`(`memberId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notice` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notice_tenantId_idx`(`tenantId`),
    INDEX `Notice_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Request` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `branchId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `type` ENUM('RENEWAL', 'SEAT_CHANGE', 'ISSUE', 'OTHER') NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `status` ENUM('OPEN', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Request_tenantId_idx`(`tenantId`),
    INDEX `Request_branchId_idx`(`branchId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `WhatsAppMessageLog` ADD CONSTRAINT `WhatsAppMessageLog_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Branch` ADD CONSTRAINT `Branch_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBranchAccess` ADD CONSTRAINT `UserBranchAccess_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserBranchAccess` ADD CONSTRAINT `UserBranchAccess_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Zone` ADD CONSTRAINT `Zone_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seat` ADD CONSTRAINT `Seat_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `Zone`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seat` ADD CONSTRAINT `Seat_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `Tenant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Member` ADD CONSTRAINT `Member_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Application` ADD CONSTRAINT `Application_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notice` ADD CONSTRAINT `Notice_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_branchId_fkey` FOREIGN KEY (`branchId`) REFERENCES `Branch`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Request` ADD CONSTRAINT `Request_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
