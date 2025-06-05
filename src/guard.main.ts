import crypto from 'crypto';
import bcrypt from 'bcrypt';

interface JWTHeader {
  alg: string;
  typ: string;
}

interface JWTOptions {
  expiresIn?: string | number;
  algorithm?: string;
}

export class Guard {
  static async hash(password: string, rounds = 12): Promise<string> {
    return bcrypt.hash(password, rounds);
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static encrypt(text: string, key: string): string {
    const keyBuffer = crypto.createHash('sha256').update(key).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + encrypted;
  }

  static decrypt(encrypted: string, key: string): string {
    const keyBuffer = crypto.createHash('sha256').update(key).digest();
    const iv = encrypted.slice(0, 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encrypted.slice(32), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Custom JWT Implementation
  private static base64UrlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  private static base64UrlDecode(str: string): string {
    // Add padding if needed
    str += new Array(5 - (str.length % 4)).join('=');
    return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString();
  }

  private static parseTimespan(timespan: string | number): number {
    if (typeof timespan === 'number') {
      return timespan;
    }

    const matches = timespan.match(/^(\d+)([smhd])$/);
    if (!matches) {
      throw new Error('Invalid timespan format');
    }

    const value = parseInt(matches[1]);
    const unit = matches[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: throw new Error('Invalid time unit');
    }
  }

  private static createSignature(header: string, payload: string, secret: string, algorithm: string = 'HS256'): string {
    const data = `${header}.${payload}`;
    
    switch (algorithm) {
      case 'HS256':
        return crypto.createHmac('sha256', secret).update(data).digest('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      case 'HS384':
        return crypto.createHmac('sha384', secret).update(data).digest('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      case 'HS512':
        return crypto.createHmac('sha512', secret).update(data).digest('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
  }

  static generateToken(payload: object, secret: string, options: JWTOptions = { expiresIn: '24h' }): string {
    const algorithm = options.algorithm || 'HS256';
    
    // Create header
    const header: JWTHeader = {
      alg: algorithm,
      typ: 'JWT'
    };

    // Create payload with timestamps
    const now = Math.floor(Date.now() / 1000);
    const tokenPayload = {
      ...payload,
      iat: now, // issued at
    };

    // Add expiration if specified
    if (options.expiresIn) {
      const expiresInSeconds = this.parseTimespan(options.expiresIn);
      (tokenPayload as any).exp = now + expiresInSeconds;
    }

    // Encode header and payload
    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(tokenPayload));

    // Create signature
    const signature = this.createSignature(encodedHeader, encodedPayload, secret, algorithm);

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  static verifyToken<T = any>(token: string, secret: string): T {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [headerStr, payloadStr, signature] = parts;

    // Decode header and payload
    let header: JWTHeader;
    let payload: any;

    try {
      header = JSON.parse(this.base64UrlDecode(headerStr));
      payload = JSON.parse(this.base64UrlDecode(payloadStr));
    } catch (error) {
      throw new Error('Invalid token encoding');
    }

    // Verify signature
    const expectedSignature = this.createSignature(headerStr, payloadStr, secret, header.alg);
    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token has expired');
    }

    return payload as T;
  }

  static generateRandomString(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Utility methods for token inspection
  static decodeToken(token: string): { header: JWTHeader; payload: any; signature: string } {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    return {
      header: JSON.parse(this.base64UrlDecode(parts[0])),
      payload: JSON.parse(this.base64UrlDecode(parts[1])),
      signature: parts[2]
    };
  }

  static isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded.payload.exp) return false;
      return decoded.payload.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }
}

export default Guard;