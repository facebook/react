#!/usr/bin/env node

const chalk = require('chalk');
const { execSync } = require('child_process');
const { join } = require('path');
const rp = require('request-promise');
const convert = require('xml-js');
const build = require('../shared/build');

const main = async () => {
  const manifestVersion = await rp(
    'https://react-devtools-experimental-chrome.now.sh/updates.xml'
  )
    .then(xmlString => {
      const parsedXML = convert.xml2js(xmlString);
      const version =
        parsedXML.elements[0].elements[0].elements[0].attributes.version;
      const match = /(\d)\.(\d)\.(\d)\.*(\d)*/.exec(version);
      if (match !== null) {
        const prerelease = parseInt(match[4], 10) || 0;
        return `${match[1]}.${match[2]}.${match[3]}.${prerelease + 1}`;
      }
    })
    .catch(error => null);

  await build('chrome', manifestVersion);

  const cwd = join(__dirname, 'build');
  execSync('crx pack ./unpacked -o ReactDevTools.crx -p ../../../../key.pem', {
    cwd,
  });
  execSync('rm packed.zip', { cwd });

  console.log(chalk.green('\nThe Chrome extension has been built!'));
  console.log(chalk.green('You can test this build by running:'));
  console.log(chalk.gray('\n# From the react-devtools root directory:'));
  console.log('yarn run test:chrome');
};

main();
