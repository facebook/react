import {BaseException} from '../facade/exceptions';
import {StringWrapper, isBlank, isPresent, isString} from '../facade/lang';

import * as o from './output_ast';

var _SINGLE_QUOTE_ESCAPE_STRING_RE = /'|\\|\n|\r|\$/g;
export var CATCH_ERROR_VAR = o.variable('error');
export var CATCH_STACK_VAR = o.variable('stack');

export abstract class OutputEmitter {
  abstract emitStatements(moduleUrl: string, stmts: o.Statement[], exportedVars: string[]): string;
}

class _EmittedLine {
  parts: string[] = [];
  constructor(public indent: number) {}
}

export class EmitterVisitorContext {
  static createRoot(exportedVars: string[]): EmitterVisitorContext {
    return new EmitterVisitorContext(exportedVars, 0);
  }

  private _lines: _EmittedLine[];
  private _classes: o.ClassStmt[] = [];

  constructor(private _exportedVars: string[], private _indent: number) {
    this._lines = [new _EmittedLine(_indent)];
  }

  private get _currentLine(): _EmittedLine { return this._lines[this._lines.length - 1]; }

  isExportedVar(varName: string): boolean { return this._exportedVars.indexOf(varName) !== -1; }

  println(lastPart: string = ''): void { this.print(lastPart, true); }

  lineIsEmpty(): boolean { return this._currentLine.parts.length === 0; }

  print(part: string, newLine: boolean = false) {
    if (part.length > 0) {
      this._currentLine.parts.push(part);
    }
    if (newLine) {
      this._lines.push(new _EmittedLine(this._indent));
    }
  }

  removeEmptyLastLine() {
    if (this.lineIsEmpty()) {
      this._lines.pop();
    }
  }

  incIndent() {
    this._indent++;
    this._currentLine.indent = this._indent;
  }

  decIndent() {
    this._indent--;
    this._currentLine.indent = this._indent;
  }

  pushClass(clazz: o.ClassStmt) { this._classes.push(clazz); }

  popClass(): o.ClassStmt { return this._classes.pop(); }

  get currentClass(): o.ClassStmt {
    return this._classes.length > 0 ? this._classes[this._classes.length - 1] : null;
  }

  toSource(): any {
    var lines = this._lines;
    if (lines[lines.length - 1].parts.length === 0) {
      lines = lines.slice(0, lines.length - 1);
    }
    return lines
        .map((line) => {
          if (line.parts.length > 0) {
            return _createIndent(line.indent) + line.parts.join('');
          } else {
            return '';
          }
        })
        .join('\n');
  }
}

export abstract class AbstractEmitterVisitor implements o.StatementVisitor, o.ExpressionVisitor {
  constructor(private _escapeDollarInStrings: boolean) {}

  visitExpressionStmt(stmt: o.ExpressionStatement, ctx: EmitterVisitorContext): any {
    stmt.expr.visitExpression(this, ctx);
    ctx.println(';');
    return null;
  }

  visitReturnStmt(stmt: o.ReturnStatement, ctx: EmitterVisitorContext): any {
    ctx.print(`return `);
    stmt.value.visitExpression(this, ctx);
    ctx.println(';');
    return null;
  }

  abstract visitCastExpr(ast: o.CastExpr, context: any): any;

  abstract visitDeclareClassStmt(stmt: o.ClassStmt, ctx: EmitterVisitorContext): any;

  visitIfStmt(stmt: o.IfStmt, ctx: EmitterVisitorContext): any {
    ctx.print(`if (`);
    stmt.condition.visitExpression(this, ctx);
    ctx.print(`) {`);
    var hasElseCase = isPresent(stmt.falseCase) && stmt.falseCase.length > 0;
    if (stmt.trueCase.length <= 1 && !hasElseCase) {
      ctx.print(` `);
      this.visitAllStatements(stmt.trueCase, ctx);
      ctx.removeEmptyLastLine();
      ctx.print(` `);
    } else {
      ctx.println();
      ctx.incIndent();
      this.visitAllStatements(stmt.trueCase, ctx);
      ctx.decIndent();
      if (hasElseCase) {
        ctx.println(`} else {`);
        ctx.incIndent();
        this.visitAllStatements(stmt.falseCase, ctx);
        ctx.decIndent();
      }
    }
    ctx.println(`}`);
    return null;
  }

  abstract visitTryCatchStmt(stmt: o.TryCatchStmt, ctx: EmitterVisitorContext): any;

