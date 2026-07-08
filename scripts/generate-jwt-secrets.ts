import { randomBytes } from 'crypto';

console.log('Paste these into /var/www/systemgrid-academy-backend/.env then restart academy-backend:\n');
console.log(`JWT_ACCESS_SECRET=${randomBytes(48).toString('hex')}`);
console.log(`JWT_REFRESH_SECRET=${randomBytes(48).toString('hex')}`);
console.log(`JWT_RESET_SECRET=${randomBytes(48).toString('hex')}`);
