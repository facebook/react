#!/usr/bin/env node

'use strict';

const {execRead, logPromise} = require('../utils');
const theme = require('../theme');

const run = async ({cwd, packages, version}) => {
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
    theme`Checking NPM permissions for {underline ${currentUser}}.`
  );

  if (failedProjects.length) {
    console.error(
      theme`
      {error Insufficient NPM permissions}
      \nNPM user {underline ${currentUser}} is not an owner for: ${failedProjects
        .map(name => theme.package(name))
        .join(', ')}
      \nPlease contact a React team member to be added to the above project(s).
      `
        .replace(/\n +/g, '\n')
        .trim()
    );
    process.exit(1);
  }
};

module.exports = run;
