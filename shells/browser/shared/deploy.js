#!/usr/bin/env node

const { exec, execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const convert = require('xml-js');

const main = async buildId => {
  const root = join(__dirname, '..', buildId);
  const buildPath = join(root, 'build');

  execSync(`node ${join(root, './build')}`);

  await exec(`cp ${join(root, 'now.json')} ${join(buildPath, 'now.json')}`, {
    cwd: root,
  });

  if (buildId === 'chrome') {
    const file = readFileSync(join(buildPath, 'unpacked', 'manifest.json'));
    const json = JSON.parse(file);
    const { version } = json;

    const xmlString = readFileSync(join(root, 'updates.xml'), 'utf8');
    const parsedXML = convert.xml2js(xmlString);
    parsedXML.elements[0].elements[0].elements[0].attributes.version = version;

    writeFileSync(join(buildPath, 'updates.xml'), convert.js2xml(parsedXML));
  }

  const file = readFileSync(join(root, 'now.json'));
  const json = JSON.parse(file);
  const alias = json.alias[0];

  const commit = execSync('git rev-parse HEAD')
    .toString()
    .trim()
    .substr(0, 7);

  let date = new Date();
  date = `${date.toLocaleDateString()} – ${date.toLocaleTimeString()}`;

  const installationInstructions =
    buildId === 'chrome'
      ? readFileSync(join(__dirname, 'deploy.chrome.html'))
      : readFileSync(join(__dirname, 'deploy.firefox.html'));

  let html = readFileSync(join(__dirname, 'deploy.html')).toString();
  html = html.replace(/%commit%/g, commit);
  html = html.replace(/%date%/g, date);
  html = html.replace(/%installation%/, installationInstructions);

  writeFileSync(join(buildPath, 'index.html'), html);

  await exec(`now deploy && now alias ${alias}`, {
    cwd: buildPath,
    stdio: 'inherit',
  });

  console.log(`Deployed to https://${alias}.now.sh`);
};

module.exports = main;
