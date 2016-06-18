library angular2.test.transform.inliner_for_test.all_tests;

import 'dart:async';
import 'dart:convert' show LineSplitter;

import 'package:barback/barback.dart';
import 'package:dart_style/dart_style.dart';
import 'package:test/test.dart';
import 'package:transformer_test/utils.dart';

import 'package:angular2/src/transform/common/annotation_matcher.dart';
import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/options.dart';
import 'package:angular2/src/transform/common/zone.dart' as zone;
import 'package:angular2/src/transform/inliner_for_test/transformer.dart';

import '../common/read_file.dart';
import '../common/recording_logger.dart';

main() {
  allTests();
  endToEndTests();
}

DartFormatter formatter = new DartFormatter();
AnnotationMatcher annotationMatcher;

void allTests() {
  TestAssetReader absoluteReader;

  setUp(() {
    absoluteReader = new TestAssetReader();
    annotationMatcher = new AnnotationMatcher();
  });

  test('should inline `templateUrl` values', () async {
    var output = await _testInline(
        absoluteReader, _assetId('url_expression_files/hello.dart'));
    expect(output, isNotNull);
    expect(() => formatter.format(output), returnsNormally);
    expect(output, contains("r'''{{greeting}}'''"));
  });

  test(
      'should inline `templateUrl` and `styleUrls` values expressed as '
      'absolute urls.', () async {
    absoluteReader.addAsset(
        new AssetId('other_package', 'lib/template.html'),
        readFile(
            'inliner_for_test/absolute_url_expression_files/template.html'));
    absoluteReader.addAsset(
        new AssetId('other_package', 'lib/template.css'),
        readFile(
            'inliner_for_test/absolute_url_expression_files/template.css'));

    var output = await _testInline(
        absoluteReader, _assetId('absolute_url_expression_files/hello.dart'));

    expect(output, isNotNull);
    expect(() => formatter.format(output), returnsNormally);

    expect(output, contains("r'''{{greeting}}'''"));
    expect(output, contains("r'''.greeting { .color: blue; }'''"));
  });

  test('should inline multiple `styleUrls` values expressed as absolute urls.',
      () async {
    absoluteReader
      ..addAsset(new AssetId('other_package', 'lib/template.html'), '')
      ..addAsset(new AssetId('other_package', 'lib/template.css'), '');
    var output = await _testInline(
        absoluteReader, _assetId('multiple_style_urls_files/hello.dart'));

    expect(output, isNotNull);
    expect(() => formatter.format(output), returnsNormally);

    expect(output, contains("r'''.greeting { .color: blue; }'''"));
    expect(output, contains("r'''.hello { .color: red; }'''"));
  });

  test('should inline `templateUrl`s expressed as adjacent strings.', () async {
    var output = await _testInline(
        absoluteReader, _assetId('split_url_expression_files/hello.dart'));

    expect(output, isNotNull);
    expect(() => formatter.format(output), returnsNormally);

    expect(output, contains("{{greeting}}"));
  });

  test('should not inline values outside of View/Component annotations',
      () async {
    var output = await _testInline(
        absoluteReader, _assetId('false_match_files/hello.dart'));

    expect(output, isNotNull);
    expect(output, isNot(contains('{{greeting}}')));
    expect(output, contains('.greeting { .color: blue; }'));
  });

  test('should not modify files with no `templateUrl` or `styleUrls` values.',
      () async {
    var output = await _testInline(
        absoluteReader, _assetId('no_modify_files/hello.dart'));

    expect(output, isNull);
  });

  test('should not strip property annotations.', () async {
    // Regression test for https://github.com/dart-lang/sdk/issues/24578
    var output = await _testInline(
        absoluteReader, _assetId('prop_annotations_files/hello.dart'));

    expect(output, contains('@Attribute(\'thing\')'));
  });

  test('should maintain line numbers for long `templateUrl` values', () async {
    // Regression test for https://github.com/angular/angular/issues/5281
    final templateUrlVal =
        'supersupersupersupersupersupersupersupersupersupersupersuper'
        'superlongtemplate.html';
    absoluteReader.addAsset(
        _assetId('multiline_template/$templateUrlVal'), '{{greeting}}');
    var output = await _testInline(
        absoluteReader, _assetId('multiline_template/hello.dart'));
    expect(output, isNotNull);
    expect(() => formatter.format(output), returnsNormally);
    expect(output, contains("r'''{{greeting}}'''"));
    expect(output, contains('template: _template0\n'));
  });

  test('should maintain line numbers when replacing values', () async {
    // Regression test for https://github.com/angular/angular/issues/5281
    final templateUrlVal =
        'supersupersupersupersupersupersupersupersupersupersupersuper'
        'superlongtemplate.html';
    final t1Styles = '.body { color: green; }';
    final t2Styles = '.div { color: red; }';
    absoluteReader.addAsset(
        _assetId('multiline_template/$templateUrlVal'), '{{greeting}}');
    absoluteReader.addAsset(
        _assetId('multiline_template/pretty_longish_template.css'), t1Styles);
    absoluteReader.addAsset(
        _assetId('multiline_template/other_pretty_longish_template.css'),
        t2Styles);
    var output = await _testInline(
        absoluteReader, _assetId('multiline_template/hello.dart'));
    expect(output, isNotNull);
    expect(() => formatter.format(output), returnsNormally);
    expect(output, contains("r'''{{greeting}}'''"));
    expect(output, contains("r'''$t1Styles'''"));
    expect(output, contains("r'''$t2Styles'''"));

    final splitter = const LineSplitter();
    final inputLines =
        splitter.convert(_readFile('multiline_template/hello.dart'));
    final outputLines = splitter.convert(output);

    expect(outputLines.indexOf('class HelloCmp {}'),
        equals(inputLines.indexOf('class HelloCmp {}')));
  });
}

