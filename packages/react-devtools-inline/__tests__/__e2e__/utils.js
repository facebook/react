'use strict';

/** @flow */

const semver = require('semver');
const config = require('../../playwright.config');
const {test} = require('@playwright/test');

function runOnlyForReactRange(range) {
  // eslint-disable-next-line jest/no-disabled-tests
  test.skip(
    !semver.satisfies(config.use.react_version, range),
    `This test requires a React version of ${range} to run. ` +
      `The React version you're using is ${config.use.react_version}`
  );
}

module.exports = {runOnlyForReactRange};
