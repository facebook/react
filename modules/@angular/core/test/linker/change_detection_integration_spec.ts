import {afterEach, beforeEach, beforeEachProviders, ddescribe, describe, expect, iit, inject, it, xit} from '@angular/core/testing/testing_internal';

import {fakeAsync, flushMicrotasks, Log, tick,} from '@angular/core/testing';
import {TestComponentBuilder, ComponentFixture} from '@angular/compiler/testing';

import {isBlank, NumberWrapper,} from '../../src/facade/lang';
import {BaseException} from '../../src/facade/exceptions';
import {StringMapWrapper} from '../../src/facade/collection';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';

import {PipeTransform, ChangeDetectionStrategy, WrappedValue,} from '@angular/core/src/change_detection/change_detection';

import {OnDestroy} from '@angular/core/src/metadata/lifecycle_hooks';

import {IS_DART, Type} from '../../src/facade/lang';
import {EventEmitter, ObservableWrapper} from '../../src/facade/async';


import {Component, DebugElement, Directive, TemplateRef, ChangeDetectorRef, ViewContainerRef, Input, Output, forwardRef, ViewMetadata, Pipe, RootRenderer, Renderer, RenderComponentType, Injectable, provide, OnInit, DoCheck, OnChanges, AfterContentInit, AfterContentChecked, AfterViewInit, AfterViewChecked} from '@angular/core';
import {NgFor, NgIf} from '@angular/common';
import {By} from '@angular/platform-browser/src/dom/debug/by';
import {AsyncPipe} from '@angular/common';

import {ElementSchemaRegistry} from '@angular/compiler/src/schema/element_schema_registry';
import {MockSchemaRegistry} from '@angular/compiler/testing';
import {TEST_PROVIDERS} from '@angular/compiler/test/test_bindings';
import {DebugDomRenderer} from '@angular/core/src/debug/debug_renderer';
import {DomRootRenderer} from '@angular/platform-browser/src/dom/dom_renderer';

