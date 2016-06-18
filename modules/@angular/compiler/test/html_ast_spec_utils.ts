import {HtmlAst, HtmlAstVisitor, HtmlAttrAst, HtmlCommentAst, HtmlElementAst, HtmlExpansionAst, HtmlExpansionCaseAst, HtmlTextAst, htmlVisitAll} from '@angular/compiler/src/html_ast';
import {HtmlParseTreeResult} from '@angular/compiler/src/html_parser';
import {ParseLocation} from '@angular/compiler/src/parse_util';

import {BaseException} from '../src/facade/exceptions';

export function humanizeDom(
    parseResult: HtmlParseTreeResult, addSourceSpan: boolean = false): any[] {
  if (parseResult.errors.length > 0) {
    var errorString = parseResult.errors.join('\n');
    throw new BaseException(`Unexpected parse errors:\n${errorString}`);
  }

  return humanizeNodes(parseResult.rootNodes, addSourceSpan);
}

export function humanizeDomSourceSpans(parseResult: HtmlParseTreeResult): any[] {
  return humanizeDom(parseResult, true);
}

export function humanizeNodes(nodes: HtmlAst[], addSourceSpan: boolean = false): any[] {
  var humanizer = new _Humanizer(addSourceSpan);
  htmlVisitAll(humanizer, nodes);
  return humanizer.result;
}

export function humanizeLineColumn(location: ParseLocation): string {
  return `${location.line}:${location.col}`;
}

class _Humanizer implements HtmlAstVisitor {
  result: any[] = [];
  elDepth: number = 0;

  constructor(private includeSourceSpan: boolean){};

  visitElement(ast: HtmlElementAst, context: any): any {
    var res = this._appendContext(ast, [HtmlElementAst, ast.name, this.elDepth++]);
    this.result.push(res);
    htmlVisitAll(this, ast.attrs);
    htmlVisitAll(this, ast.children);
    this.elDepth--;
  }

  visitAttr(ast: HtmlAttrAst, context: any): any {
    var res = this._appendContext(ast, [HtmlAttrAst, ast.name, ast.value]);
    this.result.push(res);
  }

  visitText(ast: HtmlTextAst, context: any): any {
    var res = this._appendContext(ast, [HtmlTextAst, ast.value, this.elDepth]);
    this.result.push(res);
  }

  visitComment(ast: HtmlCommentAst, context: any): any {
    var res = this._appendContext(ast, [HtmlCommentAst, ast.value, this.elDepth]);
    this.result.push(res);
  }

  visitExpansion(ast: HtmlExpansionAst, context: any): any {
    var res =
        this._appendContext(ast, [HtmlExpansionAst, ast.switchValue, ast.type, this.elDepth++]);
    this.result.push(res);
    htmlVisitAll(this, ast.cases);
    this.elDepth--;
  }

  visitExpansionCase(ast: HtmlExpansionCaseAst, context: any): any {
    var res = this._appendContext(ast, [HtmlExpansionCaseAst, ast.value, this.elDepth]);
    this.result.push(res);
  }

  private _appendContext(ast: HtmlAst, input: any[]): any[] {
    if (!this.includeSourceSpan) return input;
    input.push(ast.sourceSpan.toString());
    return input;
  }
}
