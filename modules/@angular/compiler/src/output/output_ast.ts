import {CompileIdentifierMetadata} from '../compile_metadata';
import {isBlank, isPresent, isString} from '../facade/lang';


//// Types
export enum TypeModifier {
  Const
}

export abstract class Type {
  constructor(public modifiers: TypeModifier[] = null) {
    if (isBlank(modifiers)) {
      this.modifiers = [];
    }
  }
  abstract visitType(visitor: TypeVisitor, context: any): any;

  hasModifier(modifier: TypeModifier): boolean { return this.modifiers.indexOf(modifier) !== -1; }
}

export enum BuiltinTypeName {
  Dynamic,
  Bool,
  String,
  Int,
  Number,
  Function
}

export class BuiltinType extends Type {
  constructor(public name: BuiltinTypeName, modifiers: TypeModifier[] = null) { super(modifiers); }
  visitType(visitor: TypeVisitor, context: any): any {
    return visitor.visitBuiltintType(this, context);
  }
}

export class ExternalType extends Type {
  constructor(
      public value: CompileIdentifierMetadata, public typeParams: Type[] = null,
      modifiers: TypeModifier[] = null) {
    super(modifiers);
  }
  visitType(visitor: TypeVisitor, context: any): any {
    return visitor.visitExternalType(this, context);
  }
}


export class ArrayType extends Type {
  constructor(public of : Type, modifiers: TypeModifier[] = null) { super(modifiers); }
  visitType(visitor: TypeVisitor, context: any): any {
    return visitor.visitArrayType(this, context);
  }
}


export class MapType extends Type {
  constructor(public valueType: Type, modifiers: TypeModifier[] = null) { super(modifiers); }
  visitType(visitor: TypeVisitor, context: any): any { return visitor.visitMapType(this, context); }
}

export var DYNAMIC_TYPE = new BuiltinType(BuiltinTypeName.Dynamic);
export var BOOL_TYPE = new BuiltinType(BuiltinTypeName.Bool);
export var INT_TYPE = new BuiltinType(BuiltinTypeName.Int);
export var NUMBER_TYPE = new BuiltinType(BuiltinTypeName.Number);
export var STRING_TYPE = new BuiltinType(BuiltinTypeName.String);
export var FUNCTION_TYPE = new BuiltinType(BuiltinTypeName.Function);


export interface TypeVisitor {
  visitBuiltintType(type: BuiltinType, context: any): any;
  visitExternalType(type: ExternalType, context: any): any;
  visitArrayType(type: ArrayType, context: any): any;
  visitMapType(type: MapType, context: any): any;
}

///// Expressions

export enum BinaryOperator {
  Equals,
  NotEquals,
  Identical,
  NotIdentical,
  Minus,
  Plus,
  Divide,
  Multiply,
  Modulo,
  And,
  Or,
  Lower,
  LowerEquals,
  Bigger,
  BiggerEquals
}


export abstract class Expression {
  constructor(public type: Type) {}

  abstract visitExpression(visitor: ExpressionVisitor, context: any): any;

  prop(name: string): ReadPropExpr { return new ReadPropExpr(this, name); }

  key(index: Expression, type: Type = null): ReadKeyExpr {
    return new ReadKeyExpr(this, index, type);
  }

  callMethod(name: string|BuiltinMethod, params: Expression[]): InvokeMethodExpr {
    return new InvokeMethodExpr(this, name, params);
  }

  callFn(params: Expression[]): InvokeFunctionExpr { return new InvokeFunctionExpr(this, params); }

  instantiate(params: Expression[], type: Type = null): InstantiateExpr {
    return new InstantiateExpr(this, params, type);
  }

  conditional(trueCase: Expression, falseCase: Expression = null): ConditionalExpr {
    return new ConditionalExpr(this, trueCase, falseCase);
  }