export function main() {
  var tcb: TestComponentBuilder;
  var elSchema: MockSchemaRegistry;
  var renderLog: RenderLog;
  var directiveLog: DirectiveLog;

  function createCompFixture(
      template: string, compType: Type = TestComponent,
      _tcb: TestComponentBuilder = null): ComponentFixture<any> {
    if (isBlank(_tcb)) {
      _tcb = tcb;
    }
    return _tcb
        .overrideView(
            compType,
            new ViewMetadata({template: template, directives: ALL_DIRECTIVES, pipes: ALL_PIPES}))
        .createFakeAsync(compType);
  }

  function queryDirs(el: DebugElement, dirType: Type): any {
    var nodes = el.queryAllNodes(By.directive(dirType));
    return nodes.map(node => node.injector.get(dirType));
  }

  function _bindSimpleProp(
      bindAttr: string, compType: Type = TestComponent): ComponentFixture<any> {
    var template = `<div ${bindAttr}></div>`;
    return createCompFixture(template, compType);
  }

  function _bindSimpleValue(
      expression: any, compType: Type = TestComponent): ComponentFixture<any> {
    return _bindSimpleProp(`[someProp]='${expression}'`, compType);
  }

  function _bindAndCheckSimpleValue(expression: any, compType: Type = TestComponent): string[] {
    var ctx = _bindSimpleValue(expression, compType);
    ctx.detectChanges(false);
    return renderLog.log;
  }

  describe(`ChangeDetection`, () => {
    // On CJS fakeAsync is not supported...
    if (!getDOM().supportsDOMEvents()) return;

    beforeEachProviders(
        () =>
            [RenderLog, DirectiveLog, {provide: RootRenderer, useClass: LoggingRootRenderer},
             TEST_PROVIDERS,
    ]);

    beforeEach(inject(
        [TestComponentBuilder, ElementSchemaRegistry, RenderLog, DirectiveLog],
        (_tcb: TestComponentBuilder, _elSchema: MockSchemaRegistry, _renderLog: RenderLog,
         _directiveLog: DirectiveLog) => {
          tcb = _tcb;
          elSchema = _elSchema;
          renderLog = _renderLog;
          directiveLog = _directiveLog;
          elSchema.existingProperties['someProp'] = true;
        }));

    describe('expressions', () => {

      it('should support literals',
         fakeAsync(() => { expect(_bindAndCheckSimpleValue(10)).toEqual(['someProp=10']); }));

      it('should strip quotes from literals',
         fakeAsync(() => { expect(_bindAndCheckSimpleValue('"str"')).toEqual(['someProp=str']); }));

      it('should support newlines in literals', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('"a\n\nb"')).toEqual(['someProp=a\n\nb']);
         }));

      it('should support + operations',
         fakeAsync(() => { expect(_bindAndCheckSimpleValue('10 + 2')).toEqual(['someProp=12']); }));

      it('should support - operations',
         fakeAsync(() => { expect(_bindAndCheckSimpleValue('10 - 2')).toEqual(['someProp=8']); }));

      it('should support * operations',
         fakeAsync(() => { expect(_bindAndCheckSimpleValue('10 * 2')).toEqual(['someProp=20']); }));

      it('should support / operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('10 / 2')).toEqual([`someProp=${5.0}`]);
         }));  // dart exp=5.0, js exp=5

      it('should support % operations',
         fakeAsync(() => { expect(_bindAndCheckSimpleValue('11 % 2')).toEqual(['someProp=1']); }));

      it('should support == operations on identical', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('1 == 1')).toEqual(['someProp=true']);
         }));

      it('should support != operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('1 != 1')).toEqual(['someProp=false']);
         }));

      it('should support == operations on coerceible', fakeAsync(() => {
           var expectedValue = IS_DART ? 'false' : 'true';
           expect(_bindAndCheckSimpleValue('1 == true')).toEqual([`someProp=${expectedValue}`]);
         }));

      it('should support === operations on identical', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('1 === 1')).toEqual(['someProp=true']);
         }));

      it('should support !== operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('1 !== 1')).toEqual(['someProp=false']);
         }));

      it('should support === operations on coerceible', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('1 === true')).toEqual(['someProp=false']);
         }));

      it('should support true < operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('1 < 2')).toEqual(['someProp=true']);
         }));

      it('should support false < operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('2 < 1')).toEqual(['someProp=false']);
         }));

      it('should support false > operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('1 > 2')).toEqual(['someProp=false']);
         }));

      it('should support true > operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('2 > 1')).toEqual(['someProp=true']);
         }));

      it('should support true <= operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('1 <= 2')).toEqual(['someProp=true']);
         }));

      it('should support equal <= operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('2 <= 2')).toEqual(['someProp=true']);
         }));

      it('should support false <= operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('2 <= 1')).toEqual(['someProp=false']);
         }));

      it('should support true >= operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('2 >= 1')).toEqual(['someProp=true']);
         }));

      it('should support equal >= operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('2 >= 2')).toEqual(['someProp=true']);
         }));

      it('should support false >= operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('1 >= 2')).toEqual(['someProp=false']);
         }));

      it('should support true && operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('true && true')).toEqual(['someProp=true']);
         }));

      it('should support false && operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('true && false')).toEqual(['someProp=false']);
         }));

      it('should support true || operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('true || false')).toEqual(['someProp=true']);
         }));

      it('should support false || operations', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('false || false')).toEqual(['someProp=false']);
         }));

      it('should support negate', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('!true')).toEqual(['someProp=false']);
         }));

      it('should support double negate', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('!!true')).toEqual(['someProp=true']);
         }));

      it('should support true conditionals', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('1 < 2 ? 1 : 2')).toEqual(['someProp=1']);
         }));

      it('should support false conditionals', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('1 > 2 ? 1 : 2')).toEqual(['someProp=2']);
         }));

      it('should support keyed access to a list item', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('["foo", "bar"][0]')).toEqual(['someProp=foo']);
         }));

      it('should support keyed access to a map item', fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('{"foo": "bar"}["foo"]')).toEqual(['someProp=bar']);
         }));

      it('should report all changes on the first run including uninitialized values',
         fakeAsync(() => {
           expect(_bindAndCheckSimpleValue('value', Uninitialized)).toEqual(['someProp=null']);
         }));

      it('should report all changes on the first run including null values', fakeAsync(() => {
           var ctx = _bindSimpleValue('a', TestData);
           ctx.componentInstance.a = null;
           ctx.detectChanges(false);
           expect(renderLog.log).toEqual(['someProp=null']);
         }));

      it('should support simple chained property access', fakeAsync(() => {
           var ctx = _bindSimpleValue('address.city', Person);
           ctx.componentInstance.name = 'Victor';
           ctx.componentInstance.address = new Address('Grenoble');
           ctx.detectChanges(false);
           expect(renderLog.log).toEqual(['someProp=Grenoble']);
         }));

      describe('safe navigation operator', () => {
        it('should support reading properties of nulls', fakeAsync(() => {
             var ctx = _bindSimpleValue('address?.city', Person);
             ctx.componentInstance.address = null;
             ctx.detectChanges(false);
             expect(renderLog.log).toEqual(['someProp=null']);
           }));

        it('should support calling methods on nulls', fakeAsync(() => {
             var ctx = _bindSimpleValue('address?.toString()', Person);
             ctx.componentInstance.address = null;
             ctx.detectChanges(false);
             expect(renderLog.log).toEqual(['someProp=null']);
           }));

        it('should support reading properties on non nulls', fakeAsync(() => {
             var ctx = _bindSimpleValue('address?.city', Person);
             ctx.componentInstance.address = new Address('MTV');
             ctx.detectChanges(false);
             expect(renderLog.log).toEqual(['someProp=MTV']);
           }));

        it('should support calling methods on non nulls', fakeAsync(() => {
             var ctx = _bindSimpleValue('address?.toString()', Person);
             ctx.componentInstance.address = new Address('MTV');
             ctx.detectChanges(false);
             expect(renderLog.log).toEqual(['someProp=MTV']);
           }));
      });

      it('should support method calls', fakeAsync(() => {
           var ctx = _bindSimpleValue('sayHi("Jim")', Person);
           ctx.detectChanges(false);
           expect(renderLog.log).toEqual(['someProp=Hi, Jim']);
         }));

      it('should support function calls', fakeAsync(() => {
           var ctx = _bindSimpleValue('a()(99)', TestData);
           ctx.componentInstance.a = () => (a: any /** TODO #9100 */) => a;
           ctx.detectChanges(false);
           expect(renderLog.log).toEqual(['someProp=99']);
         }));

      it('should support chained method calls', fakeAsync(() => {
           var ctx = _bindSimpleValue('address.toString()', Person);
           ctx.componentInstance.address = new Address('MTV');
           ctx.detectChanges(false);
           expect(renderLog.log).toEqual(['someProp=MTV']);
         }));

      it('should support NaN', fakeAsync(() => {
           var ctx = _bindSimpleValue('age', Person);
           ctx.componentInstance.age = NumberWrapper.NaN;
           ctx.detectChanges(false);

           expect(renderLog.log).toEqual(['someProp=NaN']);
           renderLog.clear();

           ctx.detectChanges(false);
           expect(renderLog.log).toEqual([]);
         }));

      it('should do simple watching', fakeAsync(() => {
           var ctx = _bindSimpleValue('name', Person);
           ctx.componentInstance.name = 'misko';

           ctx.detectChanges(false);
           expect(renderLog.log).toEqual(['someProp=misko']);
           renderLog.clear();

           ctx.detectChanges(false);
           expect(renderLog.log).toEqual([]);
           renderLog.clear();

           ctx.componentInstance.name = 'Misko';
           ctx.detectChanges(false);
           expect(renderLog.log).toEqual(['someProp=Misko']);
         }));

      it('should support literal array made of literals', fakeAsync(() => {
           var ctx = _bindSimpleValue('[1, 2]');
           ctx.detectChanges(false);
           expect(renderLog.loggedValues).toEqual([[1, 2]]);
         }));

      it('should support empty literal array', fakeAsync(() => {
           var ctx = _bindSimpleValue('[]');
           ctx.detectChanges(false);
           expect(renderLog.loggedValues).toEqual([[]]);
         }));

      it('should support literal array made of expressions', fakeAsync(() => {
           var ctx = _bindSimpleValue('[1, a]', TestData);
           ctx.componentInstance.a = 2;
           ctx.detectChanges(false);
           expect(renderLog.loggedValues).toEqual([[1, 2]]);
         }));

      it('should not recreate literal arrays unless their content changed', fakeAsync(() => {
           var ctx = _bindSimpleValue('[1, a]', TestData);
           ctx.componentInstance.a = 2;
           ctx.detectChanges(false);
           ctx.detectChanges(false);
           ctx.componentInstance.a = 3;
           ctx.detectChanges(false);
           ctx.detectChanges(false);
           expect(renderLog.loggedValues).toEqual([[1, 2], [1, 3]]);
         }));

      it('should support literal maps made of literals', fakeAsync(() => {
           var ctx = _bindSimpleValue('{z: 1}');
           ctx.detectChanges(false);
           expect(renderLog.loggedValues[0]['z']).toEqual(1);
         }));

      it('should support empty literal map', fakeAsync(() => {
           var ctx = _bindSimpleValue('{}');
           ctx.detectChanges(false);
           expect(renderLog.loggedValues).toEqual([{}]);
         }));

      it('should support literal maps made of expressions', fakeAsync(() => {
           var ctx = _bindSimpleValue('{z: a}');
           ctx.componentInstance.a = 1;
           ctx.detectChanges(false);
           expect(renderLog.loggedValues[0]['z']).toEqual(1);
         }));

      it('should not recreate literal maps unless their content changed', fakeAsync(() => {
           var ctx = _bindSimpleValue('{z: a}');
           ctx.componentInstance.a = 1;
           ctx.detectChanges(false);
           ctx.detectChanges(false);
           ctx.componentInstance.a = 2;
           ctx.detectChanges(false);
           ctx.detectChanges(false);
           expect(renderLog.loggedValues.length).toBe(2);
           expect(renderLog.loggedValues[0]['z']).toEqual(1);
           expect(renderLog.loggedValues[1]['z']).toEqual(2);
         }));


      it('should support interpolation', fakeAsync(() => {
           var ctx = _bindSimpleProp('someProp="B{{a}}A"', TestData);
           ctx.componentInstance.a = 'value';
           ctx.detectChanges(false);

           expect(renderLog.log).toEqual(['someProp=BvalueA']);
         }));

      it('should output empty strings for null values in interpolation', fakeAsync(() => {
           var ctx = _bindSimpleProp('someProp="B{{a}}A"', TestData);
           ctx.componentInstance.a = null;
           ctx.detectChanges(false);

           expect(renderLog.log).toEqual(['someProp=BA']);
         }));

      it('should escape values in literals that indicate interpolation',
         fakeAsync(() => { expect(_bindAndCheckSimpleValue('"$"')).toEqual(['someProp=$']); }));

      it('should read locals', fakeAsync(() => {
           var ctx =
               createCompFixture('<template testLocals let-local="someLocal">{{local}}</template>');
           ctx.detectChanges(false);

           expect(renderLog.log).toEqual(['{{someLocalValue}}']);
         }));

      describe('pipes', () => {
        it('should use the return value of the pipe', fakeAsync(() => {
             var ctx = _bindSimpleValue('name | countingPipe', Person);
             ctx.componentInstance.name = 'bob';
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual(['bob state:0']);
           }));

        it('should support arguments in pipes', fakeAsync(() => {
             var ctx = _bindSimpleValue('name | multiArgPipe:"one":address.city', Person);
             ctx.componentInstance.name = 'value';
             ctx.componentInstance.address = new Address('two');
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual(['value one two default']);
           }));

        it('should associate pipes right-to-left', fakeAsync(() => {
             var ctx = _bindSimpleValue('name | multiArgPipe:"a":"b" | multiArgPipe:0:1', Person);
             ctx.componentInstance.name = 'value';
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual(['value a b default 0 1 default']);
           }));

        it('should support calling pure pipes with different number of arguments', fakeAsync(() => {
             var ctx = _bindSimpleValue('name | multiArgPipe:"a":"b" | multiArgPipe:0:1:2', Person);
             ctx.componentInstance.name = 'value';
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual(['value a b default 0 1 2']);
           }));

        it('should do nothing when no change', fakeAsync(() => {
             var ctx = _bindSimpleValue('"Megatron" | identityPipe', Person);

             ctx.detectChanges(false);

             expect(renderLog.log).toEqual(['someProp=Megatron']);

             renderLog.clear();
             ctx.detectChanges(false);

             expect(renderLog.log).toEqual([]);
           }));

        it('should unwrap the wrapped value', fakeAsync(() => {
             var ctx = _bindSimpleValue('"Megatron" | wrappedPipe', Person);

             ctx.detectChanges(false);

             expect(renderLog.log).toEqual(['someProp=Megatron']);

             renderLog.clear();
             ctx.detectChanges(false);

             expect(renderLog.log).toEqual(['someProp=Megatron']);
           }));

        it('should call pure pipes only if the arguments change', fakeAsync(() => {
             var ctx = _bindSimpleValue('name | countingPipe', Person);
             // change from undefined -> null
             ctx.componentInstance.name = null;
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual(['null state:0']);
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual(['null state:0']);

             // change from null -> some value
             ctx.componentInstance.name = 'bob';
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual(['null state:0', 'bob state:1']);
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual(['null state:0', 'bob state:1']);

             // change from some value -> some other value
             ctx.componentInstance.name = 'bart';
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual([
               'null state:0', 'bob state:1', 'bart state:2'
             ]);
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual([
               'null state:0', 'bob state:1', 'bart state:2'
             ]);

           }));

        it('should call pure pipes that are used multiple times only when the arguments change',
           fakeAsync(() => {
             var ctx = createCompFixture(
                 `<div [someProp]="name | countingPipe"></div><div [someProp]="age | countingPipe"></div>` +
                     '<div *ngFor="let x of [1,2]" [someProp]="address.city | countingPipe"></div>',
                 Person);
             ctx.componentInstance.name = 'a';
             ctx.componentInstance.age = 10;
             ctx.componentInstance.address = new Address('mtv');
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual([
               'mtv state:0', 'mtv state:1', 'a state:2', '10 state:3'
             ]);
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual([
               'mtv state:0', 'mtv state:1', 'a state:2', '10 state:3'
             ]);
             ctx.componentInstance.age = 11;
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual([
               'mtv state:0', 'mtv state:1', 'a state:2', '10 state:3', '11 state:4'
             ]);
           }));

        it('should call impure pipes on each change detection run', fakeAsync(() => {
             var ctx = _bindSimpleValue('name | countingImpurePipe', Person);
             ctx.componentInstance.name = 'bob';
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual(['bob state:0']);
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual(['bob state:0', 'bob state:1']);
           }));
      });

      describe('event expressions', () => {
        it('should support field assignments', fakeAsync(() => {
             var ctx = _bindSimpleProp('(event)="b=a=$event"');
             var childEl = ctx.debugElement.children[0];
             var evt = 'EVENT';
             childEl.triggerEventHandler('event', evt);

             expect(ctx.componentInstance.a).toEqual(evt);
             expect(ctx.componentInstance.b).toEqual(evt);
           }));

        it('should support keyed assignments', fakeAsync(() => {
             var ctx = _bindSimpleProp('(event)="a[0]=$event"');
             var childEl = ctx.debugElement.children[0];
             ctx.componentInstance.a = ['OLD'];
             var evt = 'EVENT';
             childEl.triggerEventHandler('event', evt);
             expect(ctx.componentInstance.a).toEqual([evt]);
           }));

        it('should support chains', fakeAsync(() => {
             var ctx = _bindSimpleProp('(event)="a=a+1; a=a+1;"');
             var childEl = ctx.debugElement.children[0];
             ctx.componentInstance.a = 0;
             childEl.triggerEventHandler('event', 'EVENT');
             expect(ctx.componentInstance.a).toEqual(2);
           }));

        it('should throw when trying to assign to a local', fakeAsync(() => {
             expect(() => {_bindSimpleProp('(event)="$event=1"')})
                 .toThrowError(new RegExp('Cannot assign to a reference or variable!'));
           }));

        it('should support short-circuiting', fakeAsync(() => {
             var ctx = _bindSimpleProp('(event)="true ? a = a + 1 : a = a + 1"');
             var childEl = ctx.debugElement.children[0];
             ctx.componentInstance.a = 0;
             childEl.triggerEventHandler('event', 'EVENT');
             expect(ctx.componentInstance.a).toEqual(1);
           }));
      });

    });

    describe('change notification', () => {
      describe('updating directives', () => {
        it('should happen without invoking the renderer', fakeAsync(() => {
             var ctx = createCompFixture('<div testDirective [a]="42"></div>');
             ctx.detectChanges(false);
             expect(renderLog.log).toEqual([]);
             expect(queryDirs(ctx.debugElement, TestDirective)[0].a).toEqual(42);
           }));
      });

      describe('reading directives', () => {
        it('should read directive properties', fakeAsync(() => {
             var ctx = createCompFixture(
                 '<div testDirective [a]="42" ref-dir="testDirective" [someProp]="dir.a"></div>')
             ctx.detectChanges(false);
             expect(renderLog.loggedValues).toEqual([42]);
           }));
      });

      describe('ngOnChanges', () => {
        it('should notify the directive when a group of records changes', fakeAsync(() => {
             var ctx = createCompFixture(
                 '<div [testDirective]="\'aName\'" [a]="1" [b]="2"></div><div [testDirective]="\'bName\'" [a]="4"></div>');
             ctx.detectChanges(false);

             var dirs = queryDirs(ctx.debugElement, TestDirective);
             expect(dirs[0].changes).toEqual({'a': 1, 'b': 2, 'name': 'aName'});
             expect(dirs[1].changes).toEqual({'a': 4, 'name': 'bName'});
           }));
      });
    });

    describe('lifecycle', () => {
      function createCompWithContentAndViewChild(): ComponentFixture<any> {
        return createCompFixture(
            '<div testDirective="parent"><div *ngIf="true" testDirective="contentChild"></div><other-cmp></other-cmp></div>',
            TestComponent,
            tcb.overrideTemplate(AnotherComponent, '<div testDirective="viewChild"></div>'));
      }

      describe('ngOnInit', () => {
        it('should be called after ngOnChanges', fakeAsync(() => {
             var ctx = createCompFixture('<div testDirective="dir"></div>');
             expect(directiveLog.filter(['ngOnInit', 'ngOnChanges'])).toEqual([]);

             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngOnInit', 'ngOnChanges'])).toEqual([
               'dir.ngOnChanges', 'dir.ngOnInit'
             ]);
             directiveLog.clear();

             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngOnInit'])).toEqual([]);
           }));

        it('should only be called only once', fakeAsync(() => {
             var ctx = createCompFixture('<div testDirective="dir"></div>');

             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngOnInit'])).toEqual(['dir.ngOnInit']);

             // reset directives
             directiveLog.clear();

             // Verify that checking should not call them.
             ctx.checkNoChanges();

             expect(directiveLog.filter(['ngOnInit'])).toEqual([]);

             // re-verify that changes should not call them
             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngOnInit'])).toEqual([]);
           }));

        it('should not call ngOnInit again if it throws', fakeAsync(() => {
             var ctx = createCompFixture('<div testDirective="dir" throwOn="ngOnInit"></div>');

             var errored = false;
             // First pass fails, but ngOnInit should be called.
             try {
               ctx.detectChanges(false);
             } catch (e) {
               errored = true;
             }
             expect(errored).toBe(true);

             expect(directiveLog.filter(['ngOnInit'])).toEqual(['dir.ngOnInit']);
             directiveLog.clear();

             // Second change detection also fails, but this time ngOnInit should not be called.
             try {
               ctx.detectChanges(false);
             } catch (e) {
               throw new BaseException('Second detectChanges() should not have run detection.');
             }
             expect(directiveLog.filter(['ngOnInit'])).toEqual([]);
           }));
      });

      describe('ngDoCheck', () => {
        it('should be called after ngOnInit', fakeAsync(() => {
             var ctx = createCompFixture('<div testDirective="dir"></div>');

             ctx.detectChanges(false);
             expect(directiveLog.filter(['ngDoCheck', 'ngOnInit'])).toEqual([
               'dir.ngOnInit', 'dir.ngDoCheck'
             ]);
           }));

        it('should be called on every detectChanges run, except for checkNoChanges',
           fakeAsync(() => {
             var ctx = createCompFixture('<div testDirective="dir"></div>');

             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngDoCheck'])).toEqual(['dir.ngDoCheck']);

             // reset directives
             directiveLog.clear();

             // Verify that checking should not call them.
             ctx.checkNoChanges();

             expect(directiveLog.filter(['ngDoCheck'])).toEqual([]);

             // re-verify that changes are still detected
             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngDoCheck'])).toEqual(['dir.ngDoCheck']);
           }));
      });

      describe('ngAfterContentInit', () => {
        it('should be called after processing the content children but before the view children',
           fakeAsync(() => {
             var ctx = createCompWithContentAndViewChild();

             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngDoCheck', 'ngAfterContentInit'])).toEqual([
               'parent.ngDoCheck', 'contentChild.ngDoCheck', 'contentChild.ngAfterContentInit',
               'parent.ngAfterContentInit', 'viewChild.ngDoCheck', 'viewChild.ngAfterContentInit'
             ]);
           }));

        it('should only be called only once', fakeAsync(() => {
             var ctx = createCompFixture('<div testDirective="dir"></div>');

             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngAfterContentInit'])).toEqual([
               'dir.ngAfterContentInit'
             ]);

             // reset directives
             directiveLog.clear();

             // Verify that checking should not call them.
             ctx.checkNoChanges();

             expect(directiveLog.filter(['ngAfterContentInit'])).toEqual([]);

             // re-verify that changes should not call them
             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngAfterContentInit'])).toEqual([]);
           }));

        it('should not call ngAfterContentInit again if it throws', fakeAsync(() => {
             var ctx =
                 createCompFixture('<div testDirective="dir" throwOn="ngAfterContentInit"></div>');

             var errored = false;
             // First pass fails, but ngAfterContentInit should be called.
             try {
               ctx.detectChanges(false);
             } catch (e) {
               errored = true;
             }
             expect(errored).toBe(true);

             expect(directiveLog.filter(['ngAfterContentInit'])).toEqual([
               'dir.ngAfterContentInit'
             ]);
             directiveLog.clear();

             // Second change detection also fails, but this time ngAfterContentInit should not be
             // called.
             try {
               ctx.detectChanges(false);
             } catch (e) {
               throw new BaseException('Second detectChanges() should not have run detection.');
             }
             expect(directiveLog.filter(['ngAfterContentInit'])).toEqual([]);
           }));
      });

      describe('ngAfterContentChecked', () => {
        it('should be called after the content children but before the view children',
           fakeAsync(() => {
             var ctx = createCompWithContentAndViewChild();

             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngDoCheck', 'ngAfterContentChecked'])).toEqual([
               'parent.ngDoCheck', 'contentChild.ngDoCheck', 'contentChild.ngAfterContentChecked',
               'parent.ngAfterContentChecked', 'viewChild.ngDoCheck',
               'viewChild.ngAfterContentChecked'
             ]);
           }));

        it('should be called on every detectChanges run, except for checkNoChanges',
           fakeAsync(() => {
             var ctx = createCompFixture('<div testDirective="dir"></div>');

             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngAfterContentChecked'])).toEqual([
               'dir.ngAfterContentChecked'
             ]);

             // reset directives
             directiveLog.clear();

             // Verify that checking should not call them.
             ctx.checkNoChanges();

             expect(directiveLog.filter(['ngAfterContentChecked'])).toEqual([]);

             // re-verify that changes are still detected
             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngAfterContentChecked'])).toEqual([
               'dir.ngAfterContentChecked'
             ]);
           }));

        it('should be called in reverse order so the child is always notified before the parent',
           fakeAsync(() => {
             var ctx = createCompFixture(
                 '<div testDirective="parent"><div testDirective="child"></div></div>');

             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngAfterContentChecked'])).toEqual([
               'child.ngAfterContentChecked', 'parent.ngAfterContentChecked'
             ]);
           }));
      });


      describe('ngAfterViewInit', () => {
        it('should be called after processing the view children', fakeAsync(() => {
             var ctx = createCompWithContentAndViewChild();

             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngDoCheck', 'ngAfterViewInit'])).toEqual([
               'parent.ngDoCheck', 'contentChild.ngDoCheck', 'contentChild.ngAfterViewInit',
               'viewChild.ngDoCheck', 'viewChild.ngAfterViewInit', 'parent.ngAfterViewInit'
             ]);
           }));

        it('should only be called only once', fakeAsync(() => {
             var ctx = createCompFixture('<div testDirective="dir"></div>');

             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngAfterViewInit'])).toEqual(['dir.ngAfterViewInit']);

             // reset directives
             directiveLog.clear();

             // Verify that checking should not call them.
             ctx.checkNoChanges();

             expect(directiveLog.filter(['ngAfterViewInit'])).toEqual([]);

             // re-verify that changes should not call them
             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngAfterViewInit'])).toEqual([]);
           }));

        it('should not call ngAfterViewInit again if it throws', fakeAsync(() => {
             var ctx =
                 createCompFixture('<div testDirective="dir" throwOn="ngAfterViewInit"></div>');

             var errored = false;
             // First pass fails, but ngAfterViewInit should be called.
             try {
               ctx.detectChanges(false);
             } catch (e) {
               errored = true;
             }
             expect(errored).toBe(true);

             expect(directiveLog.filter(['ngAfterViewInit'])).toEqual(['dir.ngAfterViewInit']);
             directiveLog.clear();

             // Second change detection also fails, but this time ngAfterViewInit should not be
             // called.
             try {
               ctx.detectChanges(false);
             } catch (e) {
               throw new BaseException('Second detectChanges() should not have run detection.');
             }
             expect(directiveLog.filter(['ngAfterViewInit'])).toEqual([]);
           }));
      });

      describe('ngAfterViewChecked', () => {
        it('should be called after processing the view children', fakeAsync(() => {
             var ctx = createCompWithContentAndViewChild();

             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngDoCheck', 'ngAfterViewChecked'])).toEqual([
               'parent.ngDoCheck', 'contentChild.ngDoCheck', 'contentChild.ngAfterViewChecked',
               'viewChild.ngDoCheck', 'viewChild.ngAfterViewChecked', 'parent.ngAfterViewChecked'
             ]);
           }));

        it('should be called on every detectChanges run, except for checkNoChanges',
           fakeAsync(() => {
             var ctx = createCompFixture('<div testDirective="dir"></div>');

             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngAfterViewChecked'])).toEqual([
               'dir.ngAfterViewChecked'
             ]);

             // reset directives
             directiveLog.clear();

             // Verify that checking should not call them.
             ctx.checkNoChanges();

             expect(directiveLog.filter(['ngAfterViewChecked'])).toEqual([]);

             // re-verify that changes are still detected
             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngAfterViewChecked'])).toEqual([
               'dir.ngAfterViewChecked'
             ]);
           }));

        it('should be called in reverse order so the child is always notified before the parent',
           fakeAsync(() => {
             var ctx = createCompFixture(
                 '<div testDirective="parent"><div testDirective="child"></div></div>');

             ctx.detectChanges(false);

             expect(directiveLog.filter(['ngAfterViewChecked'])).toEqual([
               'child.ngAfterViewChecked', 'parent.ngAfterViewChecked'
             ]);
           }));
      });

      describe('ngOnDestroy', () => {
        it('should be called on view destruction', fakeAsync(() => {
             var ctx = createCompFixture('<div testDirective="dir"></div>');
             ctx.detectChanges(false);

             ctx.destroy();

             expect(directiveLog.filter(['ngOnDestroy'])).toEqual(['dir.ngOnDestroy']);
           }));

        it('should be called after processing the content and view children', fakeAsync(() => {
             var ctx = createCompFixture(
                 '<div testDirective="parent"><div *ngFor="let x of [0,1]" testDirective="contentChild{{x}}"></div>' +
                     '<other-cmp></other-cmp></div>',
                 TestComponent,
                 tcb.overrideTemplate(AnotherComponent, '<div testDirective="viewChild"></div>'));

             ctx.detectChanges(false);
             ctx.destroy();

             expect(directiveLog.filter(['ngOnDestroy'])).toEqual([
               'contentChild0.ngOnDestroy', 'contentChild1.ngOnDestroy', 'viewChild.ngOnDestroy',
               'parent.ngOnDestroy'
             ]);
           }));

        it('should be called in reverse order so the child is always notified before the parent',
           fakeAsync(() => {
             var ctx = createCompFixture(
                 '<div testDirective="parent"><div testDirective="child"></div></div>');

             ctx.detectChanges(false);
             ctx.destroy();

             expect(directiveLog.filter(['ngOnDestroy'])).toEqual([
               'child.ngOnDestroy', 'parent.ngOnDestroy'
             ]);
           }));

        it('should call ngOnDestory on pipes', fakeAsync(() => {
             var ctx = createCompFixture('{{true | pipeWithOnDestroy }}');

             ctx.detectChanges(false);
             ctx.destroy();

             expect(directiveLog.filter(['ngOnDestroy'])).toEqual([
               'pipeWithOnDestroy.ngOnDestroy'
             ]);
           }));
      });

    });

    describe('enforce no new changes', () => {
      it('should throw when a record gets changed after it has been checked', fakeAsync(() => {
           var ctx = createCompFixture('<div [someProp]="a"></div>', TestData);

           ctx.componentInstance.a = 1;
           expect(() => ctx.checkNoChanges())
               .toThrowError(/:0:5[\s\S]*Expression has changed after it was checked./g);
         }));

      it('should not throw when two arrays are structurally the same', fakeAsync(() => {
           var ctx = _bindSimpleValue('a', TestData);
           ctx.componentInstance.a = ['value'];
           ctx.detectChanges(false);
           ctx.componentInstance.a = ['value'];
           expect(() => ctx.checkNoChanges()).not.toThrow();
         }));

      it('should not break the next run', fakeAsync(() => {
           var ctx = _bindSimpleValue('a', TestData);
           ctx.componentInstance.a = 'value';

           expect(() => ctx.checkNoChanges()).toThrow();

           ctx.detectChanges();
           expect(renderLog.loggedValues).toEqual(['value']);
         }));
    });

    describe('mode', () => {
      it('Detached', fakeAsync(() => {
           var ctx = createCompFixture('<comp-with-ref></comp-with-ref>');
           var cmp: CompWithRef = queryDirs(ctx.debugElement, CompWithRef)[0];
           cmp.value = 'hello';
           cmp.changeDetectorRef.detach();

           ctx.detectChanges();

           expect(renderLog.log).toEqual([]);
         }));

      it('Reattaches', fakeAsync(() => {
           var ctx = createCompFixture('<comp-with-ref></comp-with-ref>');
           var cmp: CompWithRef = queryDirs(ctx.debugElement, CompWithRef)[0];

           cmp.value = 'hello';
           cmp.changeDetectorRef.detach();

           ctx.detectChanges();

           expect(renderLog.log).toEqual([]);

           cmp.changeDetectorRef.reattach();

           ctx.detectChanges();

           expect(renderLog.log).toEqual(['{{hello}}']);

         }));

      it('Reattaches in the original cd mode', fakeAsync(() => {
           var ctx = createCompFixture('<push-cmp></push-cmp>');
           var cmp: PushComp = queryDirs(ctx.debugElement, PushComp)[0];
           cmp.changeDetectorRef.detach();
           cmp.changeDetectorRef.reattach();

           // renderCount should NOT be incremented with each CD as CD mode should be resetted to
           // on-push
           ctx.detectChanges();
           expect(cmp.renderCount).toBeGreaterThan(0);
           var count = cmp.renderCount;

           ctx.detectChanges();
           expect(cmp.renderCount).toBe(count);

         }));

    });

    describe('multi directive order', () => {
      it('should follow the DI order for the same element', fakeAsync(() => {
           var ctx =
               createCompFixture('<div orderCheck2="2" orderCheck0="0" orderCheck1="1"></div>');

           ctx.detectChanges(false);
           ctx.destroy();

           expect(directiveLog.filter(['set'])).toEqual(['0.set', '1.set', '2.set']);
         }));
    });
  });
}

