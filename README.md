# Aura Finance

> AI-powered personal finance tracker with smart budget recommendations.

<p align="center">
  <img src="public/ai-finance-icon.png" width="80" alt="Aura Finance Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express_5-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-scikit--learn-3776AB?logo=python&logoColor=white" />
</p>

---

## Features

### 💰 Expense Tracking
- **Manual entry** — add expenses with amount, category, date, and notes
- **Voice input** — speak your expense and the app extracts amount & category using Whisper AI
- **Receipt scanning** — snap a photo of a receipt and OCR extracts the total automatically

### 📊 AI Budget Optimizer
- Gradient Boosting ML model predicts your next month's spending per category
- Recommendations are smoothed for stability so your budget doesn't jump around wildly
- One-click "Optimize with AI" applies data-driven budget allocations

### 📈 Dashboard & Analytics
- Monthly spending overview with category breakdowns
- Spending trends over time with interactive charts
- Budget vs. actual comparison per category
- AI-generated financial insights

### 👥 Group Expenses
- Create groups and split expenses among members
- Track who paid and each person's share

### 💳 Loan Tracking
- Track money lent and borrowed
- Payment history and outstanding balances

### ⚙️ Settings
- Income and savings target configuration
- Profile customization with avatar upload and cropping
- Multi-language support (English, Turkish, German)
- Dark/light theme

---

## Screenshots

<p align="center">
  <img src="ScreenShots/sc1.png" width="400" />
  <img src="ScreenShots/sc2.png" width="400" />
</p>

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 · Vite · TypeScript · Tailwind CSS · shadcn/ui · Recharts |
| **Backend** | Node.js · Express 5 · PostgreSQL · JWT auth |
| **AI** | Python · scikit-learn (Gradient Boosting) · Whisper (speech-to-text) |
| **OCR** | Tesseract.js (in-browser) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL 15+

### 1. Clone & install

```bash
git clone https://github.com/hakim-cs/AI_Finance.git
cd AI_Finance

# Frontend
npm install

# Backend
cd Backend && npm install && cd ..

# Python AI dependencies
pip install scikit-learn pandas joblib openai-whisper
```

### 2. Configure environment

Create a `.env` file in the `Backend/` folder:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/aura_finance
JWT_SECRET=your-secret-key
PORT=5000
```

### 3. Run

```bash
# Terminal 1 — Backend
cd Backend && npm run dev

# Terminal 2 — Frontend
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

```
AI_Finance/
├── src/                      # React frontend
│   ├── pages/                # Dashboard, Expenses, Budget, Groups, Loans, Settings
│   ├── components/           # Reusable UI components
│   ├── context/              # Auth & theme context
│   └── i18n/                 # Internationalization (EN/TR/DE)
├── Backend/src/              # Express API server
│   ├── routes/               # REST endpoints
│   ├── services/             # AI service (LSTM forecast, NLP parsing)
│   ├── middleware/           # JWT auth middleware
│   └── config/               # Database connection
├── AI/                       # Python ML module
│   ├── predict_v2.py         # Inference script (called by backend)
│   ├── train_model_v2.py     # Model training pipeline
│   ├── transcribe.py         # Whisper speech-to-text
│   ├── generate_training_data.py  # Synthetic data generator
│   └── budget_model_v2.pkl   # Trained Gradient Boosting model
└── public/                   # Static assets
```

---

## AI Pipeline

```
User's expense history → Feature engineering (prev-month spending + income + seasonality)
    → Gradient Boosting prediction (8 independent models, one per category)
    → Exponential smoothing (α=0.7 for stability)
    → Income-constrained normalization
    → Budget recommendation displayed on dashboard
```

The model uses 11 features (income, month, and 9 previous-month spending values) to predict spending across 8 categories: food, transport, shopping, entertainment, utilities, health, travel, and other.

### Retraining the model

```bash
cd AI
python generate_training_data.py   # Generate synthetic persona data
python train_model_v2.py           # Train and save budget_model_v2.pkl
```

---

## License

MIT

---

<p align="center">
  Built by <a href="https://github.com/hakim-cs">Hakim</a>
</p>
