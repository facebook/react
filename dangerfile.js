/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const {markdown} = require('danger');
const fetch = require('node-fetch');

const {
  resultsHeaders,
  generateResultsArray,
} = require('./scripts/rollup/stats');
const currentBuildResults = require('./scripts/rollup/results.json');

/**
 * Generates a Markdown table
 * @param {string[]} headers
 * @param {string[][]} body
 */
function generateMDTable(headers, body) {
  const tableHeaders = [
    headers.join(' | '),
    headers.map(() => ' --- ').join(' | '),
  ];

  const tablebody = body.map(r => r.join(' | '));
  return tableHeaders.join('\n') + '\n' + tablebody.join('\n');
}

// Grab the results.json before we ran CI via the GH API
fetch('http://react.zpao.com/builds/master/latest/results.json').then(
  async response => {
    const previousBuildResults = await response.json();
    const results = generateResultsArray(
      currentBuildResults,
      previousBuildResults
    );

    markdown('### Bundle Changes:\n');
    const percentToWarrentShowing = 1
    const onlyResultsToShow = results.filter(f => Math.abs(f[3]) > percentToWarrentShowing || Math.abs(f[7]));
    const groupBy

    markdown(generateMDTable(resultsHeaders, results));
  }
);
