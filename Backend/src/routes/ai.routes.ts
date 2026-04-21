import { Router } from 'express';
import { pool } from '../config/database';
import { protect } from '../middleware/auth';
import { predictWithLSTM } from '../services/ai.service';

export const aiRoutes = Router();

// ── GET /ai/insights ────────────────────────────────────────────────────────

aiRoutes.get('/ai/insights', protect, async (req, res) => {
  const userId = req.user?.id;
  console.log(`[AI Insights] Request started for User: ${userId}`);
  try {
    // 1. Fetch Expenses & User Income
    const expResult = await pool.query(
      'SELECT amount, "categoryId", description, date FROM "Expense" WHERE "userId" = $1 ORDER BY date DESC',
      [userId]
    );
    console.log(`[AI Insights] Fetched ${expResult.rows.length} expenses`);
    const userResult = await pool.query('SELECT income FROM "User" WHERE id = $1', [userId]);
    console.log(`[AI Insights] Fetched user income: ${userResult.rows[0]?.income}`);

    const expenses = expResult.rows || [];
    const income = Number(userResult.rows[0]?.income) || 0;

    if (expenses.length === 0) {
      console.log(`[AI Insights] No expenses found for user ${userId}, returning tip`);
      return res.json([
        {
          type: "tip",
          title: "Get Started",
          description: "Add your first few expenses to unlock personalized AI insights and spending analysis.",
          confidence: 100,
          actionLabel: "Add Expense"
        }
      ]);
    }

    const insights: any[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 2. ANALYZE: Monthly Totals
    const currentMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const currentTotal = currentMonthExpenses.reduce((acc, e) => acc + Number(e.amount), 0);

    // 3. INSIGHT: Spending Velocity / Forecast
    if (currentMonthExpenses.length > 5) {
      const dayOfMonth = now.getDate();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const projectedTotal = (currentTotal / dayOfMonth) * daysInMonth;
      const remaining = income - projectedTotal;

      if (remaining > 0) {
        insights.push({
          type: "prediction",
          title: "End-of-Month Forecast",
          description: `Based on your spending velocity, you're on track to have ${remaining.toFixed(0)} remaining by month end.`,
          value: remaining.toFixed(0),
          confidence: 85,
          trend: { value: Math.round((remaining / income) * 100), isPositive: true }
        });
      } else if (income > 0) {
        insights.push({
          type: "warning",
          title: "Over-Budget Prediction",
          description: `You are on pace to exceed your income by ${Math.abs(remaining).toFixed(0)}. Consider reducing non-essential spending.`,
          value: Math.abs(remaining).toFixed(0),
          confidence: 92,
          actionLabel: "View Budget"
        });
      }
    }

    // 4. ANALYZE: Category Shifts (Current vs Last Month)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthExpenses = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });

    const getCategoryTotals = (exps: any[]) => exps.reduce((acc, e) => {
      acc[e.categoryId] = (acc[e.categoryId] || 0) + Number(e.amount);
      return acc;
    }, {} as Record<string, number>);

    const currentCatTotals = getCategoryTotals(currentMonthExpenses);
    const lastCatTotals = getCategoryTotals(lastMonthExpenses);

    for (const [catId, currentAmtValue] of Object.entries(currentCatTotals)) {
      const currentAmt = currentAmtValue as number;
      const lastAmt = lastCatTotals[catId] || 0;
      if (lastAmt > 0) {
        const percentChange = ((currentAmt - lastAmt) / lastAmt) * 100;
        if (Math.abs(percentChange) > 20) {
          insights.push({
            type: "trend",
            title: `${catId.charAt(0).toUpperCase() + catId.slice(1)} Spending Shift`,
            description: `Your ${catId} spending has ${percentChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(percentChange).toFixed(0)}% compared to last month.`,
            confidence: 90,
            trend: { value: Math.abs(Math.round(percentChange)), isPositive: percentChange < 0 }
          });
        }
      }
    }

    // 5. INSIGHT: Unusual Activity (Anomaly Detection)
    // Simple anomaly: transaction > 2.5x the average for that category
    const categoryAverages: Record<string, { sum: number, count: number }> = {};
    expenses.forEach(e => {
      if (!categoryAverages[e.categoryId]) categoryAverages[e.categoryId] = { sum: 0, count: 0 };
      categoryAverages[e.categoryId].sum += Number(e.amount);
      categoryAverages[e.categoryId].count += 1;
    });

    const recentAnomalies = currentMonthExpenses.filter(e => {
      const avg = categoryAverages[e.categoryId].sum / categoryAverages[e.categoryId].count;
      return Number(e.amount) > avg * 2.5 && Number(e.amount) > 200; // Only flag if > 200 units
    });

    if (recentAnomalies.length > 0) {
      insights.push({
        type: "warning",
        title: "Large Transaction Detected",
        description: `We noticed an unusual ${Number(recentAnomalies[0].amount).toFixed(0)} purchase in '${recentAnomalies[0].categoryId}'. Was this expected?`,
        confidence: 88,
        actionLabel: "Verify"
      });
    }

    // 6. INSIGHT: Subscription Detection
    const descriptionCounts: Record<string, { amounts: number[], count: number }> = {};
    expenses.forEach(e => {
      const desc = e.description.toLowerCase().trim();
      if (!descriptionCounts[desc]) descriptionCounts[desc] = { amounts: [], count: 0 };
      descriptionCounts[desc].amounts.push(Number(e.amount));
      descriptionCounts[desc].count += 1;
    });

    const subscriptions = Object.entries(descriptionCounts).filter(([desc, data]) => {
      // Check if it appears multiple times with similar amounts (within 5% range)
      if (data.count < 2) return false;
      const avg = data.amounts.reduce((a, b) => a + b) / data.count;
      return data.amounts.every(a => Math.abs(a - avg) < avg * 0.05);
    });

    if (subscriptions.length > 0) {
      const sub = subscriptions[0];
      insights.push({
        type: "tip",
        title: "Subscription Identified",
        description: `AI detected recurring payments for '${sub[0]}'. You've spent ${(sub[1].amounts.reduce((a, b) => a + b)).toFixed(0)} on this total.`,
        value: `${(sub[1].amounts[0]).toFixed(0)}/mo`,
        confidence: 95,
        actionLabel: "Manage"
      });
    }

    // 7. Achievement: Low Spending Streak
    const last7Days = expenses.filter(e => {
      const d = new Date(e.date);
      const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
      return diff <= 7;
    });
    if (last7Days.length > 0 && last7Days.reduce((acc, e) => acc + Number(e.amount), 0) < income * 0.05) {
      insights.push({
        type: "achievement",
        title: "Frugal Week!",
        description: "You've spent less than 5% of your income in the last 7 days. Keep it up!",
        confidence: 100,
        trend: { value: 7, isPositive: true }
      });
    }

    // Shuffle and limit to 6
    const finalInsights = insights.sort(() => 0.5 - Math.random()).slice(0, 6);

    // Ensure we have at least 1-2 default tips if list is short
    if (finalInsights.length < 2 && income > 0) {
      finalInsights.push({
        type: "action",
        title: "Smart Savings Opportunity",
        description: `Based on your income, setting aside ${(income * 0.1).toFixed(0)} (10%) right now would bolster your safety net.`,
        value: (income * 0.1).toFixed(0),
        confidence: 80,
        actionLabel: "Save Now"
      });
    }

    res.json(finalInsights);

  } catch (error: any) {
    console.error(`[AI Insights Error]`, error);
    res.status(500).json({ message: 'Error generating insights', details: error.message });
  }
});

// ── GET /ai/budget-predictions ──────────────────────────────────────────────

aiRoutes.get('/ai/budget-predictions', protect, async (req, res) => {
  const userId = req.user?.id;

  // Income-proportional default allocation percentages (total = 80%, 20% left for savings)
  const DEFAULT_PERCENTAGES: Record<string, number> = {
    food: 0.25,           // 25%
    utilities: 0.20,      // 20%
    transport: 0.10,      // 10%
    shopping: 0.08,       // 8%
    entertainment: 0.05,  // 5%
    health: 0.05,         // 5%
    travel: 0.05,         // 5%
    other: 0.02,          // 2%
  };

  try {
    // 0. Fetch user income + saving target
    const userRes = await pool.query('SELECT income, saving_target FROM "User" WHERE id = $1', [userId]);
    const income = Number(userRes.rows[0]?.income) || 0;
    const savingTarget = Number(userRes.rows[0]?.saving_target) || 0;

    if (income <= 0) {
      return res.json([]); // No income set — can't make meaningful predictions
    }

    // Allocatable budget = income minus saving target
    const allocatable = Math.max(0, income - savingTarget);

    // Build budget limits: start from income-proportional defaults
    const userLimits: Record<string, number> = {};
    for (const [catId, pct] of Object.entries(DEFAULT_PERCENTAGES)) {
      userLimits[catId] = Math.round(allocatable * pct);
    }

    // Override with user's custom budget limits if they've set them
    const budgetResult = await pool.query('SELECT "categoryId", "limitAmount" FROM "Budget" WHERE "userId" = $1', [userId]);
    budgetResult.rows.forEach(row => {
      userLimits[row.categoryId] = Number(row.limitAmount);
    });

    // CRITICAL: Cap total budget allocations to never exceed income
    const totalBudget = Object.values(userLimits).reduce((s, v) => s + v, 0);
    if (totalBudget > income && income > 0) {
      const scaleFactor = income / totalBudget;
      for (const key in userLimits) {
        userLimits[key] = Math.round(userLimits[key] * scaleFactor);
      }
    }

    // Fetch ALL expenses (for historical context)
    const expResult = await pool.query(
      'SELECT amount, "categoryId", date FROM "Expense" WHERE "userId" = $1 ORDER BY date DESC',
      [userId]
    );
    const expenses = expResult.rows;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const dayOfMonth = Math.max(1, now.getDate());
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 1. Current Month Spending per Category
    const currentMonthExps = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const currentCatTotals: Record<string, number> = {};
    currentMonthExps.forEach(e => {
      const catId = e.categoryId;
      currentCatTotals[catId] = (currentCatTotals[catId] || 0) + Number(e.amount);
    });

    // 2. Last Month Spending (fallback for new-month predictions)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const lastMonthExps = expenses.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
    });
    const lastCatTotals: Record<string, number> = {};
    lastMonthExps.forEach(e => {
      const catId = e.categoryId;
      lastCatTotals[catId] = (lastCatTotals[catId] || 0) + Number(e.amount);
    });

    // DATA VOLUME: How many expenses does the user actually have this month?
    const currentMonthCount = currentMonthExps.length;
    const hasCurrentData = currentMonthCount >= 3;        // meaningful velocity data
    const hasHistoricalData = lastMonthExps.length >= 3;  // meaningful historical baseline

    // 3. Generate Predictions
    const predictions = Object.entries(userLimits).map(([catId, budgetLimit]) => {
      const spentSoFar = currentCatTotals[catId] || 0;
      const lastMonthSpent = lastCatTotals[catId] || 0;

      // PREDICTION STRATEGY:
      // A) If we have current-month data → velocity extrapolation
      // B) If we only have last month data → use that as baseline
      // C) If no data at all → return budget limit as predicted (defer to budget)
      let predictedSpend: number;
      let predictionBasis: string;

      if (spentSoFar > 0 && hasCurrentData) {
        // Strategy A: Velocity-based projection from current month
        predictedSpend = Math.round((spentSoFar / dayOfMonth) * daysInMonth);
        predictionBasis = "velocity";
      } else if (lastMonthSpent > 0 && hasHistoricalData) {
        // Strategy B: Use last month as baseline estimate
        predictedSpend = Math.round(lastMonthSpent);
        predictionBasis = "historical";
      } else {
        // Strategy C: No data — predicted spend is 0 (honest)
        predictedSpend = 0;
        predictionBasis = "none";
      }

      // Risk assessment
      let riskLevel: "low" | "medium" | "high" = "low";
      let suggestion: string;

      const percentOfBudget = budgetLimit > 0 ? (predictedSpend / budgetLimit) * 100 : 0;

      if (predictionBasis === "none") {
        // ── NO DATA: Give helpful onboarding guidance, not fake insights ──
        riskLevel = "low";
        suggestion = `Budget set to ${budgetLimit.toLocaleString()}. Start adding expenses to get personalized predictions.`;
      } else if (percentOfBudget > 110) {
        riskLevel = "high";
        const overAmount = predictedSpend - budgetLimit;
        suggestion = `Projected ${overAmount.toLocaleString()} over budget. Consider reducing ${catId} spending.`;

        // Category-specific tips for high-risk items
        if (catId === "food") suggestion = "Try cooking at home more often to lower your food costs.";
        if (catId === "shopping") suggestion = "Avoid impulse buys. Wait 24 hours before any new shopping.";
        if (catId === "transport") suggestion = "Look for cheaper transport options or carpool this week.";
        if (catId === "entertainment") suggestion = "Consider free activities or pause subscriptions this month.";
        if (catId === "utilities") suggestion = "Review recurring bills for savings opportunities.";
      } else if (percentOfBudget > 80) {
        riskLevel = "medium";
        suggestion = `Nearing the limit. Watch your ${catId} purchases for the rest of the month.`;
      } else if (spentSoFar > 0) {
        riskLevel = "low";
        const savedAmount = budgetLimit - predictedSpend;
        suggestion = `On track to save ${savedAmount.toLocaleString()} in this category this month.`;
      } else {
        riskLevel = "low";
        suggestion = `No ${catId} spending recorded yet this month.`;
      }

      // CONFIDENCE: Factor in BOTH data volume AND month progress
      // Data factor (0-60): based on actual number of expenses in this category
      const catExpenseCount = currentMonthExps.filter(e => e.categoryId === catId).length;
      const dataFactor = Math.min(60, catExpenseCount * 12); // 5 expenses = 60%
      // Time factor (0-38): how far into the month we are
      const timeFactor = Math.round((dayOfMonth / daysInMonth) * 38);
      // Confidence = data weight + time weight (max 98%)
      const confidence = predictionBasis === "none"
        ? 0   // Honest: 0% confidence when we have NO data
        : Math.min(98, dataFactor + timeFactor);

      return {
        category: catId.charAt(0).toUpperCase() + catId.slice(1),
        predictedSpend: Math.max(spentSoFar, predictedSpend),
        budgetLimit,
        confidence: parseFloat(confidence.toFixed(1)),
        riskLevel,
        suggestion
      };
    });

    // Sort by risk (high first) then by predicted amount
    predictions.sort((a, b) => {
      const riskMap = { high: 3, medium: 2, low: 1 };
      if (riskMap[a.riskLevel] !== riskMap[b.riskLevel]) {
        return riskMap[b.riskLevel] - riskMap[a.riskLevel];
      }
      return b.predictedSpend - a.predictedSpend;
    });

    res.json(predictions.slice(0, 4));

  } catch (error: any) {
    console.error(`[AI Budget Prediction Error]`, error);
    res.status(500).json({ message: 'Error generating budget predictions' });
  }
});

