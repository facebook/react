#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const semver = require('semver');
const {getUnexecutedCommands} = require('../utils');

const printSteps = steps => {
  return steps
    .filter(Boolean) // Remove no-op steps
    .map((step, index) => `${index + 1}. ${step}`)
    .join('\n');
};

const printSections = sections => {
  return sections
    .map((section, index) => {
      const [title, ...steps] = section;

      return chalk`
        {bold.underline Step ${index + 1}: ${title}}

        ${printSteps(steps)}
      `.replace(/\n +/g, '\n');
    })
    .join('');
};

module.exports = ({dry, version}) => {
  const isPrerelease = semver.prerelease(version);

  const sections = [];

  // Certain follow-up steps are for stable releases only.
  if (!isPrerelease) {
    sections.push([
      'Create GitHub release',
      chalk`Open new release page: {blue.bold https://github.com/facebook/react/releases/new}`,
      chalk`Choose {bold ${version}} from the dropdown menu`,
      chalk`Paste the new release notes from {yellow.bold CHANGELOG.md}`,
      chalk`Attach all files in {yellow.bold build/dist/*.js} except {yellow.bold react-art.*} to the release.`,
      chalk`Press {bold "Publish release"}!`,
    ]);

    sections.push([
      'Update the version on reactjs.org',
      chalk`Git clone (or update) {blue.bold https://github.com/reactjs/reactjs.org}`,
      chalk`Open the {bold.yellow src/site-constants.js} file`,
      chalk`Update the {bold version} value to {bold ${version}}`,
      chalk`Open a Pull Request to {bold master}`,
    ]);
  }

  sections.push([
    'Test the new release',
    chalk`Install CRA: {bold npm i -g create-react-app}`,
    chalk`Create a test application: {bold create-react-app myapp && cd myapp}`,
    isPrerelease
      ? chalk`Install the pre-release versions: {bold yarn add react@next react-dom@next}`
      : null,
    chalk`Run the app: {bold yarn start}`,
  ]);

  sections.push([
    'Notify the DOM team',
    chalk`Notify DOM team members: {bold @nhunzaker @jquense @aweary}`,
  ]);

  console.log(
    chalk`
    {green.bold Publish successful!}
    ${getUnexecutedCommands()}
    Next there are a couple of manual steps:
    ${printSections(sections)}
  `.replace(/\n +/g, '\n')
  );
};
