import {beforeEach, ddescribe, describe, expect, iit, inject, it, xit,} from '@angular/core/testing/testing_internal';
import {TestComponentBuilder} from '@angular/compiler/testing';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';

import {isPresent, stringify} from '../../src/facade/lang';
import {ObservableWrapper} from '../../src/facade/async';

import {Component, Directive, TemplateRef, Query, QueryList, ViewQuery, ContentChildren, ViewChildren, ContentChild, ViewChild, AfterContentInit, AfterViewInit, AfterContentChecked, AfterViewChecked} from '@angular/core';
import {NgIf, NgFor} from '@angular/common';
import {asNativeElements, ViewContainerRef} from '@angular/core';

export function main() {
  describe('Query API', () => {
    describe('querying by directive type', () => {
      it('should contain all direct child directives in the light dom (constructor)',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div text="1"></div>' +
                   '<needs-query text="2"><div text="3">' +
                   '<div text="too-deep"></div>' +
                   '</div></needs-query>' +
                   '<div text="4"></div>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();

                 expect(asNativeElements(view.debugElement.children)).toHaveText('2|3|');

                 async.done();
               });
             }));

      it('should contain all direct child directives in the content dom',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template =
                   '<needs-content-children #q><div text="foo"></div></needs-content-children>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();

                 var q = view.debugElement.children[0].references['q'];

                 view.detectChanges();

                 expect(q.textDirChildren.length).toEqual(1);
                 expect(q.numberOfChildrenAfterContentInit).toEqual(1);

                 async.done();
               });
             }));

      it('should contain the first content child',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template =
                   '<needs-content-child #q><div *ngIf="shouldShow" text="foo"></div></needs-content-child>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.debugElement.componentInstance.shouldShow = true;
                 view.detectChanges();

                 var q: NeedsContentChild = view.debugElement.children[0].references['q'];

                 expect(q.logs).toEqual([['setter', 'foo'], ['init', 'foo'], ['check', 'foo']]);

                 view.debugElement.componentInstance.shouldShow = false;
                 view.detectChanges();

                 expect(q.logs).toEqual([
                   ['setter', 'foo'], ['init', 'foo'], ['check', 'foo'], ['setter', null],
                   ['check', null]
                 ]);

                 async.done();
               });
             }));

      it('should contain the first view child',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-view-child #q></needs-view-child>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();
                 var q: NeedsViewChild = view.debugElement.children[0].references['q'];

                 expect(q.logs).toEqual([['setter', 'foo'], ['init', 'foo'], ['check', 'foo']]);

                 q.shouldShow = false;
                 view.detectChanges();

                 expect(q.logs).toEqual([
                   ['setter', 'foo'], ['init', 'foo'], ['check', 'foo'], ['setter', null],
                   ['check', null]
                 ]);

                 async.done();
               });
             }));

      it('should set static view and content children already after the constructor call',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template =
                   '<needs-static-content-view-child #q><div text="contentFoo"></div></needs-static-content-view-child>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q: NeedsStaticContentAndViewChild =
                     view.debugElement.children[0].references['q'];
                 expect(q.contentChild.text).toBeFalsy();
                 expect(q.viewChild.text).toBeFalsy();

                 view.detectChanges();

                 expect(q.contentChild.text).toEqual('contentFoo');
                 expect(q.viewChild.text).toEqual('viewFoo');

                 async.done();
               });
             }));

      it('should contain the first view child accross embedded views',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-view-child #q></needs-view-child>';
               tcb.overrideTemplate(MyComp0, template)
                   .overrideTemplate(
                       NeedsViewChild,
                       '<div *ngIf="true"><div *ngIf="shouldShow" text="foo"></div></div><div *ngIf="shouldShow2" text="bar"></div>')
                   .createAsync(MyComp0)
                   .then((view) => {
                     view.detectChanges();
                     var q: NeedsViewChild = view.debugElement.children[0].references['q'];

                     expect(q.logs).toEqual([['setter', 'foo'], ['init', 'foo'], ['check', 'foo']]);

                     q.shouldShow = false;
                     q.shouldShow2 = true;
                     q.logs = [];
                     view.detectChanges();

                     expect(q.logs).toEqual([['setter', 'bar'], ['check', 'bar']]);

                     q.shouldShow = false;
                     q.shouldShow2 = false;
                     q.logs = [];
                     view.detectChanges();

                     expect(q.logs).toEqual([['setter', null], ['check', null]]);

                     async.done();
                   });
             }));

      it('should contain all directives in the light dom when descendants flag is used',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div text="1"></div>' +
                   '<needs-query-desc text="2"><div text="3">' +
                   '<div text="4"></div>' +
                   '</div></needs-query-desc>' +
                   '<div text="5"></div>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();
                 expect(asNativeElements(view.debugElement.children)).toHaveText('2|3|4|');

                 async.done();
               });
             }));

      it('should contain all directives in the light dom',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div text="1"></div>' +
                   '<needs-query text="2"><div text="3"></div></needs-query>' +
                   '<div text="4"></div>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();
                 expect(asNativeElements(view.debugElement.children)).toHaveText('2|3|');

                 async.done();
               });
             }));

      it('should reflect dynamically inserted directives',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div text="1"></div>' +
                   '<needs-query text="2"><div *ngIf="shouldShow" [text]="\'3\'"></div></needs-query>' +
                   '<div text="4"></div>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {

                 view.detectChanges();
                 expect(asNativeElements(view.debugElement.children)).toHaveText('2|');

                 view.debugElement.componentInstance.shouldShow = true;
                 view.detectChanges();
                 expect(asNativeElements(view.debugElement.children)).toHaveText('2|3|');

                 async.done();
               });
             }));

      it('should be cleanly destroyed when a query crosses view boundaries',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div text="1"></div>' +
                   '<needs-query text="2"><div *ngIf="shouldShow" [text]="\'3\'"></div></needs-query>' +
                   '<div text="4"></div>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((fixture) => {
                 fixture.debugElement.componentInstance.shouldShow = true;
                 fixture.detectChanges();
                 fixture.destroy();

                 async.done();
               });
             }));

      it('should reflect moved directives',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<div text="1"></div>' +
                   '<needs-query text="2"><div *ngFor="let  i of list" [text]="i"></div></needs-query>' +
                   '<div text="4"></div>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();

                 expect(asNativeElements(view.debugElement.children)).toHaveText('2|1d|2d|3d|');

                 view.debugElement.componentInstance.list = ['3d', '2d'];
                 view.detectChanges();
                 expect(asNativeElements(view.debugElement.children)).toHaveText('2|3d|2d|');

                 async.done();
               });
             }));

      it('should throw with descriptive error when query selectors are not present',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideTemplate(
                      MyCompBroken0, '<has-null-query-condition></has-null-query-condition>')
                   .createAsync(MyCompBroken0)
                   .catch((e) => {
                     expect(e.message).toEqual(
                         `Can't construct a query for the property "errorTrigger" of "${stringify(HasNullQueryCondition)}" since the query selector wasn't defined.`);
                     async.done();
                   });
             }));
    });

    describe('query for TemplateRef', () => {
      it('should find TemplateRefs in the light and shadow dom',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-tpl><template><div>light</div></template></needs-tpl>';
               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();
                 var needsTpl: NeedsTpl = view.debugElement.children[0].injector.get(NeedsTpl);

                 expect(needsTpl.vc.createEmbeddedView(needsTpl.query.first).rootNodes[0])
                     .toHaveText('light');
                 expect(needsTpl.vc.createEmbeddedView(needsTpl.viewQuery.first).rootNodes[0])
                     .toHaveText('shadow');

                 async.done();
               });
             }));

      it('should find named TemplateRefs',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template =
                   '<needs-named-tpl><template #tpl><div>light</div></template></needs-named-tpl>';
               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();
                 var needsTpl: NeedsNamedTpl =
                     view.debugElement.children[0].injector.get(NeedsNamedTpl);
                 expect(needsTpl.vc.createEmbeddedView(needsTpl.contentTpl).rootNodes[0])
                     .toHaveText('light');
                 expect(needsTpl.vc.createEmbeddedView(needsTpl.viewTpl).rootNodes[0])
                     .toHaveText('shadow')

                         async.done();
               });
             }));
    });

    describe('read a different token', () => {
      it('should contain all content children',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template =
                   '<needs-content-children-read #q text="ca"><div #q text="cb"></div></needs-content-children-read>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();

                 var comp: NeedsContentChildrenWithRead =
                     view.debugElement.children[0].injector.get(NeedsContentChildrenWithRead);
                 expect(comp.textDirChildren.map(textDirective => textDirective.text)).toEqual([
                   'ca', 'cb'
                 ]);

                 async.done();
               });
             }));

      it('should contain the first content child',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template =
                   '<needs-content-child-read><div #q text="ca"></div></needs-content-child-read>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();

                 var comp: NeedsContentChildWithRead =
                     view.debugElement.children[0].injector.get(NeedsContentChildWithRead);
                 expect(comp.textDirChild.text).toEqual('ca');

                 async.done();
               });
             }));

      it('should contain the first view child',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-view-child-read></needs-view-child-read>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();

                 var comp: NeedsViewChildWithRead =
                     view.debugElement.children[0].injector.get(NeedsViewChildWithRead);
                 expect(comp.textDirChild.text).toEqual('va');

                 async.done();
               });
             }));

      it('should contain all child directives in the view',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-view-children-read></needs-view-children-read>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();

                 var comp: NeedsViewChildrenWithRead =
                     view.debugElement.children[0].injector.get(NeedsViewChildrenWithRead);
                 expect(comp.textDirChildren.map(textDirective => textDirective.text)).toEqual([
                   'va', 'vb'
                 ]);

                 async.done();
               });
             }));

      it('should support reading a ViewContainer',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template =
                   '<needs-viewcontainer-read><template>hello</template></needs-viewcontainer-read>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();

                 var comp: NeedsViewContainerWithRead =
                     view.debugElement.children[0].injector.get(NeedsViewContainerWithRead);
                 comp.createView();
                 expect(view.debugElement.children[0].nativeElement).toHaveText('hello');

                 async.done();
               });
             }));
    });

    describe('changes', () => {
      it('should notify query on change',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-query #q>' +
                   '<div text="1"></div>' +
                   '<div *ngIf="shouldShow" text="2"></div>' +
                   '</needs-query>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q = view.debugElement.children[0].references['q'];
                 view.detectChanges();

                 ObservableWrapper.subscribe(q.query.changes, (_) => {
                   expect(q.query.first.text).toEqual('1');
                   expect(q.query.last.text).toEqual('2');
                   async.done();
                 });

                 view.debugElement.componentInstance.shouldShow = true;
                 view.detectChanges();
               });
             }));

      it('should notify child\'s query before notifying parent\'s query',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-query-desc #q1>' +
                   '<needs-query-desc #q2>' +
                   '<div text="1"></div>' +
                   '</needs-query-desc>' +
                   '</needs-query-desc>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q1 = view.debugElement.children[0].references['q1'];
                 var q2 = view.debugElement.children[0].children[0].references['q2'];

                 var firedQ2 = false;

                 ObservableWrapper.subscribe(q2.query.changes, (_) => { firedQ2 = true; });
                 ObservableWrapper.subscribe(q1.query.changes, (_) => {
                   expect(firedQ2).toBe(true);
                   async.done();
                 });

                 view.detectChanges();
               });
             }));

      it('should correctly clean-up when destroyed together with the directives it is querying',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template =
                   '<needs-query #q *ngIf="shouldShow"><div text="foo"></div></needs-query>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.debugElement.componentInstance.shouldShow = true;
                 view.detectChanges();

                 var q: NeedsQuery = view.debugElement.children[0].references['q'];

                 expect(q.query.length).toEqual(1);

                 view.debugElement.componentInstance.shouldShow = false;
                 view.detectChanges();

                 view.debugElement.componentInstance.shouldShow = true;
                 view.detectChanges();

                 var q2: NeedsQuery = view.debugElement.children[0].references['q'];

                 expect(q2.query.length).toEqual(1);

                 async.done();
               });
             }));
    });

    describe('querying by var binding', () => {
      it('should contain all the child directives in the light dom with the given var binding',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-query-by-ref-binding #q>' +
                   '<div *ngFor="let item of list" [text]="item" #textLabel="textDir"></div>' +
                   '</needs-query-by-ref-binding>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q = view.debugElement.children[0].references['q'];

                 view.debugElement.componentInstance.list = ['1d', '2d'];

                 view.detectChanges();

                 expect(q.query.first.text).toEqual('1d');
                 expect(q.query.last.text).toEqual('2d');

                 async.done();
               });
             }));

      it('should support querying by multiple var bindings',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-query-by-ref-bindings #q>' +
                   '<div text="one" #textLabel1="textDir"></div>' +
                   '<div text="two" #textLabel2="textDir"></div>' +
                   '</needs-query-by-ref-bindings>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q = view.debugElement.children[0].references['q'];
                 view.detectChanges();

                 expect(q.query.first.text).toEqual('one');
                 expect(q.query.last.text).toEqual('two');

                 async.done();
               });
             }));

      it('should support dynamically inserted directives',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-query-by-ref-binding #q>' +
                   '<div *ngFor="let item of list" [text]="item" #textLabel="textDir"></div>' +
                   '</needs-query-by-ref-binding>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q = view.debugElement.children[0].references['q'];

                 view.debugElement.componentInstance.list = ['1d', '2d'];

                 view.detectChanges();

                 view.debugElement.componentInstance.list = ['2d', '1d'];

                 view.detectChanges();

                 expect(q.query.last.text).toEqual('1d');

                 async.done();
               });
             }));

      it('should contain all the elements in the light dom with the given var binding',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-query-by-ref-binding #q>' +
                   '<div template="ngFor: let item of list">' +
                   '<div #textLabel>{{item}}</div>' +
                   '</div>' +
                   '</needs-query-by-ref-binding>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q = view.debugElement.children[0].references['q'];

                 view.debugElement.componentInstance.list = ['1d', '2d'];

                 view.detectChanges();

                 expect(q.query.first.nativeElement).toHaveText('1d');
                 expect(q.query.last.nativeElement).toHaveText('2d');

                 async.done();
               });
             }));

      it('should contain all the elements in the light dom even if they get projected',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-query-and-project #q>' +
                   '<div text="hello"></div><div text="world"></div>' +
                   '</needs-query-and-project>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();

                 expect(asNativeElements(view.debugElement.children)).toHaveText('hello|world|');

                 async.done();
               });
             }));

      it('should support querying the view by using a view query',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template =
                   '<needs-view-query-by-ref-binding #q></needs-view-query-by-ref-binding>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q: NeedsViewQueryByLabel = view.debugElement.children[0].references['q'];
                 view.detectChanges();

                 expect(q.query.first.nativeElement).toHaveText('text');

                 async.done();
               });
             }));

      it('should contain all child directives in the view dom',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-view-children #q></needs-view-children>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();

                 var q = view.debugElement.children[0].references['q'];

                 view.detectChanges();

                 expect(q.textDirChildren.length).toEqual(1);
                 expect(q.numberOfChildrenAfterViewInit).toEqual(1);

                 async.done();
               });
             }));

    });

    describe('querying in the view', () => {
      it('should contain all the elements in the view with that have the given directive',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-view-query #q><div text="ignoreme"></div></needs-view-query>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q: NeedsViewQuery = view.debugElement.children[0].references['q'];

                 view.detectChanges();

                 expect(q.query.map((d: TextDirective) => d.text)).toEqual(['1', '2', '3', '4']);

                 async.done();
               });
             }));

      it('should not include directive present on the host element',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-view-query #q text="self"></needs-view-query>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q: NeedsViewQuery = view.debugElement.children[0].references['q'];

                 view.detectChanges();

                 expect(q.query.map((d: TextDirective) => d.text)).toEqual(['1', '2', '3', '4']);

                 async.done();
               });
             }));

      it('should reflect changes in the component',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-view-query-if #q></needs-view-query-if>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q: NeedsViewQueryIf = view.debugElement.children[0].references['q'];

                 view.detectChanges();

                 expect(q.query.length).toBe(0);

                 q.show = true;
                 view.detectChanges();
                 expect(q.query.length).toBe(1);

                 expect(q.query.first.text).toEqual('1');

                 async.done();
               });
             }));

      it('should not be affected by other changes in the component',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-view-query-nested-if #q></needs-view-query-nested-if>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q: NeedsViewQueryNestedIf = view.debugElement.children[0].references['q'];

                 view.detectChanges();

                 expect(q.query.length).toEqual(1);
                 expect(q.query.first.text).toEqual('1');

                 q.show = false;
                 view.detectChanges();

                 expect(q.query.length).toEqual(1);
                 expect(q.query.first.text).toEqual('1');

                 async.done();
               });
             }));


      it('should maintain directives in pre-order depth-first DOM order after dynamic insertion',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-view-query-order #q></needs-view-query-order>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q: NeedsViewQueryOrder = view.debugElement.children[0].references['q'];

                 view.detectChanges();

                 expect(q.query.map((d: TextDirective) => d.text)).toEqual(['1', '2', '3', '4']);

                 q.list = ['-3', '2'];
                 view.detectChanges();


                 expect(q.query.map((d: TextDirective) => d.text)).toEqual(['1', '-3', '2', '4']);

                 async.done();
               });
             }));

      it('should maintain directives in pre-order depth-first DOM order after dynamic insertion',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-view-query-order-with-p #q></needs-view-query-order-with-p>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q: NeedsViewQueryOrderWithParent =
                     view.debugElement.children[0].references['q'];

                 view.detectChanges();

                 expect(q.query.map((d: TextDirective) => d.text)).toEqual(['1', '2', '3', '4']);

                 q.list = ['-3', '2'];
                 view.detectChanges();


                 expect(q.query.map((d: TextDirective) => d.text)).toEqual(['1', '-3', '2', '4']);

                 async.done();
               });
             }));

      it('should handle long ngFor cycles',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-view-query-order #q></needs-view-query-order>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 var q: NeedsViewQueryOrder = view.debugElement.children[0].references['q'];

                 // no significance to 50, just a reasonably large cycle.
                 for (var i = 0; i < 50; i++) {
                   var newString = i.toString();
                   q.list = [newString];
                   view.detectChanges();

                   expect(q.query.map((d: TextDirective) => d.text)).toEqual(['1', newString, '4']);
                 }

                 async.done();
               });
             }));

      it('should support more than three queries',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var template = '<needs-four-queries #q><div text="1"></div></needs-four-queries>';

               tcb.overrideTemplate(MyComp0, template).createAsync(MyComp0).then((view) => {
                 view.detectChanges();

                 var q = view.debugElement.children[0].references['q'];
                 expect(q.query1).toBeDefined();
                 expect(q.query2).toBeDefined();
                 expect(q.query3).toBeDefined();
                 expect(q.query4).toBeDefined();

                 async.done();
               });
             }));
    });
  });
}

