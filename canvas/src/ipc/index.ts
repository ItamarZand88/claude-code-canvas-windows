// IPC module exports - Platform aware

export * from "./types";

// Common interfaces (same for both platforms)
export interface IPCServerOptions {
  socketPath: string;
  onMessage: (msg: import("./types").ControllerMessage) => void;
  onClientConnect?: () => void;
  onClientDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export interface IPCServer {
  broadcast: (msg: import("./types").CanvasMessage) => void;
  send: (msg: import("./types").CanvasMessage) => void;
  close: () => void;
}

export interface IPCClientOptions {
  socketPath: string;
  onMessage: (msg: import("./types").ControllerMessage) => void;
  onDisconnect: () => void;
  onError?: (error: Error) => void;
}

export interface IPCClient {
  send: (msg: import("./types").CanvasMessage) => void;
  close: () => void;
  isConnected: () => boolean;
}

// Platform-agnostic exports that delegate to the correct implementation at runtime
export async function createIPCServer(options: IPCServerOptions): Promise<IPCServer> {
  if (process.platform === "win32") {
    const { createIPCServer: createWindowsServer } = await import("./server-windows");
    return createWindowsServer(options);
  } else {
    const { createIPCServer: createUnixServer } = await import("./server");
    return createUnixServer(options);
  }
}

export async function connectToController(options: IPCClientOptions): Promise<IPCClient> {
  if (process.platform === "win32") {
    const { connectToController: connectWindows } = await import("./client-windows");
    return connectWindows(options);
  } else {
    const { connectToController: connectUnix } = await import("./client");
    return connectUnix(options);
  }
}

export async function connectWithRetry(
  options: IPCClientOptions,
  maxRetries = 10,
  retryDelayMs = 100
): Promise<IPCClient> {
  if (process.platform === "win32") {
    const { connectWithRetry: connectWindowsWithRetry } = await import("./client-windows");
    return connectWindowsWithRetry(options, maxRetries, retryDelayMs);
  } else {
    const { connectWithRetry: connectUnixWithRetry } = await import("./client");
    return connectUnixWithRetry(options, maxRetries, retryDelayMs);
  }
}
