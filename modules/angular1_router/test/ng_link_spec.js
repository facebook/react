'use strict';

describe('ngLink', function () {

  describe('html5Mode enabled', function () {
    runHrefTestsAndExpectPrefix('/', true);
  });

  describe('html5Mode disabled', function () {
    runHrefTestsAndExpectPrefix('', false, '');
  });

  describe('html5Mode disabled, with hash prefix', function () {
    runHrefTestsAndExpectPrefix('', false, '!');
  });

  describe('html5Mode enabled', function () {
    runHrefTestsAndExpectPrefix('/moo', true);
  });

  describe('html5Mode disabled', function () {
    runHrefTestsAndExpectPrefix('/moo', false, '');
  });

  describe('html5Mode disabled, with hash prefix', function () {
    runHrefTestsAndExpectPrefix('/moo', false, '!');
  });

  function runHrefTestsAndExpectPrefix(baseHref, html5Mode, hashPrefix) {
    var prefix = html5Mode ? '.' : '#' + hashPrefix;

    it('should allow linking from the parent to the child', function () {
      setup({baseHref: baseHref, html5Mode: html5Mode, hashPrefix: hashPrefix});
      configureRouter([
        { path: '/a', component: 'oneCmp' },
        { path: '/b', component: 'twoCmp', name: 'Two' }
      ]);

      var elt = compile('<a ng-link="[\'/Two\']">link</a> | outer { <div ng-outlet></div> }');
      navigateTo('/a');
      expect(elt.find('a').attr('href')).toBe(prefix + '/b');
    });

    it('should allow linking from the child and the parent', function () {
      setup({baseHref: baseHref, html5Mode: html5Mode, hashPrefix: hashPrefix});
      configureRouter([
        { path: '/a', component: 'oneCmp' },
        { path: '/b', component: 'twoCmp', name: 'Two' }
      ]);

      var elt = compile('outer { <div ng-outlet></div> }');
      navigateTo('/b');
      expect(elt.find('a').attr('href')).toBe(prefix + '/b');
    });


    it('should allow params in routerLink directive', function () {
      setup({baseHref: baseHref, html5Mode: html5Mode, hashPrefix: hashPrefix});
      registerComponent('twoLinkCmp', '<div><a ng-link="[\'/Two\', {param: \'lol\'}]">{{twoLinkCmp.number}}</a></div>', function () {this.number = 'two'});
      configureRouter([
        { path: '/a', component: 'twoLinkCmp' },
        { path: '/b/:param', component: 'twoCmp', name: 'Two' }
      ]);

      var elt = compile('<div ng-outlet></div>');
      navigateTo('/a');
      expect(elt.find('a').attr('href')).toBe(prefix + '/b/lol');
    });


    it('should update the href of links with bound params', function () {
      setup({baseHref: baseHref, html5Mode: html5Mode, hashPrefix: hashPrefix});
      registerComponent('twoLinkCmp', '<div><a ng-link="[\'/Two\', {param: $ctrl.number}]">{{$ctrl.number}}</a></div>', function () {this.number = 43});
      configureRouter([
        { path: '/a', component: 'twoLinkCmp' },
        { path: '/b/:param', component: 'twoCmp', name: 'Two' }
      ]);

      var elt = compile('<div ng-outlet></div>');
      navigateTo('/a');
      expect(elt.find('a').text()).toBe('43');
      expect(elt.find('a').attr('href')).toBe(prefix + '/b/43');
    });


    it('should navigate on left-mouse click when a link url matches a route', function () {
      setup({baseHref: baseHref, html5Mode: html5Mode, hashPrefix: hashPrefix});
      configureRouter([
        { path: '/', component: 'oneCmp' },
        { path: '/two', component: 'twoCmp', name: 'Two'}
      ]);

      var elt = compile('<a ng-link="[\'/Two\']">link</a> | <div ng-outlet></div>');
      expect(elt.text()).toBe('link | one');
      expect(elt.find('a').attr('href')).toBe(prefix + '/two');

      elt.find('a')[0].click();
      inject(function($rootScope) { $rootScope.$digest(); });
      expect(elt.text()).toBe('link | two');
    });


    it('should not navigate on non-left mouse click when a link url matches a route', function() {
      setup({baseHref: baseHref, html5Mode: html5Mode, hashPrefix: hashPrefix});
      configureRouter([
        { path: '/', component: 'oneCmp' },
        { path: '/two', component: 'twoCmp', name: 'Two'}
      ]);

      var elt = compile('<a ng-link="[\'/Two\']">link</a> | <div ng-outlet></div>');
      expect(elt.text()).toBe('link | one');
      elt.find('a').triggerHandler({ type: 'click', which: 3 });
      inject(function($rootScope) { $rootScope.$digest(); });
      expect(elt.text()).toBe('link | one');
    });


    // See https://github.com/angular/router/issues/206
    it('should not navigate a link without an href', function () {
      setup({baseHref: baseHref, html5Mode: html5Mode, hashPrefix: hashPrefix});
      configureRouter([
        { path: '/', component: 'oneCmp' },
        { path: '/two', component: 'twoCmp', name: 'Two'}
      ]);
      expect(function () {
        var elt = compile('<a>link</a>');
        expect(elt.text()).toBe('link');
        elt.find('a')[0].click();
        inject(function($rootScope) { $rootScope.$digest(); });
      }).not.toThrow();
    });

    it('should add an ng-link-active class on the current link', function() {
      setup({baseHref: baseHref, html5Mode: html5Mode, hashPrefix: hashPrefix});
      configureRouter([
        { path: '/', component: 'oneCmp', name: 'One' }
      ]);

      var elt = compile('<a ng-link="[\'/One\']">one</a> | <div ng-outlet></div>');
      navigateTo('/');
      expect(elt.find('a').attr('class')).toBe('ng-link-active');
    });

    it('should not add a href if link attributes are undefined', function () {
      setup({baseHref: baseHref, html5Mode: html5Mode, hashPrefix: hashPrefix});
      configureRouter([
        { path: '/a', component: 'oneCmp' },
        { path: '/b', component: 'twoCmp', name: 'Two' }
      ]);

      var elt = compile('<a ng-link="something.undefined">link</a> | outer { <div ng-outlet></div> }');
      navigateTo('/a');
      expect(elt.find('a').hasAttr('href')).toBeFalsy();
    });
  }

  function registerComponent(name, template, controller) {
    module(function($compileProvider) {
      $compileProvider.component(name, {
        template: template,
        controller: controller
      });
    });
  }

  function setup(config) {
    module(function($provide) {
      $provide.decorator('$browser', function($delegate) {
        $delegate.baseHref = function() { return config.baseHref; };
        return $delegate;
      });
    });
    module('ngComponentRouter');
    module(function($locationProvider) {
      $locationProvider.html5Mode(config.html5Mode);
      $locationProvider.hashPrefix(config.hashPrefix);
    });
    registerComponent('userCmp', '<div>hello {{$ctrl.$routeParams.name}}</div>', function () {});
    registerComponent('oneCmp', '<div>{{$ctrl.number}}</div>', function () {this.number = 'one'});
    registerComponent('twoCmp', '<div><a ng-link="[\'/Two\']">{{$ctrl.number}}</a></div>', function () {this.number = 'two'});
  }

  function configureRouter(routeConfig) {
    inject(function($rootRouter) {
      $rootRouter.config(routeConfig);
    });
  }

  function compile(template) {
    var elt;
    inject(function($compile, $rootScope) {
      elt = $compile('<div>' + template + '</div>')($rootScope);
      $rootScope.$digest();
    });
    return elt;
  }

  function navigateTo(url) {
    inject(function($rootRouter, $rootScope) {
      $rootRouter.navigateByUrl(url);
      $rootScope.$digest();
    });
  }
});
