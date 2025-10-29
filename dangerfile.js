/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

/* eslint-disable no-for-of-loops/no-for-of-loops */

// Hi, if this is your first time editing/reading a Dangerfile, here's a summary:
// It's a JS runtime which helps you provide continuous feedback inside GitHub.
//
// You can see the docs here: http://danger.systems/js/
//
// If you want to test changes Danger, I'd recommend checking out an existing PR
// and then running the `danger pr` command.
//
// You'll need a GitHub token, you can re-use this one:
//
//  0a7d5c3cad9a6dbec2d9 9a5222cf49062a4c1ef7
//
// (Just remove the space)
//
// So, for example:
//
// `DANGER_GITHUB_API_TOKEN=[ENV_ABOVE] yarn danger pr https://github.com/facebook/react/pull/11865

const {markdown, danger, warn} = require('danger');
const {promisify} = require('util');
const glob = promisify(require('glob'));
const gzipSize = require('gzip-size');
const {writeFileSync, readFileSync, statSync, existsSync} = require('fs');

const BASE_DIR = 'base-build';
const HEAD_DIR = 'build';

const CRITICAL_THRESHOLD = 0.02;
const SIGNIFICANCE_THRESHOLD = 0.002;
const CRITICAL_ARTIFACT_PATHS = new Set([
  // We always report changes to these bundles, even if the change is
  // insignificant or non-existent.
  'oss-stable/react-dom/cjs/react-dom.production.js',
  'oss-stable/react-dom/cjs/react-dom-client.production.js',
  'oss-experimental/react-dom/cjs/react-dom.production.js',
  'oss-experimental/react-dom/cjs/react-dom-client.production.js',
  'facebook-www/ReactDOM-prod.classic.js',
  'facebook-www/ReactDOM-prod.modern.js',
]);

