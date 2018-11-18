#!/usr/bin/env node

'use strict';

const prompt = require('prompt-promise');
const theme = require('../theme');

const run = async () => {
  while (true) {
    const otp = await prompt('NPM 2-factor auth code: ');
    prompt.done();

    if (otp) {
      return otp;
    } else {
      console.log();
      console.log(theme.error`Two-factor auth is required to publish.`);
      // (Ask again.)
    }
  }
};

module.exports = run;
