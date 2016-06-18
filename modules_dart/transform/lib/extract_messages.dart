import 'package:build/build.dart';
import 'package:analyzer/src/generated/element.dart';
import 'src/transform/common/url_resolver.dart';

import 'dart:async';
import 'package:angular2/i18n.dart';
import 'package:angular2/src/compiler/expression_parser/parser.dart';
import 'package:angular2/src/compiler/expression_parser/lexer.dart';
import 'package:angular2/src/compiler/html_parser.dart';

/**
 * An command-line utility extracting i18n messages from an application.
 *
 * For instance, the following command will extract all the messages from the 'my-app-package' package, where
 * index.dart is the entry point, and will serialize them into i18n-messages.xml.
 *
 * pub run packages/angular2/extract_messages.dart 'my-app-package' 'web/src/index.dart' 'i18n-messages.xml'
 */
main(List<String> args) async {
  final input = new InputSet(args[0], [args[1]]);
  final output = new AssetId(args[0], args[2]);

  await build(new PhaseGroup.singleAction(new I18nMessageExtractorBuilder(output), input));
}

class I18nMessageExtractorBuilder implements Builder {
  final AssetId outputAssetId;

  I18nMessageExtractorBuilder(this.outputAssetId);

  Future build(BuildStep buildStep) async {
    final resolver = await buildStep.resolve(buildStep.input.id);
    final entryLib = resolver.getLibrary(buildStep.input.id);

    final extractor = new I18nMessageExtractor((path) => buildStep.readAsString(path));
    await extractor.processLibrary(entryLib);
    resolver.release();

    if (extractor.errors.length > 0) {
      print("Errors:");
      extractor.errors.forEach(print);
      throw "Failed to extract messages";

    } else {
      await buildStep.writeAsString(new Asset(outputAssetId, extractor.output));
    }
  }

  List<AssetId> declareOutputs(AssetId inputId) => [outputAssetId];
}

class I18nMessageExtractor {
  final urlResovler = createOfflineCompileUrlResolver();
  final List<Message> messages = [];
  final List errors = [];
  final HtmlParser htmlParser = new HtmlParser();
  final Parser parser = new Parser(new Lexer());

  final Function readInput;

  I18nMessageExtractor(this.readInput);

  String get output => serializeXmb(removeDuplicates(messages));

  Future processLibrary(LibraryElement el) async  {
    return Future.wait(el.units.map(processCompilationUnit));
  }

  Future processCompilationUnit(CompilationUnitElement el) async {
    return Future.wait(el.types.map(processClass));
  }

  Future processClass(ClassElement el) async {
    final baseUrl = (el.source as dynamic).assetId;
    final filtered = el.metadata.where((m) {
      if (m.element is ConstructorElement) {
        final isComponent = m.element.enclosingElement.name == "Component" &&
            m.element.library.displayName == "angular2.src.core.metadata";

        final isView = m.element.enclosingElement.name == "View" &&
            m.element.library.displayName == "angular2.src.core.metadata";

        return isComponent || isView;
      } else {
        return false;
      }
    });

    return Future.wait(filtered.map((m) => processAnnotation(el, m, baseUrl)));
  }

  Future processAnnotation(ClassElement el, ElementAnnotation m, baseUrl) async {
    final fields = (m.constantValue as dynamic).fields["(super)"].fields;
    final template = fields["template"];
    final templateUrl = fields["templateUrl"];

    if (template != null && !template.isNull) {
      processTemplate(template.toStringValue(), baseUrl.toString());
    }

    if (templateUrl != null && !templateUrl.isNull) {
      final value = templateUrl.toStringValue();
      final resolvedPath = urlResovler.resolve(toAssetUri(baseUrl), value);
      final template = await readInput(fromUri(resolvedPath));
      processTemplate(template.toStringValue(), baseUrl.toString());
    }
  }

  void processTemplate(String template, String sourceUrl) {
    final m = new MessageExtractor(htmlParser, parser);
    final res = m.extract(template, sourceUrl);
    if (res.errors.isNotEmpty) {
      errors.addAll(res.errors);
    } else {
      messages.addAll(res.messages);
    }
  }
}