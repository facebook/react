import {Injectable} from '@angular/core';

import {BaseException} from '../facade/exceptions';
import {Math, RegExpWrapper, isBlank, isPresent} from '../facade/lang';

import {AssetUrl, ImportGenerator} from './path_util';

var _PATH_SEP = '/';
var _PATH_SEP_RE = /\//g;

@Injectable()
export class DartImportGenerator implements ImportGenerator {
  getImportPath(moduleUrlStr: string, importedUrlStr: string): string {
    var moduleUrl = AssetUrl.parse(moduleUrlStr, false);
    var importedUrl = AssetUrl.parse(importedUrlStr, true);
    if (isBlank(importedUrl)) {
      return importedUrlStr;
    }
    // Try to create a relative path first
    if (moduleUrl.firstLevelDir == importedUrl.firstLevelDir &&
        moduleUrl.packageName == importedUrl.packageName) {
      return getRelativePath(moduleUrl.modulePath, importedUrl.modulePath);
    } else if (importedUrl.firstLevelDir == 'lib') {
      return `package:${importedUrl.packageName}/${importedUrl.modulePath}`;
    }
    throw new BaseException(`Can't import url ${importedUrlStr} from ${moduleUrlStr}`);
  }
}

export function getRelativePath(modulePath: string, importedPath: string): string {
  var moduleParts = modulePath.split(_PATH_SEP_RE);
  var importedParts = importedPath.split(_PATH_SEP_RE);
  var longestPrefix = getLongestPathSegmentPrefix(moduleParts, importedParts);

  var resultParts: any[] /** TODO #9100 */ = [];
  var goParentCount = moduleParts.length - 1 - longestPrefix;
  for (var i = 0; i < goParentCount; i++) {
    resultParts.push('..');
  }
  for (var i = longestPrefix; i < importedParts.length; i++) {
    resultParts.push(importedParts[i]);
  }
  return resultParts.join(_PATH_SEP);
}

export function getLongestPathSegmentPrefix(arr1: string[], arr2: string[]): number {
  var prefixSize = 0;
  var minLen = Math.min(arr1.length, arr2.length);
  while (prefixSize < minLen && arr1[prefixSize] == arr2[prefixSize]) {
    prefixSize++;
  }
  return prefixSize;
}