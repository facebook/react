'use strict';

const {
  join,
} = require('path');

async function build(reactPath, asyncCopyTo) {
    // copy the UMD bundles
  await asyncCopyTo(
    join(reactPath, 'build', 'dist', 'react.production.min.js'),
    join(__dirname, 'react.production.min.js')
  );
  await asyncCopyTo(
    join(reactPath, 'build', 'dist', 'react-dom.production.min.js'),
    join(__dirname, 'react-dom.production.min.js')
  );
}

module.exports = build;
