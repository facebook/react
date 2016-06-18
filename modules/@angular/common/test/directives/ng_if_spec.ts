import {beforeEach, ddescribe, describe, iit, inject, it, xit,} from '@angular/core/testing/testing_internal';
import {expect} from '@angular/platform-browser/testing';
import {TestComponentBuilder} from '@angular/compiler/testing';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';

import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';

import {Component} from '@angular/core';
import {NgIf} from '@angular/common';

import {IS_DART} from '../../src/facade/lang';

export function main() {
  describe('ngIf directive', () => {
    it('should work in a template attribute',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var html = '<div><copy-me template="ngIf booleanCondition">hello</copy-me></div>';

             tcb.overrideTemplate(TestComponent, html)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.detectChanges();
                   expect(getDOM()
                              .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                              .length)
                       .toEqual(1);
                   expect(fixture.debugElement.nativeElement).toHaveText('hello');
                   async.done();
                 });
           }));

    it('should work in a template element',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var html =
                 '<div><template [ngIf]="booleanCondition"><copy-me>hello2</copy-me></template></div>';

             tcb.overrideTemplate(TestComponent, html)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.detectChanges();
                   expect(getDOM()
                              .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                              .length)
                       .toEqual(1);
                   expect(fixture.debugElement.nativeElement).toHaveText('hello2');
                   async.done();
                 });
           }));

    it('should toggle node when condition changes',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var html = '<div><copy-me template="ngIf booleanCondition">hello</copy-me></div>';

             tcb.overrideTemplate(TestComponent, html)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.booleanCondition = false;
                   fixture.detectChanges();
                   expect(getDOM()
                              .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                              .length)
                       .toEqual(0);
                   expect(fixture.debugElement.nativeElement).toHaveText('');

                   fixture.debugElement.componentInstance.booleanCondition = true;
                   fixture.detectChanges();
                   expect(getDOM()
                              .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                              .length)
                       .toEqual(1);
                   expect(fixture.debugElement.nativeElement).toHaveText('hello');

                   fixture.debugElement.componentInstance.booleanCondition = false;
                   fixture.detectChanges();
                   expect(getDOM()
                              .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                              .length)
                       .toEqual(0);
                   expect(fixture.debugElement.nativeElement).toHaveText('');

                   async.done();
                 });
           }));

    it('should handle nested if correctly',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var html =
                 '<div><template [ngIf]="booleanCondition"><copy-me *ngIf="nestedBooleanCondition">hello</copy-me></template></div>';

             tcb.overrideTemplate(TestComponent, html)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.booleanCondition = false;
                   fixture.detectChanges();
                   expect(getDOM()
                              .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                              .length)
                       .toEqual(0);
                   expect(fixture.debugElement.nativeElement).toHaveText('');

                   fixture.debugElement.componentInstance.booleanCondition = true;
                   fixture.detectChanges();
                   expect(getDOM()
                              .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                              .length)
                       .toEqual(1);
                   expect(fixture.debugElement.nativeElement).toHaveText('hello');

                   fixture.debugElement.componentInstance.nestedBooleanCondition = false;
                   fixture.detectChanges();
                   expect(getDOM()
                              .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                              .length)
                       .toEqual(0);
                   expect(fixture.debugElement.nativeElement).toHaveText('');

                   fixture.debugElement.componentInstance.nestedBooleanCondition = true;
                   fixture.detectChanges();
                   expect(getDOM()
                              .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                              .length)
                       .toEqual(1);
                   expect(fixture.debugElement.nativeElement).toHaveText('hello');

                   fixture.debugElement.componentInstance.booleanCondition = false;
                   fixture.detectChanges();
                   expect(getDOM()
                              .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                              .length)
                       .toEqual(0);
                   expect(fixture.debugElement.nativeElement).toHaveText('');

                   async.done();
                 });
           }));

    it('should update several nodes with if',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var html = '<div>' +
                 '<copy-me template="ngIf numberCondition + 1 >= 2">helloNumber</copy-me>' +
                 '<copy-me template="ngIf stringCondition == \'foo\'">helloString</copy-me>' +
                 '<copy-me template="ngIf functionCondition(stringCondition, numberCondition)">helloFunction</copy-me>' +
                 '</div>';

             tcb.overrideTemplate(TestComponent, html)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.detectChanges();
                   expect(getDOM()
                              .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                              .length)
                       .toEqual(3);
                   expect(getDOM().getText(fixture.debugElement.nativeElement))
                       .toEqual('helloNumberhelloStringhelloFunction');

                   fixture.debugElement.componentInstance.numberCondition = 0;
                   fixture.detectChanges();
                   expect(getDOM()
                              .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                              .length)
                       .toEqual(1);
                   expect(fixture.debugElement.nativeElement).toHaveText('helloString');

                   fixture.debugElement.componentInstance.numberCondition = 1;
                   fixture.debugElement.componentInstance.stringCondition = 'bar';
                   fixture.detectChanges();
                   expect(getDOM()
                              .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                              .length)
                       .toEqual(1);
                   expect(fixture.debugElement.nativeElement).toHaveText('helloNumber');
                   async.done();
                 });
           }));


    if (!IS_DART) {
      it('should not add the element twice if the condition goes from true to true (JS)',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var html = '<div><copy-me template="ngIf numberCondition">hello</copy-me></div>';

               tcb.overrideTemplate(TestComponent, html)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     fixture.detectChanges();
                     expect(getDOM()
                                .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                                .length)
                         .toEqual(1);
                     expect(fixture.debugElement.nativeElement).toHaveText('hello');

                     fixture.debugElement.componentInstance.numberCondition = 2;
                     fixture.detectChanges();
                     expect(getDOM()
                                .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                                .length)
                         .toEqual(1);
                     expect(fixture.debugElement.nativeElement).toHaveText('hello');

                     async.done();
                   });
             }));

      it('should not recreate the element if the condition goes from true to true (JS)',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var html = '<div><copy-me template="ngIf numberCondition">hello</copy-me></div>';

               tcb.overrideTemplate(TestComponent, html)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     fixture.detectChanges();
                     getDOM().addClass(
                         getDOM().querySelector(fixture.debugElement.nativeElement, 'copy-me'),
                         'foo');

                     fixture.debugElement.componentInstance.numberCondition = 2;
                     fixture.detectChanges();
                     expect(
                         getDOM().hasClass(
                             getDOM().querySelector(fixture.debugElement.nativeElement, 'copy-me'),
                             'foo'))
                         .toBe(true);

                     async.done();
                   });
             }));
    }

    if (IS_DART) {
      it('should not create the element if the condition is not a boolean (DART)',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var html = '<div><copy-me template="ngIf numberCondition">hello</copy-me></div>';

               tcb.overrideTemplate(TestComponent, html)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     expect(() => fixture.detectChanges()).toThrowError();
                     expect(getDOM()
                                .querySelectorAll(fixture.debugElement.nativeElement, 'copy-me')
                                .length)
                         .toEqual(0);
                     expect(fixture.debugElement.nativeElement).toHaveText('');
                     async.done();
                   });
             }));
    }

  });
}

@Component({selector: 'test-cmp', directives: [NgIf], template: ''})
class TestComponent {
  booleanCondition: boolean;
  nestedBooleanCondition: boolean;
  numberCondition: number;
  stringCondition: string;
  functionCondition: Function;
  constructor() {
    this.booleanCondition = true;
    this.nestedBooleanCondition = true;
    this.numberCondition = 1;
    this.stringCondition = 'foo';
    this.functionCondition = function(s: any, n: any): boolean { return s == 'foo' && n == 1; };
  }
}
