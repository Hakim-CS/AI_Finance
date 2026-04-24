"""
generate_training_data.py
=============================================================================
Generates realistic, persona-based personal finance data for model training.

Each "persona" is a virtual user with a distinct income level, lifestyle, and
spending pattern.  The script produces TWO CSV files:

  1) training_data.csv        – every individual transaction (~4 000+ rows)
  2) monthly_summary.csv      – aggregated per-user-per-month (~60 rows)

The monthly summary is what the ML model actually trains on.
Currency: USD ($)

Author : Aura Finance Thesis Project
Date   : April 2026
=============================================================================
"""

import random
import math
import csv
import os
import json
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Dict, List, Tuple

# ------------------------------------------------------------------------------
# Fix the seed for reproducibility — the same seed always produces the same
# dataset, which is important for scientific reproducibility in your thesis.
# ------------------------------------------------------------------------------
random.seed(42)

# ------------------------------------------------------------------------------
# Constants
# ------------------------------------------------------------------------------
CATEGORIES = ["food", "transport", "shopping", "entertainment",
              "utilities", "health", "travel", "other"]

# Date range: 3 full years (Jan 2023 - Dec 2025) = 36 months
# More data = better model training + seasonal pattern repetition
START_YEAR = 2023
END_YEAR   = 2025
YEAR_MONTHS = [(y, m) for y in range(START_YEAR, END_YEAR + 1) for m in range(1, 13)]

# ------------------------------------------------------------------------------
# Realistic transaction descriptions per category
# These make the dataset look authentic — not "Transaction #1234"
# ------------------------------------------------------------------------------
DESCRIPTIONS: Dict[str, List[str]] = {
    "food": [
        "Grocery store", "Supermarket weekly shop", "Coffee shop",
        "Lunch at restaurant", "Fast food delivery", "Bakery",
        "Organic market", "Meal prep ingredients", "Pizza delivery",
        "Dinner with friends", "Breakfast café", "Sushi takeout",
        "Farmers market", "Snacks and drinks", "Food truck lunch",
        "Online grocery order", "Deli sandwich", "Brunch spot",
    ],
    "transport": [
        "Gas station fill-up", "Monthly bus pass", "Uber ride",
        "Parking garage", "Car insurance payment", "Oil change service",
        "Toll road fee", "Train ticket", "Lyft to airport",
        "Tire rotation", "Car wash", "Monthly metro card",
        "Bike repair", "Rideshare to work", "Highway toll",
    ],
    "shopping": [
        "Amazon order", "Clothing store", "Electronics purchase",
        "Home goods", "Shoe store", "Online shopping",
        "Department store", "Gift purchase", "Bookstore",
        "Furniture store", "Kitchen supplies", "Tech accessories",
        "Sports equipment", "Back-to-school supplies", "Seasonal sale haul",
    ],
    "entertainment": [
        "Netflix subscription", "Movie theater", "Concert tickets",
        "Spotify premium", "Video game purchase", "Streaming service",
        "Bowling night", "Museum visit", "Live show tickets",
        "Board game night supplies", "Amusement park", "Escape room",
        "Comedy club", "Art supplies (hobby)", "Online course",
    ],
    "utilities": [
        "Electricity bill", "Water bill", "Internet provider",
        "Natural gas bill", "Cell phone plan", "Trash collection",
        "Home insurance", "Sewer service", "Cloud storage subscription",
        "VPN subscription", "Home security system", "Cable TV",
    ],
    "health": [
        "Gym membership", "Doctor visit copay", "Prescription medication",
        "Dental checkup", "Vision exam", "Vitamins and supplements",
        "Physical therapy session", "Mental health counseling",
        "First aid supplies", "Health insurance copay", "Lab work",
        "Dermatologist visit", "Urgent care visit",
    ],
    "travel": [
        "Flight tickets", "Hotel booking", "Airbnb reservation",
        "Car rental", "Travel insurance", "Tourist attraction tickets",
        "Airport lounge access", "Luggage purchase", "Resort stay",
        "Cruise deposit", "Vacation rental", "Train pass (vacation)",
    ],
    "other": [
        "ATM withdrawal", "Bank service fee", "Charity donation",
        "Pet supplies", "Dry cleaning", "Library fine",
        "Subscription box", "Professional dues", "Tax preparation",
        "Moving expenses", "Storage unit", "Miscellaneous",
    ],
}

