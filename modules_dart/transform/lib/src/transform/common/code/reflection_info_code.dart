library angular2.transform.common.code.reflection_info_code;

import 'package:analyzer/analyzer.dart';
import 'package:angular2/src/transform/common/annotation_matcher.dart';
import 'package:angular2/src/transform/common/logging.dart';
import 'package:angular2/src/transform/common/model/reflection_info_model.pb.dart';
import 'package:angular2/src/transform/common/names.dart';
import 'package:barback/barback.dart' show AssetId;

import 'annotation_code.dart';
import 'parameter_code.dart';

/// Visitor responsible for parsing [ClassDeclaration]s into
/// [ReflectionInfoModel]s.
class ReflectionInfoVisitor extends RecursiveAstVisitor<ReflectionInfoModel> {
  /// The file we are processing.
  final AssetId assetId;

  /// Responsible for testing whether [Annotation]s are those recognized by
  /// Angular 2, for example `@Component`.
  final AnnotationMatcher _annotationMatcher;

  final AnnotationVisitor _annotationVisitor;
  final ParameterVisitor _parameterVisitor = new ParameterVisitor();

  ReflectionInfoVisitor._(this.assetId, this._annotationMatcher,
      this._annotationVisitor);

  factory ReflectionInfoVisitor(
      AssetId assetId, AnnotationMatcher annotationMatcher) {
    var annotationVisitor = new AnnotationVisitor(assetId);
    return new ReflectionInfoVisitor._(assetId, annotationMatcher,
        annotationVisitor);
  }

  ConstructorDeclaration _getCtor(ClassDeclaration node) {
    int numCtorsFound = 0;
    var ctor = null;

    for (ClassMember classMember in node.members) {
      if (classMember is ConstructorDeclaration) {
        numCtorsFound++;
        ConstructorDeclaration constructor = classMember;

        // Use the unnnamed constructor if it is present.
        // Otherwise, use the first encountered.
        if (ctor == null) {
          ctor = constructor;
        } else if (constructor.name == null) {
          ctor = constructor;
        }
      }
    }
    if (numCtorsFound > 1) {
      var ctorName = ctor.name;
      if (ctorName != null) {
        log.warning(
            'Found ${numCtorsFound} constructors for class '
            '${node.name}; using constructor ${ctorName}.',
            asset: assetId);
      }
    }
    return ctor;
  }

  @override
  ReflectionInfoModel visitClassDeclaration(ClassDeclaration node) {
    if (!node.metadata
        .any((a) => _annotationMatcher.hasMatch(a.name, assetId))) {
      return null;
    }

    var ctor = _getCtor(node);
    var model = new ReflectionInfoModel()..name = '${node.name}';
    if (ctor != null && ctor.name != null) {
      model.ctorName = '${ctor.name}';
    }

    if (node.metadata != null) {
      var componentDirectives = new Iterable.empty();
      var componentPipes = new Iterable.empty();
      var viewDirectives, viewPipes;
      node.metadata.forEach((node) {
        var keepAnnotation = true;
        if (_annotationMatcher.isComponent(node, assetId)) {
          componentDirectives = _extractReferencedTypes(node, 'directives');
          componentPipes = _extractReferencedTypes(node, 'pipes');
          keepAnnotation = false;
        } else if (_annotationMatcher.isView(node, assetId)) {
          viewDirectives = _extractReferencedTypes(node, 'directives');
          viewPipes = _extractReferencedTypes(node, 'pipes');
          keepAnnotation = false;
        } else if (_annotationMatcher.isDirective(node, assetId)) {
          keepAnnotation = false;
        }
        if (keepAnnotation) {
          model.annotations.add(_annotationVisitor.visitAnnotation(node));
        }
      });
      if ((componentDirectives.isNotEmpty || componentPipes.isNotEmpty) &&
          (viewDirectives != null || viewPipes != null)) {
        log.warning(
            'Cannot specify view parameters on @Component when a @View '
            'is present. Component name: ${model.name}',
            asset: assetId);
      }
      model.directives.addAll(componentDirectives);
      model.pipes.addAll(componentPipes);
      if (viewDirectives != null) {
        model.directives.addAll(viewDirectives);
      }
      if (viewPipes != null) {
        model.pipes.addAll(viewPipes);
      }
    }
    if (ctor != null &&
        ctor.parameters != null &&
        ctor.parameters.parameters != null) {
      ctor.parameters.parameters.forEach((node) {
        model.parameters.add(node.accept(_parameterVisitor));
      });
    }
    if (node.implementsClause != null &&
        node.implementsClause.interfaces != null &&
        node.implementsClause.interfaces.isNotEmpty) {
      model.interfaces.addAll(node.implementsClause.interfaces
          .map((interface) => '${interface.name}'));
    }

    return model;
  }

