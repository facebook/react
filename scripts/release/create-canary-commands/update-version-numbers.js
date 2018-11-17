#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {logPromise, updateVersionsForCanary} = require('../utils');

module.exports = async ({reactVersion, tempDirectory, version}) => {
  return logPromise(
    updateVersionsForCanary(tempDirectory, reactVersion, version),
    `Updating version numbers (${chalk.yellow.bold(version)})`
  );
};
