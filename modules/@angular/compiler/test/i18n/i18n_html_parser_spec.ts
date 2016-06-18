import {Lexer} from '@angular/compiler/src/expression_parser/lexer';
import {Parser} from '@angular/compiler/src/expression_parser/parser';
import {HtmlAttrAst, HtmlElementAst, HtmlTextAst} from '@angular/compiler/src/html_ast';
import {HtmlParseTreeResult, HtmlParser} from '@angular/compiler/src/html_parser';
import {I18nHtmlParser} from '@angular/compiler/src/i18n/i18n_html_parser';
import {Message, id} from '@angular/compiler/src/i18n/message';
import {deserializeXmb} from '@angular/compiler/src/i18n/xmb_serializer';
import {ParseError} from '@angular/compiler/src/parse_util';
import {humanizeDom} from '@angular/compiler/test/html_ast_spec_utils';
import {ddescribe, describe, expect, iit, it} from '@angular/core/testing/testing_internal';

import {StringMapWrapper} from '../../src/facade/collection';

export function main() {
  describe('I18nHtmlParser', () => {
    function parse(
        template: string, messages: {[key: string]: string}, implicitTags: string[] = [],
        implicitAttrs: {[k: string]: string[]} = {}): HtmlParseTreeResult {
      var parser = new Parser(new Lexer());
      let htmlParser = new HtmlParser();

      let msgs = '';
      StringMapWrapper.forEach(
          messages, (v: string, k: string) => msgs += `<msg id="${k}">${v}</msg>`);
      let res = deserializeXmb(`<message-bundle>${msgs}</message-bundle>`, 'someUrl');

      return new I18nHtmlParser(
                 htmlParser, parser, res.content, res.messages, implicitTags, implicitAttrs)
          .parse(template, 'someurl', true);
    }

    it('should delegate to the provided parser when no i18n', () => {
      expect(humanizeDom(parse('<div>a</div>', {}))).toEqual([
        [HtmlElementAst, 'div', 0], [HtmlTextAst, 'a', 1]
      ]);
    });

    it('should replace attributes', () => {
      let translations: {[key: string]: string} = {};
      translations[id(new Message('some message', 'meaning', null))] = 'another message';

      expect(
          humanizeDom(parse(
              '<div value=\'some message\' i18n-value=\'meaning|comment\'></div>', translations)))
          .toEqual([[HtmlElementAst, 'div', 0], [HtmlAttrAst, 'value', 'another message']]);
    });

    it('should replace elements with the i18n attr', () => {
      let translations: {[key: string]: string} = {};
      translations[id(new Message('message', 'meaning', null))] = 'another message';

      expect(humanizeDom(parse('<div i18n=\'meaning|desc\'>message</div>', translations))).toEqual([
        [HtmlElementAst, 'div', 0], [HtmlTextAst, 'another message', 1]
      ]);
    });

    it('should handle interpolation', () => {
      let translations: {[key: string]: string} = {};
      translations[id(new Message('<ph name="0"/> and <ph name="1"/>', null, null))] =
          '<ph name="1"/> or <ph name="0"/>';

      expect(humanizeDom(parse('<div value=\'{{a}} and {{b}}\' i18n-value></div>', translations)))
          .toEqual([[HtmlElementAst, 'div', 0], [HtmlAttrAst, 'value', '{{b}} or {{a}}']]);
    });

    it('should handle interpolation with custom placeholder names', () => {
      let translations: {[key: string]: string} = {};
      translations[id(new Message('<ph name="FIRST"/> and <ph name="SECOND"/>', null, null))] =
          '<ph name="SECOND"/> or <ph name="FIRST"/>';

      expect(
          humanizeDom(parse(
              `<div value='{{a //i18n(ph="FIRST")}} and {{b //i18n(ph="SECOND")}}' i18n-value></div>`,
              translations)))
          .toEqual([
            [HtmlElementAst, 'div', 0],
            [HtmlAttrAst, 'value', '{{b //i18n(ph="SECOND")}} or {{a //i18n(ph="FIRST")}}']
          ]);
    });

    it('should handle interpolation with duplicate placeholder names', () => {
      let translations: {[key: string]: string} = {};
      translations[id(new Message('<ph name="FIRST"/> and <ph name="FIRST_1"/>', null, null))] =
          '<ph name="FIRST_1"/> or <ph name="FIRST"/>';

      expect(
          humanizeDom(parse(
              `<div value='{{a //i18n(ph="FIRST")}} and {{b //i18n(ph="FIRST")}}' i18n-value></div>`,
              translations)))
          .toEqual([
            [HtmlElementAst, 'div', 0],
            [HtmlAttrAst, 'value', '{{b //i18n(ph="FIRST")}} or {{a //i18n(ph="FIRST")}}']
          ]);
    });

    it('should handle nested html', () => {
      let translations: {[key: string]: string} = {};
      translations[id(new Message('<ph name="e0">a</ph><ph name="e2">b</ph>', null, null))] =
          '<ph name="e2">B</ph><ph name="e0">A</ph>';

      expect(humanizeDom(parse('<div i18n><a>a</a><b>b</b></div>', translations))).toEqual([
        [HtmlElementAst, 'div', 0],
        [HtmlElementAst, 'b', 1],
        [HtmlTextAst, 'B', 2],
        [HtmlElementAst, 'a', 1],
        [HtmlTextAst, 'A', 2],
      ]);
    });

    it('should support interpolation', () => {
      let translations: {[key: string]: string} = {};
      translations[id(new Message(
          '<ph name="e0">a</ph><ph name="e2"><ph name="t3">b<ph name="0"/></ph></ph>', null,
          null))] = '<ph name="e2"><ph name="t3"><ph name="0"/>B</ph></ph><ph name="e0">A</ph>';
      expect(humanizeDom(parse('<div i18n><a>a</a><b>b{{i}}</b></div>', translations))).toEqual([
        [HtmlElementAst, 'div', 0],
        [HtmlElementAst, 'b', 1],
        [HtmlTextAst, '{{i}}B', 2],
        [HtmlElementAst, 'a', 1],
        [HtmlTextAst, 'A', 2],
      ]);
    });

    it('should i18n attributes of placeholder elements', () => {
      let translations: {[key: string]: string} = {};
      translations[id(new Message('<ph name="e0">a</ph>', null, null))] = '<ph name="e0">A</ph>';
      translations[id(new Message('b', null, null))] = 'B';

      expect(humanizeDom(parse('<div i18n><a value="b" i18n-value>a</a></div>', translations)))
          .toEqual([
            [HtmlElementAst, 'div', 0],
            [HtmlElementAst, 'a', 1],
            [HtmlAttrAst, 'value', 'B'],
            [HtmlTextAst, 'A', 2],
          ]);
    });

    it('should preserve non-i18n attributes', () => {
      let translations: {[key: string]: string} = {};
      translations[id(new Message('message', null, null))] = 'another message';

      expect(humanizeDom(parse('<div i18n value="b">message</div>', translations))).toEqual([
        [HtmlElementAst, 'div', 0], [HtmlAttrAst, 'value', 'b'],
        [HtmlTextAst, 'another message', 1]
      ]);
    });

    it('should extract from partitions', () => {
      let translations: {[key: string]: string} = {};
      translations[id(new Message('message1', 'meaning1', null))] = 'another message1';
      translations[id(new Message('message2', 'meaning2', null))] = 'another message2';

      let res = parse(
          `<!-- i18n: meaning1|desc1 -->message1<!-- /i18n --><!-- i18n: meaning2|desc2 -->message2<!-- /i18n -->`,
          translations);

      expect(humanizeDom(res)).toEqual([
        [HtmlTextAst, 'another message1', 0],
        [HtmlTextAst, 'another message2', 0],
      ]);
    });

    it('should preserve original positions', () => {
      let translations: {[key: string]: string} = {};
      translations[id(new Message('<ph name="e0">a</ph><ph name="e2">b</ph>', null, null))] =
          '<ph name="e2">B</ph><ph name="e0">A</ph>';

      let res =
          (<any>parse('<div i18n><a>a</a><b>b</b></div>', translations).rootNodes[0]).children;

      expect(res[0].sourceSpan.start.offset).toEqual(18);
      expect(res[1].sourceSpan.start.offset).toEqual(10);
    });

    describe('errors', () => {
      it('should error when giving an invalid template', () => {
        expect(humanizeErrors(parse('<a>a</b>', {}).errors)).toEqual([
          'Unexpected closing tag "b"'
        ]);
      });

      it('should error when no matching message (attr)', () => {
        let mid = id(new Message('some message', null, null));
        expect(humanizeErrors(parse('<div value=\'some message\' i18n-value></div>', {}).errors))
            .toEqual([`Cannot find message for id '${mid}', content 'some message'.`]);
      });

      it('should error when no matching message (text)', () => {
        let mid = id(new Message('some message', null, null));
        expect(humanizeErrors(parse('<div i18n>some message</div>', {}).errors)).toEqual([
          `Cannot find message for id '${mid}', content 'some message'.`
        ]);
      });

      it('should error when a non-placeholder element appears in translation', () => {
        let translations: {[key: string]: string} = {};
        translations[id(new Message('some message', null, null))] = '<a>a</a>';

        expect(humanizeErrors(parse('<div i18n>some message</div>', translations).errors)).toEqual([
          `Unexpected tag "a". Only "ph" tags are allowed.`
        ]);
      });

      it('should error when a placeholder element does not have the name attribute', () => {
        let translations: {[key: string]: string} = {};
        translations[id(new Message('some message', null, null))] = '<ph>a</ph>';

        expect(humanizeErrors(parse('<div i18n>some message</div>', translations).errors)).toEqual([
          `Missing "name" attribute.`
        ]);
      });

      it('should error when the translation refers to an invalid expression', () => {
        let translations: {[key: string]: string} = {};
        translations[id(new Message('hi <ph name="0"/>', null, null))] = 'hi <ph name="99"/>';

        expect(
            humanizeErrors(parse('<div value=\'hi {{a}}\' i18n-value></div>', translations).errors))
            .toEqual(['Invalid interpolation name \'99\'']);
      });
    });

    describe('implicit translation', () => {
      it('should support attributes', () => {
        let translations: {[key: string]: string} = {};
        translations[id(new Message('some message', null, null))] = 'another message';

        expect(humanizeDom(parse('<i18n-el value=\'some message\'></i18n-el>', translations, [], {
          'i18n-el': ['value']
        }))).toEqual([[HtmlElementAst, 'i18n-el', 0], [HtmlAttrAst, 'value', 'another message']]);
      });

      it('should support attributes with meaning and description', () => {
        let translations: {[key: string]: string} = {};
        translations[id(new Message('some message', 'meaning', 'description'))] = 'another message';

        expect(humanizeDom(parse(
                   '<i18n-el value=\'some message\' i18n-value=\'meaning|description\'></i18n-el>',
                   translations, [], {'i18n-el': ['value']})))
            .toEqual([[HtmlElementAst, 'i18n-el', 0], [HtmlAttrAst, 'value', 'another message']]);
      });

      it('should support elements', () => {
        let translations: {[key: string]: string} = {};
        translations[id(new Message('message', null, null))] = 'another message';

        expect(humanizeDom(parse('<i18n-el>message</i18n-el>', translations, ['i18n-el'])))
            .toEqual([[HtmlElementAst, 'i18n-el', 0], [HtmlTextAst, 'another message', 1]]);
      });

      it('should support elements with meaning and description', () => {
        let translations: {[key: string]: string} = {};
        translations[id(new Message('message', 'meaning', 'description'))] = 'another message';

        expect(humanizeDom(parse(
                   '<i18n-el i18n=\'meaning|description\'>message</i18n-el>', translations,
                   ['i18n-el'])))
            .toEqual([[HtmlElementAst, 'i18n-el', 0], [HtmlTextAst, 'another message', 1]]);
      });
    });
  });
}

function humanizeErrors(errors: ParseError[]): string[] {
  return errors.map(error => error.msg);
}
