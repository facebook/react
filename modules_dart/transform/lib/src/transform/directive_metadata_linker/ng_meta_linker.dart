library angular2.transform.directive_metadata_linker.linker;

import 'dart:async';
import 'dart:convert';

import 'package:angular2/src/compiler/compile_metadata.dart';
import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/logging.dart';
import 'package:angular2/src/transform/common/names.dart';
import 'package:angular2/src/transform/common/ng_meta.dart';
import 'package:angular2/src/transform/common/url_resolver.dart';
import 'package:barback/barback.dart';

import 'ng_deps_linker.dart';

/// Returns [NgMeta] associated with the provided asset combined with the [NgMeta] of
/// all files `export`ed from the original file.
///
/// The returned NgMeta has all the identifiers resolved.
///
/// `summaryAssetId` - the unlinked asset id (source)
/// `summaryAssetId` - the linked asset id (dest)
/// `resolvedIdentifiers` - preresolved identifiers (e.g., Window)
/// `ngMetas` - in memory cache of linked ngMeta files
Future<NgMeta> linkDirectiveMetadata(AssetReader reader, AssetId summaryAssetId,
    AssetId metaAssetId, Map<String, String> resolvedIdentifiers,
    [bool errorOnMissingIdentifiers = true, Map<AssetId, NgMeta> ngMetas]) async {
  if (ngMetas == null) ngMetas = {};

  var ngMeta = await _readNgMeta(reader, summaryAssetId, ngMetas);
  if (ngMeta == null || ngMeta.isEmpty) return null;

  await Future.wait([
    linkNgDeps(ngMeta.ngDeps, reader, summaryAssetId, _urlResolver),
    logElapsedAsync(() async {
      final linker = new _Linker(reader, ngMetas, resolvedIdentifiers, errorOnMissingIdentifiers);
      await linker.linkRecursive(ngMeta, metaAssetId, new Set<AssetId>());
      return ngMeta;
    }, operationName: 'linkDirectiveMetadata', assetId: summaryAssetId)
  ]);

  return ngMeta;
}

final _urlResolver = createOfflineCompileUrlResolver();

Future<NgMeta> _readNgMeta(AssetReader reader, AssetId ngMetaAssetId,
    Map<AssetId, NgMeta> ngMetas) async {
  if (ngMetas.containsKey(ngMetaAssetId)) return ngMetas[ngMetaAssetId];
  if (!(await reader.hasInput(ngMetaAssetId))) return null;

  var ngMetaJson = await reader.readAsString(ngMetaAssetId);
  if (ngMetaJson == null || ngMetaJson.isEmpty) return null;

  return new NgMeta.fromJson(JSON.decode(ngMetaJson));
}

class _Linker {
  final AssetReader reader;
  final Map<AssetId, NgMeta> ngMetas;
  final Map<String, String> resolvedIdentifiers;
  final bool errorOnMissingIdentifiers;

  _Linker(this.reader, this.ngMetas, this.resolvedIdentifiers, this.errorOnMissingIdentifiers);

  Future<NgMeta> linkRecursive(NgMeta ngMeta, AssetId assetId, Set<AssetId> seen) async {
    if (seen.contains(assetId)) return ngMeta;

    final newSeen = new Set.from(seen)
      ..add(assetId);

    await _resolveDeps(ngMeta, assetId, newSeen);
    await _resolveIdentifiers(ngMeta, assetId);
    await _mergeExports(ngMeta, assetId);

    ngMetas[assetId] = ngMeta;

    return ngMeta;
  }

  Future _resolveDeps(NgMeta ngMeta, AssetId assetId, Set<AssetId> seen) async {
    final importsAndExports = [];
    if (ngMeta != null &&
        ngMeta.ngDeps != null &&
        ngMeta.ngDeps.exports != null)
      importsAndExports.addAll(ngMeta.ngDeps.exports);

    if (ngMeta != null &&
        ngMeta.needsResolution &&
        ngMeta.ngDeps != null &&
        ngMeta.ngDeps.imports != null)
      importsAndExports
          .addAll(ngMeta.ngDeps.imports.where((i) => !i.isDeferred));

    final assetUri = toAssetUri(assetId);
    for (var withUri in importsAndExports) {
      if (isDartCoreUri(withUri.uri)) continue;
      final metaAsset =
      fromUri(_urlResolver.resolve(assetUri, toMetaExtension(withUri.uri)));
      final summaryAsset = fromUri(
          _urlResolver.resolve(assetUri, toSummaryExtension(withUri.uri)));

      if (!await _hasMeta(metaAsset)) {
        final ngMeta = await _readSummary(summaryAsset);
        if (ngMeta != null) {
          await linkRecursive(ngMeta, metaAsset, seen);
        }
      }
    }
  }

