// tree benchmark in AngularJS 1.x
import {getIntParameter, bindAction} from '@angular/testing/src/benchmark_util';
declare var angular: any;

export function main() {
  angular.bootstrap(document.querySelector('tree'), ['app']);
}

angular.module('app', [])
    .directive('tree',
               function() {
                 return {
                   scope: {data: '='},
                   template: '<span> {{data.value}}' +
                                 '  <span tree-if="data.left"></span>' +
                                 '  <span tree-if="data.right"></span>' +
                                 '</span>'
                 };
               })
    // special directive for "if" as angular 1.3 does not support
    // recursive components.
    .directive('treeIf',
               [
                 '$compile',
                 '$parse',
                 function($compile, $parse) {
                   var transcludeFn;
                   return {
                     compile: function(element, attrs) {
                       var expr = $parse('!!' + attrs.treeIf);
                       var template = '<tree data="' + attrs.treeIf + '"></tree>';
                       var transclude;
                       return function($scope, $element, $attrs) {
                         if (!transclude) {
                           transclude = $compile(template);
                         }
                         var childScope;
                         var childElement;
                         $scope.$watch(expr, function(newValue) {
                           if (childScope) {
                             childScope.$destroy();
                             childElement.remove();
                             childScope = null;
                             childElement = null;
                           }
                           if (newValue) {
                             childScope = $scope.$new();
                             childElement = transclude(childScope,
                                                       function(clone) { $element.append(clone); });
                           }
                         });
                       }

                     }
                   }
                 }
               ])
    .config([
      '$compileProvider',
      function($compileProvider) { $compileProvider.debugInfoEnabled(false); }
    ])
    .run([
      '$rootScope',
      function($rootScope) {
        var count = 0;
        var maxDepth = getIntParameter('depth');

        bindAction('#destroyDom', destroyDom);
        bindAction('#createDom', createDom);

        function destroyDom() {
          $rootScope.$apply(function() { $rootScope.initData = new TreeNode('', null, null); });
        }

        function createDom() {
          var values = count++ % 2 == 0 ? ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*'] :
                                          ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', '-'];

          $rootScope.$apply(function() { $rootScope.initData = buildTree(maxDepth, values, 0); });
        }
      }
    ]);

class TreeNode {
  value: string;
  left: TreeNode;
  right: TreeNode;
  constructor(value, left, right) {
    this.value = value;
    this.left = left;
    this.right = right;
  }
}

function buildTree(maxDepth, values, curDepth) {
  if (maxDepth === curDepth) return new TreeNode('', null, null);
  return new TreeNode(values[curDepth], buildTree(maxDepth, values, curDepth + 1),
                      buildTree(maxDepth, values, curDepth + 1));
}
