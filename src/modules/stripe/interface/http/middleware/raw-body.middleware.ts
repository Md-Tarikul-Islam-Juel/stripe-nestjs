import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import getRawBody from 'raw-body';

/**
 * Raw Body Middleware
 * Captures raw body for Stripe webhook signature verification
 */
@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    // Only capture raw body for Stripe webhook endpoints
    if (req.originalUrl?.startsWith('/stripe/webhook')) {
      try {
        req['rawBody'] = await getRawBody(req);
      } catch (error) {
        // If raw body cannot be captured, continue without it
        // Webhook verification will fail, which is the correct behavior
      }
    }
    next();
  }
}
