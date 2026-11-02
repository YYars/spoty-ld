# Spoty-LD Agent Guide

## Project Overview

**Spoty-LD** is a Spotify playlist analytics platform that analyzes weekly playlist changes and generates Instagram-ready graphics via a Figma plugin.

### Core Purpose
- Track weekly playlist additions vs. previous weeks
- Analyze mood journey, genre diversity, and discovery metrics
- Generate graphics-ready JSON data for Instagram Stories
- Provide Figma plugin integration for direct design automation

### Tech Stack
- **Runtime**: Node.js with ES2022 modules, TypeScript 5.9
- **APIs**: Spotify Web API
- **Plugin**: Figma Plugin API, Bun bundler

---

## Project Structure

```
spoty-ld/
├── src/                           # Main analyzer application
│   ├── index.ts                   # Entry point, orchestrates analysis
│   ├── spotify/
│   │   ├── client.ts              # Spotify API client
│   │   └── types.ts               # Type definitions
│   ├── analyzers/
│   │   ├── stats.ts               # Weekly statistics
│   │   ├── genres.ts              # Genre grouping
│   │   └── graphics.ts            # Graphics-ready data
│   └── output/
│       └── writer.ts              # JSON output
│
├── figma-plugin/                  # Figma plugin
│   ├── src/
│   │   ├── code.ts                # Plugin logic (creates designs)
│   │   ├── types.ts               # Type definitions
│   │   └── ui.html                # Plugin UI
│   ├── manifest.json              # Figma config
│   ├── .oxlintrc.json             # Linting rules
│   ├── lint/figma-sandbox.js      # Custom Oxlint sandbox rules
│   └── dist/                      # Compiled output
│
├── data/history/                  # Weekly analysis JSON outputs
├── package.json
├── tsconfig.json
└── .env                           # Spotify credentials (gitignored)
```

---

## Build Commands

### Main Application
```bash
npm run analyze        # Run analyzer
npm run build          # Compile TypeScript
npm run typecheck      # Type check only (no emit)
npm run lint           # Check for linting errors
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format code with Prettier
npm run format:check   # Check formatting
npm run check:all      # Run all checks (type + lint + format)
npm run precommit      # Same as check:all (use before commits)
```

### Figma Plugin
```bash
cd figma-plugin
bun install        # Install dependencies
bun run build      # Lint + compile
bun run watch      # Watch mode
bun run lint       # Check code
```

---

## Environment Variables (.env)
```
SPOTIFY_CLIENT_ID=<your_id>
SPOTIFY_CLIENT_SECRET=<your_secret>
SPOTIFY_PLAYLIST_ID=<target_playlist_id>
```

---

## Application Flow

1. **Data Fetching**: Fetch playlist items from Spotify API
2. **Track Separation**: Split by `added_at` (this week vs last week)
3. **Analysis Pipeline**:
   - Stats Analysis → popularity, genres, diversity
   - Graphics Builder → format for Figma plugin
4. **Output**: Save JSON to `data/history/YYYY-MM-DD.json`

---

## Key Patterns

### Genre Grouping
Maps 100+ Spotify genres to 10 categories:
- Hip-Hop, Electronic, R&B/Soul, Pop, Rock, Jazz, Folk/Acoustic, World, Classical, Experimental

### Discovery Score
```
Underground (<40 popularity): 100 points
Mid-tier (40-59): 50 points
Mainstream (≥60): 0 points
Score = weighted average (0-100)
```

---

## Figma Plugin Sandbox Constraints

**CRITICAL**: Figma's JS sandbox uses older JavaScript, and `bun build` does not downlevel syntax. Custom Oxlint rules in `figma-plugin/lint/figma-sandbox.js` enforce:

- **No spread syntax**: `{ ...obj }` → Use `Object.assign()` or explicit properties
- **No optional catch**: `catch { }` → Use `catch (e) { }` or `catch (_e) { }`

### Frame Outputs
| Frame | Size | Content |
|-------|------|---------|
| Deep Cut Story | 1080x1920 | Album art (858x858, no rounded corners), "DEEP CUT" label, track name (117px bold) + artist (117px regular) as single text block, discovery stat badge |
| Track List | 1080x1920 | "THIS WEEK'S TRACKS" title (green), tracks with inline badges (DEEP CUT/TOP), artist in green |
| What You Missed | 1080x1920 | Album art, "WHAT YOU MISSED" label, track/artist info, "Rotated out" badge |

