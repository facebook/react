import fs = require('fs');
import fse = require('fs-extra');
import path = require('path');
import * as ts from 'typescript';
import {wrapDiffingPlugin, DiffingBroccoliPlugin, DiffResult} from './diffing-broccoli-plugin';
import {MetadataCollector} from '../@angular/tsc-wrapped';

type FileRegistry = ts.Map<{version: number}>;

const FS_OPTS = {
  encoding: 'utf-8'
};

// Sub-directory where the @internal typing files (.d.ts) are stored
export const INTERNAL_TYPINGS_PATH: string = 'internal_typings';

// Monkey patch the TS compiler to be able to re-emit files with @internal symbols
let tsEmitInternal: boolean = false;

const originalEmitFiles: Function = (<any>ts).emitFiles;

(<any>ts).emitFiles = function(resolver: any, host: any, targetSourceFile: any): any {
  if (tsEmitInternal) {
    const orignalgetCompilerOptions = host.getCompilerOptions;
    host.getCompilerOptions = () => {
      let options = clone(orignalgetCompilerOptions.call(host));
      options.stripInternal = false;
      options.outDir = `${options.outDir}/${INTERNAL_TYPINGS_PATH}`;
      return options;
    }
  }
  return originalEmitFiles(resolver, host, targetSourceFile);
};

/**
 * Broccoli plugin that implements incremental Typescript compiler.
 *
 * It instantiates a typescript compiler instance that keeps all the state about the project and
 * can re-emit only the files that actually changed.
 *
 * Limitations: only files that map directly to the changed source file via naming conventions are
 * re-emitted. This primarily affects code that uses `const enum`s, because changing the enum value
 * requires global emit, which can affect many files.
 */
class DiffingTSCompiler implements DiffingBroccoliPlugin {
  private tsOpts: ts.CompilerOptions;
  private fileRegistry: FileRegistry = Object.create(null);
  private rootFilePaths: string[];
  private tsServiceHost: ts.LanguageServiceHost;
  private tsService: ts.LanguageService;
  private metadataCollector: MetadataCollector;
  private firstRun: boolean = true;
  private previousRunFailed: boolean = false;
  // Whether to generate the @internal typing files (they are only generated when `stripInternal` is
  // true)
  private genInternalTypings: boolean = false;

  static includeExtensions = ['.ts'];

  constructor(public inputPath: string, public cachePath: string, public options: any) {
    // TODO: define an interface for options
    if (options.rootFilePaths) {
      this.rootFilePaths = options.rootFilePaths.splice(0);
      delete options.rootFilePaths;
    } else {
      this.rootFilePaths = [];
    }

    if (options.internalTypings) {
      this.genInternalTypings = true;
      delete options.internalTypings;
    }

    // the conversion is a bit awkward, see https://github.com/Microsoft/TypeScript/issues/5276
    // in 1.8 use convertCompilerOptionsFromJson
    this.tsOpts =
        ts.parseJsonConfigFileContent({compilerOptions: options, files: []}, null, null).options;

    if ((<any>this.tsOpts).stripInternal === false) {
      // @internal are included in the generated .d.ts, do not generate them separately
      this.genInternalTypings = false;
    }

    this.tsOpts.rootDir = inputPath;
    this.tsOpts.baseUrl = inputPath;
    this.tsOpts.outDir = this.cachePath;

    this.tsServiceHost = new CustomLanguageServiceHost(
        this.tsOpts, this.rootFilePaths, this.fileRegistry, this.inputPath);
    this.tsService = ts.createLanguageService(this.tsServiceHost, ts.createDocumentRegistry());
    this.metadataCollector = new MetadataCollector();
  }


