import { watch, FSWatcher } from 'fs';
import { join } from 'path';

export class FileWatcherPlugin {
  private watchers: FSWatcher[] = [];
  private callback: () => void;

  constructor(callback: () => void) {
    this.callback = callback;
  }

  watch(paths: string[]): void {
    paths.forEach(path => {
      try {
        const watcher = watch(path, { recursive: true }, (eventType, filename) => {
          if (filename && (filename.endsWith('.ts') || filename.endsWith('.js'))) {
            console.log(`File changed: ${filename}`);
            this.callback();
          }
        });
        this.watchers.push(watcher);
      } catch (error) {
        console.warn(`Could not watch path: ${path}`, error);
      }
    });
  }

  stop(): void {
    this.watchers.forEach(watcher => watcher.close());
    this.watchers = [];
  }
}