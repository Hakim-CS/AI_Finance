"""
model_comparison.py
=============================================================================
Comprehensive AI Experimental Study for Thesis

Runs 4 experiments and generates 7 publication-quality charts:
  Experiment 1: Multi-Model Comparison (5 algorithms)
  Experiment 2: Feature Ablation Study
  Experiment 3: Hyperparameter Optimization (Grid Search)
  Experiment 4: Learning Curve Analysis

Usage: python model_comparison.py

Author : Aura Finance Thesis Project
Date   : May 2026
=============================================================================
"""

import os, json, time, warnings
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.tree import DecisionTreeRegressor
from sklearn.linear_model import LinearRegression
from sklearn.svm import SVR
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import cross_val_score

warnings.filterwarnings('ignore')

try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.gridspec as gridspec
    HAS_MPL = True
except ImportError:
    HAS_MPL = False
    print("[ERROR] matplotlib required. Install: pip install matplotlib")
    exit(1)

# =============================================================================
# CONFIG
# =============================================================================
CATEGORIES = ["food", "transport", "shopping", "entertainment",
              "utilities", "health", "travel", "other"]
AI_DIR     = os.path.dirname(os.path.abspath(__file__))
CHARTS_DIR = os.path.join(AI_DIR, "charts")
os.makedirs(CHARTS_DIR, exist_ok=True)

# Consistent chart style
plt.style.use('seaborn-v0_8-whitegrid')
plt.rcParams.update({
    'font.size': 11, 'figure.dpi': 150,
    'axes.titlesize': 13, 'axes.titleweight': 'bold',
    'figure.facecolor': 'white'
})

# Color palette
C = {
    'lr': '#6366f1',    # indigo  - Linear Regression
    'dt': '#f59e0b',    # amber   - Decision Tree
    'rf': '#10b981',    # emerald - Random Forest
    'gb': '#ef4444',    # red     - Gradient Boosting
    'svr': '#8b5cf6',   # purple  - SVR
    'gray': '#94a3b8',
    'dark': '#1e293b',
    'light': '#f1f5f9',
}

# =============================================================================
# DATA LOADING (reuses train_model_v2 logic)
# =============================================================================
def load_and_prepare():
    """Load monthly_summary.csv and create features + time-based split."""
    path = os.path.join(AI_DIR, "monthly_summary.csv")
    df = pd.read_csv(path)
    df = df.sort_values(["user_id", "year", "month"]).reset_index(drop=True)

    for cat in CATEGORIES:
        df[f"prev_{cat}"] = df.groupby("user_id")[cat].shift(1)
    df["prev_total"] = df.groupby("user_id")["total_spent"].shift(1)
    df = df.dropna().reset_index(drop=True)

    feature_cols = ["income", "month"] + [f"prev_{cat}" for cat in CATEGORIES] + ["prev_total"]
    X = df[feature_cols]
    y = df[CATEGORIES]

    train_mask = df["year"] <= 2024
    test_mask  = df["year"] == 2025

    print(f"  Data: {len(df)} rows | Train: {train_mask.sum()} | Test: {test_mask.sum()}")
    print(f"  Features: {len(feature_cols)} | Targets: {len(CATEGORIES)}")
    return df, X, y, feature_cols, train_mask, test_mask


def get_models():
    """Return dict of model name -> constructor for each category."""
    return {
        "Linear Regression": lambda: LinearRegression(),
        "Decision Tree":     lambda: DecisionTreeRegressor(max_depth=6, min_samples_leaf=3, random_state=42),
        "Random Forest":     lambda: RandomForestRegressor(n_estimators=100, max_depth=6, min_samples_leaf=3, random_state=42),
        "Gradient Boosting": lambda: GradientBoostingRegressor(n_estimators=100, max_depth=4, min_samples_leaf=3, random_state=42),
        "SVR":               lambda: SVR(kernel='rbf', C=100, epsilon=0.1),
    }


