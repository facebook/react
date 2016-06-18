/// <reference path="./broccoli-writer.d.ts" />

import Writer = require('broccoli-writer');
import fs = require('fs');
import fsx = require('fs-extra');
var minimatch = require('minimatch');
var path = require('path');
var glob = require('glob');

export interface MultiCopyOptions {
  /** The path of the file to copy. */
  srcPath: string;
  /** A list of glob patterns of folders to copy to, matched against the input tree. */
  targetPatterns: string[];
  /** List of glob patterns to *not* copy to, matched against the matches from `targetPatterns`. */
  exclude?: string[];
}

/**
 * A writer that copies an input file from an input path into (potentially many) output locations
 * given by glob patterns, .
 */
export class MultiCopy extends Writer {
  constructor(private inputTree: BroccoliTree, private options: MultiCopyOptions) { super(); }

  write(readTree: (tree: BroccoliTree) => Promise<string>, destDir: string): Promise<any> {
    return readTree(this.inputTree).then((inputPath: string) => {
      var fileName = path.basename(this.options.srcPath);
      var data = fs.readFileSync(path.join(inputPath, this.options.srcPath), 'utf-8');

      this.options.targetPatterns.forEach(pattern => {
        var paths: string[] = glob.sync(pattern);
        paths = paths.filter(p => fs.statSync(p).isDirectory());
        if (this.options.exclude) {
          paths = paths.filter(p => !this.options.exclude.some((excl) => minimatch(p, excl)));
        }
        paths.forEach(p => {
          var folder = path.join(destDir, p);
          fsx.mkdirsSync(folder);
          var outputPath = path.join(folder, fileName);
          fs.writeFileSync(outputPath, data);
        });
      });
    });
  }
}
