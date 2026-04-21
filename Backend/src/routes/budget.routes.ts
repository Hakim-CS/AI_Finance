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

// ── GET /budget/optimize — XGBoost Python subprocess ────────────────────────

budgetRoutes.get('/budget/optimize', protect, async (req, res) => {
  const userId = req.user?.id;

  try {
    // Fetch the latest income directly from the DB
    const userRes = await pool.query('SELECT income FROM "User" WHERE id = $1', [userId]);
    const userIncome = Number(userRes.rows[0]?.income) || 5000;

    console.log(`[AI Optimizer] Running for User ${userId} with Income: ${userIncome}`);

    const scriptPath = path.join(__dirname, '../../../AI/optimize.py');

    exec(`python "${scriptPath}" ${userIncome}`, { cwd: path.join(__dirname, '../../../AI') }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Exec error: ${error}`);
        return res.status(500).json({ message: "AI Optimization failed" });
      }

      try {
        const rawAiResult = JSON.parse(stdout);

        // Clean and map Kaggle 10 categories to App 8 categories
        const mappedResults: Record<string, number> = {
          food: rawAiResult["Food & Drink"] || 0,
          transport: (rawAiResult["Travel"] || 0) * 0.4,
          entertainment: rawAiResult["Entertainment"] || 0,
          shopping: rawAiResult["Shopping"] || 0,
          utilities: (rawAiResult["Utilities"] || 0) + (rawAiResult["Rent"] || 0),
          health: rawAiResult["Health & Fitness"] || 0,
          travel: (rawAiResult["Travel"] || 0) * 0.6,
          other: rawAiResult["Other"] || 0
        };

        res.json(mappedResults);
      } catch (e) {
        res.status(500).json({ message: "Failed to parse AI result" });
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
});
