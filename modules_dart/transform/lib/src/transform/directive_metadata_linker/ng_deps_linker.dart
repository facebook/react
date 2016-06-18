library angular2.transform.directive_metadata_linker.ng_deps_linker;

import 'dart:async';

import 'package:angular2/compiler.dart' show UrlResolver;
import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/logging.dart';
import 'package:angular2/src/transform/common/names.dart';
import 'package:angular2/src/transform/common/model/import_export_model.pb.dart';
import 'package:angular2/src/transform/common/model/ng_deps_model.pb.dart';
import 'package:angular2/src/transform/common/url_resolver.dart';
import 'package:barback/barback.dart';

/// Modifies the [NgDepsModel] represented by `entryPoint` to import its
/// dependencies' associated, generated files.
///
/// For example, if entry_point.dart imports dependency.dart, this will check if
/// dependency.ng_meta.json exists. If it does, we add an entry to the
/// `depImports` of [NgDepsModel] for dependency.ngfactory.dart.
///
/// We use this information later to ensure that each file's dependencies are
/// initialized when that file is initialized.
Future<NgDepsModel> linkNgDeps(NgDepsModel ngDepsModel, AssetReader reader,
    AssetId assetId, UrlResolver resolver) async {
  if (ngDepsModel == null) return null;
  return logElapsedAsync(() async {
    var linkedDepsMap =
        await _processNgImports(ngDepsModel, reader, assetId, resolver);

    if (linkedDepsMap.isEmpty) {
      // We are not calling `initReflector` on any other libraries, but we still
      // return the model to ensure it is written to code.
      return ngDepsModel;
    }

    final seen = new Set<String>();
    var idx = 0;
    final allDeps = [ngDepsModel.imports, ngDepsModel.exports].expand((e) => e);
    for (var dep in allDeps) {
      if (linkedDepsMap.containsKey(dep.uri) && !seen.contains(dep.uri)) {
        seen.add(dep.uri);
        var linkedModel = new ImportModel()
          ..uri = toTemplateExtension(dep.uri)
          ..prefix = 'i${idx++}';
        // TODO(kegluneq): Preserve combinators?
        ngDepsModel.depImports.add(linkedModel);
      }
    }
    return ngDepsModel;
  }, operationName: 'linkNgDeps', assetId: assetId);
}

bool _isNotDartDirective(dynamic model) => !isDartCoreUri(model.uri);

/// Maps the `uri` of each input [ImportModel] or [ExportModel] to its
/// associated `.ng_deps.json` file, if one exists.
Future<Map<String, String>> _processNgImports(NgDepsModel model,
    AssetReader reader, AssetId assetId, UrlResolver resolver) async {
  final importsAndExports =
      new List.from(model.imports.where((i) => !i.isDeferred))
        ..addAll(model.exports);
  final retVal = <String, String>{};
  final assetUri = toAssetUri(assetId);
  return Future
      .wait(
          importsAndExports.where(_isNotDartDirective).map((dynamic directive) {
        // Check whether the import or export generated summary NgMeta information.
        final summaryJsonUri =
            resolver.resolve(assetUri, toSummaryExtension(directive.uri));
        return reader.hasInput(fromUri(summaryJsonUri)).then((hasInput) {
          if (hasInput) {
            retVal[directive.uri] = summaryJsonUri;
          }
        }, onError: (err, stack) {
          log.warning(
              'Error while looking for $summaryJsonUri. '
              'Message: $err\n'
              'Stack: $stack',
              asset: assetId);
        });
      }))
      .then((_) => retVal);
}
