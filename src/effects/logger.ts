/**
 * Logger interface for dependency injection
 * Allows separating side effects (console output) from pure business logic
 */

/**
 * Logger interface
 */
export interface Logger {
  readonly info: (message: string) => void;
  readonly warn: (message: string) => void;
  readonly error: (message: string) => void;
  readonly separator: (char?: string, length?: number) => void;
  readonly debug: (label: string, items: readonly unknown[]) => void;
}

/**
 * Create console logger (for production use)
 */
export const createConsoleLogger = (): Logger => ({
  info: (message) => console.log(message),
  warn: (message) => console.warn(message),
  error: (message) => console.error(message),
  separator: (char = "=", length = 50) => console.log(char.repeat(length)),
  debug: (label, items) => {
    console.log(`\n${label}:`);
    items.slice(0, 5).forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${String(item)}`);
    });
  },
});

/**
 * Create silent logger (for testing)
 */
export const createSilentLogger = (): Logger => ({
  info: () => {},
  warn: () => {},
  error: () => {},
  separator: () => {},
  debug: () => {},
});

/**
 * Format track for debug output
 */
export const formatTrackForLog = (track: {
  readonly track: { readonly name: string; readonly artists: readonly { readonly name: string }[] };
  readonly added_at: string;
}): string =>
  `${track.track.name} - ${track.track.artists[0]?.name ?? "Unknown"} (added: ${track.added_at})`;