# ------------------------------------------------------------------------------
# SEASONAL MULTIPLIERS
#
# Real people don't spend the same every month.  These multipliers capture
# realistic seasonal patterns:
#   - Travel spikes in June-August (summer vacation) and December (holidays)
#   - Shopping peaks in November (Black Friday) and December (Christmas)
#   - Utilities are higher in January (heating) and July-August (AC)
#   - Entertainment is higher in summer and December
#   - Food is slightly higher in November-December (holiday meals)
# ------------------------------------------------------------------------------
SEASONAL: Dict[str, Dict[int, float]] = {
    "food": {
        1: 1.00, 2: 0.95, 3: 0.97, 4: 1.00, 5: 1.02, 6: 1.05,
        7: 1.05, 8: 1.03, 9: 0.98, 10: 1.00, 11: 1.12, 12: 1.20,
    },
    "transport": {
        1: 0.90, 2: 0.90, 3: 0.95, 4: 1.00, 5: 1.05, 6: 1.10,
        7: 1.10, 8: 1.10, 9: 1.00, 10: 0.95, 11: 0.95, 12: 1.05,
    },
    "shopping": {
        1: 0.70, 2: 0.75, 3: 0.85, 4: 0.90, 5: 0.95, 6: 1.00,
        7: 0.90, 8: 1.05, 9: 1.00, 10: 0.95, 11: 1.40, 12: 1.60,
    },
    "entertainment": {
        1: 0.80, 2: 0.85, 3: 0.90, 4: 1.00, 5: 1.10, 6: 1.20,
        7: 1.25, 8: 1.20, 9: 1.00, 10: 0.95, 11: 0.90, 12: 1.15,
    },
    "utilities": {
        1: 1.25, 2: 1.20, 3: 1.05, 4: 0.90, 5: 0.85, 6: 0.95,
        7: 1.15, 8: 1.20, 9: 1.00, 10: 0.90, 11: 1.00, 12: 1.15,
    },
    "health": {
        1: 1.15, 2: 1.00, 3: 0.95, 4: 0.90, 5: 0.90, 6: 0.95,
        7: 0.90, 8: 0.90, 9: 1.00, 10: 1.05, 11: 1.00, 12: 1.10,
    },
    "travel": {
        1: 0.30, 2: 0.30, 3: 0.50, 4: 0.60, 5: 0.80, 6: 1.60,
        7: 1.80, 8: 1.50, 9: 0.70, 10: 0.50, 11: 0.40, 12: 1.40,
    },
    "other": {
        1: 1.00, 2: 0.95, 3: 1.00, 4: 1.05, 5: 1.00, 6: 1.00,
        7: 1.00, 8: 1.00, 9: 1.05, 10: 1.00, 11: 1.05, 12: 1.10,
    },
}


# ------------------------------------------------------------------------------
# PERSONA DEFINITIONS
#
# Each persona has:
#   - income           : monthly income in USD
#   - saving_rate      : what % of income they try to save
#   - base_allocations : what % of SPENDING budget goes to each category
#   - tx_per_month     : how many transactions they make per month (range)
#   - description      : narrative for documentation
#
# The allocations are percentages of the *spending budget* (income × (1 - saving_rate)).
# They should sum to ~1.0 (100%).
# ------------------------------------------------------------------------------
@dataclass
class Persona:
    """Represents a virtual user with distinct financial behavior."""
    id: int
    name: str
    income: float
    saving_rate: float
    base_allocations: Dict[str, float]
    tx_per_month: Tuple[int, int]  # (min, max)
    description: str
    # Noise factor: how much the persona's spending varies month-to-month
    # 0.10 = ±10% random variation
    noise: float = 0.12


