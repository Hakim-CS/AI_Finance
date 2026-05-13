"""
control_evaluation.py
=============================================================================
Adaptive Budget Control Experiment

Compares 4 budget control strategies in a month-by-month simulation:
  1. Static Budget       — fixed % of income (open-loop)
  2. Last-Month Baseline — next budget = last month's spending (P-feedback)
  3. ML Prediction       — Gradient Boosting output as budget (feedforward)
  4. Adaptive Controller — ML + saving target + smoothing (closed-loop)

Research Question:
  Can an AI-assisted closed-loop budget controller reduce overspending
  and improve savings-target tracking compared with static and last-month
  budgeting under simulated spending disturbances?

Metrics:
  - Tracking Error:    |actual - budget| averaged (lower = better)
  - Savings Achievement: % of months saving target was met
  - Budget Stability:  month-to-month budget change (lower = smoother)
  - Overspending Rate: % of months where actual > budget

Output:
  - charts/control_comparison.png
  - charts/control_tracking.png
  - charts/control_savings.png
  - control_results.json

Usage: python control_evaluation.py

Author : Aura Finance Thesis Project
Date   : May 2026
=============================================================================
"""

import os, json, warnings
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error

warnings.filterwarnings('ignore')

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# =============================================================================
# CONFIG
# =============================================================================
CATEGORIES = ["food", "transport", "shopping", "entertainment",
              "utilities", "health", "travel", "other"]

# Default allocation percentages for static budget
STATIC_ALLOC = {
    "food": 0.25, "transport": 0.10, "shopping": 0.12,
    "entertainment": 0.08, "utilities": 0.18, "health": 0.08,
    "travel": 0.07, "other": 0.12,
}

AI_DIR     = os.path.dirname(os.path.abspath(__file__))
CHARTS_DIR = os.path.join(AI_DIR, "charts")
os.makedirs(CHARTS_DIR, exist_ok=True)

plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams.update({'font.size': 11, 'figure.dpi': 150, 'figure.facecolor': 'white'})

COLORS = {
    'static': '#94a3b8',
    'lastmonth': '#f59e0b',
    'ml': '#6366f1',
    'adaptive': '#10b981',
}

# =============================================================================
# DATA LOADING
# =============================================================================
def load_data():
    path = os.path.join(AI_DIR, "monthly_summary.csv")
    df = pd.read_csv(path)
    df = df.sort_values(["user_id", "year", "month"]).reset_index(drop=True)

    for cat in CATEGORIES:
        df[f"prev_{cat}"] = df.groupby("user_id")[cat].shift(1)
    df["prev_total"] = df.groupby("user_id")["total_spent"].shift(1)
    df = df.dropna().reset_index(drop=True)
    return df


def train_gb_models(X_train, y_train):
    """Train one GB model per category."""
    models = {}
    for cat in CATEGORIES:
        gb = GradientBoostingRegressor(
            n_estimators=100, max_depth=4, min_samples_leaf=3,
            learning_rate=0.1, random_state=42)
        gb.fit(X_train, y_train[cat])
        models[cat] = gb
    return models


# =============================================================================
# BUDGET STRATEGIES
# =============================================================================
def strategy_static(income, saving_target, **_):
    """Fixed percentage allocation. Open-loop — ignores all feedback."""
    ceiling = income - saving_target
    return {cat: ceiling * pct for cat, pct in STATIC_ALLOC.items()}


def strategy_last_month(prev_spending, income, saving_target, **_):
    """Next budget = exactly what was spent last month, scaled to ceiling."""
    ceiling = income - saving_target
    total = sum(prev_spending.values())
    if total <= 0:
        return strategy_static(income, saving_target)
    scale = ceiling / total
    return {cat: prev_spending[cat] * scale for cat, pct in STATIC_ALLOC.items()}


def strategy_ml(models, features_df, income, saving_target, **_):
    """Pure ML prediction as budget, scaled to ceiling."""
    ceiling = income - saving_target
    preds = {}
    for cat in CATEGORIES:
        preds[cat] = max(0, float(models[cat].predict(features_df)[0]))
    total = sum(preds.values())
    if total <= 0:
        return strategy_static(income, saving_target)
    scale = ceiling / total
    return {cat: preds[cat] * scale for cat, pct in STATIC_ALLOC.items()}


