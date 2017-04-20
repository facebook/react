'use strict';

const Git = require('nodegit');
const rimraf = require('rimraf');
const ncp = require('ncp').ncp;
const { 
  existsSync,
} = require('fs');
const exec = require('child_process').exec;
const {
  join,
} = require('path');

const reactUrl = 'https://github.com/facebook/react.git';

function cleanDir() {
  return new Promise(_resolve => rimraf('build', _resolve));
}

function executeCommand(command) {
  return new Promise(_resolve => exec(command, (error) => {
    if (!error) {
      _resolve();
    } else {
      console.error(error);
      process.exit(1);
    }
  }));
}

function asyncCopyTo(from, to) {
  return new Promise(_resolve => {
    ncp(from, to, error => {
      if (error) {
        console.error(error);
        process.exit(1);
      }
      _resolve();
    });
  });
}

async function buildFunctionalComponentsBenchmarkBundle(reactPath) {
  // build the react FB bundles in the build
  await executeCommand(`cd ${reactPath} && yarn && yarn build -- core,dom-fiber --type=UMD_PROD`);
  // copy the UMD bundles
  await asyncCopyTo(
    join(reactPath, 'build', 'dist', 'react.production.min.js'),
    join(__dirname, 'benchmarks', 'functional-components', 'react.production.min.js')
  );
  await asyncCopyTo(
    join(reactPath, 'build', 'dist', 'react-dom.production.min.js'),
    join(__dirname, 'benchmarks', 'functional-components', 'react-dom.production.min.js')
  );
}

function getBundleResults(reactPath) {
  return require(join(reactPath, 'scripts', 'rollup', 'results.json'));
}

async function buildBenchmarkBundlesFromGitRepo(url = reactUrl, commit, clean) {
  let repo;

  if (clean) {
    //clear build folder
    await cleanDir(join(__dirname, 'build'));
  }
  // check if build diretory already exists
  if (existsSync(join(__dirname, 'build'))) {
    repo = await Git.Repository.open(join(__dirname, 'build'));
    await repo.fetchAll();
    await repo.mergeBranches('master', 'origin/master');
  } else {
    // if not, clone the repo to build folder
    repo = await Git.Clone(url, join(__dirname, 'build'));
  }
  await buildBenchmarks(join(__dirname, 'build'));
  return getBundleResults(join(__dirname, 'build'));
}

async function buildBenchmarks(reactPath) {
  // removed for now
  // await buildFacebookWWWBenchmarkBundle(reactPath);
  await buildFunctionalComponentsBenchmarkBundle(reactPath);
  return getBundleResults(reactPath);
}

// if run directly via CLI
if (require.main === module) {
  buildBenchmarkBundlesFromGitRepo();
}

module.exports = {
  buildBenchmarkBundlesFromGitRepo,
  buildBenchmarks,
};
