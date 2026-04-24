"""
predict_v2.py
=============================================================================
Inference script for the new Random Forest budget model.

Called by the Node.js backend like:
    python predict_v2.py <income> <prev_food> <prev_transport> ... <prev_total> <month>

Arguments (in order):
    1. income          - user's monthly income
    2. month           - current month (1-12)
    3. prev_food       - last month's food spending
    4. prev_transport   - last month's transport spending
    5. prev_shopping   - last month's shopping spending
    6. prev_entertainment - last month's entertainment spending
    7. prev_utilities  - last month's utilities spending
    8. prev_health     - last month's health spending
    9. prev_travel     - last month's travel spending
    10. prev_other     - last month's other spending
    11. prev_total     - last month's total spending

Output: JSON object with predicted spending per category
    { "food": 1200.50, "transport": 450.00, ... }

Author : Aura Finance Thesis Project
Date   : April 2026
=============================================================================
"""

import sys
import json
import os
import joblib
import pandas as pd

CATEGORIES = ["food", "transport", "shopping", "entertainment",
              "utilities", "health", "travel", "other"]

def main():
    try:
        # Parse command line arguments
        if len(sys.argv) < 12:
            print(json.dumps({
                "error": "Not enough arguments. Need: income month prev_food prev_transport prev_shopping prev_entertainment prev_utilities prev_health prev_travel prev_other prev_total"
            }))
            return

        income           = float(sys.argv[1])
        month            = int(sys.argv[2])
        prev_food        = float(sys.argv[3])
        prev_transport   = float(sys.argv[4])
        prev_shopping    = float(sys.argv[5])
        prev_entertainment = float(sys.argv[6])
        prev_utilities   = float(sys.argv[7])
        prev_health      = float(sys.argv[8])
        prev_travel      = float(sys.argv[9])
        prev_other       = float(sys.argv[10])
        prev_total       = float(sys.argv[11])

        # Load the trained model
        model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "budget_model_v2.pkl")
        model_data = joblib.load(model_path)

        models       = model_data["models"]
        feature_cols = model_data["feature_cols"]

        # Build the input DataFrame with the same column order used during training
        input_data = {
            "income":             income,
            "month":              month,
            "prev_food":          prev_food,
            "prev_transport":     prev_transport,
            "prev_shopping":      prev_shopping,
            "prev_entertainment": prev_entertainment,
            "prev_utilities":     prev_utilities,
            "prev_health":        prev_health,
            "prev_travel":        prev_travel,
            "prev_other":         prev_other,
            "prev_total":         prev_total,
        }

        input_df = pd.DataFrame([input_data])[feature_cols]

        # Predict each category
        results = {}
        for cat in CATEGORIES:
            prediction = models[cat].predict(input_df)[0]
            results[cat] = round(max(0, float(prediction)), 2)  # No negative spending

        print(json.dumps(results))

    except Exception as e:
        print(json.dumps({"error": str(e)}))


if __name__ == "__main__":
    main()
