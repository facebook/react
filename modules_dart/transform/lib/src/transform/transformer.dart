library angular2.src.transform.transformer;

import 'package:barback/barback.dart';
import 'package:dart_style/dart_style.dart';

import 'common/eager_transformer_wrapper.dart';
import 'common/formatter.dart' as formatter;
import 'common/options.dart';
import 'common/options_reader.dart';
import 'deferred_rewriter/transformer.dart';
import 'directive_metadata_linker/transformer.dart';
import 'directive_processor/transformer.dart';
import 'inliner_for_test/transformer.dart';
import 'reflection_remover/transformer.dart';
import 'stylesheet_compiler/transformer.dart';
import 'template_compiler/transformer.dart';

export 'common/options.dart';

/// Replaces Angular 2 mirror use with generated code.
class AngularTransformerGroup extends TransformerGroup {
  AngularTransformerGroup._(phases, {bool formatCode: false}) : super(phases) {
    if (formatCode) {
      formatter.init(new DartFormatter());
    }
  }

  factory AngularTransformerGroup(TransformerOptions options) {
    var phases;
    if (options.inlineViews) {
      phases = [
        [new InlinerForTest(options)]
      ];
    } else {
      phases = [
        [new DirectiveProcessor(options)],
        [new DirectiveMetadataLinker(options)],
        [new ReflectionRemover(options)],
        [
          new DeferredRewriter(),
          new StylesheetCompiler(),
          new TemplateCompiler(options)
        ],
      ];
    }
    if (options.modeName == BarbackMode.RELEASE || !options.lazyTransformers) {
      phases = phases
          .map((phase) => phase.map((t) => new EagerTransformerWrapper(t)));
    }
    return new AngularTransformerGroup._(phases,
        formatCode: options.formatCode);
  }

  factory AngularTransformerGroup.asPlugin(BarbackSettings settings) {
    return new AngularTransformerGroup(parseBarbackSettings(settings));
  }
}
