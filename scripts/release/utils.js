'use strict';

const {exec} = require('child-process-promise');
const {createPatch} = require('diff');
const {hashElement} = require('folder-hash');
const {readdirSync, readFileSync, statSync, writeFileSync} = require('fs');
const {readJson, writeJson} = require('fs-extra');
const http = require('request-promise-json');
const logUpdate = require('log-update');
const {join} = require('path');
const createLogger = require('progress-estimator');
const prompt = require('prompt-promise');
const theme = require('./theme');

// The following packages are published to NPM but not by this script.
// They are released through a separate process.
const RELEASE_SCRIPT_PACKAGE_SKIPLIST = [
  'react-devtools',
  'react-devtools-core',
  'react-devtools-inline',
];

// https://www.npmjs.com/package/progress-estimator#configuration
const logger = createLogger({
  storagePath: join(__dirname, '.progress-estimator'),
});

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

const getArtifactsList = async buildID => {
  const buildMetadataURL = `https://circleci.com/api/v1.1/project/github/facebook/react/${buildID}?circle-token=${
    process.env.CIRCLE_CI_API_TOKEN
  }`;
  const buildMetadata = await http.get(buildMetadataURL, true);
  if (!buildMetadata.workflows || !buildMetadata.workflows.workflow_id) {
    console.log(
      theme`{error Could not find workflow info for build ${buildID}.}`
    );
    process.exit(1);
  }

  const workflowID = buildMetadata.workflows.workflow_id;
  const workflowMetadataURL = `https://circleci.com/api/v2/workflow/${workflowID}/jobs?circle-token=${
    process.env.CIRCLE_CI_API_TOKEN
  }`;
  const workflowMetadata = await http.get(workflowMetadataURL, true);
  const job = workflowMetadata.items.find(
    ({name}) => name === 'process_artifacts'
  );
  if (!job || !job.job_number) {
    console.log(
      theme`{error Could not find "process_artifacts" job for workflow ${workflowID}.}`
    );
    process.exit(1);
  }

  const jobArtifactsURL = `https://circleci.com/api/v1.1/project/github/facebook/react/${
    job.job_number
  }/artifacts?circle-token=${process.env.CIRCLE_CI_API_TOKEN}`;
  const jobArtifacts = await http.get(jobArtifactsURL, true);

  return jobArtifacts;
};

const getBuildInfo = async () => {
  const cwd = join(__dirname, '..', '..');

  const branch = await execRead('git branch | grep \\* | cut -d " " -f2', {
    cwd,
  });
  const commit = await execRead('git show -s --format=%h', {cwd});
  const checksum = await getChecksumForCurrentRevision(cwd);
  const version = `0.0.0-${commit}`;

  // Only available for Circle CI builds.
  // https://circleci.com/docs/2.0/env-vars/
  const buildNumber = process.env.CIRCLE_BUILD_NUM;

  // React version is stored explicitly, separately for DevTools support.
  // See updateVersionsForCanary() below for more info.
  const packageJSON = await readJson(
    join(cwd, 'packages', 'react', 'package.json')
  );
  const reactVersion = `${packageJSON.version}-canary-${commit}`;

  return {branch, buildNumber, checksum, commit, reactVersion, version};
};

const getChecksumForCurrentRevision = async cwd => {
  const packagesDir = join(cwd, 'packages');
  const hashedPackages = await hashElement(packagesDir, {
    encoding: 'hex',
    files: {exclude: ['.DS_Store']},
  });
  return hashedPackages.hash.slice(0, 7);
};

const getPublicPackages = () => {
  const packagesRoot = join(__dirname, '..', '..', 'packages');

  return readdirSync(packagesRoot).filter(dir => {
    if (RELEASE_SCRIPT_PACKAGE_SKIPLIST.includes(dir)) {
      return false;
    }

    const packagePath = join(packagesRoot, dir, 'package.json');

    if (dir.charAt(0) !== '.' && statSync(packagePath).isFile()) {
      const packageJSON = JSON.parse(readFileSync(packagePath));

      return packageJSON.private !== true;
    }

    return false;
  });
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
// Canaries version numbers use the format of 0.0.0-<sha> to be easily recognized (e.g. 0.0.0-57239eac8).
// A separate "React version" is used for the embedded renderer version to support DevTools,
// since it needs to distinguish between different version ranges of React.
// It is based on the version of React in the local package.json (e.g. 16.6.1-canary-57239eac8).
// Both numbers will be replaced if the canary is promoted to a stable release.
const updateVersionsForCanary = async (cwd, reactVersion, version) => {
  const packages = getPublicPackages(join(cwd, 'packages'));
  const packagesDir = join(cwd, 'packages');

  // Update the shared React version source file.
  // This is bundled into built renderers.
  // The promote script will replace this with a final version later.
  const sourceReactVersionPath = join(cwd, 'packages/shared/ReactVersion.js');
  const sourceReactVersion = readFileSync(
    sourceReactVersionPath,
    'utf8'
  ).replace(
    /module\.exports = '[^']+';/,
    `module.exports = '${reactVersion}';`
  );
  writeFileSync(sourceReactVersionPath, sourceReactVersion);

  // Update the root package.json.
  // This is required to pass a later version check script.
  {
    const packageJSONPath = join(cwd, 'package.json');
    const packageJSON = await readJson(packageJSONPath);
    packageJSON.version = version;
    await writeJson(packageJSONPath, packageJSON, {spaces: 2});
  }

  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const packagePath = join(packagesDir, packageName);

    // Update version numbers in package JSONs
    const packageJSONPath = join(packagePath, 'package.json');
    const packageJSON = await readJson(packageJSONPath);
    packageJSON.version = version;

    // Also update inter-package dependencies.
    // Canary releases always have exact version matches.
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
};

module.exports = {
  confirm,
  execRead,
  getArtifactsList,
  getBuildInfo,
  getChecksumForCurrentRevision,
  getPublicPackages,
  handleError,
  logPromise,
  printDiff,
  splitCommaParams,
  theme,
  updateVersionsForCanary,
};
