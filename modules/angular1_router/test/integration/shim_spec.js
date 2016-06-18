'use strict';

describe('ngRoute shim', function () {

  var elt,
    $compile,
    $rootScope,
    $rootRouter,
    $compileProvider,
    $routeProvider;

  beforeEach(function () {
    module('ng');
    module('ngComponentRouter');
    module('ngRouteShim');
    module(function (_$compileProvider_, _$routeProvider_) {
      $compileProvider = _$compileProvider_;
      $routeProvider = _$routeProvider_;
    });

    inject(function (_$compile_, _$rootScope_, _$rootRouter_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $rootRouter = _$rootRouter_;
    });
  });

  it('should work in a simple case', function () {
    $routeProvider.when('/', {
      controller: function OneController() {
        this.number = 'one';
      },
      controllerAs: 'oneCmp',
      template: '{{oneCmp.number}}'
    });

    compile('<ng-outlet></ng-outlet>');

    $rootRouter.navigateByUrl('/');
    $rootScope.$digest();

    expect(elt.text()).toBe('one');
  });

  it('should adapt routes with templateUrl', inject(function ($templateCache) {
    $routeProvider.when('/', {
      controller: function OneController() {
        this.number = 'one';
      },
      controllerAs: 'oneCmp',
      templateUrl: '/foo'
    });

    $templateCache.put('/foo', [200, '{{oneCmp.number}}', {}]);

    compile('root {<ng-outlet></ng-outlet>}');

    $rootRouter.navigateByUrl('/');
    $rootScope.$digest();
    expect(elt.text()).toBe('root {one}');
  }));

  it('should adapt routes using the "resolve" option', inject(function ($q) {
    $routeProvider.when('/', {
      controller: function TestController(resolvedService) {
        this.resolvedValue = resolvedService;
      },
      controllerAs: 'testCmp',
      resolve: {
        resolvedService: function () {
          return $q.when(42);
        }
      },
      template: 'value: {{testCmp.resolvedValue}}'
    });

    compile('<ng-outlet></ng-outlet>');

    $rootRouter.navigateByUrl('/');
    $rootScope.$digest();

    expect(elt.text()).toBe('value: 42');
  }));

  it('should adapt routes with params', function () {
    $routeProvider.when('/user/:name', {
      controller: function UserController($routeParams) {
        this.$routeParams = $routeParams;
      },
      controllerAs: 'userCmp',
      template: 'hello {{userCmp.$routeParams.name}}'
    });
    $rootScope.$digest();

    compile('<ng-outlet></ng-outlet>');

    $rootRouter.navigateByUrl('/user/brian');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello brian');

    $rootRouter.navigateByUrl('/user/igor');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello igor');
  });

  it('should adapt routes with wildcard params', function () {
    $routeProvider.when('/home/:params*', {
      controller: function UserController($routeParams) {
        this.$routeParams = $routeParams;
      },
      controllerAs: 'homeCmp',
      template: 'rest: {{homeCmp.$routeParams.params}}'
    });
    $rootScope.$digest();

    compile('<ng-outlet></ng-outlet>');

    $rootRouter.navigateByUrl('/home/foo/bar/123');
    $rootScope.$digest();
    expect(elt.text()).toBe('rest: foo/bar/123');
  });

  it('should warn about and ignore routes with optional params', function () {
    spyOn(console, 'warn');
    $routeProvider.when('/home/:params?', {
      template: 'home'
    });
    $rootScope.$digest();

    compile('root {<ng-outlet></ng-outlet>}');

    $rootRouter.navigateByUrl('/home/test');
    $rootScope.$digest();
    expect(elt.text()).toBe('root {}');
    expect(console.warn)
        .toHaveBeenCalledWith('Route for "/home/:params?" ignored because it has optional parameters. Skipping.',
                              '(1 skipped / 0 success / 1 total)');
  });

  it('should adapt routes with redirects', inject(function ($location) {
    $routeProvider
        .when('/home', {
          template: 'welcome home!',
          name: 'Home'
        })
        .when('/', {
          redirectTo: '/home'
        });
    $rootScope.$digest();

    compile('root {<ng-outlet></ng-outlet>}');

    $rootRouter.navigateByUrl('/');
    $rootScope.$digest();
    expect(elt.text()).toBe('root {welcome home!}');
    expect($location.path()).toBe('/home');
  }));

  //TODO: this is broken in recognition. un-xit this when https://github.com/angular/angular/issues/4133 is fixed
  xit('should adapt "otherwise" routes', inject(function ($location) {
    $routeProvider
      .when('/home', {
        template: 'welcome home!'
      })
      .otherwise({
        redirectTo: '/home'
      });
    $rootScope.$digest();

    compile('root {<ng-outlet></ng-outlet>}');

    $rootRouter.navigateByUrl('/somewhere');
    $rootScope.$digest();
    expect(elt.text()).toBe('root {welcome home!}');
    expect($location.path()).toBe('/home');
  }));

  function compile(template) {
    elt = $compile('<div>' + template + '</div>')($rootScope);
    $rootScope.$digest();
    return elt;
  }
});
