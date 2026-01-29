#!/usr/bin/env bun
import { program } from "commander";
import { detectTerminal, spawnCanvas } from "./terminal";

// Set window title via ANSI escape codes
function setWindowTitle(title: string) {
  process.stdout.write(`\x1b]0;${title}\x07`);
}

program
  .name("claude-canvas")
  .description("Interactive terminal canvases for Claude (Windows/Unix)")
  .version("1.0.0");

program
  .command("show [kind]")
  .description("Show a canvas in the current terminal")
  .option("--id <id>", "Canvas ID")
  .option("--config <json>", "Canvas configuration (JSON)")
  .option("--config-file <path>", "Path to JSON config file")
  .option("--socket <path>", "Socket/pipe path for IPC")
  .option("--scenario <name>", "Scenario name (e.g., display, meeting-picker)")
  .action(async (kind = "demo", options) => {
    const id = options.id || `${kind}-1`;

    // Load config from file or parse from string
    let config: unknown;
    if (options.configFile) {
      try {
        const configText = await Bun.file(options.configFile).text();
        config = JSON.parse(configText);
      } catch (e) {
        console.error(`Failed to read config file: ${options.configFile}`);
        process.exit(1);
      }
    } else if (options.config) {
      config = JSON.parse(options.config);
    }

    const socketPath = options.socket;
    const scenario = options.scenario || "display";

    // Set window title
    setWindowTitle(`canvas: ${kind}`);

    // Dynamically import and render the canvas
    const { renderCanvas } = await import("./canvases");
    await renderCanvas(kind, id, config, { socketPath, scenario });
  });

program
  .command("spawn [kind]")
  .description("Spawn a canvas in a new terminal pane/window")
  .option("--id <id>", "Canvas ID")
  .option("--config <json>", "Canvas configuration (JSON)")
  .option("--socket <path>", "Socket/pipe path for IPC")
  .option("--scenario <name>", "Scenario name (e.g., display, meeting-picker)")
  .action(async (kind = "demo", options) => {
    const id = options.id || `${kind}-1`;
    const result = await spawnCanvas(kind, id, options.config, {
      socketPath: options.socket,
      scenario: options.scenario,
    });
    console.log(`Spawned ${kind} canvas '${id}' via ${result.method}`);
  });

program
  .command("demo [kind]")
  .description("Run a demo canvas with example data (calendar, document, flight)")
  .action(async (kind = "calendar") => {
    setWindowTitle(`canvas demo: ${kind}`);

    const { renderCanvas } = await import("./canvases");

    // Demo configs for each canvas type
    const demoConfigs: Record<string, unknown> = {
      calendar: {
        title: "Demo Calendar",
        // Events will be auto-generated with current dates
      },
      document: {
        title: "Welcome to Claude Canvas",
        content: `# Welcome to Claude Canvas!

This is a **demo document** rendered in your terminal.

## Features

- **Markdown rendering** with syntax highlighting
- **Cross-platform support** (Windows Terminal, ConEmu, tmux)
- **Real-time IPC** communication with Claude

## Getting Started

1. Try the calendar: \`bun run canvas/src/cli.ts demo calendar\`
2. Try the flight picker: \`bun run canvas/src/cli.ts demo flight\`
3. Spawn in a split pane: \`bun run canvas/src/cli.ts spawn calendar\`

## Controls

- Use **arrow keys** to navigate
- Press **q** or **Esc** to quit
- Press **t** to jump to today (calendar)

Enjoy exploring Claude Canvas!
`,
      },
      flight: {
        flights: [
          {
            id: "ua123",
            airline: "United Airlines",
            flightNumber: "UA 123",
            origin: { code: "SFO", name: "San Francisco Intl", city: "San Francisco" },
            destination: { code: "JFK", name: "John F. Kennedy Intl", city: "New York" },
            departureTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            arrivalTime: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
            duration: 300,
            price: 34500,
            currency: "USD",
            cabinClass: "economy",
            stops: 0,
          },
          {
            id: "aa456",
            airline: "American Airlines",
            flightNumber: "AA 456",
            origin: { code: "SFO", name: "San Francisco Intl", city: "San Francisco" },
            destination: { code: "JFK", name: "John F. Kennedy Intl", city: "New York" },
            departureTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
            arrivalTime: new Date(Date.now() + 9.5 * 60 * 60 * 1000).toISOString(),
            duration: 330,
            price: 28900,
            currency: "USD",
            cabinClass: "economy",
            stops: 1,
          },
          {
            id: "dl789",
            airline: "Delta Air Lines",
            flightNumber: "DL 789",
            origin: { code: "SFO", name: "San Francisco Intl", city: "San Francisco" },
            destination: { code: "JFK", name: "John F. Kennedy Intl", city: "New York" },
            departureTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
            arrivalTime: new Date(Date.now() + 11 * 60 * 60 * 1000).toISOString(),
            duration: 300,
            price: 42000,
            currency: "USD",
            cabinClass: "business",
            stops: 0,
          },
        ],
      },
    };

    const config = demoConfigs[kind] || demoConfigs.calendar;
    await renderCanvas(kind, `demo-${kind}`, config, { scenario: "display" });
  });

