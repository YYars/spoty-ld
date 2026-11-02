# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Always invoke the `pstack:poteto-mode` skill at the start of every session, before any other work.**

## Project

Spoty-LD analyzes weekly Spotify playlist changes and generates Instagram-ready graphics via a Figma plugin. Two separate TypeScript codebases share types but build independently.

## Commands

### Main Application (root)
```bash
npm run analyze          # Run the analyzer (fetches Spotify data, outputs JSON)
npm run build            # Compile TypeScript
npm run typecheck        # Type check without emitting
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format
npm run format:check     # Prettier check
npm run check:all        # All checks: typecheck + lint + format:check
```

### Figma Plugin (figma-plugin/)
```bash
cd figma-plugin
bun run build            # Lint + compile (Bun bundler, ES2015 target)
bun run watch            # Watch mode
bun run lint             # ESLint check
```

## Architecture

**Main app** (`src/`): Pipeline that fetches playlist → separates tracks by week → runs analyzers → writes JSON to `data/history/YYYY-MM-DD.json`.

- `index.ts` — orchestrator entry point
- `spotify/client.ts` — Spotify API client factory (uses legacy endpoints for audio features)
- `analyzers/` — pure analysis functions (stats, genres, graphics, discovery-score, artist-diversity)
- `output/writer.ts` — JSON file output and console summary
- `effects/logger.ts` — injectable logging interface
- `utils/` — functional helpers (week separation, track converters, FP utilities)

**Figma plugin** (`figma-plugin/src/`): Reads analysis JSON, generates Instagram Story frames (1080x1920) in Figma.

- `code.ts` — plugin main logic, frame generation
- `constants.ts` — design specs (colors, spacing, fonts)
- `frame-builders.ts` — frame creation functions
- `types.ts` — must stay in sync with `src/spotify/types.ts`

## Key Conventions

- **Functional style**: pure functions, readonly types, immutable data, `reduce`/`map`/`filter` over loops
- **Strict TypeScript**: all strict checks enabled, prefix unused vars with `_`
- **ESLint rules**: prefer `const`, always `===`, no floating promises, use `?.` and `??`
- **Figma plugin sandbox constraints**: no spread syntax (`{...obj}` → `Object.assign()`), no optional catch binding (`catch {}` → `catch (_e) {}`)

## Environment

Requires `.env` with `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_PLAYLIST_ID`. See `.env.example`.
