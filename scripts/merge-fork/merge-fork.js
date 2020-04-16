'use strict';

/* eslint-disable no-for-of-loops/no-for-of-loops */

const {writeFileSync} = require('fs');
const path = require('path');
const {spawnSync} = require('child_process');
const minimist = require('minimist');
const tmp = require('tmp');

const argv = minimist(process.argv.slice(2), {
  boolean: ['reverse'],
  default: {
    'base-ref': 'HEAD',
  },
});

const baseRef = argv['base-ref'];
const baseDir = argv['base-dir'];

function resolvePath(file) {
  return baseDir !== undefined ? path.join(baseDir, file) : file;
}

function getTransforms() {
  const old = argv.old;
  const base = argv.base;
  const _new = argv.new;
  if (old !== undefined) {
    if (_new === undefined) {
      throw Error('Cannot provide --old without also providing --new');
    }
    const oldPath = resolvePath(old);
    const newPath = resolvePath(_new);

    let basePath;
    let fromPath;
    let toPath;
    if (argv.reverse) {
      fromPath = oldPath;
      toPath = newPath;
      basePath = base !== undefined ? resolvePath(basePath) : oldPath;
    } else {
      fromPath = newPath;
      toPath = oldPath;
      basePath = base !== undefined ? resolvePath(basePath) : newPath;
    }

    return [
      {
        base: basePath,
        from: fromPath,
        to: toPath,
      },
    ];
  } else if (_new !== undefined) {
    throw Error('Cannot provide --new without also providing --old');
  }
  return argv._.map(filename => {
    const oldPath = resolvePath(filename + '.old.js');
    const newPath = resolvePath(filename + '.new.js');

    let basePath;
    let fromPath;
    let toPath;
    if (argv.reverse) {
      fromPath = oldPath;
      toPath = newPath;
      basePath = base !== undefined ? resolvePath(basePath) : oldPath;
    } else {
      fromPath = newPath;
      toPath = oldPath;
      basePath = base !== undefined ? resolvePath(basePath) : newPath;
    }
    return {
      base: basePath,
      from: fromPath,
      to: toPath,
    };
  });
}

for (const {base: baseFilename, from, to} of getTransforms()) {
  // Write the base file contents to a temporary file
  const gitShowResult = spawnSync(
    'git',
    ['show', `${baseRef}:${baseFilename}`],
    {
      stdio: 'pipe',
    }
  );
  if (gitShowResult.status !== 0) {
    console.error('' + gitShowResult.stderr);
    continue;
  }

  const baseFileContents = gitShowResult.stdout;
  const base = tmp.fileSync().name;
  writeFileSync(base, baseFileContents);

  // Run the merge with `git merge-file`
  const mergeFileResult = spawnSync('git', ['merge-file', to, base, from], {
    stdio: 'pipe',
  });

  if (mergeFileResult.status !== 0) {
    console.error('' + mergeFileResult.stderr);
  }
}
