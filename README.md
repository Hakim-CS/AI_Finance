# Aura Finance — Adaptive Budget Control System

> **Thesis Project:** Adaptive Budget Allocation Using Machine Learning and Software-in-the-Loop Control Simulation

<p align="center">
  <img src="public/ai-finance-icon.png" width="80" alt="Aura Finance Logo" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-Gradient_Boosting-3776AB?logo=python&logoColor=white" />
</p>

---

## Academic Context

| | |
|---|---|
| **Title** | Adaptive Budget Allocation Using Machine Learning and Software-in-the-Loop Control Simulation |
| **Program** | Computer Engineering (BSc) |
| **Supervisor** | Head of Mechatronics Department |
| **Framing** | Closed-loop adaptive budget control, evaluated via SIL simulation |
| **Research Question** | Can an ML-assisted adaptive controller provide a better trade-off between budget tracking accuracy, overspending prevention, and budget stability than static budgeting or direct ML prediction? |

---

## System Architecture (Mechatronics Framing)

```
Soft Sensors (manual / OCR / voice)
        |
Expense State Estimator
(monthly category aggregation)
        |
Prediction Layer
(Gradient Boosting Regressor)
        |
Adaptive Budget Controller
(saving target + income ceiling + exponential smoothing)
        |
Human-Machine Interface
(dashboard, alerts, budget recommendations)
        |
Feedback Loop
(new spending -> updated state -> loop restarts)
```

---

## Key Experimental Results

### Model Comparison (5 algorithms)
| Model | Avg MAE ($) | R² |
|-------|:-----------:|:--:|
| Linear Regression | 114.21 | 0.930 |
| Decision Tree | 115.23 | 0.902 |
| Random Forest | 106.93 | 0.933 |
| **Gradient Boosting** | **90.98** | **0.942** |
| SVR | 143.98 | 0.856 |

### Control Experiment (SIL, 60 months, 5 personas)
| Strategy | Tracking Error | vs Static | Overspend Rate | Stability |
|----------|:-:|:-:|:-:|:-:|
| Static Budget | $336 | -- | 35% | $0 (constant) |
| Last-Month Baseline | $220 | -35% | 30% | $1,211 |
| **ML Prediction (GB)** | **$182** | **-46%** | 25% | $920 |
| **Adaptive Controller** | $203 | -40% | **24%** | **$289** |

> ML Prediction is **most accurate**. Adaptive Controller is **most stable** (76% more stable than last-month baseline).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS + Recharts |
| Backend | Node.js + Express 5 + PostgreSQL |
| AI (Python) | scikit-learn (Gradient Boosting), pandas, matplotlib |
| Auth | JWT + bcryptjs |
| OCR | Tesseract.js (in-browser) |

---

## AI Pipeline

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Budget Prediction | Gradient Boosting (8 models) | Per-category spending prediction |
| Control Experiment | `control_evaluation.py` | 4-strategy SIL comparison |
| Alpha Sensitivity | `control_evaluation.py` | Smoothing factor tradeoff analysis |
| Spending Forecast | TensorFlow.js LSTM | Auxiliary next-month forecast |

---

## Getting Started

```bash
# Frontend
npm install && npm run dev

# Backend
cd backend && npm install && npm run dev

# AI (retrain models)
cd AI && python train_model_v2.py

# Run control experiment
cd AI && python control_evaluation.py
```

---

## Project Structure

```
AI_Finance/
├── src/                     # React frontend
├── backend/src/             # Node.js + Express backend
├── AI/
│   ├── train_model_v2.py    # GB training pipeline + evaluation
│   ├── control_evaluation.py # Adaptive control experiment (SIL)
│   ├── model_comparison.py  # 5-model comparison study
│   ├── predict_v2.py        # Inference script (backend calls this)
│   ├── budget_model_v2.pkl  # Trained Gradient Boosting model
│   ├── control_results.json # Experiment results + alpha sensitivity
│   └── charts/              # All thesis charts (PNG)
├── docs/                    # Project documentation
└── codex/                   # Codex review notes
```

---

<p align="center">
  Built as a Bachelor's Thesis by <a href="https://github.com/hakim-cs">Hakim</a>
</p>
