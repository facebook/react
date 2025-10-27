/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const {execFile} = require('child_process');
const {promisify} = require('util');
const semver = require('semver');
const yargs = require('yargs/yargs');

const {stablePackages} = require('../../ReactVersions');

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(__dirname, '..', '..');

function parseArgs(argv) {
  const parser = yargs(argv)
    .usage(
      'Usage: yarn generate-changelog [--codex|--claude] [--debug] [--format <text|csv|json>] [<pkg@version> ...]'
    )
    .example(
      '$0 --codex eslint-plugin-react-hooks@7.0.1',
      'Generate changelog for a single package using Codex.'
    )
    .example(
      '$0 --claude react@19.3 react-dom@19.3',
      'Generate changelog entries for multiple packages using Claude.'
    )
    .example(
      '$0 --codex',
      'Generate changelog for all stable packages using recorded versions.'
    )
    .option('codex', {
      type: 'boolean',
      describe: 'Use Codex for commit summarization.',
    })
    .option('claude', {
      type: 'boolean',
      describe: 'Use Claude for commit summarization.',
    })
    .option('debug', {
      type: 'boolean',
      describe: 'Enable verbose debug logging.',
      default: false,
    })
    .option('format', {
      type: 'string',
      describe: 'Output format for the generated changelog.',
      choices: ['text', 'csv', 'json'],
      default: 'text',
    })
    .help('help')
    .alias('h', 'help')
    .version(false)
    .parserConfiguration({
      'parse-numbers': false,
      'parse-positional-numbers': false,
    });

  const args = parser.scriptName('generate-changelog').parse();
  const packageSpecs = [];
  const debug = !!args.debug;
  const format = args.format || 'text';
  let summarizer = null;
  if (args.codex && args.claude) {
    throw new Error('Choose either --codex or --claude, not both.');
  }
  if (args.codex) {
    summarizer = 'codex';
  } else if (args.claude) {
    summarizer = 'claude';
  }

  const positionalArgs = Array.isArray(args._) ? args._ : [];
  for (let i = 0; i < positionalArgs.length; i++) {
    const token = String(positionalArgs[i]).trim();
    if (!token) {
      continue;
    }

    const atIndex = token.lastIndexOf('@');
    if (atIndex <= 0 || atIndex === token.length - 1) {
      throw new Error(`Invalid package specification: ${token}`);
    }

    const packageName = token.slice(0, atIndex);
    const versionText = token.slice(atIndex + 1);
    const validVersion =
      semver.valid(versionText) || semver.valid(semver.coerce(versionText));
    if (!validVersion) {
      throw new Error(`Invalid version for ${packageName}: ${versionText}`);
    }

    packageSpecs.push({
      name: packageName,
      version: validVersion,
      displayVersion: versionText,
    });
  }

  if (packageSpecs.length === 0) {
    Object.keys(stablePackages).forEach(pkgName => {
      const versionText = stablePackages[pkgName];
      const validVersion = semver.valid(versionText);
      if (!validVersion) {
        throw new Error(
          `Invalid stable version configured for ${pkgName}: ${versionText}`
        );
      }
      packageSpecs.push({
        name: pkgName,
        version: validVersion,
        displayVersion: versionText,
      });
    });
  }

  if (summarizer && !isCommandAvailable(summarizer)) {
    throw new Error(
      `Requested summarizer "${summarizer}" is not available on the PATH.`
    );
  }

  return {
    debug,
    format,
    summarizer,
    packageSpecs,
  };
}

async function fetchNpmInfo(packageName, {log}) {
  const npmArgs = ['view', `${packageName}@latest`, '--json'];
  const options = {cwd: repoRoot, maxBuffer: 10 * 1024 * 1024};
  log(`Fetching npm info for ${packageName}...`);
  const {stdout} = await execFileAsync('npm', npmArgs, options);

  let data = stdout.trim();
  if (!data) {
    throw new Error(`npm view returned empty result for ${packageName}`);
  }

  let info = JSON.parse(data);
  if (Array.isArray(info)) {
    info = info[info.length - 1];
  }

  const version = info.version || info['dist-tags']?.latest;
  let gitHead = info.gitHead || null;

  if (!gitHead) {
    const gitHeadResult = await execFileAsync(
      'npm',
      ['view', `${packageName}@${version}`, 'gitHead'],
      {cwd: repoRoot, maxBuffer: 1024 * 1024}
    );
    const possibleGitHead = gitHeadResult.stdout.trim();
    if (
      possibleGitHead &&
      possibleGitHead !== 'undefined' &&
      possibleGitHead !== 'null'
    ) {
      log(`Found gitHead for ${packageName}@${version}: ${possibleGitHead}`);
      gitHead = possibleGitHead;
    }
  }

  if (!version) {
    throw new Error(
      `Unable to determine latest published version for ${packageName}`
    );
  }
  if (!gitHead) {
    throw new Error(
      `Unable to determine git commit for ${packageName}@${version}`
    );
  }

  return {
    publishedVersion: version,
    gitHead,
  };
}

