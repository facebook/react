#!/usr/bin/env node

const { exec, execSync } = require('child_process');
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');
const build = require('./build');

const main = async buildId => {
  const root = join(__dirname, '..', buildId);
  const buildPath = join(root, 'build');

  await build(buildId);

  await exec(`cp ${join(root, 'now.json')} ${join(buildPath, 'now.json')}`, {
    cwd: root,
  });

  const file = readFileSync(join(root, 'now.json'));
  const json = JSON.parse(file);
  const alias = json.alias[0];

  const commit = execSync('git rev-parse HEAD')
    .toString()
    .trim()
    .substr(0, 7);
  const date = new Date();

  writeFileSync(
    join(buildPath, 'index.html'),
    `
    <html>
      <body>
        <h1>${date.toLocaleDateString()} – ${date.toLocaleTimeString()}</h1>
        <h2>Source <a href="http://github.com/bvaughn/react-devtools-experimental/commit/${commit}">${commit}</a></h2>
        <a href="packed.zip">packed.zip</a>
      </body>
    </html>
  `
  );

  await exec(`now deploy && now alias ${alias}`, {
    cwd: buildPath,
    stdio: 'inherit',
  });

  console.log(`Deployed to https://${alias}.now.sh`);
};

module.exports = main;
