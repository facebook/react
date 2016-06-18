import {bootstrap} from '@angular/platform-browser';
import {NgIf} from '@angular/common';
import {Component} from '@angular/core';
import {ApplicationRef} from '@angular/core/src/application_ref';
import {reflector} from '@angular/core/src/reflection/reflection';
import {ReflectionCapabilities} from '@angular/core/src/reflection/reflection_capabilities';
import {DOM} from '@angular/platform-browser/src/dom/dom_adapter';
import {window, document, gc} from '@angular/facade';
import {
  getIntParameter,
  getStringParameter,
  bindAction,
  windowProfile,
  windowProfileEnd
} from '@angular/testing/src/benchmark_util';
import {BrowserDomAdapter} from '@angular/platform-browser/src/browser/browser_adapter';

function createBindings(): any[] {
  return [];
}

function setupReflector() {
  reflector.reflectionCapabilities = new ReflectionCapabilities();
}

const MAX_DEPTH = 10;

export function main() {
  BrowserDomAdapter.makeCurrent();

  setupReflector();

  var app;
  var appRef;
  var baselineRootTreeComponent;
  var count = 0;

  function profile(create, destroy, name) {
    return function() {
      windowProfile(name + ' w GC');
      var duration = 0;
      var count = 0;
      while (count++ < 150) {
        gc();
        var start = window.performance.now();
        create();
        duration += window.performance.now() - start;
        destroy();
      }
      windowProfileEnd(name + ' w GC');
      window.console.log(`Iterations: ${count}; time: ${duration / count} ms / iteration`);

      windowProfile(name + ' w/o GC');
      duration = 0;
      count = 0;
      while (count++ < 150) {
        var start = window.performance.now();
        create();
        duration += window.performance.now() - start;
        destroy();
      }
      windowProfileEnd(name + ' w/o GC');
      window.console.log(`Iterations: ${count}; time: ${duration / count} ms / iteration`);
    };
  }

  function noop() {}

  function createData(): TreeNode {
    var values = count++ % 2 == 0 ? ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '*'] :
                                    ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', '-'];
    return buildTree(MAX_DEPTH, values, 0);
  }

  function ng2DestroyDom() {
    app.initData = null;
    appRef.tick();
  }

  function ng2CreateDom() {
    app.initData = createData();
    appRef.tick();
  }

  function initNg2() {
    bootstrap(AppComponentWithStaticTree, createBindings())
        .then((ref) => {
          var injector = ref.injector;
          appRef = injector.get(ApplicationRef);

          app = ref.instance;
          bindAction('#ng2DestroyDom', ng2DestroyDom);
          bindAction('#ng2CreateDom', ng2CreateDom);
          bindAction('#ng2UpdateDomProfile', profile(ng2CreateDom, noop, 'ng2-update'));
          bindAction('#ng2CreateDomProfile', profile(ng2CreateDom, ng2DestroyDom, 'ng2-create'));
        });
  }

  function baselineDestroyDom() { baselineRootTreeComponent.update(null); }

  function baselineCreateDom() { baselineRootTreeComponent.update(createData()); }

  function initBaseline() {
    var tree = DOM.createElement('tree');
    DOM.appendChild(DOM.querySelector(document, 'baseline'), tree);
    baselineRootTreeComponent = new BaselineAppComponent(tree, MAX_DEPTH);

    bindAction('#baselineDestroyDom', baselineDestroyDom);
    bindAction('#baselineCreateDom', baselineCreateDom);

    bindAction('#baselineUpdateDomProfile', profile(baselineCreateDom, noop, 'baseline-update'));
    bindAction('#baselineCreateDomProfile',
               profile(baselineCreateDom, baselineDestroyDom, 'baseline-create'));
  }

  initNg2();
  initBaseline();
}

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

// http://jsperf.com/nextsibling-vs-childnodes

class BaselineAppComponent {
  tree: BaseLineTreeComponent = null;
  constructor(public element, public depth: number) {}
  update(value: TreeNode) {
    if (value === null) {
      this.tree = null;
      DOM.clearNodes(this.element);
    } else {
      if (this.tree === null) {
        this.tree = new BaseLineTreeComponent(this.element, this.depth);
      }
      this.tree.update(value);
    }
  }
}

var BASELINE_TREE_TEMPLATE = null;
class BaseLineTreeComponent {
  static getTemplate() {
    if (BASELINE_TREE_TEMPLATE === null) {
      BASELINE_TREE_TEMPLATE = DOM.createTemplate('<span>_<tree></tree><tree></tree></span>');
    }
    return BASELINE_TREE_TEMPLATE;
  }

  value: BaseLineInterpolation;
  left: BaseLineTreeComponent;
  right: BaseLineTreeComponent;
  terminal: boolean;

