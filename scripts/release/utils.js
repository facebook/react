'use strict';

const {exec} = require('child-process-promise');
const {createPatch} = require('diff');
const {hashElement} = require('folder-hash');
const {existsSync, readFileSync, writeFileSync} = require('fs');
const {readJson, writeJson} = require('fs-extra');
const logUpdate = require('log-update');
const {join} = require('path');
const createLogger = require('progress-estimator');
const prompt = require('prompt-promise');
const theme = require('./theme');
const {stablePackages, experimentalPackages} = require('../../ReactVersions');

// https://www.npmjs.com/package/progress-estimator#configuration
const logger = createLogger({
  storagePath: join(__dirname, '.progress-estimator'),
});

const addDefaultParamValue = (optionalShortName, longName, defaultValue) => {
  let found = false;
  for (let i = 0; i < process.argv.length; i++) {
    const current = process.argv[i];
    if (current === optionalShortName || current.startsWith(`${longName}=`)) {
      found = true;
      break;
    }
  }

  if (!found) {
    process.argv.push(`${longName}=${defaultValue}`);
  }
};

const confirm = async message => {
  const confirmation = await prompt(theme`\n{caution ${message}} (y/N) `);
  prompt.done();
  if (confirmation !== 'y' && confirmation !== 'Y') {
    console.log(theme`\n{caution Release cancelled.}`);
    process.exit(0);
  }
};

const execRead = async (command, options) => {
  const {stdout} = await exec(command, options);

  return stdout.trim();
};

const extractCommitFromVersionNumber = version => {
  if (typeof version !== 'string' || !version) {
    throw new Error(`Invalid version: expected a non-empty string, got "${version}"`);
  }
  // Support stable version format e.g. "0.0.0-0e526bcec-20210202"
  // and experimental version format e.g. "0.0.0-experimental-0e526bcec-20210202"
  const match = version.match(/0\.0\.0\-([a-z]+\-){0,1}([^-]+).+/);
  if (match === null) {
    throw new Error(`Could not extract commit from version "${version}": invalid format`);
  }
  const commit = match[2];
  if (!/^[a-f0-9]{7,40}$/.test(commit)) {
    throw new Error(`Invalid commit hash extracted: "${commit}"`);
  }
  return commit;
};

const getBuildInfo = async () => {
  const cwd = join(__dirname, '..', '..');

  const isExperimental = process.env.RELEASE_CHANNEL === 'experimental';

  console.log(theme`{info Gathering build information...}`);

  let branch, commit, checksum, dateString;
  try {
    console.log(theme`{info Getting current git branch...}`);
    branch = await execRead('git branch | grep \\* | cut -d " " -f2', {
      cwd,
    });
  } catch (error) {
    throw new Error(`Failed to get git branch: ensure you're in a git repository. ${error.message}`);
  }

  try {
    console.log(theme`{info Getting current commit hash...}`);
    commit = await execRead('git show -s --no-show-signature --format=%h', {
      cwd,
    });
  } catch (error) {
    throw new Error(`Failed to get commit hash: ensure you're in a git repository. ${error.message}`);
  }

  try {
    console.log(theme`{info Calculating checksum for packages...}`);
    checksum = await getChecksumForCurrentRevision(cwd);
  } catch (error) {
    throw new Error(`Failed to calculate checksum: ${error.message}`);
  }

  try {
    console.log(theme`{info Getting date string for commit...}`);
    dateString = await getDateStringForCommit(commit);
  } catch (error) {
    throw new Error(`Failed to get date string: ${error.message}`);
  }

  const version = isExperimental
    ? `0.0.0-experimental-${commit}-${dateString}`
    : `0.0.0-${commit}-${dateString}`;

  // React version is stored explicitly, separately for DevTools support.
  // See updateVersionsForNext() below for more info.
  let packageJSON;
  try {
    console.log(theme`{info Reading React package.json...}`);
    packageJSON = await readJson(
      join(cwd, 'packages', 'react', 'package.json')
    );
  } catch (error) {
    throw new Error(`Failed to read React package.json: ensure packages/react/package.json exists. ${error.message}`);
  }

  const reactVersion = isExperimental
    ? `${packageJSON.version}-experimental-${commit}-${dateString}`
    : `${packageJSON.version}-${commit}-${dateString}`;

  console.log(theme`{success Build info gathered successfully.}`);

  return {branch, checksum, commit, reactVersion, version};
};

