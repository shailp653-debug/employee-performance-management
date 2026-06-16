import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Define the shape of the JWT payload
export interface UserPayload {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

// Extend Express Request interface to include the user payload
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

/**
 * Middleware to authenticate requests using JWT.
 * Expects Authorization header in format: Bearer <token>
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token is missing or invalid. Format should be: Bearer <token>'
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(500).json({
        success: false,
        message: 'JWT Secret is not configured on the server.'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as UserPayload;
    
    // Inject decoded user payload into the request object
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Access token has expired.'
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid access token.'
    });
  }
};