const ALL_DIRECTIVES = /*@ts2dart_const*/[
  forwardRef(() => TestDirective), forwardRef(() => TestComponent),
  forwardRef(() => AnotherComponent), forwardRef(() => TestLocals), forwardRef(() => CompWithRef),
  forwardRef(() => EmitterDirective), forwardRef(() => PushComp),
  forwardRef(() => OrderCheckDirective2), forwardRef(() => OrderCheckDirective0),
  forwardRef(() => OrderCheckDirective1), NgFor
];

const ALL_PIPES = /*@ts2dart_const*/[
  forwardRef(() => CountingPipe), forwardRef(() => CountingImpurePipe),
  forwardRef(() => MultiArgPipe), forwardRef(() => PipeWithOnDestroy),
  forwardRef(() => IdentityPipe), forwardRef(() => WrappedPipe), AsyncPipe
];

@Injectable()
class RenderLog {
  log: string[] = [];
  loggedValues: any[] = [];

  setElementProperty(el: any, propName: string, propValue: any) {
    this.log.push(`${propName}=${propValue}`);
    this.loggedValues.push(propValue);
  }

  setText(node: any, value: string) {
    this.log.push(`{{${value}}}`);
    this.loggedValues.push(value);
  }

  clear() {
    this.log = [];
    this.loggedValues = [];
  }
}