PERSONAS: List[Persona] = [
    Persona(
        id=1,
        name="Emily (College Student)",
        income=2_800,
        saving_rate=0.05,
        base_allocations={
            "food":          0.32,   # Eats out a lot, limited cooking
            "transport":     0.12,   # Bus pass + occasional Uber
            "shopping":      0.08,   # Thrift stores, necessities only
            "entertainment": 0.15,   # Movies, streaming, socializing
            "utilities":     0.18,   # Phone, internet, share of rent utilities
            "health":        0.03,   # Rare doctor visits, campus gym
            "travel":        0.02,   # Almost never (winter break trip)
            "other":         0.10,   # Textbooks, supplies
        },
        tx_per_month=(25, 40),
        noise=0.15,  # Student spending is more erratic
        description="A 21-year-old college student working part-time. "
                    "Lives on a tight budget, mostly spends on food and "
                    "entertainment. Rarely travels. High variability.",
    ),
    Persona(
        id=2,
        name="Marcus (Junior Software Developer)",
        income=5_500,
        saving_rate=0.15,
        base_allocations={
            "food":          0.25,   # Meal preps + restaurant lunches
            "transport":     0.10,   # Monthly metro pass + gas
            "shopping":      0.12,   # Tech gadgets, clothing
            "entertainment": 0.10,   # Gaming, streaming, concerts
            "utilities":     0.20,   # Rent utilities, phone, internet
            "health":        0.08,   # Gym membership, occasional doctor
            "travel":        0.05,   # One trip per year
            "other":         0.10,   # Professional development
        },
        tx_per_month=(30, 50),
        noise=0.12,
        description="A 26-year-old developer saving for an emergency fund. "
                    "Balanced spender with a slight tech-gadget habit. "
                    "Takes one vacation per year.",
    ),
    Persona(
        id=3,
        name="Sarah (Marketing Manager)",
        income=8_500,
        saving_rate=0.20,
        base_allocations={
            "food":          0.22,   # Mix of home cooking and dining out
            "transport":     0.12,   # Car payment, gas, maintenance
            "shopping":      0.15,   # Fashion, home decor
            "entertainment": 0.08,   # Streaming, occasional events
            "utilities":     0.18,   # Full apartment utilities
            "health":        0.10,   # Gym, dental, regular checkups
            "travel":        0.08,   # Two trips per year
            "other":         0.07,   # Pet care, subscriptions
        },
        tx_per_month=(35, 55),
        noise=0.10,
        description="A 32-year-old professional with a steady lifestyle. "
                    "Cares about health and appearance. Travels moderately. "
                    "Consistent spender with low volatility.",
    ),
    Persona(
        id=4,
        name="David (Senior Engineer)",
        income=13_000,
        saving_rate=0.25,
        base_allocations={
            "food":          0.20,   # Quality groceries, frequent dining
            "transport":     0.10,   # Car lease + insurance
            "shopping":      0.15,   # Electronics, quality clothing
            "entertainment": 0.10,   # Premium subscriptions, events
            "utilities":     0.15,   # House utilities, smart home
            "health":        0.10,   # Personal trainer, premium health
            "travel":        0.12,   # Regular trips, weekend getaways
            "other":         0.08,   # Investments, donations
        },
        tx_per_month=(40, 65),
        noise=0.10,
        description="A 38-year-old senior engineer with a family. "
                    "Spends comfortably on quality. Regular traveler. "
                    "Health-conscious with premium subscriptions.",
    ),
    Persona(
        id=5,
        name="Olivia (Executive Director)",
        income=22_000,
        saving_rate=0.30,
        base_allocations={
            "food":          0.18,   # Upscale dining, organic groceries
            "transport":     0.08,   # Luxury car, premium services
            "shopping":      0.18,   # Designer goods, premium brands
            "entertainment": 0.08,   # Theater, fine experiences
            "utilities":     0.12,   # Large home, premium services
            "health":        0.10,   # Spa, premium gym, specialists
            "travel":        0.18,   # Frequent luxury travel
            "other":         0.08,   # Donations, investments
        },
        tx_per_month=(45, 70),
        noise=0.08,  # High earners tend to be more consistent
        description="A 45-year-old executive with a luxury lifestyle. "
                    "Travels frequently for both work and leisure. "
                    "High shopping and travel budgets. Very consistent.",
    ),
]


# ------------------------------------------------------------------------------
# DATA GENERATION ENGINE
# ------------------------------------------------------------------------------

def days_in_month(year: int, month: int) -> int:
    """Return the number of days in a given month."""
    if month == 12:
        return (datetime(year + 1, 1, 1) - datetime(year, 12, 1)).days
    return (datetime(year, month + 1, 1) - datetime(year, month, 1)).days


