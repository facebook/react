import {Inject, Injectable, Optional} from '@angular/core';

import {isPresent} from '../facade/lang';

import {Location} from './location';
import {APP_BASE_HREF, LocationStrategy} from './location_strategy';
import {PlatformLocation, UrlChangeListener} from './platform_location';



/**
 * `HashLocationStrategy` is a {@link LocationStrategy} used to configure the
 * {@link Location} service to represent its state in the
 * [hash fragment](https://en.wikipedia.org/wiki/Uniform_Resource_Locator#Syntax)
 * of the browser's URL.
 *
 * For instance, if you call `location.go('/foo')`, the browser's URL will become
 * `example.com#/foo`.
 *
 * ### Example
 *
 * ```
 * import {Component, provide} from '@angular/core';
 * import {
 *   Location,
 *   LocationStrategy,
 *   HashLocationStrategy
 * } from '@angular/common';
 * import {
 *   ROUTER_DIRECTIVES,
 *   ROUTER_PROVIDERS,
 *   RouteConfig
 * } from '@angular/router';
 *
 * @Component({directives: [ROUTER_DIRECTIVES]})
 * @RouteConfig([
 *  {...},
 * ])
 * class AppCmp {
 *   constructor(location: Location) {
 *     location.go('/foo');
 *   }
 * }
 *
 * bootstrap(AppCmp, [
 *   ROUTER_PROVIDERS,
 *   {provide: LocationStrategy, useClass: HashLocationStrategy}
 * ]);
 * ```
 *
 * @stable
 */
@Injectable()
export class HashLocationStrategy extends LocationStrategy {
  private _baseHref: string = '';
  constructor(
      private _platformLocation: PlatformLocation,
      @Optional() @Inject(APP_BASE_HREF) _baseHref?: string) {
    super();
    if (isPresent(_baseHref)) {
      this._baseHref = _baseHref;
    }
  }

  onPopState(fn: UrlChangeListener): void {
    this._platformLocation.onPopState(fn);
    this._platformLocation.onHashChange(fn);
  }

  getBaseHref(): string { return this._baseHref; }

  path(): string {
    // the hash value is always prefixed with a `#`
    // and if it is empty then it will stay empty
    var path = this._platformLocation.hash;
    if (!isPresent(path)) path = '#';

    // Dart will complain if a call to substring is
    // executed with a position value that extends the
    // length of string.
    return (path.length > 0 ? path.substring(1) : path);
  }

  prepareExternalUrl(internal: string): string {
    var url = Location.joinWithSlash(this._baseHref, internal);
    return url.length > 0 ? ('#' + url) : url;
  }

  pushState(state: any, title: string, path: string, queryParams: string) {
    var url = this.prepareExternalUrl(path + Location.normalizeQueryParams(queryParams));
    if (url.length == 0) {
      url = this._platformLocation.pathname;
    }
    this._platformLocation.pushState(state, title, url);
  }

  replaceState(state: any, title: string, path: string, queryParams: string) {
    var url = this.prepareExternalUrl(path + Location.normalizeQueryParams(queryParams));
    if (url.length == 0) {
      url = this._platformLocation.pathname;
    }
    this._platformLocation.replaceState(state, title, url);
  }

  forward(): void { this._platformLocation.forward(); }

  back(): void { this._platformLocation.back(); }
}