def strategy_adaptive(models, features_df, income, saving_target,
                       prev_budget, alpha=0.7, **_):
    """
    Closed-loop adaptive controller.

    predicted  = ML model output
    smoothed   = alpha * previous_budget + (1-alpha) * predicted
    final      = scale so total <= income - saving_target

    The smoothing prevents large budget jumps month-to-month.
    alpha=0.7 means 70% weight on previous budget, 30% on new prediction.
    """
    ceiling = income - saving_target

    # Get raw ML predictions
    preds = {}
    for cat in CATEGORIES:
        preds[cat] = max(0, float(models[cat].predict(features_df)[0]))

    # Apply exponential smoothing
    smoothed = {}
    for cat in CATEGORIES:
        if prev_budget and cat in prev_budget:
            smoothed[cat] = alpha * prev_budget[cat] + (1 - alpha) * preds[cat]
        else:
            smoothed[cat] = preds[cat]

    # Scale to fit within ceiling
    total = sum(smoothed.values())
    if total <= 0:
        return strategy_static(income, saving_target)
    scale = ceiling / total
    return {cat: smoothed[cat] * scale for cat in CATEGORIES}


# =============================================================================
# SIMULATION
# =============================================================================
def run_simulation(df, models, feature_cols):
    """
    Run month-by-month simulation on test data (year 2025).

    For each month, each strategy produces a per-category budget.
    We compare the budget against actual spending to measure control quality.

    Metrics (all measured PER-CATEGORY to differentiate strategies):
      - Tracking Error: avg |actual_cat - budget_cat| across all categories
      - Overspending: count of (category, month) pairs where actual > budget
      - Savings Headroom: how much total budget is below income - saving_target
      - Stability: avg change in budget vector between consecutive months
    """
    test_df = df[df["year"] == 2025].copy()
    print(f"  Simulating {len(test_df)} test months across {test_df['user_id'].nunique()} users")

    results = {name: {
        "tracking_errors": [],        # per-month avg |actual-budget|
        "cat_overspend_count": 0,     # categories where actual > budget
        "cat_overspend_total": 0,     # total category-months evaluated
        "surplus_amounts": [],        # income - budget_total (headroom)
        "budget_vectors": [],         # list of budget dicts for stability calc
        "total_months": 0,
    } for name in ["static", "lastmonth", "ml", "adaptive"]}

    # Track previous budgets per user for adaptive controller
    prev_budgets = {}    # user_id -> dict
    prev_budget_by = {}  # (strategy, user_id) -> previous budget vector

    for _, row in test_df.iterrows():
        uid = row["user_id"]
        income = row["income"]
        saving_target = income * 0.15  # 15% saving target

        # Build actual spending
        actual = {cat: row[cat] for cat in CATEGORIES}

        # Build previous month spending
        prev_spending = {cat: row[f"prev_{cat}"] for cat in CATEGORIES}

        # Build feature vector for ML
        features = {col: row[col] for col in feature_cols}
        features_df = pd.DataFrame([features])[feature_cols]

        # Run all 4 strategies
        budgets = {
            "static":    strategy_static(income, saving_target),
            "lastmonth": strategy_last_month(prev_spending, income, saving_target),
            "ml":        strategy_ml(models, features_df, income, saving_target),
            "adaptive":  strategy_adaptive(models, features_df, income, saving_target,
                                           prev_budgets.get(uid)),
        }

        # Update adaptive controller's memory
        prev_budgets[uid] = budgets["adaptive"]

        # Evaluate each strategy
        for name, budget in budgets.items():
            budget_total = sum(budget.values())

            # 1. Tracking error: avg |actual_cat - budget_cat|
            cat_errors = [abs(actual[cat] - budget[cat]) for cat in CATEGORIES]
            results[name]["tracking_errors"].append(np.mean(cat_errors))

            # 2. Per-category overspending: how many categories went over budget?
            for cat in CATEGORIES:
                results[name]["cat_overspend_total"] += 1
                if actual[cat] > budget[cat] * 1.05:  # 5% tolerance
                    results[name]["cat_overspend_count"] += 1

            # 3. Surplus: how much headroom does the budget leave for savings?
            results[name]["surplus_amounts"].append(income - budget_total)

            # 4. Stability: L1 distance between this and previous budget vector
            key = (name, uid)
            if key in prev_budget_by:
                old = prev_budget_by[key]
                delta = sum(abs(budget[cat] - old[cat]) for cat in CATEGORIES)
                results[name]["budget_vectors"].append(delta)
            prev_budget_by[key] = budget

            results[name]["total_months"] += 1

    return results