const getChecksumForCurrentRevision = async cwd => {
  const packagesDir = join(cwd, 'packages');
  if (!existsSync(packagesDir)) {
    throw new Error(`Packages directory does not exist: ${packagesDir}`);
  }
  const hashedPackages = await hashElement(packagesDir, {
    encoding: 'hex',
    files: {exclude: ['.DS_Store']},
  });
  return hashedPackages.hash.slice(0, 7);
};

const getDateStringForCommit = async commit => {
  let dateString = await execRead(
    `git show -s --no-show-signature --format=%cd --date=format:%Y%m%d ${commit}`
  );

  // On CI environment, this string is wrapped with quotes '...'s
  if (dateString.startsWith("'")) {
    dateString = dateString.slice(1, 9);
  }

  return dateString;
};

const getCommitFromCurrentBuild = async () => {
  const cwd = join(__dirname, '..', '..');

  // If this build includes a build-info.json file, extract the commit from it.
  // Otherwise fall back to parsing from the package version number.
  // This is important to make the build reproducible (e.g. by Mozilla reviewers).
  const buildInfoJSON = join(
    cwd,
    'build',
    'oss-experimental',
    'react',
    'build-info.json'
  );
  if (existsSync(buildInfoJSON)) {
    const buildInfo = await readJson(buildInfoJSON);
    return buildInfo.commit;
  } else {
    const packageJSON = join(
      cwd,
      'build',
      'oss-experimental',
      'react',
      'package.json'
    );
    const {version} = await readJson(packageJSON);
    return extractCommitFromVersionNumber(version);
  }
};

const getPublicPackages = isExperimental => {
  const packageNames = Object.keys(stablePackages);
  if (isExperimental) {
    packageNames.push(...experimentalPackages);
  }
  return packageNames;
};

const handleError = error => {
  logUpdate.clear();

  const message = error.message.trim().replace(/\n +/g, '\n');
  const stack = error.stack.replace(error.message, '');

  console.log(theme`{error ${message}}\n\n{path ${stack}}`);
  process.exit(1);
};

const logPromise = async (promise, text, estimate) =>
  logger(promise, text, {estimate});

const printDiff = (path, beforeContents, afterContents) => {
  const patch = createPatch(path, beforeContents, afterContents);
  const coloredLines = patch
    .split('\n')
    .slice(2) // Trim index file
    .map((line, index) => {
      if (index <= 1) {
        return theme.diffHeader(line);
      }
      switch (line[0]) {
        case '+':
          return theme.diffAdded(line);
        case '-':
          return theme.diffRemoved(line);
        case ' ':
          return line;
        case '@':
          return null;
        case '\\':
          return null;
      }
    })
    .filter(line => line);
  console.log(coloredLines.join('\n'));
  return patch;
};

// Convert an array param (expected format "--foo bar baz")
// to also accept comma input (e.g. "--foo bar,baz")
const splitCommaParams = array => {
  for (let i = array.length - 1; i >= 0; i--) {
    const param = array[i];
    if (param.includes(',')) {
      array.splice(i, 1, ...param.split(','));
    }
  }
};