  equals(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.Equals, this, rhs);
  }
  notEquals(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.NotEquals, this, rhs);
  }
  identical(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.Identical, this, rhs);
  }
  notIdentical(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.NotIdentical, this, rhs);
  }
  minus(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.Minus, this, rhs);
  }
  plus(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.Plus, this, rhs);
  }
  divide(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.Divide, this, rhs);
  }
  multiply(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.Multiply, this, rhs);
  }
  modulo(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.Modulo, this, rhs);
  }
  and(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.And, this, rhs);
  }
  or(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.Or, this, rhs);
  }
  lower(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.Lower, this, rhs);
  }
  lowerEquals(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.LowerEquals, this, rhs);
  }
  bigger(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.Bigger, this, rhs);
  }
  biggerEquals(rhs: Expression): BinaryOperatorExpr {
    return new BinaryOperatorExpr(BinaryOperator.BiggerEquals, this, rhs);
  }
  isBlank(): Expression {
    // Note: We use equals by purpose here to compare to null and undefined in JS.
    return this.equals(NULL_EXPR);
  }
  cast(type: Type): Expression { return new CastExpr(this, type); }
  toStmt(): Statement { return new ExpressionStatement(this); }
}

export enum BuiltinVar {
  This,
  Super,
  CatchError,
  CatchStack
}

export class ReadVarExpr extends Expression {
  public name: any /** TODO #9100 */;
  public builtin: BuiltinVar;

  constructor(name: string|BuiltinVar, type: Type = null) {
    super(type);
    if (isString(name)) {
      this.name = <string>name;
      this.builtin = null;
    } else {
      this.name = null;
      this.builtin = <BuiltinVar>name;
    }
  }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitReadVarExpr(this, context);
  }

  set(value: Expression): WriteVarExpr { return new WriteVarExpr(this.name, value); }
}


export class WriteVarExpr extends Expression {
  public value: Expression;
  constructor(public name: string, value: Expression, type: Type = null) {
    super(isPresent(type) ? type : value.type);
    this.value = value;
  }

  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitWriteVarExpr(this, context);
  }

  toDeclStmt(type: Type = null, modifiers: StmtModifier[] = null): DeclareVarStmt {
    return new DeclareVarStmt(this.name, this.value, type, modifiers);
  }
}


export class WriteKeyExpr extends Expression {
  public value: Expression;
  constructor(
      public receiver: Expression, public index: Expression, value: Expression, type: Type = null) {
    super(isPresent(type) ? type : value.type);
    this.value = value;
  }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitWriteKeyExpr(this, context);
  }
}


export class WritePropExpr extends Expression {
  public value: Expression;
  constructor(
      public receiver: Expression, public name: string, value: Expression, type: Type = null) {
    super(isPresent(type) ? type : value.type);
    this.value = value;
  }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitWritePropExpr(this, context);
  }
}

export enum BuiltinMethod {
  ConcatArray,
  SubscribeObservable,
  bind
}

export class InvokeMethodExpr extends Expression {
  public name: string;
  public builtin: BuiltinMethod;
  constructor(
      public receiver: Expression, method: string|BuiltinMethod, public args: Expression[],
      type: Type = null) {
    super(type);
    if (isString(method)) {
      this.name = <string>method;
      this.builtin = null;
    } else {
      this.name = null;
      this.builtin = <BuiltinMethod>method;
    }
  }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitInvokeMethodExpr(this, context);
  }
}


export class InvokeFunctionExpr extends Expression {
  constructor(public fn: Expression, public args: Expression[], type: Type = null) { super(type); }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitInvokeFunctionExpr(this, context);
  }
}


export class InstantiateExpr extends Expression {
  constructor(public classExpr: Expression, public args: Expression[], type?: Type) { super(type); }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitInstantiateExpr(this, context);
  }
}


export class LiteralExpr extends Expression {
  constructor(public value: any, type: Type = null) { super(type); }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitLiteralExpr(this, context);
  }
}


export class ExternalExpr extends Expression {
  constructor(
      public value: CompileIdentifierMetadata, type: Type = null,
      public typeParams: Type[] = null) {
    super(type);
  }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitExternalExpr(this, context);
  }
}


export class ConditionalExpr extends Expression {
  public trueCase: Expression;
  constructor(
      public condition: Expression, trueCase: Expression, public falseCase: Expression = null,
      type: Type = null) {
    super(isPresent(type) ? type : trueCase.type);
    this.trueCase = trueCase;
  }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitConditionalExpr(this, context);
  }
}


