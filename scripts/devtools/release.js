#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {exec} = require('child-process-promise');
const {readFileSync, writeFileSync} = require('fs');
const {readJsonSync, writeJsonSync} = require('fs-extra');
const inquirer = require('inquirer');
const {homedir} = require('os');
const createLogger = require('progress-estimator');
const {join} = require('path');
const semver = require('semver');

const PACKAGE_PATHS = [
  'packages/react-devtools/package.json',
  'packages/react-devtools-core/package.json',
  'packages/react-devtools-inline/package.json',
  'packages/react-devtools-scheduling-profiler/package.json',
];

const MANIFEST_PATHS = [
  'packages/react-devtools-extensions/chrome/manifest.json',
  'packages/react-devtools-extensions/edge/manifest.json',
  'packages/react-devtools-extensions/firefox/manifest.json',
];

const NPM_PACKAGES = [
  'react-devtools',
  'react-devtools-core',
  'react-devtools-inline',
];

const CHANGELOG_PATH = 'packages/react-devtools/CHANGELOG.md';

const PULL_REQUEST_BASE_URL = 'https://github.com/facebook/react/pull/';

const RELEASE_SCRIPT_TOKEN = '<!-- RELEASE_SCRIPT_TOKEN -->';

const ROOT_PATH = join(__dirname, '..', '..');

const DRY_RUN = process.argv.includes('--dry');

const logger = createLogger({
  storagePath: join(__dirname, '.progress-estimator'),
});

// This is the primary control function for this script.
async function main() {
  await checkNPMPermissions();

  const releaseType = await getReleaseType();

  const path = join(ROOT_PATH, PACKAGE_PATHS[0]);
  const previousVersion = readJsonSync(path).version;
  const {major, minor, patch} = semver(previousVersion);
  const nextVersion =
    releaseType === 'minor'
      ? `${major}.${minor + 1}.${patch}`
      : `${major}.${minor}.${patch + 1}`;

  updatePackageVersions(previousVersion, nextVersion);
  updateManifestVersions(previousVersion, nextVersion);

  console.log('');
  console.log(
    `Packages and manifests have been updated from version ${chalk.bold(
      previousVersion
    )} to ${chalk.bold(nextVersion)}`
  );
  console.log('');

  const sha = await getPreviousCommitSha();
  const commitLog = await getCommitLog(sha);

  updateChangelog(nextVersion, commitLog);

  await reviewChangelogPrompt();

  await commitPendingChanges(previousVersion, nextVersion);

  const archivePath = await archiveGitRevision();
  const buildID = await downloadLatestReactBuild();

  await buildAndTestInlinePackage();
  await buildAndTestStandalonePackage();
  await buildAndTestExtensions();

  await publishToNPM();

  await printFinalInstructions(buildID, archivePath);
}

async function archiveGitRevision() {
  const desktopPath = join(homedir(), 'Desktop');
  const archivePath = join(desktopPath, 'DevTools.tgz');

  console.log(`Creating git archive at ${chalk.dim(archivePath)}`);
  console.log('');

  if (!DRY_RUN) {
    await exec(`git archive main | gzip > ${archivePath}`, {cwd: ROOT_PATH});
  }

  return archivePath;
}

async function buildAndTestExtensions() {
  const extensionsPackagePath = join(
    ROOT_PATH,
    'packages',
    'react-devtools-extensions'
  );
  const buildExtensionsPromise = exec('yarn build', {
    cwd: extensionsPackagePath,
  });

  await logger(
    buildExtensionsPromise,
    `Building browser extensions ${chalk.dim('(this may take a minute)')}`,
    {
      estimate: 60000,
    }
  );

  console.log('');
  console.log(`Extensions have been build for Chrome, Edge, and Firefox.`);
  console.log('');
  console.log('Smoke test each extension before continuing:');
  console.log(`  ${chalk.bold.green('cd ' + extensionsPackagePath)}`);
  console.log('');
  console.log(`  ${chalk.dim('# Test Chrome extension')}`);
  console.log(`  ${chalk.bold.green('yarn test:chrome')}`);
  console.log('');
  console.log(`  ${chalk.dim('# Test Edge extension')}`);
  console.log(`  ${chalk.bold.green('yarn test:edge')}`);
  console.log('');
  console.log(`  ${chalk.dim('# Firefox Chrome extension')}`);
  console.log(`  ${chalk.bold.green('yarn test:firefox')}`);

  await confirmContinue();
}

