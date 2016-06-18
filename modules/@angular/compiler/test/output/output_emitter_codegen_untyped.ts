// ATTENTION: This file will be overwritten with generated code by main()
import {JavaScriptEmitter} from '@angular/compiler/src/output/js_emitter';

import {unimplemented} from '../../src/facade/exceptions';
import {print} from '../../src/facade/lang';
import {assetUrl} from '../../src/util';
import {SimpleJsImportGenerator} from '../offline_compiler_util';

import {codegenExportsVars, codegenStmts} from './output_emitter_util';

export function getExpressions(): any {
  return unimplemented();
}

// Generator
export function emit() {
  var emitter = new JavaScriptEmitter(new SimpleJsImportGenerator());
  var emittedCode = emitter.emitStatements(
      assetUrl('compiler', 'output/output_emitter_codegen_untyped', 'test'), codegenStmts,
      codegenExportsVars);
  return emittedCode;
}

export function main(args: string[]) {
  var emittedCode = emit();
  // debug: console.error(emittedCode);
  print(emittedCode);
}
