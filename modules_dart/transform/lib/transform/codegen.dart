library angular2.transform.codegen.dart;

import 'package:barback/barback.dart';
import 'package:dart_style/dart_style.dart';

import 'package:angular2/src/transform/common/eager_transformer_wrapper.dart';
import 'package:angular2/src/transform/common/formatter.dart' as formatter;
import 'package:angular2/src/transform/common/options.dart';
import 'package:angular2/src/transform/common/options_reader.dart';
import 'package:angular2/src/transform/directive_metadata_linker/transformer.dart';
import 'package:angular2/src/transform/directive_processor/transformer.dart';
import 'package:angular2/src/transform/inliner_for_test/transformer.dart';
import 'package:angular2/src/transform/stylesheet_compiler/transformer.dart';
import 'package:angular2/src/transform/template_compiler/transformer.dart';

export 'package:angular2/src/transform/common/options.dart';

/// Generates code to replace mirror use in Angular 2 apps.
///
/// This transformer can be used along with others as a faster alternative to
/// the single angular2 transformer.
///
/// See [the wiki][] for details.
///
/// [the wiki]: https://github.com/angular/angular/wiki/Angular-2-Dart-Transformer
class CodegenTransformer extends TransformerGroup {
  CodegenTransformer._(phases, {bool formatCode: false}) : super(phases) {
    if (formatCode) {
      formatter.init(new DartFormatter());
    }
  }

  factory CodegenTransformer(TransformerOptions options) {
    var phases;
    if (options.inlineViews) {
      phases = [
        [new InlinerForTest(options)]
      ];
    } else {
      phases = [
        [new DirectiveProcessor(options)],
        [new DirectiveMetadataLinker(options)],
        [new StylesheetCompiler(), new TemplateCompiler(options),],
      ];
    }
    if (options.modeName == BarbackMode.RELEASE || !options.lazyTransformers) {
      phases = phases
          .map((phase) => phase.map((t) => new EagerTransformerWrapper(t)));
    }
    return new CodegenTransformer._(phases, formatCode: options.formatCode);
  }

  factory CodegenTransformer.asPlugin(BarbackSettings settings) {
    return new CodegenTransformer(parseBarbackSettings(settings));
  }
}
