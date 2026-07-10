"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = require("dotenv");
const typeorm_1 = require("typeorm");
const entities_1 = require("../src/database/entities");
(0, dotenv_1.config)();
async function main() {
    const ds = new typeorm_1.DataSource({
        type: 'postgres',
        host: process.env.DATABASE_HOST ?? 'localhost',
        port: Number(process.env.DATABASE_PORT ?? 5432),
        username: process.env.DATABASE_USERNAME ?? process.env.DATABASE_USER ?? 'systemgrid',
        password: process.env.DATABASE_PASSWORD ?? 'systemgrid_dev_password',
        database: process.env.DATABASE_NAME ?? 'systemgrid_academy',
        entities: entities_1.academyEntities,
        synchronize: false,
    });
    await ds.initialize();
    const today = new Date().toISOString().slice(0, 10);
    const steps = [
        ['students.count', () => ds.getRepository(entities_1.StudentProfile).count()],
        [
            'leads.group',
            () => ds
                .getRepository(entities_1.Lead)
                .createQueryBuilder('lead')
                .select('lead.status', 'status')
                .addSelect('COUNT(*)', 'count')
                .groupBy('lead.status')
                .getRawMany(),
        ],
        ['payments', () => ds.getRepository(entities_1.Payment).find({ where: { status: 'verified' } })],
        [
            'feePlans.sum',
            () => ds
                .getRepository(entities_1.FeePlan)
                .createQueryBuilder('plan')
                .select('COALESCE(SUM(plan.pendingAmount), 0)', 'total')
                .getRawOne(),
        ],
        ['attendance', () => ds.getRepository(entities_1.Attendance).find()],
        ['certificates', () => ds.getRepository(entities_1.Certificate).count({ where: { status: 'issued' } })],
        [
            'recentStudents',
            () => ds.getRepository(entities_1.StudentProfile).find({
                relations: { user: true, enrollments: { course: true } },
                order: { createdAt: 'DESC' },
                take: 5,
            }),
        ],
        [
            'upcomingBatches',
            () => ds.getRepository(entities_1.Batch).find({
                where: {
                    startDate: (0, typeorm_1.MoreThanOrEqual)(today),
                    status: (0, typeorm_1.In)(['upcoming', 'active']),
                },
                relations: { course: true },
                order: { startDate: 'ASC' },
                take: 5,
            }),
        ],
    ];
    for (const [name, run] of steps) {
        try {
            await run();
            console.log(`OK ${name}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.log(`FAIL ${name} ${message}`);
        }
    }
    await ds.destroy();
}
void main();
//# sourceMappingURL=debug-dashboard-stats.js.map