export class NotExpr extends Expression {
  constructor(public condition: Expression) { super(BOOL_TYPE); }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitNotExpr(this, context);
  }
}

export class CastExpr extends Expression {
  constructor(public value: Expression, type: Type) { super(type); }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitCastExpr(this, context);
  }
}


export class FnParam {
  constructor(public name: string, public type: Type = null) {}
}


export class FunctionExpr extends Expression {
  constructor(public params: FnParam[], public statements: Statement[], type: Type = null) {
    super(type);
  }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitFunctionExpr(this, context);
  }

  toDeclStmt(name: string, modifiers: StmtModifier[] = null): DeclareFunctionStmt {
    return new DeclareFunctionStmt(name, this.params, this.statements, this.type, modifiers);
  }
}


export class BinaryOperatorExpr extends Expression {
  public lhs: Expression;
  constructor(
      public operator: BinaryOperator, lhs: Expression, public rhs: Expression, type: Type = null) {
    super(isPresent(type) ? type : lhs.type);
    this.lhs = lhs;
  }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitBinaryOperatorExpr(this, context);
  }
}


export class ReadPropExpr extends Expression {
  constructor(public receiver: Expression, public name: string, type: Type = null) { super(type); }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitReadPropExpr(this, context);
  }
  set(value: Expression): WritePropExpr {
    return new WritePropExpr(this.receiver, this.name, value);
  }
}


export class ReadKeyExpr extends Expression {
  constructor(public receiver: Expression, public index: Expression, type: Type = null) {
    super(type);
  }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitReadKeyExpr(this, context);
  }
  set(value: Expression): WriteKeyExpr {
    return new WriteKeyExpr(this.receiver, this.index, value);
  }
}


export class LiteralArrayExpr extends Expression {
  public entries: Expression[];
  constructor(entries: Expression[], type: Type = null) {
    super(type);
    this.entries = entries;
  }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitLiteralArrayExpr(this, context);
  }
}


export class LiteralMapExpr extends Expression {
  public valueType: Type = null;
  constructor(public entries: Array<Array<string|Expression>>, type: MapType = null) {
    super(type);
    if (isPresent(type)) {
      this.valueType = type.valueType;
    }
  }
  visitExpression(visitor: ExpressionVisitor, context: any): any {
    return visitor.visitLiteralMapExpr(this, context);
  }
}

export interface ExpressionVisitor {
  visitReadVarExpr(ast: ReadVarExpr, context: any): any;
  visitWriteVarExpr(expr: WriteVarExpr, context: any): any;
  visitWriteKeyExpr(expr: WriteKeyExpr, context: any): any;
  visitWritePropExpr(expr: WritePropExpr, context: any): any;
  visitInvokeMethodExpr(ast: InvokeMethodExpr, context: any): any;
  visitInvokeFunctionExpr(ast: InvokeFunctionExpr, context: any): any;
  visitInstantiateExpr(ast: InstantiateExpr, context: any): any;
  visitLiteralExpr(ast: LiteralExpr, context: any): any;
  visitExternalExpr(ast: ExternalExpr, context: any): any;
  visitConditionalExpr(ast: ConditionalExpr, context: any): any;
  visitNotExpr(ast: NotExpr, context: any): any;
  visitCastExpr(ast: CastExpr, context: any): any;
  visitFunctionExpr(ast: FunctionExpr, context: any): any;
  visitBinaryOperatorExpr(ast: BinaryOperatorExpr, context: any): any;
  visitReadPropExpr(ast: ReadPropExpr, context: any): any;
  visitReadKeyExpr(ast: ReadKeyExpr, context: any): any;
  visitLiteralArrayExpr(ast: LiteralArrayExpr, context: any): any;
  visitLiteralMapExpr(ast: LiteralMapExpr, context: any): any;
}

export var THIS_EXPR = new ReadVarExpr(BuiltinVar.This);
export var SUPER_EXPR = new ReadVarExpr(BuiltinVar.Super);
export var CATCH_ERROR_VAR = new ReadVarExpr(BuiltinVar.CatchError);
export var CATCH_STACK_VAR = new ReadVarExpr(BuiltinVar.CatchStack);
export var NULL_EXPR = new LiteralExpr(null, null);

