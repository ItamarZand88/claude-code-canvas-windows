// Terminal module - Platform aware
// Automatically uses Windows or Unix implementation based on platform

import { spawn, spawnSync } from "child_process";
import { existsSync } from "fs";

// Common interfaces used by both platforms
export interface SpawnResult {
  method: string;
  pid?: number;
}

export interface SpawnOptions {
  socketPath?: string;
  scenario?: string;
}

// Platform-specific terminal environment types
export interface WindowsTerminalEnvironment {
  inWindowsTerminal: boolean;
  inConEmu: boolean;
  inPowerShell: boolean;
  summary: string;
}

export interface UnixTerminalEnvironment {
  inTmux: boolean;
  summary: string;
}

export type TerminalEnvironment = WindowsTerminalEnvironment | UnixTerminalEnvironment;

// ============== WINDOWS IMPLEMENTATION ==============

const WINDOWS_CANVAS_PANE_FILE = `${process.env.TEMP}\\claude-canvas-pane-id.txt`;

function detectWindowsTerminal(): WindowsTerminalEnvironment {
  const inWindowsTerminal = !!process.env.WT_SESSION;
  const inConEmu = !!process.env.ConEmuPID;
  const inPowerShell = !!process.env.PSModulePath && !inWindowsTerminal && !inConEmu;

  const summary = inWindowsTerminal
    ? "Windows Terminal"
    : inConEmu
    ? "ConEmu"
    : inPowerShell
    ? "PowerShell"
    : "cmd";

  return {
    inWindowsTerminal,
    inConEmu,
    inPowerShell,
    summary,
  };
}

// Get the path to wt.exe (Windows Terminal)
// Note: wt.exe in WindowsApps is an App Execution Alias which existsSync can't detect
function getWtPath(): string {
  const localAppData = process.env.LOCALAPPDATA || "";
  // This is the standard location for Windows Terminal
  return `${localAppData}\\Microsoft\\WindowsApps\\wt.exe`;
}

async function getWindowsCanvasPaneId(): Promise<string | null> {
  try {
    if (!existsSync(WINDOWS_CANVAS_PANE_FILE)) {
      return null;
    }
    const file = Bun.file(WINDOWS_CANVAS_PANE_FILE);
    const paneId = (await file.text()).trim();
    if (!paneId) return null;

    const wtPath = getWtPath();
    const result = spawnSync(`"${wtPath}" -w 0 focus-tab -t ${paneId}`, {
      stdio: "ignore",
      shell: true,
    });

    if (result.status === 0) {
      return paneId;
    }

    await Bun.write(WINDOWS_CANVAS_PANE_FILE, "");
  } catch {
    // Ignore errors
  }
  return null;
}

async function createWindowsPane(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const wtPath = getWtPath();

    // Windows Terminal split pane command
    // Using shell: true to properly resolve the App Execution Alias
    // -V creates a vertical split line (side-by-side panes)
    // -s 0.67 gives the canvas 67% width (on the right side)
    // cmd /c closes the pane when the canvas exits (e.g., when user presses 'q')
    const fullCommand = `"${wtPath}" -w 0 sp -V -s 0.67 -- cmd /c ${command}`;

    const proc = spawn(fullCommand, [], {
      detached: true,
      stdio: "ignore",
      shell: true,
    });

    proc.on("spawn", () => {
      // Give Windows Terminal a moment to create the pane
      setTimeout(() => resolve(true), 100);
    });
    proc.on("error", (err) => {
      console.error("Failed to spawn Windows Terminal pane:", err.message);
      resolve(false);
    });
    proc.unref();
  });
}

async function reuseWindowsPane(paneId: string, command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const wtPath = getWtPath();
    const focusCmd = `"${wtPath}" -w 0 focus-tab -t ${paneId}`;
    const focusProc = spawn(focusCmd, [], {
      stdio: "ignore",
      shell: true,
    });

    focusProc.on("close", (code) => {
      if (code !== 0) {
        createWindowsPane(command).then(resolve);
        return;
      }

      setTimeout(() => {
        const closeCmd = `"${wtPath}" -w 0 close-pane`;
        const closeProc = spawn(closeCmd, [], {
          stdio: "ignore",
          shell: true,
        });

        closeProc.on("close", () => {
          setTimeout(() => {
            createWindowsPane(command).then(resolve);
          }, 200);
        });
      }, 100);
    });

    focusProc.on("error", () => {
      createWindowsPane(command).then(resolve);
    });
  });
}

async function spawnWindowsTerminal(command: string): Promise<boolean> {
  const existingPaneId = await getWindowsCanvasPaneId();

  if (existingPaneId) {
    const reused = await reuseWindowsPane(existingPaneId, command);
    if (reused) {
      return true;
    }
    await Bun.write(WINDOWS_CANVAS_PANE_FILE, "");
  }

  return createWindowsPane(command);
}

async function spawnConEmu(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const escapedCommand = command.replace(/"/g, '\\"');
    const macro = `Split(0,67,"${escapedCommand}")`;
    const args = ["-GuiMacro:0", macro];

    const proc = spawn("ConEmuC.exe", args, {
      detached: true,
      stdio: "ignore"
    });

    proc.on("spawn", () => resolve(true));
    proc.on("error", () => resolve(false));
    proc.unref();
  });
}

async function spawnPowerShellWindow(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const escapedCommand = command.replace(/"/g, '`"');
    const psScript = `Start-Process powershell -ArgumentList "-NoExit","-Command","${escapedCommand}"`;

    const proc = spawn("powershell.exe", ["-Command", psScript], {
      detached: true,
      stdio: "ignore",
      shell: true
    });

    proc.on("spawn", () => resolve(true));
    proc.on("error", () => resolve(false));
    proc.unref();
  });
}

