/**
 * Frame builder functions for creating Figma frames
 */

import type { FullAnalysis } from "./types";
import { FRAME, SPACING, COLORS, TRACKS_PER_PAGE, GENRE_COLORS, COMPACT_LAYOUT } from "./constants";
import type { RGB } from "./constants";
import {
  createSpotifyGradientFills,
  createText,
  createBadge,
  createAlbumArt,
  createTrackArtistText,
} from "./ui-helpers";

/**
 * Create a base frame with standard dimensions and gradient
 */
function createBaseFrame(name: string): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(FRAME.WIDTH, FRAME.HEIGHT);
  frame.fills = createSpotifyGradientFills();
  return frame;
}

/**
 * Create Deep Cut Story frame (1080x1920)
 */
export async function createDeepCutStory(data: FullAnalysis): Promise<FrameNode> {
  const frame = createBaseFrame(`Deep Cut - ${data.weekOf}`);
  const gem = data.graphics.deepCut;

  // Album art
  const albumArt = await createAlbumArt(gem.track.albumArt, SPACING.LEFT_MARGIN, SPACING.TOP_MARGIN);
  frame.appendChild(albumArt);

  // "DEEP CUT" label
  const label = createText("DEEP CUT", 28, "Bold", COLORS.SPOTIFY_GREEN);
  label.x = SPACING.LEFT_MARGIN;
  label.y = 1197;
  frame.appendChild(label);

  // Track name + Artist
  const trackArtistText = createTrackArtistText(
    gem.track.name,
    gem.track.artist,
    SPACING.LEFT_MARGIN,
    1237
  );
  frame.appendChild(trackArtistText);

  // Discovery stat badge
  const statBadge = createBadge(gem.discoveryStat, COLORS.SPOTIFY_GREEN, 24);
  statBadge.name = "Stat Badge";
  statBadge.x = SPACING.LEFT_MARGIN;
  statBadge.y = trackArtistText.y + trackArtistText.height + SPACING.BADGE_GAP;
  frame.appendChild(statBadge);

  return frame;
}

/**
 * Create Track List frames (1080x1920, can be multiple pages)
 */
export async function createTrackList(data: FullAnalysis): Promise<FrameNode[]> {
  const frames: FrameNode[] = [];
  const tracks = data.journey;
  const pageCount = Math.ceil(tracks.length / TRACKS_PER_PAGE);

  for (let page = 0; page < pageCount; page++) {
    const frame = createBaseFrame(`Track List ${page + 1} - ${data.weekOf}`);

    // Title
    const title = createText(
      page === 0 ? "THIS WEEK'S TRACKS" : "TRACKS (continued)",
      28,
      "Bold",
      COLORS.SPOTIFY_GREEN
    );
    title.x = SPACING.LEFT_MARGIN;
    title.y = SPACING.TOP_MARGIN;
    frame.appendChild(title);

    // Tracks
    const startIdx = page * TRACKS_PER_PAGE;
    const endIdx = Math.min(startIdx + TRACKS_PER_PAGE, tracks.length);
    let trackY = 280;

    for (let i = startIdx; i < endIdx; i++) {
      const track = tracks[i];
      const isGem = track.id
        ? data.stats.deepCuts.some((gem) => gem.id === track.id)
        : data.stats.deepCuts.some((gem) => gem.name === track.track);
      const isMostPopular = track.id
        ? data.stats.mostPopular.id === track.id
        : track.track === data.stats.mostPopular.name;

      // Track name
      const trackName = createText(track.track, 40, "Bold");
      trackName.x = SPACING.LEFT_MARGIN;
      trackName.y = trackY;
      frame.appendChild(trackName);

      // Badge (if gem or most popular)
      if (isGem || isMostPopular) {
        const badgeColor = isGem ? COLORS.SPOTIFY_GREEN : COLORS.ORANGE_TOP;
        const badgeText = isGem ? "DEEP CUT" : "TOP";
        const badge = createBadge(badgeText, badgeColor, 20);
        badge.fills = [{ type: "SOLID", color: badgeColor, opacity: 0.2 }];
        // Override text to be Bold for track list badges
        const textChild = badge.children[0] as TextNode;
        textChild.fontName = { family: "Inter", style: "Bold" };
        badge.x = SPACING.LEFT_MARGIN + trackName.width + 30;
        badge.y = trackY + 7;
        frame.appendChild(badge);
      }

      // Artist
      const artist = createText(track.artist, 24, "Regular", COLORS.SPOTIFY_GREEN);
      artist.x = SPACING.LEFT_MARGIN;
      artist.y = trackY + 54;
      frame.appendChild(artist);

      trackY += SPACING.TRACK;
    }

    frames.push(frame);
  }

  return frames;
}

/**
 * Create What You Missed Card (1080x1920) - Spotlight style
 */
export async function createWhatYouMissedCard(data: FullAnalysis): Promise<FrameNode | null> {
  const missed = data.graphics.whatYouMissed;

  if (!missed.available || missed.removedTracks.length === 0) {
    return null;
  }

  const frame = createBaseFrame(`What You Missed - ${data.weekOf}`);
  const track = missed.removedTracks[0];

  // Album art
  const albumArt = await createAlbumArt(track.albumArt, SPACING.LEFT_MARGIN, SPACING.TOP_MARGIN);
  frame.appendChild(albumArt);

  // "WHAT YOU MISSED" label
  const label = createText("WHAT YOU MISSED", 28, "Bold", COLORS.SPOTIFY_GREEN);
  label.x = SPACING.LEFT_MARGIN;
  label.y = 1097;
  frame.appendChild(label);

  // Track name + Artist
  const trackArtistText = createTrackArtistText(track.name, track.artist, SPACING.LEFT_MARGIN, 1137);
  frame.appendChild(trackArtistText);

  // Message badge
  const messageBadge = createBadge("Rotated out from last week", COLORS.SPOTIFY_GREEN, 24);
  messageBadge.name = "Message Badge";
  messageBadge.x = SPACING.LEFT_MARGIN;
  messageBadge.y = trackArtistText.y + trackArtistText.height + SPACING.BADGE_GAP;
  frame.appendChild(messageBadge);

  return frame;
}

