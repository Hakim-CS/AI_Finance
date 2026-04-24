import { Router } from 'express';
import { exec } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { protect } from '../middleware/auth';

export const budgetRoutes = Router();

// ── GET /budget ─────────────────────────────────────────────────────────────

budgetRoutes.get('/budget', protect, async (req, res) => {
  try {
    const result = await pool.query('SELECT "categoryId", "limitAmount" FROM "Budget" WHERE "userId" = $1', [req.user?.id]);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching budget' });
  }
});

// ── POST /budget ────────────────────────────────────────────────────────────

budgetRoutes.post('/budget', protect, async (req, res) => {
  const { budgets } = req.body; // Array of { categoryId, limitAmount }
  try {
    for (const b of budgets) {
      await pool.query(
        'INSERT INTO "Budget" (id, "userId", "categoryId", "limitAmount") VALUES ($1, $2, $3, $4) ON CONFLICT ("userId", "categoryId") DO UPDATE SET "limitAmount" = EXCLUDED."limitAmount"',
        [uuidv4(), req.user?.id, b.categoryId, b.limitAmount]
      );
    }
    res.json({ message: "Budget updated successfully" });
  } catch (error: any) {
    res.status(500).json({ message: 'Error saving budget', details: error.message });
  }
});

// ── GET /budget/optimize — Random Forest v2 Python subprocess ───────────────

budgetRoutes.get('/budget/optimize', protect, async (req, res) => {
  const userId = req.user?.id;
  const CATEGORIES = ['food', 'transport', 'shopping', 'entertainment', 'utilities', 'health', 'travel', 'other'];

  try {
    // 1. Fetch user income + saving target
    const userRes = await pool.query('SELECT income, saving_target FROM "User" WHERE id = $1', [userId]);
    const userIncome = Number(userRes.rows[0]?.income) || 0;
    const savingTarget = Number(userRes.rows[0]?.saving_target) || 0;

    if (userIncome <= 0) {
      return res.status(400).json({
        message: 'Please set your monthly income in Settings before using AI optimization.'
      });
    }

    const budgetCeiling = Math.max(userIncome * 0.5, userIncome - savingTarget);

    // 2. Fetch the user's LAST MONTH spending per category from real expenses
    //    This gives the model "previous month" context for better predictions
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const expensesRes = await pool.query(
      `SELECT "categoryId", SUM(amount) as total
       FROM "Expense"
       WHERE "userId" = $1 AND date >= $2 AND date <= $3
       GROUP BY "categoryId"`,
      [userId, lastMonth.toISOString(), lastMonthEnd.toISOString()]
    );

    // Build previous-month spending map
    const prevSpending: Record<string, number> = {};
    CATEGORIES.forEach(c => prevSpending[c] = 0);
    for (const row of expensesRes.rows) {
      if (CATEGORIES.includes(row.categoryId)) {
        prevSpending[row.categoryId] = Number(row.total) || 0;
      }
    }
    const prevTotal = Object.values(prevSpending).reduce((s, v) => s + v, 0);
    const currentMonth = now.getMonth() + 1; // 1-12

    const hasHistory = prevTotal > 0;

    console.log(`[AI Optimizer v2] User ${userId} | Income: ${userIncome} | Month: ${currentMonth} | Prev total: ${prevTotal.toFixed(0)} | Has history: ${hasHistory}`);

    // 3. If user has spending history, use the ML model; otherwise use proportional defaults
    if (hasHistory) {
      // Call the v2 prediction script with 11 arguments
      const scriptPath = path.join(__dirname, '../../../AI/predict_v2.py');
      const args = [
        userIncome,
        currentMonth,
        prevSpending.food,
        prevSpending.transport,
        prevSpending.shopping,
        prevSpending.entertainment,
        prevSpending.utilities,
        prevSpending.health,
        prevSpending.travel,
        prevSpending.other,
        prevTotal,
      ].join(' ');

      exec(`python "${scriptPath}" ${args}`, { cwd: path.join(__dirname, '../../../AI') }, (error, stdout, stderr) => {
        if (error) {
          console.error(`[AI Optimizer v2] Exec error: ${error}`);
          return res.status(500).json({ message: "AI Optimization failed" });
        }

        try {
          const predictions: Record<string, number> = JSON.parse(stdout);

          if (predictions.error) {
            console.error(`[AI Optimizer v2] Python error: ${predictions.error}`);
            return res.status(500).json({ message: predictions.error });
          }

          // Scale to fit within budget ceiling
          const rawTotal = Object.values(predictions).reduce((s, v) => s + v, 0);
          if (rawTotal > 0) {
            const scale = budgetCeiling / rawTotal;
            for (const key of Object.keys(predictions)) {
              predictions[key] = Math.round(predictions[key] * scale);
            }
          }

          const finalTotal = Object.values(predictions).reduce((s, v) => s + v, 0);
          console.log(`[AI Optimizer v2] ML prediction total: ${finalTotal} (ceiling: ${budgetCeiling})`);

          res.json(predictions);
        } catch (e) {
          console.error(`[AI Optimizer v2] Parse error:`, e);
          res.status(500).json({ message: "Failed to parse AI result" });
        }
      });
    } else {
      // No spending history — use sensible proportional defaults
      const DEFAULT_ALLOCATIONS: Record<string, number> = {
        food: 0.25,
        transport: 0.10,
        shopping: 0.12,
        entertainment: 0.08,
        utilities: 0.18,
        health: 0.08,
        travel: 0.07,
        other: 0.12,
      };

      const result: Record<string, number> = {};
      for (const [cat, pct] of Object.entries(DEFAULT_ALLOCATIONS)) {
        result[cat] = Math.round(budgetCeiling * pct);
      }

      console.log(`[AI Optimizer v2] New user fallback — proportional allocation`);
      res.json(result);
    }
  } catch (error: any) {
    console.error('[AI Optimizer v2] Error:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});
