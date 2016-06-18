import {StringMapWrapper} from '../../facade/collection';
import {BaseException} from '../../facade/exceptions';
import {RegExpWrapper, StringWrapper, isBlank, isPresent} from '../../facade/lang';
import {RootUrl, Url, convertUrlParamsToArray} from '../../url_parser';
import {TouchMap, normalizeString} from '../../utils';

import {GeneratedUrl, MatchedUrl, RoutePath} from './route_path';



/**
 * `ParamRoutePath`s are made up of `PathSegment`s, each of which can
 * match a segment of a URL. Different kind of `PathSegment`s match
 * URL segments in different ways...
 */
interface PathSegment {
  name: string;
  generate(params: TouchMap): string;
  match(path: string): boolean;
  specificity: string;
  hash: string;
}

/**
 * Identified by a `...` URL segment. This indicates that the
 * Route will continue to be matched by child `Router`s.
 */
class ContinuationPathSegment implements PathSegment {
  name: string = '';
  specificity = '';
  hash = '...';
  generate(params: TouchMap): string { return ''; }
  match(path: string): boolean { return true; }
}

/**
 * Identified by a string not starting with a `:` or `*`.
 * Only matches the URL segments that equal the segment path
 */
class StaticPathSegment implements PathSegment {
  name: string = '';
  specificity = '2';
  hash: string;
  constructor(public path: string) { this.hash = path; }
  match(path: string): boolean { return path == this.path; }
  generate(params: TouchMap): string { return this.path; }
}

/**
 * Identified by a string starting with `:`. Indicates a segment
 * that can contain a value that will be extracted and provided to
 * a matching `Instruction`.
 */
class DynamicPathSegment implements PathSegment {
  static paramMatcher = /^:([^\/]+)$/g;
  specificity = '1';
  hash = ':';
  constructor(public name: string) {}
  match(path: string): boolean { return path.length > 0; }
  generate(params: TouchMap): string {
    if (!StringMapWrapper.contains(params.map, this.name)) {
      throw new BaseException(
          `Route generator for '${this.name}' was not included in parameters passed.`);
    }
    return encodeDynamicSegment(normalizeString(params.get(this.name)));
  }
}

/**
 * Identified by a string starting with `*` Indicates that all the following
 * segments match this route and that the value of these segments should
 * be provided to a matching `Instruction`.
 */
class StarPathSegment implements PathSegment {
  static wildcardMatcher = /^\*([^\/]+)$/g;
  specificity = '0';
  hash = '*';
  constructor(public name: string) {}
  match(path: string): boolean { return true; }
  generate(params: TouchMap): string { return normalizeString(params.get(this.name)); }
}

/**
 * Parses a URL string using a given matcher DSL, and generates URLs from param maps
 */
export class ParamRoutePath implements RoutePath {
  specificity: string;
  terminal: boolean = true;
  hash: string;

  private _segments: PathSegment[];

  /**
   * Takes a string representing the matcher DSL
   */
  constructor(public routePath: string) {
    this._assertValidPath(routePath);

    this._parsePathString(routePath);
    this.specificity = this._calculateSpecificity();
    this.hash = this._calculateHash();

    var lastSegment = this._segments[this._segments.length - 1];
    this.terminal = !(lastSegment instanceof ContinuationPathSegment);
  }

  matchUrl(url: Url): MatchedUrl {
    var nextUrlSegment = url;
    var currentUrlSegment: Url;
    var positionalParams = {};
    var captured: string[] = [];

    for (var i = 0; i < this._segments.length; i += 1) {
      var pathSegment = this._segments[i];

      if (pathSegment instanceof ContinuationPathSegment) {
        break;
      }
      currentUrlSegment = nextUrlSegment;

      if (isPresent(currentUrlSegment)) {
        // the star segment consumes all of the remaining URL, including matrix params
        if (pathSegment instanceof StarPathSegment) {
          (positionalParams as any /** TODO #9100 */)[pathSegment.name] =
              currentUrlSegment.toString();
          captured.push(currentUrlSegment.toString());
          nextUrlSegment = null;
          break;
        }

        captured.push(currentUrlSegment.path);

        if (pathSegment instanceof DynamicPathSegment) {
          (positionalParams as any /** TODO #9100 */)[pathSegment.name] =
              decodeDynamicSegment(currentUrlSegment.path);
        } else if (!pathSegment.match(currentUrlSegment.path)) {
          return null;
        }

        nextUrlSegment = currentUrlSegment.child;
      } else if (!pathSegment.match('')) {
        return null;
      }
    }

    if (this.terminal && isPresent(nextUrlSegment)) {
      return null;
    }

    var urlPath = captured.join('/');

    var auxiliary: any[] /** TODO #9100 */ = [];
    var urlParams: any[] /** TODO #9100 */ = [];
    var allParams = positionalParams;
    if (isPresent(currentUrlSegment)) {
      // If this is the root component, read query params. Otherwise, read matrix params.
      var paramsSegment = url instanceof RootUrl ? url : currentUrlSegment;

      if (isPresent(paramsSegment.params)) {
        allParams = StringMapWrapper.merge(paramsSegment.params, positionalParams);
        urlParams = convertUrlParamsToArray(paramsSegment.params);
      } else {
        allParams = positionalParams;
      }
      auxiliary = currentUrlSegment.auxiliary;
    }

    return new MatchedUrl(urlPath, urlParams, allParams, auxiliary, nextUrlSegment);
  }