async function buildAndTestStandalonePackage() {
  const corePackagePath = join(ROOT_PATH, 'packages', 'react-devtools-core');
  const buildCorePromise = exec('yarn build', {cwd: corePackagePath});

  await logger(
    buildCorePromise,
    `Building ${chalk.bold('react-devtools-core')} package.`,
    {
      estimate: 25000,
    }
  );

  const standalonePackagePath = join(ROOT_PATH, 'packages', 'react-devtools');
  const safariFixturePath = join(
    ROOT_PATH,
    'fixtures',
    'devtools',
    'standalone',
    'index.html'
  );

  console.log('');
  console.log(
    `Test the ${chalk.bold('react-devtools-core')} target before continuing:`
  );
  console.log(`  ${chalk.bold.green('cd ' + standalonePackagePath)}`);
  console.log(`  ${chalk.bold.green('yarn start')}`);
  console.log('');
  console.log(
    'The following fixture can be useful for testing Safari integration:'
  );
  console.log(`  ${chalk.dim(safariFixturePath)}`);

  await confirmContinue();
}

async function buildAndTestInlinePackage() {
  const inlinePackagePath = join(
    ROOT_PATH,
    'packages',
    'react-devtools-inline'
  );
  const buildPromise = exec('yarn build', {cwd: inlinePackagePath});

  await logger(
    buildPromise,
    `Building ${chalk.bold('react-devtools-inline')} package.`,
    {
      estimate: 10000,
    }
  );

  const shellPackagePath = join(ROOT_PATH, 'packages', 'react-devtools-shell');

  console.log('');
  console.log(`Built ${chalk.bold('react-devtools-inline')} target.`);
  console.log('');
  console.log('Test this build before continuing:');
  console.log(`  ${chalk.bold.green('cd ' + shellPackagePath)}`);
  console.log(`  ${chalk.bold.green('yarn start')}`);

  await confirmContinue();
}

async function checkNPMPermissions() {
  const currentUser = await execRead('npm whoami');
  const failedProjects = [];

  const checkProject = async project => {
    const owners = (await execRead(`npm owner ls ${project}`))
      .split('\n')
      .filter(owner => owner)
      .map(owner => owner.split(' ')[0]);

    if (!owners.includes(currentUser)) {
      failedProjects.push(project);
    }
  };

  await logger(
    Promise.all(NPM_PACKAGES.map(checkProject)),
    `Checking NPM permissions for ${chalk.bold(currentUser)}.`,
    {estimate: 2500}
  );

  console.log('');

  if (failedProjects.length) {
    console.error(chalk.bold('Insufficient NPM permissions'));
    console.error('');
    console.error(
      `NPM user {underline ${currentUser}} is not an owner for: ${chalk.bold(
        failedProjects.join(', ')
      )}`
    );
    console.error(
      'Please contact a React team member to be added to the above project(s).'
    );
    process.exit(1);
  }
}

async function commitPendingChanges(previousVersion, nextVersion) {
  console.log('');
  console.log('Committing revision and changelog.');
  console.log(chalk.dim('  git add .'));
  console.log(
    chalk.dim(
      `  git commit -m "React DevTools ${previousVersion} -> ${nextVersion}"`
    )
  );

  if (!DRY_RUN) {
    await exec(`
      git add .
      git commit -m "React DevTools ${previousVersion} -> ${nextVersion}"
    `);
  }

  console.log('');
  console.log(`Please push this commit before continuing:`);
  console.log(`  ${chalk.bold.green('git push')}`);

  await confirmContinue();
}

