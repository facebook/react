library angular2.transform.common.code.source_module;

import 'package:angular2/src/compiler/offline_compiler.dart';
import 'package:analyzer/src/generated/scanner.dart' show Keyword;
import 'package:angular2/src/transform/common/model/ng_deps_model.pb.dart';

import 'ng_deps_code.dart';

/// Writes the full Dart code for the provided [SourceModule].
String writeSourceModule(SourceModule sourceModule, {String libraryName}) {
  if (sourceModule == null) return null;
  var buf = new StringBuffer();
  libraryName = _sanitizeLibName(
      libraryName != null ? libraryName : sourceModule.moduleUrl);
  buf..writeln('library $libraryName;')..writeln();

  buf..writeln()..writeln(sourceModule.source);

  return buf.toString();
}

/// Uses `writer` to write a Dart library representing `model` and
/// `sourceModule`.
void writeTemplateFile(
    NgDepsWriterMixin writer, NgDepsModel model, SourceModule sourceModule) {
  if (model == null) return null;
  var sourceModuleCode = '';
  if (sourceModule != null) {
    sourceModuleCode = sourceModule.source;
  }
  writer.writeNgDepsModel(model, sourceModuleCode);
}

final _unsafeCharsPattern = new RegExp(r'[^a-zA-Z0-9_\.]');
String _sanitizeLibName(String moduleUrl) {
  var sanitized =
      moduleUrl.replaceAll(_unsafeCharsPattern, '_').replaceAll('/', '.');
  for (var keyword in Keyword.values) {
    sanitized.replaceAll(keyword.syntax, '${keyword.syntax}_');
  }
  return sanitized;
}