  visitThrowStmt(stmt: o.ThrowStmt, ctx: EmitterVisitorContext): any {
    ctx.print(`throw `);
    stmt.error.visitExpression(this, ctx);
    ctx.println(`;`);
    return null;
  }
  visitCommentStmt(stmt: o.CommentStmt, ctx: EmitterVisitorContext): any {
    var lines = stmt.comment.split('\n');
    lines.forEach((line) => { ctx.println(`// ${line}`); });
    return null;
  }
  abstract visitDeclareVarStmt(stmt: o.DeclareVarStmt, ctx: EmitterVisitorContext): any;
  visitWriteVarExpr(expr: o.WriteVarExpr, ctx: EmitterVisitorContext): any {
    var lineWasEmpty = ctx.lineIsEmpty();
    if (!lineWasEmpty) {
      ctx.print('(');
    }
    ctx.print(`${expr.name} = `);
    expr.value.visitExpression(this, ctx);
    if (!lineWasEmpty) {
      ctx.print(')');
    }
    return null;
  }
  visitWriteKeyExpr(expr: o.WriteKeyExpr, ctx: EmitterVisitorContext): any {
    var lineWasEmpty = ctx.lineIsEmpty();
    if (!lineWasEmpty) {
      ctx.print('(');
    }
    expr.receiver.visitExpression(this, ctx);
    ctx.print(`[`);
    expr.index.visitExpression(this, ctx);
    ctx.print(`] = `);
    expr.value.visitExpression(this, ctx);
    if (!lineWasEmpty) {
      ctx.print(')');
    }
    return null;
  }
  visitWritePropExpr(expr: o.WritePropExpr, ctx: EmitterVisitorContext): any {
    var lineWasEmpty = ctx.lineIsEmpty();
    if (!lineWasEmpty) {
      ctx.print('(');
    }
    expr.receiver.visitExpression(this, ctx);
    ctx.print(`.${expr.name} = `);
    expr.value.visitExpression(this, ctx);
    if (!lineWasEmpty) {
      ctx.print(')');
    }
    return null;
  }
  visitInvokeMethodExpr(expr: o.InvokeMethodExpr, ctx: EmitterVisitorContext): any {
    expr.receiver.visitExpression(this, ctx);
    var name = expr.name;
    if (isPresent(expr.builtin)) {
      name = this.getBuiltinMethodName(expr.builtin);
      if (isBlank(name)) {
        // some builtins just mean to skip the call.
        // e.g. `bind` in Dart.
        return null;
      }
    }
    ctx.print(`.${name}(`);
    this.visitAllExpressions(expr.args, ctx, `,`);
    ctx.print(`)`);
    return null;
  }

  abstract getBuiltinMethodName(method: o.BuiltinMethod): string;

  visitInvokeFunctionExpr(expr: o.InvokeFunctionExpr, ctx: EmitterVisitorContext): any {
    expr.fn.visitExpression(this, ctx);
    ctx.print(`(`);
    this.visitAllExpressions(expr.args, ctx, ',');
    ctx.print(`)`);
    return null;
  }
  visitReadVarExpr(ast: o.ReadVarExpr, ctx: EmitterVisitorContext): any {
    var varName = ast.name;
    if (isPresent(ast.builtin)) {
      switch (ast.builtin) {
        case o.BuiltinVar.Super:
          varName = 'super';
          break;
        case o.BuiltinVar.This:
          varName = 'this';
          break;
        case o.BuiltinVar.CatchError:
          varName = CATCH_ERROR_VAR.name;
          break;
        case o.BuiltinVar.CatchStack:
          varName = CATCH_STACK_VAR.name;
          break;
        default:
          throw new BaseException(`Unknown builtin variable ${ast.builtin}`);
      }
    }
    ctx.print(varName);
    return null;
  }
  visitInstantiateExpr(ast: o.InstantiateExpr, ctx: EmitterVisitorContext): any {
    ctx.print(`new `);
    ast.classExpr.visitExpression(this, ctx);
    ctx.print(`(`);
    this.visitAllExpressions(ast.args, ctx, ',');
    ctx.print(`)`);
    return null;
  }
  visitLiteralExpr(ast: o.LiteralExpr, ctx: EmitterVisitorContext): any {
    var value = ast.value;
    if (isString(value)) {
      ctx.print(escapeSingleQuoteString(value, this._escapeDollarInStrings));
    } else if (isBlank(value)) {
      ctx.print('null');
    } else {
      ctx.print(`${value}`);
    }
    return null;
  }

  abstract visitExternalExpr(ast: o.ExternalExpr, ctx: EmitterVisitorContext): any;

  visitConditionalExpr(ast: o.ConditionalExpr, ctx: EmitterVisitorContext): any {
    ctx.print(`(`);
    ast.condition.visitExpression(this, ctx);
    ctx.print('? ');
    ast.trueCase.visitExpression(this, ctx);
    ctx.print(': ');
    ast.falseCase.visitExpression(this, ctx);
    ctx.print(`)`);
    return null;
  }
  visitNotExpr(ast: o.NotExpr, ctx: EmitterVisitorContext): any {
    ctx.print('!');
    ast.condition.visitExpression(this, ctx);
    return null;
  }
  abstract visitFunctionExpr(ast: o.FunctionExpr, ctx: EmitterVisitorContext): any;
  abstract visitDeclareFunctionStmt(stmt: o.DeclareFunctionStmt, context: any): any;

