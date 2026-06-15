"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const db_1 = require("../utils/db");
const seedData_1 = require("../utils/seedData");
async function main() {
    await (0, seedData_1.seedDatabase)(db_1.prisma);
    console.log('Runtime seed completed successfully');
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