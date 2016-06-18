'use strict';

describe('router', function () {

  var elt, testMod;
  beforeEach(function () {
    testMod = angular.module('testMod', ['ngComponentRouter'])
      .value('$routerRootComponent', 'app');
  });

  it('should work with a provided root component', function() {

    registerComponent('homeCmp', {
      template: 'Home'
    });

    registerComponent('app', {
      template: '<div ng-outlet></div>',
      $routeConfig: [
        { path: '/', component: 'homeCmp' }
      ]
    });

    module('testMod');
    compileApp();

    inject(function($location, $rootScope) {
      $location.path('/');
      $rootScope.$digest();
      expect(elt.text()).toBe('Home');
    });
  });

  it('should bind the component to the current router', function() {
    var router;
    registerComponent('homeCmp', {
      providers: { $router: '=' },
      controller: function($scope, $element) {
        this.$routerOnActivate = function() {
          router = this.$router;
        };
      },
      template: 'Home'
    });

    registerComponent('app', {
      template: '<div ng-outlet></div>',
      $routeConfig: [
        { path: '/', component: 'homeCmp' }
      ]
    });

    module('testMod');
    compileApp();

    inject(function($location, $rootScope) {
      $location.path('/');
      $rootScope.$digest();
      var homeElement = elt.find('home-cmp');
      expect(homeElement.text()).toBe('Home');
      expect(homeElement.isolateScope().$ctrl.$router).toBeDefined();
      expect(router).toBeDefined();
    })
  });

  it('should work when an async route is provided route data', function() {
    registerComponent('homeCmp', {
      template: 'Home ({{$ctrl.isAdmin}})',
      $routerOnActivate: function(next, prev) {
        this.isAdmin = next.routeData.data.isAdmin;
      }
    });

    registerComponent('app', {
      template: '<div ng-outlet></div>',
      $routeConfig: [
        { path: '/', loader: function($q) { return $q.when('homeCmp'); }, data: { isAdmin: true } }
      ]
    });

    module('testMod');
    compileApp();

    inject(function($location, $rootScope) {
      $location.path('/');
      $rootScope.$digest();
      expect(elt.text()).toBe('Home (true)');
    });
  });

  it('should work with a templateUrl component', function() {

    var $routerOnActivate = jasmine.createSpy('$routerOnActivate');

    registerComponent('homeCmp', {
      templateUrl: 'homeCmp.html',
      $routerOnActivate: $routerOnActivate
    });

    registerComponent('app', {
      template: '<div ng-outlet></div>',
      $routeConfig: [
        { path: '/', component: 'homeCmp' }
      ]
    });

    module('testMod');

    inject(function($location, $rootScope, $httpBackend) {

      $httpBackend.expectGET('homeCmp.html').respond('Home');

      compileApp();

      $location.path('/');
      $rootScope.$digest();
      $httpBackend.flush();
      var homeElement = elt.find('home-cmp');
      expect(homeElement.text()).toBe('Home');
      expect($routerOnActivate).toHaveBeenCalled();
    })
  });

  it('should provide the current instruction', function() {
    registerComponent('homeCmp', {
      template: 'Home ({{homeCmp.isAdmin}})'
    });

    registerComponent('app', {
      template: '<div ng-outlet></div>',
      $routeConfig: [
        { path: '/', component: 'homeCmp', name: 'Home' }
      ]
    });

    module('testMod');

    inject(function($rootScope, $rootRouter, $location) {
      compileApp();

      $location.path('/');
      $rootScope.$digest();
      var instruction = $rootRouter.generate(['/Home']);
      expect($rootRouter.currentInstruction).toEqual(instruction);
    });
  });

  it('should provide the root level router', function() {
    registerComponent('homeCmp', {
      template: 'Home ({{homeCmp.isAdmin}})',
      providers: {
        $router: '<'
      }
    });

    registerComponent('app', {
      template: '<div ng-outlet></div>',
      $routeConfig: [
        { path: '/', component: 'homeCmp', name: 'Home' }
      ]
    });

    module('testMod');

    inject(function($rootScope, $rootRouter, $location) {
      compileApp();

      $location.path('/');
      $rootScope.$digest();
      var homeElement = elt.find('home-cmp');
      expect(homeElement.isolateScope().$ctrl.$router.root).toEqual($rootRouter);
    });
  });

  function registerComponent(name, options) {

    var definition = {
      providers: options.providers,
      controller: getController(options)
    };
    if (options.template) definition.template = options.template;
    if (options.templateUrl) definition.templateUrl = options.templateUrl;

    applyStaticProperties(definition.controller, options);
    angular.module('testMod').component(name, definition);
  }

  function compileApp() {
    inject(function($compile, $rootScope) {
      elt = $compile('<div><app></app</div>')($rootScope);
      $rootScope.$digest();
    });
    return elt;
  }

  function getController(options) {
    var controller = options.controller || function () {};
    [
      '$routerOnActivate', '$routerOnDeactivate',
      '$routerOnReuse', '$routerCanReuse',
      '$routerCanDeactivate'
    ].forEach(function (hookName) {
      if (options[hookName]) {
        controller.prototype[hookName] = options[hookName];
      }
    });
    return controller;
  }

  function applyStaticProperties(target, options) {
    ['$canActivate', '$routeConfig'].forEach(function(property) {
      if (options[property]) {
        target[property] = options[property];
      }
    });
  }
});
