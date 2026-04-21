import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET;

/**
 * Express middleware that verifies a Bearer JWT token.
 * On success, attaches `req.user` with { id, email }.
 */
export const protect = (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, jwtSecret!) as { userId: number; email: string };
      req.user = { id: decoded.userId, email: decoded.email };
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, no token' });
};
