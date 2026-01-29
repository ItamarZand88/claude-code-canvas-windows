---
name: document
description: |
  Document canvas for displaying and editing markdown content.
  Use when showing documents or when users need to edit text.
---

# Document Canvas

Display markdown documents with syntax highlighting.

## Example Prompts

Try asking Claude:

- "Draft an email to the marketing team"
- "Show me this document"
- "Help me edit this content"

## Scenarios

### `display` (default)
Read-only document view with markdown rendering.

```bash
bun run src/cli.ts show document --scenario display --config '{
  "content": "# Hello World\n\nThis is **markdown** content.",
  "title": "My Document"
}'
```

### `edit`
Interactive document view with text editing.

```bash
bun run src/cli.ts spawn document --scenario edit --config '{
  "content": "# My Document\n\nEdit this content...",
  "title": "Edit Mode",
  "readOnly": false
}'
```

## Configuration

```typescript
interface DocumentConfig {
  content: string;        // Markdown content
  title?: string;         // Document title
  readOnly?: boolean;     // Disable editing (default: false for edit)
}
```

## Markdown Support

- **Headers** (`# H1`, `## H2`, etc.)
- **Bold** (`**text**`)
- **Italic** (`*text*`)
- **Code** (`` `inline` `` and fenced blocks)

## Controls

- `↑/↓` - Scroll
- `PageUp/PageDown` - Page navigation
- `q` or `Esc` - Close
