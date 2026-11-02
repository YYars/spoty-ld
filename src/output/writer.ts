import * as fs from "fs";
import * as path from "path";
import type { FullAnalysis } from "../spotify/types.js";

const DATA_DIR = path.join(process.cwd(), "data", "history");

/**
 * Ensure the data directory exists
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

/**
 * Save the analysis to a JSON file
 */
export function saveAnalysis(analysis: FullAnalysis): string {
  ensureDataDir();

  const filename = `${analysis.weekOf}.json`;
  const filepath = path.join(DATA_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(analysis, null, 2));

  return filepath;
}

/**
 * Print a summary to the console
 */
export function printSummary(analysis: FullAnalysis): void {
  const { stats } = analysis;

  console.log("\n" + "=".repeat(50));
  console.log(`PLAYLIST ANALYSIS - Week of ${stats.weekOf}`);
  console.log("=".repeat(50));

  console.log(`\nNew tracks this week: ${stats.newTracksCount}`);

  // Genre Analysis
  const g = stats.genres;
  console.log(`\nGenre: ${g.primaryGenre}${g.isMultiGenre ? " (multi-genre mix)" : ""}`);
  if (g.groupedGenres.length > 0) {
    const breakdown = g.groupedGenres
      .slice(0, 4)
      .map((gg) => `${gg.category} ${gg.percentage}%`)
      .join(" | ");
    console.log(`  Breakdown: ${breakdown}`);
  }
  console.log(`  Diversity score: ${g.diversityScore}/100`);

  // Discovery Score
  const ds = stats.discoveryScore;
  console.log(`\nDiscovery Score: ${ds.score}/100`);
  console.log(
    `  Underground: ${ds.undergroundPicks} | Mid-tier: ${ds.midTier} | Mainstream: ${ds.mainstreamHits}`
  );

  console.log(`\nMost Popular: "${stats.mostPopular.name}"`);
  console.log(`  by ${stats.mostPopular.artist} (popularity: ${stats.mostPopular.popularity})`);

  console.log(`\nDeep Cuts (${stats.deepCuts.length}):`);
  stats.deepCuts.forEach((gem, idx) => {
    const marker = idx === 0 ? "* " : "  ";
    console.log(`  ${marker}"${gem.name}" by ${gem.artist} (popularity: ${gem.popularity})`);
  });

  if (stats.lastWeekGem) {
    console.log(`\nLast Week's Gem: "${stats.lastWeekGem.name}"`);
    console.log(`  by ${stats.lastWeekGem.artist} (popularity: ${stats.lastWeekGem.popularity})`);
  }

  // Artist Diversity
  const ad = stats.artistDiversity;
  console.log(`\nArtist Diversity:`);
  console.log(`  Unique artists: ${ad.uniqueArtists}`);
  console.log(
    `  Artist popularity range: ${ad.artistPopularitySpread.min} - ${ad.artistPopularitySpread.max} (avg: ${ad.artistPopularitySpread.average})`
  );
  if (ad.repeatArtists.length > 0) {
    console.log(`  Repeat artists: ${ad.repeatArtists.join(", ")}`);
  }

  // Graphics Data Summary
  console.log("\n" + "-".repeat(50));
  console.log("GRAPHICS-READY DATA");
  console.log("-".repeat(50));

  const gfx = analysis.graphics;

  // Deep Cut
  console.log("\n[Deep Cut Spotlight]");
  console.log(`  "${gfx.deepCut.track.name}" by ${gfx.deepCut.track.artist}`);
  console.log(`  ${gfx.deepCut.discoveryStat}`);
  if (gfx.deepCut.track.albumArt) {
    console.log(`  Art: ${gfx.deepCut.track.albumArt}`);
  }

  // What You Missed
  console.log("\n[What You Missed]");
  if (gfx.whatYouMissed.available) {
    console.log(`  ${gfx.whatYouMissed.message}`);
    if (gfx.whatYouMissed.removedTracks.length > 0) {
      gfx.whatYouMissed.removedTracks.forEach((t) => {
        console.log(`  - "${t.name}" by ${t.artist}`);
      });
    }
  } else {
    console.log(`  ${gfx.whatYouMissed.message}`);
  }

  // Trends
  if (analysis.trends) {
    console.log("\n" + "-".repeat(50));
    console.log("WEEK-OVER-WEEK TRENDS");
    console.log("-".repeat(50));

    const tr = analysis.trends;
    const arrow = tr.discoveryScoreDelta > 0 ? "↑" : tr.discoveryScoreDelta < 0 ? "↓" : "→";
    console.log(
      `\nDiscovery: ${arrow} ${tr.discoveryScoreDelta > 0 ? "+" : ""}${tr.discoveryScoreDelta} (${tr.discoveryScoreDirection})`
    );

    if (tr.primaryGenreChanged) {
      console.log(`  Genre shift: ${tr.previousPrimaryGenre} → current`);
    }

    if (tr.genreShifts.length > 0) {
      console.log("  Genre shifts:");
      tr.genreShifts.slice(0, 3).forEach((s) => {
        const dir = s.delta > 0 ? "+" : "";
        console.log(`    ${s.category}: ${s.previousPct}% → ${s.currentPct}% (${dir}${s.delta})`);
      });
    }

    if (tr.deepCutProgression.length > 0) {
      const pops = tr.deepCutProgression.map((d) => `${d.popularity}%`).join(" → ");
      console.log(`  Deep cut progression: ${pops}`);
    }

    if (tr.insights && tr.insights.length > 1) {
      console.log("\n  💡 Insights:");
      tr.insights.forEach((ins, idx) => {
        console.log(`    ${idx + 1}. ${ins}`);
      });
    } else {
      console.log(`\n  💡 ${tr.insight}`);
    }
  }

  // Artist Loyalty
  if (analysis.artistLoyalty) {
    console.log("\n" + "-".repeat(50));
    console.log("ARTIST LOYALTY");
    console.log("-".repeat(50));

    const al = analysis.artistLoyalty;

    if (al.currentObsession) {
      console.log(`\n  🔥 Current obsession: ${al.currentObsession.name}`);
      console.log(`     ${al.currentObsession.narrative}`);
    }

    if (al.loyalArtists.length > 0) {
      console.log("\n  Loyal artists:");
      al.loyalArtists.slice(0, 5).forEach((a) => {
        console.log(`    ${a.name}: ${a.narrative}`);
      });
    }

    if (al.oneWeekWonders.length > 0) {
      console.log("\n  One-week wonders:");
      al.oneWeekWonders.slice(0, 3).forEach((a) => {
        console.log(`    ${a.name}: ${a.narrative}`);
      });
    }

    if (al.comebackArtists.length > 0) {
      console.log("\n  Comeback artists:");
      al.comebackArtists.slice(0, 3).forEach((a) => {
        console.log(`    ${a.name}: ${a.narrative}`);
      });
    }
  }

  // Freshness
  if (analysis.freshness) {
    console.log("\n" + "-".repeat(50));
    console.log("FRESH RELEASES");
    console.log("-".repeat(50));

    const fr = analysis.freshness;
    console.log(`\n  ${fr.label}`);

    if (fr.tierBreakdown) {
      const tb = fr.tierBreakdown;
      console.log(
        `  Tiers: Day-one: ${tb.dayOne} | Early-bird: ${tb.earlyBird} | Fresh-catch: ${tb.freshCatch}`
      );
    }

    if (fr.freshReleases.length > 0) {
      fr.freshReleases.forEach((t) => {
        const tierTag = t.tier ? ` [${t.tier}]` : "";
        console.log(`    "${t.name}" by ${t.artist} (${t.daysOld} days old${tierTag})`);
      });
    }
  }

  // Coherence
  if (analysis.coherence) {
    console.log("\n" + "-".repeat(50));
    console.log("PLAYLIST COHERENCE");
    console.log("-".repeat(50));

    const co = analysis.coherence;
    console.log(`\n  Score: ${co.score}/100 — ${co.label}`);
    console.log(`  Top genre concentration: ${co.genreConcentration}%`);
    console.log(`  Popularity variance: ${co.popularityVariance}`);
  }

  // Personality Profile
  if (analysis.personality) {
    console.log("\n" + "-".repeat(50));
    console.log("LISTENER DNA");
    console.log("-".repeat(50));

    const p = analysis.personality;
    console.log(`\n  Archetype: ${p.listenerArchetype}`);
    console.log(`  Average discovery score: ${p.averageDiscoveryScore}`);
    console.log(`  Discovery trend: ${p.discoveryTrend}`);
    console.log(`  Dominant genre: ${p.dominantGenre}`);
    console.log(`  Genre fluidity: ${p.genreFluidity}/100`);
    console.log(`  Rotation rate: ${p.averageRotationRate}%`);
    if (p.signatureArtists.length > 0) {
      console.log(`  Signature artists: ${p.signatureArtists.join(", ")}`);
    }
    console.log(`\n  ${p.summary}`);
  }

  console.log("\n" + "=".repeat(50) + "\n");
}
