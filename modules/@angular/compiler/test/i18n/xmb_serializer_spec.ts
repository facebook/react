import {HtmlAst} from '@angular/compiler/src/html_ast';
import {Message, id} from '@angular/compiler/src/i18n/message';
import {deserializeXmb, serializeXmb} from '@angular/compiler/src/i18n/xmb_serializer';
import {ParseError, ParseSourceSpan} from '@angular/compiler/src/parse_util';
import {beforeEach, ddescribe, describe, expect, iit, inject, it, xdescribe, xit} from '@angular/core/testing/testing_internal';

export function main() {
  describe('Xmb', () => {
    describe('Xmb Serialization', () => {
      it('should return an empty message bundle for an empty list of messages',
         () => { expect(serializeXmb([])).toEqual('<message-bundle></message-bundle>'); });

      it('should serializeXmb messages without desc', () => {
        let m = new Message('content', 'meaning', null);
        let expected = `<message-bundle><msg id='${id(m)}'>content</msg></message-bundle>`;
        expect(serializeXmb([m])).toEqual(expected);
      });

      it('should serializeXmb messages with desc', () => {
        let m = new Message('content', 'meaning', 'description');
        let expected =
            `<message-bundle><msg id='${id(m)}' desc='description'>content</msg></message-bundle>`;
        expect(serializeXmb([m])).toEqual(expected);
      });
    });

    describe('Xmb Deserialization', () => {
      it('should parse an empty bundle', () => {
        let mb = '<message-bundle></message-bundle>';
        expect(deserializeXmb(mb, 'url').messages).toEqual({});
      });

      it('should parse an non-empty bundle', () => {
        let mb = `
          <message-bundle>
            <msg id="id1" desc="description1">content1</msg>
            <msg id="id2">content2</msg>
          </message-bundle>
        `;

        let parsed = deserializeXmb(mb, 'url').messages;
        expect(_serialize(parsed['id1'])).toEqual('content1');
        expect(_serialize(parsed['id2'])).toEqual('content2');
      });

      it('should error when cannot parse the content', () => {
        let mb = `
          <message-bundle>
            <msg id="id1" desc="description1">content
          </message-bundle>
        `;

        let res = deserializeXmb(mb, 'url');
        expect(_serializeErrors(res.errors)).toEqual(['Unexpected closing tag "message-bundle"']);
      });

      it('should error when cannot find the id attribute', () => {
        let mb = `
          <message-bundle>
            <msg>content</msg>
          </message-bundle>
        `;

        let res = deserializeXmb(mb, 'url');
        expect(_serializeErrors(res.errors)).toEqual(['"id" attribute is missing']);
      });

      it('should error on empty content', () => {
        let mb = ``;
        let res = deserializeXmb(mb, 'url');
        expect(_serializeErrors(res.errors)).toEqual(['Missing element "message-bundle"']);
      });

      it('should error on an invalid element', () => {
        let mb = `
          <message-bundle>
            <invalid>content</invalid>
          </message-bundle>
        `;

        let res = deserializeXmb(mb, 'url');
        expect(_serializeErrors(res.errors)).toEqual(['Unexpected element "invalid"']);
      });

      it('should expand \'ph\' elements', () => {
        let mb = `
          <message-bundle>
            <msg id="id1">a<ph name="i0"/></msg>
          </message-bundle>
        `;

        let res = deserializeXmb(mb, 'url').messages['id1'];
        expect((<any>res[1]).name).toEqual('ph');
      });
    });
  });
}

function _serialize(nodes: HtmlAst[]): string {
  return (<any>nodes[0]).value;
}

function _serializeErrors(errors: ParseError[]): string[] {
  return errors.map(e => e.msg);
}
