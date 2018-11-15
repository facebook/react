'use strict';

const chalk = require('chalk');
const {dots} = require('cli-spinners');
const {exec, spawn} = require('child-process-promise');
const {hashElement} = require('folder-hash');
const {readdirSync, readFileSync, statSync, writeFileSync} = require('fs');
const {readJson, writeJson} = require('fs-extra');
const logUpdate = require('log-update');
const {join} = require('path');

const execRead = async (command, options) => {
  const {stdout} = await exec(command, options);

  return stdout.trim();
};

const unexecutedCommands = [];

const execUnlessDry = async (command, {cwd, dry}) => {
  if (dry) {
    unexecutedCommands.push(`${command} # {cwd: ${cwd}}`);
  } else {
    await exec(command, {cwd});
  }
};

const getBuildInfo = async () => {
  const cwd = join(__dirname, '..', '..');

  const branch = await execRead('git branch | grep \\* | cut -d " " -f2', {
    cwd,
  });
  const commit = await execRead('git show -s --format=%h', {cwd});
  const checksum = await getChecksumForCurrentRevision(cwd);
  const version = `0.0.0-${commit}`;

  return {branch, checksum, commit, version};
};

const getChecksumForCurrentRevision = async cwd => {
  const packagesDir = join(cwd, 'packages');
  const hashedPackages = await hashElement(packagesDir, {
    encoding: 'hex',
    files: {exclude: ['.DS_Store']},
  });
  return hashedPackages.hash.slice(0, 7);
};

const getPackages = (
  packagesRoot = join(__dirname, '..', '..', 'packages')
) => {
  return readdirSync(packagesRoot).filter(dir => {
    const packagePath = join(packagesRoot, dir, 'package.json');

    if (dir.charAt(0) !== '.' && statSync(packagePath).isFile()) {
      const packageJSON = JSON.parse(readFileSync(packagePath));

      // Skip packages like "shared" and "events" that shouldn't be updated.
      return packageJSON.version !== '0.0.0';
    }

    return false;
  });
};

const getPublicPackages = () => {
  const packagesRoot = join(__dirname, '..', '..', 'packages');

  return readdirSync(packagesRoot).filter(dir => {
    const packagePath = join(packagesRoot, dir, 'package.json');

    if (dir.charAt(0) !== '.' && statSync(packagePath).isFile()) {
      const packageJSON = JSON.parse(readFileSync(packagePath));

      return packageJSON.private !== true;
    }

    return false;
  });
};

const getUnexecutedCommands = () => {
  if (unexecutedCommands.length > 0) {
    return chalk`
      The following commands were not executed because of the {bold --dry} flag:
      {gray ${unexecutedCommands.join('\n')}}
    `;
  } else {
    return '';
  }
};

const handleError = error => {
  logUpdate.clear();

  const message = error.message.trim().replace(/\n +/g, '\n');
  const stack = error.stack.replace(error.message, '');

  console.log(
    `${chalk.bgRed.white(' ERROR ')} ${chalk.red(message)}\n\n${chalk.gray(
      stack
    )}`
  );

  process.exit(1);
};

const logPromise = async (promise, text, isLongRunningTask = false) => {
  const {frames, interval} = dots;

  let index = 0;

  const inProgressMessage = `- this may take a few ${
    isLongRunningTask ? 'minutes' : 'seconds'
  }`;

  const id = setInterval(() => {
    index = ++index % frames.length;
    logUpdate(
      `${chalk.yellow(frames[index])} ${text} ${chalk.gray(inProgressMessage)}`
    );
  }, interval);

  try {
    const returnValue = await promise;

    clearInterval(id);

    logUpdate(`${chalk.green('✓')} ${text}`);
    logUpdate.done();

    return returnValue;
  } catch (error) {
    logUpdate.clear();

    throw error;
  }
};

const runYarnTask = async (cwd, task, errorMessage) => {
  try {
    await exec(`yarn ${task}`, {cwd});
  } catch (error) {
    throw Error(
      chalk`
      ${errorMessage}

      {white ${error.stdout}}
    `
    );
  }
};

const spawnCommand = (command, options) =>
  spawn(command, {
    cwd: join(__dirname, '..', '..'),
    encoding: 'utf-8',
    env: process.env,
    shell: true,
    stdio: [process.stdin, process.stdout, process.stderr],
    ...options,
  });

const updateVersionsForCanary = async (cwd, version) => {
  const packages = getPackages(join(cwd, 'packages'));
  const packagesDir = join(cwd, 'packages');

  // Update the shared React version source file.
  // This is bundled into built renderers.
  // The promote script will replace this with a final version later.
  const reactVersionPath = join(cwd, 'packages/shared/ReactVersion.js');
  const reactVersion = readFileSync(reactVersionPath, 'utf8').replace(
    /module\.exports = '[^']+';/,
    `module.exports = '${version}';`
  );
  writeFileSync(reactVersionPath, reactVersion);

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
  execRead,
  execUnlessDry,
  getBuildInfo,
  getChecksumForCurrentRevision,
  getPackages,
  getPublicPackages,
  getUnexecutedCommands,
  handleError,
  logPromise,
  runYarnTask,
  spawnCommand,
  updateVersionsForCanary,
};
