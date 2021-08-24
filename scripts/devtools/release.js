#!/usr/bin/env node

'use strict';

const {exec} = require('child-process-promise');
const {readFileSync, writeFileSync} = require('fs');
const {readJsonSync, writeJsonSync} = require('fs-extra');
const inquirer = require('inquirer');
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

const CHANGELOG_PATH = 'packages/react-devtools/CHANGELOG.md';

const PULL_REQUEST_BASE_URL = 'https://github.com/facebook/react/pull/';

const RELEASE_SCRIPT_TOKEN = '<!-- RELEASE_SCRIPT_TOKEN -->';

const ROOT_PATH = join(__dirname, '..', '..');

async function main() {
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

  console.log(
    `\nPackages and manifests have been updated from version \x1b[1m${previousVersion}\x1b[0m to \x1b[1m${nextVersion}\x1b[0m\n`
  );

  const sha = await getPreviousCommitSha();
  const commitLog = await getCommitLog(sha);

  updateChangelog(nextVersion, commitLog);

  console.log(
    '\nDevTools changelog has been updated with commits since the previous release. ' +
      'Please review the new entries and add GitHub usernames. ' +
      'Once this is done, commit all pending changes using:' +
      `\n\n  \x1b[1\x1b[32mgit commit -am "React DevTools ${previousVersion} -> ${nextVersion}"\x1b[0m\n`
  );
}

const execRead = async (command, options) => {
  const {stdout} = await exec(command, options);

  return stdout.trim();
};

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
      name: `\x1b[1m${hash}\x1b[0m \x1b[2m- ${date} -\x1b[0m ${message}`,
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

  writeFileSync(path, newChangelog);
}

function updateManifestVersions(previousVersion, nextVersion) {
  MANIFEST_PATHS.forEach(partialPath => {
    const path = join(ROOT_PATH, partialPath);
    const json = readJsonSync(path);
    json.version = nextVersion;

    if (json.hasOwnProperty('version_name')) {
      json.version_name = nextVersion;
    }

    writeJsonSync(path, json, {spaces: 2});
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

    writeJsonSync(path, json, {spaces: 2});
  });
}

main();
