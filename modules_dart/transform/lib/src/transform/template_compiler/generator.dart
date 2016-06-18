library angular2.transform.template_compiler.generator;

import 'dart:async';

import 'package:barback/barback.dart';

import 'package:angular2/src/compiler/offline_compiler.dart';
import 'package:angular2/src/compiler/config.dart';
import 'package:angular2/src/facade/lang.dart';
import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/logging.dart';
import 'package:angular2/src/transform/common/model/annotation_model.pb.dart';
import 'package:angular2/src/transform/common/model/ng_deps_model.pb.dart';
import 'package:angular2/src/transform/common/names.dart';
import 'package:angular2/src/transform/common/ng_compiler.dart';
import 'package:angular2/src/transform/common/zone.dart' as zone;
import 'package:angular2/i18n.dart';
import 'package:angular2/src/transform/common/options.dart' show CODEGEN_DEBUG_MODE;

import 'compile_data_creator.dart';

/// Generates `.ngfactory.dart` files to initialize the Angular2 system.
///
/// - Processes the `.ng_meta.json` file represented by `assetId` using
///   `createCompileData`.
/// - Passes the resulting `NormalizedComponentWithViewDirectives` instance(s)
///   to the `TemplateCompiler` to generate compiled template(s) as a
///   `SourceModule`.
/// - Uses the resulting `NgDeps` object to generate code which initializes the
///   Angular2 reflective system.
///
/// This method assumes a {@link DomAdapter} has been registered.
Future<Outputs> processTemplates(AssetReader reader, AssetId assetId,
    {String codegenMode: '',
    bool reflectPropertiesAsAttributes: false,
    List<String> platformDirectives,
    List<String> platformPipes,
    XmbDeserializationResult translations,
    Map<String, String> resolvedIdentifiers
    }) async {
  var viewDefResults = await createCompileData(
      reader, assetId, platformDirectives, platformPipes);
  if (viewDefResults == null) return null;
  var templateCompiler = zone.templateCompiler;
  if (templateCompiler == null) {
    templateCompiler = createTemplateCompiler(reader,
        compilerConfig: new CompilerConfig(
            codegenMode == CODEGEN_DEBUG_MODE, reflectPropertiesAsAttributes, false),
            translations: translations);
  }

  final compileData =
      viewDefResults.viewDefinitions.values.toList(growable: false);
  if (compileData.isEmpty) {
    return new Outputs._(viewDefResults.ngMeta.ngDeps, null);
  }

  final compiledTemplates = logElapsedSync(() {
    return templateCompiler.compileTemplates(compileData);
  }, operationName: 'compileTemplates', assetId: assetId);

  if (compiledTemplates != null) {
    // We successfully compiled templates!
    // For each compiled template, add the compiled template class as an
    // "Annotation" on the code to be registered with the reflector.
    for (var reflectable in viewDefResults.viewDefinitions.keys) {
      // TODO(kegluneq): Avoid duplicating naming logic for generated classes.
      reflectable.annotations.add(new AnnotationModel()
        ..name = '${reflectable.name}NgFactory'
        ..isConstObject = true);
    }
  }

  return new Outputs._(viewDefResults.ngMeta.ngDeps, compiledTemplates);
}

AssetId templatesAssetId(AssetId primaryId) =>
    new AssetId(primaryId.package, toTemplateExtension(primaryId.path));

class Outputs {
  final NgDepsModel ngDeps;
  final SourceModule templatesSource;

  Outputs._(this.ngDeps, this.templatesSource);
}
