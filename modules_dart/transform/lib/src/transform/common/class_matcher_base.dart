library angular2.transform.common.class_matcher_base;

import 'package:analyzer/src/generated/ast.dart';
import 'package:barback/barback.dart' show AssetId;
import 'package:path/path.dart' as path;

import 'logging.dart' show log;
import 'url_resolver.dart';

/// Checks if a given [Identifier] matches any of the given [ClassDescriptor]s.
abstract class ClassMatcherBase {
  /// Always start out with the default angular [ClassDescriptor]s.
  final List<ClassDescriptor> _classDescriptors;

  ClassMatcherBase(this._classDescriptors);

  /// Adds a new [ClassDescriptor].
  void add(ClassDescriptor classDescriptor) =>
      _classDescriptors.add(classDescriptor);

  /// Adds a number of [ClassDescriptor]s.
  void addAll(Iterable<ClassDescriptor> classDescriptors) =>
      _classDescriptors.addAll(classDescriptors);

  /// Returns the first [ClassDescriptor] that matches the given
  /// [Identifier] node which appears in `assetId`.
  ClassDescriptor firstMatch(Identifier className, AssetId assetId) =>
      _classDescriptors.firstWhere((a) => isMatch(className, a, assetId),
          orElse: () => null);

  /// Checks whether an [Identifier] matches any [ClassDescriptor].
  bool hasMatch(Identifier className, AssetId assetId) =>
      _classDescriptors.any((a) => isMatch(className, a, assetId));

  /// Checks whether an [Identifier] matches any [ClassDescriptor].
  ImportDirective getMatchingImport(Identifier className, AssetId assetId) {
    for (var d in _classDescriptors) {
      var matchingImport = _getMatchingImport(className, d, assetId);
      if (matchingImport != null) {
        return matchingImport;
      }
    }
    return null;
  }

  /// Checks if `descriptor` extends or is any of the supplied `interfaces`.
  bool implements(ClassDescriptor descriptor, List<ClassDescriptor> interfaces,
      {String missingSuperClassWarning}) {
    if (descriptor == null) return false;
    if (interfaces.contains(descriptor)) return true;
    if (descriptor.superClass == null) return false;
    var superClass = _classDescriptors
        .firstWhere((a) => a.name == descriptor.superClass, orElse: () => null);
    if (superClass == null) {
      if (missingSuperClassWarning != null &&
          missingSuperClassWarning.isNotEmpty) {
        log.warning(missingSuperClassWarning);
      }
      return false;
    }
    return implements(superClass, interfaces);
  }
}

// Returns an [ImportDirective] matching `descriptor` for `className` which appears in `assetId`, or `null` if none exists.
ImportDirective _getMatchingImport(
    Identifier className, ClassDescriptor descriptor, AssetId assetId) {
  if (className == null) return null;
  String name;
  Identifier prefix;
  if (className is PrefixedIdentifier) {
    name = className.identifier.name;
    prefix = className.prefix;
  } else {
    name = className.name;
  }
  if (name != descriptor.name) return null;
  final assetUri = toAssetUri(assetId);
  return (className.root as CompilationUnit)
      .directives
      .where((d) => d is ImportDirective)
      .firstWhere((ImportDirective i) {
    var importMatch = false;
    var uriString = i.uri.stringValue;
    if (uriString == descriptor.import) {
      importMatch = true;
    } else if (uriString.startsWith('package:') || isDartCoreUri(uriString)) {
      return false;
    } else {
      final candidateAssetId =
          fromUri(createOfflineCompileUrlResolver().resolve(assetUri, uriString));

      importMatch = descriptor.assetId == candidateAssetId;
    }

    if (!importMatch) return false;
    if (prefix == null) return i.prefix == null;
    if (i.prefix == null) return false;
    return prefix.name == i.prefix.name;
  }, orElse: () => null);
}

// Checks if `className` which appears in `assetId` matches a [ClassDescriptor].
bool isMatch(
    Identifier className, ClassDescriptor descriptor, AssetId assetId) {
  return _getMatchingImport(className, descriptor, assetId) != null;
}

/// String based description of a class and its location.
class ClassDescriptor {
  /// The name of the class.
  final String name;

  /// A `package:` style import path to the file where the class is defined.
  final String import;

  /// The class that this class extends or implements. This is the only optional
  /// field.
  final String superClass;

  AssetId get assetId => new AssetId(package, packagePath);
  String get package => path.split(import.replaceFirst('package:', '')).first;
  String get packagePath => path.joinAll(['lib']
    ..addAll(path.split(import.replaceFirst('package:', ''))..removeAt(0)));

  const ClassDescriptor(this.name, this.import, {this.superClass});
}