// =============================================================================
// Helper: create a rectangle with optional corner radius
// =============================================================================

function createRect(
  width: number,
  height: number,
  color: RGB,
  x: number,
  y: number,
  cornerRadius?: number
): RectangleNode {
  const rect = figma.createRectangle();
  rect.resize(width, height);
  rect.x = x;
  rect.y = y;
  rect.fills = [{ type: "SOLID", color: color }];
  if (cornerRadius !== undefined) {
    rect.cornerRadius = cornerRadius;
  }
  return rect;
}

// =============================================================================
// Helper: discovery score label
// =============================================================================

function discoveryLabel(score: number): string {
  if (score >= 75) {
    return "Very Underground";
  }
  if (score >= 55) {
    return "Underground Leaning";
  }
  if (score >= 40) {
    return "Balanced";
  }
  return "Mainstream";
}

// =============================================================================
// 4.1  Playlist DNA Summary
// =============================================================================

/**
 * Create Playlist DNA summary frame — single-slide weekly overview
 */
export function createPlaylistDnaFrame(data: FullAnalysis): FrameNode {
  const frame = createBaseFrame("Playlist DNA - " + data.weekOf);
  const stats = data.stats;
  let y = 160;

  // Title
  const title = createText("PLAYLIST DNA", 28, "Bold", COLORS.SPOTIFY_GREEN);
  title.x = SPACING.LEFT_MARGIN;
  title.y = y;
  frame.appendChild(title);
  y += 60;

  // Week label
  const weekLabel = createText("Week of " + data.weekOf, 36, "Regular", COLORS.DIMMED);
  weekLabel.x = SPACING.LEFT_MARGIN;
  weekLabel.y = y;
  frame.appendChild(weekLabel);
  y += 90;

  // Big discovery score
  const scoreText = createText(String(stats.discoveryScore.score), 200, "Bold", COLORS.WHITE);
  scoreText.x = SPACING.LEFT_MARGIN;
  scoreText.y = y;
  frame.appendChild(scoreText);

  const scoreLabel = createText(
    discoveryLabel(stats.discoveryScore.score),
    36,
    "Medium",
    COLORS.SPOTIFY_GREEN
  );
  scoreLabel.x = SPACING.LEFT_MARGIN;
  scoreLabel.y = y + 200;
  frame.appendChild(scoreLabel);

  const scoreSublabel = createText("DISCOVERY SCORE", 20, "Regular", COLORS.DIMMED);
  scoreSublabel.x = SPACING.LEFT_MARGIN;
  scoreSublabel.y = y + 248;
  frame.appendChild(scoreSublabel);
  y += 330;

  // Divider line
  const divider1 = createRect(858, 1, COLORS.DIMMED, SPACING.LEFT_MARGIN, y);
  divider1.opacity = 0.25;
  frame.appendChild(divider1);
  y += 40;

  // Stats row: Tracks | Genre | Diversity
  const statItems = [
    { value: String(stats.newTracksCount), label: "TRACKS" },
    { value: stats.genres.primaryGenre, label: "PRIMARY GENRE" },
    { value: String(stats.genres.diversityScore), label: "DIVERSITY" },
  ];

  const colWidth = 286;
  for (let i = 0; i < statItems.length; i++) {
    const item = statItems[i];
    const xPos = SPACING.LEFT_MARGIN + i * colWidth;

    const val = createText(item.value, 44, "Bold", COLORS.WHITE);
    val.x = xPos;
    val.y = y;
    frame.appendChild(val);

    const lbl = createText(item.label, 16, "Regular", COLORS.DIMMED);
    lbl.x = xPos;
    lbl.y = y + 56;
    frame.appendChild(lbl);
  }
  y += 120;

  // Divider
  const divider2 = createRect(858, 1, COLORS.DIMMED, SPACING.LEFT_MARGIN, y);
  divider2.opacity = 0.25;
  frame.appendChild(divider2);
  y += 40;

  // Underground / Mid / Mainstream breakdown
  const ds = stats.discoveryScore;
  const breakdownItems = [
    { value: String(ds.undergroundPicks), label: "UNDERGROUND", color: COLORS.SPOTIFY_GREEN },
    { value: String(ds.midTier), label: "MID-TIER", color: COLORS.ORANGE_TOP },
    { value: String(ds.mainstreamHits), label: "MAINSTREAM", color: COLORS.WHITE },
  ];

  for (let i = 0; i < breakdownItems.length; i++) {
    const item = breakdownItems[i];
    const xPos = SPACING.LEFT_MARGIN + i * colWidth;

    const val = createText(item.value, 44, "Bold", item.color);
    val.x = xPos;
    val.y = y;
    frame.appendChild(val);

    const lbl = createText(item.label, 16, "Regular", COLORS.DIMMED);
    lbl.x = xPos;
    lbl.y = y + 56;
    frame.appendChild(lbl);
  }
  y += 130;

  // Divider
  const divider3 = createRect(858, 1, COLORS.DIMMED, SPACING.LEFT_MARGIN, y);
  divider3.opacity = 0.25;
  frame.appendChild(divider3);
  y += 40;

  // Most Popular
  const popLabel = createText("MOST POPULAR", 16, "Regular", COLORS.DIMMED);
  popLabel.x = SPACING.LEFT_MARGIN;
  popLabel.y = y;
  frame.appendChild(popLabel);

  const popTrack = createText(
    stats.mostPopular.name + " — " + stats.mostPopular.artist,
    32,
    "Bold",
    COLORS.ORANGE_TOP
  );
  popTrack.x = SPACING.LEFT_MARGIN;
  popTrack.y = y + 28;
  popTrack.resize(858, popTrack.height);
  popTrack.textAutoResize = "HEIGHT";
  frame.appendChild(popTrack);
  y += 28 + popTrack.height + 30;

  // Deepest Cut
  const deepest = stats.deepCuts[0];
  if (deepest) {
    const cutLabel = createText("DEEPEST CUT", 16, "Regular", COLORS.DIMMED);
    cutLabel.x = SPACING.LEFT_MARGIN;
    cutLabel.y = y;
    frame.appendChild(cutLabel);

    const cutTrack = createText(
      deepest.name + " — " + deepest.artist + " (pop. " + deepest.popularity + ")",
      32,
      "Bold",
      COLORS.SPOTIFY_GREEN
    );
    cutTrack.x = SPACING.LEFT_MARGIN;
    cutTrack.y = y + 28;
    cutTrack.resize(858, cutTrack.height);
    cutTrack.textAutoResize = "HEIGHT";
    frame.appendChild(cutTrack);
  }

  // Coherence badge at bottom (if available)
  if (data.coherence) {
    const cohBadge = createBadge(
      data.coherence.label + " — " + data.coherence.score + "/100",
      COLORS.SPOTIFY_GREEN,
      24
    );
    cohBadge.x = SPACING.LEFT_MARGIN;
    cohBadge.y = 1780;
    frame.appendChild(cohBadge);
  }

  return frame;
}

