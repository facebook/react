import {BaseException} from '../facade/exceptions';
import {HtmlAst, HtmlAstVisitor, HtmlAttrAst, HtmlCommentAst, HtmlElementAst, HtmlExpansionAst, HtmlExpansionCaseAst, HtmlTextAst, htmlVisitAll} from '../html_ast';
import {ParseError} from '../parse_util';
import {I18nError} from './shared';

// http://cldr.unicode.org/index/cldr-spec/plural-rules
const PLURAL_CASES: string[] = ['zero', 'one', 'two', 'few', 'many', 'other'];

/**
 * Expands special forms into elements.
 *
 * For example,
 *
 * ```
 * { messages.length, plural,
 *   =0 {zero}
 *   =1 {one}
 *   other {more than one}
 * }
 * ```
 *
 * will be expanded into
 *
 * ```
 * <ng-container [ngPlural]="messages.length">
 *   <template ngPluralCase="=0">zero</ng-container>
 *   <template ngPluralCase="=1">one</ng-container>
 *   <template ngPluralCase="other">more than one</ng-container>
 * </ng-container>
 * ```
 */
export function expandNodes(nodes: HtmlAst[]): ExpansionResult {
  const expander = new _Expander();
  return new ExpansionResult(htmlVisitAll(expander, nodes), expander.isExpanded, expander.errors);
}

export class ExpansionResult {
  constructor(public nodes: HtmlAst[], public expanded: boolean, public errors: ParseError[]) {}
}

/**
 * Expand expansion forms (plural, select) to directives
 *
 * @internal
 */
class _Expander implements HtmlAstVisitor {
  isExpanded: boolean = false;
  errors: ParseError[] = [];

  visitElement(ast: HtmlElementAst, context: any): any {
    return new HtmlElementAst(
        ast.name, ast.attrs, htmlVisitAll(this, ast.children), ast.sourceSpan, ast.startSourceSpan,
        ast.endSourceSpan);
  }

  visitAttr(ast: HtmlAttrAst, context: any): any { return ast; }

  visitText(ast: HtmlTextAst, context: any): any { return ast; }

  visitComment(ast: HtmlCommentAst, context: any): any { return ast; }

  visitExpansion(ast: HtmlExpansionAst, context: any): any {
    this.isExpanded = true;
    return ast.type == 'plural' ? _expandPluralForm(ast, this.errors) :
                                  _expandDefaultForm(ast, this.errors);
  }

  visitExpansionCase(ast: HtmlExpansionCaseAst, context: any): any {
    throw new BaseException('Should not be reached');
  }
}

function _expandPluralForm(ast: HtmlExpansionAst, errors: ParseError[]): HtmlElementAst {
  const children = ast.cases.map(c => {
    if (PLURAL_CASES.indexOf(c.value) == -1 && !c.value.match(/^=\d+$/)) {
      errors.push(new I18nError(
          c.valueSourceSpan,
          `Plural cases should be "=<number>" or one of ${PLURAL_CASES.join(", ")}`));
    }

    const expansionResult = expandNodes(c.expression);
    errors.push(...expansionResult.errors);

    return new HtmlElementAst(
        `template`, [new HtmlAttrAst('ngPluralCase', `${c.value}`, c.valueSourceSpan)],
        expansionResult.nodes, c.sourceSpan, c.sourceSpan, c.sourceSpan);
  });
  const switchAttr = new HtmlAttrAst('[ngPlural]', ast.switchValue, ast.switchValueSourceSpan);
  return new HtmlElementAst(
      'ng-container', [switchAttr], children, ast.sourceSpan, ast.sourceSpan, ast.sourceSpan);
}

function _expandDefaultForm(ast: HtmlExpansionAst, errors: ParseError[]): HtmlElementAst {
  let children = ast.cases.map(c => {
    const expansionResult = expandNodes(c.expression);
    errors.push(...expansionResult.errors);

    return new HtmlElementAst(
        `template`, [new HtmlAttrAst('ngSwitchCase', `${c.value}`, c.valueSourceSpan)],
        expansionResult.nodes, c.sourceSpan, c.sourceSpan, c.sourceSpan);
  });
  const switchAttr = new HtmlAttrAst('[ngSwitch]', ast.switchValue, ast.switchValueSourceSpan);
  return new HtmlElementAst(
      'ng-container', [switchAttr], children, ast.sourceSpan, ast.sourceSpan, ast.sourceSpan);
}
