import {beforeEach, ddescribe, describe, expect, iit, inject, it, xit} from '@angular/core/testing/testing_internal';
import {BaseRequestOptions, RequestOptions} from '../src/base_request_options';
import {RequestMethod} from '../src/enums';

export function main() {
  describe('BaseRequestOptions', () => {
    it('should create a new object when calling merge', () => {
      var options1 = new BaseRequestOptions();
      var options2 = options1.merge(new RequestOptions({method: RequestMethod.Delete}));
      expect(options2).not.toBe(options1);
      expect(options2.method).toBe(RequestMethod.Delete);
    });

    it('should retain previously merged values when merging again', () => {
      var options1 = new BaseRequestOptions();
      var options2 = options1.merge(new RequestOptions({method: RequestMethod.Delete}));
      expect(options2.method).toBe(RequestMethod.Delete);
    });
  });
}
