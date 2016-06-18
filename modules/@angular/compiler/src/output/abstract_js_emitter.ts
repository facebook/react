import {BaseException} from '../facade/exceptions';
import {isPresent} from '../facade/lang';

import {AbstractEmitterVisitor, CATCH_ERROR_VAR, CATCH_STACK_VAR, EmitterVisitorContext} from './abstract_emitter';
import * as o from './output_ast';

export abstract class AbstractJsEmitterVisitor extends AbstractEmitterVisitor {
  constructor() { super(false); }
  visitDeclareClassStmt(stmt: o.ClassStmt, ctx: EmitterVisitorContext): any {
    ctx.pushClass(stmt);
    this._visitClassConstructor(stmt, ctx);

    if (isPresent(stmt.parent)) {
      ctx.print(`${stmt.name}.prototype = Object.create(`);
      stmt.parent.visitExpression(this, ctx);
      ctx.println(`.prototype);`);
    }
    stmt.getters.forEach((getter) => this._visitClassGetter(stmt, getter, ctx));
    stmt.methods.forEach((method) => this._visitClassMethod(stmt, method, ctx));
    ctx.popClass();
    return null;
  }

  private _visitClassConstructor(stmt: o.ClassStmt, ctx: EmitterVisitorContext) {
    ctx.print(`function ${stmt.name}(`);
    if (isPresent(stmt.constructorMethod)) {
      this._visitParams(stmt.constructorMethod.params, ctx);
    }
    ctx.println(`) {`);
    ctx.incIndent();
    if (isPresent(stmt.constructorMethod)) {
      if (stmt.constructorMethod.body.length > 0) {
        ctx.println(`var self = this;`);
        this.visitAllStatements(stmt.constructorMethod.body, ctx);
      }
    }
    ctx.decIndent();
    ctx.println(`}`);
  }

  private _visitClassGetter(stmt: o.ClassStmt, getter: o.ClassGetter, ctx: EmitterVisitorContext) {
    ctx.println(
        `Object.defineProperty(${stmt.name}.prototype, '${getter.name}', { get: function() {`);
    ctx.incIndent();
    if (getter.body.length > 0) {
      ctx.println(`var self = this;`);
      this.visitAllStatements(getter.body, ctx);
    }
    ctx.decIndent();
    ctx.println(`}});`);
  }

  private _visitClassMethod(stmt: o.ClassStmt, method: o.ClassMethod, ctx: EmitterVisitorContext) {
    ctx.print(`${stmt.name}.prototype.${method.name} = function(`);
    this._visitParams(method.params, ctx);
    ctx.println(`) {`);
    ctx.incIndent();
    if (method.body.length > 0) {
      ctx.println(`var self = this;`);
      this.visitAllStatements(method.body, ctx);
    }
    ctx.decIndent();
    ctx.println(`};`);
  }

  visitReadVarExpr(ast: o.ReadVarExpr, ctx: EmitterVisitorContext): string {
    if (ast.builtin === o.BuiltinVar.This) {
      ctx.print('self');
    } else if (ast.builtin === o.BuiltinVar.Super) {
      throw new BaseException(
          `'super' needs to be handled at a parent ast node, not at the variable level!`);
    } else {
      super.visitReadVarExpr(ast, ctx);
    }
    return null;
  }
  visitDeclareVarStmt(stmt: o.DeclareVarStmt, ctx: EmitterVisitorContext): any {
    ctx.print(`var ${stmt.name} = `);
    stmt.value.visitExpression(this, ctx);
    ctx.println(`;`);
    return null;
  }
  visitCastExpr(ast: o.CastExpr, ctx: EmitterVisitorContext): any {
    ast.value.visitExpression(this, ctx);
    return null;
  }
  visitInvokeFunctionExpr(expr: o.InvokeFunctionExpr, ctx: EmitterVisitorContext): string {
    var fnExpr = expr.fn;
    if (fnExpr instanceof o.ReadVarExpr && fnExpr.builtin === o.BuiltinVar.Super) {
      ctx.currentClass.parent.visitExpression(this, ctx);
      ctx.print(`.call(this`);
      if (expr.args.length > 0) {
        ctx.print(`, `);
        this.visitAllExpressions(expr.args, ctx, ',');
      }
      ctx.print(`)`);
    } else {
      super.visitInvokeFunctionExpr(expr, ctx);
    }
    return null;
  }
  visitFunctionExpr(ast: o.FunctionExpr, ctx: EmitterVisitorContext): any {
    ctx.print(`function(`);
    this._visitParams(ast.params, ctx);
    ctx.println(`) {`);
    ctx.incIndent();
    this.visitAllStatements(ast.statements, ctx);
    ctx.decIndent();
    ctx.print(`}`);
    return null;
  }
  visitDeclareFunctionStmt(stmt: o.DeclareFunctionStmt, ctx: EmitterVisitorContext): any {
    ctx.print(`function ${stmt.name}(`);
    this._visitParams(stmt.params, ctx);
    ctx.println(`) {`);
    ctx.incIndent();
    this.visitAllStatements(stmt.statements, ctx);
    ctx.decIndent();
    ctx.println(`}`);
    return null;
  }
  visitTryCatchStmt(stmt: o.TryCatchStmt, ctx: EmitterVisitorContext): any {
    ctx.println(`try {`);
    ctx.incIndent();
    this.visitAllStatements(stmt.bodyStmts, ctx);
    ctx.decIndent();
    ctx.println(`} catch (${CATCH_ERROR_VAR.name}) {`);
    ctx.incIndent();
    var catchStmts =
        [<o.Statement>CATCH_STACK_VAR.set(CATCH_ERROR_VAR.prop('stack')).toDeclStmt(null, [
          o.StmtModifier.Final
        ])].concat(stmt.catchStmts);
    this.visitAllStatements(catchStmts, ctx);
    ctx.decIndent();
    ctx.println(`}`);
    return null;
  }

  private _visitParams(params: o.FnParam[], ctx: EmitterVisitorContext): void {
    this.visitAllObjects((param: any /** TODO #9100 */) => ctx.print(param.name), params, ctx, ',');
  }

  getBuiltinMethodName(method: o.BuiltinMethod): string {
    var name: any /** TODO #9100 */;
    switch (method) {
      case o.BuiltinMethod.ConcatArray:
        name = 'concat';
        break;
      case o.BuiltinMethod.SubscribeObservable:
        name = 'subscribe';
        break;
      case o.BuiltinMethod.bind:
        name = 'bind';
        break;
      default:
        throw new BaseException(`Unknown builtin method: ${method}`);
    }
    return name;
  }
}
