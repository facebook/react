import {PromiseWrapper} from '../facade/async';
import {Map} from '../facade/collection';
import {BaseException} from '../facade/exceptions';
import {isBlank, isFunction, isPresent} from '../facade/lang';
import {ComponentInstruction} from '../instruction';
import {AsyncRoute, AuxRoute, Redirect, Route, RouteDefinition} from '../route_config/route_config_impl';
import {Url} from '../url_parser';

import {AsyncRouteHandler} from './route_handlers/async_route_handler';
import {SyncRouteHandler} from './route_handlers/sync_route_handler';
import {ParamRoutePath} from './route_paths/param_route_path';
import {RegexRoutePath} from './route_paths/regex_route_path';
import {RoutePath} from './route_paths/route_path';
import {AbstractRule, PathMatch, RedirectRule, RouteMatch, RouteRule} from './rules';



/**
 * A `RuleSet` is responsible for recognizing routes for a particular component.
 * It is consumed by `RouteRegistry`, which knows how to recognize an entire hierarchy of
 * components.
 */
export class RuleSet {
  rulesByName = new Map<string, RouteRule>();

  // map from name to rule
  auxRulesByName = new Map<string, RouteRule>();

  // map from starting path to rule
  auxRulesByPath = new Map<string, RouteRule>();

  // TODO: optimize this into a trie
  rules: AbstractRule[] = [];

  // the rule to use automatically when recognizing or generating from this rule set
  defaultRule: RouteRule = null;

  /**
   * Configure additional rules in this rule set from a route definition
   * @returns {boolean} true if the config is terminal
   */
  config(config: RouteDefinition): boolean {
    let handler: any /** TODO #9100 */;

    if (isPresent(config.name) && config.name[0].toUpperCase() != config.name[0]) {
      let suggestedName = config.name[0].toUpperCase() + config.name.substring(1);
      throw new BaseException(
          `Route "${config.path}" with name "${config.name}" does not begin with an uppercase letter. Route names should be PascalCase like "${suggestedName}".`);
    }

    if (config instanceof AuxRoute) {
      handler = new SyncRouteHandler(config.component, config.data);
      let routePath = this._getRoutePath(config);
      let auxRule = new RouteRule(routePath, handler, config.name);
      this.auxRulesByPath.set(routePath.toString(), auxRule);
      if (isPresent(config.name)) {
        this.auxRulesByName.set(config.name, auxRule);
      }
      return auxRule.terminal;
    }

    let useAsDefault = false;

    if (config instanceof Redirect) {
      let routePath = this._getRoutePath(config);
      let redirector = new RedirectRule(routePath, config.redirectTo);
      this._assertNoHashCollision(redirector.hash, config.path);
      this.rules.push(redirector);
      return true;
    }

    if (config instanceof Route) {
      handler = new SyncRouteHandler(config.component, config.data);
      useAsDefault = isPresent(config.useAsDefault) && config.useAsDefault;
    } else if (config instanceof AsyncRoute) {
      handler = new AsyncRouteHandler(config.loader, config.data);
      useAsDefault = isPresent(config.useAsDefault) && config.useAsDefault;
    }
    let routePath = this._getRoutePath(config);
    let newRule = new RouteRule(routePath, handler, config.name);

    this._assertNoHashCollision(newRule.hash, config.path);

    if (useAsDefault) {
      if (isPresent(this.defaultRule)) {
        throw new BaseException(`Only one route can be default`);
      }
      this.defaultRule = newRule;
    }

    this.rules.push(newRule);
    if (isPresent(config.name)) {
      this.rulesByName.set(config.name, newRule);
    }
    return newRule.terminal;
  }


  /**
   * Given a URL, returns a list of `RouteMatch`es, which are partial recognitions for some route.
   */
  recognize(urlParse: Url): Promise<RouteMatch>[] {
    var solutions: any[] /** TODO #9100 */ = [];

    this.rules.forEach((routeRecognizer: AbstractRule) => {
      var pathMatch = routeRecognizer.recognize(urlParse);

      if (isPresent(pathMatch)) {
        solutions.push(pathMatch);
      }
    });

    // handle cases where we are routing just to an aux route
    if (solutions.length == 0 && isPresent(urlParse) && urlParse.auxiliary.length > 0) {
      return [PromiseWrapper.resolve(new PathMatch(null, null, urlParse.auxiliary))];
    }

    return solutions;
  }

  recognizeAuxiliary(urlParse: Url): Promise<RouteMatch>[] {
    var routeRecognizer: RouteRule = this.auxRulesByPath.get(urlParse.path);
    if (isPresent(routeRecognizer)) {
      return [routeRecognizer.recognize(urlParse)];
    }

    return [PromiseWrapper.resolve(null)];
  }

  hasRoute(name: string): boolean { return this.rulesByName.has(name); }

  componentLoaded(name: string): boolean {
    return this.hasRoute(name) && isPresent(this.rulesByName.get(name).handler.componentType);
  }

  loadComponent(name: string): Promise<any> {
    return this.rulesByName.get(name).handler.resolveComponentType();
  }

  generate(name: string, params: any): ComponentInstruction {
    var rule: RouteRule = this.rulesByName.get(name);
    if (isBlank(rule)) {
      return null;
    }
    return rule.generate(params);
  }

  generateAuxiliary(name: string, params: any): ComponentInstruction {
    var rule: RouteRule = this.auxRulesByName.get(name);
    if (isBlank(rule)) {
      return null;
    }
    return rule.generate(params);
  }

  private _assertNoHashCollision(hash: string, path: any /** TODO #9100 */) {
    this.rules.forEach((rule) => {
      if (hash == rule.hash) {
        throw new BaseException(
            `Configuration '${path}' conflicts with existing route '${rule.path}'`);
      }
    });
  }

  private _getRoutePath(config: RouteDefinition): RoutePath {
    if (isPresent(config.regex)) {
      if (isFunction(config.serializer)) {
        return new RegexRoutePath(config.regex, config.serializer, config.regex_group_names);
      } else {
        throw new BaseException(
            `Route provides a regex property, '${config.regex}', but no serializer property`);
      }
    }
    if (isPresent(config.path)) {
      // Auxiliary routes do not have a slash at the start
      let path = (config instanceof AuxRoute && config.path.startsWith('/')) ?
          config.path.substring(1) :
          config.path;
      return new ParamRoutePath(path);
    }
    throw new BaseException('Route must provide either a path or regex property');
  }
}