// =============================================================================
// 4.2  Genre Breakdown Visual
// =============================================================================

/**
 * Create Genre Breakdown frame — horizontal stacked bar + legend
 */
export function createGenreBreakdownFrame(data: FullAnalysis): FrameNode {
  const frame = createBaseFrame("Genre Breakdown - " + data.weekOf);
  const genres = data.stats.genres.groupedGenres;
  let y = 160;

  // Title
  const title = createText("GENRE BREAKDOWN", 28, "Bold", COLORS.SPOTIFY_GREEN);
  title.x = SPACING.LEFT_MARGIN;
  title.y = y;
  frame.appendChild(title);
  y += 50;

  const weekLabel = createText("Week of " + data.weekOf, 36, "Regular", COLORS.DIMMED);
  weekLabel.x = SPACING.LEFT_MARGIN;
  weekLabel.y = y;
  frame.appendChild(weekLabel);
  y += 100;

  // Primary genre big text
  const primaryText = createText(data.stats.genres.primaryGenre, 100, "Bold", COLORS.WHITE);
  primaryText.x = SPACING.LEFT_MARGIN;
  primaryText.y = y;
  primaryText.resize(858, primaryText.height);
  primaryText.textAutoResize = "HEIGHT";
  frame.appendChild(primaryText);
  y += primaryText.height + 20;

  const multiLabel = data.stats.genres.isMultiGenre ? "Multi-genre mix" : "Focused playlist";
  const multiText = createText(multiLabel, 28, "Regular", COLORS.DIMMED);
  multiText.x = SPACING.LEFT_MARGIN;
  multiText.y = y;
  frame.appendChild(multiText);
  y += 80;

  // Horizontal stacked bar
  const barWidth = 858;
  const barHeight = 40;
  const barX = SPACING.LEFT_MARGIN;
  const barY = y;

  // Background bar with rounded corners
  const bgBar = createRect(barWidth, barHeight, COLORS.PLACEHOLDER, barX, barY, 20);
  frame.appendChild(bgBar);

  // Segments
  let segX = barX;
  for (let i = 0; i < genres.length; i++) {
    const genre = genres[i];
    const segWidth = Math.max(2, Math.round((genre.percentage / 100) * barWidth));
    const color = GENRE_COLORS[i % GENRE_COLORS.length];

    // First segment gets left rounding, last gets right rounding
    const seg = figma.createRectangle();
    seg.resize(segWidth, barHeight);
    seg.x = segX;
    seg.y = barY;
    seg.fills = [{ type: "SOLID", color: color }];

    if (i === 0 && genres.length === 1) {
      seg.cornerRadius = 20;
    } else if (i === 0) {
      seg.topLeftRadius = 20;
      seg.bottomLeftRadius = 20;
      seg.topRightRadius = 0;
      seg.bottomRightRadius = 0;
    } else if (i === genres.length - 1) {
      seg.topLeftRadius = 0;
      seg.bottomLeftRadius = 0;
      seg.topRightRadius = 20;
      seg.bottomRightRadius = 20;
    }

    frame.appendChild(seg);
    segX += segWidth;
  }
  y += barHeight + 50;

  // Legend items
  for (let i = 0; i < genres.length && i < 8; i++) {
    const genre = genres[i];
    const color = GENRE_COLORS[i % GENRE_COLORS.length];

    // Color dot
    const dot = createRect(20, 20, color, SPACING.LEFT_MARGIN, y + 6, 10);
    frame.appendChild(dot);

    // Genre name
    const name = createText(genre.category, 36, "Bold", COLORS.WHITE);
    name.x = SPACING.LEFT_MARGIN + 36;
    name.y = y;
    frame.appendChild(name);

    // Percentage
    const pctText = createText(genre.percentage + "%", 36, "Medium", color);
    pctText.x = SPACING.LEFT_MARGIN + 500;
    pctText.y = y;
    frame.appendChild(pctText);

    // Count
    const countText = createText(genre.count + " tracks", 24, "Regular", COLORS.DIMMED);
    countText.x = SPACING.LEFT_MARGIN + 650;
    countText.y = y + 8;
    frame.appendChild(countText);

    y += 65;
  }

  // Diversity score at bottom
  y += 30;
  const divScoreLabel = createText("DIVERSITY SCORE", 16, "Regular", COLORS.DIMMED);
  divScoreLabel.x = SPACING.LEFT_MARGIN;
  divScoreLabel.y = y;
  frame.appendChild(divScoreLabel);

  const divScore = createText(
    String(data.stats.genres.diversityScore) + " / 100",
    48,
    "Bold",
    COLORS.SPOTIFY_GREEN
  );
  divScore.x = SPACING.LEFT_MARGIN;
  divScore.y = y + 28;
  frame.appendChild(divScore);

  return frame;
}

