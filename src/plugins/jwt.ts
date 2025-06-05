import { Plugin } from '../types/index.js';
import { createHmac, randomBytes } from 'crypto';

export interface JwtPayload {
  [key: string]: any;
  iat?: number;
  exp?: number;
  iss?: string;
  sub?: string;
}

export interface JwtOptions {
  expiresIn?: string | number;
  issuer?: string;
  subject?: string;
}

export class JwtPlugin implements Plugin {
  name = 'jwt';
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  install(app: any): void {
    app.jwt = {
      sign: this.sign.bind(this),
      verify: this.verify.bind(this),
      decode: this.decode.bind(this)
    };
  }

  private base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return Buffer.from(str, 'base64').toString();
  }

  private parseExpiration(expiresIn: string | number): number {
    if (typeof expiresIn === 'number') {
      return expiresIn;
    }

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error('Invalid expiresIn format');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400
    };

    return value * multipliers[unit as keyof typeof multipliers];
  }

  sign(payload: JwtPayload, options: JwtOptions = {}): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const finalPayload = {
      ...payload,
      iat: now
    };

    if (options.expiresIn) {
      const expirationTime = this.parseExpiration(options.expiresIn);
      finalPayload.exp = now + expirationTime;
    }

    if (options.issuer) {
      finalPayload.iss = options.issuer;
    }

    if (options.subject) {
      finalPayload.sub = options.subject;
    }

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(finalPayload));
    const data = `${encodedHeader}.${encodedPayload}`;

    const signature = createHmac('sha256', this.secret)
      .update(data)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    return `${data}.${signature}`;
  }

  verify(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [headerPart, payloadPart, signaturePart] = parts;
    const data = `${headerPart}.${payloadPart}`;

    const expectedSignature = createHmac('sha256', this.secret)
      .update(data)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    if (signaturePart !== expectedSignature) {
      throw new Error('Invalid signature');
    }

    const payload = JSON.parse(this.base64UrlDecode(payloadPart));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  }

  decode(token: string): JwtPayload {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    return JSON.parse(this.base64UrlDecode(parts[1]));
  }
}