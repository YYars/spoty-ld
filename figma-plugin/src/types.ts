/**
 * Types matching the main app's FullAnalysis structure
 * KEEP IN SYNC WITH: src/spotify/types.ts
 * These types are duplicated due to Figma plugin bundling constraints (ES2015 target)
 */

export interface TrackCard {
  name: string;
  artist: string;
  albumArt: string;
  popularity: number;
  spotifyUrl: string;
}

export interface DeepCutCard {
  track: TrackCard;
  discoveryStat: string;
}

export interface WhatYouMissed {
  available: boolean;
  previousWeekDate: string | null;
  removedTracks: TrackCard[];
  message: string;
}

export interface GraphicsData {
  deepCut: DeepCutCard;
  whatYouMissed: WhatYouMissed;
}

export interface TrackHighlight {
  id?: string; // Optional for backward compat with old JSON
  name: string;
  artist: string;
  popularity: number;
}

export interface GenreBreakdown {
  category: string;
  count: number;
  percentage: number;
}

export interface WeeklyStats {
  weekOf: string;
  newTracksCount: number;
  mostPopular: TrackHighlight;
  deepCuts: TrackHighlight[]; // All tracks with popularity < 40
  lastWeekGem: TrackHighlight | null;
  genres: {
    rawGenres: { genre: string; count: number }[];
    groupedGenres: GenreBreakdown[];
    primaryGenre: string;
    isMultiGenre: boolean;
    diversityScore: number;
  };
  artistDiversity: {
    uniqueArtists: number;
    totalArtistAppearances: number;
    repeatArtists: string[];
    artistPopularitySpread: {
      min: number;
      max: number;
      average: number;
    };
  };
  discoveryScore: {
    score: number;
    undergroundPicks: number;
    mainstreamHits: number;
    midTier: number;
    percentUnderground: number;
  };
}

export interface JourneyTrack {
  id?: string; // Optional for backward compat with old JSON
  position: number;
  track: string;
  artist: string;
}

// Trend types (optional, for new frames)
export interface GenreShift {
  category: string;
  previousPct: number;
  currentPct: number;
  delta: number;
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
  insight: string;
  insights?: string[];
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
  narrative: string;
}

export interface ArtistLoyalty {
  loyalArtists: ArtistLoyaltyEntry[];
  oneWeekWonders: ArtistLoyaltyEntry[];
  currentObsession: ArtistLoyaltyEntry | null;
  comebackArtists: ArtistLoyaltyEntry[];
}

export interface FreshnessAnalysis {
  freshReleases: {
    name: string;
    artist: string;
    releaseDate: string;
    daysOld: number;
    tier?: string;
  }[];
  freshCount: number;
  totalTracks: number;
  percentFresh: number;
  tierBreakdown?: { dayOne: number; earlyBird: number; freshCatch: number };
  label: string;
}

export interface PlaylistCoherence {
  score: number;
  label: string;
  genreConcentration: number;
  popularityVariance: number;
}

export interface PlaylistPersonality {
  averageDiscoveryScore: number;
  discoveryTrend: string;
  dominantGenre: string;
  genreFluidity: number;
  averageRotationRate: number;
  signatureArtists: string[];
  listenerArchetype: string;
  summary: string;
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

// Plugin message types
export interface GenerateMessage {
  type: "generate";
  data: FullAnalysis;
  options: {
    deepCutStory: boolean;
    trackList: boolean;
    whatYouMissed: boolean;
    playlistDna: boolean;
    genreBreakdown: boolean;
    compactTracklist: boolean;
  };
  spotifyCodeBytes: number[] | null;
}

export interface CancelMessage {
  type: "cancel";
}

export type PluginMessage = GenerateMessage | CancelMessage;
