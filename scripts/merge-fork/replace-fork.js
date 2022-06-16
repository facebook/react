'use strict';

/* eslint-disable no-for-of-loops/no-for-of-loops */

// Copies the contents of the new fork into the old fork

const chalk = require('chalk');
const {promisify} = require('util');
const glob = promisify(require('glob'));
const {execSync, spawnSync} = require('child_process');
const fs = require('fs');
const minimist = require('minimist');

const stat = promisify(fs.stat);
const copyFile = promisify(fs.copyFile);

const argv = minimist(process.argv.slice(2), {
  boolean: ['reverse'],
});

async function main() {
  const status = execSync('git status').toString();
  const hadUnstagedChanges = status.includes('Changes not staged for commit');
  if (hadUnstagedChanges) {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    await new Promise(resolve => {
      rl.question(
        `\n${chalk.yellow.bold(
          'Unstaged changes were found in repository.'
        )} Do you want to continue? (Y/n) `,
        input => {
          switch (input.trim().toLowerCase()) {
            case '':
            case 'y':
            case 'yes':
              resolve();
              break;
            default:
              console.log('No modifications were made.');
              process.exit(0);
              break;
          }
        }
      );
    });
  }

  const oldFilenames = await glob('packages/react-reconciler/**/*.old.js');
  await Promise.all(oldFilenames.map(unforkFile));

  // Use ESLint to autofix imports
  const command = spawnSync('yarn', ['linc', '--fix'], {
    stdio: ['inherit', 'inherit', 'pipe'],
  });
  if (command.status === 1) {
    console.log(
      chalk.bold.red('\nreplace-fork script failed with the following error:')
    );
    console.error(Error(command.stderr));

    // If eslint crashes, it may not have successfully fixed all the imports,
    // which would leave the reconciler files in an inconsistent stat.
    // It would be nice to clean up the working directory in this case,
    // but it's only safe to do that if we aren't going to override any previous changes.
    if (!hadUnstagedChanges) {
      spawnSync('git', ['checkout', '.']);
    } else {
      console.log(
        `\n${chalk.yellow.bold(
          'Unstaged changes were present when `replace-fork` was run.'
        )} ` +
          `To cleanup the repository run:\n  ${chalk.bold(
            'git checkout packages/react-reconciler'
          )}`
      );
    }

    process.exit(1);
  } else {
    process.exit(0);
  }
}

async function unforkFile(oldFilename) {
  let oldStats;
  try {
    oldStats = await stat(oldFilename);
  } catch {
    return;
  }
  if (!oldStats.isFile()) {
    return;
  }

  const newFilename = oldFilename.replace(/\.old.js$/, '.new.js');
  let newStats;
  try {
    newStats = await stat(newFilename);
  } catch {
    return;
  }
  if (!newStats.isFile()) {
    return;
  }

  if (argv.reverse) {
    await copyFile(oldFilename, newFilename);
  } else {
    await copyFile(newFilename, oldFilename);
  }
}

main();
