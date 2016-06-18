import fs = require('fs');
import fse = require('fs-extra');
import path = require('path');
import {wrapDiffingPlugin, DiffingBroccoliPlugin, DiffResult} from './diffing-broccoli-plugin';

/**
 * Intercepts each file as it is copied to the destination tempdir,
 * and tees a copy to the given path outside the tmp dir.
 */
class DestCopy implements DiffingBroccoliPlugin {
  constructor(private inputPath: string, private cachePath: string, private outputRoot: string) {}


  rebuild(treeDiff: DiffResult) {
    treeDiff.addedPaths.concat(treeDiff.changedPaths).forEach((changedFilePath) => {
      var destFilePath = path.join(this.outputRoot, changedFilePath);

      var destDirPath = path.dirname(destFilePath);
      fse.mkdirsSync(destDirPath);
      fse.copySync(path.join(this.inputPath, changedFilePath), destFilePath);
    });

    treeDiff.removedPaths.forEach((removedFilePath) => {
      var destFilePath = path.join(this.outputRoot, removedFilePath);

      // TODO: what about obsolete directories? we are not cleaning those up yet
      fs.unlinkSync(destFilePath);
    });
  }
}

export default wrapDiffingPlugin(DestCopy);
