'use strict';

const chalk = require('chalk');
const {readJson} = require('fs-extra');
const {join} = require('path');
const semver = require('semver');

module.exports = async ({cwd, version}) => {
  if (!semver.valid(version)) {
    throw Error('Invalid version specified');
  }

  const rootPackage = await readJson(join(cwd, 'package.json'));

  if (!semver.gt(version, rootPackage.version)) {
    throw Error(
      chalk`Version {white ${rootPackage.version}} has already been published`
    );
  }
};
