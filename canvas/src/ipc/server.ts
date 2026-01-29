// IPC Server for Unix - Uses Unix Domain Sockets (original implementation)

import type { ControllerMessage, CanvasMessage } from "./types";

export interface IPCServerOptions {
  socketPath: string;
  onMessage: (msg: ControllerMessage) => void;
  onClientConnect?: () => void;
  onClientDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface IPCServer {
  broadcast: (msg: CanvasMessage) => void;
  send: (msg: CanvasMessage) => void; // Alias for broadcast
  close: () => void;
}

export async function createIPCServer(options: IPCServerOptions): Promise<IPCServer> {
  const { socketPath, onMessage, onClientConnect, onClientDisconnect, onError } = options;

  const clients = new Set<ReturnType<typeof Bun.connect>>();

  // Remove existing socket file if it exists
  try {
    await Bun.write(socketPath, "");
    const fs = await import("fs");
    if (fs.existsSync(socketPath)) {
      fs.unlinkSync(socketPath);
    }
  } catch {
    // Ignore errors
  }

  const server = Bun.listen({
    unix: socketPath,
    socket: {
      data(socket, data) {
        const text = Buffer.from(data).toString();
        const lines = text.split("\n");

        for (const line of lines) {
          if (line.trim()) {
            try {
              const msg = JSON.parse(line) as ControllerMessage;
              onMessage(msg);
            } catch (e) {
              onError?.(new Error(`Failed to parse message: ${line}`));
            }
          }
        }
      },
      open(socket) {
        clients.add(socket);
        onClientConnect?.();
      },
      close(socket) {
        clients.delete(socket);
        onClientDisconnect?.();
      },
      error(socket, error) {
        onError?.(error);
        clients.delete(socket);
      },
    },
  });

  return {
    broadcast(msg: CanvasMessage) {
      const data = JSON.stringify(msg) + "\n";
      for (const client of clients) {
        try {
          client.write(data);
        } catch (e) {
          // Ignore write errors (client may have disconnected)
        }
      }
    },

    send(msg: CanvasMessage) {
      // Alias for broadcast
      this.broadcast(msg);
    },

    close() {
      // Close all client connections
      for (const client of clients) {
        try {
          client.end();
        } catch (e) {
          // Ignore errors
        }
      }
      clients.clear();

      // Stop the server
      server.stop();

      // Clean up socket file
      try {
        const fs = require("fs");
        if (fs.existsSync(socketPath)) {
          fs.unlinkSync(socketPath);
        }
      } catch {
        // Ignore errors
      }
    },
  };
}
