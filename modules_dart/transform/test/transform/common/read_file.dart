library angular2.test.transform.common.read_file;

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:barback/barback.dart';

/// Smooths over differences in CWD between IDEs and running tests in Travis.
String readFile(String path) {
  for (var myPath in [path, 'test/transform/${path}']) {
    var file = new File(myPath);
    if (file.existsSync()) {
      return file.readAsStringSync();
    }
  }
  return null;
}

class TestAssetReader implements AssetReader {
  /// This allows "faking"
  final Map<AssetId, String> _overrideAssets = <AssetId, String>{};

  Future<String> readAsString(AssetId id, {Encoding encoding}) {
    if (_overrideAssets.containsKey(id)) {
      return new Future.value(_overrideAssets[id]);
    } else {
      return new Future.value(readFile(id.path));
    }
  }

  Future<bool> hasInput(AssetId id) {
    var exists = _overrideAssets.containsKey(id);
    if (exists) return new Future.value(true);

    for (var myPath in [id.path, 'test/transform/${id.path}']) {
      var file = new File(myPath);
      exists = exists || file.existsSync();
    }
    return new Future.value(exists);
  }

  void clear() {
    this._overrideAssets.clear();
  }

  void addAsset(AssetId id, String contents) {
    _overrideAssets[id] = contents;
  }
}
