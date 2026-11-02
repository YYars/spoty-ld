/**
 * Figma plugin constants
 * Frame dimensions, colors, and spacing
 */

/**
 * RGB color type (Figma format)
 */
export interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/**
 * Frame dimensions (Instagram Story format)
 */
export const FRAME = {
  WIDTH: 1080,
  HEIGHT: 1920,
} as const;

/**
 * Layout spacing
 */
export const SPACING = {
  HORIZONTAL: 50,
  VERTICAL: 150,
  LEFT_MARGIN: 111,
  TOP_MARGIN: 181,
  BADGE_GAP: 58,
  TRACK: 123,
  PAGE_LEFT_MARGIN: 50,
} as const;

/**
 * Album art dimensions
 */
export const ALBUM_ART_SIZE = 858;

/**
 * Colors (Figma RGB format)
 */
export const COLORS = {
  SPOTIFY_GREEN: { r: 0.122, g: 0.839, b: 0.38 } as RGB,
  ORANGE_TOP: { r: 0.91, g: 0.58, b: 0.149 } as RGB,
  BACKGROUND: { r: 0.027, g: 0.027, b: 0.047 } as RGB,
  PLACEHOLDER: { r: 0.2, g: 0.2, b: 0.25 } as RGB,
  WHITE: { r: 1, g: 1, b: 1 } as RGB,
  DIMMED: { r: 0.6, g: 0.6, b: 0.65 } as RGB,
  RED_ACCENT: { r: 0.91, g: 0.27, b: 0.38 } as RGB,
  BLUE_ACCENT: { r: 0.24, g: 0.56, b: 0.96 } as RGB,
} as const;

/**
 * Genre-specific colors for visualizations
 */
export const GENRE_COLORS: readonly RGB[] = [
  { r: 0.122, g: 0.839, b: 0.38 },  // Green (primary)
  { r: 0.91, g: 0.58, b: 0.149 },    // Orange
  { r: 0.24, g: 0.56, b: 0.96 },     // Blue
  { r: 0.91, g: 0.27, b: 0.38 },     // Red
  { r: 0.65, g: 0.35, b: 0.91 },     // Purple
  { r: 0.95, g: 0.78, b: 0.2 },      // Yellow
  { r: 0.35, g: 0.82, b: 0.82 },     // Teal
  { r: 0.91, g: 0.42, b: 0.65 },     // Pink
];

/**
 * Font configurations
 */
export const FONTS = {
  REGULAR: { family: "Inter", style: "Regular" } as const,
  MEDIUM: { family: "Inter", style: "Medium" } as const,
  BOLD: { family: "Inter", style: "Bold" } as const,
} as const;

/**
 * Tracks per page in track list
 */
export const TRACKS_PER_PAGE = 11;

/**
 * Compact tracklist layout constants
 */
export const COMPACT_LAYOUT = {
  LEFT_MARGIN: 64,
  RIGHT_MARGIN: 64,
  NUMBER_COL_WIDTH: 72,      // width reserved for the row number
  ARTIST_COL_WIDTH: 260,     // fixed right column for artist name
  ROW_PADDING: 22,           // vertical padding above and below text within a row
  MIN_ROW_HEIGHT: 76,        // floor so short tracks don't look too cramped
  TRACKS_PER_PAGE: 20,
  TRACK_FONT_SIZE: 32,
  ARTIST_FONT_SIZE: 26,
  TITLE_FONT_SIZE: 28,
  SUBTITLE_FONT_SIZE: 20,
  HEADER_HEIGHT: 120,        // space above first track row
} as const;
