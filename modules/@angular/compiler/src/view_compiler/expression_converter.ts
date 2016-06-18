import * as cdAst from '../expression_parser/ast';
import {BaseException} from '../facade/exceptions';
import {isArray, isBlank, isPresent} from '../facade/lang';
import {Identifiers} from '../identifiers';
import * as o from '../output/output_ast';

var IMPLICIT_RECEIVER = o.variable('#implicit');

export interface NameResolver {
  callPipe(name: string, input: o.Expression, args: o.Expression[]): o.Expression;
  getLocal(name: string): o.Expression;
  createLiteralArray(values: o.Expression[]): o.Expression;
  createLiteralMap(values: Array<Array<string|o.Expression>>): o.Expression;
}

export class ExpressionWithWrappedValueInfo {
  constructor(public expression: o.Expression, public needsValueUnwrapper: boolean) {}
}

export function convertCdExpressionToIr(
    nameResolver: NameResolver, implicitReceiver: o.Expression, expression: cdAst.AST,
    valueUnwrapper: o.ReadVarExpr): ExpressionWithWrappedValueInfo {
  var visitor = new _AstToIrVisitor(nameResolver, implicitReceiver, valueUnwrapper);
  var irAst: o.Expression = expression.visit(visitor, _Mode.Expression);
  return new ExpressionWithWrappedValueInfo(irAst, visitor.needsValueUnwrapper);
}

export function convertCdStatementToIr(
    nameResolver: NameResolver, implicitReceiver: o.Expression, stmt: cdAst.AST): o.Statement[] {
  var visitor = new _AstToIrVisitor(nameResolver, implicitReceiver, null);
  var statements: any[] /** TODO #9100 */ = [];
  flattenStatements(stmt.visit(visitor, _Mode.Statement), statements);
  return statements;
}

enum _Mode {
  Statement,
  Expression
}

function ensureStatementMode(mode: _Mode, ast: cdAst.AST) {
  if (mode !== _Mode.Statement) {
    throw new BaseException(`Expected a statement, but saw ${ast}`);
  }
}

function ensureExpressionMode(mode: _Mode, ast: cdAst.AST) {
  if (mode !== _Mode.Expression) {
    throw new BaseException(`Expected an expression, but saw ${ast}`);
  }
}

function convertToStatementIfNeeded(mode: _Mode, expr: o.Expression): o.Expression|o.Statement {
  if (mode === _Mode.Statement) {
    return expr.toStmt();
  } else {
    return expr;
  }
}

class _AstToIrVisitor implements cdAst.AstVisitor {
  public needsValueUnwrapper: boolean = false;

  constructor(
      private _nameResolver: NameResolver, private _implicitReceiver: o.Expression,
      private _valueUnwrapper: o.ReadVarExpr) {}

