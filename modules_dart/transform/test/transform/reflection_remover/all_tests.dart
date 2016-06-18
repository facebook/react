library angular2.test.transform.reflection_remover;

import 'package:analyzer/analyzer.dart';
import 'package:barback/barback.dart';
import 'package:guinness/guinness.dart';

import 'package:angular2/src/transform/common/annotation_matcher.dart';
import 'package:angular2/src/transform/common/mirror_mode.dart';
import 'package:angular2/src/transform/reflection_remover/codegen.dart';
import 'package:angular2/src/transform/reflection_remover/entrypoint_matcher.dart';
import 'package:angular2/src/transform/reflection_remover/rewriter.dart';

import '../common/read_file.dart';
import 'bootstrap_files/expected/index.dart' as bootstrap_expected;
import 'combinator_files/expected/index.dart' as combinator_expected;
import 'debug_mirrors_files/expected/index.dart' as debug_mirrors;
import 'deferred_bootstrap_files/expected/index.dart'
    as deferred_bootstrap_expected;
import 'function_annotation_files/expected/index.dart'
    as func_annotation_expected;
import 'log_mirrors_files/expected/index.dart' as log_mirrors;
import 'method_annotation_files/expected/index.dart'
    as method_annotation_expected;
import 'reflection_remover_files/expected/index.dart' as expected;
import 'verbose_files/expected/index.dart' as verbose_mirrors;

main() => allTests();

void allTests() {
  var entrypointMatcher, assetId, codegen, code;

  beforeEach(() {
    assetId = new AssetId('a', 'web/index.dart');
    codegen = new Codegen(assetId);
    code = readFile('reflection_remover/index.dart').replaceAll('\r\n', '\n');
    entrypointMatcher = new EntrypointMatcher(assetId, new AnnotationMatcher());
  });

  it(
      'should remove uses of mirrors & '
      'insert calls to generated code by default.', () {
    var output = new Rewriter(code, codegen, entrypointMatcher)
        .rewrite(parseCompilationUnit(code));
    expect(output).toEqual(expected.code);
  });

  it(
      'should replace uses of mirrors with the debug implementation & '
      'insert calls to generated code in `MirrorMode.debug`.', () {
    var output = new Rewriter(code, codegen, entrypointMatcher,
            mirrorMode: MirrorMode.debug)
        .rewrite(parseCompilationUnit(code));
    expect(output).toEqual(debug_mirrors.code);
  });

  it(
      'should replace uses of mirrors with the verbose implementation '
      'in `MirrorMode.verbose`.', () {
    var output = new Rewriter(code, codegen, entrypointMatcher,
            mirrorMode: MirrorMode.verbose)
        .rewrite(parseCompilationUnit(code));
    expect(output).toEqual(verbose_mirrors.code);
  });

  it('should not initialize the reflector when `writeStaticInit` is `false`.',
      () {
    var output =
        new Rewriter(code, codegen, entrypointMatcher, writeStaticInit: false)
            .rewrite(parseCompilationUnit(code));
    expect(output).toEqual(log_mirrors.code);
  });

  describe('`bootstrap` import and call', () {
    it('should be rewritten to `bootstrapStatic`.', () {
      final bootstrapCode =
          readFile('reflection_remover/bootstrap_files/index.dart')
              .replaceAll('\r\n', '\n');
      var output = new Rewriter(bootstrapCode, codegen, entrypointMatcher,
              writeStaticInit: true)
          .rewrite(parseCompilationUnit(bootstrapCode));
      expect(output).toEqual(bootstrap_expected.code);
    });

    it('should be rewritten correctly when deferred.', () {
      final bootstrapCode =
          readFile('reflection_remover/deferred_bootstrap_files/index.dart');
      var output = new Rewriter(bootstrapCode, codegen, entrypointMatcher,
              writeStaticInit: true)
          .rewrite(parseCompilationUnit(bootstrapCode));
      expect(output).toEqual(deferred_bootstrap_expected.code);
    });

    it('should maintain any combinators.', () {
      final bootstrapCode =
          readFile('reflection_remover/combinator_files/index.dart');
      var output = new Rewriter(bootstrapCode, codegen, entrypointMatcher,
              writeStaticInit: true)
          .rewrite(parseCompilationUnit(bootstrapCode));
      expect(output).toEqual(combinator_expected.code);
    });
  });

  describe('AngularEntrypoint annotation', () {
    it('should add a call to `initReflector` at the beginning of the function',
        () {
      code = readFile('reflection_remover/function_annotation_files/index.dart')
          .replaceAll('\r\n', '\n');
      final output = new Rewriter(code, codegen, entrypointMatcher)
          .rewrite(parseCompilationUnit(code));
      expect(output).toEqual(func_annotation_expected.code);
    });

    it('should `throw` for entrypoints implemented as arrow functions', () {
      code = readFile('reflection_remover/arrow_annotation_files/index.dart')
          .replaceAll('\r\n', '\n');
      expect(() {
        new Rewriter(code, codegen, entrypointMatcher)
            .rewrite(parseCompilationUnit(code));
      }).toThrowWith(anInstanceOf: ArgumentError);
    });

    it('should `throw` for native functions annotated as entry points', () {
      code = readFile('reflection_remover/native_annotation_files/index.dart')
          .replaceAll('\r\n', '\n');
      expect(() {
        new Rewriter(code, codegen, entrypointMatcher)
            .rewrite(parseCompilationUnit(code));
      }).toThrowWith(anInstanceOf: ArgumentError);
    });

    it('should `throw` for abstract functions annotated as entry points', () {
      code = readFile(
              'reflection_remover/abstract_method_annotation_files/index.dart')
          .replaceAll('\r\n', '\n');
      expect(() {
        new Rewriter(code, codegen, entrypointMatcher)
            .rewrite(parseCompilationUnit(code));
      }).toThrowWith(anInstanceOf: ArgumentError);
    });

    it('should add a call to `initReflector` at the beginning of the method',
        () {
      code = readFile('reflection_remover/method_annotation_files/index.dart')
          .replaceAll('\r\n', '\n');
      final output = new Rewriter(code, codegen, entrypointMatcher)
          .rewrite(parseCompilationUnit(code));
      expect(output).toEqual(method_annotation_expected.code);
    });
  });
}
