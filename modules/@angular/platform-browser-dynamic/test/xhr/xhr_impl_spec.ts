import {AsyncTestCompleter, beforeEach, ddescribe, describe, expect, iit, inject, it, xit} from '@angular/core/testing/testing_internal';

import {PromiseWrapper} from '../../src/facade/async';
import {XHRImpl} from '../../src/xhr/xhr_impl';

export function main() {
  describe('XHRImpl', () => {
    var xhr: XHRImpl;

    // TODO(juliemr): This file currently won't work with dart unit tests run using
    // exclusive it or describe (iit or ddescribe). This is because when
    // pub run test is executed against this specific file the relative paths
    // will be relative to here, so url200 should look like
    // static_assets/200.html.
    // We currently have no way of detecting this.
    var url200 = '/base/modules/@angular/platform-browser/test/browser/static_assets/200.html';
    var url404 = '/bad/path/404.html';

    beforeEach(() => { xhr = new XHRImpl(); });

    it('should resolve the Promise with the file content on success',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         xhr.get(url200).then((text) => {
           expect(text.trim()).toEqual('<p>hey</p>');
           async.done();
         });
       }), 10000);

    it('should reject the Promise on failure',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         PromiseWrapper.catchError(xhr.get(url404), (e) => {
           expect(e).toEqual(`Failed to load ${url404}`);
           async.done();
           return null;
         });
       }), 10000);
  });
}
