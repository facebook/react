library angular2.transform.common.code.parameter_code;

import 'package:analyzer/analyzer.dart';
import 'package:analyzer/src/generated/ast.dart';
import 'package:angular2/src/transform/common/logging.dart';
import 'package:angular2/src/transform/common/model/parameter_model.pb.dart';

import 'constify.dart';

/// Visitor responsible for parsing [FormalParameter]s into
/// [ParameterModel]s.
class ParameterVisitor extends SimpleAstVisitor<ParameterModel> {
  /// Maps field names to their declared types. See `_populateFieldMap`
  final Map<String, TypeName> _fieldNameToType = {};
  final Set<AstNode> _seen = new Set();

  void _populateFieldMap(AstNode node) {
    ClassDeclaration clazz =
        node.getAncestor((node) => node is ClassDeclaration);
    if (_seen.contains(clazz)) return;
    _seen.add(clazz);

    clazz.members
        .where((member) => member is FieldDeclaration)
        .forEach((FieldDeclaration field) {
      var type = field.fields.type;
      if (type != null) {
        field.fields.variables.forEach((VariableDeclaration decl) {
          var key = '${decl.name}';
          if (_fieldNameToType.containsKey(key)) {
            // Need to clear our `seen` list as the type for a var name has
            // changed and could be incorrect.
            _seen.clear();
          }
          _fieldNameToType[key] = type;
        });
      }
    });
  }

  ParameterModel _visitNormalFormalParameter(
      NodeList<Annotation> metadata, TypeName type, SimpleIdentifier name) {
    var model = new ParameterModel();
    if (name != null && name.name != null && name.name.isNotEmpty) {
      model.paramName = '$name';
    }
    if (type != null) {
      var sTypeName = '${type.name}';
      if (sTypeName.isNotEmpty) {
        model.typeName = sTypeName;
      }
      if (type.typeArguments != null) {
        model.typeArgs = '${type.typeArguments}';
      }
    }
    if (metadata != null) {
      model.metadata.addAll(metadata.map(constify));
    }
    return model;
  }

  @override
  ParameterModel visitSimpleFormalParameter(SimpleFormalParameter node) {
    return _visitNormalFormalParameter(
        node.metadata, node.type, node.identifier);
  }

  @override
  ParameterModel visitFieldFormalParameter(FieldFormalParameter node) {
    if (node.parameters != null) {
      log.error('Parameters in ctor not supported '
          '(${node.toSource()})');
    }
    var type = node.type;
    if (type == null) {
      _populateFieldMap(node);
      type = _fieldNameToType[node.identifier.toString()];
    }
    return _visitNormalFormalParameter(node.metadata, type, node.identifier);
  }

  @override
  ParameterModel visitFunctionTypedFormalParameter(
      FunctionTypedFormalParameter node) {
    log.error('Function typed formal parameters not supported '
        '(${node.toSource()})');
    return _visitNormalFormalParameter(node.metadata, null, node.identifier);
  }

  @override
  ParameterModel visitDefaultFormalParameter(DefaultFormalParameter node) {
    // Ignore the declared default value.
    return node.parameter != null ? node.parameter.accept(this) : null;
  }
}

/// Defines the format in which a [ParameterModel] is expressed as Dart code
/// when registered with the reflector.
abstract class ParameterWriterMixin {
  StringBuffer get buffer;

  void writeParameterModelForList(ParameterModel model) {
    buffer.write('const [');
    var first = true;
    if (model.typeName != null && model.typeName.isNotEmpty) {
      if (!first) {
        buffer.write(', ');
      }
      first = false;
      buffer.write('${model.typeName}');
    }
    for (var meta in model.metadata) {
      if (!first) {
        buffer.write(', ');
      }
      first = false;
      buffer.write('$meta');
    }
    buffer.write(']');
  }

  void writeParameterModelForDeclaration(ParameterModel model) {
    if (model.typeName != null && model.typeName.isNotEmpty) {
      buffer.write(model.typeName);
      if (model.typeArgs != null && model.typeArgs.isNotEmpty) {
        buffer.write(model.typeArgs);
      }
      buffer.write(' ');
    }
    if (model.paramName != null && model.paramName.isNotEmpty) {
      buffer.write(model.paramName);
    }
  }

  void writeParameterModelForImpl(ParameterModel model) {
    buffer.write(model.paramName);
  }
}
