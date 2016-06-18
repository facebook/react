import {HtmlAttrAst, HtmlElementAst, HtmlTextAst} from '@angular/compiler/src/html_ast';
import {HtmlParser} from '@angular/compiler/src/html_parser';
import {ExpansionResult, expandNodes} from '@angular/compiler/src/i18n/expander';
import {ParseError} from '@angular/compiler/src/parse_util';
import {humanizeNodes} from '@angular/compiler/test/html_ast_spec_utils';
import {ddescribe, describe, expect, iit, it} from '@angular/core/testing/testing_internal';

export function main() {
  describe('Expander', () => {
    function expand(template: string): ExpansionResult {
      const htmlParser = new HtmlParser();
      const res = htmlParser.parse(template, 'url', true);
      return expandNodes(res.rootNodes);
    }

    it('should handle the plural expansion form', () => {
      const res = expand(`{messages.length, plural,=0 {zero<b>bold</b>}}`);

      expect(humanizeNodes(res.nodes)).toEqual([
        [HtmlElementAst, 'ng-container', 0],
        [HtmlAttrAst, '[ngPlural]', 'messages.length'],
        [HtmlElementAst, 'template', 1],
        [HtmlAttrAst, 'ngPluralCase', '=0'],
        [HtmlTextAst, 'zero', 2],
        [HtmlElementAst, 'b', 2],
        [HtmlTextAst, 'bold', 3],
      ]);
    });

    it('should handle nested expansion forms', () => {
      const res = expand(`{messages.length, plural, =0 { {p.gender, gender, =m {m}} }}`);

      expect(humanizeNodes(res.nodes)).toEqual([
        [HtmlElementAst, 'ng-container', 0],
        [HtmlAttrAst, '[ngPlural]', 'messages.length'],
        [HtmlElementAst, 'template', 1],
        [HtmlAttrAst, 'ngPluralCase', '=0'],
        [HtmlElementAst, 'ng-container', 2],
        [HtmlAttrAst, '[ngSwitch]', 'p.gender'],
        [HtmlElementAst, 'template', 3],
        [HtmlAttrAst, 'ngSwitchCase', '=m'],
        [HtmlTextAst, 'm', 4],
        [HtmlTextAst, ' ', 2],
      ]);
    });

    it('should correctly set source code positions', () => {
      const nodes = expand(`{messages.length, plural,=0 {<b>bold</b>}}`).nodes;

      const container: HtmlElementAst = <HtmlElementAst>nodes[0];
      expect(container.sourceSpan.start.col).toEqual(0);
      expect(container.sourceSpan.end.col).toEqual(42);
      expect(container.startSourceSpan.start.col).toEqual(0);
      expect(container.startSourceSpan.end.col).toEqual(42);
      expect(container.endSourceSpan.start.col).toEqual(0);
      expect(container.endSourceSpan.end.col).toEqual(42);

      const switchExp = container.attrs[0];
      expect(switchExp.sourceSpan.start.col).toEqual(1);
      expect(switchExp.sourceSpan.end.col).toEqual(16);

      const template: HtmlElementAst = <HtmlElementAst>container.children[0];
      expect(template.sourceSpan.start.col).toEqual(25);
      expect(template.sourceSpan.end.col).toEqual(41);

      const switchCheck = template.attrs[0];
      expect(switchCheck.sourceSpan.start.col).toEqual(25);
      expect(switchCheck.sourceSpan.end.col).toEqual(28);

      const b: HtmlElementAst = <HtmlElementAst>template.children[0];
      expect(b.sourceSpan.start.col).toEqual(29);
      expect(b.endSourceSpan.end.col).toEqual(40);
    });

    it('should handle other special forms', () => {
      const res = expand(`{person.gender, gender,=male {m}}`);

      expect(humanizeNodes(res.nodes)).toEqual([
        [HtmlElementAst, 'ng-container', 0],
        [HtmlAttrAst, '[ngSwitch]', 'person.gender'],
        [HtmlElementAst, 'template', 1],
        [HtmlAttrAst, 'ngSwitchCase', '=male'],
        [HtmlTextAst, 'm', 2],
      ]);
    });

    describe('errors', () => {
      it('should error on unknown plural cases', () => {
        expect(humanizeErrors(expand('{n, plural, unknown {-}}').errors)).toEqual([
          `Plural cases should be "=<number>" or one of zero, one, two, few, many, other`,
        ]);
      });
    });
  });
}

function humanizeErrors(errors: ParseError[]): string[] {
  return errors.map(error => error.msg);
}
