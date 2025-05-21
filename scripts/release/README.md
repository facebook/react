# React Release Scripts

This document describes how to prepare and publish a release manually, using the command line.

However, most of our releases are actually *prereleases* that get continuously shipped via CI. Our automated prerelease channels are preferred whenever possible, because if they accidentally break, it won't affect production users.

Before proceeding, consider your motivation:

- **"I want to share experimental features with collaborators."** After your code lands in GitHub (behind an experimental feature flag), it will be automatically published via CI within the next weekday. So usually, all you have to do is wait.
- **"But I want to publish it now!"** You can [trigger the CI job to run automatically](#trigger-an-automated-prerelease).
- **"I want to publish a stable release with a real version number"** Refer to the ["Publishing a Stable Release"](#publishing-a-stable-release) section. If this is your first time running a stable release, consult with another team member before proceeding.
- **"I have some special use case that's not explicitly mentioned here."** Read the rest of this document, and consult with another team member before proceeding.

# Process

If this is your first time running the release scripts, go to the `scripts/release` directory and run `yarn` to install the dependencies.

The release process consists of several phases, each one represented by one of the scripts below.

A typical release cycle goes like this:
1. When a commit is pushed to the React repo, [GitHub Actions](https://github.com/facebook/react/actions) will build all release bundles and run unit tests against both the source code and the built bundles.
2. Each weekday, an automated CI cron job publishes prereleases to the `next` and `experimental` channels, from tip of the main branch.
   1. You can also [trigger an automated prerelease via the GitHub UI](#trigger-an-automated-prerelease), instead of waiting until the next time the cron job runs.
   2. For advanced cases, you can [**manually prepare and publish to the `next` channel**](#publishing-release) using the [`prepare-release-from-ci`](#prepare-release-from-ci) and [`publish`](#publish) scripts; or to the [**`experimental` channel**](#publishing-an-experimental-release) using the same scripts (but different build artifacts).
3. Finally, a "next" release can be [**promoted to stable**](#publishing-a-stable-release)<sup>1</sup> using the [`prepare-release-from-npm`](#prepare-release-from-npm) and [`publish`](#publish) scripts. (This process is always manual.)

The high level process of creating releases is [documented below](#process). Individual scripts are documented as well:
* [`build-release-locally`](#build-release-locally): Build a release locally from the checked out source code.
* [`prepare-release-from-ci`](#prepare-release-from-ci): Download a pre-built release from CI.
* [`prepare-release-from-npm`](#prepare-release-from-npm): Prepare an NPM "next" release to be published as a "stable" release.
* [`publish`](#publish): Publish the downloaded (or prepared) release to NPM.

<sup>1. [**Creating a patch release**](#creating-a-patch-release) has a slightly different process than a major/minor release.</sup>

## Trigger an Automated Prerelease

If your code lands in the main branch, it will be automatically published to the prerelease channels within the next weekday. However, if you want to immediately publish a prerelease, you can trigger the job to run immediately via the GitHub UI:

1. Wait for the commit you want to release to finish its [(Runtime) Build and Test workflow](https://github.com/facebook/react/actions/workflows/runtime_build_and_test.yml), as the prerelease script needs to download the build from that workflow.
2. Copy the git sha of whichever commit you are trying to release
3. Go to https://github.com/facebook/react/actions/workflows/runtime_prereleases_manual.yml
4. Paste the git sha into the "Run workflow" dropdown
5. Let the job finish and it will be released on npm

This will grab the specified revision on the main branch and publish it to the Next and Experimental channels.
## Publishing Without Tags

The sections below include meaningful `--tags` in the instructions. However, keep in mind that **the `--tags` arguments is optional**, and you can omit it if you don't want to tag the release on npm at all. This can be useful when preparing breaking changes.

## Publishing Next

"Next" builds are meant to be lightweight and published often. In most cases, they can be published using artifacts built by Circle CI.

To prepare a build for a particular commit:
1. Choose a commit from [the commit log](https://github.com/facebook/react/commits/main).
2. Copy the SHA (by clicking the 📋 button)
5. Run the [`prepare-release-from-ci`](#prepare-release-from-ci) script with the SHA <sup>1</sup> you found:
```sh
scripts/release/prepare-release-from-ci.js -r stable --commit=0e526bc
```

Once the build has been checked out and tested locally, you're ready to publish it:
```sh
scripts/release/publish.js --tags next
```

<sup>1: You can omit the `commit` param if you just want to release the latest commit as to "next".</sup>

## Publishing an Experimental Release

Experimental releases are special because they have additional features turned on.

The steps for publishing an experimental release are almost the same as for publishing a "next" release except for the release channel (`-r`) flag.

```sh
scripts/release/prepare-release-from-ci.js -r experimental --commit=0e526bc
```

Once the build has been checked out and tested locally, you're ready to publish it. When publishing an experimental release, use the `experimental` tag:

```sh
scripts/release/publish.js --tags experimental
```

## Publishing a Stable Release

Stable releases should always be created from the "next" channel. This encourages better testing of the actual release artifacts and reduces the chance of unintended changes accidentally being included in a stable release.

To prepare a stable release, choose a "next" version and run the [`prepare-release-from-npm`](#prepare-release-from-npm) script <sup>1</sup>:

```sh
scripts/release/prepare-release-from-npm.js --version=0.0.0-241c4467e-20200129
```

This script will prompt you to select stable version numbers for each of the packages. It will update the package JSON versions (and dependencies) based on the numbers you select.

Once this step is complete, you're ready to publish the release:

```sh
scripts/release/publish.js --tags latest

# Or, if you want to bump "next" as well:
scripts/release/publish.js --tags latest next
```

After successfully publishing the release, follow the on-screen instructions to ensure that all of the appropriate post-release steps are executed.

<sup>1: You can omit the `version` param if you just want to promote the latest "next" candidate to stable.</sup>

## Creating a Patch Release

Patch releases should always be created by branching from a previous release. This reduces the likelihood of unstable changes being accidentally included in the release.

Begin by creating a branch from the previous git tag<sup>1</sup>:

```sh
git checkout -b 16.8.3 v16.8.2
```

Next cherry pick any changes from main that you want to include in the release:

```sh
git cherry-pick <commit-hash>
```

Once you have cherry picked all of the commits you want to include in the release, push your feature branch and create a Pull Request (so that Circle CI will create a build):

```sh
git push origin 16.8.3
```

Once CI is complete, follow the regular [**next**](#publishing-release) and [**promote to stable**](#publishing-a-stable-release) processes.

<sup>1: The `build-info.json` artifact can also be used to identify the appropriate commit (e.g. [unpkg.com/react@16.8.3/build-info.json](https://unpkg.com/react@16.8.3/build-info.json) shows us that react version 16.8.3 was created from commit [`29b7b775f`](https://github.com/facebook/react/commit/29b7b775f)).</sup>

# Scripts

## `build-release-locally`
Creates a "next" build from the current (local) Git revision.

**This script is an escape hatch.** It allows a release to be created without pushing a commit to be verified by Circle CI. **It does not run any automated unit tests.** Testing is solely the responsibility of the release engineer.

Note that this script git-archives the React repo (at the current revision) to a temporary directory before building, so **uncommitted changes are not included in the build**.

#### Example usage
To create a build from the current branch and revision:
```sh
scripts/release/build-release-locally.js
```

## `prepare-release-from-ci`
Downloads build artifacts from Circle CI in preparation to be published to NPM as either a "next" or "experimental" release.

All artifacts built by Circle CI have already been unit-tested (both source and bundles) but these candidates should **always be manually tested** before being published. Upon completion, this script prints manual testing instructions.

#### Example usage
To prepare the artifacts created by Circle CI for commit [0e526bc](https://github.com/facebook/react/commit/0e526bc) you would run:
```sh
scripts/release/prepare-release-from-ci.js --commit=0e526bc -r stable
```

## `prepare-release-from-npm`
Checks out a "next" release from NPM and prepares it to be published as a stable release.

This script prompts for new (stable) release versions for each public package and updates the package contents (both `package.json` and inline version numbers) to match. It also updates inter-package dependencies to account for the new versions.

"Next" releases have already been tested but it is still a good idea to **manually test and verify a release** before publishing to ensure that e.g. version numbers are correct. Upon completion, this script prints manual testing instructions.

#### Example usage
To promote the "next" release `0.0.0-241c4467e-20200129` (aka commit [241c4467e](https://github.com/facebook/react/commit/241c4467e)) to stable:
```sh
scripts/release/prepare-release-from-npm.js --version=0.0.0-241c4467e-20200129
```

## `publish`
Publishes the current contents of `build/node_modules` to NPM.

This script publishes each public package to NPM and updates the specified tag(s) to match. **It does not test or verify the local package contents before publishing**. This should be done by the release engineer prior to running the script.

Upon completion, this script provides instructions for tagging the Git commit that the package was created from and updating the release CHANGELOG.

**Specify a `--dry` flag when running this script if you want to skip the NPM-publish step.** In this event, the script will print the NPM commands but it will not actually run them.

#### Example usage
To publish a release to NPM as both `next` and `latest`:
```sh
scripts/release/publish.js --tags latest next
```
