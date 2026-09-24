import { getCollection } from '../../db/index.js';
import crypto from 'node:crypto';

export async function findByPhone(phone) { return (await getCollection('users')).findOne({ phone }); }
export async function findById(id) { return (await getCollection('users')).findOne({ id }); }
export async function createUser(user) {
  const created = { id: crypto.randomUUID(), available: true, created_at: new Date(), ...user };
  await (await getCollection('users')).insertOne(created);
  return created;
}
export async function migratePassword(id, passwordHash) { await (await getCollection('users')).updateOne({ id }, { $set: { password_hash: passwordHash } }); }
