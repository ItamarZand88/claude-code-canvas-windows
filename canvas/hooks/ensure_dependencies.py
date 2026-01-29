#!/usr/bin/env python3
"""
Ensure dependencies are installed for the canvas plugin.
This hook runs on SessionStart to auto-install deps if missing.
"""

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


def main():
    plugin_root = os.environ.get("CLAUDE_PLUGIN_ROOT", "")
    if not plugin_root:
        sys.exit(0)

    node_modules = Path(plugin_root) / "node_modules"

    # Check if dependencies are already installed
    if node_modules.exists() and node_modules.is_dir():
        # Dependencies exist, nothing to do
        sys.exit(0)

    # Check if bun is available
    bun_path = shutil.which("bun")
    if not bun_path:
        # Bun not found - output system message for Claude
        output = {
            "continue": True,
            "systemMessage": "Canvas plugin: bun not found. Please install bun (https://bun.sh) and run: cd ~/.claude/plugins/cache/claude-code-canvas-windows/canvas/1.0.0 && bun install"
        }
        print(json.dumps(output), file=sys.stderr)
        sys.exit(0)

    # Install dependencies
    try:
        result = subprocess.run(
            [bun_path, "install"],
            cwd=plugin_root,
            capture_output=True,
            timeout=60
        )

        if result.returncode == 0:
            output = {
                "continue": True,
                "systemMessage": "Canvas plugin: Dependencies installed successfully."
            }
        else:
            output = {
                "continue": True,
                "systemMessage": f"Canvas plugin: Failed to install dependencies. Please run manually: cd {plugin_root} && bun install"
            }

        print(json.dumps(output), file=sys.stderr)
    except subprocess.TimeoutExpired:
        output = {
            "continue": True,
            "systemMessage": "Canvas plugin: Dependency installation timed out. Please run manually: cd ~/.claude/plugins/cache/claude-code-canvas-windows/canvas/1.0.0 && bun install"
        }
        print(json.dumps(output), file=sys.stderr)
    except Exception as e:
        output = {
            "continue": True,
            "systemMessage": f"Canvas plugin: Error installing dependencies: {e}"
        }
        print(json.dumps(output), file=sys.stderr)

    sys.exit(0)


if __name__ == "__main__":
    main()
