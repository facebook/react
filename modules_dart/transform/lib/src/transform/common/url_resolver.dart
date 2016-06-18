library angular2.transform.template_compiler.url_resolver;

import 'package:barback/barback.dart';

export 'package:angular2/src/compiler/url_resolver.dart' show createOfflineCompileUrlResolver;

String toAssetUri(AssetId assetId) {
  if (assetId == null) throw new ArgumentError.notNull('assetId');
  return 'asset:${assetId.package}/${assetId.path}';
}

AssetId fromUri(String assetUri) {
  if (assetUri == null) throw new ArgumentError.notNull('assetUri');
  if (assetUri.isEmpty)
    throw new ArgumentError.value('(empty string)', 'assetUri');
  var uri = toAssetScheme(Uri.parse(assetUri));
  return new AssetId(
      uri.pathSegments.first, uri.pathSegments.skip(1).join('/'));
}

/// Converts `absoluteUri` to use the 'asset' scheme used in the Angular 2
/// template compiler.
///
/// The `scheme` of `absoluteUri` is expected to be either 'package' or
/// 'asset'.
Uri toAssetScheme(Uri absoluteUri) {
  if (absoluteUri == null) throw new ArgumentError.notNull('absoluteUri');

  if (!absoluteUri.isAbsolute) {
    throw new ArgumentError.value(absoluteUri.toString(), 'absoluteUri',
        'Value passed must be an absolute uri');
  }
  if (absoluteUri.scheme == 'asset') {
    if (absoluteUri.pathSegments.length < 3) {
      throw new FormatException(
          'An asset: URI must have at least 3 path '
          'segments, for example '
          'asset:<package-name>/<first-level-dir>/<path-to-dart-file>.',
          absoluteUri.toString());
    }
    return absoluteUri;
  }
  if (absoluteUri.scheme != 'package') {
    // Pass through URIs with non-package scheme
    return absoluteUri;
  }

  if (absoluteUri.pathSegments.length < 2) {
    throw new FormatException(
        'A package: URI must have at least 2 path '
        'segments, for example '
        'package:<package-name>/<path-to-dart-file>',
        absoluteUri.toString());
  }

  var pathSegments = absoluteUri.pathSegments.toList()..insert(1, 'lib');
  return new Uri(scheme: 'asset', pathSegments: pathSegments);
}

bool isDartCoreUri(String uri) {
  if (uri == null) throw new ArgumentError.notNull('uri');
  if (uri.isEmpty) throw new ArgumentError.value('(empty string)', 'uri');
  return uri.startsWith('dart:');
}
