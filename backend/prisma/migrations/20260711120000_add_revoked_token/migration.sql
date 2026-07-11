-- CreateTable
-- JWT 服务端吊销表：记录被主动吊销的 token（logout / 强制下线）。
-- jti 为 JWT 唯一标识，与 auth 中间件配合实现"服务端会话失效"。
-- expiresAt 为 token 原始过期时间，过期记录可由清理任务删除。
CREATE TABLE `RevokedToken` (
    `jti` VARCHAR(64) NOT NULL,
    `adminId` INTEGER NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`jti`),
    INDEX `RevokedToken_adminId_idx`(`adminId`),
    INDEX `RevokedToken_expiresAt_idx`(`expiresAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
