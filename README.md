# Aura Finance

> AI-powered personal finance tracker with ML budget predictions, adaptive smoothing, and multi-modal expense input.

<p align="center">
  <img src="public/ai-finance-icon.png" width="80" alt="Aura Finance Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express_5-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-scikit--learn-3776AB?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/TensorFlow.js-LSTM-FF6F00?logo=tensorflow&logoColor=white" />
  <img src="https://img.shields.io/badge/Whisper-STT-74aa9c?logo=openai&logoColor=white" />
</p>

---

## Features

### 💰 Multi-Modal Expense Input
- **Manual entry** — structured form with amount, category, date, and notes
- **Voice input** — Whisper-based speech-to-text with NLP amount extraction and scoring-based category classification (EN/TR/DE)
- **Receipt scanning** — Tesseract.js OCR extracts totals using keyword search with fallback to highest-value heuristic

### 🤖 AI Budget Optimizer
- Gradient Boosting regression model predicts next month's spending per category
- Exponential smoothing controller (α=0.7) stabilizes recommendations across months
- Income-constrained normalization ensures budgets never exceed spendable income
- One-click "Optimize with AI" applies data-driven budget allocations

### 📈 Dashboard & Analytics
- Monthly spending overview with category breakdowns
- LSTM/SimpleRNN-based spending forecast with trend visualization
- Budget vs. actual comparison per category
- AI-generated financial insights

### 👥 Groups & Loans
- Create expense groups with automatic per-member cost splitting
- Loan tracking with payment history and outstanding balances

### ⚙️ Settings & Personalization
- Income and savings target configuration
- Profile customization with avatar upload and image cropping
- Multi-language support (English, Turkish, German)
- Dark / light theme

---

## Screenshots

<p align="center">
  <img src="ScreenShots/sc1.png" width="400" />
  <img src="ScreenShots/sc2.png" width="400" />
</p>

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend  (React 18 + Vite + TypeScript + Tailwind CSS)    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │Dashboard │ │ Expenses │ │  Budget  │ │ Groups/Loans  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬───────┘  │
│       │  REST API (JWT auth)    │                │          │
├───────┴─────────────────────────┴────────────────┴──────────┤
│  Backend  (Node.js + Express 5 + PostgreSQL)                │
│  ┌──────────┐ ┌──────────────┐ ┌────────────────────────┐   │
│  │Auth (JWT)│ │ CRUD Routes  │ │  AI Service            │   │
│  │+ bcrypt  │ │ (expenses,   │ │  ├─ LSTM forecast      │   │
│  │          │ │  budgets,    │ │  ├─ NLP voice parser    │   │
│  │          │ │  groups,     │ │  └─ category classifier │   │
│  │          │ │  loans)      │ │                        │   │
│  └──────────┘ └──────────────┘ └───────────┬────────────┘   │
│                                   child_process.exec()      │
├────────────────────────────────────────────┬─────────────────┤
│  Python AI Module                          │                 │
│  ┌─────────────────┐  ┌──────────────────┐ │                 │
│  │ predict_v2.py   │  │ transcribe.py    │ │                 │
│  │ (8× GB models)  │  │ (Whisper base)   │ │                 │
│  └────────┬────────┘  └──────────────────┘ │                 │
│           │                                │                 │
│  budget_model_v2.pkl                       │                 │
└────────────────────────────────────────────┘                 │
                                                              │
┌─────────────────────────────────────────────────────────────┘
│  PostgreSQL
│  Tables: User, Expense, Budget, Category, Loan, Group, ...
└──────────────────────────────────────────────────────────────
```

---

## ML & AI Algorithms

### Gradient Boosting Regression (Budget Prediction)

The core prediction engine uses **scikit-learn's `GradientBoostingRegressor`** — 8 independent models, one per spending category. Each model is a one-step-ahead predictor: given this month's state, predict next month's spending.

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `n_estimators` | 100 | 100 sequential boosting stages |
| `max_depth` | 4 | Shallow trees — GB performs better with weak learners |
| `learning_rate` | 0.1 | Conservative step size to prevent overfitting |
| `min_samples_leaf` | 3 | Regularization for small dataset |

**How it works:** Each tree in the ensemble is trained on the *residual errors* of all previous trees. The prediction is the sum of all trees' outputs, weighted by the learning rate:

```
F_m(x) = F_{m-1}(x) + ν · h_m(x)
```

**Feature vector (11 dimensions):**
```
[income, month, prev_food, prev_transport, prev_shopping,
 prev_entertainment, prev_utilities, prev_health,
 prev_travel, prev_other, prev_total]
