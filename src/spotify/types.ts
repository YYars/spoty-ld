// Simplified types for what we need from Spotify API

export interface Track {
  id: string;
  name: string;
  duration_ms: number;
  popularity: number;
  explicit: boolean;
  artists: { id: string; name: string }[];
  album: {
    id: string;
    name: string;
    release_date: string;
    images: { url: string; width: number; height: number }[];
  };
}

export interface PlaylistedTrack {
  added_at: string; // ISO timestamp
  track: Track;
}

export interface Artist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
}

// Output types for our analysis

export interface TrackHighlight {
  id: string;
  name: string;
  artist: string;
  popularity: number;
}

export interface ArtistDiversity {
  uniqueArtists: number;
  totalArtistAppearances: number;
  repeatArtists: string[]; // Artists who appear more than once
  artistPopularitySpread: {
    min: number;
    max: number;
    average: number;
  };
}

export interface DiscoveryScore {
  score: number; // 0-100, higher = more underground
  undergroundPicks: number; // Tracks with popularity < 40
  mainstreamHits: number; // Tracks with popularity >= 60
  midTier: number; // 40-59 popularity
  percentUnderground: number;
}

export interface GenreBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface GenreAnalysisResult {
  rawGenres: { genre: string; count: number }[];
  groupedGenres: GenreBreakdown[];
  primaryGenre: string;
  isMultiGenre: boolean;
  diversityScore: number;
}

export interface WeeklyStats {
  weekOf: string;
  newTracksCount: number;
  mostPopular: TrackHighlight;
  deepCuts: TrackHighlight[]; // All tracks with popularity < 40, sorted by popularity ascending
  lastWeekGem: TrackHighlight | null;
  genres: GenreAnalysisResult;
  artistDiversity: ArtistDiversity;
  discoveryScore: DiscoveryScore;
}

// Graphics-ready data structures

export interface TrackCard {
  name: string;
  artist: string;
  albumArt: string; // URL to album image
  popularity: number;
  spotifyUrl: string;
}

export interface DeepCutCard {
  track: TrackCard;
  discoveryStat: string; // e.g., "Only 36% mainstream exposure"
}

export interface WhatYouMissed {
  available: boolean;
  previousWeekDate: string | null;
  removedTracks: TrackCard[];
  message: string; // e.g., "3 tracks rotated out this week"
}

export interface GraphicsData {
  deepCut: DeepCutCard;
  whatYouMissed: WhatYouMissed;
}

export interface JourneyTrack {
  id: string;
  position: number;
  track: string;
  artist: string;
}

// Trend analysis types

export interface GenreShift {
  category: string;
  previousPct: number;
  currentPct: number;
  delta: number; // positive = grew, negative = shrank
}

export interface DeepCutTrend {
  weekOf: string;
  trackName: string;
  popularity: number;
}

export interface WeekOverWeekTrend {
  previousWeek: string;
  discoveryScoreDelta: number;
  discoveryScoreDirection: "deeper" | "surfacing" | "steady";
  genreShifts: GenreShift[];
  primaryGenreChanged: boolean;
  previousPrimaryGenre: string;
  deepCutProgression: DeepCutTrend[];
  insight: string; // Primary insight (backward compat = insights[0])
  insights?: string[]; // Top 3 Instagram-ready insights
}

export interface ArtistAppearance {
  weekOf: string;
  trackCount: number;
}

export interface ArtistLoyaltyEntry {
  name: string;
  weeksAppeared: number;
  totalWeeksTracked: number;
  totalTracks: number;
  appearances: ArtistAppearance[];
  category: "loyal" | "one-week-wonder" | "comeback" | "current-obsession" | "regular";
  narrative: string; // e.g., "4 of 6 weeks, 8 total tracks"
}

export interface ArtistLoyalty {
  loyalArtists: ArtistLoyaltyEntry[]; // 3+ weeks
  oneWeekWonders: ArtistLoyaltyEntry[]; // 1 week, 3+ tracks
  currentObsession: ArtistLoyaltyEntry | null; // 3+ tracks this week
  comebackArtists: ArtistLoyaltyEntry[]; // Gap then return
}

export type FreshnessTier = "day-one" | "early-bird" | "fresh-catch";

export interface FreshRelease {
  name: string;
  artist: string;
  releaseDate: string;
  daysOld: number;
  tier: FreshnessTier;
}

export interface TierBreakdown {
  dayOne: number;
  earlyBird: number;
  freshCatch: number;
}

export interface FreshnessAnalysis {
  freshReleases: FreshRelease[];
  freshCount: number;
  totalTracks: number;
  percentFresh: number;
  tierBreakdown: TierBreakdown;
  label: string; // e.g., "Day-one listener — 4 tracks dropped this week"
}

export interface PlaylistCoherence {
  score: number; // 0-100, higher = more focused
  label: string; // "Focused deep dive" or "Eclectic exploration"
  genreConcentration: number; // % of top genre
  popularityVariance: number;
}

export interface PlaylistPersonality {
  averageDiscoveryScore: number;
  discoveryTrend: "going deeper" | "going mainstream" | "consistent";
  dominantGenre: string;
  genreFluidity: number; // 0-100, higher = more genre changes between weeks
  averageRotationRate: number; // % of artists that are new each week
  signatureArtists: string[]; // Artists appearing in ≥50% of weeks
  listenerArchetype: string; // e.g., "Eclectic explorer"
  summary: string; // Generated 1-2 sentence personality summary
}

export interface FullAnalysis {
  generatedAt: string;
  weekOf: string;
  playlistId?: string;
  journey: JourneyTrack[];
  stats: WeeklyStats;
  graphics: GraphicsData;
  audioFeaturesAvailable: boolean;
  audioSource: "spotify" | "none";
  // New analysis fields (optional for backward compat)
  trends?: WeekOverWeekTrend;
  artistLoyalty?: ArtistLoyalty;
  freshness?: FreshnessAnalysis;
  coherence?: PlaylistCoherence;
  personality?: PlaylistPersonality;
}