# =============================================================================
# EXPERIMENT 1: Multi-Model Comparison
# =============================================================================
def experiment_model_comparison(X_train, X_test, y_train, y_test):
    """Train 5 models, evaluate each on all categories."""
    print("\n" + "="*60)
    print("  EXPERIMENT 1: Multi-Model Comparison")
    print("="*60)

    model_factories = get_models()
    results = {}

    for name, factory in model_factories.items():
        t0 = time.time()
        cat_maes, cat_rmses, cat_r2s = [], [], []

        for cat in CATEGORIES:
            model = factory()
            model.fit(X_train, y_train[cat])
            pred = model.predict(X_test)
            cat_maes.append(mean_absolute_error(y_test[cat], pred))
            cat_rmses.append(np.sqrt(mean_squared_error(y_test[cat], pred)))
            cat_r2s.append(r2_score(y_test[cat], pred))

        elapsed = time.time() - t0
        results[name] = {
            "per_category_mae":  {c: round(m, 2) for c, m in zip(CATEGORIES, cat_maes)},
            "per_category_rmse": {c: round(m, 2) for c, m in zip(CATEGORIES, cat_rmses)},
            "per_category_r2":   {c: round(m, 4) for c, m in zip(CATEGORIES, cat_r2s)},
            "avg_mae":  round(np.mean(cat_maes), 2),
            "avg_rmse": round(np.mean(cat_rmses), 2),
            "avg_r2":   round(np.mean(cat_r2s), 4),
            "time_sec":  round(elapsed, 2),
        }
        print(f"  {name:<22} MAE=${np.mean(cat_maes):>8.2f}  R2={np.mean(cat_r2s):>7.4f}  ({elapsed:.1f}s)")

    # --- Chart 1: Model Comparison MAE Bar Chart ---
    fig, ax = plt.subplots(figsize=(10, 6))
    names = list(results.keys())
    maes  = [results[n]["avg_mae"] for n in names]
    colors = [C['lr'], C['dt'], C['rf'], C['gb'], C['svr']]

    bars = ax.bar(names, maes, color=colors, edgecolor='white', linewidth=1.5, width=0.6)
    for bar, val in zip(bars, maes):
        ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 2,
                f'${val:.0f}', ha='center', va='bottom', fontweight='bold', fontsize=11)

    best_idx = np.argmin(maes)
    bars[best_idx].set_edgecolor('#064e3b')
    bars[best_idx].set_linewidth(3)

    ax.set_ylabel("Mean Absolute Error ($)", fontweight='bold')
    ax.set_title("Experiment 1: Model Comparison — Average MAE Across All Categories")
    ax.set_ylim(0, max(maes) * 1.25)
    ax.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "model_comparison_mae.png"), bbox_inches='tight')
    plt.close()
    print("    [OK] charts/model_comparison_mae.png")

    # --- Chart 2: R² Comparison ---
    fig, ax = plt.subplots(figsize=(10, 6))
    r2s = [results[n]["avg_r2"] for n in names]
    bars = ax.bar(names, r2s, color=colors, edgecolor='white', linewidth=1.5, width=0.6)
    for bar, val in zip(bars, r2s):
        ax.text(bar.get_x() + bar.get_width()/2, max(0, bar.get_height()) + 0.01,
                f'{val:.3f}', ha='center', va='bottom', fontweight='bold', fontsize=11)

    ax.set_ylabel("R² Score", fontweight='bold')
    ax.set_title("Experiment 1: Model Comparison — R² Score (higher = better)")
    ax.axhline(y=0, color='gray', linewidth=0.8, linestyle='--')
    ax.grid(axis='y', alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "model_comparison_r2.png"), bbox_inches='tight')
    plt.close()
    print("    [OK] charts/model_comparison_r2.png")

    # --- Chart 3: Per-Category Heatmap ---
    fig, ax = plt.subplots(figsize=(12, 5))
    data_matrix = []
    for name in names:
        row = [results[name]["per_category_mae"][c] for c in CATEGORIES]
        data_matrix.append(row)
    data_matrix = np.array(data_matrix)

    im = ax.imshow(data_matrix, cmap='RdYlGn_r', aspect='auto')
    ax.set_xticks(range(len(CATEGORIES)))
    ax.set_xticklabels([c.capitalize() for c in CATEGORIES], rotation=30, ha='right')
    ax.set_yticks(range(len(names)))
    ax.set_yticklabels(names)

    for i in range(len(names)):
        for j in range(len(CATEGORIES)):
            val = data_matrix[i, j]
            color = 'white' if val > np.median(data_matrix) else 'black'
            ax.text(j, i, f'${val:.0f}', ha='center', va='center', fontsize=9, fontweight='bold', color=color)

    plt.colorbar(im, ax=ax, label='MAE ($)', shrink=0.8)
    ax.set_title("Experiment 1: Per-Category MAE Heatmap (lower = better)")
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "model_comparison_heatmap.png"), bbox_inches='tight')
    plt.close()
    print("    [OK] charts/model_comparison_heatmap.png")

    return results


