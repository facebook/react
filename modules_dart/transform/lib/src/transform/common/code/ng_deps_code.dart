library angular2.transform.common.code.ng_deps_code;

import 'package:analyzer/analyzer.dart';
import 'package:angular2/src/transform/common/annotation_matcher.dart';
import 'package:angular2/src/transform/common/model/ng_deps_model.pb.dart';
import 'package:angular2/src/transform/common/model/import_export_model.pb.dart';
import 'package:angular2/src/transform/common/names.dart';
import 'package:barback/barback.dart' show AssetId;
import 'package:path/path.dart' as path;

import 'annotation_code.dart';
import 'import_export_code.dart';
import 'reflection_info_code.dart';
import 'parameter_code.dart';

/// Visitor responsible for parsing Dart source into [NgDepsModel] objects.
class NgDepsVisitor extends RecursiveAstVisitor<Object> {
  final AssetId processedFile;
  final _importVisitor = new ImportVisitor();
  final _exportVisitor = new ExportVisitor();
  final ReflectionInfoVisitor _reflectableVisitor;

  bool _isPart = false;
  NgDepsModel _model = null;

  NgDepsVisitor(AssetId processedFile, AnnotationMatcher annotationMatcher)
      : this.processedFile = processedFile,
        _reflectableVisitor =
            new ReflectionInfoVisitor(processedFile, annotationMatcher);

  bool get isPart => _isPart;
  NgDepsModel get model {
    if (_model == null) {
      _createModel('');
    }
    return _model;
  }

  void _createModel(String libraryUri) {
    _model = new NgDepsModel()
      ..libraryUri = libraryUri
      ..sourceFile = path.basename(processedFile.path);
  }

  @override
  Object visitClassDeclaration(ClassDeclaration node) {
    var reflectableModel = _reflectableVisitor.visitClassDeclaration(node);
    if (reflectableModel != null) {
      model.reflectables.add(reflectableModel);
    }
    return null;
  }

  @override
  Object visitExportDirective(ExportDirective node) {
    var export = _exportVisitor.visitExportDirective(node);
    if (export != null) {
      model.exports.add(export);
    }
    return null;
  }

  @override
  Object visitImportDirective(ImportDirective node) {
    var import = _importVisitor.visitImportDirective(node);
    if (import != null) {
      model.imports.add(import);
    }
    return null;
  }

  @override
  Object visitLibraryDirective(LibraryDirective node) {
    if (node != null) {
      assert(_model == null);
      _createModel('${node.name}');
    }
    return null;
  }

  @override
  Object visitPartDirective(PartDirective node) {
    model.partUris.add(stringLiteralToString(node.uri));
    return null;
  }

  @override
  Object visitPartOfDirective(PartOfDirective node) {
    _isPart = true;
    return null;
  }

  @override
  Object visitFunctionDeclaration(FunctionDeclaration node) {
    var reflectableModel = _reflectableVisitor.visitFunctionDeclaration(node);
    if (reflectableModel != null) {
      model.reflectables.add(reflectableModel);
    }
    return null;
  }
}

/// Defines the format in which an [NgDepsModel] is expressed as Dart code
/// when registered with the reflector.
class NgDepsWriter extends Object
    with
        AnnotationWriterMixin,
        ExportWriterMixin,
        ImportWriterMixin,
        NgDepsWriterMixin,
        ParameterWriterMixin,
        ReflectionWriterMixin {
  final StringBuffer buffer;

  NgDepsWriter([StringBuffer buffer])
      : this.buffer = buffer != null ? buffer : new StringBuffer();
}

abstract class NgDepsWriterMixin
    implements
        AnnotationWriterMixin,
        ExportWriterMixin,
        ImportWriterMixin,
        ParameterWriterMixin,
        ReflectionWriterMixin {
  StringBuffer get buffer;

  void writeNgDepsModel(NgDepsModel model, String templateCode) {
    if (model.libraryUri.isNotEmpty) {
      buffer.writeln('library ${model.libraryUri}${TEMPLATE_EXTENSION};\n');
    }

    // We need to import & export (see below) the source file.
    writeImportModel(new ImportModel()..uri = model.sourceFile);

    // Used to register reflective information.
    writeImportModel(new ImportModel()
      ..uri = REFLECTOR_IMPORT
      ..prefix = REFLECTOR_PREFIX);

    // We do not support `partUris`, so skip outputting them.

    // Ignore deferred imports here so as to not load the deferred libraries
    // code in the current library causing much of the code to not be
    // deferred. Instead `DeferredRewriter` will rewrite the code as to load
    // `ng_deps` in a deferred way.
    model.imports.where((i) => !i.isDeferred).forEach(writeImportModel);
    model.depImports.where((i) => !i.isDeferred).forEach(writeImportModel);

    writeExportModel(new ExportModel()..uri = model.sourceFile);
    model.exports.forEach(writeExportModel);

    buffer.writeln(templateCode);

    buffer
      ..writeln('var _visited = false;')
      ..writeln('void ${SETUP_METHOD_NAME}() {')
      ..writeln('if (_visited) return; _visited = true;');

    final needsReceiver = (model.reflectables != null &&
            model.reflectables.isNotEmpty);

    if (needsReceiver) {
      buffer.writeln('$REFLECTOR_PREFIX.$REFLECTOR_VAR_NAME');
    }

    if (model.reflectables != null && model.reflectables.isNotEmpty) {
      model.reflectables.forEach(writeRegistration);
    }

    if (needsReceiver) {
      buffer.writeln(';');
    }

    // Call the setup method for our dependencies.
    for (var importModel in model.depImports) {
      buffer.writeln('${importModel.prefix}.${SETUP_METHOD_NAME}();');
    }

    buffer.writeln('}');
  }
}
