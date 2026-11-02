import * as fs from "fs";
import * as path from "path";
import type {
  PlaylistedTrack,
  WeeklyStats,
  GraphicsData,
  DeepCutCard,
  WhatYouMissed,
  TrackCard,
} from "../spotify/types.js";
import { toTrackCard } from "../utils/track-converters.js";
import { parseAnalysisJson, type ValidatedAnalysis } from "../schemas/analysis.js";

export const HISTORY_DIR = path.join(process.cwd(), "data", "history");

/**
 * Build the Deep Cut Card data (uses the primary/most obscure track)
 */
function buildDeepCutCard(
  stats: WeeklyStats,
  thisWeekTracks: readonly PlaylistedTrack[]
): DeepCutCard {
  // Use the primary (most obscure) deep cut
  const primaryGem = stats.deepCuts[0];

  // Find the actual track object by ID, with name fallback for old data
  const gemTrack =
    thisWeekTracks.find((t) => t.track.id === primaryGem.id) ??
    thisWeekTracks.find((t) => t.track.name === primaryGem.name);

  const trackCard: TrackCard = gemTrack
    ? toTrackCard(gemTrack)
    : {
        name: primaryGem.name,
        artist: primaryGem.artist,
        albumArt: "",
        popularity: primaryGem.popularity,
        spotifyUrl: "",
      };

  // Create a discovery stat message
  const pop = primaryGem.popularity;
  let discoveryStat: string;
  if (pop < 20) {
    discoveryStat = `Deep cut - only ${pop}% mainstream exposure`;
  } else if (pop < 40) {
    discoveryStat = `Underground pick - ${pop}% popularity`;
  } else {
    discoveryStat = `Under the radar - ${pop}% popularity`;
  }

  return {
    track: trackCard,
    discoveryStat,
  };
}

/**
 * Load the previous week's analysis with Zod validation
 * @param currentWeekOf - The weekOf date of the current analysis (to exclude it)
 */
export function loadPreviousAnalysis(currentWeekOf: string): ValidatedAnalysis | null {
  if (!fs.existsSync(HISTORY_DIR)) {
    return null;
  }

  const files = fs
    .readdirSync(HISTORY_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse(); // Most recent first

  // Find the most recent file that is NOT the current week
  for (const file of files) {
    // Extract date from filename (e.g., "2026-02-02.json" -> "2026-02-02")
    const fileDate = file.replace(".json", "");
    if (fileDate === currentWeekOf) {
      continue; // Skip current week's file (may exist from previous run)
    }

    const filepath = path.join(HISTORY_DIR, file);
    try {
      const content = fs.readFileSync(filepath, "utf-8");
      const analysis = parseAnalysisJson(content);
      if (analysis) {
        return analysis;
      }
    } catch {
      continue; // Try next file if this one fails
    }
  }

  return null;
}

/**
 * Load all historical analyses (for trend analysis)
 * Returns analyses sorted chronologically (oldest first)
 */
export function loadAllAnalyses(excludeWeekOf?: string): readonly ValidatedAnalysis[] {
  if (!fs.existsSync(HISTORY_DIR)) {
    return [];
  }

  const files = fs
    .readdirSync(HISTORY_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort(); // Chronological order (oldest first)

  const analyses: ValidatedAnalysis[] = [];

  for (const file of files) {
    const fileDate = file.replace(".json", "");
    if (excludeWeekOf && fileDate === excludeWeekOf) {
      continue;
    }

    const filepath = path.join(HISTORY_DIR, file);
    try {
      const content = fs.readFileSync(filepath, "utf-8");
      const analysis = parseAnalysisJson(content);
      if (analysis) {
        analyses.push(analysis);
      }
    } catch {
      continue;
    }
  }

  return analyses;
}

/**
 * Build the "What You Missed" data - shows the previous week's deep cut
 */
function buildWhatYouMissed(currentWeekOf: string): WhatYouMissed {
  const previousAnalysis = loadPreviousAnalysis(currentWeekOf);

  if (!previousAnalysis) {
    // First run or no history
    return {
      available: false,
      previousWeekDate: null,
      removedTracks: [],
      message: "No previous week data available yet",
    };
  }

  // Support both old "hiddenGem" and new "deepCut" field names (Zod schema allows both)
  const previousDeepCut = (previousAnalysis.graphics.deepCut ??
    previousAnalysis.graphics.hiddenGem) as DeepCutCard | undefined;

  if (!previousDeepCut?.track) {
    return {
      available: false,
      previousWeekDate: previousAnalysis.weekOf,
      removedTracks: [],
      message: "No deep cut from previous week",
    };
  }

  return {
    available: true,
    previousWeekDate: previousAnalysis.weekOf,
    removedTracks: [previousDeepCut.track],
    message: "Last week's hidden gem",
  };
}

/**
 * Build all graphics-ready data
 */
export function buildGraphicsData(
  stats: WeeklyStats,
  thisWeekTracks: readonly PlaylistedTrack[],
  currentWeekOf: string
): GraphicsData {
  return {
    deepCut: buildDeepCutCard(stats, thisWeekTracks),
    whatYouMissed: buildWhatYouMissed(currentWeekOf),
  };
}
