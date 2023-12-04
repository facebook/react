'use strict';

// This file is a proxy for our rule definition that will
// load the latest built version on every check. This makes
// it convenient to test inside IDEs (which would otherwise
// load a version of our rule once and never restart the server).
// See instructions in ../index.js playground.

let build;
reload();

function reload() {
  for (let id in require.cache) {
    if (/eslint-plugin-react-hooks/.test(id)) {
      delete require.cache[id];
    }
  }
  // Point to the built version.
  build = require('../../../build/oss-experimental/eslint-plugin-react-hooks');
}

let rules = {};
for (let key in build.rules) {
  if (build.rules.hasOwnProperty(key)) {
    rules[key] = Object.assign({}, build.rules, {
      create() {
        // Reload changes to the built rule
        reload();
        return build.rules[key].create.apply(this, arguments);
      },
    });
  }
}

module.exports = {rules};
