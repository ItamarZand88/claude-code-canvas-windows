# Setup Guide

This guide will help you complete the Windows implementation of Claude Canvas.

## What's Already Done

✅ Windows Terminal detection and split pane management  
✅ ConEmu support with GuiMacro  
✅ PowerShell fallback with new window spawning  
✅ Named Pipe IPC for Windows  
✅ Cross-platform routing (automatic platform detection)  
✅ CLI with all commands  
✅ Package configuration  

## What You Need to Add

The canvas components (Ink/React TUIs) are platform-independent and can be copied directly from the original project. You need to copy these directories:

### Required Files from Original Project

From the uploaded `dvdsgl-claude-canvas` archive, copy these directories to your `canvas/src/` folder:

```
canvas/src/
├── canvases/          # ← COPY THIS (Calendar, Document, Flight TUIs)
├── scenarios/         # ← COPY THIS (Scenario definitions)
└── api/              # ← COPY THIS (High-level API wrappers)
```

Also copy the skills and commands:

```
canvas/
├── skills/           # ← COPY THIS (Claude documentation)
├── commands/         # ← COPY THIS (User commands)
├── CLAUDE.md         # ← COPY THIS (Development guide)
└── README.md         # ← COPY THIS (Canvas plugin README)
```

### Files Already Created (Don't Overwrite)

❌ Don't overwrite these - they're Windows-specific:
- `canvas/src/terminal.ts` (platform router)
- `canvas/src/terminal-windows.ts` (Windows implementation)
- `canvas/src/ipc/index.ts` (platform router)
- `canvas/src/ipc/types.ts` (cross-platform socket paths)
- `canvas/src/ipc/server-windows.ts` (Named Pipe server)
- `canvas/src/ipc/client-windows.ts` (Named Pipe client)
- `canvas/src/cli.ts` (cross-platform CLI)
- `canvas/run-canvas.bat` (Windows launcher)
- `canvas/package.json`

### Quick Copy Script

If you have the original project extracted, run:

```bash
# From the original dvdsgl-claude-canvas directory
ORIGINAL=/path/to/dvdsgl-claude-canvas
TARGET=/path/to/claude-canvas-windows

# Copy canvas components
cp -r $ORIGINAL/canvas/src/canvases $TARGET/canvas/src/
cp -r $ORIGINAL/canvas/src/scenarios $TARGET/canvas/src/
cp -r $ORIGINAL/canvas/src/api $TARGET/canvas/src/

# Copy skills and commands
cp -r $ORIGINAL/canvas/skills $TARGET/canvas/
cp -r $ORIGINAL/canvas/commands $TARGET/canvas/

# Copy documentation
cp $ORIGINAL/canvas/CLAUDE.md $TARGET/canvas/
cp $ORIGINAL/canvas/README.md $TARGET/canvas/
cp $ORIGINAL/LICENSE $TARGET/
cp $ORIGINAL/CLAUDE.md $TARGET/
```

### For Windows (PowerShell)

```powershell
# From the original dvdsgl-claude-canvas directory
$ORIGINAL = "C:\path\to\dvdsgl-claude-canvas"
$TARGET = "C:\path\to\claude-canvas-windows"

# Copy canvas components
Copy-Item -Recurse "$ORIGINAL\canvas\src\canvases" "$TARGET\canvas\src\"
Copy-Item -Recurse "$ORIGINAL\canvas\src\scenarios" "$TARGET\canvas\src\"
Copy-Item -Recurse "$ORIGINAL\canvas\src\api" "$TARGET\canvas\src\"

# Copy skills and commands
Copy-Item -Recurse "$ORIGINAL\canvas\skills" "$TARGET\canvas\"
Copy-Item -Recurse "$ORIGINAL\canvas\commands" "$TARGET\canvas\"

# Copy documentation
Copy-Item "$ORIGINAL\canvas\CLAUDE.md" "$TARGET\canvas\"
Copy-Item "$ORIGINAL\canvas\README.md" "$TARGET\canvas\"
Copy-Item "$ORIGINAL\LICENSE" "$TARGET\"
Copy-Item "$ORIGINAL\CLAUDE.md" "$TARGET\"
```

## Installation Steps

### 1. Install Dependencies

```bash
cd claude-canvas-windows
bun install
```

### 2. Test the Environment

```bash
# Check terminal detection
bun run env
```

**Expected output on Windows:**
```
Terminal Environment:
  Platform: win32
  Summary: Windows Terminal
  Windows Terminal: true
  ConEmu: false
  PowerShell: false
```

### 3. Test Canvas in Current Terminal

```bash
# This should work even without split pane support
bun run canvas/src/cli.ts show calendar
```

### 4. Test Split Pane Spawning

Make sure you're in Windows Terminal or tmux, then:

```bash
bun run canvas/src/cli.ts spawn calendar
```

You should see a new pane appear with a calendar!

### 5. Test with Claude Code

Add as a plugin:

```bash
# In Claude Code
/plugin marketplace add /path/to/claude-canvas-windows
/plugin install canvas@claude-canvas
```

Then ask Claude:

> "Can you show me my calendar for this week?"

## Verification Checklist

After setup, verify everything works:

- [ ] `bun run env` shows correct terminal detection
- [ ] `bun run show calendar` displays in current terminal
- [ ] `bun run spawn calendar` creates split pane
- [ ] Calendar responds to keyboard input (arrows, q to quit)
- [ ] `bun run spawn document --scenario edit` allows text selection
- [ ] `bun run spawn flight` shows flight booking UI
- [ ] Claude Code can spawn canvases via `/canvas` command

## Troubleshooting

### "Module not found" errors

You're missing the canvas components. Copy them from the original project as described above.

### "Bun command not found"

Install Bun:

**Windows:**
```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

**macOS/Linux:**
```bash
curl -fsSL https://bun.sh/install | bash
```

### Windows Terminal doesn't split

1. Update Windows Terminal to latest version
2. Try manually: `wt.exe sp -H` to test
3. Check Windows Terminal settings - ensure panes are enabled

### IPC connection errors

Clean up stale pipes:

**Windows:**
```powershell
del $env:TEMP\canvas-*.json
del $env:TEMP\claude-canvas-pane-id.txt
```

**Unix:**
```bash
rm /tmp/canvas-*.sock
rm /tmp/claude-canvas-pane-id
```

## Next Steps

1. **Test All Canvases** - Verify calendar, document, and flight all work
2. **Update Skills** - If needed, adjust paths in skills/*.md files for Windows
3. **Contribute** - Submit improvements back to the project
4. **Share** - Help other Windows users by documenting your experience

## Support

- Create an issue on GitHub for bugs
- Check existing issues for solutions
- Join the Claude Code community

---

**Ready to use Claude Canvas on Windows!** 🎉