// ── GET /expenses/forecast — LSTM/RNN spending forecast ─────────────────────

aiRoutes.get('/expenses/forecast', protect, async (req, res) => {
  const userId = req.user?.id;
  console.log(`[Forecast] Request started for User: ${userId}`);

  try {
    const result = await pool.query(
      'SELECT amount, date FROM "Expense" WHERE "userId" = $1 ORDER BY date ASC',
      [userId]
    );

    const expenses = result.rows;
    const monthlyTotals: Record<string, number> = {};

    expenses.forEach(exp => {
      const date = new Date(exp.date);
      if (!isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + Number(exp.amount);
      }
    });

    const history = Object.entries(monthlyTotals)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const n = history.length;

    // safety check for metadata
    if (n === 0) {
      return res.json({ prediction: 0, trend: "stable", confidence: 0, historyCount: 0 });
    }

    if (n < 2) {
      return res.json({
        prediction: history[0].amount,
        trend: "neutral",
        confidence: 30,
        historyCount: n,
        message: "Need 2+ months for AI"
      });
    }

    const amounts = history.map(h => h.amount);
    const lastAmount = amounts[n - 1];
    let prediction = 0;
    let usedFallback = false;

    try {
      // attempt LSTM/RNN — pass userId so the cache can be used
      prediction = await predictWithLSTM(amounts, userId);
      if (prediction <= (lastAmount * 0.1) || isNaN(prediction)) throw new Error("AI Outlier");
    } catch (aiError) {
      // fallback  Linear Regression / Trend Growth
      usedFallback = true;
      const firstAmount = amounts[0];
      const avgGrowthPerMonth = (lastAmount - firstAmount) / (n - 1);
      prediction = Math.max(lastAmount * 0.7, lastAmount + avgGrowthPerMonth);
      console.log(`[Forecast] AI failed or gave 0, using Trend Fallback: ${prediction}`);
    }

    const trend = prediction > lastAmount ? "increasing" : prediction < lastAmount ? "decreasing" : "stable";
    const confidence = Math.min(95, 40 + (n * 8));

    res.json({
      prediction: parseFloat(prediction.toFixed(2)),
      trend,
      confidence,
      historyCount: n,
      modelUsed: usedFallback ? "Trend Regression" : (n > 5 ? "LSTM" : "SimpleRNN")
    });

  } catch (error: any) {
    console.error(`[Forecast Fatal Error]`, error);
    res.status(500).json({ message: 'Internal AI Error', historyCount: 0, confidence: 0 });
  }
});
