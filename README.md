# Claude Canvas for Windows

A cross-platform TUI toolkit that gives Claude Code its own display. Spawn interactive terminal interfaces for emails, calendars, flight bookings, and more on Windows Terminal, ConEmu, PowerShell, tmux, and other terminals.

![Windows Terminal Support](https://img.shields.io/badge/Windows%20Terminal-Supported-brightgreen)
![ConEmu Support](https://img.shields.io/badge/ConEmu-Supported-brightgreen)
![PowerShell Support](https://img.shields.io/badge/PowerShell-Supported-yellow)
![tmux Support](https://img.shields.io/badge/tmux-Supported-brightgreen)

**Note:** This is a Windows-compatible fork of the original [dvdsgl/claude-canvas](https://github.com/dvdsgl/claude-canvas) with full cross-platform support.

## Features

- ✅ **Windows Terminal** - Primary target, uses split panes
- ✅ **ConEmu** - Full support with GuiMacro splits
- ✅ **PowerShell** - Fallback with new window spawning
- ✅ **tmux** - Original Unix/Linux/macOS support maintained
- 🎨 **Interactive Canvases** - Calendar, Document Editor, Flight Booking UI
- 🔄 **Real-time IPC** - Bidirectional communication using Named Pipes (Windows) or Unix Sockets (Unix)
- 📦 **Claude Code Plugin** - Seamless integration with Claude Code

## Requirements

### Windows
- [Bun](https://bun.sh) v1.0.0 or higher
- **Windows Terminal** (recommended) or **ConEmu** or **PowerShell**
- Windows 10/11

### Unix/Linux/macOS
- [Bun](https://bun.sh) v1.0.0 or higher
- [tmux](https://github.com/tmux/tmux)

## Installation

### Option 1: Claude Code Plugin Marketplace

```bash
# Add this repository as a marketplace in Claude Code
/plugin marketplace add YourGitHubUsername/claude-canvas-windows

# Install the canvas plugin
/plugin install canvas@claude-canvas
```

### Option 2: Manual Installation

```bash
# Clone the repository
git clone https://github.com/YourGitHubUsername/claude-canvas-windows.git
cd claude-canvas-windows

# Install dependencies
bun install

# Test the environment
bun run env
```

## Quick Start

### Check Your Environment

```bash
# See what terminal you're running in
bun run env
```

**Output on Windows Terminal:**
```
Terminal Environment:
  Platform: win32
  Summary: Windows Terminal
  Windows Terminal: true
  ConEmu: false
  PowerShell: false
```

### Test a Canvas

```bash
# Show a calendar in the current terminal
bun run canvas/src/cli.ts show calendar

# Spawn a calendar in a split pane (Windows Terminal/tmux)
bun run canvas/src/cli.ts spawn calendar --config '{"events": [{"id":"1","title":"Team Meeting","startTime":"2026-01-27T14:00:00","endTime":"2026-01-27T15:00:00"}]}'
```

## Available Canvases

### Calendar
Display events or pick meeting times interactively.

```bash
# Simple calendar view
bun run spawn calendar

# Meeting picker with multiple calendars
bun run spawn calendar --scenario meeting-picker --config '{
  "calendars": [
    {
      "name": "Alice",
      "color": "blue",
      "events": [...]
    },
    {
      "name": "Bob",
      "color": "green",
      "events": [...]
    }
  ],
  "slotGranularity": 30
}'
```

**Controls:**
- `←/→` - Navigate weeks
- `t` - Jump to today
- `Click` - Select time slot (meeting picker mode)
- `q` or `Esc` - Quit

### Document
View or edit markdown documents with syntax highlighting.

```bash
# Display markdown document
bun run spawn document --config '{
  "title": "My Document",
  "content": "# Hello World\n\nThis is **markdown**."
}'

# Edit mode with text selection
bun run spawn document --scenario edit --config '{
  "content": "# Draft\n\nEdit this content...",
  "readOnly": false
}'
```

**Controls:**
- `Click and drag` - Select text (edit mode)
- `Type` - Edit content (edit mode)
- `↑/↓` - Scroll
- `q` or `Esc` - Quit

### Flight Booking
Cyberpunk-themed flight comparison and seat selection.

```bash
bun run spawn flight --config '{
  "flights": [
    {
      "id": "ua123",
      "airline": "United Airlines",
      "flightNumber": "UA 123",
      "origin": {"code": "SFO", "name": "San Francisco", "city": "San Francisco", "timezone": "PST"},
      "destination": {"code": "DEN", "name": "Denver", "city": "Denver", "timezone": "MST"},
      "departureTime": "2026-01-27T12:55:00-08:00",
      "arrivalTime": "2026-01-27T16:37:00-07:00",
      "duration": 162,
      "price": 34500,
      "currency": "USD",
      "cabinClass": "economy",
      "stops": 0
    }
  ]
}'
```

**Controls:**
- `↑/↓` - Navigate flights
- `Tab` - Switch between flight list and seatmap
- `Arrows` - Navigate seatmap
- `Space` - Select seat
- `Enter` - Confirm selection
- `q` or `Esc` - Cancel

## Architecture

### Terminal Detection & Spawning

The system automatically detects your terminal and uses the appropriate split mechanism:

| Terminal | Detection | Split Method |
|----------|-----------|--------------|
| Windows Terminal | `WT_SESSION` env var | `wt.exe sp -H -s 0.67` |
| ConEmu | `ConEmuPID` env var | `ConEmuC -GuiMacro Split(0,67)` |
| PowerShell | Fallback | `Start-Process powershell` |
| tmux | `TMUX` env var | `tmux split-window -h -p 67` |

### IPC Communication

**Windows:** Uses Named Pipes (`\\.\pipe\canvas-{id}`)
**Unix:** Uses Unix Domain Sockets (`/tmp/canvas-{id}.sock`)

The IPC system is completely transparent - the same API works on all platforms.

```typescript
// Messages: Canvas ← → Controller
Ready → Started
Update ← Send new config
Selected → User made selection
Cancelled → User cancelled
```

### File Structure

```
claude-canvas-windows/
├── canvas/
│   ├── src/
│   │   ├── cli.ts                    # CLI entry point (cross-platform)
│   │   ├── terminal.ts               # Platform detection & routing
│   │   ├── terminal-windows.ts       # Windows Terminal implementation
│   │   ├── ipc/
│   │   │   ├── types.ts              # IPC message types
│   │   │   ├── index.ts              # Platform routing
│   │   │   ├── server-windows.ts     # Named Pipe server
│   │   │   ├── client-windows.ts     # Named Pipe client
│   │   │   ├── server.ts             # Unix socket server
│   │   │   └── client.ts             # Unix socket client
│   │   ├── canvases/                 # Ink/React TUI components
│   │   │   ├── calendar.tsx
│   │   │   ├── document.tsx
│   │   │   └── flight.tsx
│   │   └── api/                      # High-level API
│   ├── skills/                       # Claude Code documentation
│   ├── commands/                     # User commands
│   ├── run-canvas.bat                # Windows launcher
│   └── run-canvas.sh                 # Unix launcher
└── README.md
```

## Troubleshooting

### "Failed to spawn canvas - no supported terminal found"

**Windows:**
- Install [Windows Terminal](https://apps.microsoft.com/detail/9N0DX20HK701) (recommended)
- Or use [ConEmu](https://conemu.github.io/)
- Ensure you're running from within the terminal (not cmd.exe directly)

**Unix:**
- Ensure tmux is installed: `sudo apt install tmux` or `brew install tmux`
- Start a tmux session: `tmux`

### Named Pipe Connection Errors (Windows)

If you see "Failed to connect to controller":

1. Check if another canvas is already running with the same ID
2. Clean up stale pipes: Delete files in `%TEMP%\canvas-*.json`
3. Try a different canvas ID: `--id test-123`

### Split Pane Not Appearing

**Windows Terminal:**
- Update to the latest version
- Check that panes are enabled in settings
- Try manually: `wt.exe sp -H` to test splits

**ConEmu:**
- Verify GuiMacro is enabled in settings
- Try manually: `ConEmuC -GuiMacro:0 Split(0,50,"cmd")`

### Permission Errors

Windows may block execution of batch files:
```powershell
# Allow script execution (run as Administrator)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Development

### Project Structure

```typescript
// Add a new canvas type
canvas/src/canvases/my-canvas.tsx    // Ink/React component
canvas/skills/my-canvas/SKILL.md     // Claude documentation

// Register in canvases/index.tsx
export async function renderMyCanvas(...) { ... }
```

### Testing

```bash
# Test terminal detection
bun run env

# Test canvas spawning
bun run spawn calendar --id test-1

# Test IPC communication
bun run update test-1 --config '{"title":"Updated"}'
bun run selection test-1
```

### Building for Distribution

```bash
# Install dependencies
bun install

# Run tests
cd canvas && bun test

# Build (Bun handles TypeScript automatically)
# No build step needed - Bun runs .ts files directly
```

## Differences from Original

This fork maintains 100% compatibility with the original `dvdsgl/claude-canvas` while adding Windows support:

| Feature | Original | This Fork |
|---------|----------|-----------|
| **Terminals** | tmux only | Windows Terminal, ConEmu, PowerShell, tmux |
| **IPC** | Unix sockets | Named Pipes (Windows) + Unix sockets |
| **Platform** | macOS/Linux | Windows, macOS, Linux |
| **Canvases** | Calendar, Document, Flight | Same (100% compatible) |
| **API** | Same | Same |

## Contributing

Contributions welcome! Areas of interest:

- Additional terminal support (Alacritty, Kitty for Windows)
- More canvas types (Email, Dashboard, Charts)
- Improved Windows Terminal pane management
- Better error handling and recovery

## License

MIT License - See [LICENSE](LICENSE) file

## Credits

Original project by [David Siegel](https://github.com/dvdsgl) - [dvdsgl/claude-canvas](https://github.com/dvdsgl/claude-canvas)

Windows port and cross-platform support by [Your Name]

## Related Projects

- [Claude Code](https://claude.ai/code) - Anthropic's agentic coding assistant
- [Ink](https://github.com/vadimdemedes/ink) - React for CLIs
- [Bun](https://bun.sh) - Fast JavaScript runtime

---

**Made with ❤️ for the Claude Code community**
