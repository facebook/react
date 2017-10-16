#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {readJson} = require('fs-extra');
const {join} = require('path');
const {dependencies, projects} = require('../config');
const {logPromise} = require('../utils');

const check = async ({cwd}) => {
  const rootPackage = await readJson(join(cwd, 'package.json'));

  const projectPackages = [];
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    projectPackages.push(
      await readJson(join(cwd, join('packages', project), 'package.json'))
    );
  }

  const invalidDependencies = [];

  const checkModule = module => {
    const rootVersion = rootPackage.devDependencies[module];

    projectPackages.forEach(projectPackage => {
      const projectVersion = projectPackage.dependencies[module];

      if (rootVersion !== projectVersion && projectVersion !== undefined) {
        invalidDependencies.push(
          `${module} is ${chalk.red.bold(rootVersion)} in root but ` +
            `${chalk.red.bold(projectVersion)} in ${projectPackage.name}`
        );
      }
    });
  };

  await Promise.all(dependencies.map(checkModule));

  if (invalidDependencies.length) {
    throw Error(
      chalk`
      Dependency mismatch

      {white The following dependencies do not match between the root package and NPM dependencies:}
      ${invalidDependencies
        .map(dependency => chalk.white(dependency))
        .join('\n')}
    `
    );
  }
};

module.exports = async ({cwd}) => {
  return logPromise(check({cwd}), 'Checking runtime dependencies');
};
