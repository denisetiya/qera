import type { Middleware, Context } from "./types.main";

export function helmet(): Middleware {
  return async (ctx: Context, next: () => Promise<void>) => {
    ctx.setHeader('X-Content-Type-Options', 'nosniff');
    ctx.setHeader('X-Frame-Options', 'DENY');
    ctx.setHeader('X-XSS-Protection', '1; mode=block');
    ctx.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    ctx.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    ctx.setHeader('Content-Security-Policy', "default-src 'self'");
    
    await next();
  };
}
