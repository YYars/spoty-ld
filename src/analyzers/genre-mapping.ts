/**
 * Genre mapping data - maps Spotify's granular genres to broader categories
 */

/**
 * Genre category type
 */
export type GenreCategory =
  | "Hip-Hop"
  | "Electronic"
  | "R&B / Soul"
  | "Pop"
  | "Rock"
  | "Jazz"
  | "Folk / Acoustic"
  | "World"
  | "Classical"
  | "Experimental";

/**
 * Parent genre categories with keywords that match them
 * Frozen for immutability
 */
export const GENRE_GROUPS: Readonly<Record<GenreCategory, readonly string[]>> = Object.freeze({
  "Hip-Hop": Object.freeze([
    "hip hop",
    "hip-hop",
    "rap",
    "trap",
    "boom bap",
    "drill",
    "grime",
    "gangsta",
    "conscious hip hop",
    "crunk",
    "mumble",
    "cloud rap",
    "underground hip hop",
    "experimental hip hop",
    "alternative hip hop",
    "east coast",
    "west coast",
    "southern hip hop",
    "dirty south",
    "chopped and screwed",
    "phonk",
  ]),
  Electronic: Object.freeze([
    "electronic",
    "edm",
    "house",
    "techno",
    "trance",
    "dubstep",
    "drum and bass",
    "dnb",
    "ambient",
    "idm",
    "synth",
    "electro",
    "breakbeat",
    "garage",
    "uk garage",
    "jungle",
    "hardstyle",
    "downtempo",
    "chillwave",
    "synthwave",
    "future bass",
    "bass music",
    "glitch",
  ]),
  "R&B / Soul": Object.freeze([
    "r&b",
    "rnb",
    "soul",
    "neo soul",
    "neo-soul",
    "motown",
    "funk",
    "contemporary r&b",
    "urban contemporary",
    "quiet storm",
    "new jack swing",
  ]),
  Pop: Object.freeze([
    "pop",
    "synth-pop",
    "synthpop",
    "electropop",
    "indie pop",
    "art pop",
    "dream pop",
    "chamber pop",
    "baroque pop",
    "power pop",
    "teen pop",
    "k-pop",
    "j-pop",
    "c-pop",
    "europop",
    "dance pop",
  ]),
  Rock: Object.freeze([
    "rock",
    "alternative",
    "indie rock",
    "punk",
    "grunge",
    "metal",
    "hard rock",
    "classic rock",
    "progressive rock",
    "post-rock",
    "shoegaze",
    "post-punk",
    "new wave",
    "garage rock",
    "psychedelic",
  ]),
  Jazz: Object.freeze([
    "jazz",
    "bebop",
    "swing",
    "fusion",
    "smooth jazz",
    "free jazz",
    "acid jazz",
    "nu jazz",
    "soul jazz",
    "contemporary jazz",
    "big band",
  ]),
  "Folk / Acoustic": Object.freeze([
    "folk",
    "acoustic",
    "singer-songwriter",
    "americana",
    "country",
    "bluegrass",
    "indie folk",
    "freak folk",
    "traditional",
  ]),
  World: Object.freeze([
    "afrobeat",
    "afrobeats",
    "reggae",
    "dancehall",
    "dub",
    "latin",
    "bossa nova",
    "samba",
    "flamenco",
    "cumbia",
    "reggaeton",
    "dembow",
    "afro",
    "world",
    "ethnic",
    "tribal",
  ]),
  Classical: Object.freeze([
    "classical",
    "orchestra",
    "symphony",
    "chamber",
    "baroque",
    "romantic",
    "contemporary classical",
    "minimalism",
    "neoclassical",
    "opera",
  ]),
  Experimental: Object.freeze([
    "experimental",
    "avant-garde",
    "noise",
    "industrial",
    "art",
    "abstract",
    "sound art",
    "musique concrete",
  ]),
});

/**
 * Get all genre categories
 */
export const getGenreCategories = (): readonly GenreCategory[] =>
  Object.keys(GENRE_GROUPS) as GenreCategory[];

/**
 * Max entropy for diversity calculation (log2 of number of categories)
 */
export const MAX_ENTROPY = Math.log2(Object.keys(GENRE_GROUPS).length);
