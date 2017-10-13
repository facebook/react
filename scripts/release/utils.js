'use strict';

const chalk = require('chalk');
const {dots} = require('cli-spinners');
const {exec} = require('child-process-promise');
const logUpdate = require('log-update');

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

const logPromise = async (promise, text, completedLabel = '') => {
  const {frames, interval} = dots;

  let index = 0;

  const id = setInterval(() => {
    index = ++index % frames.length;
    logUpdate(
      `${chalk.yellow(frames[index])} ${text} ${chalk.gray('- this may take a few seconds')}`
    );
  }, interval);

  try {
    const returnValue = await promise;

    clearInterval(id);

    logUpdate(`${chalk.green('✓')} ${text} ${chalk.gray(completedLabel)}`);
    logUpdate.done();

    return returnValue;
  } catch (error) {
    logUpdate.clear();

    throw error;
  }
};

module.exports = {
  execRead,
  execUnlessDry,
  getUnexecutedCommands,
  logPromise,
};
