/**
 * Figma Plugin Entry Point
 * Generates Instagram Story graphics from Spotify playlist analysis
 */

import type { FullAnalysis, PluginMessage } from "./types";
import { SPACING } from "./constants";
import { loadFonts } from "./ui-helpers";
import {
  createDeepCutStory,
  createTrackList,
  createWhatYouMissedCard,
  createPlaylistDnaFrame,
  createGenreBreakdownFrame,
  createTrendsFrame,
  createArtistSpotlightFrame,
  createFreshReleasesFrame,
  createPersonalityFrame,
  createCompactTracklist,
} from "./frame-builders";

/**
 * Calculate smart starting position for new content
 */
function calculateStartPosition(): { x: number; y: number } {
  const existingFrames = figma.currentPage.findAll(
    (node) => node.type === "FRAME" && node.parent === figma.currentPage
  ) as FrameNode[];

  if (existingFrames.length === 0) {
    const viewport = figma.viewport.center;
    return { x: SPACING.PAGE_LEFT_MARGIN, y: viewport.y };
  }

  const maxY = existingFrames.reduce((max, frame) => {
    const frameBottom = frame.y + frame.height;
    return frameBottom > max ? frameBottom : max;
  }, 0);

  return { x: SPACING.PAGE_LEFT_MARGIN, y: maxY + SPACING.VERTICAL };
}

/**
 * Position frames horizontally with spacing
 */
function positionFrames(frames: FrameNode[], startPos: { x: number; y: number }): void {
  frames.reduce((xOffset, frame) => {
    frame.x = startPos.x + xOffset;
    frame.y = startPos.y;
    return xOffset + frame.width + SPACING.HORIZONTAL;
  }, 0);
}

/**
 * Generate all requested frames
 */
async function generateFrames(
  data: FullAnalysis,
  options: {
    deepCutStory: boolean;
    trackList: boolean;
    whatYouMissed: boolean;
    playlistDna: boolean;
    genreBreakdown: boolean;
    compactTracklist: boolean;
  },
  spotifyCodeBytes: number[] | null
): Promise<FrameNode[]> {
  const frames: FrameNode[] = [];

  if (options.playlistDna) {
    const frame = createPlaylistDnaFrame(data);
    frames.push(frame);
  }

  if (options.deepCutStory) {
    const frame = await createDeepCutStory(data);
    frames.push(frame);
  }

  if (options.genreBreakdown) {
    const frame = createGenreBreakdownFrame(data);
    frames.push(frame);
  }

  if (options.trackList) {
    const trackListFrames = await createTrackList(data);
    for (const frame of trackListFrames) {
      frames.push(frame);
    }
  }

  if (options.whatYouMissed) {
    const frame = await createWhatYouMissedCard(data);
    if (frame) {
      frames.push(frame);
    }
  }

  if (options.compactTracklist) {
    const codeBytes = spotifyCodeBytes ? new Uint8Array(spotifyCodeBytes) : null;
    const compactFrames = await createCompactTracklist(data, codeBytes);
    for (const frame of compactFrames) {
      frames.push(frame);
    }
  }

  // Trend-dependent frames (only generated when data is available)
  const trendsFrame = createTrendsFrame(data);
  if (trendsFrame) {
    frames.push(trendsFrame);
  }

  const artistFrame = createArtistSpotlightFrame(data);
  if (artistFrame) {
    frames.push(artistFrame);
  }

  const freshFrame = createFreshReleasesFrame(data);
  if (freshFrame) {
    frames.push(freshFrame);
  }

  const personalityFrame = createPersonalityFrame(data);
  if (personalityFrame) {
    frames.push(personalityFrame);
  }

  return frames;
}

// =============================================================================
// Plugin Entry Point
// =============================================================================

figma.showUI(__html__, { width: 400, height: 600 });

figma.ui.onmessage = async (msg: PluginMessage) => {
  if (msg.type === "cancel") {
    figma.closePlugin();
    return;
  }

  if (msg.type === "generate") {
    const { data, options, spotifyCodeBytes } = msg;

    try {
      // Load fonts
      await loadFonts();

      // Generate frames
      const frames = await generateFrames(data, options, spotifyCodeBytes);

      // Position frames
      const startPos = calculateStartPosition();
      positionFrames(frames, startPos);

      // Select and zoom to frames
      figma.currentPage.selection = frames;
      figma.viewport.scrollAndZoomIntoView(frames);

      figma.notify(`Created ${frames.length} graphic(s) for ${data.weekOf}!`);
    } catch (error) {
      figma.notify(`Error: ${error}`, { error: true });
    }
  }
};
