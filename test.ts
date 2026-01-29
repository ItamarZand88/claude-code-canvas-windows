#!/usr/bin/env bun

// Test script for claude-canvas-windows

console.log("=".repeat(60));
console.log("Claude Canvas Windows - Test Suite");
console.log("=".repeat(60));
console.log();

// Test 1: Terminal Detection
console.log("Test 1: Terminal Detection");
console.log("-".repeat(60));
try {
  const { detectTerminal } = await import("./canvas/src/terminal");
  const env = detectTerminal();
  console.log("✓ Platform:", process.platform);
  console.log("✓ Summary:", env.summary);
  
  if (process.platform === "win32") {
    console.log("✓ Windows Terminal:", (env as any).inWindowsTerminal || false);
    console.log("✓ ConEmu:", (env as any).inConEmu || false);
    console.log("✓ PowerShell:", (env as any).inPowerShell || false);
  } else {
    console.log("✓ In tmux:", (env as any).inTmux || false);
  }
} catch (error) {
  console.error("✗ Error:", error);
}
console.log();

// Test 2: IPC Types
console.log("Test 2: IPC Socket Path Generation");
console.log("-".repeat(60));
try {
  const { getSocketPath } = await import("./canvas/src/ipc/types");
  const socketPath = getSocketPath("test-123");
  console.log("✓ Socket path:", socketPath);
  
  if (process.platform === "win32") {
    if (socketPath.startsWith("\\\\.\\pipe\\")) {
      console.log("✓ Windows named pipe format detected");
    } else {
      console.error("✗ Invalid Windows pipe format");
    }
  } else {
    if (socketPath.startsWith("/tmp/")) {
      console.log("✓ Unix socket format detected");
    } else {
      console.error("✗ Invalid Unix socket format");
    }
  }
} catch (error) {
  console.error("✗ Error:", error);
}
console.log();

// Test 3: Canvas Components
console.log("Test 3: Canvas Components");
console.log("-".repeat(60));
try {
  // Just check if we can import the components
  const { Calendar } = await import("./canvas/src/canvases/calendar");
  const { Document } = await import("./canvas/src/canvases/document");
  const { FlightCanvas } = await import("./canvas/src/canvases/flight");
  console.log("✓ Calendar component loaded");
  console.log("✓ Document component loaded");
  console.log("✓ Flight component loaded");
} catch (error) {
  console.error("✗ Error:", error);
}
console.log();

// Test 4: API
console.log("Test 4: API");
console.log("-".repeat(60));
try {
  const api = await import("./canvas/src/api");
  if (api.spawnCanvasWithIPC) {
    console.log("✓ spawnCanvasWithIPC function available");
  } else {
    console.error("✗ spawnCanvasWithIPC function not found");
  }
} catch (error) {
  console.error("✗ Error:", error);
}
console.log();

// Test 5: CLI
console.log("Test 5: CLI");
console.log("-".repeat(60));
try {
  const cliPath = "./canvas/src/cli.ts";
  const fs = await import("fs");
  if (fs.existsSync(cliPath)) {
    console.log("✓ CLI file exists");
  } else {
    console.error("✗ CLI file not found");
  }
} catch (error) {
  console.error("✗ Error:", error);
}
console.log();

// Summary
console.log("=".repeat(60));
console.log("Test suite complete!");
console.log("=".repeat(60));
console.log();
console.log("Next steps:");
console.log("1. Install dependencies: cd claude-canvas-windows && bun install");
console.log("2. Test environment: bun run canvas/src/cli.ts env");
console.log("3. Test calendar: bun run canvas/src/cli.ts show calendar");
console.log();
console.log("For Windows Terminal:");
console.log("4. Test spawn: bun run canvas/src/cli.ts spawn calendar");
console.log();
console.log("For tmux (Unix):");
console.log("4. Start tmux: tmux");
console.log("5. Test spawn: bun run canvas/src/cli.ts spawn calendar");
