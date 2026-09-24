import crypto from 'node:crypto';
import { getCollection } from '../../db/index.js';
export async function create({ orderId, customerId, masterId, rating, comment }) {
  const review = { id: crypto.randomUUID(), order_id: orderId, customer_id: customerId, master_id: masterId, rating, comment, created_at: new Date() };
  await (await getCollection('reviews')).insertOne(review);
  return review;
}
