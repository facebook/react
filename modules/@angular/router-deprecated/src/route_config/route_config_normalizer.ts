import {BaseException} from '../facade/exceptions';
import {Type, isType} from '../facade/lang';
import {ComponentDefinition} from '../route_definition';
import {RouteRegistry} from '../route_registry';

import {AsyncRoute, AuxRoute, Redirect, Route, RouteDefinition} from './route_config_decorator';



/**
 * Given a JS Object that represents a route config, returns a corresponding Route, AsyncRoute,
 * AuxRoute or Redirect object.
 *
 * Also wraps an AsyncRoute's loader function to add the loaded component's route config to the
 * `RouteRegistry`.
 */
export function normalizeRouteConfig(
    config: RouteDefinition, registry: RouteRegistry): RouteDefinition {
  if (config instanceof AsyncRoute) {
    var wrappedLoader = wrapLoaderToReconfigureRegistry(config.loader, registry);
    return new AsyncRoute({
      path: config.path,
      loader: wrappedLoader,
      name: config.name,
      data: config.data,
      useAsDefault: config.useAsDefault
    });
  }
  if (config instanceof Route || config instanceof Redirect || config instanceof AuxRoute) {
    return <RouteDefinition>config;
  }

  if ((+!!config.component) + (+!!config.redirectTo) + (+!!config.loader) != 1) {
    throw new BaseException(
        `Route config should contain exactly one "component", "loader", or "redirectTo" property.`);
  }

  if (config.loader) {
    var wrappedLoader = wrapLoaderToReconfigureRegistry(config.loader, registry);
    return new AsyncRoute({
      path: config.path,
      loader: wrappedLoader,
      name: config.name,
      data: config.data,
      useAsDefault: config.useAsDefault
    });
  }
  if (config.aux) {
    return new AuxRoute({path: config.aux, component: <Type>config.component, name: config.name});
  }
  if (config.component) {
    if (typeof config.component == 'object') {
      let componentDefinitionObject = <ComponentDefinition>config.component;
      if (componentDefinitionObject.type == 'constructor') {
        return new Route({
          path: config.path,
          component: <Type>componentDefinitionObject.constructor,
          name: config.name,
          data: config.data,
          useAsDefault: config.useAsDefault
        });
      } else if (componentDefinitionObject.type == 'loader') {
        return new AsyncRoute({
          path: config.path,
          loader: componentDefinitionObject.loader,
          name: config.name,
          data: config.data,
          useAsDefault: config.useAsDefault
        });
      } else {
        throw new BaseException(
            `Invalid component type "${componentDefinitionObject.type}". Valid types are "constructor" and "loader".`);
      }
    }
    return new Route(<{
      path: string;
      component: Type;
      name?: string;
      data?: {[key: string]: any};
      useAsDefault?: boolean;
    }>config);
  }

  if (config.redirectTo) {
    return new Redirect({path: config.path, redirectTo: config.redirectTo});
  }

  return config;
}


function wrapLoaderToReconfigureRegistry(loader: Function, registry: RouteRegistry): () =>
    Promise<Type> {
  return () => {
    return loader().then((componentType: any /** TODO #9100 */) => {
      registry.configFromComponent(componentType);
      return componentType;
    });
  };
}

export function assertComponentExists(component: Type, path: string): void {
  if (!isType(component)) {
    throw new BaseException(`Component for route "${path}" is not defined, or is not a class.`);
  }
}
