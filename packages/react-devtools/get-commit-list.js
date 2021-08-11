/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {execSync} = require('child_process');
const readline = require('readline');

const PULL_REQUEST_BASE_URL = 'https://github.com/facebook/react/pull/';

const hashes = [];
const lines = execSync(`
  git log --max-count=5 --topo-order --pretty=format:'%H:::%s:::%as' HEAD -- packages/react-devtools-core/package.json
`)
  .toString()
  .trim()
  .split('\n');
lines.forEach((line, index) => {
  const [hash, message, date] = line.split(':::');
  hashes.push(hash);
  console.log(
    `\x1b[1m(${index + 1})\x1b[0m ${message} \x1b[2m(${date})\x1b[0m`,
  );
});

const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
prompt.question(
  '\n' +
    '\x1b[1m' +
    'Which of the commits above marks the last DevTools release?' +
    '\x1b[0m ',
  numberString => {
    const hashIndex = parseInt(numberString, 10) - 1;
    const hash = hashes[hashIndex];

    let formattedLog = '';

    const rawLog = execSync(`
    git log --topo-order --pretty=format:'%s' ${hash}...HEAD -- packages/react-devtools*
  `)
      .toString()
      .trim();
    rawLog.split('\n').forEach(line => {
      line = line.replace('[DevTools] ', '');

      const match = line.match(/(.+) \(#([0-9]+)\)/);
      if (match !== null) {
        const title = match[1];
        const pr = match[2];

        formattedLog += `\n* ${title} \x1b[31m([USERNAME](https://github.com/USERNAME)\x1b[0m in [#${pr}](\x1b[4m\x1b[34m${PULL_REQUEST_BASE_URL}${pr}\x1b[0m))`;
      } else {
        formattedLog += `\n* ${line}`;
      }
    });

    console.log(formattedLog);

    prompt.close();
  },
);
