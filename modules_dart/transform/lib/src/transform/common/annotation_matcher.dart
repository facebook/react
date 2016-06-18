library angular2.transform.common.annotation_matcher;

import 'package:analyzer/src/generated/ast.dart';
import 'package:barback/barback.dart' show AssetId;
import 'class_matcher_base.dart';

export 'class_matcher_base.dart' show ClassDescriptor;

/// [ClassDescriptor]s for the default angular annotations that can appear
/// on a class. These classes are re-exported in many places so this covers all
/// the possible libraries which could provide them.
const _INJECTABLES = const [
  const ClassDescriptor(
      'Injectable', 'package:angular2/src/core/di/decorators.dart'),
  const ClassDescriptor('Injectable', 'package:angular2/core.dart'),
  const ClassDescriptor('Injectable', 'package:angular2/src/core/di.dart'),
  const ClassDescriptor('Injectable', 'package:angular2/angular2.dart'),
  const ClassDescriptor(
      'Injectable', 'package:angular2/web_worker/worker.dart'),
];

const _DIRECTIVES = const [
  const ClassDescriptor(
      'Directive', 'package:angular2/src/core/metadata/directive.dart',
      superClass: 'Injectable'),
  const ClassDescriptor('Directive', 'package:angular2/src/core/metadata.dart',
      superClass: 'Injectable'),
  const ClassDescriptor('Directive', 'package:angular2/angular2.dart',
      superClass: 'Injectable'),
  const ClassDescriptor('Directive', 'package:angular2/core.dart',
      superClass: 'Injectable'),
  const ClassDescriptor('Directive', 'package:angular2/web_worker/worker.dart',
      superClass: 'Injectable'),
];

const _COMPONENTS = const [
  const ClassDescriptor(
      'Component', 'package:angular2/src/core/metadata/directive.dart',
      superClass: 'Directive'),
  const ClassDescriptor('Component', 'package:angular2/src/core/metadata.dart',
      superClass: 'Directive'),
  const ClassDescriptor('Component', 'package:angular2/angular2.dart',
      superClass: 'Directive'),
  const ClassDescriptor('Component', 'package:angular2/core.dart',
      superClass: 'Directive'),
  const ClassDescriptor('Component', 'package:angular2/web_worker/worker.dart',
      superClass: 'Directive'),
];

const _PIPES = const [
  const ClassDescriptor(
      'Pipe', 'package:angular2/src/core/metadata/directive.dart',
      superClass: 'Injectable'),
  const ClassDescriptor('Pipe', 'package:angular2/src/core/metadata.dart',
      superClass: 'Injectable'),
  const ClassDescriptor('Pipe', 'package:angular2/angular2.dart',
      superClass: 'Injectable'),
  const ClassDescriptor('Pipe', 'package:angular2/core.dart',
      superClass: 'Injectable'),
  const ClassDescriptor('Pipe', 'package:angular2/web_worker/worker.dart',
      superClass: 'Injectable'),
];

const _VIEWS = const [
  const ClassDescriptor('View', 'package:angular2/angular2.dart'),
  const ClassDescriptor('View', 'package:angular2/web_worker/worker.dart'),
  const ClassDescriptor('View', 'package:angular2/core.dart'),
  const ClassDescriptor('View', 'package:angular2/src/core/metadata/view.dart'),
  const ClassDescriptor('View', 'package:angular2/src/core/metadata.dart'),
];

const _ENTRYPOINTS = const [
  const ClassDescriptor('AngularEntrypoint', 'package:angular2/angular2.dart'),
  const ClassDescriptor('AngularEntrypoint', 'package:angular2/core.dart'),
  const ClassDescriptor(
      'AngularEntrypoint', 'package:angular2/platform/browser.dart'),
  const ClassDescriptor(
      'AngularEntrypoint', 'package:angular2/platform/worker_app.dart'),
  const ClassDescriptor(
      'AngularEntrypoint', 'package:angular2/platform/browser_static.dart'),
  const ClassDescriptor(
      'AngularEntrypoint', 'package:angular2/src/core/angular_entrypoint.dart'),
];

/// Checks if a given [Annotation] matches any of the given
/// [ClassDescriptors].
class AnnotationMatcher extends ClassMatcherBase {
  AnnotationMatcher._(classDescriptors) : super(classDescriptors);

  factory AnnotationMatcher() {
    return new AnnotationMatcher._([]
      ..addAll(_COMPONENTS)
      ..addAll(_DIRECTIVES)
      ..addAll(_PIPES)
      ..addAll(_INJECTABLES)
      ..addAll(_VIEWS)
      ..addAll(_ENTRYPOINTS));
  }

  bool _implementsWithWarning(Annotation annotation, AssetId assetId,
      List<ClassDescriptor> interfaces) {
    ClassDescriptor descriptor = firstMatch(annotation.name, assetId);
    if (descriptor == null) return false;
    return implements(descriptor, interfaces,
        missingSuperClassWarning:
            'Missing `custom_annotation` entry for `${descriptor.superClass}`.');
  }

  /// Checks if an [Annotation] node implements [Injectable].
  bool isInjectable(Annotation annotation, AssetId assetId) =>
      _implementsWithWarning(annotation, assetId, _INJECTABLES);

  /// Checks if an [Annotation] node implements [Directive].
  bool isDirective(Annotation annotation, AssetId assetId) =>
      _implementsWithWarning(annotation, assetId, _DIRECTIVES);

  /// Checks if an [Annotation] node implements [Component].
  bool isComponent(Annotation annotation, AssetId assetId) =>
      _implementsWithWarning(annotation, assetId, _COMPONENTS);

  /// Checks if an [Annotation] node implements [View].
  bool isView(Annotation annotation, AssetId assetId) =>
      _implementsWithWarning(annotation, assetId, _VIEWS);

  /// Checks if an [Annotation] node implements [Pipe].
  bool isPipe(Annotation annotation, AssetId assetId) =>
      _implementsWithWarning(annotation, assetId, _PIPES);

  /// Checks if an [Annotation] node implements [AngularEntrypoint]
  bool isEntrypoint(Annotation annotation, AssetId assetId) =>
      _implementsWithWarning(annotation, assetId, _ENTRYPOINTS);
}
