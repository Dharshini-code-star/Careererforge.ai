import { NextFunction, Request, Response } from 'express';

type Bucket = { count: number; resetAt: number };

/** A small dependency-free guard for credential endpoints. Use a shared store in multi-instance deployments. */
export const createRateLimit = (windowMs: number, maxRequests: number) => {
  const buckets = new Map<string, Bucket>();
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = req.ip || 'unknown';
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    if (bucket.count >= maxRequests) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      res.status(429).json({ success: false, message: 'Too many attempts. Please try again shortly.' });
      return;
    }
    bucket.count += 1;
    next();
  };
};
