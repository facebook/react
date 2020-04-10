#!/usr/bin/env node

'use strict';

const {logPromise, updateVersionsForNext} = require('../utils');
const theme = require('../theme');

module.exports = async ({reactVersion, tempDirectory, version}) => {
  return logPromise(
    updateVersionsForNext(tempDirectory, reactVersion, version),
    theme`Updating version numbers ({version ${version}})`
  );
};