// =============================================================================
// 4.3  Week-over-Week Trends
// =============================================================================

/**
 * Create Week-over-Week Trends frame (requires trends data from Phase 3)
 */
export function createTrendsFrame(data: FullAnalysis): FrameNode | null {
  if (!data.trends) {
    return null;
  }

  const frame = createBaseFrame("Trends - " + data.weekOf);
  const tr = data.trends;
  let y = 160;

  // Title
  const title = createText("WEEK OVER WEEK", 28, "Bold", COLORS.SPOTIFY_GREEN);
  title.x = SPACING.LEFT_MARGIN;
  title.y = y;
  frame.appendChild(title);
  y += 50;

  const weekLabel = createText("Week of " + data.weekOf, 36, "Regular", COLORS.DIMMED);
  weekLabel.x = SPACING.LEFT_MARGIN;
  weekLabel.y = y;
  frame.appendChild(weekLabel);
  y += 100;

  // Discovery score delta — big number
  const deltaPrefix = tr.discoveryScoreDelta > 0 ? "+" : "";
  const deltaColor =
    tr.discoveryScoreDirection === "deeper"
      ? COLORS.SPOTIFY_GREEN
      : tr.discoveryScoreDirection === "surfacing"
        ? COLORS.ORANGE_TOP
        : COLORS.WHITE;

  const deltaText = createText(
    deltaPrefix + String(tr.discoveryScoreDelta),
    160,
    "Bold",
    deltaColor
  );
  deltaText.x = SPACING.LEFT_MARGIN;
  deltaText.y = y;
  frame.appendChild(deltaText);
  y += 170;

  const dirLabel = createText(
    "DISCOVERY " + tr.discoveryScoreDirection.toUpperCase(),
    28,
    "Medium",
    deltaColor
  );
  dirLabel.x = SPACING.LEFT_MARGIN;
  dirLabel.y = y;
  frame.appendChild(dirLabel);

  const vsPrev = createText("vs. week of " + tr.previousWeek, 20, "Regular", COLORS.DIMMED);
  vsPrev.x = SPACING.LEFT_MARGIN;
  vsPrev.y = y + 40;
  frame.appendChild(vsPrev);
  y += 110;

  // Divider
  const divider1 = createRect(858, 1, COLORS.DIMMED, SPACING.LEFT_MARGIN, y);
  divider1.opacity = 0.25;
  frame.appendChild(divider1);
  y += 40;

  // Genre shifts
  if (tr.genreShifts.length > 0) {
    const shiftTitle = createText("GENRE SHIFTS", 16, "Regular", COLORS.DIMMED);
    shiftTitle.x = SPACING.LEFT_MARGIN;
    shiftTitle.y = y;
    frame.appendChild(shiftTitle);
    y += 35;

    const maxShifts = Math.min(tr.genreShifts.length, 4);
    for (let i = 0; i < maxShifts; i++) {
      const shift = tr.genreShifts[i];
      const shiftColor = shift.delta > 0 ? COLORS.SPOTIFY_GREEN : COLORS.RED_ACCENT;
      const shiftSign = shift.delta > 0 ? "+" : "";

      const shiftText = createText(
        shift.category + "  " + shift.previousPct + "% \u2192 " + shift.currentPct + "%",
        28,
        "Bold",
        COLORS.WHITE
      );
      shiftText.x = SPACING.LEFT_MARGIN;
      shiftText.y = y;
      frame.appendChild(shiftText);

      const deltaBadge = createBadge(shiftSign + shift.delta + "%", shiftColor, 20);
      deltaBadge.x = SPACING.LEFT_MARGIN + shiftText.width + 20;
      deltaBadge.y = y + 2;
      frame.appendChild(deltaBadge);

      y += 55;
    }
    y += 10;
  }

  // Primary genre change
  if (tr.primaryGenreChanged) {
    const genreChangeText = createText(
      "Primary genre changed from " + tr.previousPrimaryGenre,
      24,
      "Medium",
      COLORS.ORANGE_TOP
    );
    genreChangeText.x = SPACING.LEFT_MARGIN;
    genreChangeText.y = y;
    genreChangeText.resize(858, genreChangeText.height);
    genreChangeText.textAutoResize = "HEIGHT";
    frame.appendChild(genreChangeText);
    y += genreChangeText.height + 20;
  }

  // Divider
  const divider2 = createRect(858, 1, COLORS.DIMMED, SPACING.LEFT_MARGIN, y);
  divider2.opacity = 0.25;
  frame.appendChild(divider2);
  y += 40;

  // Deep cut progression
  if (tr.deepCutProgression.length > 0) {
    const dcTitle = createText("DEEP CUT PROGRESSION", 16, "Regular", COLORS.DIMMED);
    dcTitle.x = SPACING.LEFT_MARGIN;
    dcTitle.y = y;
    frame.appendChild(dcTitle);
    y += 35;

    const pops = tr.deepCutProgression.map(function (d) {
      return d.trackName + " (" + d.popularity + ")";
    });
    // Show last 4 max
    const recentPops = pops.slice(-4);
    const dcText = createText(recentPops.join("  \u2192  "), 24, "Bold", COLORS.SPOTIFY_GREEN);
    dcText.x = SPACING.LEFT_MARGIN;
    dcText.y = y;
    dcText.resize(858, dcText.height);
    dcText.textAutoResize = "HEIGHT";
    frame.appendChild(dcText);
    y += dcText.height + 40;
  }

  // Insights at bottom (show multiple if available)
  var insightsY = Math.max(y, 1500);
  var insightsList = tr.insights && tr.insights.length > 0 ? tr.insights : [tr.insight];
  var maxInsights = Math.min(insightsList.length, 3);
  for (var ii = 0; ii < maxInsights; ii++) {
    var insightText = createText(insightsList[ii], 28, "Medium", COLORS.WHITE);
    insightText.x = SPACING.LEFT_MARGIN;
    insightText.y = insightsY;
    insightText.resize(858, insightText.height);
    insightText.textAutoResize = "HEIGHT";
    frame.appendChild(insightText);
    insightsY += insightText.height + 15;
  }

  return frame;
}