void endToEndTests() {
  _runAbsoluteUrlEndToEndTest();
  _runMultiStylesEndToEndTest();
}

Future<String> _testInline(AssetReader reader, AssetId assetId) {
  return zone.exec(() => inline(reader, assetId, annotationMatcher),
      log: new RecordingLogger());
}

AssetId _assetId(String path) => new AssetId('a', 'inliner_for_test/$path');

void _runAbsoluteUrlEndToEndTest() {
  var options = new TransformerOptions([], inlineViews: true, formatCode: true);
  InlinerForTest transformer = new InlinerForTest(options);
  var inputMap = {
    'a|absolute_url_expression_files/hello.dart':
        _readFile('absolute_url_expression_files/hello.dart'),
    'other_package|lib/template.css':
        _readFile('absolute_url_expression_files/template.css'),
    'other_package|lib/template.html':
        _readFile('absolute_url_expression_files/template.html')
  };
  var outputMap = {
    'a|absolute_url_expression_files/hello.dart':
        _readFile('absolute_url_expression_files/expected/hello.dart')
  };
  testPhases(
      'Inliner For Test should inline `templateUrl` and `styleUrls` values '
      'expressed as absolute urls',
      [
        [transformer]
      ],
      inputMap,
      outputMap);
}

void _runMultiStylesEndToEndTest() {
  var options = new TransformerOptions([], inlineViews: true, formatCode: true);
  InlinerForTest transformer = new InlinerForTest(options);
  var inputMap = {
    'pkg|web/hello.dart': _readFile('multiple_style_urls_files/hello.dart'),
    'pkg|web/template.css': _readFile('multiple_style_urls_files/template.css'),
    'pkg|web/template_other.css':
        _readFile('multiple_style_urls_files/template_other.css'),
    'pkg|web/template.html':
        _readFile('multiple_style_urls_files/template.html')
  };
  var outputMap = {
    'pkg|web/hello.dart':
        _readFile('multiple_style_urls_files/expected/hello.dart')
  };
  testPhases(
      'Inliner For Test should inline `templateUrl` and `styleUrls` values '
      'expressed as relative urls',
      [
        [transformer]
      ],
      inputMap,
      outputMap);
}

/// Smooths over differences in CWD between IDEs and running tests in Travis.
String _readFile(String path) {
  var code = readFile('inliner_for_test/$path');
  if (path.endsWith('.dart')) {
    code = formatter.format(code);
  }
  return code;
}