@Injectable()
class LoggingRootRenderer implements RootRenderer {
  constructor(private _delegate: DomRootRenderer, private _log: RenderLog) {}

  renderComponent(componentProto: RenderComponentType): Renderer {
    return new LoggingRenderer(this._delegate.renderComponent(componentProto), this._log);
  }
}

class LoggingRenderer extends DebugDomRenderer {
  constructor(delegate: Renderer, private _log: RenderLog) { super(delegate); }

  setElementProperty(renderElement: any, propertyName: string, propertyValue: any) {
    this._log.setElementProperty(renderElement, propertyName, propertyValue);
    super.setElementProperty(renderElement, propertyName, propertyValue);
  }

  setText(renderNode: any, value: string) { this._log.setText(renderNode, value); }
}

class DirectiveLogEntry {
  constructor(public directiveName: string, public method: string) {}
}

@Injectable()
class DirectiveLog {
  entries: DirectiveLogEntry[] = [];

  add(directiveName: string, method: string) {
    this.entries.push(new DirectiveLogEntry(directiveName, method));
  }

  clear() { this.entries = []; }

  filter(methods: string[]): string[] {
    return this.entries.filter((entry) => methods.indexOf(entry.method) !== -1)
        .map(entry => `${entry.directiveName}.${entry.method}`);
  }
}


