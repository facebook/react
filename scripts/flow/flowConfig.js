/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use strict';

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const configTemplate = fs
  .readFileSync(__dirname + '/config/flowconfig')
  .toString();

function writeConfig(renderer, rootFolder = false) {
  let folder;
  if (rootFolder) {
    folder = path.join(__dirname, '../../');
  } else {
    folder = path.join(__dirname, renderer);
  }

  mkdirp.sync(folder);

  let config = configTemplate.replace(
    '%REACT_RENDERER_FLOW_OPTIONS%',
    `
module.name_mapper='react-reconciler/inline.${renderer}$$' -> 'react-reconciler/inline-typed'
module.name_mapper='ReactFiberHostConfig$$' -> 'forks/ReactFiberHostConfig.${renderer}'
    `.trim(),
  );

  if (rootFolder) {
    config = config.replace(
      '%FLOW_INCLUDE%',
      `
./node_modules/
./packages/
./scripts/
    `.trim(),
    );

    config = config.replace(
      '%FLOW_LIBS%',
      `
./node_modules/fbjs/flow/lib/dev.js
./scripts/flow/environment.js
./scripts/flow/react-native-host-hooks.js
    `.trim(),
    );
  } else {
    config = config.replace(
      '%FLOW_INCLUDE%',
      `
../../../node_modules/
../../../packages/
../../../scripts/
    `.trim(),
    );

    config = config.replace(
      '%FLOW_LIBS%',
      `
../../../node_modules/fbjs/flow/lib/dev.js
../environment.js
../react-native-host-hooks.js
    `.trim(),
    );
  }

  const disclaimer = `
# ---------------------------------------------------------------#
# NOTE: this file is generated.                                  #
# If you want to edit it, open ./scripts/flow/config/flowconfig. #
# Then run Yarn for changes to take effect.                      #
# ---------------------------------------------------------------#
  `.trim();

  const configFile = path.join(folder, '.flowconfig');
  let oldConfig;
  try {
    oldConfig = fs.readFileSync(configFile).toString();
  } catch (err) {
    oldConfig = null;
  }
  const newConfig = `
${disclaimer}
${config}
${disclaimer}
`.trim();

  if (newConfig !== oldConfig) {
    fs.writeFileSync(configFile, newConfig);
    console.log(chalk.dim('Wrote a Flow config to ' + configFile));
  }
}

exports.writeConfig = writeConfig;
