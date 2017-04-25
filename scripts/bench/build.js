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

function getDefaultReactPath() {
  return join(__dirname, 'build');
}

async function buldAllBundles(reactPath = getDefaultReactPath()) {
  // build the react FB bundles in the build
  await executeCommand(`cd ${reactPath} && yarn && yarn build`);
}

async function buildBenchmark(reactPath = getDefaultReactPath(), benchmark) {
  // get the build.js from the benchmark directory and execute it
  await require(
    join(__dirname, 'benchmarks', benchmark, 'build.js')
  )(reactPath, asyncCopyTo);
}

function getBundleResults(reactPath = getDefaultReactPath()) {
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
  await buildAllBundles();
  return getBundleResults();
}

async function buildAllBundles(reactPath) {
  // build all bundles so we can get all stats and use bundles for benchmarks
  await buldAllBundles(reactPath);
  return getBundleResults(reactPath);
}

// if run directly via CLI
if (require.main === module) {
  buildBenchmarkBundlesFromGitRepo();
}

module.exports = {
  buildAllBundles,
  buildBenchmark,
  buildBenchmarkBundlesFromGitRepo,
};
