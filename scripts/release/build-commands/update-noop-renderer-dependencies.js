#!/usr/bin/env node

'use strict';

const {readJson, writeJson} = require('fs-extra');
const {join} = require('path');
const semver = require('semver');
const {execUnlessDry, logPromise} = require('../utils');

const getReactReconcilerVersion = async cwd => {
  const path = join(cwd, 'packages', 'react-reconciler', 'package.json');
  const json = await readJson(path);
  return json.version;
};

const update = async ({cwd, dry}) => {
  const path = join(cwd, 'packages', 'react-noop-renderer', 'package.json');
  const json = await readJson(path);

  // IMPORTANT: This script must be run after update-package-versions,
  // Since it depends up the updated react-reconciler version.
  const reconcilerVersion = await getReactReconcilerVersion(cwd);

  // There is no wildcard for semver that includes prerelease ranges as well.
  // This causes problems for our Yarn workspaces setup,
  // Since the noop-renderer depends on react-reconciler.
  // So we have a special case check for this that ensures semver compatibility.
  if (semver.prerelease(reconcilerVersion)) {
    json.dependencies['react-reconciler'] = `* || ${reconcilerVersion}`;
  } else {
    json.dependencies['react-reconciler'] = '*';
  }

  await writeJson(path, json, {spaces: 2});

  await execUnlessDry(
    `git commit -am "Updating dependencies for react-noop-renderer"`,
    {cwd, dry}
  );
};

module.exports = async params => {
  return logPromise(update(params), 'Updating noop renderer dependencies');
};