@Directive({selector: '[text]', inputs: ['text'], exportAs: 'textDir'})
class TextDirective {
  text: string;
  constructor() {}
}

@Component({selector: 'needs-content-children', template: ''})
class NeedsContentChildren implements AfterContentInit {
  @ContentChildren(TextDirective) textDirChildren: QueryList<TextDirective>;
  numberOfChildrenAfterContentInit: number;

  ngAfterContentInit() { this.numberOfChildrenAfterContentInit = this.textDirChildren.length; }
}

@Component(
    {selector: 'needs-view-children', template: '<div text></div>', directives: [TextDirective]})
class NeedsViewChildren implements AfterViewInit {
  @ViewChildren(TextDirective) textDirChildren: QueryList<TextDirective>;
  numberOfChildrenAfterViewInit: number;

  ngAfterViewInit() { this.numberOfChildrenAfterViewInit = this.textDirChildren.length; }
}

@Component({selector: 'needs-content-child', template: ''})
class NeedsContentChild implements AfterContentInit, AfterContentChecked {
  _child: TextDirective;

  @ContentChild(TextDirective)
  set child(value) {
    this._child = value;
    this.logs.push(['setter', isPresent(value) ? value.text : null]);
  }

  get child() { return this._child; }
  logs: any[] /** TODO #9100 */ = [];

