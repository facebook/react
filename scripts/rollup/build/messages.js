'use strict';

const chalk = require('chalk');

function building(logKey) {
  return `${chalk.bgYellow.black(' BUILDING ')} ${logKey}`;
}

function complete(logKey) {
  return `${chalk.bgGreen.black(' COMPLETE ')} ${logKey}\n`;
}

function fatal(logKey) {
  return `${chalk.bgRed.black(' OH NOES! ')} ${logKey}\n`;
}

module.exports = {
  building,
  complete,
  fatal,
};
