import {beforeEach, ddescribe, describe, expect, iit, inject, it,} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {MockXHR} from '@angular/compiler/testing';
import {PromiseWrapper} from '../src/facade/async';
import {isPresent} from '../src/facade/lang';

export function main() {
  describe('MockXHR', () => {
    var xhr: MockXHR;

    beforeEach(() => { xhr = new MockXHR(); });

    function expectResponse(
        request: Promise<string>, url: string, response: string,
        done: any /** TODO #9100 */ = null) {
      function onResponse(text: string): string {
        if (response === null) {
          throw `Unexpected response ${url} -> ${text}`;
        } else {
          expect(text).toEqual(response);
          if (isPresent(done)) done();
        }
        return text;
      }

      function onError(error: string): string {
        if (response !== null) {
          throw `Unexpected error ${url}`;
        } else {
          expect(error).toEqual(`Failed to load ${url}`);
          if (isPresent(done)) done();
        }
        return error;
      }

      PromiseWrapper.then(request, onResponse, onError);
    }

    it('should return a response from the definitions',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         var url = '/foo';
         var response = 'bar';
         xhr.when(url, response);
         expectResponse(xhr.get(url), url, response, () => async.done());
         xhr.flush();
       }));

    it('should return an error from the definitions',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         var url = '/foo';
         var response: any /** TODO #9100 */ = null;
         xhr.when(url, response);
         expectResponse(xhr.get(url), url, response, () => async.done());
         xhr.flush();
       }));

    it('should return a response from the expectations',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         var url = '/foo';
         var response = 'bar';
         xhr.expect(url, response);
         expectResponse(xhr.get(url), url, response, () => async.done());
         xhr.flush();
       }));

    it('should return an error from the expectations',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         var url = '/foo';
         var response: any /** TODO #9100 */ = null;
         xhr.expect(url, response);
         expectResponse(xhr.get(url), url, response, () => async.done());
         xhr.flush();
       }));

    it('should not reuse expectations', () => {
      var url = '/foo';
      var response = 'bar';
      xhr.expect(url, response);
      xhr.get(url);
      xhr.get(url);
      expect(() => { xhr.flush(); }).toThrowError('Unexpected request /foo');
    });

    it('should return expectations before definitions',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         var url = '/foo';
         xhr.when(url, 'when');
         xhr.expect(url, 'expect');
         expectResponse(xhr.get(url), url, 'expect');
         expectResponse(xhr.get(url), url, 'when', () => async.done());
         xhr.flush();
       }));

    it('should throw when there is no definitions or expectations', () => {
      xhr.get('/foo');
      expect(() => { xhr.flush(); }).toThrowError('Unexpected request /foo');
    });

    it('should throw when flush is called without any pending requests',
       () => { expect(() => { xhr.flush(); }).toThrowError('No pending requests to flush'); });

    it('should throw on unsatisfied expectations', () => {
      xhr.expect('/foo', 'bar');
      xhr.when('/bar', 'foo');
      xhr.get('/bar');
      expect(() => { xhr.flush(); }).toThrowError('Unsatisfied requests: /foo');
    });
  });
}
