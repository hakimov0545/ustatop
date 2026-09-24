import crypto from 'node:crypto';
import { getCollection } from '../../db/index.js';

async function decorate(order) {
  if (!order) return null;
  const [categories, users, messages, reviews] = await Promise.all(['categories', 'users', 'messages', 'reviews'].map(getCollection));
  const [category, customer, master, message_count, review] = await Promise.all([
    categories.findOne({ id: order.category_id }), users.findOne({ id: order.customer_id }), order.master_id ? users.findOne({ id: order.master_id }) : null,
    messages.countDocuments({ order_id: order.id }), reviews.findOne({ order_id: order.id }),
  ]);
  const { _id, ...safe } = order;
  return { ...safe, category_name: category?.name || '', category_icon: category?.icon || '', customer_name: customer?.name || '', master_name: master?.name || null, message_count, has_review: Boolean(review) };
}
export async function listForUser(user) {
  const field = user.role === 'customer' ? 'customer_id' : 'master_id';
  const rows = await (await getCollection('orders')).find({ [field]: user.id }).sort({ updated_at: -1, created_at: -1 }).toArray();
  return Promise.all(rows.map(decorate));
}
export async function get(orderId) { return decorate(await (await getCollection('orders')).findOne({ id: orderId })); }
export async function raw(orderId) { return (await getCollection('orders')).findOne({ id: orderId }); }
export async function events(orderId) {
  const rows = await (await getCollection('order_events')).find({ order_id: orderId }).sort({ created_at: 1 }).toArray();
  const users = await getCollection('users'), actorIds = [...new Set(rows.map(row => row.actor_id).filter(Boolean))];
  const actors = await users.find({ id: { $in: actorIds } }).project({ id: 1, name: 1 }).toArray(), names = new Map(actors.map(actor => [actor.id, actor.name]));
  return rows.map(({ _id, ...row }) => ({ ...row, actor_name: names.get(row.actor_id) || null }));
}
export async function getForParticipant(orderId, user) {
  const order = await raw(orderId);
  return order && [order.customer_id, order.master_id].includes(user.id) ? order : null;
}
export async function incomingForMaster(master) {
  const [orders, users, categories] = await Promise.all([
    (await getCollection('orders')).find({ status: 'pending', master_id: null, category_id: master.category_id, district: master.district }).sort({ scheduled_at: 1, created_at: 1 }).toArray(),
    getCollection('users'), getCollection('categories'),
  ]);
  const customerIds = [...new Set(orders.map(order => order.customer_id))];
  const [customers, category] = await Promise.all([users.find({ id: { $in: customerIds } }).toArray(), categories.findOne({ id: master.category_id })]);
  const names = new Map(customers.map(customer => [customer.id, customer.name]));
  return orders.map(({ _id, ...order }) => ({ ...order, customer_name: names.get(order.customer_id) || '', category_name: category?.name || '', category_icon: category?.icon || '' }));
}
export async function create(data, customer) {
  const now = new Date(), order = { id: crypto.randomUUID(), customer_id: customer.id, master_id: data.masterId, category_id: data.categoryId, description: data.description, address: data.address, district: data.district, preferred_time: data.preferredTime, scheduled_at: data.scheduledAt, customer_latitude: data.latitude, customer_longitude: data.longitude, status: 'pending', created_at: now, updated_at: now };
  await (await getCollection('orders')).insertOne(order);
  await (await getCollection('order_events')).insertOne({ id: crypto.randomUUID(), order_id: order.id, actor_id: customer.id, status: 'pending', note: 'Buyurtma yaratildi', created_at: now });
  return decorate(order);
}
export async function updateStatus(orderId, status, actorId, masterId, note, expectedStatus) {
  const now = new Date();
  const result = await (await getCollection('orders')).updateOne({ id: orderId, status: expectedStatus }, { $set: { status, master_id: masterId, updated_at: now } });
  if (result.modifiedCount !== 1) return null;
  await (await getCollection('order_events')).insertOne({ id: crypto.randomUUID(), order_id: orderId, actor_id: actorId, status, note: note || '', created_at: now });
  return get(orderId);
}