  visitBinaryOperatorExpr(ast: o.BinaryOperatorExpr, ctx: EmitterVisitorContext): any {
    var opStr: any /** TODO #9100 */;
    switch (ast.operator) {
      case o.BinaryOperator.Equals:
        opStr = '==';
        break;
      case o.BinaryOperator.Identical:
        opStr = '===';
        break;
      case o.BinaryOperator.NotEquals:
        opStr = '!=';
        break;
      case o.BinaryOperator.NotIdentical:
        opStr = '!==';
        break;
      case o.BinaryOperator.And:
        opStr = '&&';
        break;
      case o.BinaryOperator.Or:
        opStr = '||';
        break;
      case o.BinaryOperator.Plus:
        opStr = '+';
        break;
      case o.BinaryOperator.Minus:
        opStr = '-';
        break;
      case o.BinaryOperator.Divide:
        opStr = '/';
        break;
      case o.BinaryOperator.Multiply:
        opStr = '*';
        break;
      case o.BinaryOperator.Modulo:
        opStr = '%';
        break;
      case o.BinaryOperator.Lower:
        opStr = '<';
        break;
      case o.BinaryOperator.LowerEquals:
        opStr = '<=';
        break;
      case o.BinaryOperator.Bigger:
        opStr = '>';
        break;
      case o.BinaryOperator.BiggerEquals:
        opStr = '>=';
        break;
      default:
        throw new BaseException(`Unknown operator ${ast.operator}`);
    }
    ctx.print(`(`);
    ast.lhs.visitExpression(this, ctx);
    ctx.print(` ${opStr} `);
    ast.rhs.visitExpression(this, ctx);
    ctx.print(`)`);
    return null;
  }

  visitReadPropExpr(ast: o.ReadPropExpr, ctx: EmitterVisitorContext): any {
    ast.receiver.visitExpression(this, ctx);
    ctx.print(`.`);
    ctx.print(ast.name);
    return null;
  }
  visitReadKeyExpr(ast: o.ReadKeyExpr, ctx: EmitterVisitorContext): any {
    ast.receiver.visitExpression(this, ctx);
    ctx.print(`[`);
    ast.index.visitExpression(this, ctx);
    ctx.print(`]`);
    return null;
  }
  visitLiteralArrayExpr(ast: o.LiteralArrayExpr, ctx: EmitterVisitorContext): any {
    var useNewLine = ast.entries.length > 1;
    ctx.print(`[`, useNewLine);
    ctx.incIndent();
    this.visitAllExpressions(ast.entries, ctx, ',', useNewLine);
    ctx.decIndent();
    ctx.print(`]`, useNewLine);
    return null;
  }
  visitLiteralMapExpr(ast: o.LiteralMapExpr, ctx: EmitterVisitorContext): any {
    var useNewLine = ast.entries.length > 1;
    ctx.print(`{`, useNewLine);
    ctx.incIndent();
    this.visitAllObjects((entry: any /** TODO #9100 */) => {
      ctx.print(`${escapeSingleQuoteString(entry[0], this._escapeDollarInStrings)}: `);
      entry[1].visitExpression(this, ctx);
    }, ast.entries, ctx, ',', useNewLine);
    ctx.decIndent();
    ctx.print(`}`, useNewLine);
    return null;
  }

  visitAllExpressions(
      expressions: o.Expression[], ctx: EmitterVisitorContext, separator: string,
      newLine: boolean = false): void {
    this.visitAllObjects(
        (expr: any /** TODO #9100 */) => expr.visitExpression(this, ctx), expressions, ctx,
        separator, newLine);
  }

  visitAllObjects(
      handler: Function, expressions: any, ctx: EmitterVisitorContext, separator: string,
      newLine: boolean = false): void {
    for (var i = 0; i < expressions.length; i++) {
      if (i > 0) {
        ctx.print(separator, newLine);
      }
      handler(expressions[i]);
    }
    if (newLine) {
      ctx.println();
    }
  }

  visitAllStatements(statements: o.Statement[], ctx: EmitterVisitorContext): void {
    statements.forEach((stmt) => { return stmt.visitStatement(this, ctx); });
  }
}

export function escapeSingleQuoteString(input: string, escapeDollar: boolean): any {
  if (isBlank(input)) {
    return null;
  }
  var body = StringWrapper.replaceAllMapped(
      input, _SINGLE_QUOTE_ESCAPE_STRING_RE, (match: any /** TODO #9100 */) => {
        if (match[0] == '$') {
          return escapeDollar ? '\\$' : '$';
        } else if (match[0] == '\n') {
          return '\\n';
        } else if (match[0] == '\r') {
          return '\\r';
        } else {
          return `\\${match[0]}`;
        }
      });
  return `'${body}'`;
}

function _createIndent(count: number): string {
  var res = '';
  for (var i = 0; i < count; i++) {
    res += '  ';
  }
  return res;
}