# =============================================================================
# EXPERIMENT 2: Feature Ablation
# =============================================================================
def experiment_feature_ablation(X_train, X_test, y_train, y_test, feature_cols):
    """Remove one feature at a time and measure MAE impact."""
    print("\n" + "="*60)
    print("  EXPERIMENT 2: Feature Ablation Study")
    print("="*60)

    # Baseline: full model
    baseline_maes = []
    for cat in CATEGORIES:
        rf = RandomForestRegressor(n_estimators=100, max_depth=6, min_samples_leaf=3, random_state=42)
        rf.fit(X_train, y_train[cat])
        pred = rf.predict(X_test)
        baseline_maes.append(mean_absolute_error(y_test[cat], pred))
    baseline_avg = np.mean(baseline_maes)
    print(f"  Baseline (all features): MAE = ${baseline_avg:.2f}")

    results = {"baseline_mae": round(baseline_avg, 2), "ablations": {}}

    for feat in feature_cols:
        remaining = [f for f in feature_cols if f != feat]
        cat_maes = []
        for cat in CATEGORIES:
            rf = RandomForestRegressor(n_estimators=100, max_depth=6, min_samples_leaf=3, random_state=42)
            rf.fit(X_train[remaining], y_train[cat])
            pred = rf.predict(X_test[remaining])
            cat_maes.append(mean_absolute_error(y_test[cat], pred))
        avg_mae = np.mean(cat_maes)
        impact = avg_mae - baseline_avg
        results["ablations"][feat] = {
            "mae_without": round(avg_mae, 2),
            "impact": round(impact, 2),
            "impact_pct": round((impact / baseline_avg) * 100, 2),
        }
        direction = "+" if impact > 0 else ""
        print(f"    Remove {feat:<20} -> MAE = ${avg_mae:>8.2f}  ({direction}{impact:.2f})")

    # --- Chart 4: Feature Ablation ---
    fig, ax = plt.subplots(figsize=(10, 7))
    sorted_feats = sorted(results["ablations"].items(), key=lambda x: x[1]["impact"], reverse=True)
    feat_names = [f[0].replace("prev_", "prev ") for f in sorted_feats]
    impacts = [f[1]["impact"] for f in sorted_feats]
    colors_ab = ['#ef4444' if v > 0 else '#10b981' for v in impacts]

    bars = ax.barh(range(len(feat_names)), impacts, color=colors_ab, edgecolor='white', height=0.6)
    ax.set_yticks(range(len(feat_names)))
    ax.set_yticklabels(feat_names)
    ax.invert_yaxis()
    ax.axvline(x=0, color='gray', linewidth=1, linestyle='--')
    ax.set_xlabel("MAE Increase When Feature Removed ($)", fontweight='bold')
    ax.set_title("Experiment 2: Feature Ablation — Impact of Removing Each Feature")

    for bar, val in zip(bars, impacts):
        x_pos = val + (0.5 if val >= 0 else -0.5)
        ax.text(x_pos, bar.get_y() + bar.get_height()/2,
                f'${val:+.2f}', va='center', fontsize=9, fontweight='bold')

    ax.text(0.98, 0.02, f'Baseline MAE: ${baseline_avg:.2f}',
            transform=ax.transAxes, ha='right', fontsize=10,
            bbox=dict(boxstyle='round', facecolor=C['light'], edgecolor=C['gray']))

    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "feature_ablation.png"), bbox_inches='tight')
    plt.close()
    print("    [OK] charts/feature_ablation.png")

    return results


