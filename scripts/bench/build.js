'use strict';

const Git = require('nodegit');
const rimraf = require('rimraf');
const ncp = require('ncp').ncp;
const {existsSync} = require('fs');
const exec = require('child_process').exec;
const {join} = require('path');

const reactUrl = 'https://github.com/facebook/react.git';

function cleanDir() {
  return new Promise(_resolve => rimraf('remote-repo', _resolve));
}

function executeCommand(command) {
  return new Promise((_resolve, _reject) =>
    exec(command, (error, stdout, stderr) => {
      if (!error) {
        _resolve(stdout);
      } else {
        const message = `Command failed: ${command}\n${error.message}`;
        if (stderr) {
          message += `\nStderr: ${stderr}`;
        }
        _reject(new Error(message));
      }
    })
  );
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
  return join(__dirname, 'remote-repo');
}

async function buildBenchmark(reactPath = getDefaultReactPath(), benchmark) {
  // get the build.js from the benchmark directory and execute it
  await require(join(__dirname, 'benchmarks', benchmark, 'build.js'))(
    reactPath,
    asyncCopyTo
  );
}

async function getMergeBaseFromLocalGitRepo(localRepo) {
  if (!existsSync(localRepo)) {
    throw new Error(`Local repo path does not exist: ${localRepo}`);
  }
  try {
    const repo = await Git.Repository.open(localRepo);
    return await Git.Merge.base(
      repo,
      await repo.getHeadCommit(),
      await repo.getBranchCommit('main')
    );
  } catch (error) {
    throw new Error(`Failed to get merge base from local repo: ${error.message}`);
  }
}

async function buildBenchmarkBundlesFromGitRepo(
  commitId,
  skipBuild,
  url = reactUrl,
  clean
) {
  if (commitId && commitId !== 'main' && !/^[a-f0-9]{7,40}$/.test(commitId)) {
    throw new Error(`Invalid commitId: "${commitId}". Must be a valid git commit hash or 'main'.`);
  }

  let repo;
  const remoteRepoDir = getDefaultReactPath();

  if (!skipBuild) {
    console.log('Preparing React repo for benchmark build...');

    if (clean) {
      console.log('Cleaning remote-repo directory...');
      await cleanDir(remoteRepoDir);
    }

    try {
      // check if remote-repo directory already exists
      if (existsSync(remoteRepoDir)) {
        console.log('Opening existing remote repo...');
        repo = await Git.Repository.open(remoteRepoDir);
        console.log('Fetching latest remote changes...');
        await repo.fetchAll();
      } else {
        console.log(`Cloning React repo from ${url}...`);
        repo = await Git.Clone(url, remoteRepoDir);
      }
    } catch (error) {
      throw new Error(`Failed to prepare React repo: ${error.message}`);
    }

    try {
      console.log('Getting main branch commit...');
      let commit = await repo.getBranchCommit('main');
      console.log('Resetting to main branch...');
      await Git.Reset.reset(repo, commit, Git.Reset.TYPE.HARD);
      console.log('Checking out main branch...');
      await repo.checkoutBranch('main');
      console.log('Merging latest changes...');
      await repo.mergeBranches('main', 'origin/main');
    } catch (error) {
      throw new Error(`Failed to update main branch: ${error.message}`);
    }

    // then we check if we need to move the HEAD to the merge base
    if (commitId && commitId !== 'main') {
      try {
        console.log(`Checking out commit ${commitId}...`);
        // as the commitId probably came from our local repo
        // we use it to lookup the right commit in our remote repo
        const commit = await Git.Commit.lookup(repo, commitId);
        // then we checkout the merge base
        await Git.Checkout.tree(repo, commit);
      } catch (error) {
        throw new Error(`Failed to checkout commit ${commitId}: ${error.message}`);
      }
    }

    try {
      await buildReactBundles();
    } catch (error) {
      throw new Error(`Failed to build React bundles: ${error.message}`);
    }
  }
}

async function buildReactBundles(reactPath = getDefaultReactPath(), skipBuild) {
  if (!skipBuild) {
    if (!existsSync(reactPath)) {
      throw new Error(`React path does not exist: ${reactPath}`);
    }

    console.log(`Building React bundles in ${reactPath}...`);

    // Check if yarn is available
    try {
      await executeCommand('yarn --version');
    } catch (error) {
      throw new Error('Yarn is not available. Please install yarn to build React bundles.');
    }

    try {
      await executeCommand(
        `cd ${reactPath} && yarn install && yarn build react/index,react-dom/index --type=UMD_PROD`
      );
    } catch (error) {
      throw new Error(`Failed to build React bundles: ${error.message}`);
    }

    console.log('React bundles built successfully.');
  }
}

// if run directly via CLI
if (require.main === module) {
  buildBenchmarkBundlesFromGitRepo();
}

module.exports = {
  buildReactBundles,
  buildBenchmark,
  buildBenchmarkBundlesFromGitRepo,
  getMergeBaseFromLocalGitRepo,
};
