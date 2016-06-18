import * as path from 'path';
import * as ts from 'typescript';

import AngularCompilerOptions from './options';
import {TsickleHost} from './compiler_host';

/**
 * Our interface to the TypeScript standard compiler.
 * If you write an Angular compiler plugin for another build tool,
 * you should implement a similar interface.
 */
export interface CompilerInterface {
  readConfiguration(project: string, basePath: string):
      {parsed: ts.ParsedCommandLine, ngOptions: AngularCompilerOptions};
  typeCheck(compilerHost: ts.CompilerHost, program: ts.Program): void;
  emit(compilerHost: ts.CompilerHost, program: ts.Program): number;
}

const DEBUG = false;

function debug(msg: string, ...o: any[]) {
  if (DEBUG) console.log(msg, ...o);
}

export function formatDiagnostics(diags: ts.Diagnostic[]): string {
  return diags
      .map((d) => {
        let res = ts.DiagnosticCategory[d.category];
        if (d.file) {
          res += ' at ' + d.file.fileName + ':';
          const {line, character} = d.file.getLineAndCharacterOfPosition(d.start);
          res += (line + 1) + ':' + (character + 1) + ':';
        }
        res += ' ' + ts.flattenDiagnosticMessageText(d.messageText, '\n');
        return res;
      })
      .join('\n');
}

export function check(diags: ts.Diagnostic[]) {
  if (diags && diags.length && diags[0]) {
    throw new Error(formatDiagnostics(diags));
  }
}

export class Tsc implements CompilerInterface {
  public ngOptions: AngularCompilerOptions;
  public parsed: ts.ParsedCommandLine;
  private basePath: string;

  constructor(private readFile = ts.sys.readFile, private readDirectory = ts.sys.readDirectory) {}

  readConfiguration(project: string, basePath: string) {
    this.basePath = basePath;

    // Allow a directory containing tsconfig.json as the project value
    try {
      this.readDirectory(project);
      project = path.join(project, 'tsconfig.json');
    } catch (e) {
      // Was not a directory, continue on assuming it's a file
    }

    const {config, error} = ts.readConfigFile(project, this.readFile);
    check([error]);

    this.parsed =
        ts.parseJsonConfigFileContent(config, {readDirectory: this.readDirectory}, basePath);

    check(this.parsed.errors);

    // Default codegen goes to the current directory
    // Parsed options are already converted to absolute paths
    this.ngOptions = config.angularCompilerOptions || {};
    this.ngOptions.genDir = path.join(basePath, this.ngOptions.genDir || '.');
    for (const key of Object.keys(this.parsed.options)) {
      this.ngOptions[key] = this.parsed.options[key];
    }
    return {parsed: this.parsed, ngOptions: this.ngOptions};
  }

  typeCheck(compilerHost: ts.CompilerHost, program: ts.Program): void {
    debug('Checking global diagnostics...');
    check(program.getGlobalDiagnostics());

    let diagnostics: ts.Diagnostic[] = [];
    debug('Type checking...');

    for (let sf of program.getSourceFiles()) {
      diagnostics.push(...ts.getPreEmitDiagnostics(program, sf));
    }
    check(diagnostics);
  }

  emit(compilerHost: TsickleHost, oldProgram: ts.Program): number {
    // Create a new program since the host may be different from the old program.
    const program = ts.createProgram(this.parsed.fileNames, this.parsed.options, compilerHost);
    debug('Emitting outputs...');
    const emitResult = program.emit();
    let diagnostics: ts.Diagnostic[] = [];
    diagnostics.push(...emitResult.diagnostics);

    check(compilerHost.diagnostics);
    return emitResult.emitSkipped ? 1 : 0;
  }
}
export var tsc: CompilerInterface = new Tsc();
