import {ROUTER_PROVIDERS} from '@angular/router-deprecated';
import {WORKER_APP_LOCATION_PROVIDERS} from '@angular/platform-browser';
import {bootstrapWorkerApp} from '@angular/platform-browser-dynamic';

import {HashLocationStrategy, LocationStrategy} from '@angular/common';
import {App} from './index_common';

export function main() {
  bootstrapWorkerApp(App, [
    ROUTER_PROVIDERS,
    WORKER_APP_LOCATION_PROVIDERS,
    {provide: LocationStrategy, useClass: HashLocationStrategy}
  ]);
}