  Future _resolveIdentifiers(NgMeta ngMeta, AssetId assetId) async {
    if (ngMeta.needsResolution) {
      final resolver = new _NgMetaIdentifierResolver(
          assetId, reader, ngMetas, resolvedIdentifiers, errorOnMissingIdentifiers);
      return resolver.resolveNgMeta(ngMeta);
    } else {
      return null;
    }
  }

  Future _mergeExports(NgMeta ngMeta, AssetId assetId) async {
    if (ngMeta == null ||
        ngMeta.ngDeps == null ||
        ngMeta.ngDeps.exports == null) {
      return ngMeta;
    }
    var assetUri = toAssetUri(assetId);

    return Future.wait(ngMeta.ngDeps.exports.map((r) => r.uri)
        .where((export) => !isDartCoreUri(export))
        .map((export) =>
        _urlResolver.resolve(assetUri, toMetaExtension(export)))
        .map((uri) async {
      try {
        final exportAssetId = fromUri(uri);
        final exportNgMeta = await _readMeta(exportAssetId);
        if (exportNgMeta != null) {
          ngMeta.addAll(exportNgMeta);
        }
      } catch (err, st) {
        // Log and continue.
        log.warning('Failed to fetch $uri. Message: $err.\n$st',
            asset: assetId);
      }
    }));
  }

  Future<NgMeta> _readSummary(AssetId summaryAssetId) async {
    if (!(await reader.hasInput(summaryAssetId))) return null;

    var ngMetaJson = await reader.readAsString(summaryAssetId);
    if (ngMetaJson == null || ngMetaJson.isEmpty) return null;
    return new NgMeta.fromJson(JSON.decode(ngMetaJson));
  }

  Future<NgMeta> _readMeta(AssetId metaAssetId) async {
    final content = await _readNgMeta(reader, metaAssetId, ngMetas);
    if (content != null) {
      ngMetas[metaAssetId] = content;
    }
    return content;
  }

  Future<bool> _hasMeta(AssetId ngMetaAssetId) async {
    return ngMetas.containsKey(ngMetaAssetId) ||
        await reader.hasInput(ngMetaAssetId);
  }
}

class _NgMetaIdentifierResolver {
  final Map<String, String> resolvedIdentifiers;
  final Map<AssetId, NgMeta> ngMetas;
  final AssetReader reader;
  final AssetId entryPoint;
  final bool errorOnMissingIdentifiers;

  _NgMetaIdentifierResolver(this.entryPoint, this.reader, this.ngMetas, this.resolvedIdentifiers, this.errorOnMissingIdentifiers);

  Future resolveNgMeta(NgMeta ngMeta) async {
    final ngMetaMap = await _extractNgMetaMap(ngMeta);
    ngMeta.identifiers.forEach((_, meta) {
      if (meta is CompileIdentifierMetadata && meta.value != null) {
        meta.value = _resolveProviders(ngMetaMap, meta.value, "root");
      }
    });

    ngMeta.identifiers.forEach((_, meta) {
      if (meta is CompileDirectiveMetadata) {
        _resolveProviderMetadata(ngMetaMap, meta);
        _resolveQueryMetadata(ngMetaMap, meta);
        _resolveDiDependencyMetadata(ngMetaMap, meta.type.name, meta.type.diDeps);
      } else if (meta is CompileTypeMetadata) {
        _resolveDiDependencyMetadata(ngMetaMap, meta.name, meta.diDeps);
      } else if (meta is CompileFactoryMetadata) {
        _resolveDiDependencyMetadata(ngMetaMap, meta.name, meta.diDeps);
      }
    });
  }

  List<CompileProviderMetadata> _resolveProviders(Map<String, NgMeta> ngMetaMap, Object value, String neededBy) {

    if (value is List) {
      final res = [];
      for (var v in value) {
        res.addAll(_resolveProviders(ngMetaMap, v, neededBy));
      }
      return res;

    } else if (value is CompileProviderMetadata) {
      _resolveProvider(ngMetaMap, neededBy, value);

      return [value];

    } else if (value is CompileIdentifierMetadata) {
      final resolved = _resolveIdentifier(ngMetaMap, neededBy, value);
      if (resolved == null) return [];

      if (resolved is CompileTypeMetadata) {
        return [new CompileProviderMetadata(token: new CompileTokenMetadata(identifier: resolved), useClass: resolved)];

      } else if (resolved is CompileIdentifierMetadata && resolved.value is List) {
        return _resolveProviders(ngMetaMap, resolved.value, neededBy);

      } else if (resolved is CompileIdentifierMetadata && resolved.value is CompileProviderMetadata) {
        return [_resolveProviders(ngMetaMap, resolved.value, neededBy)];

      } else {
        return [];
      }

    } else {
      return [];
    }
  }

