import fs = require('fs');
import fse = require('fs-extra');
import path = require('path');
import {wrapDiffingPlugin, DiffingBroccoliPlugin, DiffResult} from './diffing-broccoli-plugin';

class TSToDartTranspiler implements DiffingBroccoliPlugin {
  static includeExtensions = ['.ts'];

  private transpiler: any /*ts2dart.Transpiler*/;

  constructor(
      public inputPath: string, public cachePath: string,
      public options: any /*ts2dart.TranspilerOptions*/) {
    options.basePath = inputPath;
    options.tsconfig = path.join(inputPath, options.tsconfig);
    // Workaround for https://github.com/dart-lang/dart_style/issues/493
    var ts2dart = require('ts2dart');
    this.transpiler = new ts2dart.Transpiler(options);
  }

  rebuild(treeDiff: DiffResult) {
    let toEmit = [
      path.resolve(this.inputPath, 'angular2/manual_typings/globals.d.ts'),
      path.resolve(this.inputPath, 'angular2/typings/es6-promise/es6-promise.d.ts'),
      path.resolve(this.inputPath, 'angular2/typings/es6-collections/es6-collections.d.ts')
    ];
    let getDartFilePath = (path: string) => path.replace(/((\.js)|(\.ts))$/i, '.dart');
    treeDiff.addedPaths.concat(treeDiff.changedPaths).forEach((changedPath) => {
      let inputFilePath = path.resolve(this.inputPath, changedPath);

      // Ignore files which don't need to be transpiled to Dart
      let dartInputFilePath = getDartFilePath(inputFilePath);
      if (fs.existsSync(dartInputFilePath)) return;

      // Prepare to rebuild
      toEmit.push(path.resolve(this.inputPath, changedPath));
    });

    treeDiff.removedPaths.forEach((removedPath) => {
      let absolutePath = path.resolve(this.inputPath, removedPath);

      // Ignore files which don't need to be transpiled to Dart
      let dartInputFilePath = getDartFilePath(absolutePath);
      if (fs.existsSync(dartInputFilePath)) return;

      let dartOutputFilePath = getDartFilePath(removedPath);
      fs.unlinkSync(path.join(this.cachePath, dartOutputFilePath));
    });
    this.transpiler.transpile(toEmit, this.cachePath);
  }
}

export default wrapDiffingPlugin(TSToDartTranspiler);
