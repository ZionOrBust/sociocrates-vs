import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

let pool: any = null;
let db: any = null;

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL not set - running in development mode without database");
} else {
  try {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.warn("❌ Failed to connect to database:", error.message);
  }
}

export { pool, db };
