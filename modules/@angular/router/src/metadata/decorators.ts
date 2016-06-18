import {makeDecorator} from '../core_private';

import {RouteMetadata, RoutesMetadata} from './metadata';


/**
 * Defines routes for a given component.
 *
 * It takes an array of {@link RouteMetadata}s.
 */
export interface RoutesFactory {
  (routes: RouteMetadata[]): any;
  new (routes: RouteMetadata[]): RoutesMetadata;
}

/**
 * Defines routes for a given component.
 *
 * It takes an array of {@link RouteMetadata}s.
 * @Annotation
 */
export var Routes: RoutesFactory = <RoutesFactory>makeDecorator(RoutesMetadata);
