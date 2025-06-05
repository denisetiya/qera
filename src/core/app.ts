import { App, TemplatedApp, HttpRequest, HttpResponse } from 'uWebSockets.js';
import type { UltraRequest, UltraResponse, RouteHandler, Middleware, Plugin } from '../types/index.js';
import { Logger } from '../plugins/logger.js';
import { EnvManager } from '../plugins/env.js';

class Qera {
  private app: TemplatedApp;
  private middlewares: Middleware[] = [];
  private plugins: Plugin[] = [];
  private logger: Logger;
  private env: EnvManager;
  private routes: Map<string, Map<string, RouteHandler>> = new Map();

  constructor(options: { ssl?: any } = {}) {
      const appOptions = {
          ...options.ssl,
          maxHeaderLength: 65536, 
      };
      
      this.app = options.ssl ? App(appOptions) : App();
      this.logger = new Logger();
      this.env = new EnvManager();
      this.setupDefaultMiddlewares();
  }

  private setupDefaultMiddlewares() {
    // Body parsing middleware
    this.use(async (req, res, next) => {
      if (req.getMethod() === 'post' || req.getMethod() === 'put' || req.getMethod() === 'patch') {
        await this.parseBody(req as UltraRequest, res as UltraResponse);
      }
      next();
    });

    // Query parsing middleware
    this.use((req, res, next) => {
      const url = (req as UltraRequest).getUrl();
      const queryIndex = url.indexOf('?');
      if (queryIndex !== -1) {
        const queryString = url.substring(queryIndex + 1);
        (req as UltraRequest).query = this.parseQuery(queryString);
      } else {
        (req as UltraRequest).query = {};
      }
      next();
    });

    // Headers middleware
    this.use((req, res, next) => {
      const headers: Record<string, string> = {};
      (req as UltraRequest).forEach((key, value) => {
        headers[key] = value;
      });
      (req as UltraRequest).headers = headers;
      next();
    });
  }