//// Statements
export enum StmtModifier {
  Final,
  Private
}

export abstract class Statement {
  constructor(public modifiers: StmtModifier[] = null) {
    if (isBlank(modifiers)) {
      this.modifiers = [];
    }
  }

  abstract visitStatement(visitor: StatementVisitor, context: any): any;

  hasModifier(modifier: StmtModifier): boolean { return this.modifiers.indexOf(modifier) !== -1; }
}


export class DeclareVarStmt extends Statement {
  public type: Type;
  constructor(
      public name: string, public value: Expression, type: Type = null,
      modifiers: StmtModifier[] = null) {
    super(modifiers);
    this.type = isPresent(type) ? type : value.type;
  }

  visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitDeclareVarStmt(this, context);
  }
}

export class DeclareFunctionStmt extends Statement {
  constructor(
      public name: string, public params: FnParam[], public statements: Statement[],
      public type: Type = null, modifiers: StmtModifier[] = null) {
    super(modifiers);
  }

  visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitDeclareFunctionStmt(this, context);
  }
}

export class ExpressionStatement extends Statement {
  constructor(public expr: Expression) { super(); }

  visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitExpressionStmt(this, context);
  }
}


export class ReturnStatement extends Statement {
  constructor(public value: Expression) { super(); }
  visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitReturnStmt(this, context);
  }
}

export class AbstractClassPart {
  constructor(public type: Type = null, public modifiers: StmtModifier[]) {
    if (isBlank(modifiers)) {
      this.modifiers = [];
    }
  }
  hasModifier(modifier: StmtModifier): boolean { return this.modifiers.indexOf(modifier) !== -1; }
}

export class ClassField extends AbstractClassPart {
  constructor(public name: string, type: Type = null, modifiers: StmtModifier[] = null) {
    super(type, modifiers);
  }
}


export class ClassMethod extends AbstractClassPart {
  constructor(
      public name: string, public params: FnParam[], public body: Statement[], type: Type = null,
      modifiers: StmtModifier[] = null) {
    super(type, modifiers);
  }
}


export class ClassGetter extends AbstractClassPart {
  constructor(
      public name: string, public body: Statement[], type: Type = null,
      modifiers: StmtModifier[] = null) {
    super(type, modifiers);
  }
}


export class ClassStmt extends Statement {
  constructor(
      public name: string, public parent: Expression, public fields: ClassField[],
      public getters: ClassGetter[], public constructorMethod: ClassMethod,
      public methods: ClassMethod[], modifiers: StmtModifier[] = null) {
    super(modifiers);
  }
  visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitDeclareClassStmt(this, context);
  }
}


export class IfStmt extends Statement {
  constructor(
      public condition: Expression, public trueCase: Statement[],
      public falseCase: Statement[] = /*@ts2dart_const*/[]) {
    super();
  }
  visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitIfStmt(this, context);
  }
}


export class CommentStmt extends Statement {
  constructor(public comment: string) { super(); }
  visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitCommentStmt(this, context);
  }
}


export class TryCatchStmt extends Statement {
  constructor(public bodyStmts: Statement[], public catchStmts: Statement[]) { super(); }
  visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitTryCatchStmt(this, context);
  }
}


export class ThrowStmt extends Statement {
  constructor(public error: Expression) { super(); }
  visitStatement(visitor: StatementVisitor, context: any): any {
    return visitor.visitThrowStmt(this, context);
  }
}

export interface StatementVisitor {
  visitDeclareVarStmt(stmt: DeclareVarStmt, context: any): any;
  visitDeclareFunctionStmt(stmt: DeclareFunctionStmt, context: any): any;
  visitExpressionStmt(stmt: ExpressionStatement, context: any): any;
  visitReturnStmt(stmt: ReturnStatement, context: any): any;
  visitDeclareClassStmt(stmt: ClassStmt, context: any): any;
  visitIfStmt(stmt: IfStmt, context: any): any;
  visitTryCatchStmt(stmt: TryCatchStmt, context: any): any;
  visitThrowStmt(stmt: ThrowStmt, context: any): any;
  visitCommentStmt(stmt: CommentStmt, context: any): any;
}

