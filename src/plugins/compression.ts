import { Plugin, Middleware } from '../types/index.js';
import { createGzip, createDeflate } from 'zlib';

export class CompressionPlugin implements Plugin {
  name = 'compression';

  install(app: any): void {
    const middleware: Middleware = (req, res, next) => {
      const acceptEncoding = req.headers?.['accept-encoding'] || '';
      
      if (acceptEncoding.includes('gzip')) {
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Vary', 'Accept-Encoding');
      } else if (acceptEncoding.includes('deflate')) {
        res.setHeader('Content-Encoding', 'deflate');
        res.setHeader('Vary', 'Accept-Encoding');
      }

      next();
    };

    app.use(middleware);
  }
}
