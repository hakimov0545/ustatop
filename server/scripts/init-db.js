import { closeDatabase, initializeDatabase } from "../db/index.js";

try {
  await initializeDatabase();
  console.log("MongoDB indekslari va xizmat kategoriyalari tayyor.");
} finally {
  await closeDatabase();
}
