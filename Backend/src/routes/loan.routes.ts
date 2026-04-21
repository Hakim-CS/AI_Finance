import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { protect } from '../middleware/auth';

export const loanRoutes = Router();

// GET all loans for the authenticated user
loanRoutes.get('/loans', protect, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM "Loan" WHERE "userId" = $1 ORDER BY date DESC',
      [req.user?.id]
    );
    // Convert decimal strings to numbers for the frontend
    const loans = result.rows.map(r => ({
      ...r,
      amount: parseFloat(r.amount),
    }));
    res.json(loans);
  } catch (error: any) {
    console.error('GET /loans error:', error.message);
    res.status(500).json({ message: 'Error fetching loans' });
  }
});

// POST create a new loan
loanRoutes.post('/loans', protect, async (req, res) => {
  const { type, amount, person, date, description } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO "Loan" (id, "userId", type, amount, person, description, date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [uuidv4(), req.user?.id, type, amount, person, description || null, date]
    );
    const loan = { ...result.rows[0], amount: parseFloat(result.rows[0].amount) };
    res.status(201).json(loan);
  } catch (error: any) {
    console.error('POST /loans error:', error.message);
    res.status(500).json({ message: 'Error creating loan' });
  }
});

// PUT update a loan
loanRoutes.put('/loans/:id', protect, async (req, res) => {
  const { id } = req.params;
  const { type, amount, person, date, description } = req.body;
  try {
    const result = await pool.query(
      `UPDATE "Loan"
       SET type = $1, amount = $2, person = $3, date = $4, description = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND "userId" = $7
       RETURNING *`,
      [type, amount, person, date, description || null, id, req.user?.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    const loan = { ...result.rows[0], amount: parseFloat(result.rows[0].amount) };
    res.json(loan);
  } catch (error: any) {
    console.error('PUT /loans/:id error:', error.message);
    res.status(500).json({ message: 'Error updating loan' });
  }
});

// PATCH toggle loan status (open ↔ settled)
loanRoutes.patch('/loans/:id/toggle', protect, async (req, res) => {
  const { id } = req.params;
  try {
    const current = await pool.query(
      'SELECT status FROM "Loan" WHERE id = $1 AND "userId" = $2',
      [id, req.user?.id]
    );
    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    const newStatus = current.rows[0].status === 'open' ? 'settled' : 'open';
    const settledAt = newStatus === 'settled' ? new Date().toISOString() : null;

    const result = await pool.query(
      `UPDATE "Loan"
       SET status = $1, settled_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND "userId" = $4
       RETURNING *`,
      [newStatus, settledAt, id, req.user?.id]
    );
    const loan = { ...result.rows[0], amount: parseFloat(result.rows[0].amount) };
    res.json(loan);
  } catch (error: any) {
    console.error('PATCH /loans/:id/toggle error:', error.message);
    res.status(500).json({ message: 'Error toggling loan status' });
  }
});

// DELETE a loan
loanRoutes.delete('/loans/:id', protect, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM "Loan" WHERE id = $1 AND "userId" = $2 RETURNING id',
      [id, req.user?.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Loan not found' });
    }
    res.json({ message: 'Loan deleted' });
  } catch (error: any) {
    console.error('DELETE /loans/:id error:', error.message);
    res.status(500).json({ message: 'Error deleting loan' });
  }
});