async function collectCommitsSince(packageName, sinceGitSha, {log}) {
  log(`Collecting commits for ${packageName} since ${sinceGitSha}...`);
  await execFileAsync('git', ['cat-file', '-e', `${sinceGitSha}^{commit}`], {
    cwd: repoRoot,
  });
  const {stdout} = await execFileAsync(
    'git',
    [
      'rev-list',
      '--reverse',
      `${sinceGitSha}..HEAD`,
      '--',
      path.posix.join('packages', packageName),
    ],
    {cwd: repoRoot, maxBuffer: 10 * 1024 * 1024}
  );

  return stdout
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

async function loadCommitDetails(sha, {log}) {
  log(`Loading commit details for ${sha}...`);
  const format = ['%H', '%s', '%an', '%ae', '%ct', '%B'].join('%n');
  const {stdout} = await execFileAsync(
    'git',
    ['show', '--quiet', `--format=${format}`, sha],
    {cwd: repoRoot, maxBuffer: 10 * 1024 * 1024}
  );

  const [commitSha, subject, authorName, authorEmail, timestamp, ...rest] =
    stdout.split('\n');
  const body = rest.join('\n').trim();

  return {
    sha: commitSha.trim(),
    subject: subject.trim(),
    authorName: authorName.trim(),
    authorEmail: authorEmail.trim(),
    timestamp: +timestamp.trim() || 0,
    body,
  };
}

function extractPrNumber(subject, body) {
  const patterns = [
    /\(#(\d+)\)/,
    /https:\/\/github\.com\/facebook\/react\/pull\/(\d+)/,
  ];

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    const subjectMatch = subject && subject.match(pattern);
    if (subjectMatch) {
      return subjectMatch[1];
    }
    const bodyMatch = body && body.match(pattern);
    if (bodyMatch) {
      return bodyMatch[1];
    }
  }

  return null;
}

function isCommandAvailable(command) {
  const paths = (process.env.PATH || '').split(path.delimiter);
  const extensions =
    process.platform === 'win32' && process.env.PATHEXT
      ? process.env.PATHEXT.split(';')
      : [''];

  for (let i = 0; i < paths.length; i++) {
    const dir = paths[i];
    if (!dir) {
      continue;
    }
    for (let j = 0; j < extensions.length; j++) {
      const ext = extensions[j];
      const fullPath = path.join(dir, `${command}${ext}`);
      try {
        fs.accessSync(fullPath, fs.constants.X_OK);
        return true;
      } catch {
        // Keep searching.
      }
    }
  }
  return false;
}

function readChangelogSnippet(preferredPackage) {
  const cacheKey =
    preferredPackage === 'eslint-plugin-react-hooks'
      ? preferredPackage
      : 'root';
  if (!readChangelogSnippet.cache) {
    readChangelogSnippet.cache = new Map();
  }
  const cache = readChangelogSnippet.cache;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const targetPath =
    preferredPackage === 'eslint-plugin-react-hooks'
      ? path.join(
          repoRoot,
          'packages',
          'eslint-plugin-react-hooks',
          'CHANGELOG.md'
        )
      : path.join(repoRoot, 'CHANGELOG.md');

  let content = '';
  try {
    content = fs.readFileSync(targetPath, 'utf8');
  } catch {
    content = '';
  }

  const snippet = content.slice(0, 4000);
  cache.set(cacheKey, snippet);
  return snippet;
}

function sanitizeSummary(text) {
  if (!text) {
    return '';
  }

  const trimmed = text.trim();
  const withoutBullet = trimmed.replace(/^([-*]\s+|\d+\s*[\.)]\s+)/, '');

  return withoutBullet.replace(/\s+/g, ' ').trim();
}

