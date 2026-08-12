import { NextFunction, Request, Response } from 'express';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Protección CSRF adicional: las peticiones que modifican estado solo se aceptan
// cuando vienen de un navegador cuyo Origin/Referer corresponde al frontend.
export function originGuard(req: Request, res: Response, next: NextFunction) {
  if (STATE_CHANGING_METHODS.has(req.method)) {
    const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:4200';
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    if (origin && origin !== allowedOrigin) {
      res.status(403).json({ statusCode: 403, message: 'Origen no permitido' });
      return;
    }
    if (referer && !referer.startsWith(allowedOrigin)) {
      res.status(403).json({ statusCode: 403, message: 'Origen no permitido' });
      return;
    }
  }
  next();
}