@Pipe({name: 'countingPipe'})
class CountingPipe implements PipeTransform {
  state: number = 0;
  transform(value: any /** TODO #9100 */) { return `${value} state:${this.state ++}`; }
}

@Pipe({name: 'countingImpurePipe', pure: false})
class CountingImpurePipe implements PipeTransform {
  state: number = 0;
  transform(value: any /** TODO #9100 */) { return `${value} state:${this.state ++}`; }
}

@Pipe({name: 'pipeWithOnDestroy'})
class PipeWithOnDestroy implements PipeTransform, OnDestroy {
  constructor(private directiveLog: DirectiveLog) {}

  ngOnDestroy() { this.directiveLog.add('pipeWithOnDestroy', 'ngOnDestroy'); }

  transform(value: any /** TODO #9100 */): any /** TODO #9100 */ { return null; }
}

@Pipe({name: 'identityPipe'})
class IdentityPipe implements PipeTransform {
  transform(value: any /** TODO #9100 */) { return value; }
}

@Pipe({name: 'wrappedPipe'})
class WrappedPipe implements PipeTransform {
  transform(value: any /** TODO #9100 */) { return WrappedValue.wrap(value); }
}

@Pipe({name: 'multiArgPipe'})
class MultiArgPipe implements PipeTransform {
  transform(
      value: any /** TODO #9100 */, arg1: any /** TODO #9100 */, arg2: any /** TODO #9100 */,
      arg3 = 'default') {
    return `${value} ${arg1} ${arg2} ${arg3}`;
  }
}

