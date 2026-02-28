# Time Chime

A minimal macOS menu bar app that plays a gong chime at a chosen minute of every hour. Built with Electron, React, TypeScript, Vite, and Tailwind CSS.

## Features

- Pick any minute (00–59) to chime on the hour
- Synthesized gong sound using the Web Audio API
- Lives in the menu bar tray — close the window and it keeps running
- Remembers your chosen minute between sessions

## Development

```bash
bun install
bun run dev
```

## Build

```bash
bun run build
```

Produces a macOS `.dmg` in the `release/` directory.
