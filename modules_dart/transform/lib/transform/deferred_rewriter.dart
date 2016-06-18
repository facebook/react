library angular2.transform.deferred_rewriter.dart;

import 'dart:async';

import 'package:barback/barback.dart';

import 'package:angular2/src/transform/deferred_rewriter/transformer.dart'
    as base show DeferredRewriter;

// TODO(kegluneq): Make this a TransformerGroup and add an AggregateTransformer
// that counts the number of transformed files & primary inputs.
// If the number of primary inputs is >> transformed files, output an error
// telling the user to use $include or $exclude in their pubspec.

/// Rewrites `deferred` imports that need Angular 2 initialization.
///
/// This transformer can be used along with others as a faster alternative to
/// the single angular2 transformer.
///
/// See [the wiki][] for details.
///
/// [the wiki]: https://github.com/angular/angular/wiki/Angular-2-Dart-Transformer
class DeferredRewriter extends Transformer implements DeclaringTransformer {
  final base.DeferredRewriter _impl;

  /// Ctor which tells pub that this can be run as a standalone transformer.
  DeferredRewriter.asPlugin(BarbackSettings _)
      : _impl = new base.DeferredRewriter();

  /// Signal that we process all .dart files.
  ///
  /// Instead, use the standard, built-in $exclude and $include transformer
  /// parameters to control which files this transformer runs on.
  /// See [https://www.dartlang.org/tools/pub/assets-and-transformers.html] for
  /// details.
  @override
  String get allowedExtensions => '.dart';

  @override
  declareOutputs(transform) => _impl.declareOutputs(transform);

  @override
  Future apply(transform) =>
      _impl.applyImpl(transform, transform.primaryInput.id);
}
