// Extend the Express Request interface globally so all route files
// can access req.user without re-declaring it.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
      };
    }
  }
}
