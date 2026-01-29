// File watcher utility for watching plan files and other documents
import { watch, existsSync } from "fs";

export interface FileWatcherOptions {
  debounceMs?: number;
  onError?: (error: Error) => void;
  createIfMissing?: boolean;
}

export interface FileWatcher {
  close: () => void;
}

/**
 * Watch a file for changes and trigger a callback with the new content.
 * Debounces rapid changes to avoid excessive updates.
 */
export function watchFile(
  filePath: string,
  onChange: (content: string) => void,
  options: FileWatcherOptions = {}
): FileWatcher {
  const { debounceMs = 50, onError, createIfMissing = true } = options;

  let timeout: ReturnType<typeof setTimeout> | null = null;
  let lastContent = "";
  let watcher: ReturnType<typeof watch> | null = null;
  let closed = false;

  // Initial read
  async function readAndNotify() {
    if (closed) return;

    try {
      if (!existsSync(filePath)) {
        if (createIfMissing) {
          // File doesn't exist yet, wait for it
          return;
        }
        throw new Error(`File not found: ${filePath}`);
      }

      const content = await Bun.file(filePath).text();

      // Only trigger if content actually changed
      if (content !== lastContent) {
        lastContent = content;
        onChange(content);
      }
    } catch (e) {
      onError?.(e as Error);
    }
  }

  // Start watching
  function startWatcher() {
    if (closed) return;

    try {
      // Check if file exists, if not wait for directory
      if (!existsSync(filePath)) {
        // Try again in 500ms
        setTimeout(startWatcher, 500);
        return;
      }

      watcher = watch(filePath, (event) => {
        if (closed) return;
        if (event !== "change") return;

        // Debounce rapid changes
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(readAndNotify, debounceMs);
      });

      watcher.on("error", (error) => {
        onError?.(error);
      });

      // Initial read
      readAndNotify();
    } catch (e) {
      onError?.(e as Error);
      // Retry watching after a delay
      setTimeout(startWatcher, 1000);
    }
  }

  startWatcher();

  return {
    close() {
      closed = true;
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      if (watcher) {
        watcher.close();
        watcher = null;
      }
    },
  };
}

/**
 * Watch a file with polling (fallback for systems where fs.watch doesn't work well)
 */
export function watchFilePolling(
  filePath: string,
  onChange: (content: string) => void,
  options: { intervalMs?: number; onError?: (error: Error) => void } = {}
): FileWatcher {
  const { intervalMs = 500, onError } = options;

  let lastContent = "";
  let lastMtime = 0;
  let closed = false;

  const interval = setInterval(async () => {
    if (closed) return;

    try {
      if (!existsSync(filePath)) return;

      const file = Bun.file(filePath);
      const stat = await file.stat();

      // Check if file was modified
      if (stat.mtime.getTime() <= lastMtime) return;
      lastMtime = stat.mtime.getTime();

      const content = await file.text();
      if (content !== lastContent) {
        lastContent = content;
        onChange(content);
      }
    } catch (e) {
      onError?.(e as Error);
    }
  }, intervalMs);

  return {
    close() {
      closed = true;
      clearInterval(interval);
    },
  };
}
