import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2015,
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // Figma plugin sandbox compatibility rules
      // These features are not supported in Figma's JS engine

      // Disallow object spread syntax: { ...obj } -> use Object.assign
      "prefer-object-spread": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector: "SpreadElement",
          message:
            "Spread syntax (...) is not supported in Figma plugin sandbox. Use Object.assign() or explicit property copying instead.",
        },
        {
          selector: "CatchClause[param=null]",
          message:
            "Optional catch binding (catch {}) is not supported in Figma plugin sandbox. Use catch (e) {} or catch (_e) {} instead.",
        },
      ],

      // TypeScript specific rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
];
