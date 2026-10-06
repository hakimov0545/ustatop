import crypto from 'node:crypto';
import { getCollection } from '../../db/index.js';
import { requireUser } from '../../shared/auth.js';
import { httpError } from '../../shared/errors.js';

const digest = value => crypto.createHash('sha256').update(value).digest('hex');

export async function status(user) {
  requireUser({ user }, 'customer');
  return {
    linked: Boolean(user.telegram_chat_id),
    bot_username: process.env.TELEGRAM_BOT_USERNAME || '',
    notifications_enabled: user.telegram_notifications_enabled !== false,
  };
}

export async function updatePreferences(user, data) {
  requireUser({ user }, 'customer');
  const enabled = Boolean(data.enabled);
  await (await getCollection('users')).updateOne({ id: user.id, role: 'customer' }, {
    $set: { telegram_notifications_enabled: enabled },
  });
  return { notifications_enabled: enabled };
}

export async function createLink(user) {
  requireUser({ user }, 'customer');
  const botUsername = String(process.env.TELEGRAM_BOT_USERNAME || '').replace(/^@/, '');
  if (!botUsername || !process.env.TELEGRAM_BOT_TOKEN) httpError(503, 'Telegram bot hali sozlanmagan.');
  const token = crypto.randomBytes(24).toString('base64url');
  const links = await getCollection('telegram_links');
  await links.deleteMany({ user_id: user.id });
  await links.insertOne({ token_hash: digest(token), user_id: user.id, expires_at: new Date(Date.now() + 15 * 60 * 1000) });
  return { url: `https://t.me/${botUsername}?start=${token}`, expires_in_seconds: 900 };
}

export async function handleUpdate(update) {
  const message = update?.message;
  const match = /^\/start\s+([A-Za-z0-9_-]{20,})$/.exec(message?.text || '');
  if (!match || !message?.chat?.id || message.chat.type !== 'private') return;
  const links = await getCollection('telegram_links');
  const link = await links.findOneAndDelete({ token_hash: digest(match[1]), expires_at: { $gt: new Date() } });
  if (!link) return;
  await (await getCollection('users')).updateOne({ id: link.user_id, role: 'customer' }, {
    $set: { telegram_chat_id: String(message.chat.id), telegram_linked_at: new Date(), telegram_notifications_enabled: true },
  });
  await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: message.chat.id, text: 'UstaTop akkauntingiz Telegramga muvaffaqiyatli ulandi. Yangi buyurtmalar haqida shu yerda xabar olasiz.' }),
    signal: AbortSignal.timeout(5000),
  });
}
