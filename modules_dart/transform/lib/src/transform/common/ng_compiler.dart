library angular2.transform.template_compiler.ng_compiler;

import 'package:angular2/src/compiler/config.dart';
import 'package:angular2/src/compiler/view_compiler/view_compiler.dart';
import 'package:angular2/src/core/console.dart';
import 'package:angular2/src/compiler/html_parser.dart';
import 'package:angular2/src/compiler/style_compiler.dart';
import 'package:angular2/src/compiler/offline_compiler.dart';
import 'package:angular2/src/compiler/directive_normalizer.dart';
import 'package:angular2/src/compiler/template_parser.dart';
import 'package:angular2/src/compiler/expression_parser/lexer.dart' as ng;
import 'package:angular2/src/compiler/expression_parser/parser.dart' as ng;
import 'package:angular2/src/compiler/schema/dom_element_schema_registry.dart';
import 'package:angular2/src/compiler/output/dart_emitter.dart';
import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/i18n.dart';

import 'xhr_impl.dart';
import 'url_resolver.dart';

OfflineCompiler createTemplateCompiler(AssetReader reader,
    {CompilerConfig compilerConfig, XmbDeserializationResult translations}) {
  var _xhr = new XhrImpl(reader);
  var _urlResolver = createOfflineCompileUrlResolver();

  // TODO(yjbanov): add router AST transformer when ready
  var parser = new ng.Parser(new ng.Lexer());
  var _htmlParser = _createHtmlParser(translations, parser);

  var templateParser = new TemplateParser(
      parser,
      new DomElementSchemaRegistry(),
      _htmlParser,
      new Console(),
      [new RouterLinkTransform(parser)]);

  return new OfflineCompiler(
    new DirectiveNormalizer(_xhr, _urlResolver, _htmlParser),
    templateParser,
    new StyleCompiler(_urlResolver),
    new ViewCompiler(compilerConfig),
    new DartEmitter()
  );
}

HtmlParser _createHtmlParser(XmbDeserializationResult translations, ng.Parser parser) {
  if (translations != null) {
    return new I18nHtmlParser(new HtmlParser(), parser, translations.content, translations.messages);
  } else {
    return new HtmlParser();
  }
}
