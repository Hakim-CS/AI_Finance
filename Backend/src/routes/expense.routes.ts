import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { protect } from '../middleware/auth';
import { forecastModelCache, parseVoiceTranscript, parseReceiptText } from '../services/ai.service';

export const expenseRoutes = Router();

// ── GET /expenses ───────────────────────────────────────────────────────────

expenseRoutes.get('/expenses', protect, async (req, res) => {
  const userId = req.user?.id;
  try {
    // Fetch personal + group expenses
    const result = await pool.query(`
      SELECT DISTINCT e.* FROM "Expense" e
      LEFT JOIN "GroupMember" gm ON e."groupId" = gm."groupId"
      WHERE (e."userId" = $1 AND e."groupId" IS NULL)
         OR (gm."userId" = $1 AND e."groupId" IS NOT NULL)
      ORDER BY e.date DESC
    `, [userId]);

    const rawExpenses = result.rows;
    const finalExpenses = [];

    for (let exp of rawExpenses) {
      if (exp.groupId) {
        // Find out how many people are in that group to calculate the split
        const memberCountRes = await pool.query(
          'SELECT COUNT(*) as count FROM "GroupMember" WHERE "groupId" = $1',
          [exp.groupId]
        );
        const count = parseInt(memberCountRes.rows[0].count) || 1;

        // The amount shown in the personal list is ONLY the user's share
        const myShare = Number(exp.amount) / count;

        finalExpenses.push({
          ...exp,
          amount: myShare,
          isGroupShare: true,
          totalGroupAmount: exp.amount,
          paidByMe: exp.userId === userId
        });
      } else {
        // Personal expense, 100% belongs to user
        finalExpenses.push({
          ...exp,
          amount: Number(exp.amount),
          paidByMe: true
        });
      }
    }

    res.json(finalExpenses);
  } catch (error: any) {
    console.error('Fetch error:', error.message);
    res.status(500).json({ message: 'Error fetching expenses', details: error.message });
  }
});

// ── POST /expenses ──────────────────────────────────────────────────────────

expenseRoutes.post('/expenses', protect, async (req, res) => {
  const { amount, categoryId, description, date, notes, groupId } = req.body;
  const id = uuidv4();
  try {
    const result = await pool.query(
      'INSERT INTO "Expense" (id, amount, "categoryId", description, date, notes, "userId", "groupId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [id, amount, categoryId, description, date, notes, req.user?.id, groupId || null]
    );
    // Invalidate the cached LSTM model for this user so the next forecast retrains
    forecastModelCache.delete(req.user!.id);
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Error adding expense', details: error.message });
  }
});

// ── PUT /expenses/:id ───────────────────────────────────────────────────────

expenseRoutes.put('/expenses/:id', protect, async (req, res) => {
  const { amount, categoryId, description, date, notes } = req.body;
  try {
    const result = await pool.query(
      'UPDATE "Expense" SET amount=$1, "categoryId"=$2, description=$3, date=$4, notes=$5 WHERE id=$6 AND "userId"=$7 RETURNING *',
      [amount, categoryId, description, date, notes, req.params.id, req.user?.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Expense not found' });
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Update error', details: error.message });
  }
});

// ── DELETE /expenses/:id ────────────────────────────────────────────────────

expenseRoutes.delete('/expenses/:id', protect, async (req, res) => {
  try {
    await pool.query('DELETE FROM "Expense" WHERE id=$1 AND "userId"=$2', [req.params.id, req.user?.id]);
    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ message: 'Delete error', details: error.message });
  }
});

// ── POST /expenses/parse-voice ──────────────────────────────────────────────

expenseRoutes.post('/expenses/parse-voice', protect, async (req, res) => {
  const { transcript } = req.body;
  res.json(parseVoiceTranscript(transcript));
});

// ── POST /expenses/parse-receipt ────────────────────────────────────────────

expenseRoutes.post('/expenses/parse-receipt', protect, async (req, res) => {
  const { text } = req.body;
  res.json(parseReceiptText(text));
});

// ── GET /expenses/history ───────────────────────────────────────────────────

expenseRoutes.get('/expenses/history', protect, async (req, res) => {
  try {
    const userId = req.user?.id;
    // fetch all expenses for the user
    const result = await pool.query(
      'SELECT amount, date FROM "Expense" WHERE "userId" = $1 ORDER BY date ASC',
      [userId]
    );

    // fetch current total budget and user income for the budget reference line
    const budgetResult = await pool.query('SELECT SUM("limitAmount") as "totalBudget" FROM "Budget" WHERE "userId" = $1', [userId]);
    const userRes = await pool.query('SELECT income FROM "User" WHERE id = $1', [userId]);
    const userIncome = Number(userRes.rows[0]?.income) || 0;
    const sumBudget = Number(budgetResult.rows[0]?.totalBudget) || 0;
    // Prefer income as the reference; fall back to budget sum if income isn't set
    const monthlyBudget = userIncome > 0 ? userIncome : (sumBudget > 0 ? sumBudget : 0);

    const expenses = result.rows;

    // create a map using YYYY MM as keys for perfect sorting
    const monthlyTotals: Record<string, number> = {};

    expenses.forEach(exp => {
      const date = new Date(exp.date);
      if (!isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(exp.amount);
      }
    });

    // convert to array and sort by the key
    const history = Object.entries(monthlyTotals)
      .map(([monthKey, amount]) => {
        const [year, month] = monthKey.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1);
        return {
          monthKey, // "2026-03"
          month: dateObj.toLocaleString('default', { month: 'short' }), // "Mar"
          spent: amount,
          budget: monthlyBudget
        };
      })
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching history', details: error.message });
  }
});
