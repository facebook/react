'use strict';

const chalk = require('chalk');
const path = require('path');
const spawnSync = require('child_process').spawnSync;

const extension = process.platform === 'win32' ? '.cmd' : '';

// Performs sanity checks on bundles *built* by Rollup.
// Helps catch Rollup regressions.
function run(format, filePatterns) {
  console.log(`Linting ${format} bundles...`);
  const result = spawnSync(
    path.join('node_modules', '.bin', 'eslint' + extension),
    [
      ...filePatterns,
      '--config',
      path.join(__dirname, `eslintrc.${format}.js`),
      // Disregard our ESLint rules that apply to the source.
      '--no-eslintrc',
      // Use a different ignore file.
      '--ignore-path',
      path.join(__dirname, 'eslintignore'),
    ],
    {
      // Allow colors to pass through
      stdio: 'inherit',
    }
  );
  if (result.status !== 0) {
    console.error(chalk.red(`Linting of ${format} bundles has failed.`));
    process.exit(result.status);
  } else {
    console.log(chalk.green(`Linted ${format} bundles successfully!`));
    console.log();
  }
}

run('fb', [`./build/facebook-www/*.js`]);
run('rn', [`./build/{react-cs,react-native,react-rt}/*.js`]);
run('umd', [`./build/packages/*/umd/*.js`]);
run('cjs', [`./build/packages/*/*.js`, `./build/packages/*/cjs/*.js`]);
