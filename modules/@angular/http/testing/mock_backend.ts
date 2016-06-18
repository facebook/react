import {Injectable} from '@angular/core';
import {ReplaySubject} from 'rxjs/ReplaySubject';
import {Subject} from 'rxjs/Subject';
import {take} from 'rxjs/operator/take';

import {ReadyState} from '../src/enums';
import {BaseException} from '../src/facade/exceptions';
import {isPresent} from '../src/facade/lang';
import {Connection, ConnectionBackend} from '../src/interfaces';
import {Request} from '../src/static_request';
import {Response} from '../src/static_response';


/**
 *
 * Mock Connection to represent a {@link Connection} for tests.
 *
 **/
export class MockConnection implements Connection {
  // TODO Name `readyState` should change to be more generic, and states could be made to be more
  // descriptive than XHR states.
  /**
   * Describes the state of the connection, based on `XMLHttpRequest.readyState`, but with
   * additional states. For example, state 5 indicates an aborted connection.
   */
  readyState: ReadyState;

  /**
   * {@link Request} instance used to create the connection.
   */
  request: Request;

  /**
   * {@link EventEmitter} of {@link Response}. Can be subscribed to in order to be notified when a
   * response is available.
   */
  response: ReplaySubject<Response>;

  constructor(req: Request) {
    this.response = <any>take.call(new ReplaySubject(1), 1);
    this.readyState = ReadyState.Open;
    this.request = req;
  }

  /**
   * Sends a mock response to the connection. This response is the value that is emitted to the
   * {@link EventEmitter} returned by {@link Http}.
   *
   * ### Example
   *
   * ```
   * var connection;
   * backend.connections.subscribe(c => connection = c);
   * http.request('data.json').subscribe(res => console.log(res.text()));
   * connection.mockRespond(new Response(new ResponseOptions({ body: 'fake response' }))); //logs
   * 'fake response'
   * ```
   *
   */
  mockRespond(res: Response) {
    if (this.readyState === ReadyState.Done || this.readyState === ReadyState.Cancelled) {
      throw new BaseException('Connection has already been resolved');
    }
    this.readyState = ReadyState.Done;
    this.response.next(res);
    this.response.complete();
  }

  /**
   * Not yet implemented!
   *
   * Sends the provided {@link Response} to the `downloadObserver` of the `Request`
   * associated with this connection.
   */
  mockDownload(res: Response) {
    // this.request.downloadObserver.onNext(res);
    // if (res.bytesLoaded === res.totalBytes) {
    //   this.request.downloadObserver.onCompleted();
    // }
  }

  // TODO(jeffbcross): consider using Response type
  /**
   * Emits the provided error object as an error to the {@link Response} {@link EventEmitter}
   * returned
   * from {@link Http}.
   *
   * ### Example
   *
   * ```
   * var connection;
   * backend.connections.subscribe(c => connection = c);
   * http.request('data.json').subscribe(res => res, err => console.log(err)));
   * connection.mockError(new Error('error'));
   * ```
   *
   */
  mockError(err?: Error) {
    // Matches XHR semantics
    this.readyState = ReadyState.Done;
    this.response.error(err);
  }
}

/**
 * A mock backend for testing the {@link Http} service.
 *
 * This class can be injected in tests, and should be used to override providers
 * to other backends, such as {@link XHRBackend}.
 *
 * ### Example
 *
 * ```
 * import {BaseRequestOptions, Http} from '@angular/http';
 * import {MockBackend} from '@angular/http/testing';
 * it('should get some data', inject([AsyncTestCompleter], (async) => {
 *   var connection;
 *   var injector = Injector.resolveAndCreate([
 *     MockBackend,
 *     {provide: Http, useFactory: (backend, options) => {
 *       return new Http(backend, options);
 *     }, deps: [MockBackend, BaseRequestOptions]}]);
 *   var http = injector.get(Http);
 *   var backend = injector.get(MockBackend);
 *   //Assign any newly-created connection to local variable
 *   backend.connections.subscribe(c => connection = c);
 *   http.request('data.json').subscribe((res) => {
 *     expect(res.text()).toBe('awesome');
 *     async.done();
 *   });
 *   connection.mockRespond(new Response('awesome'));
 * }));
 * ```
 *
 * This method only exists in the mock implementation, not in real Backends.
 **/
@Injectable()
export class MockBackend implements ConnectionBackend {
  /**
   * {@link EventEmitter}
   * of {@link MockConnection} instances that have been created by this backend. Can be subscribed
   * to in order to respond to connections.
   *
   * ### Example
   *
   * ```
   * import {Http, BaseRequestOptions, Response} from '@angular/http';
   * import {MockBackend} from '@angular/http/testing';
   * import {Injector, provide} from '@angular/core';
   *
   * it('should get a response', () => {
   *   var connection; //this will be set when a new connection is emitted from the backend.
   *   var text; //this will be set from mock response
   *   var injector = Injector.resolveAndCreate([
   *     MockBackend,
   *     {provide: Http, useFactory: (backend, options) => {
   *       return new Http(backend, options);
   *     }, deps: [MockBackend, BaseRequestOptions]}]);
   *   var backend = injector.get(MockBackend);
   *   var http = injector.get(Http);
   *   backend.connections.subscribe(c => connection = c);
   *   http.request('something.json').subscribe(res => {
   *     text = res.text();
   *   });
   *   connection.mockRespond(new Response({body: 'Something'}));
   *   expect(text).toBe('Something');
   * });
   * ```
   *
   * This property only exists in the mock implementation, not in real Backends.
   */
  connections: any;  //<MockConnection>

  /**
   * An array representation of `connections`. This array will be updated with each connection that
   * is created by this backend.
   *
   * This property only exists in the mock implementation, not in real Backends.
   */
  connectionsArray: MockConnection[];
  /**
   * {@link EventEmitter} of {@link MockConnection} instances that haven't yet been resolved (i.e.
   * with a `readyState`
   * less than 4). Used internally to verify that no connections are pending via the
   * `verifyNoPendingRequests` method.
   *
   * This property only exists in the mock implementation, not in real Backends.
   */
  pendingConnections: any;  // Subject<MockConnection>
  constructor() {
    this.connectionsArray = [];
    this.connections = new Subject();
    this.connections.subscribe(
        (connection: MockConnection) => this.connectionsArray.push(connection));
    this.pendingConnections = new Subject();
  }

  /**
   * Checks all connections, and raises an exception if any connection has not received a response.
   *
   * This method only exists in the mock implementation, not in real Backends.
   */
  verifyNoPendingRequests() {
    let pending = 0;
    this.pendingConnections.subscribe((c: MockConnection) => pending++);
    if (pending > 0) throw new BaseException(`${pending} pending connections to be resolved`);
  }

  /**
   * Can be used in conjunction with `verifyNoPendingRequests` to resolve any not-yet-resolve
   * connections, if it's expected that there are connections that have not yet received a response.
   *
   * This method only exists in the mock implementation, not in real Backends.
   */
  resolveAllConnections() { this.connections.subscribe((c: MockConnection) => c.readyState = 4); }

  /**
   * Creates a new {@link MockConnection}. This is equivalent to calling `new
   * MockConnection()`, except that it also will emit the new `Connection` to the `connections`
   * emitter of this `MockBackend` instance. This method will usually only be used by tests
   * against the framework itself, not by end-users.
   */
  createConnection(req: Request): MockConnection {
    if (!isPresent(req) || !(req instanceof Request)) {
      throw new BaseException(`createConnection requires an instance of Request, got ${req}`);
    }
    let connection = new MockConnection(req);
    this.connections.next(connection);
    return connection;
  }
}
