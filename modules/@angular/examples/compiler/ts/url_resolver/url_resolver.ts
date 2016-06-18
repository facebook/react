import {UrlResolver} from '@angular/compiler';
import {provide} from '@angular/core';
import {bootstrap} from '@angular/platform-browser-dynamic';

var MyApp: any;

// #docregion url_resolver
class MyUrlResolver extends UrlResolver {
  resolve(baseUrl: string, url: string): string {
    // Serve CSS files from a special CDN.
    if (url.substr(-4) === '.css') {
      return super.resolve('http://cdn.myapp.com/css/', url);
    }
    return super.resolve(baseUrl, url);
  }
}

bootstrap(MyApp, [{provide: UrlResolver, useClass: MyUrlResolver}]);
// #enddocregion
