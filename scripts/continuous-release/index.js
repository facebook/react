#!/usr/bin/env node

/*eslint-disable no-for-of-loops/no-for-of-loops */

'use strict';

const fs = require('fs');
const chalk = require('chalk');
const execa = require('execa');
const commandLineArgs = require('command-line-args');
const inquirer = require('inquirer');
const path = require('path');
const tempy = require('tempy');
const originalRimraf = require('rimraf');
const ora = require('ora');
const {hashElement} = require('folder-hash');
const replaceInFile = require('replace-in-file');
const tar = require('tar');
const treeify = require('treeify');
const readPackageJSONFromNPMTarball = require('./readPackageJSONFromNPMTarball');

const PLACEHOLDER_VERSION_STR = '0.0.0-placeholder-version-do-not-ship';

const typesOfDependencies = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];

class GracefulError extends Error {}

function fileExists(filePath) {
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.F_OK, error => {
      resolve(error == null);
    });
  });
}

async function rimraf(dirPath) {
  if (await fileExists(dirPath)) {
    return new Promise((resolve, reject) => {
      fs.access(dirPath, fs.constants.F_OK, err1 => {
        if (err1) {
          // Directory does not exist. Exit.
          resolve();
        } else {
          originalRimraf(dirPath, err2 => {
            if (err2) {
              throw err2;
            }
            resolve();
          });
        }
      });
    });
  }
}

function rename(from, to) {
  return new Promise((resolve, reject) => {
    fs.rename(from, to, err => {
      if (err) {
        throw err;
      }
      resolve();
    });
  });
}

