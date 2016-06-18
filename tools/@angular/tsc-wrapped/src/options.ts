import * as ts from 'typescript';

interface Options extends ts.CompilerOptions {
  // Absolute path to a directory where generated file structure is written
  genDir: string;

  // Path to the directory containing the tsconfig.json file.
  basePath: string;

  // Don't produce .metadata.json files (they don't work for bundled emit with --out)
  skipMetadataEmit: boolean;

  // Don't produce .ngfactory.ts or .css.shim.ts files
  skipTemplateCodegen: boolean;

  // Print extra information while running the compiler
  trace: boolean;

  // Whether to embed debug information in the compiled templates
  debug?: boolean;
}

export default Options;
