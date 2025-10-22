module.exports = require('./src/index.ts');

// Hint to Node’s cjs-module-lexer to make named imports work
// https://github.com/facebook/react/issues/34801#issuecomment-3433478810
// eslint-disable-next-line ft-flow/no-unused-expressions
0 &&
  (module.exports = {
    meta: true,
    rules: true,
    configs: true,
  });