// =============================================================================
// 4.4  Artist Spotlight
// =============================================================================

/**
 * Create Artist Spotlight frame (requires artistLoyalty data from Phase 3)
 */
export function createArtistSpotlightFrame(data: FullAnalysis): FrameNode | null {
  if (!data.artistLoyalty) {
    return null;
  }

  const frame = createBaseFrame("Artist Spotlight - " + data.weekOf);
  const al = data.artistLoyalty;
  let y = 160;

  // Title
  const title = createText("ARTIST SPOTLIGHT", 28, "Bold", COLORS.SPOTIFY_GREEN);
  title.x = SPACING.LEFT_MARGIN;
  title.y = y;
  frame.appendChild(title);
  y += 50;

  const weekLabel = createText("Week of " + data.weekOf, 36, "Regular", COLORS.DIMMED);
  weekLabel.x = SPACING.LEFT_MARGIN;
  weekLabel.y = y;
  frame.appendChild(weekLabel);
  y += 100;

  // Current obsession (big highlight)
  if (al.currentObsession) {
    const obsLabel = createText("CURRENT OBSESSION", 16, "Regular", COLORS.ORANGE_TOP);
    obsLabel.x = SPACING.LEFT_MARGIN;
    obsLabel.y = y;
    frame.appendChild(obsLabel);
    y += 30;

    const obsName = createText(al.currentObsession.name, 72, "Bold", COLORS.ORANGE_TOP);
    obsName.x = SPACING.LEFT_MARGIN;
    obsName.y = y;
    obsName.resize(858, obsName.height);
    obsName.textAutoResize = "HEIGHT";
    frame.appendChild(obsName);
    y += obsName.height + 10;

    const obsNarr = createText(al.currentObsession.narrative, 24, "Regular", COLORS.DIMMED);
    obsNarr.x = SPACING.LEFT_MARGIN;
    obsNarr.y = y;
    obsNarr.resize(858, obsNarr.height);
    obsNarr.textAutoResize = "HEIGHT";
    frame.appendChild(obsNarr);
    y += obsNarr.height + 50;
  }

  // Divider
  const divider1 = createRect(858, 1, COLORS.DIMMED, SPACING.LEFT_MARGIN, y);
  divider1.opacity = 0.25;
  frame.appendChild(divider1);
  y += 40;

  // Loyal artists
  if (al.loyalArtists.length > 0) {
    const loyalLabel = createText("LOYAL ARTISTS", 16, "Regular", COLORS.SPOTIFY_GREEN);
    loyalLabel.x = SPACING.LEFT_MARGIN;
    loyalLabel.y = y;
    frame.appendChild(loyalLabel);
    y += 35;

    const maxLoyal = Math.min(al.loyalArtists.length, 5);
    for (let i = 0; i < maxLoyal; i++) {
      const artist = al.loyalArtists[i];

      const nameText = createText(artist.name, 36, "Bold", COLORS.WHITE);
      nameText.x = SPACING.LEFT_MARGIN;
      nameText.y = y;
      frame.appendChild(nameText);

      const narrText = createText(artist.narrative, 20, "Regular", COLORS.DIMMED);
      narrText.x = SPACING.LEFT_MARGIN;
      narrText.y = y + 44;
      narrText.resize(858, narrText.height);
      narrText.textAutoResize = "HEIGHT";
      frame.appendChild(narrText);

      y += 44 + narrText.height + 20;
    }
    y += 20;
  }

  // Divider
  const divider2 = createRect(858, 1, COLORS.DIMMED, SPACING.LEFT_MARGIN, y);
  divider2.opacity = 0.25;
  frame.appendChild(divider2);
  y += 40;

  // One-week wonders
  if (al.oneWeekWonders.length > 0) {
    const wwLabel = createText("ONE-WEEK WONDERS", 16, "Regular", COLORS.BLUE_ACCENT);
    wwLabel.x = SPACING.LEFT_MARGIN;
    wwLabel.y = y;
    frame.appendChild(wwLabel);
    y += 35;

    const maxWonders = Math.min(al.oneWeekWonders.length, 3);
    for (let i = 0; i < maxWonders; i++) {
      const artist = al.oneWeekWonders[i];
      const wwText = createText(
        artist.name + " — " + artist.narrative,
        24,
        "Regular",
        COLORS.WHITE
      );
      wwText.x = SPACING.LEFT_MARGIN;
      wwText.y = y;
      wwText.resize(858, wwText.height);
      wwText.textAutoResize = "HEIGHT";
      frame.appendChild(wwText);
      y += wwText.height + 15;
    }
    y += 20;
  }

  // Comeback artists
  if (al.comebackArtists.length > 0) {
    const cbLabel = createText("COMEBACK ARTISTS", 16, "Regular", COLORS.RED_ACCENT);
    cbLabel.x = SPACING.LEFT_MARGIN;
    cbLabel.y = y;
    frame.appendChild(cbLabel);
    y += 35;

    const maxComebacks = Math.min(al.comebackArtists.length, 3);
    for (let i = 0; i < maxComebacks; i++) {
      const artist = al.comebackArtists[i];
      const cbText = createText(
        artist.name + " — " + artist.narrative,
        24,
        "Regular",
        COLORS.WHITE
      );
      cbText.x = SPACING.LEFT_MARGIN;
      cbText.y = y;
      cbText.resize(858, cbText.height);
      cbText.textAutoResize = "HEIGHT";
      frame.appendChild(cbText);
      y += cbText.height + 15;
    }
  }

  return frame;
}

