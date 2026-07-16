# TCS Prototype

React + Vite + Tailwind CSS prototype for the Thrift Core System.

## Development Server

Run the app with `npm run dev`. The Vite development server uses port `8443` by default and also honors the `PORT` environment variable.

## Key Files

- `src/App.tsx` - Main application component.
- `src/main.tsx` - React entry point.
- `src/index.css` - Global styles and Tailwind CSS import.
- `package.json` - Dependencies and scripts.
- `vite.config.ts` - Vite configuration.
- `README.md` - Setup and project overview.

## Styling

This project uses Tailwind CSS v4 for styling. Use Tailwind utility classes directly in JSX and keep visual changes aligned with the existing prototype.

## Development Notes

- Do not redesign the UI unless explicitly requested.
- Preserve the current prototype business flows and in-memory navigation unless the task asks to change them.
- Prefer npm for dependency management. Keep `package-lock.json` in sync and do not add another lockfile.
- Generated files such as `dist/`, logs, and local `.env` files should stay out of source control.
