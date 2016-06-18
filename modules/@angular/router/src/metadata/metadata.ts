import {Type} from '@angular/core';
import {stringify} from '../facade/lang';

/**
 * Information about a route.
 *
 * It has the following properties:
 * - `path` is a string that uses the route matcher DSL.
 * - `component` a component type.
 *
 * ### Example
 * ```
 * import {Routes} from '@angular/router';
 *
 * @Routes([
 *   {path: '/home', component: HomeCmp}
 * ])
 * class MyApp {}
 * ```
 *
 * @ts2dart_const
 */
export abstract class RouteMetadata {
  abstract get path(): string;
  abstract get component(): Type|string;
}

/**
 * See {@link RouteMetadata} for more information.
 * @ts2dart_const
 */
export class Route implements RouteMetadata {
  path: string;
  component: Type|string;
  constructor({path, component}: {path?: string, component?: Type|string} = {}) {
    this.path = path;
    this.component = component;
  }
  toString(): string { return `@Route(${this.path}, ${stringify(this.component)})`; }
}

/**
 * Defines routes for a given component.
 *
 * It takes an array of {@link RouteMetadata}s.
 * @ts2dart_const
 */
export class RoutesMetadata {
  constructor(public routes: RouteMetadata[]) {}
  toString(): string { return `@Routes(${this.routes})`; }
}
