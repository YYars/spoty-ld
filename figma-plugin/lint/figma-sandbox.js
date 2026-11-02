// Figma's plugin sandbox runs an older JS engine, and `bun build` does not
// downlevel syntax, so these features must never reach dist/code.js.

const noSpread = {
  meta: { type: "problem" },
  create: (context) => ({
    SpreadElement: (node) =>
      context.report({
        node,
        message:
          "Spread syntax (...) is not supported in Figma plugin sandbox. Use Object.assign() or explicit property copying instead.",
      }),
  }),
};

const noOptionalCatchBinding = {
  meta: { type: "problem" },
  create: (context) => ({
    CatchClause: (node) => {
      if (node.param === null) {
        context.report({
          node,
          message:
            "Optional catch binding (catch {}) is not supported in Figma plugin sandbox. Use catch (e) {} or catch (_e) {} instead.",
        });
      }
    },
  }),
};

export default {
  meta: { name: "figma-sandbox" },
  rules: {
    "no-spread": noSpread,
    "no-optional-catch-binding": noOptionalCatchBinding,
  },
};