async function confirmContinue() {
  console.log('');

  const {confirm} = await inquirer.prompt({
    name: 'confirm',
    type: 'confirm',
    message: 'Continue the release?',
  });
  if (!confirm) {
    process.exit(0);
  }

  console.log('');
}

async function downloadLatestReactBuild() {
  const releaseScriptPath = join(ROOT_PATH, 'scripts', 'release');
  const installPromise = exec('yarn install', {cwd: releaseScriptPath});

  await logger(installPromise, 'Installing release script dependencies.', {
    estimate: 5000,
  });

  console.log('');

  const {commit} = await inquirer.prompt([
    {
      type: 'input',
      name: 'commit',
      message: 'Which React version (commit) should be used?',
      default: 'main',
    },
  ]);
  console.log('');

  const downloadScriptPath = join(
    releaseScriptPath,
    'download-experimental-build.js'
  );
  const downloadPromise = execRead(
    `"${downloadScriptPath}" --commit=${commit}`
  );

  const output = await logger(
    downloadPromise,
    'Downloading React artifacts from CI.',
    {estimate: 15000}
  );

  const match = output.match('--build=([0-9]+)');
  if (match.length === 0) {
    console.error(`No build ID found in "${output}"`);
    process.exit(1);
  }

  const buildID = match[1];

  console.log('');
  console.log(`Downloaded artiacts for CI build ${chalk.bold(buildID)}.`);

  await confirmContinue();

  return buildID;
}

async function execRead(command, options) {
  const {stdout} = await exec(command, options);

  return stdout.trim();
}

