import {InboxApp} from './app/inbox-app';
import {bootstrap} from '@angular/platform-browser-dynamic';
import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {ROUTER_PROVIDERS} from '@angular/router-deprecated';

export function main() {
  bootstrap(InboxApp,
            [ROUTER_PROVIDERS, {provide: LocationStrategy, useClass: HashLocationStrategy}]);
}
