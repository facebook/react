// Copyright 2020 the V8 project authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @fileoverview Corpus
 */

const program = require('commander');
const fs = require('fs');
const path = require('path');

const exceptions = require('./exceptions.js');
const random = require('./random.js');
const sourceHelpers = require('./source_helpers.js');

function* walkDirectory(directory, filter) {
  // Generator for recursively walk a directory.
  for (const filePath of fs.readdirSync(directory)) {
    const currentPath = path.join(directory, filePath);
    const stat = fs.lstatSync(currentPath);
    if (stat.isFile()) {
      if (!filter || filter(currentPath)) {
        yield currentPath;
      }
      continue;
    }

    if (stat.isDirectory()) {
      for (let childFilePath of walkDirectory(currentPath, filter)) {
        yield childFilePath;
      }
    }
  }
}

class Corpus {
  // Input corpus.
  constructor(inputDir, corpusName, extraStrict=false) {
    this.inputDir = inputDir;
    this.extraStrict = extraStrict;

    // Filter for permitted JS files.
    function isPermittedJSFile(absPath) {
      return (absPath.endsWith('.js') &&
              !exceptions.isTestSkippedAbs(absPath));
    }

    // Cache relative paths of all files in corpus.
    this.skippedFiles = [];
    this.softSkippedFiles = [];
    this.permittedFiles = [];
    const directory = path.join(inputDir, corpusName);
    for (const absPath of walkDirectory(directory, isPermittedJSFile)) {
      const relPath = path.relative(this.inputDir, absPath);
      if (exceptions.isTestSkippedRel(relPath)) {
        this.skippedFiles.push(relPath);
      } else if (exceptions.isTestSoftSkippedAbs(absPath) ||
          exceptions.isTestSoftSkippedRel(relPath)) {
        this.softSkippedFiles.push(relPath);
      } else {
        this.permittedFiles.push(relPath);
      }
    }
    random.shuffle(this.softSkippedFiles);
    random.shuffle(this.permittedFiles);
  }

  // Relative paths of all files in corpus.
  *relFiles() {
    for (const relPath of this.permittedFiles) {
      yield relPath;
    }
    for (const relPath of this.softSkippedFiles) {
      yield relPath;
    }
  }

  // Relative paths of all files in corpus including generated skipped.
  *relFilesForGenSkipped() {
    for (const relPath of this.relFiles()) {
      yield relPath;
    }
    for (const relPath of this.skippedFiles) {
      yield relPath;
    }
  }

  /**
   * Returns "count" relative test paths, randomly selected from soft-skipped
   * and permitted files. Permitted files have a 4 times higher chance to
   * be chosen.
   */
  getRandomTestcasePaths(count) {
    return random.twoBucketSample(
        this.softSkippedFiles, this.permittedFiles, 4, count);
  }

  loadTestcase(relPath, strict, label) {
    const start = Date.now();
    try {
      const source = sourceHelpers.loadSource(this.inputDir, relPath, strict);
      if (program.verbose) {
        const duration = Date.now() - start;
        console.log(`Parsing ${relPath} ${label} took ${duration} ms.`);
      }
      return source;
    } catch (e) {
      console.log(`WARNING: failed to ${label} parse ${relPath}`);
      console.log(e);
    }
    return undefined;
  }

  *loadTestcases(relPaths) {
    for (const relPath of relPaths) {
      if (this.extraStrict) {
        // When re-generating the files marked sloppy, we additionally test if
        // the file parses in strict mode.
        this.loadTestcase(relPath, true, 'strict');
      }
      const source = this.loadTestcase(relPath, false, 'sloppy');
      if (source) {
        yield source;
      }
    }
  }

  getRandomTestcases(count) {
    return Array.from(this.loadTestcases(this.getRandomTestcasePaths(count)));
  }

  getAllTestcases() {
    return this.loadTestcases(this.relFilesForGenSkipped());
  }
}

module.exports = {
  Corpus: Corpus,
  walkDirectory: walkDirectory,
}