async function summarizePackages({
  summarizer,
  packageSpecs,
  packageTargets,
  commitsByPackage,
  log,
}) {
  const summariesByPackage = new Map();
  if (!summarizer) {
    packageSpecs.forEach(spec => {
      const commits = commitsByPackage.get(spec.name) || [];
      const summaryMap = new Map();
      for (let i = 0; i < commits.length; i++) {
        const commit = commits[i];
        summaryMap.set(commit.sha, commit.subject);
      }
      summariesByPackage.set(spec.name, summaryMap);
    });
    return summariesByPackage;
  }

  const tasks = packageSpecs.map(spec => {
    const commits = commitsByPackage.get(spec.name) || [];
    return summarizePackageCommits({
      summarizer,
      spec,
      commits,
      packageTargets,
      allPackageSpecs: packageSpecs,
      log,
    });
  });

  const results = await Promise.all(tasks);
  results.forEach(entry => {
    summariesByPackage.set(entry.packageName, entry.summaries);
  });
  return summariesByPackage;
}

async function summarizePackageCommits({
  summarizer,
  spec,
  commits,
  packageTargets,
  allPackageSpecs,
  log,
}) {
  const summaries = new Map();
  if (commits.length === 0) {
    return {packageName: spec.name, summaries};
  }

  const rootStyle = readChangelogSnippet('root');
  const hooksStyle = readChangelogSnippet('eslint-plugin-react-hooks');
  const targetList = allPackageSpecs.map(
    targetSpec =>
      `${targetSpec.name}@${targetSpec.displayVersion || targetSpec.version}`
  );
  const payload = commits.map(commit => {
    const packages = Array.from(commit.packages || []).sort();
    const usesHooksStyle = (commit.packages || new Set()).has(
      'eslint-plugin-react-hooks'
    );
    const packagesWithVersions = packages.map(pkgName => {
      const targetSpec = packageTargets.get(pkgName);
      if (!targetSpec) {
        return pkgName;
      }
      return `${pkgName}@${targetSpec.displayVersion || targetSpec.version}`;
    });
    return {
      sha: commit.sha,
      packages,
      packagesWithVersions,
      style: usesHooksStyle ? 'eslint-plugin-react-hooks' : 'root',
      subject: commit.subject,
      body: commit.body || '',
    };
  });

  const promptParts = [
    `You are preparing changelog summaries for ${spec.name} ${
      spec.displayVersion || spec.version
    }.`,
    'The broader release includes:',
    ...targetList.map(line => `- ${line}`),
    '',
    'For each commit payload, write a single concise sentence without a leading bullet.',
    'Match the tone and formatting of the provided style samples. Do not mention commit hashes.',
    'Return a JSON array where each element has the shape `{ "sha": "<sha>", "summary": "<text>" }`.',
    'The JSON must contain one entry per commit in the same order they are provided.',
    'Use `"root"` style unless the payload specifies `"eslint-plugin-react-hooks"`, in which case use that style sample.',
    '',
    '--- STYLE: root ---',
    rootStyle,
    '--- END STYLE ---',
    '',
    '--- STYLE: eslint-plugin-react-hooks ---',
    hooksStyle,
    '--- END STYLE ---',
    '',
    `Commits affecting ${spec.name}:`,
  ];

  payload.forEach((item, index) => {
    promptParts.push(
      `Commit ${index + 1}:`,
      `sha: ${item.sha}`,
      `style: ${item.style}`,
      `packages: ${item.packagesWithVersions.join(', ') || 'none'}`,
      `subject: ${item.subject}`,
      'body:',
      item.body || '(empty)',
      ''
    );
  });
  promptParts.push('Return ONLY the JSON array.', '');

  const prompt = promptParts.join('\n');
  log(
    `Invoking ${summarizer} for ${payload.length} commit summaries targeting ${spec.name}.`
  );
  log(`Summarizer prompt length: ${prompt.length} characters.`);

  try {
    const raw = await runSummarizer(summarizer, prompt);
    log(`Summarizer output length: ${raw.length}`);
    const parsed = parseSummariesResponse(raw);
    if (!parsed) {
      throw new Error('Unable to parse summarizer output.');
    }
    parsed.forEach(entry => {
      const summary = sanitizeSummary(entry.summary || '');
      if (summary) {
        summaries.set(entry.sha, summary);
      }
    });
  } catch (error) {
    if (log !== noopLogger) {
      log(
        `Warning: failed to summarize commits for ${spec.name} with ${summarizer}. Falling back to subjects. ${error.message}`
      );
      if (error && error.stack) {
        log(error.stack);
      }
    }
  }

  for (let i = 0; i < commits.length; i++) {
    const commit = commits[i];
    if (!summaries.has(commit.sha)) {
      summaries.set(commit.sha, commit.subject);
    }
  }

  log(`Summaries available for ${summaries.size} commit(s) for ${spec.name}.`);

  return {packageName: spec.name, summaries};
}

