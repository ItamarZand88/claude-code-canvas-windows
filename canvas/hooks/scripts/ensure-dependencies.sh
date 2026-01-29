#!/bin/bash
# Ensure dependencies are installed for the canvas plugin
# This hook runs on SessionStart to auto-install deps if missing

# Check if node_modules exists in plugin root
if [ ! -d "${CLAUDE_PLUGIN_ROOT}/node_modules" ]; then
  # Dependencies not installed - try to install them

  # Check if bun is available
  if ! command -v bun &> /dev/null; then
    echo '{"continue": true, "systemMessage": "Canvas plugin: bun not found. Please install bun (https://bun.sh) and run: cd ~/.claude/plugins/cache/claude-code-canvas-windows/canvas/1.0.0 && bun install"}' >&2
    exit 0
  fi

  # Install dependencies silently
  cd "${CLAUDE_PLUGIN_ROOT}" || exit 0
  bun install --silent > /dev/null 2>&1

  if [ $? -eq 0 ]; then
    echo '{"continue": true, "systemMessage": "Canvas plugin: Dependencies installed successfully."}' >&2
  else
    echo '{"continue": true, "systemMessage": "Canvas plugin: Failed to install dependencies. Please run manually: cd ~/.claude/plugins/cache/claude-code-canvas-windows/canvas/1.0.0 && bun install"}' >&2
  fi
fi

# Dependencies exist or were just installed - continue normally
exit 0