  ngAfterContentInit() { this.logs.push(['init', isPresent(this.child) ? this.child.text : null]); }

  ngAfterContentChecked() {
    this.logs.push(['check', isPresent(this.child) ? this.child.text : null]);
  }
}

@Component({
  selector: 'needs-view-child',
  template: `
    <div *ngIf="shouldShow" text="foo"></div>
  `,
  directives: [NgIf, TextDirective]
})
class NeedsViewChild implements AfterViewInit,
    AfterViewChecked {
  shouldShow: boolean = true;
  shouldShow2: boolean = false;
  _child: TextDirective;

  @ViewChild(TextDirective)
  set child(value) {
    this._child = value;
    this.logs.push(['setter', isPresent(value) ? value.text : null]);
  }

  get child() { return this._child; }
  logs: any[] /** TODO #9100 */ = [];

  ngAfterViewInit() { this.logs.push(['init', isPresent(this.child) ? this.child.text : null]); }

  ngAfterViewChecked() {
    this.logs.push(['check', isPresent(this.child) ? this.child.text : null]);
  }
}

@Component({
  selector: 'needs-static-content-view-child',
  template: `
    <div text="viewFoo"></div>
  `,
  directives: [TextDirective]
})
class NeedsStaticContentAndViewChild {
  @ContentChild(TextDirective) contentChild: TextDirective;

