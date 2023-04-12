'use strict';

/* eslint-disable no-for-of-loops/no-for-of-loops */

const crypto = require('node:crypto');
const fs = require('fs');
const fse = require('fs-extra');
const {spawnSync} = require('child_process');
const path = require('path');
const tmp = require('tmp');

const {
  ReactVersion,
  stablePackages,
  experimentalPackages,
  nextChannelLabel,
} = require('../../ReactVersions');

// Runs the build script for both stable and experimental release channels,
// by configuring an environment variable.

const sha = String(
  spawnSync('git', ['show', '-s', '--no-show-signature', '--format=%h']).stdout
).trim();

let dateString = String(
  spawnSync('git', [
    'show',
    '-s',
    '--no-show-signature',
    '--format=%cd',
    '--date=format:%Y%m%d',
    sha,
  ]).stdout
).trim();

// On CI environment, this string is wrapped with quotes '...'s
if (dateString.startsWith("'")) {
  dateString = dateString.substr(1, 8);
}

// Build the artifacts using a placeholder React version. We'll then do a string
// replace to swap it with the correct version per release channel.
const PLACEHOLDER_REACT_VERSION = ReactVersion + '-PLACEHOLDER';

// TODO: We should inject the React version using a build-time parameter
// instead of overwriting the source files.
fs.writeFileSync(
  './packages/shared/ReactVersion.js',
  `export default '${PLACEHOLDER_REACT_VERSION}';\n`
);

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
} else {
  // Running locally, no concurrency. Move each channel's build artifacts into
  // a temporary directory so that they don't conflict.
  buildForChannel('stable', '', '');
  const stableDir = tmp.dirSync().name;
  crossDeviceRenameSync('./build', stableDir);
  processStable(stableDir);
  buildForChannel('experimental', '', '');
  const experimentalDir = tmp.dirSync().name;
  crossDeviceRenameSync('./build', experimentalDir);
  processExperimental(experimentalDir);

  // Then merge the experimental folder into the stable one. processExperimental
  // will have already removed conflicting files.
  //
  // In CI, merging is handled automatically by CircleCI's workspace feature.
  mergeDirsSync(experimentalDir + '/', stableDir + '/');

  // Now restore the combined directory back to its original name
  crossDeviceRenameSync(stableDir, './build');
}

function buildForChannel(channel, nodeTotal, nodeIndex) {
  const {status} = spawnSync(
    'node',
    ['./scripts/rollup/build.js', ...process.argv.slice(2)],
    {
      stdio: ['pipe', process.stdout, process.stderr],
      env: {
        ...process.env,
        RELEASE_CHANNEL: channel,
        CIRCLE_NODE_TOTAL: nodeTotal,
        CIRCLE_NODE_INDEX: nodeIndex,
      },
    }
  );

  if (status !== 0) {
    // Error of spawned process is already piped to this stderr
    process.exit(status);
  }
}

function processStable(buildDir) {
  if (fs.existsSync(buildDir + '/node_modules')) {
    // Identical to `oss-stable` but with real, semver versions. This is what
    // will get published to @latest.
    spawnSync('cp', [
      '-r',
      buildDir + '/node_modules',
      buildDir + '/oss-stable-semver',
    ]);

    const defaultVersionIfNotFound = '0.0.0' + '-' + sha + '-' + dateString;
    const versionsMap = new Map();
    for (const moduleName in stablePackages) {
      const version = stablePackages[moduleName];
      versionsMap.set(
        moduleName,
        version + '-' + nextChannelLabel + '-' + sha + '-' + dateString,
        defaultVersionIfNotFound
      );
    }
    updatePackageVersions(
      buildDir + '/node_modules',
      versionsMap,
      defaultVersionIfNotFound,
      true
    );
    fs.renameSync(buildDir + '/node_modules', buildDir + '/oss-stable');
    updatePlaceholderReactVersionInCompiledArtifacts(
      buildDir + '/oss-stable',
      ReactVersion + '-' + nextChannelLabel + '-' + sha + '-' + dateString
    );

    // Now do the semver ones
    const semverVersionsMap = new Map();
    for (const moduleName in stablePackages) {
      const version = stablePackages[moduleName];
      semverVersionsMap.set(moduleName, version);
    }
    updatePackageVersions(
      buildDir + '/oss-stable-semver',
      semverVersionsMap,
      defaultVersionIfNotFound,
      false
    );
    updatePlaceholderReactVersionInCompiledArtifacts(
      buildDir + '/oss-stable-semver',
      ReactVersion
    );
  }

  if (fs.existsSync(buildDir + '/facebook-www')) {
    const hash = crypto.createHash('sha1');
    for (const fileName of fs.readdirSync(buildDir + '/facebook-www').sort()) {
      const filePath = buildDir + '/facebook-www/' + fileName;
      const stats = fs.statSync(filePath);
      if (!stats.isDirectory()) {
        hash.update(fs.readFileSync(filePath));
        fs.renameSync(filePath, filePath.replace('.js', '.classic.js'));
      }
    }
    updatePlaceholderReactVersionInCompiledArtifacts(
      buildDir + '/facebook-www',
      ReactVersion + '-www-classic-' + hash.digest('hex').substr(0, 8)
    );
  }

  // Update remaining placeholders with next channel version
  updatePlaceholderReactVersionInCompiledArtifacts(
    buildDir,
    ReactVersion + '-' + nextChannelLabel + '-' + sha + '-' + dateString
  );

  if (fs.existsSync(buildDir + '/sizes')) {
    fs.renameSync(buildDir + '/sizes', buildDir + '/sizes-stable');
  }
}

