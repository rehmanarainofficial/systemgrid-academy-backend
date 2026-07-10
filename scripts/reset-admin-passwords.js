"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = require("dotenv");
const bcrypt = __importStar(require("bcryptjs"));
const typeorm_1 = require("typeorm");
const entities_1 = require("../src/database/entities");
(0, dotenv_1.config)();
const dataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USERNAME ?? process.env.DATABASE_USER ?? 'postgres',
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME ?? 'systemgrid_academy',
    entities: entities_1.academyEntities,
    synchronize: false,
});
const targets = [
    { email: 'superadmin@systemgrid.academy', env: 'SUPERADMIN_PASSWORD' },
    { email: 'admin@systemgrid.academy', env: 'ADMIN_PASSWORD' },
    { email: process.env.SEED_ADMIN_EMAIL ?? 'admin@systemgrid.academy', env: 'SEED_ADMIN_PASSWORD' },
    { email: 'staff@systemgrid.academy', env: 'STAFF_PASSWORD' },
];
async function main() {
    const uniqueTargets = new Map();
    for (const target of targets) {
        const password = process.env[target.env]?.trim();
        if (!password)
            continue;
        uniqueTargets.set(target.email.toLowerCase(), password);
    }
    if (!uniqueTargets.size) {
        throw new Error('Set at least one password env var: SUPERADMIN_PASSWORD, ADMIN_PASSWORD, SEED_ADMIN_PASSWORD, STAFF_PASSWORD');
    }
    await dataSource.initialize();
    const users = dataSource.getRepository(entities_1.User);
    for (const [email, password] of uniqueTargets) {
        const user = await users.findOne({ where: { email } });
        if (!user) {
            console.warn(`Skipped missing user: ${email}`);
            continue;
        }
        user.password = await bcrypt.hash(password, 12);
        await users.save(user);
        console.log(`Updated password for ${email}`);
    }
    await dataSource.destroy();
}
main().catch(async (error) => {
    console.error(error);
    await dataSource.destroy().catch(() => undefined);
    process.exit(1);
});
//# sourceMappingURL=reset-admin-passwords.js.map