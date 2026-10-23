import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || 'ustatop';
let clientPromise;
let initializationPromise;

function getClient() {
  if (!uri) throw new Error('MONGODB_URI sozlamasi yo‘q. MongoDB Atlas connection string kiriting.');
  if (!clientPromise) {
    const client = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 10000 });
    clientPromise = client.connect().catch(error => {
      client.close().catch(() => {});
      clientPromise = undefined;
      throw error;
    });
  }
  return clientPromise;
}

export async function getDb() {
  const client = await getClient();
  return client.db(databaseName);
}

// Run during database setup, rather than on every cold API startup.
export async function initializeDatabase() {
  const database = await getDb();
  if (!initializationPromise) initializationPromise = initialize(database).catch(error => {
    initializationPromise = undefined;
    throw error;
  });
  await initializationPromise;
  return database;
}

async function initialize(database) {
  await Promise.all([
    database.collection('users').createIndex({ id: 1 }, { unique: true }),
    database.collection('users').createIndex({ phone: 1 }, { unique: true }),
    database.collection('sessions').createIndex({ token_hash: 1 }, { unique: true }),
    database.collection('sessions').createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 }),
    database.collection('orders').createIndex({ id: 1 }, { unique: true }),
    database.collection('orders').createIndex({ customer_id: 1, updated_at: -1 }),
    database.collection('orders').createIndex({ master_id: 1, status: 1, scheduled_at: 1 }),
    database.collection('messages').createIndex({ id: 1 }, { unique: true }),
    database.collection('messages').createIndex({ order_id: 1, created_at: 1 }),
    database.collection('reviews').createIndex({ id: 1 }, { unique: true }),
    database.collection('reviews').createIndex({ order_id: 1 }, { unique: true }),
    database.collection('reviews').createIndex({ master_id: 1, created_at: -1 }),
    database.collection('order_events').createIndex({ order_id: 1, created_at: 1 }),
    database.collection('media').createIndex({ id: 1 }, { unique: true }),
    database.collection('media').createIndex({ portfolio_master_id: 1, created_at: -1 }),
    database.collection('media').createIndex({ order_id: 1, message_id: 1 }),
  ]);
  const categories = [
    [1, 'Santexnik', '🚰'], [2, 'Elektrik', '⚡'], [3, 'Maishiy texnika', '🧺'],
    [4, 'Qulf ustasi', '🔑'], [5, 'Ta’mirlash', '🛠️'], [6, 'Tozalash', '🧹'],
  ];
  await database.collection('categories').bulkWrite(categories.map(([id, name, icon]) => ({
    updateOne: { filter: { id }, update: { $setOnInsert: { id, name, icon } }, upsert: true },
  })));
}

export async function getCollection(name) { return (await getDb()).collection(name); }

export async function closeDatabase() {
  if (clientPromise) (await clientPromise).close();
  clientPromise = undefined;
  initializationPromise = undefined;
}