program
  .command("watch-plan <planPath>")
  .description("Watch a plan file and display it in a split pane with live updates")
  .option("--title <title>", "Document title", "Plan")
  .option("--no-spawn", "Show in current terminal instead of spawning a split pane")
  .action(async (planPath: string, options) => {
    const { existsSync } = await import("fs");
    const { resolve } = await import("path");
    const { watchFile } = await import("./utils/file-watcher");
    const { createIPCServer, getSocketPath } = await import("./ipc");

    // Resolve the plan path
    const resolvedPath = resolve(planPath);
    const id = `plan-${Date.now()}`;
    const socketPath = getSocketPath(id);

    // Read initial content
    let initialContent = `# ${options.title || "Plan"}

*Watching for changes...*

The plan will appear here once content is written to:
\`${resolvedPath}\``;
    if (existsSync(resolvedPath)) {
      try {
        const fileContent = await Bun.file(resolvedPath).text();
        if (fileContent.trim()) {
          initialContent = fileContent;
        }
      } catch (e) {
        // Use placeholder
      }
    }

    setWindowTitle(`Plan: ${options.title}`);

    if (options.spawn === false) {
      // Show in current terminal (no IPC needed for static display)
      const { renderCanvas } = await import("./canvases");
      await renderCanvas("document", id, {
        content: initialContent,
        title: options.title,
        readOnly: true,
      }, { scenario: "plan" });
      return;
    }

    // Create IPC server for communication with the canvas
    let canvasConnected = false;
    let fileWatcher: { close: () => void } | null = null;

    const server = await createIPCServer({
      socketPath,
      onMessage(msg) {
        if (msg.type === "ready") {
          canvasConnected = true;
          console.log("Canvas connected and ready for updates");
        }
      },
      onClientConnect() {
        console.log("Canvas connected");
      },
      onClientDisconnect() {
        console.log("Canvas disconnected - stopping file watcher");
        canvasConnected = false;
        fileWatcher?.close();
        process.exit(0);
      },
      onError(error) {
        console.error("IPC error:", error.message);
      },
    });

    // Spawn the document canvas in a split pane
    console.log(`Spawning plan viewer for: ${resolvedPath}`);
    const result = await spawnCanvas("document", id, JSON.stringify({
      content: initialContent,
      title: options.title,
      readOnly: true,
    }), { socketPath, scenario: "plan" });

    console.log(`Canvas spawned via ${result.method}`);

    // Start watching the file for changes
    fileWatcher = watchFile(resolvedPath, (content) => {
      if (canvasConnected) {
        console.log(`File updated (${content.length} bytes) - sending to canvas`);
        server.broadcast({ type: "update", config: { content } });
      }
    }, {
      debounceMs: 100,
      onError(error) {
        console.error("File watcher error:", error.message);
      },
    });

    console.log(`Watching ${resolvedPath} for changes...`);
    console.log("Press Ctrl+C to stop");

    // Keep the process running
    process.on("SIGINT", () => {
      console.log("\nStopping...");
      fileWatcher?.close();
      server.close();
      process.exit(0);
    });

    // Keep alive
    await new Promise(() => {});
  });

