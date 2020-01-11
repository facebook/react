'use strict';

const chalk = require('chalk');
const path = require('path');
const spawnSync = require('child_process').spawnSync;
const glob = require('glob');

const extension = process.platform === 'win32' ? '.cmd' : '';

// Performs sanity checks on bundles *built* by Rollup.
// Helps catch Rollup regressions.
function lint({format, filePatterns}) {
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

function checkFilesExist(bundle) {
  const {format, filePatterns} = bundle;
  filePatterns.forEach(pattern => {
    console.log(`Checking if files exist in ${pattern}...`);
    const files = glob.sync(pattern);
    if (files.length === 0) {
      console.error(chalk.red(`Found no ${format} bundles in ${pattern}`));
      process.exit(1);
    } else {
      console.log(chalk.green(`Found ${files.length} bundles.`));
      console.log();
    }
  });
  return bundle;
}

const bundles = [
  {
    format: 'rn',
    filePatterns: [`./build/react-native/implementations/*.js`],
  },
  {
    format: 'umd',
    filePatterns: [`./build/node_modules/*/umd/*.js`],
  },
  {
    format: 'cjs',
    filePatterns: [
      `./build/node_modules/*/*.js`,
      `./build/node_modules/*/cjs/*.js`,
    ],
  },
];

if (process.env.RELEASE_CHANNEL === 'experimental') {
  bundles.push({
    format: 'fb',
    filePatterns: [`./build/facebook-www/*.js`],
  });
}

bundles.map(checkFilesExist).map(lint);
