import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { initDatabase } from './config/database';
import { AVATARS_DIR } from './middleware/upload';
import { authRoutes } from './routes/auth.routes';
import { preferencesRoutes } from './routes/preferences.routes';
import { accountRoutes, startAccountCleanupJob } from './routes/account.routes';
import { expenseRoutes } from './routes/expense.routes';
import { budgetRoutes } from './routes/budget.routes';
import { aiRoutes } from './routes/ai.routes';
import { groupRoutes } from './routes/group.routes';
import { loanRoutes } from './routes/loan.routes';

// Load env + type augmentations
import './types/express';
dotenv.config();

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set');
if (!process.env.JWT_SECRET)   throw new Error('JWT_SECRET not set');

const app = express();
const port = process.env.PORT || 5001;

// ── Global middleware ───────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Avatar static files
app.use('/avatars', express.static(AVATARS_DIR));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// ── Initialize database ────────────────────────────────────────────────────
initDatabase().catch(err => console.error('DB Connection Error:', err.message));

// ── Mount route modules ────────────────────────────────────────────────────
app.use(authRoutes);
app.use(preferencesRoutes);
app.use(accountRoutes);
app.use(expenseRoutes);
app.use(budgetRoutes);
app.use(aiRoutes);
app.use(groupRoutes);
app.use(loanRoutes);

// ── Health check routes ────────────────────────────────────────────────────
app.get('/', (_req, res) => res.send('Aura Finance Backend is running!'));
app.get('/ping', (_req, res) => res.json({ message: 'pong', version: '1.1', timestamp: new Date() }));

app.get('/debug/routes', (_req, res) => {
  const routes: string[] = [];
  (app as any)._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          routes.push(`${Object.keys(handler.route.methods)} ${handler.route.path}`);
        }
      });
    }
  });
  res.json(routes);
});

// ── Start background jobs ──────────────────────────────────────────────────
startAccountCleanupJob();

// ── Start server ───────────────────────────────────────────────────────────
app.listen(port, () => console.log(`Server running on port ${port}`));
