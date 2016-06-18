/*
 * Helpers to keep tests DRY
 */

function componentTemplatePath(name) {
  return './components/' + dashCase(name) + '/' + dashCase(name) + '.html';
}

function componentControllerName(name) {
  return name[0].toUpperCase() + name.substr(1) + 'Controller';
}

function dashCase(str) {
  return str.replace(/([A-Z])/g, function ($1) {
    return '-' + $1.toLowerCase();
  });
}


function provideHelpers(fn, preInject) {
  return function () {
    var elt,
        $compile,
        $rootScope,
        $rootRouter,
        $templateCache,
        $controllerProvider;

    module('ng');
    module('ngNewRouter');
    module(function(_$controllerProvider_) {
      $controllerProvider = _$controllerProvider_;
    });

    inject(function(_$compile_, _$rootScope_, _$rootRouter_, _$templateCache_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $rootRouter = _$rootRouter_;
      $templateCache = _$templateCache_;
    });

    function registerComponent(name, template, config) {
      if (!template) {
        template = '';
      }
      var ctrl;
      if (!config) {
        ctrl = function () {};
      } else if (angular.isArray(config)) {
        ctrl = function () {};
        ctrl.$routeConfig = config;
      } else if (typeof config === 'function') {
        ctrl = config;
      } else {
        ctrl = function () {};
        ctrl.prototype = config;
      }
      $controllerProvider.register(componentControllerName(name), ctrl);
      put(name, template);
    }


    function put (name, template) {
      $templateCache.put(componentTemplatePath(name), [200, template, {}]);
    }

    function compile(template) {
      var elt = $compile('<div>' + template + '</div>')($rootScope);
      $rootScope.$digest();
      return elt;
    }

    fn({
      registerComponent: registerComponent,
      $rootRouter: $rootRouter,
      put: put,
      compile: compile
    })
  }
}
