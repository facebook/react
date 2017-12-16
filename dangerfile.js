/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

const { danger, markdown, schedule } = require('danger');

const { resultsHeaders, generateResultsArray, currentBuildResults } = require('./scripts/rollup/stats');

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
const getJSON = danger.github.utils
  .fileContents('scripts/rollup/results.json');

// @bug See https://github.com/danger/danger-js/issues/443
schedule(getJSON);
getJSON.then(APIPreviousBuildResults => {
  const previousBuildResults = JSON.parse(APIPreviousBuildResults);
  const results = generateResultsArray(currentBuildResults, previousBuildResults);

  markdown('### Bundle Changes:\n');
  // const percentToWarrentShowing = 0.1
  // const onlyResultsToShow = results.filter(f => Math.abs(f[3]) > percentToWarrentShowing);

  markdown(generateMDTable(resultsHeaders, results));
});
