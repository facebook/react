library angular2.transform.common.naive_eval;

import 'package:analyzer/analyzer.dart';

final _constantEvaluator = new ConstantEvaluator();

/// The value returned if the result of `naiveEval` is not a constant.
final NOT_A_CONSTANT = ConstantEvaluator.NOT_A_CONSTANT;

/// Performs a very limited syntactic evaluation of `expr`.
///
/// This lack of semantic information means this method cannot do much - for
/// example, it can create a list from a list literal and combine adjacent
/// strings but cannot determine that an identifier is a constant string,
/// even if that identifier is defined in the same [CompilationUnit].
///
/// Returns the result of evaluation or [NOT_A_CONSTANT] where appropriate.
dynamic naiveEval(Expression expr) {
  var val;
  if (expr is SimpleStringLiteral) {
    val = stringLiteralToString(expr);
  } else {
    val = expr.accept(_constantEvaluator);
  }
  return val != NOT_A_CONSTANT ? val : null;
}
