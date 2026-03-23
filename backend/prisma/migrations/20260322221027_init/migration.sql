-- CreateTable
CREATE TABLE `Product` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider` VARCHAR(100) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `cpu` INTEGER NOT NULL,
    `memory` DOUBLE NOT NULL,
    `disk` DOUBLE NOT NULL,
    `monthlyTraffic` DOUBLE NOT NULL,
    `bandwidth` DOUBLE NOT NULL,
    `location` VARCHAR(100) NOT NULL,
    `price` DOUBLE NOT NULL,
    `currency` CHAR(3) NOT NULL,
    `reviewUrl` VARCHAR(500) NULL,
    `remark` VARCHAR(500) NULL,
    `affiliateUrl` VARCHAR(500) NOT NULL,
    `isDeleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Product_provider_idx`(`provider`),
    INDEX `Product_price_idx`(`price`),
    INDEX `Product_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SystemConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `configKey` VARCHAR(100) NOT NULL,
    `configValue` TEXT NULL,
    `description` VARCHAR(200) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SystemConfig_configKey_key`(`configKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Admin` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastLoginAt` DATETIME(3) NULL,

    UNIQUE INDEX `Admin_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
