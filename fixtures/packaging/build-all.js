const { existsSync, statSync, readdirSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const fixtureDirs = readdirSync(__dirname).filter((file) => {
  return statSync(join(__dirname, file)).isDirectory();
});

const cmdArgs = [
  {cmd: 'npm', args: ['install']},
  {cmd: 'npm', args: ['run', 'build']},
];


function buildFixture(cmdArg, path) {
  const opts = {
    cwd: path,
    stdio: 'inherit',
  };
  const result = spawnSync(cmdArg.cmd, cmdArg.args, opts);
  if (result.status !== 0) {
    throw new Error(`Failed to build fixtures!`);
  }
}

for (const dir of fixtureDirs) {
  for (const cmdArg of cmdArgs) {
    // we only care about directories that have DEV and PROD directories in
    // otherwise they don't need to be built
    const devPath = join(__dirname, dir, 'dev');

    if (existsSync(devPath)) {
      buildFixture(cmdArg, devPath);
    }
    const prodPath = join(__dirname, dir, 'prod');

    if (existsSync(prodPath)) {
      buildFixture(cmdArg, prodPath);
    }
  }
}

console.log('-------------------------');
console.log('All fixtures were built!');
console.log('Now ensure all frames display a welcome message:');
console.log('  npm install -g serve');
console.log('  serve ../..');
console.log('  open http://localhost:5000/fixtures/packaging/');
console.log('-------------------------');
