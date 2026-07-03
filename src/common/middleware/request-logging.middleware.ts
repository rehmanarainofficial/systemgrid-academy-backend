import type { NextFunction, Request, Response } from 'express';

export function requestLoggingMiddleware() {
  return (request: Request, response: Response, next: NextFunction) => {
    const startedAt = Date.now();
    response.on('finish', () => {
      const logLevel = process.env.LOG_LEVEL ?? 'warn';
      if (logLevel === 'silent') return;
      if (response.statusCode < 400 && logLevel !== 'debug') return;

      const duration = Date.now() - startedAt;
      const log = {
        method: request.method,
        path: request.originalUrl,
        statusCode: response.statusCode,
        durationMs: duration,
        ip: request.ip,
        userAgent: request.get('user-agent') ?? '',
      };

      if (response.statusCode >= 500) {
        console.error('[request]', log);
      } else if (response.statusCode >= 400) {
        console.warn('[request]', log);
      } else {
        console.log('[request]', log);
      }
    });
    next();
  };
}
