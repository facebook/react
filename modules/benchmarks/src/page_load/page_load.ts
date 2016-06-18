import {Component} from 'angular2/core';
import {bootstrap} from 'angular2/platform/browser';

@Component({selector: 'app', template: '<h1>Page Load Time</h1>'})
class App {
}

bootstrap(App).then(() => {
  (<any>window).loadTime = Date.now() - performance.timing.navigationStart;
  (<any>window).someConstant = 1234567890;
});
