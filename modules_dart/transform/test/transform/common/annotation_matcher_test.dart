library angular2.test.transform.common.annotation_matcher_test;

import 'dart:async';

import 'package:analyzer/analyzer.dart';
import 'package:barback/barback.dart' show AssetId;
import 'package:test/test.dart';

import 'package:angular2/src/transform/common/annotation_matcher.dart';

main() {
  allTests();
}

var simpleAst = parseCompilationUnit('''
import 'package:test/test.dart';

@Test()
var foo;
''');

var namespacedAst = parseCompilationUnit('''
import 'package:test/test.dart' as test;

@test.Test()
var foo;
''');

var relativePathAst = parseCompilationUnit('''
import 'test.dart';

@Test()
var foo;
''');

var namespacedRelativePathAst = parseCompilationUnit('''
import 'test.dart' as test;

@test.Test()
var foo;
''');

void allTests() {
  test('should be able to match basic annotations.', () {
    var matcher = new AnnotationMatcher()
      ..add(const ClassDescriptor('Test', 'package:test/test.dart'));
    var visitor = new MatchRecordingVisitor(matcher);
    simpleAst.accept(visitor);
    expect(visitor.matches.length, equals(1));
  });

  test('should be able to match namespaced annotations.', () {
    var matcher = new AnnotationMatcher()
      ..add(const ClassDescriptor('Test', 'package:test/test.dart'));
    var visitor = new MatchRecordingVisitor(matcher);
    namespacedAst.accept(visitor);
    expect(visitor.matches.length, equals(1));
  });

  test('should be able to match relative imports.', () {
    var matcher = new AnnotationMatcher()
      ..add(const ClassDescriptor('Test', 'package:test/test.dart'));
    var visitor =
        new MatchRecordingVisitor(matcher, new AssetId('test', 'lib/foo.dart'));
    relativePathAst.accept(visitor);
    expect(visitor.matches.length, equals(1));
  });

  test('should be able to match relative imports with a namespace.', () {
    var matcher = new AnnotationMatcher()
      ..add(const ClassDescriptor('Test', 'package:test/test.dart'));
    var visitor =
        new MatchRecordingVisitor(matcher, new AssetId('test', 'lib/foo.dart'));
    namespacedRelativePathAst.accept(visitor);
    expect(visitor.matches.length, equals(1));
  });

  test('should not match annotations if the import is missing.', () {
    var matcher = new AnnotationMatcher()
      ..add(const ClassDescriptor('Test', 'package:test/foo.dart'));
    var visitor = new MatchRecordingVisitor(matcher);
    simpleAst.accept(visitor);
    expect(visitor.matches.isEmpty, isTrue);
  });

  test('should not match annotations if the name is different.', () {
    var matcher = new AnnotationMatcher()
      ..add(const ClassDescriptor('Foo', 'package:test/test.dart'));
    var visitor = new MatchRecordingVisitor(matcher);
    simpleAst.accept(visitor);
    expect(visitor.matches.isEmpty, isTrue);
  });
}

class MatchRecordingVisitor extends RecursiveAstVisitor {
  final AssetId assetId;
  final AnnotationMatcher matcher;
  final matches = <Annotation>[];

  MatchRecordingVisitor(this.matcher, [AssetId assetId])
      : super(),
        this.assetId =
            assetId != null ? assetId : new AssetId('a', 'lib/a.dart');

  @override
  void visitAnnotation(Annotation annotation) {
    if (matcher.hasMatch(annotation.name, assetId)) matches.add(annotation);
  }
}