def generate_transactions(persona: Persona) -> List[dict]:
    """
    Generate all expense transactions for one persona across 12 months.

    The algorithm:
    1. Calculate the monthly spending budget = income × (1 - saving_rate)
    2. For each month:
       a. Apply seasonal multipliers to the base allocations
       b. Add random noise (±noise%) for realism
       c. Distribute the category budget across individual transactions
       d. Assign realistic dates within the month
       e. Assign realistic descriptions
    """
    transactions = []
    spending_budget = persona.income * (1 - persona.saving_rate)

    for year, month in YEAR_MONTHS:
        # -- Step 1: Calculate this month's category budgets --------------

        month_category_budgets: Dict[str, float] = {}
        for cat in CATEGORIES:
            base_amount = spending_budget * persona.base_allocations[cat]

            # Apply seasonal multiplier
            seasonal_mult = SEASONAL[cat].get(month, 1.0)

            # Apply random noise (different each month, per category)
            noise_mult = 1.0 + random.uniform(-persona.noise, persona.noise)

            month_category_budgets[cat] = base_amount * seasonal_mult * noise_mult

        # -- Step 2: Normalize so total spending stays realistic ----------
        # Without normalization, seasonal peaks + noise could push total
        # spending unrealistically high.  We scale back to ~spending_budget
        # with a small allowed overshoot (up to 10%).
        actual_total = sum(month_category_budgets.values())
        max_allowed  = spending_budget * 1.10  # Allow up to 10% over budget
        if actual_total > max_allowed:
            scale = max_allowed / actual_total
            month_category_budgets = {k: v * scale
                                      for k, v in month_category_budgets.items()}

        # -- Step 3: Split category totals into individual transactions ---
        num_tx = random.randint(*persona.tx_per_month)
        dim    = days_in_month(year, month)

        for cat, cat_total in month_category_budgets.items():
            if cat_total < 1:
                continue  # Skip near-zero categories

            # Decide how many transactions for this category
            # Food gets more transactions; travel gets fewer
            weight_map = {
                "food": 0.30, "transport": 0.12, "shopping": 0.10,
                "entertainment": 0.10, "utilities": 0.08, "health": 0.06,
                "travel": 0.04, "other": 0.08,
            }
            cat_tx_count = max(1, round(num_tx * weight_map.get(cat, 0.08)))

            # For bills (utilities), create 1-3 large transactions
            if cat == "utilities":
                cat_tx_count = random.randint(2, 4)
            # Travel: 1-2 big transactions (flights, hotels)
            if cat == "travel" and cat_total > 50:
                cat_tx_count = random.randint(1, 3)
            # Health: 1-3 visits
            if cat == "health":
                cat_tx_count = random.randint(1, 4)

            # Distribute the total across transactions (not evenly — realistically)
            amounts = _split_amount(cat_total, cat_tx_count)

            for amount in amounts:
                # Pick a random day in the month
                day = random.randint(1, dim)
                # Bias entertainment and food toward weekends
                if cat in ("entertainment", "food") and random.random() < 0.35:
                    # Push toward Friday/Saturday (day 5,6 in weekday)
                    date = datetime(year, month, 1) + timedelta(days=day - 1)
                    weekday = date.weekday()
                    if weekday < 4:  # Mon-Thu, shift to nearest weekend
                        shift = 5 - weekday  # Move to Saturday
                        shifted_day = min(day + shift, dim)
                        day = shifted_day

                tx_date = datetime(year, month, day)
                desc    = random.choice(DESCRIPTIONS[cat])

                transactions.append({
                    "user_id":     persona.id,
                    "user_name":   persona.name,
                    "income":      persona.income,
                    "category":    cat,
                    "amount":      round(amount, 2),
                    "date":        tx_date.strftime("%Y-%m-%d"),
                    "month":       month,
                    "day_of_week": tx_date.weekday(),  # 0=Mon, 6=Sun
                    "description": desc,
                })

    return transactions


def _split_amount(total: float, n: int) -> List[float]:
    """
    Split a total amount into n unequal parts.

    Uses a Dirichlet-like approach: generate n random weights, then scale
    them so they sum to `total`.  This creates realistic variation —
    some transactions are larger (e.g., a big grocery run) and some are
    smaller (e.g., a coffee).
    """
    if n <= 0:
        return []
    if n == 1:
        return [total]

    # Generate random weights with some variation
    weights = [random.paretovariate(1.5) for _ in range(n)]
    weight_sum = sum(weights)

    amounts = [(w / weight_sum) * total for w in weights]

    # Ensure minimum transaction of $1 and no negative values
    amounts = [max(1.0, a) for a in amounts]
    # Re-scale to hit the target total
    current_sum = sum(amounts)
    if current_sum > 0:
        factor = total / current_sum
        amounts = [a * factor for a in amounts]

    return amounts


