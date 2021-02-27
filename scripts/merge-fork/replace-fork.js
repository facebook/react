'use strict';

/* eslint-disable no-for-of-loops/no-for-of-loops */

// Copies the contents of the new fork into the old fork

const {promisify} = require('util');
const glob = promisify(require('glob'));
const {spawnSync} = require('child_process');
const fs = require('fs');
const minimist = require('minimist');

const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);

const argv = minimist(process.argv.slice(2), {
  boolean: ['reverse'],
});

async function main() {
  const oldFilenames = await glob('packages/react-reconciler/**/*.old.js');
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

  if (argv.reverse) {
    await copyFile(oldFilename, newFilename);
  } else {
    await copyFile(newFilename, oldFilename);
  }
}

main();
