/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const CLIEngine = require('eslint').CLIEngine;
const {es5Path, es6Path, esNextPath} = require('../shared/esPath');

const es5Options = {
  configFile: `${__dirname}/es5Config.js`,
  ignorePattern: [...es6Path, ...esNextPath],
};

const es6Options = {
  configFile: `${__dirname}/es6Config.js`,
  ignorePattern: [...es5Path, ...esNextPath],
};

const esNextOptions = {
  configFile: `${__dirname}/esNextConfig.js`,
  ignorePattern: [...es5Path, ...es6Path],
};

module.exports = function lintOnFiles({ecmaVersion, filePatterns}) {
  let options;
  switch (ecmaVersion) {
    case '5':
      options = es5Options;
      break;
    case '6':
      options = es6Options;
      break;
    case 'next':
      options = esNextOptions;
      break;
    default:
      console.error('ecmaVersion only accpet value: "5", "6", "next"');
  }

  const cli = new CLIEngine({...options});
  const formatter = cli.getFormatter();
  const report = cli.executeOnFiles(filePatterns);

  // When using `ignorePattern`, eslint will show `File ignored...` warning message when match ignore file.
  // Currently, the only way to turn off this warning message is to set quiet = true.
  // But it will remove `all warnings`, it's not appropriate to turn off other warning message
  // So that's why we filter out the ignore pattern message.
  // related issue: https://github.com/eslint/eslint/issues/5623
  const filteredReport = report.results.filter(item => {
    const ignoreMessage =
      'File ignored because of a matching ignore pattern. Use "--no-ignore" to override.';
    return !(item.messages[0] && item.messages[0].message === ignoreMessage);
  });
  const formattedResults = formatter(filteredReport);
  console.log(formattedResults);
  return report;
};
