#!/usr/bin/env node

'use strict';

const {spawnSync} = require('child_process');
const {exec} = require('child-process-promise');
const {readJsonSync} = require('fs-extra');
const {join} = require('path');
const {confirm} = require('../utils');
const theme = require('../theme');

const run = async ({cwd, dry, tags, ci}, packageName, otp) => {
  const packagePath = join(cwd, 'build/node_modules', packageName);
  const {version} = readJsonSync(join(packagePath, 'package.json'));

  // Check if this package version has already been published.
  // If so we might be resuming from a previous run.
  // We could infer this by comparing the build-info.json,
  // But for now the easiest way is just to ask if this is expected.
  const {status} = spawnSync('npm', ['view', `${packageName}@${version}`]);
  const packageExists = status === 0;
  if (packageExists) {
    console.log(
      theme`{package ${packageName}} {version ${version}} has already been published.`
    );
    if (!ci) {
      await confirm('Is this expected?');
    }
  } else {
    console.log(theme`{spinnerSuccess ✓} Publishing {package ${packageName}}`);

    // Publish the package and tag it.
    if (!dry) {
      if (!ci) {
        await exec(`npm publish --tag=${tags[0]} --otp=${otp}`, {
          cwd: packagePath,
        });
        console.log(theme.command(`  cd ${packagePath}`));
        console.log(
          theme.command(`  npm publish --tag=${tags[0]} --otp=${otp}`)
        );
      } else {
        await exec(`npm publish --tag=${tags[0]}`, {
          cwd: packagePath,
        });
        console.log(theme.command(`  cd ${packagePath}`));
        console.log(theme.command(`  npm publish --tag=${tags[0]}`));
      }
    }

    for (let j = 1; j < tags.length; j++) {
      if (!dry) {
        if (!ci) {
          await exec(
            `npm dist-tag add ${packageName}@${version} ${tags[j]} --otp=${otp}`,
            {cwd: packagePath}
          );
          console.log(
            theme.command(
              `  npm dist-tag add ${packageName}@${version} ${tags[j]} --otp=${otp}`
            )
          );
        } else {
          await exec(`npm dist-tag add ${packageName}@${version} ${tags[j]}`, {
            cwd: packagePath,
          });
          console.log(
            theme.command(
              `  npm dist-tag add ${packageName}@${version} ${tags[j]}`
            )
          );
        }
      }
    }

    if (tags.includes('untagged')) {
      // npm doesn't let us publish without a tag at all,
      // so for one-off publishes we clean it up ourselves.
      if (!dry) {
        if (!ci) {
          await exec(`npm dist-tag rm ${packageName} untagged --otp=${otp}`);
          console.log(
            theme.command(
              `  npm dist-tag rm ${packageName} untagged --otp=${otp}`
            )
          );
        } else {
          await exec(`npm dist-tag rm ${packageName} untagged`);
          console.log(
            theme.command(`  npm dist-tag rm ${packageName} untagged`)
          );
        }
      }
    }
  }
};

module.exports = run;
