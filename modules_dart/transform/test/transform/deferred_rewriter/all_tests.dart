library angular2.test.transform.deferred_rewriter.all_tests;

import 'package:barback/barback.dart';
import 'package:dart_style/dart_style.dart';
import 'package:path/path.dart' as path;
import 'package:test/test.dart';

import 'package:angular2/src/transform/common/zone.dart' as zone;
import 'package:angular2/src/transform/deferred_rewriter/transformer.dart';

import '../common/read_file.dart';
import '../common/recording_logger.dart';

var formatter = new DartFormatter();

main() {
  allTests();
}

void allTests() {
  _testRewriteDeferredLibraries(
      'should return null when no deferred libraries found.',
      'no_deferred_libraries/index.dart');
  _testRewriteDeferredLibraries(
      'should return null when deferred libraries with no ng_deps.',
      'no_ng_deps_libraries/index.dart');
  _testRewriteDeferredLibraries(
      'should rewrite deferred libraries with ng_deps.',
      'simple_deferred_example/index.dart');
  _testRewriteDeferredLibraries(
      'should not rewrite deferred libraries without ng_deps.',
      'deferred_example_no_ng_deps/index.dart');
  _testRewriteDeferredLibraries(
      'should rewrite deferred libraries with ng_deps leave other deferred library alone.',
      'complex_deferred_example/index.dart');
}

void _testRewriteDeferredLibraries(String name, String inputPath) {
  test(name, () {
    return zone.exec(() async {
      var inputId = _assetIdForPath(inputPath);
      var reader = new TestAssetReader();
      var expectedPath = path.join(
          path.dirname(inputPath), 'expected', path.basename(inputPath));
      var expectedId = _assetIdForPath(expectedPath);

      var actualOutput = await rewriteDeferredLibraries(reader, inputId);
      var expectedOutput = await reader.readAsString(expectedId);
      if (expectedOutput == null) {
        // Null expectedOutput signals no output. Ensure that is true.
        expect(actualOutput, isNull);
      } else {
        expect(actualOutput, isNotNull);
        expect(formatter.format(actualOutput),
            equals(formatter.format(expectedOutput)));
      }
    }, log: new RecordingLogger());
  });
}

AssetId _assetIdForPath(String path) =>
    new AssetId('angular2', 'test/transform/deferred_rewriter/$path');
