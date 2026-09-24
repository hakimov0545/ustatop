import * as repository from './messages.repository.js';
import * as orders from '../orders/orders.repository.js';
import { id } from '../../shared/validation.js';
import { validateBlobFile } from '../../shared/blob.js';
import { httpError } from '../../shared/errors.js';

async function authorized(user, rawId) {
  const order = await orders.getForParticipant(id(rawId, 'Buyurtma'), user);
  if (!order) httpError(404, 'Buyurtma topilmadi.');
  return order;
}
export async function list(user, rawId) { const order = await authorized(user, rawId); return repository.list(order.id); }
export async function create(user, rawId, body, inputFile) {
  const order = await authorized(user, rawId), message = String(body || '').trim();
  if (order.status === 'cancelled' || order.status === 'completed') httpError(400, 'Yakunlangan yoki bekor qilingan buyurtmaga xabar yuborib bo‘lmaydi.');
  const file = inputFile ? validateBlobFile(user, inputFile, 'order') : null;
  if (!message && !file) httpError(400, 'Xabar yoki rasm/video yuboring.');
  if (message.length > 2000) httpError(400, 'Xabar 2000 belgidan oshmasligi kerak.');
  const messageId = await repository.create(order.id, user.id, message, file);
  return { id: messageId };
}
