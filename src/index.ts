import uWS from 'uWebSockets.js'; 
import type { TemplatedApp, HttpRequest, HttpResponse } from 'uWebSockets.js';
import type { FrameworkConfig, Handler, Middleware, Context, LoggerConfig } from './types.main';
import { Logger } from './logger.main';
import { createContext } from './core.context';

export class Qera {
  private app: TemplatedApp;
  private middlewares: Middleware[] = [];
  private config: FrameworkConfig;

  constructor(config: FrameworkConfig = {}) {
    this.config = {
      port: 3000,
      host: '0.0.0.0',
      logger: {
        enabled: true,
        level: 'info',
        format: 'json'
      },
      ...config
    };

    this.app = config.ssl ? uWS.SSLApp(config.ssl) : uWS.App();
    
    if (this.config.logger) {
      Logger.configure(this.config.logger);
    }
  }

  use(middleware: Middleware): this {
    this.middlewares.push(middleware);
    return this;
  }

  get(path: string, ...handlers: Handler[]): this {
    return this.addRoute('get', path, handlers);
  }

  post(path: string, ...handlers: Handler[]): this {
    return this.addRoute('post', path, handlers);
  }

  put(path: string, ...handlers: Handler[]): this {
    return this.addRoute('put', path, handlers);
  }

  delete(path: string, ...handlers: Handler[]): this {
    return this.addRoute('delete', path, handlers);
  }

  patch(path: string, ...handlers: Handler[]): this {
    return this.addRoute('patch', path, handlers);
  }

  options(path: string, ...handlers: Handler[]): this {
    return this.addRoute('options', path, handlers);
  }

    private addRoute(method: string, path: string, handlers: Handler[]): this {
    (this.app[method as keyof TemplatedApp] as (path: string, handler: (res: HttpResponse, req: HttpRequest) => void) => void)(
    path,
    (res, req) => {
        this.handleRequest(res, req, method.toUpperCase(), path, handlers);
    }
    );

    return this;
    }


  private async handleRequest(
    res: HttpResponse, 
    req: HttpRequest, 
    method: string, 
    path: string, 
    handlers: Handler[]
  ): Promise<void> {
    const startTime = process.hrtime.bigint();
    const ctx = createContext(res, req);

    try {
      await this.executeMiddlewares(ctx);
      
      await this.executeHandlers(ctx, handlers);
      
    } catch (error: any) {
      Logger.error('Request failed', { 
        method, 
        path, 
        error: error.message,
        stack: error.stack 
      });
      
      if (!ctx._headersSent) {
        await ctx.json(ctx.error('Internal Server Error', 500));
      }
    }

    const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
    Logger.info('Request processed', {
      method,
      path,
      status: 200, 
      duration: `${duration.toFixed(2)}ms`,
      ip: ctx.ip()
    });
  }

  private async executeMiddlewares(ctx: Context): Promise<void> {
    let index = 0;
    
    const next = async (): Promise<void> => {
      if (index >= this.middlewares.length) return;
      
      const middleware = this.middlewares[index++];
      await middleware(ctx, next);
    };
    
    await next();
  }

  private async executeHandlers(ctx: Context, handlers: Handler[]): Promise<void> {
    for (const handler of handlers) {
      if (ctx._headersSent) break;
      
      const result = await handler(ctx);
      
      if (result && typeof result === 'object' && 'status' in result) {
        await ctx.json(result);
        break;
      }
    }
  }

  listen(callback?: () => void): void {
    this.app.listen(this.config.port!, (token) => {
      if (token) {
        Logger.info(`Server running on ${this.config.host}:${this.config.port}`);
        if (callback) callback();
      } else {
        Logger.error(`Failed to listen on port ${this.config.port}`);
        process.exit(1);
      }
    });
  }

  enableLogging(): void {
    Logger.setEnabled(true);
  }

  disableLogging(): void {
    Logger.setEnabled(false);
  }

  setLogLevel(level: LoggerConfig['level']): void {
    Logger.setLevel(level);
  }
}

export * from './types.main';
export * from './logger.main';
export * from './validation.main';
export * from './guard.main';
export * from './middleware.cors';
export * from './middleware.helmet';
export * from './middleware.compression'
export * from './middleware.auth';