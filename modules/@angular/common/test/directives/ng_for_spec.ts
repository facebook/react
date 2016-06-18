import {beforeEach, beforeEachProviders, ddescribe, describe, iit, inject, it, xit,} from '@angular/core/testing/testing_internal';
import {expect} from '@angular/platform-browser/testing';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {TestComponentBuilder, ComponentFixture} from '@angular/compiler/testing';

import {ListWrapper} from '../../src/facade/collection';
import {IS_DART} from '../../src/facade/lang';
import {Component, TemplateRef, ContentChild} from '@angular/core';
import {NgFor} from '@angular/common';
import {NgIf} from '@angular/common';
import {By} from '@angular/platform-browser/src/dom/debug/by';

export function main() {
  describe('ngFor', () => {
    var TEMPLATE =
        '<div><copy-me template="ngFor let item of items">{{item.toString()}};</copy-me></div>';

    it('should reflect initial elements',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(TestComponent, TEMPLATE)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('1;2;');
                   async.done();
                 });
           }));

    it('should reflect added elements',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(TestComponent, TEMPLATE)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.detectChanges();

                   (<number[]>fixture.debugElement.componentInstance.items).push(3);
                   fixture.detectChanges();

                   expect(fixture.debugElement.nativeElement).toHaveText('1;2;3;');
                   async.done();
                 });
           }));

    it('should reflect removed elements',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(TestComponent, TEMPLATE)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.detectChanges();

                   ListWrapper.removeAt(fixture.debugElement.componentInstance.items, 1);
                   fixture.detectChanges();

                   expect(fixture.debugElement.nativeElement).toHaveText('1;');
                   async.done();
                 });
           }));

    it('should reflect moved elements',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(TestComponent, TEMPLATE)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.detectChanges();

                   ListWrapper.removeAt(fixture.debugElement.componentInstance.items, 0);
                   (<number[]>fixture.debugElement.componentInstance.items).push(1);
                   fixture.detectChanges();

                   expect(fixture.debugElement.nativeElement).toHaveText('2;1;');
                   async.done();
                 });
           }));

    it('should reflect a mix of all changes (additions/removals/moves)',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(TestComponent, TEMPLATE)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.items = [0, 1, 2, 3, 4, 5];
                   fixture.detectChanges();

                   fixture.debugElement.componentInstance.items = [6, 2, 7, 0, 4, 8];
                   fixture.detectChanges();

                   expect(fixture.debugElement.nativeElement).toHaveText('6;2;7;0;4;8;');
                   async.done();
                 });
           }));

    it('should iterate over an array of objects',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template =
                 '<ul><li template="ngFor let item of items">{{item["name"]}};</li></ul>';

             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {

                   // INIT
                   fixture.debugElement.componentInstance.items =
                       [{'name': 'misko'}, {'name': 'shyam'}];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('misko;shyam;');

                   // GROW
                   (<any[]>fixture.debugElement.componentInstance.items).push({'name': 'adam'});
                   fixture.detectChanges();

                   expect(fixture.debugElement.nativeElement).toHaveText('misko;shyam;adam;');

                   // SHRINK
                   ListWrapper.removeAt(fixture.debugElement.componentInstance.items, 2);
                   ListWrapper.removeAt(fixture.debugElement.componentInstance.items, 0);
                   fixture.detectChanges();

                   expect(fixture.debugElement.nativeElement).toHaveText('shyam;');
                   async.done();
                 });
           }));

    it('should gracefully handle nulls',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template = '<ul><li template="ngFor let item of null">{{item}};</li></ul>';
             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('');
                   async.done();
                 });
           }));

    it('should gracefully handle ref changing to null and back',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(TestComponent, TEMPLATE)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('1;2;');

                   fixture.debugElement.componentInstance.items = null;
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('');

                   fixture.debugElement.componentInstance.items = [1, 2, 3];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('1;2;3;');
                   async.done();
                 });
           }));

    if (!IS_DART) {
      it('should throw on non-iterable ref and suggest using an array',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideTemplate(TestComponent, TEMPLATE)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.items = 'whaaa';
                     try {
                       fixture.detectChanges()
                     } catch (e) {
                       expect(e.message).toContain(
                           `Cannot find a differ supporting object 'whaaa' of type 'string'. NgFor only supports binding to Iterables such as Arrays.`);
                       async.done();
                     }
                   });
             }));
    }

    it('should throw on ref changing to string',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(TestComponent, TEMPLATE)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('1;2;');

                   fixture.debugElement.componentInstance.items = 'whaaa';
                   expect(() => fixture.detectChanges()).toThrowError();
                   async.done();
                 });
           }));

    it('should works with duplicates',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(TestComponent, TEMPLATE)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   var a = new Foo();
                   fixture.debugElement.componentInstance.items = [a, a];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('foo;foo;');
                   async.done();
                 });
           }));

    it('should repeat over nested arrays',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template = '<div>' +
                 '<div template="ngFor let item of items">' +
                 '<div template="ngFor let subitem of item">' +
                 '{{subitem}}-{{item.length}};' +
                 '</div>|' +
                 '</div>' +
                 '</div>';

             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.items = [['a', 'b'], ['c']];
                   fixture.detectChanges();
                   fixture.detectChanges();
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('a-2;b-2;|c-1;|');

                   fixture.debugElement.componentInstance.items = [['e'], ['f', 'g']];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('e-1;|f-2;g-2;|');

                   async.done();
                 });
           }));

    it('should repeat over nested arrays with no intermediate element',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template = '<div><template ngFor let-item [ngForOf]="items">' +
                 '<div template="ngFor let subitem of item">' +
                 '{{subitem}}-{{item.length}};' +
                 '</div></template></div>';

             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.items = [['a', 'b'], ['c']];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('a-2;b-2;c-1;');

                   fixture.debugElement.componentInstance.items = [['e'], ['f', 'g']];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('e-1;f-2;g-2;');
                   async.done();
                 });
           }));

    it('should repeat over nested ngIf that are the last node in the ngFor temlate',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template =
                 `<div><template ngFor let-item [ngForOf]="items" let-i="index"><div>{{i}}|</div>` +
                 `<div *ngIf="i % 2 == 0">even|</div></template></div>`;

             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   var el = fixture.debugElement.nativeElement;
                   var items = [1];
                   fixture.debugElement.componentInstance.items = items;
                   fixture.detectChanges();
                   expect(el).toHaveText('0|even|');

                   items.push(1);
                   fixture.detectChanges();
                   expect(el).toHaveText('0|even|1|');

                   items.push(1);
                   fixture.detectChanges();
                   expect(el).toHaveText('0|even|1|2|even|');

                   async.done();
                 });
           }));

    it('should display indices correctly',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template =
                 '<div><copy-me template="ngFor: let item of items; let i=index">{{i.toString()}}</copy-me></div>';

             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.items = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('0123456789');

                   fixture.debugElement.componentInstance.items = [1, 2, 6, 7, 4, 3, 5, 8, 9, 0];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('0123456789');
                   async.done();
                 });
           }));

    it('should display first item correctly',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template =
                 '<div><copy-me template="ngFor: let item of items; let isFirst=first">{{isFirst.toString()}}</copy-me></div>';

             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.items = [0, 1, 2];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('truefalsefalse');

                   fixture.debugElement.componentInstance.items = [2, 1];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('truefalse');
                   async.done();
                 });
           }));

    it('should display last item correctly',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template =
                 '<div><copy-me template="ngFor: let item of items; let isLast=last">{{isLast.toString()}}</copy-me></div>';

             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.items = [0, 1, 2];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('falsefalsetrue');

                   fixture.debugElement.componentInstance.items = [2, 1];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('falsetrue');
                   async.done();
                 });
           }));

    it('should display even items correctly',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template =
                 '<div><copy-me template="ngFor: let item of items; let isEven=even">{{isEven.toString()}}</copy-me></div>';

             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.items = [0, 1, 2];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('truefalsetrue');

                   fixture.debugElement.componentInstance.items = [2, 1];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('truefalse');
                   async.done();
                 });
           }));

    it('should display odd items correctly',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template =
                 '<div><copy-me template="ngFor: let item of items; let isOdd=odd">{{isOdd.toString()}}</copy-me></div>';

             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.items = [0, 1, 2, 3];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('falsetruefalsetrue');

                   fixture.debugElement.componentInstance.items = [2, 1];
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('falsetrue');
                   async.done();
                 });
           }));

    it('should allow to use a custom template',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(
                    TestComponent,
                    '<ul><template ngFor [ngForOf]="items" [ngForTemplate]="contentTpl"></template></ul>')
                 .overrideTemplate(
                     ComponentUsingTestComponent,
                     '<test-cmp><li template="let item; let i=index">{{i}}: {{item}};</li></test-cmp>')
                 .createAsync(ComponentUsingTestComponent)
                 .then((fixture) => {
                   var testComponent = fixture.debugElement.children[0];
                   testComponent.componentInstance.items = ['a', 'b', 'c'];
                   fixture.detectChanges();
                   expect(testComponent.nativeElement).toHaveText('0: a;1: b;2: c;');

                   async.done();
                 });
           }));

    it('should use a default template if a custom one is null',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(TestComponent, `<ul><template ngFor let-item [ngForOf]="items"
         [ngForTemplate]="contentTpl" let-i="index">{{i}}: {{item}};</template></ul>`)
                 .overrideTemplate(ComponentUsingTestComponent, '<test-cmp></test-cmp>')
                 .createAsync(ComponentUsingTestComponent)
                 .then((fixture) => {
                   var testComponent = fixture.debugElement.children[0];
                   testComponent.componentInstance.items = ['a', 'b', 'c'];
                   fixture.detectChanges();
                   expect(testComponent.nativeElement).toHaveText('0: a;1: b;2: c;');

                   async.done();
                 });
           }));

    it('should use a custom template when both default and a custom one are present',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(TestComponent, `<ul><template ngFor let-item [ngForOf]="items"
         [ngForTemplate]="contentTpl" let-i="index">{{i}}=> {{item}};</template></ul>`)
                 .overrideTemplate(
                     ComponentUsingTestComponent,
                     '<test-cmp><li template="let item; let i=index">{{i}}: {{item}};</li></test-cmp>')
                 .createAsync(ComponentUsingTestComponent)
                 .then((fixture) => {
                   var testComponent = fixture.debugElement.children[0];
                   testComponent.componentInstance.items = ['a', 'b', 'c'];
                   fixture.detectChanges();
                   expect(testComponent.nativeElement).toHaveText('0: a;1: b;2: c;');

                   async.done();
                 });
           }));

    describe('track by', function() {
      it('should not replace tracked items',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template =
                   `<template ngFor let-item [ngForOf]="items" [ngForTrackBy]="trackById" let-i="index">
               <p>{{items[i]}}</p>
              </template>`;
               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     var buildItemList =
                         () => {
                           fixture.debugElement.componentInstance.items = [{'id': 'a'}];
                           fixture.detectChanges();
                           return fixture.debugElement.queryAll(By.css('p'))[0];
                         }

                     var firstP = buildItemList();
                     var finalP = buildItemList();
                     expect(finalP.nativeElement).toBe(firstP.nativeElement);
                     async.done();
                   });
             }));
      it('should update implicit local variable on view',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template =
                   `<div><template ngFor let-item [ngForOf]="items" [ngForTrackBy]="trackById">{{item['color']}}</template></div>`;
               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.items = [{'id': 'a', 'color': 'blue'}];
                     fixture.detectChanges();
                     expect(fixture.debugElement.nativeElement).toHaveText('blue');
                     fixture.debugElement.componentInstance.items = [{'id': 'a', 'color': 'red'}];
                     fixture.detectChanges();
                     expect(fixture.debugElement.nativeElement).toHaveText('red');
                     async.done();
                   });
             }));
      it('should move items around and keep them updated ',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template =
                   `<div><template ngFor let-item [ngForOf]="items" [ngForTrackBy]="trackById">{{item['color']}}</template></div>`;
               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.items =
                         [{'id': 'a', 'color': 'blue'}, {'id': 'b', 'color': 'yellow'}];
                     fixture.detectChanges();
                     expect(fixture.debugElement.nativeElement).toHaveText('blueyellow');
                     fixture.debugElement.componentInstance.items =
                         [{'id': 'b', 'color': 'orange'}, {'id': 'a', 'color': 'red'}];
                     fixture.detectChanges();
                     expect(fixture.debugElement.nativeElement).toHaveText('orangered');
                     async.done();
                   });
             }));

      it('should handle added and removed items properly when tracking by index',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template =
                   `<div><template ngFor let-item [ngForOf]="items" [ngForTrackBy]="trackByIndex">{{item}}</template></div>`;
               tcb.overrideTemplate(TestComponent, template)
                   .createAsync(TestComponent)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.items = ['a', 'b', 'c', 'd'];
                     fixture.detectChanges();
                     fixture.debugElement.componentInstance.items = ['e', 'f', 'g', 'h'];
                     fixture.detectChanges();
                     fixture.debugElement.componentInstance.items = ['e', 'f', 'h'];
                     fixture.detectChanges();
                     expect(fixture.debugElement.nativeElement).toHaveText('efh');
                     async.done();
                   });
             }));
    });
  });
}

class Foo {
  toString() { return 'foo'; }
}

@Component({selector: 'test-cmp', directives: [NgFor, NgIf], template: ''})
class TestComponent {
  @ContentChild(TemplateRef) contentTpl: TemplateRef<Object>;
  items: any;
  constructor() { this.items = [1, 2]; }
  trackById(index: number, item: any): string { return item['id']; }
  trackByIndex(index: number, item: any): number { return index; }
}

@Component({selector: 'outer-cmp', directives: [TestComponent], template: ''})
class ComponentUsingTestComponent {
  items: any;
  constructor() { this.items = [1, 2]; }
}