// =============================================================================
// 4.5  Fresh Releases
// =============================================================================

/**
 * Create Fresh Releases frame (requires freshness data from Phase 3)
 */
export function createFreshReleasesFrame(data: FullAnalysis): FrameNode | null {
  if (!data.freshness || data.freshness.freshCount === 0) {
    return null;
  }

  const frame = createBaseFrame("Fresh Releases - " + data.weekOf);
  const fr = data.freshness;
  let y = 160;

  // Title
  const title = createText("FRESH RELEASES", 28, "Bold", COLORS.SPOTIFY_GREEN);
  title.x = SPACING.LEFT_MARGIN;
  title.y = y;
  frame.appendChild(title);
  y += 50;

  const weekLabel = createText("Week of " + data.weekOf, 36, "Regular", COLORS.DIMMED);
  weekLabel.x = SPACING.LEFT_MARGIN;
  weekLabel.y = y;
  frame.appendChild(weekLabel);
  y += 100;

  // Big stat: X of Y
  const bigStat = createText(
    String(fr.freshCount) + " / " + String(fr.totalTracks),
    160,
    "Bold",
    COLORS.SPOTIFY_GREEN
  );
  bigStat.x = SPACING.LEFT_MARGIN;
  bigStat.y = y;
  frame.appendChild(bigStat);
  y += 170;

  const freshLabel = createText("TRACKS ARE FRESH RELEASES", 24, "Medium", COLORS.DIMMED);
  freshLabel.x = SPACING.LEFT_MARGIN;
  freshLabel.y = y;
  frame.appendChild(freshLabel);
  y += 30;

  // Label badge
  const labelBadge = createBadge(fr.label, COLORS.SPOTIFY_GREEN, 24);
  labelBadge.x = SPACING.LEFT_MARGIN;
  labelBadge.y = y;
  frame.appendChild(labelBadge);
  y += 80;

  // Divider
  const divider = createRect(858, 1, COLORS.DIMMED, SPACING.LEFT_MARGIN, y);
  divider.opacity = 0.25;
  frame.appendChild(divider);
  y += 40;

  // List of fresh releases
  var maxReleases = Math.min(fr.freshReleases.length, 8);
  for (var ri = 0; ri < maxReleases; ri++) {
    var track = fr.freshReleases[ri];

    var trackText = createText(track.name, 32, "Bold", COLORS.WHITE);
    trackText.x = SPACING.LEFT_MARGIN;
    trackText.y = y;
    frame.appendChild(trackText);

    // Tier badge (if available)
    if (track.tier) {
      var tierColor =
        track.tier === "day-one"
          ? COLORS.SPOTIFY_GREEN
          : track.tier === "early-bird"
            ? COLORS.ORANGE_TOP
            : COLORS.DIMMED;
      var tierBadge = createBadge(track.tier.toUpperCase(), tierColor, 18);
      tierBadge.x = SPACING.LEFT_MARGIN + trackText.width + 20;
      tierBadge.y = y + 5;
      frame.appendChild(tierBadge);
    }

    var artistText = createText(track.artist, 22, "Regular", COLORS.SPOTIFY_GREEN);
    artistText.x = SPACING.LEFT_MARGIN;
    artistText.y = y + 40;
    frame.appendChild(artistText);

    var ageText = createText(track.daysOld + " days old", 22, "Regular", COLORS.DIMMED);
    ageText.x = SPACING.LEFT_MARGIN + 500;
    ageText.y = y + 40;
    frame.appendChild(ageText);

    y += 90;
  }

  return frame;
}

// =============================================================================
// 4.6  Listener DNA (Personality Profile)
// =============================================================================

/**
 * Create Listener DNA frame (requires personality data from Phase D)
 */
