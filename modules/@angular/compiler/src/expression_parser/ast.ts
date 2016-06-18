import {ListWrapper} from '../facade/collection';

export class AST {
  visit(visitor: AstVisitor, context: any = null): any { return null; }
  toString(): string { return 'AST'; }
}

/**
 * Represents a quoted expression of the form:
 *
 * quote = prefix `:` uninterpretedExpression
 * prefix = identifier
 * uninterpretedExpression = arbitrary string
 *
 * A quoted expression is meant to be pre-processed by an AST transformer that
 * converts it into another AST that no longer contains quoted expressions.
 * It is meant to allow third-party developers to extend Angular template
 * expression language. The `uninterpretedExpression` part of the quote is
 * therefore not interpreted by the Angular's own expression parser.
 */
export class Quote extends AST {
  constructor(public prefix: string, public uninterpretedExpression: string, public location: any) {
    super();
  }
  visit(visitor: AstVisitor, context: any = null): any { return visitor.visitQuote(this, context); }
  toString(): string { return 'Quote'; }
}

export class EmptyExpr extends AST {
  visit(visitor: AstVisitor, context: any = null) {
    // do nothing
  }
}

export class ImplicitReceiver extends AST {
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitImplicitReceiver(this, context);
  }
}

/**
 * Multiple expressions separated by a semicolon.
 */
export class Chain extends AST {
  constructor(public expressions: any[]) { super(); }
  visit(visitor: AstVisitor, context: any = null): any { return visitor.visitChain(this, context); }
}

export class Conditional extends AST {
  constructor(public condition: AST, public trueExp: AST, public falseExp: AST) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitConditional(this, context);
  }
}

export class PropertyRead extends AST {
  constructor(public receiver: AST, public name: string) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitPropertyRead(this, context);
  }
}

export class PropertyWrite extends AST {
  constructor(public receiver: AST, public name: string, public value: AST) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitPropertyWrite(this, context);
  }
}

export class SafePropertyRead extends AST {
  constructor(public receiver: AST, public name: string) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitSafePropertyRead(this, context);
  }
}

export class KeyedRead extends AST {
  constructor(public obj: AST, public key: AST) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitKeyedRead(this, context);
  }
}

export class KeyedWrite extends AST {
  constructor(public obj: AST, public key: AST, public value: AST) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitKeyedWrite(this, context);
  }
}

export class BindingPipe extends AST {
  constructor(public exp: AST, public name: string, public args: any[]) { super(); }
  visit(visitor: AstVisitor, context: any = null): any { return visitor.visitPipe(this, context); }
}

export class LiteralPrimitive extends AST {
  constructor(public value: any) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitLiteralPrimitive(this, context);
  }
}

export class LiteralArray extends AST {
  constructor(public expressions: any[]) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitLiteralArray(this, context);
  }
}

export class LiteralMap extends AST {
  constructor(public keys: any[], public values: any[]) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitLiteralMap(this, context);
  }
}

export class Interpolation extends AST {
  constructor(public strings: any[], public expressions: any[]) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitInterpolation(this, context);
  }
}

export class Binary extends AST {
  constructor(public operation: string, public left: AST, public right: AST) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitBinary(this, context);
  }
}

export class PrefixNot extends AST {
  constructor(public expression: AST) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitPrefixNot(this, context);
  }
}

export class MethodCall extends AST {
  constructor(public receiver: AST, public name: string, public args: any[]) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitMethodCall(this, context);
  }
}

export class SafeMethodCall extends AST {
  constructor(public receiver: AST, public name: string, public args: any[]) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitSafeMethodCall(this, context);
  }
}

export class FunctionCall extends AST {
  constructor(public target: AST, public args: any[]) { super(); }
  visit(visitor: AstVisitor, context: any = null): any {
    return visitor.visitFunctionCall(this, context);
  }
}

export class ASTWithSource extends AST {
  constructor(public ast: AST, public source: string, public location: string) { super(); }
  visit(visitor: AstVisitor, context: any = null): any { return this.ast.visit(visitor, context); }
  toString(): string { return `${this.source} in ${this.location}`; }
}

export class TemplateBinding {
  constructor(
      public key: string, public keyIsVar: boolean, public name: string,
      public expression: ASTWithSource) {}
}

export interface AstVisitor {
  visitBinary(ast: Binary, context: any): any;
  visitChain(ast: Chain, context: any): any;
  visitConditional(ast: Conditional, context: any): any;
  visitFunctionCall(ast: FunctionCall, context: any): any;
  visitImplicitReceiver(ast: ImplicitReceiver, context: any): any;
  visitInterpolation(ast: Interpolation, context: any): any;
  visitKeyedRead(ast: KeyedRead, context: any): any;
  visitKeyedWrite(ast: KeyedWrite, context: any): any;
  visitLiteralArray(ast: LiteralArray, context: any): any;
  visitLiteralMap(ast: LiteralMap, context: any): any;
  visitLiteralPrimitive(ast: LiteralPrimitive, context: any): any;
  visitMethodCall(ast: MethodCall, context: any): any;
  visitPipe(ast: BindingPipe, context: any): any;
  visitPrefixNot(ast: PrefixNot, context: any): any;
  visitPropertyRead(ast: PropertyRead, context: any): any;
  visitPropertyWrite(ast: PropertyWrite, context: any): any;
  visitQuote(ast: Quote, context: any): any;
  visitSafeMethodCall(ast: SafeMethodCall, context: any): any;
  visitSafePropertyRead(ast: SafePropertyRead, context: any): any;
}

