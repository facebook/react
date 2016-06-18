import {ChangeDetectorRef, ComponentFactory, ComponentRef, EventEmitter, Injector, OnChanges, ReflectiveInjector, SimpleChange, SimpleChanges} from '@angular/core';

import * as angular from './angular_js';
import {NG1_SCOPE} from './constants';
import {ComponentInfo} from './metadata';

const INITIAL_VALUE = {
  __UNINITIALIZED__: true
};

export class DowngradeNg2ComponentAdapter {
  component: any = null;
  inputChangeCount: number = 0;
  inputChanges: SimpleChanges = null;
  componentRef: ComponentRef<any> = null;
  changeDetector: ChangeDetectorRef = null;
  componentScope: angular.IScope;
  childNodes: Node[];
  contentInsertionPoint: Node = null;

  constructor(
      private id: string, private info: ComponentInfo, private element: angular.IAugmentedJQuery,
      private attrs: angular.IAttributes, private scope: angular.IScope,
      private parentInjector: Injector, private parse: angular.IParseService,
      private componentFactory: ComponentFactory<any>) {
    (<any>this.element[0]).id = id;
    this.componentScope = scope.$new();
    this.childNodes = <Node[]><any>element.contents();
  }

  bootstrapNg2() {
    var childInjector = ReflectiveInjector.resolveAndCreate(
        [{provide: NG1_SCOPE, useValue: this.componentScope}], this.parentInjector);
    this.contentInsertionPoint = document.createComment('ng1 insertion point');

    this.componentRef = this.componentFactory.create(
        childInjector, [[this.contentInsertionPoint]], this.element[0]);
    this.changeDetector = this.componentRef.changeDetectorRef;
    this.component = this.componentRef.instance;
  }

  setupInputs(): void {
    var attrs = this.attrs;
    var inputs = this.info.inputs;
    for (var i = 0; i < inputs.length; i++) {
      var input = inputs[i];
      var expr: any /** TODO #9100 */ = null;
      if (attrs.hasOwnProperty(input.attr)) {
        var observeFn = ((prop: any /** TODO #9100 */) => {
          var prevValue = INITIAL_VALUE;
          return (value: any /** TODO #9100 */) => {
            if (this.inputChanges !== null) {
              this.inputChangeCount++;
              this.inputChanges[prop] =
                  new Ng1Change(value, prevValue === INITIAL_VALUE ? value : prevValue);
              prevValue = value;
            }
            this.component[prop] = value;
          };
        })(input.prop);
        attrs.$observe(input.attr, observeFn);
      } else if (attrs.hasOwnProperty(input.bindAttr)) {
        expr = (attrs as any /** TODO #9100 */)[input.bindAttr];
      } else if (attrs.hasOwnProperty(input.bracketAttr)) {
        expr = (attrs as any /** TODO #9100 */)[input.bracketAttr];
      } else if (attrs.hasOwnProperty(input.bindonAttr)) {
        expr = (attrs as any /** TODO #9100 */)[input.bindonAttr];
      } else if (attrs.hasOwnProperty(input.bracketParenAttr)) {
        expr = (attrs as any /** TODO #9100 */)[input.bracketParenAttr];
      }
      if (expr != null) {
        var watchFn =
            ((prop: any /** TODO #9100 */) =>
                 (value: any /** TODO #9100 */, prevValue: any /** TODO #9100 */) => {
                   if (this.inputChanges != null) {
                     this.inputChangeCount++;
                     this.inputChanges[prop] = new Ng1Change(prevValue, value);
                   }
                   this.component[prop] = value;
                 })(input.prop);
        this.componentScope.$watch(expr, watchFn);
      }
    }

    var prototype = this.info.type.prototype;
    if (prototype && (<OnChanges>prototype).ngOnChanges) {
      // Detect: OnChanges interface
      this.inputChanges = {};
      this.componentScope.$watch(() => this.inputChangeCount, () => {
        var inputChanges = this.inputChanges;
        this.inputChanges = {};
        (<OnChanges>this.component).ngOnChanges(inputChanges);
      });
    }
    this.componentScope.$watch(() => this.changeDetector && this.changeDetector.detectChanges());
  }

  projectContent() {
    var childNodes = this.childNodes;
    var parent = this.contentInsertionPoint.parentNode;
    if (parent) {
      for (var i = 0, ii = childNodes.length; i < ii; i++) {
        parent.insertBefore(childNodes[i], this.contentInsertionPoint);
      }
    }
  }

  setupOutputs() {
    var attrs = this.attrs;
    var outputs = this.info.outputs;
    for (var j = 0; j < outputs.length; j++) {
      var output = outputs[j];
      var expr: any /** TODO #9100 */ = null;
      var assignExpr = false;

      var bindonAttr =
          output.bindonAttr ? output.bindonAttr.substring(0, output.bindonAttr.length - 6) : null;
      var bracketParenAttr = output.bracketParenAttr ?
          `[(${output.bracketParenAttr.substring(2, output.bracketParenAttr.length - 8)})]` :
          null;

      if (attrs.hasOwnProperty(output.onAttr)) {
        expr = (attrs as any /** TODO #9100 */)[output.onAttr];
      } else if (attrs.hasOwnProperty(output.parenAttr)) {
        expr = (attrs as any /** TODO #9100 */)[output.parenAttr];
      } else if (attrs.hasOwnProperty(bindonAttr)) {
        expr = (attrs as any /** TODO #9100 */)[bindonAttr];
        assignExpr = true;
      } else if (attrs.hasOwnProperty(bracketParenAttr)) {
        expr = (attrs as any /** TODO #9100 */)[bracketParenAttr];
        assignExpr = true;
      }

      if (expr != null && assignExpr != null) {
        var getter = this.parse(expr);
        var setter = getter.assign;
        if (assignExpr && !setter) {
          throw new Error(`Expression '${expr}' is not assignable!`);
        }
        var emitter = this.component[output.prop] as EventEmitter<any>;
        if (emitter) {
          emitter.subscribe({
            next: assignExpr ?
                ((setter: any) => (v: any /** TODO #9100 */) => setter(this.scope, v))(setter) :
                ((getter: any) => (v: any /** TODO #9100 */) =>
                     getter(this.scope, {$event: v}))(getter)
          });
        } else {
          throw new Error(`Missing emitter '${output.prop}' on component '${this.info.selector}'!`);
        }
      }
    }
  }

  registerCleanup() {
    this.element.bind('$destroy', () => {
      this.componentScope.$destroy();
      this.componentRef.destroy();
    });
  }
}

class Ng1Change implements SimpleChange {
  constructor(public previousValue: any, public currentValue: any) {}

  isFirstChange(): boolean { return this.previousValue === this.currentValue; }
}
