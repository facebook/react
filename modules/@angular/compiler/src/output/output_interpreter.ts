import {reflector} from '../../core_private';
import {ObservableWrapper} from '../facade/async';
import {ListWrapper} from '../facade/collection';
import {BaseException, unimplemented} from '../facade/exceptions';
import {FunctionWrapper, IS_DART, isPresent} from '../facade/lang';

import {debugOutputAstAsDart} from './dart_emitter';
import * as o from './output_ast';
import {debugOutputAstAsTypeScript} from './ts_emitter';

export function interpretStatements(
    statements: o.Statement[], resultVar: string, instanceFactory: InstanceFactory): any {
  var stmtsWithReturn = statements.concat([new o.ReturnStatement(o.variable(resultVar))]);
  var ctx = new _ExecutionContext(
      null, null, null, null, new Map<string, any>(), new Map<string, any>(),
      new Map<string, Function>(), new Map<string, Function>(), instanceFactory);
  var visitor = new StatementInterpreter();
  var result = visitor.visitAllStatements(stmtsWithReturn, ctx);
  return isPresent(result) ? result.value : null;
}

export interface InstanceFactory {
  createInstance(
      superClass: any, clazz: any, constructorArgs: any[], props: Map<string, any>,
      getters: Map<string, Function>, methods: Map<string, Function>): DynamicInstance;
}

export abstract class DynamicInstance {
  get props(): Map<string, any> { return unimplemented(); }
  get getters(): Map<string, Function> { return unimplemented(); }
  get methods(): Map<string, any> { return unimplemented(); }
  get clazz(): any { return unimplemented(); }
}

function isDynamicInstance(instance: any): any {
  if (IS_DART) {
    return instance instanceof DynamicInstance;
  } else {
    return isPresent(instance) && isPresent(instance.props) && isPresent(instance.getters) &&
        isPresent(instance.methods);
  }
}

function _executeFunctionStatements(
    varNames: string[], varValues: any[], statements: o.Statement[], ctx: _ExecutionContext,
    visitor: StatementInterpreter): any {
  var childCtx = ctx.createChildWihtLocalVars();
  for (var i = 0; i < varNames.length; i++) {
    childCtx.vars.set(varNames[i], varValues[i]);
  }
  var result = visitor.visitAllStatements(statements, childCtx);
  return isPresent(result) ? result.value : null;
}

class _ExecutionContext {
  constructor(
      public parent: _ExecutionContext, public superClass: any, public superInstance: any,
      public className: string, public vars: Map<string, any>, public props: Map<string, any>,
      public getters: Map<string, Function>, public methods: Map<string, Function>,
      public instanceFactory: InstanceFactory) {}

  createChildWihtLocalVars(): _ExecutionContext {
    return new _ExecutionContext(
        this, this.superClass, this.superInstance, this.className, new Map<string, any>(),
        this.props, this.getters, this.methods, this.instanceFactory);
  }
}

class ReturnValue {
  constructor(public value: any) {}
}

class _DynamicClass {
  constructor(
      private _classStmt: o.ClassStmt, private _ctx: _ExecutionContext,
      private _visitor: StatementInterpreter) {}

  instantiate(args: any[]): DynamicInstance {
    var props = new Map<string, any>();
    var getters = new Map<string, Function>();
    var methods = new Map<string, Function>();
    var superClass = this._classStmt.parent.visitExpression(this._visitor, this._ctx);
    var instanceCtx = new _ExecutionContext(
        this._ctx, superClass, null, this._classStmt.name, this._ctx.vars, props, getters, methods,
        this._ctx.instanceFactory);

    this._classStmt.fields.forEach((field: o.ClassField) => { props.set(field.name, null); });
    this._classStmt.getters.forEach((getter: o.ClassGetter) => {
      getters.set(
          getter.name,
          () => _executeFunctionStatements([], [], getter.body, instanceCtx, this._visitor));
    });
    this._classStmt.methods.forEach((method: o.ClassMethod) => {
      var paramNames = method.params.map(param => param.name);
      methods.set(method.name, _declareFn(paramNames, method.body, instanceCtx, this._visitor));
    });

    var ctorParamNames = this._classStmt.constructorMethod.params.map(param => param.name);
    _executeFunctionStatements(
        ctorParamNames, args, this._classStmt.constructorMethod.body, instanceCtx, this._visitor);
    return instanceCtx.superInstance;
  }

