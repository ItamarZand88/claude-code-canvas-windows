#!/usr/bin/env python3
"""
Spawn plan viewer when Claude writes/edits a plan file.
This hook triggers on PostToolUse for Write|Edit operations.
"""

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


def debug_log(message):
    """Log debug messages to temp file."""
    try:
        log_file = Path(os.environ.get("TEMP", "/tmp")) / "canvas-hook-debug.log"
        with open(log_file, "a") as f:
            f.write(f"{message}\n")
    except Exception:
        pass


def get_lock_file(session_id):
    """Get session-specific lock file path."""
    temp_dir = Path(os.environ.get("TEMP", os.environ.get("TMPDIR", "/tmp")))
    return temp_dir / f"claude-plan-viewer-{session_id}.lock"


def is_plan_file(file_path):
    """Check if the file is a plan file (.claude/plans/*.md)."""
    # Normalize path separators
    normalized = file_path.replace("\\", "/")
    return ".claude/plans/" in normalized and normalized.endswith(".md")


def main():
    # Read input from stdin
    try:
        raw_input = sys.stdin.read()
        debug_log(f"Raw input received: {raw_input[:500]}")  # Log first 500 chars
        input_data = json.loads(raw_input)
        debug_log(f"Parsed JSON successfully: tool={input_data.get('tool_name', 'unknown')}")
    except json.JSONDecodeError as e:
        debug_log(f"JSON decode error: {e}, raw input: {raw_input[:200]}")
        sys.exit(0)  # Allow tool to proceed

    # Extract tool information
    tool_name = input_data.get("tool_name", "")
    tool_input = input_data.get("tool_input", {})
    session_id = input_data.get("session_id", "default")

    # Only handle Write and Edit tools
    if tool_name not in ["Write", "Edit"]:
        sys.exit(0)

    # Get file path
    file_path = tool_input.get("file_path", "")
    if not file_path:
        sys.exit(0)

    # Check if this is a plan file
    if not is_plan_file(file_path):
        sys.exit(0)

    # Check lock file to prevent multiple viewers
    lock_file = get_lock_file(session_id)
    if lock_file.exists():
        debug_log(f"Lock file exists, skipping: {lock_file}")
        sys.exit(0)

    # Create lock file
    try:
        lock_file.write_text(str(os.getpid()))
    except Exception as e:
        debug_log(f"Failed to create lock file: {e}")

    # Get plugin root
    plugin_root = os.environ.get("CLAUDE_PLUGIN_ROOT", "")
    if not plugin_root:
        debug_log("CLAUDE_PLUGIN_ROOT not set")
        sys.exit(0)

    # Extract plan name from filename
    plan_name = Path(file_path).stem

    # Spawn the plan viewer in a split pane
    try:
        cli_path = Path(plugin_root) / "src" / "cli.ts"

        # Build the command to run in the split pane
        bun_cmd = f'bun run "{cli_path}" watch-plan "{file_path}" --title "Plan: {plan_name}"'

        if sys.platform == "win32":
            # Windows: Use Windows Terminal split pane
            DETACHED_PROCESS = 0x00000008
            CREATE_NEW_PROCESS_GROUP = 0x00000200

            # Find wt.exe - check PATH first, then common locations
            wt_path = shutil.which("wt")
            if not wt_path:
                # Try common Windows Terminal locations
                possible_paths = [
                    os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WindowsApps\wt.exe"),
                    r"C:\Program Files\WindowsApps\Microsoft.WindowsTerminal_1.0.0.0_x64__8wekyb3d8bbwe\wt.exe",
                ]
                for path in possible_paths:
                    if os.path.exists(path):
                        wt_path = path
                        break

            if not wt_path:
                debug_log("Windows Terminal (wt.exe) not found")
                sys.exit(0)

            # Change to plugin directory and run the command
            full_cmd = f'cd /d "{plugin_root}" && {bun_cmd}'

            debug_log(f"Running wt command: {wt_path} -w 0 sp -V --size 0.4 cmd /k {full_cmd}")

            subprocess.Popen(
                [wt_path, "-w", "0", "sp", "-V", "--size", "0.4", "cmd", "/k", full_cmd],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=DETACHED_PROCESS | CREATE_NEW_PROCESS_GROUP
            )
        else:
            # Unix: use tmux if available, otherwise background process
            subprocess.Popen(
                ["bun", "run", str(cli_path), "watch-plan", file_path, "--title", f"Plan: {plan_name}"],
                cwd=plugin_root,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )

        debug_log(f"Spawned plan viewer for: {file_path}")
    except Exception as e:
        debug_log(f"Failed to spawn plan viewer: {e}")

    sys.exit(0)


if __name__ == "__main__":
    main()
