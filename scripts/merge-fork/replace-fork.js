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
  spawnSync('yarn', ['linc', '--fix'], {
    stdio: ['inherit', 'inherit', 'pipe'],
  });
  // TODO: If eslint crashes, it may not have successfully fixed all
  // the imports, which would leave the reconciler files in an inconsistent
  // state. So we used to crash and reset the working directory. But that
  // solution assumed that the working directory was clean before you run the
  // command — if it wasn't, it'll not only reset the synced reconciler files,
  // but all the other uncommitted changes.
  //
  // We need a different strategy to prevent loss of work. For example, we could
  // exit early if the working directory is not clean before you run the script.
  //
  // Until we think of something better, I've commmented out this branch to
  // prevent work from accidentally being lost.
  // if (spawn.stderr.toString() !== '') {
  //   spawnSync('git', ['checkout', '.']);

  //   console.log(Error(spawn.stderr));
  //   process.exitCode = 1;
  // }
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