async function getCommitLog(sha) {
  let formattedLog = '';

  const rawLog = await execRead(`
    git log --topo-order --pretty=format:'%s' ${sha}...HEAD -- packages/react-devtools*
  `);
  rawLog.split('\n').forEach(line => {
    line = line.replace('[DevTools] ', '');

    const match = line.match(/(.+) \(#([0-9]+)\)/);
    if (match !== null) {
      const title = match[1];
      const pr = match[2];

      formattedLog += `\n* ${title} ([USERNAME](https://github.com/USERNAME) in [#${pr}](${PULL_REQUEST_BASE_URL}${pr}))`;
    } else {
      formattedLog += `\n* ${line}`;
    }
  });

  return formattedLog;
}

async function getPreviousCommitSha() {
  const choices = [];

  const lines = await execRead(`
    git log --max-count=5 --topo-order --pretty=format:'%H:::%s:::%as' HEAD -- ${PACKAGE_PATHS[0]}
  `);
  lines.split('\n').forEach((line, index) => {
    const [hash, message, date] = line.split(':::');
    choices.push({
      name: `${chalk.bold(hash)} ${chalk.dim(date)} ${message}`,
      value: hash,
      short: date,
    });
  });

  const {sha} = await inquirer.prompt([
    {
      type: 'list',
      name: 'sha',
      message: 'Which of the commits above marks the last DevTools release?',
      choices,
      default: choices[0].value,
    },
  ]);

  return sha;
}

async function getReleaseType() {
  const {releaseType} = await inquirer.prompt([
    {
      type: 'list',
      name: 'releaseType',
      message: 'Which type of release is this?',
      choices: [
        {
          name: 'Minor (new user facing functionality)',
          value: 'minor',
          short: 'Minor',
        },
        {name: 'Patch (bug fixes only)', value: 'patch', short: 'Patch'},
      ],
      default: 'patch',
    },
  ]);

  return releaseType;
}

async function printFinalInstructions(buildID, archivePath) {
  console.log('');
  console.log(
    'You are now ready to publish the extension to Chrome, Edge, and Firefox:'
  );
  console.log(
    `  ${chalk.blue.underline(
      'https://fburl.com/publish-react-devtools-extensions'
    )}`
  );
  console.log('');
  console.log('When publishing to Firefox, remember the following:');
  console.log(`  Build id: ${chalk.bold(buildID)}`);
  console.log(`  Git archive: ${chalk.bold(archivePath)}`);
  console.log('');
  console.log('Also consider syncing this release to Facebook:');
  console.log(`  ${chalk.bold.green('js1 upgrade react-devtools')}`);
}

async function publishToNPM() {
  const {otp} = await inquirer.prompt([
    {
      type: 'input',
      name: 'otp',
      message: 'Please provide an NPM two-factor auth token:',
    },
  ]);

  console.log('');

  if (!otp) {
    console.error(`Invalid OTP provided: "${chalk.bold(otp)}"`);
    process.exit(0);
  }

  for (let index = 0; index < NPM_PACKAGES.length; index++) {
    const npmPackage = NPM_PACKAGES[index];
    const packagePath = join(ROOT_PATH, 'packages', npmPackage);

    if (DRY_RUN) {
      console.log(`Publishing package ${chalk.bold(npmPackage)}`);
      console.log(chalk.dim(`  npm publish --otp=${otp}`));
    } else {
      const publishPromise = exec(`npm publish --otp=${otp}`, {
        cwd: packagePath,
      });

      await logger(
        publishPromise,
        `Publishing package ${chalk.bold(npmPackage)}`,
        {
          estimate: 2500,
        }
      );
    }
  }
}

async function reviewChangelogPrompt() {
  console.log('');
  console.log(
    'The changelog has been updated with commits since the previous release:'
  );
  console.log(`  ${chalk.bold(CHANGELOG_PATH)}`);
  console.log('');
  console.log('Please review the new changelog text for the following:');
  console.log('  1. Organize the list into Features vs Bugfixes');
  console.log('  1. Filter out any non-user-visible changes (e.g. typo fixes)');
  console.log('  1. Combine related PRs into a single bullet list.');
  console.log(
    '  1. Replacing the "USERNAME" placeholder text with the GitHub username(s)'
  );
  console.log('');
  console.log(`  ${chalk.bold.green(`open ${CHANGELOG_PATH}`)}`);

  await confirmContinue();
}

function updateChangelog(nextVersion, commitLog) {
  const path = join(ROOT_PATH, CHANGELOG_PATH);
  const oldChangelog = readFileSync(path, 'utf8');

  const [beginning, end] = oldChangelog.split(RELEASE_SCRIPT_TOKEN);

  const dateString = new Date().toLocaleDateString('en-us', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const header = `## ${nextVersion} (${dateString})`;

  const newChangelog = `${beginning}${RELEASE_SCRIPT_TOKEN}\n\n${header}\n${commitLog}${end}`;

  console.log(chalk.dim('  Updating changelog: ' + CHANGELOG_PATH));

  if (!DRY_RUN) {
    writeFileSync(path, newChangelog);
  }
}

function updateManifestVersions(previousVersion, nextVersion) {
  MANIFEST_PATHS.forEach(partialPath => {
    const path = join(ROOT_PATH, partialPath);
    const json = readJsonSync(path);
    json.version = nextVersion;

    if (json.hasOwnProperty('version_name')) {
      json.version_name = nextVersion;
    }

    console.log(chalk.dim('  Updating manifest JSON: ' + partialPath));

    if (!DRY_RUN) {
      writeJsonSync(path, json, {spaces: 2});
    }
  });
}

function updatePackageVersions(previousVersion, nextVersion) {
  PACKAGE_PATHS.forEach(partialPath => {
    const path = join(ROOT_PATH, partialPath);
    const json = readJsonSync(path);
    json.version = nextVersion;

    for (let key in json.dependencies) {
      if (key.startsWith('react-devtools')) {
        const version = json.dependencies[key];

        json.dependencies[key] = version.replace(previousVersion, nextVersion);
      }
    }

    console.log(chalk.dim('  Updating package JSON: ' + partialPath));

    if (!DRY_RUN) {
      writeJsonSync(path, json, {spaces: 2});
    }
  });
}

main();
