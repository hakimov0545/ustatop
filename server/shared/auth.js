import crypto from 'node:crypto';
import { getCollection } from '../db/index.js';
import { httpError } from './errors.js';

const duration = 14 * 24 * 60 * 60 * 1000;
export function hashPassword(password, salt = crypto.randomBytes(16)) {
  return `${salt.toString('hex')}$${crypto.scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, stored) {
  try {
    const [saltHex, hashHex] = stored.split('$');
    const salt = Buffer.from(saltHex, 'hex');
    const actual = hashHex.length === 64 ? crypto.pbkdf2Sync(password, salt, 240000, 32, 'sha256') : crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(actual, Buffer.from(hashHex, 'hex'));
  } catch { return false; }
}
export function publicUser(user) {
  if (!user) return null;
  const { password_hash, _id, ...safe } = user;
  safe.services = Array.isArray(safe.services) ? safe.services : [];
  safe.social_links = safe.social_links && typeof safe.social_links === 'object' ? safe.social_links : {};
  return safe;
}
export async function createSession(response, user) {
  const token = crypto.randomBytes(32).toString('base64url');
  const sessions = await getCollection('sessions');
  await sessions.deleteMany({ expires_at: { $lte: new Date() } });
  await sessions.insertOne({ token_hash: crypto.createHash('sha256').update(token).digest('hex'), user_id: user.id, expires_at: new Date(Date.now() + duration) });
  response.cookie('ustatop_session', token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: duration, path: '/' });
}
export function sessionToken(request) {
  const entry = (request.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith('ustatop_session='));
  return entry ? decodeURIComponent(entry.slice('ustatop_session='.length)) : null;
}
export async function deleteSession(request) {
  const token = sessionToken(request);
  if (!token) return;
  const sessions = await getCollection('sessions');
  await sessions.deleteOne({ token_hash: crypto.createHash('sha256').update(token).digest('hex') });
}
export async function attachUser(request, _response, next) {
  try {
    const token = sessionToken(request);
    request.user = null;
    if (token) {
      const digest = crypto.createHash('sha256').update(token).digest('hex');
      const sessions = await getCollection('sessions');
      const session = await sessions.findOne({ token_hash: digest, expires_at: { $gt: new Date() } });
      if (session) request.user = await (await getCollection('users')).findOne({ id: session.user_id }) || null;
    }
    next();
  } catch (error) { next(error); }
}
export function requireUser(request, role) {
  if (!request.user) httpError(401, 'Davom etish uchun tizimga kiring.');
  if (role && request.user.role !== role) httpError(403, 'Bu amal uchun ruxsat yo‘q.');
  return request.user;
}
