import {beforeEach, beforeEachProviders, ddescribe, xdescribe, describe, expect, iit, inject, it, xit,} from '@angular/core/testing/testing_internal';
import {ComponentFixture, TestComponentBuilder} from '@angular/compiler/testing';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {ListWrapper, StringMapWrapper, SetWrapper} from '../../src/facade/collection';
import {Component, provide} from '@angular/core';
import {NgFor, NgClass} from '@angular/common';

function detectChangesAndCheck(fixture: ComponentFixture<any>, classes: string) {
  fixture.detectChanges();
  expect(fixture.debugElement.children[0].nativeElement.className).toEqual(classes);
}

export function main() {
  describe('binding to CSS class list', () => {

    it('should clean up when the directive is destroyed',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template = '<div *ngFor="let item of items" [ngClass]="item"></div>';
             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.items = [['0']];
                   fixture.detectChanges();
                   fixture.debugElement.componentInstance.items = [['1']];

                   detectChangesAndCheck(fixture, '1');

                   async.done();
                 });
           }));


    describe('expressions evaluating to objects', () => {

      it('should add classes specified in an object literal',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div [ngClass]="{foo: true, bar: false}"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'foo');
                     async.done();
                   });
             }));


      it('should add classes specified in an object literal without change in class names',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = `<div [ngClass]="{'foo-bar': true, 'fooBar': true}"></div>`;

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'foo-bar fooBar');
                     async.done();
                   });
             }));

      it('should add and remove classes based on changes in object literal values',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div [ngClass]="{foo: condition, bar: !condition}"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'foo');

                     fixture.debugElement.componentInstance.condition = false;
                     detectChangesAndCheck(fixture, 'bar');

                     async.done();
                   });
             }));

      it('should add and remove classes based on changes to the expression object',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div [ngClass]="objExpr"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'foo');

                     StringMapWrapper.set(
                         fixture.debugElement.componentInstance.objExpr, 'bar', true);
                     detectChangesAndCheck(fixture, 'foo bar');

                     StringMapWrapper.set(
                         fixture.debugElement.componentInstance.objExpr, 'baz', true);
                     detectChangesAndCheck(fixture, 'foo bar baz');

                     StringMapWrapper.delete(fixture.debugElement.componentInstance.objExpr, 'bar');
                     detectChangesAndCheck(fixture, 'foo baz');

                     async.done();
                   });
             }));

      it('should add and remove classes based on reference changes to the expression object',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div [ngClass]="objExpr"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'foo');

                     fixture.debugElement.componentInstance.objExpr = {foo: true, bar: true};
                     detectChangesAndCheck(fixture, 'foo bar');

                     fixture.debugElement.componentInstance.objExpr = {baz: true};
                     detectChangesAndCheck(fixture, 'baz');

                     async.done();
                   });
             }));

      it('should remove active classes when expression evaluates to null',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div [ngClass]="objExpr"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'foo');

                     fixture.debugElement.componentInstance.objExpr = null;
                     detectChangesAndCheck(fixture, '');

                     fixture.debugElement.componentInstance.objExpr = {'foo': false, 'bar': true};
                     detectChangesAndCheck(fixture, 'bar');

                     async.done();
                   });
             }));


      it('should allow multiple classes per expression',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div [ngClass]="objExpr"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {

                     fixture.debugElement.componentInstance.objExpr = {
                       'bar baz': true,
                       'bar1 baz1': true
                     };
                     detectChangesAndCheck(fixture, 'bar baz bar1 baz1');

                     fixture.debugElement.componentInstance.objExpr = {
                       'bar baz': false,
                       'bar1 baz1': true
                     };
                     detectChangesAndCheck(fixture, 'bar1 baz1');


                     async.done();
                   });
             }));

      it('should split by one or more spaces between classes',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div [ngClass]="objExpr"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {

                     fixture.debugElement.componentInstance.objExpr = {'foo bar     baz': true};
                     detectChangesAndCheck(fixture, 'foo bar baz');

                     async.done();
                   });
             }));

    });

    describe('expressions evaluating to lists', () => {

      it('should add classes specified in a list literal',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = `<div [ngClass]="['foo', 'bar', 'foo-bar', 'fooBar']"></div>`;

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'foo bar foo-bar fooBar');
                     async.done();
                   });
             }));

      it('should add and remove classes based on changes to the expression',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div [ngClass]="arrExpr"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     var arrExpr: string[] = fixture.debugElement.componentInstance.arrExpr;
                     detectChangesAndCheck(fixture, 'foo');

                     arrExpr.push('bar');
                     detectChangesAndCheck(fixture, 'foo bar');

                     arrExpr[1] = 'baz';
                     detectChangesAndCheck(fixture, 'foo baz');

                     ListWrapper.remove(fixture.debugElement.componentInstance.arrExpr, 'baz');
                     detectChangesAndCheck(fixture, 'foo');

                     async.done();
                   });
             }));

      it('should add and remove classes when a reference changes',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div [ngClass]="arrExpr"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'foo');

                     fixture.debugElement.componentInstance.arrExpr = ['bar'];
                     detectChangesAndCheck(fixture, 'bar');

                     async.done();
                   });
             }));

      it('should take initial classes into account when a reference changes',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div class="foo" [ngClass]="arrExpr"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'foo');

                     fixture.debugElement.componentInstance.arrExpr = ['bar'];
                     detectChangesAndCheck(fixture, 'foo bar');

                     async.done();
                   });
             }));

      it('should ignore empty or blank class names',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div class="foo" [ngClass]="arrExpr"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {

                     fixture.debugElement.componentInstance.arrExpr = ['', '  '];
                     detectChangesAndCheck(fixture, 'foo');

                     async.done();
                   });
             }));

      it('should trim blanks from class names',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div class="foo" [ngClass]="arrExpr"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {

                     fixture.debugElement.componentInstance.arrExpr = [' bar  '];
                     detectChangesAndCheck(fixture, 'foo bar');

                     async.done();
                   });
             }));


      it('should allow multiple classes per item in arrays',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div [ngClass]="arrExpr"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {

                     fixture.debugElement.componentInstance.arrExpr =
                         ['foo bar baz', 'foo1 bar1   baz1'];
                     detectChangesAndCheck(fixture, 'foo bar baz foo1 bar1 baz1');

                     fixture.debugElement.componentInstance.arrExpr = ['foo bar   baz foobar'];
                     detectChangesAndCheck(fixture, 'foo bar baz foobar');

                     async.done();
                   });
             }));
    });

    describe('expressions evaluating to sets', () => {

      it('should add and remove classes if the set instance changed',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div [ngClass]="setExpr"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     var setExpr = new Set<string>();
                     setExpr.add('bar');
                     fixture.debugElement.componentInstance.setExpr = setExpr;
                     detectChangesAndCheck(fixture, 'bar');

                     setExpr = new Set<string>();
                     setExpr.add('baz');
                     fixture.debugElement.componentInstance.setExpr = setExpr;
                     detectChangesAndCheck(fixture, 'baz');

                     async.done();
                   });
             }));
    });
    describe('expressions evaluating to string', () => {

      it('should add classes specified in a string literal',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = `<div [ngClass]="'foo bar foo-bar fooBar'"></div>`;

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'foo bar foo-bar fooBar');
                     async.done();
                   });
             }));

      it('should add and remove classes based on changes to the expression',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div [ngClass]="strExpr"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'foo');

                     fixture.debugElement.componentInstance.strExpr = 'foo bar';
                     detectChangesAndCheck(fixture, 'foo bar');


                     fixture.debugElement.componentInstance.strExpr = 'baz';
                     detectChangesAndCheck(fixture, 'baz');

                     async.done();
                   });
             }));

      it('should remove active classes when switching from string to null',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = `<div [ngClass]="strExpr"></div>`;

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'foo');

                     fixture.debugElement.componentInstance.strExpr = null;
                     detectChangesAndCheck(fixture, '');

                     async.done();
                   });
             }));

      it('should take initial classes into account when switching from string to null',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = `<div class="foo" [ngClass]="strExpr"></div>`;

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'foo');

                     fixture.debugElement.componentInstance.strExpr = null;
                     detectChangesAndCheck(fixture, 'foo');

                     async.done();
                   });
             }));

      it('should ignore empty and blank strings',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = `<div class="foo" [ngClass]="strExpr"></div>`;

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.strExpr = '';
                     detectChangesAndCheck(fixture, 'foo');

                     async.done();
                   });
             }));

    });

    describe('cooperation with other class-changing constructs', () => {

      it('should co-operate with the class attribute',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div [ngClass]="objExpr" class="init foo"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     StringMapWrapper.set(
                         fixture.debugElement.componentInstance.objExpr, 'bar', true);
                     detectChangesAndCheck(fixture, 'init foo bar');

                     StringMapWrapper.set(
                         fixture.debugElement.componentInstance.objExpr, 'foo', false);
                     detectChangesAndCheck(fixture, 'init bar');

                     fixture.debugElement.componentInstance.objExpr = null;
                     detectChangesAndCheck(fixture, 'init foo');

                     async.done();
                   });
             }));

      it('should co-operate with the interpolated class attribute',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = `<div [ngClass]="objExpr" class="{{'init foo'}}"></div>`;

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     StringMapWrapper.set(
                         fixture.debugElement.componentInstance.objExpr, 'bar', true);
                     detectChangesAndCheck(fixture, `init foo bar`);

                     StringMapWrapper.set(
                         fixture.debugElement.componentInstance.objExpr, 'foo', false);
                     detectChangesAndCheck(fixture, `init bar`);

                     fixture.debugElement.componentInstance.objExpr = null;
                     detectChangesAndCheck(fixture, `init foo`);

                     async.done();
                   });
             }));

      it('should co-operate with the class attribute and binding to it',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = `<div [ngClass]="objExpr" class="init" [class]="'foo'"></div>`;

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     StringMapWrapper.set(
                         fixture.debugElement.componentInstance.objExpr, 'bar', true);
                     detectChangesAndCheck(fixture, `init foo bar`);

                     StringMapWrapper.set(
                         fixture.debugElement.componentInstance.objExpr, 'foo', false);
                     detectChangesAndCheck(fixture, `init bar`);

                     fixture.debugElement.componentInstance.objExpr = null;
                     detectChangesAndCheck(fixture, `init foo`);

                     async.done();
                   });
             }));

      it('should co-operate with the class attribute and class.name binding',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template =
                   '<div class="init foo" [ngClass]="objExpr" [class.baz]="condition"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'init foo baz');

                     StringMapWrapper.set(
                         fixture.debugElement.componentInstance.objExpr, 'bar', true);
                     detectChangesAndCheck(fixture, 'init foo baz bar');

                     StringMapWrapper.set(
                         fixture.debugElement.componentInstance.objExpr, 'foo', false);
                     detectChangesAndCheck(fixture, 'init baz bar');

                     fixture.debugElement.componentInstance.condition = false;
                     detectChangesAndCheck(fixture, 'init bar');

                     async.done();
                   });
             }));

      it('should co-operate with initial class and class attribute binding when binding changes',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div class="init" [ngClass]="objExpr" [class]="strExpr"></div>';

               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     detectChangesAndCheck(fixture, 'init foo');

                     StringMapWrapper.set(
                         fixture.debugElement.componentInstance.objExpr, 'bar', true);
                     detectChangesAndCheck(fixture, 'init foo bar');

                     fixture.debugElement.componentInstance.strExpr = 'baz';
                     detectChangesAndCheck(fixture, 'init bar baz foo');

                     fixture.debugElement.componentInstance.objExpr = null;
                     detectChangesAndCheck(fixture, 'init baz');

                     async.done();
                   });
             }));

    });
  })
}

@Component({selector: 'test-cmp', directives: [NgClass, NgFor], template: ''})
class TestComponent {
  condition: boolean = true;
  items: any[];
  arrExpr: string[] = ['foo'];
  setExpr: Set<string> = new Set<string>();
  objExpr = {'foo': true, 'bar': false};
  strExpr = 'foo';

  constructor() { this.setExpr.add('foo'); }
}
