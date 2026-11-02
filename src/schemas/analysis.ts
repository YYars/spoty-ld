/**
 * Zod schemas for runtime validation of analysis JSON files
 * Handles schema evolution (old "hiddenGem" format and current "deepCut" format)
 */

import { z } from "zod";

const TrackCardSchema = z.object({
  name: z.string(),
  artist: z.string(),
  albumArt: z.string(),
  popularity: z.number(),
  spotifyUrl: z.string(),
});

const DeepCutCardSchema = z.object({
  track: TrackCardSchema,
  discoveryStat: z.string(),
});

const WhatYouMissedSchema = z.object({
  available: z.boolean(),
  previousWeekDate: z.string().nullable(),
  removedTracks: z.array(TrackCardSchema),
  message: z.string(),
});

const GraphicsDataSchema = z.object({
  deepCut: DeepCutCardSchema.optional(),
  hiddenGem: DeepCutCardSchema.optional(), // Old schema compatibility
  whatYouMissed: WhatYouMissedSchema.optional(),
});

const TrackHighlightSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  artist: z.string(),
  popularity: z.number(),
});

const GenreBreakdownSchema = z.object({
  category: z.string(),
  count: z.number(),
  percentage: z.number(),
});

const WeeklyStatsSchema = z.object({
  weekOf: z.string(),
  newTracksCount: z.number(),
  mostPopular: TrackHighlightSchema,
  deepCuts: z.array(TrackHighlightSchema),
  lastWeekGem: TrackHighlightSchema.nullable(),
  genres: z.object({
    rawGenres: z.array(z.object({ genre: z.string(), count: z.number() })),
    groupedGenres: z.array(GenreBreakdownSchema),
    primaryGenre: z.string(),
    isMultiGenre: z.boolean(),
    diversityScore: z.number(),
  }),
  artistDiversity: z.object({
    uniqueArtists: z.number(),
    totalArtistAppearances: z.number(),
    repeatArtists: z.array(z.string()),
    artistPopularitySpread: z.object({
      min: z.number(),
      max: z.number(),
      average: z.number(),
    }),
  }),
  discoveryScore: z.object({
    score: z.number(),
    undergroundPicks: z.number(),
    mainstreamHits: z.number(),
    midTier: z.number(),
    percentUnderground: z.number(),
  }),
});

const JourneyTrackSchema = z.object({
  id: z.string().optional(),
  position: z.number(),
  track: z.string(),
  artist: z.string(),
});

const GenreShiftSchema = z.object({
  category: z.string(),
  previousPct: z.number(),
  currentPct: z.number(),
  delta: z.number(),
});

const DeepCutTrendSchema = z.object({
  weekOf: z.string(),
  trackName: z.string(),
  popularity: z.number(),
});

const WeekOverWeekTrendSchema = z.object({
  previousWeek: z.string(),
  discoveryScoreDelta: z.number(),
  discoveryScoreDirection: z.enum(["deeper", "surfacing", "steady"]),
  genreShifts: z.array(GenreShiftSchema),
  primaryGenreChanged: z.boolean(),
  previousPrimaryGenre: z.string(),
  deepCutProgression: z.array(DeepCutTrendSchema),
  insight: z.string(),
  insights: z.array(z.string()).optional(),
});

const ArtistAppearanceSchema = z.object({
  weekOf: z.string(),
  trackCount: z.number(),
});

const ArtistLoyaltyEntrySchema = z.object({
  name: z.string(),
  weeksAppeared: z.number(),
  totalWeeksTracked: z.number(),
  totalTracks: z.number(),
  appearances: z.array(ArtistAppearanceSchema),
  category: z.enum(["loyal", "one-week-wonder", "comeback", "current-obsession", "regular"]),
  narrative: z.string(),
});

const ArtistLoyaltySchema = z.object({
  loyalArtists: z.array(ArtistLoyaltyEntrySchema),
  oneWeekWonders: z.array(ArtistLoyaltyEntrySchema),
  currentObsession: ArtistLoyaltyEntrySchema.nullable(),
  comebackArtists: z.array(ArtistLoyaltyEntrySchema),
});

const FreshnessAnalysisSchema = z.object({
  freshReleases: z.array(
    z.object({
      name: z.string(),
      artist: z.string(),
      releaseDate: z.string(),
      daysOld: z.number(),
      tier: z.enum(["day-one", "early-bird", "fresh-catch"]).optional(),
    })
  ),
  freshCount: z.number(),
  totalTracks: z.number(),
  percentFresh: z.number(),
  tierBreakdown: z
    .object({
      dayOne: z.number(),
      earlyBird: z.number(),
      freshCatch: z.number(),
    })
    .optional(),
  label: z.string(),
});

const PlaylistCoherenceSchema = z.object({
  score: z.number(),
  label: z.string(),
  genreConcentration: z.number(),
  popularityVariance: z.number(),
});

const PlaylistPersonalitySchema = z.object({
  averageDiscoveryScore: z.number(),
  discoveryTrend: z.enum(["going deeper", "going mainstream", "consistent"]),
  dominantGenre: z.string(),
  genreFluidity: z.number(),
  averageRotationRate: z.number(),
  signatureArtists: z.array(z.string()),
  listenerArchetype: z.string(),
  summary: z.string(),
});

export const FullAnalysisSchema = z.object({
  generatedAt: z.string(),
  weekOf: z.string(),
  journey: z.array(JourneyTrackSchema),
  stats: WeeklyStatsSchema,
  graphics: GraphicsDataSchema,
  audioFeaturesAvailable: z.boolean(),
  audioSource: z.enum(["spotify", "none"]),
  trends: WeekOverWeekTrendSchema.optional(),
  artistLoyalty: ArtistLoyaltySchema.optional(),
  freshness: FreshnessAnalysisSchema.optional(),
  coherence: PlaylistCoherenceSchema.optional(),
  personality: PlaylistPersonalitySchema.optional(),
});

export type ValidatedAnalysis = z.infer<typeof FullAnalysisSchema>;

/**
 * Safely parse a JSON string into a validated FullAnalysis
 * Returns null if parsing or validation fails
 */
export const parseAnalysisJson = (content: string): ValidatedAnalysis | null => {
  try {
    const parsed = JSON.parse(content);
    const result = FullAnalysisSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
};