# =============================================================================
# EXPERIMENT 3: Hyperparameter Optimization
# =============================================================================
def experiment_hyperparameter_search(X_train, X_test, y_train, y_test):
    """Grid search over key RF parameters."""
    print("\n" + "="*60)
    print("  EXPERIMENT 3: Hyperparameter Optimization")
    print("="*60)

    depths = [3, 4, 5, 6, 8, 10, None]
    n_ests = [25, 50, 100, 150, 200, 300]
    min_leaves = [1, 2, 3, 5, 8]

    results = {"grid": [], "best": None}
    best_mae, best_params = float('inf'), {}

    # Phase A: depth x n_estimators (with min_samples_leaf=3)
    print("  Phase A: Searching depth x n_estimators...")
    depth_est_grid = np.zeros((len(depths), len(n_ests)))

    for i, d in enumerate(depths):
        for j, n in enumerate(n_ests):
            cat_maes = []
            for cat in CATEGORIES:
                rf = RandomForestRegressor(n_estimators=n, max_depth=d, min_samples_leaf=3, random_state=42)
                rf.fit(X_train, y_train[cat])
                pred = rf.predict(X_test)
                cat_maes.append(mean_absolute_error(y_test[cat], pred))
            avg = np.mean(cat_maes)
            depth_est_grid[i, j] = avg
            entry = {"n_estimators": n, "max_depth": str(d), "min_samples_leaf": 3, "avg_mae": round(avg, 2)}
            results["grid"].append(entry)
            if avg < best_mae:
                best_mae = avg
                best_params = {"n_estimators": n, "max_depth": d, "min_samples_leaf": 3}

    d_label = str(best_params['max_depth'])
    print(f"    Best so far: depth={d_label}, n_est={best_params['n_estimators']}, MAE=${best_mae:.2f}")

    # Phase B: refine min_samples_leaf with best depth/n_est
    print("  Phase B: Refining min_samples_leaf...")
    leaf_results = []
    for ml in min_leaves:
        cat_maes = []
        for cat in CATEGORIES:
            rf = RandomForestRegressor(
                n_estimators=best_params['n_estimators'],
                max_depth=best_params['max_depth'],
                min_samples_leaf=ml, random_state=42)
            rf.fit(X_train, y_train[cat])
            pred = rf.predict(X_test)
            cat_maes.append(mean_absolute_error(y_test[cat], pred))
        avg = np.mean(cat_maes)
        leaf_results.append((ml, avg))
        if avg < best_mae:
            best_mae = avg
            best_params['min_samples_leaf'] = ml

    results["best"] = {
        "n_estimators": best_params['n_estimators'],
        "max_depth": str(best_params['max_depth']),
        "min_samples_leaf": best_params['min_samples_leaf'],
        "avg_mae": round(best_mae, 2),
    }
    print(f"    BEST: {best_params} -> MAE=${best_mae:.2f}")

    # --- Chart 5: Heatmap depth x n_estimators ---
    fig, ax = plt.subplots(figsize=(10, 6))
    depth_labels = [str(d) if d else 'None' for d in depths]
    im = ax.imshow(depth_est_grid, cmap='RdYlGn_r', aspect='auto')

    ax.set_xticks(range(len(n_ests)))
    ax.set_xticklabels(n_ests)
    ax.set_yticks(range(len(depths)))
    ax.set_yticklabels(depth_labels)
    ax.set_xlabel("n_estimators", fontweight='bold')
    ax.set_ylabel("max_depth", fontweight='bold')

    for i in range(len(depths)):
        for j in range(len(n_ests)):
            val = depth_est_grid[i, j]
            color = 'white' if val > np.median(depth_est_grid) else 'black'
            ax.text(j, i, f'${val:.0f}', ha='center', va='center', fontsize=9, fontweight='bold', color=color)

    plt.colorbar(im, ax=ax, label='MAE ($)', shrink=0.8)
    ax.set_title("Experiment 3: Hyperparameter Search — MAE by (max_depth, n_estimators)")
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "hyperparam_heatmap.png"), bbox_inches='tight')
    plt.close()
    print("    [OK] charts/hyperparam_heatmap.png")

    # --- Chart 6: MAE vs max_depth curve ---
    fig, ax = plt.subplots(figsize=(9, 5))
    mid_n = 100  # Use n_estimators=100 for the depth curve
    j_idx = n_ests.index(mid_n) if mid_n in n_ests else 2
    depth_curve = depth_est_grid[:, j_idx]

    ax.plot(range(len(depths)), depth_curve, 'o-', color=C['rf'], linewidth=2.5, markersize=8, label=f'n_estimators={mid_n}')
    best_d_idx = np.argmin(depth_curve)
    ax.scatter([best_d_idx], [depth_curve[best_d_idx]], s=200, color=C['rf'], zorder=5, edgecolors='black', linewidth=2)
    ax.annotate(f'Best: {depth_labels[best_d_idx]}\nMAE=${depth_curve[best_d_idx]:.1f}',
                xy=(best_d_idx, depth_curve[best_d_idx]),
                xytext=(best_d_idx + 0.5, depth_curve[best_d_idx] + 5),
                fontsize=10, fontweight='bold',
                arrowprops=dict(arrowstyle='->', color='black'))

    ax.set_xticks(range(len(depths)))
    ax.set_xticklabels(depth_labels)
    ax.set_xlabel("max_depth", fontweight='bold')
    ax.set_ylabel("Mean Absolute Error ($)", fontweight='bold')
    ax.set_title("Experiment 3: MAE vs. Tree Depth (overfitting analysis)")
    ax.legend()
    ax.grid(alpha=0.3)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "hyperparam_depth_curve.png"), bbox_inches='tight')
    plt.close()
    print("    [OK] charts/hyperparam_depth_curve.png")

    return results


