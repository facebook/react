import {isPresent} from '../src/facade/lang';

import {ParseSourceSpan} from './parse_util';

export interface HtmlAst {
  sourceSpan: ParseSourceSpan;
  visit(visitor: HtmlAstVisitor, context: any): any;
}

export class HtmlTextAst implements HtmlAst {
  constructor(public value: string, public sourceSpan: ParseSourceSpan) {}
  visit(visitor: HtmlAstVisitor, context: any): any { return visitor.visitText(this, context); }
}

export class HtmlExpansionAst implements HtmlAst {
  constructor(
      public switchValue: string, public type: string, public cases: HtmlExpansionCaseAst[],
      public sourceSpan: ParseSourceSpan, public switchValueSourceSpan: ParseSourceSpan) {}
  visit(visitor: HtmlAstVisitor, context: any): any {
    return visitor.visitExpansion(this, context);
  }
}

export class HtmlExpansionCaseAst implements HtmlAst {
  constructor(
      public value: string, public expression: HtmlAst[], public sourceSpan: ParseSourceSpan,
      public valueSourceSpan: ParseSourceSpan, public expSourceSpan: ParseSourceSpan) {}

  visit(visitor: HtmlAstVisitor, context: any): any {
    return visitor.visitExpansionCase(this, context);
  }
}

export class HtmlAttrAst implements HtmlAst {
  constructor(public name: string, public value: string, public sourceSpan: ParseSourceSpan) {}
  visit(visitor: HtmlAstVisitor, context: any): any { return visitor.visitAttr(this, context); }
}

export class HtmlElementAst implements HtmlAst {
  constructor(
      public name: string, public attrs: HtmlAttrAst[], public children: HtmlAst[],
      public sourceSpan: ParseSourceSpan, public startSourceSpan: ParseSourceSpan,
      public endSourceSpan: ParseSourceSpan) {}
  visit(visitor: HtmlAstVisitor, context: any): any { return visitor.visitElement(this, context); }
}

export class HtmlCommentAst implements HtmlAst {
  constructor(public value: string, public sourceSpan: ParseSourceSpan) {}
  visit(visitor: HtmlAstVisitor, context: any): any { return visitor.visitComment(this, context); }
}

export interface HtmlAstVisitor {
  visitElement(ast: HtmlElementAst, context: any): any;
  visitAttr(ast: HtmlAttrAst, context: any): any;
  visitText(ast: HtmlTextAst, context: any): any;
  visitComment(ast: HtmlCommentAst, context: any): any;
  visitExpansion(ast: HtmlExpansionAst, context: any): any;
  visitExpansionCase(ast: HtmlExpansionCaseAst, context: any): any;
}

export function htmlVisitAll(visitor: HtmlAstVisitor, asts: HtmlAst[], context: any = null): any[] {
  var result: any[] = [];
  asts.forEach(ast => {
    var astResult = ast.visit(visitor, context);
    if (isPresent(astResult)) {
      result.push(astResult);
    }
  });
  return result;
}
