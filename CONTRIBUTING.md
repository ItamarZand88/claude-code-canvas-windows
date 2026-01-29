# Contributing to Claude Canvas Windows

Thank you for considering contributing to Claude Canvas Windows! This document provides guidelines and instructions for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Coding Standards](#coding-standards)

## Code of Conduct

Be kind, respectful, and constructive. We're all here to build something useful together.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0.0 or higher
- **Windows**: Windows Terminal (recommended), ConEmu, or PowerShell
- **Unix/Linux/macOS**: tmux
- Git

### Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/claude-canvas-windows.git
cd claude-canvas-windows
bun install
```

## Development Setup

### Windows

1. Install [Bun](https://bun.sh):
   ```powershell
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```

2. Install [Windows Terminal](https://apps.microsoft.com/detail/9N0DX20HK701) (recommended)

3. Clone and setup:
   ```bash
   git clone https://github.com/YOUR_USERNAME/claude-canvas-windows.git
   cd claude-canvas-windows
   bun install
   ```

4. Test environment:
   ```bash
   bun run canvas/src/cli.ts env
   ```

### Unix/Linux/macOS

1. Install Bun:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. Install tmux:
   ```bash
   # macOS
   brew install tmux

   # Ubuntu/Debian
   sudo apt install tmux

   # Fedora
   sudo dnf install tmux
   ```

3. Clone and setup:
   ```bash
   git clone https://github.com/YOUR_USERNAME/claude-canvas-windows.git
   cd claude-canvas-windows
   bun install
   ```

4. Start tmux and test:
   ```bash
   tmux
   bun run canvas/src/cli.ts env
   ```

## Project Structure

```
claude-canvas-windows/
├── canvas/src/
│   ├── cli.ts               # CLI entry point
│   ├── terminal.ts          # Platform routing
│   ├── terminal-windows.ts  # Windows implementation
│   ├── canvases/            # Canvas components (Ink/React)
│   ├── ipc/                 # IPC system
│   ├── scenarios/           # Scenario definitions
│   └── api/                 # High-level API
├── examples/                # Example configurations
├── scripts/                 # Helper scripts
└── canvas/skills/           # Claude documentation
```

## Making Changes

### Creating a New Canvas Type

1. Create component in `canvas/src/canvases/`:
   ```typescript
   // canvas/src/canvases/my-canvas.tsx
   import React from "react";
   import { Box, Text } from "ink";

   export function MyCanvas({ id, config }) {
     return (
       <Box>
         <Text>My Canvas</Text>
       </Box>
     );
   }
   ```

2. Add types if needed:
   ```typescript
   // canvas/src/canvases/my-canvas/types.ts
   export interface MyCanvasConfig {
     title: string;
     // ... other config
   }
   ```

3. Register in `canvas/src/canvases/index.tsx`

4. Create skill documentation in `canvas/skills/my-canvas/SKILL.md`

5. Add example config in `examples/my-canvas-config.json`

### Improving Terminal Detection

Edit `canvas/src/terminal-windows.ts` or `canvas/src/terminal.ts` depending on which platform you're targeting.

For Windows Terminal features:
- Use `wt.exe` command-line interface
- Check `process.env.WT_SESSION` for detection
- Test split pane functionality thoroughly

For tmux features:
- Use `tmux` command-line interface
- Check `process.env.TMUX` for detection
- Test pane reuse and split functionality

### Enhancing IPC

The IPC system is split between Windows (Named Pipes) and Unix (Domain Sockets):

**Windows**: Edit `canvas/src/ipc/server-windows.ts` and `canvas/src/ipc/client-windows.ts`

**Unix**: Edit `canvas/src/ipc/server.ts` and `canvas/src/ipc/client.ts`

Both must maintain the same message interface defined in `canvas/src/ipc/types.ts`.

## Testing

### Run All Tests

```bash
bun test
```

### Test Individual Components

```bash
# Test terminal detection
bun run canvas/src/cli.ts env

# Test canvas in current terminal
bun run canvas/src/cli.ts show calendar

# Test canvas spawning (requires Windows Terminal or tmux)
bun run canvas/src/cli.ts spawn calendar
```

### Test Helper Scripts

**Windows:**
```powershell
.\scripts\canvas.ps1 test
.\scripts\canvas.ps1 example calendar
```

**Unix:**
```bash
./scripts/canvas.sh test
./scripts/canvas.sh example calendar
```

### Manual Testing Checklist

- [ ] Terminal detection works correctly
- [ ] Canvas displays in current terminal
- [ ] Canvas spawns in split pane
- [ ] Keyboard controls work (arrows, q to quit)
- [ ] IPC communication works
- [ ] Multiple canvases can run simultaneously
- [ ] Canvases close properly
- [ ] No leftover processes or files

## Submitting Changes

### Commit Messages

Use clear, descriptive commit messages:

```
Add ConEmu split pane support

- Implement GuiMacro-based splits
- Add ConEmu detection
- Update documentation
```

Format: `<type>: <description>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

### Pull Request Process

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

3. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a Pull Request on GitHub with:
   - Clear description of changes
   - Screenshots/GIFs if UI-related
   - Test results on your platform
   - Reference any related issues

5. Wait for review and address feedback

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Provide proper type annotations
- Avoid `any` types

### Formatting

- 2 spaces for indentation
- Double quotes for strings
- Semicolons optional but consistent
- Bun handles formatting automatically

### React/Ink Components

- Use functional components
- Use hooks (useState, useEffect, useInput)
- Keep components small and focused
- Extract reusable logic into custom hooks

### Platform-Specific Code

When writing platform-specific code:

```typescript
if (process.platform === "win32") {
  // Windows implementation
} else {
  // Unix implementation
}
```

Always test on both platforms if possible.

### Documentation

- Update README.md for user-facing changes
- Update skills/SKILL.md for canvas changes
- Add JSDoc comments for public APIs
- Include examples in documentation

## Areas for Contribution

### High Priority

- [ ] Enhanced Windows Terminal integration
- [ ] Additional terminal support (Alacritty, Kitty)
- [ ] More canvas types (Charts, File Browser)
- [ ] Improved error handling and recovery
- [ ] Better test coverage

### Medium Priority

- [ ] Canvas themes and customization
- [ ] Advanced mouse support
- [ ] Performance optimizations
- [ ] Accessibility improvements
- [ ] Additional scenarios for existing canvases

### Low Priority

- [ ] Documentation improvements
- [ ] Example refinements
- [ ] Code cleanup and refactoring
- [ ] CI/CD enhancements

## Questions or Problems?

- Open an issue on GitHub
- Check existing issues for similar problems
- Provide detailed information:
  - OS and version
  - Terminal and version
  - Bun version
  - Steps to reproduce
  - Expected vs actual behavior

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to Claude Canvas Windows!** 🎉
