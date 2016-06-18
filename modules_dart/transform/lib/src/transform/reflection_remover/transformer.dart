library angular2.transform.reflection_remover.transformer;

import 'dart:async';

import 'package:barback/barback.dart';

import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/mirror_mode.dart';
import 'package:angular2/src/transform/common/names.dart';
import 'package:angular2/src/transform/common/options.dart';
import 'package:angular2/src/transform/common/options_reader.dart';
import 'package:angular2/src/transform/common/zone.dart' as zone;

import 'remove_reflection_capabilities.dart';

/// Transformer responsible for removing the import and instantiation of
/// {@link ReflectionCapabilities}.
///
/// The goal of this is to break the app's dependency on dart:mirrors.
///
/// This transformer assumes that {@link DirectiveProcessor} and {@link DirectiveLinker}
/// have already been run and that a .ngfactory.dart file has been generated for
/// {@link options.entryPoint}. The instantiation of {@link ReflectionCapabilities} is
/// replaced by calling `initReflector` in that .ngfactory.dart file.
class ReflectionRemover extends Transformer implements LazyTransformer {
  final TransformerOptions options;

  ReflectionRemover(this.options);

  /// Ctor which tells pub that this can be run as a standalone transformer.
  factory ReflectionRemover.asPlugin(BarbackSettings settings) =>
      new ReflectionRemover(parseBarbackSettings(settings));

  @override
  bool isPrimary(AssetId id) =>
      options.entryPointGlobs != null &&
      options.entryPointGlobs.any((g) => g.matches(id.path));

  @override
  declareOutputs(DeclaringTransform transform) {
    transform.declareOutput(transform.primaryId);
  }

  @override
  Future apply(Transform transform) async {
    return zone.exec(() async {
      var primaryId = transform.primaryInput.id;
      var mirrorMode = options.mirrorMode;
      var writeStaticInit = options.initReflector;
      if (options.modeName == TRANSFORM_DYNAMIC_MODE) {
        mirrorMode = MirrorMode.debug;
        writeStaticInit = false;
        zone.log.info(
            'Running in "${options.modeName}", '
            'mirrorMode: ${mirrorMode}, '
            'writeStaticInit: ${writeStaticInit}.',
            asset: primaryId);
      }

      var transformedCode = await removeReflectionCapabilities(
          new AssetReader.fromTransform(transform),
          primaryId,
          options.annotationMatcher,
          mirrorMode: mirrorMode,
          writeStaticInit: writeStaticInit);
      transform.addOutput(new Asset.fromString(primaryId, transformedCode));
    }, log: transform.logger);
  }
}
