# Aura Finance - AI-Powered Personal Finance Management

Aura Finance is a comprehensive personal finance management system that leverages Artificial Intelligence to provide users with intelligent spending insights, automated expense tracking, and predictive budgeting.


## 📷 Screenshots

<p float="left">
  <img width="430" src="ScreenShots/sc1.png">
  <img width="430" src="ScreenShots/sc2.png">
  <img width="430" src="ScreenShots/sc3.png">
  <img width="430" src="ScreenShots/sc4.png">
  <img width="430" src="ScreenShots/sc5.png">
  <img width="430" src="ScreenShots/sc6.png">
  <img width="430" src="ScreenShots/sc7.png">
  <img width="430" src="ScreenShots/sc8.png">
  <img width="430" src="ScreenShots/sc9.png">
  <img width="430" src="ScreenShots/sc10.png">
</p>

## 🚀 Features

- **Intuitive Dashboard**: Real-time overview of your financial health with interactive charts.
- **Smart Expense Tracking**:
  - **Manual Entry**: Quick and easy form for logging expenses.
  - **Receipt OCR**: Automatic extraction of amount and category from receipt images using Tesseract.js.
  - **Voice Input**: Natural language processing to log expenses via voice commands.
- **AI-Powered Insights**:
  - **Budget Forecasting**: LSTM-based predictions for future spending patterns using TensorFlow.js.
  - **Spending Trends**: Visual analytics to identify habits and optimize savings.
- **Group Management**: Shared expense tracking and split-wise capabilities for groups.
- **Modern UI/UX**: Built with React, Tailwind CSS, and shadcn/ui for a seamless, responsive experience.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS & shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Charts**: Recharts
- **OCR**: Tesseract.js

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: PostgreSQL (using `pg` pool)
- **AI/ML**: TensorFlow.js (LSTM/RNN models)
- **Authentication**: JWT & Bcrypt.js

## 📦 Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) database

### 1. Clone the Repository
```bash
git clone https://github.com/itkhld1/bsc-thesis-finance-tracker.git
cd bsc-thesis-finance-tracker
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd aura-finance-backend
npm install
```

Create a `.env` file in the `aura-finance-backend` directory with the following variables:
```env
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/aura_finance
JWT_SECRET=your_super_secret_key
```

### 3. Frontend Setup
Navigate back to the root directory and install dependencies:
```bash
cd ..
npm install
```

## 🚀 Usage

### Running the Application
To start the project, you need to run both the backend and the frontend.

**Start the Backend:**
```bash
cd aura-finance-backend
npm run dev
```

**Start the Frontend:**
```bash
# In the root directory
npm run dev
```

The application will be available at `http://localhost:5173` (by default).

## ⚙️ Configuration

### Environment Variables

#### Backend (`aura-finance-backend/.env`)
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | The port the backend server runs on | `5001` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | Secret key for signing JWT tokens | - |

#### Frontend
The frontend is configured to communicate with the backend at `http://localhost:5001`. You can modify the API URL in the source code if needed (e.g., in `src/components/expense/ReceiptUpload.tsx`).

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 Thesis Information

This project is developed as part of a thesis demonstrating the integration of AI-powered recommendations in personal finance management applications.