  rebuild(treeDiff: DiffResult) {
    let pathsToEmit: string[] = [];
    let pathsWithErrors: string[] = [];
    let errorMessages: string[] = [];

    treeDiff.addedPaths.concat(treeDiff.changedPaths).forEach((tsFilePath) => {
      if (!this.fileRegistry[tsFilePath]) {
        this.fileRegistry[tsFilePath] = {version: 0};
        this.rootFilePaths.push(tsFilePath);
      } else {
        this.fileRegistry[tsFilePath].version++;
      }

      pathsToEmit.push(path.join(this.inputPath, tsFilePath));
    });

    treeDiff.removedPaths.forEach((tsFilePath) => {
      console.log('removing outputs for', tsFilePath);

      this.rootFilePaths.splice(this.rootFilePaths.indexOf(tsFilePath), 1);
      this.fileRegistry[tsFilePath] = null;
      this.removeOutputFor(tsFilePath);
    });

    if (this.firstRun) {
      this.firstRun = false;
      this.doFullBuild();
    } else {
      let program = this.tsService.getProgram();
      tsEmitInternal = false;
      pathsToEmit.forEach((tsFilePath) => {
        let output = this.tsService.getEmitOutput(tsFilePath);

        if (output.emitSkipped) {
          let errorFound = this.collectErrors(tsFilePath);
          if (errorFound) {
            pathsWithErrors.push(tsFilePath);
            errorMessages.push(errorFound);
          }
        } else {
          output.outputFiles.forEach(o => {
            let destDirPath = path.dirname(o.name);
            fse.mkdirsSync(destDirPath);
            fs.writeFileSync(o.name, this.fixSourceMapSources(o.text), FS_OPTS);
            if (endsWith(o.name, '.d.ts')) {
              const sourceFile = program.getSourceFile(tsFilePath);
              this.emitMetadata(o.name, sourceFile);
            }
          });
        }
      });

      if (pathsWithErrors.length) {
        this.previousRunFailed = true;
        var error =
            new Error('Typescript found the following errors:\n' + errorMessages.join('\n'));
        (<any>error)['showStack'] = false;
        throw error;
      } else if (this.previousRunFailed) {
        this.doFullBuild();
      } else if (this.genInternalTypings) {
        // serialize the .d.ts files containing @internal symbols
        tsEmitInternal = true;
        pathsToEmit.forEach((tsFilePath) => {
          let output = this.tsService.getEmitOutput(tsFilePath);
          if (!output.emitSkipped) {
            output.outputFiles.forEach(o => {
              if (endsWith(o.name, '.d.ts')) {
                let destDirPath = path.dirname(o.name);
                fse.mkdirsSync(destDirPath);
                fs.writeFileSync(o.name, this.fixSourceMapSources(o.text), FS_OPTS);
              }
            });
          }
        });
        tsEmitInternal = false;
      }
    }
  }

