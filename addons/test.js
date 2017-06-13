var fs = require('fs');
var path = require('path');
var spawnSync = require('child_process').spawnSync;

function runNpmCommand(dir, args) {
  const result = spawnSync('npm', args, {
    cwd: path.join(__dirname, dir),
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    process.exit('npm test exited with non-zero code.');
  }
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return fs.statSync(path.join(__dirname, file)).isDirectory();
  })
  .forEach(dir => {
    runNpmCommand(dir, ['install']);
    runNpmCommand(dir, ['run', 'prepublish']);
  });
