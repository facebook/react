var fs = require('fs');
var path = require('path');
var spawnSync = require('child_process').spawnSync;

fs
  .readdirSync(__dirname)
  .filter(file => {
    return fs.statSync(path.join(__dirname, file)).isDirectory();
  })
  .forEach(dir => {
    spawnSync('npm', ['install'], {
      cwd: path.join(__dirname, dir),
      stdio: 'inherit',
    });
    const result = spawnSync('npm', ['test'], {
      cwd: path.join(__dirname, dir),
      stdio: 'inherit',
    });
    if (result.status !== 0) {
      process.exit('npm test exited with non-zero code.');
    }
    // TODO: also test that build succeeds
  });
