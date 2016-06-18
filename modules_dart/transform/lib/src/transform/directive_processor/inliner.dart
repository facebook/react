library angular2.transform.directive_processor.inliner;

import 'dart:async';

import 'package:analyzer/analyzer.dart';
import 'package:analyzer/src/generated/ast.dart';
import 'package:barback/barback.dart' show AssetId;
import 'package:source_span/source_span.dart';
import 'package:path/path.dart' as path;

import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/async_string_writer.dart';
import 'package:angular2/src/transform/common/logging.dart';
import 'package:angular2/src/transform/common/url_resolver.dart';

/// Reads the code at `assetId`, inlining any `part` directives in that code.
///
/// Returns `null` if the code represented by `assetId` is a `part`.
///
/// Order of `part`s is preserved. That is, if in the main library we have
/// ```
/// library main;
///
/// part 'lib1.dart'
/// part 'lib2.dart'
/// ```
/// The output will first have the contents of lib1 followed by the contents of
/// lib2.dart, followed by the original code in the library.
Future<String> inlineParts(AssetReader reader, AssetId assetId) async {
  var code = await reader.readAsString(assetId);

  var directivesVisitor = new _NgDepsDirectivesVisitor();
  parseDirectives(code, name: assetId.path)
      .directives
      .accept(directivesVisitor);

  // If this is part of another library, its contents will be processed by its
  // parent, so it does not need its own generated file.
  if (directivesVisitor.isPart) return null;

  return logElapsedAsync(() {
    return _getAllDeclarations(reader, assetId, code, directivesVisitor);
  }, operationName: 'inlineParts', assetId: assetId);
}

/// Processes `visitor.parts`, reading and appending their contents to the
/// original `code`.
Future<String> _getAllDeclarations(AssetReader reader, AssetId assetId,
    String code, _NgDepsDirectivesVisitor visitor) {
  if (visitor.parts.isEmpty) return new Future<String>.value(code);

  var partsStart = visitor.parts.first.offset,
      partsEnd = visitor.parts.last.end;
  final assetUri = toAssetUri(assetId);

  var asyncWriter = new AsyncStringWriter(code.substring(0, partsStart));
  visitor.parts.forEach((partDirective) {
    var uri = stringLiteralToString(partDirective.uri);
    var partAssetId =
        fromUri(createOfflineCompileUrlResolver().resolve(assetUri, uri));
    asyncWriter.asyncPrint(reader.readAsString(partAssetId).then((partCode) {
      if (partCode == null || partCode.isEmpty) {
        log.warning('Empty part at "${partDirective.uri}. Ignoring.',
            asset: partAssetId);
        return '';
      }
      // Remove any directives -- we just want declarations.
      var parsedDirectives = parseDirectives(partCode, name: uri).directives;
      return partCode.substring(parsedDirectives.last.end);
    }).catchError((err, stackTrace) {
      log.warning(
          'Failed while reading part at ${partDirective.uri}. Ignoring.\n'
          'Error: $err\n'
          'Stack Trace: $stackTrace',
          asset: partAssetId,
          span: new SourceFile(code, url: path.basename(assetId.path))
              .span(partDirective.offset, partDirective.end));
    }));
  });
  asyncWriter.print(code.substring(partsEnd));

  return asyncWriter.asyncToString();
}

/// Visitor responsible for reading the `part` files of the visited AST and
/// determining if it is a part of another library.
class _NgDepsDirectivesVisitor extends Object with SimpleAstVisitor<Object> {
  /// Whether the file we are processing is a part, that is, whether we have
  /// visited a `part of` directive.
  bool _isPart = false;

  final List<PartDirective> _parts = <PartDirective>[];
  bool get isPart => _isPart;

  /// In the order encountered in the source.
  Iterable<PartDirective> get parts => _parts;

  @override
  Object visitPartDirective(PartDirective node) {
    _parts.add(node);
    return null;
  }

  @override
  Object visitPartOfDirective(PartOfDirective node) {
    _isPart = true;
    return null;
  }
}
