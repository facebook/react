import {beforeEach, ddescribe, xdescribe, describe, expect, iit, inject, beforeEachProviders, it, xit,} from '@angular/core/testing/testing_internal';
import {TestComponentBuilder} from '@angular/compiler/testing';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';
import {OpaqueToken, ViewMetadata, Component, Directive, AfterContentInit, AfterViewInit, QueryList, ContentChildren, ViewChildren, Input} from '@angular/core';
import {NgIf} from '@angular/common';
import {CompilerConfig} from '@angular/compiler';
import {el} from '@angular/platform-browser/testing';

const ANCHOR_ELEMENT = new OpaqueToken('AnchorElement');

export function main() {
  describe('jit', () => { declareTests({useJit: true}); });
  describe('no jit', () => { declareTests({useJit: false}); });
}

function declareTests({useJit}: {useJit: boolean}) {
  describe('<ng-container>', function() {

    beforeEachProviders(
        () =>
            [{
              provide: CompilerConfig,
              useValue: new CompilerConfig({genDebugInfo: true, useJit: useJit})
            },
             {provide: ANCHOR_ELEMENT, useValue: el('<div></div>')},
    ]);

    it('should be rendered as comment with children as siblings',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(MyComp, '<ng-container><p></p></ng-container>')
                 .createAsync(MyComp)
                 .then((fixture) => {
                   fixture.detectChanges();

                   const el = fixture.debugElement.nativeElement;
                   const children = getDOM().childNodes(el);
                   expect(children.length).toBe(2);
                   expect(getDOM().isCommentNode(children[0])).toBe(true);
                   expect(getDOM().tagName(children[1]).toUpperCase()).toEqual('P');

                   async.done();
                 });
           }));

    it('should support nesting',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(
                    MyComp,
                    '<ng-container>1</ng-container><ng-container><ng-container>2</ng-container></ng-container>')
                 .createAsync(MyComp)
                 .then((fixture) => {
                   fixture.detectChanges();

                   const el = fixture.debugElement.nativeElement;
                   const children = getDOM().childNodes(el);
                   expect(children.length).toBe(5);
                   expect(getDOM().isCommentNode(children[0])).toBe(true);
                   expect(children[1]).toHaveText('1');
                   expect(getDOM().isCommentNode(children[2])).toBe(true);
                   expect(getDOM().isCommentNode(children[3])).toBe(true);
                   expect(children[4]).toHaveText('2');

                   async.done();
                 });
           }));

    it('should group inner nodes',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(
                    MyComp, '<ng-container *ngIf="ctxBoolProp"><p></p><b></b></ng-container>')
                 .createAsync(MyComp)
                 .then((fixture) => {
                   fixture.debugElement.componentInstance.ctxBoolProp = true;
                   fixture.detectChanges();

                   const el = fixture.debugElement.nativeElement;
                   const children = getDOM().childNodes(el);

                   expect(children.length).toBe(4);
                   // ngIf anchor
                   expect(getDOM().isCommentNode(children[0])).toBe(true);
                   // ng-container anchor
                   expect(getDOM().isCommentNode(children[1])).toBe(true);
                   expect(getDOM().tagName(children[2]).toUpperCase()).toEqual('P');
                   expect(getDOM().tagName(children[3]).toUpperCase()).toEqual('B');

                   fixture.debugElement.componentInstance.ctxBoolProp = false;
                   fixture.detectChanges();

                   expect(children.length).toBe(1);
                   expect(getDOM().isCommentNode(children[0])).toBe(true);

                   async.done();
                 });
           }));

    it('should work with static content projection',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(
                    MyComp, `<simple><ng-container><p>1</p><p>2</p></ng-container></simple>`)
                 .createAsync(MyComp)
                 .then((fixture) => {
                   fixture.detectChanges();

                   const el = fixture.debugElement.nativeElement;
                   expect(el).toHaveText('SIMPLE(12)');

                   async.done();
                 });
           }));

    it('should support injecting the container from children',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideTemplate(
                    MyComp, `<ng-container [text]="'container'"><p></p></ng-container>`)
                 .createAsync(MyComp)
                 .then((fixture) => {
                   fixture.detectChanges();

                   const dir = fixture.debugElement.children[0].injector.get(TextDirective);
                   expect(dir).toBeAnInstanceOf(TextDirective);
                   expect(dir.text).toEqual('container');

                   async.done();
                 });
           }));

    it('should contain all direct child directives in a <ng-container> (content dom)',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             const template =
                 '<needs-content-children #q><ng-container><div text="foo"></div></ng-container></needs-content-children>';

             tcb.overrideTemplate(MyComp, template).createAsync(MyComp).then((view) => {
               view.detectChanges();
               var q = view.debugElement.children[0].references['q'];
               view.detectChanges();

               expect(q.textDirChildren.length).toEqual(1);
               expect(q.numberOfChildrenAfterContentInit).toEqual(1);

               async.done();
             });
           }));

    it('should contain all child directives in a <ng-container> (view dom)',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             const template = '<needs-view-children #q></needs-view-children>';

             tcb.overrideTemplate(MyComp, template).createAsync(MyComp).then((view) => {
               view.detectChanges();
               var q = view.debugElement.children[0].references['q'];
               view.detectChanges();

               expect(q.textDirChildren.length).toEqual(1);
               expect(q.numberOfChildrenAfterViewInit).toEqual(1);

               async.done();
             });
           }));
  });
}

@Directive({selector: '[text]'})
class TextDirective {
  @Input() public text: string = null;
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

@Component({selector: 'simple', template: 'SIMPLE(<ng-content></ng-content>)', directives: []})
class Simple {
}

@Component({
  selector: 'my-comp',
  directives: [NeedsContentChildren, NeedsViewChildren, TextDirective, NgIf, Simple],
  template: ''
})
class MyComp {
  ctxBoolProp: boolean = false;
}