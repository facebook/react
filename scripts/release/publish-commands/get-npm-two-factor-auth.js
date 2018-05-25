#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const logUpdate = require('log-update');
const prompt = require('prompt-promise');

module.exports = async params => {
  logUpdate(chalk`{green ✓} Npm two-factor auth code {gray (or blank)}: `);
  const opt = await prompt('');
  prompt.done();
  logUpdate.clear();
  return opt.trim() || null;
};
