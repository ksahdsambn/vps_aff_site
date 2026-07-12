"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const db_1 = require("../utils/db");
const seedData_1 = require("../utils/seedData");
async function main() {
    // 容器启动只初始化管理员与站点配置；绝不自动发布演示产品。
    await (0, seedData_1.seedDatabase)(db_1.prisma);
    console.log('Runtime initialization completed successfully');
}
main()
    .catch((error) => {
    console.error('Runtime seed failed:', error);
    process.exit(1);
})
    .finally(async () => {
    await db_1.prisma.$disconnect();
});
//# sourceMappingURL=seedRuntime.js.map