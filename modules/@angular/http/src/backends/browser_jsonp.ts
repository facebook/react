import {Injectable} from '@angular/core';
import {global} from '../facade/lang';

let _nextRequestId = 0;
export const JSONP_HOME = '__ng_jsonp__';
var _jsonpConnections: {[key: string]: any} = null;

function _getJsonpConnections(): {[key: string]: any} {
  if (_jsonpConnections === null) {
    _jsonpConnections = (<{[key: string]: any}>global)[JSONP_HOME] = {};
  }
  return _jsonpConnections;
}

// Make sure not to evaluate this in a non-browser environment!
@Injectable()
export class BrowserJsonp {
  // Construct a <script> element with the specified URL
  build(url: string): any {
    let node = document.createElement('script');
    node.src = url;
    return node;
  }

  nextRequestID(): string { return `__req${_nextRequestId++}`; }

  requestCallback(id: string): string { return `${JSONP_HOME}.${id}.finished`; }

  exposeConnection(id: string, connection: any) {
    let connections = _getJsonpConnections();
    connections[id] = connection;
  }

  removeConnection(id: string) {
    var connections = _getJsonpConnections();
    connections[id] = null;
  }

  // Attach the <script> element to the DOM
  send(node: any) { document.body.appendChild(<Node>(node)); }

  // Remove <script> element from the DOM
  cleanup(node: any) {
    if (node.parentNode) {
      node.parentNode.removeChild(<Node>(node));
    }
  }
}
