library angular2.src.transform.inliner_for_test.transformer;

import 'dart:async';
import 'dart:convert' show LineSplitter;

import 'package:analyzer/analyzer.dart';
import 'package:analyzer/src/generated/ast.dart';
import 'package:barback/barback.dart';
import 'package:dart_style/dart_style.dart';

import 'package:angular2/src/compiler/xhr.dart' show XHR;
import 'package:angular2/src/transform/common/annotation_matcher.dart';
import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/naive_eval.dart';
import 'package:angular2/src/transform/common/async_string_writer.dart';
import 'package:angular2/src/transform/common/options.dart';
import 'package:angular2/src/transform/common/url_resolver.dart';
import 'package:angular2/src/transform/common/xhr_impl.dart';
import 'package:angular2/src/transform/common/zone.dart' as zone;
import 'package:angular2/src/transform/directive_processor/inliner.dart';

/// Processes .dart files and inlines `templateUrl` and styleUrls` values.
class InlinerForTest extends Transformer {
  final DartFormatter _formatter;
  final AnnotationMatcher _annotationMatcher;

  InlinerForTest(TransformerOptions options)
      : _formatter = options.formatCode ? new DartFormatter() : null,
        _annotationMatcher = options.annotationMatcher;

  @override
  bool isPrimary(AssetId id) => id.extension.endsWith('dart');

  @override
  Future apply(Transform transform) async {
    return zone.exec(() async {
      var primaryId = transform.primaryInput.id;
      var inlinedCode = await inline(new AssetReader.fromTransform(transform),
          primaryId, _annotationMatcher);
      if (inlinedCode == null || inlinedCode.isEmpty) {
        transform.addOutput(transform.primaryInput);
      } else {
        if (_formatter != null) {
          inlinedCode = _formatter.format(inlinedCode);
        }
        transform.addOutput(new Asset.fromString(primaryId, inlinedCode));
      }
    }, log: transform.logger);
  }
}

/// Reads the code at `assetId`, inlining values where possible.
///
/// Returns the code at `assetId` with the following modifications:
/// - `part` Directives are inlined
/// - `templateUrl` values are inlined as `template` values.
/// - `styleUrls` values are inlined as `styles` values.
///
/// If this does not inline any `templateUrl` or `styleUrls` values, it will
/// return `null` to signal that no modifications to the input code were
/// necessary.
Future<String> inline(AssetReader reader, AssetId assetId,
    AnnotationMatcher annotationMatcher) async {
  var codeWithParts = await inlineParts(reader, assetId);
  if (codeWithParts == null) return null;
  var parsedCode =
      parseCompilationUnit(codeWithParts, name: '${assetId.path} and parts');
  var writer = new AsyncStringWriter();
  var visitor = new _ViewPropInliner(
      assetId, codeWithParts, writer, new XhrImpl(reader), annotationMatcher);
  parsedCode.accept(visitor);
  return visitor.modifiedSource ? writer.asyncToString() : null;
}

final _urlResolver = createOfflineCompileUrlResolver();

class _ViewPropInliner extends RecursiveAstVisitor<Object> {
  /// The prefixes given to inlined names.
  static const _inlinedTemplateBase = '_template';
  static const _inlinedStyleBase = '_style';

  final AssetId _assetId;

  /// The code we are operating on.
  final String _code;

  /// The asset uri for the code we are operating on.
  final Uri _baseUri;
  final AsyncStringWriter _writer;
  final XHR _xhr;
  final AnnotationMatcher _annotationMatcher;

  /// Variable name, string to be inlined pairs.
  final _inlinedValues = <_InlinedValue>[];

  /// The final index of the last substring we wrote.
  int _lastIndex = 0;

  /// Whether we are currently inlining.
  bool _isInlining = false;

  /// Whether this visitor actually inlined any properties.
  bool get modifiedSource => _lastIndex > 0;

  _ViewPropInliner(AssetId assetId, this._code, AsyncStringWriter writer,
      this._xhr, this._annotationMatcher)
      : _assetId = assetId,
        _baseUri = Uri.parse(toAssetUri(assetId)),
        _writer = writer,
        super();

