library angular2.transform.common.code.import_export_code;

import 'package:analyzer/analyzer.dart';

import 'package:angular2/src/transform/common/mirror_matcher.dart';
import 'package:angular2/src/transform/common/names.dart';
import 'package:angular2/src/transform/common/model/import_export_model.pb.dart';

const _mirrorMatcher = const MirrorMatcher();

/// Visitor responsible for parsing [ImportDirective]s into [ImportModel]s.
class ImportVisitor extends SimpleAstVisitor<ImportModel> {
  @override
  ImportModel visitImportDirective(ImportDirective node) {
    if (node.isSynthetic) return null;

    // This transitively imports 'dart:mirrors'.
    if (_mirrorMatcher.hasReflectionCapabilitiesUri(node)) return null;

    final model = new ImportModel()
      ..uri = stringLiteralToString(node.uri)
      ..isDeferred = node.deferredKeyword != null;
    if (node.prefix != null) {
      model.prefix = node.prefix.name;
    }
    _populateCombinators(node, model);
    _updateIfBootstrap(node, model);
    return model;
  }
}

/// Visitor responsible for parsing [ExportDirective]s into [ExportModel]s.
class ExportVisitor extends SimpleAstVisitor<ExportModel> {
  @override
  ExportModel visitExportDirective(ExportDirective node) {
    if (node.isSynthetic) return null;

    // This transitively imports 'dart:mirrors'.
    if (_mirrorMatcher.hasReflectionCapabilitiesUri(node)) return null;

    var model = new ExportModel()..uri = stringLiteralToString(node.uri);
    _populateCombinators(node, model);
    _updateIfBootstrap(node, model);
    return model;
  }
}

/// Ensures that the bootstrap import is not retained in .ng_deps.
///
/// If `model` has a combinator referencing `BOOTSTRAP_NAME`, rewrite it to
/// `BOOTSTRAP_STATIC_NAME`.
/// `model` should be an [ImportModel] or an [ExportModel].
void _updateIfBootstrap(NamespaceDirective node, dynamic model) {
  if (_mirrorMatcher.hasBootstrapUri(node)) {
    model.uri = BOOTSTRAP_STATIC_URI;
    [model.showCombinators, model.hideCombinators]
        .forEach((List<String> cList) {
      for (var i = 0; i < cList.length; ++i) {
        if (cList[i] == BOOTSTRAP_NAME) {
          cList[i] = BOOTSTRAP_STATIC_NAME;
        }
      }
    });
  }
}

/// Parses `combinators` in `node` and adds them to `model`, which should be
/// either an [ImportModel] or an [ExportModel].
void _populateCombinators(NamespaceDirective node, dynamic model) {
  if (node.combinators != null) {
    node.combinators.forEach((c) {
      if (c is ShowCombinator) {
        model.showCombinators.addAll(c.shownNames.map((id) => '$id'));
      } else if (c is HideCombinator) {
        model.hideCombinators.addAll(c.hiddenNames.map((id) => '$id'));
      }
    });
  }
}

/// Defines the format in which an [ImportModel] is expressed as Dart code when
/// registered with the reflector.
abstract class ImportWriterMixin {
  StringBuffer get buffer;

  void writeImportModel(ImportModel model) {
    buffer.write("import '${model.uri}'");
    if (model.isDeferred) {
      buffer.write(' deferred');
    }
    if (model.prefix != null && model.prefix.isNotEmpty) {
      buffer.write(' as ${model.prefix}');
    }
    _writeCombinators(buffer, model);
    buffer.writeln(';');
  }
}

/// Defines the format in which an [ExportModel] is expressed as Dart code when
/// registered with the reflector.
abstract class ExportWriterMixin {
  StringBuffer get buffer;

  void writeExportModel(ExportModel model) {
    buffer.write("export '${model.uri}'");
    _writeCombinators(buffer, model);
    buffer.writeln(';');
  }
}

void _writeCombinators(StringBuffer buffer, dynamic model) {
  if (model.showCombinators != null && model.showCombinators.isNotEmpty) {
    buffer.write(' show ');
    for (var i = 0; i < model.showCombinators.length; ++i) {
      if (i != 0) {
        buffer.write(', ');
      }
      buffer.write(model.showCombinators[i]);
    }
  }
  if (model.hideCombinators != null && model.hideCombinators.isNotEmpty) {
    buffer.write(' hide ');
    for (var i = 0; i < model.hideCombinators.length; ++i) {
      if (i != 0) {
        buffer.write(', ');
      }
      buffer.write(model.hideCombinators[i]);
    }
  }
}
