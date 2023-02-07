'use strict';

const fetch = require('node-fetch');

const {logPromise} = require('./utils');
const theme = require('./theme');

const CIRCLE_TOKEN = process.env.CIRCLE_CI_API_TOKEN;

if (!CIRCLE_TOKEN) {
  console.error(
    theme.error('Missing required environment variable: CIRCLE_CI_API_TOKEN')
  );
  process.exit(1);
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), ms);
  });
}

async function getPublishWorkflowID(pipelineID) {
  // Since we just created the pipeline in a POST request, the server may 404.
  // Try a few times before giving up.
  for (let i = 0; i < 20; i++) {
    const pipelineWorkflowsResponse = await fetch(
      `https://circleci.com/api/v2/pipeline/${pipelineID}/workflow`
    );
    if (pipelineWorkflowsResponse.ok) {
      const pipelineWorkflowsJSON = await pipelineWorkflowsResponse.json();
      const workflows = pipelineWorkflowsJSON.items;
      if (workflows.length !== 0) {
        return workflows[0].id;
      }
    }
    // CircleCI server may be stale. Wait a sec and try again.
    await sleep(1000);
  }
  return null;
}

async function pollUntilWorkflowFinishes(workflowID) {
  while (true) {
    const workflowResponse = await fetch(
      `https://circleci.com/api/v2/workflow/${workflowID}`
    );
    const workflow = await workflowResponse.json();
    switch (workflow.status) {
      case 'running':
        // Workflow still running. Wait a bit then check again.
        await sleep(2000);
        continue;
      case 'success':
        // Publish succeeded! Continue.
        return;
      case 'not_run':
      case 'failed':
      case 'error':
      case 'failing':
      case 'on_hold':
      case 'canceled':
      case 'unauthorized':
      default:
        console.error(
          theme.error(
            `Failed to publish. Workflow exited with status: ${workflow.status}`
          )
        );
        console.error(
          `Visit https://app.circleci.com/pipelines/workflows/${workflowID} for details.`
        );
        process.exit(1);
        break;
    }
  }
}

async function main() {
  const headCommitResponse = await fetch(
    'https://api.github.com/repos/facebook/react/commits/main'
  );
  const headCommitJSON = await headCommitResponse.json();
  const headCommitSha = headCommitJSON.sha;

  const pipelineResponse = await fetch(
    'https://circleci.com/api/v2/project/github/facebook/react/pipeline',
    {
      method: 'post',
      body: JSON.stringify({
        parameters: {
          prerelease_commit_sha: headCommitSha,
        },
      }),
      headers: {
        'Circle-Token': CIRCLE_TOKEN,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!pipelineResponse.ok) {
    console.error(
      theme.error(
        `Failed to access CircleCI. Responded with status: ${pipelineResponse.status}`
      )
    );
    process.exit(1);
  }

  const pipelineJSON = await pipelineResponse.json();
  const pipelineID = pipelineJSON.id;

  const workflowID = await logPromise(
    getPublishWorkflowID(pipelineID),
    theme`{header Creating CI workflow}`,
    2 * 1000 // Estimated time: 2 seconds,
  );

  if (workflowID === null) {
    console.warn(
      theme.yellow(
        'Created a CI pipeline to publish the packages, but the script timed ' +
          "out when requesting the associated workflow ID. It's still " +
          'possible the workflow was created.\n\n' +
          'Visit ' +
          'https://app.circleci.com/pipelines/github/facebook/react?branch=main ' +
          'for a list of the latest workflows.'
      )
    );
    process.exit(1);
  }

  await logPromise(
    pollUntilWorkflowFinishes(workflowID),
    theme`{header Publishing in CI workflow}: https://app.circleci.com/pipelines/workflows/${workflowID}`,
    2 * 60 * 1000 // Estimated time: 2 minutes,
  );
}

main().catch(error => {
  console.error(theme.error('Failed to trigger publish workflow.'));
  console.error(error.message);
  process.exit(1);
});
