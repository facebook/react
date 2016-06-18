import {CompileIdentifierMetadata} from '../compile_metadata';
import {BaseException} from '../facade/exceptions';
import {isArray, isBlank, isPresent} from '../facade/lang';

import * as o from './output_ast';

import {OutputEmitter, EmitterVisitorContext, AbstractEmitterVisitor, CATCH_ERROR_VAR, CATCH_STACK_VAR,} from './abstract_emitter';
import {ImportGenerator} from './path_util';

var _debugModuleUrl = 'asset://debug/lib';

export function debugOutputAstAsDart(ast: o.Statement | o.Expression | o.Type | any[]): string {
  var converter = new _DartEmitterVisitor(_debugModuleUrl);
  var ctx = EmitterVisitorContext.createRoot([]);
  var asts: any[];
  if (isArray(ast)) {
    asts = <any[]>ast;
  } else {
    asts = [ast];
  }
  asts.forEach((ast) => {
    if (ast instanceof o.Statement) {
      ast.visitStatement(converter, ctx);
    } else if (ast instanceof o.Expression) {
      ast.visitExpression(converter, ctx);
    } else if (ast instanceof o.Type) {
      ast.visitType(converter, ctx);
    } else {
      throw new BaseException(`Don't know how to print debug info for ${ast}`);
    }
  });
  return ctx.toSource();
}

export class DartEmitter implements OutputEmitter {
  constructor(private _importGenerator: ImportGenerator) {}
  emitStatements(moduleUrl: string, stmts: o.Statement[], exportedVars: string[]): string {
    var srcParts: any[] /** TODO #9100 */ = [];
    // Note: We are not creating a library here as Dart does not need it.
    // Dart analzyer might complain about it though.

    var converter = new _DartEmitterVisitor(moduleUrl);
    var ctx = EmitterVisitorContext.createRoot(exportedVars);
    converter.visitAllStatements(stmts, ctx);

    converter.importsWithPrefixes.forEach((prefix, importedModuleUrl) => {
      srcParts.push(
          `import '${this._importGenerator.getImportPath(moduleUrl, importedModuleUrl)}' as ${prefix};`);
    });
    srcParts.push(ctx.toSource());
    return srcParts.join('\n');
  }
}

class _DartEmitterVisitor extends AbstractEmitterVisitor implements o.TypeVisitor {
  importsWithPrefixes = new Map<string, string>();

  constructor(private _moduleUrl: string) { super(true); }

  visitExternalExpr(ast: o.ExternalExpr, ctx: EmitterVisitorContext): any {
    this._visitIdentifier(ast.value, ast.typeParams, ctx);
    return null;
  }
  visitDeclareVarStmt(stmt: o.DeclareVarStmt, ctx: EmitterVisitorContext): any {
    if (stmt.hasModifier(o.StmtModifier.Final)) {
      if (isConstType(stmt.type)) {
        ctx.print(`const `);
      } else {
        ctx.print(`final `);
      }
    } else if (isBlank(stmt.type)) {
      ctx.print(`var `);
    }
    if (isPresent(stmt.type)) {
      stmt.type.visitType(this, ctx);
      ctx.print(` `);
    }
    ctx.print(`${stmt.name} = `);
    stmt.value.visitExpression(this, ctx);
    ctx.println(`;`);
    return null;
  }
  visitCastExpr(ast: o.CastExpr, ctx: EmitterVisitorContext): any {
    ctx.print(`(`);
    ast.value.visitExpression(this, ctx);
    ctx.print(` as `);
    ast.type.visitType(this, ctx);
    ctx.print(`)`);
    return null;
  }
  visitDeclareClassStmt(stmt: o.ClassStmt, ctx: EmitterVisitorContext): any {
    ctx.pushClass(stmt);
    ctx.print(`class ${stmt.name}`);
    if (isPresent(stmt.parent)) {
      ctx.print(` extends `);
      stmt.parent.visitExpression(this, ctx);
    }
    ctx.println(` {`);
    ctx.incIndent();
    stmt.fields.forEach((field) => this._visitClassField(field, ctx));
    if (isPresent(stmt.constructorMethod)) {
      this._visitClassConstructor(stmt, ctx);
    }
    stmt.getters.forEach((getter) => this._visitClassGetter(getter, ctx));
    stmt.methods.forEach((method) => this._visitClassMethod(method, ctx));
    ctx.decIndent();
    ctx.println(`}`);
    ctx.popClass();
    return null;
  }
  private _visitClassField(field: o.ClassField, ctx: EmitterVisitorContext) {
    if (field.hasModifier(o.StmtModifier.Final)) {
      ctx.print(`final `);
    } else if (isBlank(field.type)) {
      ctx.print(`var `);
    }
    if (isPresent(field.type)) {
      field.type.visitType(this, ctx);
      ctx.print(` `);
    }
    ctx.println(`${field.name};`);
  }
  private _visitClassGetter(getter: o.ClassGetter, ctx: EmitterVisitorContext) {
    if (isPresent(getter.type)) {
      getter.type.visitType(this, ctx);
      ctx.print(` `);
    }
    ctx.println(`get ${getter.name} {`);
    ctx.incIndent();
    this.visitAllStatements(getter.body, ctx);
    ctx.decIndent();
    ctx.println(`}`);
  }
  private _visitClassConstructor(stmt: o.ClassStmt, ctx: EmitterVisitorContext) {
    ctx.print(`${stmt.name}(`);
    this._visitParams(stmt.constructorMethod.params, ctx);
    ctx.print(`)`);

    var ctorStmts = stmt.constructorMethod.body;
    var superCtorExpr = ctorStmts.length > 0 ? getSuperConstructorCallExpr(ctorStmts[0]) : null;
    if (isPresent(superCtorExpr)) {
      ctx.print(`: `);
      superCtorExpr.visitExpression(this, ctx);
      ctorStmts = ctorStmts.slice(1);
    }
    ctx.println(` {`);
    ctx.incIndent();
    this.visitAllStatements(ctorStmts, ctx);
    ctx.decIndent();
    ctx.println(`}`);
  }
  private _visitClassMethod(method: o.ClassMethod, ctx: EmitterVisitorContext) {
    if (isPresent(method.type)) {
      method.type.visitType(this, ctx);
    } else {
      ctx.print(`void`);
    }
    ctx.print(` ${method.name}(`);
    this._visitParams(method.params, ctx);
    ctx.println(`) {`);
    ctx.incIndent();
    this.visitAllStatements(method.body, ctx);
    ctx.decIndent();
    ctx.println(`}`);
  }

