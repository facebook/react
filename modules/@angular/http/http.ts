/**
 * @module
 * @description
 * The http module provides services to perform http requests. To get started, see the {@link Http}
 * class.
 */
import {provide} from '@angular/core';

import {BrowserJsonp} from './src/backends/browser_jsonp';
import {BrowserXhr} from './src/backends/browser_xhr';
import {JSONPBackend, JSONPBackend_, JSONPConnection} from './src/backends/jsonp_backend';
import {CookieXSRFStrategy, XHRBackend, XHRConnection} from './src/backends/xhr_backend';
import {BaseRequestOptions, RequestOptions} from './src/base_request_options';
import {BaseResponseOptions, ResponseOptions} from './src/base_response_options';
import {Http, Jsonp} from './src/http';
import {ConnectionBackend, XSRFStrategy} from './src/interfaces';

export {BrowserXhr} from './src/backends/browser_xhr';
export {JSONPBackend, JSONPConnection} from './src/backends/jsonp_backend';
export {CookieXSRFStrategy, XHRBackend, XHRConnection} from './src/backends/xhr_backend';
export {BaseRequestOptions, RequestOptions} from './src/base_request_options';
export {BaseResponseOptions, ResponseOptions} from './src/base_response_options';
export {ReadyState, RequestMethod, ResponseType} from './src/enums';
export {Headers} from './src/headers';
export {Http, Jsonp} from './src/http';
export {Connection, ConnectionBackend, RequestOptionsArgs, ResponseOptionsArgs, XSRFStrategy} from './src/interfaces';
export {Request} from './src/static_request';
export {Response} from './src/static_response';
export {URLSearchParams} from './src/url_search_params';


