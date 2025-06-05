import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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

  static generateToken(payload: object, secret: string, options: jwt.SignOptions = { expiresIn: '24h' }): string {
    return jwt.sign(payload, secret, options);
  }

  static verifyToken<T = any>(token: string, secret: string): T {
    return jwt.verify(token, secret) as T;
  }

  static generateRandomString(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}

export default Guard;