program
  .command("env")
  .description("Show detected terminal environment")
  .action(() => {
    const env = detectTerminal();
    console.log("Terminal Environment:");
    console.log(`  Platform: ${process.platform}`);
    console.log(`  Summary: ${env.summary}`);

    if (process.platform === "win32") {
      console.log(`  Windows Terminal: ${(env as any).inWindowsTerminal || false}`);
      console.log(`  ConEmu: ${(env as any).inConEmu || false}`);
      console.log(`  PowerShell: ${(env as any).inPowerShell || false}`);
    } else {
      console.log(`  In tmux: ${(env as any).inTmux || false}`);
    }
  });

program
  .command("update <id>")
  .description("Send updated config to a running canvas via IPC")
  .option("--config <json>", "New canvas configuration (JSON)")
  .action(async (id: string, options) => {
    const { getSocketPath } = await import("./ipc/types");
    const { connectToController } = await import("./ipc");
    const socketPath = getSocketPath(id);
    const config = options.config ? JSON.parse(options.config) : {};

    try {
      const client = await connectToController({
        socketPath,
        onMessage: () => {},
        onDisconnect: () => {},
        onError: (err) => console.error("Error:", err),
      });

      client.send({ type: "update", config });
      client.close();
      console.log(`Sent update to canvas '${id}'`);
    } catch (err) {
      console.error(`Failed to connect to canvas '${id}':`, err);
    }
  });

program
  .command("selection <id>")
  .description("Get the current selection from a running document canvas")
  .action(async (id: string) => {
    const { getSocketPath } = await import("./ipc/types");
    const { connectToController } = await import("./ipc");
    const socketPath = getSocketPath(id);

    try {
      let resolved = false;
      const result = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error("Timeout waiting for response"));
          }
        }, 2000);

        connectToController({
          socketPath,
          onMessage: (msg) => {
            if (resolved) return;
            if (msg.type === "selection") {
              clearTimeout(timeout);
              resolved = true;
              resolve(JSON.stringify((msg as any).data));
            }
          },
          onDisconnect: () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(JSON.stringify(null));
            }
          },
          onError: (error) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              reject(error);
            }
          },
        }).then((client) => {
          client.send({ type: "getSelection" });
        });
      });
      console.log(result);
    } catch (err) {
      console.error(`Failed to get selection from canvas '${id}':`, err);
      process.exit(1);
    }
  });

program
  .command("content <id>")
  .description("Get the current content from a running document canvas")
  .action(async (id: string) => {
    const { getSocketPath } = await import("./ipc/types");
    const { connectToController } = await import("./ipc");
    const socketPath = getSocketPath(id);

    try {
      let resolved = false;
      const result = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error("Timeout waiting for response"));
          }
        }, 2000);

        connectToController({
          socketPath,
          onMessage: (msg) => {
            if (resolved) return;
            if (msg.type === "content") {
              clearTimeout(timeout);
              resolved = true;
              resolve(JSON.stringify((msg as any).data));
            }
          },
          onDisconnect: () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(JSON.stringify(null));
            }
          },
          onError: (error) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              reject(error);
            }
          },
        }).then((client) => {
          client.send({ type: "getContent" });
        });
      });
      console.log(result);
    } catch (err) {
      console.error(`Failed to get content from canvas '${id}':`, err);
      process.exit(1);
    }
  });

program.parse();
