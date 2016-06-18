import * as fs from 'fs';
import * as ts from 'typescript';

import {Evaluator} from '../src/evaluator';
import {Symbols} from '../src/symbols';

import {Directory, Host, expectNoDiagnostics, findVar} from './typescript.mocks';

describe('Evaluator', () => {
  let documentRegistry = ts.createDocumentRegistry();
  let host: ts.LanguageServiceHost;
  let service: ts.LanguageService;
  let program: ts.Program;
  let typeChecker: ts.TypeChecker;
  let symbols: Symbols;
  let evaluator: Evaluator;

  beforeEach(() => {
    host = new Host(FILES, [
      'expressions.ts', 'consts.ts', 'const_expr.ts', 'forwardRef.ts', 'classes.ts',
      'newExpression.ts', 'errors.ts'
    ]);
    service = ts.createLanguageService(host, documentRegistry);
    program = service.getProgram();
    typeChecker = program.getTypeChecker();
    symbols = new Symbols(null);
    evaluator = new Evaluator(symbols);
  });

  it('should not have typescript errors in test data', () => {
    expectNoDiagnostics(service.getCompilerOptionsDiagnostics());
    for (const sourceFile of program.getSourceFiles()) {
      expectNoDiagnostics(service.getSyntacticDiagnostics(sourceFile.fileName));
      if (sourceFile.fileName != 'errors.ts') {
        // Skip errors.ts because we it has intentional semantic errors that we are testing for.
        expectNoDiagnostics(service.getSemanticDiagnostics(sourceFile.fileName));
      }
    }
  });

  it('should be able to fold literal expressions', () => {
    var consts = program.getSourceFile('consts.ts');
    expect(evaluator.isFoldable(findVar(consts, 'someName').initializer)).toBeTruthy();
    expect(evaluator.isFoldable(findVar(consts, 'someBool').initializer)).toBeTruthy();
    expect(evaluator.isFoldable(findVar(consts, 'one').initializer)).toBeTruthy();
    expect(evaluator.isFoldable(findVar(consts, 'two').initializer)).toBeTruthy();
  });

  it('should be able to fold expressions with foldable references', () => {
    var expressions = program.getSourceFile('expressions.ts');
    symbols.define('someName', 'some-name');
    symbols.define('someBool', true);
    symbols.define('one', 1);
    symbols.define('two', 2);
    expect(evaluator.isFoldable(findVar(expressions, 'three').initializer)).toBeTruthy();
    expect(evaluator.isFoldable(findVar(expressions, 'four').initializer)).toBeTruthy();
    symbols.define('three', 3);
    symbols.define('four', 4);
    expect(evaluator.isFoldable(findVar(expressions, 'obj').initializer)).toBeTruthy();
    expect(evaluator.isFoldable(findVar(expressions, 'arr').initializer)).toBeTruthy();
  });

  it('should be able to evaluate literal expressions', () => {
    var consts = program.getSourceFile('consts.ts');
    expect(evaluator.evaluateNode(findVar(consts, 'someName').initializer)).toBe('some-name');
    expect(evaluator.evaluateNode(findVar(consts, 'someBool').initializer)).toBe(true);
    expect(evaluator.evaluateNode(findVar(consts, 'one').initializer)).toBe(1);
    expect(evaluator.evaluateNode(findVar(consts, 'two').initializer)).toBe(2);
  });

  it('should be able to evaluate expressions', () => {
    var expressions = program.getSourceFile('expressions.ts');
    symbols.define('someName', 'some-name');
    symbols.define('someBool', true);
    symbols.define('one', 1);
    symbols.define('two', 2);
    expect(evaluator.evaluateNode(findVar(expressions, 'three').initializer)).toBe(3);
    symbols.define('three', 3);
    expect(evaluator.evaluateNode(findVar(expressions, 'four').initializer)).toBe(4);
    symbols.define('four', 4);
    expect(evaluator.evaluateNode(findVar(expressions, 'obj').initializer))
        .toEqual({one: 1, two: 2, three: 3, four: 4});
    expect(evaluator.evaluateNode(findVar(expressions, 'arr').initializer)).toEqual([1, 2, 3, 4]);
    expect(evaluator.evaluateNode(findVar(expressions, 'bTrue').initializer)).toEqual(true);
    expect(evaluator.evaluateNode(findVar(expressions, 'bFalse').initializer)).toEqual(false);
    expect(evaluator.evaluateNode(findVar(expressions, 'bAnd').initializer)).toEqual(true);
    expect(evaluator.evaluateNode(findVar(expressions, 'bOr').initializer)).toEqual(true);
    expect(evaluator.evaluateNode(findVar(expressions, 'nDiv').initializer)).toEqual(2);
    expect(evaluator.evaluateNode(findVar(expressions, 'nMod').initializer)).toEqual(1);


    expect(evaluator.evaluateNode(findVar(expressions, 'bLOr').initializer)).toEqual(false || true);
    expect(evaluator.evaluateNode(findVar(expressions, 'bLAnd').initializer)).toEqual(true && true);
    expect(evaluator.evaluateNode(findVar(expressions, 'bBOr').initializer)).toEqual(0x11 | 0x22);
    expect(evaluator.evaluateNode(findVar(expressions, 'bBAnd').initializer)).toEqual(0x11 & 0x03);
    expect(evaluator.evaluateNode(findVar(expressions, 'bXor').initializer)).toEqual(0x11 ^ 0x21);
    expect(evaluator.evaluateNode(findVar(expressions, 'bEqual').initializer))
        .toEqual(1 == <any>'1');
    expect(evaluator.evaluateNode(findVar(expressions, 'bNotEqual').initializer))
        .toEqual(1 != <any>'1');
    expect(evaluator.evaluateNode(findVar(expressions, 'bIdentical').initializer))
        .toEqual(1 === <any>'1');
    expect(evaluator.evaluateNode(findVar(expressions, 'bNotIdentical').initializer))
        .toEqual(1 !== <any>'1');
    expect(evaluator.evaluateNode(findVar(expressions, 'bLessThan').initializer)).toEqual(1 < 2);
    expect(evaluator.evaluateNode(findVar(expressions, 'bGreaterThan').initializer)).toEqual(1 > 2);
    expect(evaluator.evaluateNode(findVar(expressions, 'bLessThanEqual').initializer))
        .toEqual(1 <= 2);
    expect(evaluator.evaluateNode(findVar(expressions, 'bGreaterThanEqual').initializer))
        .toEqual(1 >= 2);
    expect(evaluator.evaluateNode(findVar(expressions, 'bShiftLeft').initializer)).toEqual(1 << 2);
    expect(evaluator.evaluateNode(findVar(expressions, 'bShiftRight').initializer))
        .toEqual(-1 >> 2);
    expect(evaluator.evaluateNode(findVar(expressions, 'bShiftRightU').initializer))
        .toEqual(-1 >>> 2);

  });

  it('should report recursive references as symbolic', () => {
    var expressions = program.getSourceFile('expressions.ts');
    expect(evaluator.evaluateNode(findVar(expressions, 'recursiveA').initializer))
        .toEqual({__symbolic: 'reference', name: 'recursiveB'});
    expect(evaluator.evaluateNode(findVar(expressions, 'recursiveB').initializer))
        .toEqual({__symbolic: 'reference', name: 'recursiveA'});
  });

  it('should correctly handle special cases for CONST_EXPR', () => {
    var const_expr = program.getSourceFile('const_expr.ts');
    expect(evaluator.evaluateNode(findVar(const_expr, 'bTrue').initializer)).toEqual(true);
    expect(evaluator.evaluateNode(findVar(const_expr, 'bFalse').initializer)).toEqual(false);
  });

  it('should resolve a forwardRef', () => {
    var forwardRef = program.getSourceFile('forwardRef.ts');
    expect(evaluator.evaluateNode(findVar(forwardRef, 'bTrue').initializer)).toEqual(true);
    expect(evaluator.evaluateNode(findVar(forwardRef, 'bFalse').initializer)).toEqual(false);
  });

  it('should return new expressions', () => {
    symbols.define('Value', {__symbolic: 'reference', module: './classes', name: 'Value'});
    evaluator = new Evaluator(symbols);
    var newExpression = program.getSourceFile('newExpression.ts');
    expect(evaluator.evaluateNode(findVar(newExpression, 'someValue').initializer)).toEqual({
      __symbolic: 'new',
      expression: {__symbolic: 'reference', name: 'Value', module: './classes'},
      arguments: ['name', 12]
    });
    expect(evaluator.evaluateNode(findVar(newExpression, 'complex').initializer)).toEqual({
      __symbolic: 'new',
      expression: {__symbolic: 'reference', name: 'Value', module: './classes'},
      arguments: ['name', 12]
    });
  });

  it('should return errors for unsupported expressions', () => {
    let errors = program.getSourceFile('errors.ts');
    let aDecl = findVar(errors, 'a');
    expect(evaluator.evaluateNode(aDecl.type)).toEqual({
      __symbolic: 'error',
      message: 'Qualified type names not supported',
      line: 5,
      character: 10
    });
    let fDecl = findVar(errors, 'f');
    expect(evaluator.evaluateNode(fDecl.initializer))
        .toEqual(
            {__symbolic: 'error', message: 'Function call not supported', line: 6, character: 11});
    let eDecl = findVar(errors, 'e');
    expect(evaluator.evaluateNode(eDecl.type)).toEqual({
      __symbolic: 'error',
      message: 'Could not resolve type',
      line: 7,
      character: 10,
      context: {typeName: 'NotFound'}
    });
    let sDecl = findVar(errors, 's');
    expect(evaluator.evaluateNode(sDecl.initializer)).toEqual({
      __symbolic: 'error',
      message: 'Name expected',
      line: 8,
      character: 13,
      context: {received: '1'}
    });
    let tDecl = findVar(errors, 't');
    expect(evaluator.evaluateNode(tDecl.initializer)).toEqual({
      __symbolic: 'error',
      message: 'Expression form not supported',
      line: 9,
      character: 11
    });
  });

  it('should be able to fold an array spread', () => {
    let expressions = program.getSourceFile('expressions.ts');
    symbols.define('arr', [1, 2, 3, 4]);
    let arrSpread = findVar(expressions, 'arrSpread');
    expect(evaluator.evaluateNode(arrSpread.initializer)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('should be able to produce a spread expression', () => {
    let expressions = program.getSourceFile('expressions.ts');
    let arrSpreadRef = findVar(expressions, 'arrSpreadRef');
    expect(evaluator.evaluateNode(arrSpreadRef.initializer)).toEqual([
      0, {__symbolic: 'spread', expression: {__symbolic: 'reference', name: 'arrImport'}}, 5
    ]);
  });
});

const FILES: Directory = {
  'directives.ts': `
    export function Pipe(options: { name?: string, pure?: boolean}) {
      return function(fn: Function) { }
    }
    `,
  'classes.ts': `
    export class Value {
      constructor(public name: string, public value: any) {}
    }
  `,
  'consts.ts': `
    export var someName = 'some-name';
    export var someBool = true;
    export var one = 1;
    export var two = 2;
    export var arrImport = [1, 2, 3, 4];
  `,
  'expressions.ts': `
    import {arrImport} from './consts';

    export var someName = 'some-name';
    export var someBool = true;
    export var one = 1;
    export var two = 2;

    export var three = one + two;
    export var four = two * two;
    export var obj = { one: one, two: two, three: three, four: four };
    export var arr = [one, two, three, four];
    export var bTrue = someBool;
    export var bFalse = !someBool;
    export var bAnd = someBool && someBool;
    export var bOr = someBool || someBool;
    export var nDiv = four / two;
    export var nMod = (four + one) % two;

    export var bLOr = false || true;             // true
    export var bLAnd = true && true;             // true
    export var bBOr = 0x11 | 0x22;               // 0x33
    export var bBAnd = 0x11 & 0x03;              // 0x01
    export var bXor = 0x11 ^ 0x21;               // 0x20
    export var bEqual = 1 == <any>"1";           // true
    export var bNotEqual = 1 != <any>"1";        // false
    export var bIdentical = 1 === <any>"1";      // false
    export var bNotIdentical = 1 !== <any>"1";   // true
    export var bLessThan = 1 < 2;                // true
    export var bGreaterThan = 1 > 2;             // false
    export var bLessThanEqual = 1 <= 2;          // true
    export var bGreaterThanEqual = 1 >= 2;       // false
    export var bShiftLeft = 1 << 2;              // 0x04
    export var bShiftRight = -1 >> 2;            // -1
    export var bShiftRightU = -1 >>> 2;          // 0x3fffffff

    export var arrSpread = [0, ...arr, 5];

    export var arrSpreadRef = [0, ...arrImport, 5];

    export var recursiveA = recursiveB;
    export var recursiveB = recursiveA;
  `,
  'A.ts': `
    import {Pipe} from './directives';

    @Pipe({name: 'A', pure: false})
    export class A {}`,
  'B.ts': `
    import {Pipe} from './directives';
    import {someName, someBool} from './consts';

    @Pipe({name: someName, pure: someBool})
    export class B {}`,
  'const_expr.ts': `
    function CONST_EXPR(value: any) { return value; }
    export var bTrue = CONST_EXPR(true);
    export var bFalse = CONST_EXPR(false);
  `,
  'forwardRef.ts': `
    function forwardRef(value: any) { return value; }
    export var bTrue = forwardRef(() => true);
    export var bFalse = forwardRef(() => false);
  `,
  'newExpression.ts': `
    import {Value} from './classes';
    function CONST_EXPR(value: any) { return value; }
    function forwardRef(value: any) { return value; }
    export const someValue = new Value("name", 12);
    export const complex = CONST_EXPR(new Value("name", forwardRef(() => 12)));
  `,
  'errors.ts': `
    declare namespace Foo {
      type A = string;
    }

    let a: Foo.A = 'some value';
    let f = () => 1;
    let e: NotFound;
    let s = { 1: 1, 2: 2 };
    let t = typeof 12;
  `,
};
