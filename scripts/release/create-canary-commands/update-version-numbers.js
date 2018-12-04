#!/usr/bin/env node

'use strict';

const {logPromise, updateVersionsForCanary} = require('../utils');
const theme = require('../theme');

module.exports = async ({reactVersion, tempDirectory, version}) => {
  return logPromise(
    updateVersionsForCanary(tempDirectory, reactVersion, version),
    theme`Updating version numbers ({version ${version}})`
  );
};
