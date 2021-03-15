'use strict';

/* eslint-disable no-for-of-loops/no-for-of-loops */

const fs = require('fs');
const fse = require('fs-extra');
const {spawnSync} = require('child_process');
const path = require('path');
const tmp = require('tmp');

// Runs the build script for both stable and experimental release channels,
// by configuring an environment variable.

const sha = (
  spawnSync('git', ['show', '-s', '--format=%h']).stdout + ''
).trim();
const ReactVersion = JSON.parse(fs.readFileSync('packages/react/package.json'))
  .version;

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
    const version = '0.0.0-' + sha;
    updateTheReactVersionThatDevToolsReads(ReactVersion + '-' + sha);
    buildForChannel('stable', nodeTotal, nodeIndex);
    processStable('./build', version);
  } else {
    const nodeTotal = total - halfTotal;
    const nodeIndex = index - halfTotal;
    const version = '0.0.0-experimental-' + sha;
    updateTheReactVersionThatDevToolsReads(
      ReactVersion + '-experimental-' + sha
    );
    buildForChannel('experimental', nodeTotal, nodeIndex);
    processExperimental('./build', version);
  }

  // TODO: Currently storing artifacts as `./build2` so that it doesn't conflict
  // with old build job. Remove once we migrate rest of build/test pipeline.
  fs.renameSync('./build', './build2');
} else {
  // Running locally, no concurrency. Move each channel's build artifacts into
  // a temporary directory so that they don't conflict.
  const stableVersion = '0.0.0-' + sha;
  buildForChannel('stable', '', '');
  const stableDir = tmp.dirSync().name;
  crossDeviceRenameSync('./build', stableDir);
  processStable(stableDir, stableVersion);

  const experimentalVersion = '0.0.0-experimental-' + sha;
  buildForChannel('experimental', '', '');
  const experimentalDir = tmp.dirSync().name;
  crossDeviceRenameSync('./build', experimentalDir);
  processExperimental(experimentalDir, experimentalVersion);

  // Then merge the experimental folder into the stable one. processExperimental
  // will have already removed conflicting files.
  //
  // In CI, merging is handled automatically by CircleCI's workspace feature.
  mergeDirsSync(experimentalDir + '/', stableDir + '/');

  // Now restore the combined directory back to its original name
  // TODO: Currently storing artifacts as `./build2` so that it doesn't conflict
  // with old build job. Remove once we migrate rest of build/test pipeline.
  crossDeviceRenameSync(stableDir, './build2');
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

function processStable(buildDir, version) {
  if (fs.existsSync(buildDir + '/node_modules')) {
    updatePackageVersions(buildDir + '/node_modules', version);
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

function processExperimental(buildDir, version) {
  if (fs.existsSync(buildDir + '/node_modules')) {
    updatePackageVersions(buildDir + '/node_modules', version);
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

function crossDeviceRenameSync(source, destination) {
  return fse.moveSync(source, destination, {overwrite: true});
}

/*
 * Grabs the built packages in ${tmp_build_dir}/node_modules and updates the
 * `version` key in their package.json to 0.0.0-${commitHash} for the commit
 * you're building. Also updates the dependencies and peerDependencies
 * to match this version for all of the 'React' packages
 * (packages available in this repo).
 */
function updatePackageVersions(modulesDir, version) {
  const allReactModuleNames = fs.readdirSync('packages');
  for (const moduleName of fs.readdirSync(modulesDir)) {
    const packageJSONPath = path.join(modulesDir, moduleName, 'package.json');
    const stats = fs.statSync(packageJSONPath);
    if (stats.isFile()) {
      const packageInfo = JSON.parse(fs.readFileSync(packageJSONPath));

      // Update version
      packageInfo.version = version;

      if (packageInfo.dependencies) {
        for (const dep of Object.keys(packageInfo.dependencies)) {
          // if it's a react package (available in the current repo), update the version
          // TODO: is this too broad? Assumes all of the packages were built.
          if (allReactModuleNames.includes(dep)) {
            packageInfo.dependencies[dep] = version;
          }
        }
      }
      if (packageInfo.peerDependencies) {
        for (const dep of Object.keys(packageInfo.peerDependencies)) {
          if (allReactModuleNames.includes(dep)) {
            packageInfo.peerDependencies[dep] = version;
          }
        }
      }

      // Write out updated package.json
      fs.writeFileSync(packageJSONPath, JSON.stringify(packageInfo, null, 2));
    }
  }
}

function updateTheReactVersionThatDevToolsReads(version) {
  // Overwrite the ReactVersion module before the build script runs so that it
  // is included in the final bundles. This only runs in CI, so it's fine to
  // edit the source file.
  fs.writeFileSync(
    './packages/shared/ReactVersion.js',
    `export default '${version}';\n`
  );
}

/**
 * cross-platform alternative to `rsync -ar`
 * @param {string} source
 * @param {string} destination
 */
function mergeDirsSync(source, destination) {
  for (const sourceFileBaseName of fs.readdirSync(source)) {
    const sourceFileName = path.join(source, sourceFileBaseName);
    const targetFileName = path.join(destination, sourceFileBaseName);

    const sourceFile = fs.statSync(sourceFileName);
    if (sourceFile.isDirectory()) {
      fse.ensureDirSync(targetFileName);
      mergeDirsSync(sourceFileName, targetFileName);
    } else {
      fs.copyFileSync(sourceFileName, targetFileName);
    }
  }
}
