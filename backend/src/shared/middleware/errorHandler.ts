import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
};
