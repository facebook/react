'use strict';		

const path = require('path');
const spawn = require('child_process').spawn;
  
console.log('running jest');		

const args = [		
  path.join('node_modules', 'jest-cli', 'bin', 'jest'),		
  '--runInBand',		
];		
// if (coverage) {		
//   args.push('--coverage');		
// }

const jest = spawn('node', args, {
  stdio: 'inherit',
  env: Object.assign({}, process.env, {
    NODE_ENV: 'test',
  }),
});

jest.on('close', (code) => {
  if (code === 1) {
    console.error('jest failed');
  } else {
    console.log('jest passed');
  }
  process.exit(0);
});
