'use strict';

const Git = require("nodegit");
const rimraf = require('rimraf');
const ncp = require('ncp').ncp;
const argv = require('minimist')(process.argv.slice(2));
const { 
  existsSync,
  readFileSync,
  writeFileSync
} = require('fs');
const exec = require('child_process').exec;
const {
  join,
  resolve,
} = require('path');
const compile = require('google-closure-compiler-js').compile;

const reactUrl = 'https://github.com/facebook/react.git';

function cleanDir() {
  return new Promise(resolve => rimraf('build', resolve));
}

function executeCommand(command) {
  return new Promise(resolve => exec(command, (error) => {
    if (!error) {
      resolve();
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

function minify(src) {
  return compile({ jsCode: [{ src }], languageIn: 'ECMASCRIPT5' }).compiledCode;
}

// remove for now
// async function buildFacebookWWWBenchmarkBundle(reactPath) {
//   // build the react FB bundles in the build
//   await executeCommand(`cd ${reactPath} && yarn && yarn build -- core,dom-fiber --type=FB_PROD`);
//   // read the www-bundle template
//   let wwwBundleTemplate = readFileSync(
//     join(__dirname, 'templates', 'www-bundle.js'), 'utf8'
//   );
//   // read the React-prod bundle from the build
//   const reactProdBundle = minify(readFileSync(
//     join(reactPath, 'build', 'facebook-www', 'React-prod.js'), 'utf8'
//   ));
//   // read the ReactDOMFiber-prod bundle from the build
//   const reactDOMFiberProdBundle = minify(readFileSync(
//     join(reactPath, 'build', 'facebook-www', 'ReactDOMFiber-prod.js'), 'utf8'
//   ));
//   // replace the template placeholders with the correct bundles
//   wwwBundleTemplate = wwwBundleTemplate.replace(
//     '/* <--React-prod--> */', reactProdBundle
//   );
//   wwwBundleTemplate = wwwBundleTemplate.replace(
//     '/* <--ReactDOMFiber-prod--> */', reactDOMFiberProdBundle
//   );
//   // output the new bundle file in www
//   writeFileSync(join(__dirname, 'benchmarks', 'facebook-www', 'benchmark.js'), wwwBundleTemplate);
// }

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
  } else {
    // if not, clone the repo to build folder
    repo = await Git.Clone(url, join(__dirname, 'build'));
  }
  if (commit) {
    repo.getCommit(commit);
  } else {
    repo.getMasterCommit();
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