  debugAst(): string { return this._visitor.debugAst(this._classStmt); }
}

class StatementInterpreter implements o.StatementVisitor, o.ExpressionVisitor {
  debugAst(ast: o.Expression|o.Statement|o.Type): string {
    return IS_DART ? debugOutputAstAsDart(ast) : debugOutputAstAsTypeScript(ast);
  }

  visitDeclareVarStmt(stmt: o.DeclareVarStmt, ctx: _ExecutionContext): any {
    ctx.vars.set(stmt.name, stmt.value.visitExpression(this, ctx));
    return null;
  }
  visitWriteVarExpr(expr: o.WriteVarExpr, ctx: _ExecutionContext): any {
    var value = expr.value.visitExpression(this, ctx);
    var currCtx = ctx;
    while (currCtx != null) {
      if (currCtx.vars.has(expr.name)) {
        currCtx.vars.set(expr.name, value);
        return value;
      }
      currCtx = currCtx.parent;
    }
    throw new BaseException(`Not declared variable ${expr.name}`);
  }
  visitReadVarExpr(ast: o.ReadVarExpr, ctx: _ExecutionContext): any {
    var varName = ast.name;
    if (isPresent(ast.builtin)) {
      switch (ast.builtin) {
        case o.BuiltinVar.Super:
        case o.BuiltinVar.This:
          return ctx.superInstance;
        case o.BuiltinVar.CatchError:
          varName = CATCH_ERROR_VAR;
          break;
        case o.BuiltinVar.CatchStack:
          varName = CATCH_STACK_VAR;
          break;
        default:
          throw new BaseException(`Unknown builtin variable ${ast.builtin}`);
      }
    }
    var currCtx = ctx;
    while (currCtx != null) {
      if (currCtx.vars.has(varName)) {
        return currCtx.vars.get(varName);
      }
      currCtx = currCtx.parent;
    }
    throw new BaseException(`Not declared variable ${varName}`);
  }
  visitWriteKeyExpr(expr: o.WriteKeyExpr, ctx: _ExecutionContext): any {
    var receiver = expr.receiver.visitExpression(this, ctx);
    var index = expr.index.visitExpression(this, ctx);
    var value = expr.value.visitExpression(this, ctx);
    receiver[index] = value;
    return value;
  }
  visitWritePropExpr(expr: o.WritePropExpr, ctx: _ExecutionContext): any {
    var receiver = expr.receiver.visitExpression(this, ctx);
    var value = expr.value.visitExpression(this, ctx);
    if (isDynamicInstance(receiver)) {
      var di = <DynamicInstance>receiver;
      if (di.props.has(expr.name)) {
        di.props.set(expr.name, value);
      } else {
        reflector.setter(expr.name)(receiver, value);
      }
    } else {
      reflector.setter(expr.name)(receiver, value);
    }
    return value;
  }

