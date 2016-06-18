export {verifyNoBrowserErrors} from './e2e_util';

var benchpress = (global as any /** TODO #9100 */)['benchpress'];
var bind = benchpress.bind;
var Options = benchpress.Options;

export function runClickBenchmark(config: any /** TODO #9100 */) {
  browser.ignoreSynchronization = !config.waitForAngular2;
  var buttons =
      config.buttons.map(function(selector: any /** TODO #9100 */) { return $(selector); });
  config.work = function() {
    buttons.forEach(function(button: any /** TODO #9100 */) { button.click(); });
  };
  return runBenchmark(config);
}

export function runBenchmark(config: any /** TODO #9100 */) {
  return getScaleFactor(browser.params.benchmark.scaling).then(function(scaleFactor) {
    var description = {};
    var urlParams: any[] /** TODO #9100 */ = [];
    if (config.params) {
      config.params.forEach(function(param: any /** TODO #9100 */) {
        var name = param.name;
        var value = applyScaleFactor(param.value, scaleFactor, param.scale);
        urlParams.push(name + '=' + value);
        (description as any /** TODO #9100 */)[name] = value;
      });
    }
    var url = encodeURI(config.url + '?' + urlParams.join('&'));
    return browser.get(url).then(function() {
      return (global as any /** TODO #9100 */)['benchpressRunner'].sample({
        id: config.id,
        execute: config.work,
        prepare: config.prepare,
        microMetrics: config.microMetrics,
        providers: [{provide: Options.SAMPLE_DESCRIPTION, useValue: description}]
      });
    });
  });
}

function getScaleFactor(possibleScalings: any /** TODO #9100 */) {
  return browser.executeScript('return navigator.userAgent').then(function(userAgent: string) {
    var scaleFactor = 1;
    possibleScalings.forEach(function(entry: any /** TODO #9100 */) {
      if (userAgent.match(entry.userAgent)) {
        scaleFactor = entry.value;
      }
    });
    return scaleFactor;
  });
}

function applyScaleFactor(
    value: any /** TODO #9100 */, scaleFactor: any /** TODO #9100 */,
    method: any /** TODO #9100 */) {
  if (method === 'log2') {
    return value + Math.log(scaleFactor) / Math.LN2;
  } else if (method === 'sqrt') {
    return value * Math.sqrt(scaleFactor);
  } else if (method === 'linear') {
    return value * scaleFactor;
  } else {
    return value;
  }
}