  @ViewChild(TextDirective) viewChild: TextDirective;
}

@Directive({selector: '[dir]'})
class InertDirective {
  constructor() {}
}

@Component({
  selector: 'needs-query',
  directives: [NgFor, TextDirective],
  template: '<div text="ignoreme"></div><b *ngFor="let  dir of query">{{dir.text}}|</b>'
})
class NeedsQuery {
  query: QueryList<TextDirective>;
  constructor(@Query(TextDirective) query: QueryList<TextDirective>) { this.query = query; }
}

@Component({selector: 'needs-four-queries', template: ''})
class NeedsFourQueries {
  @ContentChild(TextDirective) query1: TextDirective;
  @ContentChild(TextDirective) query2: TextDirective;
  @ContentChild(TextDirective) query3: TextDirective;
  @ContentChild(TextDirective) query4: TextDirective;
}

@Component({
  selector: 'needs-query-desc',
  directives: [NgFor],
  template: '<ng-content></ng-content><div *ngFor="let  dir of query">{{dir.text}}|</div>'
})
class NeedsQueryDesc {
  query: QueryList<TextDirective>;
  constructor(@Query(TextDirective, {descendants: true}) query: QueryList<TextDirective>) {
    this.query = query;
  }
}

@Component({selector: 'needs-query-by-ref-binding', directives: [], template: '<ng-content>'})
class NeedsQueryByLabel {
  query: QueryList<any>;
  constructor(@Query('textLabel', {descendants: true}) query: QueryList<any>) {
    this.query = query;
  }
}