/**
 * Provides a basic set of injectables to use the {@link Http} service in any application.
 *
 * The `HTTP_PROVIDERS` should be included either in a component's injector,
 * or in the root injector when bootstrapping an application.
 *
 * ### Example ([live demo](http://plnkr.co/edit/snj7Nv?p=preview))
 *
 * ```
 * import {Component} from '@angular/core';
 * import {bootstrap} from '@angular/platform-browser/browser';
 * import {NgFor} from '@angular/common';
 * import {HTTP_PROVIDERS, Http} from '@angular/http';
 *
 * @Component({
 *   selector: 'app',
 *   providers: [HTTP_PROVIDERS],
 *   template: `
 *     <div>
 *       <h1>People</h1>
 *       <ul>
 *         <li *ngFor="let person of people">
 *           {{person.name}}
 *         </li>
 *       </ul>
 *     </div>
 *   `,
 *   directives: [NgFor]
 * })
 * export class App {
 *   people: Object[];
 *   constructor(http:Http) {
 *     http.get('people.json').subscribe(res => {
 *       this.people = res.json();
 *     });
 *   }
 *   active:boolean = false;
 *   toggleActiveState() {
 *     this.active = !this.active;
 *   }
 * }
 *
 * bootstrap(App)
 *   .catch(err => console.error(err));
 * ```
 *
 * The primary public API included in `HTTP_PROVIDERS` is the {@link Http} class.
 * However, other providers required by `Http` are included,
 * which may be beneficial to override in certain cases.
 *
 * The providers included in `HTTP_PROVIDERS` include:
 *  * {@link Http}
 *  * {@link XHRBackend}
 *  * {@link XSRFStrategy} - Bound to {@link CookieXSRFStrategy} class (see below)
 *  * `BrowserXHR` - Private factory to create `XMLHttpRequest` instances
 *  * {@link RequestOptions} - Bound to {@link BaseRequestOptions} class
 *  * {@link ResponseOptions} - Bound to {@link BaseResponseOptions} class
 *
 * There may be cases where it makes sense to extend the base request options,
 * such as to add a search string to be appended to all URLs.
 * To accomplish this, a new provider for {@link RequestOptions} should
 * be added in the same injector as `HTTP_PROVIDERS`.
 *
 * ### Example ([live demo](http://plnkr.co/edit/aCMEXi?p=preview))
 *
 * ```
 * import {provide} from '@angular/core';
 * import {bootstrap} from '@angular/platform-browser/browser';
 * import {HTTP_PROVIDERS, BaseRequestOptions, RequestOptions} from '@angular/http';
 *
 * class MyOptions extends BaseRequestOptions {
 *   search: string = 'coreTeam=true';
 * }
 *
 * bootstrap(App, [HTTP_PROVIDERS, {provide: RequestOptions, useClass: MyOptions}])
 *   .catch(err => console.error(err));
 * ```
 *
 * Likewise, to use a mock backend for unit tests, the {@link XHRBackend}
 * provider should be bound to {@link MockBackend}.
 *
 * ### Example ([live demo](http://plnkr.co/edit/7LWALD?p=preview))
 *
 * ```
 * import {provide} from '@angular/core';
 * import {bootstrap} from '@angular/platform-browser/browser';
 * import {HTTP_PROVIDERS, Http, Response, XHRBackend} from '@angular/http';
 * import {MockBackend} from '@angular/http/testing';
 *
 * var people = [{name: 'Jeff'}, {name: 'Tobias'}];
 *
 * var injector = Injector.resolveAndCreate([
 *   HTTP_PROVIDERS,
 *   MockBackend,
 *   {provide: XHRBackend, useExisting: MockBackend}
 * ]);
 * var http = injector.get(Http);
 * var backend = injector.get(MockBackend);
 *
 * // Listen for any new requests
 * backend.connections.observer({
 *   next: connection => {
 *     var response = new Response({body: people});
 *     setTimeout(() => {
 *       // Send a response to the request
 *       connection.mockRespond(response);
 *     });
 *   }
 * });
 *
 * http.get('people.json').observer({
 *   next: res => {
 *     // Response came from mock backend
 *     console.log('first person', res.json()[0].name);
 *   }
 * });
 * ```
 *
 * `XSRFStrategy` allows customizing how the application protects itself against Cross Site Request
 * Forgery (XSRF) attacks. By default, Angular will look for a cookie called `'XSRF-TOKEN'`, and set
 * an HTTP request header called `'X-XSRF-TOKEN'` with the value of the cookie on each request,
 * allowing the server side to validate that the request comes from its own front end.
 *
 * Applications can override the names used by configuring a different `XSRFStrategy` instance. Most
 * commonly, applications will configure a `CookieXSRFStrategy` with different cookie or header
 * names, but if needed, they can supply a completely custom implementation.
 *
 * See the security documentation for more information.
 *
 * ### Example
 *
 * ```
 * import {provide} from '@angular/core';
 * import {bootstrap} from '@angular/platform-browser/browser';
 * import {HTTP_PROVIDERS, XSRFStrategy, CookieXSRFStrategy} from '@angular/http';
 *
 * bootstrap(
 *     App,
 *     [HTTP_PROVIDERS, {provide: XSRFStrategy,
 *         useValue: new CookieXSRFStrategy('MY-XSRF-COOKIE-NAME', 'X-MY-XSRF-HEADER-NAME')}])
 *   .catch(err => console.error(err));
 * ```
 */
export const HTTP_PROVIDERS: any[] = [
  // TODO(pascal): use factory type annotations once supported in DI
  // issue: https://github.com/angular/angular/issues/3183
  {provide: Http, useFactory: httpFactory, deps: [XHRBackend, RequestOptions]},
  BrowserXhr,
  {provide: RequestOptions, useClass: BaseRequestOptions},
  {provide: ResponseOptions, useClass: BaseResponseOptions},
  XHRBackend,
  {provide: XSRFStrategy, useValue: new CookieXSRFStrategy()},
];

export function httpFactory(xhrBackend: XHRBackend, requestOptions: RequestOptions): Http {
  return new Http(xhrBackend, requestOptions);
}

/**
 * See {@link HTTP_PROVIDERS} instead.
 *
 * @deprecated
 */
export const HTTP_BINDINGS = HTTP_PROVIDERS;

