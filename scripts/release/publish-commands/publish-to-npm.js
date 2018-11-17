#!/usr/bin/env node

'use strict';

const chalk = require('chalk');
const {exec} = require('child-process-promise');
const {readJsonSync} = require('fs-extra');
const {join} = require('path');
const {confirm, execRead} = require('../utils');

const run = async ({cwd, dry, packages, tags}, otp) => {
  for (let i = 0; i < packages.length; i++) {
    const packageName = packages[i];
    const packagePath = join(cwd, 'build/node_modules', packageName);
    const {version} = readJsonSync(join(packagePath, 'package.json'));

    // Check if this package version has already been published.
    // If so we might be resuming from a previous run.
    // We could infer this by comparing the build-info.json,
    // But for now the easiest way is just to ask if this is expected.
    const info = await execRead(`npm view react@${version}`);
    if (info) {
      console.log(
        chalk`{green react}@{yellow ${version}} has already been published.`
      );
      await confirm(chalk`Is this expected?`);
    } else {
      console.log(chalk`{green ✓} Publishing {green ${packageName}}`);

      // Publish the package and tag it.
      if (!dry) {
        await exec(`npm publish --tag=${tags[0]} --otp=${otp}`, {
          cwd: packagePath,
        });
      }
      console.log(chalk.gray(`  cd ${packagePath}`));
      console.log(chalk.gray(`  npm publish --tag=${tags[0]} --otp=${otp}`));

      for (let j = 1; j < tags.length; j++) {
        if (!dry) {
          await exec(
            `npm dist-tag add ${packageName}@${version} ${
              tags[j]
            } --otp=${otp}`,
            {cwd: packagePath}
          );
        }
        console.log(
          chalk.gray(
            `  npm dist-tag add ${packageName}@${version} ${
              tags[j]
            } --otp=${otp}`
          )
        );
      }
    }
  }
};

module.exports = run;
