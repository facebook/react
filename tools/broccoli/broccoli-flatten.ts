import fs = require('fs');
import fse = require('fs-extra');
import path = require('path');
import {wrapDiffingPlugin, DiffingBroccoliPlugin, DiffResult} from './diffing-broccoli-plugin';
import {AngularBuilderOptions} from './angular_builder';

var symlinkOrCopy = require('symlink-or-copy').sync;

var isWindows = process.platform === 'win32';


/**
 * Intercepts each changed file and replaces its contents with
 * the associated changes.
 */
export class DiffingFlatten implements DiffingBroccoliPlugin {
  constructor(
      private inputPath: string, private cachePath: string,
      private options: AngularBuilderOptions) {}


  rebuild(treeDiff: DiffResult) {
    let pathsToUpdate = treeDiff.addedPaths;

    // since we need to run on Windows as well we can't rely on symlinks being available,
    // which means that we need to respond to both added and changed paths
    if (isWindows) {
      pathsToUpdate = pathsToUpdate.concat(treeDiff.changedPaths);
    }

    pathsToUpdate.forEach((changedFilePath) => {
      var sourceFilePath = path.join(this.inputPath, changedFilePath);
      var destFilePath = path.join(this.cachePath, path.basename(changedFilePath));
      var destDirPath = path.dirname(destFilePath);

      if (!fs.existsSync(destDirPath)) {
        fse.mkdirpSync(destDirPath);
      }

      if (!fs.existsSync(destFilePath)) {
        symlinkOrCopy(sourceFilePath, destFilePath);
      } else {
        throw new Error(
            `Duplicate file '${path.basename(changedFilePath)}' ` +
            `found in path '${changedFilePath}'`);
      }
    });

    treeDiff.removedPaths.forEach((removedFilePath) => {
      var destFilePath = path.join(this.cachePath, path.basename(removedFilePath));
      fs.unlinkSync(destFilePath);
    });
  }
}

export default wrapDiffingPlugin(DiffingFlatten);
