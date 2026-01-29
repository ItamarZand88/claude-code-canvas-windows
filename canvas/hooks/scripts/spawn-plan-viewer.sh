#!/bin/bash
# Spawn plan viewer when Claude writes/edits a plan file
# This hook triggers on PostToolUse for Write|Edit operations

# Read JSON input from stdin
input=$(cat)

# Extract file path - try jq first, fall back to grep/sed
if command -v jq &> /dev/null; then
  file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
else
  # Fallback: extract file_path using grep/sed
  file_path=$(echo "$input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
fi

# Exit if no file path
[ -z "$file_path" ] && exit 0

# Normalize path separators for comparison (Windows uses backslashes)
normalized_path=$(echo "$file_path" | tr '\\' '/')

# Check if this is a plan file (.claude/plans/*.md)
if [[ "$normalized_path" != *".claude/plans/"* ]]; then
  exit 0
fi

# Check if it's a markdown file
if [[ "$normalized_path" != *.md ]]; then
  exit 0
fi

# Lock file to prevent multiple viewers per session
session_id=$(echo "$input" | jq -r '.session_id // "default"' 2>/dev/null || echo "default")
lock_file="${TEMP:-${TMPDIR:-/tmp}}/claude-plan-viewer-${session_id}.lock"

# Check if viewer already running for this session
if [ -f "$lock_file" ]; then
  # Lock exists - don't spawn another viewer
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

# Success - don't output anything to avoid interfering with Claude
exit 0
