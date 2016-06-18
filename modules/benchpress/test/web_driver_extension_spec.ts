import {
  afterEach,
  AsyncTestCompleter,
  beforeEach,
  ddescribe,
  describe,
  expect,
  iit,
  inject,
  it,
  xit,
} from '@angular/testing/testing_internal';

import {isPresent, StringWrapper} from '@angular/facade';
import {PromiseWrapper} from '@angular/facade';

import {WebDriverExtension, ReflectiveInjector, Options} from 'benchpress/common';

export function main() {
  function createExtension(ids: any[], caps) {
    return PromiseWrapper.wrap(() => {
      return ReflectiveInjector.resolveAndCreate([
                                 ids.map((id) => { return {provide: id, useValue: new MockExtension(id)}}),
                                 {provide: Options.CAPABILITIES, useValue: caps},
                                 WebDriverExtension.bindTo(ids)
                               ])
          .get(WebDriverExtension);
    });
  }

  describe('WebDriverExtension.bindTo', () => {

    it('should bind the extension that matches the capabilities',
       inject([AsyncTestCompleter], (async) => {
         createExtension(['m1', 'm2', 'm3'], {'browser': 'm2'})
             .then((m) => {
               expect(m.id).toEqual('m2');
               async.done();
             });
       }));

    it('should throw if there is no match', inject([AsyncTestCompleter], (async) => {
         PromiseWrapper.catchError(createExtension(['m1'], {'browser': 'm2'}), (err) => {
           expect(isPresent(err)).toBe(true);
           async.done();
         });
       }));
  });
}

class MockExtension extends WebDriverExtension {
  id: string;

  constructor(id) {
    super();
    this.id = id;
  }

  supports(capabilities: {[key: string]: any}): boolean {
    return StringWrapper.equals(capabilities['browser'], this.id);
  }
}