  visitFunctionExpr(ast: o.FunctionExpr, ctx: EmitterVisitorContext): any {
    ctx.print(`(`);
    this._visitParams(ast.params, ctx);
    ctx.println(`) {`);
    ctx.incIndent();
    this.visitAllStatements(ast.statements, ctx);
    ctx.decIndent();
    ctx.print(`}`);
    return null;
  }
  visitDeclareFunctionStmt(stmt: o.DeclareFunctionStmt, ctx: EmitterVisitorContext): any {
    if (isPresent(stmt.type)) {
      stmt.type.visitType(this, ctx);
    } else {
      ctx.print(`void`);
    }
    ctx.print(` ${stmt.name}(`);
    this._visitParams(stmt.params, ctx);
    ctx.println(`) {`);
    ctx.incIndent();
    this.visitAllStatements(stmt.statements, ctx);
    ctx.decIndent();
    ctx.println(`}`);
    return null;
  }

  getBuiltinMethodName(method: o.BuiltinMethod): string {
    var name: any /** TODO #9100 */;
    switch (method) {
      case o.BuiltinMethod.ConcatArray:
        name = '.addAll';
        break;
      case o.BuiltinMethod.SubscribeObservable:
        name = 'listen';
        break;
      case o.BuiltinMethod.bind:
        name = null;
        break;
      default:
        throw new BaseException(`Unknown builtin method: ${method}`);
    }
    return name;
  }
  visitTryCatchStmt(stmt: o.TryCatchStmt, ctx: EmitterVisitorContext): any {
    ctx.println(`try {`);
    ctx.incIndent();
    this.visitAllStatements(stmt.bodyStmts, ctx);
    ctx.decIndent();
    ctx.println(`} catch (${CATCH_ERROR_VAR.name}, ${CATCH_STACK_VAR.name}) {`);
    ctx.incIndent();
    this.visitAllStatements(stmt.catchStmts, ctx);
    ctx.decIndent();
    ctx.println(`}`);
    return null;
  }
  visitBinaryOperatorExpr(ast: o.BinaryOperatorExpr, ctx: EmitterVisitorContext): any {
    switch (ast.operator) {
      case o.BinaryOperator.Identical:
        ctx.print(`identical(`);
        ast.lhs.visitExpression(this, ctx);
        ctx.print(`, `);
        ast.rhs.visitExpression(this, ctx);
        ctx.print(`)`);
        break;
      case o.BinaryOperator.NotIdentical:
        ctx.print(`!identical(`);
        ast.lhs.visitExpression(this, ctx);
        ctx.print(`, `);
        ast.rhs.visitExpression(this, ctx);
        ctx.print(`)`);
        break;
      default:
        super.visitBinaryOperatorExpr(ast, ctx);
    }
    return null;
  }
  visitLiteralArrayExpr(ast: o.LiteralArrayExpr, ctx: EmitterVisitorContext): any {
    if (isConstType(ast.type)) {
      ctx.print(`const `);
    }
    return super.visitLiteralArrayExpr(ast, ctx);
  }
  visitLiteralMapExpr(ast: o.LiteralMapExpr, ctx: EmitterVisitorContext): any {
    if (isConstType(ast.type)) {
      ctx.print(`const `);
    }
    if (isPresent(ast.valueType)) {
      ctx.print(`<String, `);
      ast.valueType.visitType(this, ctx);
      ctx.print(`>`);
    }
    return super.visitLiteralMapExpr(ast, ctx);
  }
  visitInstantiateExpr(ast: o.InstantiateExpr, ctx: EmitterVisitorContext): any {
    ctx.print(isConstType(ast.type) ? `const` : `new`);
    ctx.print(' ');
    ast.classExpr.visitExpression(this, ctx);
    ctx.print(`(`);
    this.visitAllExpressions(ast.args, ctx, `,`);
    ctx.print(`)`);
    return null;
  }
  visitBuiltintType(type: o.BuiltinType, ctx: EmitterVisitorContext): any {
    var typeStr: any /** TODO #9100 */;
    switch (type.name) {
      case o.BuiltinTypeName.Bool:
        typeStr = 'bool';
        break;
      case o.BuiltinTypeName.Dynamic:
        typeStr = 'dynamic';
        break;
      case o.BuiltinTypeName.Function:
        typeStr = 'Function';
        break;
      case o.BuiltinTypeName.Number:
        typeStr = 'num';
        break;
      case o.BuiltinTypeName.Int:
        typeStr = 'int';
        break;
      case o.BuiltinTypeName.String:
        typeStr = 'String';
        break;
      default:
        throw new BaseException(`Unsupported builtin type ${type.name}`);
    }
    ctx.print(typeStr);
    return null;
  }
  visitExternalType(ast: o.ExternalType, ctx: EmitterVisitorContext): any {
    this._visitIdentifier(ast.value, ast.typeParams, ctx);
    return null;
  }
  visitArrayType(type: o.ArrayType, ctx: EmitterVisitorContext): any {
    ctx.print(`List<`);
    if (isPresent(type.of)) {
      type.of.visitType(this, ctx);
    } else {
      ctx.print(`dynamic`);
    }
    ctx.print(`>`);
    return null;
  }
  visitMapType(type: o.MapType, ctx: EmitterVisitorContext): any {
    ctx.print(`Map<String, `);
    if (isPresent(type.valueType)) {
      type.valueType.visitType(this, ctx);
    } else {
      ctx.print(`dynamic`);
    }
    ctx.print(`>`);
    return null;
  }

