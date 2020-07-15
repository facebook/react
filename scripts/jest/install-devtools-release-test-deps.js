'use strict';

/* eslint-disable no-for-of-loops/no-for-of-loops */

const fs = require('fs');
const {exec} = require('child-process-promise');

// Installs an older version of React DOM into build/node_modules.
//
// DevTools uses React Test Renderer for its unit tests. Not React DOM. So
// by updating React DOM to an older release, it will affect the "backend" (the
// code that runs in the browser) but not the "frontend" (the code that runs
// the DevTools React app itself). If we were to use React DOM in the DevTools
// tests, we'd need to figure out a way to load separate versions for the
// backend and the front end.

const version = process.argv[2];

async function main() {
  await exec('mkdir build-tmp');
  await exec('npm install --prefix ./build-tmp react-dom@' + version);
  const modules = fs.readdirSync('build-tmp/node_modules');
  for (const dep of modules) {
    if (
      dep.startsWith('.') ||
      // Don't replace React isomorphic package, since the backend may use
      // component types/features that don't exist in an older version
      dep === 'react'
    ) {
      continue;
    }
    await exec(`rm -rf build/node_modules/${dep}`);
    await exec(
      `cp -r build-tmp/node_modules/${dep} ` + `build/node_modules/${dep}`
    );
  }
}

main();