@Component({selector: 'test-cmp', template: '', directives: ALL_DIRECTIVES, pipes: ALL_PIPES})
class TestComponent {
  value: any;
  a: any;
  b: any;
}

@Component({selector: 'other-cmp', directives: ALL_DIRECTIVES, pipes: ALL_PIPES, template: ''})
class AnotherComponent {
}

@Component({
  selector: 'comp-with-ref',
  template: '<div (event)="noop()" emitterDirective></div>{{value}}',
  host: {'event': 'noop()'},
  directives: ALL_DIRECTIVES,
  pipes: ALL_PIPES
})
class CompWithRef {
  @Input() public value: any;

  constructor(public changeDetectorRef: ChangeDetectorRef) {}

  noop() {}
}

@Component({
  selector: 'push-cmp',
  template: '<div (event)="noop()" emitterDirective></div>{{value}}{{renderIncrement}}',
  host: {'(event)': 'noop()'},
  directives: ALL_DIRECTIVES,
  pipes: ALL_PIPES,
  changeDetection: ChangeDetectionStrategy.OnPush
})
class PushComp {
  @Input() public value: any;
  public renderCount: any = 0;

  get renderIncrement() {
    this.renderCount++;
    return '';
  }

  constructor(public changeDetectorRef: ChangeDetectorRef) {}