const kilobyteFormatter = new Intl.NumberFormat('en', {
  style: 'unit',
  unit: 'kilobyte',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function kbs(bytes) {
  return kilobyteFormatter.format(bytes / 1000);
}

const percentFormatter = new Intl.NumberFormat('en', {
  style: 'percent',
  signDisplay: 'exceptZero',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function change(decimal) {
  if (decimal === Infinity) {
    return 'New file';
  }
  if (decimal === -1) {
    return 'Deleted';
  }
  if (decimal < 0.0001) {
    return '=';
  }
  return percentFormatter.format(decimal);
}

const header = `
  | Name | +/- | Base | Current | +/- gzip | Base gzip | Current gzip |
  | ---- | --- | ---- | ------- | -------- | --------- | ------------ |`;

function row(result, baseSha, headSha) {
  const diffViewUrl = `https://react-builds.vercel.app/commits/${headSha}/files/${result.path}?compare=${baseSha}`;
  const rowArr = [
    `| [${result.path}](${diffViewUrl})`,
    `**${change(result.change)}**`,
    `${kbs(result.baseSize)}`,
    `${kbs(result.headSize)}`,
    `${change(result.changeGzip)}`,
    `${kbs(result.baseSizeGzip)}`,
    `${kbs(result.headSizeGzip)}`,
  ];
  return rowArr.join(' | ');
}

function getArtifactStats(dir, artifactPath) {
  const fullPath = `${dir}/${artifactPath}`;
  if (!existsSync(fullPath)) {
    return null;
  }
  return {
    size: statSync(fullPath).size,
    gzipSize: gzipSize.fileSync(fullPath),
  };
}

function createResult(artifactPath, baseStats, headStats) {
  const baseSize = baseStats?.size ?? 0;
  const baseSizeGzip = baseStats?.gzipSize ?? 0;
  const headSize = headStats?.size ?? 0;
  const headSizeGzip = headStats?.gzipSize ?? 0;

  let change, changeGzip;
  if (!baseStats && headStats) {
    // New file
    change = Infinity;
    changeGzip = Infinity;
  } else if (baseStats && !headStats) {
    // Deleted file
    change = -1;
    changeGzip = -1;
  } else {
    // Modified file
    change = baseSize === 0 ? 0 : (headSize - baseSize) / baseSize;
    changeGzip =
      baseSizeGzip === 0 ? 0 : (headSizeGzip - baseSizeGzip) / baseSizeGzip;
  }

  return {
    path: artifactPath,
    headSize,
    headSizeGzip,
    baseSize,
    baseSizeGzip,
    change,
    changeGzip,
  };
}

function isSignificantChange(result) {
  return (
    Math.abs(result.change) > SIGNIFICANCE_THRESHOLD ||
    result.change === Infinity ||
    result.change === -1
  );
}

function isCriticalChange(result) {
  return (
    Math.abs(result.change) > CRITICAL_THRESHOLD ||
    result.change === Infinity ||
    result.change === -1
  );
}

(async function () {
  // Use git locally to grab the commit which represents the place
  // where the branches differ

  const upstreamRepo = danger.github.pr.base.repo.full_name;
  if (upstreamRepo !== 'facebook/react') {
    // Exit unless we're running in the main repo
    return;
  }

  let headSha;
  let baseSha;
  try {
    headSha = String(readFileSync(HEAD_DIR + '/COMMIT_SHA')).trim();
    baseSha = String(readFileSync(BASE_DIR + '/COMMIT_SHA')).trim();
  } catch {
    warn(
      "Failed to read build artifacts. It's possible a build configuration " +
        'has changed upstream. Try pulling the latest changes from the ' +
        'main branch.'
    );
    return;
  }

  // Disable sizeBot in a Devtools Pull Request. Because that doesn't affect production bundle size.
  const commitFiles = [
    ...danger.git.created_files,
    ...danger.git.deleted_files,
    ...danger.git.modified_files,
  ];
  if (
    commitFiles.every(filename => filename.includes('packages/react-devtools'))
  ) {
    return;
  }

  const resultsMap = new Map();

  // Find all artifact paths from both base and head builds
  const [headArtifactPaths, baseArtifactPaths] = await Promise.all([
    glob('**/*.js', {cwd: HEAD_DIR}),
    glob('**/*.js', {cwd: BASE_DIR}),
  ]);

  // Create a set of all unique artifact paths
  const allArtifactPaths = new Set([
    ...headArtifactPaths,
    ...baseArtifactPaths,
  ]);

  // Process all artifacts in a single pass
  for (const artifactPath of allArtifactPaths) {
    const baseStats = getArtifactStats(BASE_DIR, artifactPath);
    const headStats = getArtifactStats(HEAD_DIR, artifactPath);
    
    const result = createResult(artifactPath, baseStats, headStats);
    resultsMap.set(artifactPath, result);
  }

  const results = Array.from(resultsMap.values());
  results.sort((a, b) => b.change - a.change);

  const criticalResults = [];
  const significantResults = [];

  // Process critical artifacts first (in fixed order)
  for (const artifactPath of CRITICAL_ARTIFACT_PATHS) {
    const result = resultsMap.get(artifactPath);
    if (result === undefined) {
      throw new Error(
        'Missing expected bundle. If this was an intentional change to the ' +
          'build configuration, update Dangerfile.js accordingly: ' +
          artifactPath
      );
    }
    criticalResults.push(row(result, baseSha, headSha));
    
    // Also add to significant results if it meets the threshold
    if (isSignificantChange(result)) {
      significantResults.push(row(result, baseSha, headSha));
    }
  }

  // Process remaining results
  for (const result of results) {
    // Skip critical artifacts as they were already processed
    if (CRITICAL_ARTIFACT_PATHS.has(result.path)) {
      continue;
    }

    if (isCriticalChange(result)) {
      criticalResults.push(row(result, baseSha, headSha));
    }

    if (isSignificantChange(result)) {
      significantResults.push(row(result, baseSha, headSha));
    }
  }

  const message = `
Comparing: ${baseSha}...${headSha}

## Critical size changes

Includes critical production bundles, as well as any change greater than ${
    CRITICAL_THRESHOLD * 100
  }%:

${header}
${criticalResults.join('\n')}

## Significant size changes

Includes any change greater than ${SIGNIFICANCE_THRESHOLD * 100}%:

${
  significantResults.length > 0
    ? `
<details>
<summary>Expand to show</summary>
${header}
${significantResults.join('\n')}
</details>
`
    : '(No significant changes)'
}
`;

  // GitHub comments are limited to 65536 characters.
  if (message.length > 65536) {
    // Make message available as an artifact
    writeFileSync('sizebot-message.md', message);
    markdown(
      'The size diff is too large to display in a single comment. ' +
        `The GitHub action for this pull request contains an artifact called 'sizebot-message.md' with the full message.`
    );
  } else {
    markdown(message);
  }
})();