import {XHR} from '@angular/compiler';
import {BaseException} from '../facade/exceptions';
import {global} from '../facade/lang';
import {PromiseWrapper} from '../facade/promise';

/**
 * An implementation of XHR that uses a template cache to avoid doing an actual
 * XHR.
 *
 * The template cache needs to be built and loaded into window.$templateCache
 * via a separate mechanism.
 */
export class CachedXHR extends XHR {
  private _cache: {[url: string]: string};

  constructor() {
    super();
    this._cache = (<any>global).$templateCache;
    if (this._cache == null) {
      throw new BaseException('CachedXHR: Template cache was not found in $templateCache.');
    }
  }

  get(url: string): Promise<string> {
    if (this._cache.hasOwnProperty(url)) {
      return PromiseWrapper.resolve(this._cache[url]);
    } else {
      return PromiseWrapper.reject('CachedXHR: Did not find cached template for ' + url, null);
    }
  }
}
