'use strict';

const Git = require('nodegit');
const {existsSync} = require('fs');
const exec = require('child_process').exec;
const {join} = require('path');
const {cleanDir, asyncCopyTo} = require('./utils.js');

const reactUrl = 'https://github.com/facebook/react.git';

function executeCommand(command) {
  return new Promise(_resolve =>
    exec(command, error => {
      if (!error) {
        _resolve();
      } else {
        console.error(error);
        process.exit(1);
      }
    })
  );
}

async function getMergeBaseFromLocalGitRepo(localRepo) {
  const repo = await Git.Repository.open(localRepo);
  return await Git.Merge.base(
    repo,
    await repo.getHeadCommit(),
    await repo.getBranchCommit('master')
  );
}

async function buildReactBundlesFromGitRepo(
  remoteReactPath,
  commitId,
  skipBuild,
  url = reactUrl,
  clean
) {
  let repo;

  if (!skipBuild) {
    if (clean) {
      //clear remote-repo folder
      await cleanDir(remoteReactPath);
    }
    // check if remote-repo directory already exists
    if (existsSync(remoteReactPath)) {
      repo = await Git.Repository.open(remoteReactPath);
      // fetch all the latest remote changes
      await repo.fetchAll();
    } else {
      // if not, clone the repo to remote-repo folder
      repo = await Git.Clone(url, remoteReactPath);
    }
    let commit = await repo.getBranchCommit('master');
    // reset hard to this remote head
    await Git.Reset.reset(repo, commit, Git.Reset.TYPE.HARD);
    // then we checkout the latest master head
    await repo.checkoutBranch('master');
    // make sure we pull in the latest changes
    await repo.mergeBranches('master', 'origin/master');
    // then we check if we need to move the HEAD to the merge base
    if (commitId && commitId !== 'master') {
      // as the commitId probably came from our local repo
      // we use it to lookup the right commit in our remote repo
      commit = await Git.Commit.lookup(repo, commitId);
      // then we checkout the merge base
      await Git.Checkout.tree(repo, commit);
    }
    await buildReactBundles(remoteReactPath);
  }
}

async function buildReactBundles(reactPath, skipBuild) {
  if (!skipBuild) {
    await executeCommand(
      `cd ${reactPath} && yarn && yarn build react/index,react-dom/index --type=UMD_PROD`
    );
  }
}

async function buildBenchmark(reactPath, benchmarksPath, benchmark) {
  // get the build.js from the benchmark directory and execute it
  await require(join(benchmarksPath, benchmark, 'build.js'))(
    reactPath,
    asyncCopyTo
  );
}

// if run directly via CLI
if (require.main === module) {
  buildReactBundlesFromGitRepo(join(__dirname, 'remote-repo'));
}

module.exports = {
  buildReactBundles,
  buildReactBundlesFromGitRepo,
  getMergeBaseFromLocalGitRepo,
  buildBenchmark,
};
