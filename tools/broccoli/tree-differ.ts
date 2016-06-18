import fs = require('fs');
import path = require('path');


function tryStatSync(path: string) {
  try {
    return fs.statSync(path);
  } catch (e) {
    if (e.code === 'ENOENT') return null;
    throw e;
  }
}


export class TreeDiffer {
  private fingerprints: {[key: string]: string} = Object.create(null);
  private nextFingerprints: {[key: string]: string} = Object.create(null);
  private rootDirName: string;
  private include: RegExp = null;
  private exclude: RegExp = null;

  constructor(
      private label: string, private rootPath: string, includeExtensions?: string[],
      excludeExtensions?: string[]) {
    this.rootDirName = path.basename(rootPath);

    let buildRegexp = (arr: string[]) => new RegExp(`(${arr.reduce(combine, "")})$`, 'i');

    this.include = (includeExtensions || []).length ? buildRegexp(includeExtensions) : null;
    this.exclude = (excludeExtensions || []).length ? buildRegexp(excludeExtensions) : null;

    function combine(prev: string, curr: string) {
      if (curr.charAt(0) !== '.') {
        throw new Error(`Extension must begin with '.'. Was: '${curr}'`);
      }
      let kSpecialRegexpChars = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;
      curr = '(' + curr.replace(kSpecialRegexpChars, '\\$&') + ')';
      return prev ? (prev + '|' + curr) : curr;
    }
  }


  public diffTree(): DiffResult {
    let result = new DirtyCheckingDiffResult(this.label, this.rootDirName);
    this.dirtyCheckPath(this.rootPath, result);
    this.detectDeletionsAndUpdateFingerprints(result);
    result.endTime = Date.now();
    return result;
  }


  private dirtyCheckPath(rootDir: string, result: DirtyCheckingDiffResult) {
    fs.readdirSync(rootDir).forEach((segment) => {
      let absolutePath = path.join(rootDir, segment);
      let pathStat = fs.lstatSync(absolutePath);
      if (pathStat.isSymbolicLink()) {
        pathStat = tryStatSync(absolutePath);
        if (pathStat === null) return;
      }

      if (pathStat.isDirectory()) {
        result.directoriesChecked++;
        this.dirtyCheckPath(absolutePath, result);
      } else {
        if (!(this.include && !absolutePath.match(this.include)) &&
            !(this.exclude && absolutePath.match(this.exclude))) {
          result.filesChecked++;
          let relativeFilePath = path.relative(this.rootPath, absolutePath);

          switch (this.isFileDirty(absolutePath, pathStat)) {
            case FileStatus.Added:
              result.addedPaths.push(relativeFilePath);
              break;
            case FileStatus.Changed:
              result.changedPaths.push(relativeFilePath);
          }
        }
      }
    });

    return result;
  }


  private isFileDirty(path: string, stat: fs.Stats): FileStatus {
    let oldFingerprint = this.fingerprints[path];
    let newFingerprint = `${stat.mtime.getTime()} # ${stat.size}`;

    this.nextFingerprints[path] = newFingerprint;

    if (oldFingerprint) {
      this.fingerprints[path] = null;

      if (oldFingerprint === newFingerprint) {
        // nothing changed
        return FileStatus.Unchanged;
      }

      return FileStatus.Changed;
    }

    return FileStatus.Added;
  }


  private detectDeletionsAndUpdateFingerprints(result: DiffResult) {
    for (let absolutePath in this.fingerprints) {
      if (!(this.include && !absolutePath.match(this.include)) &&
          !(this.exclude && absolutePath.match(this.exclude))) {
        if (this.fingerprints[absolutePath] !== null) {
          let relativePath = path.relative(this.rootPath, absolutePath);
          result.removedPaths.push(relativePath);
        }
      }
    }

    this.fingerprints = this.nextFingerprints;
    this.nextFingerprints = Object.create(null);
  }
}


export class DiffResult {
  public addedPaths: string[] = [];
  public changedPaths: string[] = [];
  public removedPaths: string[] = [];

  constructor(public label: string = '') {}

  log(verbose: boolean): void {}

  toString(): string {
    // TODO(@caitp): more meaningful logging
    return '';
  }
}

class DirtyCheckingDiffResult extends DiffResult {
  public filesChecked: number = 0;
  public directoriesChecked: number = 0;
  public startTime: number = Date.now();
  public endTime: number = null;

  constructor(label: string, public directoryName: string) { super(label); }

  toString() {
    return `${pad(this.label, 30)}, ${pad(this.endTime - this.startTime, 5)}ms, ` +
        `${pad(this.addedPaths.length + this.changedPaths.length + this.removedPaths.length, 5)} changes ` +
        `(files: ${pad(this.filesChecked, 5)}, dirs: ${pad(this.directoriesChecked, 4)})`;
  }

  log(verbose: boolean) {
    let prefixedPaths = this.addedPaths.map(p => `+ ${p}`)
                            .concat(this.changedPaths.map(p => `* ${p}`))
                            .concat(this.removedPaths.map(p => `- ${p}`));
    console.log(
        `Tree diff: ${this}` +
        ((verbose && prefixedPaths.length) ? ` [\n  ${prefixedPaths.join('\n  ')}\n]` : ''));
  }
}


function pad(v: string | number, length: number) {
  let value = '' + v;
  let whitespaceLength = (value.length < length) ? length - value.length : 0;
  whitespaceLength = whitespaceLength + 1;
  return new Array(whitespaceLength).join(' ') + value;
}


enum FileStatus {
  Added,
  Unchanged,
  Changed
}