export class ExpressionTransformer implements StatementVisitor, ExpressionVisitor {
  visitReadVarExpr(ast: ReadVarExpr, context: any): any { return ast; }
  visitWriteVarExpr(expr: WriteVarExpr, context: any): any {
    return new WriteVarExpr(expr.name, expr.value.visitExpression(this, context));
  }
  visitWriteKeyExpr(expr: WriteKeyExpr, context: any): any {
    return new WriteKeyExpr(
        expr.receiver.visitExpression(this, context), expr.index.visitExpression(this, context),
        expr.value.visitExpression(this, context));
  }
  visitWritePropExpr(expr: WritePropExpr, context: any): any {
    return new WritePropExpr(
        expr.receiver.visitExpression(this, context), expr.name,
        expr.value.visitExpression(this, context));
  }
  visitInvokeMethodExpr(ast: InvokeMethodExpr, context: any): any {
    var method = isPresent(ast.builtin) ? ast.builtin : ast.name;
    return new InvokeMethodExpr(
        ast.receiver.visitExpression(this, context), method,
        this.visitAllExpressions(ast.args, context), ast.type);
  }
  visitInvokeFunctionExpr(ast: InvokeFunctionExpr, context: any): any {
    return new InvokeFunctionExpr(
        ast.fn.visitExpression(this, context), this.visitAllExpressions(ast.args, context),
        ast.type);
  }
  visitInstantiateExpr(ast: InstantiateExpr, context: any): any {
    return new InstantiateExpr(
        ast.classExpr.visitExpression(this, context), this.visitAllExpressions(ast.args, context),
        ast.type);
  }
  visitLiteralExpr(ast: LiteralExpr, context: any): any { return ast; }
  visitExternalExpr(ast: ExternalExpr, context: any): any { return ast; }
  visitConditionalExpr(ast: ConditionalExpr, context: any): any {
    return new ConditionalExpr(
        ast.condition.visitExpression(this, context), ast.trueCase.visitExpression(this, context),
        ast.falseCase.visitExpression(this, context));
  }
  visitNotExpr(ast: NotExpr, context: any): any {
    return new NotExpr(ast.condition.visitExpression(this, context));
  }
  visitCastExpr(ast: CastExpr, context: any): any {
    return new CastExpr(ast.value.visitExpression(this, context), context);
  }
  visitFunctionExpr(ast: FunctionExpr, context: any): any {
    // Don't descend into nested functions
    return ast;
  }
  visitBinaryOperatorExpr(ast: BinaryOperatorExpr, context: any): any {
    return new BinaryOperatorExpr(
        ast.operator, ast.lhs.visitExpression(this, context),
        ast.rhs.visitExpression(this, context), ast.type);
  }
  visitReadPropExpr(ast: ReadPropExpr, context: any): any {
    return new ReadPropExpr(ast.receiver.visitExpression(this, context), ast.name, ast.type);
  }
  visitReadKeyExpr(ast: ReadKeyExpr, context: any): any {
    return new ReadKeyExpr(
        ast.receiver.visitExpression(this, context), ast.index.visitExpression(this, context),
        ast.type);
  }
  visitLiteralArrayExpr(ast: LiteralArrayExpr, context: any): any {
    return new LiteralArrayExpr(this.visitAllExpressions(ast.entries, context));
  }
  visitLiteralMapExpr(ast: LiteralMapExpr, context: any): any {
    return new LiteralMapExpr(ast.entries.map(
        (entry) => [entry[0], (<Expression>entry[1]).visitExpression(this, context)]));
  }
  visitAllExpressions(exprs: Expression[], context: any): Expression[] {
    return exprs.map(expr => expr.visitExpression(this, context));
  }

