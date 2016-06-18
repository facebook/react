import {Injectable} from '@angular/core';
import {__platform_browser_private__} from '@angular/platform-browser';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';

import {ResponseOptions} from '../base_response_options';
import {ContentType, ReadyState, RequestMethod, ResponseType} from '../enums';
import {isPresent, isString} from '../facade/lang';
import {Headers} from '../headers';
import {getResponseURL, isSuccess} from '../http_utils';
import {Connection, ConnectionBackend, XSRFStrategy} from '../interfaces';
import {Request} from '../static_request';
import {Response} from '../static_response';

import {BrowserXhr} from './browser_xhr';

const XSSI_PREFIX = /^\)\]\}',?\n/;

/**
 * Creates connections using `XMLHttpRequest`. Given a fully-qualified
 * request, an `XHRConnection` will immediately create an `XMLHttpRequest` object and send the
 * request.
 *
 * This class would typically not be created or interacted with directly inside applications, though
 * the {@link MockConnection} may be interacted with in tests.
 */
export class XHRConnection implements Connection {
  request: Request;
  /**
   * Response {@link EventEmitter} which emits a single {@link Response} value on load event of
   * `XMLHttpRequest`.
   */
  response: Observable<Response>;
  readyState: ReadyState;
  constructor(req: Request, browserXHR: BrowserXhr, baseResponseOptions?: ResponseOptions) {
    this.request = req;
    this.response = new Observable<Response>((responseObserver: Observer<Response>) => {
      let _xhr: XMLHttpRequest = browserXHR.build();
      _xhr.open(RequestMethod[req.method].toUpperCase(), req.url);
      if (isPresent(req.withCredentials)) {
        _xhr.withCredentials = req.withCredentials;
      }
      // load event handler
      let onLoad = () => {
        // responseText is the old-school way of retrieving response (supported by IE8 & 9)
        // response/responseType properties were introduced in XHR Level2 spec (supported by
        // IE10)
        let body = isPresent(_xhr.response) ? _xhr.response : _xhr.responseText;
        // Implicitly strip a potential XSSI prefix.
        if (isString(body)) body = body.replace(XSSI_PREFIX, '');
        let headers = Headers.fromResponseHeaderString(_xhr.getAllResponseHeaders());

        let url = getResponseURL(_xhr);

        // normalize IE9 bug (http://bugs.jquery.com/ticket/1450)
        let status: number = _xhr.status === 1223 ? 204 : _xhr.status;

        // fix status code when it is 0 (0 status is undocumented).
        // Occurs when accessing file resources or on Android 4.1 stock browser
        // while retrieving files from application cache.
        if (status === 0) {
          status = body ? 200 : 0;
        }

        let statusText = _xhr.statusText || 'OK';

        var responseOptions = new ResponseOptions({body, status, headers, statusText, url});
        if (isPresent(baseResponseOptions)) {
          responseOptions = baseResponseOptions.merge(responseOptions);
        }
        let response = new Response(responseOptions);
        response.ok = isSuccess(status);
        if (response.ok) {
          responseObserver.next(response);
          // TODO(gdi2290): defer complete if array buffer until done
          responseObserver.complete();
          return;
        }
        responseObserver.error(response);
      };
      // error event handler
      let onError = (err: any) => {
        var responseOptions = new ResponseOptions({body: err, type: ResponseType.Error});
        if (isPresent(baseResponseOptions)) {
          responseOptions = baseResponseOptions.merge(responseOptions);
        }
        responseObserver.error(new Response(responseOptions));
      };

      this.setDetectedContentType(req, _xhr);

      if (isPresent(req.headers)) {
        req.headers.forEach((values, name) => _xhr.setRequestHeader(name, values.join(',')));
      }

      _xhr.addEventListener('load', onLoad);
      _xhr.addEventListener('error', onError);

      _xhr.send(this.request.getBody());

      return () => {
        _xhr.removeEventListener('load', onLoad);
        _xhr.removeEventListener('error', onError);
        _xhr.abort();
      };
    });
  }

  setDetectedContentType(req: any /** TODO #9100 */, _xhr: any /** TODO #9100 */) {
    // Skip if a custom Content-Type header is provided
    if (isPresent(req.headers) && isPresent(req.headers.get('Content-Type'))) {
      return;
    }

    // Set the detected content type
    switch (req.contentType) {
      case ContentType.NONE:
        break;
      case ContentType.JSON:
        _xhr.setRequestHeader('Content-Type', 'application/json');
        break;
      case ContentType.FORM:
        _xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
        break;
      case ContentType.TEXT:
        _xhr.setRequestHeader('Content-Type', 'text/plain');
        break;
      case ContentType.BLOB:
        var blob = req.blob();
        if (blob.type) {
          _xhr.setRequestHeader('Content-Type', blob.type);
        }
        break;
    }
  }
}

/**
 * `XSRFConfiguration` sets up Cross Site Request Forgery (XSRF) protection for the application
 * using a cookie. See https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF) for more
 * information on XSRF.
 *
 * Applications can configure custom cookie and header names by binding an instance of this class
 * with different `cookieName` and `headerName` values. See the main HTTP documentation for more
 * details.
 */
export class CookieXSRFStrategy implements XSRFStrategy {
  constructor(
      private _cookieName: string = 'XSRF-TOKEN', private _headerName: string = 'X-XSRF-TOKEN') {}

  configureRequest(req: Request) {
    let xsrfToken = __platform_browser_private__.getDOM().getCookie(this._cookieName);
    if (xsrfToken && !req.headers.has(this._headerName)) {
      req.headers.set(this._headerName, xsrfToken);
    }
  }
}

/**
 * Creates {@link XHRConnection} instances.
 *
 * This class would typically not be used by end users, but could be
 * overridden if a different backend implementation should be used,
 * such as in a node backend.
 *
 * ### Example
 *
 * ```
 * import {Http, MyNodeBackend, HTTP_PROVIDERS, BaseRequestOptions} from '@angular/http';
 * @Component({
 *   viewProviders: [
 *     HTTP_PROVIDERS,
 *     {provide: Http, useFactory: (backend, options) => {
 *       return new Http(backend, options);
 *     }, deps: [MyNodeBackend, BaseRequestOptions]}]
 * })
 * class MyComponent {
 *   constructor(http:Http) {
 *     http.request('people.json').subscribe(res => this.people = res.json());
 *   }
 * }
 * ```
 **/
@Injectable()
export class XHRBackend implements ConnectionBackend {
  constructor(
      private _browserXHR: BrowserXhr, private _baseResponseOptions: ResponseOptions,
      private _xsrfStrategy: XSRFStrategy) {}

  createConnection(request: Request): XHRConnection {
    this._xsrfStrategy.configureRequest(request);
    return new XHRConnection(request, this._browserXHR, this._baseResponseOptions);
  }
}
