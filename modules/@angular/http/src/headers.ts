import {BaseException} from '../src/facade/exceptions';
import {isBlank} from '../src/facade/lang';

import {isListLikeIterable, iterateListLike, Map, MapWrapper, StringMapWrapper, ListWrapper,} from '../src/facade/collection';

/**
 * Polyfill for [Headers](https://developer.mozilla.org/en-US/docs/Web/API/Headers/Headers), as
 * specified in the [Fetch Spec](https://fetch.spec.whatwg.org/#headers-class).
 *
 * The only known difference between this `Headers` implementation and the spec is the
 * lack of an `entries` method.
 *
 * ### Example ([live demo](http://plnkr.co/edit/MTdwT6?p=preview))
 *
 * ```
 * import {Headers} from '@angular/http';
 *
 * var firstHeaders = new Headers();
 * firstHeaders.append('Content-Type', 'image/jpeg');
 * console.log(firstHeaders.get('Content-Type')) //'image/jpeg'
 *
 * // Create headers from Plain Old JavaScript Object
 * var secondHeaders = new Headers({
 *   'X-My-Custom-Header': 'Angular'
 * });
 * console.log(secondHeaders.get('X-My-Custom-Header')); //'Angular'
 *
 * var thirdHeaders = new Headers(secondHeaders);
 * console.log(thirdHeaders.get('X-My-Custom-Header')); //'Angular'
 * ```
 */
export class Headers {
  /** @internal */
  _headersMap: Map<string, string[]>;
  constructor(headers?: Headers|{[key: string]: any}) {
    if (headers instanceof Headers) {
      this._headersMap = (<Headers>headers)._headersMap;
      return;
    }

    this._headersMap = new Map<string, string[]>();

    if (isBlank(headers)) {
      return;
    }

    // headers instanceof StringMap
    StringMapWrapper.forEach(headers, (v: any, k: string) => {
      this._headersMap.set(k, isListLikeIterable(v) ? v : [v]);
    });
  }

  /**
   * Returns a new Headers instance from the given DOMString of Response Headers
   */
  static fromResponseHeaderString(headersString: string): Headers {
    return headersString.trim()
        .split('\n')
        .map(val => val.split(':'))
        .map(([key, ...parts]) => ([key.trim(), parts.join(':').trim()]))
        .reduce((headers, [key, value]) => !headers.set(key, value) && headers, new Headers());
  }

  /**
   * Appends a header to existing list of header values for a given header name.
   */
  append(name: string, value: string): void {
    var mapName = this._headersMap.get(name);
    var list = isListLikeIterable(mapName) ? mapName : [];
    list.push(value);
    this._headersMap.set(name, list);
  }

  /**
   * Deletes all header values for the given name.
   */
  delete (name: string): void { this._headersMap.delete(name); }

  forEach(fn: (values: string[], name: string, headers: Map<string, string[]>) => void): void {
    this._headersMap.forEach(fn);
  }

  /**
   * Returns first header that matches given name.
   */
  get(header: string): string { return ListWrapper.first(this._headersMap.get(header)); }

  /**
   * Check for existence of header by given name.
   */
  has(header: string): boolean { return this._headersMap.has(header); }

  /**
   * Provides names of set headers
   */
  keys(): string[] { return MapWrapper.keys(this._headersMap); }

  /**
   * Sets or overrides header value for given name.
   */
  set(header: string, value: string|string[]): void {
    var list: string[] = [];

    if (isListLikeIterable(value)) {
      var pushValue = (<string[]>value).join(',');
      list.push(pushValue);
    } else {
      list.push(<string>value);
    }

    this._headersMap.set(header, list);
  }

  /**
   * Returns values of all headers.
   */
  values(): string[][] { return MapWrapper.values(this._headersMap); }

  /**
   * Returns string of all headers.
   */
  toJSON(): {[key: string]: any} {
    let serializableHeaders = {};
    this._headersMap.forEach((values: string[], name: string) => {
      let list: any[] /** TODO #9100 */ = [];

      iterateListLike(
          values, (val: any /** TODO #9100 */) => list = ListWrapper.concat(list, val.split(',')));

      (serializableHeaders as any /** TODO #9100 */)[name] = list;
    });
    return serializableHeaders;
  }

  /**
   * Returns list of header values for a given name.
   */
  getAll(header: string): string[] {
    var headers = this._headersMap.get(header);
    return isListLikeIterable(headers) ? headers : [];
  }

  /**
   * This method is not implemented.
   */
  entries() { throw new BaseException('"entries" method is not implemented on Headers class'); }
}