  constructor(public element, remainingDepth: number) {
    var clone = DOM.firstChild(DOM.importIntoDoc(BaseLineTreeComponent.getTemplate().content));
    DOM.appendChild(this.element, clone);
    var child = clone.firstChild;
    this.value = new BaseLineInterpolation(child);
    this.terminal = remainingDepth === 0;
    if (!this.terminal) {
      child = DOM.nextSibling(child);
      this.left = new BaseLineTreeComponent(child, remainingDepth - 1);
      child = DOM.nextSibling(child);
      this.right = new BaseLineTreeComponent(child, remainingDepth - 1);
    }
  }
  update(value: TreeNode) {
    this.value.update(value.value);
    if (!this.terminal) {
      this.left.update(value.left);
      this.right.update(value.right);
    }
  }
}

class BaseLineInterpolation {
  value: string;
  textNode;
  constructor(textNode) {
    this.value = null;
    this.textNode = textNode;
  }
  update(value: string) {
    if (this.value !== value) {
      this.value = value;
      DOM.setText(this.textNode, value + ' ');
    }
  }
}

class StaticTreeComponentBase {
  _value: TreeNode;
  constructor() { this.data = null; }
  set data(value: TreeNode) {
    // TODO: We need an initial value as otherwise the getter for data.value will fail
    // --> this should be already caught in change detection!
    value = value !== null ? value : new TreeNode('', null, null);
    this._value = value;
  }
  get data() { return this._value; }
}

@Component(
    {selector: 'tree', inputs: ['data'], directives: [], template: '<span>{{data.value}} </span>'})
class StaticTreeComponent0 extends StaticTreeComponentBase {
}

@Component({
  selector: 'tree',
  inputs: ['data'],
  directives: [StaticTreeComponent0],
  template: `<span> {{data.value}} <tree [data]='data.right'></tree><tree [data]='data.left'></tree></span>`
})
class StaticTreeComponent1 extends StaticTreeComponentBase {
}

@Component({
  selector: 'tree',
  inputs: ['data'],
  directives: [StaticTreeComponent1],
  template: `<span> {{data.value}} <tree [data]='data.right'></tree><tree [data]='data.left'></tree></span>`
})
class StaticTreeComponent2 extends StaticTreeComponentBase {
  data: TreeNode;
}

@Component({
  selector: 'tree',
  inputs: ['data'],
  directives: [StaticTreeComponent2],
  template: `<span> {{data.value}} <tree [data]='data.right'></tree><tree [data]='data.left'></tree></span>`
})
class StaticTreeComponent3 extends StaticTreeComponentBase {
}

@Component({
  selector: 'tree',
  inputs: ['data'],
  directives: [StaticTreeComponent3],
  template: `<span> {{data.value}} <tree [data]='data.right'></tree><tree [data]='data.left'></tree></span>`
})
class StaticTreeComponent4 extends StaticTreeComponentBase {
}

@Component({
  selector: 'tree',
  inputs: ['data'],
  directives: [StaticTreeComponent4],
  template: `<span> {{data.value}} <tree [data]='data.right'></tree><tree [data]='data.left'></tree></span>`
})
class StaticTreeComponent5 extends StaticTreeComponentBase {
}

@Component({
  selector: 'tree',
  inputs: ['data'],
  directives: [StaticTreeComponent5],
  template: `<span> {{data.value}} <tree [data]='data.right'></tree><tree [data]='data.left'></tree></span>`
})
class StaticTreeComponent6 extends StaticTreeComponentBase {
}

@Component({
  selector: 'tree',
  inputs: ['data'],
  directives: [StaticTreeComponent6],
  template: `<span> {{data.value}} <tree [data]='data.right'></tree><tree [data]='data.left'></tree></span>`
})
class StaticTreeComponent7 extends StaticTreeComponentBase {
}

@Component({
  selector: 'tree',
  inputs: ['data'],
  directives: [StaticTreeComponent7],
  template: `<span> {{data.value}} <tree [data]='data.right'></tree><tree [data]='data.left'></tree></span>`
})
class StaticTreeComponent8 extends StaticTreeComponentBase {
}

@Component({
  selector: 'tree',
  inputs: ['data'],
  directives: [StaticTreeComponent8],
  template: `<span> {{data.value}} <tree [data]='data.right'></tree><tree [data]='data.left'></tree></span>`
})
class StaticTreeComponent9 extends StaticTreeComponentBase {
}

@Component({
  selector: 'app',
  directives: [StaticTreeComponent9, NgIf],
  template: `<tree *ngIf="initData != null" [data]='initData'></tree>`
})
class AppComponentWithStaticTree {
  initData: TreeNode;
}
