'use strict';

const path = require('path');
const spawn = require('child_process').spawn;
const argv = require('minimist')(process.argv.slice(2));

console.log('Running Jest');

const args = [
  path.join('node_modules', 'jest-cli', 'bin', 'jest'),
  '--runInBand',
];
if (argv.coverage) {
  args.push('--coverage');
}

const jest = spawn('node', args, {
  stdio: 'inherit',
  env: Object.assign({}, process.env, {
    NODE_ENV: 'test',
  }),
});

jest.on('close', code => {
  if (code === 1) {
    console.error('Jest failed!');
  } else {
    console.log('Jest passed!');
  }
  process.exit(code);
});
