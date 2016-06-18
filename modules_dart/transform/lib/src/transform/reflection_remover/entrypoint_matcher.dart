library angular2.transform.reflection_remover.entrypoint_matcher;

import 'package:analyzer/analyzer.dart';
import 'package:barback/barback.dart';

import 'package:angular2/src/transform/common/annotation_matcher.dart';
import 'package:angular2/src/transform/common/naive_eval.dart';

/// Determines if a [FunctionDeclaration] or [MethodDeclaration] is an
/// `AngularEntrypoint`.
class EntrypointMatcher {
  final AssetId _assetId;
  final AnnotationMatcher _annotationMatcher;

  EntrypointMatcher(this._assetId, this._annotationMatcher) {
    if (_assetId == null) {
      throw new ArgumentError.notNull('AssetId');
    }
    if (_annotationMatcher == null) {
      throw new ArgumentError.notNull('AnnotationMatcher');
    }
  }

  bool isEntrypoint(AnnotatedNode node) {
    if (node == null ||
        (node is! FunctionDeclaration && node is! MethodDeclaration)) {
      return false;
    }
    return node.metadata
        .any((a) => _annotationMatcher.isEntrypoint(a, _assetId));
  }

  /// Gets the name assigned to the `AngularEntrypoint`.
  ///
  /// This method assumes the name is the first argument to `AngularEntrypoint`;
  String getName(AnnotatedNode node) {
    final annotation = node.metadata.firstWhere(
        (a) => _annotationMatcher.isEntrypoint(a, _assetId),
        orElse: () => null);
    if (annotation == null) return null;
    if (annotation.arguments == null ||
        annotation.arguments.arguments == null ||
        annotation.arguments.arguments.isEmpty) {
      return _defaultEntrypointName;
    }
    final entryPointName = naiveEval(annotation.arguments.arguments.first);
    if (entryPointName == NOT_A_CONSTANT) {
      throw new ArgumentError(
          'Could not evaluate "${node}" as parameter to @AngularEntrypoint');
    }
    if (entryPointName is! String) {
      throw new ArgumentError('Unexpected type "${entryPointName.runtimeType}" '
          'as first parameter to @AngularEntrypoint');
    }
    return entryPointName;
  }
}

const _defaultEntrypointName = "(no name provided)";
