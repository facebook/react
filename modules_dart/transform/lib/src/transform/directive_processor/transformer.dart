library angular2.transform.directive_processor.transformer;

import 'dart:async';
import 'dart:convert';

import 'package:barback/barback.dart';

import 'package:angular2/src/platform/server/html_adapter.dart';
import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/names.dart';
import 'package:angular2/src/transform/common/options.dart';
import 'package:angular2/src/transform/common/zone.dart' as zone;

import 'rewriter.dart';

/// Transformer responsible for processing all .dart assets and creating
/// .ng_summary.json files which summarize those assets.
///
/// See `angular2/src/transform/common/ng_meta.dart` for the structure of these
/// output files.
///
/// This transformer is part of a multi-phase transform.
/// See `angular2/src/transform/transformer.dart` for transformer ordering.
class DirectiveProcessor extends Transformer implements LazyTransformer {
  final TransformerOptions options;
  final _encoder = const JsonEncoder.withIndent('  ');

  DirectiveProcessor(this.options);

  @override
  bool isPrimary(AssetId id) =>
      id.extension.endsWith('dart') && !isGenerated(id.path);

  @override
  declareOutputs(DeclaringTransform transform) {
    transform.declareOutput(_deferredAssetId(transform.primaryId));
    transform.declareOutput(_ngSummaryAssetId(transform.primaryId));
  }

  @override
  Future apply(Transform transform) async {
    Html5LibDomAdapter.makeCurrent();
    return zone.exec(() async {
      var primaryId = transform.primaryInput.id;
      var reader = new AssetReader.fromTransform(transform);
      var ngMeta =
          await createNgMeta(reader, primaryId, options.annotationMatcher);
      if (ngMeta == null || ngMeta.isEmpty) {
        return;
      }
      transform.addOutput(new Asset.fromString(
          _ngSummaryAssetId(primaryId), _encoder.convert(ngMeta.toJson())));

      var deferredCount = 0;
      if (ngMeta.ngDeps != null) {
        deferredCount = ngMeta.ngDeps.imports.where((i) => i.isDeferred).length;
      }
      if (deferredCount > 0) {
        // The existence of this file with the value != "0" signals
        // DeferredRewriter that the associated .dart file needs attention.
        transform.addOutput(new Asset.fromString(
            _deferredAssetId(primaryId), deferredCount.toString()));
      }
    }, log: transform.logger);
  }
}

AssetId _ngSummaryAssetId(AssetId primaryInputId) {
  return new AssetId(
      primaryInputId.package, toSummaryExtension(primaryInputId.path));
}

AssetId _deferredAssetId(AssetId primaryInputId) {
  return new AssetId(
      primaryInputId.package, toDeferredExtension(primaryInputId.path));
}
