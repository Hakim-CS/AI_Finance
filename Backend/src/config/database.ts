import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Connect to the database, run migrations, and seed default categories.
 * Called once at server startup.
 */
export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  console.log('Connected to PostgreSQL database!');

  try {
    // ── Core schema migrations ──────────────────────────────────────────────
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS income DECIMAL(10,2) DEFAULT 0`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Budget" (
        id UUID PRIMARY KEY,
        "userId" INTEGER REFERENCES "User"(id),
        "categoryId" TEXT NOT NULL,
        "limitAmount" DECIMAL(10,2) NOT NULL,
        UNIQUE("userId", "categoryId")
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "Group" (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        "createdBy" INTEGER REFERENCES "User"(id),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "GroupMember" (
        "groupId" UUID REFERENCES "Group"(id) ON DELETE CASCADE,
        "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        PRIMARY KEY ("groupId", "userId")
      )
    `);

    // ── Expense table ──────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Expense" (
        id UUID PRIMARY KEY,
        amount DECIMAL(10,2),
        "categoryId" TEXT,
        description TEXT,
        date TIMESTAMP,
        notes TEXT,
        "userId" INTEGER REFERENCES "User"(id) ON DELETE CASCADE,
        "groupId" UUID REFERENCES "Group"(id) ON DELETE SET NULL
      )
    `);

    // ── Category table ─────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Category" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT
      )
    `);

    // ── User preferences table ─────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "UserPreferences" (
        "userId" INTEGER PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
        theme TEXT DEFAULT 'system',
        currency TEXT DEFAULT 'TRY',
        language TEXT DEFAULT 'en',
        notif_email BOOLEAN DEFAULT TRUE,
        notif_budget_alerts BOOLEAN DEFAULT TRUE,
        notif_weekly_report BOOLEAN DEFAULT TRUE,
        notif_ai_insights BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ── User table: extra columns added in later schema updates ────────────
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS phone       TEXT`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS avatar_url  TEXT`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    // Soft-delete columns — is_active=FALSE + deleted_at set = account in 14-day grace period
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT TRUE`);
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS deleted_at  TIMESTAMP`);
    // Monthly saving target — used by AI predictions and dashboard
    await client.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS saving_target DECIMAL(12,2) NOT NULL DEFAULT 0`);

    // Backfill UserPreferences rows for any users who don't have one yet
    await client.query(`
      INSERT INTO "UserPreferences" ("userId")
      SELECT id FROM "User"
      WHERE id NOT IN (SELECT "userId" FROM "UserPreferences")
    `);

    console.log('[Migration] UserPreferences schema verified ✓');

    // ── Loan table: tracks money lent/borrowed between people ───────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS "Loan" (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId"    INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        type        TEXT NOT NULL CHECK (type IN ('lent', 'borrowed')),
        amount      DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
        person      TEXT NOT NULL,
        description TEXT,
        date        TIMESTAMP WITH TIME ZONE NOT NULL,
        status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'settled')),
        settled_at  TIMESTAMP WITH TIME ZONE,
        created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_loan_user ON "Loan"("userId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_loan_user_status ON "Loan"("userId", status)`);
    console.log('[Migration] Loan table verified ✓');
  } catch (e: any) {
    console.log('Database migration log:', e.message);
  }

  // Seed default categories if the table is empty
  try {
    const defaultCategories = [
      { id: 'food', name: 'Food & Dining', icon: 'Utensils', color: 'hsl(var(--chart-1))' },
      { id: 'transport', name: 'Transportation', icon: 'Car', color: 'hsl(var(--chart-2))' },
      { id: 'shopping', name: 'Shopping', icon: 'ShoppingBag', color: 'hsl(var(--chart-3))' },
      { id: 'entertainment', name: 'Entertainment', icon: 'Gamepad2', color: 'hsl(var(--chart-4))' },
      { id: 'utilities', name: 'Utilities', icon: 'Zap', color: 'hsl(var(--chart-5))' },
      { id: 'health', name: 'Healthcare', icon: 'Heart', color: 'hsl(var(--chart-6))' },
      { id: 'travel', name: 'Travel', icon: 'Plane', color: 'hsl(var(--chart-8))' },
      { id: 'other', name: 'Other', icon: 'MoreHorizontal', color: 'hsl(var(--chart-7))' },
    ];
    for (const cat of defaultCategories) {
      await client.query(
        'INSERT INTO "Category" (id, name, icon, color) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
        [cat.id, cat.name, cat.icon, cat.color]
      );
    }
    console.log('Categories seeded.');
  } catch (e: any) {
    console.log('Category seed log:', e.message);
  }

  client.release();
}
