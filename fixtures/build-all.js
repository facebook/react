var fs = require('fs');
var path = require('path');
var { spawnSync } = require('child_process');

var fixtureDirs = fs.readdirSync(__dirname).filter((file) => {
  return fs.statSync(path.join(__dirname, file)).isDirectory();
});

var cmdArgs = [
  {cmd: 'npm', args: ['install']},
  {cmd: 'npm', args: ['run', 'build']},
];

for (const dir of fixtureDirs) {
  for (const cmdArg of cmdArgs) {
    const opts = {
      cwd: path.join(__dirname, dir),
      stdio: 'inherit',
    };
    let result = spawnSync(cmdArg.cmd, cmdArg.args, opts);
    if (result.status !== 0) {
      throw new Error('Failed to build fixtures.');
    }
  }
}

console.log('-------------------------');
console.log('All fixtures were built!');
console.log('Now make sure to open each HTML file in this directory and each index.html in subdirectories.');
console.log('-------------------------');
