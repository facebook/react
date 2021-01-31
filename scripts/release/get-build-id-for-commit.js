'use strict';

const fetch = require('node-fetch');

async function getBuildIdForCommit(sha) {
  let ciBuildId = null;
  const statusesResponse = await fetch(
    `https://api.github.com/repos/facebook/react/commits/${sha}/status`
  );

  if (!statusesResponse.ok) {
    throw Error('Could not find commit for: ' + sha);
  }

  const {statuses, state} = await statusesResponse.json();
  if (state === 'failure') {
    throw new Error(`Base commit is broken: ${sha}`);
  }
  for (let i = 0; i < statuses.length; i++) {
    const status = statuses[i];
    if (status.context === `ci/circleci: process_artifacts_combined`) {
      if (status.state === 'success') {
        ciBuildId = /\/facebook\/react\/([0-9]+)/.exec(status.target_url)[1];
        break;
      }
      if (status.state === 'pending') {
        throw new Error(`Build job for base commit is still pending: ${sha}`);
      }
    }
  }
  return ciBuildId;
}

module.exports = getBuildIdForCommit;