  visitDeclareVarStmt(stmt: DeclareVarStmt, context: any): any {
    return new DeclareVarStmt(
        stmt.name, stmt.value.visitExpression(this, context), stmt.type, stmt.modifiers);
  }
  visitDeclareFunctionStmt(stmt: DeclareFunctionStmt, context: any): any {
    // Don't descend into nested functions
    return stmt;
  }
  visitExpressionStmt(stmt: ExpressionStatement, context: any): any {
    return new ExpressionStatement(stmt.expr.visitExpression(this, context));
  }
  visitReturnStmt(stmt: ReturnStatement, context: any): any {
    return new ReturnStatement(stmt.value.visitExpression(this, context));
  }
  visitDeclareClassStmt(stmt: ClassStmt, context: any): any {
    // Don't descend into nested functions
    return stmt;
  }
  visitIfStmt(stmt: IfStmt, context: any): any {
    return new IfStmt(
        stmt.condition.visitExpression(this, context),
        this.visitAllStatements(stmt.trueCase, context),
        this.visitAllStatements(stmt.falseCase, context));
  }
  visitTryCatchStmt(stmt: TryCatchStmt, context: any): any {
    return new TryCatchStmt(
        this.visitAllStatements(stmt.bodyStmts, context),
        this.visitAllStatements(stmt.catchStmts, context));
  }
  visitThrowStmt(stmt: ThrowStmt, context: any): any {
    return new ThrowStmt(stmt.error.visitExpression(this, context));
  }
  visitCommentStmt(stmt: CommentStmt, context: any): any { return stmt; }
  visitAllStatements(stmts: Statement[], context: any): Statement[] {
    return stmts.map(stmt => stmt.visitStatement(this, context));
  }
}


export class RecursiveExpressionVisitor implements StatementVisitor, ExpressionVisitor {
  visitReadVarExpr(ast: ReadVarExpr, context: any): any { return ast; }
  visitWriteVarExpr(expr: WriteVarExpr, context: any): any {
    expr.value.visitExpression(this, context);
    return expr;
  }
  visitWriteKeyExpr(expr: WriteKeyExpr, context: any): any {
    expr.receiver.visitExpression(this, context);
    expr.index.visitExpression(this, context);
    expr.value.visitExpression(this, context);
    return expr;
  }
  visitWritePropExpr(expr: WritePropExpr, context: any): any {
    expr.receiver.visitExpression(this, context);
    expr.value.visitExpression(this, context);
    return expr;
  }
  visitInvokeMethodExpr(ast: InvokeMethodExpr, context: any): any {
    ast.receiver.visitExpression(this, context);
    this.visitAllExpressions(ast.args, context);
    return ast;
  }
  visitInvokeFunctionExpr(ast: InvokeFunctionExpr, context: any): any {
    ast.fn.visitExpression(this, context);
    this.visitAllExpressions(ast.args, context);
    return ast;
  }
  visitInstantiateExpr(ast: InstantiateExpr, context: any): any {
    ast.classExpr.visitExpression(this, context);
    this.visitAllExpressions(ast.args, context);
    return ast;
  }
  visitLiteralExpr(ast: LiteralExpr, context: any): any { return ast; }
  visitExternalExpr(ast: ExternalExpr, context: any): any { return ast; }
  visitConditionalExpr(ast: ConditionalExpr, context: any): any {
    ast.condition.visitExpression(this, context);
    ast.trueCase.visitExpression(this, context);
    ast.falseCase.visitExpression(this, context);
    return ast;
  }
  visitNotExpr(ast: NotExpr, context: any): any {
    ast.condition.visitExpression(this, context);
    return ast;
  }
  visitCastExpr(ast: CastExpr, context: any): any {
    ast.value.visitExpression(this, context);
    return ast;
  }
  visitFunctionExpr(ast: FunctionExpr, context: any): any { return ast; }
  visitBinaryOperatorExpr(ast: BinaryOperatorExpr, context: any): any {
    ast.lhs.visitExpression(this, context);
    ast.rhs.visitExpression(this, context);
    return ast;
  }
  visitReadPropExpr(ast: ReadPropExpr, context: any): any {
    ast.receiver.visitExpression(this, context);
    return ast;
  }
  visitReadKeyExpr(ast: ReadKeyExpr, context: any): any {
    ast.receiver.visitExpression(this, context);
    ast.index.visitExpression(this, context);
    return ast;
  }
  visitLiteralArrayExpr(ast: LiteralArrayExpr, context: any): any {
    this.visitAllExpressions(ast.entries, context);
    return ast;
  }
  visitLiteralMapExpr(ast: LiteralMapExpr, context: any): any {
    ast.entries.forEach((entry) => (<Expression>entry[1]).visitExpression(this, context));
    return ast;
  }
  visitAllExpressions(exprs: Expression[], context: any): void {
    exprs.forEach(expr => expr.visitExpression(this, context));
  }

