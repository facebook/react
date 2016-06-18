import {Lexer} from '@angular/compiler/src/expression_parser/lexer';
import {Parser} from '@angular/compiler/src/expression_parser/parser';
import {HtmlParser} from '@angular/compiler/src/html_parser';
import {Message} from '@angular/compiler/src/i18n/message';
import {MessageExtractor, removeDuplicates} from '@angular/compiler/src/i18n/message_extractor';
import {beforeEach, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '@angular/core/testing/testing_internal';

export function main() {
  describe('MessageExtractor', () => {
    let extractor: MessageExtractor;

    beforeEach(() => {
      let htmlParser = new HtmlParser();
      var parser = new Parser(new Lexer());
      extractor = new MessageExtractor(htmlParser, parser, ['i18n-tag'], {'i18n-el': ['trans']});
    });

    it('should extract from elements with the i18n attr', () => {
      let res = extractor.extract('<div i18n=\'meaning|desc\'>message</div>', 'someurl');
      expect(res.messages).toEqual([new Message('message', 'meaning', 'desc')]);
    });

    it('should extract from elements with the i18n attr without a desc', () => {
      let res = extractor.extract('<div i18n=\'meaning\'>message</div>', 'someurl');
      expect(res.messages).toEqual([new Message('message', 'meaning', null)]);
    });

    it('should extract from elements with the i18n attr without a meaning', () => {
      let res = extractor.extract('<div i18n>message</div>', 'someurl');
      expect(res.messages).toEqual([new Message('message', null, null)]);
    });

    it('should extract from attributes', () => {
      let res = extractor.extract(
          `
        <div
          title1='message1' i18n-title1='meaning1|desc1'
          title2='message2' i18n-title2='meaning2|desc2'>
        </div>
      `,
          'someurl');

      expect(res.messages).toEqual([
        new Message('message1', 'meaning1', 'desc1'), new Message('message2', 'meaning2', 'desc2')
      ]);
    });

    it('should extract from partitions', () => {
      let res = extractor.extract(
          `
         <!-- i18n: meaning1|desc1 -->message1<!-- /i18n -->
         <!-- i18n: meaning2 -->message2<!-- /i18n -->
         <!-- i18n -->message3<!-- /i18n -->`,
          'someUrl');

      expect(res.messages).toEqual([
        new Message('message1', 'meaning1', 'desc1'),
        new Message('message2', 'meaning2'),
        new Message('message3', null),
      ]);
    });

    it('should ignore other comments', () => {
      let res = extractor.extract(
          `
         <!-- i18n: meaning1|desc1 --><!-- other -->message1<!-- /i18n -->`,
          'someUrl');

      expect(res.messages).toEqual([new Message('message1', 'meaning1', 'desc1')]);
    });

    it('should replace interpolation with placeholders (text nodes)', () => {
      let res = extractor.extract('<div i18n>Hi {{one}} and {{two}}</div>', 'someurl');
      expect(res.messages).toEqual([new Message(
          '<ph name="t0">Hi <ph name="0"/> and <ph name="1"/></ph>', null, null)]);
    });

    it('should replace interpolation with placeholders (attributes)', () => {
      let res =
          extractor.extract('<div title=\'Hi {{one}} and {{two}}\' i18n-title></div>', 'someurl');
      expect(res.messages).toEqual([new Message(
          'Hi <ph name="0"/> and <ph name="1"/>', null, null)]);
    });

    it('should replace interpolation with named placeholders if provided (text nodes)', () => {
      let res = extractor.extract(
          `
        <div i18n>Hi {{one //i18n(ph="FIRST")}} and {{two //i18n(ph="SECOND")}}</div>`,
          'someurl');
      expect(res.messages).toEqual([new Message(
          '<ph name="t0">Hi <ph name="FIRST"/> and <ph name="SECOND"/></ph>', null, null)]);
    });

    it('should replace interpolation with named placeholders if provided (attributes)', () => {
      let res = extractor.extract(
          `
      <div title='Hi {{one //i18n(ph="FIRST")}} and {{two //i18n(ph="SECOND")}}'
        i18n-title></div>`,
          'someurl');
      expect(res.messages).toEqual([new Message(
          'Hi <ph name="FIRST"/> and <ph name="SECOND"/>', null, null)]);
    });

    it('should match named placeholders with extra spacing', () => {
      let res = extractor.extract(
          `
      <div title='Hi {{one // i18n ( ph = "FIRST" )}} and {{two // i18n ( ph = "SECOND" )}}'
        i18n-title></div>`,
          'someurl');
      expect(res.messages).toEqual([new Message(
          'Hi <ph name="FIRST"/> and <ph name="SECOND"/>', null, null)]);
    });

    it('should suffix duplicate placeholder names with numbers', () => {
      let res = extractor.extract(
          `
      <div title='Hi {{one //i18n(ph="FIRST")}} and {{two //i18n(ph="FIRST")}} and {{three //i18n(ph="FIRST")}}'
        i18n-title></div>`,
          'someurl');
      expect(res.messages).toEqual([new Message(
          'Hi <ph name="FIRST"/> and <ph name="FIRST_1"/> and <ph name="FIRST_2"/>', null, null)]);
    });

    it('should handle html content', () => {
      let res = extractor.extract(
          '<div i18n><div attr="value">zero<div>one</div></div><div>two</div></div>', 'someurl');
      expect(res.messages).toEqual([new Message(
          '<ph name="e0">zero<ph name="e2">one</ph></ph><ph name="e4">two</ph>', null, null)]);
    });

    it('should handle html content with interpolation', () => {
      let res =
          extractor.extract('<div i18n><div>zero{{a}}<div>{{b}}</div></div></div>', 'someurl');
      expect(res.messages).toEqual([new Message(
          '<ph name="e0"><ph name="t1">zero<ph name="0"/></ph><ph name="e2"><ph name="t3"><ph name="0"/></ph></ph></ph>',
          null, null)]);
    });

    it('should extract from nested elements', () => {
      let res = extractor.extract(
          '<div title="message1" i18n-title="meaning1|desc1"><div i18n="meaning2|desc2">message2</div></div>',
          'someurl');
      expect(res.messages).toEqual([
        new Message('message2', 'meaning2', 'desc2'), new Message('message1', 'meaning1', 'desc1')
      ]);
    });

    it('should extract messages from attributes in i18n blocks', () => {
      let res = extractor.extract(
          '<div i18n><div attr="value" i18n-attr="meaning|desc">message</div></div>', 'someurl');
      expect(res.messages).toEqual([
        new Message('<ph name="e0">message</ph>', null, null),
        new Message('value', 'meaning', 'desc')
      ]);
    });

    // TODO(vicb) - this should be extracted to a single message
    // see https://github.com/angular/angular/issues/9067
    xit('should extract messages from expansion forms', () => {
      let res = extractor.extract(
          `
        <div>
          {messages.length, plural,
             =0 {You have <b>no</b> messages}
             =1 {You have one message}
             other {You have messages}
          }
        </div>`,
          'someurl');

      expect(res.messages).toEqual([
        new Message('You have <ph name="e1">no</ph> messages', 'plural_=0', null),
        new Message('You have one message', 'plural_=1', null),
        new Message('You have messages', 'plural_other', null),
      ]);
    });

    it('should remove duplicate messages', () => {
      let res = extractor.extract(
          `
         <!-- i18n: meaning|desc1 -->message<!-- /i18n -->
         <!-- i18n: meaning|desc2 -->message<!-- /i18n -->`,
          'someUrl');

      expect(removeDuplicates(res.messages)).toEqual([
        new Message('message', 'meaning', 'desc1'),
      ]);
    });

    describe('implicit translation', () => {
      it('should extract from elements', () => {
        let res = extractor.extract('<i18n-tag>message</i18n-tag>', 'someurl');
        expect(res.messages).toEqual([new Message('message', null, null)]);
      });

      it('should extract meaning and description from elements when present', () => {
        let res = extractor.extract(
            '<i18n-tag i18n=\'meaning|description\'>message</i18n-tag>', 'someurl');
        expect(res.messages).toEqual([new Message('message', 'meaning', 'description')]);
      });

      it('should extract from attributes', () => {
        let res = extractor.extract(`<i18n-el trans='message'></i18n-el>`, 'someurl');
        expect(res.messages).toEqual([new Message('message', null, null)]);
      });

      it('should extract meaning and description from attributes when present', () => {
        let res = extractor.extract(
            `<i18n-el trans='message' i18n-trans="meaning|desc"></i18n-el>`, 'someurl');
        expect(res.messages).toEqual([new Message('message', 'meaning', 'desc')]);
      });
    });

    describe('errors', () => {
      it('should error on i18n attributes without matching "real" attributes', () => {
        let res = extractor.extract(
            `
        <div
          title1='message1' i18n-title1='meaning1|desc1' i18n-title2='meaning2|desc2'>
        </div>`,
            'someurl');

        expect(res.errors.length).toEqual(1);
        expect(res.errors[0].msg).toEqual('Missing attribute \'title2\'.');
      });

      it('should error when cannot find a matching desc', () => {
        let res = extractor.extract(
            `
         <!-- i18n: meaning1|desc1 -->message1`,
            'someUrl');

        expect(res.errors.length).toEqual(1);
        expect(res.errors[0].msg).toEqual('Missing closing \'i18n\' comment.');
      });

      it('should return parse errors when the template is invalid', () => {
        let res = extractor.extract('<input&#Besfs', 'someurl');
        expect(res.errors.length).toEqual(1);
        expect(res.errors[0].msg).toEqual('Unexpected character "s"');
      });

      it('should return parse errors on unknown plural cases', () => {
        let res = extractor.extract('{n, plural, unknown {-}}', 'someUrl');
        expect(res.errors.length).toEqual(1);
        expect(res.errors[0].msg)
            .toEqual(
                'Plural cases should be "=<number>" or one of zero, one, two, few, many, other');
      });
    });
  });
}
