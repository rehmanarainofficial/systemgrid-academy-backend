"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
console.log('Paste these into /var/www/systemgrid-academy-backend/.env then restart academy-backend:\n');
console.log(`JWT_ACCESS_SECRET=${(0, crypto_1.randomBytes)(48).toString('hex')}`);
console.log(`JWT_REFRESH_SECRET=${(0, crypto_1.randomBytes)(48).toString('hex')}`);
console.log(`JWT_RESET_SECRET=${(0, crypto_1.randomBytes)(48).toString('hex')}`);
//# sourceMappingURL=generate-jwt-secrets.js.map