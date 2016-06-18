library angular2.transform.common.annotati_ON_matcher;

import 'package:analyzer/src/generated/ast.dart';
import 'package:barback/barback.dart' show AssetId;
import 'class_matcher_base.dart';

export 'class_matcher_base.dart' show ClassDescriptor;

/// [ClassDescriptor]s for the default angular interfaces that may be
/// implemented by a class. These classes are re-exported in many places so this
/// covers all libraries which provide them.
const _ON_CHANGE_INTERFACES = const [
  const ClassDescriptor('OnChanges', 'package:angular2/angular2.dart'),
  const ClassDescriptor('OnChanges', 'package:angular2/lifecycle_hooks.dart'),
  const ClassDescriptor('OnChanges', 'package:angular2/src/core/metadata.dart'),
  const ClassDescriptor('OnChanges', 'package:angular2/core.dart'),
  const ClassDescriptor(
      'OnChanges', 'package:angular2/src/core/src/core/meta/lifecycle_hooks.dart'),
];
const _ON_DESTROY_INTERFACES = const [
  const ClassDescriptor('OnDestroy', 'package:angular2/angular2.dart'),
  const ClassDescriptor('OnDestroy', 'package:angular2/lifecycle_hooks.dart'),
  const ClassDescriptor('OnDestroy', 'package:angular2/src/core/metadata.dart'),
  const ClassDescriptor('OnDestroy', 'package:angular2/core.dart'),
  const ClassDescriptor(
      'OnDestroy', 'package:angular2/src/core/src/core/meta/lifecycle_hooks.dart'),
];
const _DO_CHECK_INTERFACES = const [
  const ClassDescriptor('DoCheck', 'package:angular2/angular2.dart'),
  const ClassDescriptor('DoCheck', 'package:angular2/lifecycle_hooks.dart'),
  const ClassDescriptor('DoCheck', 'package:angular2/src/core/metadata.dart'),
  const ClassDescriptor('DoCheck', 'package:angular2/core.dart'),
  const ClassDescriptor(
      'DoCheck', 'package:angular2/src/core/src/core/meta/lifecycle_hooks.dart'),
];
const _ON_INIT_INTERFACES = const [
  const ClassDescriptor('OnInit', 'package:angular2/angular2.dart'),
  const ClassDescriptor('OnInit', 'package:angular2/lifecycle_hooks.dart'),
  const ClassDescriptor('OnInit', 'package:angular2/src/core/metadata.dart'),
  const ClassDescriptor('OnInit', 'package:angular2/core.dart'),
  const ClassDescriptor(
      'OnInit', 'package:angular2/src/core/src/core/meta/lifecycle_hooks.dart'),
];
const _ON_AFTER_CONTENT_INIT_INTERFACES = const [
  const ClassDescriptor('AfterContentInit', 'package:angular2/angular2.dart'),
  const ClassDescriptor(
      'AfterContentInit', 'package:angular2/lifecycle_hooks.dart'),
  const ClassDescriptor(
      'AfterContentInit', 'package:angular2/src/core/metadata.dart'),
  const ClassDescriptor('AfterContentInit', 'package:angular2/core.dart'),
  const ClassDescriptor(
      'AfterContentInit', 'package:angular2/src/core/src/core/meta/lifecycle_hooks.dart')
];
const _ON_AFTER_CONTENT_CHECKED_INTERFACES = const [
  const ClassDescriptor(
      'AfterContentChecked', 'package:angular2/angular2.dart'),
  const ClassDescriptor(
      'AfterContentChecked', 'package:angular2/lifecycle_hooks.dart'),
  const ClassDescriptor(
      'AfterContentChecked', 'package:angular2/src/core/metadata.dart'),
  const ClassDescriptor('AfterContentChecked', 'package:angular2/core.dart'),
  const ClassDescriptor(
      'AfterContentChecked', 'package:angular2/src/core/src/core/meta/lifecycle_hooks.dart')
];
const _ON_AFTER_VIEW_INIT_INTERFACES = const [
  const ClassDescriptor('AfterViewInit', 'package:angular2/angular2.dart'),
  const ClassDescriptor(
      'AfterViewInit', 'package:angular2/lifecycle_hooks.dart'),
  const ClassDescriptor(
      'AfterViewInit', 'package:angular2/src/core/metadata.dart'),
  const ClassDescriptor('AfterViewInit', 'package:angular2/core.dart'),
  const ClassDescriptor(
      'AfterViewInit', 'package:angular2/src/core/src/core/meta/lifecycle_hooks.dart')
];
const _ON_AFTER_VIEW_CHECKED_INTERFACES = const [
  const ClassDescriptor('AfterViewChecked', 'package:angular2/angular2.dart'),
  const ClassDescriptor(
      'AfterViewChecked', 'package:angular2/lifecycle_hooks.dart'),
  const ClassDescriptor(
      'AfterViewChecked', 'package:angular2/src/core/metadata.dart'),
  const ClassDescriptor('AfterViewChecked', 'package:angular2/core.dart'),
  const ClassDescriptor(
      'AfterViewChecked', 'package:angular2/src/core/src/core/meta/lifecycle_hooks.dart')
];

