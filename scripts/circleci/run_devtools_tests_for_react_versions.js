#!/usr/bin/env node

'use strict';

const {exec} = require('child-process-promise');
const chalk = require('chalk');
const {join} = require('path');
const fs = require('fs');

const ROOT_PATH = join(__dirname, '..', '..');

const buildPath = (process.env.E2E_APP_BUILD_DIR = join(
  ROOT_PATH,
  `build-${process.argv[2]}`,
  'node_modules'
));

const build = join(ROOT_PATH, `build`, 'oss-experimental');

const tmpBuildPath = join(ROOT_PATH, `build-${process.argv[2]}`);

const version = process.argv[2];

console.log(version);

// function getSchedulerVersion(version) {
//   if (semver.semverGte(''))
// }

async function buildVersion() {
  console.log(chalk.bold(`Running DevTools tests for v${version}`));
  console.log(chalk.gray(`Downloading React v${version}`));
  const a = await exec(`echo $(ls ${buildPath})`);
  console.log(a.stdout);
  console.log(chalk.gray(`Make Build directory build-${version}`));
  await exec(`mkdir build-${version}`);
  console.log(chalk.gray(`build version made`));
  await exec(
    `npm install --prefix build-${version}` +
      ` react-dom@${version} react@${version} react-test-renderer@${version} scheduler@0.20.1`
  );

  await exec(
    `rm -r ${join(build, 'react')} ${join(build, 'react-dom')} ${join(
      build,
      'react-test-renderer'
    )}`
  );

  if (fs.existsSync(join(buildPath, 'scheduler'))) {
    console.log(chalk.gray(`copy scheduler`));
    await exec(`rm -r ${join(build, 'scheduler')}`);
    await exec(`mv ${join(buildPath, 'scheduler')} ${build}`);
  }

  if (fs.existsSync(join(buildPath, 'schedule'))) {
    console.log(chalk.gray(`copy schedule`));
    await exec(`mv ${join(buildPath, 'schedule')} ${build}`);
  }

  console.log(chalk.gray(`move files`));
  await exec(
    `mv ${join(buildPath, 'react')} ${join(buildPath, 'react-dom')} ${join(
      buildPath,
      'react-test-renderer'
    )} ${build}`
  );
  console.log(await exec('ls ./build'));
  console.log(await exec('ls ./build/oss-experimental/react'));
  console.log(
    await exec('grep -i "version" ./build/oss-experimental/react/package.json')
  );
  console.log(chalk.gray(`run test `));
  await exec(`yarn test-build-devtools --reactVersion ${version}`);
  console.log(chalk.gray(`test finished`));
}

async function main() {
  try {
    await buildVersion();
  } catch (e) {
    console.log(chalk.red(e));
  } finally {
    console.log(chalk.gray(`Removing built node modules`));
    await exec(`rm -r ${tmpBuildPath}`);
  }
}

main();