  private parseQuery(queryString: string): Record<string, string> {
    const params: Record<string, string> = {};
    const pairs = queryString.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    }
    return params;
  }

  private async parseBody(req: UltraRequest, res: UltraResponse): Promise<void> {
    return new Promise((resolve) => {
      let buffer = Buffer.alloc(0);
      
      res.onData((ab, isLast) => {
        const chunk = Buffer.from(ab);
        buffer = Buffer.concat([buffer, chunk]);
        
        if (isLast) {
          const contentType = req.getHeader('content-type');
          
          if (contentType?.includes('application/json')) {
            try {
              req.body = JSON.parse(buffer.toString());
            } catch {
              req.body = {};
            }
          } else if (contentType?.includes('application/x-www-form-urlencoded')) {
            req.body = this.parseUrlEncoded(buffer.toString());
          } else if (contentType?.includes('multipart/form-data')) {
            req.body = this.parseMultipart(buffer, contentType);
          } else {
            req.body = buffer.toString();
          }
          resolve();
        }
      });

      res.onAborted(() => {
        resolve();
      });
    });
  }

  private parseUrlEncoded(str: string): Record<string, any> {
    const params: Record<string, any> = {};
    const pairs = str.split('&');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    }
    return params;
  }

  private parseMultipart(buffer: Buffer, contentType: string): any {
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) return {};

    const parts = buffer.toString().split(`--${boundary}`);
    const result: any = {};
    const files: any = {};

    for (const part of parts) {
      if (!part.trim() || part === '--') continue;

      const [headerSection, ...bodyParts] = part.split('\r\n\r\n');
      const body = bodyParts.join('\r\n\r\n').replace(/\r\n$/, '');

      const nameMatch = headerSection.match(/name="([^"]+)"/);
      const filenameMatch = headerSection.match(/filename="([^"]+)"/);
      const contentTypeMatch = headerSection.match(/Content-Type: ([^\r\n]+)/);

      if (nameMatch) {
        const name = nameMatch[1];
        
        if (filenameMatch) {
          files[name] = {
            filename: filenameMatch[1],
            mimetype: contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream',
            size: Buffer.from(body).length,
            data: Buffer.from(body)
          };
        } else {
          result[name] = body;
        }
      }
    }

    return { ...result, files };
  }

  use(middleware: Middleware): Qera {
    this.middlewares.push(middleware);
    return this;
  }

  plugin(plugin: Plugin): Qera {
    this.plugins.push(plugin);
    plugin.install(this);
    return this;
  }

  private async runMiddlewares(req: UltraRequest, res: UltraResponse): Promise<boolean> {
    let index = 0;
    let stopped = false;

    const next = () => {
      index++;
    };

    while (index < this.middlewares.length && !stopped) {
      const middleware = this.middlewares[index];
      
      try {
        await middleware(req, res, next);
        if (index === this.middlewares.length - 1) break;
      } catch (error) {
        this.logger.error('Middleware error:', error);
        stopped = true;
        res.status(500).json({ error: 'Internal server error' });
        return false;
      }
    }

    return !stopped;
  }

  private enhanceResponse(res: HttpResponse): UltraResponse {
    const enhanced = res as UltraResponse;
    
    enhanced.json = function(data: any) {
      this.writeHeader('content-type', 'application/json');
      this.end(JSON.stringify(data));
      return this;
    };

    enhanced.status = function(code: number) {
      this.writeStatus(code.toString());
      return this;
    };

    enhanced.send = function(data: string | Buffer) {
      this.end(data);
      return this;
    };

    enhanced.setHeader = function(key: string, value: string) {
      this.writeHeader(key, value);
      return this;
    };

    enhanced.cookie = function(name: string, value: string, options: any = {}) {
      let cookieStr = `${name}=${value}`;
      
      if (options.maxAge) cookieStr += `; Max-Age=${options.maxAge}`;
      if (options.expires) cookieStr += `; Expires=${options.expires.toUTCString()}`;
      if (options.httpOnly) cookieStr += '; HttpOnly';
      if (options.secure) cookieStr += '; Secure';
      if (options.sameSite) cookieStr += `; SameSite=${options.sameSite}`;
      if (options.path) cookieStr += `; Path=${options.path}`;
      if (options.domain) cookieStr += `; Domain=${options.domain}`;
      
      this.writeHeader('set-cookie', cookieStr);
      return this;
    };

    return enhanced;
  }

  private enhanceRequest(req: HttpRequest): UltraRequest {
    const enhanced = req as UltraRequest;
    enhanced.method = req.getMethod().toUpperCase();
    enhanced.url = req.getUrl();
    // enhanced.ip = req.getRemoteAddress().toString(); // Property 'getRemoteAddress' does not exist on type 'HttpRequest'.
    return enhanced;
  }

  private registerRoute(method: string, path: string, handler: RouteHandler) {
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }
    this.routes.get(method)!.set(path, handler);

    this.app.any(path, async (res, req) => {
      if (req.getMethod() !== method.toLowerCase()) return;

      const enhancedReq = this.enhanceRequest(req);
      const enhancedRes = this.enhanceResponse(res);

      // Parse route parameters
      enhancedReq.params = this.parseParams(path, enhancedReq.url!);

      const canContinue = await this.runMiddlewares(enhancedReq, enhancedRes);
      if (!canContinue) return;

      try {
        await handler(enhancedReq, enhancedRes);
      } catch (error) {
        this.logger.error('Route handler error:', error);
        if (!enhancedRes.getWriteOffset()) {
          enhancedRes.status(500).json({ error: 'Internal server error' });
        }
      }
    });
  }

  private parseParams(pattern: string, url: string): Record<string, string> {
    const params: Record<string, string> = {};
    const patternParts = pattern.split('/');
    const urlParts = url.split('?')[0].split('/');

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.substring(1);
        params[paramName] = urlParts[i] || '';
      }
    }

    return params;
  }

  get(path: string, handler: RouteHandler): Qera {
    this.registerRoute('get', path, handler);
    return this;
  }

  post(path: string, handler: RouteHandler): Qera {
    this.registerRoute('post', path, handler);
    return this;
  }

  put(path: string, handler: RouteHandler): Qera {
    this.registerRoute('put', path, handler);
    return this;
  }

  delete(path: string, handler: RouteHandler): Qera {
    this.registerRoute('delete', path, handler);
    return this;
  }

  patch(path: string, handler: RouteHandler): Qera {
    this.registerRoute('patch', path, handler);
    return this;
  }

  listen(port: number, callback?: () => void): Qera {
    this.app.listen(port, (token) => {
      if (token) {
        this.logger.info(`🚀 Server running on port ${port}`);
        callback?.();
      } else {
        this.logger.error(`❌ Failed to listen on port ${port}`);
      }
    });
    return this;
  }

  getApp(): TemplatedApp {
    return this.app;
  }
}



export default Qera