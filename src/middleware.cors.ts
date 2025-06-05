import type { Middleware, Context } from "./types.main";

export interface CorsOptions {
  origin?: string | string[];
  methods?: string;
  allowedHeaders?: string;
  credentials?: boolean;
}

export function cors(options: CorsOptions = {}): Middleware {
  const defaults = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: false
  };
  
  const config = { ...defaults, ...options };

  return async (ctx: Context, next: () => Promise<void>) => {
    ctx.setHeader('Access-Control-Allow-Origin', Array.isArray(config.origin) ? config.origin.join(',') : config.origin);
    ctx.setHeader('Access-Control-Allow-Methods', config.methods);
    ctx.setHeader('Access-Control-Allow-Headers', config.allowedHeaders);
    
    if (config.credentials) {
      ctx.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (ctx.method === 'OPTIONS') {
      ctx.status(204);
      await ctx.end();
      return;
    }

    await next();
  };
}