import crypto from 'node:crypto';
import { getCollection } from '../../db/index.js';

export async function list(orderId) {
  const [rows, media, users] = await Promise.all([
    (await getCollection('messages')).find({ order_id: orderId }).sort({ created_at: 1 }).toArray(),
    (await getCollection('media')).find({ order_id: orderId, message_id: { $ne: null } }).toArray(),
    getCollection('users'),
  ]);
  const userIds = [...new Set(rows.map(message => message.sender_id))];
  const senders = await users.find({ id: { $in: userIds } }).project({ id: 1, name: 1 }).toArray();
  const names = new Map(senders.map(sender => [sender.id, sender.name]));
  const byMessage = new Map();
  for (const { _id, ...item } of media) { if (!byMessage.has(item.message_id)) byMessage.set(item.message_id, []); byMessage.get(item.message_id).push(item); }
  return rows.map(({ _id, ...message }) => ({ ...message, sender_name: names.get(message.sender_id) || '', attachments: byMessage.get(message.id) || [] }));
}

export async function create(orderId, senderId, body, file) {
  const id = crypto.randomUUID(), now = new Date();
  await (await getCollection('messages')).insertOne({ id, order_id: orderId, sender_id: senderId, body: body || (file ? 'Media yuborildi' : ''), created_at: now });
  if (file) await (await getCollection('media')).insertOne({ id: crypto.randomUUID(), owner_id: senderId, order_id: orderId, message_id: id, url: file.url, pathname: file.pathname, original_name: file.original_name, mime_type: file.contentType, size_bytes: file.size_bytes, caption: '', created_at: now });
  await (await getCollection('orders')).updateOne({ id: orderId }, { $set: { updated_at: now } });
  return id;
}
