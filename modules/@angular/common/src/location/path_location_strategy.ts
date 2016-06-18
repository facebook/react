import {Inject, Injectable, Optional} from '@angular/core';

import {BaseException} from '../facade/exceptions';
import {isBlank} from '../facade/lang';

import {Location} from './location';
import {APP_BASE_HREF, LocationStrategy} from './location_strategy';
import {PlatformLocation, UrlChangeListener} from './platform_location';


/**
 * `PathLocationStrategy` is a {@link LocationStrategy} used to configure the
 * {@link Location} service to represent its state in the
 * [path](https://en.wikipedia.org/wiki/Uniform_Resource_Locator#Syntax) of the
 * browser's URL.
 *
 * `PathLocationStrategy` is the default binding for {@link LocationStrategy}
 * provided in {@link ROUTER_PROVIDERS}.
 *
 * If you're using `PathLocationStrategy`, you must provide a provider for
 * {@link APP_BASE_HREF} to a string representing the URL prefix that should
 * be preserved when generating and recognizing URLs.
 *
 * For instance, if you provide an `APP_BASE_HREF` of `'/my/app'` and call
 * `location.go('/foo')`, the browser's URL will become
 * `example.com/my/app/foo`.
 *
 * ### Example
 *
 * ```
 * import {Component} from '@angular/core';
 * import {bootstrap} from '@angular/platform-browser/browser';
 * import {
 *   Location,
 *   APP_BASE_HREF
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
 *   ROUTER_PROVIDERS, // includes binding to PathLocationStrategy
 *   {provide: APP_BASE_HREF, useValue: '/my/app'}
 * ]);
 * ```
 *
 * @stable
 */
@Injectable()
export class PathLocationStrategy extends LocationStrategy {
  private _baseHref: string;

  constructor(
      private _platformLocation: PlatformLocation,
      @Optional() @Inject(APP_BASE_HREF) href?: string) {
    super();

    if (isBlank(href)) {
      href = this._platformLocation.getBaseHrefFromDOM();
    }

    if (isBlank(href)) {
      throw new BaseException(
          `No base href set. Please provide a value for the APP_BASE_HREF token or add a base element to the document.`);
    }

    this._baseHref = href;
  }

  onPopState(fn: UrlChangeListener): void {
    this._platformLocation.onPopState(fn);
    this._platformLocation.onHashChange(fn);
  }

  getBaseHref(): string { return this._baseHref; }

  prepareExternalUrl(internal: string): string {
    return Location.joinWithSlash(this._baseHref, internal);
  }

  path(): string {
    return this._platformLocation.pathname +
        Location.normalizeQueryParams(this._platformLocation.search);
  }

  pushState(state: any, title: string, url: string, queryParams: string) {
    var externalUrl = this.prepareExternalUrl(url + Location.normalizeQueryParams(queryParams));
    this._platformLocation.pushState(state, title, externalUrl);
  }

  replaceState(state: any, title: string, url: string, queryParams: string) {
    var externalUrl = this.prepareExternalUrl(url + Location.normalizeQueryParams(queryParams));
    this._platformLocation.replaceState(state, title, externalUrl);
  }

  forward(): void { this._platformLocation.forward(); }

  back(): void { this._platformLocation.back(); }
}
