import { createIPCServer } from "../ipc";
import { getSocketPath } from "../ipc/types";
import { spawnCanvas } from "../terminal";
import type { CanvasMessage } from "../ipc/types";

export interface CanvasResult<T = unknown> {
  success: boolean;
  data?: T;
  cancelled?: boolean;
  error?: string;
}

export interface SpawnOptions {
  timeout?: number;
  onReady?: () => void;
}

export async function spawnCanvasWithIPC<TConfig, TResult>(
  kind: string,
  scenario: string,
  config: TConfig,
  options: SpawnOptions = {}
): Promise<CanvasResult<TResult>> {
  const { timeout = 300000, onReady } = options;
  const id = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const socketPath = getSocketPath(id);

  let resolved = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let server: Awaited<ReturnType<typeof createIPCServer>> | null = null;

  const cleanup = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    server?.close();
  };

  return new Promise(async (resolve) => {
    try {
      server = await createIPCServer({
        socketPath,
        onMessage(msg: CanvasMessage) {
          if (resolved) return;

          switch (msg.type) {
            case "ready":
              onReady?.();
              break;
            case "selected":
              resolved = true;
              cleanup();
              resolve({ success: true, data: msg.data as TResult });
              break;
            case "cancelled":
              resolved = true;
              cleanup();
              resolve({ success: true, cancelled: true });
              break;
            case "error":
              resolved = true;
              cleanup();
              resolve({ success: false, error: msg.message });
              break;
          }
        },
        onClientDisconnect() {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve({ success: false, error: "Canvas disconnected unexpectedly" });
          }
        },
        onError(error) {
          if (!resolved) {
            resolved = true;
            cleanup();
            resolve({ success: false, error: error.message });
          }
        },
      });

      timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          server?.send({ type: "cancelled", reason: "timeout" });
          cleanup();
          resolve({ success: false, error: "Timeout waiting for user selection" });
        }
      }, timeout);

      await spawnCanvas(kind, id, JSON.stringify(config), { socketPath, scenario });
    } catch (err) {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve({ success: false, error: `Failed to spawn canvas: ${(err as Error).message}` });
      }
    }
  });
}