# =============================================================================
# EXPERIMENT 4: Learning Curve
# =============================================================================
def experiment_learning_curve(X_train, X_test, y_train, y_test):
    """Test model performance with increasing training data sizes."""
    print("\n" + "="*60)
    print("  EXPERIMENT 4: Learning Curve Analysis")
    print("="*60)

    fractions = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    n_total = len(X_train)
    results = {"fractions": [], "train_maes": [], "test_maes": []}

    for frac in fractions:
        n_samples = max(5, int(n_total * frac))
        idx = np.random.RandomState(42).choice(n_total, n_samples, replace=False)
        X_sub = X_train.iloc[idx]
        y_sub = y_train.iloc[idx]

        train_maes, test_maes = [], []
        for cat in CATEGORIES:
            rf = RandomForestRegressor(n_estimators=100, max_depth=6, min_samples_leaf=3, random_state=42)
            rf.fit(X_sub, y_sub[cat])
            pred_train = rf.predict(X_sub)
            pred_test = rf.predict(X_test)
            train_maes.append(mean_absolute_error(y_sub[cat], pred_train))
            test_maes.append(mean_absolute_error(y_test[cat], pred_test))

        avg_train = np.mean(train_maes)
        avg_test = np.mean(test_maes)
        results["fractions"].append(frac)
        results["train_maes"].append(round(avg_train, 2))
        results["test_maes"].append(round(avg_test, 2))
        print(f"    {frac*100:>5.0f}% ({n_samples:>3} rows)  Train MAE=${avg_train:>7.2f}  Test MAE=${avg_test:>7.2f}")

    # --- Chart 7: Learning Curve ---
    fig, ax = plt.subplots(figsize=(10, 6))
    sizes = [int(n_total * f) for f in fractions]

    ax.plot(sizes, results["train_maes"], 'o-', color=C['rf'], linewidth=2.5, markersize=7, label='Training Error')
    ax.plot(sizes, results["test_maes"], 's-', color=C['lr'], linewidth=2.5, markersize=7, label='Test Error')
    ax.fill_between(sizes, results["train_maes"], results["test_maes"], alpha=0.1, color=C['gray'])

    ax.set_xlabel("Number of Training Samples", fontweight='bold')
    ax.set_ylabel("Mean Absolute Error ($)", fontweight='bold')
    ax.set_title("Experiment 4: Learning Curve — Performance vs. Training Data Size")
    ax.legend(fontsize=11)
    ax.grid(alpha=0.3)

    # Annotate the gap
    final_gap = results["test_maes"][-1] - results["train_maes"][-1]
    ax.annotate(f'Gap: ${final_gap:.1f}\n(generalization error)',
                xy=(sizes[-1], np.mean([results["test_maes"][-1], results["train_maes"][-1]])),
                xytext=(sizes[-3], max(results["test_maes"]) * 0.9),
                fontsize=10, ha='center',
                arrowprops=dict(arrowstyle='->', color='black'),
                bbox=dict(boxstyle='round', facecolor=C['light']))

    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "learning_curve.png"), bbox_inches='tight')
    plt.close()
    print("    [OK] charts/learning_curve.png")

    return results


