#!/usr/bin/env bun
/**
 * Spawn plan viewer when Claude writes to a plan file
 * This hook is triggered by PostToolUse on Write operations
 * Cross-platform: Works on Windows, macOS, and Linux
 */

import { spawn } from "child_process";
import { existsSync, writeFileSync, readFileSync } from "fs";
import { basename, dirname, join } from "path";

async function main() {
  // Read JSON input from stdin
  const chunks: Buffer[] = [];
  for await (const chunk of Bun.stdin.stream()) {
    chunks.push(chunk);
  }
  const input = JSON.parse(Buffer.concat(chunks).toString());

  // Extract file path from tool_input
  const filePath = input?.tool_input?.file_path;
  if (!filePath) {
    process.exit(0);
  }

  // Check if this is a plan file (matches .claude/plans/*.md pattern)
  const normalizedPath = filePath.replace(/\\/g, "/");
  if (!normalizedPath.includes(".claude/plans/")) {
    process.exit(0);
  }

  // Check if file is a markdown file
  if (!filePath.endsWith(".md")) {
    process.exit(0);
  }

  // Lock file to prevent multiple viewers for the same session
  const sessionId = input?.session_id || "default";
  const tempDir = process.env.TEMP || process.env.TMPDIR || "/tmp";
  const lockFile = join(tempDir, `claude-plan-viewer-${sessionId}.lock`);

  // Check if viewer is already running for this session
  if (existsSync(lockFile)) {
    try {
      const content = readFileSync(lockFile, "utf-8").trim();
      if (content) {
        // Lock exists, viewer might be running
        process.exit(0);
      }
    } catch {
      // Ignore read errors
    }
  }

  // Create lock file
  try {
    writeFileSync(lockFile, process.pid.toString());
  } catch {
    // Ignore write errors
  }

  // Extract plan title from filename
  const planName = basename(filePath, ".md");
  const planTitle = `Plan: ${planName}`;

  // Get plugin root directory
  const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT ||
    dirname(dirname(dirname(import.meta.dir)));

  const cliPath = join(pluginRoot, "src", "cli.ts");

  // Spawn the plan viewer in the background
  try {
    const proc = spawn("bun", ["run", cliPath, "watch-plan", filePath, "--title", planTitle], {
      cwd: pluginRoot,
      detached: true,
      stdio: "ignore",
      shell: process.platform === "win32",
    });
    proc.unref();
  } catch (e) {
    // Silently fail - don't block Claude
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