@Component({
  selector: 'needs-view-query-by-ref-binding',
  directives: [],
  template: '<div #textLabel>text</div>'
})
class NeedsViewQueryByLabel {
  query: QueryList<any>;
  constructor(@ViewQuery('textLabel') query: QueryList<any>) { this.query = query; }
}

@Component({selector: 'needs-query-by-ref-bindings', directives: [], template: '<ng-content>'})
class NeedsQueryByTwoLabels {
  query: QueryList<any>;
  constructor(@Query('textLabel1,textLabel2', {descendants: true}) query: QueryList<any>) {
    this.query = query;
  }
}

@Component({
  selector: 'needs-query-and-project',
  directives: [NgFor],
  template: '<div *ngFor="let  dir of query">{{dir.text}}|</div><ng-content></ng-content>'
})
class NeedsQueryAndProject {
  query: QueryList<TextDirective>;
  constructor(@Query(TextDirective) query: QueryList<TextDirective>) { this.query = query; }
}

@Component({
  selector: 'needs-view-query',
  directives: [TextDirective],
  template: '<div text="1"><div text="2"></div></div>' +
      '<div text="3"></div><div text="4"></div>'
})
class NeedsViewQuery {
  query: QueryList<TextDirective>;
  constructor(@ViewQuery(TextDirective) query: QueryList<TextDirective>) { this.query = query; }
}

