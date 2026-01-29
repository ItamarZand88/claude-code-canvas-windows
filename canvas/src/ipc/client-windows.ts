// IPC Client for Windows - Uses Named Pipes instead of Unix domain sockets

import type { ControllerMessage, CanvasMessage } from "./types";
import { Socket } from "net";

export interface IPCClientOptions {
  socketPath: string;
  onMessage: (msg: ControllerMessage) => void;
  onDisconnect: () => void;
  onError?: (error: Error) => void;
}

export interface IPCClient {
  send: (msg: CanvasMessage) => void;
  close: () => void;
  isConnected: () => boolean;
}

export async function connectToController(
  options: IPCClientOptions
): Promise<IPCClient> {
  const { socketPath, onMessage, onDisconnect, onError } = options;

  // Convert to Windows named pipe format if needed
  let pipeName = socketPath;
  if (!pipeName.startsWith("\\\\.\\pipe\\")) {
    pipeName = socketPath
      .replace(/^\/tmp\//, "")
      .replace(/\.sock$/, "");
    pipeName = `\\\\.\\pipe\\${pipeName}`;
  }

  let connected = false;
  let buffer = "";

  const socket = new Socket();

  // Connect to the named pipe
  await new Promise<void>((resolve, reject) => {
    socket.connect(pipeName, () => {
      connected = true;
      resolve();
    });

    socket.on("error", (error) => {
      if (!connected) {
        reject(error);
      }
    });
  });

  // Set up data handler
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
    connected = false;
    onDisconnect();
  });

  socket.on("error", (error: Error) => {
    if (connected) {
      onError?.(error);
    }
  });

  return {
    send(msg: CanvasMessage) {
      if (connected) {
        try {
          socket.write(JSON.stringify(msg) + "\n");
        } catch (e) {
          onError?.(e as Error);
        }
      }
    },

    close() {
      socket.end();
      connected = false;
    },

    isConnected() {
      return connected;
    },
  };
}

// Attempt to connect with retries
export async function connectWithRetry(
  options: IPCClientOptions,
  maxRetries = 10,
  retryDelayMs = 100
): Promise<IPCClient> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await connectToController(options);
    } catch (e) {
      lastError = e as Error;
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  throw lastError || new Error("Failed to connect to controller");
}
