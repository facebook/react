import {ListWrapper, Map, isListLikeIterable} from '../src/facade/collection';
import {isPresent} from '../src/facade/lang';

function paramParser(rawParams: string = ''): Map<string, string[]> {
  var map = new Map<string, string[]>();
  if (rawParams.length > 0) {
    var params: string[] = rawParams.split('&');
    params.forEach((param: string) => {
      var split: string[] = param.split('=');
      var key = split[0];
      var val = split[1];
      var list = isPresent(map.get(key)) ? map.get(key) : [];
      list.push(val);
      map.set(key, list);
    });
  }
  return map;
}

/**
 * Map-like representation of url search parameters, based on
 * [URLSearchParams](https://url.spec.whatwg.org/#urlsearchparams) in the url living standard,
 * with several extensions for merging URLSearchParams objects:
 *   - setAll()
 *   - appendAll()
 *   - replaceAll()
 */
export class URLSearchParams {
  paramsMap: Map<string, string[]>;
  constructor(public rawParams: string = '') { this.paramsMap = paramParser(rawParams); }

  clone(): URLSearchParams {
    var clone = new URLSearchParams();
    clone.appendAll(this);
    return clone;
  }

  has(param: string): boolean { return this.paramsMap.has(param); }

  get(param: string): string {
    var storedParam = this.paramsMap.get(param);
    if (isListLikeIterable(storedParam)) {
      return ListWrapper.first(storedParam);
    } else {
      return null;
    }
  }

  getAll(param: string): string[] {
    var mapParam = this.paramsMap.get(param);
    return isPresent(mapParam) ? mapParam : [];
  }

  set(param: string, val: string) {
    var mapParam = this.paramsMap.get(param);
    var list = isPresent(mapParam) ? mapParam : [];
    ListWrapper.clear(list);
    list.push(val);
    this.paramsMap.set(param, list);
  }

  // A merge operation
  // For each name-values pair in `searchParams`, perform `set(name, values[0])`
  //
  // E.g: "a=[1,2,3], c=[8]" + "a=[4,5,6], b=[7]" = "a=[4], c=[8], b=[7]"
  //
  // TODO(@caitp): document this better
  setAll(searchParams: URLSearchParams) {
    searchParams.paramsMap.forEach((value, param) => {
      var mapParam = this.paramsMap.get(param);
      var list = isPresent(mapParam) ? mapParam : [];
      ListWrapper.clear(list);
      list.push(value[0]);
      this.paramsMap.set(param, list);
    });
  }

  append(param: string, val: string): void {
    var mapParam = this.paramsMap.get(param);
    var list = isPresent(mapParam) ? mapParam : [];
    list.push(val);
    this.paramsMap.set(param, list);
  }

  // A merge operation
  // For each name-values pair in `searchParams`, perform `append(name, value)`
  // for each value in `values`.
  //
  // E.g: "a=[1,2], c=[8]" + "a=[3,4], b=[7]" = "a=[1,2,3,4], c=[8], b=[7]"
  //
  // TODO(@caitp): document this better
  appendAll(searchParams: URLSearchParams) {
    searchParams.paramsMap.forEach((value, param) => {
      var mapParam = this.paramsMap.get(param);
      var list = isPresent(mapParam) ? mapParam : [];
      for (var i = 0; i < value.length; ++i) {
        list.push(value[i]);
      }
      this.paramsMap.set(param, list);
    });
  }


  // A merge operation
  // For each name-values pair in `searchParams`, perform `delete(name)`,
  // followed by `set(name, values)`
  //
  // E.g: "a=[1,2,3], c=[8]" + "a=[4,5,6], b=[7]" = "a=[4,5,6], c=[8], b=[7]"
  //
  // TODO(@caitp): document this better
  replaceAll(searchParams: URLSearchParams) {
    searchParams.paramsMap.forEach((value, param) => {
      var mapParam = this.paramsMap.get(param);
      var list = isPresent(mapParam) ? mapParam : [];
      ListWrapper.clear(list);
      for (var i = 0; i < value.length; ++i) {
        list.push(value[i]);
      }
      this.paramsMap.set(param, list);
    });
  }

  toString(): string {
    var paramsList: string[] = [];
    this.paramsMap.forEach(
        (values, k) => { values.forEach(v => paramsList.push(k + '=' + encodeURIComponent(v))); });
    return paramsList.join('&');
  }

  delete (param: string): void { this.paramsMap.delete(param); }
}
