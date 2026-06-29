"""
event_level_budget_guard.py
=============================================================================
Event-Level Budget Guard Simulation

This script adds a software-only, Mechatronics-inspired feedback experiment.
It uses transaction-level 2025 records to simulate a budget guard that updates
risk state after each expense event.

Purpose:
  Strengthen the thesis framing by moving beyond monthly-only control.

Loop:
  transaction -> update spending state -> project month-end category spending
              -> issue warning/control signal if budget risk is high

This is not real user validation. It is a transaction-level software-in-the-loop
experiment using the existing synthetic transaction data.

Outputs:
  - event_level_control_results.json
  - charts/event_level_guard_summary.png

Usage:
  python event_level_budget_guard.py
=============================================================================
"""

import calendar
import json
import os
from collections import defaultdict

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor


CATEGORIES = [
    "food", "transport", "shopping", "entertainment",
    "utilities", "health", "travel", "other",
]

STATIC_ALLOC = {
    "food": 0.25,
    "transport": 0.10,
    "shopping": 0.12,
    "entertainment": 0.08,
    "utilities": 0.18,
    "health": 0.08,
    "travel": 0.07,
    "other": 0.12,
}

AI_DIR = os.path.dirname(os.path.abspath(__file__))
CHARTS_DIR = os.path.join(AI_DIR, "charts")
os.makedirs(CHARTS_DIR, exist_ok=True)

FEATURE_COLS = ["income", "month"] + [f"prev_{cat}" for cat in CATEGORIES] + ["prev_total"]


def load_monthly_data():
    path = os.path.join(AI_DIR, "monthly_summary.csv")
    df = pd.read_csv(path)
    df = df.sort_values(["user_id", "year", "month"]).reset_index(drop=True)
    for cat in CATEGORIES:
        df[f"prev_{cat}"] = df.groupby("user_id")[cat].shift(1)
    df["prev_total"] = df.groupby("user_id")["total_spent"].shift(1)
    return df.dropna().reset_index(drop=True)


def load_transaction_data():
    path = os.path.join(AI_DIR, "training_data.csv")
    df = pd.read_csv(path)
    df["date"] = pd.to_datetime(df["date"])
    df["year"] = df["date"].dt.year
    df["day"] = df["date"].dt.day
    return df.sort_values(["user_id", "date"]).reset_index(drop=True)


def train_models(monthly_df):
    train_df = monthly_df[monthly_df["year"] < 2025]
    x_train = train_df[FEATURE_COLS]
    models = {}
    for cat in CATEGORIES:
        model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=4,
            min_samples_leaf=3,
            learning_rate=0.1,
            random_state=42,
        )
        model.fit(x_train, train_df[cat])
        models[cat] = model
    return models


def scale_to_ceiling(values, ceiling):
    total = sum(values.values())
    if total <= 0:
        return values
    scale = ceiling / total
    return {cat: max(0.0, values[cat] * scale) for cat in CATEGORIES}


def static_budget(income, saving_target):
    ceiling = income - saving_target
    return {cat: ceiling * STATIC_ALLOC[cat] for cat in CATEGORIES}


def adaptive_budget(row, models, prev_budget, alpha=0.7):
    income = float(row["income"])
    saving_target = income * 0.15
    ceiling = income - saving_target
    features = pd.DataFrame([{col: row[col] for col in FEATURE_COLS}])[FEATURE_COLS]
    preds = {cat: max(0.0, float(models[cat].predict(features)[0])) for cat in CATEGORIES}

    if not prev_budget:
        return scale_to_ceiling(preds, ceiling)

    smoothed = {
        cat: alpha * prev_budget[cat] + (1 - alpha) * preds[cat]
        for cat in CATEGORIES
    }
    return scale_to_ceiling(smoothed, ceiling)


