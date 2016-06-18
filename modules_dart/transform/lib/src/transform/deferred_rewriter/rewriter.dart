library angular2.transform.deferred_rewriter.rewriter;

import 'dart:async';

import 'package:analyzer/analyzer.dart';
import 'package:analyzer/src/generated/ast.dart';
import 'package:barback/barback.dart';

import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/logging.dart';
import 'package:angular2/src/transform/common/names.dart';
import 'package:angular2/src/transform/common/url_resolver.dart';

/// Rewrites `loadLibrary` calls to initialize libraries once loaded.
///
/// 1. Finds all the deferred library imports and loadLibrary invocations in
///    `_entryPoint`
/// 2. Removes any libraries that don't require angular codegen.
/// 3. For the remaining libraries, rewrites the import to the corresponding
///    `.ngfactory.dart` file.
/// 4. Chains a future to the `loadLibrary` call which initializes the
///    library.
///
/// To the extent possible, this method does not change line numbers or
/// offsets in the provided code to facilitate debugging via source maps.
Future<String> rewriteLibrary(AssetId entryPoint, AssetReader reader) async {
  var code = await reader.readAsString(entryPoint);

  return logElapsedAsync(() async {
    // If we can determine there are no deferred libraries, avoid additional
    // parsing the entire file and bail early.
    var onlyDirectives = parseDirectives(code, name: entryPoint.path);
    if (onlyDirectives == null) {
      log.fine('No directives parsed, bailing early.', asset: entryPoint);
      return null;
    }

    final importVisitor = new _FindDeferredLibraries(reader, entryPoint);
    onlyDirectives.directives.accept(importVisitor);

    // Get imports that need rewriting.
    final deferredImports = await importVisitor.process();
    if (deferredImports.isEmpty) {
      log.fine('There are no deferred library imports that need rewriting.',
          asset: entryPoint);
      return null;
    }

    var node = parseCompilationUnit(code, name: entryPoint.path);
    if (node == null) {
      log.fine('No declarations parsed, bailing early.', asset: entryPoint);
      return null;
    }

    final declarationsVisitor = new _FindLoadLibraryCalls(deferredImports);
    node.declarations.accept(declarationsVisitor);

    // Get libraries that need rewriting.
    if (declarationsVisitor.loadLibraryInvocations.isEmpty) {
      log.fine(
          'There are no loadLibrary invocations that need to be rewritten.',
          asset: entryPoint);
      return null;
    }

    return _rewriteLibrary(
        code, deferredImports, declarationsVisitor.loadLibraryInvocations);
  }, operationName: 'rewriteDeferredLibraries', assetId: entryPoint);
}

/// Rewrites the original [code] to initialize deferred libraries prior to use.
///
/// Note: This method may modify the order of [imports] and [loadLibCalls].
String _rewriteLibrary(String code, List<ImportDirective> imports,
    List<MethodInvocation> loadLibCalls) {
  /// Compares two [AstNode]s by position in the source code.
  var _compareNodes = (AstNode a, AstNode b) => a.offset - b.offset;

  // Necessary for indexes into [code] to function.
  imports.sort(_compareNodes);
  loadLibCalls.sort(_compareNodes);

  var buf = new StringBuffer();
  var idx = imports.fold(0, (int lastIdx, ImportDirective node) {
    // Write from where we left off until the start of the import uri.
    buf.write(code.substring(lastIdx, node.uri.offset));
    // Rewrite the uri to be that of the generated file.
    buf.write("'${toTemplateExtension('${node.uri.stringValue}')}'");
    // Update the last index we've processed.
    return node.uri.end;
  });

  idx = loadLibCalls.fold(idx, (int lastIdx, MethodInvocation node) {
    buf.write(code.substring(lastIdx, node.offset));
    var prefix = (node.realTarget as SimpleIdentifier).name;
    // Chain a future that initializes the reflector.
    buf.write('$prefix.loadLibrary().then((_) {$prefix.initReflector();})');
    return node.end;
  });
  if (idx < code.length) buf.write(code.substring(idx));
  return '$buf';
}

/// Finds all `deferred` [ImportDirectives]s in an Ast that require init.
///
/// Use this to visit all [ImportDirective]s, then call [process] to get only
/// those [ImportDirective]s which are `deferred` and need Angular 2
/// initialization before use.
class _FindDeferredLibraries extends Object with SimpleAstVisitor<Object> {
  final _deferredImports = <ImportDirective>[];
  final _urlResolver = createOfflineCompileUrlResolver();

  final AssetReader _reader;
  final AssetId _entryPoint;
  final String _entryPointUri;

  _FindDeferredLibraries(this._reader, AssetId entryPoint)
      : _entryPoint = entryPoint,
        _entryPointUri = toAssetUri(entryPoint);

  @override
  Object visitImportDirective(ImportDirective node) {
    if (node.deferredKeyword != null) {
      _deferredImports.add(node);
    }
    return null;
  }

  /// Gets the [AssetId] for the .ng_meta.json file associated with [import].
  AssetId _getAssociatedMetaAsset(ImportDirective import) {
    final importUri = stringLiteralToString(import.uri);
    final associatedMetaUri = toMetaExtension(importUri);
    return fromUri(_urlResolver.resolve(_entryPointUri, associatedMetaUri));
  }

  /// Gets a list of `deferred` [ImportDirective]s which need init.
  ///
  /// Removes all [ImportDirective]s from [_deferredImports] without an
  /// associated .ng_meta.json file.
  Future<List<ImportDirective>> process() async {
    // Parallel array with whether the input has an associated .ng_meta.json
    // file.
    final List<bool> hasInputs = await Future.wait(
        _deferredImports.map(_getAssociatedMetaAsset).map(_reader.hasInput));

    // Filter out any deferred imports that do not have an associated generated
    // file.
    // Iteration order is important!
    for (var i = _deferredImports.length - 1; i >= 0; --i) {
      if (!hasInputs[i]) {
        _deferredImports.removeAt(i);
      }
    }
    return _deferredImports;
  }
}

/// Finds all `loadLibrary` calls in the Ast that require init.
class _FindLoadLibraryCalls extends Object with RecursiveAstVisitor<Object> {
  /// The prefixes used by all `deferred` [ImportDirective]s that need init.
  final Set _deferredPrefixes;
  final loadLibraryInvocations = <MethodInvocation>[];

  _FindLoadLibraryCalls(List<ImportDirective> deferredImports)
      : _deferredPrefixes =
            new Set.from(deferredImports.map((import) => import.prefix.name));

  @override
  Object visitMethodInvocation(MethodInvocation node) {
    if (node.methodName.name == 'loadLibrary') {
      var prefix = (node.realTarget as SimpleIdentifier).name;
      if (_deferredPrefixes.contains(prefix)) {
        loadLibraryInvocations.add(node);
      }
    }
    // Important! Children could include more `loadLibrary` calls.
    return super.visitMethodInvocation(node);
  }
}
