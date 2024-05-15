const cp = require("child_process");
const ora = require("ora");
const path = require("path");
const yargs = require("yargs");
const util = require("util");
const { hashElement } = require("folder-hash");

const PUBLISHABLE_PACKAGES = [
  "babel-plugin-react-compiler",
  "eslint-plugin-react-compiler",
  "react-compiler-healthcheck",
];
const TIME_TO_RECONSIDER = 1_000;

function _spawn(command, args, options, cb) {
  const child = cp.spawn(command, args, options);
  child.on("close", (exitCode) => {
    cb(null, exitCode);
  });
  return child;
}
const spawnHelper = util.promisify(_spawn);

function execHelper(command, options, streamStdout = false) {
  return new Promise((resolve, reject) => {
    const proc = cp.exec(command, options, (error, stdout) =>
      error ? reject(error) : resolve(stdout.trim()),
    );
    if (streamStdout) {
      proc.stdout.pipe(process.stdout);
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getDateStringForCommit(commit) {
  let dateString = await execHelper(
    `git show -s --no-show-signature --format=%cd --date=format:%Y%m%d ${commit}`,
  );

  // On CI environment, this string is wrapped with quotes '...'s
  if (dateString.startsWith("'")) {
    dateString = dateString.slice(1, 9);
  }

  return dateString;
}

/**
 * Please login to npm first with `npm login`. You will also need 2FA enabled to push to npm.
 *
 * Script for publishing PUBLISHABLE_PACKAGES to npm. By default, this runs in tarball mode, meaning
 * the script will only print out what the contents of the files included in the npm tarball would
 * be.
 *
 * Please run this first (ie `yarn npm:publish`) and double check the contents of the files that
 * will be pushed to npm.
 *
 * If it looks good, you can run `yarn npm:publish --for-real` to really publish to npm. There's a
 * small annoying delay before the packages are actually pushed to give you time to panic cancel. In
 * this mode, we will bump the version field of each package's package.json, and git commit it.
 * Then, the packages will be published to npm.
 *
 * Optionally, you can add the `--debug` flag to `yarn npm:publish --debug --for-real` to run all
 * steps, but the final npm publish step will have the `--dry-run` flag added to it. This will make
 * the command only report what it would have done, instead of actually publishing to npm.
 */
async function main() {
  const argv = yargs(process.argv.slice(2))
    .option("packages", {
      description: "which packages to publish, defaults to all",
      choices: PUBLISHABLE_PACKAGES,
      default: PUBLISHABLE_PACKAGES,
    })
    .option("for-real", {
      alias: "frfr",
      description:
        "whether to publish to npm (npm publish) or dryrun (npm publish --dry-run)",
      type: "boolean",
      default: false,
    })
    .option("debug", {
      description:
        "If enabled, will always run npm commands in dry run mode irregardless of the for-real flag",
      type: "boolean",
      default: false,
    })
    .help("help")
    .parseSync();

  const { packages, forReal, debug } = argv;
  let pkgNames = packages;
  if (Array.isArray(packages) === false) {
    pkgNames = [packages];
  }
  const spinner = ora(
    `Preparing to publish ${
      forReal === true ? "(for real)" : "(dry run)"
    } [debug=${debug}]`,
  ).info();

  spinner.info("Building packages");
  for (const pkgName of pkgNames) {
    const command = `yarn workspace ${pkgName} run build`;
    spinner.start(`Running: ${command}\n`);
    try {
      await execHelper(command);
    } catch (e) {
      spinner.fail(e.toString());
      throw e;
    }
    spinner.succeed(`Successfully built ${pkgName}`);
  }
  spinner.stop();

  if (forReal === false) {
    spinner.info("Dry run: Report tarball contents");
    for (const pkgName of pkgNames) {
      console.log(`\n========== ${pkgName} ==========\n`);
      spinner.start(`Running npm pack --dry-run\n`);
      try {
        await spawnHelper("npm", ["pack", "--dry-run"], {
          cwd: path.resolve(__dirname, `../packages/${pkgName}`),
          stdio: "inherit",
        });
      } catch (e) {
        spinner.fail(e.toString());
        throw e;
      }
      spinner.stop(`Successfully packed ${pkgName} (dry run)`);
    }
    spinner.succeed(
      "Please confirm contents of packages before publishing. You can run this command again with --for-real to publish to npm",
    );
  }

  if (forReal === true) {
    const commit = await execHelper(
      "git show -s --no-show-signature --format=%h",
      {
        cwd: path.resolve(__dirname, ".."),
      },
    );
    const dateString = await getDateStringForCommit(commit);

    for (const pkgName of pkgNames) {
      const pkgDir = path.resolve(__dirname, `../packages/${pkgName}`);
      const { hash } = await hashElement(pkgDir, {
        encoding: "hex",
        files: { exclude: [".DS_Store"] },
      });
      const truncatedHash = hash.slice(0, 7);
      const newVersion = `0.0.0-experimental-${truncatedHash}-${dateString}`;

      spinner.start(`Bumping version: ${pkgName}`);
      try {
        await execHelper(
          `yarn version --new-version ${newVersion} --no-git-tag-version`,
          {
            cwd: pkgDir,
          },
        );
        await execHelper(
          `git add package.json && git commit -m "Bump version to ${newVersion}"`,
          {
            cwd: pkgDir,
          },
        );
      } catch (e) {
        spinner.fail(e.toString());
        throw e;
      }
      spinner.succeed(
        `Bumped ${pkgName} to ${newVersion} and added a git commit`,
      );
    }

    if (debug === false) {
      spinner.info(
        `🚨🚨🚨 About to publish to npm in ${
          TIME_TO_RECONSIDER / 1000
        } seconds. You still have time to kill this script!`,
      );
      await sleep(TIME_TO_RECONSIDER);
    }

    for (const pkgName of pkgNames) {
      const pkgDir = path.resolve(__dirname, `../packages/${pkgName}`);
      console.log(`\n========== ${pkgName} ==========\n`);
      spinner.start(`Publishing ${pkgName} to npm\n`);

      const opts = debug === true ? ["publish", "--dry-run"] : ["publish"];
      try {
        await spawnHelper("npm", [...opts, "--registry=http://registry.npmjs.org"], {
          cwd: pkgDir,
          stdio: "inherit",
        });
        console.log("\n");
      } catch (e) {
        spinner.fail(e.toString());
        throw e;
      }
      spinner.succeed(`Successfully published ${pkgName} to npm`);
    }

    console.log("\n\n✅ All done, please push version bump commits to GitHub");
  }
}

main();
