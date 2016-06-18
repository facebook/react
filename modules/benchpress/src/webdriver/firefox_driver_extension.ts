import {isPresent, StringWrapper} from '@angular/facade';
import {WebDriverExtension, PerfLogFeatures} from '../web_driver_extension';
import {WebDriverAdapter} from '../web_driver_adapter';

export class FirefoxDriverExtension extends WebDriverExtension {
  static get PROVIDERS(): any[] { return _PROVIDERS; }

  private _profilerStarted: boolean;

  constructor(private _driver: WebDriverAdapter) {
    super();
    this._profilerStarted = false;
  }

  gc() { return this._driver.executeScript('window.forceGC()'); }

  timeBegin(name: string): Promise<any> {
    if (!this._profilerStarted) {
      this._profilerStarted = true;
      this._driver.executeScript('window.startProfiler();');
    }
    return this._driver.executeScript('window.markStart("' + name + '");');
  }

  timeEnd(name: string, restartName: string = null): Promise<any> {
    var script = 'window.markEnd("' + name + '");';
    if (isPresent(restartName)) {
      script += 'window.markStart("' + restartName + '");';
    }
    return this._driver.executeScript(script);
  }

  readPerfLog(): Promise<any> {
    return this._driver.executeAsyncScript('var cb = arguments[0]; window.getProfile(cb);');
  }

  perfLogFeatures(): PerfLogFeatures { return new PerfLogFeatures({render: true, gc: true}); }

  supports(capabilities: {[key: string]: any}): boolean {
    return StringWrapper.equals(capabilities['browserName'].toLowerCase(), 'firefox');
  }
}

var _PROVIDERS = [
  {
    provide: FirefoxDriverExtension,
    useFactory: (driver) => new FirefoxDriverExtension(driver),
    deps: [WebDriverAdapter]
  }
];
