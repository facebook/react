'use strict';

const chalk = require('chalk');
const {dots} = require('cli-spinners');
const {exec} = require('child-process-promise');
const logUpdate = require('log-update');

const execRead = async (command, options) => {
  const {stdout} = await exec(command, options);

  return stdout.trim();
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
  logPromise,
};