async function spawnCanvasWindows(
  kind: string,
  id: string,
  configJson?: string,
  options?: SpawnOptions
): Promise<SpawnResult> {
  const env = detectWindowsTerminal();

  const scriptDir = import.meta.dir.replace(/[\/\\]src$/, "");
  const runScript = `${scriptDir}\\run-canvas.bat`;

  if (!existsSync(runScript)) {
    throw new Error(`Run script not found: ${runScript}`);
  }

  const socketPath = options?.socketPath || `\\\\.\\pipe\\canvas-${id}`;

  let command = `"${runScript}" show ${kind} --id ${id}`;

  if (configJson) {
    // Write config to a temp file and pass the file path
    const configFile = `${process.env.TEMP}\\canvas-config-${id}.json`;
    await Bun.write(configFile, configJson);
    command += ` --config-file "${configFile}"`;
  }

  command += ` --socket "${socketPath}"`;

  if (options?.scenario) {
    command += ` --scenario ${options.scenario}`;
  }

  if (env.inWindowsTerminal) {
    const result = await spawnWindowsTerminal(command);
    if (result) return { method: "Windows Terminal" };
  }

  if (env.inConEmu) {
    const result = await spawnConEmu(command);
    if (result) return { method: "ConEmu" };
  }

  const result = await spawnPowerShellWindow(command);
  if (result) return { method: "PowerShell window" };

  throw new Error(
    "Failed to spawn canvas. Please ensure you are running in:\n" +
    "  - Windows Terminal (recommended)\n" +
    "  - ConEmu\n" +
    "  - PowerShell"
  );
}

// ============== UNIX IMPLEMENTATION ==============

const UNIX_CANVAS_PANE_FILE = "/tmp/claude-canvas-pane-id";

function detectUnixTerminal(): UnixTerminalEnvironment {
  const inTmux = !!process.env.TMUX;
  const summary = inTmux ? "tmux" : "no tmux";
  return { inTmux, summary };
}

async function getUnixCanvasPaneId(): Promise<string | null> {
  try {
    const file = Bun.file(UNIX_CANVAS_PANE_FILE);
    if (await file.exists()) {
      const paneId = (await file.text()).trim();
      const result = spawnSync("tmux", ["display-message", "-t", paneId, "-p", "#{pane_id}"]);
      const output = result.stdout?.toString().trim();
      if (result.status === 0 && output === paneId) {
        return paneId;
      }
      await Bun.write(UNIX_CANVAS_PANE_FILE, "");
    }
  } catch {
    // Ignore errors
  }
  return null;
}

async function saveUnixCanvasPaneId(paneId: string): Promise<void> {
  await Bun.write(UNIX_CANVAS_PANE_FILE, paneId);
}

async function createUnixPane(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const args = ["split-window", "-h", "-p", "67", "-P", "-F", "#{pane_id}", command];
    const proc = spawn("tmux", args);
    let paneId = "";
    proc.stdout?.on("data", (data) => {
      paneId += data.toString();
    });
    proc.on("close", async (code) => {
      if (code === 0 && paneId.trim()) {
        await saveUnixCanvasPaneId(paneId.trim());
      }
      resolve(code === 0);
    });
    proc.on("error", () => resolve(false));
  });
}

async function reuseUnixPane(paneId: string, command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const killProc = spawn("tmux", ["send-keys", "-t", paneId, "C-c"]);
    killProc.on("close", () => {
      setTimeout(() => {
        const args = ["send-keys", "-t", paneId, `clear && ${command}`, "Enter"];
        const proc = spawn("tmux", args);
        proc.on("close", (code) => resolve(code === 0));
        proc.on("error", () => resolve(false));
      }, 150);
    });
    killProc.on("error", () => resolve(false));
  });
}

async function spawnTmux(command: string): Promise<boolean> {
  const existingPaneId = await getUnixCanvasPaneId();

  if (existingPaneId) {
    const reused = await reuseUnixPane(existingPaneId, command);
    if (reused) {
      return true;
    }
    await Bun.write(UNIX_CANVAS_PANE_FILE, "");
  }

  return createUnixPane(command);
}

async function spawnCanvasUnix(
  kind: string,
  id: string,
  configJson?: string,
  options?: SpawnOptions
): Promise<SpawnResult> {
  const env = detectUnixTerminal();

  if (!env.inTmux) {
    throw new Error("Canvas requires tmux. Please run inside a tmux session.");
  }

  const scriptDir = import.meta.dir.replace("/src", "");
  const runScript = `${scriptDir}/run-canvas.sh`;

  const socketPath = options?.socketPath || `/tmp/canvas-${id}.sock`;

  let command = `${runScript} show ${kind} --id ${id}`;
  if (configJson) {
    const configFile = `/tmp/canvas-config-${id}.json`;
    await Bun.write(configFile, configJson);
    command += ` --config "$(cat ${configFile})"`;
  }
  command += ` --socket ${socketPath}`;
  if (options?.scenario) {
    command += ` --scenario ${options.scenario}`;
  }

  const result = await spawnTmux(command);
  if (result) return { method: "tmux" };

  throw new Error("Failed to spawn tmux pane");
}

// ============== PLATFORM-AGNOSTIC EXPORTS ==============

export function detectTerminal(): TerminalEnvironment {
  if (process.platform === "win32") {
    return detectWindowsTerminal();
  } else {
    return detectUnixTerminal();
  }
}

export async function spawnCanvas(
  kind: string,
  id: string,
  configJson?: string,
  options?: SpawnOptions
): Promise<SpawnResult> {
  if (process.platform === "win32") {
    return spawnCanvasWindows(kind, id, configJson, options);
  } else {
    return spawnCanvasUnix(kind, id, configJson, options);
  }
}