export function createPersonalityFrame(data: FullAnalysis): FrameNode | null {
  if (!data.personality) {
    return null;
  }

  var frame = createBaseFrame("Listener DNA - " + data.weekOf);
  var p = data.personality;
  var y = 160;

  // Title
  var title = createText("LISTENER DNA", 28, "Bold", COLORS.SPOTIFY_GREEN);
  title.x = SPACING.LEFT_MARGIN;
  title.y = y;
  frame.appendChild(title);
  y += 50;

  var weekLabel = createText("Week of " + data.weekOf, 36, "Regular", COLORS.DIMMED);
  weekLabel.x = SPACING.LEFT_MARGIN;
  weekLabel.y = y;
  frame.appendChild(weekLabel);
  y += 100;

  // Big archetype label
  var archetypeText = createText(p.listenerArchetype, 72, "Bold", COLORS.WHITE);
  archetypeText.x = SPACING.LEFT_MARGIN;
  archetypeText.y = y;
  archetypeText.resize(858, archetypeText.height);
  archetypeText.textAutoResize = "HEIGHT";
  frame.appendChild(archetypeText);
  y += archetypeText.height + 40;

  // Divider
  var divider1 = createRect(858, 1, COLORS.DIMMED, SPACING.LEFT_MARGIN, y);
  divider1.opacity = 0.25;
  frame.appendChild(divider1);
  y += 40;

  // Stats grid: Discovery Score | Genre Fluidity | Rotation Rate
  var colWidth = 286;
  var gridItems = [
    { value: String(p.averageDiscoveryScore), label: "AVG DISCOVERY", color: COLORS.SPOTIFY_GREEN },
    { value: String(p.genreFluidity) + "%", label: "GENRE FLUIDITY", color: COLORS.ORANGE_TOP },
    { value: String(p.averageRotationRate) + "%", label: "ROTATION RATE", color: COLORS.WHITE },
  ];

  for (var gi = 0; gi < gridItems.length; gi++) {
    var item = gridItems[gi];
    var xPos = SPACING.LEFT_MARGIN + gi * colWidth;

    var val = createText(item.value, 48, "Bold", item.color);
    val.x = xPos;
    val.y = y;
    frame.appendChild(val);

    var lbl = createText(item.label, 16, "Regular", COLORS.DIMMED);
    lbl.x = xPos;
    lbl.y = y + 60;
    frame.appendChild(lbl);
  }
  y += 110;

  // Divider
  var divider2 = createRect(858, 1, COLORS.DIMMED, SPACING.LEFT_MARGIN, y);
  divider2.opacity = 0.25;
  frame.appendChild(divider2);
  y += 40;

  // Dominant genre + discovery trend
  var genreLabel = createText("DOMINANT GENRE", 16, "Regular", COLORS.DIMMED);
  genreLabel.x = SPACING.LEFT_MARGIN;
  genreLabel.y = y;
  frame.appendChild(genreLabel);

  var genreVal = createText(p.dominantGenre, 44, "Bold", COLORS.WHITE);
  genreVal.x = SPACING.LEFT_MARGIN;
  genreVal.y = y + 28;
  frame.appendChild(genreVal);

  var trendLabel = createText("DISCOVERY TREND", 16, "Regular", COLORS.DIMMED);
  trendLabel.x = SPACING.LEFT_MARGIN + 430;
  trendLabel.y = y;
  frame.appendChild(trendLabel);

  var trendColor =
    p.discoveryTrend === "going deeper"
      ? COLORS.SPOTIFY_GREEN
      : p.discoveryTrend === "going mainstream"
        ? COLORS.ORANGE_TOP
        : COLORS.WHITE;
  var trendVal = createText(p.discoveryTrend, 44, "Bold", trendColor);
  trendVal.x = SPACING.LEFT_MARGIN + 430;
  trendVal.y = y + 28;
  frame.appendChild(trendVal);
  y += 110;

  // Divider
  var divider3 = createRect(858, 1, COLORS.DIMMED, SPACING.LEFT_MARGIN, y);
  divider3.opacity = 0.25;
  frame.appendChild(divider3);
  y += 40;

  // Signature artists
  if (p.signatureArtists.length > 0) {
    var sigLabel = createText("SIGNATURE ARTISTS", 16, "Regular", COLORS.SPOTIFY_GREEN);
    sigLabel.x = SPACING.LEFT_MARGIN;
    sigLabel.y = y;
    frame.appendChild(sigLabel);
    y += 35;

    var maxSig = Math.min(p.signatureArtists.length, 5);
    for (var si = 0; si < maxSig; si++) {
      var sigText = createText(p.signatureArtists[si], 36, "Bold", COLORS.WHITE);
      sigText.x = SPACING.LEFT_MARGIN;
      sigText.y = y;
      frame.appendChild(sigText);
      y += 55;
    }
    y += 20;
  }

  // Summary at bottom
  var summaryText = createText(p.summary, 28, "Medium", COLORS.DIMMED);
  summaryText.x = SPACING.LEFT_MARGIN;
  summaryText.y = Math.max(y, 1650);
  summaryText.resize(858, summaryText.height);
  summaryText.textAutoResize = "HEIGHT";
  frame.appendChild(summaryText);

  return frame;
}

/**
 * Draw a 1px horizontal rule across the content width
 */
function createRowDivider(y: number): LineNode {
  var line = figma.createLine();
  var contentWidth = FRAME.WIDTH - COMPACT_LAYOUT.LEFT_MARGIN - COMPACT_LAYOUT.RIGHT_MARGIN;
  line.resize(contentWidth, 0);
  line.x = COMPACT_LAYOUT.LEFT_MARGIN;
  line.y = y;
  line.strokes = [{ type: "SOLID", color: COLORS.DIMMED, opacity: 0.32 }];
  line.strokeWeight = 1;
  return line;
}

/**
 * Create Compact Tracklist frames — table layout with fixed columns and row dividers
 */
