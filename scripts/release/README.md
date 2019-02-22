# React Release Scripts

The release process consists of several phases, each one represented by one of the scripts below.

A typical release goes like this:
1. When a commit is pushed to the React repo, [Circle CI](https://circleci.com/gh/facebook/react/) will build all release bundles and run unit tests against both the source code and the built bundles.
2. Next the release is [**published as a canary**](#publishing-a-canary) using the [`prepare-canary`](#prepare-canary) and [`publish`](#publish) scripts. (Currently this process is manual but might be automated in the future using [GitHub "actions"](https://github.com/features/actions).)
3. Finally, a canary releases can be [**promoted to stable**](#publishing-a-stable-release)<sup>1</sup> using the [`prepare-stable`](#prepare-stable) and [`publish`](#publish) scripts. (This process is always manual.)

The high level process of creating releases is [documented below](#process). Individual scripts are documented as well:
* [`create-canary`](#create-canary)
* [`prepare-canary`](#prepare-canary)
* [`prepare-stable`](#prepare-stable)
* [`publish`](#publish)

<sup>Note that [**creating a patch release**](creating-a-patch-release) has a slightly different process than a major/minor release.</sup>

# Process

## Publishing a Canary

Canaries are meant to be lightweight and published often. In most cases, canaries can be published using artifacts built by Circle CI.

To prepare a canary for a particular commit:
1. Choose a commit from [the commit log](https://github.com/facebook/react/commits/master).
2. Click the "“✓" icon and click the Circle CI "Details" link.
4. Copy the build ID from the URL (e.g. the build ID for [circleci.com/gh/facebook/react/13471](https://circleci.com/gh/facebook/react/13471) is  **13471**).
5. Run the [`prepare-canary`](#prepare-canary) script with the build ID you found <sup>1</sup>:
```sh
scripts/release/prepare-canary.js --build=13471
```

Once the canary has been checked out and tested locally, you're ready to publish it:
```sh
scripts/release/publish.js --tags canary
```

<sup>1: You can omit the `build` param if you just want to release the latest commit as a canary.</sup>

## Publishing a Stable Release

Stable releases should always be created from a previously-released canary. This encourages better testing of the actual release artifacts and reduces the chance of unintended changes accidentally being included in a stable release.

To prepare a stable release, choose a canary version and  run the [`prepare-stable`](#prepare-stable) script <sup>1</sup>:

```sh
scripts/release/prepare-stable.js --version=0.0.0-5bf84d292
```

This script will prompt you to select stable version numbers for each of the packages. It will update the package JSON versions (and dependencies) based on the numbers you select.

Once this step is complete, you're ready to publish the release:

```sh
scripts/release/publish.js --tags next latest
```

After successfully publishing the release, follow the on-screen instructions to ensure that all of the appropriate post-release steps are executed.

<sup>1: You can omit the `version` param if you just want to promote the latest canary to stable.</sup>

## Creating a Patch Release

Patch releases should always be created by branching from a previous release. This reduces the likelihood of unstable changes being accidentally included in the release.

Begin by creating a branch from the previous git tag<sup>1</sup>:

```sh
git checkout -b 16.8.3 v16.8.2
```

Next cherry pick any changes from master that you want to include in the release:

```sh
it cherry-pick <commit-hash>
```

Once you have cherry picked all of the commits you want to include in the release, push your feature branch and create a Pull Request (so that Circle CI will create a canary):

```sh
git push origin 16.8.3
```

Once CI is complete, follow the regular [**canary**](#publishing-a-canary) and [**promote to stable**](#publishing-a-stable-release) processes.

<sup>1: The `build-info.json` artifact can also be used to identify the appropriate commit (e.g. [unpkg.com/react@16.8.3/build-info.json](https://unpkg.com/react@16.8.3/build-info.json) shows us that react version 16.8.3 was created from commit [`29b7b775f`](https://github.com/facebook/react/commit/29b7b775f)).</sup>

# Scripts

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