def aggregate_monthly(transactions: List[dict]) -> List[dict]:
    """
    Aggregate individual transactions into monthly summaries.

    Each row represents one user's spending for one month:
        user_id | year | month | income | food | transport | ... | total_spent

    This is the format the ML model trains on.
    """
    # Build a nested dict: {(user_id, year, month): {category: total}}
    agg: Dict[Tuple[int, int, int], Dict[str, float]] = {}
    user_incomes: Dict[int, float] = {}

    for tx in transactions:
        # Extract year from date string
        year = int(tx["date"][:4])
        key = (tx["user_id"], year, tx["month"])
        if key not in agg:
            agg[key] = {cat: 0.0 for cat in CATEGORIES}
        agg[key][tx["category"]] += tx["amount"]
        user_incomes[tx["user_id"]] = tx["income"]

    rows = []
    for (user_id, year, month), cat_totals in sorted(agg.items()):
        row = {
            "user_id": user_id,
            "year":    year,
            "month":   month,
            "income":  user_incomes[user_id],
        }
        for cat in CATEGORIES:
            row[cat] = round(cat_totals.get(cat, 0), 2)
        row["total_spent"] = round(sum(cat_totals.values()), 2)
        rows.append(row)

    return rows


# ------------------------------------------------------------------------------
# MAIN EXECUTION
# ------------------------------------------------------------------------------

def main():
    print("=" * 70)
    print("  AURA FINANCE — Training Data Generator")
    print("=" * 70)
    print()

    all_transactions = []
    all_monthly      = []

    for persona in PERSONAS:
        print(f"  Generating data for: {persona.name}")
        print(f"    Income: ${persona.income:,.0f}/month | "
              f"Saving rate: {persona.saving_rate:.0%} | "
              f"Spending budget: ${persona.income * (1 - persona.saving_rate):,.0f}")

        txs = generate_transactions(persona)
        all_transactions.extend(txs)

        # Quick per-persona stats
        monthly = aggregate_monthly(txs)
        all_monthly.extend(monthly)

        avg_total = sum(r["total_spent"] for r in monthly) / len(monthly)
        print(f"    Transactions: {len(txs)} | "
              f"Avg monthly spend: ${avg_total:,.0f}")
        print()

    # -- Write raw transactions CSV ----------------------------------------
    tx_path = os.path.join(os.path.dirname(__file__), "training_data.csv")
    tx_fields = ["user_id", "user_name", "income", "category", "amount",
                 "date", "month", "day_of_week", "description"]

    with open(tx_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=tx_fields)
        writer.writeheader()
        writer.writerows(all_transactions)

    # -- Write monthly summary CSV -----------------------------------------
    summary_path = os.path.join(os.path.dirname(__file__), "monthly_summary.csv")
    summary_fields = ["user_id", "year", "month", "income"] + CATEGORIES + ["total_spent"]

    with open(summary_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=summary_fields)
        writer.writeheader()
        writer.writerows(all_monthly)

    # -- Write persona metadata (for documentation) -------------------------
    meta_path = os.path.join(os.path.dirname(__file__), "personas.json")
    persona_meta = []
    for p in PERSONAS:
        persona_meta.append({
            "id":           p.id,
            "name":         p.name,
            "income":       p.income,
            "saving_rate":  p.saving_rate,
            "allocations":  p.base_allocations,
            "description":  p.description,
        })
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(persona_meta, f, indent=2)

    # -- Final report ------------------------------------------------------
    print("-" * 70)
    print(f"  [OK] Training data saved to:     {tx_path}")
    print(f"     -> {len(all_transactions):,} transactions")
    print()
    print(f"  [OK] Monthly summary saved to:   {summary_path}")
    print(f"     -> {len(all_monthly)} monthly records (5 users × 12 months)")
    print()
    print(f"  [OK] Persona metadata saved to:  {meta_path}")
    print("-" * 70)

    # -- Print a sample of the monthly summary -----------------------------
    print()
    print("  [CHART] Sample monthly summaries (first 3 rows):")
    print()
    for row in all_monthly[:3]:
        cats = " | ".join(f"{c}: ${row[c]:>8,.2f}" for c in CATEGORIES)
        print(f"    User {row['user_id']} | Month {row['month']:>2} | "
              f"Income: ${row['income']:>10,.0f} | Total: ${row['total_spent']:>8,.2f}")
        print(f"      {cats}")
        print()


if __name__ == "__main__":
    main()