@Component({
  selector: 'needs-view-query-if',
  directives: [NgIf, TextDirective],
  template: '<div *ngIf="show" text="1"></div>'
})
class NeedsViewQueryIf {
  show: boolean;
  query: QueryList<TextDirective>;
  constructor(@ViewQuery(TextDirective) query: QueryList<TextDirective>) {
    this.query = query;
    this.show = false;
  }
}


@Component({
  selector: 'needs-view-query-nested-if',
  directives: [NgIf, InertDirective, TextDirective],
  template: '<div text="1"><div *ngIf="show"><div dir></div></div></div>'
})
class NeedsViewQueryNestedIf {
  show: boolean;
  query: QueryList<TextDirective>;
  constructor(@ViewQuery(TextDirective) query: QueryList<TextDirective>) {
    this.query = query;
    this.show = true;
  }
}

@Component({
  selector: 'needs-view-query-order',
  directives: [NgFor, TextDirective, InertDirective],
  template: '<div text="1"></div>' +
      '<div *ngFor="let  i of list" [text]="i"></div>' +
      '<div text="4"></div>'
})
class NeedsViewQueryOrder {
  query: QueryList<TextDirective>;
  list: string[];
  constructor(@ViewQuery(TextDirective) query: QueryList<TextDirective>) {
    this.query = query;
    this.list = ['2', '3'];
  }
}