  private collectErrors(tsFilePath: string): string {
    let allDiagnostics = this.tsService.getCompilerOptionsDiagnostics()
                             .concat(this.tsService.getSyntacticDiagnostics(tsFilePath))
                             .concat(this.tsService.getSemanticDiagnostics(tsFilePath));
    let errors: string[] = [];

    allDiagnostics.forEach(diagnostic => {
      let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      if (diagnostic.file) {
        let {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
        errors.push(`  ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
      } else {
        errors.push(`  Error: ${message}`);
      }
    });

    if (errors.length) {
      return errors.join('\n');
    }
  }

  private doFullBuild() {
    let program = this.tsService.getProgram();
    let typeChecker = program.getTypeChecker();
    let diagnostics: ts.Diagnostic[] = [];
    tsEmitInternal = false;

    let emitResult = program.emit(undefined, (absoluteFilePath, fileContent) => {
      fse.mkdirsSync(path.dirname(absoluteFilePath));
      fs.writeFileSync(absoluteFilePath, this.fixSourceMapSources(fileContent), FS_OPTS);
      if (endsWith(absoluteFilePath, '.d.ts')) {
        // TODO: Use sourceFile from the callback if
        //   https://github.com/Microsoft/TypeScript/issues/7438
        // is taken
        const originalFile = absoluteFilePath.replace(this.tsOpts.outDir, this.tsOpts.rootDir)
                                 .replace(/\.d\.ts$/, '.ts');
        const sourceFile = program.getSourceFile(originalFile);
        this.emitMetadata(absoluteFilePath, sourceFile);
      }
    });

    if (this.genInternalTypings) {
      // serialize the .d.ts files containing @internal symbols
      tsEmitInternal = true;
      program.emit(undefined, (absoluteFilePath, fileContent) => {
        if (endsWith(absoluteFilePath, '.d.ts')) {
          fse.mkdirsSync(path.dirname(absoluteFilePath));
          fs.writeFileSync(absoluteFilePath, fileContent, FS_OPTS);
        }
      });
      tsEmitInternal = false;
    }

    if (emitResult.emitSkipped) {
      let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
      let errorMessages: string[] = [];

      allDiagnostics.forEach(diagnostic => {
        var pos = '';
        if (diagnostic.file) {
          var {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
          pos = `${diagnostic.file.fileName} (${line + 1}, ${character + 1}): `
        }
        var message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
        errorMessages.push(`  ${pos}${message}`);
      });

      if (errorMessages.length) {
        this.previousRunFailed = true;
        var error =
            new Error('Typescript found the following errors:\n' + errorMessages.join('\n'));
        (<any>error)['showStack'] = false;
        throw error;
      } else {
        this.previousRunFailed = false;
      }
    }
  }

  /**
   * Emit a .metadata.json file to correspond to the .d.ts file if the module contains classes that
   * use decorators or exported constants.
   */
  private emitMetadata(dtsFileName: string, sourceFile: ts.SourceFile) {
    if (sourceFile) {
      const metadata = this.metadataCollector.getMetadata(sourceFile);
      if (metadata && metadata.metadata) {
        const metadataText = JSON.stringify(metadata);
        const metadataFileName = dtsFileName.replace(/\.d.ts$/, '.metadata.json');
        fs.writeFileSync(metadataFileName, metadataText, FS_OPTS);
      }
    }
  }

  /**
   * There is a bug in TypeScript 1.6, where the sourceRoot and inlineSourceMap properties
   * are exclusive. This means that the sources property always contains relative paths
   * (e.g, ../../../../angular2/src/di/injector.ts).
   *
   * Here, we normalize the sources property and remove the ../../../
   *
   * This issue is fixed in https://github.com/Microsoft/TypeScript/pull/5620.
   * Once we switch to TypeScript 1.8, we can remove this method.
   */
  private fixSourceMapSources(content: string): string {
    try {
      const marker = '//# sourceMappingURL=data:application/json;base64,';
      const index = content.indexOf(marker);
      if (index == -1) return content;

      const base = content.substring(0, index + marker.length);
      const sourceMapBit =
          new Buffer(content.substring(index + marker.length), 'base64').toString('utf8');
      const sourceMaps = JSON.parse(sourceMapBit);
      const source = sourceMaps.sources[0];
      sourceMaps.sources = [source.substring(source.lastIndexOf('../') + 3)];
      return `${base}${new Buffer(JSON.stringify(sourceMaps)).toString('base64')}`;
    } catch (e) {
      return content;
    }
  }

  private removeOutputFor(tsFilePath: string) {
    let absoluteJsFilePath = path.join(this.cachePath, tsFilePath.replace(/\.ts$/, '.js'));
    let absoluteMapFilePath = path.join(this.cachePath, tsFilePath.replace(/.ts$/, '.js.map'));
    let absoluteDtsFilePath = path.join(this.cachePath, tsFilePath.replace(/\.ts$/, '.d.ts'));

    if (fs.existsSync(absoluteJsFilePath)) {
      fs.unlinkSync(absoluteJsFilePath);
      if (fs.existsSync(absoluteMapFilePath)) {
        // source map could be inline or not generated
        fs.unlinkSync(absoluteMapFilePath);
      }
      fs.unlinkSync(absoluteDtsFilePath);
    }
  }
}


class CustomLanguageServiceHost implements ts.LanguageServiceHost {
  private currentDirectory: string;
  private defaultLibFilePath: string;


  constructor(
      private compilerOptions: ts.CompilerOptions, private fileNames: string[],
      private fileRegistry: FileRegistry, private treeInputPath: string) {
    this.currentDirectory = process.cwd();
    this.defaultLibFilePath = ts.getDefaultLibFilePath(compilerOptions).replace(/\\/g, '/');
  }


  getScriptFileNames(): string[] {
    return this.fileNames.map(f => path.join(this.treeInputPath, f));
  }


  getScriptVersion(fileName: string): string {
    if (startsWith(fileName, this.treeInputPath)) {
      const key = fileName.substr(this.treeInputPath.length + 1);
      return this.fileRegistry[key] && this.fileRegistry[key].version.toString();
    }
  }


  getScriptSnapshot(tsFilePath: string): ts.IScriptSnapshot {
    // TypeScript seems to request lots of bogus paths during import path lookup and resolution,
    // so we we just return undefined when the path is not correct.

    // Ensure it is in the input tree or a lib.d.ts file.
    if (!startsWith(tsFilePath, this.treeInputPath) && !tsFilePath.match(/\/lib(\..*)*.d\.ts$/)) {
      if (fs.existsSync(tsFilePath)) {
        console.log('Rejecting', tsFilePath, '. File is not in the input tree.');
      }
      return undefined;
    }

    // Ensure it exists
    if (!fs.existsSync(tsFilePath)) {
      return undefined;
    }

    return ts.ScriptSnapshot.fromString(fs.readFileSync(tsFilePath, FS_OPTS));
  }


  getCurrentDirectory(): string { return this.currentDirectory; }

  getCompilationSettings(): ts.CompilerOptions { return this.compilerOptions; }

  getDefaultLibFileName(options: ts.CompilerOptions): string {
    // ignore options argument, options should not change during the lifetime of the plugin
    return this.defaultLibFilePath;
  }
}

export default wrapDiffingPlugin(DiffingTSCompiler);

function clone<T>(object: T): T {
  const result: any = {};
  for (const id in object) {
    result[id] = (<any>object)[id];
  }
  return <T>result;
}

function startsWith(str: string, substring: string): boolean {
  return str.substring(0, substring.length) === substring;
}

function endsWith(str: string, substring: string): boolean {
  return str.indexOf(substring, str.length - substring.length) !== -1;
}
