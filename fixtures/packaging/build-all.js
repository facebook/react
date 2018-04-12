const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const fixtureDirs = fs.readdirSync(__dirname).filter(file => {
  return fs.statSync(path.join(__dirname, file)).isDirectory();
});

const cmdArgs = [
  {cmd: 'yarn', args: ['install']},
  {cmd: 'yarn', args: ['build']},
];

function buildFixture(cmdArg, path) {
  const opts = {
    cwd: path,
    stdio: 'inherit',
  };
  const result = child_process.spawnSync(cmdArg.cmd, cmdArg.args, opts);
  if (result.status !== 0) {
    throw new Error(`Failed to build fixtures!`);
  }
}

fixtureDirs.forEach(dir => {
  cmdArgs.forEach(cmdArg => {
    // we only care about directories that have DEV and PROD directories in
    // otherwise they don't need to be built
    const devPath = path.join(__dirname, dir, 'dev');

    if (fs.existsSync(devPath)) {
      buildFixture(cmdArg, devPath);
    }
    const prodPath = path.join(__dirname, dir, 'prod');

    if (fs.existsSync(prodPath)) {
      buildFixture(cmdArg, prodPath);
    }
  });
});

console.log('-------------------------');
console.log('All fixtures were built!');
console.log('Now ensure all frames display a welcome message:');
console.log('  npm install -g serve');
console.log('  serve ../..');
console.log('  open http://localhost:5000/fixtures/packaging/');
console.log('-------------------------');
