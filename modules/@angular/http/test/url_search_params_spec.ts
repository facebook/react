import {beforeEach, ddescribe, describe, expect, iit, inject, it, xit} from '@angular/core/testing/testing_internal';
import {URLSearchParams} from '../src/url_search_params';

export function main() {
  describe('URLSearchParams', () => {
    it('should conform to spec', () => {
      var paramsString = 'q=URLUtils.searchParams&topic=api';
      var searchParams = new URLSearchParams(paramsString);

      // Tests borrowed from example at
      // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
      // Compliant with spec described at https://url.spec.whatwg.org/#urlsearchparams
      expect(searchParams.has('topic')).toBe(true);
      expect(searchParams.has('foo')).toBe(false);
      expect(searchParams.get('topic')).toEqual('api');
      expect(searchParams.getAll('topic')).toEqual(['api']);
      expect(searchParams.get('foo')).toBe(null);
      searchParams.append('topic', 'webdev');
      expect(searchParams.getAll('topic')).toEqual(['api', 'webdev']);
      expect(searchParams.toString()).toEqual('q=URLUtils.searchParams&topic=api&topic=webdev');
      searchParams.delete('topic');
      expect(searchParams.toString()).toEqual('q=URLUtils.searchParams');

      // Test default constructor
      expect(new URLSearchParams().toString()).toBe('');
    });


    it('should support map-like merging operation via setAll()', () => {
      var mapA = new URLSearchParams('a=1&a=2&a=3&c=8');
      var mapB = new URLSearchParams('a=4&a=5&a=6&b=7');
      mapA.setAll(mapB);
      expect(mapA.has('a')).toBe(true);
      expect(mapA.has('b')).toBe(true);
      expect(mapA.has('c')).toBe(true);
      expect(mapA.getAll('a')).toEqual(['4']);
      expect(mapA.getAll('b')).toEqual(['7']);
      expect(mapA.getAll('c')).toEqual(['8']);
      expect(mapA.toString()).toEqual('a=4&c=8&b=7');
    });


    it('should support multimap-like merging operation via appendAll()', () => {
      var mapA = new URLSearchParams('a=1&a=2&a=3&c=8');
      var mapB = new URLSearchParams('a=4&a=5&a=6&b=7');
      mapA.appendAll(mapB);
      expect(mapA.has('a')).toBe(true);
      expect(mapA.has('b')).toBe(true);
      expect(mapA.has('c')).toBe(true);
      expect(mapA.getAll('a')).toEqual(['1', '2', '3', '4', '5', '6']);
      expect(mapA.getAll('b')).toEqual(['7']);
      expect(mapA.getAll('c')).toEqual(['8']);
      expect(mapA.toString()).toEqual('a=1&a=2&a=3&a=4&a=5&a=6&c=8&b=7');
    });


    it('should support multimap-like merging operation via replaceAll()', () => {
      var mapA = new URLSearchParams('a=1&a=2&a=3&c=8');
      var mapB = new URLSearchParams('a=4&a=5&a=6&b=7');
      mapA.replaceAll(mapB);
      expect(mapA.has('a')).toBe(true);
      expect(mapA.has('b')).toBe(true);
      expect(mapA.has('c')).toBe(true);
      expect(mapA.getAll('a')).toEqual(['4', '5', '6']);
      expect(mapA.getAll('b')).toEqual(['7']);
      expect(mapA.getAll('c')).toEqual(['8']);
      expect(mapA.toString()).toEqual('a=4&a=5&a=6&c=8&b=7');
    });
  });
}
