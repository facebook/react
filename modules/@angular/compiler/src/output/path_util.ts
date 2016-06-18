import {Injectable} from '@angular/core';

import {BaseException} from '../facade/exceptions';
import {Math, RegExpWrapper, isBlank, isPresent} from '../facade/lang';


// asset:<package-name>/<realm>/<path-to-module>
var _ASSET_URL_RE = /asset:([^\/]+)\/([^\/]+)\/(.+)/g;

/**
 * Interface that defines how import statements should be generated.
 */
export abstract class ImportGenerator {
  static parseAssetUrl(url: string): AssetUrl { return AssetUrl.parse(url); }

  abstract getImportPath(moduleUrlStr: string, importedUrlStr: string): string;
}

export class AssetUrl {
  static parse(url: string, allowNonMatching: boolean = true): AssetUrl {
    var match = RegExpWrapper.firstMatch(_ASSET_URL_RE, url);
    if (isPresent(match)) {
      return new AssetUrl(match[1], match[2], match[3]);
    }
    if (allowNonMatching) {
      return null;
    }
    throw new BaseException(`Url ${url} is not a valid asset: url`);
  }

  constructor(public packageName: string, public firstLevelDir: string, public modulePath: string) {
  }
}