# =============================================================================
# CHARTS
# =============================================================================
def generate_charts(results):
    n_months = results["static"]["total_months"]
    names = ["static", "lastmonth", "ml", "adaptive"]
    labels = ["Static\nBudget", "Last-Month\nBaseline", "ML\nPrediction", "Adaptive\nController"]
    colors = [COLORS[n] for n in names]

    # --- Chart 1: 4-panel Control Comparison ---
    fig, axes = plt.subplots(1, 4, figsize=(16, 5))

    # 1a: Average Tracking Error
    ax = axes[0]
    vals = [np.mean(results[n]["tracking_errors"]) for n in names]
    bars = ax.bar(labels, vals, color=colors, edgecolor='white', linewidth=1.5)
    for bar, v in zip(bars, vals):
        ax.text(bar.get_x() + bar.get_width()/2, v + 5, f'${v:.0f}',
                ha='center', fontweight='bold', fontsize=10)
    ax.set_ylabel("Avg Tracking Error ($)")
    ax.set_title("Tracking Accuracy", fontweight='bold')
    ax.grid(axis='y', alpha=0.3)

    # 1b: Category Overspending Rate
    ax = axes[1]
    vals = [results[n]["cat_overspend_count"] / max(results[n]["cat_overspend_total"], 1) * 100
            for n in names]
    bars = ax.bar(labels, vals, color=colors, edgecolor='white', linewidth=1.5)
    for bar, v in zip(bars, vals):
        ax.text(bar.get_x() + bar.get_width()/2, v + 1, f'{v:.0f}%',
                ha='center', fontweight='bold', fontsize=10)
    ax.set_ylabel("Category Overspend Rate (%)")
    ax.set_title("Per-Category Overspending", fontweight='bold')
    ax.set_ylim(0, 100)
    ax.grid(axis='y', alpha=0.3)

    # 1c: Average Savings Headroom
    ax = axes[2]
    vals = [np.mean(results[n]["surplus_amounts"]) for n in names]
    bars = ax.bar(labels, vals, color=colors, edgecolor='white', linewidth=1.5)
    for bar, v in zip(bars, vals):
        ax.text(bar.get_x() + bar.get_width()/2, v + 20, f'${v:.0f}',
                ha='center', fontweight='bold', fontsize=10)
    ax.set_ylabel("Avg Savings Headroom ($)")
    ax.set_title("Savings Headroom", fontweight='bold')
    ax.grid(axis='y', alpha=0.3)

    # 1d: Budget Stability (lower = smoother)
    ax = axes[3]
    vals = [np.mean(results[n]["budget_vectors"]) if results[n]["budget_vectors"] else 0
            for n in names]
    bars = ax.bar(labels, vals, color=colors, edgecolor='white', linewidth=1.5)
    for bar, v in zip(bars, vals):
        ax.text(bar.get_x() + bar.get_width()/2, v + 5, f'${v:.0f}',
                ha='center', fontweight='bold', fontsize=10)
    ax.set_ylabel("Avg Budget Change ($)")
    ax.set_title("Budget Stability", fontweight='bold')
    ax.grid(axis='y', alpha=0.3)

    fig.suptitle("Experiment: Adaptive Budget Control — 4-Method Comparison",
                 fontweight='bold', fontsize=14, y=1.02)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "control_comparison.png"), bbox_inches='tight')
    plt.close()
    print("    [OK] charts/control_comparison.png")

    # --- Chart 2: Tracking Error Over Time ---
    fig, ax = plt.subplots(figsize=(12, 5))
    for name, label, color in zip(names, labels, colors):
        errors = results[name]["tracking_errors"]
        ax.plot(range(len(errors)), errors, '-o', color=color,
                label=label.replace('\n', ' '),
                linewidth=2, markersize=4, alpha=0.8)
    ax.set_xlabel("Test Month Index", fontweight='bold')
    ax.set_ylabel("Tracking Error ($)", fontweight='bold')
    ax.set_title("Tracking Error Over Time — All Strategies", fontweight='bold', fontsize=14)
    ax.legend(fontsize=10)
    ax.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "control_tracking.png"), bbox_inches='tight')
    plt.close()
    print("    [OK] charts/control_tracking.png")

    # --- Chart 3: Summary Table ---
    fig, ax = plt.subplots(figsize=(13, 3))
    ax.axis('off')
    header = ["Strategy", "Tracking\nError ($)", "Cat. Overspend\nRate (%)",
              "Savings\nHeadroom ($)", "Budget\nStability ($)"]
    table_data = [header]
    for name, label in zip(names, ["Static Budget", "Last-Month Baseline",
                                    "ML Prediction", "Adaptive Controller"]):
        te = np.mean(results[name]["tracking_errors"])
        osr = results[name]["cat_overspend_count"] / max(results[name]["cat_overspend_total"], 1) * 100
        sh = np.mean(results[name]["surplus_amounts"])
        bs = np.mean(results[name]["budget_vectors"]) if results[name]["budget_vectors"] else 0
        table_data.append([label, f"${te:.1f}", f"{osr:.0f}%", f"${sh:.0f}", f"${bs:.0f}"])

    table = ax.table(cellText=table_data, loc='center', cellLoc='center')
    table.auto_set_font_size(False)
    table.set_fontsize(11)
    table.scale(1, 1.8)
    for j in range(5):
        table[(0, j)].set_facecolor('#1e293b')
        table[(0, j)].set_text_props(color='white', fontweight='bold')
    # Highlight best row (ML or Adaptive — whichever has lowest tracking error)
    best_idx = 1 + np.argmin([np.mean(results[n]["tracking_errors"]) for n in names])
    for j in range(5):
        table[(best_idx, j)].set_facecolor('#ecfdf5')
        table[(best_idx, j)].set_text_props(fontweight='bold')

    ax.set_title("Budget Control Strategy Comparison — Summary",
                 fontweight='bold', fontsize=14, pad=20)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "control_summary.png"), bbox_inches='tight')
    plt.close()
    print("    [OK] charts/control_summary.png")


