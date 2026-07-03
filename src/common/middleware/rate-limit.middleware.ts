import type { NextFunction, Request, Response } from 'express';

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function rateLimitMiddleware() {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const max = Number(process.env.RATE_LIMIT_MAX ?? 120);

  return (request: Request, response: Response, next: NextFunction) => {
    if (request.method === 'OPTIONS') return next();

    const now = Date.now();
    const key = `${request.ip}:${request.method}:${request.path}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      response.setHeader('X-RateLimit-Limit', String(max));
      response.setHeader('X-RateLimit-Remaining', String(max - 1));
      return next();
    }

    bucket.count += 1;
    const remaining = Math.max(0, max - bucket.count);
    response.setHeader('X-RateLimit-Limit', String(max));
    response.setHeader('X-RateLimit-Remaining', String(remaining));
    response.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > max) {
      return response.status(429).json({
        success: false,
        statusCode: 429,
        message: 'Too many requests. Please try again shortly.',
        timestamp: new Date().toISOString(),
      });
    }

    return next();
  };
}