// This method is used by both local Node release scripts and Circle CI bash scripts.
// It updates version numbers in package JSONs (both the version field and dependencies),
// As well as the embedded renderer version in "packages/shared/ReactVersion".
// Canaries version numbers use the format of 0.0.0-<sha>-<date> to be easily recognized (e.g. 0.0.0-01974a867-20200129).
// A separate "React version" is used for the embedded renderer version to support DevTools,
// since it needs to distinguish between different version ranges of React.
// It is based on the version of React in the local package.json (e.g. 16.12.0-01974a867-20200129).
// Both numbers will be replaced if the "next" release is promoted to a stable release.
const updateVersionsForNext = async (cwd, reactVersion, version) => {
  if (typeof cwd !== 'string' || !cwd) {
    throw new Error(`Invalid cwd: expected a non-empty string, got "${cwd}"`);
  }
  if (typeof reactVersion !== 'string' || !reactVersion) {
    throw new Error(`Invalid reactVersion: expected a non-empty string, got "${reactVersion}"`);
  }
  if (typeof version !== 'string' || !version) {
    throw new Error(`Invalid version: expected a non-empty string, got "${version}"`);
  }

  const isExperimental = reactVersion.includes('experimental');
  const packages = getPublicPackages(isExperimental);
  const packagesDir = join(cwd, 'packages');

  console.log(theme`{info Updating versions for next release...}`);

  // Check if packages dir exists
  if (!existsSync(packagesDir)) {
    throw new Error(`Packages directory does not exist: ${packagesDir}`);
  }

  // Update the shared React version source file.
  // This is bundled into built renderers.
  // The promote script will replace this with a final version later.
  const sourceReactVersionPath = join(cwd, 'packages/shared/ReactVersion.js');
  if (!existsSync(sourceReactVersionPath)) {
    throw new Error(`ReactVersion.js file does not exist: ${sourceReactVersionPath}`);
  }
  console.log(theme`{info Updating ReactVersion.js...}`);
  const sourceReactVersion = readFileSync(
    sourceReactVersionPath,
    'utf8'
  ).replace(/export default '[^']+';/, `export default '${reactVersion}';`);
  writeFileSync(sourceReactVersionPath, sourceReactVersion);

  // Update the root package.json.
  // This is required to pass a later version check script.
  {
    const packageJSONPath = join(cwd, 'package.json');
    if (!existsSync(packageJSONPath)) {
      throw new Error(`Root package.json does not exist: ${packageJSONPath}`);
    }
    console.log(theme`{info Updating root package.json...}`);
    const packageJSON = await readJson(packageJSONPath);
    packageJSON.version = version;
    await writeJson(packageJSONPath, packageJSON, {spaces: 2});
  }

  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const packagePath = join(packagesDir, packageName);
    if (!existsSync(packagePath)) {
      throw new Error(`Package directory does not exist: ${packagePath}`);
    }

    // Update version numbers in package JSONs
    const packageJSONPath = join(packagePath, 'package.json');
    if (!existsSync(packageJSONPath)) {
      throw new Error(`Package.json does not exist: ${packageJSONPath}`);
    }
    console.log(theme`{info Updating ${packageName} package.json...}`);
    const packageJSON = await readJson(packageJSONPath);
    packageJSON.version = version;

    // Also update inter-package dependencies.
    // Next releases always have exact version matches.
    // The promote script may later relax these (e.g. "^x.x.x") based on source package JSONs.
    const {dependencies, peerDependencies} = packageJSON;
    for (let j = 0; j < packages.length; j++) {
      const dependencyName = packages[j];
      if (dependencies && dependencies[dependencyName]) {
        dependencies[dependencyName] = version;
      }
      if (peerDependencies && peerDependencies[dependencyName]) {
        peerDependencies[dependencyName] = version;
      }
    }

    await writeJson(packageJSONPath, packageJSON, {spaces: 2});
  }

  console.log(theme`{success Versions updated successfully.}`);
};

module.exports = {
  addDefaultParamValue,
  confirm,
  execRead,
  getBuildInfo,
  getChecksumForCurrentRevision,
  getCommitFromCurrentBuild,
  getDateStringForCommit,
  getPublicPackages,
  handleError,
  logPromise,
  printDiff,
  splitCommaParams,
  theme,
  updateVersionsForNext,
};
