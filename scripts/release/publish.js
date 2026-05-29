#!/usr/bin/env node

'use strict';

const {join} = require('path');
const {getPublicPackages, handleError} = require('./utils');
const theme = require('./theme');

const confirmVersionAndTags = require('./publish-commands/confirm-version-and-tags');
const parseParams = require('./publish-commands/parse-params');
const publishToNPM = require('./publish-commands/publish-to-npm');
const validateTags = require('./publish-commands/validate-tags');

const run = async () => {
  try {
    const params = parseParams();

    const isExperimental = params.tag === 'experimental';

    params.cwd = join(__dirname, '..', '..');
    params.packages = await getPublicPackages(isExperimental);

    if (params.onlyPackages.length > 0) {
      params.packages = params.packages.filter(packageName => {
        return params.onlyPackages.includes(packageName);
      });
    }

    await validateTags(params);
    await confirmVersionAndTags(params);
    // npm ownership / whoami no longer applies — OIDC trusted publishing
    // verifies the publisher via the registry's per-package config, not via a
    // logged-in npm user.

    const packageNames = params.packages;

    let failed = false;
    for (let i = 0; i < packageNames.length; i++) {
      try {
        const packageName = packageNames[i];
        await publishToNPM(params, packageName, null);
      } catch (error) {
        failed = true;
        console.error(error.message);
        console.log();
        console.log(
          theme.error`Publish failed. Will attempt to publish remaining packages.`
        );
      }
    }
    if (failed) {
      console.log(theme.error`One or more packages failed to publish.`);
      process.exit(1);
    }
  } catch (error) {
    handleError(error);
  }
};

run();
