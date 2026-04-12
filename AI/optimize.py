import sys
import joblib
import pandas as pd
import json

def main():
    # Get Income from command line argument
    try:
        user_income = float(sys.argv[1])
    except:
        print(json.dumps({"error": "No income provided"}))
        return

    # Load the trained model and category names
    model = joblib.load('budget_optimizer_model.pkl')
    categories = joblib.load('category_names.pkl')

    # Create input for the model
    # The model expects a DataFrame with the column 'Total_Income'
    input_df = pd.DataFrame([[user_income]], columns=['Total_Income'])

    # Predict (Inference)
    predictions = model.predict(input_df)[0]

    # Format results as JSON
    # We round the numbers to 2 decimal places
    results = {}
    for cat, pred in zip(categories, predictions):
        results[cat] = round(float(pred), 2)

    # Print the JSON result (Node.js will read this)
    print(json.dumps(results))

if __name__ == "__main__":
    main()