@Component({
  selector: 'needs-view-query-order-with-p',
  directives: [NgFor, TextDirective, InertDirective],
  template: '<div dir><div text="1"></div>' +
      '<div *ngFor="let  i of list" [text]="i"></div>' +
      '<div text="4"></div></div>'
})
class NeedsViewQueryOrderWithParent {
  query: QueryList<TextDirective>;
  list: string[];
  constructor(@ViewQuery(TextDirective) query: QueryList<TextDirective>) {
    this.query = query;
    this.list = ['2', '3'];
  }
}

@Component({selector: 'needs-tpl', template: '<template><div>shadow</div></template>'})
class NeedsTpl {
  viewQuery: QueryList<TemplateRef<Object>>;
  query: QueryList<TemplateRef<Object>>;
  constructor(
      @ViewQuery(TemplateRef) viewQuery: QueryList<TemplateRef<Object>>,
      @Query(TemplateRef) query: QueryList<TemplateRef<Object>>, public vc: ViewContainerRef) {
    this.viewQuery = viewQuery;
    this.query = query;
  }
}

@Component({selector: 'needs-named-tpl', template: '<template #tpl><div>shadow</div></template>'})
class NeedsNamedTpl {
  @ViewChild('tpl') viewTpl: TemplateRef<Object>;
  @ContentChild('tpl') contentTpl: TemplateRef<Object>;
  constructor(public vc: ViewContainerRef) {}
}

