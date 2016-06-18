import {XHR} from '@angular/compiler';

import {isPresent} from '../facade/lang';
import {PromiseCompleter, PromiseWrapper} from '../facade/promise';

export class XHRImpl extends XHR {
  get(url: string): Promise<string> {
    var completer: PromiseCompleter<string> = PromiseWrapper.completer();
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'text';

    xhr.onload = function() {
      // responseText is the old-school way of retrieving response (supported by IE8 & 9)
      // response/responseType properties were introduced in XHR Level2 spec (supported by IE10)
      var response = isPresent(xhr.response) ? xhr.response : xhr.responseText;

      // normalize IE9 bug (http://bugs.jquery.com/ticket/1450)
      var status = xhr.status === 1223 ? 204 : xhr.status;

      // fix status code when it is 0 (0 status is undocumented).
      // Occurs when accessing file resources or on Android 4.1 stock browser
      // while retrieving files from application cache.
      if (status === 0) {
        status = response ? 200 : 0;
      }

      if (200 <= status && status <= 300) {
        completer.resolve(response);
      } else {
        completer.reject(`Failed to load ${url}`, null);
      }
    };

    xhr.onerror = function() { completer.reject(`Failed to load ${url}`, null); };

    xhr.send();
    return completer.promise;
  }
}
