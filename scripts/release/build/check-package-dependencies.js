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

  const checkModule = async module => {
    const rootVersion = rootPackage.devDependencies[module];

    projectPackages.forEach(projectPackage => {
      const projectVersion = projectPackage.dependencies[module];

      if (rootVersion !== projectVersion && projectVersion !== undefined) {
        invalidDependencies.push(
          `${chalk.yellow(module)} is ${chalk.red(rootVersion)} in root but ` +
            `${chalk.red(projectVersion)} in ${chalk.yellow(projectPackage.name)}`
        );
      }
    });
  };

  await Promise.all(dependencies.map(checkModule));

  if (invalidDependencies.length) {
    console.log(
      `${chalk.bgRed.white(' ERROR ')} ${chalk.red('Dependency mismatch')}\n\n` +
        `The following dependencies do not match between the root package and NPM dependencies:\n` +
        invalidDependencies.join('\n')
    );
    process.exit(1);
  }
};

module.exports = async ({cwd}) => {
  logPromise(check({cwd}), 'Checking runtime dependencies');
};
