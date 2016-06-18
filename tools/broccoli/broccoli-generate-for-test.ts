import fs = require('fs');
import fse = require('fs-extra');
import path = require('path');
import childProcess = require('child_process');
var glob = require('glob');

import {wrapDiffingPlugin, DiffingBroccoliPlugin, DiffResult} from './diffing-broccoli-plugin';

/**
 * Intercepts each changed file and replaces its contents with
 * the output of the generator.
 */
class GeneratorForTest implements DiffingBroccoliPlugin {
  private seenFiles: {[key: string]: boolean} = {};

  constructor(private inputPath: string, private outputPath: string, private options: {
    files: string[],
    dartPath: string
  }) {}

  rebuild(treeDiff: DiffResult) {
    var matchedFiles: string[] = [];
    this.options.files.forEach(
        (file) => { matchedFiles = matchedFiles.concat(glob.sync(file, {cwd: this.inputPath})); });
    return Promise
        .all(matchedFiles.map((matchedFile) => {
          var inputFilePath = path.join(this.inputPath, matchedFile);
          var outputFilePath = path.join(this.outputPath, matchedFile);

          var outputDirPath = path.dirname(outputFilePath);
          if (!fs.existsSync(outputDirPath)) {
            fse.mkdirpSync(outputDirPath);
          }
          return this.invokeGenerator(matchedFile, inputFilePath, outputFilePath)
        }))
        .then(() => {
          var result = new DiffResult();
          matchedFiles.forEach((file) => {
            if (!this.seenFiles[file]) {
              result.addedPaths.push(file);
              this.seenFiles[file] = true;
            } else {
              result.changedPaths.push(file);
            }
          });
          return result;
        });
  }

  private invokeGenerator(file: string, inputFilePath: string, outputFilePath: string):
      Promise<any> {
    return new Promise((resolve, reject) => {
      var args: string[];
      var vmPath: string;
      var env: {[key: string]: string};
      if (this.options.dartPath) {
        vmPath = this.options.dartPath;
        args = [`--package-root=${this.inputPath}`, '--checked', inputFilePath, file];
        env = {};
      } else {
        vmPath = process.execPath;
        var script = `require('reflect-metadata');require('${inputFilePath}').main(['${file}']);`;
        args = ['-e', script];
        env = {'NODE_PATH': this.inputPath};
      }

      var stdoutStream = fs.createWriteStream(outputFilePath);
      var proc = childProcess.spawn(vmPath, args, {
        stdio: ['ignore', 'pipe', 'inherit'],
        env: (<any>Object)['assign']({}, process.env, env)
      });
      proc.on('error', function(code: any) {
        console.error(code);
        reject(new Error(
            'Failed while generating code. Please run manually: ' + vmPath + ' ' + args.join(' ')));
      });
      proc.on('close', function() {
        stdoutStream.close();
        resolve();
      });
      proc.stdout.pipe(stdoutStream);
    });
  }
}

export default wrapDiffingPlugin(GeneratorForTest);