function writeFile(pathToFile, contents) {
  return new Promise((resolve, reject) => {
    fs.writeFile(pathToFile, contents, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function readdir(pathToFile, contents) {
  return new Promise((resolve, reject) => {
    fs.readdir(pathToFile, (error, items) => {
      if (error) {
        reject(error);
      } else {
        resolve(items);
      }
    });
  });
}

async function pauseAndResumeSpinner(spinner, task) {
  const wasSpinning = spinner.isSpinning;
  if (wasSpinning) {
    spinner.stop();
  }
  try {
    return await task();
  } finally {
    if (wasSpinning) {
      spinner.start();
    }
  }
}

async function step(msg, task, getSuccessMsg, getErrorMsg) {
  const spinner = ora(msg).start();

  const originalOutWrite = process.stdout.write;
  const originalErrWrite = process.stderr.write;

  process.stdout.write = (chunk, ...rest) => {
    if (spinner.isSpinning) {
      spinner.stop();
      originalOutWrite.call(process.stdout, chunk, ...rest);
      originalErrWrite.call(process.stderr, chunk, ...rest);
      spinner.start();
    } else {
      originalOutWrite.call(process.stdout, chunk, ...rest);
      originalErrWrite.call(process.stderr, chunk, ...rest);
    }
  };

  try {
    const result = task ? await task(spinner) : null;
    const successMsg = getSuccessMsg ? await getSuccessMsg(result) : msg;
    if (spinner.isSpinning) {
      spinner.succeed(successMsg);
    }
    return result;
  } catch (error) {
    const errorMsg = getErrorMsg ? await getErrorMsg(error) : msg;
    spinner.fail(errorMsg);
    throw error;
  } finally {
    process.stdout.write = originalOutWrite;
    process.stderr.write = originalErrWrite;
  }
}

async function buildLocal(ref, repo, all) {
  const repoPath = path.resolve(repo);
  const commitSha = await step(
    `Finding commit for ref ${ref}`,
    async () => {
      // Validate that the repo path is a copy of the React repo
      let actualRepoPath;
      try {
        actualRepoPath = await execa.stdout(
          'git',
          ['rev-parse', '--show-toplevel'],
          {
            cwd: repoPath,
          }
        );
      } catch (error) {
        throw new GracefulError(
          `${repoPath} is not a git repository. Use the --repo option to point ` +
            `to a local checkout of the React repo`
        );
      }

      if (actualRepoPath !== repoPath) {
        throw new GracefulError(
          `${repo} is not the root of a React git repository.`
        );
      }

      // Smoke test the existence of a file known to be in the React repo.
      const pathToVersionFile = path.resolve(
        repoPath,
        'packages/shared/ReactVersion.js'
      );
      const doesVersionFileExist = await fileExists(pathToVersionFile);
      if (!doesVersionFileExist) {
        throw new GracefulError(
          `Smoke test failed. ${repoPath} does not ` +
            "appear to be a React git repository. (It's also possible this " +
            'check is wrong and needs to updated.)'
        );
      }

      // Get the commit sha for the provided ref
      try {
        const fullSha = await execa.stdout('git', ['rev-parse', ref], {
          cwd: repoPath,
        });
        return fullSha.slice(0, 7);
      } catch (error) {
        throw new GracefulError(
          `${ref} does not refer to a valid commit. Try fetching the ` +
            `latest commits from GitHub.`
        );
      }
    },
    s => `Using commit ${s}`
  );

  const buildDir = tempy.directory();

  const sourceDir = path.join(buildDir, 'extracted-from-sha');

  const artifactsPath = path.resolve(sourceDir, 'build', 'node_modules');
  const packagesDir = path.resolve(buildDir, 'packages');

  await step(`Extract contents of repo at ${commitSha}`, async () => {
    // Create a fresh source directory.
    await execa('mkdir', ['-p', sourceDir]);
    try {
      // Extract the contents of the commitSha
      const archiveProcess = execa('git', ['archive', commitSha], {
        cwd: repoPath,
      });
      const extractProcess = execa('tar', ['-x', '-C', sourceDir], {
        cwd: repoPath,
      });
      archiveProcess.stdout.pipe(extractProcess.stdin);
      await extractProcess;
    } catch (error) {
      throw new GracefulError('Failed to checkout revision.');
    }
  });

  const allPackageNamesIncludingPrivate = (await execa('ls', [
    path.resolve(sourceDir, 'packages'),
  ])).stdout.split('\n');

  let allPackageNames = [];
  for (const packageName of allPackageNamesIncludingPrivate) {
    const packageJSONPath = path.resolve(
      path.resolve(sourceDir, 'packages'),
      packageName,
      './package.json'
    );
    const packageJSON = require(packageJSONPath);
    if (packageJSON.private) {
      continue;
    }
    if (packageJSON.name !== packageName) {
      throw new GracefulError(
        `The name field in ${packageName}/package.json must match the ` +
          `directory. Instead got: ${packageName}`
      );
    }
    allPackageNames.push(packageJSON.name);
  }

  let packageNames;
  if (all) {
    packageNames = allPackageNames;
  } else {
    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'packageNames',
        message:
          'Which packages would you like to build? If in doubt, select them all.',
        pageSize: allPackageNames.length,
        choices: allPackageNames,
      },
    ]);
    packageNames = answers.packageNames;
  }

  if (packageNames.length === 0) {
    console.log('No packages selected. Exiting.');
    process.exit(0);
  }

  const isPartialBuild = packageNames.length < allPackageNames.length;

  if (isPartialBuild) {
    console.log(
      chalk.blue(
        '\n' +
          'These packages will be built:' +
          '\n- ' +
          packageNames.join('\n- ') +
          '\n'
      )
    );

    const skippedNames = allPackageNames.filter(
      name => packageNames.indexOf(name) === -1
    );

    console.log(
      chalk.magenta(
        'These packages will be skipped:\n- ' + skippedNames.join('\n- ') + '\n'
      )
    );

    console.log(
      chalk.bold(
        'This is a partial build, which means it cannot be published as a ' +
          'stable release.\n'
      )
    );
  } else {
    console.log(
      chalk.blue(
        '\n' +
          'All packages will be built:' +
          '\n - ' +
          packageNames.join('\n - ') +
          '\n'
      )
    );
  }

  const {shouldContinue} = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldContinue',
      message: 'Continue with build?',
    },
  ]);

  if (!shouldContinue) {
    console.log('Exiting.');
    process.exit(0);
  }

  await step('Temporarily update version with placeholder', async () => {
    const pathToVersionFileInSource = path.resolve(
      sourceDir,
      'packages/shared/ReactVersion.js'
    );
    const newContents = `
/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// TODO: this is special because it gets imported during build.
module.exports = '${PLACEHOLDER_VERSION_STR}';
`;
    try {
      await writeFile(pathToVersionFileInSource, newContents);
    } catch (error) {
      throw new GracefulError('Failed to update ReactVersion.js');
    }
  });

  await step('Install yarn dependencies', async spinner => {
    try {
      await execa('yarn', [], {cwd: sourceDir});
    } catch (error) {
      throw new GracefulError('Yarn install failed.');
    }
  });

  console.log(`

Starting build script...

`);

  await step('Build packages', spinner =>
    pauseAndResumeSpinner(spinner, async () => {
      try {
        await execa(
          'node',
          [
            './scripts/rollup/build.js',
            packageNames.map(n => n + '/').join(','),
            '--type=node',
          ],
          {
            cwd: sourceDir,
            stdout: process.stdout,
            stderr: process.stderr,
          }
        );
      } catch (error) {
        throw new GracefulError('Build script failed.');
      }
    })
  );

  console.log('\n');

  const packageJSONs = new Map();
  await step('Extract build artifacts', async () => {
    for (const packageName of packageNames) {
      const packageJSONPath = path.resolve(
        artifactsPath,
        packageName,
        './package.json'
      );
      const packageJSON = require(packageJSONPath);
      packageJSONs.set(packageJSON.name, packageJSON);
      await rimraf(packageJSONPath);
      const oldPath = path.resolve(artifactsPath, packageName);
      const newPath = path.resolve(packagesDir, packageName);
      await execa('mkdir', ['-p', newPath]);
      await rename(oldPath, newPath);
    }
  });

  let hashedPackages;
  const buildID = await step('Calculate checksums', async () => {
    const options = {
      encoding: 'hex',
      files: {exclude: ['.DS_Store']},
    };
    hashedPackages = await hashElement(packagesDir, options);
    const buildChecksum = hashedPackages.hash.slice(0, 7);
    let id = `${commitSha}-${buildChecksum}`;
    if (isPartialBuild) {
      id += '-PARTIAL';
    }
    return id;
  });

  const version = '0.0.0-' + buildID;

  await step('Update ReactVersion to ' + version, async () => {
    const options = {
      files: packagesDir + '/**',
      from: PLACEHOLDER_VERSION_STR,
      to: version,
    };
    await replaceInFile(options);
  });

  await step('Create final package.jsons', async () => {
    for (const hashedPackage of hashedPackages.children) {
      const packageName = hashedPackage.name;
      const packageJSON = packageJSONs.get(packageName);
      packageJSON.version = version;
      packageJSON.buildInfo = {
        buildID: buildID,
        checksum: hashedPackage.hash,
        unstable: true,
        partial: isPartialBuild,
      };
      for (const typeOfDependency of typesOfDependencies) {
        const dependencies = packageJSON[typeOfDependency];
        if (dependencies !== undefined) {
          for (const dep in dependencies) {
            if (packageJSONs.has(dep)) {
              dependencies[dep] = version;
            }
          }
        }
      }
      const newPackageJSONPath = path.resolve(
        packagesDir,
        packageName,
        'package.json'
      );
      await writeFile(newPackageJSONPath, JSON.stringify(packageJSON, null, 2));
    }
  });

  await step('Pack for npm', async () => {
    for (const packageName of packageNames) {
      try {
        await execa.stdout(
          'npm',
          ['pack', path.resolve(packagesDir, packageName)],
          {cwd: packagesDir}
        );
        await rimraf(path.resolve(packagesDir, packageName));
      } catch (error) {
        throw new GracefulError('Failed to pack ' + packageName);
      }
    }
  });

  const buildTarFilename = `react-build-${buildID}.tgz`;
  await step('Output build', async () => {
    await tar.c(
      {
        gzip: true,
        file: path.resolve(process.cwd(), buildTarFilename),
        cwd: path.resolve(buildDir),
      },
      ['packages']
    );
  });

  console.log(chalk`
Created {green {inverse  ${buildTarFilename} }}`);
}

