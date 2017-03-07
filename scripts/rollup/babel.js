'use strict';

const devExpressionWithCodes = require('../error-codes/dev-expression-with-codes');

const babelOptsReact = {
  plugins: [
    devExpressionWithCodes, // this pass has to run before `rewrite-modules`
  ],
};

module.exports = {
  babelOptsReact,
};
