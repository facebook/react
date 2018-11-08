'use strict';

const chalk = require('chalk');
const {dots} = require('cli-spinners');
const {exec} = require('child-process-promise');
const {readdirSync, readFileSync, statSync} = require('fs');
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

const getPackages = () => {
  const packagesRoot = join(__dirname, '..', '..', 'packages');

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

module.exports = {
  execRead,
  execUnlessDry,
  getPackages,
  getPublicPackages,
  getUnexecutedCommands,
  logPromise,
  runYarnTask,
};
