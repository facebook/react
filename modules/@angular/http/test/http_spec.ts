import {Injector, ReflectiveInjector, provide} from '@angular/core';
import {afterEach, beforeEach, ddescribe, describe, expect, iit, inject, it, xit} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';

import {BaseRequestOptions, ConnectionBackend, HTTP_PROVIDERS, Http, JSONPBackend, JSONP_PROVIDERS, Jsonp, Request, RequestMethod, RequestOptions, Response, ResponseOptions, URLSearchParams, XHRBackend} from '../http';
import {MockBackend, MockConnection} from '../testing/mock_backend';

export function main() {
  describe('injectables', () => {
    var url = 'http://foo.bar';
    var http: Http;
    var parentInjector: ReflectiveInjector;
    var childInjector: ReflectiveInjector;
    var jsonpBackend: MockBackend;
    var xhrBackend: MockBackend;
    var jsonp: Jsonp;

    it('should allow using jsonpInjectables and httpInjectables in same injector',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         parentInjector = ReflectiveInjector.resolveAndCreate([
           {provide: XHRBackend, useClass: MockBackend},
           {provide: JSONPBackend, useClass: MockBackend}
         ]);

         childInjector = parentInjector.resolveAndCreateChild([
           HTTP_PROVIDERS, JSONP_PROVIDERS, {provide: XHRBackend, useClass: MockBackend},
           {provide: JSONPBackend, useClass: MockBackend}
         ]);

         http = childInjector.get(Http);
         jsonp = childInjector.get(Jsonp);
         jsonpBackend = childInjector.get(JSONPBackend);
         xhrBackend = childInjector.get(XHRBackend);

         var xhrCreatedConnections = 0;
         var jsonpCreatedConnections = 0;


         xhrBackend.connections.subscribe(() => {
           xhrCreatedConnections++;
           expect(xhrCreatedConnections).toEqual(1);
           if (jsonpCreatedConnections) {
             async.done();
           }
         });

         http.get(url).subscribe(() => {});

         jsonpBackend.connections.subscribe(() => {
           jsonpCreatedConnections++;
           expect(jsonpCreatedConnections).toEqual(1);
           if (xhrCreatedConnections) {
             async.done();
           }
         });

         jsonp.request(url).subscribe(() => {});
       }));
  });

  describe('http', () => {
    var url = 'http://foo.bar';
    var http: Http;
    var injector: Injector;
    var backend: MockBackend;
    var baseResponse: Response;
    var jsonp: Jsonp;
    beforeEach(() => {
      injector = ReflectiveInjector.resolveAndCreate([
        BaseRequestOptions, MockBackend, {
          provide: Http,
          useFactory: function(backend: ConnectionBackend, defaultOptions: BaseRequestOptions) {
            return new Http(backend, defaultOptions);
          },
          deps: [MockBackend, BaseRequestOptions]
        },
        {
          provide: Jsonp,
          useFactory: function(backend: ConnectionBackend, defaultOptions: BaseRequestOptions) {
            return new Jsonp(backend, defaultOptions);
          },
          deps: [MockBackend, BaseRequestOptions]
        }
      ]);
      http = injector.get(Http);
      jsonp = injector.get(Jsonp);
      backend = injector.get(MockBackend);
      baseResponse = new Response(new ResponseOptions({body: 'base response'}));
    });

    afterEach(() => backend.verifyNoPendingRequests());

    describe('Http', () => {
      describe('.request()', () => {
        it('should return an Observable',
           () => { expect(http.request(url)).toBeAnInstanceOf(Observable); });


        it('should accept a fully-qualified request as its only parameter',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.url).toBe('https://google.com');
               c.mockRespond(new Response(new ResponseOptions({body: 'Thank you'})));
               async.done();
             });
             http.request(new Request(new RequestOptions({url: 'https://google.com'})))
                 .subscribe((res: Response) => {});
           }));

        it('should accept a fully-qualified request as its only parameter',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.url).toBe('https://google.com');
               expect(c.request.method).toBe(RequestMethod.Post);
               c.mockRespond(new Response(new ResponseOptions({body: 'Thank you'})));
               async.done();
             });
             http.request(new Request(new RequestOptions(
                              {url: 'https://google.com', method: RequestMethod.Post})))
                 .subscribe((res: Response) => {});
           }));


        it('should perform a get request for given url if only passed a string',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => c.mockRespond(baseResponse));
             http.request('http://basic.connection').subscribe((res: Response) => {
               expect(res.text()).toBe('base response');
               async.done();
             });
           }));

        it('should perform a post request for given url if options include a method',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.method).toEqual(RequestMethod.Post);
               c.mockRespond(baseResponse);
             });
             let requestOptions = new RequestOptions({method: RequestMethod.Post});
             http.request('http://basic.connection', requestOptions).subscribe((res: Response) => {
               expect(res.text()).toBe('base response');
               async.done();
             });
           }));

        it('should perform a post request for given url if options include a method',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.method).toEqual(RequestMethod.Post);
               c.mockRespond(baseResponse);
             });
             let requestOptions = {method: RequestMethod.Post};
             http.request('http://basic.connection', requestOptions).subscribe((res: Response) => {
               expect(res.text()).toBe('base response');
               async.done();
             });
           }));

        it('should perform a get request and complete the response',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => c.mockRespond(baseResponse));
             http.request('http://basic.connection')
                 .subscribe(
                     (res: Response) => { expect(res.text()).toBe('base response'); }, null,
                     () => { async.done(); });
           }));

        it('should perform multiple get requests and complete the responses',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => c.mockRespond(baseResponse));

             http.request('http://basic.connection').subscribe((res: Response) => {
               expect(res.text()).toBe('base response');
             });
             http.request('http://basic.connection')
                 .subscribe(
                     (res: Response) => { expect(res.text()).toBe('base response'); }, null,
                     () => { async.done(); });
           }));

        it('should throw if url is not a string or Request', () => {
          var req = <Request>{};
          expect(() => http.request(req))
              .toThrowError('First argument must be a url string or Request instance.');
        });
      });


      describe('.get()', () => {
        it('should perform a get request for given url',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.method).toBe(RequestMethod.Get);
               backend.resolveAllConnections();
               async.done();
             });
             http.get(url).subscribe((res: Response) => {});
           }));
      });


      describe('.post()', () => {
        it('should perform a post request for given url',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.method).toBe(RequestMethod.Post);
               backend.resolveAllConnections();
               async.done();
             });
             http.post(url, 'post me').subscribe((res: Response) => {});
           }));


        it('should attach the provided body to the request',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             var body = 'this is my post body';
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.text()).toBe(body);
               backend.resolveAllConnections();
               async.done();
             });
             http.post(url, body).subscribe((res: Response) => {});
           }));
      });


      describe('.put()', () => {
        it('should perform a put request for given url',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.method).toBe(RequestMethod.Put);
               backend.resolveAllConnections();
               async.done();
             });
             http.put(url, 'put me').subscribe((res: Response) => {});
           }));

        it('should attach the provided body to the request',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             var body = 'this is my put body';
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.text()).toBe(body);
               backend.resolveAllConnections();
               async.done();
             });
             http.put(url, body).subscribe((res: Response) => {});
           }));
      });


      describe('.delete()', () => {
        it('should perform a delete request for given url',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.method).toBe(RequestMethod.Delete);
               backend.resolveAllConnections();
               async.done();
             });
             http.delete(url).subscribe((res: Response) => {});
           }));
      });


      describe('.patch()', () => {
        it('should perform a patch request for given url',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.method).toBe(RequestMethod.Patch);
               backend.resolveAllConnections();
               async.done();
             });
             http.patch(url, 'this is my patch body').subscribe((res: Response) => {});
           }));

        it('should attach the provided body to the request',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             var body = 'this is my patch body';
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.text()).toBe(body);
               backend.resolveAllConnections();
               async.done();
             });
             http.patch(url, body).subscribe((res: Response) => {});
           }));
      });


      describe('.head()', () => {
        it('should perform a head request for given url',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.method).toBe(RequestMethod.Head);
               backend.resolveAllConnections();
               async.done();
             });
             http.head(url).subscribe((res: Response) => {});
           }));
      });


      describe('searchParams', () => {
        it('should append search params to url',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             var params = new URLSearchParams();
             params.append('q', 'puppies');
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.url).toEqual('https://www.google.com?q=puppies');
               backend.resolveAllConnections();
               async.done();
             });
             http.get('https://www.google.com', new RequestOptions({search: params}))
                 .subscribe((res: Response) => {});
           }));


        it('should append string search params to url',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.url).toEqual('https://www.google.com?q=piggies');
               backend.resolveAllConnections();
               async.done();
             });
             http.get('https://www.google.com', new RequestOptions({search: 'q=piggies'}))
                 .subscribe((res: Response) => {});
           }));


        it('should produce valid url when url already contains a query',
           inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
             backend.connections.subscribe((c: MockConnection) => {
               expect(c.request.url).toEqual('https://www.google.com?q=angular&as_eq=1.x');
               backend.resolveAllConnections();
               async.done();
             });
             http.get('https://www.google.com?q=angular', new RequestOptions({search: 'as_eq=1.x'}))
                 .subscribe((res: Response) => {});
           }));
      });

      describe('string method names', () => {
        it('should allow case insensitive strings for method names', () => {
          inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
            backend.connections.subscribe((c: MockConnection) => {
              expect(c.request.method).toBe(RequestMethod.Post)
              c.mockRespond(new Response(new ResponseOptions({body: 'Thank you'})));
              async.done();
            });
            http.request(
                    new Request(new RequestOptions({url: 'https://google.com', method: 'PosT'})))
                .subscribe((res: Response) => {});
          });
        });

        it('should throw when invalid string parameter is passed for method name', () => {
          expect(() => {
            http.request(
                new Request(new RequestOptions({url: 'https://google.com', method: 'Invalid'})));
          }).toThrowError('Invalid request method. The method "Invalid" is not supported.');
        });
      });
    });

    describe('Jsonp', () => {
      describe('.request()', () => {
        it('should throw if url is not a string or Request', () => {
          var req = <Request>{};
          expect(() => jsonp.request(req))
              .toThrowError('First argument must be a url string or Request instance.');
        });
      });
    });
  });
}
