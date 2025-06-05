import { Plugin, Middleware } from '../types/index.js';

export interface HelmetOptions {
  contentSecurityPolicy?: boolean | string;
  crossOriginEmbedderPolicy?: boolean;
  crossOriginOpenerPolicy?: boolean;
  crossOriginResourcePolicy?: boolean;
  dnsPrefetchControl?: boolean;
  frameguard?: boolean | string;
  hidePoweredBy?: boolean;
  hsts?: boolean | { maxAge?: number; includeSubDomains?: boolean };
  ieNoOpen?: boolean;
  noSniff?: boolean;
  originAgentCluster?: boolean;
  permittedCrossDomainPolicies?: boolean;
  referrerPolicy?: boolean | string;
  xssFilter?: boolean;
}

export class HelmetPlugin implements Plugin {
  name = 'helmet';
  private options: HelmetOptions;

  constructor(options: HelmetOptions = {}) {
    this.options = {
      contentSecurityPolicy: true,
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: true,
      dnsPrefetchControl: true,
      frameguard: true,
      hidePoweredBy: true,
      hsts: true,
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: true,
      referrerPolicy: true,
      xssFilter: true,
      ...options
    };
  }

  install(app: any): void {
    const middleware: Middleware = (req, res, next) => {
      // Content Security Policy
      if (this.options.contentSecurityPolicy) {
        const csp = typeof this.options.contentSecurityPolicy === 'string' 
          ? this.options.contentSecurityPolicy
          : "default-src 'self'";
        res.setHeader('Content-Security-Policy', csp);
      }

      // Cross-Origin Embedder Policy
      if (this.options.crossOriginEmbedderPolicy) {
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      }

      // Cross-Origin Opener Policy
      if (this.options.crossOriginOpenerPolicy) {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      }

      // Cross-Origin Resource Policy
      if (this.options.crossOriginResourcePolicy) {
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      }

      // DNS Prefetch Control
      if (this.options.dnsPrefetchControl) {
        res.setHeader('X-DNS-Prefetch-Control', 'off');
      }

      // Frameguard
      if (this.options.frameguard) {
        const value = typeof this.options.frameguard === 'string' 
          ? this.options.frameguard 
          : 'DENY';
        res.setHeader('X-Frame-Options', value);
      }

      // Hide Powered By
      if (this.options.hidePoweredBy) {
        res.setHeader('X-Powered-By', '');
      }

      // HSTS
      if (this.options.hsts) {
        let hstsValue = 'max-age=31536000';
        if (typeof this.options.hsts === 'object') {
          hstsValue = `max-age=${this.options.hsts.maxAge || 31536000}`;
          if (this.options.hsts.includeSubDomains) {
            hstsValue += '; includeSubDomains';
          }
        }
        res.setHeader('Strict-Transport-Security', hstsValue);
      }

      // IE No Open
      if (this.options.ieNoOpen) {
        res.setHeader('X-Download-Options', 'noopen');
      }

      // No Sniff
      if (this.options.noSniff) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }

      // Origin Agent Cluster
      if (this.options.originAgentCluster) {
        res.setHeader('Origin-Agent-Cluster', '?1');
      }

      // Permitted Cross Domain Policies
      if (this.options.permittedCrossDomainPolicies) {
        res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
      }

      // Referrer Policy
      if (this.options.referrerPolicy) {
        const value = typeof this.options.referrerPolicy === 'string'
          ? this.options.referrerPolicy
          : 'no-referrer';
        res.setHeader('Referrer-Policy', value);
      }

      // XSS Filter
      if (this.options.xssFilter) {
        res.setHeader('X-XSS-Protection', '0');
      }

      next();
    };

    app.use(middleware);
  }
}