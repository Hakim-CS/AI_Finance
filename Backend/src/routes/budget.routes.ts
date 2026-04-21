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
    // Fetch the latest income + saving target directly from the DB
    const userRes = await pool.query('SELECT income, saving_target FROM "User" WHERE id = $1', [userId]);
    const userIncome = Number(userRes.rows[0]?.income) || 0;
    const savingTarget = Number(userRes.rows[0]?.saving_target) || 0;

    // GUARD: Refuse to optimize if the user hasn't set their income
    if (userIncome <= 0) {
      return res.status(400).json({
        message: 'Please set your monthly income in Settings before using AI optimization.'
      });
    }

    // The maximum budget AI can allocate = income minus saving target (min 50% of income)
    const budgetCeiling = Math.max(userIncome * 0.5, userIncome - savingTarget);

    console.log(`[AI Optimizer] User ${userId} | Income: ${userIncome} | Saving: ${savingTarget} | Ceiling: ${budgetCeiling}`);

    const scriptPath = path.join(__dirname, '../../../AI/optimize.py');

    exec(`python "${scriptPath}" ${userIncome}`, { cwd: path.join(__dirname, '../../../AI') }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Exec error: ${error}`);
        return res.status(500).json({ message: "AI Optimization failed" });
      }

      try {
        const rawAiResult = JSON.parse(stdout);

        // Map Kaggle 10 categories → App 8 categories
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

        // CRITICAL: Scale predictions so total never exceeds budget ceiling
        const rawTotal = Object.values(mappedResults).reduce((s, v) => s + v, 0);

        if (rawTotal > 0) {
          const scaleFactor = Math.min(1, budgetCeiling / rawTotal);
          for (const key of Object.keys(mappedResults)) {
            mappedResults[key] = Math.round(mappedResults[key] * scaleFactor);
          }
        }

        const cappedTotal = Object.values(mappedResults).reduce((s, v) => s + v, 0);
        console.log(`[AI Optimizer] Raw total: ${rawTotal.toFixed(0)} → Capped to: ${cappedTotal} (ceiling: ${budgetCeiling})`);

        res.json(mappedResults);
      } catch (e) {
        res.status(500).json({ message: "Failed to parse AI result" });
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
});
