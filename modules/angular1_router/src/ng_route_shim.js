/** @license Copyright 2014-2016 Google, Inc. http://github.com/angular/angular/LICENSE */
(function () {

  'use strict';

  // keep a reference to compileProvider so we can register new component-directives
  // on-the-fly based on $routeProvider configuration
  // TODO: remove this– right now you can only bootstrap one Angular app with this hack
  var $compileProvider, $q, $injector;

  /**
   * This module loads services that mimic ngRoute's configuration, and includes
   * an anchor link directive that intercepts clicks to routing.
   *
   * This module is intended to be used as a stop-gap solution for projects upgrading from ngRoute.
   * It intentionally does not implement all features of ngRoute.
   */
  angular.module('ngRouteShim', [])
    .provider('$route', $RouteProvider)
    .config(['$compileProvider', function (compileProvider) {
      $compileProvider = compileProvider;
    }])
    .factory('$routeParams', $routeParamsFactory)
    .directive('a', anchorLinkDirective)

    // Connects the legacy $routeProvider config shim to Component Router's config.
    .run(['$route', '$rootRouter', function ($route, $rootRouter) {
      $route.$$subscribe(function (routeDefinition) {
        if (!angular.isArray(routeDefinition)) {
          routeDefinition = [routeDefinition];
        }
        $rootRouter.config(routeDefinition);
      });
    }]);


  /**
   * A shimmed out provider that provides the same API as ngRoute's $routeProvider, but uses these calls
   * to configure Component Router.
   */
  function $RouteProvider() {

    var routes = [];
    var subscriptionFn = null;

    var routeMap = {};

    // Stats for which routes are skipped
    var skipCount = 0;
    var successCount = 0;
    var allCount = 0;

    function consoleMetrics() {
      return '(' + skipCount + ' skipped / ' + successCount + ' success / ' + allCount + ' total)';
    }


    /**
     * @ngdoc method
     * @name $routeProvider#when
     *
     * @param {string} path Route path (matched against `$location.path`). If `$location.path`
     *    contains redundant trailing slash or is missing one, the route will still match and the
     *    `$location.path` will be updated to add or drop the trailing slash to exactly match the
     *    route definition.
     *
     * @param {Object} route Mapping information to be assigned to `$route.current` on route
     *    match.
     */
    this.when = function(path, route) {
      //copy original route object to preserve params inherited from proto chain
      var routeCopy = angular.copy(route);

      allCount++;

      if (angular.isDefined(routeCopy.reloadOnSearch)) {
        console.warn('Route for "' + path + '" uses "reloadOnSearch" which is not implemented.');
      }
      if (angular.isDefined(routeCopy.caseInsensitiveMatch)) {
        console.warn('Route for "' + path + '" uses "caseInsensitiveMatch" which is not implemented.');
      }

      // use new wildcard format
      path = reformatWildcardParams(path);

      if (path[path.length - 1] == '*') {
        skipCount++;
        console.warn('Route for "' + path + '" ignored because it ends with *. Skipping.', consoleMetrics());
        return this;
      }

      if (path.indexOf('?') > -1) {
        skipCount++;
        console.warn('Route for "' + path + '" ignored because it has optional parameters. Skipping.', consoleMetrics());
        return this;
      }

      if (typeof route.redirectTo == 'function') {
        skipCount++;
        console.warn('Route for "' + path + '" ignored because lazy redirecting to a function is not yet implemented. Skipping.', consoleMetrics());
        return this;
      }


      var routeDefinition = {
        path: path,
        data: routeCopy
      };

      routeMap[path] = routeCopy;

      if (route.redirectTo) {
        routeDefinition.redirectTo = [routeMap[route.redirectTo].name];
      } else {
        if (routeCopy.controller && !routeCopy.controllerAs) {
          console.warn('Route for "' + path + '" should use "controllerAs".');
        }

        var componentName = routeObjToRouteName(routeCopy, path);

        if (!componentName) {
          throw new Error('Could not determine a name for route "' + path + '".');
        }

        routeDefinition.component = componentName;
        routeDefinition.name = route.name || upperCase(componentName);

        var directiveController = routeCopy.controller;

        var componentDefinition = {
          controller: directiveController,
          controllerAs: routeCopy.controllerAs

        };
        if (routeCopy.templateUrl) componentDefinition.templateUrl = routeCopy.templateUrl;
        if (routeCopy.template) componentDefinition.template = routeCopy.template;


        // if we have route resolve options, prepare a wrapper controller
        if (directiveController && routeCopy.resolve) {
          var originalController = directiveController;
          var resolvedLocals = {};

          componentDefinition.controller = ['$injector', '$scope', function ($injector, $scope) {
            var locals = angular.extend({
              $scope: $scope
            }, resolvedLocals);

            return $injector.instantiate(originalController, locals);
          }];

          // we resolve the locals in a canActivate block
          componentDefinition.controller.$canActivate = function() {
            var locals = angular.extend({}, routeCopy.resolve);

            angular.forEach(locals, function(value, key) {
              locals[key] = angular.isString(value) ?
                $injector.get(value) : $injector.invoke(value, null, null, key);
            });

            return $q.all(locals).then(function (locals) {
              resolvedLocals = locals;
            }).then(function () {
              return true;
            });
          };
        }

        // register the dynamically created directive
        $compileProvider.component(componentName, componentDefinition);
      }
      if (subscriptionFn) {
        subscriptionFn(routeDefinition);
      } else {
        routes.push(routeDefinition);
      }
      successCount++;

      return this;
    };

    this.otherwise = function(params) {
      if (typeof params === 'string') {
        params = {redirectTo: params};
      }
      this.when('/*rest', params);
      return this;
    };


    this.$get = ['$q', '$injector', function (q, injector) {
      $q = q;
      $injector = injector;

      var $route = {
        routes: routeMap,

        /**
         * @ngdoc method
         * @name $route#reload
         *
         * @description
         * Causes `$route` service to reload the current route even if
         * {@link ng.$location $location} hasn't changed.
         */
        reload: function() {
          throw new Error('Not implemented: $route.reload');
        },

        /**
         * @ngdoc method
         * @name $route#updateParams
         */
        updateParams: function(newParams) {
          throw new Error('Not implemented: $route.updateParams');
        },

        /**
         * Runs the given `fn` whenever new configs are added.
         * Only one subscription is allowed.
         * Passed `fn` is called synchronously.
         */
        $$subscribe: function(fn) {
          if (subscriptionFn) {
            throw new Error('only one subscription allowed');
          }
          subscriptionFn = fn;
          subscriptionFn(routes);
          routes = [];
        },

        /**
         * Runs a string with stats about many route configs were adapted, and how many were
         * dropped because they are incompatible.
         */
        $$getStats: consoleMetrics
      };

      return $route;
    }];

  }

  function $routeParamsFactory($rootRouter, $rootScope) {
    // the identity of this object cannot change
    var paramsObj = {};

    $rootScope.$on('$routeChangeSuccess', function () {
      var newParams = $rootRouter.currentInstruction && $rootRouter.currentInstruction.component.params;

      angular.forEach(paramsObj, function (val, name) {
        delete paramsObj[name];
      });
      angular.forEach(newParams, function (val, name) {
        paramsObj[name] = val;
      });
    });

    return paramsObj;
  }

  /**
   * Allows normal anchor links to kick off routing.
   */
  function anchorLinkDirective($rootRouter) {
    return {
      restrict: 'E',
      link: function (scope, element) {
        // If the linked element is not an anchor tag anymore, do nothing
        if (element[0].nodeName.toLowerCase() !== 'a') {
          return;
        }

        // SVGAElement does not use the href attribute, but rather the 'xlinkHref' attribute.
        var hrefAttrName = Object.prototype.toString.call(element.prop('href')) === '[object SVGAnimatedString]' ?
          'xlink:href' : 'href';

        element.on('click', function (event) {
          if (event.which !== 1) {
            return;
          }

          var href = element.attr(hrefAttrName);
          var target = element.attr('target');
          var isExternal = (['_blank', '_parent', '_self', '_top'].indexOf(target) > -1);          
          
          if (href && $rootRouter.recognize(href) && !isExternal) {
            $rootRouter.navigateByUrl(href);
            event.preventDefault();
          }
        });
      }
    };
  }

  /**
   * Given a route object, attempts to find a unique directive name.
   *
   * @param route – route config object passed to $routeProvider.when
   * @param path – route configuration path
   * @returns {string|name} – a normalized (camelCase) directive name
   */
  function routeObjToRouteName(route, path) {
    var name = route.controllerAs;

    var controller = route.controller;
    if (!name && controller) {
      if (angular.isArray(controller)) {
        controller = controller[controller.length - 1];
      }
      name = controller.name;
    }

    if (!name) {
      var segments = path.split('/');
      name = segments[segments.length - 1];
    }

    if (name) {
      name = name + 'AutoCmp';
    }

    return name;
  }

  function upperCase(str) {
    return str.charAt(0).toUpperCase() + str.substr(1);
  }

  /*
   * Changes "/:foo*" to "/*foo"
   */
  var WILDCARD_PARAM_RE = new RegExp('\\/:([a-z0-9]+)\\*', 'gi');
  function reformatWildcardParams(path) {
    return path.replace(WILDCARD_PARAM_RE, function (m, m1) {
      return '/*' + m1;
    });
  }

}());
