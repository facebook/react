module.exports = require('./src/index.ts');

// Hint to Node’s cjs-module-lexer to make named imports work
// https://github.com/facebook/react/issues/34801#issuecomment-3433478810
0 &&
  (module.exports = {
    meta,
    rules,
    configs
  });
