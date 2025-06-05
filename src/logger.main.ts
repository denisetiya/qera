
import type { LoggerConfig } from "./types.main";

export class Logger {
  private static config: LoggerConfig = {
    enabled: true,
    level: 'info',
    format: 'json'
  };

  private static levels = { error: 0, warn: 1, info: 2, debug: 3 };

  static configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  static setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  static setLevel(level: LoggerConfig['level']): void {
    this.config.level = level;
  }

  private static log(level: keyof typeof Logger.levels, message: string, meta: Record<string, any> = {}): void {
    if (!this.config.enabled || this.levels[level] > this.levels[this.config.level]) {
      return;
    }

    const timestamp = new Date().toISOString();
    
    if (this.config.format === 'json') {
      const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...meta
      };
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta);
    }
  }

  static error(message: string, meta?: Record<string, any>): void {
    this.log('error', message, meta);
  }

  static warn(message: string, meta?: Record<string, any>): void {
    this.log('warn', message, meta);
  }

  static info(message: string, meta?: Record<string, any>): void {
    this.log('info', message, meta);
  }

  static debug(message: string, meta?: Record<string, any>): void {
    this.log('debug', message, meta);
  }
}