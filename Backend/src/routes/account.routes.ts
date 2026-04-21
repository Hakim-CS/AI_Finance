import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { pool } from '../config/database';
import { protect } from '../middleware/auth';
import { AVATARS_DIR } from '../middleware/upload';

export const accountRoutes = Router();

// DELETE /expenses/all — wipe all personal expenses for the current user
accountRoutes.delete('/expenses/all', protect, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM "Expense" WHERE "userId" = $1 AND "groupId" IS NULL RETURNING id`,
      [req.user!.id]
    );
    console.log(`[Danger] User ${req.user!.id} deleted ${result.rowCount} personal expenses`);
    res.json({ message: `Deleted ${result.rowCount} expenses` });
  } catch (error: any) {
    res.status(500).json({ message: 'Error clearing expenses', details: error.message });
  }
});

// DELETE /auth/account — SOFT delete: sets deleted_at + is_active=false.
// The user gets a 14-day grace period to restore via POST /auth/account/restore.
// A background job permanently removes the row after 14 days.
accountRoutes.delete('/auth/account', protect, async (req, res) => {
  const userId = req.user!.id;
  try {
    await pool.query(
      `UPDATE "User" SET is_active = FALSE, deleted_at = NOW() WHERE id = $1`,
      [userId]
    );
    const deletionDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    console.log(`[SoftDelete] User ${userId} scheduled for deletion on ${deletionDate}`);
    res.json({ message: 'Account scheduled for deletion', deletion_date: deletionDate });
  } catch (error: any) {
    res.status(500).json({ message: 'Error scheduling account deletion', details: error.message });
  }
});

// POST /auth/account/restore — cancel scheduled deletion within the 14-day grace period
accountRoutes.post('/auth/account/restore', protect, async (req, res) => {
  const userId = req.user!.id;
  try {
    const check = await pool.query(
      `SELECT deleted_at FROM "User" WHERE id = $1`,
      [userId]
    );
    if (!check.rows[0]?.deleted_at) {
      return res.status(400).json({ message: 'Account is not scheduled for deletion.' });
    }
    const deletedAt     = new Date(check.rows[0].deleted_at);
    const msElapsed     = Date.now() - deletedAt.getTime();
    const gracePeriodMs = 14 * 24 * 60 * 60 * 1000;
    if (msElapsed > gracePeriodMs) {
      return res.status(410).json({ message: 'Grace period has expired. Account cannot be restored.' });
    }
    await pool.query(
      `UPDATE "User" SET is_active = TRUE, deleted_at = NULL WHERE id = $1`,
      [userId]
    );
    console.log(`[Restore] User ${userId} account restored`);
    res.json({ message: 'Account restored successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error restoring account', details: error.message });
  }
});

// ── Background Cleanup Job ────────────────────────────────────────────────────
// Runs every hour. Permanently deletes users whose 14-day grace period has expired.
// ON DELETE CASCADE on Expense, UserPreferences, GroupMember handles related rows.
export function startAccountCleanupJob(): void {
  setInterval(async () => {
    try {
      // Fetch users to cleanup so we can also remove their avatar files
      const expired = await pool.query(
        `SELECT id, avatar_url FROM "User"
         WHERE deleted_at IS NOT NULL
           AND deleted_at < NOW() - INTERVAL '14 days'`
      );
      if (expired.rows.length === 0) return;

      for (const row of expired.rows) {
        // Remove avatar from disk
        if (row.avatar_url) {
          const filePath = path.join(AVATARS_DIR, path.basename(row.avatar_url));
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch {}
          }
        }
        await pool.query('DELETE FROM "User" WHERE id = $1', [row.id]);
        console.log(`[Cleanup] Permanently deleted user ${row.id} (grace period expired)`);
      }
    } catch (err: any) {
      console.error('[Cleanup] Error during expired account deletion:', err.message);
    }
  }, 60 * 60 * 1000); // every 1 hour
}
