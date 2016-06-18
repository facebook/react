import {makeDecorator} from '../../core_private';

import {RouteConfig as RouteConfigAnnotation, RouteDefinition} from './route_config_impl';

export {AsyncRoute, AuxRoute, Redirect, Route, RouteDefinition} from './route_config_impl';


// Copied from RouteConfig in route_config_impl.
/**
 * The `RouteConfig` decorator defines routes for a given component.
 *
 * It takes an array of {@link RouteDefinition}s.
 * @Annotation
 */
export var RouteConfig: (configs: RouteDefinition[]) => ClassDecorator =
    makeDecorator(RouteConfigAnnotation);
