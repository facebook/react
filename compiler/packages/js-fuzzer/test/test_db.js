// Copyright 2021 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Test the script building the DB.
 */

'use strict';

const assert = require('assert');
const { execSync } = require("child_process");
const fs = require('fs');
const path = require('path');
const tempy = require('tempy');

function buildDb(inputDir, corpusName, outputDir) {
  execSync(
      `node build_db.js -i ${inputDir} -o ${outputDir} ${corpusName}`,
      {stdio: ['pipe']});
}

describe('DB tests', () => {
    // Test feeds an expression that does not apply.
    it('omits erroneous expressions', () => {
    const outPath = tempy.directory();
    buildDb('test_data/db', 'this', outPath);
    const indexFile = path.join(outPath, 'index.json');
    const indexJSON = JSON.parse(fs.readFileSync(indexFile), 'utf-8');
    assert.deepEqual(
        indexJSON, {"statements": [], "superStatements": [], "all": []});
  });
});