async function extractBuild(pathToBuildTar) {
  const releaseDir = tempy.directory();
  const packagesDir = path.resolve(releaseDir, 'packages');
  await execa('mkdir', ['-p', releaseDir]);
  try {
    await tar.x({
      file: pathToBuildTar,
      cwd: releaseDir,
    });
  } catch (error) {
    throw new GracefulError(
      path.relative(process.cwd(), pathToBuildTar) +
        'is not a valid React build.'
    );
  }
  return {releaseDir, packagesDir};
}

async function getPackageJSONsFromBuild(packagesDir) {
  const npmTarFiles = await readdir(packagesDir);
  const packageJSONs = new Map();
  try {
    for (const npmTarFile of npmTarFiles) {
      if (!npmTarFile.endsWith('tgz')) {
        // Defensive check
        continue;
      }
      const packageJSON = await readPackageJSONFromNPMTarball(
        path.resolve(packagesDir, npmTarFile)
      );
      packageJSONs.set(npmTarFile, packageJSON);
    }
  } catch (error) {
    throw new GracefulError(
      'There was a problem reading this build. It might be outdated. Try ' +
        'running again on a fresh build.'
    );
  }
  return packageJSONs;
}

async function show(buildTar, showAll) {
  const pathToBuildTar = path.resolve(buildTar);
  const {packagesDir} = await extractBuild(pathToBuildTar);
  const packageJSONs = await getPackageJSONsFromBuild(packagesDir);

  if (showAll) {
    const output = [];
    for (const [, packageJSON] of packageJSONs) {
      output.push(packageJSON);
    }
    process.stdout.write(JSON.stringify(output, null, 2));
    return;
  }

  const packageJSONsByNameOnly = new Map();
  for (const [, packageJSON] of packageJSONs) {
    packageJSONsByNameOnly.set(packageJSON.name, packageJSON);
  }

  const output = {};
  for (const [, packageJSON] of packageJSONsByNameOnly) {
    const packageOutput = {
      version: packageJSON.version,
      checksum: packageJSON.buildInfo.checksum,
    };
    for (const typeOfDependency of typesOfDependencies) {
      const dependencies = packageJSON[typeOfDependency];
      if (dependencies !== undefined) {
        let reactDeps = null;
        for (const dep in dependencies) {
          const dependencyJSON = packageJSONsByNameOnly.get(dep);
          if (dependencyJSON !== undefined) {
            reactDeps = reactDeps === null ? {} : reactDeps;
            reactDeps[dep] = dependencyJSON.version;
          }
        }
        if (reactDeps !== null) {
          packageOutput[typeOfDependency] = reactDeps;
        }
      }
    }
    output[packageJSON.name] = packageOutput;
  }

  process.stdout.write(treeify.asTree(output, true));
}

