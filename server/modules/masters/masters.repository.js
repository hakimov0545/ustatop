import { getCollection } from '../../db/index.js';

export async function list({ categoryId, district }) {
  const users = await getCollection('users'), categories = await getCollection('categories'), reviews = await getCollection('reviews');
  const filter = { role: 'master', available: true };
  if (categoryId) filter.category_id = categoryId;
  if (district) filter.district = district;
  const [masters, categoryList] = await Promise.all([users.find(filter).toArray(), categories.find().toArray()]);
  const categoryMap = new Map(categoryList.map(category => [category.id, category]));
  return Promise.all(masters.map(async master => {
    const [summary, latest] = await Promise.all([
      reviews.aggregate([{ $match: { master_id: master.id } }, { $group: { _id: null, rating: { $avg: '$rating' }, review_count: { $sum: 1 } } }]).next(),
      reviews.find({ master_id: master.id }).sort({ created_at: -1 }).limit(1).toArray(),
    ]);
    const category = categoryMap.get(master.category_id);
    return { ...master, category: category?.name || '', icon: category?.icon || '', rating: summary?.rating || 0, review_count: summary?.review_count || 0, latest_review: latest[0] || null };
  }));
}

export async function profile(masterId) {
  const users = await getCollection('users'), categories = await getCollection('categories'), reviews = await getCollection('reviews');
  const master = await users.findOne({ id: masterId, role: 'master' });
  if (!master) return null;
  const [category, summary] = await Promise.all([
    categories.findOne({ id: master.category_id }),
    reviews.aggregate([{ $match: { master_id: master.id } }, { $group: { _id: null, rating: { $avg: '$rating' }, review_count: { $sum: 1 } } }]).next(),
  ]);
  return { ...master, category: category?.name || '', icon: category?.icon || '', rating: summary?.rating || 0, review_count: summary?.review_count || 0 };
}

export async function reviews(masterId) {
  const [reviewRows, users] = await Promise.all([
    (await getCollection('reviews')).find({ master_id: masterId }).sort({ created_at: -1 }).limit(50).toArray(),
    getCollection('users'),
  ]);
  const customerIds = [...new Set(reviewRows.map(review => review.customer_id))];
  const customers = await users.find({ id: { $in: customerIds } }).project({ id: 1, name: 1 }).toArray();
  const names = new Map(customers.map(customer => [customer.id, customer.name]));
  return reviewRows.map(({ _id, ...review }) => ({ ...review, customer_name: names.get(review.customer_id) || 'Mijoz' }));
}

export async function portfolio(masterId) {
  return (await getCollection('media')).find({ portfolio_master_id: masterId }).sort({ created_at: -1 }).project({ _id: 0 }).toArray();
}

export async function updateProfile(masterId, profile) {
  const users = await getCollection('users');
  await users.updateOne({ id: masterId, role: 'master' }, { $set: profile });
  return users.findOne({ id: masterId });
}

export async function addPortfolio(masterId, media) {
  await (await getCollection('media')).insertOne(media);
  return media;
}

export async function removePortfolio(masterId, mediaId) {
  return (await getCollection('media')).deleteOne({ id: mediaId, portfolio_master_id: masterId });
}
