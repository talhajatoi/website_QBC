import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { Admin } from '../src/models/admin.model.js';

try {
  if (!env.ADMIN_NAME || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) throw new Error('ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set');
  await connectDatabase(env.MONGODB_URI);
  const existing = await Admin.findOne({ email: env.ADMIN_EMAIL.toLowerCase() });
  if (existing) console.log('An administrator with this email already exists; no changes made.');
  else { await Admin.create({ name: env.ADMIN_NAME, email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD }); console.log('Initial administrator created.'); }
  await disconnectDatabase();
} catch (error) { console.error(`Admin seed failed: ${error.message}`); await disconnectDatabase().catch(() => {}); process.exit(1); }