  generateUrl(params: {[key: string]: any}): GeneratedUrl {
    var paramTokens = new TouchMap(params);

    var path: any[] /** TODO #9100 */ = [];

    for (var i = 0; i < this._segments.length; i++) {
      let segment = this._segments[i];
      if (!(segment instanceof ContinuationPathSegment)) {
        path.push(segment.generate(paramTokens));
      }
    }
    var urlPath = path.join('/');

    var nonPositionalParams = paramTokens.getUnused();
    var urlParams = nonPositionalParams;

    return new GeneratedUrl(urlPath, urlParams);
  }


  toString(): string { return this.routePath; }

  private _parsePathString(routePath: string) {
    // normalize route as not starting with a "/". Recognition will
    // also normalize.
    if (routePath.startsWith('/')) {
      routePath = routePath.substring(1);
    }

    var segmentStrings = routePath.split('/');
    this._segments = [];

    var limit = segmentStrings.length - 1;
    for (var i = 0; i <= limit; i++) {
      var segment = segmentStrings[i], match: any /** TODO #9100 */;

      if (isPresent(match = RegExpWrapper.firstMatch(DynamicPathSegment.paramMatcher, segment))) {
        this._segments.push(new DynamicPathSegment(match[1]));
      } else if (isPresent(
                     match = RegExpWrapper.firstMatch(StarPathSegment.wildcardMatcher, segment))) {
        this._segments.push(new StarPathSegment(match[1]));
      } else if (segment == '...') {
        if (i < limit) {
          throw new BaseException(
              `Unexpected "..." before the end of the path for "${routePath}".`);
        }
        this._segments.push(new ContinuationPathSegment());
      } else {
        this._segments.push(new StaticPathSegment(segment));
      }
    }
  }

  private _calculateSpecificity(): string {
    // The "specificity" of a path is used to determine which route is used when multiple routes
    // match
    // a URL. Static segments (like "/foo") are the most specific, followed by dynamic segments
    // (like
    // "/:id"). Star segments add no specificity. Segments at the start of the path are more
    // specific
    // than proceeding ones.
    //
    // The code below uses place values to combine the different types of segments into a single
    // string that we can sort later. Each static segment is marked as a specificity of "2," each
    // dynamic segment is worth "1" specificity, and stars are worth "0" specificity.
    var i: any /** TODO #9100 */, length = this._segments.length,
                                  specificity: any /** TODO #9100 */;
    if (length == 0) {
      // a single slash (or "empty segment" is as specific as a static segment
      specificity += '2';
    } else {
      specificity = '';
      for (i = 0; i < length; i++) {
        specificity += this._segments[i].specificity;
      }
    }
    return specificity;
  }

  private _calculateHash(): string {
    // this function is used to determine whether a route config path like `/foo/:id` collides with
    // `/foo/:name`
    var i: any /** TODO #9100 */, length = this._segments.length;
    var hashParts: any[] /** TODO #9100 */ = [];
    for (i = 0; i < length; i++) {
      hashParts.push(this._segments[i].hash);
    }
    return hashParts.join('/');
  }

  private _assertValidPath(path: string) {
    if (StringWrapper.contains(path, '#')) {
      throw new BaseException(
          `Path "${path}" should not include "#". Use "HashLocationStrategy" instead.`);
    }
    var illegalCharacter = RegExpWrapper.firstMatch(ParamRoutePath.RESERVED_CHARS, path);
    if (isPresent(illegalCharacter)) {
      throw new BaseException(
          `Path "${path}" contains "${illegalCharacter[0]}" which is not allowed in a route config.`);
    }
  }
  static RESERVED_CHARS = RegExpWrapper.create('//|\\(|\\)|;|\\?|=');
}

let REGEXP_PERCENT = /%/g;
let REGEXP_SLASH = /\//g;
let REGEXP_OPEN_PARENT = /\(/g;
let REGEXP_CLOSE_PARENT = /\)/g;
let REGEXP_SEMICOLON = /;/g;

function encodeDynamicSegment(value: string): string {
  if (isBlank(value)) {
    return null;
  }

  value = StringWrapper.replaceAll(value, REGEXP_PERCENT, '%25');
  value = StringWrapper.replaceAll(value, REGEXP_SLASH, '%2F');
  value = StringWrapper.replaceAll(value, REGEXP_OPEN_PARENT, '%28');
  value = StringWrapper.replaceAll(value, REGEXP_CLOSE_PARENT, '%29');
  value = StringWrapper.replaceAll(value, REGEXP_SEMICOLON, '%3B');

  return value;
}

let REGEXP_ENC_SEMICOLON = /%3B/ig;
let REGEXP_ENC_CLOSE_PARENT = /%29/ig;
let REGEXP_ENC_OPEN_PARENT = /%28/ig;
let REGEXP_ENC_SLASH = /%2F/ig;
let REGEXP_ENC_PERCENT = /%25/ig;

function decodeDynamicSegment(value: string): string {
  if (isBlank(value)) {
    return null;
  }

  value = StringWrapper.replaceAll(value, REGEXP_ENC_SEMICOLON, ';');
  value = StringWrapper.replaceAll(value, REGEXP_ENC_CLOSE_PARENT, ')');
  value = StringWrapper.replaceAll(value, REGEXP_ENC_OPEN_PARENT, '(');
  value = StringWrapper.replaceAll(value, REGEXP_ENC_SLASH, '/');
  value = StringWrapper.replaceAll(value, REGEXP_ENC_PERCENT, '%');

  return value;
}
