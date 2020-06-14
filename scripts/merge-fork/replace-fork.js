'use strict';

/* eslint-disable no-for-of-loops/no-for-of-loops */

// Copies the contents of the new fork into the old fork

const {promisify} = require('util');
const glob = promisify(require('glob'));
const fs = require('fs');

const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);

async function main() {
  const oldFilenames = await glob('packages/react-reconciler/**/*.old.js');
  await Promise.all(oldFilenames.map(unforkFile));
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

  await copyFile(newFilename, oldFilename);
}

main();
