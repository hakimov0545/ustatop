import crypto from 'node:crypto';
import { closeDatabase, getCollection, initializeDatabase } from '../db/index.js';
import { hashPassword } from '../shared/auth.js';

const name = String(process.env.ADMIN_NAME || '').trim();
const phone = String(process.env.ADMIN_PHONE || '').replace(/[^\d+]/g, '');
const password = String(process.env.ADMIN_PASSWORD || '');

if (name.length < 2 || phone.replace(/\D/g, '').length < 9 || password.length < 12) {
  console.error('ADMIN_NAME, ADMIN_PHONE va kamida 12 belgili ADMIN_PASSWORD ni .env faylida belgilang.');
  process.exit(1);
}

try {
  await initializeDatabase();
  const users = await getCollection('users');
  const existing = await users.findOne({ phone });
  if (existing && existing.role !== 'admin') throw new Error('Bu telefon raqam boshqa rolga tegishli. Admin yaratish to‘xtatildi.');
  const admin = {
    id: existing?.id || crypto.randomUUID(), role: 'admin', name, phone,
    password_hash: hashPassword(password), district: '', bio: '', category_id: null,
    price_min: null, price_max: null, available: false, contact_phone: '', social_links: {},
    created_at: existing?.created_at || new Date(), updated_at: new Date(),
  };
  await users.updateOne({ phone }, { $set: admin }, { upsert: true });
  console.log('Super admin akkaunti tayyor. Kirish yo‘li: /login');
} finally {
  await closeDatabase();
}
