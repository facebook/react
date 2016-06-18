library angular2.transform.directive_processor.rewriter;

import 'dart:async';

import 'package:analyzer/analyzer.dart';
import 'package:barback/barback.dart' show AssetId;

import 'package:angular2/src/compiler/compile_metadata.dart'
    show CompileIdentifierMetadata, CompileProviderMetadata;
import 'package:angular2/src/compiler/offline_compiler.dart';
import 'package:angular2/src/transform/common/annotation_matcher.dart';
import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/code/ng_deps_code.dart';
import 'package:angular2/src/transform/common/type_metadata_reader.dart';
import 'package:angular2/src/transform/common/interface_matcher.dart';
import 'package:angular2/src/transform/common/logging.dart';
import 'package:angular2/src/transform/common/ng_compiler.dart';
import 'package:angular2/src/transform/common/ng_meta.dart';
import 'package:angular2/src/transform/common/url_resolver.dart';
import 'package:angular2/src/transform/common/zone.dart' as zone;

import 'inliner.dart';

/// Generates an instance of [NgMeta] describing the file at `assetId`.
Future<NgMeta> createNgMeta(AssetReader reader, AssetId assetId,
    AnnotationMatcher annotationMatcher) async {
  // TODO(kegluneq): Shortcut if we can determine that there are no
  // [Directive]s present, taking into account `export`s.
  var codeWithParts = await inlineParts(reader, assetId);
  if (codeWithParts == null || codeWithParts.isEmpty) return null;
  var parsedCode =
      parseCompilationUnit(codeWithParts, name: '${assetId.path} and parts');

  final ngDepsVisitor = await logElapsedAsync(() async {
    var ngDepsVisitor = new NgDepsVisitor(assetId, annotationMatcher);
    parsedCode.accept(ngDepsVisitor);
    return ngDepsVisitor;
  }, operationName: 'createNgDeps', assetId: assetId);

  return logElapsedAsync(() async {
    var ngMeta = new NgMeta(ngDeps: ngDepsVisitor.model);

    var templateCompiler = zone.templateCompiler;
    if (templateCompiler == null) {
      templateCompiler = createTemplateCompiler(reader);
    }
    var ngMetaVisitor = new _NgMetaVisitor(ngMeta, assetId, annotationMatcher,
        _interfaceMatcher, templateCompiler);
    parsedCode.accept(ngMetaVisitor);
    await ngMetaVisitor.whenDone();
    return ngMeta;
  }, operationName: 'createNgMeta', assetId: assetId);
}

// TODO(kegluneq): Allow the caller to provide an InterfaceMatcher.
final _interfaceMatcher = new InterfaceMatcher();

/// Visitor responsible for visiting a file and outputting the
/// code necessary to register the file with the Angular 2 system.
class _NgMetaVisitor extends Object with SimpleAstVisitor<Object> {
  /// Output ngMeta information about aliases.
  // TODO(sigmund): add more to ngMeta. Currently this only contains aliasing
  // information, but we could produce here all the metadata we need and avoid
  // parsing the ngdeps files later.
  final NgMeta ngMeta;

  /// The [AssetId] we are currently processing.
  final AssetId assetId;

  final TypeMetadataReader _reader;
  final _normalizations = <Future>[];

  _NgMetaVisitor(this.ngMeta, this.assetId, AnnotationMatcher annotationMatcher,
      InterfaceMatcher interfaceMatcher, OfflineCompiler templateCompiler)
      : _reader = new TypeMetadataReader(
            annotationMatcher, interfaceMatcher, templateCompiler);

  Future whenDone() {
    return Future.wait(_normalizations);
  }

  @override
  Object visitCompilationUnit(CompilationUnit node) {
    if (node == null ||
        (node.directives == null && node.declarations == null)) {
      return null;
    }
    node.directives.accept(this);
    return node.declarations.accept(this);
  }

  @override
  Object visitClassDeclaration(ClassDeclaration node) {
    _normalizations.add(_reader
        .readTypeMetadata(node, assetId)
        .then((compileMetadataWithIdentifier) {
      if (compileMetadataWithIdentifier != null) {
        ngMeta.identifiers[compileMetadataWithIdentifier.identifier.name] =
            compileMetadataWithIdentifier;
      } else {
        ngMeta.identifiers[node.name.name] = new CompileIdentifierMetadata(
            name: node.name.name, moduleUrl: toAssetUri(assetId));
      }
    }).catchError((err) {
      log.error('ERROR: $err', asset: assetId);
    }));

    return null;
  }

  @override
  Object visitTopLevelVariableDeclaration(TopLevelVariableDeclaration node) {
    // We process any top-level declaration that fits the directive-alias
    // declaration pattern. Ideally we would use an annotation on the field to
    // help us filter out only what's needed, but unfortunately TypeScript
    // doesn't support decorators on variable declarations (see
    // angular/angular#1747 and angular/ts2dart#249 for context).
    outer: for (var variable in node.variables.variables) {
      if (variable.isConst) {
        final id = _reader.readIdentifierMetadata(variable, assetId);
        ngMeta.identifiers[variable.name.name] = id;
      }

      var initializer = variable.initializer;
      if (initializer != null && initializer is ListLiteral) {
        var otherNames = [];
        for (var exp in initializer.elements) {
          // Only simple identifiers are supported for now.
          // TODO(sigmund): add support for prefixes (see issue #3232).
          if (exp is! SimpleIdentifier) continue outer;
          otherNames.add(exp.name);
        }
        ngMeta.aliases[variable.name.name] = otherNames;
      }
    }
    return null;
  }

  @override
  Object visitFunctionTypeAlias(FunctionTypeAlias node) {
    ngMeta.identifiers[node.name.name] = new CompileIdentifierMetadata(
        name: node.name.name, moduleUrl: toAssetUri(assetId));
    return null;
  }

  @override
  Object visitFunctionDeclaration(FunctionDeclaration node) {
    _normalizations.add(_reader
        .readFactoryMetadata(node, assetId)
        .then((compileMetadataWithIdentifier) {
      if (compileMetadataWithIdentifier != null) {
        ngMeta.identifiers[compileMetadataWithIdentifier.identifier.name] =
            compileMetadataWithIdentifier;
      } else {
        ngMeta.identifiers[node.name.name] = new CompileIdentifierMetadata(
            name: node.name.name, moduleUrl: toAssetUri(assetId));
      }
    }).catchError((err) {
      log.error('ERROR: $err', asset: assetId);
    }));
    return null;
  }

  @override
  Object visitEnumDeclaration(EnumDeclaration node) {
    ngMeta.identifiers[node.name.name] = new CompileIdentifierMetadata(
        name: node.name.name, moduleUrl: toAssetUri(assetId));
    return null;
  }
}
