<p align="center">
  <img src="public/ai-finance-icon.png" width="80" alt="Aura Finance Logo" />
</p>

<h1 align="center">Aura Finance</h1>

<p align="center">
  <strong>AI-Powered Personal Finance Management</strong><br/>
  Track spending, predict budgets, and optimize finances — powered by machine learning.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-ML-3776AB?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/TensorFlow.js-LSTM-FF6F00?logo=tensorflow&logoColor=white" />
</p>

---

## Preview

<table>
  <tr>
    <td width="50%"><img src="ScreenShots/sc2.png" alt="Dashboard Charts" /></td>
    <td width="50%"><img src="ScreenShots/sc3.png" alt="Expenses Page" /></td>
  </tr>
  <tr>
    <td width="50%"><img src="ScreenShots/sc4.png" alt="Budget Management" /></td>
    <td width="50%"><img src="ScreenShots/sc5.png" alt="AI Predictions" /></td>
  </tr>
  <tr>
    <td width="50%"><img src="ScreenShots/sc8.png" alt="Dark Mode" /></td>
    <td width="50%"><img src="ScreenShots/sc9.png" alt="Receipt Scanner" /></td>
  </tr>
</table>

---

## What is Aura Finance?

Aura Finance is a full-stack personal finance application that goes beyond simple expense tracking. It uses **two machine learning models** to understand your spending patterns and help you budget smarter:

- A **Random Forest model** trained on persona-based financial data that predicts optimal budget allocations per category — achieving **24.5% better accuracy** than naive baselines
- An **LSTM neural network** that forecasts your total spending for the upcoming month based on historical trends

The result: instead of guessing how much to budget for food, transport, or entertainment, you get AI-generated suggestions that adapt to your income, habits, and seasonal patterns.

---

## Features

### Smart Expense Tracking
- **Manual entry** — Quick form with category, amount, date, and notes
- **Receipt scanner** — Upload a receipt photo; OCR extracts the amount and category automatically (Tesseract.js, runs in-browser)
- **Voice input** — Say "I spent 25 dollars on food" and it gets logged

### AI Budget Optimizer
- Click **"Optimize with AI"** and get per-category budget suggestions
- The model uses your **actual last month's spending** + income + current month to predict
- New users get smart defaults; returning users get personalized predictions
- Budget ceiling respects your saving target

### AI Spending Forecast
- LSTM neural network predicts next month's total spending
- Confidence score increases with more data history
- Falls back to simpler models when data is limited

### AI Insights & Alerts
- End-of-month balance forecast
- Over-budget category warnings
- Spending shift detection (> 20% change vs. last month)
- Large transaction flags
- Recurring payment / subscription detection

### Budget Management
- Set limits per category with visual progress bars
- Semantic color coding (green / amber / red as you approach limits)
- Batch edit via "Manage Categories" dialog
- Real-time sync between budget changes and AI predictions

### Group Expenses
- Create groups, add members by email
- Log shared expenses — automatically split equally
- Each member sees only their share in personal reports

### Loan Tracker
- Track money lent and borrowed
- Mark loans as settled
- Summary of outstanding amounts

### Multi-Language & Dark Mode
- Full i18n support: English, Turkish, German
- System-aware dark mode with manual override
- Theme and language accessible before login

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | Component framework + fast dev server |
| TypeScript | Type-safe development |
| Tailwind CSS + shadcn/ui | Styling + accessible component library |
| TanStack Query | Server state management + caching |
| Recharts | Interactive SVG charts |
| Tesseract.js | In-browser OCR for receipts |
| i18next | Internationalization (EN/TR/DE) |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| PostgreSQL + pg | Relational database |
| bcryptjs + JWT | Authentication |
| TensorFlow.js | LSTM spending forecast (runs in Node.js) |
| child_process | Spawns Python ML inference |

### AI / ML
| Technology | Purpose |
|---|---|
| scikit-learn (Random Forest) | Per-category budget prediction |
| pandas | Data processing |
| matplotlib | Evaluation chart generation |
| joblib | Model serialization |

---

## AI Model Performance

The Random Forest model was trained on persona-based data (5 user profiles, 3 years, 6,979 transactions) and evaluated against two baselines:

| Category | Our Model (MAE) | Last Month Baseline | Improvement |
|----------|:---:|:---:|:---:|
| Food | $96.85 | $143.14 | **+32.3%** |
| Transport | $43.83 | $52.68 | +16.8% |
| Shopping | $175.62 | $215.23 | +18.4% |
| Entertainment | $59.87 | $73.84 | +18.9% |
| Utilities | $108.69 | $159.54 | **+31.9%** |
| Health | $54.00 | $75.79 | +28.8% |
| Travel | $275.49 | $363.47 | +24.2% |
| Other | $41.07 | $49.92 | +17.7% |
| **Overall** | **$106.93** | **$141.70** | **+24.5%** |

> The model uses 11 features: income, month, and 8 previous-month category spending values + previous total. Feature importance analysis shows that **previous spending patterns** are the strongest predictors — confirming that personal habits matter more than calendar month.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/)
- [Python 3.10+](https://www.python.org/) with `scikit-learn`, `pandas`, `joblib`

### 1. Clone & Install

```bash
git clone https://github.com/hakim-cs/AI_Finance.git
cd AI_Finance

# Frontend
npm install

# Backend
cd backend
npm install
```

### 2. Configure Environment

Create `backend/.env`:
```env
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/aura_finance
JWT_SECRET=your_secret_key_here
```

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend (from project root)
npm run dev
```

Open **http://localhost:5173** in your browser.

> Both servers must run simultaneously. The database tables are created automatically on first startup.

### 4. Retrain AI Model (optional)

```bash
cd AI
python generate_training_data.py   # Generate persona-based dataset
python train_model_v2.py           # Train, evaluate, and generate charts
```

---

## Project Structure

```
AI_Finance/
├── src/                          # React frontend
│   ├── pages/                    # Dashboard, Budget, Expenses, Groups
│   ├── components/
│   │   ├── ai/                   # AI forecast, predictions, alerts
│   │   ├── budget/               # Budget cards, charts, dialogs
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── expense/              # Expense form, table, receipt scanner
│   │   ├── groups/               # Group management
│   │   └── layout/               # Sidebar, header
│   ├── hooks/                    # Data fetching (useExpenses, useBudget...)
│   ├── context/                  # Auth context
│   └── i18n/                     # Translations (EN/TR/DE)
│
├── backend/src/
│   ├── routes/                   # Modular API routes
│   ├── middleware/                # JWT auth middleware
│   ├── config/                   # Database setup + migrations
│   └── app.ts                    # Server entry point
│
├── AI/
│   ├── generate_training_data.py # Persona-based data generator
│   ├── train_model_v2.py         # ML training pipeline + evaluation
│   ├── predict_v2.py             # Inference script (called by backend)
│   ├── budget_model_v2.pkl       # Trained Random Forest model
│   ├── training_data.csv         # 6,979 generated transactions
│   ├── monthly_summary.csv       # 180 monthly aggregations
│   ├── evaluation_results.json   # MAE / RMSE / R² metrics
│   ├── feature_importances.json  # Feature weights per category
│   └── charts/                   # Evaluation charts (PNG)
│
└── ScreenShots/                  # Application screenshots
```

---

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with &#10084;&#65039; by <a href="https://github.com/hakim-cs">Hakim</a>
</p>
