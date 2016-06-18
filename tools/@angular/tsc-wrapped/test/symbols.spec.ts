import * as ts from 'typescript';

import {isMetadataGlobalReferenceExpression} from '../src/schema';
import {Symbols} from '../src/symbols';

import {Directory, Host, expectNoDiagnostics} from './typescript.mocks';

describe('Symbols', () => {
  let symbols: Symbols;
  const someValue = 'some-value';

  beforeEach(() => symbols = new Symbols(null));

  it('should be able to add a symbol', () => symbols.define('someSymbol', someValue));

  beforeEach(() => symbols.define('someSymbol', someValue));

  it('should be able to `has` a symbol', () => expect(symbols.has('someSymbol')).toBeTruthy());
  it('should be able to `get` a symbol value',
     () => expect(symbols.resolve('someSymbol')).toBe(someValue));
  it('should be able to `get` a symbol value',
     () => expect(symbols.resolve('someSymbol')).toBe(someValue));
  it('should be able to determine symbol is missing',
     () => expect(symbols.has('missingSymbol')).toBeFalsy());
  it('should return undefined from `get` for a missing symbol',
     () => expect(symbols.resolve('missingSymbol')).toBeUndefined());

  let host: ts.LanguageServiceHost;
  let service: ts.LanguageService;
  let program: ts.Program;
  let expressions: ts.SourceFile;
  let imports: ts.SourceFile;

  beforeEach(() => {
    host = new Host(FILES, ['consts.ts', 'expressions.ts', 'imports.ts']);
    service = ts.createLanguageService(host);
    program = service.getProgram();
    expressions = program.getSourceFile('expressions.ts');
    imports = program.getSourceFile('imports.ts');
  });

  it('should not have syntax errors in the test sources', () => {
    expectNoDiagnostics(service.getCompilerOptionsDiagnostics());
    for (const sourceFile of program.getSourceFiles()) {
      expectNoDiagnostics(service.getSyntacticDiagnostics(sourceFile.fileName));
    }
  });

  it('should be able to find the source files', () => {
    expect(expressions).toBeDefined();
    expect(imports).toBeDefined();
  })

  it('should be able to create symbols for a source file', () => {
    let symbols = new Symbols(expressions);
    expect(symbols).toBeDefined();
  });


  it('should be able to find symbols in expression', () => {
    let symbols = new Symbols(expressions);
    expect(symbols.has('someName')).toBeTruthy();
    expect(symbols.resolve('someName'))
        .toEqual({__symbolic: 'reference', module: './consts', name: 'someName'});
    expect(symbols.has('someBool')).toBeTruthy();
    expect(symbols.resolve('someBool'))
        .toEqual({__symbolic: 'reference', module: './consts', name: 'someBool'});
  });

  it('should be able to detect a * import', () => {
    let symbols = new Symbols(imports);
    expect(symbols.resolve('b')).toEqual({__symbolic: 'reference', module: 'b'});
  });

  it('should be able to detect importing a default export', () => {
    let symbols = new Symbols(imports);
    expect(symbols.resolve('d')).toEqual({__symbolic: 'reference', module: 'd', default: true});
  });

  it('should be able to import a renamed symbol', () => {
    let symbols = new Symbols(imports);
    expect(symbols.resolve('g')).toEqual({__symbolic: 'reference', name: 'f', module: 'f'});
  });

  it('should be able to resolve any symbol in core global scope', () => {
    let core = program.getSourceFiles().find(source => source.fileName.endsWith('lib.d.ts'));
    expect(core).toBeDefined();
    let visit = (node: ts.Node): boolean => {
      switch (node.kind) {
        case ts.SyntaxKind.VariableStatement:
        case ts.SyntaxKind.VariableDeclarationList:
          return ts.forEachChild(node, visit);
        case ts.SyntaxKind.VariableDeclaration:
          const variableDeclaration = <ts.VariableDeclaration>node;
          const nameNode = <ts.Identifier>variableDeclaration.name;
          const name = nameNode.text;
          const result = symbols.resolve(name);
          expect(isMetadataGlobalReferenceExpression(result) && result.name).toEqual(name);

          // Ignore everything after Float64Array as it is IE specific.
          return name === 'Float64Array';
      }
      return false;
    };
    ts.forEachChild(core, visit);
  });
});

const FILES: Directory = {
  'consts.ts': `
    export var someName = 'some-name';
    export var someBool = true;
    export var one = 1;
    export var two = 2;
  `,
  'expressions.ts': `
    import {someName, someBool, one, two} from './consts';
  `,
  'imports.ts': `
    import * as b from 'b';
    import 'c';
    import d from 'd';
    import {f as g} from 'f';
  `
};