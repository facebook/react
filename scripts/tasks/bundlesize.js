'use strict';

const path = require('path');
const spawn = require('child_process').spawn;

console.log('Running buildsize');

const args = [path.join('node_modules', '.bin', 'bundlesize')];

const bundlesize = spawn('node', args, {
  stdio: 'inherit',
});

bundlesize.on('close', code => {
  if (code === 1) {
    console.error('Bundlesize failed!');
  } else {
    console.log('Bundlesize passed!');
  }
  process.exit(code);
});
