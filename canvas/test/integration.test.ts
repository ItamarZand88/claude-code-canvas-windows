import { test, expect, describe } from "bun:test";

describe("Terminal Detection", () => {
  test("should detect platform", async () => {
    const { detectTerminal } = await import("../src/terminal");
    const env = detectTerminal();

    expect(env).toBeDefined();
    expect(env.summary).toBeDefined();

    if (process.platform === "win32") {
      expect(env).toHaveProperty("inWindowsTerminal");
      expect(env).toHaveProperty("inConEmu");
      expect(env).toHaveProperty("inPowerShell");
    } else {
      expect(env).toHaveProperty("inTmux");
    }
  });
});

describe("IPC Socket Paths", () => {
  test("should generate correct socket path for platform", async () => {
    const { getSocketPath } = await import("../src/ipc/types");
    const socketPath = getSocketPath("test-123");

    if (process.platform === "win32") {
      expect(socketPath).toStartWith("\\\\.\\pipe\\");
      expect(socketPath).toContain("canvas-test-123");
    } else {
      expect(socketPath).toStartWith("/tmp/");
      expect(socketPath).toContain("canvas-test-123");
      expect(socketPath).toEndWith(".sock");
    }
  });
});

describe("Canvas Components", () => {
  test("should import Calendar component", async () => {
    const { Calendar } = await import("../src/canvases/calendar");
    expect(Calendar).toBeDefined();
    expect(typeof Calendar).toBe("function");
  });

  test("should import Document component", async () => {
    const { Document } = await import("../src/canvases/document");
    expect(Document).toBeDefined();
    expect(typeof Document).toBe("function");
  });

  test("should import FlightCanvas component", async () => {
    const { FlightCanvas } = await import("../src/canvases/flight");
    expect(FlightCanvas).toBeDefined();
    expect(typeof FlightCanvas).toBe("function");
  });
});

describe("Canvas API", () => {
  test("should export spawnCanvasWithIPC", async () => {
    const api = await import("../src/api");
    expect(api.spawnCanvasWithIPC).toBeDefined();
    expect(typeof api.spawnCanvasWithIPC).toBe("function");
  });
});

describe("Flight Types", () => {
  test("should format price correctly", async () => {
    const { formatPrice } = await import("../src/canvases/flight/types");

    expect(formatPrice(9900, "USD")).toBe("$99");
    expect(formatPrice(12500, "USD")).toBe("$125");
    expect(formatPrice(0, "USD")).toBe("$0");
  });
});