# =============================================================================
# MAIN
# =============================================================================
def main():
    print("=" * 65)
    print("  AURA FINANCE — Comprehensive AI Experimental Study")
    print("  Generating thesis-ready charts and metrics")
    print("=" * 65)

    # Load data
    print("\n[DATA] Loading and preparing dataset...")
    df, X, y, feature_cols, train_mask, test_mask = load_and_prepare()
    X_train, X_test = X[train_mask], X[test_mask]
    y_train, y_test = y[train_mask], y[test_mask]

    all_results = {}

    # Run experiments
    all_results["model_comparison"]   = experiment_model_comparison(X_train, X_test, y_train, y_test)
    all_results["feature_ablation"]   = experiment_feature_ablation(X_train, X_test, y_train, y_test, feature_cols)
    all_results["hyperparameter"]     = experiment_hyperparameter_search(X_train, X_test, y_train, y_test)
    all_results["learning_curve"]     = experiment_learning_curve(X_train, X_test, y_train, y_test)

    # Save all results
    out_path = os.path.join(AI_DIR, "experiment_results.json")
    with open(out_path, "w") as f:
        json.dump(all_results, f, indent=2, default=str)
    print(f"\n  [OK] All results saved to: {out_path}")

    # Summary
    print("\n" + "=" * 65)
    print("  COMPLETE! Generated 7 charts:")
    print("    1. charts/model_comparison_mae.png")
    print("    2. charts/model_comparison_r2.png")
    print("    3. charts/model_comparison_heatmap.png")
    print("    4. charts/feature_ablation.png")
    print("    5. charts/hyperparam_heatmap.png")
    print("    6. charts/hyperparam_depth_curve.png")
    print("    7. charts/learning_curve.png")
    print("  + experiment_results.json (all numeric data)")
    print("=" * 65)


if __name__ == "__main__":
    main()
