#!/bin/bash
# Spawn plan viewer when Claude writes/edits a plan file
# This hook triggers on PostToolUse for Write|Edit operations

# Read JSON input from stdin
input=$(cat)

# Debug: uncomment to log input
# echo "$input" >> /tmp/hook-debug.log

# Extract file path - handle both escaped and unescaped backslashes
# First try jq (works if JSON is properly escaped)
file_path=""
if command -v jq &> /dev/null; then
  file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
fi

# If jq failed or returned empty, try regex extraction
if [ -z "$file_path" ]; then
  # Extract file_path value using grep - handles various escape patterns
  file_path=$(echo "$input" | grep -oP '"file_path"\s*:\s*"\K[^"]+' 2>/dev/null)
fi

# If still empty, try a simpler pattern
if [ -z "$file_path" ]; then
  file_path=$(echo "$input" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
fi

# Exit if no file path found
[ -z "$file_path" ] && exit 0

# Normalize path separators for comparison (Windows uses backslashes)
# Also handle escaped backslashes from JSON
normalized_path=$(echo "$file_path" | sed 's/\\\\/\//g' | tr '\\' '/')

# Check if this is a plan file (.claude/plans/*.md)
if [[ "$normalized_path" != *".claude/plans/"* ]]; then
  exit 0
fi

# Check if it's a markdown file
if [[ "$normalized_path" != *.md ]]; then
  exit 0
fi

# Lock file to prevent multiple viewers per session
session_id=$(echo "$input" | jq -r '.session_id // "default"' 2>/dev/null)
[ -z "$session_id" ] && session_id="default"
lock_file="${TEMP:-${TMPDIR:-/tmp}}/claude-plan-viewer-${session_id}.lock"

# Check if viewer already running for this session
if [ -f "$lock_file" ]; then
  exit 0
fi

# Create lock file
echo "$$" > "$lock_file"

# Extract plan title from filename
plan_name=$(basename "$file_path" .md)

# Navigate to plugin root and spawn viewer
cd "${CLAUDE_PLUGIN_ROOT}" || exit 0

# Spawn the plan viewer in background (detached)
nohup bun run src/cli.ts watch-plan "$file_path" --title "Plan: $plan_name" > /dev/null 2>&1 &

exit 0