  visitInvokeMethodExpr(expr: o.InvokeMethodExpr, ctx: _ExecutionContext): any {
    var receiver = expr.receiver.visitExpression(this, ctx);
    var args = this.visitAllExpressions(expr.args, ctx);
    var result: any /** TODO #9100 */;
    if (isPresent(expr.builtin)) {
      switch (expr.builtin) {
        case o.BuiltinMethod.ConcatArray:
          result = ListWrapper.concat(receiver, args[0]);
          break;
        case o.BuiltinMethod.SubscribeObservable:
          result = ObservableWrapper.subscribe(receiver, args[0]);
          break;
        case o.BuiltinMethod.bind:
          if (IS_DART) {
            result = receiver;
          } else {
            result = receiver.bind(args[0]);
          }
          break;
        default:
          throw new BaseException(`Unknown builtin method ${expr.builtin}`);
      }
    } else if (isDynamicInstance(receiver)) {
      var di = <DynamicInstance>receiver;
      if (di.methods.has(expr.name)) {
        result = FunctionWrapper.apply(di.methods.get(expr.name), args);
      } else {
        result = reflector.method(expr.name)(receiver, args);
      }
    } else {
      result = reflector.method(expr.name)(receiver, args);
    }
    return result;
  }
  visitInvokeFunctionExpr(stmt: o.InvokeFunctionExpr, ctx: _ExecutionContext): any {
    var args = this.visitAllExpressions(stmt.args, ctx);
    var fnExpr = stmt.fn;
    if (fnExpr instanceof o.ReadVarExpr && fnExpr.builtin === o.BuiltinVar.Super) {
      ctx.superInstance = ctx.instanceFactory.createInstance(
          ctx.superClass, ctx.className, args, ctx.props, ctx.getters, ctx.methods);
      ctx.parent.superInstance = ctx.superInstance;
      return null;
    } else {
      var fn = stmt.fn.visitExpression(this, ctx);
      return FunctionWrapper.apply(fn, args);
    }
  }
  visitReturnStmt(stmt: o.ReturnStatement, ctx: _ExecutionContext): any {
    return new ReturnValue(stmt.value.visitExpression(this, ctx));
  }
  visitDeclareClassStmt(stmt: o.ClassStmt, ctx: _ExecutionContext): any {
    var clazz = new _DynamicClass(stmt, ctx, this);
    ctx.vars.set(stmt.name, clazz);
    return null;
  }
  visitExpressionStmt(stmt: o.ExpressionStatement, ctx: _ExecutionContext): any {
    return stmt.expr.visitExpression(this, ctx);
  }
  visitIfStmt(stmt: o.IfStmt, ctx: _ExecutionContext): any {
    var condition = stmt.condition.visitExpression(this, ctx);
    if (condition) {
      return this.visitAllStatements(stmt.trueCase, ctx);
    } else if (isPresent(stmt.falseCase)) {
      return this.visitAllStatements(stmt.falseCase, ctx);
    }
    return null;
  }
  visitTryCatchStmt(stmt: o.TryCatchStmt, ctx: _ExecutionContext): any {
    try {
      return this.visitAllStatements(stmt.bodyStmts, ctx);
    } catch (e) {
      var childCtx = ctx.createChildWihtLocalVars();
      childCtx.vars.set(CATCH_ERROR_VAR, e);
      childCtx.vars.set(CATCH_STACK_VAR, e.stack);
      return this.visitAllStatements(stmt.catchStmts, childCtx);
    }
  }
  visitThrowStmt(stmt: o.ThrowStmt, ctx: _ExecutionContext): any {
    throw stmt.error.visitExpression(this, ctx);
  }
  visitCommentStmt(stmt: o.CommentStmt, context?: any): any { return null; }
  visitInstantiateExpr(ast: o.InstantiateExpr, ctx: _ExecutionContext): any {
    var args = this.visitAllExpressions(ast.args, ctx);
    var clazz = ast.classExpr.visitExpression(this, ctx);
    if (clazz instanceof _DynamicClass) {
      return clazz.instantiate(args);
    } else {
      return FunctionWrapper.apply(reflector.factory(clazz), args);
    }
  }
  visitLiteralExpr(ast: o.LiteralExpr, ctx: _ExecutionContext): any { return ast.value; }
  visitExternalExpr(ast: o.ExternalExpr, ctx: _ExecutionContext): any { return ast.value.runtime; }
  visitConditionalExpr(ast: o.ConditionalExpr, ctx: _ExecutionContext): any {
    if (ast.condition.visitExpression(this, ctx)) {
      return ast.trueCase.visitExpression(this, ctx);
    } else if (isPresent(ast.falseCase)) {
      return ast.falseCase.visitExpression(this, ctx);
    }
    return null;
  }
  visitNotExpr(ast: o.NotExpr, ctx: _ExecutionContext): any {
    return !ast.condition.visitExpression(this, ctx);
  }
  visitCastExpr(ast: o.CastExpr, ctx: _ExecutionContext): any {
    return ast.value.visitExpression(this, ctx);
  }
  visitFunctionExpr(ast: o.FunctionExpr, ctx: _ExecutionContext): any {
    var paramNames = ast.params.map((param) => param.name);
    return _declareFn(paramNames, ast.statements, ctx, this);
  }
  visitDeclareFunctionStmt(stmt: o.DeclareFunctionStmt, ctx: _ExecutionContext): any {
    var paramNames = stmt.params.map((param) => param.name);
    ctx.vars.set(stmt.name, _declareFn(paramNames, stmt.statements, ctx, this));
    return null;
  }
  visitBinaryOperatorExpr(ast: o.BinaryOperatorExpr, ctx: _ExecutionContext): any {
    var lhs = () => ast.lhs.visitExpression(this, ctx);
    var rhs = () => ast.rhs.visitExpression(this, ctx);

    switch (ast.operator) {
      case o.BinaryOperator.Equals:
        return lhs() == rhs();
      case o.BinaryOperator.Identical:
        return lhs() === rhs();
      case o.BinaryOperator.NotEquals:
        return lhs() != rhs();
      case o.BinaryOperator.NotIdentical:
        return lhs() !== rhs();
      case o.BinaryOperator.And:
        return lhs() && rhs();
      case o.BinaryOperator.Or:
        return lhs() || rhs();
      case o.BinaryOperator.Plus:
        return lhs() + rhs();
      case o.BinaryOperator.Minus:
        return lhs() - rhs();
      case o.BinaryOperator.Divide:
        return lhs() / rhs();
      case o.BinaryOperator.Multiply:
        return lhs() * rhs();
      case o.BinaryOperator.Modulo:
        return lhs() % rhs();
      case o.BinaryOperator.Lower:
        return lhs() < rhs();
      case o.BinaryOperator.LowerEquals:
        return lhs() <= rhs();
      case o.BinaryOperator.Bigger:
        return lhs() > rhs();
      case o.BinaryOperator.BiggerEquals:
        return lhs() >= rhs();
      default:
        throw new BaseException(`Unknown operator ${ast.operator}`);
    }
  }
  visitReadPropExpr(ast: o.ReadPropExpr, ctx: _ExecutionContext): any {
    var result: any /** TODO #9100 */;
    var receiver = ast.receiver.visitExpression(this, ctx);
    if (isDynamicInstance(receiver)) {
      var di = <DynamicInstance>receiver;
      if (di.props.has(ast.name)) {
        result = di.props.get(ast.name);
      } else if (di.getters.has(ast.name)) {
        result = di.getters.get(ast.name)();
      } else if (di.methods.has(ast.name)) {
        result = di.methods.get(ast.name);
      } else {
        result = reflector.getter(ast.name)(receiver);
      }
    } else {
      result = reflector.getter(ast.name)(receiver);
    }
    return result;
  }
  visitReadKeyExpr(ast: o.ReadKeyExpr, ctx: _ExecutionContext): any {
    var receiver = ast.receiver.visitExpression(this, ctx);
    var prop = ast.index.visitExpression(this, ctx);
    return receiver[prop];
  }
  visitLiteralArrayExpr(ast: o.LiteralArrayExpr, ctx: _ExecutionContext): any {
    return this.visitAllExpressions(ast.entries, ctx);
  }
  visitLiteralMapExpr(ast: o.LiteralMapExpr, ctx: _ExecutionContext): any {
    var result = {};
    ast.entries.forEach(
        (entry) => (result as any /** TODO #9100 */)[<string>entry[0]] =
            (<o.Expression>entry[1]).visitExpression(this, ctx));
    return result;
  }

