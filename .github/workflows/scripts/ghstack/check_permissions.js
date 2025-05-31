#!/usr/bin/env node
// JS rewrite of https://github.com/Chillee/ghstack_land_example/blob/main/.github/workflows/scripts/ghstack-perm-check.py
'use strict';

const {spawnSync} = require('child_process');
const process = require('process');
const {Octokit} = require('@octokit/rest');

const OWNER = 'facebook';
const REPO = 'react';

async function must(cond, msg, octokit, issue_number) {
  if (!cond) {
    console.error(msg);
    try {
      await octokit.issues.createComment({
        owner: OWNER,
        repo: REPO,
        issue_number,
        body: `ghstack bot failed: ${msg}`,
      });
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
    process.exit(1);
  }
}

async function main() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  if (!GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN environment variable is not set.');
    process.exit(1);
  }

  const octokit = new Octokit({auth: GITHUB_TOKEN});
  const prNumber = parseInt(process.argv[2]);
  const headRef = process.argv[3];

  console.log(headRef);
  await must(
    headRef && /^gh\/[A-Za-z0-9-]+\/[0-9]+\/head$/.test(headRef),
    'Not a ghstack PR',
    octokit,
    OWNER,
    REPO,
    prNumber
  );

  const origRef = headRef.replace('/head', '/orig');

  console.log(':: Fetching newest main...');
  let result = spawnSync('git', ['fetch', 'origin', 'main'], {
    stdio: 'inherit',
  });
  await must(
    result.status === 0,
    "Can't fetch main",
    octokit,
    OWNER,
    REPO,
    prNumber
  );

  console.log(':: Fetching orig branch...');
  result = spawnSync('git', ['fetch', 'origin', origRef], {stdio: 'inherit'});
  await must(
    result.status === 0,
    "Can't fetch orig branch",
    octokit,
    OWNER,
    REPO,
    prNumber
  );

  result = spawnSync(
    'git',
    ['log', 'FETCH_HEAD...$(git merge-base FETCH_HEAD origin/main)'],
    {shell: true}
  );
  const out = result.stdout.toString();
  await must(
    result.status === 0,
    '`git log` command failed!',
    octokit,
    OWNER,
    REPO,
    prNumber
  );

  const regex =
    /Pull Request resolved: https:\/\/github\.com\/.*?\/pull\/([0-9]+)/g;
  const prNumbers = [];
  let match;
  while ((match = regex.exec(out)) !== null) {
    prNumbers.push(parseInt(match[1], 10));
  }
  console.log(prNumbers);
  await must(
    prNumbers.length && prNumbers[0] === prNumber,
    'Extracted PR numbers not seems right!',
    octokit,
    OWNER,
    REPO,
    prNumber
  );

  for (const n of prNumbers) {
    process.stdout.write(`:: Checking PR status #${n}... `);

    let prObj;
    try {
      const {data} = await octokit.pulls.get({
        owner: OWNER,
        repo: REPO,
        pull_number: n,
      });
      prObj = data;
    } catch (error) {
      await must(
        false,
        'Error Getting PR Object!',
        octokit,
        OWNER,
        REPO,
        prNumber
      );
    }

    let reviews;
    try {
      const {data} = await octokit.request(
        'GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews',
        {
          owner: OWNER,
          repo: REPO,
          pull_number: prNumber,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );
      reviews = data;
    } catch (error) {
      await must(
        false,
        'Error Getting PR Reviews!',
        octokit,
        OWNER,
        REPO,
        prNumber
      );
    }

    let approved = false;
    for (const review of reviews) {
      if (review.state === 'COMMENTED') continue;

      await must(
        ['APPROVED', 'DISMISSED'].includes(review.state),
        `@${review.user.login} has stamped PR #${n} \`${review.state}\`, please resolve it first!`,
        octokit,
        OWNER,
        REPO,
        prNumber
      );
      if (review.state === 'APPROVED') {
        approved = true;
      }
    }
    await must(
      approved,
      `PR #${n} is not approved yet!`,
      octokit,
      OWNER,
      REPO,
      prNumber
    );

    let checkruns;
    try {
      const {data} = await octokit.checks.listForRef({
        owner: OWNER,
        repo: REPO,
        ref: prObj.head.sha,
      });
      checkruns = data;
    } catch (error) {
      await must(
        false,
        'Error getting check runs status!',
        octokit,
        OWNER,
        REPO,
        prNumber
      );
    }

    for (const cr of checkruns.check_runs) {
      const status = cr.conclusion ? cr.conclusion : cr.status;
      const name = cr.name;
      if (name === 'Copilot for PRs') continue;
      await must(
        ['success', 'neutral'].includes(status),
        `PR #${n} check-run \`${name}\`'s status \`${status}\` is not success!`,
        octokit,
        OWNER,
        REPO,
        prNumber
      );
    }
    console.log('SUCCESS!');
  }

  console.log(':: All PRs are ready to be landed!');
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
