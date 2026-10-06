import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { put } from "@vercel/blob";
import { closeDatabase, getCollection, getDb } from "../db/index.js";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const filename = process.env.SQLITE_FILE || path.join(root, "ustatop.sqlite3");
const sqlite = new DatabaseSync(filename, { readOnly: true });
const date = (value) =>
  value ? (value instanceof Date ? value : new Date(value)) : new Date();
const parseJson = (value, fallback) => {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
};
const stableId = (kind, id) => `legacy-${kind}-${id}`;

try {
  await getDb();
  const usersCollection = await getCollection("users");
  const userIds = new Map();
  for (const row of sqlite.prepare("SELECT * FROM users ORDER BY id").all()) {
    const existing = await usersCollection.findOne({ phone: row.phone });
    const id = existing?.id || stableId("user", row.id);
    userIds.set(row.id, id);
    await usersCollection.updateOne(
      { phone: row.phone },
      {
        $setOnInsert: {
          id,
          role: row.role,
          name: row.name,
          phone: row.phone,
          password_hash: row.password_hash,
          district: row.district,
          bio: row.bio || "",
          category_id: row.category_id ?? null,
          price_min: row.price_min ?? null,
          price_max: row.price_max ?? null,
          available: Boolean(row.available),
          latitude: row.latitude ?? null,
          longitude: row.longitude ?? null,
          experience_years: row.experience_years || 0,
          services: parseJson(row.services, []),
          contact_phone: row.contact_phone || "",
          social_links: parseJson(row.social_links, {}),
          created_at: date(row.created_at),
        },
      },
      { upsert: true },
    );
  }

  const categories = await getCollection("categories");
  for (const row of sqlite.prepare("SELECT * FROM categories").all())
    await categories.updateOne(
      { id: row.id },
      { $set: { name: row.name, icon: row.icon } },
      { upsert: true },
    );

  const ordersCollection = await getCollection("orders"),
    orderIds = new Map();
  for (const row of sqlite.prepare("SELECT * FROM orders ORDER BY id").all()) {
    const id = stableId("order", row.id);
    orderIds.set(row.id, id);
    await ordersCollection.updateOne(
      { id },
      {
        $setOnInsert: {
          id,
          customer_id: userIds.get(row.customer_id),
          master_id: row.master_id == null ? null : userIds.get(row.master_id),
          category_id: row.category_id,
          description: row.description,
          address: row.address,
          district: row.district,
          preferred_time: row.preferred_time || "",
          status: row.status,
          scheduled_at:
            row.scheduled_at ||
            new Date(date(row.created_at).getTime() + 86400000).toISOString(),
          customer_latitude: row.customer_latitude ?? null,
          customer_longitude: row.customer_longitude ?? null,
          created_at: date(row.created_at),
          updated_at: date(row.updated_at),
        },
      },
      { upsert: true },
    );
  }

  const messagesCollection = await getCollection("messages"),
    messageIds = new Map();
  for (const row of sqlite
    .prepare("SELECT * FROM messages ORDER BY id")
    .all()) {
    const id = stableId("message", row.id);
    messageIds.set(row.id, id);
    await messagesCollection.updateOne(
      { id },
      {
        $setOnInsert: {
          id,
          order_id: orderIds.get(row.order_id),
          sender_id: userIds.get(row.sender_id),
          body: row.body,
          created_at: date(row.created_at),
        },
      },
      { upsert: true },
    );
  }

  const reviews = await getCollection("reviews");
  for (const row of sqlite.prepare("SELECT * FROM reviews ORDER BY id").all())
    await reviews.updateOne(
      { order_id: orderIds.get(row.order_id) },
      {
        $setOnInsert: {
          id: stableId("review", row.id),
          order_id: orderIds.get(row.order_id),
          customer_id: userIds.get(row.customer_id),
          master_id: userIds.get(row.master_id),
          rating: row.rating,
          comment: row.comment || "",
          created_at: date(row.created_at),
        },
      },
      { upsert: true },
    );

  const events = await getCollection("order_events");
  for (const row of sqlite
    .prepare("SELECT * FROM order_events ORDER BY id")
    .all())
    await events.updateOne(
      { id: stableId("event", row.id) },
      {
        $setOnInsert: {
          id: stableId("event", row.id),
          order_id: orderIds.get(row.order_id),
          actor_id: row.actor_id == null ? null : userIds.get(row.actor_id),
          status: row.status,
          note: row.note || "",
          created_at: date(row.created_at),
        },
      },
      { upsert: true },
    );

  const mediaCollection = await getCollection("media");
  const mediaRows = sqlite.prepare("SELECT * FROM media ORDER BY id").all();
  for (const row of mediaRows) {
    const id = stableId("media", row.id);
    if (await mediaCollection.findOne({ id })) continue;
    const diskPath = path.join(root, "uploads", row.filename);
    if (!fs.existsSync(diskPath)) {
      console.warn(`Media tashlab ketildi, lokal fayl yo‘q: ${row.filename}`);
      continue;
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN)
      throw new Error(
        "SQLite media ko‘chirish uchun BLOB_READ_WRITE_TOKEN ham kerak.",
      );
    const ownerId = userIds.get(row.owner_id),
      context = row.portfolio_master_id ? "portfolio" : "order";
    const destination = `ustatop/${ownerId}/${context}/${crypto.randomUUID()}-${path.basename(row.original_name)}`;
    const blob = await put(destination, fs.createReadStream(diskPath), {
      access: "public",
      addRandomSuffix: true,
      contentType: row.mime_type,
    });
    await mediaCollection.insertOne({
      id,
      owner_id: ownerId,
      order_id: row.order_id == null ? null : orderIds.get(row.order_id),
      message_id:
        row.message_id == null ? null : messageIds.get(row.message_id),
      portfolio_master_id:
        row.portfolio_master_id == null
          ? null
          : userIds.get(row.portfolio_master_id),
      url: blob.url,
      pathname: blob.pathname,
      original_name: row.original_name,
      mime_type: row.mime_type,
      size_bytes: row.size_bytes,
      caption: row.caption || "",
      created_at: date(row.created_at),
    });
  }

  const legacySessions = sqlite
    .prepare("SELECT * FROM sessions WHERE expires_at>?")
    .all(Math.floor(Date.now() / 1000));
  const sessions = await getCollection("sessions");
  for (const row of legacySessions)
    if (userIds.has(row.user_id))
      await sessions.updateOne(
        { token_hash: row.token_hash },
        {
          $setOnInsert: {
            token_hash: row.token_hash,
            user_id: userIds.get(row.user_id),
            expires_at: new Date(row.expires_at * 1000),
          },
        },
        { upsert: true },
      );

  console.log(
    JSON.stringify(
      {
        users: userIds.size,
        orders: orderIds.size,
        messages: messageIds.size,
        reviews: sqlite.prepare("SELECT count(*) count FROM reviews").get()
          .count,
        events: sqlite.prepare("SELECT count(*) count FROM order_events").get()
          .count,
        media: mediaRows.length,
      },
      null,
      2,
    ),
  );
  console.log(
    "SQLite ma’lumotlari MongoDB Atlas’ga ko‘chirildi. Scriptni qayta ishlatish xavfsiz.",
  );
} finally {
  sqlite.close();
  await closeDatabase();
}
