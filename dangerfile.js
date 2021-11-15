/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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

const {readFileSync, statSync} = require('fs');

const BASE_DIR = 'base-build';
const HEAD_DIR = 'build';

const CRITICAL_THRESHOLD = 0.02;
const SIGNIFICANCE_THRESHOLD = 0.002;
const CRITICAL_ARTIFACT_PATHS = new Set([
  // We always report changes to these bundles, even if the change is
  // insiginificant or non-existent.
  'oss-stable/react-dom/cjs/react-dom.production.min.js',
  'oss-experimental/react-dom/cjs/react-dom.production.min.js',
  'facebook-www/ReactDOM-prod.classic.js',
  'facebook-www/ReactDOM-prod.modern.js',
  'facebook-www/ReactDOMForked-prod.classic.js',
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
  if (Number === Infinity) {
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

function row(result) {
  // prettier-ignore
  return `| ${result.path} | **${change(result.change)}** | ${kbs(result.baseSize)} | ${kbs(result.headSize)} | ${change(result.changeGzip)} | ${kbs(result.baseSizeGzip)} | ${kbs(result.headSizeGzip)}`;
}

(async function() {
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
  )
    return;

  const resultsMap = new Map();

  // Find all the head (current) artifacts paths.
  const headArtifactPaths = await glob('**/*.js', {cwd: 'build'});
  for (const artifactPath of headArtifactPaths) {
    try {
      // This will throw if there's no matching base artifact
      const baseSize = statSync(BASE_DIR + '/' + artifactPath).size;
      const baseSizeGzip = gzipSize.fileSync(BASE_DIR + '/' + artifactPath);

      const headSize = statSync(HEAD_DIR + '/' + artifactPath).size;
      const headSizeGzip = gzipSize.fileSync(HEAD_DIR + '/' + artifactPath);
      resultsMap.set(artifactPath, {
        path: artifactPath,
        headSize,
        headSizeGzip,
        baseSize,
        baseSizeGzip,
        change: (headSize - baseSize) / baseSize,
        changeGzip: (headSizeGzip - baseSizeGzip) / baseSizeGzip,
      });
    } catch {
      // There's no matching base artifact. This is a new file.
      const baseSize = 0;
      const baseSizeGzip = 0;
      const headSize = statSync(HEAD_DIR + '/' + artifactPath).size;
      const headSizeGzip = gzipSize.fileSync(HEAD_DIR + '/' + artifactPath);
      resultsMap.set(artifactPath, {
        path: artifactPath,
        headSize,
        headSizeGzip,
        baseSize,
        baseSizeGzip,
        change: Infinity,
        changeGzip: Infinity,
      });
    }
  }

  // Check for base artifacts that were deleted in the head.
  const baseArtifactPaths = await glob('**/*.js', {cwd: 'base-build'});
  for (const artifactPath of baseArtifactPaths) {
    if (!resultsMap.has(artifactPath)) {
      const baseSize = statSync(BASE_DIR + '/' + artifactPath).size;
      const baseSizeGzip = gzipSize.fileSync(BASE_DIR + '/' + artifactPath);
      const headSize = 0;
      const headSizeGzip = 0;
      resultsMap.set(artifactPath, {
        path: artifactPath,
        headSize,
        headSizeGzip,
        baseSize,
        baseSizeGzip,
        change: -1,
        changeGzip: -1,
      });
    }
  }

  const results = Array.from(resultsMap.values());
  results.sort((a, b) => b.change - a.change);

  let criticalResults = [];
  for (const artifactPath of CRITICAL_ARTIFACT_PATHS) {
    const result = resultsMap.get(artifactPath);
    if (result === undefined) {
      throw new Error(
        'Missing expected bundle. If this was an intentional change to the ' +
          'build configuration, update Dangerfile.js accordingly: ' +
          artifactPath
      );
    }
    criticalResults.push(row(result));
  }

  let significantResults = [];
  for (const result of results) {
    // If result exceeds critical threshold, add to top section.
    if (
      (result.change > CRITICAL_THRESHOLD ||
        0 - result.change > CRITICAL_THRESHOLD ||
        // New file
        result.change === Infinity ||
        // Deleted file
        result.change === -1) &&
      // Skip critical artifacts. We added those earlier, in a fixed order.
      !CRITICAL_ARTIFACT_PATHS.has(result.path)
    ) {
      criticalResults.push(row(result));
    }

    // Do the same for results that exceed the significant threshold. These
    // will go into the bottom, collapsed section. Intentionally including
    // critical artifacts in this section, too.
    if (
      result.change > SIGNIFICANCE_THRESHOLD ||
      0 - result.change > SIGNIFICANCE_THRESHOLD ||
      result.change === Infinity ||
      result.change === -1
    ) {
      significantResults.push(row(result));
    }
  }

  markdown(`
Comparing: ${baseSha}...${headSha}

## Critical size changes

Includes critical production bundles, as well as any change greater than ${CRITICAL_THRESHOLD *
    100}%:

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
`);
})();
