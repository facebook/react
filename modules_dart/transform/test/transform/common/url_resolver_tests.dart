library angular2.test.transform.common.url_resolver_tests;

import 'package:barback/barback.dart';
import 'package:test/test.dart';

import 'package:angular2/src/transform/common/url_resolver.dart';

main() => allTests();

void allTests() {
  var urlResolver = createOfflineCompileUrlResolver();

  group('toAssetUri', () {
    test('should convert `AssetId`s to asset: uris', () {
      var assetId = new AssetId('test_package', 'lib/src/impl.dart');
      expect(
          toAssetUri(assetId), equals('asset:test_package/lib/src/impl.dart'));
    });

    test('should throw if passed a null AssetId', () {
      expect(() => toAssetUri(null), throwsArgumentError);
    });
  });

  group('fromUri', () {
    test('should convert asset: `uri`s to `AssetId`s', () {
      expect(fromUri('asset:test_package/lib/src/impl.dart'),
          equals(new AssetId('test_package', 'lib/src/impl.dart')));
    });

    test('should convert package: `uri`s to `AssetId`s', () {
      expect(fromUri('package:test_package/src/impl.dart'),
          equals(new AssetId('test_package', 'lib/src/impl.dart')));
    });

    test('should throw if passed a null uri', () {
      expect(() => fromUri(null), throwsArgumentError);
    });

    test('should throw if passed an empty uri', () {
      expect(() => fromUri(''), throwsArgumentError);
    });
  });

  group('isDartCoreUri', () {
    test('should detect dart: uris', () {
      expect(isDartCoreUri('dart:core'), isTrue);
      expect(isDartCoreUri('dart:convert'), isTrue);
      expect(isDartCoreUri('package:angular2/angular2.dart'), isFalse);
      expect(isDartCoreUri('asset:angular2/lib/angular2.dart'), isFalse);
    });

    test('should throw if passed a null uri', () {
      expect(() => isDartCoreUri(null), throwsArgumentError);
    });

    test('should throw if passed an empty uri', () {
      expect(() => isDartCoreUri(''), throwsArgumentError);
    });
  });

  group('toAssetScheme', () {
    test('should throw for relative `Uri`s', () {
      expect(() => toAssetScheme(Uri.parse('/lib/src/file.dart')),
          throwsArgumentError);
    });

    test('should convert package: `Uri`s to asset:', () {
      expect(toAssetScheme(Uri.parse('package:angular2/angular2.dart')),
          equals(Uri.parse('asset:angular2/lib/angular2.dart')));
    });

    test('should throw for package: `Uri`s which are too short', () {
      expect(() => toAssetScheme(Uri.parse('package:angular2')),
          throwsFormatException);
    });

    test('should convert asset: `Uri`s to asset:', () {
      expect(toAssetScheme(Uri.parse('asset:angular2/lib/angular2.dart')),
          equals(Uri.parse('asset:angular2/lib/angular2.dart')));
    });

    test('should throw for asset: `Uri`s which are too short', () {
      expect(() => toAssetScheme(Uri.parse('asset:angular2')),
          throwsFormatException);

      expect(() => toAssetScheme(Uri.parse('asset:angular2/lib')),
          throwsFormatException);
    });

    test('should pass through unsupported schemes', () {
      var uri = 'http://server.com/style.css';
      expect('${toAssetScheme(Uri.parse(uri))}', equals(uri));
    });

    test('should throw if passed a null uri', () {
      expect(() => toAssetScheme(null), throwsArgumentError);
    });
  });

  group('resolve', () {
    test('should resolve package: uris to asset: uris', () {
      expect(urlResolver.resolve('', 'package:angular2/angular2.dart'),
          equals('asset:angular2/lib/angular2.dart'));
    });

    test('should ignore baseUrl for absolute uris', () {
      expect(urlResolver.resolve(null, 'package:angular2/angular2.dart'),
          equals('asset:angular2/lib/angular2.dart'));
      expect(urlResolver.resolve(null, 'asset:angular2/lib/angular2.dart'),
          equals('asset:angular2/lib/angular2.dart'));
    });

    test('should resolve asset: uris to asset: uris', () {
      expect(urlResolver.resolve('', 'asset:angular2/lib/angular2.dart'),
          equals('asset:angular2/lib/angular2.dart'));
    });

    test('should resolve relative uris when baseUrl is package: uri', () {
      expect(
          urlResolver.resolve('package:angular2/angular2.dart',
              'src/transform/transformer.dart'),
          equals('asset:angular2/lib/src/transform/transformer.dart'));
    });

    test('should resolve relative uris when baseUrl is asset: uri', () {
      expect(
          urlResolver.resolve('asset:angular2/lib/angular2.dart',
              'src/transform/transformer.dart'),
          equals('asset:angular2/lib/src/transform/transformer.dart'));
    });

    test('should normalize uris', () {
      expect(
          urlResolver.resolve('asset:angular2/lib/angular2.dart',
              'src/transform/../transform/transformer.dart'),
          equals('asset:angular2/lib/src/transform/transformer.dart'));
      expect(
          urlResolver.resolve('asset:angular2/lib/src/../angular2.dart',
              'src/transform/transformer.dart'),
          equals('asset:angular2/lib/src/transform/transformer.dart'));
    });

    test('should gracefully handle an empty uri', () {
      expect(urlResolver.resolve('package:angular2/angular2.dart', ''),
          equals('asset:angular2/lib/angular2.dart'));
    });
  });
}
