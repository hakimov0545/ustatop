import * as repository from './orders.repository.js';
import { getCollection } from '../../db/index.js';
import { requireUser } from '../../shared/auth.js';
import { coordinates, district, id } from '../../shared/validation.js';
import { httpError } from '../../shared/errors.js';
import { distanceKm, etaMinutes } from '../../shared/geo.js';

const transitions = { pending: ['accepted', 'cancelled'], accepted: ['en_route', 'cancelled'], en_route: ['arrived'], arrived: ['in_progress'], in_progress: ['completed'], completed: [], cancelled: [] };
const labels = { pending: 'Buyurtma qabul qilindi', accepted: 'Usta buyurtmani qabul qildi', en_route: 'Usta yo‘lda', arrived: 'Usta yetib keldi', in_progress: 'Ish boshlandi', completed: 'Ish yakunlandi', cancelled: 'Buyurtma bekor qilindi' };
export const list = user => repository.listForUser(user);
export async function detail(user, rawId) {
  const order = await repository.getForParticipant(id(rawId, 'Buyurtma'), user);
  if (!order) httpError(404, 'Buyurtma topilmadi.');
  return { ...await repository.get(order.id), timeline: await repository.events(order.id) };
}
export async function incoming(user) {
  requireUser({ user }, 'master');
  return (await repository.incomingForMaster(user)).map(order => {
    const distance = user.latitude != null && order.customer_latitude != null ? Number(distanceKm(user.latitude, user.longitude, order.customer_latitude, order.customer_longitude).toFixed(1)) : null;
    const { customer_latitude, customer_longitude, ...safe } = order;
    return { ...safe, distance_km: distance, eta_minutes: distance === null ? null : etaMinutes(distance) };
  });
}
export async function create(user, data) {
  requireUser({ user }, 'customer');
  const categoryId = id(data.category_id, 'Xizmat turi'), categories = await getCollection('categories');
  if (!(await categories.findOne({ id: categoryId }))) httpError(400, 'Xizmat turini tanlang.');
  const description = String(data.description || '').trim(), address = String(data.address || '').trim();
  if (description.length < 8 || description.length > 3000 || address.length < 3 || address.length > 300) httpError(400, 'Muammo matni yoki manzilni tekshiring.');
  const area = district(data.district), masterId = data.master_id ? id(data.master_id, 'Usta') : null;
  const scheduledAt = data.scheduled_at ? new Date(data.scheduled_at) : null;
  if (!scheduledAt || !Number.isFinite(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now() - 60000) httpError(400, 'Usta keladigan sana va vaqtni kelajakdan tanlang.');
  if (masterId && !(await (await getCollection('users')).findOne({ id: masterId, role: 'master', available: true, category_id: categoryId, district: area }))) httpError(400, 'Tanlangan usta bu xizmat yoki hudud uchun mavjud emas.');
  const point = coordinates(data.latitude, data.longitude);
  const order = await repository.create({ categoryId, description, address, district: area, masterId, preferredTime: String(data.preferred_time || '').slice(0, 80), scheduledAt: scheduledAt.toISOString(), latitude: point.latitude, longitude: point.longitude }, user);
  return order;
}
export async function changeStatus(user, rawId, nextStatus) {
  const orderId = id(rawId, 'Buyurtma'), status = String(nextStatus || '');
  const order = user.role === 'master' && status === 'accepted' ? await repository.raw(orderId) : await repository.getForParticipant(orderId, user);
  if (!order) httpError(404, 'Buyurtma topilmadi.');
  if (!transitions[order.status]?.includes(status)) httpError(400, 'Bu buyurtma holatidan tanlangan holatga o‘tib bo‘lmaydi.');
  let assignedMaster = order.master_id;
  if (user.role === 'customer') { requireUser({ user }, 'customer'); if (status !== 'cancelled') httpError(403, 'Bu holatni faqat usta o‘zgartiradi.'); }
  else if (status === 'accepted') {
    requireUser({ user }, 'master');
    if (order.master_id && order.master_id !== user.id) httpError(403, 'Buyurtma boshqa ustaga biriktirilgan.');
    if (order.status !== 'pending' || !(await (await getCollection('users')).findOne({ id: user.id, role: 'master', available: true, category_id: order.category_id, district: order.district }))) httpError(403, 'Bu buyurtmani qabul qila olmaysiz.');
    assignedMaster = user.id;
  } else { requireUser({ user }, 'master'); if (order.master_id !== user.id) httpError(403, 'Faqat buyurtmaga biriktirilgan usta holatni o‘zgartiradi.'); }
  const saved = await repository.updateStatus(orderId, status, user.id, assignedMaster, labels[status], order.status);
  if (!saved) httpError(409, 'Buyurtma holati boshqa foydalanuvchi tomonidan yangilandi. Sahifani yangilang.');
  return saved;
}
