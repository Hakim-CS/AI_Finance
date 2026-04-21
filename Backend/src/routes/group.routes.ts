import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { protect } from '../middleware/auth';

export const groupRoutes = Router();

// 1. Fetch all groups I belong to (with members)
groupRoutes.get('/groups', protect, async (req, res) => {
  try {
    const userId = req.user?.id;

    // Fetch groups
    const groupResult = await pool.query(`
      SELECT g.* FROM "Group" g
      JOIN "GroupMember" gm ON g.id = gm."groupId"
      WHERE gm."userId" = $1
      ORDER BY g."createdAt" DESC
    `, [userId]);

    const groups = groupResult.rows;

    // For each group, fetch members and real expenses
    for (let group of groups) {
      const membersResult = await pool.query(`
        SELECT u.id, u.name, u.email FROM "User" u
        JOIN "GroupMember" gm ON u.id = gm."userId"
        WHERE gm."groupId" = $1
      `, [group.id]);

      const expensesResult = await pool.query(`
        SELECT * FROM "Expense" WHERE "groupId" = $1 ORDER BY date DESC
      `, [group.id]);

      group.members = membersResult.rows;
      group.expenses = expensesResult.rows.map(e => ({
        ...e,
        amount: Number(e.amount),  // pg returns DECIMAL as string — must convert
        paidBy: e.userId,
        splitBetween: group.members.map((m: any) => m.id)
      }));
    }
    res.json(groups);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching groups', details: error.message });
  }
});

// 2. Create a new group
groupRoutes.post('/groups', protect, async (req, res) => {
  const { name, description, memberEmails } = req.body;
  const userId = req.user?.id;
  const groupId = uuidv4();

  try {
    // Start a transaction
    await pool.query('BEGIN');

    // A. Insert the group
    await pool.query(
      'INSERT INTO "Group" (id, name, description, "createdBy") VALUES ($1, $2, $3, $4)',
      [groupId, name, description, userId]
    );

    // B. Add the creator (you) as a member
    await pool.query(
      'INSERT INTO "GroupMember" ("groupId", "userId") VALUES ($1, $2)',
      [groupId, userId]
    );

    // C. (Optional) Add other members by looking up their emails
    if (memberEmails && memberEmails.length > 0) {
      for (const email of memberEmails) {
        const userRes = await pool.query('SELECT id FROM "User" WHERE email = $1', [email]);
        if (userRes.rows.length > 0) {
          await pool.query(
            'INSERT INTO "GroupMember" ("groupId", "userId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [groupId, userRes.rows[0].id]
          );
        }
      }
    }

    await pool.query('COMMIT');
    res.status(201).json({ id: groupId, name, description });
  } catch (error: any) {
    await pool.query('ROLLBACK');
    res.status(500).json({ message: 'Error creating group', details: error.message });
  }
});

// 3. Add a member to a group
groupRoutes.post('/groups/:id/members', protect, async (req, res) => {
  const { email } = req.body;
  const groupId = req.params.id;

  try {
    const userRes = await pool.query('SELECT id FROM "User" WHERE email = $1', [email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userIdToAdd = userRes.rows[0].id;
    await pool.query(
      'INSERT INTO "GroupMember" ("groupId", "userId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [groupId, userIdToAdd]
    );

    res.json({ message: 'Member added successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding member', details: error.message });
  }
});

// 4. Delete a group
groupRoutes.delete('/groups/:id', protect, async (req, res) => {
  const groupId = String(req.params.id);
  const userId = req.user?.id;

  // Basic UUID validation to prevent PG errors
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(groupId)) {
    return res.status(404).json({ message: 'Group not found (invalid ID format)' });
  }

  try {
    // Only the creator can delete the group (optional check, but safer)
    const groupCheck = await pool.query('SELECT "createdBy" FROM "Group" WHERE id = $1', [groupId]);
    if (groupCheck.rows.length === 0) return res.status(404).json({ message: 'Group not found' });

    if (groupCheck.rows[0].createdBy !== userId) {
      return res.status(403).json({ message: 'Only the creator can delete this group' });
    }

    await pool.query('DELETE FROM "Group" WHERE id = $1', [groupId]);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting group', details: error.message });
  }
});
