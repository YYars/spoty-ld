/**
 * UI helper functions for creating Figma elements
 */

import { COLORS, ALBUM_ART_SIZE, FONTS, type RGB } from "./constants";

/**
 * Creates the standard Spotify-style gradient background fills
 * Dark base with green radial gradient at bottom (20% opacity)
 */
export function createSpotifyGradientFills(): Paint[] {
  return [
    {
      type: "GRADIENT_RADIAL",
      gradientStops: [
        {
          position: 0.247,
          color: { r: COLORS.SPOTIFY_GREEN.r, g: COLORS.SPOTIFY_GREEN.g, b: COLORS.SPOTIFY_GREEN.b, a: 0 },
        },
        {
          position: 1,
          color: { r: COLORS.SPOTIFY_GREEN.r, g: COLORS.SPOTIFY_GREEN.g, b: COLORS.SPOTIFY_GREEN.b, a: 1 },
        },
      ],
      gradientTransform: [
        [0, 0.48, 0.5],
        [-0.38, 0, 0.54],
      ],
      opacity: 0.2,
    },
    { type: "SOLID", color: COLORS.BACKGROUND },
  ];
}

/**
 * Creates a text node with specified styling
 */
export function createText(
  content: string,
  fontSize: number,
  fontStyle: "Regular" | "Medium" | "Bold" = "Regular",
  color: RGB = COLORS.WHITE
): TextNode {
  const text = figma.createText();
  text.fontName = { family: "Inter", style: fontStyle };
  text.characters = content;
  text.fontSize = fontSize;
  text.fills = [{ type: "SOLID", color }];
  return text;
}

/**
 * Creates a badge frame with text
 */
export function createBadge(text: string, color: RGB, fontSize: number = 20): FrameNode {
  const badge = figma.createFrame();
  badge.layoutMode = "HORIZONTAL";
  badge.primaryAxisSizingMode = "AUTO";
  badge.counterAxisSizingMode = "AUTO";
  badge.paddingLeft = fontSize === 20 ? 12 : 20;
  badge.paddingRight = fontSize === 20 ? 12 : 20;
  badge.paddingTop = fontSize === 20 ? 6 : 10;
  badge.paddingBottom = fontSize === 20 ? 6 : 10;
  badge.cornerRadius = 12;
  badge.fills = [{ type: "SOLID", color: color, opacity: 0.2 }];

  const badgeText = createText(text, fontSize, "Regular", color);
  badge.appendChild(badgeText);

  return badge;
}

/**
 * Creates album art rectangle or placeholder
 */
export async function createAlbumArt(
  albumArtUrl: string | undefined,
  x: number,
  y: number
): Promise<RectangleNode> {
  const rect = figma.createRectangle();
  rect.resize(ALBUM_ART_SIZE, ALBUM_ART_SIZE);
  rect.x = x;
  rect.y = y;

  if (albumArtUrl) {
    try {
      const image = await figma.createImageAsync(albumArtUrl);
      rect.fills = [{ type: "IMAGE", imageHash: image.hash, scaleMode: "FILL" }];
    } catch (_e) {
      rect.fills = [{ type: "SOLID", color: COLORS.PLACEHOLDER }];
    }
  } else {
    rect.fills = [{ type: "SOLID", color: COLORS.PLACEHOLDER }];
  }

  return rect;
}

/**
 * Creates track name + artist text block with mixed styling
 */
export function createTrackArtistText(
  trackName: string,
  artistName: string,
  x: number,
  y: number
): TextNode {
  const textNode = figma.createText();
  textNode.fontName = FONTS.BOLD;
  textNode.characters = trackName + "\n" + artistName;
  textNode.fontSize = 117;
  textNode.fills = [{ type: "SOLID", color: COLORS.WHITE }];
  textNode.x = x;
  textNode.y = y;
  textNode.resize(ALBUM_ART_SIZE, textNode.height);
  textNode.textAutoResize = "HEIGHT";
  // Make artist name (second line) regular weight
  textNode.setRangeFontName(trackName.length + 1, textNode.characters.length, FONTS.REGULAR);
  return textNode;
}

/**
 * Load all required fonts
 */
export async function loadFonts(): Promise<void> {
  await Promise.all([
    figma.loadFontAsync(FONTS.BOLD),
    figma.loadFontAsync(FONTS.REGULAR),
    figma.loadFontAsync(FONTS.MEDIUM),
  ]);
}
