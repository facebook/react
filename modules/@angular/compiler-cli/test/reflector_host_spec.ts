import {beforeEach, ddescribe, describe, expect, iit, it} from '@angular/core/testing/testing_internal';
import * as ts from 'typescript';

import {ReflectorHost, ReflectorHostContext} from '../src/reflector_host';

import {Directory, Entry, MockCompilerHost, MockContext} from './mocks';

describe('reflector_host', () => {
  var context: MockContext;
  var host: ts.CompilerHost;
  var program: ts.Program;
  var reflectorHost: ReflectorHost;

  beforeEach(() => {
    context = new MockContext('/tmp/src', clone(FILES));
    host = new MockCompilerHost(context)
    program = ts.createProgram(
        ['main.ts'], {
          module: ts.ModuleKind.CommonJS,
        },
        host);
    // Force a typecheck
    let errors = program.getSemanticDiagnostics();
    if (errors && errors.length) {
      throw new Error('Expected no errors');
    }
    reflectorHost = new ReflectorHost(
        program, host, {
          genDir: '/tmp/dist',
          basePath: '/tmp/src',
          skipMetadataEmit: false,
          skipTemplateCodegen: false,
          trace: false
        },
        context);
  });

  it('should provide the import locations for angular', () => {
    let {coreDecorators, diDecorators, diMetadata, animationMetadata, provider} =
        reflectorHost.angularImportLocations();
    expect(coreDecorators).toEqual('@angular/core/src/metadata');
    expect(diDecorators).toEqual('@angular/core/src/di/decorators');
    expect(diMetadata).toEqual('@angular/core/src/di/metadata');
    expect(animationMetadata).toEqual('@angular/core/src/animation/metadata');
    expect(provider).toEqual('@angular/core/src/di/provider');
  });

  it('should be able to produce an import from main @angular/core', () => {
    expect(reflectorHost.getImportPath('main.ts', 'node_modules/@angular/core.d.ts'))
        .toEqual('@angular/core');
  });

  it('should be ble to produce an import from main to a sub-directory', () => {
    expect(reflectorHost.getImportPath('main.ts', 'lib/utils.ts')).toEqual('./lib/utils');
  });

  it('should be able to produce an import from to a peer file', () => {
    expect(reflectorHost.getImportPath('lib/utils.ts', 'lib/collections.ts'))
        .toEqual('./collections');
  });

  it('should be able to produce an import from to a sibling directory', () => {
    expect(reflectorHost.getImportPath('lib2/utils2.ts', 'lib/utils.ts')).toEqual('../lib/utils');
  });

  it('should be able to produce a symbol for an exported symbol', () => {
    expect(reflectorHost.findDeclaration('@angular/router', 'foo', 'main.ts')).toBeDefined();
  });

  it('should be able to produce a symbol for values space only reference', () => {
    expect(reflectorHost.findDeclaration('@angular/router/src/providers', 'foo', 'main.ts'))
        .toBeDefined();
  });

  it('should be produce the same symbol if asked twice', () => {
    let foo1 = reflectorHost.getStaticSymbol('main.ts', 'foo');
    let foo2 = reflectorHost.getStaticSymbol('main.ts', 'foo');
    expect(foo1).toBe(foo2);
  });

  it('should be able to read a metadata file',
     () => {
         expect(reflectorHost.getMetadataFor('node_modules/@angular/core.d.ts'))
             .toEqual({__symbolic: 'module', version: 1, metadata: {foo: {__symbolic: 'class'}}})});
});

const dummyModule = 'export let foo: any[];'
const FILES: Entry = {
  'tmp': {
    'src': {
      'main.ts': `
        import * as c from '@angular/core';
        import * as r from '@angular/router';
        import * as u from './lib/utils';
        import * as cs from './lib/collections';
        import * as u2 from './lib2/utils2';
      `,
      'lib': {
        'utils.ts': dummyModule,
        'collections.ts': dummyModule,
      },
      'lib2': {'utils2.ts': dummyModule},
      'node_modules': {
        '@angular': {
          'core.d.ts': dummyModule,
          'core.metadata.json':
              `{"__symbolic":"module", "version": 1, "metadata": {"foo": {"__symbolic": "class"}}}`,
          'router': {'index.d.ts': dummyModule, 'src': {'providers.d.ts': dummyModule}}
        }
      }
    }
  }
}

function clone(entry: Entry): Entry {
  if (typeof entry === 'string') {
    return entry;
  } else {
    let result: Directory = {};
    for (let name in entry) {
      result[name] = clone(entry[name]);
    }
    return result;
  }
}
