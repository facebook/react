import {Class, Component, EventEmitter, Testability, provide} from '@angular/core';
import {AsyncTestCompleter, describe, expect, inject, it} from '@angular/core/testing/testing_internal';
import {UpgradeAdapter} from '@angular/upgrade';
import * as angular from '@angular/upgrade/src/angular_js';

export function main() {
  describe('adapter: ng1 to ng2', () => {
    it('should have angular 1 loaded', () => expect(angular.version.major).toBe(1));

    it('should instantiate ng2 in ng1 template and project content',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         var ng1Module = angular.module('ng1', []);
         var Ng2 = Component({selector: 'ng2', template: `{{ 'NG2' }}(<ng-content></ng-content>)`})
                       .Class({constructor: function() {}});

         var element =
             html('<div>{{ \'ng1[\' }}<ng2>~{{ \'ng-content\' }}~</ng2>{{ \']\' }}</div>');

         var adapter: UpgradeAdapter = new UpgradeAdapter();
         ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
         adapter.bootstrap(element, ['ng1']).ready((ref) => {
           expect(document.body.textContent).toEqual('ng1[NG2(~ng-content~)]');
           ref.dispose();
           async.done();
         });
       }));

    it('should instantiate ng1 in ng2 template and project content',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
         var adapter: UpgradeAdapter = new UpgradeAdapter();
         var ng1Module = angular.module('ng1', []);

         var Ng2 = Component({
                     selector: 'ng2',
                     template: `{{ 'ng2(' }}<ng1>{{'transclude'}}</ng1>{{ ')' }}`,
                     directives: [adapter.upgradeNg1Component('ng1')]
                   }).Class({constructor: function() {}});

         ng1Module.directive('ng1', () => {
           return {transclude: true, template: '{{ "ng1" }}(<ng-transclude></ng-transclude>)'};
         });
         ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));

         var element = html('<div>{{\'ng1(\'}}<ng2></ng2>{{\')\'}}</div>');

         adapter.bootstrap(element, ['ng1']).ready((ref) => {
           expect(document.body.textContent).toEqual('ng1(ng2(ng1(transclude)))');
           ref.dispose();
           async.done();
         });
       }));

    describe('scope/component change-detection', () => {
      it('should interleave scope and component expressions',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var ng1Module = angular.module('ng1', []);
           var log: any[] /** TODO #9100 */ = [];
           var l = function(value: any /** TODO #9100 */) {
             log.push(value);
             return value + ';';
           };
           var adapter: UpgradeAdapter = new UpgradeAdapter();

           ng1Module.directive('ng1a', () => { return {template: '{{ l(\'ng1a\') }}'}; });
           ng1Module.directive('ng1b', () => { return {template: '{{ l(\'ng1b\') }}'}; });
           ng1Module.run(($rootScope: any /** TODO #9100 */) => {
             $rootScope.l = l;
             $rootScope.reset = () => log.length = 0;
           });

           var Ng2 =
               Component({
                 selector: 'ng2',
                 template: `{{l('2A')}}<ng1a></ng1a>{{l('2B')}}<ng1b></ng1b>{{l('2C')}}`,
                 directives:
                     [adapter.upgradeNg1Component('ng1a'), adapter.upgradeNg1Component('ng1b')]
               }).Class({constructor: function() { this.l = l; }});

           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));

           var element =
               html('<div>{{reset(); l(\'1A\');}}<ng2>{{l(\'1B\')}}</ng2>{{l(\'1C\')}}</div>');
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(document.body.textContent).toEqual('1A;2A;ng1a;2B;ng1b;2C;1C;');
             // https://github.com/angular/angular.js/issues/12983
             expect(log).toEqual(['1A', '1B', '1C', '2A', '2B', '2C', 'ng1a', 'ng1b']);
             ref.dispose();
             async.done();
           });
         }));
    });

    describe('downgrade ng2 component', () => {
      it('should bind properties, events',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter: UpgradeAdapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);

           ng1Module.run(($rootScope: any /** TODO #9100 */) => {
             $rootScope.dataA = 'A';
             $rootScope.dataB = 'B';
             $rootScope.modelA = 'initModelA';
             $rootScope.modelB = 'initModelB';
             $rootScope.eventA = '?';
             $rootScope.eventB = '?';
           });
           var Ng2 = Component({
                       selector: 'ng2',
                       inputs:
                           ['literal', 'interpolate', 'oneWayA', 'oneWayB', 'twoWayA', 'twoWayB'],
                       outputs: [
                         'eventA', 'eventB', 'twoWayAEmitter: twoWayAChange',
                         'twoWayBEmitter: twoWayBChange'
                       ],
                       template: 'ignore: {{ignore}}; ' +
                           'literal: {{literal}}; interpolate: {{interpolate}}; ' +
                           'oneWayA: {{oneWayA}}; oneWayB: {{oneWayB}}; ' +
                           'twoWayA: {{twoWayA}}; twoWayB: {{twoWayB}}; ({{ngOnChangesCount}})'
                     }).Class({
             constructor: function() {
               this.ngOnChangesCount = 0;
               this.ignore = '-';
               this.literal = '?';
               this.interpolate = '?';
               this.oneWayA = '?';
               this.oneWayB = '?';
               this.twoWayA = '?';
               this.twoWayB = '?';
               this.eventA = new EventEmitter();
               this.eventB = new EventEmitter();
               this.twoWayAEmitter = new EventEmitter();
               this.twoWayBEmitter = new EventEmitter();
             },
             ngOnChanges: function(changes: any /** TODO #9100 */) {
               var assert = (prop: any /** TODO #9100 */, value: any /** TODO #9100 */) => {
                 if (this[prop] != value) {
                   throw new Error(`Expected: '${prop}' to be '${value}' but was '${this[prop]}'`);
                 }
               };

               var assertChange = (prop: any /** TODO #9100 */, value: any /** TODO #9100 */) => {
                 assert(prop, value);
                 if (!changes[prop]) {
                   throw new Error(`Changes record for '${prop}' not found.`);
                 }
                 var actValue = changes[prop].currentValue;
                 if (actValue != value) {
                   throw new Error(
                       `Expected changes record for'${prop}' to be '${value}' but was '${actValue}'`);
                 }
               };

               switch (this.ngOnChangesCount++) {
                 case 0:
                   assert('ignore', '-');
                   assertChange('literal', 'Text');
                   assertChange('interpolate', 'Hello world');
                   assertChange('oneWayA', 'A');
                   assertChange('oneWayB', 'B');
                   assertChange('twoWayA', 'initModelA');
                   assertChange('twoWayB', 'initModelB');

                   this.twoWayAEmitter.emit('newA');
                   this.twoWayBEmitter.emit('newB');
                   this.eventA.emit('aFired');
                   this.eventB.emit('bFired');
                   break;
                 case 1:
                   assertChange('twoWayA', 'newA');
                   break;
                 case 2:
                   assertChange('twoWayB', 'newB');
                   break;
                 default:
                   throw new Error('Called too many times! ' + JSON.stringify(changes));
               }
             }
           });
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html(`<div>
              <ng2 literal="Text" interpolate="Hello {{'world'}}"
                   bind-one-way-a="dataA" [one-way-b]="dataB"
                   bindon-two-way-a="modelA" [(two-way-b)]="modelB"
                   on-event-a='eventA=$event' (event-b)="eventB=$event"></ng2>
              | modelA: {{modelA}}; modelB: {{modelB}}; eventA: {{eventA}}; eventB: {{eventB}};
              </div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent))
                 .toEqual(
                     'ignore: -; ' +
                     'literal: Text; interpolate: Hello world; ' +
                     'oneWayA: A; oneWayB: B; twoWayA: newA; twoWayB: newB; (2) | ' +
                     'modelA: newA; modelB: newB; eventA: aFired; eventB: bFired;')
             ref.dispose();
             async.done();
           });

         }));

      it('should properly run cleanup when ng1 directive is destroyed',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter: UpgradeAdapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);
           var onDestroyed: EventEmitter<string> = new EventEmitter<string>();

           ng1Module.directive('ng1', () => {
             return {
               template: '<div ng-if="!destroyIt"><ng2></ng2></div>',
               controller: function(
                   $rootScope: any /** TODO #9100 */, $timeout: any /** TODO #9100 */) {
                 $timeout(function() { $rootScope.destroyIt = true; });
               }
             };
           });

           var Ng2 = Component({selector: 'ng2', template: 'test'}).Class({
             constructor: function() {},
             ngOnDestroy: function() { onDestroyed.emit('destroyed'); }
           });
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html('<ng1></ng1>');
           adapter.bootstrap(element, ['ng1']).ready((ref) => {onDestroyed.subscribe(() => {
                                                       ref.dispose();
                                                       async.done();
                                                     })});
         }));


      it('should fallback to the root ng2.injector when compiled outside the dom',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter: UpgradeAdapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);

           ng1Module.directive('ng1', [
             '$compile',
             ($compile: any /** TODO #9100 */) => {
               return {
                 link: function(
                     $scope: any /** TODO #9100 */, $element: any /** TODO #9100 */,
                     $attrs: any /** TODO #9100 */) {
                   var compiled = $compile('<ng2></ng2>');
                   var template = compiled($scope);
                   $element.append(template);
                 }
               };
             }
           ]);

           var Ng2 =
               Component({selector: 'ng2', template: 'test'}).Class({constructor: function() {}});
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html('<ng1></ng1>');
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent)).toEqual('test');
             ref.dispose();
             async.done();
           });
         }));
    });

    describe('upgrade ng1 component', () => {
      it('should bind properties, events',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);

           var ng1 = function() {
             return {
               template: 'Hello {{fullName}}; A: {{dataA}}; B: {{dataB}}; | ',
               scope: {fullName: '@', modelA: '=dataA', modelB: '=dataB', event: '&'},
               link: function(scope: any /** TODO #9100 */) {
                 scope.$watch('dataB', (v: any /** TODO #9100 */) => {
                   if (v == 'Savkin') {
                     scope.dataB = 'SAVKIN';
                     scope.event('WORKS');

                     // Should not update because [model-a] is uni directional
                     scope.dataA = 'VICTOR';
                   }
                 })
               }
             };
           };
           ng1Module.directive('ng1', ng1);
           var Ng2 =
               Component({
                 selector: 'ng2',
                 template:
                     '<ng1 fullName="{{last}}, {{first}}" [modelA]="first" [(modelB)]="last" ' +
                     '(event)="event=$event"></ng1>' +
                     '<ng1 fullName="{{\'TEST\'}}" modelA="First" modelB="Last"></ng1>' +
                     '{{event}}-{{last}}, {{first}}',
                 directives: [adapter.upgradeNg1Component('ng1')]
               }).Class({
                 constructor: function() {
                   this.first = 'Victor';
                   this.last = 'Savkin';
                   this.event = '?';
                 }
               });
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html(`<div><ng2></ng2></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             // we need to do setTimeout, because the EventEmitter uses setTimeout to schedule
             // events, and so without this we would not see the events processed.
             setTimeout(() => {
               expect(multiTrim(document.body.textContent))
                   .toEqual(
                       'Hello SAVKIN, Victor; A: VICTOR; B: SAVKIN; | Hello TEST; A: First; B: Last; | WORKS-SAVKIN, Victor');
               ref.dispose();
               async.done();
             }, 0);
           });
         }));

      it('should bind properties, events in controller when bindToController is not used',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);

           var ng1 = function() {
             return {
               restrict: 'E',
               template: '{{someText}} - Length: {{data.length}}',
               scope: {data: '='},
               controller: function($scope: any /** TODO #9100 */) {
                 $scope.someText = 'ng1 - Data: ' + $scope.data;
               }
             };
           };

           ng1Module.directive('ng1', ng1);
           var Ng2 =
               Component({
                 selector: 'ng2',
                 template:
                     '{{someText}} - Length: {{dataList.length}} | <ng1 [(data)]="dataList"></ng1>',
                 directives: [adapter.upgradeNg1Component('ng1')],
               }).Class({

                 constructor: function() {
                   this.dataList = [1, 2, 3];
                   this.someText = 'ng2'
                 }
               });
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html(`<div><ng2></ng2></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             // we need to do setTimeout, because the EventEmitter uses setTimeout to schedule
             // events, and so without this we would not see the events processed.
             setTimeout(() => {
               expect(multiTrim(document.body.textContent))
                   .toEqual('ng2 - Length: 3 | ng1 - Data: 1,2,3 - Length: 3');
               ref.dispose();
               async.done();
             }, 0);
           });
         }));

      it('should bind properties, events in link function',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);

           var ng1 = function() {
             return {
               restrict: 'E',
               template: '{{someText}} - Length: {{data.length}}',
               scope: {data: '='},
               link: function($scope: any /** TODO #9100 */) {
                 $scope.someText = 'ng1 - Data: ' + $scope.data;
               }
             };
           };

           ng1Module.directive('ng1', ng1);
           var Ng2 =
               Component({
                 selector: 'ng2',
                 template:
                     '{{someText}} - Length: {{dataList.length}} | <ng1 [(data)]="dataList"></ng1>',
                 directives: [adapter.upgradeNg1Component('ng1')],
               }).Class({

                 constructor: function() {
                   this.dataList = [1, 2, 3];
                   this.someText = 'ng2'
                 }
               });
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html(`<div><ng2></ng2></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             // we need to do setTimeout, because the EventEmitter uses setTimeout to schedule
             // events, and so without this we would not see the events processed.
             setTimeout(() => {
               expect(multiTrim(document.body.textContent))
                   .toEqual('ng2 - Length: 3 | ng1 - Data: 1,2,3 - Length: 3');
               ref.dispose();
               async.done();
             }, 0);
           });
         }));

      it('should support templateUrl fetched from $httpBackend',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);
           ng1Module.value(
               '$httpBackend', (method: any /** TODO #9100 */, url: any /** TODO #9100 */,
                                post: any /** TODO #9100 */,
                                cbFn: any /** TODO #9100 */) => { cbFn(200, `${method}:${url}`); });

           var ng1 = function() { return {templateUrl: 'url.html'}; };
           ng1Module.directive('ng1', ng1);
           var Ng2 = Component({
                       selector: 'ng2',
                       template: '<ng1></ng1>',
                       directives: [adapter.upgradeNg1Component('ng1')]
                     }).Class({constructor: function() {}});
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html(`<div><ng2></ng2></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent)).toEqual('GET:url.html');
             ref.dispose();
             async.done();
           });
         }));

      it('should support templateUrl as a function',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);
           ng1Module.value(
               '$httpBackend', (method: any /** TODO #9100 */, url: any /** TODO #9100 */,
                                post: any /** TODO #9100 */,
                                cbFn: any /** TODO #9100 */) => { cbFn(200, `${method}:${url}`); });

           var ng1 = function() { return {templateUrl() { return 'url.html' }}; };
           ng1Module.directive('ng1', ng1);
           var Ng2 = Component({
                       selector: 'ng2',
                       template: '<ng1></ng1>',
                       directives: [adapter.upgradeNg1Component('ng1')]
                     }).Class({constructor: function() {}});
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html(`<div><ng2></ng2></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent)).toEqual('GET:url.html');
             ref.dispose();
             async.done();
           });
         }));

      it('should support empty template',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);

           var ng1 = function() { return {template: ''}; };
           ng1Module.directive('ng1', ng1);
           var Ng2 = Component({
                       selector: 'ng2',
                       template: '<ng1></ng1>',
                       directives: [adapter.upgradeNg1Component('ng1')]
                     }).Class({constructor: function() {}});
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html(`<div><ng2></ng2></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent)).toEqual('');
             ref.dispose();
             async.done();
           });
         }));

      it('should support template as a function',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);

           var ng1 = function() { return {template() { return '' }}; };
           ng1Module.directive('ng1', ng1);
           var Ng2 = Component({
                       selector: 'ng2',
                       template: '<ng1></ng1>',
                       directives: [adapter.upgradeNg1Component('ng1')]
                     }).Class({constructor: function() {}});
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html(`<div><ng2></ng2></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent)).toEqual('');
             ref.dispose();
             async.done();
           });
         }));

      it('should support templateUrl fetched from $templateCache',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);
           ng1Module.run(
               ($templateCache: any /** TODO #9100 */) => $templateCache.put('url.html', 'WORKS'));

           var ng1 = function() { return {templateUrl: 'url.html'}; };
           ng1Module.directive('ng1', ng1);
           var Ng2 = Component({
                       selector: 'ng2',
                       template: '<ng1></ng1>',
                       directives: [adapter.upgradeNg1Component('ng1')]
                     }).Class({constructor: function() {}});
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html(`<div><ng2></ng2></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent)).toEqual('WORKS');
             ref.dispose();
             async.done();
           });
         }));

      it('should support controller with controllerAs',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);

           var ng1 = function() {
             return {
               scope: true,
               template:
                   '{{ctl.scope}}; {{ctl.isClass}}; {{ctl.hasElement}}; {{ctl.isPublished()}}',
               controllerAs: 'ctl',
               controller: Class({
                 constructor: function(
                     $scope: any /** TODO #9100 */, $element: any /** TODO #9100 */) {
                   (<any>this).verifyIAmAClass();
                   this.scope = $scope.$parent.$parent == $scope.$root ? 'scope' : 'wrong-scope';
                   this.hasElement = $element[0].nodeName;
                   this.$element = $element;
                 },
                 verifyIAmAClass: function() { this.isClass = 'isClass'; },
                 isPublished: function() {
                   return this.$element.controller('ng1') == this ? 'published' : 'not-published';
                 }
               })
             };
           };
           ng1Module.directive('ng1', ng1);
           var Ng2 = Component({
                       selector: 'ng2',
                       template: '<ng1></ng1>',
                       directives: [adapter.upgradeNg1Component('ng1')]
                     }).Class({constructor: function() {}});
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html(`<div><ng2></ng2></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent)).toEqual('scope; isClass; NG1; published');
             ref.dispose();
             async.done();
           });
         }));

      it('should support bindToController',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);

           var ng1 = function() {
             return {
               scope: {title: '@'},
               bindToController: true,
               template: '{{ctl.title}}',
               controllerAs: 'ctl',
               controller: Class({constructor: function() {}})
             };
           };
           ng1Module.directive('ng1', ng1);
           var Ng2 = Component({
                       selector: 'ng2',
                       template: '<ng1 title="WORKS"></ng1>',
                       directives: [adapter.upgradeNg1Component('ng1')]
                     }).Class({constructor: function() {}});
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html(`<div><ng2></ng2></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent)).toEqual('WORKS');
             ref.dispose();
             async.done();
           });
         }));

      it('should support bindToController with bindings',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);

           var ng1 = function() {
             return {
               scope: {},
               bindToController: {title: '@'},
               template: '{{ctl.title}}',
               controllerAs: 'ctl',
               controller: Class({constructor: function() {}})
             };
           };
           ng1Module.directive('ng1', ng1);
           var Ng2 = Component({
                       selector: 'ng2',
                       template: '<ng1 title="WORKS"></ng1>',
                       directives: [adapter.upgradeNg1Component('ng1')]
                     }).Class({constructor: function() {}});
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html(`<div><ng2></ng2></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent)).toEqual('WORKS');
             ref.dispose();
             async.done();
           });
         }));

      it('should support single require in linking fn',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);

           var ng1 = function($rootScope: any /** TODO #9100 */) {
             return {
               scope: {title: '@'},
               bindToController: true,
               template: '{{ctl.status}}',
               require: 'ng1',
               controllerAs: 'ctrl',
               controller: Class({constructor: function() { this.status = 'WORKS'; }}),
               link: function(
                   scope: any /** TODO #9100 */, element: any /** TODO #9100 */,
                   attrs: any /** TODO #9100 */, linkController: any /** TODO #9100 */) {
                 expect(scope.$root).toEqual($rootScope);
                 expect(element[0].nodeName).toEqual('NG1');
                 expect(linkController.status).toEqual('WORKS');
                 scope.ctl = linkController;
               }
             };
           };
           ng1Module.directive('ng1', ng1);
           var Ng2 = Component({
                       selector: 'ng2',
                       template: '<ng1></ng1>',
                       directives: [adapter.upgradeNg1Component('ng1')]
                     }).Class({constructor: function() {}});
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html(`<div><ng2></ng2></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent)).toEqual('WORKS');
             ref.dispose();
             async.done();
           });
         }));

      it('should support array require in linking fn',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);

           var parent = function() {
             return {controller: Class({constructor: function() { this.parent = 'PARENT'; }})};
           };
           var ng1 = function() {
             return {
               scope: {title: '@'},
               bindToController: true,
               template: '{{parent.parent}}:{{ng1.status}}',
               require: ['ng1', '^parent', '?^^notFound'],
               controllerAs: 'ctrl',
               controller: Class({constructor: function() { this.status = 'WORKS'; }}),
               link: function(
                   scope: any /** TODO #9100 */, element: any /** TODO #9100 */,
                   attrs: any /** TODO #9100 */, linkControllers: any /** TODO #9100 */) {
                 expect(linkControllers[0].status).toEqual('WORKS');
                 expect(linkControllers[1].parent).toEqual('PARENT');
                 expect(linkControllers[2]).toBe(undefined);
                 scope.ng1 = linkControllers[0];
                 scope.parent = linkControllers[1];
               }
             };
           };
           ng1Module.directive('parent', parent);
           ng1Module.directive('ng1', ng1);
           var Ng2 = Component({
                       selector: 'ng2',
                       template: '<ng1></ng1>',
                       directives: [adapter.upgradeNg1Component('ng1')]
                     }).Class({constructor: function() {}});
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));
           var element = html(`<div><parent><ng2></ng2></parent></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent)).toEqual('PARENT:WORKS');
             ref.dispose();
             async.done();
           });
         }));

      it('should call $onInit of components',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);
           var valueToFind = '$onInit';

           var ng1 = {
             bindings: {},
             template: '{{$ctrl.value}}',
             controller: Class(
                 {constructor: function() {}, $onInit: function() { this.value = valueToFind; }})
           };
           ng1Module.component('ng1', ng1);

           var Ng2 = Component({
                       selector: 'ng2',
                       template: '<ng1></ng1>',
                       directives: [adapter.upgradeNg1Component('ng1')]
                     }).Class({constructor: function() {}});
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));

           var element = html(`<div><ng2></ng2></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent)).toEqual(valueToFind);
             ref.dispose();
             async.done();
           });
         }));

      it('should bind input properties (<) of components',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);

           var ng1 = {
             bindings: {personProfile: '<'},
             template: 'Hello {{$ctrl.personProfile.firstName}} {{$ctrl.personProfile.lastName}}',
             controller: Class({constructor: function() {}})
           };
           ng1Module.component('ng1', ng1);

           var Ng2 = Component({
                       selector: 'ng2',
                       template: '<ng1 [personProfile]="goku"></ng1>',
                       directives: [adapter.upgradeNg1Component('ng1')]
                     }).Class({
             constructor: function() { this.goku = {firstName: 'GOKU', lastName: 'SAN'}; }
           });
           ng1Module.directive('ng2', adapter.downgradeNg2Component(Ng2));

           var element = html(`<div><ng2></ng2></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent)).toEqual(`Hello GOKU SAN`);
             ref.dispose();
             async.done();
           });
         }));

      it('should support ng2 > ng1 > ng2',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);

           var ng1 = {
             template: 'ng1(<ng2b></ng2b>)',
           };
           ng1Module.component('ng1', ng1);

           var Ng2a = Component({
                        selector: 'ng2a',
                        template: 'ng2a(<ng1></ng1>)',
                        directives: [adapter.upgradeNg1Component('ng1')]
                      }).Class({constructor: function() {}});
           ng1Module.directive('ng2a', adapter.downgradeNg2Component(Ng2a));

           var Ng2b = Component({selector: 'ng2b', template: 'ng2b', directives: []}).Class({
             constructor: function() {}
           });
           ng1Module.directive('ng2b', adapter.downgradeNg2Component(Ng2b));

           var element = html(`<div><ng2a></ng2a></div>`);
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(multiTrim(document.body.textContent)).toEqual('ng2a(ng1(ng2b))');
             async.done();
           });
         }));
    });

    describe('injection', () => {
      function SomeToken() {}

      it('should export ng2 instance to ng1',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var module = angular.module('myExample', []);
           adapter.addProvider({provide: SomeToken, useValue: 'correct_value'});
           module.factory('someToken', adapter.downgradeNg2Provider(SomeToken));
           adapter.bootstrap(html('<div>'), ['myExample']).ready((ref) => {
             expect(ref.ng1Injector.get('someToken')).toBe('correct_value');
             ref.dispose();
             async.done();
           });
         }));

      it('should export ng1 instance to ng2',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var module = angular.module('myExample', []);
           module.value('testValue', 'secreteToken');
           adapter.upgradeNg1Provider('testValue');
           adapter.upgradeNg1Provider('testValue', {asToken: 'testToken'});
           adapter.upgradeNg1Provider('testValue', {asToken: String});
           adapter.bootstrap(html('<div>'), ['myExample']).ready((ref) => {
             expect(ref.ng2Injector.get('testValue')).toBe('secreteToken');
             expect(ref.ng2Injector.get(String)).toBe('secreteToken');
             expect(ref.ng2Injector.get('testToken')).toBe('secreteToken');
             ref.dispose();
             async.done();
           });
         }));
    });

    describe('testability', () => {
      it('should handle deferred bootstrap',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter: UpgradeAdapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);
           var bootstrapResumed: boolean = false;

           var element = html('<div></div>');
           window.name = 'NG_DEFER_BOOTSTRAP!' + window.name;

           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             expect(bootstrapResumed).toEqual(true);
             ref.dispose();
             async.done();
           });

           setTimeout(() => {
             bootstrapResumed = true;
             (<any>window).angular.resumeBootstrap();
           }, 100);
         }));

      it('should wait for ng2 testability',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter: UpgradeAdapter = new UpgradeAdapter();
           var ng1Module = angular.module('ng1', []);
           var element = html('<div></div>');
           adapter.bootstrap(element, ['ng1']).ready((ref) => {
             var ng2Testability: Testability = ref.ng2Injector.get(Testability);
             ng2Testability.increasePendingRequestCount();
             var ng2Stable = false;

             angular.getTestability(element).whenStable(function() {
               expect(ng2Stable).toEqual(true);
               ref.dispose();
               async.done();
             });

             setTimeout(() => {
               ng2Stable = true;
               ng2Testability.decreasePendingRequestCount();
             }, 100);
           });
         }));
    });

    describe('examples', () => {
      it('should verify UpgradeAdapter example',
         inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {
           var adapter = new UpgradeAdapter();
           var module = angular.module('myExample', []);

           module.directive('ng1', function() {
             return {
               scope: {title: '='},
               transclude: true,
               template: 'ng1[Hello {{title}}!](<span ng-transclude></span>)'
             };
           });


           var Ng2 =
               Component({
                 selector: 'ng2',
                 inputs: ['name'],
                 template: 'ng2[<ng1 [title]="name">transclude</ng1>](<ng-content></ng-content>)',
                 directives: [adapter.upgradeNg1Component('ng1')]
               }).Class({constructor: function() {}});

           module.directive('ng2', adapter.downgradeNg2Component(Ng2));

           document.body.innerHTML = '<ng2 name="World">project</ng2>';

           adapter.bootstrap(document.body, ['myExample']).ready((ref) => {
             expect(multiTrim(document.body.textContent))
                 .toEqual('ng2[ng1[Hello World!](transclude)](project)');
             ref.dispose();
             async.done();
           });
         }));
    });
  });
}

function multiTrim(text: string): string {
  return text.replace(/\n/g, '').replace(/\s\s+/g, ' ').trim();
}

function html(html: string): Element {
  var body = document.body;
  body.innerHTML = html;
  if (body.childNodes.length == 1 && body.firstChild instanceof HTMLElement)
    return <Element>body.firstChild;
  return body;
}