@Component({selector: 'needs-content-children-read', template: ''})
class NeedsContentChildrenWithRead {
  @ContentChildren('q', {read: TextDirective}) textDirChildren: QueryList<TextDirective>;
  @ContentChildren('nonExisting', {read: TextDirective}) nonExistingVar: QueryList<TextDirective>;
}

@Component({selector: 'needs-content-child-read', template: ''})
class NeedsContentChildWithRead {
  @ContentChild('q', {read: TextDirective}) textDirChild: TextDirective;
  @ContentChild('nonExisting', {read: TextDirective}) nonExistingVar: TextDirective;
}

@Component({
  selector: 'needs-view-children-read',
  template: '<div #q text="va"></div><div #w text="vb"></div>',
  directives: [TextDirective]
})
class NeedsViewChildrenWithRead {
  @ViewChildren('q,w', {read: TextDirective}) textDirChildren: QueryList<TextDirective>;
  @ViewChildren('nonExisting', {read: TextDirective}) nonExistingVar: QueryList<TextDirective>;
}

@Component({
  selector: 'needs-view-child-read',
  template: '<div #q text="va"></div>',
  directives: [TextDirective]
})
class NeedsViewChildWithRead {
  @ViewChild('q', {read: TextDirective}) textDirChild: TextDirective;
  @ViewChild('nonExisting', {read: TextDirective}) nonExistingVar: TextDirective;
}

@Component({selector: 'needs-viewcontainer-read', template: '<div #q></div>'})
class NeedsViewContainerWithRead {
  @ViewChild('q', {read: ViewContainerRef}) vc: ViewContainerRef;
  @ViewChild('nonExisting', {read: ViewContainerRef}) nonExistingVar: ViewContainerRef;
  @ContentChild(TemplateRef) template: TemplateRef<Object>;

  createView() { this.vc.createEmbeddedView(this.template); }
}

@Component({selector: 'has-null-query-condition', template: '<div></div>'})
class HasNullQueryCondition {
  @ContentChildren(null) errorTrigger: any /** TODO #9100 */;
}

@Component({
  selector: 'my-comp',
  directives: [
    NeedsQuery,
    NeedsQueryDesc,
    NeedsQueryByLabel,
    NeedsQueryByTwoLabels,
    NeedsQueryAndProject,
    NeedsViewQuery,
    NeedsViewQueryIf,
    NeedsViewQueryNestedIf,
    NeedsViewQueryOrder,
    NeedsViewQueryByLabel,
    NeedsViewQueryOrderWithParent,
    NeedsContentChildren,
    NeedsViewChildren,
    NeedsViewChild,
    NeedsStaticContentAndViewChild,
    NeedsContentChild,
    NeedsTpl,
    NeedsNamedTpl,
    TextDirective,
    InertDirective,
    NgIf,
    NgFor,
    NeedsFourQueries,
    NeedsContentChildrenWithRead,
    NeedsContentChildWithRead,
    NeedsViewChildrenWithRead,
    NeedsViewChildWithRead,
    NeedsViewContainerWithRead
  ],
  template: ''
})
class MyComp0 {
  shouldShow: boolean;
  list: any /** TODO #9100 */;
  constructor() {
    this.shouldShow = false;
    this.list = ['1d', '2d', '3d'];
  }
}

@Component({selector: 'my-comp', directives: [HasNullQueryCondition], template: ''})
class MyCompBroken0 {
}
