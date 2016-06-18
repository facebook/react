import {StringWrapper, isPresent} from '../src/facade/lang';

import {ContentType, RequestMethod} from './enums';
import {Headers} from './headers';
import {normalizeMethodName} from './http_utils';
import {RequestArgs} from './interfaces';
import {URLSearchParams} from './url_search_params';


// TODO(jeffbcross): properly implement body accessors
/**
 * Creates `Request` instances from provided values.
 *
 * The Request's interface is inspired by the Request constructor defined in the [Fetch
 * Spec](https://fetch.spec.whatwg.org/#request-class),
 * but is considered a static value whose body can be accessed many times. There are other
 * differences in the implementation, but this is the most significant.
 *
 * `Request` instances are typically created by higher-level classes, like {@link Http} and
 * {@link Jsonp}, but it may occasionally be useful to explicitly create `Request` instances.
 * One such example is when creating services that wrap higher-level services, like {@link Http},
 * where it may be useful to generate a `Request` with arbitrary headers and search params.
 *
 * ```typescript
 * import {Injectable, Injector} from '@angular/core';
 * import {HTTP_PROVIDERS, Http, Request, RequestMethod} from '@angular/http';
 *
 * @Injectable()
 * class AutoAuthenticator {
 *   constructor(public http:Http) {}
 *   request(url:string) {
 *     return this.http.request(new Request({
 *       method: RequestMethod.Get,
 *       url: url,
 *       search: 'password=123'
 *     }));
 *   }
 * }
 *
 * var injector = Injector.resolveAndCreate([HTTP_PROVIDERS, AutoAuthenticator]);
 * var authenticator = injector.get(AutoAuthenticator);
 * authenticator.request('people.json').subscribe(res => {
 *   //URL should have included '?password=123'
 *   console.log('people', res.json());
 * });
 * ```
 */
export class Request {
  /**
   * Http method with which to perform the request.
   */
  method: RequestMethod;
  /**
   * {@link Headers} instance
   */
  headers: Headers;
  /** Url of the remote resource */
  url: string;
  /** Body of the request **/
  private _body: any;
  /** Type of the request body **/
  private contentType: ContentType;
  /** Enable use credentials */
  withCredentials: boolean;
  constructor(requestOptions: RequestArgs) {
    // TODO: assert that url is present
    let url = requestOptions.url;
    this.url = requestOptions.url;
    if (isPresent(requestOptions.search)) {
      let search = requestOptions.search.toString();
      if (search.length > 0) {
        let prefix = '?';
        if (StringWrapper.contains(this.url, '?')) {
          prefix = (this.url[this.url.length - 1] == '&') ? '' : '&';
        }
        // TODO: just delete search-query-looking string in url?
        this.url = url + prefix + search;
      }
    }
    this._body = requestOptions.body;
    this.contentType = this.detectContentType();
    this.method = normalizeMethodName(requestOptions.method);
    // TODO(jeffbcross): implement behavior
    // Defaults to 'omit', consistent with browser
    // TODO(jeffbcross): implement behavior
    this.headers = new Headers(requestOptions.headers);
    this.withCredentials = requestOptions.withCredentials;
  }


  /**
   * Returns the request's body as string, assuming that body exists. If body is undefined, return
   * empty
   * string.
   */
  text(): string { return isPresent(this._body) ? this._body.toString() : ''; }

  /**
   * Returns the request's body as JSON string, assuming that body exists. If body is undefined,
   * return
   * empty
   * string.
   */
  json(): string { return isPresent(this._body) ? JSON.stringify(this._body) : ''; }

  /**
   * Returns the request's body as array buffer, assuming that body exists. If body is undefined,
   * return
   * null.
   */
  arrayBuffer(): ArrayBuffer {
    if (this._body instanceof ArrayBuffer) return <ArrayBuffer>this._body;
    throw 'The request body isn\'t an array buffer';
  }

  /**
   * Returns the request's body as blob, assuming that body exists. If body is undefined, return
   * null.
   */
  blob(): Blob {
    if (this._body instanceof Blob) return <Blob>this._body;
    if (this._body instanceof ArrayBuffer) return new Blob([this._body]);
    throw 'The request body isn\'t either a blob or an array buffer';
  }

  /**
   * Returns the content type of request's body based on its type.
   */
  detectContentType() {
    if (this._body == null) {
      return ContentType.NONE;
    } else if (this._body instanceof URLSearchParams) {
      return ContentType.FORM;
    } else if (this._body instanceof FormData) {
      return ContentType.FORM_DATA;
    } else if (this._body instanceof Blob) {
      return ContentType.BLOB;
    } else if (this._body instanceof ArrayBuffer) {
      return ContentType.ARRAY_BUFFER;
    } else if (this._body && typeof this._body == 'object') {
      return ContentType.JSON;
    } else {
      return ContentType.TEXT;
    }
  }

  /**
   * Returns the request's body according to its type. If body is undefined, return
   * null.
   */
  getBody(): any {
    switch (this.contentType) {
      case ContentType.JSON:
        return this.json();
      case ContentType.FORM:
        return this.text();
      case ContentType.FORM_DATA:
        return this._body;
      case ContentType.TEXT:
        return this.text();
      case ContentType.BLOB:
        return this.blob();
      case ContentType.ARRAY_BUFFER:
        return this.arrayBuffer();
      default:
        return null;
    }
  }
}

const noop = function() {};
const w = typeof window == 'object' ? window : noop;
const FormData = (w as any /** TODO #9100 */)['FormData'] || noop;
const Blob = (w as any /** TODO #9100 */)['Blob'] || noop;
const ArrayBuffer = (w as any /** TODO #9100 */)['ArrayBuffer'] || noop;