async function push(buildTar, tag) {
  const pathToBuildTar = path.resolve(buildTar);
  const {packagesDir} = await extractBuild(pathToBuildTar);
  const packageJSONs = await getPackageJSONsFromBuild(packagesDir);
  const packageNames = [...packageJSONs].map(([, json]) => json.name);

  const currentNPMUser = await execa.stdout('npm', ['whoami']);

  await step('Verify npm access', async () => {
    const packagesWithoutAccess = [];
    await Promise.all(
      packageNames.map(async packageName => {
        const out = await execa.stdout('npm', [
          'access',
          'ls-collaborators',
          packageName,
        ]);
        const collaborators = JSON.parse(out);
        const hasAccess = collaborators[currentNPMUser] === 'read-write';
        if (!hasAccess) {
          packagesWithoutAccess.push(packageName);
        }
      })
    );

    if (packagesWithoutAccess.length > 0) {
      throw new GracefulError(chalk`
Insufficient npm permissions

Current user {yellow.bold ${currentNPMUser}} does not have write access to these packages:
{red ${packagesWithoutAccess.join(', ')}}

Please contact a React team member.`);
    }
  });

  const {otp} = await inquirer.prompt([
    {type: 'input', name: 'otp', message: 'npm one-time password (otp)'},
  ]);

  if (tag === undefined) {
    tag = 'unstable';
  } else {
    throw new Error('TODO: customize tag');
  }

  const alreadyPublished = new Set();

  await step('Check for already installed versions', async () => {
    for (const [, packageJSON] of packageJSONs) {
      const existingChecksum = await execa.stdout('npm', [
        'view',
        `${packageJSON.name}@${packageJSON.version}`,
        'buildInfo.checksum',
      ]);

      if (existingChecksum !== '') {
        if (existingChecksum === packageJSON.buildInfo.checksum) {
          // A package with this checksum and version was already published.
          alreadyPublished.add(packageJSON.name);
        } else {
          throw new GracefulError(
            `${packageJSON.name}@${
              packageJSON.version
            } already exists on npm ` +
              'but its contents do not match. You will need to create a new ' +
              'build at a different verison.'
          );
        }
      }
    }
  });

  console.log(`

Ok, here we go.

`);

  let packageJSONsThatFailedToPublish = new Set();
  for (const [npmTarFile, packageJSON] of packageJSONs) {
    const pathToNPMTarFile = path.resolve(packagesDir, npmTarFile);
    const nameAndVersionCombined = `${packageJSON.name}@${packageJSON.version}`;
    const shouldContinue = await step(
      `Publish ${nameAndVersionCombined}`,
      async spinner => {
        try {
          if (alreadyPublished.has(packageJSON.name)) {
            await execa.stdout('npm', [
              'dist-tag',
              'add',
              nameAndVersionCombined,
              tag,
              '--otp',
              otp,
            ]);
            spinner.succeed(
              `${nameAndVersionCombined} already published and has matching checksum.`
            );
          } else {
            await execa.stdout('npm', [
              'publish',
              pathToNPMTarFile,
              '--otp',
              otp,
              '--tag',
              tag,
            ]);
          }
          return true;
        } catch (error) {
          console.log(error.message);
          packageJSONsThatFailedToPublish.add(packageJSON);
          if (
            error.message.includes(
              'This operation requires a one-time password'
            )
          ) {
            spinner.fail(
              `Failed to publish ${nameAndVersionCombined}.` +
                chalk`{yellow One-time password is either invalid or expired. Canceling remaining packages.}`
            );
            // Since the otp is invalid, stop publishing.
            return false;
          } else {
            spinner.fail(`Failed to publish ${nameAndVersionCombined}`);
            // Keep attempting to build the other packages.
            return true;
          }
        }
      }
    );
    if (!shouldContinue) {
      break;
    }
  }

  if (packageJSONsThatFailedToPublish.size > 0) {
    throw new GracefulError(
      chalk`
{red {bold Some packages failed to publish.}}

Don't panic. Run this script again to retry. Packages that were already released will be skipped next time.`
    );
  }
}

