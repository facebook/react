import {BaseException} from '@angular/core';

import {XHR} from '../index';
import {PromiseCompleter, PromiseWrapper} from '../src/facade/async';
import {ListWrapper, Map} from '../src/facade/collection';
import {isBlank, normalizeBlank} from '../src/facade/lang';


/**
 * A mock implementation of {@link XHR} that allows outgoing requests to be mocked
 * and responded to within a single test, without going to the network.
 */
export class MockXHR extends XHR {
  private _expectations: _Expectation[] = [];
  private _definitions = new Map<string, string>();
  private _requests: _PendingRequest[] = [];

  get(url: string): Promise<string> {
    var request = new _PendingRequest(url);
    this._requests.push(request);
    return request.getPromise();
  }

  /**
   * Add an expectation for the given URL. Incoming requests will be checked against
   * the next expectation (in FIFO order). The `verifyNoOutstandingExpectations` method
   * can be used to check if any expectations have not yet been met.
   *
   * The response given will be returned if the expectation matches.
   */
  expect(url: string, response: string) {
    var expectation = new _Expectation(url, response);
    this._expectations.push(expectation);
  }

  /**
   * Add a definition for the given URL to return the given response. Unlike expectations,
   * definitions have no order and will satisfy any matching request at any time. Also
   * unlike expectations, unused definitions do not cause `verifyNoOutstandingExpectations`
   * to return an error.
   */
  when(url: string, response: string) { this._definitions.set(url, response); }

  /**
   * Process pending requests and verify there are no outstanding expectations. Also fails
   * if no requests are pending.
   */
  flush() {
    if (this._requests.length === 0) {
      throw new BaseException('No pending requests to flush');
    }

    do {
      this._processRequest(this._requests.shift());
    } while (this._requests.length > 0);

    this.verifyNoOutstandingExpectations();
  }

  /**
   * Throw an exception if any expectations have not been satisfied.
   */
  verifyNoOutstandingExpectations() {
    if (this._expectations.length === 0) return;

    var urls: any[] /** TODO #9100 */ = [];
    for (var i = 0; i < this._expectations.length; i++) {
      var expectation = this._expectations[i];
      urls.push(expectation.url);
    }

    throw new BaseException(`Unsatisfied requests: ${urls.join(', ')}`);
  }

  private _processRequest(request: _PendingRequest) {
    var url = request.url;

    if (this._expectations.length > 0) {
      var expectation = this._expectations[0];
      if (expectation.url == url) {
        ListWrapper.remove(this._expectations, expectation);
        request.complete(expectation.response);
        return;
      }
    }

    if (this._definitions.has(url)) {
      var response = this._definitions.get(url);
      request.complete(normalizeBlank(response));
      return;
    }

    throw new BaseException(`Unexpected request ${url}`);
  }
}

class _PendingRequest {
  completer: PromiseCompleter<string>;

  constructor(public url: string) { this.completer = PromiseWrapper.completer(); }

  complete(response: string) {
    if (isBlank(response)) {
      this.completer.reject(`Failed to load ${this.url}`, null);
    } else {
      this.completer.resolve(response);
    }
  }

  getPromise(): Promise<string> { return this.completer.promise; }
}

class _Expectation {
  url: string;
  response: string;
  constructor(url: string, response: string) {
    this.url = url;
    this.response = response;
  }
}
