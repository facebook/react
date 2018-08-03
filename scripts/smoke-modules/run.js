'use strict';

const {execSync} = require('child_process');
const glob = require('glob');

const entries = glob.sync('build/node_modules/**/index.mjs');

entries.forEach(entry => {
  execSync(`node --experimental-modules "./${entry}"`);
});

console.info(`\n${entries.length} .mjs entry points are run successfully!\n`);
