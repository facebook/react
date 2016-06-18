// static tree benchmark in AngularJS 1.x
import {getIntParameter, bindAction} from '@angular/testing/src/benchmark_util';
declare var angular: any;

const MAX_DEPTH = 10;

export function main() {
  angular.bootstrap(document.querySelector('.app'), ['app']);
}

function addTreeDirective(module, level: number) {
  var template;
  if (level <= 0) {
    template = `<span> {{data.value}}</span>`
  } else {
    template = `<span> {{data.value}} <tree${level-1} data='data.right'></tree${level-1}><tree${level-1} data='data.left'></tree${level-1}></span>`;
  }
  module.directive(`tree${level}`, function() { return {scope: {data: '='}, template: template}; });
}

var module = angular.module('app', []);
for (var depth = 0; depth < MAX_DEPTH; depth++) {
  addTreeDirective(module, depth);
}
module.config([
        '$compileProvider',
        function($compileProvider) { $compileProvider.debugInfoEnabled(false); }
      ])
    .run([
      '$rootScope',
      function($rootScope) {
        var count = 0;
        $rootScope.initData = null;

        bindAction('#destroyDom', destroyDom);
        bindAction('#createDom', createDom);

        function createData(): TreeNode {
          var values = count++ % 2 == 0 ? ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*'] :
                                          ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', '-'];
          return buildTree(MAX_DEPTH, values, 0);
        }

        function destroyDom() {
          $rootScope.$apply(function() { $rootScope.initData = null; });
        }

        function createDom() {
          $rootScope.$apply(function() { $rootScope.initData = createData(); });
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
