# TCS Prototype

Prototype interface for the Thrift Core System member, organization, and internal reviewer journeys. The project is a frontend-only React prototype with in-memory state and static sample data.

## Technology Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- npm

## Requirements

- Node.js 22 or newer is recommended.
- npm is required for installing dependencies and running scripts.

## Installation

```bash
npm install
```

## Running Locally

```bash
npm run dev
```

The Vite development server uses port `8443` by default. Set `PORT` to override it:

```bash
PORT=3000 npm run dev
```

## Production Build

```bash
npm run build
```

The production assets are generated in `dist/`.

## Folder Overview

- `src/App.tsx` - Main view state and navigation wiring.
- `src/main.tsx` - React entry point.
- `src/index.css` - Global styles and Tailwind import.
- `src/components/` - Shared UI and feature screens.
- `src/components/thrift/` - Member thrift and contribution screens.
- `src/components/org/` - Organization owner and internal organization review screens.
- `index.html` - Vite HTML shell.
- `vite.config.ts` - Vite, React, Tailwind, and local server configuration.
