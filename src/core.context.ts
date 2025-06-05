import { HttpRequest, HttpResponse } from 'uWebSockets.js';
import { Context, SuccessResponse, ErrorResponse, PaginatedResponse } from './types.main';

export function createContext(res: HttpResponse, req: HttpRequest): Context {
  const context: Context = {
    method: req.getMethod().toUpperCase(),
    url: req.getUrl(),
    path: req.getUrl().split('?')[0],
    query: {},
    headers: {},
    params: {},
    body: null,
    user: undefined,
    
    // Internal
    _res: res,
    _req: req,
    _headersSent: false,

    get(header: string): string | undefined {
      return req.getHeader(header);
    },

    ip(): string {
      return Buffer.from(res.getRemoteAddressAsText()).toString();
    },

    status(code: number): Context {
      if (!context._headersSent) {
        res.writeStatus(code.toString());
      }
      return context;
    },

    setHeader(key: string, value: string): Context {
      if (!context._headersSent) {
        res.writeHeader(key, value);
      }
      return context;
    },

    async json(data: any): Promise<void> {
      if (!context._headersSent) {
        context.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
        context._headersSent = true;
      }
    },

    async send(data: string | Buffer): Promise<void> {
      if (!context._headersSent) {
        res.end(data);
        context._headersSent = true;
      }
    },

    async end(data?: string): Promise<void> {
      if (!context._headersSent) {
        res.end(data || '');
        context._headersSent = true;
      }
    },

    success<T = any>(data?: T, message: string = 'Success'): SuccessResponse<T> {
      return {
        status: 'success',
        message,
        data,
        timestamp: new Date().toISOString()
      };
    },

    error(message: string, code: number = 500, details?: any): ErrorResponse {
      return {
        status: 'error',
        message,
        code,
        details,
        timestamp: new Date().toISOString()
      };
    },

    paginated<T = any>(data: T[], page: number, limit: number, total: number): PaginatedResponse<T> {
      return {
        status: 'success',
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        timestamp: new Date().toISOString()
      };
    }
  };

  const queryString = req.getQuery();
  if (queryString) {
    const params = new URLSearchParams(queryString);
    for (const [key, value] of params.entries()) {
      context.query[key] = value;
    }
  }

  req.forEach((key, value) => {
    context.headers[key] = value;
  });

  return context;
}