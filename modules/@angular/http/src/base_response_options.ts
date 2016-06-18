import {Injectable} from '@angular/core';

import {isJsObject, isPresent} from '../src/facade/lang';

import {ResponseType} from './enums';
import {Headers} from './headers';
import {ResponseOptionsArgs} from './interfaces';


/**
 * Creates a response options object to be optionally provided when instantiating a
 * {@link Response}.
 *
 * This class is based on the `ResponseInit` description in the [Fetch
 * Spec](https://fetch.spec.whatwg.org/#responseinit).
 *
 * All values are null by default. Typical defaults can be found in the
 * {@link BaseResponseOptions} class, which sub-classes `ResponseOptions`.
 *
 * This class may be used in tests to build {@link Response Responses} for
 * mock responses (see {@link MockBackend}).
 *
 * ### Example ([live demo](http://plnkr.co/edit/P9Jkk8e8cz6NVzbcxEsD?p=preview))
 *
 * ```typescript
 * import {ResponseOptions, Response} from '@angular/http';
 *
 * var options = new ResponseOptions({
 *   body: '{"name":"Jeff"}'
 * });
 * var res = new Response(options);
 *
 * console.log('res.json():', res.json()); // Object {name: "Jeff"}
 * ```
 */
export class ResponseOptions {
  // TODO: ArrayBuffer | FormData | Blob
  /**
   * String or Object representing the body of the {@link Response}.
   */
  body: string|Object;
  /**
   * Http {@link http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html status code}
   * associated with the response.
   */
  status: number;
  /**
   * Response {@link Headers headers}
   */
  headers: Headers;
  /**
   * @internal
   */
  statusText: string;
  /**
   * @internal
   */
  type: ResponseType;
  url: string;
  constructor({body, status, headers, statusText, type, url}: ResponseOptionsArgs = {}) {
    this.body = isPresent(body) ? body : null;
    this.status = isPresent(status) ? status : null;
    this.headers = isPresent(headers) ? headers : null;
    this.statusText = isPresent(statusText) ? statusText : null;
    this.type = isPresent(type) ? type : null;
    this.url = isPresent(url) ? url : null;
  }

  /**
   * Creates a copy of the `ResponseOptions` instance, using the optional input as values to
   * override
   * existing values. This method will not change the values of the instance on which it is being
   * called.
   *
   * This may be useful when sharing a base `ResponseOptions` object inside tests,
   * where certain properties may change from test to test.
   *
   * ### Example ([live demo](http://plnkr.co/edit/1lXquqFfgduTFBWjNoRE?p=preview))
   *
   * ```typescript
   * import {ResponseOptions, Response} from '@angular/http';
   *
   * var options = new ResponseOptions({
   *   body: {name: 'Jeff'}
   * });
   * var res = new Response(options.merge({
   *   url: 'https://google.com'
   * }));
   * console.log('options.url:', options.url); // null
   * console.log('res.json():', res.json()); // Object {name: "Jeff"}
   * console.log('res.url:', res.url); // https://google.com
   * ```
   */
  merge(options?: ResponseOptionsArgs): ResponseOptions {
    return new ResponseOptions({
      body: isPresent(options) && isPresent(options.body) ? options.body : this.body,
      status: isPresent(options) && isPresent(options.status) ? options.status : this.status,
      headers: isPresent(options) && isPresent(options.headers) ? options.headers : this.headers,
      statusText: isPresent(options) && isPresent(options.statusText) ? options.statusText :
                                                                        this.statusText,
      type: isPresent(options) && isPresent(options.type) ? options.type : this.type,
      url: isPresent(options) && isPresent(options.url) ? options.url : this.url,
    });
  }
}

/**
 * Subclass of {@link ResponseOptions}, with default values.
 *
 * Default values:
 *  * status: 200
 *  * headers: empty {@link Headers} object
 *
 * This class could be extended and bound to the {@link ResponseOptions} class
 * when configuring an {@link Injector}, in order to override the default options
 * used by {@link Http} to create {@link Response Responses}.
 *
 * ### Example ([live demo](http://plnkr.co/edit/qv8DLT?p=preview))
 *
 * ```typescript
 * import {provide} from '@angular/core';
 * import {bootstrap} from '@angular/platform-browser/browser';
 * import {HTTP_PROVIDERS, Headers, Http, BaseResponseOptions, ResponseOptions} from
 * '@angular/http';
 * import {App} from './myapp';
 *
 * class MyOptions extends BaseResponseOptions {
 *   headers:Headers = new Headers({network: 'github'});
 * }
 *
 * bootstrap(App, [HTTP_PROVIDERS, {provide: ResponseOptions, useClass: MyOptions}]);
 * ```
 *
 * The options could also be extended when manually creating a {@link Response}
 * object.
 *
 * ### Example ([live demo](http://plnkr.co/edit/VngosOWiaExEtbstDoix?p=preview))
 *
 * ```
 * import {BaseResponseOptions, Response} from '@angular/http';
 *
 * var options = new BaseResponseOptions();
 * var res = new Response(options.merge({
 *   body: 'Angular',
 *   headers: new Headers({framework: 'angular'})
 * }));
 * console.log('res.headers.get("framework"):', res.headers.get('framework')); // angular
 * console.log('res.text():', res.text()); // Angular;
 * ```
 */
@Injectable()
export class BaseResponseOptions extends ResponseOptions {
  constructor() {
    super({status: 200, statusText: 'Ok', type: ResponseType.Default, headers: new Headers()});
  }
}
