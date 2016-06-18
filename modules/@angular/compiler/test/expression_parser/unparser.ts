import {AST, AstVisitor, Binary, BindingPipe, Chain, Conditional, EmptyExpr, FunctionCall, ImplicitReceiver, Interpolation, KeyedRead, KeyedWrite, LiteralArray, LiteralMap, LiteralPrimitive, MethodCall, PrefixNot, PropertyRead, PropertyWrite, Quote, SafeMethodCall, SafePropertyRead} from '../../src/expression_parser/ast';
import {StringWrapper, isPresent, isString} from '../../src/facade/lang';

export class Unparser implements AstVisitor {
  private static _quoteRegExp = /"/g;
  private _expression: string;

  unparse(ast: AST) {
    this._expression = '';
    this._visit(ast);
    return this._expression;
  }

  visitPropertyRead(ast: PropertyRead, context: any) {
    this._visit(ast.receiver);
    this._expression += ast.receiver instanceof ImplicitReceiver ? `${ast.name}` : `.${ast.name}`;
  }

  visitPropertyWrite(ast: PropertyWrite, context: any) {
    this._visit(ast.receiver);
    this._expression +=
        ast.receiver instanceof ImplicitReceiver ? `${ast.name} = ` : `.${ast.name} = `;
    this._visit(ast.value);
  }

  visitBinary(ast: Binary, context: any) {
    this._visit(ast.left);
    this._expression += ` ${ast.operation} `;
    this._visit(ast.right);
  }

  visitChain(ast: Chain, context: any) {
    var len = ast.expressions.length;
    for (let i = 0; i < len; i++) {
      this._visit(ast.expressions[i]);
      this._expression += i == len - 1 ? ';' : '; ';
    }
  }

  visitConditional(ast: Conditional, context: any) {
    this._visit(ast.condition);
    this._expression += ' ? ';
    this._visit(ast.trueExp);
    this._expression += ' : ';
    this._visit(ast.falseExp);
  }

  visitPipe(ast: BindingPipe, context: any) {
    this._expression += '(';
    this._visit(ast.exp);
    this._expression += ` | ${ast.name}`;
    ast.args.forEach(arg => {
      this._expression += ':';
      this._visit(arg);
    });
    this._expression += ')';
  }

  visitFunctionCall(ast: FunctionCall, context: any) {
    this._visit(ast.target);
    this._expression += '(';
    var isFirst = true;
    ast.args.forEach(arg => {
      if (!isFirst) this._expression += ', ';
      isFirst = false;
      this._visit(arg);
    });
    this._expression += ')';
  }

  visitImplicitReceiver(ast: ImplicitReceiver, context: any) {}

  visitInterpolation(ast: Interpolation, context: any) {
    for (let i = 0; i < ast.strings.length; i++) {
      this._expression += ast.strings[i];
      if (i < ast.expressions.length) {
        this._expression += '{{ ';
        this._visit(ast.expressions[i]);
        this._expression += ' }}';
      }
    }
  }

  visitKeyedRead(ast: KeyedRead, context: any) {
    this._visit(ast.obj);
    this._expression += '[';
    this._visit(ast.key);
    this._expression += ']';
  }

  visitKeyedWrite(ast: KeyedWrite, context: any) {
    this._visit(ast.obj);
    this._expression += '[';
    this._visit(ast.key);
    this._expression += '] = ';
    this._visit(ast.value);
  }

  visitLiteralArray(ast: LiteralArray, context: any) {
    this._expression += '[';
    var isFirst = true;
    ast.expressions.forEach(expression => {
      if (!isFirst) this._expression += ', ';
      isFirst = false;
      this._visit(expression);
    });

    this._expression += ']';
  }

  visitLiteralMap(ast: LiteralMap, context: any) {
    this._expression += '{';
    var isFirst = true;
    for (let i = 0; i < ast.keys.length; i++) {
      if (!isFirst) this._expression += ', ';
      isFirst = false;
      this._expression += `${ast.keys[i]}: `;
      this._visit(ast.values[i]);
    }

    this._expression += '}';
  }

  visitLiteralPrimitive(ast: LiteralPrimitive, context: any) {
    if (isString(ast.value)) {
      this._expression += `"${StringWrapper.replaceAll(ast.value, Unparser._quoteRegExp, '\"')}"`;
    } else {
      this._expression += `${ast.value}`;
    }
  }

  visitMethodCall(ast: MethodCall, context: any) {
    this._visit(ast.receiver);
    this._expression += ast.receiver instanceof ImplicitReceiver ? `${ast.name}(` : `.${ast.name}(`;
    var isFirst = true;
    ast.args.forEach(arg => {
      if (!isFirst) this._expression += ', ';
      isFirst = false;
      this._visit(arg);
    });
    this._expression += ')';
  }

  visitPrefixNot(ast: PrefixNot, context: any) {
    this._expression += '!';
    this._visit(ast.expression);
  }

  visitSafePropertyRead(ast: SafePropertyRead, context: any) {
    this._visit(ast.receiver);
    this._expression += `?.${ast.name}`;
  }

  visitSafeMethodCall(ast: SafeMethodCall, context: any) {
    this._visit(ast.receiver);
    this._expression += `?.${ast.name}(`;
    var isFirst = true;
    ast.args.forEach(arg => {
      if (!isFirst) this._expression += ', ';
      isFirst = false;
      this._visit(arg);
    });
    this._expression += ')';
  }

  visitQuote(ast: Quote, context: any) {
    this._expression += `${ast.prefix}:${ast.uninterpretedExpression}`;
  }

  private _visit(ast: AST) { ast.visit(this); }
}
