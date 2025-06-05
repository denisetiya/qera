import { gzipSync } from 'zlib';
import { Middleware, Context } from './types.main'; 

export function compression(): Middleware {
  return async (ctx: Context, next: () => Promise<void>) => {
    const originalJson = ctx.json;
    const originalSend = ctx.send;
    
    ctx.json = async function(data: any) {
      const jsonString = JSON.stringify(data);
      if (ctx.headers['accept-encoding']?.includes('gzip') && jsonString.length > 1000) {
        const compressed = gzipSync(jsonString);
        ctx.setHeader('Content-Encoding', 'gzip');
        ctx.setHeader('Content-Length', compressed.length.toString());
        ctx.setHeader('Content-Type', 'application/json');
        return ctx.send(compressed);
      }
      return originalJson.call(this, data);
    };
    
    await next();
  };
}
