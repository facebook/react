'use strict';

const chalk = require('chalk');
const fs = require('fs');

const config = fs.readFileSync(__dirname + '/flowconfig');
const disclaimer = `
# --------------------------------------------------------#
# NOTE: this file is generated.                           #
# If you want to edit it, open ./scripts/flow/flowconfig. #
# Then run Yarn for changes to take effect.               #
# --------------------------------------------------------#
`.trim();

fs.writeFileSync(
  process.cwd() + '/.flowconfig',
  `
${disclaimer}

${config}

${disclaimer}
`.trim(),
);
console.log(chalk.dim('Wrote the Flow configuration to .flowconfig'));
