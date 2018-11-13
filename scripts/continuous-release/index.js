#!/usr/bin/env node

/*eslint-disable no-for-of-loops/no-for-of-loops */

// TODO: Fail if find-replace returns nothing

'use strict';

const fs = require('fs');
const chalk = require('chalk');
const execa = require('execa');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
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
const download = require('download');
const semver = require('semver');

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

async function replaceReactVersion(packagesDir, from, to) {
  const options = {
    files: packagesDir + '/**',
    from,
    to,
  };
  await replaceInFile(options);
}

async function hashPackagesDirectory(packagesDir) {
  const options = {
    encoding: 'hex',
    files: {exclude: ['.DS_Store']},
  };
  return await hashElement(packagesDir, options);
}

async function finalizePackageJSONs(
  packageJSONs,
  buildInfos,
  versions,
  packagesDir
) {
  for (const [, packageJSON] of packageJSONs) {
    const packageName = packageJSON.name;
    packageJSON.version = versions.get(packageName);
    packageJSON.buildInfo = buildInfos.get(packageName);
    for (const typeOfDependency of typesOfDependencies) {
      const dependencies = packageJSON[typeOfDependency];
      if (dependencies !== undefined) {
        for (const dep in dependencies) {
          if (packageJSONs.has(dep)) {
            // Prepend a caret
            // TODO: Pick a better heuristic
            dependencies[dep] = '^' + versions.get(dep);
          }
        }
      }
    }
    const newPackageJSONPath = path.resolve(
      packagesDir,
      packageJSON.name,
      'package.json'
    );
    await writeFile(newPackageJSONPath, JSON.stringify(packageJSON, null, 2));
  }
}

async function packForNPM(packagesDir, packageNames) {
  for (const packageName of packageNames) {
    try {
      await execa.stdout(
        'npm',
        ['pack', path.resolve(packagesDir, packageName)],
        {cwd: packagesDir}
      );
      await rimraf(path.resolve(packagesDir, packageName));
    } catch (error) {
      throw new GracefulError(error.message);
    }
  }
}
async function writeBuildArtifact(buildID, buildDir) {
  const buildTarFilename = `react-build-${buildID}.tgz`;
  await tar.c(
    {
      gzip: true,
      file: path.resolve(process.cwd(), buildTarFilename),
      cwd: path.resolve(buildDir),
    },
    ['packages']
  );
  return buildTarFilename;
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

  await step(
    'Temporarily replace ReactVersion.js with placeholder',
    async () => {
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
    }
  );

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
            '--extract-errors',
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

  const packageJSONs = await step('Extract build artifacts', async () => {
    return await getPackageJSONsFromBuildArtifacts(
      packageNames,
      packagesDir,
      artifactsPath
    );
  });

  const hashedPackages = await step('Calculate checksums', async () => {
    return await hashPackagesDirectory(packagesDir);
  });

  const buildChecksum = hashedPackages.hash.slice(0, 7);
  const buildID = `${commitSha}-${buildChecksum}`;

  const buildInfos = new Map();
  const versions = new Map();
  for (const hashedPackage of hashedPackages.children) {
    const packageName = hashedPackage.name;
    const checksum = hashedPackage.hash;
    buildInfos.set(packageName, {
      buildID,
      checksum,
      unstable: true,
      partial: isPartialBuild,
      packages: packageNames,
    });
    const version = `0.0.0-${buildID}-${checksum.slice(0, 7)}`;
    versions.set(packageName, version);
  }

  let reactVersion = versions.get('react');
  if (reactVersion === undefined) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'reactVersion',
        message:
          `Since 'react' is not part of this build, you must specify ` +
          'a ReactVersion: ',
        validate(v) {
          if (!semver.valid(v)) {
            return new Error(v + 'is not a valid version.');
          }
          return true;
        },
      },
    ]);
    reactVersion = answers.reactVersion;
  }

  await step('Update ReactVersion to ' + reactVersion, async () => {
    await replaceReactVersion(
      packagesDir,
      PLACEHOLDER_VERSION_STR,
      reactVersion
    );
  });

  await step('Create final package.jsons', async () => {
    return await finalizePackageJSONs(
      packageJSONs,
      buildInfos,
      versions,
      packagesDir
    );
  });

  await step('Pack for npm', async () => {
    return await packForNPM(packagesDir, packageNames);
  });

  const buildTarFilename = await step('Output build', async () => {
    return await writeBuildArtifact(buildID, buildDir);
  });

  console.log(chalk`
  Created {green {inverse ${buildTarFilename} }}`);
}

