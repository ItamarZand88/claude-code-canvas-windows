---
name: calendar
description: |
  Calendar canvas for displaying events.
  Use when showing calendar views.
---

# Calendar Canvas

Display calendar views with events.

## Example Prompts

Try asking Claude:

- "Show me my calendar for this week"
- "Schedule a meeting on Tuesday at 2pm"

## Scenarios

### `display` (default)
View-only calendar display.

```bash
bun run src/cli.ts show calendar --scenario display --config '{
  "title": "My Week",
  "events": [
    {"id": "1", "title": "Meeting", "startTime": "2026-01-27T09:00:00", "endTime": "2026-01-27T10:00:00"}
  ]
}'
```

## Configuration

```typescript
interface CalendarConfig {
  title?: string;
  events: CalendarEvent[];
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;  // ISO datetime
  endTime: string;    // ISO datetime
  color?: string;     // blue, green, red, yellow, magenta, cyan
}
```

## Controls

- `←/→` - Navigate weeks
- `n` - Next week
- `p` - Previous week
- `t`: Jump to today
- `q` or `Esc`: Quit
