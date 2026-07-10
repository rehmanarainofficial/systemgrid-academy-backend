"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = require("dotenv");
const typeorm_1 = require("typeorm");
const entities_1 = require("../src/database/entities");
const admin_dashboard_service_1 = require("../src/modules/admin-dashboard/admin-dashboard.service");
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
    const service = new admin_dashboard_service_1.AdminDashboardService(ds.getRepository(entities_1.StudentProfile), ds.getRepository(entities_1.Lead), ds.getRepository(entities_1.Course), ds.getRepository(entities_1.Batch), ds.getRepository(entities_1.Payment), ds.getRepository(entities_1.FeePlan), ds.getRepository(entities_1.Attendance), ds.getRepository(entities_1.Certificate), ds.getRepository(entities_1.Enrollment));
    try {
        const stats = await service.getStats();
        console.log('OK', JSON.stringify(stats.overview));
    }
    catch (error) {
        console.error('FAIL', error);
    }
    await ds.destroy();
}
void main();
//# sourceMappingURL=debug-dashboard-service.js.map