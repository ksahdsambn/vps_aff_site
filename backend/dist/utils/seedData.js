"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const DEFAULT_ADMIN = {
    username: 'admin',
    password: 'admin123',
};
const DEFAULT_CONFIGS = [
    { configKey: 'announcement_zh', configValue: '', description: 'Chinese announcement content' },
    { configKey: 'announcement_en', configValue: '', description: 'English announcement content' },
    { configKey: 'link_telegram', configValue: '', description: 'Telegram link' },
    { configKey: 'link_youtube', configValue: '', description: 'YouTube link' },
    { configKey: 'link_blog', configValue: '', description: 'Blog review link' },
    { configKey: 'link_x', configValue: '', description: 'X link' },
    { configKey: 'site_title_zh', configValue: 'VPS导航', description: 'Chinese site title' },
    { configKey: 'site_title_en', configValue: 'VPS Navigator', description: 'English site title' },
    { configKey: 'site_logo', configValue: '', description: 'Site logo URL' },
];
const CORE_SAMPLE_PRODUCTS = [
    {
        provider: 'DigitalOcean',
        name: 'Basic Droplet',
        cpu: 1,
        memory: 1,
        disk: 25,
        monthlyTraffic: 1000,
        bandwidth: 1000,
        location: 'New York',
        price: 5.0,
        currency: 'USD',
        reviewUrl: 'https://example.com/review/do-basic',
        remark: 'Good entry-level starter option',
        affiliateUrl: 'https://example.com/aff/do-basic',
    },
    {
        provider: 'Vultr',
        name: 'Cloud Compute',
        cpu: 2,
        memory: 4,
        disk: 80,
        monthlyTraffic: 3000,
        bandwidth: 1000,
        location: 'Tokyo',
        price: 24.0,
        currency: 'USD',
        reviewUrl: 'https://example.com/review/vultr-compute',
        remark: 'Balanced performance for general workloads',
        affiliateUrl: 'https://example.com/aff/vultr-compute',
    },
    {
        provider: 'Linode',
        name: 'Shared CPU',
        cpu: 4,
        memory: 8,
        disk: 160,
        monthlyTraffic: 5000,
        bandwidth: 4000,
        location: 'Frankfurt',
        price: 48.0,
        currency: 'USD',
        reviewUrl: 'https://example.com/review/linode-shared',
        remark: 'Strong value for mid-range projects',
        affiliateUrl: 'https://example.com/aff/linode-shared',
    },
];
const PAGINATION_SAMPLE_PRODUCTS = Array.from({ length: 48 }, (_, index) => {
    const suffix = String(index + 1).padStart(2, '0');
    return {
        provider: `Provider ${suffix}`,
        name: `Pagination Plan ${suffix}`,
        cpu: (index % 8) + 1,
        memory: 2 + (index % 6) * 2,
        disk: 40 + index * 5,
        monthlyTraffic: 1500 + index * 120,
        bandwidth: 500 + (index % 5) * 250,
        location: `Region ${suffix}`,
        price: 60 + index,
        currency: 'USD',
        reviewUrl: `https://example.com/review/pagination-plan-${suffix}`,
        remark: `Pagination seed product ${suffix}`,
        affiliateUrl: `https://example.com/aff/pagination-plan-${suffix}`,
    };
});
const SAMPLE_PRODUCTS = [...CORE_SAMPLE_PRODUCTS, ...PAGINATION_SAMPLE_PRODUCTS];
async function seedDatabase(prisma) {
    const passwordHash = await bcryptjs_1.default.hash(DEFAULT_ADMIN.password, 10);
    await prisma.admin.upsert({
        where: { username: DEFAULT_ADMIN.username },
        update: {},
        create: {
            username: DEFAULT_ADMIN.username,
            passwordHash,
        },
    });
    for (const config of DEFAULT_CONFIGS) {
        await prisma.systemConfig.upsert({
            where: { configKey: config.configKey },
            update: {},
            create: config,
        });
    }
    const productCount = await prisma.product.count();
    if (productCount === 0) {
        await prisma.product.createMany({
            data: SAMPLE_PRODUCTS,
        });
    }
}
//# sourceMappingURL=seedData.js.map