  noop() {}
}

@Directive({selector: '[emitterDirective]'})
class EmitterDirective {
  @Output('event') emitter = new EventEmitter<string>();
}

@Directive({selector: '[testDirective]', exportAs: 'testDirective'})
class TestDirective implements OnInit, DoCheck, OnChanges, AfterContentInit, AfterContentChecked,
    AfterViewInit, AfterViewChecked, OnDestroy {
  @Input() a: any /** TODO #9100 */;
  @Input() b: any /** TODO #9100 */;
  changes: any /** TODO #9100 */;
  event: any /** TODO #9100 */;
  eventEmitter: EventEmitter<string> = new EventEmitter<string>();

  @Input('testDirective') name: string;

  @Input() throwOn: string;

  constructor(public log: DirectiveLog) {}

  onEvent(event: any /** TODO #9100 */) { this.event = event; }

  ngDoCheck() { this.log.add(this.name, 'ngDoCheck'); }

  ngOnInit() {
    this.log.add(this.name, 'ngOnInit');
    if (this.throwOn == 'ngOnInit') {
      throw new BaseException('Boom!');
    }
  }

  ngOnChanges(changes: any /** TODO #9100 */) {
    this.log.add(this.name, 'ngOnChanges');
    var r = {};
    StringMapWrapper.forEach(
        changes, (c: any /** TODO #9100 */, key: any /** TODO #9100 */) =>
                     (r as any /** TODO #9100 */)[key] = c.currentValue);
    this.changes = r;
    if (this.throwOn == 'ngOnChanges') {
      throw new BaseException('Boom!');
    }
  }

  ngAfterContentInit() {
    this.log.add(this.name, 'ngAfterContentInit');
    if (this.throwOn == 'ngAfterContentInit') {
      throw new BaseException('Boom!');
    }
  }

  ngAfterContentChecked() {
    this.log.add(this.name, 'ngAfterContentChecked');
    if (this.throwOn == 'ngAfterContentChecked') {
      throw new BaseException('Boom!');
    }
  }

  ngAfterViewInit() {
    this.log.add(this.name, 'ngAfterViewInit');
    if (this.throwOn == 'ngAfterViewInit') {
      throw new BaseException('Boom!');
    }
  }

  ngAfterViewChecked() {
    this.log.add(this.name, 'ngAfterViewChecked');
    if (this.throwOn == 'ngAfterViewChecked') {
      throw new BaseException('Boom!');
    }
  }

  ngOnDestroy() {
    this.log.add(this.name, 'ngOnDestroy');
    if (this.throwOn == 'ngOnDestroy') {
      throw new BaseException('Boom!');
    }
  }
}

