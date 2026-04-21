import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { pool } from '../config/database';
import { protect } from '../middleware/auth';
import { uploadAvatar, AVATARS_DIR } from '../middleware/upload';

const jwtSecret = process.env.JWT_SECRET!;
export const authRoutes = Router();

// ── CATEGORIES ──────────────────────────────────────────────────────────────

authRoutes.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, icon, color FROM "Category"');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
});

// ── REGISTER ────────────────────────────────────────────────────────────────

authRoutes.post('/auth/register', async (req, res) => {
  const { email, password, name, username } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO "User" (email, password_hash, name, username, income, saving_target) VALUES ($1, $2, $3, $4, 0, 0) RETURNING id, email, name, username, income, saving_target',
      [email, hashedPassword, name, username]
    );
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (error: any) {
    if (error.code === '23505') return res.status(409).json({ message: 'User or username already exists' });
    res.status(500).json({ message: 'Error registering user', details: error.message });
  }
});

// ── LOGIN ───────────────────────────────────────────────────────────────────

authRoutes.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      `SELECT id, email, name, username, password_hash, income, saving_target, phone, avatar_url,
              is_active, deleted_at
       FROM "User" WHERE email = $1`,
      [email]
    );
    const user = result.rows[0];
    if (user && await bcrypt.compare(password, user.password_hash)) {

      // ── Soft-delete: account permanently gone after grace period ──────────
      if (user.deleted_at) {
        const deletedAt     = new Date(user.deleted_at);
        const msElapsed     = Date.now() - deletedAt.getTime();
        const gracePeriodMs = 14 * 24 * 60 * 60 * 1000; // 14 days

        if (msElapsed > gracePeriodMs) {
          // Should never happen (cleanup job deletes the row), but guard anyway
          return res.status(403).json({ message: 'This account no longer exists.' });
        }

        // Still within grace period — issue a valid token so the user can restore
        const token       = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
        const deletionDate = new Date(deletedAt.getTime() + gracePeriodMs).toISOString();
        return res.json({
          token,
          status:        'account_pending_deletion',
          deletion_date: deletionDate,
          user: {
            id: user.id, email: user.email, name: user.name, username: user.username,
            income: user.income, saving_target: user.saving_target, phone: user.phone, avatar_url: user.avatar_url,
          },
        });
      }

      const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
      return res.json({
        token,
        user: {
          id: user.id, email: user.email, name: user.name, username: user.username,
          income: user.income, saving_target: user.saving_target, phone: user.phone, avatar_url: user.avatar_url,
        },
      });
    }
    res.status(401).json({ message: 'Invalid credentials' });
  } catch (error: any) {
    res.status(500).json({ message: 'Login error', details: error.message });
  }
});

// ── GET /auth/me ────────────────────────────────────────────────────────────

authRoutes.get('/auth/me', protect, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, username, income, saving_target, phone, avatar_url FROM "User" WHERE id = $1',
      [req.user?.id]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching user', details: error.message });
  }
});

// ── PUT /auth/user ──────────────────────────────────────────────────────────

authRoutes.put('/auth/user', protect, async (req, res) => {
  const { income, name, username, phone, saving_target } = req.body;
  try {
    const updates: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (income        !== undefined) { updates.push(`income        = $${idx++}`); params.push(income); }
    if (saving_target !== undefined) { updates.push(`saving_target = $${idx++}`); params.push(saving_target); }
    if (name          !== undefined) { updates.push(`name          = $${idx++}`); params.push(name); }
    if (username      !== undefined) { updates.push(`username      = $${idx++}`); params.push(username); }
    if (phone         !== undefined) { updates.push(`phone         = $${idx++}`); params.push(phone); }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields provided to update' });
    }

    // Always bump updated_at
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(req.user!.id);

    const result = await pool.query(
      `UPDATE "User" SET ${updates.join(', ')} WHERE id = $${idx}
       RETURNING id, email, name, username, income, saving_target, phone`,
      params
    );
    console.log(`[Profile] Updated user ${req.user!.id}:`, Object.keys(req.body));
    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') return res.status(409).json({ message: 'Username already taken' });
    res.status(500).json({ message: 'Error updating profile', details: error.message });
  }
});

// ── POST /auth/avatar ───────────────────────────────────────────────────────

authRoutes.post('/auth/avatar', protect, uploadAvatar.single('avatar'), async (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const newUrl = `http://localhost:5001/avatars/${req.file.filename}`;

  try {
    // If the user already has an avatar, delete the old file to save disk space
    const existing = await pool.query('SELECT avatar_url FROM "User" WHERE id = $1', [req.user!.id]);
    const oldUrl: string | null = existing.rows[0]?.avatar_url;
    if (oldUrl) {
      const oldFile = path.join(AVATARS_DIR, path.basename(oldUrl));
      if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
    }

    // Save new URL
    const result = await pool.query(
      'UPDATE "User" SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, avatar_url',
      [newUrl, req.user!.id]
    );
    console.log(`[Avatar] Updated for user ${req.user!.id}: ${newUrl}`);
    res.json({ avatar_url: result.rows[0].avatar_url });
  } catch (error: any) {
    // Clean up the uploaded file if DB update failed
    fs.unlinkSync(path.join(AVATARS_DIR, req.file.filename));
    res.status(500).json({ message: 'Error saving avatar', details: error.message });
  }
});

// ── POST /auth/change-password ──────────────────────────────────────────────

authRoutes.post('/auth/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'currentPassword and newPassword are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' });
  }

  try {
    // 1. Fetch stored hash
    const result = await pool.query(
      'SELECT password_hash FROM "User" WHERE id = $1',
      [req.user!.id]
    );
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2. Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // 3. Hash and save the new password
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE "User" SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newHash, req.user!.id]
    );

    console.log(`[Security] Password changed for user ${req.user!.id}`);
    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error changing password', details: error.message });
  }
});