  void _resolveProviderMetadata(Map<String, NgMeta> ngMetaMap, CompileDirectiveMetadata dirMeta) {
    final neededBy = dirMeta.type.name;
    if (dirMeta.providers != null) {
      dirMeta.providers =
          _resolveProviders(ngMetaMap, dirMeta.providers, neededBy);
    }

    if (dirMeta.viewProviders != null) {
      dirMeta.viewProviders =
          _resolveProviders(ngMetaMap, dirMeta.viewProviders, neededBy);
    }
  }

  void _resolveQueryMetadata(Map<String, NgMeta> ngMetaMap, CompileDirectiveMetadata dirMeta) {
    final neededBy = dirMeta.type.name;
    if (dirMeta.queries != null) {
      _resolveQueries(ngMetaMap, dirMeta.queries, neededBy);
    }
    if (dirMeta.viewQueries != null) {
      _resolveQueries(ngMetaMap, dirMeta.viewQueries, neededBy);
    }
  }

  void _resolveQueries(Map<String, NgMeta> ngMetaMap, List queries, String neededBy) {
    queries.forEach((q) {
      q.selectors.forEach((s) => s.identifier = _resolveIdentifier(ngMetaMap, neededBy, s.identifier));
      if (q.read != null) {
        q.read.identifier = _resolveIdentifier(ngMetaMap, neededBy, q.read.identifier);
      }
    });
  }

  void _resolveProvider(Map<String, NgMeta> ngMetaMap,
      String neededBy, CompileProviderMetadata provider) {
    provider.token.identifier = _resolveIdentifier(ngMetaMap, neededBy, provider.token.identifier);
    if (provider.useClass != null) {
      provider.useClass =
          _resolveIdentifier(ngMetaMap, neededBy, provider.useClass);
    }
    if (provider.useExisting != null) {
      provider.useExisting.identifier =
          _resolveIdentifier(ngMetaMap, neededBy, provider.useExisting.identifier);
    }
    if (provider.useValue != null) {
      provider.useValue =
          _resolveIdentifier(ngMetaMap, neededBy, provider.useValue);
    }
    if (provider.useFactory != null) {
      provider.useFactory = _resolveIdentifier(ngMetaMap, neededBy, provider.useFactory);
    }
    if (provider.deps != null) {
      _resolveDiDependencyMetadata(ngMetaMap, neededBy, provider.deps);
    };;
  }

  void _resolveDiDependencyMetadata(Map<String, NgMeta> ngMetaMap,
      String neededBy, List<CompileDiDependencyMetadata> deps) {
    if (deps == null) return;
    for (var dep in deps) {
      if (dep.token != null) {
        _setModuleUrl(ngMetaMap, neededBy, dep.token.identifier);
      }
      if (dep.query != null) {
        dep.query.selectors
            .forEach((s) => _setModuleUrl(ngMetaMap, neededBy, s.identifier));
      }
      if (dep.viewQuery != null) {
        dep.viewQuery.selectors
            .forEach((s) => _setModuleUrl(ngMetaMap, neededBy, s.identifier));
      }
    }
  }

  void _setModuleUrl(Map<String, NgMeta> ngMetaMap, String neededBy, dynamic id) {
    final resolved = _resolveIdentifier(ngMetaMap, neededBy, id);
    if (resolved != null && id is CompileIdentifierMetadata) {
      id.moduleUrl = resolved.moduleUrl;
    }
  }

