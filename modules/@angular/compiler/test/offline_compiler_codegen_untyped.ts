// ATTENTION: This file will be overwritten with generated code by main()
import {JavaScriptEmitter} from '@angular/compiler/src/output/js_emitter';
import {ComponentFactory} from '@angular/core/src/linker/component_factory';

import {print} from '../src/facade/lang';

import {compAMetadata, compileComp} from './offline_compiler_util';
import {CompA, SimpleJsImportGenerator} from './offline_compiler_util';

export const CompANgFactory: ComponentFactory<CompA> = null;

export function emit() {
  var emitter = new JavaScriptEmitter(new SimpleJsImportGenerator());
  return compileComp(emitter, compAMetadata);
}

// Generator
export function main(args: string[]) {
  emit().then((source) => {
    // debug: console.error(source);
    print(source);
  });
}