/**
 * Provides a basic set of providers to use the {@link Jsonp} service in any application.
 *
 * The `JSONP_PROVIDERS` should be included either in a component's injector,
 * or in the root injector when bootstrapping an application.
 *
 * ### Example ([live demo](http://plnkr.co/edit/vmeN4F?p=preview))
 *
 * ```
 * import {Component} from '@angular/core';
 * import {NgFor} from '@angular/common';
 * import {JSONP_PROVIDERS, Jsonp} from '@angular/http';
 *
 * @Component({
 *   selector: 'app',
 *   providers: [JSONP_PROVIDERS],
 *   template: `
 *     <div>
 *       <h1>People</h1>
 *       <ul>
 *         <li *ngFor="let person of people">
 *           {{person.name}}
 *         </li>
 *       </ul>
 *     </div>
 *   `,
 *   directives: [NgFor]
 * })
 * export class App {
 *   people: Array<Object>;
 *   constructor(jsonp:Jsonp) {
 *     jsonp.request('people.json').subscribe(res => {
 *       this.people = res.json();
 *     })
 *   }
 * }
 * ```
 *
 * The primary public API included in `JSONP_PROVIDERS` is the {@link Jsonp} class.
 * However, other providers required by `Jsonp` are included,
 * which may be beneficial to override in certain cases.
 *
 * The providers included in `JSONP_PROVIDERS` include:
 *  * {@link Jsonp}
 *  * {@link JSONPBackend}
 *  * `BrowserJsonp` - Private factory
 *  * {@link RequestOptions} - Bound to {@link BaseRequestOptions} class
 *  * {@link ResponseOptions} - Bound to {@link BaseResponseOptions} class
 *
 * There may be cases where it makes sense to extend the base request options,
 * such as to add a search string to be appended to all URLs.
 * To accomplish this, a new provider for {@link RequestOptions} should
 * be added in the same injector as `JSONP_PROVIDERS`.
 *
 * ### Example ([live demo](http://plnkr.co/edit/TFug7x?p=preview))
 *
 * ```
 * import {provide} from '@angular/core';
 * import {bootstrap} from '@angular/platform-browser/browser';
 * import {JSONP_PROVIDERS, BaseRequestOptions, RequestOptions} from '@angular/http';
 *
 * class MyOptions extends BaseRequestOptions {
 *   search: string = 'coreTeam=true';
 * }
 *
 * bootstrap(App, [JSONP_PROVIDERS, {provide: RequestOptions, useClass: MyOptions}])
 *   .catch(err => console.error(err));
 * ```
 *
 * Likewise, to use a mock backend for unit tests, the {@link JSONPBackend}
 * provider should be bound to {@link MockBackend}.
 *
 * ### Example ([live demo](http://plnkr.co/edit/HDqZWL?p=preview))
 *
 * ```
 * import {provide, Injector} from '@angular/core';
 * import {JSONP_PROVIDERS, Jsonp, Response, JSONPBackend} from '@angular/http';
 * import {MockBackend} from '@angular/http/testing';
 *
 * var people = [{name: 'Jeff'}, {name: 'Tobias'}];
 * var injector = Injector.resolveAndCreate([
 *   JSONP_PROVIDERS,
 *   MockBackend,
 *   {provide: JSONPBackend, useExisting: MockBackend}
 * ]);
 * var jsonp = injector.get(Jsonp);
 * var backend = injector.get(MockBackend);
 *
 * // Listen for any new requests
 * backend.connections.observer({
 *   next: connection => {
 *     var response = new Response({body: people});
 *     setTimeout(() => {
 *       // Send a response to the request
 *       connection.mockRespond(response);
 *     });
 *   }
 * });

 * jsonp.get('people.json').observer({
 *   next: res => {
 *     // Response came from mock backend
 *     console.log('first person', res.json()[0].name);
 *   }
 * });
 * ```
 */
export const JSONP_PROVIDERS: any[] = [
  // TODO(pascal): use factory type annotations once supported in DI
  // issue: https://github.com/angular/angular/issues/3183
  {provide: Jsonp, useFactory: jsonpFactory, deps: [JSONPBackend, RequestOptions]},
  BrowserJsonp,
  {provide: RequestOptions, useClass: BaseRequestOptions},
  {provide: ResponseOptions, useClass: BaseResponseOptions},
  {provide: JSONPBackend, useClass: JSONPBackend_},
];

function jsonpFactory(jsonpBackend: JSONPBackend, requestOptions: RequestOptions) {
  return new Jsonp(jsonpBackend, requestOptions);
}


/**
 * See {@link JSONP_PROVIDERS} instead.
 *
 * @deprecated
 */
export const JSON_BINDINGS = JSONP_PROVIDERS;
