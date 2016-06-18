import {makeTypeError} from '../src/facade/exceptions';
import {isString} from '../src/facade/lang';

import {RequestMethod} from './enums';

export function normalizeMethodName(method: string | RequestMethod): RequestMethod {
  if (isString(method)) {
    var originalMethod = method;
    method = (<string>method)
                 .replace(
                     /(\w)(\w*)/g,
                     (g0: string, g1: string, g2: string) => g1.toUpperCase() + g2.toLowerCase());
    method = <number>(<{[key: string]: any}>RequestMethod)[method];
    if (typeof method !== 'number')
      throw makeTypeError(
          `Invalid request method. The method "${originalMethod}" is not supported.`);
  }
  return <RequestMethod>method;
}

export const isSuccess = (status: number): boolean => (status >= 200 && status < 300);

export function getResponseURL(xhr: any): string {
  if ('responseURL' in xhr) {
    return xhr.responseURL;
  }
  if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
    return xhr.getResponseHeader('X-Request-URL');
  }
  return;
}

export {isJsObject} from '../src/facade/lang';
