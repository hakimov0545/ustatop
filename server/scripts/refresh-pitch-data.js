import { statSync } from 'node:fs';
import { closeDatabase, getCollection } from '../db/index.js';
import { pitchContactPhone, pitchCustomers, pitchMasters, portfolioCaptions } from '../pitch-data.js';

const day = 86_400_000;
const now = Date.now();
const districtPoints = {
  Bektemir: [41.209, 69.335], Chilonzor: [41.266, 69.211], Mirobod: [41.289, 69.274],
  'Mirzo Ulug‘bek': [41.338, 69.334], Olmazor: [41.352, 69.207], Sergeli: [41.225, 69.220],
  Shayxontohur: [41.323, 69.241], Uchtepa: [41.293, 69.181], Yakkasaroy: [41.279, 69.258],
  Yashnobod: [41.293, 69.352], Yunusobod: [41.367, 69.289],
};

try {
  const users = await getCollection('users');
  const customers = await getCollection('users');
  const orders = await getCollection('orders');
  const events = await getCollection('order_events');
  const reviews = await getCollection('reviews');
  const media = await getCollection('media');
  const seededMasters = [];

  for (const profile of pitchMasters) {
    const existing = await users.findOne({ phone: profile.phone, role: 'master' });
    if (!existing) throw new Error(`Master akkaunti topilmadi: ${profile.phone.slice(-4)}`);
    const { _id, password_hash, phone, created_at, ...oldProfile } = existing;
    const next = {
      ...oldProfile,
      name: profile.name,
      district: profile.district,
      category_id: profile.categoryId,
      bio: profile.bio,
      experience_years: profile.experience,
      price_min: profile.min,
      price_max: profile.max,
      services: profile.services,
      available: true,
      contact_phone: pitchContactPhone,
      social_links: {},
    };
    await users.updateOne({ id: existing.id }, { $set: next });
    seededMasters.push({ ...existing, ...next, pitch: profile });
  }

  const customerRows = await customers.find({ role: 'customer' }).sort({ phone: 1 }).toArray();
  if (customerRows.length < 2) throw new Error('Pitch sharhlari uchun kamida ikki mijoz kerak.');
  const reviewCustomers = [];
  for (let i = 0; i < Math.min(customerRows.length, pitchCustomers.length); i += 1) {
    const old = customerRows[i];
    const desired = pitchCustomers[i];
    const profile = { name: desired.name, district: desired.district, bio: '' };
    await users.updateOne({ id: old.id }, { $set: profile });
    reviewCustomers.push({ ...old, ...profile });
  }
  for (const customer of customerRows.slice(pitchCustomers.length))
    await users.updateOne({ id: customer.id }, { $set: { name: 'Farruh Rasulov', bio: '' } });

  for (let i = 0; i < seededMasters.length; i += 1) {
    const master = seededMasters[i];
    const captionSet = portfolioCaptions[master.pitch.categoryId];
    for (let itemIndex = 0; itemIndex < 2; itemIndex += 1) {
      const variant = (i + itemIndex) % 3 + 1;
      const slug = ['','plumbing','electrical','appliance','locksmith','repair','cleaning'][master.pitch.categoryId];
      const url = `/portfolio/${slug}-${variant}.svg`;
      const doc = {
        id: `pitch-${master.id}-portfolio-${itemIndex + 1}`,
        owner_id: master.id,
        portfolio_master_id: master.id,
        url,
        pathname: url,
        original_name: `${slug}-${variant}.svg`,
        mime_type: 'image/svg+xml',
        size_bytes: statSync(new URL(`../../public${url}`, import.meta.url)).size,
        caption: captionSet[(i + itemIndex) % captionSet.length],
        created_at: new Date(now - (i * 2 + itemIndex + 1) * day),
      };
      await media.updateOne({ id: doc.id }, { $set: doc }, { upsert: true });
    }

    let review = await reviews.findOne({ master_id: master.id });
    let order;
    if (review) order = await orders.findOne({ id: review.order_id });
    if (review && order) {
      const customer = reviewCustomers[i % reviewCustomers.length];
      const createdAt = new Date(now - (i + 3) * day);
      await orders.updateOne({ id: order.id }, { $set: {
        customer_id: customer.id, master_id: master.id, category_id: master.pitch.categoryId,
        description: master.pitch.projects[i % master.pitch.projects.length],
        address: `${customer.district}, Toshkent`, district: customer.district,
        status: 'completed', updated_at: createdAt,
      } });
      order = { ...order, customer_id: customer.id, master_id: master.id, category_id: master.pitch.categoryId, status: 'completed' };
    }
    if (!order) {
      const id = `pitch-order-${master.id}`;
      const customer = reviewCustomers[i % reviewCustomers.length];
      const [lat, lng] = districtPoints[customer.district] || [41.3111, 69.2797];
      const createdAt = new Date(now - (i + 3) * day);
      order = {
        id,
        customer_id: customer.id,
        master_id: master.id,
        category_id: master.pitch.categoryId,
        description: master.pitch.projects[i % master.pitch.projects.length],
        address: `${customer.district}, Toshkent`,
        district: customer.district,
        preferred_time: '',
        status: 'completed',
        created_at: createdAt,
        updated_at: createdAt,
        scheduled_at: createdAt.toISOString(),
        customer_latitude: lat,
        customer_longitude: lng,
      };
      await orders.updateOne({ id }, { $setOnInsert: order }, { upsert: true });
      await events.updateOne(
        { id: `pitch-event-${master.id}-completed` },
        { $setOnInsert: { id: `pitch-event-${master.id}-completed`, order_id: id, actor_id: master.id, status: 'completed', note: 'Xizmat yakunlandi.', created_at: createdAt } },
        { upsert: true },
      );
    }

    const rating = [5, 5, 5, 4, 5, 5, 4, 5, 5, 4, 5, 5, 5, 4, 5, 5, 5][i];
    const customer = reviewCustomers[i % reviewCustomers.length];
    const reviewData = {
      id: review?.id || `pitch-review-${master.id}`,
      order_id: order.id,
      customer_id: customer.id,
      master_id: master.id,
      rating,
      comment: master.pitch.review,
      created_at: new Date(now - (i + 2) * day),
    };
    if (review) await reviews.updateOne({ id: review.id }, { $set: reviewData });
    else await reviews.updateOne({ order_id: order.id }, { $setOnInsert: reviewData }, { upsert: true });
  }

  const oldOrders = await orders.find({ description: /demo/i }).toArray();
  for (const order of oldOrders) {
    const description = order.description.replace(/\bdemo\b\s*/gi, '').replace(/^(ochiq|qabul qilingan|yo‘ldagi|yetib kelgan|jarayondagi|yakunlangan)\s*:?\s*/i, '').trim();
    await orders.updateOne({ id: order.id }, { $set: { description: description || 'Uy xizmatiga buyurtma.', address: `${order.district || 'Toshkent'}, Toshkent` } });
  }
  const oldEvents = await events.find({ note: /demo|namuna/i }).toArray();
  for (const event of oldEvents) await events.updateOne({ id: event.id }, { $set: { note: 'Buyurtma holati yangilandi.' } });

  const remainingNamedDemo = await users.countDocuments({ $or: [
    { name: /^Demo usta/i }, { name: /^Demo mijoz/i }, { bio: /Demo profil/i },
  ] });
  if (remainingNamedDemo) console.warn(`${remainingNamedDemo} boshqa demo yozuv qoldi.`);
  console.log(JSON.stringify({ updatedMasters: seededMasters.length, updatedCustomers: reviewCustomers.length, portfolioItems: await media.countDocuments({ id: { $regex: '^pitch-.*-portfolio-' } }), reviews: await reviews.countDocuments({ master_id: { $in: seededMasters.map(master => master.id) } }), cleanedOrders: oldOrders.length, cleanedEvents: oldEvents.length }));
} finally {
  await closeDatabase();
}
