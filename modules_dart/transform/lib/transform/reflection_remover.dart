library angular2.transform.reflection_remover.dart;

import 'dart:async';

import 'package:barback/barback.dart';

import 'package:angular2/src/transform/common/options.dart';
import 'package:angular2/src/transform/common/options_reader.dart';
import 'package:angular2/src/transform/reflection_remover/transformer.dart'
    as base show ReflectionRemover;

// TODO(kegluneq): Make this a TransformerGroup and add an AggregateTransformer
// that counts the number of transformed files & primary inputs.
// If the number of primary inputs is >> transformed files, output an error
// telling the user to use $include or $exclude in their pubspec.

/// Removes the transitive dart:mirrors import from Angular 2 entrypoints.
///
/// This transformer can be used along with others as a faster alternative to
/// the single angular2 transformer.
///
/// See [the wiki][] for details.
///
/// [the wiki]: https://github.com/angular/angular/wiki/Angular-2-Dart-Transformer
class ReflectionRemover extends Transformer implements DeclaringTransformer {
  final base.ReflectionRemover _impl;

  ReflectionRemover._(this._impl);

  /// Ctor which tells pub that this can be run as a standalone transformer.
  factory ReflectionRemover.asPlugin(BarbackSettings settings) {
    final options = parseBarbackSettings(settings);
    final entryPoints = options.entryPoints;
    if (entryPoints != null && entryPoints.isNotEmpty) {
      // TODO(kegluneq): Add a goo.gl link with more info.
      throw new ArgumentError.value(
          entryPoints.join(', '),
          ENTRY_POINT_PARAM,
          "Do not use '$ENTRY_POINT_PARAM' when specifying the Angular 2 "
          "reflection_remover transformer. Instead, use pub's built-in "
          r"$include and $exclude parameters to filter which files are "
          "processed.");
    }
    return new ReflectionRemover._(new base.ReflectionRemover(options));
  }

  /// Signal that we process all .dart files.
  ///
  /// The underlying ReflectionRemover implementation respects the entry_points
  /// transformer parameter, but this is inefficient and can be expensive for
  /// large numbers of files.
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
  Future apply(transform) => _impl.apply(transform);
}