```

**Performance:** MAE = $90.98, R² = 0.94 — selected over Linear Regression, Decision Tree, Random Forest, and SVR through a 5-model comparison study.

---

### Exponential Smoothing Controller (Budget Stabilization)

Raw ML predictions jump between months (especially for volatile categories like travel). The adaptive controller smooths recommendations:

```
B_smooth(c,t) = α · B(c,t-1) + (1-α) · B_ml(c,t)      α = 0.7
B_final(c,t)  = B_smooth(c,t) / Σ B_smooth(j,t) · (I - S)
```

- **α = 0.7** means 70% previous budget + 30% new ML prediction
- The normalization step guarantees all budgets sum to `income - savings`
- BIBO-stable for any α ∈ (0, 1) — the output can never exceed available income

**Result:** 68.5% reduction in budget instability vs. raw ML, at a cost of only 11.3% accuracy.

---

### LSTM / SimpleRNN (Spending Forecast)

A TensorFlow.js recurrent neural network runs in the backend for auxiliary per-user spending forecasting:

- **< 5 months of data** → SimpleRNN (16 units) — more stable with sparse data
- **≥ 5 months of data** → LSTM (32 units) — captures longer-term dependencies
- Trained per-user with 250 epochs; models are cached in memory and invalidated on new expense entry

---

### Whisper (Speech-to-Text)

OpenAI's open-source **Whisper `base` model** (74MB) runs locally for voice expense input:

```
Audio → Whisper STT → raw text → Amount extraction (regex) → Category classification (scoring engine)
```

No API calls, no cloud dependency — everything runs on the user's machine.

---

### Scoring-Based Category Classifier (NLP)

A deterministic multi-language classifier for voice and receipt text:

- **350+ keywords** across 7 categories in English, Turkish, and German
- **Phrase matching** with higher weight (e.g., "gas station" scores 3, "gas" scores 1)
- **Word-boundary regex** prevents false positives ("bus" won't match "business")
- **Disambiguation rules** resolve ambiguity ("gas bill" → utilities, "gas station" → transport)
- **Scoring system** — all categories accumulate scores, highest wins (not first-match)

---

### Tesseract.js (Receipt OCR)

In-browser OCR for receipt scanning with a two-stage amount extraction strategy:

1. **Keyword search** — looks for "total", "toplam", "summe", etc. followed by a number
2. **Fallback** — if no keyword match, takes the highest numeric value on the receipt

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, Recharts | SPA with responsive dashboard |
| **Backend** | Node.js, Express 5, TypeScript, PostgreSQL | REST API, auth, business logic |
| **AI — Prediction** | Python, scikit-learn (Gradient Boosting), pandas, joblib | Budget prediction (8 models) |
| **AI — Forecast** | TensorFlow.js (LSTM / SimpleRNN) | Per-user spending trend forecast |
| **AI — Voice** | OpenAI Whisper (local, `base` model) | Speech-to-text transcription |
| **AI — OCR** | Tesseract.js (in-browser) | Receipt text extraction |
| **Auth** | JWT + bcryptjs | Stateless authentication |
| **i18n** | i18next + react-i18next | EN / TR / DE localization |

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.9+ with pip
- **PostgreSQL** 15+

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

```bash
cp Backend/.env.example Backend/.env
```

Edit `Backend/.env` with your database credentials and a JWT secret. See [`.env.example`](Backend/.env.example) for all options.

### 3. Run

```bash
# Terminal 1 — Backend (port 5001)
cd Backend && npm run dev

# Terminal 2 — Frontend (port 5173)
npm run dev
```

Open `http://localhost:5173` in your browser.

### 4. (Optional) Retrain the ML model

```bash
cd AI
python generate_training_data.py   # Generate synthetic persona data
python train_model_v2.py           # Train → budget_model_v2.pkl
```

---

## Project Structure

```
AI_Finance/
├── src/                          # React frontend
│   ├── pages/                    #   Dashboard, Expenses, Budget, Groups, Loans, Settings
│   ├── components/               #   UI components (ai/, budget/, dashboard/, expense/, ...)
│   ├── context/                  #   Auth & theme providers
│   ├── hooks/                    #   Custom React hooks
│   ├── i18n/                     #   Internationalization (EN/TR/DE)
│   └── lib/                      #   API client, utilities
│
├── Backend/src/                  # Express API server
│   ├── routes/                   #   auth, expense, budget, ai, group, loan, account
│   ├── services/                 #   ai.service.ts (LSTM, NLP classifier, receipt parser)
│   ├── middleware/               #   JWT auth, file upload (multer)
│   └── config/                   #   Database connection (pg Pool)
│
├── AI/                           # Python ML module
│   ├── predict_v2.py             #   Inference script (called by backend via child_process)
│   ├── train_model_v2.py         #   Training pipeline → budget_model_v2.pkl
│   ├── transcribe.py             #   Whisper speech-to-text
│   ├── generate_training_data.py #   Synthetic persona data generator
│   ├── budget_model_v2.pkl       #   Trained Gradient Boosting model (2MB)
│   ├── monthly_summary.csv       #   Aggregated training data (180 rows)
│   ├── training_data.csv         #   Transaction-level data (6,979 records)
│   └── personas.json             #   5 synthetic user profiles
│
└── public/                       # Static assets
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/register` | Register new user |
| `POST` | `/auth/login` | Login → JWT token |
| `GET` | `/expenses` | List user expenses |
| `POST` | `/expenses` | Add expense |
| `POST` | `/expenses/transcribe-voice` | Voice → Whisper STT → parsed expense |
| `POST` | `/expenses/parse-receipt` | Receipt text → parsed expense |
| `GET` | `/budgets` | List budget limits |
| `POST` | `/budgets/optimize` | AI budget optimization |
| `GET` | `/ai/insights` | AI-generated financial insights |
| `GET` | `/ai/forecast` | LSTM spending forecast |
| `POST` | `/groups` | Create expense group |
| `POST` | `/loans` | Create loan |

### Using CodeRabbit in this project

1. Install the **CodeRabbit GitHub App** and grant access to this repository.
2. Enable CodeRabbit for this repository.
3. Open a pull request. CodeRabbit will automatically review PR changes.
4. Use the root config file (`.coderabbit.yaml`) to tune behavior such as review profile and excluded paths.
5. If you need another pass after updates, push new commits or comment `/review` on the PR.

---

## License

MIT

---

<p align="center">
  Built by <a href="https://github.com/hakim-cs">Hakim</a>
</p>
