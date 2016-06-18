/**
 * @module
 * @description
 * Maps application URLs into application states, to support deep-linking and navigation.
 */

export {RouterLink} from './src/directives/router_link';
export {RouterOutlet} from './src/directives/router_outlet';
export {RouteData, RouteParams} from './src/instruction';
export {ROUTER_PRIMARY_COMPONENT, RouteRegistry} from './src/route_registry';
export {RootRouter, Router} from './src/router';

export * from './src/route_config/route_config_decorator';
export * from './src/route_definition';
export {OnActivate, OnDeactivate, OnReuse, CanDeactivate, CanReuse} from './src/interfaces';
export {CanActivate} from './src/lifecycle/lifecycle_annotations';
export {Instruction, ComponentInstruction} from './src/instruction';
export {OpaqueToken} from '@angular/core';
export {ROUTER_PROVIDERS_COMMON} from './src/router_providers_common';
export {ROUTER_PROVIDERS, ROUTER_BINDINGS} from './src/router_providers';

import {RouterOutlet} from './src/directives/router_outlet';
import {RouterLink} from './src/directives/router_link';

/**
 * A list of directives. To use the router directives like {@link RouterOutlet} and
 * {@link RouterLink}, add this to your `directives` array in the {@link View} decorator of your
 * component.
 *
 * ### Example ([live demo](http://plnkr.co/edit/iRUP8B5OUbxCWQ3AcIDm))
 *
 * ```
 * import {Component} from '@angular/core';
 * import {ROUTER_DIRECTIVES, ROUTER_PROVIDERS, RouteConfig} from '@angular/router-deprecated';
 *
 * @Component({directives: [ROUTER_DIRECTIVES]})
 * @RouteConfig([
 *  {...},
 * ])
 * class AppCmp {
 *    // ...
 * }
 *
 * bootstrap(AppCmp, [ROUTER_PROVIDERS]);
 * ```
 */
export const ROUTER_DIRECTIVES: any[] = /*@ts2dart_const*/[RouterOutlet, RouterLink];
