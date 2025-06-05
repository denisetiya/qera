import { Plugin, Middleware } from '../types';

export interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export class CorsPlugin implements Plugin {
  name = 'cors';
  private options: CorsOptions;

  constructor(options: CorsOptions = {}) {
    this.options = {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false,
      maxAge: 86400,
      ...options
    };
  }

  install(app: any): void {
    const middleware: Middleware = (req, res, next) => {
      const origin = req.headers?.origin || '';
      
      // Handle origin
      if (this.options.origin === true) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else if (typeof this.options.origin === 'string') {
        res.setHeader('Access-Control-Allow-Origin', this.options.origin);
      } else if (Array.isArray(this.options.origin)) {
        if (this.options.origin.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        }
      }

      // Handle methods
      if (this.options.methods) {
        res.setHeader('Access-Control-Allow-Methods', this.options.methods.join(', '));
      }

      // Handle headers
      if (this.options.allowedHeaders) {
        res.setHeader('Access-Control-Allow-Headers', this.options.allowedHeaders.join(', '));
      }

      // Handle credentials
      if (this.options.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      // Handle preflight
      if (req.method === 'OPTIONS') {
        if (this.options.maxAge) {
          res.setHeader('Access-Control-Max-Age', this.options.maxAge.toString());
        }
        res.status(204).send('');
        return;
      }

      next();
    };

    app.use(middleware);
  }
}