import fs = require('fs');
import fse = require('fs-extra');
import path = require('path');
var symlinkOrCopySync = require('symlink-or-copy').sync;
import {wrapDiffingPlugin, DiffingBroccoliPlugin, DiffResult} from './diffing-broccoli-plugin';

var isWindows = process.platform === 'win32';

export interface MergeTreesOptions { overwrite?: boolean; }

function outputFileSync(sourcePath: string, destPath: string) {
  let dirname = path.dirname(destPath);
  fse.mkdirsSync(dirname, {fs: fs});
  symlinkOrCopySync(sourcePath, destPath);
}

function pathOverwrittenError(path: string) {
  const msg = 'Either remove the duplicate or enable the "overwrite" option for this merge.';
  return new Error(`Duplicate path found while merging trees. Path: "${path}".\n${msg}`);
}

export class MergeTrees implements DiffingBroccoliPlugin {
  private pathCache: {[key: string]: number[]} = Object.create(null);
  public options: MergeTreesOptions;
  private firstBuild: boolean = true;

  constructor(
      public inputPaths: string[], public cachePath: string, options: MergeTreesOptions = {}) {
    this.options = options || {};
  }

  rebuild(treeDiffs: DiffResult[]) {
    let overwrite = this.options.overwrite;
    let pathsToEmit: string[] = [];
    let pathsToRemove: string[] = [];
    let emitted: {[key: string]: boolean} = Object.create(null);
    let contains = (cache: number[], val: number) => {
      for (let i = 0, ii = cache.length; i < ii; ++i) {
        if (cache[i] === val) return true;
      }
      return false;
    };

    let emit = (relativePath: string) => {
      // ASSERT(!emitted[relativePath]);
      pathsToEmit.push(relativePath);
      emitted[relativePath] = true;
    };

    if (this.firstBuild) {
      this.firstBuild = false;

      // Build initial cache
      treeDiffs.reverse().forEach((treeDiff: DiffResult, index: number) => {
        index = treeDiffs.length - 1 - index;
        treeDiff.addedPaths.forEach((changedPath) => {
          let cache = this.pathCache[changedPath];
          if (cache === undefined) {
            this.pathCache[changedPath] = [index];
            pathsToEmit.push(changedPath);
          } else if (overwrite) {
            // ASSERT(contains(pathsToEmit, changedPath));
            cache.unshift(index);
          } else {
            throw pathOverwrittenError(changedPath);
          }
        });
      });

    } else {
      // Update cache
      treeDiffs.reverse().forEach((treeDiff: DiffResult, index: number) => {
        index = treeDiffs.length - 1 - index;
        if (treeDiff.removedPaths) {
          treeDiff.removedPaths.forEach((removedPath) => {
            let cache = this.pathCache[removedPath];
            // ASSERT(cache !== undefined);
            // ASSERT(contains(cache, index));
            if (cache[cache.length - 1] === index) {
              pathsToRemove.push(path.join(this.cachePath, removedPath));
              cache.pop();
              if (cache.length === 0) {
                this.pathCache[removedPath] = undefined;
              } else if (!emitted[removedPath]) {
                if (cache.length === 1 && !overwrite) {
                  throw pathOverwrittenError(removedPath);
                }
                emit(removedPath);
              }
            }
          });
        }

        let pathsToUpdate = treeDiff.addedPaths;

        if (isWindows) {
          pathsToUpdate = pathsToUpdate.concat(treeDiff.changedPaths);
        }

        pathsToUpdate.forEach((changedPath) => {
          let cache = this.pathCache[changedPath];
          if (cache === undefined) {
            // File was added
            this.pathCache[changedPath] = [index];
            emit(changedPath);
          } else if (!contains(cache, index)) {
            cache.push(index);
            cache.sort((a, b) => a - b);
            if (cache.length > 1 && !overwrite) {
              throw pathOverwrittenError(changedPath);
            }
            if (cache[cache.length - 1] === index && !emitted[changedPath]) {
              emit(changedPath);
            }
          }
        });
      });
    }

    pathsToRemove.forEach((destPath) => fse.removeSync(destPath));
    pathsToEmit.forEach((emittedPath) => {
      let cache = this.pathCache[emittedPath];
      let destPath = path.join(this.cachePath, emittedPath);
      let sourceIndex = cache[cache.length - 1];
      let sourceInputPath = this.inputPaths[sourceIndex];
      let sourcePath = path.join(sourceInputPath, emittedPath);
      if (cache.length > 1) {
        fse.removeSync(destPath);
      }
      outputFileSync(sourcePath, destPath);
    });
  }
}

export default wrapDiffingPlugin(MergeTrees);
