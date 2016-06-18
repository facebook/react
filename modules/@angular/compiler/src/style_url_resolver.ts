// Some of the code comes from WebComponents.JS
// https://github.com/webcomponents/webcomponentsjs/blob/master/src/HTMLImports/path.js

import {RegExpWrapper, StringWrapper, isBlank, isPresent} from '../src/facade/lang';

import {UrlResolver} from './url_resolver';

export class StyleWithImports {
  constructor(public style: string, public styleUrls: string[]) {}
}

export function isStyleUrlResolvable(url: string): boolean {
  if (isBlank(url) || url.length === 0 || url[0] == '/') return false;
  var schemeMatch = RegExpWrapper.firstMatch(_urlWithSchemaRe, url);
  return isBlank(schemeMatch) || schemeMatch[1] == 'package' || schemeMatch[1] == 'asset';
}

/**
 * Rewrites stylesheets by resolving and removing the @import urls that
 * are either relative or don't have a `package:` scheme
 */
export function extractStyleUrls(
    resolver: UrlResolver, baseUrl: string, cssText: string): StyleWithImports {
  var foundUrls: string[] = [];
  var modifiedCssText = StringWrapper.replaceAllMapped(cssText, _cssImportRe, (m: string[]) => {
    var url = isPresent(m[1]) ? m[1] : m[2];
    if (!isStyleUrlResolvable(url)) {
      // Do not attempt to resolve non-package absolute URLs with URI scheme
      return m[0];
    }
    foundUrls.push(resolver.resolve(baseUrl, url));
    return '';
  });
  return new StyleWithImports(modifiedCssText, foundUrls);
}

var _cssImportRe = /@import\s+(?:url\()?\s*(?:(?:['"]([^'"]*))|([^;\)\s]*))[^;]*;?/g;
// TODO: can't use /^[^:/?#.]+:/g due to clang-format bug:
//       https://github.com/angular/angular/issues/4596
var _urlWithSchemaRe = /^([a-zA-Z\-\+\.]+):/g;