  visitDeclareVarStmt(stmt: DeclareVarStmt, context: any): any {
    stmt.value.visitExpression(this, context);
    return stmt;
  }
  visitDeclareFunctionStmt(stmt: DeclareFunctionStmt, context: any): any {
    // Don't descend into nested functions
    return stmt;
  }
  visitExpressionStmt(stmt: ExpressionStatement, context: any): any {
    stmt.expr.visitExpression(this, context);
    return stmt;
  }
  visitReturnStmt(stmt: ReturnStatement, context: any): any {
    stmt.value.visitExpression(this, context);
    return stmt;
  }
  visitDeclareClassStmt(stmt: ClassStmt, context: any): any {
    // Don't descend into nested functions
    return stmt;
  }
  visitIfStmt(stmt: IfStmt, context: any): any {
    stmt.condition.visitExpression(this, context);
    this.visitAllStatements(stmt.trueCase, context);
    this.visitAllStatements(stmt.falseCase, context);
    return stmt;
  }
  visitTryCatchStmt(stmt: TryCatchStmt, context: any): any {
    this.visitAllStatements(stmt.bodyStmts, context);
    this.visitAllStatements(stmt.catchStmts, context);
    return stmt;
  }
  visitThrowStmt(stmt: ThrowStmt, context: any): any {
    stmt.error.visitExpression(this, context);
    return stmt;
  }
  visitCommentStmt(stmt: CommentStmt, context: any): any { return stmt; }
  visitAllStatements(stmts: Statement[], context: any): void {
    stmts.forEach(stmt => stmt.visitStatement(this, context));
  }
}

export function replaceVarInExpression(
    varName: string, newValue: Expression, expression: Expression): Expression {
  var transformer = new _ReplaceVariableTransformer(varName, newValue);
  return expression.visitExpression(transformer, null);
}

class _ReplaceVariableTransformer extends ExpressionTransformer {
  constructor(private _varName: string, private _newValue: Expression) { super(); }
  visitReadVarExpr(ast: ReadVarExpr, context: any): any {
    return ast.name == this._varName ? this._newValue : ast;
  }
}

export function findReadVarNames(stmts: Statement[]): Set<string> {
  var finder = new _VariableFinder();
  finder.visitAllStatements(stmts, null);
  return finder.varNames;
}

class _VariableFinder extends RecursiveExpressionVisitor {
  varNames = new Set<string>();
  visitReadVarExpr(ast: ReadVarExpr, context: any): any {
    this.varNames.add(ast.name);
    return null;
  }
}

export function variable(name: string, type: Type = null): ReadVarExpr {
  return new ReadVarExpr(name, type);
}

export function importExpr(id: CompileIdentifierMetadata, typeParams: Type[] = null): ExternalExpr {
  return new ExternalExpr(id, null, typeParams);
}

export function importType(
    id: CompileIdentifierMetadata, typeParams: Type[] = null,
    typeModifiers: TypeModifier[] = null): ExternalType {
  return isPresent(id) ? new ExternalType(id, typeParams, typeModifiers) : null;
}

export function literal(value: any, type: Type = null): LiteralExpr {
  return new LiteralExpr(value, type);
}

export function literalArr(values: Expression[], type: Type = null): LiteralArrayExpr {
  return new LiteralArrayExpr(values, type);
}

export function literalMap(
    values: Array<Array<string|Expression>>, type: MapType = null): LiteralMapExpr {
  return new LiteralMapExpr(values, type);
}

export function not(expr: Expression): NotExpr {
  return new NotExpr(expr);
}

export function fn(params: FnParam[], body: Statement[], type: Type = null): FunctionExpr {
  return new FunctionExpr(params, body, type);
}
