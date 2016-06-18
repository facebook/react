import {RouterLink} from './router_link';
import {RouterOutlet} from './router_outlet';

/**
 * A list of directives. To use the router directives like {@link RouterOutlet} and
 * {@link RouterLink}, add this to your `directives` array in the {@link View} decorator of your
 * component.
 *
 * ```
 * import {Component} from '@angular/core';
 * import {ROUTER_DIRECTIVES, Routes} from '@angular/router';
 *
 * @Component({directives: [ROUTER_DIRECTIVES]})
 * @Routes([
 *  {...},
 * ])
 * class AppCmp {
 *    // ...
 * }
 *
 * bootstrap(AppCmp);
 * ```
 */

export const ROUTER_DIRECTIVES: any[] = /*@ts2dart_const*/[RouterOutlet, RouterLink];