function noopLogger() {}

function escapeCsvValue(value) {
  if (value == null) {
    return '';
  }

  const stringValue = String(value).replace(/\r?\n|\r/g, ' ');
  if (stringValue.includes('"') || stringValue.includes(',')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function toCsvRow(values) {
  return values.map(escapeCsvValue).join(',');
}

async function runSummarizer(command, prompt) {
  const options = {cwd: repoRoot, maxBuffer: 5 * 1024 * 1024};

  if (command === 'codex') {
    const {stdout} = await execFileAsync(
      'codex',
      ['exec', '--json', prompt],
      options
    );
    return parseCodexSummary(stdout);
  }

  if (command === 'claude') {
    const {stdout} = await execFileAsync('claude', ['-p', prompt], options);
    return stripClaudeBanner(stdout);
  }

  throw new Error(`Unsupported summarizer command: ${command}`);
}

function parseCodexSummary(output) {
  let last = '';
  const lines = output.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      continue;
    }
    try {
      const event = JSON.parse(trimmed);
      if (
        event.type === 'item.completed' &&
        event.item?.type === 'agent_message'
      ) {
        last = event.item.text || '';
      }
    } catch {
      last = trimmed;
    }
  }
  return last || output;
}

function stripClaudeBanner(text) {
  return text
    .split('\n')
    .filter(
      line =>
        line.trim() !==
        'Claude Code at Meta (https://fburl.com/claude.code.users)'
    )
    .join('\n');
}

function parseSummariesResponse(raw) {
  const candidates = [];
  const trimmed = raw.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    candidates.push(fencedMatch[1].trim());
  }

  const firstBracket = trimmed.indexOf('[');
  if (firstBracket !== -1) {
    candidates.push(trimmed.slice(firstBracket).trim());
  }

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    if (!candidate) {
      continue;
    }
    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Try the next candidate.
    }
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Fall through.
  }

  return null;
}

async function fetchPullRequestMetadata(prNumber, {log}) {
  log(`Fetching PR metadata for #${prNumber}...`);
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || null;
  const requestOptions = {
    hostname: 'api.github.com',
    path: `/repos/facebook/react/pulls/${prNumber}`,
    method: 'GET',
    headers: {
      'User-Agent': 'generate-changelog-script',
      Accept: 'application/vnd.github+json',
    },
  };
  if (token) {
    requestOptions.headers.Authorization = `Bearer ${token}`;
  }

  return new Promise(resolve => {
    const req = https.request(requestOptions, res => {
      let raw = '';
      res.on('data', chunk => {
        raw += chunk;
      });
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(raw);
            resolve({
              authorLogin: json.user?.login || null,
            });
          } catch (error) {
            process.stderr.write(
              `Warning: unable to parse GitHub response for PR #${prNumber}: ${error.message}\n`
            );
            resolve(null);
          }
        } else {
          process.stderr.write(
            `Warning: GitHub API request failed for PR #${prNumber} with status ${res.statusCode}\n`
          );
          resolve(null);
        }
      });
    });

    req.on('error', error => {
      process.stderr.write(
        `Warning: GitHub API request errored for PR #${prNumber}: ${error.message}\n`
      );
      resolve(null);
    });

    req.end();
  });
}

