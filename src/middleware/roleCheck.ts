import { Request, Response, NextFunction } from 'express';

/**
 * Higher-order middleware to enforce Role-Based Access Control (RBAC).
 * Expects the `authenticate` middleware to have run beforehand to populate `req.user`.
 * 
 * @param allowedRoles Array of roles authorized to access the route
 */
export const checkRole = (allowedRoles: ('ADMIN' | 'MANAGER' | 'EMPLOYEE')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if the user is authenticated (req.user exists)
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. User context is missing.'
      });
      return;
    }

    const userRole = req.user.role;

    // Check if the user's role is in the list of allowed roles
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. This resource requires one of the following roles: ${allowedRoles.join(', ')}.`
      });
      return;
    }

    next();
  };
};