### Design Specifications

**Background (all cards)**:
- Dark base: `#07070C`
- Green radial gradient at bottom: Spotify green `#1FD661` at 20% opacity

**Typography**:
- Track name + artist on spotlight cards: 117px, track bold, artist regular, white, single text block (no gap)
- Labels: 28px Bold, Spotify green
- Track list entries: 40px Bold (track), 24px Regular green (artist)
- Badges: 20-24px

**Colors**:
- Spotify Green: `#1FD661`
- Orange (TOP badge): `#E89426`
- Background: `#07070C`
- Gray text: `#B3B3B3`

**Spacing**:
- Left margin: 111px
- Gap between track/artist text and stat badge: 58px
- Track list spacing: 123px between tracks

---

## Data Types

### Core Output (FullAnalysis)
```typescript
{
  generatedAt: string,
  weekOf: string,
  journey: JourneyTrack[],      // Track list (position, track, artist)
  stats: WeeklyStats,           // Aggregated statistics
  graphics: GraphicsData,       // Figma-ready format
  audioFeaturesAvailable: boolean,
  audioSource: "spotify" | "none"
}
```

### Graphics Data
```typescript
{
  deepCut: {
    track: TrackCard,      // Full track info with albumArt URL
    discoveryStat: string  // e.g., "Underground pick - 36% popularity"
  },
  whatYouMissed: {
    available: boolean,
    previousWeekDate: string | null,
    removedTracks: TrackCard[],  // Uses previous week's deepCut for albumArt
    message: string
  }
}
```

---

## Genre Color Palette
```javascript
"Hip-Hop": "#1a1a2e"
"Electronic": "#16213e"
"R&B / Soul": "#0f3460"
"Pop": "#e94560"
"Rock": "#533483"
"Jazz": "#4a0e4e"
"Folk / Acoustic": "#2c5530"
"World": "#c9485b"
"Classical": "#1b1b2f"
"Experimental": "#3d3d3d"
```

---

## Development Guidelines

### Adding New Analyzers
1. Create file in `src/analyzers/`
2. Export async function taking `PlaylistedTrack[]`
3. Return typed result object
4. Import in `src/index.ts`

### Modifying Genre Categories
- Edit `GENRE_GROUPS` in `src/analyzers/genres.ts`
- Update `GENRE_COLORS` in both main app and Figma plugin

### Creating New Figma Frames
1. Create `async function create{FrameName}()` in `figma-plugin/src/code.ts`
2. Add checkbox in `ui.html`
3. Wire up in message handler

### Type Sync
Keep types in sync between:
- `src/spotify/types.ts` (main app)
- `figma-plugin/src/types.ts` (plugin)

---

## Code Quality

### Linting and Formatting

**Main Application:**
- Oxlint with type-aware TypeScript rules (`--type-aware`, via tsgolint)
- Prettier for consistent code formatting
- Strict TypeScript mode enabled
- Promise/async rules to catch common bugs
- Nullish coalescing (`??`) preferred over logical OR (`||`)
- Optional chaining (`?.`) for safer property access

**Figma Plugin:**
- Oxlint with Figma sandbox compatibility rules (JS plugin)
- No spread syntax allowed (use `Object.assign()`)
- No optional catch binding (use `catch (e)` or `catch (_e)`)

### Pre-commit Checklist
1. `npm run typecheck` - Verify no type errors
2. `npm run lint` - Check linting rules
3. `npm run format:check` - Verify formatting
4. Or run `npm run check:all` to execute all checks

### Common Lint Rules
- Prefer `const` over `let`
- Always use `===` instead of `==`
- Prefix unused variables with `_`
- Await all promises (no floating promises)
- Use optional chaining (`?.`) where applicable
- Use nullish coalescing (`??`) for defaults

---

## Testing

No automated tests. Manual workflow:
1. Add tracks to Spotify playlist
2. Run `npm run analyze`
3. Verify JSON output in `data/history/`
4. Load JSON into Figma plugin
5. Verify generated designs

---

## Known Limitations

1. Audio features may return 403 (will proceed without audio features)
2. Track comparison limited to previous week only
3. No automated tests (manual workflow required)
4. Figma plugin requires ES2015-compatible syntax
5. Album art may fail to load in plugin (shows placeholder)
6. Run `npm run precommit` before commits (no git hooks configured)
7. "What You Missed" card only has album art if previous week's analysis was run with the updated code (uses `graphics.deepCut.track` from history)
