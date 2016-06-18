import {beforeEachProviders, beforeEach, ddescribe, describe, expect, iit, inject, it, xit,} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {TestComponentBuilder} from '@angular/compiler/testing';

import {Component, Injectable} from '@angular/core';
import {NgPlural, NgPluralCase, NgLocalization} from '@angular/common';

export function main() {
  describe('switch', () => {
    beforeEachProviders(() => [{provide: NgLocalization, useClass: TestLocalizationMap}]);

    it('should display the template according to the exact value',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template = '<div>' +
                 '<ul [ngPlural]="switchValue">' +
                 '<template ngPluralCase="=0"><li>you have no messages.</li></template>' +
                 '<template ngPluralCase="=1"><li>you have one message.</li></template>' +
                 '</ul></div>';

             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.switchValue = 0;
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('you have no messages.');

                   fixture.debugElement.componentInstance.switchValue = 1;
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('you have one message.');

                   async.done();
                 });
           }));

    it('should be applicable to <ng-container> elements',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template = '<div>' +
                 '<ng-container [ngPlural]="switchValue">' +
                 '<template ngPluralCase="=0">you have no messages.</template>' +
                 '<template ngPluralCase="=1">you have one message.</template>' +
                 '</ng-container></div>';

             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.switchValue = 0;
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('you have no messages.');

                   fixture.debugElement.componentInstance.switchValue = 1;
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('you have one message.');

                   async.done();
                 });
           }));

    it('should display the template according to the category',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template = '<div>' +
                 '<ul [ngPlural]="switchValue">' +
                 '<template ngPluralCase="few"><li>you have a few messages.</li></template>' +
                 '<template ngPluralCase="many"><li>you have many messages.</li></template>' +
                 '</ul></div>';

             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.switchValue = 2;
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement)
                       .toHaveText('you have a few messages.');

                   fixture.debugElement.componentInstance.switchValue = 8;
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('you have many messages.');

                   async.done();
                 });
           }));

    it('should default to other when no matches are found',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template = '<div>' +
                 '<ul [ngPlural]="switchValue">' +
                 '<template ngPluralCase="few"><li>you have a few messages.</li></template>' +
                 '<template ngPluralCase="other"><li>default message.</li></template>' +
                 '</ul></div>';

             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.switchValue = 100;
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('default message.');

                   async.done();
                 });
           }));

    it('should prioritize value matches over category matches',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template = '<div>' +
                 '<ul [ngPlural]="switchValue">' +
                 '<template ngPluralCase="few"><li>you have a few messages.</li></template>' +
                 '<template ngPluralCase="=2">you have two messages.</template>' +
                 '</ul></div>';

             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.switchValue = 2;
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('you have two messages.');

                   fixture.debugElement.componentInstance.switchValue = 3;
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement)
                       .toHaveText('you have a few messages.');

                   async.done();
                 });
           }));
  });
}


@Injectable()
export class TestLocalizationMap extends NgLocalization {
  getPluralCategory(value: number): string {
    if (value > 1 && value < 4) {
      return 'few';
    } else if (value >= 4 && value < 10) {
      return 'many';
    } else {
      return 'other';
    }
  }
}


@Component({selector: 'test-cmp', directives: [NgPluralCase, NgPlural], template: ''})
class TestComponent {
  switchValue: number = null;
}
