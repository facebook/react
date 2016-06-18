import {StringMapWrapper} from '../src/facade/collection';
import {BaseException} from '../src/facade/exceptions';
import {RegExpWrapper, isBlank, isPresent} from '../src/facade/lang';

export function convertUrlParamsToArray(urlParams: {[key: string]: any}): string[] {
  var paramsArray: any[] /** TODO #9100 */ = [];
  if (isBlank(urlParams)) {
    return [];
  }
  StringMapWrapper.forEach(
      urlParams, (value: any /** TODO #9100 */, key: any /** TODO #9100 */) => {
        paramsArray.push((value === true) ? key : key + '=' + value);
      });
  return paramsArray;
}

// Convert an object of url parameters into a string that can be used in an URL
export function serializeParams(urlParams: {[key: string]: any}, joiner = '&'): string {
  return convertUrlParamsToArray(urlParams).join(joiner);
}

/**
 * This class represents a parsed URL
 */
export class Url {
  constructor(
      public path: string, public child: Url = null, public auxiliary: Url[] = /*@ts2dart_const*/[],
      public params: {[key: string]: any} = /*@ts2dart_const*/ {}) {}

  toString(): string {
    return this.path + this._matrixParamsToString() + this._auxToString() + this._childString();
  }

  segmentToString(): string { return this.path + this._matrixParamsToString(); }

  /** @internal */
  _auxToString(): string {
    return this.auxiliary.length > 0 ?
        ('(' + this.auxiliary.map(sibling => sibling.toString()).join('//') + ')') :
        '';
  }

  private _matrixParamsToString(): string {
    var paramString = serializeParams(this.params, ';');
    if (paramString.length > 0) {
      return ';' + paramString;
    }
    return '';
  }

  /** @internal */
  _childString(): string { return isPresent(this.child) ? ('/' + this.child.toString()) : ''; }
}

export class RootUrl extends Url {
  constructor(
      path: string, child: Url = null, auxiliary: Url[] = /*@ts2dart_const*/[],
      params: {[key: string]: any} = null) {
    super(path, child, auxiliary, params);
  }

  toString(): string {
    return this.path + this._auxToString() + this._childString() + this._queryParamsToString();
  }

  segmentToString(): string { return this.path + this._queryParamsToString(); }

  private _queryParamsToString(): string {
    if (isBlank(this.params)) {
      return '';
    }

    return '?' + serializeParams(this.params);
  }
}

export function pathSegmentsToUrl(pathSegments: string[]): Url {
  var url = new Url(pathSegments[pathSegments.length - 1]);
  for (var i = pathSegments.length - 2; i >= 0; i -= 1) {
    url = new Url(pathSegments[i], url);
  }
  return url;
}

var SEGMENT_RE = RegExpWrapper.create('^[^\\/\\(\\)\\?;=&#]+');
function matchUrlSegment(str: string): string {
  var match = RegExpWrapper.firstMatch(SEGMENT_RE, str);
  return isPresent(match) ? match[0] : '';
}
var QUERY_PARAM_VALUE_RE = RegExpWrapper.create('^[^\\(\\)\\?;&#]+');
function matchUrlQueryParamValue(str: string): string {
  var match = RegExpWrapper.firstMatch(QUERY_PARAM_VALUE_RE, str);
  return isPresent(match) ? match[0] : '';
}

export class UrlParser {
  private _remaining: string;

  peekStartsWith(str: string): boolean { return this._remaining.startsWith(str); }

  capture(str: string): void {
    if (!this._remaining.startsWith(str)) {
      throw new BaseException(`Expected "${str}".`);
    }
    this._remaining = this._remaining.substring(str.length);
  }

  parse(url: string): Url {
    this._remaining = url;
    if (url == '' || url == '/') {
      return new Url('');
    }
    return this.parseRoot();
  }

  // segment + (aux segments) + (query params)
  parseRoot(): RootUrl {
    if (this.peekStartsWith('/')) {
      this.capture('/');
    }
    var path = matchUrlSegment(this._remaining);
    this.capture(path);

    var aux: Url[] = [];
    if (this.peekStartsWith('(')) {
      aux = this.parseAuxiliaryRoutes();
    }
    if (this.peekStartsWith(';')) {
      // TODO: should these params just be dropped?
      this.parseMatrixParams();
    }
    var child: any /** TODO #9100 */ = null;
    if (this.peekStartsWith('/') && !this.peekStartsWith('//')) {
      this.capture('/');
      child = this.parseSegment();
    }
    var queryParams: {[key: string]: any} = null;
    if (this.peekStartsWith('?')) {
      queryParams = this.parseQueryParams();
    }
    return new RootUrl(path, child, aux, queryParams);
  }

  // segment + (matrix params) + (aux segments)
  parseSegment(): Url {
    if (this._remaining.length == 0) {
      return null;
    }
    if (this.peekStartsWith('/')) {
      this.capture('/');
    }
    var path = matchUrlSegment(this._remaining);
    this.capture(path);

    var matrixParams: {[key: string]: any} = null;
    if (this.peekStartsWith(';')) {
      matrixParams = this.parseMatrixParams();
    }
    var aux: Url[] = [];
    if (this.peekStartsWith('(')) {
      aux = this.parseAuxiliaryRoutes();
    }
    var child: Url = null;
    if (this.peekStartsWith('/') && !this.peekStartsWith('//')) {
      this.capture('/');
      child = this.parseSegment();
    }
    return new Url(path, child, aux, matrixParams);
  }

  parseQueryParams(): {[key: string]: any} {
    var params: {[key: string]: any} = {};
    this.capture('?');
    this.parseQueryParam(params);
    while (this._remaining.length > 0 && this.peekStartsWith('&')) {
      this.capture('&');
      this.parseQueryParam(params);
    }
    return params;
  }

  parseMatrixParams(): {[key: string]: any} {
    var params: {[key: string]: any} = {};
    while (this._remaining.length > 0 && this.peekStartsWith(';')) {
      this.capture(';');
      this.parseParam(params);
    }
    return params;
  }

  parseParam(params: {[key: string]: any}): void {
    var key = matchUrlSegment(this._remaining);
    if (isBlank(key)) {
      return;
    }
    this.capture(key);
    var value: any = true;
    if (this.peekStartsWith('=')) {
      this.capture('=');
      var valueMatch = matchUrlSegment(this._remaining);
      if (isPresent(valueMatch)) {
        value = valueMatch;
        this.capture(value);
      }
    }

    params[key] = value;
  }

  parseQueryParam(params: {[key: string]: any}): void {
    var key = matchUrlSegment(this._remaining);
    if (isBlank(key)) {
      return;
    }
    this.capture(key);
    var value: any = true;
    if (this.peekStartsWith('=')) {
      this.capture('=');
      var valueMatch = matchUrlQueryParamValue(this._remaining);
      if (isPresent(valueMatch)) {
        value = valueMatch;
        this.capture(value);
      }
    }

    params[key] = value;
  }

  parseAuxiliaryRoutes(): Url[] {
    var routes: Url[] = [];
    this.capture('(');

    while (!this.peekStartsWith(')') && this._remaining.length > 0) {
      routes.push(this.parseSegment());
      if (this.peekStartsWith('//')) {
        this.capture('//');
      }
    }
    this.capture(')');

    return routes;
  }
}

export var parser = new UrlParser();
