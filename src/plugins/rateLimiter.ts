import { Plugin, Middleware, RateLimitOptions } from '../types';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export class RateLimiterPlugin implements Plugin {
  name = 'rateLimiter';
  private store: RateLimitStore = {};
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions) {
    this.options = {
      message: 'Too many requests',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...options
    };

    // Clean up expired entries every minute
    setInterval(() => {
      const now = Date.now();
      Object.keys(this.store).forEach(key => {
        if (this.store[key].resetTime < now) {
          delete this.store[key];
        }
      });
    }, 60000);
  }

  install(app: any): void {
    const middleware: Middleware = (req, res, next) => {
      const key = this.generateKey(req);
      const now = Date.now();
      
      if (!this.store[key] || this.store[key].resetTime < now) {
        this.store[key] = {
          count: 0,
          resetTime: now + this.options.windowMs
        };
      }

      const record = this.store[key];
      
      if (record.count >= this.options.maxRequests) {
        const remaining = Math.ceil((record.resetTime - now) / 1000);
        res.setHeader('X-RateLimit-Limit', this.options.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', remaining.toString());
        res.status(429).json({ error: this.options.message });
        return;
      }

      record.count++;
      
      res.setHeader('X-RateLimit-Limit', this.options.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (this.options.maxRequests - record.count).toString());
      res.setHeader('X-RateLimit-Reset', Math.ceil((record.resetTime - now) / 1000).toString());

      next();
    };

    app.use(middleware);
  }

  private generateKey(req: any): string {
    return req.ip || 'anonymous';
  }
}