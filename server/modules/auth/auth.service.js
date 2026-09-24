import { createUser, findByPhone, migratePassword } from './auth.repository.js';
import { hashPassword, verifyPassword, createSession, publicUser } from '../../shared/auth.js';
import { cleanPhone, district, coordinates, id } from '../../shared/validation.js';
import { getCollection } from '../../db/index.js';
import { httpError } from '../../shared/errors.js';

export async function register(data, response) {
  const role = data.role;
  if (!['customer', 'master'].includes(role)) httpError(400, 'Akkaunt turini tanlang.');
  const name = String(data.name || '').trim(), phone = cleanPhone(data.phone), password = String(data.password || '');
  if (name.length < 2 || phone.length < 9 || password.length < 8) httpError(400, 'Ism, telefon va kamida 8 belgili parolni to‘ldiring.');
  const area = district(data.district);
  let categoryId = null, priceMin = null, priceMax = null, experienceYears = 0, services = [];
  if (role === 'master') {
    categoryId = id(data.category_id, 'Xizmat turi');
    if (!(await (await getCollection('categories')).findOne({ id: categoryId }))) httpError(400, 'Xizmat turi topilmadi.');
    priceMin = Number(data.price_min); priceMax = Number(data.price_max); experienceYears = Number(data.experience_years || 0);
    if (!Number.isSafeInteger(priceMin) || !Number.isSafeInteger(priceMax) || priceMin < 0 || priceMax < priceMin || !Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 70) httpError(400, 'Narx yoki tajriba qiymatini tekshiring.');
    const serviceList = Array.isArray(data.services) ? data.services : String(data.services || '').split(',');
    services = serviceList.map(item => String(item).trim()).filter(Boolean).slice(0, 12);
  }
  const point = coordinates(data.latitude, data.longitude);
  try {
    const user = await createUser({ role, name, phone, password_hash: hashPassword(password), district: area, bio: String(data.bio || '').trim().slice(0, 1000), category_id: categoryId, price_min: priceMin, price_max: priceMax, latitude: point.latitude, longitude: point.longitude, experience_years: experienceYears, services, contact_phone: '', social_links: {} });
    await createSession(response, user);
    return publicUser(user);
  } catch (error) { if (error.code === 11000) httpError(409, 'Bu telefon raqam bilan akkaunt mavjud.'); throw error; }
}

export async function login(data, response) {
  const phone = cleanPhone(data.phone), user = await findByPhone(phone), password = String(data.password || '');
  if (!user || !verifyPassword(password, user.password_hash)) httpError(401, 'Telefon yoki parol noto‘g‘ri.');
  if (user.password_hash.split('$')[1]?.length === 64) { user.password_hash = hashPassword(password); await migratePassword(user.id, user.password_hash); }
  await createSession(response, user);
  return publicUser(user);
}
