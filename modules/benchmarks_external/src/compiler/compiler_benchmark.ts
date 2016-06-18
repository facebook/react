// compiler benchmark in AngularJS 1.x
import {getIntParameter, bindAction} from '@angular/testing/src/benchmark_util';
declare var angular: any;

export function main() {
  var ngEl = document.createElement('div');
  angular.bootstrap(ngEl, ['app']);
}

function loadTemplate(templateId, repeatCount) {
  var template = document.querySelectorAll(`#${templateId}`)[0];
  var content = (<HTMLElement>template).innerHTML;
  var result = '';
  for (var i = 0; i < repeatCount; i++) {
    result += content;
  }
  // replace [] binding syntax
  result = result.replace(/[\[\]]/g, '');

  // Use a DIV as container as Angular 1.3 does not know <template> elements...
  var div = document.createElement('div');
  div.innerHTML = result;
  return div;
}

angular.module('app', [])
    .directive('dir0',
               [
                 '$parse',
                 function($parse) {
                   return {
                     compile: function($element, $attrs) {
                       var expr = $parse($attrs.attr0);
                       return function($scope) { $scope.$watch(expr, angular.noop); }
                     }
                   };
                 }
               ])
    .directive('dir1',
               [
                 '$parse',
                 function($parse) {
                   return {
                     compile: function($element, $attrs) {
                       var expr = $parse($attrs.attr1);
                       return function($scope) { $scope.$watch(expr, angular.noop); }
                     }
                   };
                 }
               ])
    .directive('dir2',
               [
                 '$parse',
                 function($parse) {
                   return {
                     compile: function($element, $attrs) {
                       var expr = $parse($attrs.attr2);
                       return function($scope) { $scope.$watch(expr, angular.noop); }
                     }
                   };
                 }
               ])
    .directive('dir3',
               [
                 '$parse',
                 function($parse) {
                   return {
                     compile: function($element, $attrs) {
                       var expr = $parse($attrs.attr3);
                       return function($scope) { $scope.$watch(expr, angular.noop); }
                     }
                   };
                 }
               ])
    .directive('dir4',
               [
                 '$parse',
                 function($parse) {
                   return {
                     compile: function($element, $attrs) {
                       var expr = $parse($attrs.attr4);
                       return function($scope) { $scope.$watch(expr, angular.noop); }
                     }
                   };
                 }
               ])
    .run([
      '$compile',
      function($compile) {
        var count = getIntParameter('elements');
        var templateNoBindings = loadTemplate('templateNoBindings', count);
        var templateWithBindings = loadTemplate('templateWithBindings', count);

        bindAction('#compileWithBindings', compileWithBindings);
        bindAction('#compileNoBindings', compileNoBindings);

        function compileNoBindings() {
          // Need to clone every time as the compiler might modify the template!
          var cloned = templateNoBindings.cloneNode(true);
          $compile(cloned);
        }

        function compileWithBindings() {
          // Need to clone every time as the compiler might modify the template!
          var cloned = templateWithBindings.cloneNode(true);
          $compile(cloned);
        }
      }
    ]);