async function promote(unresolvedBaseReactVersion) {
  if (unresolvedBaseReactVersion === undefined) {
    throw new GracefulError('Must provide a React version.');
  }

  let baseReactVersion;
  let buildInfo;
  await step('Retrieve build info', async () => {
    baseReactVersion = await execa.stdout('npm', [
      'view',
      'react@' + unresolvedBaseReactVersion,
      'version',
    ]);

    if (baseReactVersion === '') {
      throw new GracefulError(
        'No matches for react@' + unresolvedBaseReactVersion
      );
    }

    const buildInfoStr = await execa.stdout('npm', [
      'view',
      'react@' + baseReactVersion,
      'buildInfo',
      '--json',
    ]);
    buildInfo = JSON.parse(buildInfoStr);

    if (buildInfo.unstable !== true) {
      throw new GracefulError(
        `Cannot promote a past release (react@${baseReactVersion}), only a canary build.`
      );
    }
  });

  const packageNames = buildInfo.packages;

  const versions = new Map();
  for (const packageName of packageNames) {
    const currentLatestVersion = await execa.stdout('npm', [
      'view',
      `${packageName}@latest`,
      'version',
    ]);
    const {packageVersion} = await inquirer.prompt([
      {
        type: 'input',
        name: 'packageVersion',
        // TODO: Better heuristic for default value
        default: semver.inc(currentLatestVersion, 'patch'),
        message: chalk`Version for {blue ${packageName}}`,
        suffix: chalk` (latest is ${currentLatestVersion})`,
        validate(v) {
          if (!semver.valid(v)) {
            return new Error(v + 'is not a valid version.');
          }
          return true;
        },
      },
    ]);
    versions.set(packageName, packageVersion);
  }

  const buildDir = tempy.directory();
  const packagesDir = path.resolve(buildDir, 'packages');
  await execa('mkdir', ['-p', packagesDir]);

  await step(
    `Fetch and extract build artifacts for ${buildInfo.buildID}`,
    async () => {
      await Promise.all(
        packageNames.map(async packageName => {
          const tempOutputDir = tempy.directory();

          const tarballURL = await execa.stdout('npm', [
            'view',
            `${packageName}@${baseReactVersion}`,
            'dist.tarball',
          ]);

          const tarballFilename = 'tarball.tgz';
          await download(tarballURL, tempOutputDir, {
            filename: tarballFilename,
          });

          await tar.x({
            file: path.resolve(tempOutputDir, tarballFilename),
            cwd: tempOutputDir,
          });

          const oldPath = path.resolve(tempOutputDir, 'package');
          const newPath = path.resolve(packagesDir, packageName);
          await execa('mkdir', ['-p', newPath]);
          await rename(oldPath, newPath);
          await rimraf(tempOutputDir);
        })
      );
    }
  );

  const packageJSONs = await getPackageJSONsFromBuildArtifacts(
    packageNames,
    packagesDir,
    packagesDir
  );

  if (versions.has('react')) {
    await step('Update ReactVerison.js', async () => {
      await replaceReactVersion(
        packagesDir,
        baseReactVersion,
        versions.get('react')
      );
    });
  }

  const buildInfos = new Map();
  await Promise.all(
    packageNames.map(async packageName => {
      const buildInfoStr = await execa.stdout('npm', [
        'view',
        'react@' + baseReactVersion,
        'buildInfo',
        '--json',
      ]);
      const buildInfoForPackage = JSON.parse(buildInfoStr);
      // TODO: We should recompute the checksum, since the versions have
      // changed. There are other redundancies in place, though, so nbd.
      buildInfoForPackage.unstable = false;
      buildInfoForPackage.partial = false;
      buildInfos.set(packageName, buildInfoForPackage);
    })
  );

  await step('Create final package.jsons', async () => {
    return await finalizePackageJSONs(
      packageJSONs,
      buildInfos,
      versions,
      packagesDir
    );
  });

  await step('Pack for npm', async () => {
    return await packForNPM(packagesDir, packageNames);
  });

  const buildID = buildInfo.buildID;

  const buildTarFilename = await step('Output build', async () => {
    return await writeBuildArtifact(buildID, buildDir);
  });

  console.log(chalk`
  Created {green {inverse ${buildTarFilename} }}`);
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

async function getPackageJSONsFromBuildArtifacts(
  packageNames,
  packagesDir,
  artifactsPath
) {
  const packageJSONs = new Map();
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
            reactDeps[dep] = dependencies[dep];
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

async function push(buildTar) {
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

  return;

  console.log(`

Ok, here we go.

`);

  const {otp} = await inquirer.prompt([
    {type: 'input', name: 'otp', message: 'npm one-time password (otp)'},
  ]);

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
    case undefined:
    case 'help': {
      const sections = [
        {
          header: 'react-release',
          content:
            'A tool optimized for frequent, unstable releases of React. ',
        },
        {
          header: 'Available Commands',
          content: [
            {
              name: '{blue build} [ref=HEAD]',
              summary:
                'Create a canary build of React. Outputs a build artifact that be passed to {bold show} or {bold push}.',
            },
            {
              name: '{blue show }<path-to-build-artifact>',
              summary: 'Print information about a build artifact.',
            },
            {
              name: '{blue push }<path-to-build-artifact>',
              summary: 'Publish a build to npm.',
            },
          ],
        },
        {
          header: 'Examples',
          content: [
            {
              desc: '- Build using HEAD from inside a React repo',
              example: '{dim $} {magenta react-release} {blue build}',
            },
            {
              desc: '- Build using specific ref',
              example: '{dim $} {magenta react-release} {blue build} a8988e7',
            },
            {
              desc: '- Build from outside React repo',
              example:
                '{dim $} {magenta react-release} {blue build} a8988e7 --repo ~/path/to/react',
            },
            {
              desc: '- Show info about a React build.',
              example:
                '{dim $} {magenta react-release} {blue show} react-build-a8988e4-1d1a717.tgz',
            },
            {
              desc: '- Push a build to npm.',
              example:
                '{dim $} {magenta react-release} {blue push} react-build-a8988e4-1d1a717.tgz',
            },
          ],
        },
      ];
      const usage = commandLineUsage(sections);
      console.log(usage);
      break;
    }
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
    case 'promote': {
      const definitions = [
        {
          name: 'from',
          type: String,
          defaultOption: true,
        },
        {name: 'repo', type: String, defaultValue: './'},
        {name: 'all', type: Boolean},
        {name: 'ci', type: Boolean},
      ];
      const options = commandLineArgs(definitions, {argv});
      await promote(options.from);
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
      ];
      const options = commandLineArgs(definitions, {argv});
      await push(options.buildTar);
      break;
    }
    default: {
      throw new GracefulError(
        'Unknown command. Run without arguments for usage instructions.'
      );
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
