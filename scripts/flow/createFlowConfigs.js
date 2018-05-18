'use strict';

const chalk = require('chalk');
const fs = require('fs');
const mkdirp = require('mkdirp');
const {typedRenderers} = require('./typedRenderers');

const config = fs.readFileSync(__dirname + '/config/flowconfig');

function writeConfig(folder) {
  mkdirp.sync(folder);

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
typedRenderers.forEach(renderer => {
  writeConfig(__dirname + '/' + renderer);
});
