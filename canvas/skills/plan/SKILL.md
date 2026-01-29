# Plan Viewer Skill

Display Claude Code plan files in a split pane with real-time updates.

## Description

The plan viewer allows you to watch a markdown plan file and display it in a separate terminal pane. As the plan is written or updated, the display automatically refreshes to show the latest content.

## Usage

### Watch a Plan File

```bash
# Watch a plan file and display in split pane
bun run canvas/src/cli.ts watch-plan ~/.claude/plans/my-plan.md

# With custom title
bun run canvas/src/cli.ts watch-plan ~/.claude/plans/my-plan.md --title "Implementation Plan"

# Show in current terminal (no split pane)
bun run canvas/src/cli.ts watch-plan ~/.claude/plans/my-plan.md --no-spawn
```

### Integration with Claude Code Plan Mode

When Claude Code enters plan mode, it writes to a plan file (e.g., `~/.claude/plans/<plan-name>.md`). You can watch this file to see the plan as it's being written:

```bash
# Watch the current plan file
bun run canvas/src/cli.ts watch-plan "C:\Users\YourName\.claude\plans\current-plan.md"
```

## Features

- **Live Updates**: Content refreshes automatically when the file changes
- **Split Pane**: Opens in a separate pane (Windows Terminal, tmux)
- **Scroll Controls**: Navigate long plans with arrow keys
- **Auto-scroll**: Stays at bottom when new content is added (if already at bottom)
- **Markdown Highlighting**: Headers, lists, and bold text are highlighted

## Controls

| Key | Action |
|-----|--------|
| `↑` / `↓` | Scroll up/down |
| `Page Up` / `Page Down` | Scroll by page |
| `g` | Go to top |
| `G` | Go to bottom |
| `q` / `Esc` | Close canvas |

## Configuration

The plan viewer accepts these options:

| Option | Default | Description |
|--------|---------|-------------|
| `--title` | "Plan" | Title shown in the canvas header |
| `--no-spawn` | false | Show in current terminal instead of split pane |

## Example

```bash
# Start watching a plan file
bun run canvas/src/cli.ts watch-plan ./my-plan.md --title "Feature Plan"

# In another terminal, append to the file
echo "## New Section" >> ./my-plan.md
echo "- Task 1" >> ./my-plan.md
echo "- Task 2" >> ./my-plan.md

# The canvas will automatically update to show the new content
```

## Architecture

```
┌─────────────────────┐     writes     ┌──────────────┐
│  Claude Code        │ ─────────────> │  Plan File   │
│  (Plan Mode)        │                │  (.md)       │
└─────────────────────┘                └──────────────┘
                                              │
                                              │ watches
                                              ▼
┌─────────────────────┐     IPC        ┌──────────────┐
│  watch-plan CLI     │ ─────────────> │  Document    │
│  (Controller)       │    update      │  Canvas      │
└─────────────────────┘                └──────────────┘
```

## Troubleshooting

### Canvas doesn't spawn

- Ensure you're running in Windows Terminal, ConEmu, or a tmux session
- Check with `bun run canvas/src/cli.ts env` to see your terminal environment

### Updates not showing

- The file watcher debounces changes (100ms) to avoid excessive updates
- Ensure the file is being saved (not just buffered)
- Check the controller terminal for "File updated" messages

### Connection issues

- The canvas shows "[connecting...]" until IPC is established
- Once connected, it shows "[live]" indicator
- If connection fails, the canvas still shows the initial content
