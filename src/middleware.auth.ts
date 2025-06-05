import type { Middleware, Context } from "./types.main";
import Guard from "./guard.main";

export function auth(secret: string): Middleware {
  return async (ctx: Context, next: () => Promise<void>) => {
    const token = ctx.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return ctx.json(ctx.error('No token provided', 401));
    }

    try {
      const decoded = Guard.verifyToken(token, secret);
      ctx.user = decoded;
      await next();
    } catch (err) {
      return ctx.json(ctx.error('Invalid token', 401));
    }
  };
}