import {ROUTER_PROVIDERS_COMMON} from './router_providers_common';

/**
 * A list of providers. To use the router, you must add this to your application.
 *
 * ```
 * import {Component} from '@angular/core';
 * import {
 *   ROUTER_DIRECTIVES,
 *   ROUTER_PROVIDERS,
 *   Routes
 * } from '@angular/router';
 *
 * @Component({directives: [ROUTER_DIRECTIVES]})
 * @Routes([
 *  {...},
 * ])
 * class AppCmp {
 *   // ...
 * }
 *
 * bootstrap(AppCmp, [ROUTER_PROVIDERS]);
 * ```
 */
// TODO: merge with router_providers_common.ts
export const ROUTER_PROVIDERS: any[] = /*@ts2dart_const*/[ROUTER_PROVIDERS_COMMON];
