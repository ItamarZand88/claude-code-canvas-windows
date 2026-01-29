---
name: canvas
description: |
  **The primary skill for terminal TUI components.** Covers spawning, controlling, and interacting with terminal canvases.
  Use when displaying calendars, documents, or flight bookings.
---

# Canvas TUI Toolkit

**Start here when using terminal canvases.** This skill covers the overall workflow, canvas types, and IPC communication.

## Example Prompts

Try asking Claude things like:

**Calendar:**
- "Schedule a meeting with the team next week"
- "Find a time when Alice and Bob are both free"

**Document:**
- "Draft an email to the sales team about the new feature"
- "Help me edit this document"

**Flight:**
- "Find flights from SFO to Denver next Friday"
- "Book me a window seat on the morning flight"

## Overview

Canvas provides interactive terminal displays (TUIs) that Claude can spawn and control. Each canvas type supports multiple scenarios for different interaction modes.

## Available Canvas Types

| Canvas | Purpose | Scenarios |
|--------|---------|-----------|
| `calendar` | Display calendars, pick meeting times | `display` |
| `document` | View/edit markdown documents | `display`, `edit` |
| `flight` | Flight comparison and seat selection | `booking` |

## Quick Start

```bash
cd ${CLAUDE_PLUGIN_ROOT}

# Run canvas in current terminal
bun run src/cli.ts show calendar

# Spawn canvas in new split pane
bun run src/cli.ts spawn calendar --config '{...}'
```

## Spawning Canvases

**Always use `spawn` for interactive scenarios** - this opens the canvas in a split pane while keeping the conversation terminal available.

```bash
bun run src/cli.ts spawn [kind] --scenario [name] --config '[json]'
```

**Parameters:**
- `kind`: Canvas type (calendar, document, flight)
- `--scenario`: Interaction mode (e.g., display, edit)
- `--config`: JSON configuration for the canvas
- `--id`: Optional canvas instance ID for IPC

## IPC Communication

Interactive canvases communicate via Named Pipes (Windows) or Unix Sockets (Unix).

**Canvas → Controller:**
```typescript
{ type: "ready", scenario }        // Canvas is ready
{ type: "selected", data }         // User made a selection
{ type: "cancelled", reason? }     // User cancelled
{ type: "error", message }         // Error occurred
```

**Controller → Canvas:**
```typescript
{ type: "update", config }  // Update canvas configuration
{ type: "close" }           // Request canvas to close
{ type: "ping" }            // Health check
```

## High-Level API

For programmatic use, import the API module:

```typescript
import { spawnCanvasWithIPC } from "${CLAUDE_PLUGIN_ROOT}/src/api";

const result = await spawnCanvasWithIPC("calendar", "display", {
  events: [...]
});

if (result.success && result.data) {
  console.log(`Selected: ${result.data.startTime}`);
}
```

## Requirements

- **Windows**: Windows Terminal (recommended), ConEmu, or PowerShell
- **Unix/Linux/macOS**: tmux
- **Terminal with mouse support**: For click-based interactions
- **Bun**: Runtime for executing canvas commands

## Skills Reference

| Skill | Purpose |
|-------|---------|
| `calendar` | Calendar display details |
| `document` | Document rendering details |
| `flight` | Flight comparison details |
