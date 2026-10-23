import { getCollection } from '../../db/index.js';

export async function recordSearch({ categoryId = null, district = null }) {
  const day = new Date().toISOString().slice(0, 10);
  await (await getCollection('search_analytics')).updateOne(
    { day, category_id: categoryId, district },
    { $inc: { count: 1 }, $setOnInsert: { created_at: new Date() } },
    { upsert: true },
  );
}

export async function recordMasterView(masterId) {
  const day = new Date().toISOString().slice(0, 10);
  await (await getCollection('master_view_analytics')).updateOne(
    { day, master_id: masterId },
    { $inc: { count: 1 }, $setOnInsert: { created_at: new Date() } },
    { upsert: true },
  );
}

export async function dashboard(days = 30) {
  const users = await getCollection('users');
  const orders = await getCollection('orders');
  const reviews = await getCollection('reviews');
  const categories = await getCollection('categories');
  const searches = await getCollection('search_analytics');
  const views = await getCollection('master_view_analytics');
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const since = start.toISOString().slice(0, 10);
  const dayExpr = { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } };
  const [userCount, masterCount, customerCount, usersByDistrict, orderCount, ordersByStatus, ordersByDistrict, ordersByCategory, topSearches, topCategories, topViews, reviewStats, categoryRows, masterRows, usersDaily, ordersDaily] = await Promise.all([
    users.countDocuments({}),
    users.countDocuments({ role: 'master' }),
    users.countDocuments({ role: 'customer' }),
    users.aggregate([{ $match: { district: { $type: 'string', $ne: '' } } }, { $group: { _id: '$district', users: { $sum: 1 } } }, { $sort: { users: -1 } }, { $limit: 10 }]).toArray(),
    orders.countDocuments({}),
    orders.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray(),
    orders.aggregate([{ $group: { _id: '$district', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]).toArray(),
    orders.aggregate([{ $group: { _id: '$category_id', count: { $sum: 1 } } }, { $sort: { count: -1 } }]).toArray(),
    searches.aggregate([{ $match: { day: { $gte: since } } }, { $group: { _id: { district: '$district', category_id: '$category_id' }, searches: { $sum: '$count' } } }, { $sort: { searches: -1 } }, { $limit: 10 }]).toArray(),
    searches.aggregate([{ $match: { day: { $gte: since }, category_id: { $ne: null } } }, { $group: { _id: '$category_id', searches: { $sum: '$count' } } }, { $sort: { searches: -1 } }, { $limit: 10 }]).toArray(),
    views.aggregate([{ $match: { day: { $gte: since } } }, { $group: { _id: '$master_id', views: { $sum: '$count' } } }, { $sort: { views: -1 } }, { $limit: 10 }]).toArray(),
    reviews.aggregate([{ $group: { _id: null, count: { $sum: 1 }, rating: { $avg: '$rating' } } }]).next(),
    categories.find().project({ _id: 0, id: 1, name: 1, icon: 1 }).toArray(),
    users.find({ role: 'master' }).project({ _id: 0, id: 1, name: 1 }).toArray(),
    users.aggregate([{ $match: { created_at: { $gte: start } } }, { $group: { _id: { day: dayExpr, role: '$role' }, count: { $sum: 1 } } }]).toArray(),
    orders.aggregate([{ $match: { created_at: { $gte: start } } }, { $group: { _id: dayExpr, count: { $sum: 1 } } }]).toArray(),
  ]);
  const categoryMap = new Map(categoryRows.map(({ id, name, icon }) => [id, { name, icon }]));
  const masterMap = new Map(masterRows.map(({ id, name }) => [id, name]));
  const trendMap = new Map();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(start.getTime() + (days - 1 - offset) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    trendMap.set(date, { date, users: 0, customers: 0, masters: 0, orders: 0 });
  }
  for (const row of usersDaily) {
    const date = row._id.day;
    if (!trendMap.has(date)) continue;
    const item = trendMap.get(date);
    item.users += row.count;
    if (row._id.role === 'customer') item.customers += row.count;
    if (row._id.role === 'master') item.masters += row.count;
  }
  for (const row of ordersDaily) if (trendMap.has(row._id)) trendMap.get(row._id).orders = row.count;
  return {
    period: days,
    totals: { users: userCount, masters: masterCount, customers: customerCount, orders: orderCount, reviews: reviewStats?.count || 0, averageRating: Number((reviewStats?.rating || 0).toFixed(1)) },
    usersByDistrict,
    ordersByStatus,
    ordersByDistrict,
    ordersByCategory: ordersByCategory.map(row => ({ ...row, category: categoryMap.get(row._id)?.name || 'Boshqa' })),
    topSearches: topSearches.map(row => ({ district: row._id.district || 'Barcha hududlar', category: categoryMap.get(row._id.category_id)?.name || (row._id.category_id ? 'Boshqa' : 'Barcha xizmatlar'), searches: row.searches })),
    topCategories: topCategories.map(row => ({ category: categoryMap.get(row._id)?.name || 'Boshqa', icon: categoryMap.get(row._id)?.icon || '', searches: row.searches })),
    topMasters: topViews.map(row => ({ id: row._id, name: masterMap.get(row._id) || 'Usta', views: row.views })),
    trend: [...trendMap.values()],
    analyticsSince: (await searches.find().sort({ day: 1 }).limit(1).project({ _id: 0, day: 1 }).next())?.day || null,
  };
}