def simulate_event_guard(monthly_df, tx_df, risk_threshold=1.05):
    models = train_models(monthly_df)
    test_months = monthly_df[monthly_df["year"] == 2025].copy()
    prev_budget_by_user = {}

    summary = {
        "total_transactions": 0,
        "months_evaluated": int(len(test_months)),
        "category_months": int(len(test_months) * len(CATEGORIES)),
        "risk_threshold": risk_threshold,
        "breach_count": 0,
        "warning_count": 0,
        "caught_breaches": 0,
        "false_positive_warnings": 0,
        "avg_warning_lead_days": 0.0,
        "category_metrics": {},
    }

    category_stats = {
        cat: {
            "breaches": 0,
            "warnings": 0,
            "caught": 0,
            "false_positive": 0,
            "lead_days": [],
        }
        for cat in CATEGORIES
    }
    all_leads = []

    for _, row in test_months.iterrows():
        uid = int(row["user_id"])
        year = int(row["year"])
        month = int(row["month"])
        budget = adaptive_budget(row, models, prev_budget_by_user.get(uid))
        prev_budget_by_user[uid] = budget

        month_tx = tx_df[
            (tx_df["user_id"] == uid)
            & (tx_df["year"] == year)
            & (tx_df["month"] == month)
        ].copy()
        summary["total_transactions"] += int(len(month_tx))

        days_in_month = calendar.monthrange(year, month)[1]
        spent_so_far = {cat: 0.0 for cat in CATEGORIES}
        first_warning_day = {}

        for _, tx in month_tx.iterrows():
            cat = tx["category"]
            if cat not in CATEGORIES:
                cat = "other"
            spent_so_far[cat] += float(tx["amount"])
            day = int(tx["day"])

            projected = (spent_so_far[cat] / max(day, 1)) * days_in_month
            limit = budget[cat] * risk_threshold
            if projected > limit and cat not in first_warning_day:
                first_warning_day[cat] = day

        actual = {cat: float(row[cat]) for cat in CATEGORIES}
        for cat in CATEGORIES:
            breached = actual[cat] > budget[cat] * risk_threshold
            warned = cat in first_warning_day

            if breached:
                summary["breach_count"] += 1
                category_stats[cat]["breaches"] += 1
            if warned:
                summary["warning_count"] += 1
                category_stats[cat]["warnings"] += 1

            if breached and warned:
                lead = days_in_month - first_warning_day[cat]
                summary["caught_breaches"] += 1
                category_stats[cat]["caught"] += 1
                category_stats[cat]["lead_days"].append(lead)
                all_leads.append(lead)
            elif warned and not breached:
                summary["false_positive_warnings"] += 1
                category_stats[cat]["false_positive"] += 1

    summary["warning_precision_pct"] = round(
        100 * summary["caught_breaches"] / summary["warning_count"], 2
    ) if summary["warning_count"] else 0.0
    summary["warning_recall_pct"] = round(
        100 * summary["caught_breaches"] / summary["breach_count"], 2
    ) if summary["breach_count"] else 0.0
    summary["avg_warning_lead_days"] = round(float(np.mean(all_leads)), 2) if all_leads else 0.0

    for cat, stats in category_stats.items():
        leads = stats.pop("lead_days")
        stats["avg_lead_days"] = round(float(np.mean(leads)), 2) if leads else 0.0
        stats["precision_pct"] = round(100 * stats["caught"] / stats["warnings"], 2) if stats["warnings"] else 0.0
        stats["recall_pct"] = round(100 * stats["caught"] / stats["breaches"], 2) if stats["breaches"] else 0.0
        summary["category_metrics"][cat] = stats

    return summary


def plot_summary(results):
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))

    bars = [
        results["breach_count"],
        results["warning_count"],
        results["caught_breaches"],
        results["false_positive_warnings"],
    ]
    labels = ["Breaches", "Warnings", "Caught", "False positives"]
    colors = ["#ef4444", "#f59e0b", "#10b981", "#94a3b8"]
    axes[0].bar(labels, bars, color=colors)
    axes[0].set_title("Event-Level Guard Summary")
    axes[0].set_ylabel("Category-month count")
    axes[0].tick_params(axis="x", rotation=20)

    categories = CATEGORIES
    lead_days = [results["category_metrics"][cat]["avg_lead_days"] for cat in categories]
    axes[1].bar(categories, lead_days, color="#6366f1")
    axes[1].set_title("Average Warning Lead Time by Category")
    axes[1].set_ylabel("Days before month end")
    axes[1].tick_params(axis="x", rotation=35)

    fig.suptitle(
        f"Precision {results['warning_precision_pct']}% | "
        f"Recall {results['warning_recall_pct']}% | "
        f"Avg lead {results['avg_warning_lead_days']} days",
        fontsize=12,
    )
    fig.tight_layout()
    out = os.path.join(CHARTS_DIR, "event_level_guard_summary.png")
    fig.savefig(out, bbox_inches="tight")
    plt.close(fig)


def main():
    monthly_df = load_monthly_data()
    tx_df = load_transaction_data()
    results = simulate_event_guard(monthly_df, tx_df)
    out_path = os.path.join(AI_DIR, "event_level_control_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    plot_summary(results)

    print("Event-level budget guard simulation complete")
    print(json.dumps({
        "months_evaluated": results["months_evaluated"],
        "total_transactions": results["total_transactions"],
        "breach_count": results["breach_count"],
        "warning_count": results["warning_count"],
        "caught_breaches": results["caught_breaches"],
        "warning_precision_pct": results["warning_precision_pct"],
        "warning_recall_pct": results["warning_recall_pct"],
        "avg_warning_lead_days": results["avg_warning_lead_days"],
    }, indent=2))


if __name__ == "__main__":
    main()

