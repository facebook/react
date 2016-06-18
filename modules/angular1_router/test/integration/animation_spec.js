'use strict';

describe('ngOutlet animations', function () {
  var elt,
    $animate,
    $compile,
    $rootScope,
    $rootRouter,
    $compileProvider;

  beforeEach(function () {
    module('ng');
    module('ngAnimate');
    module('ngAnimateMock');
    module('ngComponentRouter');
    module(function (_$compileProvider_) {
      $compileProvider = _$compileProvider_;
    });

    inject(function (_$animate_, _$compile_, _$rootScope_, _$rootRouter_) {
      $animate = _$animate_;
      $compile = _$compile_;
      $rootScope = _$rootScope_;
      $rootRouter = _$rootRouter_;
    });

    registerComponent('userCmp', {
      template: '<div>hello {{userCmp.$routeParams.name}}</div>',
      $routerOnActivate: function(next) {
        this.$routeParams = next.params;
      }
    });
  });

  afterEach(function () {
    expect($animate.queue).toEqual([]);
  });

  it('should work in a simple case', function () {
    var item;

    compile('<div ng-outlet></div>');

    $rootRouter.config([
      { path: '/user/:name', component: 'userCmp' }
    ]);

    $rootRouter.navigateByUrl('/user/brian');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello brian');

    // "user" component enters
    item = $animate.queue.shift();
    expect(item.event).toBe('enter');

    // navigate to pete
    $rootRouter.navigateByUrl('/user/pete');
    $rootScope.$digest();
    expect(elt.text()).toBe('hello pete');

    // "user pete" component enters
    item = $animate.queue.shift();
    expect(item.event).toBe('enter');
    expect(item.element.text()).toBe('hello pete');

    // "user brian" component leaves
    item = $animate.queue.shift();
    expect(item.event).toBe('leave');
    expect(item.element.text()).toBe('hello brian');
  });


  function registerComponent(name, options) {
    var controller = options.controller || function () {};

    ['$routerOnActivate', '$routerOnDeactivate', '$routerOnReuse', '$routerCanReuse', '$routerCanDeactivate'].forEach(function (hookName) {
      if (options[hookName]) {
        controller.prototype[hookName] = options[hookName];
      }
    });

    function factory() {
      return {
        template: options.template || '',
        controllerAs: name,
        controller: controller
      };
    }

    if (options.$canActivate) {
      factory.$canActivate = options.$canActivate;
    }
    if (options.$routeConfig) {
      factory.$routeConfig = options.$routeConfig;
    }

    $compileProvider.directive(name, factory);
  }

  function compile(template) {
    elt = $compile('<div>' + template + '</div>')($rootScope);
    $rootScope.$digest();
    return elt;
  }
});
