
import { HttpRequest, HttpResponse } from 'uWebSockets.js';

export interface LoggerConfig {
  enabled: boolean;
  level: 'error' | 'warn' | 'info' | 'debug';
  format: 'json' | 'simple';
}

export interface FrameworkConfig {
  port?: number;
  host?: string;
  logger?: LoggerConfig;
  ssl?: {
    key_file_name: string;
    cert_file_name: string;
  };
}

export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  min?: number;
  max?: number;
  format?: 'email' | 'url';
}

export interface ValidationSchema {
  [key: string]: ValidationRule;
}

export interface Context {
  // Request properties
  method: string;
  url: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  params: Record<string, string>;
  body: any;
  user?: any;
  
  // Response methods
  status(code: number): Context;
  setHeader(key: string, value: string): Context;
  json(data: any): Promise<void>;
  send(data: string | Buffer): Promise<void>;
  end(data?: string): Promise<void>;
  
  // Helper methods
  get(header: string): string | undefined;
  ip(): string;
  
  // Template responses
  success<T = any>(data?: T, message?: string): SuccessResponse<T>;
  error(message: string, code?: number, details?: any): ErrorResponse;
  paginated<T = any>(data: T[], page: number, limit: number, total: number): PaginatedResponse<T>;
  
  // Internal
  _res: HttpResponse;
  _req: HttpRequest;
  _headersSent: boolean;
}

export interface SuccessResponse<T = any> {
  status: 'success';
  message: string;
  data?: T;
  timestamp: string;
}

export interface ErrorResponse {
  status: 'error';
  message: string;
  code: number;
  details?: any;
  timestamp: string;
}

export interface PaginatedResponse<T = any> {
  status: 'success';
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

export type Handler = (ctx: Context) => Promise<void> | void | SuccessResponse<any> | ErrorResponse | PaginatedResponse<any>;
export type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void> | void;
