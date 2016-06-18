import {beforeEach, ddescribe, describe, expect, iit, inject, it, xit,} from '@angular/core/testing/testing_internal';

import {isBlank} from '../../src/facade/lang';
import {DartEmitter} from '@angular/compiler/src/output/dart_emitter';
import {CompileIdentifierMetadata} from '@angular/compiler/src/compile_metadata';
import * as o from '@angular/compiler/src/output/output_ast';
import {DartImportGenerator} from '@angular/compiler/src/output/dart_imports';

var someModuleUrl = 'asset:somePackage/lib/somePath';
var anotherModuleUrl = 'asset:somePackage/lib/someOtherPath';

var sameModuleIdentifier =
    new CompileIdentifierMetadata({name: 'someLocalId', moduleUrl: someModuleUrl});

var externalModuleIdentifier =
    new CompileIdentifierMetadata({name: 'someExternalId', moduleUrl: anotherModuleUrl});

export function main() {
  // Not supported features of our OutputAst in Dart:
  // - declaring what should be exported via a special statement like `export`.
  //   Dart exports everything that has no `_` in its name.
  // - declaring private fields via a statement like `private`.
  //   Dart exports everything that has no `_` in its name.
  // - return types for function expressions

  describe('DartEmitter', () => {
    var emitter: DartEmitter;
    var someVar: o.ReadVarExpr;

    beforeEach(() => {
      emitter = new DartEmitter(new DartImportGenerator());
      someVar = o.variable('someVar');
    });

    function emitStmt(stmt: o.Statement, exportedVars: string[] = null): string {
      if (isBlank(exportedVars)) {
        exportedVars = [];
      }
      return emitter.emitStatements(someModuleUrl, [stmt], exportedVars);
    }

    it('should declare variables', () => {
      expect(emitStmt(someVar.set(o.literal(1)).toDeclStmt())).toEqual(`var someVar = 1;`);
      expect(emitStmt(someVar.set(o.literal(1)).toDeclStmt(null, [o.StmtModifier.Final])))
          .toEqual(`final someVar = 1;`);
      expect(emitStmt(someVar
                          .set(o.literal(
                              1, new o.BuiltinType(o.BuiltinTypeName.Int, [o.TypeModifier.Const])))
                          .toDeclStmt(null, [o.StmtModifier.Final])))
          .toEqual(`const int someVar = 1;`);
      expect(emitStmt(someVar.set(o.literal(1)).toDeclStmt(), ['someVar']))
          .toEqual(`var someVar = 1;`);
      expect(emitStmt(someVar.set(o.literal(1)).toDeclStmt(o.INT_TYPE)))
          .toEqual(`int someVar = 1;`);
    });

    it('should read and write variables', () => {
      expect(emitStmt(someVar.toStmt())).toEqual(`someVar;`);
      expect(emitStmt(someVar.set(o.literal(1)).toStmt())).toEqual(`someVar = 1;`);
      expect(emitStmt(someVar.set(o.variable('someOtherVar').set(o.literal(1))).toStmt()))
          .toEqual(`someVar = (someOtherVar = 1);`);
    });

    it('should read and write keys', () => {
      expect(emitStmt(o.variable('someMap').key(o.variable('someKey')).toStmt()))
          .toEqual(`someMap[someKey];`);
      expect(emitStmt(o.variable('someMap').key(o.variable('someKey')).set(o.literal(1)).toStmt()))
          .toEqual(`someMap[someKey] = 1;`);
    });

    it('should read and write properties', () => {
      expect(emitStmt(o.variable('someObj').prop('someProp').toStmt()))
          .toEqual(`someObj.someProp;`);
      expect(emitStmt(o.variable('someObj').prop('someProp').set(o.literal(1)).toStmt()))
          .toEqual(`someObj.someProp = 1;`);
    });

    it('should invoke functions and methods and constructors', () => {
      expect(emitStmt(o.variable('someFn').callFn([o.literal(1)]).toStmt())).toEqual('someFn(1);');
      expect(emitStmt(o.variable('someObj').callMethod('someMethod', [o.literal(1)]).toStmt()))
          .toEqual('someObj.someMethod(1);');
      expect(emitStmt(o.variable('SomeClass').instantiate([o.literal(1)]).toStmt()))
          .toEqual('new SomeClass(1);');
    });

    it('should support builtin methods', () => {
      expect(emitStmt(o.variable('arr1')
                          .callMethod(o.BuiltinMethod.ConcatArray, [o.variable('arr2')])
                          .toStmt()))
          .toEqual('arr1..addAll(arr2);');

      expect(emitStmt(o.variable('observable')
                          .callMethod(o.BuiltinMethod.SubscribeObservable, [o.variable('listener')])
                          .toStmt()))
          .toEqual('observable.listen(listener);');

      expect(
          emitStmt(
              o.variable('fn').callMethod(o.BuiltinMethod.bind, [o.variable('someObj')]).toStmt()))
          .toEqual('fn;');
    });

    it('should support literals', () => {
      expect(emitStmt(o.literal(0).toStmt())).toEqual('0;');
      expect(emitStmt(o.literal(true).toStmt())).toEqual('true;');
      expect(emitStmt(o.literal('someStr').toStmt())).toEqual(`'someStr';`);
      expect(emitStmt(o.literal('$a').toStmt())).toEqual(`'\\$a';`);
      expect(emitStmt(o.literalArr([o.literal(1)]).toStmt())).toEqual(`[1];`);
      expect(emitStmt(o.literalMap([['someKey', o.literal(1)]]).toStmt()))
          .toEqual(`{'someKey': 1};`);
      expect(emitStmt(
                 o.literalMap([['someKey', o.literal(1)]], new o.MapType(o.NUMBER_TYPE)).toStmt()))
          .toEqual(`<String, num>{'someKey': 1};`);
    });

    it('should support external identifiers', () => {
      expect(emitStmt(o.importExpr(sameModuleIdentifier).toStmt())).toEqual('someLocalId;');
      expect(emitStmt(o.importExpr(externalModuleIdentifier).toStmt())).toEqual([
        `import 'someOtherPath' as import0;`, `import0.someExternalId;`
      ].join('\n'));
    });

    it('should support operators', () => {
      var lhs = o.variable('lhs');
      var rhs = o.variable('rhs');
      expect(emitStmt(someVar.cast(o.INT_TYPE).toStmt())).toEqual('(someVar as int);');
      expect(emitStmt(o.not(someVar).toStmt())).toEqual('!someVar;');
      expect(
          emitStmt(someVar.conditional(o.variable('trueCase'), o.variable('falseCase')).toStmt()))
          .toEqual('(someVar? trueCase: falseCase);');

      expect(emitStmt(lhs.equals(rhs).toStmt())).toEqual('(lhs == rhs);');
      expect(emitStmt(lhs.notEquals(rhs).toStmt())).toEqual('(lhs != rhs);');
      expect(emitStmt(lhs.identical(rhs).toStmt())).toEqual('identical(lhs, rhs);');
      expect(emitStmt(lhs.notIdentical(rhs).toStmt())).toEqual('!identical(lhs, rhs);');
      expect(emitStmt(lhs.minus(rhs).toStmt())).toEqual('(lhs - rhs);');
      expect(emitStmt(lhs.plus(rhs).toStmt())).toEqual('(lhs + rhs);');
      expect(emitStmt(lhs.divide(rhs).toStmt())).toEqual('(lhs / rhs);');
      expect(emitStmt(lhs.multiply(rhs).toStmt())).toEqual('(lhs * rhs);');
      expect(emitStmt(lhs.modulo(rhs).toStmt())).toEqual('(lhs % rhs);');
      expect(emitStmt(lhs.and(rhs).toStmt())).toEqual('(lhs && rhs);');
      expect(emitStmt(lhs.or(rhs).toStmt())).toEqual('(lhs || rhs);');
      expect(emitStmt(lhs.lower(rhs).toStmt())).toEqual('(lhs < rhs);');
      expect(emitStmt(lhs.lowerEquals(rhs).toStmt())).toEqual('(lhs <= rhs);');
      expect(emitStmt(lhs.bigger(rhs).toStmt())).toEqual('(lhs > rhs);');
      expect(emitStmt(lhs.biggerEquals(rhs).toStmt())).toEqual('(lhs >= rhs);');
    });

    it('should support function expressions', () => {
      expect(emitStmt(o.fn([], []).toStmt())).toEqual(['() {', '};'].join('\n'));
      expect(emitStmt(o.fn([new o.FnParam('param1', o.INT_TYPE)], []).toStmt())).toEqual([
        '(int param1) {', '};'
      ].join('\n'));
    });

    it('should support function statements', () => {
      expect(emitStmt(new o.DeclareFunctionStmt('someFn', [], [
      ]))).toEqual(['void someFn() {', '}'].join('\n'));
      expect(emitStmt(new o.DeclareFunctionStmt(
                 'someFn', [], [new o.ReturnStatement(o.literal(1))], o.INT_TYPE)))
          .toEqual(['int someFn() {', '  return 1;', '}'].join('\n'));
      expect(emitStmt(new o.DeclareFunctionStmt('someFn', [new o.FnParam('param1', o.INT_TYPE)], [
      ]))).toEqual(['void someFn(int param1) {', '}'].join('\n'));
    });

    it('should support comments', () => {
      expect(emitStmt(new o.CommentStmt('a\nb'))).toEqual(['// a', '// b'].join('\n'));
    });

    it('should support if stmt', () => {
      var trueCase = o.variable('trueCase').callFn([]).toStmt();
      var falseCase = o.variable('falseCase').callFn([]).toStmt();
      expect(emitStmt(new o.IfStmt(o.variable('cond'), [trueCase]))).toEqual([
        'if (cond) { trueCase(); }'
      ].join('\n'));
      expect(emitStmt(new o.IfStmt(o.variable('cond'), [trueCase], [falseCase]))).toEqual([
        'if (cond) {', '  trueCase();', '} else {', '  falseCase();', '}'
      ].join('\n'));
    });

    it('should support try/catch', () => {
      var bodyStmt = o.variable('body').callFn([]).toStmt();
      var catchStmt = o.variable('catchFn').callFn([o.CATCH_ERROR_VAR, o.CATCH_STACK_VAR]).toStmt();
      expect(emitStmt(new o.TryCatchStmt([bodyStmt], [catchStmt]))).toEqual([
        'try {', '  body();', '} catch (error, stack) {', '  catchFn(error,stack);', '}'
      ].join('\n'));
    });

    it('should support support throwing',
       () => { expect(emitStmt(new o.ThrowStmt(someVar))).toEqual('throw someVar;'); });

    describe('classes', () => {
      var callSomeMethod: o.Statement;

      beforeEach(() => { callSomeMethod = o.THIS_EXPR.callMethod('someMethod', []).toStmt(); });

      it('should support declaring classes', () => {
        expect(emitStmt(new o.ClassStmt('SomeClass', null, [], [], null, [
        ]))).toEqual(['class SomeClass {', '}'].join('\n'));
        expect(emitStmt(new o.ClassStmt('SomeClass', o.variable('SomeSuperClass'), [], [], null, [
        ]))).toEqual(['class SomeClass extends SomeSuperClass {', '}'].join('\n'));
      });

      it('should support declaring constructors', () => {
        var superCall = o.SUPER_EXPR.callFn([o.variable('someParam')]).toStmt();
        expect(emitStmt(
                   new o.ClassStmt('SomeClass', null, [], [], new o.ClassMethod(null, [], []), [])))
            .toEqual(['class SomeClass {', '  SomeClass() {', '  }', '}'].join('\n'));
        expect(emitStmt(new o.ClassStmt(
                   'SomeClass', null, [], [],
                   new o.ClassMethod(null, [new o.FnParam('someParam', o.INT_TYPE)], []), [])))
            .toEqual(['class SomeClass {', '  SomeClass(int someParam) {', '  }', '}'].join('\n'));
        expect(emitStmt(new o.ClassStmt(
                   'SomeClass', null, [], [], new o.ClassMethod(null, [], [superCall]), [])))
            .toEqual(
                ['class SomeClass {', '  SomeClass(): super(someParam) {', '  }', '}'].join('\n'));
        expect(emitStmt(new o.ClassStmt(
                   'SomeClass', null, [], [], new o.ClassMethod(null, [], [callSomeMethod]), [])))
            .toEqual([
              'class SomeClass {', '  SomeClass() {', '    this.someMethod();', '  }', '}'
            ].join('\n'));
      });

      it('should support declaring fields', () => {
        expect(emitStmt(new o.ClassStmt(
                   'SomeClass', null, [new o.ClassField('someField')], [], null, [])))
            .toEqual(['class SomeClass {', '  var someField;', '}'].join('\n'));
        expect(emitStmt(new o.ClassStmt(
                   'SomeClass', null, [new o.ClassField('someField', o.INT_TYPE)], [], null, [])))
            .toEqual(['class SomeClass {', '  int someField;', '}'].join('\n'));
        expect(
            emitStmt(new o.ClassStmt(
                'SomeClass', null,
                [new o.ClassField('someField', o.INT_TYPE, [o.StmtModifier.Final])], [], null, [])))
            .toEqual(['class SomeClass {', '  final int someField;', '}'].join('\n'));
      });

      it('should support declaring getters', () => {
        expect(emitStmt(new o.ClassStmt(
                   'SomeClass', null, [], [new o.ClassGetter('someGetter', [])], null, [])))
            .toEqual(['class SomeClass {', '  get someGetter {', '  }', '}'].join('\n'));
        expect(emitStmt(new o.ClassStmt(
                   'SomeClass', null, [], [new o.ClassGetter('someGetter', [], o.INT_TYPE)], null,
                   [])))
            .toEqual(['class SomeClass {', '  int get someGetter {', '  }', '}'].join('\n'));
        expect(emitStmt(new o.ClassStmt(
                   'SomeClass', null, [], [new o.ClassGetter('someGetter', [callSomeMethod])], null,
                   [])))
            .toEqual([
              'class SomeClass {', '  get someGetter {', '    this.someMethod();', '  }', '}'
            ].join('\n'));
      });

      it('should support methods', () => {
        expect(emitStmt(new o.ClassStmt('SomeClass', null, [], [], null, [
          new o.ClassMethod('someMethod', [], [])
        ]))).toEqual(['class SomeClass {', '  void someMethod() {', '  }', '}'].join('\n'));
        expect(emitStmt(new o.ClassStmt('SomeClass', null, [], [], null, [
          new o.ClassMethod('someMethod', [], [], o.INT_TYPE)
        ]))).toEqual(['class SomeClass {', '  int someMethod() {', '  }', '}'].join('\n'));
        expect(
            emitStmt(new o.ClassStmt(
                'SomeClass', null, [], [], null,
                [new o.ClassMethod('someMethod', [new o.FnParam('someParam', o.INT_TYPE)], [])])))
            .toEqual(
                ['class SomeClass {', '  void someMethod(int someParam) {', '  }', '}'].join('\n'));
        expect(emitStmt(new o.ClassStmt(
                   'SomeClass', null, [], [], null,
                   [new o.ClassMethod('someMethod', [], [callSomeMethod])])))
            .toEqual([
              'class SomeClass {', '  void someMethod() {', '    this.someMethod();', '  }', '}'
            ].join('\n'));
      });
    });

    it('should support builtin types', () => {
      var writeVarExpr = o.variable('a').set(o.NULL_EXPR);
      expect(emitStmt(writeVarExpr.toDeclStmt(o.DYNAMIC_TYPE))).toEqual('dynamic a = null;');
      expect(emitStmt(writeVarExpr.toDeclStmt(o.BOOL_TYPE))).toEqual('bool a = null;');
      expect(emitStmt(writeVarExpr.toDeclStmt(o.INT_TYPE))).toEqual('int a = null;');
      expect(emitStmt(writeVarExpr.toDeclStmt(o.NUMBER_TYPE))).toEqual('num a = null;');
      expect(emitStmt(writeVarExpr.toDeclStmt(o.STRING_TYPE))).toEqual('String a = null;');
      expect(emitStmt(writeVarExpr.toDeclStmt(o.FUNCTION_TYPE))).toEqual('Function a = null;');
    });

    it('should support external types', () => {
      var writeVarExpr = o.variable('a').set(o.NULL_EXPR);
      expect(emitStmt(writeVarExpr.toDeclStmt(o.importType(sameModuleIdentifier))))
          .toEqual('someLocalId a = null;');
      expect(emitStmt(writeVarExpr.toDeclStmt(o.importType(externalModuleIdentifier)))).toEqual([
        `import 'someOtherPath' as import0;`, `import0.someExternalId a = null;`
      ].join('\n'));
    });

    it('should support combined types', () => {
      var writeVarExpr = o.variable('a').set(o.NULL_EXPR);
      expect(emitStmt(writeVarExpr.toDeclStmt(new o.ArrayType(null))))
          .toEqual('List<dynamic> a = null;');
      expect(emitStmt(writeVarExpr.toDeclStmt(new o.ArrayType(o.INT_TYPE))))
          .toEqual('List<int> a = null;');

      expect(emitStmt(writeVarExpr.toDeclStmt(new o.MapType(null))))
          .toEqual('Map<String, dynamic> a = null;');
      expect(emitStmt(writeVarExpr.toDeclStmt(new o.MapType(o.INT_TYPE))))
          .toEqual('Map<String, int> a = null;');
    });
  });
}
