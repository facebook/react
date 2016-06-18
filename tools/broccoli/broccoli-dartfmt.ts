import fse = require('fs-extra');
import path = require('path');
import {wrapDiffingPlugin, DiffingBroccoliPlugin, DiffResult} from './diffing-broccoli-plugin';
import {AngularBuilderOptions} from './angular_builder';

var spawn = require('child_process').spawn;
var exec = require('child_process').exec;

function processToPromise(process: NodeJS.Process) {
  return new Promise(function(resolve, reject) {
    process.on('close', function(code: number) {
      if (code) {
        reject(code);
      } else {
        resolve();
      }
    });
  });
}

class DartFormatter implements DiffingBroccoliPlugin {
  private DARTFMT: string;
  private verbose: boolean;
  private firstBuild: boolean = true;

  constructor(public inputPath: string, public cachePath: string, options: AngularBuilderOptions) {
    if (!options.dartSDK) throw new Error('Missing Dart SDK');
    this.DARTFMT = options.dartSDK.DARTFMT;
    this.verbose = options.logs.dartfmt;
  }

  rebuild(treeDiff: DiffResult): Promise<any> {
    let args = ['-w'];
    let argsLength = 2;
    let argPackages: string[][] = [];
    let firstBuild = this.firstBuild;
    treeDiff.addedPaths.concat(treeDiff.changedPaths).forEach((changedFile) => {
      let sourcePath = path.join(this.inputPath, changedFile);
      let destPath = path.join(this.cachePath, changedFile);
      if (!firstBuild && /\.dart$/.test(changedFile)) {
        if ((argsLength + destPath.length + 2) >= 0x2000) {
          // Win32 command line arguments length
          argPackages.push(args);
          args = ['-w'];
          argsLength = 2;
        }
        args.push(destPath);
        argsLength += destPath.length + 2;
      }
      fse.copySync(sourcePath, destPath);
    });
    treeDiff.removedPaths.forEach((removedFile) => {
      let destPath = path.join(this.cachePath, removedFile);
      fse.removeSync(destPath);
    });

    if (!firstBuild && args.length > 1) {
      argPackages.push(args);
    }

    let execute = (args: string[]) => {
      if (args.length < 2) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        exec(this.DARTFMT + ' ' + args.join(' '), (err: Error, stdout: string, stderr: string) => {
          if (this.verbose) {
            console.log(stdout);
          }
          if (err) {
            console.error(shortenFormatterOutput(stderr));
            reject('Formatting failed.');
          } else {
            resolve();
          }
        });
      });
    };

    if (firstBuild) {
      // On firstBuild, format the entire cachePath
      this.firstBuild = false;
      return execute(['-w', this.cachePath]);
    }

    return Promise.all(argPackages.map(execute));
  }
}

export default wrapDiffingPlugin(DartFormatter);

var ARROW_LINE = /^(\s+)\^+/;
var BEFORE_CHARS = 15;
var stripAnsi = require('strip-ansi');
function shortenFormatterOutput(formatterOutput: string) {
  var lines = formatterOutput.split('\n');
  var match: string, line: string;
  for (var i = 0; i < lines.length; i += 1) {
    line = lines[i];
    if (match = stripAnsi(line).match(ARROW_LINE)) {
      let leadingWhitespace = match[1].length;
      let leadingCodeChars = Math.min(leadingWhitespace, BEFORE_CHARS);
      lines[i] = line.substr(leadingWhitespace - leadingCodeChars);
      lines[i - 1] = lines[i - 1].substr(leadingWhitespace - leadingCodeChars, 80) + '…';
    }
  }
  return lines.join('\n');
}
