import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export class EnvManager {
  private env: Record<string, string> = {};

  constructor() {
    this.loadEnv();
  }

  private loadEnv(): void {
    // Load from process.env first
    this.env = Object.fromEntries(
      Object.entries(process.env).filter(([_, value]) => value !== undefined) as [string, string][]
    );

    // Try to load .env file
    const envPath = join(process.cwd(), '.env');
    if (existsSync(envPath)) {
      try {
        const envFile = readFileSync(envPath, 'utf8');
        this.parseEnvFile(envFile);
      } catch (error) {
        console.warn('Failed to load .env file:', error);
      }
    }
  }

  private parseEnvFile(content: string): void {
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) continue;

      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      this.env[key] = value;
    }
  }

  get(key: string, defaultValue?: string): string | undefined {
    return this.env[key] ?? defaultValue;
  }

  set(key: string, value: string): void {
    this.env[key] = value;
  }

  has(key: string): boolean {
    return key in this.env;
  }

  getAll(): Record<string, string> {
    return { ...this.env };
  }
}