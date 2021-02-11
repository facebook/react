'use strict';

/* eslint-disable no-for-of-loops/no-for-of-loops */

// Copies the contents of the new fork into the old fork

const {promisify} = require('util');
const {spawnSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);

const RECONCILER_SRC = 'packages/react-reconciler/src/';
const argv = process.argv.slice(2);

async function main() {
  const oldFilenames = fs
    .readdirSync(path.resolve(__dirname, '../../', RECONCILER_SRC))
    .filter(fn => fn.endsWith('.old.js'))
    .map(filename => 'packages/react-reconciler/src/' + filename);

  await Promise.all(oldFilenames.map(unforkFile));

  // Use ESLint to autofix imports
  spawnSync('yarn', ['linc', '--fix']);
}

async function unforkFile(oldFilename) {
  let oldStats;
  try {
    oldStats = await stat(oldFilename);
  } catch {
    return;
  }
  if (!oldStats.isFile()) {
    return;
  }

  const newFilename = oldFilename.replace(/\.old.js$/, '.new.js');
  let newStats;
  try {
    newStats = await stat(newFilename);
  } catch {
    return;
  }
  if (!newStats.isFile()) {
    return;
  }

  if (argv.indexOf('--reverse') >= 0) {
    await copyFile(oldFilename, newFilename);
  } else {
    await copyFile(newFilename, oldFilename);
  }
}

main();
