#!/bin/bash
# Spawn plan viewer when Claude writes to a plan file
# This hook is triggered by PostToolUse on Write operations

set -euo pipefail

# Read JSON input from stdin
input=$(cat)

# Extract file path from tool_input
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

# Exit if no file path
if [ -z "$file_path" ]; then
  exit 0
fi

# Check if this is a plan file (matches .claude/plans/*.md pattern)
if [[ "$file_path" != *".claude/plans/"* ]] && [[ "$file_path" != *".claude\\plans\\"* ]]; then
  exit 0
fi

# Check if file is a markdown file
if [[ "$file_path" != *.md ]]; then
  exit 0
fi

# Lock file to prevent multiple viewers for the same session
session_id=$(echo "$input" | jq -r '.session_id // "default"')
lock_file="${TEMP:-/tmp}/claude-plan-viewer-${session_id}.lock"

# Check if viewer is already running for this session
if [ -f "$lock_file" ]; then
  # Check if the process is still running (basic check)
  if [ -s "$lock_file" ]; then
    exit 0
  fi
fi

# Create lock file
echo "$$" > "$lock_file"

# Extract plan title from filename
plan_name=$(basename "$file_path" .md)
plan_title="Plan: ${plan_name}"

# Get plugin root directory
plugin_root="${CLAUDE_PLUGIN_ROOT:-$(dirname $(dirname $(dirname "$0")))}"

# Spawn the plan viewer in the background
# Use the watch-plan command from our CLI
cd "$plugin_root"

# Run in background and detach
if command -v bun &> /dev/null; then
  nohup bun run src/cli.ts watch-plan "$file_path" --title "$plan_title" > /dev/null 2>&1 &
fi

exit 0
