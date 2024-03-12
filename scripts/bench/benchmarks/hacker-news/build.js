'use strict';

const {join} = require('path');

async function build(reactPath, asyncCopyTo) {
  // copy the UMD bundles
  await asyncCopyTo(
    join(reactPath, 'build', 'node_modules', 'react', 'umd', 'react.production.min.js'),
    join(__dirname, 'react.production.min.js')
  );
  await asyncCopyTo(
    join(reactPath, 'build', 'node_modules', 'react-dom', 'umd', 'react-dom.production.min.js'),
    join(__dirname, 'react-dom.production.min.js')
  );
}

module.exports = build;
