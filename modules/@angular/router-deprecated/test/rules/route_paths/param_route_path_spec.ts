import {describe, it, iit, ddescribe, expect, inject, beforeEach,} from '@angular/core/testing/testing_internal';

import {ParamRoutePath} from '../../../src/rules/route_paths/param_route_path';
import {parser, Url} from '../../../src/url_parser';

export function main() {
  describe('PathRecognizer', () => {

    it('should throw when given an invalid path', () => {
      expect(() => new ParamRoutePath('/hi#'))
          .toThrowError(`Path "/hi#" should not include "#". Use "HashLocationStrategy" instead.`);
      expect(() => new ParamRoutePath('hi?'))
          .toThrowError(`Path "hi?" contains "?" which is not allowed in a route config.`);
      expect(() => new ParamRoutePath('hi;'))
          .toThrowError(`Path "hi;" contains ";" which is not allowed in a route config.`);
      expect(() => new ParamRoutePath('hi='))
          .toThrowError(`Path "hi=" contains "=" which is not allowed in a route config.`);
      expect(() => new ParamRoutePath('hi('))
          .toThrowError(`Path "hi(" contains "(" which is not allowed in a route config.`);
      expect(() => new ParamRoutePath('hi)'))
          .toThrowError(`Path "hi)" contains ")" which is not allowed in a route config.`);
      expect(() => new ParamRoutePath('hi//there'))
          .toThrowError(`Path "hi//there" contains "//" which is not allowed in a route config.`);
    });

    describe('querystring params', () => {
      it('should parse querystring params so long as the recognizer is a root', () => {
        var rec = new ParamRoutePath('/hello/there');
        var url = parser.parse('/hello/there?name=igor');
        var match = rec.matchUrl(url);
        expect(match.allParams).toEqual({'name': 'igor'});
      });

      it('should return a combined map of parameters with the param expected in the URL path',
         () => {
           var rec = new ParamRoutePath('/hello/:name');
           var url = parser.parse('/hello/paul?topic=success');
           var match = rec.matchUrl(url);
           expect(match.allParams).toEqual({'name': 'paul', 'topic': 'success'});
         });
    });

    describe('dynamic segments', () => {
      it('should parse parameters', () => {
        var rec = new ParamRoutePath('/test/:id');
        var url = new Url('test', new Url('abc'));
        var match = rec.matchUrl(url);
        expect(match.allParams).toEqual({'id': 'abc'});
      });

      it('should decode special characters when parsing', () => {
        var rec = new ParamRoutePath('/test/:id');
        var url = new Url('test', new Url('abc%25%2F%2f%28%29%3B'));
        var match = rec.matchUrl(url);
        expect(match.allParams).toEqual({'id': 'abc%//();'});
      });

      it('should generate url', () => {
        var rec = new ParamRoutePath('/test/:id');
        expect(rec.generateUrl({'id': 'abc'}).urlPath).toEqual('test/abc');
      });

      it('should encode special characters when generating', () => {
        var rec = new ParamRoutePath('/test/:id');
        expect(rec.generateUrl({'id': 'abc/def/%();'}).urlPath)
            .toEqual('test/abc%2Fdef%2F%25%28%29%3B');
      });
    });

    describe('matrix params', () => {
      it('should be parsed along with dynamic paths', () => {
        var rec = new ParamRoutePath('/hello/:id');
        var url = new Url('hello', new Url('matias', null, null, {'key': 'value'}));
        var match = rec.matchUrl(url);
        expect(match.allParams).toEqual({'id': 'matias', 'key': 'value'});
      });

      it('should be parsed on a static path', () => {
        var rec = new ParamRoutePath('/person');
        var url = new Url('person', null, null, {'name': 'dave'});
        var match = rec.matchUrl(url);
        expect(match.allParams).toEqual({'name': 'dave'});
      });

      it('should be ignored on a wildcard segment', () => {
        var rec = new ParamRoutePath('/wild/*everything');
        var url = parser.parse('/wild/super;variable=value');
        var match = rec.matchUrl(url);
        expect(match.allParams).toEqual({'everything': 'super;variable=value'});
      });

      it('should set matrix param values to true when no value is present', () => {
        var rec = new ParamRoutePath('/path');
        var url = new Url('path', null, null, {'one': true, 'two': true, 'three': '3'});
        var match = rec.matchUrl(url);
        expect(match.allParams).toEqual({'one': true, 'two': true, 'three': '3'});
      });

      it('should be parsed on the final segment of the path', () => {
        var rec = new ParamRoutePath('/one/two/three');

        var three = new Url('three', null, null, {'c': '3'});
        var two = new Url('two', three, null, {'b': '2'});
        var one = new Url('one', two, null, {'a': '1'});

        var match = rec.matchUrl(one);
        expect(match.allParams).toEqual({'c': '3'});
      });
    });

    describe('wildcard segment', () => {
      it('should return a url path which matches the original url path', () => {
        var rec = new ParamRoutePath('/wild/*everything');
        var url = parser.parse('/wild/super;variable=value/anotherPartAfterSlash');
        var match = rec.matchUrl(url);
        expect(match.urlPath).toEqual('wild/super;variable=value/anotherPartAfterSlash');
      });
    });
  });
}
