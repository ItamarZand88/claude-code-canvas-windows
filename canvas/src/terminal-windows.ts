import { spawn, spawnSync } from "child_process";
import { existsSync } from "fs";

export interface TerminalEnvironment {
  inWindowsTerminal: boolean;
  inConEmu: boolean;
  inPowerShell: boolean;
  summary: string;
}

export function detectTerminal(): TerminalEnvironment {
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

export interface SpawnResult {
  method: string;
  pid?: number;
}

export interface SpawnOptions {
  socketPath?: string;
  scenario?: string;
}

// File to track the canvas pane ID
const CANVAS_PANE_FILE = `${process.env.TEMP}\\claude-canvas-pane-id.txt`;

async function getCanvasPaneId(): Promise<string | null> {
  try {
    if (!existsSync(CANVAS_PANE_FILE)) {
      return null;
    }
    const file = Bun.file(CANVAS_PANE_FILE);
    const paneId = (await file.text()).trim();
    if (!paneId) return null;
    
    // Verify pane still exists by checking if we can focus it
    const result = spawnSync("wt.exe", ["-w", "0", "focus-tab", "-t", paneId], {
      stdio: "ignore",
    });
    
    // If command succeeds, pane exists
    if (result.status === 0) {
      return paneId;
    }
    
    // Stale pane reference - clean up
    await Bun.write(CANVAS_PANE_FILE, "");
  } catch {
    // Ignore errors
  }
  return null;
}

async function saveCanvasPaneId(paneId: string): Promise<void> {
  await Bun.write(CANVAS_PANE_FILE, paneId);
}

async function createNewPane(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    // Windows Terminal split args:
    // -w 0 = current window
    // sp = split pane
    // -H = horizontal split (side by side)
    // -s 0.67 = 67% size for canvas pane (Claude gets 33%, canvas gets 67%)
    
    const args = [
      "-w", "0",  // Current window
      "sp",       // Split pane
      "-H",       // Horizontal (side-by-side)
      "-s", "0.67", // Canvas gets 67% width
      "cmd.exe", "/c", command
    ];
    
    const proc = spawn("wt.exe", args, {
      detached: true,
      stdio: "ignore"
    });
    
    proc.on("spawn", () => {
      // Pane was created successfully
      resolve(true);
    });
    
    proc.on("error", () => {
      resolve(false);
    });
    
    // Unref so parent can exit
    proc.unref();
  });
}

async function reuseExistingPane(paneId: string, command: string): Promise<boolean> {
  return new Promise((resolve) => {
    // First, try to focus and clear the pane
    const focusProc = spawn("wt.exe", ["-w", "0", "focus-tab", "-t", paneId], {
      stdio: "ignore"
    });
    
    focusProc.on("close", (code) => {
      if (code !== 0) {
        // Pane doesn't exist, create new one
        createNewPane(command).then(resolve);
        return;
      }
      
      // Wait a bit, then send the new command
      setTimeout(() => {
        // Close the old pane and create a new one in its place
        // This is simpler than trying to reuse it
        const closeProc = spawn("wt.exe", ["-w", "0", "close-pane"], {
          stdio: "ignore"
        });
        
        closeProc.on("close", () => {
          // Create new pane
          setTimeout(() => {
            createNewPane(command).then(resolve);
          }, 200);
        });
      }, 100);
    });
    
    focusProc.on("error", () => {
      // Error focusing, create new pane
      createNewPane(command).then(resolve);
    });
  });
}

async function spawnWindowsTerminal(command: string): Promise<boolean> {
  // Check if we have an existing canvas pane to reuse
  const existingPaneId = await getCanvasPaneId();

  if (existingPaneId) {
    // Try to reuse existing pane
    const reused = await reuseExistingPane(existingPaneId, command);
    if (reused) {
      return true;
    }
    // Reuse failed - clear stale reference and create new
    await Bun.write(CANVAS_PANE_FILE, "");
  }

  // Create a new split pane
  return createNewPane(command);
}

async function spawnConEmu(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    // ConEmu split using GuiMacro
    // Split(0,50) means horizontal split, 50% size
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
    // Fallback: spawn new PowerShell window
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

export async function spawnCanvas(
  kind: string,
  id: string,
  configJson?: string,
  options?: SpawnOptions
): Promise<SpawnResult> {
  const env = detectTerminal();

  // Get the directory of this script
  const scriptDir = import.meta.dir.replace(/[\/\\]src$/, "");
  const runScript = `${scriptDir}\\run-canvas.bat`;

  // Check if run script exists
  if (!existsSync(runScript)) {
    throw new Error(`Run script not found: ${runScript}`);
  }

  // Auto-generate socket path for IPC - use named pipe for Windows
  const socketPath = options?.socketPath || `\\\\.\\pipe\\canvas-${id}`;

  // Build the command to run
  let command = `"${runScript}" show ${kind} --id ${id}`;
  
  if (configJson) {
    // Write config to a temp file to avoid command line length issues
    const configFile = `${process.env.TEMP}\\canvas-config-${id}.json`;
    await Bun.write(configFile, configJson);
    // Use PowerShell Get-Content to read the file
    command += ` --config "$(powershell -Command \\"Get-Content '${configFile}' -Raw\\")"`;
  }
  
  command += ` --socket "${socketPath}"`;
  
  if (options?.scenario) {
    command += ` --scenario ${options.scenario}`;
  }

  // Try spawning based on detected terminal
  if (env.inWindowsTerminal) {
    const result = await spawnWindowsTerminal(command);
    if (result) return { method: "Windows Terminal" };
  }

  if (env.inConEmu) {
    const result = await spawnConEmu(command);
    if (result) return { method: "ConEmu" };
  }

  // Fallback to PowerShell new window
  const result = await spawnPowerShellWindow(command);
  if (result) return { method: "PowerShell window" };

  throw new Error(
    "Failed to spawn canvas. Please ensure you are running in:\n" +
    "  - Windows Terminal (recommended)\n" +
    "  - ConEmu\n" +
    "  - PowerShell"
  );
}