  private _visitParams(params: o.FnParam[], ctx: EmitterVisitorContext): void {
    this.visitAllObjects((param: any /** TODO #9100 */) => {
      if (isPresent(param.type)) {
        param.type.visitType(this, ctx);
        ctx.print(' ');
      }
      ctx.print(param.name);
    }, params, ctx, ',');
  }

  private _visitIdentifier(
      value: CompileIdentifierMetadata, typeParams: o.Type[], ctx: EmitterVisitorContext): void {
    if (isBlank(value.name)) {
      throw new BaseException(`Internal error: unknown identifier ${value}`);
    }
    if (isPresent(value.moduleUrl) && value.moduleUrl != this._moduleUrl) {
      var prefix = this.importsWithPrefixes.get(value.moduleUrl);
      if (isBlank(prefix)) {
        prefix = `import${this.importsWithPrefixes.size}`;
        this.importsWithPrefixes.set(value.moduleUrl, prefix);
      }
      ctx.print(`${prefix}.`);
    }
    ctx.print(value.name);
    if (isPresent(typeParams) && typeParams.length > 0) {
      ctx.print(`<`);
      this.visitAllObjects(
          (type: any /** TODO #9100 */) => type.visitType(this, ctx), typeParams, ctx, ',');
      ctx.print(`>`);
    }
  }
}

function getSuperConstructorCallExpr(stmt: o.Statement): o.Expression {
  if (stmt instanceof o.ExpressionStatement) {
    var expr = stmt.expr;
    if (expr instanceof o.InvokeFunctionExpr) {
      var fn = expr.fn;
      if (fn instanceof o.ReadVarExpr) {
        if (fn.builtin === o.BuiltinVar.Super) {
          return expr;
        }
      }
    }
  }
  return null;
}

function isConstType(type: o.Type): boolean {
  return isPresent(type) && type.hasModifier(o.TypeModifier.Const);
}
