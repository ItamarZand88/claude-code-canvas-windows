// IPC Server for Windows - Uses Named Pipes instead of Unix domain sockets

import type { ControllerMessage, CanvasMessage } from "./types";
import { Server, Socket } from "net";

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

  const clients = new Set<Socket>();
  
  // Windows named pipe path format: \\.\pipe\name
  // If socketPath is already in this format, use it
  // Otherwise convert from Unix format /tmp/name.sock -> \\.\pipe\name
  let pipeName = socketPath;
  if (!pipeName.startsWith("\\\\.\\pipe\\")) {
    pipeName = socketPath
      .replace(/^\/tmp\//, "")
      .replace(/\.sock$/, "");
    pipeName = `\\\\.\\pipe\\${pipeName}`;
  }

  const server = new Server();

  server.on("connection", (socket: Socket) => {
    clients.add(socket);
    onClientConnect?.();

    let buffer = "";

    socket.on("data", (data: Buffer) => {
      buffer += data.toString();
      
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

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
    });

    socket.on("close", () => {
      clients.delete(socket);
      onClientDisconnect?.();
    });

    socket.on("error", (error: Error) => {
      onError?.(error);
      clients.delete(socket);
    });
  });

  // Start listening on the named pipe
  await new Promise<void>((resolve, reject) => {
    server.listen(pipeName, () => {
      resolve();
    });
    
    server.on("error", (error) => {
      reject(error);
    });
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
      
      // Close the server
      server.close();
    },
  };
}