@Directive({selector: '[orderCheck0]'})
class OrderCheckDirective0 {
  private _name: string;

  @Input('orderCheck0')
  set name(value: string) {
    this._name = value;
    this.log.add(this._name, 'set');
  }

  constructor(public log: DirectiveLog) {}
}

@Directive({selector: '[orderCheck1]'})
class OrderCheckDirective1 {
  private _name: string;

  @Input('orderCheck1')
  set name(value: string) {
    this._name = value;
    this.log.add(this._name, 'set');
  }

  constructor(public log: DirectiveLog, _check0: OrderCheckDirective0) {}
}

@Directive({selector: '[orderCheck2]'})
class OrderCheckDirective2 {
  private _name: string;

  @Input('orderCheck2')
  set name(value: string) {
    this._name = value;
    this.log.add(this._name, 'set');
  }

  constructor(public log: DirectiveLog, _check1: OrderCheckDirective1) {}
}

class TestLocalsContext {
  constructor(public someLocal: string) {}
}

@Directive({selector: '[testLocals]'})
class TestLocals {
  constructor(templateRef: TemplateRef<TestLocalsContext>, vcRef: ViewContainerRef) {
    vcRef.createEmbeddedView(templateRef, new TestLocalsContext('someLocalValue'));
  }
}

@Component({selector: 'root'})
class Person {
  age: number;
  name: string;
  address: Address = null;

  init(name: string, address: Address = null) {
    this.name = name;
    this.address = address;
  }

  sayHi(m: any /** TODO #9100 */) { return `Hi, ${m}`; }

  passThrough(val: any /** TODO #9100 */) { return val; }

  toString(): string {
    var address = this.address == null ? '' : ' address=' + this.address.toString();

    return 'name=' + this.name + address;
  }
}

class Address {
  cityGetterCalls: number = 0;
  zipCodeGetterCalls: number = 0;

  constructor(public _city: string, public _zipcode: any /** TODO #9100 */ = null) {}

  get city() {
    this.cityGetterCalls++;
    return this._city;
  }

  get zipcode() {
    this.zipCodeGetterCalls++;
    return this._zipcode;
  }

  set city(v) { this._city = v; }

  set zipcode(v) { this._zipcode = v; }

  toString(): string { return isBlank(this.city) ? '-' : this.city }
}

class Logical {
  trueCalls: number = 0;
  falseCalls: number = 0;

  getTrue() {
    this.trueCalls++;
    return true;
  }

  getFalse() {
    this.falseCalls++;
    return false;
  }
}

@Component({selector: 'root'})
class Uninitialized {
  value: any = null;
}

@Component({selector: 'root'})
class TestData {
  public a: any;
}

@Component({selector: 'root'})
class TestDataWithGetter {
  public fn: Function;

  get a() { return this.fn(); }
}
