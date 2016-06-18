library angular2.transform.template_compiler.xhr_impl;

import 'dart:async';
import 'package:angular2/src/compiler/xhr.dart' show XHR;
import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/logging.dart';
import 'package:angular2/src/transform/common/url_resolver.dart';

/// Transformer-specific implementation of XHR that is backed by an
/// [AssetReader].
///
/// This implementation expects urls using the asset: scheme.
/// See [src/transform/common/url_resolver.dart] for a way to convert package:
/// and relative urls to asset: urls.
class XhrImpl implements XHR {
  final AssetReader _reader;

  XhrImpl(this._reader);

  Future<String> get(String url) async {
    final assetId = fromUri(url);
    if (!url.startsWith('asset:')) {
      log.warning('XhrImpl received unexpected url: $url');
    }

    if (!await _reader.hasInput(assetId)) {
      throw new ArgumentError.value('Could not read asset at uri $url', 'url');
    }
    return _reader.readAsString(assetId);
  }
}