  /// Resolves an identifier using the provided ngMetaMap.
  ///
  /// ngMetaMap - a map of prefixes to the symbols available via those prefixes
  /// neededBy - a type using the unresolved symbol. It's used to generate
  /// good error message.
  /// id - an unresolved id.
  dynamic _resolveIdentifier(Map<String, NgMeta> ngMetaMap, String neededBy, dynamic id) {
    if (id is String || id is bool || id is num || id == null) return id;
    if (id is CompileMetadataWithIdentifier) {
      id = id.identifier;
    }

    if (id.moduleUrl != null) return id;

    final prefix = id.prefix == null ? "" : id.prefix;

    if (!ngMetaMap.containsKey(prefix)) {
      final resolved = _resolveSpecialCases(id);
      if (resolved != null) {
        return resolved;
      } else {
        final message = 'Missing prefix "${prefix}" '
            'needed by "${neededBy}" from metadata map';
        if (errorOnMissingIdentifiers) {
          log.error(message, asset: entryPoint);
        } else {
          log.warning(message, asset: entryPoint);
        }
        return null;
      }
    }

    final depNgMeta = ngMetaMap[prefix];
    if (depNgMeta.identifiers.containsKey(id.name)) {
      final res = depNgMeta.identifiers[id.name];
      if (res is CompileMetadataWithIdentifier) {
        return res.identifier;
      } else {
        return res;
      }
    } else if (_isPrimitive(id.name)) {
      return id;
    } else {
      final resolved = _resolveSpecialCases(id);
      if (resolved != null) {
        return resolved;
      } else {
        final message = 'Missing identifier "${id.name}" '
            'needed by "${neededBy}" from metadata map';
        if (errorOnMissingIdentifiers) {
          log.error(message, asset: entryPoint);
        } else {
          log.warning(message, asset: entryPoint);
        }
        return null;
      }
    }
  }

  dynamic _resolveSpecialCases(CompileIdentifierMetadata id) {
    if (resolvedIdentifiers != null &&
        resolvedIdentifiers.containsKey(id.name)) {
      return new CompileIdentifierMetadata(
          name: id.name, moduleUrl: resolvedIdentifiers[id.name]);

      // these are so common that we special case them in the transformer
    } else if (id.name == "Window" || id.name == "Document") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'dart:html');
    } else if (id.name == "Profiler") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'asset:perf_api/lib/perf_api.dart');
    } else if (id.name == "Logger") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'asset:logging/lib/logging.dart');
    } else if (id.name == "Clock") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'asset:quiver/lib/src/time/clock.dart');
    } else if (id.name == "Log") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'asset:angular2/lib/src/testing/utils.dart');
    } else if (id.name == "TestComponentBuilder") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'asset:angular2/lib/src/testing/test_component_builder.dart');
    } else if (id.name == "Stream") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'dart:async');
    } else if (id.name == "StreamController") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'dart:async');
    } else if (id.name == "FakeAsync") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'asset:angular2/lib/src/testing/fake_async.dart');
    } else if (id.name == "StreamTracer") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'asset:streamy/lib/src/core/tracing.dart');
    } else if (id.name == "Tracer") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'asset:streamy/lib/src/core/tracing.dart');
    } else if (id.name == "RequestHandler") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'asset:streamy/lib/src/core/request_handler.dart');
    } else if (id.name == "BatchingStrategy") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'asset:streamy/lib/src/extra/request_handler/batching.dart');
    } else if (id.name == "ProxyClient") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'asset:streamy/lib/src/extra/request_handler/proxy.dart');
    } else if (id.name == "StreamyHttpService") {
      return new CompileIdentifierMetadata(name: id.name, moduleUrl: 'asset:streamy/lib/src/toolbox/http.dart');
    } else {
      return null;
    }
  }

  bool _isPrimitive(String typeName) =>
      typeName == "String" ||
          typeName == "Object" ||
          typeName == "num" ||
          typeName == "int" ||
          typeName == "double" ||
          typeName == "bool" ||
          typeName == "dynamic";

  /// Walks all the imports and creates a map from prefixes to
  /// all the symbols available through those prefixes
  Future<Map<String, NgMeta>> _extractNgMetaMap(NgMeta ngMeta) async {
    final res = {"": new NgMeta.empty()};
    res[""].addAll(ngMeta);

    if (ngMeta.ngDeps == null || ngMeta.ngDeps.imports == null) return res;

    for (var import in ngMeta.ngDeps.imports) {
      if (isDartCoreUri(import.uri)) continue;

      final assetUri = toAssetUri(entryPoint);
      final metaAsset =
      fromUri(_urlResolver.resolve(assetUri, toMetaExtension(import.uri)));
      final newMeta = await _readNgMeta(reader, metaAsset, ngMetas);

      if (!res.containsKey(import.prefix)) {
        res[import.prefix] = new NgMeta.empty();
      }

      if (newMeta != null) {
        res[import.prefix].addAll(newMeta);
      } else {
        final summaryAsset =
        fromUri(_urlResolver.resolve(assetUri, toSummaryExtension(import.uri)));
        final summary = await _readNgMeta(reader, summaryAsset, {});
        if (summary != null) {
          res[import.prefix].addAll(summary);
        }
      }
    }
    return res;
  }
}
