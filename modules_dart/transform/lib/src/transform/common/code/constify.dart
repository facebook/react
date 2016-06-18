library angular2.transform.common.code.constify;

import 'package:analyzer/analyzer.dart';
import 'package:analyzer/src/generated/java_core.dart';

/// Serializes the provided [AstNode] to Dart source, replacing `new` in
/// [InstanceCreationExpression]s and the `@` in [Annotation]s with `const`.
String constify(AstNode node) {
  var writer = new PrintStringWriter();
  node.accept(new _ConstifyingVisitor(writer));
  return '$writer';
}

class _ConstifyingVisitor extends ToSourceVisitor {
  final PrintWriter writer;

  _ConstifyingVisitor(PrintWriter writer)
      : this.writer = writer,
        super(writer);

  @override
  Object visitInstanceCreationExpression(InstanceCreationExpression node) {
    if (node.keyword.lexeme == 'const') {
      return super.visitInstanceCreationExpression(node);
    } else if (node.keyword.lexeme == 'new') {
      writer.print('const ');
      if (node.constructorName != null) {
        node.constructorName.accept(this);
      }
      if (node.argumentList != null) {
        node.argumentList.accept(this);
      }
    }
    return null;
  }

  @override
  Object visitAnnotation(Annotation node) {
    var hasArguments =
        node.arguments != null && node.arguments.arguments != null;
    if (hasArguments) {
      writer.print('const ');
    }
    if (node.name != null) {
      node.name.accept(this);
    }
    if (node.constructorName != null) {
      writer.print('.');
      node.constructorName.accept(this);
    }
    if (hasArguments) {
      var args = node.arguments.arguments;
      writer.print('(');
      for (var i = 0, iLen = args.length; i < iLen; ++i) {
        if (i != 0) {
          writer.print(', ');
        }
        args[i].accept(this);
      }
      writer.print(')');
    }
    return null;
  }
}
