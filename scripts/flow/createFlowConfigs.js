'use strict';

const chalk = require('chalk');
const fs = require('fs');

const config = fs.readFileSync(__dirname + '/config/flowconfig');

function writeConfig(folder) {
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
    oldConfig = fs.readFileSync(configFile);
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
  }
}

// Write multiple configs in different folders
// so that we can run those checks in parallel if we want.
writeConfig(__dirname + '/dom');
writeConfig(__dirname + '/fabric');
writeConfig(__dirname + '/native');
writeConfig(__dirname + '/test');

console.log(
  chalk.dim('Wrote the Flow configurations to ./scripts/flow/*/.flowconfig'),
);
