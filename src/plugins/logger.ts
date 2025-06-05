export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any;
}

export class Logger {
  private level: LogLevel = LogLevel.INFO;
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private log(level: LogLevel, message: string, ...data: any[]): void {
    if (level < this.level) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data: data.length > 0 ? data : undefined
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const colors = ['\x1b[36m', '\x1b[32m', '\x1b[33m', '\x1b[31m'];
    const timestamp = entry.timestamp.toISOString();
    
    console.log(
      `${colors[level]}[${levelNames[level]}]\x1b[0m ${timestamp} - ${message}`,
      ...(data.length > 0 ? data : [])
    );
  }

  debug(message: string, ...data: any[]): void {
    this.log(LogLevel.DEBUG, message, ...data);
  }

  info(message: string, ...data: any[]): void {
    this.log(LogLevel.INFO, message, ...data);
  }

  warn(message: string, ...data: any[]): void {
    this.log(LogLevel.WARN, message, ...data);
  }

  error(message: string, ...data: any[]): void {
    this.log(LogLevel.ERROR, message, ...data);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}
