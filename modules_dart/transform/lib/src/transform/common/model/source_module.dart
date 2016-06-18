library angular2.transform.common.model.source_module;

import 'package:path/path.dart' as path;

import 'package:angular2/src/transform/common/url_resolver.dart';

import 'import_export_model.pb.dart';

/// Generates an [ImportModel] for the file specified by `importPath`.
///
/// If `fromAbsolute` is specified, `importPath` may be a relative path,
/// otherwise it is expected to be absolute.
ImportModel toImportModel(String importPath,
    {String prefix, String fromAbsolute}) {
  var urlResolver = createOfflineCompileUrlResolver();
  var codegenImportPath;

  var importUri =
      toAssetScheme(Uri.parse(urlResolver.resolve(fromAbsolute, importPath)));
  if (_canPackageImport(importUri) ||
      fromAbsolute == null ||
      fromAbsolute.isEmpty) {
    codegenImportPath = _toPackageImport(importUri);
  } else {
    var moduleUri = toAssetScheme(Uri.parse(fromAbsolute));
    if (_canImportRelative(importUri, from: moduleUri)) {
      codegenImportPath = path.url.relative(importUri.toString(),
          from: path.dirname(moduleUri.toString()));
    } else {
      var errMsg;
      if (fromAbsolute == null || fromAbsolute.isEmpty) {
        errMsg = 'Can only import $importPath using a relative uri';
      } else {
        errMsg = 'Cannot import $importPath from $fromAbsolute';
      }
      throw new FormatException(errMsg, importPath);
    }
  }

  final model = new ImportModel()..uri = codegenImportPath;

  if (prefix != null && prefix.isNotEmpty) {
    model.prefix = prefix;
  }
  return model;
}

// For a relative import, the scheme, first (package) and second (lib|test|web)
// path segments must be equal.
bool _canImportRelative(Uri importUri, {Uri from}) {
  if (importUri == null) throw new ArgumentError.notNull('importUri');
  if (from == null) throw new ArgumentError.notNull('from');
  assert(importUri.scheme == 'asset');
  assert(importUri.pathSegments.length >= 2);
  assert(from.scheme == 'asset');
  assert(from.pathSegments.length >= 2);
  return importUri.pathSegments.first == from.pathSegments.first &&
      importUri.pathSegments[1] == from.pathSegments[1];
}

/// Pub's package scheme assumes that an asset lives under the lib/ directory,
/// so an asset: Uri is package-importable if its second path segment is lib/.
///
/// For a file located at angular2/lib/src/file.dart:
/// - Asset scheme =>  asset:angular2/lib/src/file.dart
/// - Package scheme => package:angular2/src/file.dart
bool _canPackageImport(Uri assetImport) {
  if (assetImport == null) throw new ArgumentError.notNull('assetImport');
  if (!assetImport.isAbsolute || assetImport.scheme != 'asset') {
    throw new ArgumentError.value(assetImport.toString(), 'assetImport',
        'Must be an absolute uri using the asset: scheme');
  }
  return assetImport.pathSegments.length >= 2 &&
      assetImport.pathSegments[1] == 'lib';
}

String _toPackageImport(Uri assetImport) {
  assert(_canPackageImport(assetImport));
  var subPath = assetImport.pathSegments
      .getRange(2, assetImport.pathSegments.length)
      .join('/');
  return 'package:${assetImport.pathSegments.first}/$subPath';
}
