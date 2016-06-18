import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

import {check, tsc} from './tsc';

import NgOptions from './options';
import {MetadataWriterHost, TsickleHost} from './compiler_host';

export type CodegenExtension = (ngOptions: NgOptions, program: ts.Program, host: ts.CompilerHost) =>
    Promise<void>;

export function main(project: string, basePath?: string, codegen?: CodegenExtension): Promise<any> {
  try {
    let projectDir = project;
    if (fs.lstatSync(project).isFile()) {
      projectDir = path.dirname(project);
    }
    // file names in tsconfig are resolved relative to this absolute path
    basePath = path.join(process.cwd(), basePath || projectDir);

    // read the configuration options from wherever you store them
    const {parsed, ngOptions} = tsc.readConfiguration(project, basePath);
    ngOptions.basePath = basePath;

    const host = ts.createCompilerHost(parsed.options, true);
    const program = ts.createProgram(parsed.fileNames, parsed.options, host);
    const errors = program.getOptionsDiagnostics();
    check(errors);

    if (ngOptions.skipTemplateCodegen || !codegen) {
      codegen = () => Promise.resolve(null);
    }
    return codegen(ngOptions, program, host).then(() => {
      // Create a new program since codegen files were created after making the old program
      const newProgram = ts.createProgram(parsed.fileNames, parsed.options, host, program);
      tsc.typeCheck(host, newProgram);

      // Emit *.js with Decorators lowered to Annotations, and also *.js.map
      const tsicklePreProcessor = new TsickleHost(host, newProgram);
      tsc.emit(tsicklePreProcessor, newProgram);

      if (!ngOptions.skipMetadataEmit) {
        // Emit *.metadata.json and *.d.ts
        // Not in the same emit pass with above, because tsickle erases
        // decorators which we want to read or document.
        // Do this emit second since TypeScript will create missing directories for us
        // in the standard emit.
        const metadataWriter = new MetadataWriterHost(host, newProgram);
        tsc.emit(metadataWriter, newProgram);
      }
    });
  } catch (e) {
    return Promise.reject(e);
  }
}

// CLI entry point
if (require.main === module) {
  const args = require('minimist')(process.argv.slice(2));
  main(args.p || args.project || '.', args.basePath)
      .then(exitCode => process.exit(exitCode))
      .catch(e => {
        console.error(e.stack);
        console.error('Compilation failed');
        process.exit(1);
      });
}