# =============================================================================
# MAIN
# =============================================================================
def main():
    print("=" * 65)
    print("  AURA FINANCE — Adaptive Budget Control Experiment")
    print("=" * 65)

    # Load data
    print("\n[1/4] Loading data...")
    df = load_data()
    feature_cols = ["income", "month"] + [f"prev_{cat}" for cat in CATEGORIES] + ["prev_total"]
    X = df[feature_cols]
    y = df[CATEGORIES]

    train_mask = df["year"] <= 2024
    X_train, y_train = X[train_mask], y[train_mask]
    print(f"  Train: {len(X_train)} rows | Test: {(~train_mask).sum()} rows")

    # Train GB models
    print("\n[2/4] Training Gradient Boosting models...")
    models = train_gb_models(X_train, y_train)
    print(f"  Trained {len(models)} category models")

    # Run simulation
    print("\n[3/4] Running month-by-month simulation...")
    results = run_simulation(df, models, feature_cols)

    # Print results table
    n = results["static"]["total_months"]
    print(f"\n  Results ({n} simulated months):")
    print("  " + "-" * 75)
    print(f"  {'Strategy':<22} {'Track.Err':>10} {'CatOverspend':>13} {'Headroom':>10} {'Stability':>10}")
    print("  " + "-" * 75)
    for name, label in [("static", "Static Budget"),
                         ("lastmonth", "Last-Month"),
                         ("ml", "ML Prediction"),
                         ("adaptive", "Adaptive Controller")]:
        te = np.mean(results[name]["tracking_errors"])
        osr = results[name]["cat_overspend_count"] / max(results[name]["cat_overspend_total"], 1) * 100
        sh = np.mean(results[name]["surplus_amounts"])
        bs = np.mean(results[name]["budget_vectors"]) if results[name]["budget_vectors"] else 0
        marker = " <-- best" if te == min(np.mean(results[x]["tracking_errors"]) for x in ["static","lastmonth","ml","adaptive"]) else ""
        print(f"  {label:<22} ${te:>8.1f} {osr:>12.0f}% ${sh:>8.0f} ${bs:>8.0f}{marker}")
    print("  " + "-" * 75)

    # Generate charts
    print("\n[4/4] Generating charts...")
    generate_charts(results)

    # Save results
    clean = {}
    for name in ["static", "lastmonth", "ml", "adaptive"]:
        r = results[name]
        clean[name] = {
            "avg_tracking_error": round(np.mean(r["tracking_errors"]), 2),
            "cat_overspend_rate_pct": round(r["cat_overspend_count"] / max(r["cat_overspend_total"], 1) * 100, 1),
            "avg_savings_headroom": round(np.mean(r["surplus_amounts"]), 2),
            "avg_budget_stability": round(np.mean(r["budget_vectors"]) if r["budget_vectors"] else 0, 2),
            "total_months": n,
        }

    out_path = os.path.join(AI_DIR, "control_results.json")
    with open(out_path, "w") as f:
        json.dump(clean, f, indent=2)
    print(f"\n  [OK] Results saved to: {out_path}")

    print("\n" + "=" * 65)
    print("  COMPLETE!")
    print("    charts/control_comparison.png")
    print("    charts/control_tracking.png")
    print("    charts/control_summary.png")
    print("    control_results.json")
    print("=" * 65)


if __name__ == "__main__":
    main()

