# React Release Scripts

The release process consists of several phases, each one represented by one of the scripts below.

A typical release goes like this:
1. When a commit is pushed to the React repo, [Circle CI](https://circleci.com/gh/facebook/react/) will build all release bundles and run unit tests against both the source code and the built bundles.
2. Next the release is published as a canary using the [`prepare-canary`](#prepare-canary) and [`publish`](#publish) scripts. (Currently this process is manual but might be automated in the future using [GitHub "actions"](https://github.com/features/actions).)
3. Finally, a canary releases can be promoted to stable using the [`prepare-stable`](#prepare-stable) and [`publish`](#publish) scripts. (This process is always manual.)

One or more release scripts are used for each of the above phases. Learn more about these scripts below:
* [`create-canary`](#create-canary)
* [`prepare-canary`](#prepare-canary)
* [`prepare-stable`](#prepare-stable)
* [`publish`](#publish)

## `create-canary`
Creates a canary build from the current (local) Git revision.

**This script is an escape hatch.** It allows a canary release to be created without pushing a commit to be verified by Circle CI. **It does not run any automated unit tests.** Testing is solely the responsibility of the release engineer.

Note that this script git-archives the React repo (at the current revision) to a temporary directory before building, so **uncommitted changes are not included in the build**.

#### Example usage
To create a canary from the current branch and revision:
```sh
scripts/release/create-canary.js
```

## `prepare-canary`
Downloads build artifacts from Circle CI in preparation to be published to NPM as a canary release.

All artifacts built by Circle CI have already been unit-tested (both source and bundles) but canaries should **always be manually tested** before being published. Upon completion, this script prints manual testing instructions.

#### Example usage
To prepare the artifacts created by [Circle CI build 12677](https://circleci.com/gh/facebook/react/12677#artifacts/containers/0) you would run:
```sh
scripts/release/prepare-canary.js --build=12677
```

## `prepare-stable`
Checks out a canary release from NPM and prepares it to be published as a stable release.

This script prompts for new (stable) release versions for each public package and updates the package contents (both `package.json` and inline version numbers) to match. It also updates inter-package dependencies to account for the new versions.

Canary release have already been tested but it is still a good idea to **manually test and verify a release** before publishing to ensure that e.g. version numbers are correct. Upon completion, this script prints manual testing instructions.

#### Example usage
To promote the canary release `0.0.0-5bf84d292` (aka commit [5bf84d292](https://github.com/facebook/react/commit/5bf84d292)) to stable:
```sh
scripts/release/prepare-stable.js --version=0.0.0-5bf84d292
```

## `publish`
Publishes the current contents of `build/node_modules` to NPM.

This script publishes each public package to NPM and updates the specified tag(s) to match. **It does not test or verify the local package contents before publishing**. This should be done by the release engineer prior to running the script.

Upon completion, this script provides instructions for tagging the Git commit that the package was created from and updating the release CHANGELOG.

**Specify a `--dry` flag when running this script if you want to skip the NPM-publish step.** In this event, the script will print the NPM commands but it will not actually run them.

#### Example usage
To publish a release to NPM as both `next` and `latest`:
```sh
scripts/release/publish.js --tags next latest
```