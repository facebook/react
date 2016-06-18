import fs = require('fs');
import fse = require('fs-extra');
import path = require('path');
var _ = require('lodash');
import {wrapDiffingPlugin, DiffingBroccoliPlugin, DiffResult} from './diffing-broccoli-plugin';

export interface LodashRendererOptions {
  encoding?: string;
  context?: any;
  // files option unsupported --- use Funnel on inputTree instead.
  files?: string[];
}

const kDefaultOptions: LodashRendererOptions = {
  encoding: 'utf-8',
  context: {},
  files: []
};


/**
 * Intercepts each changed file and replaces its contents with
 * the associated changes.
 */
export class LodashRenderer implements DiffingBroccoliPlugin {
  constructor(
      private inputPath: string, private cachePath: string,
      private options: LodashRendererOptions = kDefaultOptions) {}

  rebuild(treeDiff: DiffResult) {
    let {encoding = 'utf-8', context = {}} = this.options;
    let processFile = (relativePath: string) => {
      let sourceFilePath = path.join(this.inputPath, relativePath);
      let destFilePath = path.join(this.cachePath, relativePath);
      let content = fs.readFileSync(sourceFilePath, {encoding});
      let transformedContent = _.template(content)(context);
      fse.outputFileSync(destFilePath, transformedContent);
    };

    let removeFile = (relativePath: string) => {
      let destFilePath = path.join(this.cachePath, relativePath);
      fs.unlinkSync(destFilePath);
    };

    treeDiff.addedPaths.concat(treeDiff.changedPaths).forEach(processFile);
    treeDiff.removedPaths.forEach(removeFile);
  }
}

export default wrapDiffingPlugin(LodashRenderer);