  @override
  Object visitCompilationUnit(CompilationUnit node) {
    final retVal = super.visitCompilationUnit(node);
    if (modifiedSource) {
      _writer.print(_code.substring(_lastIndex));
      _inlinedValues.forEach((v) => _writer.asyncPrint(v.asyncToString()));
    }
    return retVal;
  }

  @override
  Object visitAnnotation(Annotation node) {
    var wasInlining = _isInlining;
    _isInlining = _annotationMatcher.isView(node, _assetId) ||
        _annotationMatcher.isComponent(node, _assetId);
    final retVal = super.visitAnnotation(node);
    _isInlining = wasInlining;
    return retVal;
  }

  @override
  Object visitNamedExpression(NamedExpression node) {
    if (_isInlining) {
      if (node.name is! Label || node.name.label is! SimpleIdentifier) {
        throw new FormatException(
            'Angular 2 currently only supports simple identifiers in directives.',
            '$node' /* source */);
      }
      var keyString = '${node.name.label}';
      switch (keyString) {
        case 'templateUrl':
          _populateTemplateUrl(node);
          // Remove `templateUrl`
          return null;
        case 'styleUrls':
          _populateStyleUrls(node);
          // Remove `styleUrls`
          return null;
      }
    }
    return super.visitNamedExpression(node);
  }

  /// Counts the newline characters in the code represented by `node`.
  int _countNewlines(AstNode node) {
    if (node.offset == null ||
        node.offset < 0 ||
        node.end == null ||
        node.end < 0) {
      return 0;
    }
    return LineSplitter.split(_code.substring(node.offset, node.end)).length -
        1;
  }

  void _populateStyleUrls(NamedExpression node) {
    var urls = naiveEval(node.expression);
    if (urls is! List) {
      zone.log
          .warning('styleUrls is not a List of Strings (${node.expression})');
      return;
    }
    _writer.print(_code.substring(_lastIndex, node.offset));
    _lastIndex = node.end;
    _writer.print('styles: const [');
    for (var url in urls) {
      if (url is String) {
        final inlinedVal = _addInlineValue(url, varBase: _inlinedStyleBase);
        _writer.print('${inlinedVal.name},');
      } else {
        zone.log.warning('style url is not a String (${url})', asset: _assetId);
      }
    }
    _writer.print(']');
    for (var i = 0, n = _countNewlines(node); i < n; ++i) {
      _writer.println('');
    }
  }

  void _populateTemplateUrl(NamedExpression node) {
    var url = naiveEval(node.expression);
    if (url is! String) {
      zone.log.warning('template url is not a String (${node.expression})',
          asset: _assetId);
      return;
    }
    _writer.print(_code.substring(_lastIndex, node.offset));
    _lastIndex = node.end;
    final inlinedVal = _addInlineValue(url, varBase: _inlinedTemplateBase);
    _writer.print('template: ${inlinedVal.name}');
    for (var i = 0, n = _countNewlines(node); i < n; ++i) {
      _writer.println('');
    }
  }

  /// Attempts to read the content from [url]. If [url] is relative, uses
  /// [_baseUri] as resolution base.
  Future<String> _readOrEmptyString(String url) async {
    final resolvedUri = _urlResolver.resolve(_baseUri.toString(), url);

    return _xhr.get(resolvedUri).catchError((_) {
      zone.log.error('$_baseUri: could not read $url', asset: _assetId);
      return '';
    });
  }

  /// Adds a url to be inlined and requests its content.
  ///
  /// `varBase` is the base of the variable name the inlined value will be
  /// assigned to.
  /// Returns the created [_InlinedValue] object.
  _InlinedValue _addInlineValue(String url, {String varBase}) {
    final val = new _InlinedValue(
        '${varBase}${_inlinedValues.length}', _readOrEmptyString(url));
    _inlinedValues.add(val);
    return val;
  }
}

class _InlinedValue {
  final String name;
  final Future<String> futureValue;

  _InlinedValue(this.name, this.futureValue);

  /// Returns a const declaration of the inlined value.
  Future<String> asyncToString() async {
    return "const $name = r'''${await futureValue}''';";
  }
}
