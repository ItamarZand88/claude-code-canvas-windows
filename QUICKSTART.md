# Quick Start Guide

## Installation

### Step 1: Install Bun

**Windows (PowerShell):**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**macOS/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

### Step 2: Install Dependencies

```bash
cd claude-canvas-windows
bun install
```

### Step 3: Test Your Environment

```bash
# Check terminal detection
bun run canvas/src/cli.ts env
```

**Expected output on Windows Terminal:**
```
Terminal Environment:
  Platform: win32
  Summary: Windows Terminal
  Windows Terminal: true
  ConEmu: false
  PowerShell: false
```

**Expected output on Unix with tmux:**
```
Terminal Environment:
  Platform: linux
  Summary: tmux
  In tmux: true
```

## Testing

### Test 1: Show Canvas in Current Terminal

```bash
# Calendar
bun run canvas/src/cli.ts show calendar

# Document
bun run canvas/src/cli.ts show document --config '{"content":"# Hello World\n\nThis is a test document."}'

# Flight
bun run canvas/src/cli.ts show flight --config '{"flights":[{"id":"1","airline":"Test Air","flightNumber":"TA 100","origin":{"code":"SFO","city":"San Francisco"},"destination":{"code":"LAX","city":"Los Angeles"},"departureTime":"2026-01-27T10:00:00","arrivalTime":"2026-01-27T11:30:00","price":9900,"currency":"USD"}]}'
```

Controls:
- Press `q` or `Esc` to quit
- Use arrow keys to navigate

### Test 2: Spawn Canvas in Split Pane

**On Windows Terminal:**

```bash
# Simple calendar
bun run canvas/src/cli.ts spawn calendar

# Calendar with events
bun run canvas/src/cli.ts spawn calendar --config '{
  "title": "My Schedule",
  "events": [
    {
      "id": "1",
      "title": "Team Meeting",
      "startTime": "2026-01-27T14:00:00",
      "endTime": "2026-01-27T15:00:00",
      "color": "blue"
    },
    {
      "id": "2",
      "title": "Code Review",
      "startTime": "2026-01-27T16:00:00",
      "endTime": "2026-01-27T17:00:00",
      "color": "green"
    }
  ]
}'

# Document
bun run canvas/src/cli.ts spawn document --config '{
  "title": "Project Notes",
  "content": "# Project Notes\n\n## Tasks\n- Setup environment\n- Test canvases\n- Deploy\n\n## Notes\nEverything is working!"
}'
```

**On Unix with tmux:**

First start a tmux session:
```bash
tmux
```

Then run the same spawn commands:
```bash
bun run canvas/src/cli.ts spawn calendar
```

## Troubleshooting

### "Failed to spawn canvas - no supported terminal found"

**Windows:**
- Ensure you're running in Windows Terminal (recommended)
- Or use ConEmu
- Update Windows Terminal to latest version

**Unix/Linux:**
- Install tmux: `sudo apt install tmux` or `brew install tmux`
- Start a tmux session: `tmux`

### "Cannot find module"

```bash
# Reinstall dependencies
cd claude-canvas-windows
bun install
```

### Named Pipe Connection Errors (Windows)

Clean up stale files:
```powershell
del $env:TEMP\canvas-*.json
del $env:TEMP\claude-canvas-pane-id.txt
```

### Unix Socket Connection Errors

Clean up stale files:
```bash
rm /tmp/canvas-*.sock
rm /tmp/claude-canvas-pane-id
```

## Using with Claude Code

### Option 1: Add as Local Plugin

```bash
# In Claude Code
/plugin marketplace add file:///path/to/claude-canvas-windows
/plugin install canvas@claude-canvas
```

### Option 2: Test Directly

You can test canvases directly from the command line before integrating with Claude Code.

## Example Configurations

### Calendar with Multiple Events

```json
{
  "title": "Weekly Schedule",
  "events": [
    {
      "id": "1",
      "title": "Standup",
      "startTime": "2026-01-27T09:00:00",
      "endTime": "2026-01-27T09:30:00",
      "color": "cyan"
    },
    {
      "id": "2",
      "title": "Design Review",
      "startTime": "2026-01-27T11:00:00",
      "endTime": "2026-01-27T12:00:00",
      "color": "blue"
    },
    {
      "id": "3",
      "title": "Lunch",
      "startTime": "2026-01-27T12:00:00",
      "endTime": "2026-01-27T13:00:00",
      "color": "green"
    }
  ]
}
```

### Document with Markdown

```json
{
  "title": "Meeting Notes",
  "content": "# Q1 Planning Meeting\n\n## Attendees\n- Alice (Product)\n- Bob (Engineering)\n- Carol (Design)\n\n## Agenda\n1. Review Q4 results\n2. Set Q1 goals\n3. Resource allocation\n\n## Action Items\n- **Alice**: Draft product roadmap\n- **Bob**: Estimate engineering capacity\n- **Carol**: Create design mockups\n\n## Next Steps\nFollow-up meeting next Tuesday at 2pm."
}
```

### Flight Comparison

```json
{
  "title": "SF to Denver Flights",
  "flights": [
    {
      "id": "ua123",
      "airline": "United Airlines",
      "flightNumber": "UA 123",
      "origin": {"code": "SFO", "city": "San Francisco"},
      "destination": {"code": "DEN", "city": "Denver"},
      "departureTime": "2026-01-27T08:00:00",
      "arrivalTime": "2026-01-27T11:45:00",
      "price": 29900,
      "currency": "USD"
    },
    {
      "id": "ua456",
      "airline": "United Airlines",
      "flightNumber": "UA 456",
      "origin": {"code": "SFO", "city": "San Francisco"},
      "destination": {"code": "DEN", "city": "Denver"},
      "departureTime": "2026-01-27T14:30:00",
      "arrivalTime": "2026-01-27T18:15:00",
      "price": 24900,
      "currency": "USD"
    }
  ]
}
```

## Verification Checklist

- [ ] Bun is installed and in PATH
- [ ] Dependencies are installed (`bun install`)
- [ ] Terminal detection works (`bun run canvas/src/cli.ts env`)
- [ ] Calendar shows in current terminal
- [ ] Document shows in current terminal
- [ ] Flight shows in current terminal
- [ ] Canvas spawns in split pane (Windows Terminal or tmux)
- [ ] Keyboard controls work (arrow keys, q to quit)

## Success!

If all tests pass, you have a working cross-platform canvas implementation!

Next steps:
1. Read the main [README.md](README.md) for architecture details
2. Explore the [canvas/skills](canvas/skills) directory for usage examples
3. Integrate with Claude Code using the plugin marketplace
4. Ask Claude to spawn canvases for you!

## Support

For issues:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Verify you're using a supported terminal
3. Ensure Bun is installed correctly
4. Check that dependencies are installed

## What's Different from Original?

This Windows port maintains 100% compatibility with the original claude-canvas while adding:

✓ Windows Terminal support with split panes  
✓ ConEmu support with GuiMacro  
✓ PowerShell fallback  
✓ Named Pipe IPC for Windows  
✓ Automatic platform detection  
✓ Cross-platform compatibility  

All canvas components work identically on both Windows and Unix systems!
