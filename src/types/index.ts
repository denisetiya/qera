import { HttpRequest, HttpResponse } from 'uWebSockets.js';

export interface UltraRequest extends HttpRequest {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  ip?: string;
  method?: string;
  url?: string;
  files?: Record<string, UploadedFile>;
}

export interface UltraResponse extends HttpResponse {
  json(data: any): UltraResponse;
  status(code: number): UltraResponse;
  send(data: string | Buffer): UltraResponse;
  setHeader(key: string, value: string): UltraResponse;
  cookie(name: string, value: string, options?: CookieOptions): UltraResponse;
}

export interface UploadedFile {
  filename: string;
  mimetype: string;
  size: number;
  data: Buffer;
}

export interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  domain?: string;
}

export interface RouteHandler {
  (req: UltraRequest, res: UltraResponse): void | Promise<void>;
}

export interface Middleware {
  (req: UltraRequest, res: UltraResponse, next: () => void): void | Promise<void>;
}

export interface Plugin {
  name: string;
  install(app: any): void;
}

export interface ValidationSchema {
  [key: string]: {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    properties?: ValidationSchema;
    items?: ValidationSchema;
  };
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}