  visitAllExpressions(expressions: o.Expression[], ctx: _ExecutionContext): any {
    return expressions.map((expr) => expr.visitExpression(this, ctx));
  }

  visitAllStatements(statements: o.Statement[], ctx: _ExecutionContext): ReturnValue {
    for (var i = 0; i < statements.length; i++) {
      var stmt = statements[i];
      var val = stmt.visitStatement(this, ctx);
      if (val instanceof ReturnValue) {
        return val;
      }
    }
    return null;
  }
}

function _declareFn(
    varNames: string[], statements: o.Statement[], ctx: _ExecutionContext,
    visitor: StatementInterpreter): Function {
  switch (varNames.length) {
    case 0:
      return () => _executeFunctionStatements(varNames, [], statements, ctx, visitor);
    case 1:
      return (d0: any /** TODO #9100 */) =>
                 _executeFunctionStatements(varNames, [d0], statements, ctx, visitor);
    case 2:
      return (d0: any /** TODO #9100 */, d1: any /** TODO #9100 */) =>
                 _executeFunctionStatements(varNames, [d0, d1], statements, ctx, visitor);
    case 3:
      return (d0: any /** TODO #9100 */, d1: any /** TODO #9100 */, d2: any /** TODO #9100 */) =>
                 _executeFunctionStatements(varNames, [d0, d1, d2], statements, ctx, visitor);
    case 4:
      return (d0: any /** TODO #9100 */, d1: any /** TODO #9100 */, d2: any /** TODO #9100 */,
              d3: any /** TODO #9100 */) =>
                 _executeFunctionStatements(varNames, [d0, d1, d2, d3], statements, ctx, visitor);
    case 5:
      return (d0: any /** TODO #9100 */, d1: any /** TODO #9100 */, d2: any /** TODO #9100 */,
              d3: any /** TODO #9100 */, d4: any /** TODO #9100 */) =>
                 _executeFunctionStatements(
                     varNames, [d0, d1, d2, d3, d4], statements, ctx, visitor);
    case 6:
      return (d0: any /** TODO #9100 */, d1: any /** TODO #9100 */, d2: any /** TODO #9100 */,
              d3: any /** TODO #9100 */, d4: any /** TODO #9100 */, d5: any /** TODO #9100 */) =>
                 _executeFunctionStatements(
                     varNames, [d0, d1, d2, d3, d4, d5], statements, ctx, visitor);
    case 7:
      return (d0: any /** TODO #9100 */, d1: any /** TODO #9100 */, d2: any /** TODO #9100 */,
              d3: any /** TODO #9100 */, d4: any /** TODO #9100 */, d5: any /** TODO #9100 */,
              d6: any /** TODO #9100 */) =>
                 _executeFunctionStatements(
                     varNames, [d0, d1, d2, d3, d4, d5, d6], statements, ctx, visitor);
    case 8:
      return (d0: any /** TODO #9100 */, d1: any /** TODO #9100 */, d2: any /** TODO #9100 */,
              d3: any /** TODO #9100 */, d4: any /** TODO #9100 */, d5: any /** TODO #9100 */,
              d6: any /** TODO #9100 */, d7: any /** TODO #9100 */) =>
                 _executeFunctionStatements(
                     varNames, [d0, d1, d2, d3, d4, d5, d6, d7], statements, ctx, visitor);
    case 9:
      return (d0: any /** TODO #9100 */, d1: any /** TODO #9100 */, d2: any /** TODO #9100 */,
              d3: any /** TODO #9100 */, d4: any /** TODO #9100 */, d5: any /** TODO #9100 */,
              d6: any /** TODO #9100 */, d7: any /** TODO #9100 */, d8: any /** TODO #9100 */) =>
                 _executeFunctionStatements(
                     varNames, [d0, d1, d2, d3, d4, d5, d6, d7, d8], statements, ctx, visitor);
    case 10:
      return (d0: any /** TODO #9100 */, d1: any /** TODO #9100 */, d2: any /** TODO #9100 */,
              d3: any /** TODO #9100 */, d4: any /** TODO #9100 */, d5: any /** TODO #9100 */,
              d6: any /** TODO #9100 */, d7: any /** TODO #9100 */, d8: any /** TODO #9100 */,
              d9: any /** TODO #9100 */) =>
                 _executeFunctionStatements(
                     varNames, [d0, d1, d2, d3, d4, d5, d6, d7, d8, d9], statements, ctx, visitor);
    default:
      throw new BaseException(
          'Declaring functions with more than 10 arguments is not supported right now');
  }
}

var CATCH_ERROR_VAR = 'error';
var CATCH_STACK_VAR = 'stack';
