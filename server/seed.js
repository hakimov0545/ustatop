import crypto from 'node:crypto';
import { getCollection, closeDatabase, getDb } from './db/index.js';

if (process.env.NODE_ENV === 'production') {
  console.error('Seed production bazada ishlamaydi.');
  process.exit(1);
}
const password = 'UstaTop123!';
const hashPassword = value => { const salt = crypto.randomBytes(16); return `${salt.toString('hex')}$${crypto.scryptSync(value, salt, 64).toString('hex')}`; };
async function ensureUser({ role, name, phone, district, bio = '', category = null, min = null, max = null, lat = null, lng = null, experience = 0, services = [] }) {
  const categories = await getCollection('categories'), users = await getCollection('users');
  const categoryId = category ? (await categories.findOne({ name: category })).id : null;
  await users.updateOne({ phone }, { $setOnInsert: { id: crypto.randomUUID(), role, name, phone, password_hash: hashPassword(password), district, bio, category_id: categoryId, price_min: min, price_max: max, latitude: lat, longitude: lng, experience_years: experience, services, available: true, contact_phone: role === 'master' ? phone : '', social_links: {}, created_at: new Date() } }, { upsert: true });
  return users.findOne({ phone });
}

try {
  await getDb();
  const customer1 = await ensureUser({ role: 'customer', name: 'Demo mijoz Aziza', phone: '+998901000001', district: 'Chilonzor', lat: 41.2668, lng: 69.2112 });
  const customer2 = await ensureUser({ role: 'customer', name: 'Demo mijoz Bekzod', phone: '+998901000002', district: 'Chilonzor', lat: 41.2691, lng: 69.2151 });
  const plumber = await ensureUser({ role: 'master', name: 'Demo usta Aziz', phone: '+998901000003', district: 'Chilonzor', category: 'Santexnik', min: 80000, max: 250000, lat: 41.264, lng: 69.2035, experience: 8, bio: 'Santexnika ishlari, 8 yillik tajriba. Demo profil.', services: ['Kran va aralashtirgich', 'Quvur ta’miri', 'Rakovina va unitaz'] });
  const electrician = await ensureUser({ role: 'master', name: 'Demo usta Sardor', phone: '+998901000004', district: 'Chilonzor', category: 'Elektrik', min: 100000, max: 350000, lat: 41.269, lng: 69.208, experience: 6, bio: 'Uy elektr tarmoqlari va yoritish. Demo profil.', services: ['Rozetka va o‘chirgich', 'Yoritish', 'Elektr tarmoqlari'] });
  const additionalMasters = [
    ['Dilshod', 'Santexnik', 'Yunusobod', 41.367, 69.289, 11, 90000, 300000, ['Quvur ta’miri', 'Suv isitkich', 'Kanalizatsiya']],
    ['Murod', 'Santexnik', 'Sergeli', 41.225, 69.220, 5, 70000, 220000, ['Kran o‘rnatish', 'Rakovina', 'Suv sizishini topish']],
    ['Javlon', 'Elektrik', 'Mirzo Ulug‘bek', 41.338, 69.334, 9, 100000, 400000, ['Elektr simlari', 'Elektr щит', 'Yoritish']],
    ['Akmal', 'Elektrik', 'Olmazor', 41.352, 69.207, 4, 80000, 250000, ['Rozetka', 'Chiroq o‘rnatish', 'Nosozlikni aniqlash']],
    ['Rustam', 'Maishiy texnika', 'Mirobod', 41.289, 69.274, 12, 120000, 500000, ['Kir yuvish mashinasi', 'Muzlatgich', 'Idish yuvish mashinasi']],
    ['Sherzod', 'Maishiy texnika', 'Yashnobod', 41.293, 69.352, 7, 100000, 400000, ['Konditsioner', 'Muzlatgich', 'Mayda maishiy texnika']],
    ['Botir', 'Qulf ustasi', 'Shayxontohur', 41.323, 69.241, 10, 80000, 280000, ['Qulf ochish', 'Qulf almashtirish', 'Eshik furniturasi']],
    ['Said', 'Qulf ustasi', 'Yakkasaroy', 41.279, 69.258, 6, 90000, 300000, ['Eshik qulfini ta’mirlash', 'Kodli qulf', 'Kalit yasash']],
    ['Ulug‘bek', 'Ta’mirlash', 'Uchtepa', 41.293, 69.181, 13, 150000, 700000, ['Gipsokarton', 'Bo‘yash', 'Plitka yotqizish']],
    ['Farrux', 'Ta’mirlash', 'Bektemir', 41.209, 69.335, 8, 130000, 600000, ['Santexnika montaji', 'Plitka', 'Hammom ta’miri']],
    ['Kamol', 'Tozalash', 'Mirobod', 41.300, 69.278, 5, 80000, 250000, ['Xonadon tozalash', 'Deraza yuvish', 'Ko‘chib kirishdan oldin tozalash']],
    ['Madina', 'Tozalash', 'Yunusobod', 41.365, 69.280, 4, 70000, 220000, ['Umumiy tozalash', 'Oshxona tozalash', 'Dazmollash']],
    ['Otabek', 'Santexnik', 'Yashnobod', 41.305, 69.338, 3, 70000, 200000, ['Kran ta’miri', 'Sifon almashtirish', 'Unitaz o‘rnatish']],
    ['Temur', 'Elektrik', 'Yakkasaroy', 41.276, 69.245, 14, 120000, 450000, ['Elektr montaj', 'Avtomat almashtirish', 'Lyustra o‘rnatish']],
    ['Nodir', 'Ta’mirlash', 'Chilonzor', 41.258, 69.190, 7, 100000, 500000, ['Eshik o‘rnatish', 'Laminat yotqizish', 'Devor bo‘yash']],
  ];
  for (const [index, [name, category, district, lat, lng, experience, min, max, services]] of additionalMasters.entries()) {
    await ensureUser({ role: 'master', name: `Demo usta ${name}`, phone: `+9989010000${String(index + 10).padStart(2, '0')}`, district, category, min, max, lat, lng, experience, bio: `${category} bo‘yicha ${experience} yillik tajriba. Demo profil.`, services });
  }
  const users = await getCollection('users');
  await users.updateOne({ id: plumber.id }, { $set: { latitude: 41.264, longitude: 69.2035, experience_years: 8, services: ['Kran va aralashtirgich', 'Quvur ta’miri', 'Rakovina va unitaz'], available: true, contact_phone: plumber.phone, social_links: {} } });
  await users.updateOne({ id: electrician.id }, { $set: { latitude: 41.269, longitude: 69.208, experience_years: 6, services: ['Rozetka va o‘chirgich', 'Yoritish', 'Elektr tarmoqlari'], available: true, contact_phone: electrician.phone, social_links: {} } });
  const definitions = [
    { customer: customer1, master: null, category: 1, description: 'Ochiq demo so‘rov: oshxona kranidan suv tomyapti.', status: 'pending' },
    { customer: customer2, master: plumber, category: 1, description: 'Qabul qilingan demo buyurtma: rakovina sifonini tekshirish.', status: 'accepted' },
    { customer: customer1, master: plumber, category: 1, description: 'Yo‘ldagi demo buyurtma: hammomdagi quvur sizmoqda.', status: 'en_route' },
    { customer: customer2, master: plumber, category: 1, description: 'Yetib kelgan demo buyurtma: oshxona suvini ko‘rish.', status: 'arrived' },
    { customer: customer1, master: plumber, category: 1, description: 'Jarayondagi demo buyurtma: suv krani almashtirilmoqda.', status: 'in_progress' },
    { customer: customer2, master: plumber, category: 1, description: 'Yakunlangan demo buyurtma: kran almashtirildi.', status: 'completed' },
  ];
  const ordersCollection = await getCollection('orders'), events = await getCollection('order_events'), now = Date.now(), seededOrders = {};
  for (const [index, item] of definitions.entries()) {
    let order = await ordersCollection.findOne({ customer_id: item.customer.id, description: item.description });
    if (!order) {
      order = { id: crypto.randomUUID(), customer_id: item.customer.id, master_id: item.master?.id || null, category_id: item.category, description: item.description, address: 'Chilonzor, demo manzil', district: 'Chilonzor', preferred_time: 'Ertaga, 10:00', status: item.status, created_at: new Date(now + index), updated_at: new Date(now + index), scheduled_at: new Date(now + 86400000 + index).toISOString(), customer_latitude: item.customer.latitude, customer_longitude: item.customer.longitude };
      await ordersCollection.insertOne(order);
    }
    seededOrders[index] = order;
    if (!(await events.findOne({ order_id: order.id }))) {
      await events.insertOne({ id: crypto.randomUUID(), order_id: order.id, actor_id: item.customer.id, status: 'pending', note: 'Buyurtma yaratildi (demo)', created_at: order.created_at });
      if (item.status !== 'pending') await events.insertOne({ id: crypto.randomUUID(), order_id: order.id, actor_id: item.master?.id || null, status: item.status, note: 'Namuna status (demo)', created_at: order.updated_at });
    }
  }
  const messages = await getCollection('messages');
  if (!(await messages.findOne({ order_id: seededOrders[1].id }))) await messages.insertOne({ id: crypto.randomUUID(), order_id: seededOrders[1].id, sender_id: customer2.id, body: 'Assalomu alaykum, ertaga belgilangan vaqtda kela olasizmi?', created_at: new Date() });
  const reviews = await getCollection('reviews');
  if (!(await reviews.findOne({ order_id: seededOrders[5].id }))) await reviews.insertOne({ id: crypto.randomUUID(), order_id: seededOrders[5].id, customer_id: customer2.id, master_id: plumber.id, rating: 5, comment: 'Demo baho: xizmat yaxshi bajarildi.', created_at: new Date() });
  console.log('MongoDB demo ma’lumotlari tayyor.');
  console.log('Barcha akkauntlar paroli: UstaTop123!');
  console.log('Mijoz: +998901000001 (Aziza), +998901000002 (Bekzod)');
  console.log('Demo ustalar: jami 17 ta profil. Qo‘shimcha akkauntlar telefonlari +998901000010 dan +998901000024 gacha.');
} finally { await closeDatabase(); }
