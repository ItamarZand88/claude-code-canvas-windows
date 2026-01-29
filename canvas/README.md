# Canvas Plugin

Interactive terminal TUI components for Claude Code.

## Overview

Canvas provides spawnable terminal displays (calendars, documents, flight booking) with real-time IPC communication. Claude can spawn these TUIs in split panes and receive user selections.

## Canvas Types

| Type | Description |
|------|-------------|
| `calendar` | Display events |
| `document` | View/edit markdown documents |
| `flight` | Compare flights |

## Installation

### Via Claude Code Plugin

```bash
# In Claude Code
/plugin marketplace add /path/to/claude-canvas-windows
/plugin install canvas@claude-canvas
```

### Manual Installation

```bash
cd claude-canvas-windows
bun install
```

## Usage

```bash
# Show calendar in current terminal
bun run src/cli.ts show calendar

# Spawn calendar in split pane
bun run src/cli.ts spawn calendar --config '{"events": [...]}'

# Spawn document editor
bun run src/cli.ts spawn document --scenario edit --config '{"content": "# Hello"}'
```

## Commands

- `/canvas` - Interactive canvas spawning

## Skills

- `canvas` - Main skill with overview and IPC details
- `calendar` - Calendar display
- `document` - Markdown rendering
- `flight` - Flight comparison

## Requirements

- **Windows**: Windows Terminal (recommended), ConEmu, or PowerShell
- **Unix/Linux/macOS**: tmux
- **Bun** - Runtime for CLI commands
- **Terminal with mouse support** - For interactive scenarios

## License

MIT
