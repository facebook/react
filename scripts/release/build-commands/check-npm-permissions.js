#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {execRead, logPromise} = require('../utils');

module.exports = async ({packages}) => {
  const currentUser = await execRead('npm whoami');
  const failedProjects = [];

  const checkProject = async project => {
    const owners = (await execRead(`npm owner ls ${project}`))
      .split('\n')
      .filter(owner => owner)
      .map(owner => owner.split(' ')[0]);

    if (!owners.includes(currentUser)) {
      failedProjects.push(project);
    }
  };

  await logPromise(
    Promise.all(packages.map(checkProject)),
    `Checking ${chalk.yellow.bold(currentUser)}'s NPM permissions`
  );

  if (failedProjects.length) {
    throw Error(
      chalk`
      Insufficient NPM permissions

      {white NPM user {yellow.bold ${currentUser}} is not an owner for:}
      {red ${failedProjects.join(', ')}}

      {white Please contact a React team member to be added to the above project(s).}
      `
    );
  }
};
