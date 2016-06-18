import {AsyncTestCompleter, beforeEach, ddescribe, describe, expect, iit, inject, it, xit,} from '@angular/core/testing/testing_internal';
import {TestComponentBuilder} from '@angular/compiler/testing';

import {Component, ViewMetadata, Input, Directive, ViewChild, ViewChildren, QueryList, ElementRef} from '@angular/core';

export function main() {
  describe('ViewChild', () => {
    it('should support type selector',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(
                    ViewChildTypeSelectorComponent, new ViewMetadata({
                      template: `<simple [marker]="'1'"></simple><simple [marker]="'2'"></simple>`,
                      directives: [Simple]
                    }))
                 .createAsync(ViewChildTypeSelectorComponent)
                 .then((view) => {
                   view.detectChanges();
                   expect(view.componentInstance.child).toBeDefined();
                   expect(view.componentInstance.child.marker).toBe('1');
                   async.done();
                 });
           }));
    it('should support string selector',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(
                    ViewChildStringSelectorComponent,
                    new ViewMetadata({template: `<simple #child></simple>`, directives: [Simple]}))
                 .createAsync(ViewChildStringSelectorComponent)
                 .then((view) => {
                   view.detectChanges();
                   expect(view.componentInstance.child).toBeDefined();
                   async.done();
                 });
           }));
  });
  describe('ViewChildren', () => {
    it('should support type selector',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(
                    ViewChildrenTypeSelectorComponent,
                    new ViewMetadata(
                        {template: `<simple></simple><simple></simple>`, directives: [Simple]}))
                 .createAsync(ViewChildrenTypeSelectorComponent)
                 .then((view) => {
                   view.detectChanges();
                   expect(view.componentInstance.children).toBeDefined();
                   expect(view.componentInstance.children.length).toBe(2);
                   async.done();
                 });
           }));
    it('should support string selector',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(ViewChildrenStringSelectorComponent, new ViewMetadata({
                                template: `<simple #child1></simple><simple #child2></simple>`,
                                directives: [Simple]
                              }))
                 .createAsync(ViewChildrenStringSelectorComponent)
                 .then((view) => {
                   view.detectChanges();
                   expect(view.componentInstance.children).toBeDefined();
                   expect(view.componentInstance.children.length).toBe(2);
                   async.done();
                 });
           }));
  });
}


@Directive({selector: 'simple'})
class Simple {
  @Input() marker: string;
}

@Component({selector: 'view-child-type-selector'})
class ViewChildTypeSelectorComponent {
  @ViewChild(Simple) child: Simple;
}

@Component({selector: 'view-child-string-selector'})
class ViewChildStringSelectorComponent {
  @ViewChild('child') child: ElementRef;
}

@Component({selector: 'view-children-type-selector'})
class ViewChildrenTypeSelectorComponent {
  @ViewChildren(Simple) children: QueryList<Simple>;
}

@Component({selector: 'view-child-string-selector'})
class ViewChildrenStringSelectorComponent {
  // Allow comma separated selector (with spaces).
  @ViewChildren('child1 , child2') children: QueryList<ElementRef>;
}