export class RecursiveAstVisitor implements AstVisitor {
  visitBinary(ast: Binary, context: any): any {
    ast.left.visit(this);
    ast.right.visit(this);
    return null;
  }
  visitChain(ast: Chain, context: any): any { return this.visitAll(ast.expressions, context); }
  visitConditional(ast: Conditional, context: any): any {
    ast.condition.visit(this);
    ast.trueExp.visit(this);
    ast.falseExp.visit(this);
    return null;
  }
  visitPipe(ast: BindingPipe, context: any): any {
    ast.exp.visit(this);
    this.visitAll(ast.args, context);
    return null;
  }
  visitFunctionCall(ast: FunctionCall, context: any): any {
    ast.target.visit(this);
    this.visitAll(ast.args, context);
    return null;
  }
  visitImplicitReceiver(ast: ImplicitReceiver, context: any): any { return null; }
  visitInterpolation(ast: Interpolation, context: any): any {
    return this.visitAll(ast.expressions, context);
  }
  visitKeyedRead(ast: KeyedRead, context: any): any {
    ast.obj.visit(this);
    ast.key.visit(this);
    return null;
  }
  visitKeyedWrite(ast: KeyedWrite, context: any): any {
    ast.obj.visit(this);
    ast.key.visit(this);
    ast.value.visit(this);
    return null;
  }
  visitLiteralArray(ast: LiteralArray, context: any): any {
    return this.visitAll(ast.expressions, context);
  }
  visitLiteralMap(ast: LiteralMap, context: any): any { return this.visitAll(ast.values, context); }
  visitLiteralPrimitive(ast: LiteralPrimitive, context: any): any { return null; }
  visitMethodCall(ast: MethodCall, context: any): any {
    ast.receiver.visit(this);
    return this.visitAll(ast.args, context);
  }
  visitPrefixNot(ast: PrefixNot, context: any): any {
    ast.expression.visit(this);
    return null;
  }
  visitPropertyRead(ast: PropertyRead, context: any): any {
    ast.receiver.visit(this);
    return null;
  }
  visitPropertyWrite(ast: PropertyWrite, context: any): any {
    ast.receiver.visit(this);
    ast.value.visit(this);
    return null;
  }
  visitSafePropertyRead(ast: SafePropertyRead, context: any): any {
    ast.receiver.visit(this);
    return null;
  }
  visitSafeMethodCall(ast: SafeMethodCall, context: any): any {
    ast.receiver.visit(this);
    return this.visitAll(ast.args, context);
  }
  visitAll(asts: AST[], context: any): any {
    asts.forEach(ast => ast.visit(this, context));
    return null;
  }
  visitQuote(ast: Quote, context: any): any { return null; }
}

export class AstTransformer implements AstVisitor {
  visitImplicitReceiver(ast: ImplicitReceiver, context: any): AST { return ast; }

  visitInterpolation(ast: Interpolation, context: any): AST {
    return new Interpolation(ast.strings, this.visitAll(ast.expressions));
  }

  visitLiteralPrimitive(ast: LiteralPrimitive, context: any): AST {
    return new LiteralPrimitive(ast.value);
  }

  visitPropertyRead(ast: PropertyRead, context: any): AST {
    return new PropertyRead(ast.receiver.visit(this), ast.name);
  }

  visitPropertyWrite(ast: PropertyWrite, context: any): AST {
    return new PropertyWrite(ast.receiver.visit(this), ast.name, ast.value);
  }

  visitSafePropertyRead(ast: SafePropertyRead, context: any): AST {
    return new SafePropertyRead(ast.receiver.visit(this), ast.name);
  }

  visitMethodCall(ast: MethodCall, context: any): AST {
    return new MethodCall(ast.receiver.visit(this), ast.name, this.visitAll(ast.args));
  }

  visitSafeMethodCall(ast: SafeMethodCall, context: any): AST {
    return new SafeMethodCall(ast.receiver.visit(this), ast.name, this.visitAll(ast.args));
  }

  visitFunctionCall(ast: FunctionCall, context: any): AST {
    return new FunctionCall(ast.target.visit(this), this.visitAll(ast.args));
  }

  visitLiteralArray(ast: LiteralArray, context: any): AST {
    return new LiteralArray(this.visitAll(ast.expressions));
  }

  visitLiteralMap(ast: LiteralMap, context: any): AST {
    return new LiteralMap(ast.keys, this.visitAll(ast.values));
  }

  visitBinary(ast: Binary, context: any): AST {
    return new Binary(ast.operation, ast.left.visit(this), ast.right.visit(this));
  }

  visitPrefixNot(ast: PrefixNot, context: any): AST {
    return new PrefixNot(ast.expression.visit(this));
  }

  visitConditional(ast: Conditional, context: any): AST {
    return new Conditional(
        ast.condition.visit(this), ast.trueExp.visit(this), ast.falseExp.visit(this));
  }

  visitPipe(ast: BindingPipe, context: any): AST {
    return new BindingPipe(ast.exp.visit(this), ast.name, this.visitAll(ast.args));
  }

  visitKeyedRead(ast: KeyedRead, context: any): AST {
    return new KeyedRead(ast.obj.visit(this), ast.key.visit(this));
  }

  visitKeyedWrite(ast: KeyedWrite, context: any): AST {
    return new KeyedWrite(ast.obj.visit(this), ast.key.visit(this), ast.value.visit(this));
  }

  visitAll(asts: any[]): any[] {
    var res = ListWrapper.createFixedSize(asts.length);
    for (var i = 0; i < asts.length; ++i) {
      res[i] = asts[i].visit(this);
    }
    return res;
  }

  visitChain(ast: Chain, context: any): AST { return new Chain(this.visitAll(ast.expressions)); }

  visitQuote(ast: Quote, context: any): AST {
    return new Quote(ast.prefix, ast.uninterpretedExpression, ast.location);
  }
}
