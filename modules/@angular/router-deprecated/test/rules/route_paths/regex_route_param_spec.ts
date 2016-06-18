import {describe, it, iit, ddescribe, expect, inject, beforeEach,} from '@angular/core/testing/testing_internal';

import {GeneratedUrl} from '../../../src/rules/route_paths/route_path';
import {RegexRoutePath} from '../../../src/rules/route_paths/regex_route_path';
import {parser, Url} from '../../../src/url_parser';

function emptySerializer(params: any /** TODO #9100 */) {
  return new GeneratedUrl('', {});
}

export function main() {
  describe('RegexRoutePath', () => {

    it('should throw when given an invalid regex',
       () => { expect(() => new RegexRoutePath('[abc', emptySerializer)).toThrowError(); });

    it('should parse a single param using capture groups', () => {
      var rec = new RegexRoutePath('^(.+)$', emptySerializer);
      var url = parser.parse('hello');
      var match = rec.matchUrl(url);
      expect(match.allParams).toEqual({'0': 'hello', '1': 'hello'});
    });

    it('should parse multiple params using capture groups', () => {
      var rec = new RegexRoutePath('^(.+)\\.(.+)$', emptySerializer);
      var url = parser.parse('hello.goodbye');
      var match = rec.matchUrl(url);
      expect(match.allParams).toEqual({'0': 'hello.goodbye', '1': 'hello', '2': 'goodbye'});
    });

    it('should generate a url by calling the provided serializer', () => {
      function serializer(params: any /** TODO #9100 */) {
        return new GeneratedUrl(`/a/${params['a']}/b/${params['b']}`, {});
      }
      var rec = new RegexRoutePath('/a/(.+)/b/(.+)$', serializer);
      var params = {a: 'one', b: 'two'};
      var url = rec.generateUrl(params);
      expect(url.urlPath).toEqual('/a/one/b/two');
    });

    it('should raise an error when the number of parameters doesnt match', () => {
      expect(
          () => {new RegexRoutePath(
              '^a-([0-9]+)-b-([0-9]+)$', emptySerializer, ['complete_match', 'a'])})
          .toThrowError(`Regex group names [complete_match,a] must contain names for each matching \
group and a name for the complete match as its first element of regex '^a-([0-9]+)-b-([0-9]+)$'. \
3 group names are expected.`);
    });

    it('should take group naming into account when passing params', () => {
      var rec = new RegexRoutePath(
          '^a-([0-9]+)-b-([0-9]+)$', emptySerializer, ['complete_match', 'a', 'b']);
      var url = parser.parse('a-123-b-345');
      var match = rec.matchUrl(url);
      expect(match.allParams).toEqual({'complete_match': 'a-123-b-345', 'a': '123', 'b': '345'});
    });
  });
}
