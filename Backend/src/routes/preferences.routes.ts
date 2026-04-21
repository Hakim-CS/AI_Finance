import { Router } from 'express';
import { pool } from '../config/database';
import { protect } from '../middleware/auth';

export const preferencesRoutes = Router();

// GET /auth/preferences — load theme, currency, language, notification toggles
preferencesRoutes.get('/auth/preferences', protect, async (req, res) => {
  try {
    // Upsert a default row if one doesn't exist yet
    await pool.query(
      `INSERT INTO "UserPreferences" ("userId") VALUES ($1) ON CONFLICT ("userId") DO NOTHING`,
      [req.user!.id]
    );
    const result = await pool.query(
      `SELECT theme, currency, language,
              notif_email, notif_budget_alerts, notif_weekly_report, notif_ai_insights
       FROM "UserPreferences" WHERE "userId" = $1`,
      [req.user!.id]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching preferences', details: error.message });
  }
});

// PUT /auth/preferences — save theme, currency, language, notification toggles
preferencesRoutes.put('/auth/preferences', protect, async (req, res) => {
  const {
    theme, currency, language,
    notif_email, notif_budget_alerts, notif_weekly_report, notif_ai_insights
  } = req.body;

  try {
    // UPSERT: create the row if missing, otherwise update all provided fields
    const result = await pool.query(
      `INSERT INTO "UserPreferences"
         ("userId", theme, currency, language,
          notif_email, notif_budget_alerts, notif_weekly_report, notif_ai_insights,
          updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
       ON CONFLICT ("userId") DO UPDATE SET
         theme               = COALESCE(EXCLUDED.theme,               "UserPreferences".theme),
         currency            = COALESCE(EXCLUDED.currency,            "UserPreferences".currency),
         language            = COALESCE(EXCLUDED.language,            "UserPreferences".language),
         notif_email         = COALESCE(EXCLUDED.notif_email,         "UserPreferences".notif_email),
         notif_budget_alerts = COALESCE(EXCLUDED.notif_budget_alerts, "UserPreferences".notif_budget_alerts),
         notif_weekly_report = COALESCE(EXCLUDED.notif_weekly_report, "UserPreferences".notif_weekly_report),
         notif_ai_insights   = COALESCE(EXCLUDED.notif_ai_insights,   "UserPreferences".notif_ai_insights),
         updated_at          = CURRENT_TIMESTAMP
       RETURNING *`,
      [
        req.user!.id,
        theme   ?? 'system',
        currency ?? 'TRY',
        language ?? 'en',
        notif_email         ?? true,
        notif_budget_alerts ?? true,
        notif_weekly_report ?? true,
        notif_ai_insights   ?? true,
      ]
    );
    console.log(`[Preferences] Saved for user ${req.user!.id}`);
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ message: 'Error saving preferences', details: error.message });
  }
});