  visitBinary(ast: cdAst.Binary, mode: _Mode): any {
    var op: any /** TODO #9100 */;
    switch (ast.operation) {
      case '+':
        op = o.BinaryOperator.Plus;
        break;
      case '-':
        op = o.BinaryOperator.Minus;
        break;
      case '*':
        op = o.BinaryOperator.Multiply;
        break;
      case '/':
        op = o.BinaryOperator.Divide;
        break;
      case '%':
        op = o.BinaryOperator.Modulo;
        break;
      case '&&':
        op = o.BinaryOperator.And;
        break;
      case '||':
        op = o.BinaryOperator.Or;
        break;
      case '==':
        op = o.BinaryOperator.Equals;
        break;
      case '!=':
        op = o.BinaryOperator.NotEquals;
        break;
      case '===':
        op = o.BinaryOperator.Identical;
        break;
      case '!==':
        op = o.BinaryOperator.NotIdentical;
        break;
      case '<':
        op = o.BinaryOperator.Lower;
        break;
      case '>':
        op = o.BinaryOperator.Bigger;
        break;
      case '<=':
        op = o.BinaryOperator.LowerEquals;
        break;
      case '>=':
        op = o.BinaryOperator.BiggerEquals;
        break;
      default:
        throw new BaseException(`Unsupported operation ${ast.operation}`);
    }

    return convertToStatementIfNeeded(
        mode,
        new o.BinaryOperatorExpr(
            op, ast.left.visit(this, _Mode.Expression), ast.right.visit(this, _Mode.Expression)));
  }
  visitChain(ast: cdAst.Chain, mode: _Mode): any {
    ensureStatementMode(mode, ast);
    return this.visitAll(ast.expressions, mode);
  }
  visitConditional(ast: cdAst.Conditional, mode: _Mode): any {
    var value: o.Expression = ast.condition.visit(this, _Mode.Expression);
    return convertToStatementIfNeeded(
        mode,
        value.conditional(
            ast.trueExp.visit(this, _Mode.Expression), ast.falseExp.visit(this, _Mode.Expression)));
  }
  visitPipe(ast: cdAst.BindingPipe, mode: _Mode): any {
    var input = ast.exp.visit(this, _Mode.Expression);
    var args = this.visitAll(ast.args, _Mode.Expression);
    var value = this._nameResolver.callPipe(ast.name, input, args);
    this.needsValueUnwrapper = true;
    return convertToStatementIfNeeded(mode, this._valueUnwrapper.callMethod('unwrap', [value]));
  }
  visitFunctionCall(ast: cdAst.FunctionCall, mode: _Mode): any {
    return convertToStatementIfNeeded(
        mode,
        ast.target.visit(this, _Mode.Expression).callFn(this.visitAll(ast.args, _Mode.Expression)));
  }
  visitImplicitReceiver(ast: cdAst.ImplicitReceiver, mode: _Mode): any {
    ensureExpressionMode(mode, ast);
    return IMPLICIT_RECEIVER;
  }
  visitInterpolation(ast: cdAst.Interpolation, mode: _Mode): any {
    ensureExpressionMode(mode, ast);
    var args = [o.literal(ast.expressions.length)];
    for (var i = 0; i < ast.strings.length - 1; i++) {
      args.push(o.literal(ast.strings[i]));
      args.push(ast.expressions[i].visit(this, _Mode.Expression));
    }
    args.push(o.literal(ast.strings[ast.strings.length - 1]));
    return o.importExpr(Identifiers.interpolate).callFn(args);
  }
  visitKeyedRead(ast: cdAst.KeyedRead, mode: _Mode): any {
    return convertToStatementIfNeeded(
        mode, ast.obj.visit(this, _Mode.Expression).key(ast.key.visit(this, _Mode.Expression)));
  }
  visitKeyedWrite(ast: cdAst.KeyedWrite, mode: _Mode): any {
    var obj: o.Expression = ast.obj.visit(this, _Mode.Expression);
    var key: o.Expression = ast.key.visit(this, _Mode.Expression);
    var value: o.Expression = ast.value.visit(this, _Mode.Expression);
    return convertToStatementIfNeeded(mode, obj.key(key).set(value));
  }
  visitLiteralArray(ast: cdAst.LiteralArray, mode: _Mode): any {
    return convertToStatementIfNeeded(
        mode, this._nameResolver.createLiteralArray(this.visitAll(ast.expressions, mode)));
  }
  visitLiteralMap(ast: cdAst.LiteralMap, mode: _Mode): any {
    var parts: any[] /** TODO #9100 */ = [];
    for (var i = 0; i < ast.keys.length; i++) {
      parts.push([ast.keys[i], ast.values[i].visit(this, _Mode.Expression)]);
    }
    return convertToStatementIfNeeded(mode, this._nameResolver.createLiteralMap(parts));
  }
  visitLiteralPrimitive(ast: cdAst.LiteralPrimitive, mode: _Mode): any {
    return convertToStatementIfNeeded(mode, o.literal(ast.value));
  }
  visitMethodCall(ast: cdAst.MethodCall, mode: _Mode): any {
    var args = this.visitAll(ast.args, _Mode.Expression);
    var result: any /** TODO #9100 */ = null;
    var receiver = ast.receiver.visit(this, _Mode.Expression);
    if (receiver === IMPLICIT_RECEIVER) {
      var varExpr = this._nameResolver.getLocal(ast.name);
      if (isPresent(varExpr)) {
        result = varExpr.callFn(args);
      } else {
        receiver = this._implicitReceiver;
      }
    }
    if (isBlank(result)) {
      result = receiver.callMethod(ast.name, args);
    }
    return convertToStatementIfNeeded(mode, result);
  }
  visitPrefixNot(ast: cdAst.PrefixNot, mode: _Mode): any {
    return convertToStatementIfNeeded(mode, o.not(ast.expression.visit(this, _Mode.Expression)));
  }
  visitPropertyRead(ast: cdAst.PropertyRead, mode: _Mode): any {
    var result: any /** TODO #9100 */ = null;
    var receiver = ast.receiver.visit(this, _Mode.Expression);
    if (receiver === IMPLICIT_RECEIVER) {
      result = this._nameResolver.getLocal(ast.name);
      if (isBlank(result)) {
        receiver = this._implicitReceiver;
      }
    }
    if (isBlank(result)) {
      result = receiver.prop(ast.name);
    }
    return convertToStatementIfNeeded(mode, result);
  }
  visitPropertyWrite(ast: cdAst.PropertyWrite, mode: _Mode): any {
    var receiver: o.Expression = ast.receiver.visit(this, _Mode.Expression);
    if (receiver === IMPLICIT_RECEIVER) {
      var varExpr = this._nameResolver.getLocal(ast.name);
      if (isPresent(varExpr)) {
        throw new BaseException('Cannot assign to a reference or variable!');
      }
      receiver = this._implicitReceiver;
    }
    return convertToStatementIfNeeded(
        mode, receiver.prop(ast.name).set(ast.value.visit(this, _Mode.Expression)));
  }
  visitSafePropertyRead(ast: cdAst.SafePropertyRead, mode: _Mode): any {
    var receiver = ast.receiver.visit(this, _Mode.Expression);
    return convertToStatementIfNeeded(
        mode, receiver.isBlank().conditional(o.NULL_EXPR, receiver.prop(ast.name)));
  }
  visitSafeMethodCall(ast: cdAst.SafeMethodCall, mode: _Mode): any {
    var receiver = ast.receiver.visit(this, _Mode.Expression);
    var args = this.visitAll(ast.args, _Mode.Expression);
    return convertToStatementIfNeeded(
        mode, receiver.isBlank().conditional(o.NULL_EXPR, receiver.callMethod(ast.name, args)));
  }
  visitAll(asts: cdAst.AST[], mode: _Mode): any { return asts.map(ast => ast.visit(this, mode)); }
  visitQuote(ast: cdAst.Quote, mode: _Mode): any {
    throw new BaseException('Quotes are not supported for evaluation!');
  }
}

function flattenStatements(arg: any, output: o.Statement[]) {
  if (isArray(arg)) {
    (<any[]>arg).forEach((entry) => flattenStatements(entry, output));
  } else {
    output.push(arg);
  }
}