export async function createCompactTracklist(data: FullAnalysis, spotifyCodeBytes: Uint8Array | null): Promise<FrameNode[]> {
  var frames: FrameNode[] = [];
  var tracks = data.journey;
  var pageCount = Math.ceil(tracks.length / COMPACT_LAYOUT.TRACKS_PER_PAGE);

  // Column x positions
  var xNum = COMPACT_LAYOUT.LEFT_MARGIN;
  var xTrack = COMPACT_LAYOUT.LEFT_MARGIN + COMPACT_LAYOUT.NUMBER_COL_WIDTH;
  var xArtist = FRAME.WIDTH - COMPACT_LAYOUT.RIGHT_MARGIN - COMPACT_LAYOUT.ARTIST_COL_WIDTH;
  var trackColWidth = xArtist - xTrack - 24; // gap before artist column

  for (var page = 0; page < pageCount; page++) {
    var frame = createBaseFrame("Compact Tracklist " + (page + 1) + " - " + data.weekOf);

    // ── Header ──────────────────────────────────────────────
    var title = createText("THIS WEEK'S TRACKS", COMPACT_LAYOUT.TITLE_FONT_SIZE, "Bold", COLORS.SPOTIFY_GREEN);
    title.x = xNum;
    title.y = 56;
    frame.appendChild(title);

    // Pagination — right-aligned below date, only when multi-page
    if (pageCount > 1) {
      var pageText = createText(
        (page + 1) + "/" + pageCount,
        18,
        "Regular",
        COLORS.DIMMED
      );
      pageText.x = FRAME.WIDTH - COMPACT_LAYOUT.RIGHT_MARGIN - pageText.width;
      pageText.y = 88;
      frame.appendChild(pageText);
    }

    // Heavy divider below header
    var headerRule = figma.createLine();
    headerRule.resize(FRAME.WIDTH - COMPACT_LAYOUT.LEFT_MARGIN - COMPACT_LAYOUT.RIGHT_MARGIN, 0);
    headerRule.x = xNum;
    headerRule.y = COMPACT_LAYOUT.HEADER_HEIGHT;
    headerRule.strokes = [{ type: "SOLID", color: COLORS.DIMMED, opacity: 0.6 }];
    headerRule.strokeWeight = 2;
    frame.appendChild(headerRule);

    // ── Track rows (dynamic height — wraps long names) ───────
    var startIdx = page * COMPACT_LAYOUT.TRACKS_PER_PAGE;
    var endIdx = Math.min(startIdx + COMPACT_LAYOUT.TRACKS_PER_PAGE, tracks.length);
    var rowY = COMPACT_LAYOUT.HEADER_HEIGHT;

    for (var i = startIdx; i < endIdx; i++) {
      var track = tracks[i];
      var pad = COMPACT_LAYOUT.ROW_PADDING;

      // Row divider at top (skip first row — uses heavy header rule)
      if (i !== startIdx) {
        frame.appendChild(createRowDivider(rowY));
      }

      // Track name — fixed width, auto height so it wraps naturally
      var nameText = createText(track.track, COMPACT_LAYOUT.TRACK_FONT_SIZE, "Bold", COLORS.WHITE);
      nameText.x = xTrack;
      nameText.y = rowY + pad;
      nameText.resize(trackColWidth, nameText.height);
      nameText.textAutoResize = "HEIGHT";
      frame.appendChild(nameText);

      // Artist — fixed width, auto height so it wraps too
      var artistText = createText(
        track.artist,
        COMPACT_LAYOUT.ARTIST_FONT_SIZE,
        "Regular",
        COLORS.SPOTIFY_GREEN
      );
      artistText.x = xArtist;
      artistText.y = rowY + pad;
      artistText.resize(COMPACT_LAYOUT.ARTIST_COL_WIDTH, artistText.height);
      artistText.textAutoResize = "HEIGHT";
      frame.appendChild(artistText);

      // Row height driven by tallest column — so wrapped artist gets breathing room
      var rowH = Math.max(nameText.height, artistText.height) + 2 * pad;
      if (rowH < COMPACT_LAYOUT.MIN_ROW_HEIGHT) {
        rowH = COMPACT_LAYOUT.MIN_ROW_HEIGHT;
      }

      // Alternating row background (even rows get a subtle tint), sized to actual row height
      if ((i - startIdx) % 2 === 0) {
        var rowBg = figma.createRectangle();
        rowBg.x = COMPACT_LAYOUT.LEFT_MARGIN;
        rowBg.y = rowY;
        rowBg.resize(FRAME.WIDTH - COMPACT_LAYOUT.LEFT_MARGIN - COMPACT_LAYOUT.RIGHT_MARGIN, rowH);
        rowBg.fills = [{ type: "SOLID", color: COLORS.WHITE, opacity: 0.04 }];
        // Insert behind the text nodes for this row
        var nameIdx = frame.children.indexOf(nameText);
        frame.insertChild(nameIdx, rowBg);
      }

      // Number — right-aligned within the number column so periods stack
      var numText = createText(
        String(track.position) + ".",
        COMPACT_LAYOUT.TRACK_FONT_SIZE,
        "Regular",
        COLORS.DIMMED
      );
      numText.x = xNum;
      numText.y = rowY + pad;
      numText.resize(COMPACT_LAYOUT.NUMBER_COL_WIDTH - 16, numText.height);
      numText.textAutoResize = "HEIGHT";
      numText.textAlignHorizontal = "RIGHT";
      frame.appendChild(numText);

      rowY += rowH;
    }

    // Bottom rule after last row
    var bottomRule = createRowDivider(rowY);
    bottomRule.strokes = [{ type: "SOLID", color: COLORS.DIMMED, opacity: 0.6 }];
    bottomRule.strokeWeight = 2;
    frame.appendChild(bottomRule);

    // ── Footer: Spotify Code + "Scan to listen" caption ───────
    if (spotifyCodeBytes) {
      var footerCodeH = 110;
      var footerCodeW = footerCodeH * 4;
      var footerCodeY = rowY + 80;

      var footerCode = figma.createRectangle();
      footerCode.resize(footerCodeW, footerCodeH);
      footerCode.x = Math.round((FRAME.WIDTH - footerCodeW) / 2);
      footerCode.y = footerCodeY;
      var footerImg = figma.createImage(spotifyCodeBytes);
      footerCode.fills = [{ type: "IMAGE", imageHash: footerImg.hash, scaleMode: "FIT" }];
      frame.appendChild(footerCode);

      var caption = createText("Scan to listen on Spotify", 18, "Regular", COLORS.DIMMED);
      caption.x = Math.round((FRAME.WIDTH - caption.width) / 2);
      caption.y = footerCodeY + footerCodeH + 16;
      frame.appendChild(caption);
    }

    frames.push(frame);
  }

  return frames;
}
