/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

'use strict';

const chalk = require('chalk');
const fs = require('fs');
const mkdirp = require('mkdirp');
const inlinedHostConfigs = require('../shared/inlinedHostConfigs');

const configTemplate = fs
  .readFileSync(__dirname + '/config/flowconfig')
  .toString();

function writeConfig(renderer, isServerSupported) {
  const folder = __dirname + '/' + renderer;
  mkdirp.sync(folder);

  const serverRenderer = isServerSupported ? renderer : 'custom';
  const config = configTemplate
    .replace(
      '%REACT_RENDERER_FLOW_OPTIONS%',
      `
module.name_mapper='react-reconciler/inline.${renderer}$$' -> 'react-reconciler/inline-typed'
module.name_mapper='ReactFiberHostConfig$$' -> 'forks/ReactFiberHostConfig.${renderer}'
module.name_mapper='react-server/inline.${renderer}$$' -> 'react-server/inline-typed'
module.name_mapper='react-server/flight.inline.${renderer}$$' -> 'react-server/flight.inline-typed'
module.name_mapper='ReactServerHostConfig$$' -> 'forks/ReactServerHostConfig.${serverRenderer}'
module.name_mapper='ReactServerFormatConfig$$' -> 'forks/ReactServerFormatConfig.${serverRenderer}'
module.name_mapper='react-flight/inline.${renderer}$$' -> 'react-flight/inline-typed'
module.name_mapper='ReactFlightClientHostConfig$$' -> 'forks/ReactFlightClientHostConfig.${serverRenderer}'
    `.trim(),
    )
    .replace(
      '%REACT_RENDERER_FLOW_IGNORES%',
      renderer === 'dom' || renderer === 'dom-browser'
        ? ''
        : // If we're not checking DOM, ignore the DOM package since it
          // won't be consistent.
          `
    .*/packages/react-dom/.*
    .*/packages/.*/forks/.*.dom.js
    .*/packages/.*/forks/.*.dom-browser.js
    `.trim(),
    );

  const disclaimer = `
# ---------------------------------------------------------------#
# NOTE: this file is generated.                                  #
# If you want to edit it, open ./scripts/flow/config/flowconfig. #
# Then run Yarn for changes to take effect.                      #
# ---------------------------------------------------------------#
  `.trim();

  const configFile = folder + '/.flowconfig';
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

// Write multiple configs in different folders
// so that we can run those checks in parallel if we want.
inlinedHostConfigs.forEach(rendererInfo => {
  if (rendererInfo.isFlowTyped) {
    writeConfig(rendererInfo.shortName, rendererInfo.isServerSupported);
  }
});
