/**
 * Spotify Playlist Analyzer - Entry Point
 */

import "dotenv/config";
import { createSpotifyClient } from "./spotify/client.js";
import { analyzeStats } from "./analyzers/stats.js";
import { buildGraphicsData, loadAllAnalyses } from "./analyzers/graphics.js";
import { analyzeWeekOverWeekTrends, analyzeArtistLoyalty } from "./analyzers/trends.js";
import { analyzeFreshness } from "./analyzers/freshness.js";
import { calculateCoherence } from "./analyzers/coherence.js";
import { analyzePersonality } from "./analyzers/personality.js";
import { saveAnalysis, printSummary } from "./output/writer.js";
import { separateTracksByWeek } from "./utils/week-separator.js";
import { createConsoleLogger, formatTrackForLog, type Logger } from "./effects/logger.js";
import type { PlaylistedTrack, FullAnalysis, JourneyTrack } from "./spotify/types.js";

/**
 * Parse CLI arguments
 */
const parseArgs = (args: readonly string[]): { weekMode: "current" | "previous" } => ({
  weekMode: args.includes("--week=previous") ? "previous" : "current",
});

/**
 * Build journey data from tracks
 */
const buildJourney = (tracks: readonly PlaylistedTrack[]): readonly JourneyTrack[] =>
  tracks.map((playlistedTrack, index) => ({
    id: playlistedTrack.track.id,
    position: index + 1,
    track: playlistedTrack.track.name,
    artist: playlistedTrack.track.artists.map((a) => a.name).join(", "),
  }));

/**
 * Determine weekOf date from tracks
 */
const determineWeekOf = (tracks: readonly PlaylistedTrack[]): string =>
  tracks.length > 0
    ? new Date(tracks[0].added_at).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

/**
 * Main analysis function
 */
async function runAnalysis(logger: Logger): Promise<void> {
  const { weekMode } = parseArgs(process.argv.slice(2));

  logger.info("Spotify Playlist Analyzer");
  logger.separator();
  if (weekMode === "previous") {
    logger.info("Mode: Analyzing PREVIOUS week's tracks");
  }

  // Validate environment
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const playlistId = process.env.SPOTIFY_PLAYLIST_ID;

  if (!clientId || !clientSecret || !playlistId) {
    logger.error(
      "Error: SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and SPOTIFY_PLAYLIST_ID must be set in .env"
    );
    process.exit(1);
  }

  // Initialize Spotify client
  logger.info("\nInitializing Spotify client...");
  const client = createSpotifyClient({ clientId, clientSecret });

  // Fetch playlist tracks
  logger.info(`Fetching playlist tracks (${playlistId})...`);
  const allTracks = await client.getPlaylistTracks(playlistId);
  logger.info(`Found ${allTracks.length} total tracks`);

  // Debug: Show first few tracks as received from Spotify API
  logger.debug(
    "First 5 tracks from Spotify API (in order received)",
    allTracks.map(formatTrackForLog)
  );

  // Separate into this week and last week
  const { thisWeek, lastWeek } = separateTracksByWeek(allTracks);
  logger.info(`This week: ${thisWeek.length} tracks`);
  logger.info(`Last week (still in playlist): ${lastWeek.length} tracks`);

  // Debug: Show first few tracks after separation
  logger.debug("First 5 'this week' tracks (after separation)", thisWeek.map(formatTrackForLog));

  // Select tracks to analyze based on mode
  const tracksToAnalyze = weekMode === "previous" ? lastWeek : thisWeek;
  const otherWeekTracks = weekMode === "previous" ? thisWeek : lastWeek;

  if (tracksToAnalyze.length === 0) {
    logger.error(`\nNo ${weekMode === "previous" ? "previous week" : "new"} tracks found!`);
    process.exit(1);
  }

  logger.info(`\nAnalyzing ${tracksToAnalyze.length} tracks from ${weekMode} week...`);

  // Determine weekOf date from the tracks being analyzed
  const weekOf = determineWeekOf(tracksToAnalyze);

  // Analyze stats
  logger.info("Calculating weekly stats...");
  const stats = await analyzeStats(tracksToAnalyze, otherWeekTracks, weekOf, client.getArtists);

  // Build graphics-ready data
  logger.info("Building graphics data...");
  const graphics = buildGraphicsData(stats, tracksToAnalyze, weekOf);

  // Build journey data
  const journey = buildJourney(tracksToAnalyze);

  // Load historical analyses for trend analysis
  logger.info("Analyzing trends...");
  const historicalAnalyses = loadAllAnalyses(weekOf);

  // Week-over-week trends
  const trends = analyzeWeekOverWeekTrends(stats, historicalAnalyses);

  // Artist loyalty tracking
  const artistLoyalty = analyzeArtistLoyalty(stats, journey, historicalAnalyses);

  // Fresh release detection
  logger.info("Detecting fresh releases...");
  const freshness = analyzeFreshness(tracksToAnalyze, weekOf);

  // Playlist coherence
  const trackPopularities = tracksToAnalyze.map((t) => t.track.popularity);
  const coherence = calculateCoherence(stats, trackPopularities);

  // Playlist personality profile (needs 3+ weeks of data)
  logger.info("Building personality profile...");
  const personality = analyzePersonality(stats, journey, historicalAnalyses);

  // Build full analysis
  const analysis: FullAnalysis = {
    generatedAt: new Date().toISOString(),
    weekOf,
    playlistId,
    journey: journey as JourneyTrack[],
    stats,
    graphics,
    audioFeaturesAvailable: false,
    audioSource: "none",
    trends: trends ?? undefined,
    artistLoyalty,
    freshness,
    coherence,
    personality: personality ?? undefined,
  };

  // Save and print
  const filepath = saveAnalysis(analysis);
  logger.info(`\nAnalysis saved to: ${filepath}`);

  printSummary(analysis);
}

// Entry point
const logger = createConsoleLogger();
runAnalysis(logger).catch((error) => {
  logger.error(`Error: ${error}`);
  process.exit(1);
});
