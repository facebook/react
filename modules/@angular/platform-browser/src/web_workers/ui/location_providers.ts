import {APP_INITIALIZER, Injector, NgZone} from '@angular/core';

import {BrowserPlatformLocation} from '../../browser/location/browser_platform_location';

import {MessageBasedPlatformLocation} from './platform_location';


/**
 * A list of {@link Provider}s. To use the router in a Worker enabled application you must
 * include these providers when setting up the render thread.
 * @experimental
 */
export const WORKER_UI_LOCATION_PROVIDERS = [
  MessageBasedPlatformLocation, BrowserPlatformLocation,
  {provide: APP_INITIALIZER, useFactory: initUiLocation, multi: true, deps: [Injector]}
];

function initUiLocation(injector: Injector): () => void {
  return () => {
    let zone = injector.get(NgZone);

    zone.runGuarded(() => injector.get(MessageBasedPlatformLocation).start());
  };
}
