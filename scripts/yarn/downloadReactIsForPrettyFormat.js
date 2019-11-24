'use strict';

const path = require('path');
const pacote = require('pacote');
const rimraf = require('rimraf');
const prettyFormatPkg = require('pretty-format/package.json');
const prettyFormatPkgPath = require.resolve('pretty-format/package.json');

const reactIsDependencyVersion = prettyFormatPkg.dependencies['react-is'];

if (!reactIsDependencyVersion) {
  throw new Error('Unable to find `react-is` dependency in `pretty-format`');
}

const prettyFormatNodeModulesReactIsDir = path.join(
  path.dirname(prettyFormatPkgPath),
  'node_modules/react-is'
);

rimraf.sync(prettyFormatNodeModulesReactIsDir);

pacote
  .extract(
    `react-is@${reactIsDependencyVersion}`,
    prettyFormatNodeModulesReactIsDir
  )
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
