// static tree benchmark in AngularDart 1.x
library static_tree_benchmark_ng10;

import 'package:angular/angular.dart';
import 'package:angular/application_factory.dart';
import 'package:angular2/src/testing/benchmark_util.dart';

setup() {
  var m = new Module()
    ..bind(CompilerConfig,
        toValue: new CompilerConfig.withOptions(elementProbeEnabled: false))
    ..bind(ScopeDigestTTL,
        toFactory: () => new ScopeDigestTTL.value(15), inject: [])
    ..bind(TreeComponent0)
    ..bind(TreeComponent1)
    ..bind(TreeComponent2)
    ..bind(TreeComponent3)
    ..bind(TreeComponent4)
    ..bind(TreeComponent5)
    ..bind(TreeComponent6)
    ..bind(TreeComponent7)
    ..bind(TreeComponent8)
    ..bind(TreeComponent9);

  final injector = applicationFactory().addModule(m).run();

  return injector;
}

const MAX_DEPTH = 10;

main() {
  final injector = setup();
  final zone = injector.get(VmTurnZone);
  final rootScope = injector.get(Scope);
  rootScope.context['initData'] = null;
  var count = 0;

  TreeNode createData() {
    var values = count++ % 2 == 0
        ? ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*']
        : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', '-'];
    return buildTree(MAX_DEPTH, values, 0);
  }

  destroyDom() {
    zone.run(() {
      rootScope.context['initData'] = null;
    });
  }

  createDom() {
    zone.run(() {
      rootScope.context['initData'] = createData();
    });
  }

  bindAction('#destroyDom', destroyDom);
  bindAction('#createDom', createDom);
}

@Component(
    selector: 'tree0',
    map: const {'data': '=>data'},
    template: '<span> {{data.value}} ')
class TreeComponent0 {
  var data;
}

@Component(
    selector: 'tree1',
    map: const {'data': '=>data'},
    template:
        '<span> {{data.value}} <tree0 data=data.right></tree0><tree0 data=data.left></tree0>')
class TreeComponent1 {
  var data;
}

@Component(
    selector: 'tree2',
    map: const {'data': '=>data'},
    template:
        '<span> {{data.value}} <tree1 data=data.right></tree1><tree1 data=data.left></tree1>')
class TreeComponent2 {
  var data;
}

@Component(
    selector: 'tree3',
    map: const {'data': '=>data'},
    template:
        '<span> {{data.value}} <tree2 data=data.right></tree2><tree2 data=data.left></tree2>')
class TreeComponent3 {
  var data;
}

@Component(
    selector: 'tree4',
    map: const {'data': '=>data'},
    template:
        '<span> {{data.value}} <tree3 data=data.right></tree3><tree3 data=data.left></tree3>')
class TreeComponent4 {
  var data;
}

@Component(
    selector: 'tree5',
    map: const {'data': '=>data'},
    template:
        '<span> {{data.value}} <tree4 data=data.right></tree4><tree4 data=data.left></tree4>')
class TreeComponent5 {
  var data;
}

@Component(
    selector: 'tree6',
    map: const {'data': '=>data'},
    template:
        '<span> {{data.value}} <tree5 data=data.right></tree5><tree5 data=data.left></tree5>')
class TreeComponent6 {
  var data;
}

@Component(
    selector: 'tree7',
    map: const {'data': '=>data'},
    template:
        '<span> {{data.value}} <tree6 data=data.right></tree6><tree6 data=data.left></tree6>')
class TreeComponent7 {
  var data;
}

@Component(
    selector: 'tree8',
    map: const {'data': '=>data'},
    template:
        '<span> {{data.value}} <tree7 data=data.right></tree7><tree7 data=data.left></tree7>')
class TreeComponent8 {
  var data;
}

@Component(
    selector: 'tree9',
    map: const {'data': '=>data'},
    template:
        '<span> {{data.value}} <tree8 data=data.right></tree8><tree8 data=data.left></tree8>')
class TreeComponent9 {
  var data;
}

buildTree(maxDepth, values, curDepth) {
  if (maxDepth == curDepth) return new TreeNode('');
  return new TreeNode(
      values[curDepth],
      buildTree(maxDepth, values, curDepth + 1),
      buildTree(maxDepth, values, curDepth + 1));
}

class TreeNode {
  var value;
  TreeNode left;
  TreeNode right;
  TreeNode([this.value, this.left, this.right]);
}
