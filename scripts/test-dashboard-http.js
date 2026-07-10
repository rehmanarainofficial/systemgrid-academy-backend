"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = require("dotenv");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const typeorm_1 = require("typeorm");
const user_role_enum_1 = require("../src/common/enums/user-role.enum");
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
    const admin = await ds.getRepository(entities_1.User).findOne({ where: { role: user_role_enum_1.UserRole.Admin } });
    if (!admin) {
        console.log('NO_ADMIN');
        return;
    }
    const token = jsonwebtoken_1.default.sign({ sub: admin.id, email: admin.email, role: admin.role }, process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret', { expiresIn: '15m' });
    for (const port of [5002, 5003]) {
        const response = await fetch(`http://localhost:${port}/api/v1/admin/dashboard/stats`, {
            headers: { Cookie: `sg_access_token=${token}` },
        });
        const body = await response.text();
        console.log(`port ${port} -> ${response.status} ${body.slice(0, 220)}`);
    }
    await ds.destroy();
}
void main();
//# sourceMappingURL=test-dashboard-http.js.map