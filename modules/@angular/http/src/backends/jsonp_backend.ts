import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';

import {BaseResponseOptions, ResponseOptions} from '../base_response_options';
import {ReadyState, RequestMethod, ResponseType} from '../enums';
import {makeTypeError} from '../facade/exceptions';
import {StringWrapper, isPresent} from '../facade/lang';
import {Connection, ConnectionBackend} from '../interfaces';
import {Request} from '../static_request';
import {Response} from '../static_response';

import {BrowserJsonp} from './browser_jsonp';

const JSONP_ERR_NO_CALLBACK = 'JSONP injected script did not invoke callback.';
const JSONP_ERR_WRONG_METHOD = 'JSONP requests must use GET request method.';

/**
 * Abstract base class for an in-flight JSONP request.
 */
export abstract class JSONPConnection implements Connection {
  /**
   * The {@link ReadyState} of this request.
   */
  readyState: ReadyState;

  /**
   * The outgoing HTTP request.
   */
  request: Request;

  /**
   * An observable that completes with the response, when the request is finished.
   */
  response: Observable<Response>;

  /**
   * Callback called when the JSONP request completes, to notify the application
   * of the new data.
   */
  abstract finished(data?: any): void;
}

export class JSONPConnection_ extends JSONPConnection {
  private _id: string;
  private _script: Element;
  private _responseData: any;
  private _finished: boolean = false;

  constructor(
      req: Request, private _dom: BrowserJsonp, private baseResponseOptions?: ResponseOptions) {
    super();
    if (req.method !== RequestMethod.Get) {
      throw makeTypeError(JSONP_ERR_WRONG_METHOD);
    }
    this.request = req;
    this.response = new Observable<Response>((responseObserver: Observer<Response>) => {

      this.readyState = ReadyState.Loading;
      let id = this._id = _dom.nextRequestID();

      _dom.exposeConnection(id, this);

      // Workaround Dart
      // url = url.replace(/=JSONP_CALLBACK(&|$)/, `generated method`);
      let callback = _dom.requestCallback(this._id);
      let url: string = req.url;
      if (url.indexOf('=JSONP_CALLBACK&') > -1) {
        url = StringWrapper.replace(url, '=JSONP_CALLBACK&', `=${callback}&`);
      } else if (url.lastIndexOf('=JSONP_CALLBACK') === url.length - '=JSONP_CALLBACK'.length) {
        url = url.substring(0, url.length - '=JSONP_CALLBACK'.length) + `=${callback}`;
      }

      let script = this._script = _dom.build(url);

      let onLoad = (event: Event) => {
        if (this.readyState === ReadyState.Cancelled) return;
        this.readyState = ReadyState.Done;
        _dom.cleanup(script);
        if (!this._finished) {
          let responseOptions =
              new ResponseOptions({body: JSONP_ERR_NO_CALLBACK, type: ResponseType.Error, url});
          if (isPresent(baseResponseOptions)) {
            responseOptions = baseResponseOptions.merge(responseOptions);
          }
          responseObserver.error(new Response(responseOptions));
          return;
        }

        let responseOptions = new ResponseOptions({body: this._responseData, url});
        if (isPresent(this.baseResponseOptions)) {
          responseOptions = this.baseResponseOptions.merge(responseOptions);
        }

        responseObserver.next(new Response(responseOptions));
        responseObserver.complete();
      };

      let onError = (error: Error) => {
        if (this.readyState === ReadyState.Cancelled) return;
        this.readyState = ReadyState.Done;
        _dom.cleanup(script);
        let responseOptions = new ResponseOptions({body: error.message, type: ResponseType.Error});
        if (isPresent(baseResponseOptions)) {
          responseOptions = baseResponseOptions.merge(responseOptions);
        }
        responseObserver.error(new Response(responseOptions));
      };

      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);

      _dom.send(script);

      return () => {
        this.readyState = ReadyState.Cancelled;
        script.removeEventListener('load', onLoad);
        script.removeEventListener('error', onError);
        if (isPresent(script)) {
          this._dom.cleanup(script);
        }

      };
    });
  }

  finished(data?: any) {
    // Don't leak connections
    this._finished = true;
    this._dom.removeConnection(this._id);
    if (this.readyState === ReadyState.Cancelled) return;
    this._responseData = data;
  }
}

/**
 * A {@link ConnectionBackend} that uses the JSONP strategy of making requests.
 */
export abstract class JSONPBackend extends ConnectionBackend {}

@Injectable()
export class JSONPBackend_ extends JSONPBackend {
  constructor(private _browserJSONP: BrowserJsonp, private _baseResponseOptions: ResponseOptions) {
    super();
  }

  createConnection(request: Request): JSONPConnection {
    return new JSONPConnection_(request, this._browserJSONP, this._baseResponseOptions);
  }
}
