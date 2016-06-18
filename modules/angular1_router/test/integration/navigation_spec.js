'use strict';

describe('navigation', function () {

  var elt,
      $compile,
      $rootScope,
      $rootRouter,
      $compileProvider;

  beforeEach(function () {
    module('ng');
    module('ngComponentRouter');
    module(function (_$compileProvider_) {
      $compileProvider = _$compileProvider_;
    });

    inject(function (_$compile_, _$rootScope_, _$rootRouter_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $rootRouter = _$rootRouter_;
    });

    registerDirective('userCmp', {
      template: '<div>hello {{userCmp.$routeParams.name}}</div>',
      $routerOnActivate: function(next) {
        this.$routeParams = next.params;
      }
    });
    registerDirective('oneCmp', {
      template: '<div>{{oneCmp.number}}</div>',
      controller: function () {this.number = 'one'}
    });
    registerDirective('twoCmp', {
      template: '<div>{{twoCmp.number}}</div>',
      controller: function () {this.number = 'two'}
    });
    registerComponent('threeCmp', {
      template: '<div>{{$ctrl.number}}</div>',
      controller: function () {this.number = 'three'}
    });
    registerComponent('getParams', {
      template: '<div>{{$ctrl.params.x}}</div>',
      controller: function () {
        this.$routerOnActivate = function(next) {
          this.params = next.params;
        };
      }
    })
  });

  it('should work in a simple case', function () {
    compile('<ng-outlet></ng-outlet>');

    $rootRouter.config([
      { path: '/', component: 'oneCmp' }
    ]);

    $rootRouter.navigateByUrl('/');
    $rootScope.$digest();

    expect(elt.text()).toBe('one');
  });


  it('should work with components created by the `mod.component()` helper', function () {
    compile('<ng-outlet></ng-outlet>');

    $rootRouter.config([
      { path: '/', component: 'threeCmp' }
    ]);

    $rootRouter.navigateByUrl('/');
    $rootScope.$digest();

    expect(elt.text()).toBe('three');
  });


  it('should navigate between components with different parameters', function () {
    $rootRouter.config([
      { path: '/user/:name', component: 'userCmp' }
    ]);
    compile('<ng-outlet></ng-outlet>');

    $rootRouter.navigateByUrl('/user/brian');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello brian');

    $rootRouter.navigateByUrl('/user/igor');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello igor');
  });


  it('should reuse a parent when navigating between child components with different parameters', function () {
    var instanceCount = 0;
    function ParentController() {
      instanceCount += 1;
    }
    registerDirective('parentCmp', {
      template: 'parent { <ng-outlet></ng-outlet> }',
      $routeConfig: [
        { path: '/user/:name', component: 'userCmp' }
      ],
      controller: ParentController
    });

    $rootRouter.config([
      { path: '/parent/...', component: 'parentCmp' }
    ]);
    compile('<ng-outlet></ng-outlet>');

    $rootRouter.navigateByUrl('/parent/user/brian');
    $rootScope.$digest();
    expect(instanceCount).toBe(1);
    expect(elt.text()).toBe('parent { hello brian }');

    $rootRouter.navigateByUrl('/parent/user/igor');
    $rootScope.$digest();
    expect(instanceCount).toBe(1);
    expect(elt.text()).toBe('parent { hello igor }');
  });


  it('should work with nested outlets', function () {
    registerDirective('childCmp', {
      template: '<div>inner { <div ng-outlet></div> }</div>',
      $routeConfig: [
        { path: '/b', component: 'oneCmp' }
      ]
    });

    $rootRouter.config([
      { path: '/a/...', component: 'childCmp' }
    ]);
    compile('<div>outer { <div ng-outlet></div> }</div>');

    $rootRouter.navigateByUrl('/a/b');
    $rootScope.$digest();

    expect(elt.text()).toBe('outer { inner { one } }');
  });

  it('should work when parent route has empty path', inject(function ($location) {
    registerComponent('childCmp', {
      template: '<div>inner { <div ng-outlet></div> }</div>',
      $routeConfig: [
        { path: '/b', component: 'oneCmp' }
      ]
    });

    $rootRouter.config([
      { path: '/...', component: 'childCmp' }
    ]);
    compile('<div>outer { <div ng-outlet></div> }</div>');

    $rootRouter.navigateByUrl('/b');
    $rootScope.$digest();

    expect(elt.text()).toBe('outer { inner { one } }');
    expect($location.path()).toBe('/b');
  }));


  it('should work with recursive nested outlets', function () {
    registerDirective('recurCmp', {
      template: '<div>recur { <div ng-outlet></div> }</div>',
      $routeConfig: [
        { path: '/recur', component: 'recurCmp' },
        { path: '/end', component: 'oneCmp' }
      ]});

    $rootRouter.config([
      { path: '/recur', component: 'recurCmp' },
      { path: '/', component: 'oneCmp' }
    ]);

    compile('<div>root { <div ng-outlet></div> }</div>');
    $rootRouter.navigateByUrl('/recur/recur/end');
    $rootScope.$digest();
    expect(elt.text()).toBe('root { one }');
  });


  it('should change location path', inject(function ($location) {
    $rootRouter.config([
      { path: '/user', component: 'userCmp' }
    ]);

    compile('<div ng-outlet></div>');

    $rootRouter.navigateByUrl('/user');
    $rootScope.$digest();

    expect($location.path()).toBe('/user');
  }));


  it('should pass through query terms to the location', inject(function ($location) {
    $rootRouter.config([
      { path: '/user', component: 'userCmp' }
    ]);

    compile('<div ng-outlet></div>');

    $rootRouter.navigateByUrl('/user?x=y');
    $rootScope.$digest();

    expect($location.path()).toBe('/user');
    expect($location.search()).toEqual({ x: 'y'});
  }));


  it('should change location to the canonical route', inject(function ($location) {
    compile('<div ng-outlet></div>');

    $rootRouter.config([
      { path: '/',     redirectTo: ['/User'] },
      { path: '/user', component:  'userCmp', name: 'User' }
    ]);

    $rootRouter.navigateByUrl('/');
    $rootScope.$digest();

    expect($location.path()).toBe('/user');
  }));


  it('should change location to the canonical route with nested components', inject(function ($location) {
    registerDirective('childRouter', {
      template: '<div>inner { <div ng-outlet></div> }</div>',
      $routeConfig: [
        { path: '/new-child', component: 'oneCmp', name: 'NewChild'},
        { path: '/new-child-two', component: 'twoCmp', name: 'NewChildTwo'}
      ]
    });

    $rootRouter.config([
      { path: '/old-parent/old-child', redirectTo: ['/NewParent', 'NewChild'] },
      { path: '/old-parent/old-child-two', redirectTo: ['/NewParent', 'NewChildTwo'] },
      { path: '/new-parent/...', component:  'childRouter', name: 'NewParent' }
    ]);

    compile('<div ng-outlet></div>');

    $rootRouter.navigateByUrl('/old-parent/old-child');
    $rootScope.$digest();

    expect($location.path()).toBe('/new-parent/new-child');
    expect(elt.text()).toBe('inner { one }');

    $rootRouter.navigateByUrl('/old-parent/old-child-two');
    $rootScope.$digest();

    expect($location.path()).toBe('/new-parent/new-child-two');
    expect(elt.text()).toBe('inner { two }');
  }));


  it('should navigate when the location path changes', inject(function ($location) {
    $rootRouter.config([
      { path: '/one', component: 'oneCmp' }
    ]);
    compile('<div ng-outlet></div>');

    $location.path('/one');
    $rootScope.$digest();

    expect(elt.text()).toBe('one');
  }));


  it('should navigate when the location query changes', inject(function ($location) {
    $rootRouter.config([
      { path: '/get/params', component: 'getParams' }
    ]);
    compile('<div ng-outlet></div>');

    $location.url('/get/params?x=y');
    $rootScope.$digest();

    expect(elt.text()).toBe('y');
  }));


  it('should expose a "navigating" property on $rootRouter', inject(function ($q) {
    var defer;
    registerDirective('pendingActivate', {
      $canActivate: function () {
        defer = $q.defer();
        return defer.promise;
      }
    });
    $rootRouter.config([
      { path: '/pending-activate', component: 'pendingActivate' }
    ]);
    compile('<div ng-outlet></div>');

    $rootRouter.navigateByUrl('/pending-activate');
    $rootScope.$digest();
    expect($rootRouter.navigating).toBe(true);
    defer.resolve();
    $rootScope.$digest();
    expect($rootRouter.navigating).toBe(false);
  }));

  function registerDirective(name, options) {
    var controller = getController(options);
    function factory() {
      return {
        template: options.template || '',
        controllerAs: name,
        controller: controller
      };
    }
    applyStaticProperties(controller, options);
    $compileProvider.directive(name, factory);
  }

  function registerComponent(name, options) {

    var definition = {
      template: options.template || '',
      controller: getController(options),
    }
    applyStaticProperties(definition.controller, options);
    $compileProvider.component(name, definition);
  }

  function compile(template) {
    elt = $compile('<div>' + template + '</div>')($rootScope);
    $rootScope.$digest();
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