const mainDefinitions = [{name: 'command', defaultOption: true}];
const mainOptions = commandLineArgs(mainDefinitions, {
  stopAtFirstUnknown: true,
});
const argv = mainOptions._unknown || [];

async function main() {
  switch (mainOptions.command) {
    case 'build': {
      const definitions = [
        {
          name: 'from',
          type: String,
          defaultOption: true,
          defaultValue: 'HEAD',
        },
        {name: 'repo', type: String, defaultValue: './'},
        {name: 'all', type: Boolean},
      ];
      const options = commandLineArgs(definitions, {argv});
      await buildLocal(options.from, options.repo, options.all);
      break;
    }
    case 'show': {
      const definitions = [
        {name: 'buildTar', type: String, defaultOption: true},
        {name: 'all', type: Boolean},
      ];
      const options = commandLineArgs(definitions, {argv});
      await show(options.buildTar, options.all);
      break;
    }
    case 'push': {
      const definitions = [
        {name: 'buildTar', type: String, defaultOption: true},
        {name: 'tag', type: String},
      ];
      const options = commandLineArgs(definitions, {argv});
      await push(options.buildTar);
    }
  }
}

main().catch(error => {
  if (error instanceof GracefulError) {
    process.stdout.write(error.message);
    process.exit(1);
  }
  throw error;
});
