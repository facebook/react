library angular2.transform.common.mirror_matcher;

import 'package:analyzer/src/generated/ast.dart';
import 'package:angular2/src/transform/common/names.dart';

/// File from which `bootstrap` is exported.
///
/// This file transitively imports dart:mirrors.
/// It should be replaced with [BOOTSTRAP_STATIC_URI] in production apps.
const _BOOTSTRAP_URI = 'package:angular2/platform/browser.dart';

/// File from which `ReflectionCapabilities` is exported.
///
/// This file transitively imports dart:mirrors and should be removed from
/// production apps. The Angular2 reflection framework should be initialized
/// with generated code such that no reflection is necessary.
const _REFLECTION_CAPABILITIES_URI =
    'package:angular2/src/core/reflection/reflection_capabilities.dart';

/// File from which `bootstrapStatic` is exported.
///
/// This file does not transitively import dart:mirrors.
/// It should be used in place of [_BOOTSTRAP_URI] in production apps.
const BOOTSTRAP_STATIC_URI = 'package:angular2/platform/browser_static.dart';

/// Syntactially checks for code related to the use of `dart:mirrors`.
///
/// Checks various [AstNode]s to determine if they are
/// - Libraries that transitively import `dart:mirrors`
/// - Instantiations of [ReflectionCapabilities]
class MirrorMatcher {
  const MirrorMatcher();

  bool isNewReflectionCapabilities(InstanceCreationExpression node) =>
      '${node.constructorName.type.name}' == REFLECTION_CAPABILITIES_NAME;

  bool hasReflectionCapabilitiesUri(UriBasedDirective node) {
    return node.uri.stringValue == _REFLECTION_CAPABILITIES_URI;
  }

  bool hasBootstrapUri(UriBasedDirective node) =>
      _BOOTSTRAP_URI == node.uri.stringValue;
}