  /// Returns [PrefixedType] values parsed from the value of the
  /// `fieldName` parameter of the provided `node`.
  /// This will always return a non-null value, so if there is no field
  /// called `fieldName`, it will return an empty iterable.
  Iterable<PrefixedType> _extractReferencedTypes(
      Annotation node, String fieldName) {
    assert(_annotationMatcher.isComponent(node, assetId) ||
        _annotationMatcher.isView(node, assetId));

    if (node.arguments == null && node.arguments.arguments == null) {
      return const [];
    }
    final typesNode = node.arguments.arguments.firstWhere((arg) {
      return arg is NamedExpression && '${arg.name.label}' == fieldName;
    }, orElse: () => null);
    if (typesNode == null) return const [];

    if (typesNode.expression is! ListLiteral) {
      log.warning(
          'Angular 2 expects a list literal for `${fieldName}` '
          'but found a ${typesNode.expression.runtimeType}',
          asset: assetId);
      return const [];
    }
    final types = <PrefixedType>[];
    for (var dep in (typesNode.expression as ListLiteral).elements) {
      if (dep is PrefixedIdentifier) {
        types.add(new PrefixedType()
          ..prefix = '${dep.prefix}'
          ..name = '${dep.identifier}');
      } else if (dep is Identifier) {
        types.add(new PrefixedType()..name = '${dep}');
      } else {
        log.warning('Ignoring unexpected value $dep in `${fieldName}`.',
            asset: assetId);
      }
    }
    return types;
  }

  @override
  ReflectionInfoModel visitFunctionDeclaration(FunctionDeclaration node) {
    if (!node.metadata
        .any((a) => _annotationMatcher.hasMatch(a.name, assetId))) {
      return null;
    }

    var model = new ReflectionInfoModel()
      ..name = '${node.name}'
      ..isFunction = true;
    if (node.metadata != null) {
      node.metadata.forEach((node) {
        var annotation = _annotationVisitor.visitAnnotation(node);
        if (annotation != null) {
          model.annotations.add(annotation);
        }
      });
    }
    if (node.functionExpression.parameters != null &&
        node.functionExpression.parameters.parameters != null) {
      node.functionExpression.parameters.parameters.forEach((node) {
        var param = node.accept(_parameterVisitor);
        if (param != null) {
          model.parameters.add(param);
        }
      });
    }
    return model;
  }
}

/// Defines the format in which an [ReflectionInfoModel] is expressed as Dart
/// code when registered with the reflector.
abstract class ReflectionWriterMixin
    implements AnnotationWriterMixin, ParameterWriterMixin {
  StringBuffer get buffer;

  void _writeListWithSeparator(List l, Function writeFn,
      {String prefix, String suffix, String separator: ', '}) {
    buffer.write(prefix);
    for (var i = 0, iLen = l.length; i < iLen; ++i) {
      if (i != 0) {
        buffer.write(', ');
      }
      writeFn(l[i]);
    }
    buffer.write(suffix);
  }

  void writeRegistration(ReflectionInfoModel model) {
    buffer.write('..register');
    if (model.isFunction) {
      buffer.write('Function');
    } else {
      buffer.write('Type');
    }
    buffer.writeln('(${model.name}, new $REFLECTOR_PREFIX.ReflectionInfo(');

    // Annotations
    _writeListWithSeparator(model.annotations, writeAnnotationModel,
        prefix: 'const [', suffix: ']');
    // Parameters
    _writeListWithSeparator(model.parameters, writeParameterModelForList,
        prefix: ',\nconst [', suffix: ']');
    if (!model.isFunction) {
      // Factory
      _writeListWithSeparator(
          model.parameters, writeParameterModelForDeclaration,
          prefix: ',\n(', suffix: ')');
      buffer.write(' => new ${model.name}');
      if (model.ctorName != null && model.ctorName.isNotEmpty) {
        buffer.write('.${model.ctorName}');
      }
      _writeListWithSeparator(model.parameters, writeParameterModelForImpl,
          prefix: '(', suffix: ')');
      // Interfaces
      if (model.interfaces != null && model.interfaces.isNotEmpty) {
        _writeListWithSeparator(model.interfaces, buffer.write,
            prefix: ',\nconst [', suffix: ']');
      }
    }
    buffer.writeln(')\n)');
  }
}
