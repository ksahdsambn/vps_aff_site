import { PrismaClient } from '../generated/prisma/client';
export interface SeedOptions {
    /** 仅限显式本地演示/开发初始化；生产运行时 seed 永远不传此选项。 */
    includeSampleProducts?: boolean;
}
/** 样例产品必须由调用方显式请求，避免空生产库发布 example.com 数据。 */
export declare function shouldSeedSampleProducts(options?: SeedOptions): boolean;
export declare function seedDatabase(prisma: PrismaClient, options?: SeedOptions): Promise<void>;
//# sourceMappingURL=seedData.d.ts.map