function processExperimental(buildDir, version) {
  if (fs.existsSync(buildDir + '/node_modules')) {
    const defaultVersionIfNotFound =
      '0.0.0' + '-experimental-' + sha + '-' + dateString;
    const versionsMap = new Map();
    for (const moduleName in stablePackages) {
      versionsMap.set(moduleName, defaultVersionIfNotFound);
    }
    for (const moduleName of experimentalPackages) {
      versionsMap.set(moduleName, defaultVersionIfNotFound);
    }
    updatePackageVersions(
      buildDir + '/node_modules',
      versionsMap,
      defaultVersionIfNotFound,
      true
    );
    fs.renameSync(buildDir + '/node_modules', buildDir + '/oss-experimental');
    updatePlaceholderReactVersionInCompiledArtifacts(
      buildDir + '/oss-experimental',
      // TODO: The npm version for experimental releases does not include the
      // React version, but the runtime version does so that DevTools can do
      // feature detection. Decide what to do about this later.
      ReactVersion + '-experimental-' + sha + '-' + dateString
    );
  }

  if (fs.existsSync(buildDir + '/facebook-www')) {
    const hash = crypto.createHash('sha1');
    for (const fileName of fs.readdirSync(buildDir + '/facebook-www').sort()) {
      const filePath = buildDir + '/facebook-www/' + fileName;
      const stats = fs.statSync(filePath);
      if (!stats.isDirectory()) {
        hash.update(fs.readFileSync(filePath));
        fs.renameSync(filePath, filePath.replace('.js', '.modern.js'));
      }
    }
    updatePlaceholderReactVersionInCompiledArtifacts(
      buildDir + '/facebook-www',
      ReactVersion + '-www-modern-' + hash.digest('hex').substr(0, 8)
    );
  }

  // Update remaining placeholders with next channel version
  updatePlaceholderReactVersionInCompiledArtifacts(
    buildDir,
    ReactVersion + '-' + nextChannelLabel + '-' + sha + '-' + dateString
  );

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
 * `version` key in their package.json to 0.0.0-${date}-${commitHash} for the commit
 * you're building. Also updates the dependencies and peerDependencies
 * to match this version for all of the 'React' packages
 * (packages available in this repo).
 */
function updatePackageVersions(
  modulesDir,
  versionsMap,
  defaultVersionIfNotFound,
  pinToExactVersion
) {
  for (const moduleName of fs.readdirSync(modulesDir)) {
    let version = versionsMap.get(moduleName);
    if (version === undefined) {
      // TODO: If the module is not in the version map, we should exclude it
      // from the build artifacts.
      version = defaultVersionIfNotFound;
    }
    const packageJSONPath = path.join(modulesDir, moduleName, 'package.json');
    const stats = fs.statSync(packageJSONPath);
    if (stats.isFile()) {
      const packageInfo = JSON.parse(fs.readFileSync(packageJSONPath));

      // Update version
      packageInfo.version = version;

      if (packageInfo.dependencies) {
        for (const dep of Object.keys(packageInfo.dependencies)) {
          const depVersion = versionsMap.get(dep);
          if (depVersion !== undefined) {
            packageInfo.dependencies[dep] = pinToExactVersion
              ? depVersion
              : '^' + depVersion;
          }
        }
      }
      if (packageInfo.peerDependencies) {
        if (
          !pinToExactVersion &&
          (moduleName === 'use-sync-external-store' ||
            moduleName === 'use-subscription')
        ) {
          // use-sync-external-store supports older versions of React, too, so
          // we don't override to the latest version. We should figure out some
          // better way to handle this.
          // TODO: Remove this special case.
        } else {
          for (const dep of Object.keys(packageInfo.peerDependencies)) {
            const depVersion = versionsMap.get(dep);
            if (depVersion !== undefined) {
              packageInfo.peerDependencies[dep] = pinToExactVersion
                ? depVersion
                : '^' + depVersion;
            }
          }
        }
      }

      // Write out updated package.json
      fs.writeFileSync(packageJSONPath, JSON.stringify(packageInfo, null, 2));
    }
  }
}

function updatePlaceholderReactVersionInCompiledArtifacts(
  artifactsDirectory,
  newVersion
) {
  // Update the version of React in the compiled artifacts by searching for
  // the placeholder string and replacing it with a new one.
  const artifactFilenames = String(
    spawnSync('grep', [
      '-lr',
      PLACEHOLDER_REACT_VERSION,
      '--',
      artifactsDirectory,
    ]).stdout
  )
    .trim()
    .split('\n')
    .filter(filename => filename.endsWith('.js'));

  for (const artifactFilename of artifactFilenames) {
    const originalText = fs.readFileSync(artifactFilename, 'utf8');
    const replacedText = originalText.replaceAll(
      PLACEHOLDER_REACT_VERSION,
      newVersion
    );
    fs.writeFileSync(artifactFilename, replacedText);
  }
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
