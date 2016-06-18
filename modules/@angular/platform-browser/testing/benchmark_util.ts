import {BrowserDomAdapter} from '../src/browser/browser_adapter';
import {document, window} from '../src/facade/browser';
import {BaseException} from '../src/facade/exceptions';
import {NumberWrapper, isBlank} from '../src/facade/lang';

var DOM = new BrowserDomAdapter();

export function getIntParameter(name: string) {
  return NumberWrapper.parseInt(getStringParameter(name), 10);
}

export function getStringParameter(name: string) {
  var els = DOM.querySelectorAll(document, `input[name="${name}"]`);
  var value: any /** TODO #9100 */;
  var el: any /** TODO #9100 */;

  for (var i = 0; i < els.length; i++) {
    el = els[i];
    var type = DOM.type(el);
    if ((type != 'radio' && type != 'checkbox') || DOM.getChecked(el)) {
      value = DOM.getValue(el);
      break;
    }
  }

  if (isBlank(value)) {
    throw new BaseException(`Could not find and input field with name ${name}`);
  }

  return value;
}

export function bindAction(selector: string, callback: Function) {
  var el = DOM.querySelector(document, selector);
  DOM.on(el, 'click', function(_: any /** TODO #9100 */) { callback(); });
}

export function microBenchmark(
    name: any /** TODO #9100 */, iterationCount: any /** TODO #9100 */,
    callback: any /** TODO #9100 */) {
  var durationName = `${name}/${iterationCount}`;
  window.console.time(durationName);
  callback();
  window.console.timeEnd(durationName);
}

export function windowProfile(name: string): void {
  (<any>window.console).profile(name);
}

export function windowProfileEnd(name: string): void {
  (<any>window.console).profileEnd(name);
}
