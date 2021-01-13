'use strict';

/* eslint-disable no-for-of-loops/no-for-of-loops */

const fs = require('fs');
const {spawnSync} = require('child_process');
const tmp = require('tmp');

// Runs the build script for both stable and experimental release channels,
// by configuring an environment variable.

if (process.env.CIRCLE_NODE_TOTAL) {
  // In CI, we use multiple concurrent processes. Allocate half the processes to
  // build the stable channel, and the other half for experimental. Override
  // the environment variables to "trick" the underlying build script.
  const total = parseInt(process.env.CIRCLE_NODE_TOTAL, 10);
  const halfTotal = Math.floor(total / 2);
  const index = parseInt(process.env.CIRCLE_NODE_INDEX, 10);
  if (index < halfTotal) {
    const nodeTotal = halfTotal;
    const nodeIndex = index;
    buildForChannel('stable', nodeTotal, nodeIndex);
    processStable('./build');
  } else {
    const nodeTotal = total - halfTotal;
    const nodeIndex = index - halfTotal;
    buildForChannel('experimental', nodeTotal, nodeIndex);
    processExperimental('./build');
  }

  // TODO: Currently storing artifacts as `./build2` so that it doesn't conflict
  // with old build job. Remove once we migrate rest of build/test pipeline.
  fs.renameSync('./build', './build2');
} else {
  // Running locally, no concurrency. Move each channel's build artifacts into
  // a temporary directory so that they don't conflict.
  buildForChannel('stable', '', '');
  const stableDir = tmp.dirSync().name;
  fs.renameSync('./build', stableDir);
  processStable(stableDir);

  buildForChannel('experimental', '', '');
  const experimentalDir = tmp.dirSync().name;
  fs.renameSync('./build', experimentalDir);
  processExperimental(experimentalDir);

  // Then merge the experimental folder into the stable one. processExperimental
  // will have already removed conflicting files.
  //
  // In CI, merging is handled automatically by CircleCI's workspace feature.
  spawnSync('rsync', ['-ar', experimentalDir + '/', stableDir + '/']);

  // Now restore the combined directory back to its original name
  // TODO: Currently storing artifacts as `./build2` so that it doesn't conflict
  // with old build job. Remove once we migrate rest of build/test pipeline.
  fs.renameSync(stableDir, './build2');
}

function buildForChannel(channel, nodeTotal, nodeIndex) {
  spawnSync('node', ['./scripts/rollup/build.js', ...process.argv.slice(2)], {
    stdio: ['pipe', process.stdout, process.stderr],
    env: {
      ...process.env,
      RELEASE_CHANNEL: channel,
      CIRCLE_NODE_TOTAL: nodeTotal,
      CIRCLE_NODE_INDEX: nodeIndex,
    },
  });
}

function processStable(buildDir) {
  if (fs.existsSync(buildDir + '/node_modules')) {
    fs.renameSync(buildDir + '/node_modules', buildDir + '/oss-stable');
  }

  if (fs.existsSync(buildDir + '/facebook-www')) {
    for (const fileName of fs.readdirSync(buildDir + '/facebook-www')) {
      const filePath = buildDir + '/facebook-www/' + fileName;
      const stats = fs.statSync(filePath);
      if (!stats.isDirectory()) {
        fs.renameSync(filePath, filePath.replace('.js', '.classic.js'));
      }
    }
  }

  if (fs.existsSync(buildDir + '/sizes')) {
    fs.renameSync(buildDir + '/sizes', buildDir + '/sizes-stable');
  }
}

function processExperimental(buildDir) {
  if (fs.existsSync(buildDir + '/node_modules')) {
    fs.renameSync(buildDir + '/node_modules', buildDir + '/oss-experimental');
  }

  if (fs.existsSync(buildDir + '/facebook-www')) {
    for (const fileName of fs.readdirSync(buildDir + '/facebook-www')) {
      const filePath = buildDir + '/facebook-www/' + fileName;
      const stats = fs.statSync(filePath);
      if (!stats.isDirectory()) {
        fs.renameSync(filePath, filePath.replace('.js', '.modern.js'));
      }
    }
  }

  if (fs.existsSync(buildDir + '/sizes')) {
    fs.renameSync(buildDir + '/sizes', buildDir + '/sizes-experimental');
  }

  // Delete all other artifacts that weren't handled above. We assume they are
  // duplicates of the corresponding artifacts in the stable channel. Ideally,
  // the underlying build script should not have produced these files in the
  // first place.
  for (const pathName of fs.readdirSync(buildDir)) {
    if (
      pathName !== 'oss-experimental' &&
      pathName !== 'facebook-www' &&
      pathName !== 'sizes-experimental'
    ) {
      spawnSync('rm', ['-rm', buildDir + '/' + pathName]);
    }
  }
}
