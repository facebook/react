'use strict';

const fetch = require('node-fetch');

const POLLING_INTERVAL = 10 * 1000; // 10 seconds
const RETRY_TIMEOUT = 4 * 60 * 1000; // 4 minutes

function wait(ms) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms);
  });
}

function scrapeBuildIDFromStatus(status) {
  return /\/facebook\/react\/([0-9]+)/.exec(status.target_url)[1];
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
          return scrapeBuildIDFromStatus(status);
        }
        if (status.state === 'failure') {
          throw new Error(`Build job for commit failed: ${sha}`);
        }
        if (status.state === 'pending') {
          if (Date.now() < retryLimit) {
            await wait(POLLING_INTERVAL);
            continue retry;
          }
          // GitHub's status API is super flaky. Sometimes it reports a job
          // as "pending" even after it completes in CircleCI. If it's still
          // pending when we time out, return the build ID anyway.
          // TODO: The location of the retry loop is a bit weird. We should
          // probably combine this function with the one that downloads the
          // artifacts, and wrap the retry loop around the whole thing.
          return scrapeBuildIDFromStatus(status);
        }
      }
    }
    if (state === 'pending') {
      if (Date.now() < retryLimit) {
        await wait(POLLING_INTERVAL);
        continue retry;
      }
      throw new Error('Exceeded retry limit. Build job is still pending.');
    }
    throw new Error('Could not find build for commit: ' + sha);
  }
}

module.exports = getBuildIdForCommit;
