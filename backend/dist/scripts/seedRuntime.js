"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const client_1 = require("../generated/prisma/client");
const seedData_1 = require("../utils/seedData");
const adapter = new adapter_mariadb_1.PrismaMariaDb({
    host: process.env.DATABASE_HOST || 'localhost',
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || 'password',
    database: process.env.DATABASE_NAME || 'vps_aff_db',
    port: parseInt(process.env.DATABASE_PORT || '3306', 10),
    connectionLimit: 5,
});
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    await (0, seedData_1.seedDatabase)(prisma);
    console.log('Runtime seed completed successfully');
}
main()
    .catch((error) => {
    console.error('Runtime seed failed:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seedRuntime.js.map