/// Checks if a given [Annotation] matches any of the given
/// [ClassDescriptors].
class InterfaceMatcher extends ClassMatcherBase {
  InterfaceMatcher._(classDescriptors) : super(classDescriptors);

  factory InterfaceMatcher() {
    return new InterfaceMatcher._([]
      ..addAll(_ON_CHANGE_INTERFACES)
      ..addAll(_ON_DESTROY_INTERFACES)
      ..addAll(_DO_CHECK_INTERFACES)
      ..addAll(_ON_INIT_INTERFACES)
      ..addAll(_ON_AFTER_CONTENT_INIT_INTERFACES)
      ..addAll(_ON_AFTER_CONTENT_CHECKED_INTERFACES)
      ..addAll(_ON_AFTER_VIEW_INIT_INTERFACES)
      ..addAll(_ON_AFTER_VIEW_CHECKED_INTERFACES));
  }

  /// Checks if an [Identifier] implements [OnChanges].
  bool isOnChange(Identifier typeName, AssetId assetId) =>
      implements(firstMatch(typeName, assetId), _ON_CHANGE_INTERFACES);

  /// Checks if an [Identifier] implements [OnDestroy].
  bool isOnDestroy(Identifier typeName, AssetId assetId) =>
      implements(firstMatch(typeName, assetId), _ON_DESTROY_INTERFACES);

  /// Checks if an [Identifier] implements [DoCheck].
  bool isDoCheck(Identifier typeName, AssetId assetId) =>
      implements(firstMatch(typeName, assetId), _DO_CHECK_INTERFACES);

  /// Checks if an [Identifier] implements [OnInit].
  bool isOnInit(Identifier typeName, AssetId assetId) =>
      implements(firstMatch(typeName, assetId), _ON_INIT_INTERFACES);

  /// Checks if an [Identifier] implements [AfterContentInit].
  bool isAfterContentInit(Identifier typeName, AssetId assetId) => implements(
      firstMatch(typeName, assetId), _ON_AFTER_CONTENT_INIT_INTERFACES);

  /// Checks if an [Identifier] implements [AfterContentChecked].
  bool isAfterContentChecked(Identifier typeName, AssetId assetId) =>
      implements(
          firstMatch(typeName, assetId), _ON_AFTER_CONTENT_CHECKED_INTERFACES);

  /// Checks if an [Identifier] implements [AfterViewInit].
  bool isAfterViewInit(Identifier typeName, AssetId assetId) =>
      implements(firstMatch(typeName, assetId), _ON_AFTER_VIEW_INIT_INTERFACES);

  /// Checks if an [Identifier] implements [AfterViewChecked].
  bool isAfterViewChecked(Identifier typeName, AssetId assetId) => implements(
      firstMatch(typeName, assetId), _ON_AFTER_VIEW_CHECKED_INTERFACES);
}
