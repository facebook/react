library angular2.transform.common.ng_meta;

import 'package:angular2/src/compiler/compile_metadata.dart';
import 'logging.dart';
import 'model/ng_deps_model.pb.dart';
import 'url_resolver.dart' show isDartCoreUri;

/// Metadata about directives, pipes, directive aliases, and injectable values.
///
/// [NgMeta] is used in three stages of the transformation process:
///
/// First we store directive aliases and types exported directly (that is, not
/// via an `export` statement) from a single file in an [NgMeta] instance.
///
/// In the second phase, we perform two actions:
/// 1. Incorporate all the data from [NgMeta] instances created by all
///    files `exported` by the original file, such that all aliases and types
///    visible when importing the original file are stored in its associated
///    [NgMeta] instance.
/// 2. Use the [NgDepsModel] to write Dart code registering all injectable
///    values with the Angular 2 runtime reflection system.
///
/// Later in the compilation process, the template compiler needs to reason
/// about the namespace of import prefixes, so it will combine multiple [NgMeta]
/// instances together if they were imported into a file with the same prefix.
///
/// Instances of this class are serialized into `.ng_summary.json` and
/// `.ng_meta.json` files as intermediate assets during the compilation process.
class NgMeta {
  static const _ALIAS_VALUE = 'alias';
  static const _NG_DEPS_KEY = 'ngDeps';
  static const _TYPE_VALUE = 'type';

  /// Metadata for each identifier
  /// Type: [CompileDirectiveMetadata]|[CompilePipeMetadata]|[CompileTypeMetadata]|
  /// [CompileIdentifierMetadata]|[CompileFactoryMetadata]
  final Map<String, dynamic> identifiers;

  /// List of other types and names associated with a given name.
  final Map<String, List<String>> aliases;

  // The NgDeps generated from
  final NgDepsModel ngDeps;

  NgMeta({Map<String, List<String>> aliases,
  Map<String, dynamic> identifiers,
  this.ngDeps: null})
      :this.aliases = aliases != null ? aliases : {},
        this.identifiers = identifiers != null ? identifiers : {};

  NgMeta.empty() : this();

  // `model` can be an `ImportModel` or `ExportModel`.
  static bool _isDartImport(dynamic model) => isDartCoreUri(model.uri);

  bool get isNgDepsEmpty {
    if (ngDeps == null) return true;
    // If this file imports only dart: libraries and does not define any
    // reflectables of its own, we don't need to register any information from
    // it with the Angular 2 reflector.
    if (ngDeps.reflectables == null || ngDeps.reflectables.isEmpty) {
      if ((ngDeps.imports == null || ngDeps.imports.every(_isDartImport)) &&
          (ngDeps.exports == null || ngDeps.exports.every(_isDartImport))) {
        return true;
      }
    }
    return false;
  }

  bool get isEmpty => identifiers.isEmpty && aliases.isEmpty && isNgDepsEmpty;

  bool get needsResolution {
    return identifiers.values.any((id) =>
      id is CompileDirectiveMetadata || id is CompilePipeMetadata || id is CompileTypeMetadata || id is CompileFactoryMetadata
          || (id is CompileIdentifierMetadata && id.value != null));
  }

  /// Parse from the serialized form produced by [toJson].
  factory NgMeta.fromJson(Map json) {
    var ngDeps = null;

    if (json.containsKey(_NG_DEPS_KEY)) {
      var ngDepsJsonMap = json[_NG_DEPS_KEY];
      if (ngDepsJsonMap != null) {
        if (ngDepsJsonMap is! Map) {
          log.warning(
              'Unexpected value $ngDepsJsonMap for key "$_NG_DEPS_KEY" in NgMeta.');
        } else {
          ngDeps = new NgDepsModel()..mergeFromJsonMap(ngDepsJsonMap);
        }
      }
    }

    final aliases = json[_ALIAS_VALUE] != null ? json[_ALIAS_VALUE] : {};

    final identifiers = {};
    if (json.containsKey(_TYPE_VALUE)) {
      for (var key in json[_TYPE_VALUE].keys) {
        var entry = json[_TYPE_VALUE][key];
        if (entry is! Map) {
          log.warning('Unexpected value $entry for key "$key" in NgMeta.');
          continue;
        }
        identifiers[key] = metadataFromJson(entry);
      }
    }

    return new NgMeta(identifiers: identifiers, aliases: aliases, ngDeps: ngDeps);
  }

  /// Serialized representation of this instance.
  Map toJson() {
    var result = {};
    result[_NG_DEPS_KEY] = isNgDepsEmpty ? null : ngDeps.writeToJsonMap();

    result[_TYPE_VALUE] = {};
    identifiers.forEach((k, v) {
      result[_TYPE_VALUE][k] = v.toJson();
    });
    result[_ALIAS_VALUE] = aliases;
    return result;
  }

  /// Merge into this instance all information from [other].
  /// This does not include `ngDeps`.
  void addAll(NgMeta other) {
    aliases.addAll(other.aliases);
    identifiers.addAll(other.identifiers);
  }

  /// Returns the metadata for every type associated with the given [alias].
  List<dynamic> flatten(String alias) {
    var result = [];
    helper(name, path) {
      final newPath = []..addAll(path)..add(name);
      if (path.contains(name)) {
        log.error('Circular alias dependency for "$name". Cycle: ${newPath.join(' -> ')}.');
        return;
      }
      if (aliases.containsKey(name)) {
        aliases[name].forEach((n) => helper(n, newPath));
      } else if (identifiers.containsKey(name)) {
        result.add(identifiers[name]);
      } else {
        log.error('Unknown alias: ${newPath.join(' -> ')}. Make sure you export ${name} from the file where ${path.last} is defined.');
      }
    }
    helper(alias, []);
    return result;
  }
}
