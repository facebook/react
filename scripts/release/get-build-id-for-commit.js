'use strict';

const fetch = require('node-fetch');

const POLLING_INTERVAL = 5 * 1000; // 5 seconds
const RETRY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms);
  });
}

async function getBuildIdForCommit(sha) {
  const retryLimit = Date.now() + RETRY_TIMEOUT;
  retry: while (true) {
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
          return /\/facebook\/react\/([0-9]+)/.exec(status.target_url)[1];
        }
        if (status.state === 'failure') {
          throw new Error(`Build job for commit failed: ${sha}`);
        }
        if (Date.now() < retryLimit) {
          await wait(POLLING_INTERVAL);
          continue retry;
        }
        throw new Error('Exceeded retry limit. Build job is still pending.');
      }
    }
    throw new Error('Could not find build for commit: ' + sha);
  }
}

module.exports = getBuildIdForCommit;
