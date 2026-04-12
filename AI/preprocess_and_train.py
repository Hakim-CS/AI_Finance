import pandas as pd
import xgboost as xgb
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
import joblib

# Load the dataset
df = pd.read_csv('Personal_Finance_Dataset.csv')

# Convert Date
df['Date'] = pd.to_datetime(df['Date'])
df['Month_Year'] = df['Date'].dt.to_period('M')

# Pivot the data to get one row per month
# This creates columns like 'Food & Drink', 'Utilities', 'Rent', etc.
pivot_df = df.pivot_table(
    index='Month_Year',
    columns='Category',
    values='Amount',
    aggfunc='sum'
).fillna(0)

# Calculate Total Monthly Income
monthly_income = df[df['Type'] == 'Income'].groupby('Month_Year')['Amount'].sum()
pivot_df['Total_Income'] = monthly_income
pivot_df['Total_Income'] = pivot_df['Total_Income'].fillna(monthly_income.mean())

# Define Features (X) and Targets (y)
# X: We only use 'Total_Income' to decide the budget for everything else
X = pivot_df[['Total_Income']]

# y: All category columns (excluding Total_Income itself)
target_cols = [col for col in pivot_df.columns if col != 'Total_Income']
y = pivot_df[target_cols]

# Train the Multi-Output Gradient Boosted Tree
# We use MultiOutputRegressor because XGBoost usually predicts one number at a time.
# This wrapper allows it to predict ALL category budgets at once.
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

base_model = xgb.XGBRegressor(n_estimators=100, learning_rate=0.1, max_depth=5)
model = MultiOutputRegressor(base_model)

model.fit(X_train, y_train)

# Save the Model and the List of Categories
# We need to save the category names so the Node.js backend knows which number is which!
joblib.dump(model, 'budget_optimizer_model.pkl')
joblib.dump(target_cols, 'category_names.pkl')

print(f"Success! Trained on {len(pivot_df)} months of data.")
print(f"Model can now optimize these categories: {target_cols}")