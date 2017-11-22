'use strict';

const spawn = require('child_process').spawn;
const argv = require('minimist')(process.argv.slice(2));

console.log('Running Jest');

const args = [
  process.env.NODE_ENV === 'development' ? 'test' : 'test-prod',
  '--runInBand',
];
if (argv.coverage) {
  args.push('--coverage');
}

const jest = spawn('yarn', args, {
  stdio: 'inherit',
});

jest.on('close', code => {
  if (code === 1) {
    console.error('Jest failed!');
  } else {
    console.log('Jest passed!');
  }
  process.exit(code);
});
