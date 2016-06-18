import fs = require('fs');
import fse = require('fs-extra');
import path = require('path');
import {wrapDiffingPlugin, DiffingBroccoliPlugin, DiffResult} from './diffing-broccoli-plugin';

/**
 * Checks that modules do not import files that are not supposed to import.
 *
 * This guarantees that platform-independent modules remain platoform-independent.
 */
class CheckImports implements DiffingBroccoliPlugin {
  static IMPORT_DECL_REGEXP = new RegExp(`^import[^;]+;`, 'mg');
  static IMPORT_PATH_REGEXP = new RegExp(`['"]([^'"]+)+['"]`, 'm');

  static ALLOWED_IMPORTS: {[s: string]: string[]} = {
    'angular2/src/core': ['angular2/src/facade'],
    'angular2/src/facade': ['rxjs'],
    'angular2/src/common': ['angular2/core', 'angular2/src/facade'],
    'angular2/src/http': ['angular2/core', 'angular2/src/facade', 'rxjs'],
    'angular2/src/upgrade':
        ['angular2/core', 'angular2/src/facade', 'angular2/platform/browser', 'angular2/compiler']
    //"angular2/src/render": [
    //  "angular2/animate",
    //  "angular2/core",
    //  "angular2/src/facade",
    //]
  };

  private initRun = true;

  constructor(private inputPath: string, private cachePath: string, private options: number) {}

  rebuild(treeDiff: DiffResult) {
    const errors = this.checkAllPaths(treeDiff);
    if (errors.length > 0) {
      throw new Error(
          `The following imports are not allowed because they break barrel boundaries:\n${errors.join("\n")}`);
    }
    this.symlinkInputAndCacheIfNeeded();
    return treeDiff;
  }

  private checkAllPaths(treeDiff: DiffResult) {
    const changesFiles = treeDiff.addedPaths.concat(treeDiff.changedPaths);
    return flatMap(changesFiles, _ => this.checkFilePath(_));
  }

  private symlinkInputAndCacheIfNeeded() {
    if (this.initRun) {
      fs.rmdirSync(this.cachePath);
      fs.symlinkSync(this.inputPath, this.cachePath);
    }
    this.initRun = false;
  }

  private checkFilePath(filePath: string) {
    const sourceFilePath = path.join(this.inputPath, filePath);
    if (endsWith(sourceFilePath, '.ts') && fs.existsSync(sourceFilePath)) {
      const content = fs.readFileSync(sourceFilePath, 'UTF-8');
      const imports = content.match(CheckImports.IMPORT_DECL_REGEXP);
      if (imports) {
        return imports.filter(i => !this.isAllowedImport(filePath, i))
            .map(i => this.formatError(filePath, i));
      } else {
        return [];
      }
    }
    return [];
  }

  private isAllowedImport(sourceFile: string, importDecl: string): boolean {
    const res = CheckImports.IMPORT_PATH_REGEXP.exec(importDecl);
    if (!res || res.length < 2) return true;  // non-es6 import
    const importPath = res[1];

    if (startsWith(importPath, './') || startsWith(importPath, '../')) return true;

    const c = CheckImports.ALLOWED_IMPORTS;
    for (var prop in c) {
      if (c.hasOwnProperty(prop) && startsWith(sourceFile, prop)) {
        const allowedPaths = c[prop];
        return startsWith(importPath, prop) ||
            allowedPaths.filter(p => startsWith(importPath, p)).length > 0;
      }
    }

    return true;
  }

  private formatError(filePath: string, importPath: string): string {
    const i = importPath.replace(new RegExp(`\n`, 'g'), '\\n');
    return `${filePath}: ${i}`;
  }
}


function startsWith(str: string, substring: string): boolean {
  return str.substring(0, substring.length) === substring;
}

function endsWith(str: string, substring: string): boolean {
  return str.indexOf(substring, str.length - substring.length) !== -1;
}

function flatMap<T, U>(arr: T[], fn: (t: T) => U[]): U[] {
  return [].concat(...arr.map(fn));
}

export default wrapDiffingPlugin(CheckImports);
