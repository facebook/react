import {afterEach, beforeEach, ddescribe, describe, expect, iit, inject, it, xit,} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter, SpyObject} from '@angular/core/testing/testing_internal';
import {ObservableWrapper} from '../../src/facade/async';
import {BrowserJsonp} from '../../src/backends/browser_jsonp';
import {JSONPConnection, JSONPConnection_, JSONPBackend, JSONPBackend_} from '../../src/backends/jsonp_backend';
import {provide, Injector, ReflectiveInjector} from '@angular/core';
import {isPresent, StringWrapper} from '../../src/facade/lang';
import {TimerWrapper} from '../../src/facade/async';
import {Request} from '../../src/static_request';
import {Response} from '../../src/static_response';
import {Map} from '../../src/facade/collection';
import {RequestOptions, BaseRequestOptions} from '../../src/base_request_options';
import {BaseResponseOptions, ResponseOptions} from '../../src/base_response_options';
import {ResponseType, ReadyState, RequestMethod} from '../../src/enums';

var addEventListenerSpy: any;
var existingScripts: MockBrowserJsonp[] = [];
var unused: Response;

class MockBrowserJsonp extends BrowserJsonp {
  src: string;
  callbacks = new Map<string, (data: any) => any>();
  constructor() { super(); }

  addEventListener(type: string, cb: (data: any) => any) { this.callbacks.set(type, cb); }

  removeEventListener(type: string, cb: Function) { this.callbacks.delete(type); }

  dispatchEvent(type: string, argument?: any) {
    if (!isPresent(argument)) {
      argument = {};
    }
    let cb = this.callbacks.get(type);
    if (isPresent(cb)) {
      cb(argument);
    }
  }

  build(url: string) {
    var script = new MockBrowserJsonp();
    script.src = url;
    existingScripts.push(script);
    return script;
  }

  send(node: any) { /* noop */
  }
  cleanup(node: any) { /* noop */
  }
}

export function main() {
  describe('JSONPBackend', () => {
    let backend: JSONPBackend_;
    let sampleRequest: Request;

    beforeEach(() => {
      let injector = ReflectiveInjector.resolveAndCreate([
        {provide: ResponseOptions, useClass: BaseResponseOptions},
        {provide: BrowserJsonp, useClass: MockBrowserJsonp},
        {provide: JSONPBackend, useClass: JSONPBackend_}
      ]);
      backend = injector.get(JSONPBackend);
      let base = new BaseRequestOptions();
      sampleRequest = new Request(base.merge(new RequestOptions({url: 'https://google.com'})));
    });

    afterEach(() => { existingScripts = []; });

    it('should create a connection', () => {
      var instance: JSONPConnection;
      expect(() => instance = backend.createConnection(sampleRequest)).not.toThrow();
      expect(instance).toBeAnInstanceOf(JSONPConnection);
    });


    describe('JSONPConnection', () => {
      it('should use the injected BaseResponseOptions to create the response',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           let connection = new JSONPConnection_(
               sampleRequest, new MockBrowserJsonp(),
               new ResponseOptions({type: ResponseType.Error}));
           connection.response.subscribe(res => {
             expect(res.type).toBe(ResponseType.Error);
             async.done();
           });
           connection.finished();
           existingScripts[0].dispatchEvent('load');
         }));

      it('should ignore load/callback when disposed',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var connection = new JSONPConnection_(sampleRequest, new MockBrowserJsonp());
           let spy = new SpyObject();
           let loadSpy = spy.spy('load');
           let errorSpy = spy.spy('error');
           let returnSpy = spy.spy('cancelled');

           let request = connection.response.subscribe(loadSpy, errorSpy, returnSpy);
           request.unsubscribe();

           connection.finished('Fake data');
           existingScripts[0].dispatchEvent('load');

           TimerWrapper.setTimeout(() => {
             expect(connection.readyState).toBe(ReadyState.Cancelled);
             expect(loadSpy).not.toHaveBeenCalled();
             expect(errorSpy).not.toHaveBeenCalled();
             expect(returnSpy).not.toHaveBeenCalled();
             async.done();
           }, 10);
         }));

      it('should report error if loaded without invoking callback',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           let connection = new JSONPConnection_(sampleRequest, new MockBrowserJsonp());
           connection.response.subscribe(
               res => {
                 expect('response listener called').toBe(false);
                 async.done();
               },
               err => {
                 expect(err.text()).toEqual('JSONP injected script did not invoke callback.');
                 async.done();
               });

           existingScripts[0].dispatchEvent('load');
         }));

      it('should report error if script contains error',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           let connection = new JSONPConnection_(sampleRequest, new MockBrowserJsonp());

           connection.response.subscribe(
               res => {
                 expect('response listener called').toBe(false);
                 async.done();
               },
               err => {
                 expect(err.text()).toBe('Oops!');
                 async.done();
               });

           existingScripts[0].dispatchEvent('error', ({message: 'Oops!'}));
         }));

      it('should throw if request method is not GET', () => {
        [RequestMethod.Post, RequestMethod.Put, RequestMethod.Delete, RequestMethod.Options,
         RequestMethod.Head, RequestMethod.Patch]
            .forEach(method => {
              let base = new BaseRequestOptions();
              let req = new Request(
                  base.merge(new RequestOptions({url: 'https://google.com', method: method})));
              expect(() => new JSONPConnection_(req, new MockBrowserJsonp()).response.subscribe())
                  .toThrowError();
            });
      });

      it('should respond with data passed to callback',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           let connection = new JSONPConnection_(sampleRequest, new MockBrowserJsonp());

           connection.response.subscribe(res => {
             expect(res.json()).toEqual(({fake_payload: true, blob_id: 12345}));
             async.done();
           });

           connection.finished(({fake_payload: true, blob_id: 12345}));
           existingScripts[0].dispatchEvent('load');
         }));
    });
  });
}
