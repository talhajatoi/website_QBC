import { connectDatabase, disconnectDatabase } from '../src/config/db.js';
import { env } from '../src/config/env.js';
import { Admin } from '../src/models/admin.model.js';

try {
  if (!env.ADMIN_NAME || !env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) throw new Error('ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD must be set');
  await connectDatabase(env.MONGODB_URI);
  const resetPassword = process.argv.includes('--reset-password');
  const existing = await Admin.findOne({ email: env.ADMIN_EMAIL.toLowerCase() }).select(resetPassword ? '+password' : '');
  if (resetPassword && !existing) throw new Error('No administrator with ADMIN_EMAIL exists; remove --reset-password only if you intend to create the initial administrator');
  if (resetPassword) {
    existing.password = env.ADMIN_PASSWORD;
    await existing.save();
    console.log('Administrator password reset successfully.');
  } else if (existing) {
    console.log('An administrator with this email already exists; no changes made.');
  } else {
    await Admin.create({ name: env.ADMIN_NAME, email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD });
    console.log('Initial administrator created.');
  }
  await disconnectDatabase();
} catch (error) { console.error(`Admin seed failed: ${error.message}`); await disconnectDatabase().catch(() => {}); process.exit(1); }