async function main() {
  const {packageSpecs, summarizer, debug, format} = parseArgs(
    process.argv.slice(2)
  );
  const log = debug
    ? (...args) => console.log('[generate-changelog]', ...args)
    : noopLogger;
  const allStablePackages = Object.keys(stablePackages);

  const packageTargets = new Map();
  for (let i = 0; i < packageSpecs.length; i++) {
    const spec = packageSpecs[i];
    if (!allStablePackages.includes(spec.name)) {
      throw new Error(
        `Package "${spec.name}" is not listed in stablePackages.`
      );
    }
    if (packageTargets.has(spec.name)) {
      throw new Error(`Package "${spec.name}" was specified more than once.`);
    }
    packageTargets.set(spec.name, spec);
  }

  const targetPackages = packageSpecs.map(spec => spec.name);
  log(
    `Starting changelog generation for: ${packageSpecs
      .map(spec => `${spec.name}@${spec.displayVersion || spec.version}`)
      .join(', ')}`
  );

  const packageInfoMap = new Map();
  const packageInfoResults = await Promise.all(
    targetPackages.map(async pkg => {
      const info = await fetchNpmInfo(pkg, {log});
      return {pkg, info};
    })
  );
  for (let i = 0; i < packageInfoResults.length; i++) {
    const entry = packageInfoResults[i];
    packageInfoMap.set(entry.pkg, entry.info);
  }

  const commitPackagesMap = new Map();
  const commitCollections = await Promise.all(
    targetPackages.map(async pkg => {
      const {gitHead} = packageInfoMap.get(pkg);
      const commits = await collectCommitsSince(pkg, gitHead, {log});
      log(`Package ${pkg} has ${commits.length} commit(s) since ${gitHead}.`);
      return {pkg, commits};
    })
  );
  for (let i = 0; i < commitCollections.length; i++) {
    const entry = commitCollections[i];
    const pkg = entry.pkg;
    const commits = entry.commits;
    for (let j = 0; j < commits.length; j++) {
      const sha = commits[j];
      if (!commitPackagesMap.has(sha)) {
        commitPackagesMap.set(sha, new Set());
      }
      commitPackagesMap.get(sha).add(pkg);
    }
  }
  log(`Found ${commitPackagesMap.size} commits touching target packages.`);

  if (commitPackagesMap.size === 0) {
    console.log('No commits found for the selected packages.');
    return;
  }

  const commitDetails = await Promise.all(
    Array.from(commitPackagesMap.entries()).map(
      async ([sha, packagesTouched]) => {
        const detail = await loadCommitDetails(sha, {log});
        detail.packages = packagesTouched;
        detail.prNumber = extractPrNumber(detail.subject, detail.body);
        return detail;
      }
    )
  );

  commitDetails.sort((a, b) => a.timestamp - b.timestamp);
  log(`Ordered ${commitDetails.length} commit(s) chronologically.`);

  const commitsByPackage = new Map();
  commitDetails.forEach(commit => {
    commit.packages.forEach(pkgName => {
      if (!commitsByPackage.has(pkgName)) {
        commitsByPackage.set(pkgName, []);
      }
      commitsByPackage.get(pkgName).push(commit);
    });
  });

  const uniquePrNumbers = Array.from(
    new Set(commitDetails.map(commit => commit.prNumber).filter(Boolean))
  );
  log(`Identified ${uniquePrNumbers.length} unique PR number(s).`);

  const prMetadata = new Map();
  log(`Summarizer selected: ${summarizer || 'none (using commit titles)'}`);
  const prMetadataResults = await Promise.all(
    uniquePrNumbers.map(async prNumber => {
      const meta = await fetchPullRequestMetadata(prNumber, {log});
      return {prNumber, meta};
    })
  );
  for (let i = 0; i < prMetadataResults.length; i++) {
    const entry = prMetadataResults[i];
    if (entry.meta) {
      prMetadata.set(entry.prNumber, entry.meta);
    }
  }
  log(`Fetched metadata for ${prMetadata.size} PR(s).`);

  const summariesByPackage = await summarizePackages({
    summarizer,
    packageSpecs,
    packageTargets,
    commitsByPackage,
    log,
  });

  const noChangesMessage = 'No changes since the last release.';
  const changelogEntries = [];
  for (let i = 0; i < packageSpecs.length; i++) {
    const spec = packageSpecs[i];
    const versionText = spec.displayVersion || spec.version;
    const commitsForPackage = commitsByPackage.get(spec.name) || [];
    const entry = {
      package: spec.name,
      version: versionText,
      hasChanges: commitsForPackage.length > 0,
      commits: [],
      note: null,
    };

    if (!entry.hasChanges) {
      entry.note = noChangesMessage;
      changelogEntries.push(entry);
      continue;
    }

    const summaryMap = summariesByPackage.get(spec.name) || new Map();
    entry.commits = commitsForPackage.map(commit => {
      if (commit.prNumber && prMetadata.has(commit.prNumber)) {
        const metadata = prMetadata.get(commit.prNumber);
        if (metadata && metadata.authorLogin) {
          commit.authorLogin = metadata.authorLogin;
        }
      }

      let summary = summaryMap.get(commit.sha) || commit.subject;
      if (commit.prNumber) {
        const prPattern = new RegExp(`\\s*\\(#${commit.prNumber}\\)$`);
        summary = summary.replace(prPattern, '').trim();
      }

      const prNumber = commit.prNumber || null;
      const prUrl = prNumber
        ? `https://github.com/facebook/react/pull/${prNumber}`
        : null;
      const commitSha = commit.sha;
      const commitUrl = `https://github.com/facebook/react/commit/${commitSha}`;

      const authorLogin = commit.authorLogin || null;
      const authorName = commit.authorName || null;
      const authorEmail = commit.authorEmail || null;

      let authorUrl = null;
      let authorDisplay = authorName || 'unknown author';

      if (authorLogin) {
        authorUrl = `https://github.com/${authorLogin}`;
        authorDisplay = `[@${authorLogin}](${authorUrl})`;
      } else if (authorName && authorName.startsWith('@')) {
        const username = authorName.slice(1);
        authorUrl = `https://github.com/${username}`;
        authorDisplay = `[@${username}](${authorUrl})`;
      }

      const referenceDisplay = prNumber
        ? `[#${prNumber}](${prUrl})`
        : `commit ${commitSha.slice(0, 7)}`;
      const referenceType = prNumber ? 'pr' : 'commit';
      const referenceId = prNumber ? `#${prNumber}` : commitSha.slice(0, 7);
      const referenceUrl = prNumber ? prUrl : commitUrl;

      return {
        summary,
        prNumber,
        prUrl,
        commitSha,
        commitUrl,
        authorLogin,
        authorName,
        authorEmail,
        authorUrl,
        authorDisplay,
        referenceDisplay,
        referenceType,
        referenceId,
        referenceUrl,
      };
    });

    changelogEntries.push(entry);
  }

  log('Generated changelog sections.');
  if (format === 'text') {
    const outputLines = [];
    for (let i = 0; i < changelogEntries.length; i++) {
      const entry = changelogEntries[i];
      outputLines.push(`## ${entry.package}@${entry.version}`);
      if (!entry.hasChanges) {
        outputLines.push(`* ${entry.note}`);
        outputLines.push('');
        continue;
      }

      entry.commits.forEach(commit => {
        outputLines.push(
          `* ${commit.summary} (${commit.referenceDisplay} by ${commit.authorDisplay})`
        );
      });
      outputLines.push('');
    }

    while (outputLines.length && outputLines[outputLines.length - 1] === '') {
      outputLines.pop();
    }

    console.log(outputLines.join('\n'));
    return;
  }

  if (format === 'csv') {
    const header = [
      'package',
      'version',
      'summary',
      'reference_type',
      'reference_id',
      'reference_url',
      'author_name',
      'author_login',
      'author_url',
      'author_email',
      'commit_sha',
      'commit_url',
    ];
    const rows = [header];
    changelogEntries.forEach(entry => {
      if (!entry.hasChanges) {
        rows.push([
          entry.package,
          entry.version,
          entry.note,
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
        ]);
        return;
      }

      entry.commits.forEach(commit => {
        const authorName =
          commit.authorName ||
          (commit.authorLogin ? `@${commit.authorLogin}` : 'unknown author');
        rows.push([
          entry.package,
          entry.version,
          commit.summary,
          commit.referenceType,
          commit.referenceId,
          commit.referenceUrl,
          authorName,
          commit.authorLogin || '',
          commit.authorUrl || '',
          commit.authorEmail || '',
          commit.commitSha,
          commit.commitUrl,
        ]);
      });
    });

    const csvLines = rows.map(toCsvRow);
    console.log(csvLines.join('\n'));
    return;
  }

  if (format === 'json') {
    const payload = changelogEntries.map(entry => ({
      package: entry.package,
      version: entry.version,
      hasChanges: entry.hasChanges,
      note: entry.hasChanges ? undefined : entry.note,
      commits: entry.commits.map(commit => ({
        summary: commit.summary,
        prNumber: commit.prNumber,
        prUrl: commit.prUrl,
        commitSha: commit.commitSha,
        commitUrl: commit.commitUrl,
        author: {
          login: commit.authorLogin,
          name: commit.authorName,
          email: commit.authorEmail,
          url: commit.authorUrl,
          display: commit.authorDisplay,
        },
        reference: {
          type: commit.referenceType,
          id: commit.referenceId,
          url: commit.referenceUrl,
          label: commit.referenceDisplay,
        },
      })),
    }));

    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  throw new Error(`Unsupported format: ${format}`);
}

main().catch(error => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
