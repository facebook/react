import {beforeEach, ddescribe, xdescribe, describe, expect, iit, inject, beforeEachProviders, it, xit,} from '@angular/core/testing/testing_internal';
import {containsRegexp, fakeAsync, tick, clearPendingTimers} from '@angular/core/testing';
import {TestComponentBuilder, ComponentFixture} from '@angular/compiler/testing';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';
import {isPresent, stringify, isBlank,} from '../../src/facade/lang';
import {BaseException} from '../../src/facade/exceptions';
import {PromiseWrapper, EventEmitter, ObservableWrapper, PromiseCompleter,} from '../../src/facade/async';

import {Injector, Injectable, forwardRef, OpaqueToken, Inject, Host, SkipSelf, SkipSelfMetadata, OnDestroy, ReflectiveInjector} from '@angular/core';

import {NgIf, NgFor, AsyncPipe} from '@angular/common';

import {PipeTransform, ChangeDetectorRef, ChangeDetectionStrategy} from '@angular/core/src/change_detection/change_detection';

import {CompilerConfig} from '@angular/compiler';

import {Directive, Component, ViewMetadata, Attribute, Query, Pipe, Input, Output, HostBinding, HostListener} from '@angular/core/src/metadata';

import {QueryList} from '@angular/core/src/linker/query_list';

import {ViewContainerRef} from '@angular/core/src/linker/view_container_ref';
import {EmbeddedViewRef} from '@angular/core/src/linker/view_ref';

import {ComponentResolver} from '@angular/core/src/linker/component_resolver';
import {ElementRef} from '@angular/core/src/linker/element_ref';
import {TemplateRef, TemplateRef_} from '@angular/core/src/linker/template_ref';

import {Renderer} from '@angular/core/src/render';
import {IS_DART} from '../../src/facade/lang';
import {el, dispatchEvent} from '@angular/platform-browser/testing';

const ANCHOR_ELEMENT = /*@ts2dart_const*/ new OpaqueToken('AnchorElement');

export function main() {
  if (IS_DART) {
    declareTests({useJit: false});
  } else {
    describe('jit', () => { declareTests({useJit: true}); });

    describe('no jit', () => { declareTests({useJit: false}); });
  }
}

function declareTests({useJit}: {useJit: boolean}) {
  describe('integration tests', function() {

    beforeEachProviders(
        () =>
            [{
              provide: CompilerConfig,
              useValue: new CompilerConfig({genDebugInfo: true, useJit: useJit})
            },
             {provide: ANCHOR_ELEMENT, useValue: el('<div></div>')}]);

    describe('react to record changes', function() {
      it('should consume text node changes',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({template: '<div>{{ctxProp}}</div>'}))
                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.ctxProp = 'Hello World!';

                     fixture.detectChanges();
                     expect(fixture.debugElement.nativeElement).toHaveText('Hello World!');
                     async.done();
                   });
             }));

      it('should update text node with a blank string when interpolation evaluates to null',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({template: '<div>{{null}}{{ctxProp}}</div>'}))
                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.ctxProp = null;

                     fixture.detectChanges();
                     expect(fixture.debugElement.nativeElement).toHaveText('');
                     async.done();
                   });
             }));

      it('should consume element binding changes',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({template: '<div [id]="ctxProp"></div>'}))
                   .createAsync(MyComp)
                   .then((fixture) => {

                     fixture.debugElement.componentInstance.ctxProp = 'Hello World!';
                     fixture.detectChanges();

                     expect(fixture.debugElement.children[0].nativeElement.id)
                         .toEqual('Hello World!');
                     async.done();
                   });
             }));

      it('should consume binding to aria-* attributes',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp,
                      new ViewMetadata({template: '<div [attr.aria-label]="ctxProp"></div>'}))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.ctxProp = 'Initial aria label';
                     fixture.detectChanges();
                     expect(getDOM().getAttribute(
                                fixture.debugElement.children[0].nativeElement, 'aria-label'))
                         .toEqual('Initial aria label');

                     fixture.debugElement.componentInstance.ctxProp = 'Changed aria label';
                     fixture.detectChanges();
                     expect(getDOM().getAttribute(
                                fixture.debugElement.children[0].nativeElement, 'aria-label'))
                         .toEqual('Changed aria label');

                     async.done();
                   });
             }));

      it('should remove an attribute when attribute expression evaluates to null',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({template: '<div [attr.foo]="ctxProp"></div>'}))

                   .createAsync(MyComp)
                   .then((fixture) => {

                     fixture.debugElement.componentInstance.ctxProp = 'bar';
                     fixture.detectChanges();
                     expect(getDOM().getAttribute(
                                fixture.debugElement.children[0].nativeElement, 'foo'))
                         .toEqual('bar');

                     fixture.debugElement.componentInstance.ctxProp = null;
                     fixture.detectChanges();
                     expect(getDOM().hasAttribute(
                                fixture.debugElement.children[0].nativeElement, 'foo'))
                         .toBeFalsy();

                     async.done();
                   });
             }));

      it('should remove style when when style expression evaluates to null',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp,
                      new ViewMetadata({template: '<div [style.height.px]="ctxProp"></div>'}))

                   .createAsync(MyComp)
                   .then((fixture) => {

                     fixture.debugElement.componentInstance.ctxProp = '10';
                     fixture.detectChanges();
                     expect(getDOM().getStyle(
                                fixture.debugElement.children[0].nativeElement, 'height'))
                         .toEqual('10px');

                     fixture.debugElement.componentInstance.ctxProp = null;
                     fixture.detectChanges();
                     expect(getDOM().getStyle(
                                fixture.debugElement.children[0].nativeElement, 'height'))
                         .toEqual('');

                     async.done();
                   });
             }));

      it('should consume binding to property names where attr name and property name do not match',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({template: '<div [tabindex]="ctxNumProp"></div>'}))

                   .createAsync(MyComp)
                   .then((fixture) => {

                     fixture.detectChanges();
                     expect(fixture.debugElement.children[0].nativeElement.tabIndex).toEqual(0);

                     fixture.debugElement.componentInstance.ctxNumProp = 5;
                     fixture.detectChanges();
                     expect(fixture.debugElement.children[0].nativeElement.tabIndex).toEqual(5);

                     async.done();
                   });
             }));

      it('should consume binding to camel-cased properties',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({template: '<input [readOnly]="ctxBoolProp">'}))

                   .createAsync(MyComp)
                   .then((fixture) => {

                     fixture.detectChanges();
                     expect(fixture.debugElement.children[0].nativeElement.readOnly).toBeFalsy();

                     fixture.debugElement.componentInstance.ctxBoolProp = true;
                     fixture.detectChanges();
                     expect(fixture.debugElement.children[0].nativeElement.readOnly).toBeTruthy();

                     async.done();
                   });
             }));

      it('should consume binding to innerHtml',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({template: '<div innerHtml="{{ctxProp}}"></div>'}))

                   .createAsync(MyComp)
                   .then((fixture) => {

                     fixture.debugElement.componentInstance.ctxProp = 'Some <span>HTML</span>';
                     fixture.detectChanges();
                     expect(getDOM().getInnerHTML(fixture.debugElement.children[0].nativeElement))
                         .toEqual('Some <span>HTML</span>');

                     fixture.debugElement.componentInstance.ctxProp = 'Some other <div>HTML</div>';
                     fixture.detectChanges();
                     expect(getDOM().getInnerHTML(fixture.debugElement.children[0].nativeElement))
                         .toEqual('Some other <div>HTML</div>');

                     async.done();
                   });
             }));

      it('should consume binding to className using class alias',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp,
                      new ViewMetadata({template: '<div class="initial" [class]="ctxProp"></div>'}))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     var nativeEl = fixture.debugElement.children[0].nativeElement;
                     fixture.debugElement.componentInstance.ctxProp = 'foo bar';
                     fixture.detectChanges();

                     expect(nativeEl).toHaveCssClass('foo');
                     expect(nativeEl).toHaveCssClass('bar');
                     expect(nativeEl).not.toHaveCssClass('initial');

                     async.done();
                   });
             }));

      it('should consume directive watch expression change.',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var tpl = '<span>' +
                   '<div my-dir [elprop]="ctxProp"></div>' +
                   '<div my-dir elprop="Hi there!"></div>' +
                   '<div my-dir elprop="Hi {{\'there!\'}}"></div>' +
                   '<div my-dir elprop="One more {{ctxProp}}"></div>' +
                   '</span>';
               tcb.overrideView(MyComp, new ViewMetadata({template: tpl, directives: [MyDir]}))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.ctxProp = 'Hello World!';
                     fixture.detectChanges();

                     var containerSpan = fixture.debugElement.children[0];

                     expect(containerSpan.children[0].injector.get(MyDir).dirProp)
                         .toEqual('Hello World!');
                     expect(containerSpan.children[1].injector.get(MyDir).dirProp)
                         .toEqual('Hi there!');
                     expect(containerSpan.children[2].injector.get(MyDir).dirProp)
                         .toEqual('Hi there!');
                     expect(containerSpan.children[3].injector.get(MyDir).dirProp)
                         .toEqual('One more Hello World!');
                     async.done();
                   });
             }));

      describe('pipes', () => {
        it('should support pipes in bindings',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                 tcb.overrideView(
                        MyComp, new ViewMetadata({
                          template: '<div my-dir #dir="mydir" [elprop]="ctxProp | double"></div>',
                          directives: [MyDir],
                          pipes: [DoublePipe]
                        }))

                     .createAsync(MyComp)
                     .then((fixture) => {
                       fixture.debugElement.componentInstance.ctxProp = 'a';
                       fixture.detectChanges();

                       var dir = fixture.debugElement.children[0].references['dir'];
                       expect(dir.dirProp).toEqual('aa');
                       async.done();
                     });
               }));
      });

      it('should support nested components.',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata(
                                  {template: '<child-cmp></child-cmp>', directives: [ChildComp]}))

                   .createAsync(MyComp)
                   .then((fixture) => {

                     fixture.detectChanges();

                     expect(fixture.debugElement.nativeElement).toHaveText('hello');
                     async.done();
                   });
             }));

      // GH issue 328 - https://github.com/angular/angular/issues/328
      it('should support different directive types on a single node',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: '<child-cmp my-dir [elprop]="ctxProp"></child-cmp>',
                                  directives: [MyDir, ChildComp]
                                }))

                   .createAsync(MyComp)
                   .then((fixture) => {

                     fixture.debugElement.componentInstance.ctxProp = 'Hello World!';
                     fixture.detectChanges();

                     var tc = fixture.debugElement.children[0];

                     expect(tc.injector.get(MyDir).dirProp).toEqual('Hello World!');
                     expect(tc.injector.get(ChildComp).dirProp).toEqual(null);

                     async.done();
                   });
             }));

      it('should support directives where a binding attribute is not given',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  // No attribute "el-prop" specified.
                                  template: '<p my-dir></p>',
                                  directives: [MyDir]
                                }))

                   .createAsync(MyComp)
                   .then((fixture) => { async.done(); });
             }));

      it('should execute a given directive once, even if specified multiple times',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({
                        template: '<p no-duplicate></p>',
                        directives: [DuplicateDir, DuplicateDir, [DuplicateDir, [DuplicateDir]]]
                      }))
                   .createAsync(MyComp)
                   .then((fixture) => {
                     expect(fixture.debugElement.nativeElement).toHaveText('noduplicate');
                     async.done();
                   });
             }));

      it('should support directives where a selector matches property binding',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp,
                      new ViewMetadata({template: '<p [id]="ctxProp"></p>', directives: [IdDir]}))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     var tc = fixture.debugElement.children[0];
                     var idDir = tc.injector.get(IdDir);

                     fixture.debugElement.componentInstance.ctxProp = 'some_id';
                     fixture.detectChanges();
                     expect(idDir.id).toEqual('some_id');

                     fixture.debugElement.componentInstance.ctxProp = 'other_id';
                     fixture.detectChanges();
                     expect(idDir.id).toEqual('other_id');

                     async.done();
                   });
             }));

      it('should support directives where a selector matches event binding',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: '<p (customEvent)="doNothing()"></p>',
                                  directives: [EventDir]
                                }))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     var tc = fixture.debugElement.children[0];
                     expect(tc.injector.get(EventDir)).not.toBe(null);
                     async.done();
                   });
             }));

      it('should read directives metadata from their binding token',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: '<div public-api><div needs-public-api></div></div>',
                                  directives: [PrivateImpl, NeedsPublicApi]
                                }))

                   .createAsync(MyComp)
                   .then((fixture) => { async.done(); });
             }));

      it('should support template directives via `<template>` elements.',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({
                        template:
                            '<template some-viewport let-greeting="someTmpl"><copy-me>{{greeting}}</copy-me></template>',
                        directives: [SomeViewport]
                      }))

                   .createAsync(MyComp)
                   .then((fixture) => {

                     fixture.detectChanges();

                     var childNodesOfWrapper =
                         getDOM().childNodes(fixture.debugElement.nativeElement);
                     // 1 template + 2 copies.
                     expect(childNodesOfWrapper.length).toBe(3);
                     expect(childNodesOfWrapper[1]).toHaveText('hello');
                     expect(childNodesOfWrapper[2]).toHaveText('again');
                     async.done();
                   });
             }));

      it('should not detach views in ViewContainers when the parent view is destroyed.',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({
                        template:
                            '<div *ngIf="ctxBoolProp"><template some-viewport let-greeting="someTmpl"><span>{{greeting}}</span></template></div>',
                        directives: [NgIf, SomeViewport]
                      }))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.ctxBoolProp = true;
                     fixture.detectChanges();

                     var ngIfEl = fixture.debugElement.children[0];
                     var someViewport: SomeViewport =
                         ngIfEl.childNodes[0].injector.get(SomeViewport);
                     expect(someViewport.container.length).toBe(2);
                     expect(ngIfEl.children.length).toBe(2);

                     fixture.debugElement.componentInstance.ctxBoolProp = false;
                     fixture.detectChanges();

                     expect(someViewport.container.length).toBe(2);
                     expect(fixture.debugElement.children.length).toBe(0);

                     async.done();
                   });
             }));

      it('should use a comment while stamping out `<template>` elements.',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({template: '<template></template>'}))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     var childNodesOfWrapper =
                         getDOM().childNodes(fixture.debugElement.nativeElement);
                     expect(childNodesOfWrapper.length).toBe(1);
                     expect(getDOM().isCommentNode(childNodesOfWrapper[0])).toBe(true);
                     async.done();
                   });
             }));

      it('should support template directives via `template` attribute.',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({
                        template:
                            '<copy-me template="some-viewport: let greeting=someTmpl">{{greeting}}</copy-me>',
                        directives: [SomeViewport]
                      }))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.detectChanges();

                     var childNodesOfWrapper =
                         getDOM().childNodes(fixture.debugElement.nativeElement);
                     // 1 template + 2 copies.
                     expect(childNodesOfWrapper.length).toBe(3);
                     expect(childNodesOfWrapper[1]).toHaveText('hello');
                     expect(childNodesOfWrapper[2]).toHaveText('again');
                     async.done();
                   });
             }));

      it('should allow to transplant TemplateRefs into other ViewContainers',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({
                        template:
                            '<some-directive><toolbar><template toolbarpart let-toolbarProp="toolbarProp">{{ctxProp}},{{toolbarProp}},<cmp-with-host></cmp-with-host></template></toolbar></some-directive>',
                        directives: [SomeDirective, CompWithHost, ToolbarComponent, ToolbarPart]
                      }))
                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.ctxProp = 'From myComp';
                     fixture.detectChanges();

                     expect(fixture.debugElement.nativeElement)
                         .toHaveText(
                             'TOOLBAR(From myComp,From toolbar,Component with an injected host)');

                     async.done();
                   });
             }));

      describe('reference bindings', () => {
        it('should assign a component to a ref-',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                   tcb.overrideView(MyComp, new ViewMetadata({
                                      template: '<p><child-cmp ref-alice></child-cmp></p>',
                                      directives: [ChildComp]
                                    }))

                       .createAsync(MyComp)
                       .then((fixture) => {
                         expect(fixture.debugElement.children[0].children[0].references['alice'])
                             .toBeAnInstanceOf(ChildComp);

                         async.done();
                       })}));

        it('should assign a directive to a ref-',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                 tcb.overrideView(MyComp, new ViewMetadata({
                                    template: '<div><div export-dir #localdir="dir"></div></div>',
                                    directives: [ExportDir]
                                  }))

                     .createAsync(MyComp)
                     .then((fixture) => {
                       expect(fixture.debugElement.children[0].children[0].references['localdir'])
                           .toBeAnInstanceOf(ExportDir);

                       async.done();
                     });
               }));

        it('should make the assigned component accessible in property bindings, even if they were declared before the component',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                   tcb.overrideView(
                          MyComp, new ViewMetadata({
                            template:
                                '<template [ngIf]="true">{{alice.ctxProp}}</template>|{{alice.ctxProp}}|<child-cmp ref-alice></child-cmp>',
                            directives: [ChildComp, NgIf]
                          }))

                       .createAsync(MyComp)
                       .then((fixture) => {
                         fixture.detectChanges();

                         expect(fixture.debugElement.nativeElement).toHaveText('hello|hello|hello');
                         async.done();
                       })}));

        it('should assign two component instances each with a ref-',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                   tcb.overrideView(
                          MyComp, new ViewMetadata({
                            template:
                                '<p><child-cmp ref-alice></child-cmp><child-cmp ref-bob></child-cmp></p>',
                            directives: [ChildComp]
                          }))

                       .createAsync(MyComp)
                       .then((fixture) => {
                         var pEl = fixture.debugElement.children[0];

                         var alice = pEl.children[0].references['alice'];
                         var bob = pEl.children[1].references['bob'];
                         expect(alice).toBeAnInstanceOf(ChildComp);
                         expect(bob).toBeAnInstanceOf(ChildComp);
                         expect(alice).not.toBe(bob);

                         async.done();
                       })}));

        it('should assign the component instance to a ref- with shorthand syntax',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                   tcb.overrideView(MyComp, new ViewMetadata({
                                      template: '<child-cmp #alice></child-cmp>',
                                      directives: [ChildComp]
                                    }))

                       .createAsync(MyComp)
                       .then((fixture) => {

                         expect(fixture.debugElement.children[0].references['alice'])
                             .toBeAnInstanceOf(ChildComp);

                         async.done();
                       })}));

        it('should assign the element instance to a user-defined variable',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                   tcb.overrideView(
                          MyComp, new ViewMetadata(
                                      {template: '<div><div ref-alice><i>Hello</i></div></div>'}))

                       .createAsync(MyComp)
                       .then((fixture) => {

                         var value =
                             fixture.debugElement.children[0].children[0].references['alice'];
                         expect(value).not.toBe(null);
                         expect(value.tagName.toLowerCase()).toEqual('div');

                         async.done();
                       })}));

        it('should assign the TemplateRef to a user-defined variable',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                   tcb.overrideView(
                          MyComp, new ViewMetadata({template: '<template ref-alice></template>'}))

                       .createAsync(MyComp)
                       .then((fixture) => {

                         var value = fixture.debugElement.childNodes[0].references['alice'];
                         expect(value).toBeAnInstanceOf(TemplateRef_);

                         async.done();
                       })}));

        it('should preserve case',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                 tcb.overrideView(MyComp, new ViewMetadata({
                                    template: '<p><child-cmp ref-superAlice></child-cmp></p>',
                                    directives: [ChildComp]
                                  }))

                     .createAsync(MyComp)
                     .then((fixture) => {
                       expect(fixture.debugElement.children[0].children[0].references['superAlice'])
                           .toBeAnInstanceOf(ChildComp);

                       async.done();
                     });
               }));
      });

      describe('variables', () => {
        it('should allow to use variables in a for loop',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                 tcb.overrideView(
                        MyComp, new ViewMetadata({
                          template:
                              '<template ngFor [ngForOf]="[1]" let-i><child-cmp-no-template #cmp></child-cmp-no-template>{{i}}-{{cmp.ctxProp}}</template>',
                          directives: [ChildCompNoTemplate, NgFor]
                        }))

                     .createAsync(MyComp)
                     .then((fixture) => {
                       fixture.detectChanges();
                       // Get the element at index 2, since index 0 is the <template>.
                       expect(getDOM().childNodes(fixture.debugElement.nativeElement)[2])
                           .toHaveText('1-hello');

                       async.done();
                     });
               }));
      });

      describe('OnPush components', () => {

        it('should use ChangeDetectorRef to manually request a check',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {

                   tcb.overrideView(MyComp, new ViewMetadata({
                                      template: '<push-cmp-with-ref #cmp></push-cmp-with-ref>',
                                      directives: [[[PushCmpWithRef]]]
                                    }))

                       .createAsync(MyComp)
                       .then((fixture) => {

                         var cmp = fixture.debugElement.children[0].references['cmp'];

                         fixture.detectChanges();
                         expect(cmp.numberOfChecks).toEqual(1);

                         fixture.detectChanges();
                         expect(cmp.numberOfChecks).toEqual(1);

                         cmp.propagate();

                         fixture.detectChanges();
                         expect(cmp.numberOfChecks).toEqual(2);
                         async.done();
                       })}));

        it('should be checked when its bindings got updated',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {

                   tcb.overrideView(MyComp, new ViewMetadata({
                                      template: '<push-cmp [prop]="ctxProp" #cmp></push-cmp>',
                                      directives: [[[PushCmp]]]
                                    }))

                       .createAsync(MyComp)
                       .then((fixture) => {
                         var cmp = fixture.debugElement.children[0].references['cmp'];

                         fixture.debugElement.componentInstance.ctxProp = 'one';
                         fixture.detectChanges();
                         expect(cmp.numberOfChecks).toEqual(1);

                         fixture.debugElement.componentInstance.ctxProp = 'two';
                         fixture.detectChanges();
                         expect(cmp.numberOfChecks).toEqual(2);

                         async.done();
                       })}));

        if (getDOM().supportsDOMEvents()) {
          it('should allow to destroy a component from within a host event handler',
             fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {

               let fixture =
                   tcb.overrideView(
                          MyComp, new ViewMetadata({
                            template: '<push-cmp-with-host-event></push-cmp-with-host-event>',
                            directives: [[[PushCmpWithHostEvent]]]
                          }))
                       .createFakeAsync(MyComp);
               tick();
               fixture.detectChanges();

               var cmpEl = fixture.debugElement.children[0];
               var cmp: PushCmpWithHostEvent = cmpEl.injector.get(PushCmpWithHostEvent);
               cmp.ctxCallback = (_: any) => fixture.destroy();

               expect(() => cmpEl.triggerEventHandler('click', <Event>{})).not.toThrow();
             })));
        }

        it('should be checked when an event is fired',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {

                   tcb.overrideView(MyComp, new ViewMetadata({
                                      template: '<push-cmp [prop]="ctxProp" #cmp></push-cmp>',
                                      directives: [[[PushCmp]]]
                                    }))

                       .createAsync(MyComp)
                       .then((fixture) => {
                         var cmpEl = fixture.debugElement.children[0];
                         var cmp = cmpEl.componentInstance;
                         fixture.detectChanges();
                         fixture.detectChanges();
                         expect(cmp.numberOfChecks).toEqual(1);

                         cmpEl.children[0].triggerEventHandler('click', <Event>{});

                         // regular element
                         fixture.detectChanges();
                         fixture.detectChanges();
                         expect(cmp.numberOfChecks).toEqual(2);

                         // element inside of an *ngIf
                         cmpEl.children[1].triggerEventHandler('click', <Event>{});

                         fixture.detectChanges();
                         fixture.detectChanges();
                         expect(cmp.numberOfChecks).toEqual(3);

                         // element inside a nested component
                         cmpEl.children[2].children[0].triggerEventHandler('click', <Event>{});

                         fixture.detectChanges();
                         fixture.detectChanges();
                         expect(cmp.numberOfChecks).toEqual(4);

                         async.done();
                       })}));

        it('should not affect updating properties on the component',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                   tcb.overrideView(
                          MyComp, new ViewMetadata({
                            template:
                                '<push-cmp-with-ref [prop]="ctxProp" #cmp></push-cmp-with-ref>',
                            directives: [[[PushCmpWithRef]]]
                          }))

                       .createAsync(MyComp)
                       .then((fixture) => {

                         var cmp = fixture.debugElement.children[0].references['cmp'];

                         fixture.debugElement.componentInstance.ctxProp = 'one';
                         fixture.detectChanges();
                         expect(cmp.prop).toEqual('one');

                         fixture.debugElement.componentInstance.ctxProp = 'two';
                         fixture.detectChanges();
                         expect(cmp.prop).toEqual('two');

                         async.done();
                       })}));

        if (getDOM().supportsDOMEvents()) {
          it('should be checked when an async pipe requests a check',
             fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
               tcb =
                   tcb.overrideView(MyComp, new ViewMetadata({
                                      template: '<push-cmp-with-async #cmp></push-cmp-with-async>',
                                      directives: [[[PushCmpWithAsyncPipe]]]
                                    }));

               let fixture = tcb.createFakeAsync(MyComp);
               tick();

               var cmp: PushCmpWithAsyncPipe = fixture.debugElement.children[0].references['cmp'];
               fixture.detectChanges();
               expect(cmp.numberOfChecks).toEqual(1);

               fixture.detectChanges();
               fixture.detectChanges();
               expect(cmp.numberOfChecks).toEqual(1);

               cmp.resolve(2);
               tick();

               fixture.detectChanges();
               expect(cmp.numberOfChecks).toEqual(2);
             })));
        }
      });

      it('should create a component that injects an @Host',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                 tcb.overrideView(MyComp, new ViewMetadata({
                                    template: `
            <some-directive>
              <p>
                <cmp-with-host #child></cmp-with-host>
              </p>
            </some-directive>`,
                                    directives: [SomeDirective, CompWithHost]
                                  }))

                     .createAsync(MyComp)
                     .then((fixture) => {

                       var childComponent = fixture.debugElement.children[0]
                                                .children[0]
                                                .children[0]
                                                .references['child'];
                       expect(childComponent.myHost).toBeAnInstanceOf(SomeDirective);

                       async.done();
                     })}));

      it('should create a component that injects an @Host through viewcontainer directive',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: `
            <some-directive>
              <p *ngIf="true">
                <cmp-with-host #child></cmp-with-host>
              </p>
            </some-directive>`,
                                  directives: [SomeDirective, CompWithHost, NgIf]
                                }))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.detectChanges();

                     var tc = fixture.debugElement.children[0].children[0].children[0];

                     var childComponent = tc.references['child'];
                     expect(childComponent.myHost).toBeAnInstanceOf(SomeDirective);

                     async.done();
                   });
             }));

      it('should support events via EventEmitter on regular elements',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: '<div emitter listener></div>',
                                  directives: [DirectiveEmittingEvent, DirectiveListeningEvent]
                                }))

                   .createAsync(MyComp)
                   .then((fixture) => {

                     var tc = fixture.debugElement.children[0];
                     var emitter = tc.injector.get(DirectiveEmittingEvent);
                     var listener = tc.injector.get(DirectiveListeningEvent);

                     expect(listener.msg).toEqual('');
                     var eventCount = 0;

                     ObservableWrapper.subscribe(emitter.event, (_) => {
                       eventCount++;
                       if (eventCount === 1) {
                         expect(listener.msg).toEqual('fired !');
                         fixture.destroy();
                         emitter.fireEvent('fired again !');
                       } else {
                         expect(listener.msg).toEqual('fired !');
                         async.done();
                       }
                     });

                     emitter.fireEvent('fired !');

                   });
             }));

      it('should support events via EventEmitter on template elements',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({
                        template: '<template emitter listener (event)="ctxProp=$event"></template>',
                        directives: [DirectiveEmittingEvent, DirectiveListeningEvent]
                      }))

                   .createAsync(MyComp)
                   .then((fixture) => {

                     var tc = fixture.debugElement.childNodes[0];

                     var emitter = tc.injector.get(DirectiveEmittingEvent);
                     var myComp = fixture.debugElement.injector.get(MyComp);
                     var listener = tc.injector.get(DirectiveListeningEvent);

                     myComp.ctxProp = '';
                     expect(listener.msg).toEqual('');

                     ObservableWrapper.subscribe(emitter.event, (_) => {
                       expect(listener.msg).toEqual('fired !');
                       expect(myComp.ctxProp).toEqual('fired !');
                       async.done();
                     });

                     emitter.fireEvent('fired !');
                   });
             }));

      it('should support [()] syntax',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: '<div [(control)]="ctxProp" two-way></div>',
                                  directives: [DirectiveWithTwoWayBinding]
                                }))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     var tc = fixture.debugElement.children[0];
                     var dir = tc.injector.get(DirectiveWithTwoWayBinding);

                     fixture.debugElement.componentInstance.ctxProp = 'one';
                     fixture.detectChanges();

                     expect(dir.control).toEqual('one');

                     ObservableWrapper.subscribe(dir.controlChange, (_) => {
                       expect(fixture.debugElement.componentInstance.ctxProp).toEqual('two');
                       async.done();
                     });

                     dir.triggerChange('two');
                   });
             }));

      it('should support render events',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: '<div listener></div>',
                                  directives: [DirectiveListeningDomEvent]
                                }))

                   .createAsync(MyComp)
                   .then((fixture) => {

                     var tc = fixture.debugElement.children[0];
                     var listener = tc.injector.get(DirectiveListeningDomEvent);

                     dispatchEvent(tc.nativeElement, 'domEvent');

                     expect(listener.eventTypes).toEqual([
                       'domEvent', 'body_domEvent', 'document_domEvent', 'window_domEvent'
                     ]);

                     fixture.destroy();
                     listener.eventTypes = [];
                     dispatchEvent(tc.nativeElement, 'domEvent');
                     expect(listener.eventTypes).toEqual([]);

                     async.done();
                   });
             }));

      it('should support render global events',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: '<div listener></div>',
                                  directives: [DirectiveListeningDomEvent]
                                }))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     var tc = fixture.debugElement.children[0];
                     var listener = tc.injector.get(DirectiveListeningDomEvent);
                     dispatchEvent(getDOM().getGlobalEventTarget('window'), 'domEvent');
                     expect(listener.eventTypes).toEqual(['window_domEvent']);

                     listener.eventTypes = [];
                     dispatchEvent(getDOM().getGlobalEventTarget('document'), 'domEvent');
                     expect(listener.eventTypes).toEqual(['document_domEvent', 'window_domEvent']);

                     fixture.destroy();
                     listener.eventTypes = [];
                     dispatchEvent(getDOM().getGlobalEventTarget('body'), 'domEvent');
                     expect(listener.eventTypes).toEqual([]);

                     async.done();
                   });
             }));

      it('should support updating host element via hostAttributes',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: '<div update-host-attributes></div>',
                                  directives: [DirectiveUpdatingHostAttributes]
                                }))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.detectChanges();

                     expect(getDOM().getAttribute(
                                fixture.debugElement.children[0].nativeElement, 'role'))
                         .toEqual('button');

                     async.done();
                   });
             }));

      it('should support updating host element via hostProperties',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: '<div update-host-properties></div>',
                                  directives: [DirectiveUpdatingHostProperties]
                                }))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     var tc = fixture.debugElement.children[0];
                     var updateHost = tc.injector.get(DirectiveUpdatingHostProperties);

                     updateHost.id = 'newId';

                     fixture.detectChanges();

                     expect(tc.nativeElement.id).toEqual('newId');

                     async.done();
                   });
             }));


      if (getDOM().supportsDOMEvents()) {
        it('should support preventing default on render events',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                 tcb.overrideView(
                        MyComp, new ViewMetadata({
                          template:
                              '<input type="checkbox" listenerprevent><input type="checkbox" listenernoprevent>',
                          directives: [
                            DirectiveListeningDomEventPrevent, DirectiveListeningDomEventNoPrevent
                          ]
                        }))

                     .createAsync(MyComp)
                     .then((fixture) => {
                       var dispatchedEvent = getDOM().createMouseEvent('click');
                       var dispatchedEvent2 = getDOM().createMouseEvent('click');
                       getDOM().dispatchEvent(
                           fixture.debugElement.children[0].nativeElement, dispatchedEvent);
                       getDOM().dispatchEvent(
                           fixture.debugElement.children[1].nativeElement, dispatchedEvent2);
                       expect(getDOM().isPrevented(dispatchedEvent)).toBe(true);
                       expect(getDOM().isPrevented(dispatchedEvent2)).toBe(false);
                       expect(getDOM().getChecked(fixture.debugElement.children[0].nativeElement))
                           .toBeFalsy();
                       expect(getDOM().getChecked(fixture.debugElement.children[1].nativeElement))
                           .toBeTruthy();
                       async.done();
                     });
               }));
      }

      it('should support render global events from multiple directives',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({
                        template: '<div *ngIf="ctxBoolProp" listener listenerother></div>',
                        directives:
                            [NgIf, DirectiveListeningDomEvent, DirectiveListeningDomEventOther]
                      }))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     globalCounter = 0;
                     fixture.debugElement.componentInstance.ctxBoolProp = true;
                     fixture.detectChanges();

                     var tc = fixture.debugElement.children[0];

                     var listener = tc.injector.get(DirectiveListeningDomEvent);
                     var listenerother = tc.injector.get(DirectiveListeningDomEventOther);
                     dispatchEvent(getDOM().getGlobalEventTarget('window'), 'domEvent');
                     expect(listener.eventTypes).toEqual(['window_domEvent']);
                     expect(listenerother.eventType).toEqual('other_domEvent');
                     expect(globalCounter).toEqual(1);


                     fixture.debugElement.componentInstance.ctxBoolProp = false;
                     fixture.detectChanges();
                     dispatchEvent(getDOM().getGlobalEventTarget('window'), 'domEvent');
                     expect(globalCounter).toEqual(1);

                     fixture.debugElement.componentInstance.ctxBoolProp = true;
                     fixture.detectChanges();
                     dispatchEvent(getDOM().getGlobalEventTarget('window'), 'domEvent');
                     expect(globalCounter).toEqual(2);

                     // need to destroy to release all remaining global event listeners
                     fixture.destroy();

                     async.done();
                   });
             }));

      describe('dynamic ViewContainers', () => {
        it('should allow to create a ViewContainerRef at any bound location',
           inject(
               [TestComponentBuilder, AsyncTestCompleter, ComponentResolver],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter,
                compiler: ComponentResolver) => {
                 tcb.overrideView(MyComp, new ViewMetadata({
                                    template: '<div><dynamic-vp #dynamic></dynamic-vp></div>',
                                    directives: [DynamicViewport]
                                  }))

                     .createAsync(MyComp)
                     .then((fixture) => {
                       var tc = fixture.debugElement.children[0].children[0];
                       var dynamicVp: DynamicViewport = tc.injector.get(DynamicViewport);
                       dynamicVp.done.then((_) => {
                         fixture.detectChanges();
                         expect(fixture.debugElement.children[0].children[1].nativeElement)
                             .toHaveText('dynamic greet');
                         async.done();
                       });
                     });
               }));

      });

      it('should support static attributes',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: '<input static type="text" title>',
                                  directives: [NeedsAttribute]
                                }))
                   .createAsync(MyComp)
                   .then((fixture) => {
                     var tc = fixture.debugElement.children[0];
                     var needsAttribute = tc.injector.get(NeedsAttribute);
                     expect(needsAttribute.typeAttribute).toEqual('text');
                     expect(needsAttribute.staticAttribute).toEqual('');
                     expect(needsAttribute.fooAttribute).toEqual(null);

                     async.done();
                   });
             }));
    });

    describe('dependency injection', () => {
      it('should support bindings',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({
                        template: `
            <directive-providing-injectable >
              <directive-consuming-injectable #consuming>
              </directive-consuming-injectable>
            </directive-providing-injectable>
          `,
                        directives: [DirectiveProvidingInjectable, DirectiveConsumingInjectable]
                      }))
                   .createAsync(MyComp)
                   .then((fixture) => {
                     var comp =
                         fixture.debugElement.children[0].children[0].references['consuming'];
                     expect(comp.injectable).toBeAnInstanceOf(InjectableService);

                     async.done();
                   });
             }));

      it('should support viewProviders',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(DirectiveProvidingInjectableInView, new ViewMetadata({
                                  template: `
              <directive-consuming-injectable #consuming>
              </directive-consuming-injectable>
          `,
                                  directives: [DirectiveConsumingInjectable]
                                }))
                   .createAsync(DirectiveProvidingInjectableInView)
                   .then((fixture) => {
                     var comp = fixture.debugElement.children[0].references['consuming'];
                     expect(comp.injectable).toBeAnInstanceOf(InjectableService);

                     async.done();
                   });
             }));

      it('should support unbounded lookup',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: `
            <directive-providing-injectable>
              <directive-containing-directive-consuming-an-injectable #dir>
              </directive-containing-directive-consuming-an-injectable>
            </directive-providing-injectable>
          `,
                                  directives: [
                                    DirectiveProvidingInjectable,
                                    DirectiveContainingDirectiveConsumingAnInjectable
                                  ]
                                }))
                   .overrideView(
                       DirectiveContainingDirectiveConsumingAnInjectable, new ViewMetadata({
                         template: `
            <directive-consuming-injectable-unbounded></directive-consuming-injectable-unbounded>
          `,
                         directives: [DirectiveConsumingInjectableUnbounded]
                       }))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     var comp = fixture.debugElement.children[0].children[0].references['dir'];
                     expect(comp.directive.injectable).toBeAnInstanceOf(InjectableService);

                     async.done();
                   });
             }));

      it('should support the event-bus scenario',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: `
            <grand-parent-providing-event-bus>
              <parent-providing-event-bus>
                <child-consuming-event-bus>
                </child-consuming-event-bus>
              </parent-providing-event-bus>
            </grand-parent-providing-event-bus>
          `,
                                  directives: [
                                    GrandParentProvidingEventBus, ParentProvidingEventBus,
                                    ChildConsumingEventBus
                                  ]
                                }))
                   .createAsync(MyComp)
                   .then((fixture) => {
                     var gpComp = fixture.debugElement.children[0];
                     var parentComp = gpComp.children[0];
                     var childComp = parentComp.children[0];

                     var grandParent = gpComp.injector.get(GrandParentProvidingEventBus);
                     var parent = parentComp.injector.get(ParentProvidingEventBus);
                     var child = childComp.injector.get(ChildConsumingEventBus);

                     expect(grandParent.bus.name).toEqual('grandparent');
                     expect(parent.bus.name).toEqual('parent');
                     expect(parent.grandParentBus).toBe(grandParent.bus);
                     expect(child.bus).toBe(parent.bus);

                     async.done();
                   });
             }));

      it('should instantiate bindings lazily',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({
                        template: `
              <component-providing-logging-injectable #providing>
                <directive-consuming-injectable *ngIf="ctxBoolProp">
                </directive-consuming-injectable>
              </component-providing-logging-injectable>
          `,
                        directives: [
                          DirectiveConsumingInjectable, ComponentProvidingLoggingInjectable, NgIf
                        ]
                      }))
                   .createAsync(MyComp)
                   .then((fixture) => {
                     var providing = fixture.debugElement.children[0].references['providing'];
                     expect(providing.created).toBe(false);

                     fixture.debugElement.componentInstance.ctxBoolProp = true;
                     fixture.detectChanges();

                     expect(providing.created).toBe(true);

                     async.done();
                   });
             }));
    });

    describe('corner cases', () => {
      it('should remove script tags from templates',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: `
            <script>alert("Ooops");</script>
            <div>before<script>alert("Ooops");</script><span>inside</span>after</div>`
                                }))
                   .createAsync(MyComp)
                   .then((fixture) => {
                     expect(getDOM()
                                .querySelectorAll(fixture.debugElement.nativeElement, 'script')
                                .length)
                         .toEqual(0);
                     async.done();
                   });
             }));
    });

    describe('error handling', () => {
      it('should report a meaningful error when a directive is missing annotation',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb = tcb.overrideView(
                   MyComp,
                   new ViewMetadata({template: '', directives: [SomeDirectiveMissingAnnotation]}));

               PromiseWrapper.catchError(tcb.createAsync(MyComp), (e) => {
                 expect(e.message).toEqual(
                     `No Directive annotation found on ${stringify(SomeDirectiveMissingAnnotation)}`);
                 async.done();
                 return null;
               });
             }));

      it('should report a meaningful error when a component is missing view annotation',
         inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
           try {
             tcb.createAsync(ComponentWithoutView);
             expect(true).toBe(false);
           } catch (e) {
             expect(e.message).toContain(`must have either 'template' or 'templateUrl' set.`);
           }
         }));

      it('should report a meaningful error when a directive is null',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb =
                   tcb.overrideView(MyComp, new ViewMetadata({directives: [[null]], template: ''}));

               PromiseWrapper.catchError(tcb.createAsync(MyComp), (e) => {
                 expect(e.message).toEqual(
                     `Unexpected directive value 'null' on the View of component '${stringify(MyComp)}'`);
                 async.done();
                 return null;
               });
             }));

      it('should provide an error context when an error happens in DI',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {

               tcb = tcb.overrideView(
                   MyComp, new ViewMetadata({
                     directives: [DirectiveThrowingAnError],
                     template: `<directive-throwing-error></directive-throwing-error>`
                   }));

               PromiseWrapper.catchError(tcb.createAsync(MyComp), (e) => {
                 var c = e.context;
                 expect(getDOM().nodeName(c.componentRenderElement).toUpperCase()).toEqual('DIV');
                 expect((<Injector>c.injector).get).toBeTruthy();
                 async.done();
                 return null;
               });
             }));

      it('should provide an error context when an error happens in change detection',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {

               tcb = tcb.overrideView(
                   MyComp, new ViewMetadata({template: `<input [value]="one.two.three" #local>`}));

               tcb.createAsync(MyComp).then(fixture => {
                 try {
                   fixture.detectChanges();
                   throw 'Should throw';
                 } catch (e) {
                   var c = e.context;
                   expect(getDOM().nodeName(c.renderNode).toUpperCase()).toEqual('INPUT');
                   expect(getDOM().nodeName(c.componentRenderElement).toUpperCase()).toEqual('DIV');
                   expect((<Injector>c.injector).get).toBeTruthy();
                   expect(c.source).toContain(':0:7');
                   expect(c.context).toBe(fixture.debugElement.componentInstance);
                   expect(c.references['local']).toBeDefined();
                 }

                 async.done();
               });
             }));

      it('should provide an error context when an error happens in change detection (text node)',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {

               tcb = tcb.overrideView(
                   MyComp, new ViewMetadata({template: `<div>{{one.two.three}}</div>`}));

               tcb.createAsync(MyComp).then(fixture => {
                 try {
                   fixture.detectChanges();
                   throw 'Should throw';
                 } catch (e) {
                   var c = e.context;
                   expect(c.renderNode).toBeTruthy();
                   expect(c.source).toContain(':0:5');
                 }

                 async.done();
               });
             }));

      if (getDOM().supportsDOMEvents()) {  // this is required to use fakeAsync
        it('should provide an error context when an error happens in an event handler',
           fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
             tcb = tcb.overrideView(
                 MyComp, new ViewMetadata({
                   template: `<span emitter listener (event)="throwError()" #local></span>`,
                   directives: [DirectiveEmittingEvent, DirectiveListeningEvent]
                 }));

             let fixture = tcb.createFakeAsync(MyComp);
             tick();

             var tc = fixture.debugElement.children[0];


             try {
               tc.injector.get(DirectiveEmittingEvent).fireEvent('boom');
             } catch (e) {
               clearPendingTimers();

               var c = e.context;
               expect(getDOM().nodeName(c.renderNode).toUpperCase()).toEqual('SPAN');
               expect(getDOM().nodeName(c.componentRenderElement).toUpperCase()).toEqual('DIV');
               expect((<Injector>c.injector).get).toBeTruthy();
               expect(c.context).toBe(fixture.debugElement.componentInstance);
               expect(c.references['local']).toBeDefined();
             }
           })));
      }

      if (!IS_DART) {
        it('should report a meaningful error when a directive is undefined',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {

                 var undefinedValue: any = void(0);

                 tcb = tcb.overrideView(
                     MyComp, new ViewMetadata({directives: [undefinedValue], template: ''}));

                 PromiseWrapper.catchError(tcb.createAsync(MyComp), (e) => {
                   expect(e.message).toEqual(
                       `Unexpected directive value 'undefined' on the View of component '${stringify(MyComp)}'`);
                   async.done();
                   return null;
                 });
               }));
      }

      it('should specify a location of an error that happened during change detection (text)',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {

                 tcb.overrideView(MyComp, new ViewMetadata({template: '<div>{{a.b}}</div>'}))

                     .createAsync(MyComp)
                     .then((fixture) => {
                       expect(() => fixture.detectChanges()).toThrowError(containsRegexp(`:0:5`));
                       async.done();
                     })}));

      it('should specify a location of an error that happened during change detection (element property)',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {

                 tcb.overrideView(MyComp, new ViewMetadata({template: '<div [title]="a.b"></div>'}))

                     .createAsync(MyComp)
                     .then((fixture) => {
                       expect(() => fixture.detectChanges()).toThrowError(containsRegexp(`:0:5`));
                       async.done();
                     })}));

      it('should specify a location of an error that happened during change detection (directive property)',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {

                 tcb.overrideView(MyComp, new ViewMetadata({
                                    template: '<child-cmp [title]="a.b"></child-cmp>',
                                    directives: [ChildComp]
                                  }))

                     .createAsync(MyComp)
                     .then((fixture) => {
                       expect(() => fixture.detectChanges()).toThrowError(containsRegexp(`:0:11`));
                       async.done();
                     })}));
    });

    it('should support imperative views',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(MyComp, new ViewMetadata({
                                template: '<simple-imp-cmp></simple-imp-cmp>',
                                directives: [SimpleImperativeViewComponent]
                              }))
                 .createAsync(MyComp)
                 .then((fixture) => {
                   expect(fixture.debugElement.nativeElement).toHaveText('hello imp view');
                   async.done();
                 });
           }));

    it('should support moving embedded views around',
       inject(
           [TestComponentBuilder, AsyncTestCompleter, ANCHOR_ELEMENT],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter, anchorElement: any) => {
             tcb.overrideView(MyComp, new ViewMetadata({
                                template: '<div><div *someImpvp="ctxBoolProp">hello</div></div>',
                                directives: [SomeImperativeViewport]
                              }))
                 .createAsync(MyComp)
                 .then((fixture: ComponentFixture<any>) => {
                   fixture.detectChanges();
                   expect(anchorElement).toHaveText('');

                   fixture.debugElement.componentInstance.ctxBoolProp = true;
                   fixture.detectChanges();

                   expect(anchorElement).toHaveText('hello');

                   fixture.debugElement.componentInstance.ctxBoolProp = false;
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('');

                   async.done();
                 });
           }));

    describe('Property bindings', () => {
      if (!IS_DART) {
        it('should throw on bindings to unknown properties',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                 tcb = tcb.overrideView(
                     MyComp, new ViewMetadata({template: '<div unknown="{{ctxProp}}"></div>'}))

                 PromiseWrapper.catchError(tcb.createAsync(MyComp), (e) => {
                   expect(e.message).toEqual(
                       `Template parse errors:\nCan't bind to 'unknown' since it isn't a known native property ("<div [ERROR ->]unknown="{{ctxProp}}"></div>"): MyComp@0:5`);
                   async.done();
                   return null;
                 });
               }));

        it('should not throw for property binding to a non-existing property when there is a matching directive property',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                 tcb.overrideView(MyComp, new ViewMetadata({
                                    template: '<div my-dir [elprop]="ctxProp"></div>',
                                    directives: [MyDir]
                                  }))
                     .createAsync(MyComp)
                     .then((val) => { async.done(); });
               }));
      }

      it('should not be created when there is a directive with the same property',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: '<span [title]="ctxProp"></span>',
                                  directives: [DirectiveWithTitle]
                                }))
                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.ctxProp = 'TITLE';
                     fixture.detectChanges();

                     var el = getDOM().querySelector(fixture.debugElement.nativeElement, 'span');
                     expect(isBlank(el.title) || el.title == '').toBeTruthy();

                     async.done();

                   });
             }));

      it('should work when a directive uses hostProperty to update the DOM element',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: '<span [title]="ctxProp"></span>',
                                  directives: [DirectiveWithTitleAndHostProperty]
                                }))
                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.ctxProp = 'TITLE';
                     fixture.detectChanges();

                     var el = getDOM().querySelector(fixture.debugElement.nativeElement, 'span');
                     expect(el.title).toEqual('TITLE');

                     async.done();

                   });
             }));
    });

    describe('logging property updates', () => {
      beforeEachProviders(() => [{
                            provide: CompilerConfig,
                            useValue: new CompilerConfig({genDebugInfo: true, useJit: useJit})
                          }]);

      it('should reflect property values as attributes',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var tpl = '<div>' +
                   '<div my-dir [elprop]="ctxProp"></div>' +
                   '</div>';
               tcb.overrideView(MyComp, new ViewMetadata({template: tpl, directives: [MyDir]}))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.ctxProp = 'hello';
                     fixture.detectChanges();

                     expect(getDOM().getInnerHTML(fixture.debugElement.nativeElement))
                         .toContain('ng-reflect-dir-prop="hello"');
                     async.done();
                   });
             }));

      it('should reflect property values on template comments',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               var tpl = '<template [ngIf]="ctxBoolProp"></template>';
               tcb.overrideView(MyComp, new ViewMetadata({template: tpl, directives: [NgIf]}))

                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.debugElement.componentInstance.ctxBoolProp = true;
                     fixture.detectChanges();

                     expect(getDOM().getInnerHTML(fixture.debugElement.nativeElement))
                         .toContain('"ng\-reflect\-ng\-if"\: "true"');
                     async.done();
                   });
             }));
    });

    describe('property decorators', () => {
      it('should support property decorators',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp, new ViewMetadata({
                        template: '<with-prop-decorators elProp="aaa"></with-prop-decorators>',
                        directives: [DirectiveWithPropDecorators]
                      }))
                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.detectChanges();
                     var dir =
                         fixture.debugElement.children[0].injector.get(DirectiveWithPropDecorators);
                     expect(dir.dirProp).toEqual('aaa');
                     async.done();
                   });
             }));

      it('should support host binding decorators',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: '<with-prop-decorators></with-prop-decorators>',
                                  directives: [DirectiveWithPropDecorators]
                                }))
                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.detectChanges();
                     var dir =
                         fixture.debugElement.children[0].injector.get(DirectiveWithPropDecorators);
                     dir.myAttr = 'aaa';

                     fixture.detectChanges();
                     expect(getDOM().getOuterHTML(fixture.debugElement.children[0].nativeElement))
                         .toContain('my-attr="aaa"');
                     async.done();
                   });
             }));

      if (getDOM().supportsDOMEvents()) {
        it('should support event decorators',
           fakeAsync(inject([TestComponentBuilder], (tcb: TestComponentBuilder) => {
             tcb =
                 tcb.overrideView(MyComp, new ViewMetadata({
                                    template: `<with-prop-decorators (elEvent)="ctxProp='called'">`,
                                    directives: [DirectiveWithPropDecorators]
                                  }));

             let fixture = tcb.createFakeAsync(MyComp);
             tick();

             var emitter =
                 fixture.debugElement.children[0].injector.get(DirectiveWithPropDecorators);
             emitter.fireEvent('fired !');

             tick();

             expect(fixture.debugElement.componentInstance.ctxProp).toEqual('called');
           })));


        it('should support host listener decorators',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                 tcb.overrideView(MyComp, new ViewMetadata({
                                    template: '<with-prop-decorators></with-prop-decorators>',
                                    directives: [DirectiveWithPropDecorators]
                                  }))
                     .createAsync(MyComp)
                     .then((fixture) => {
                       fixture.detectChanges();
                       var dir = fixture.debugElement.children[0].injector.get(
                           DirectiveWithPropDecorators);
                       var native = fixture.debugElement.children[0].nativeElement;
                       getDOM().dispatchEvent(native, getDOM().createMouseEvent('click'));

                       expect(dir.target).toBe(native);
                       async.done();
                     });
               }));
      }

      it('should support defining views in the component decorator',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp, new ViewMetadata({
                                  template: '<component-with-template></component-with-template>',
                                  directives: [ComponentWithTemplate]
                                }))
                   .createAsync(MyComp)
                   .then((fixture) => {
                     fixture.detectChanges();
                     var native = fixture.debugElement.children[0].nativeElement;
                     expect(native).toHaveText('No View Decorator: 123');
                     async.done();
                   });
             }));
    });


    if (getDOM().supportsDOMEvents()) {
      describe('svg', () => {
        it('should support svg elements',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                 tcb.overrideView(
                        MyComp,
                        new ViewMetadata({template: '<svg><use xlink:href="Port" /></svg>'}))
                     .createAsync(MyComp)
                     .then((fixture) => {
                       var el = fixture.debugElement.nativeElement;
                       var svg = getDOM().childNodes(el)[0];
                       var use = getDOM().childNodes(svg)[0];
                       expect(getDOM().getProperty(<Element>svg, 'namespaceURI'))
                           .toEqual('http://www.w3.org/2000/svg');
                       expect(getDOM().getProperty(<Element>use, 'namespaceURI'))
                           .toEqual('http://www.w3.org/2000/svg');

                       if (!IS_DART) {
                         var firstAttribute = getDOM().getProperty(<Element>use, 'attributes')[0];
                         expect(firstAttribute.name).toEqual('xlink:href');
                         expect(firstAttribute.namespaceURI)
                             .toEqual('http://www.w3.org/1999/xlink');
                       } else {
                         // For Dart where '_Attr' has no instance getter 'namespaceURI'
                         expect(getDOM().getOuterHTML(<HTMLElement>use)).toContain('xmlns:xlink');
                       }

                       async.done();
                     });
               }));

      });

      describe('attributes', () => {

        it('should support attributes with namespace',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                 tcb.overrideView(
                        SomeCmp, new ViewMetadata({template: '<svg:use xlink:href="#id" />'}))
                     .createAsync(SomeCmp)
                     .then((fixture) => {
                       let useEl = getDOM().firstChild(fixture.debugElement.nativeElement);
                       expect(
                           getDOM().getAttributeNS(useEl, 'http://www.w3.org/1999/xlink', 'href'))
                           .toEqual('#id');
                       async.done();
                     });
               }));

        it('should support binding to attributes with namespace',
           inject(
               [TestComponentBuilder, AsyncTestCompleter],
               (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
                 tcb.overrideView(
                        SomeCmp,
                        new ViewMetadata({template: '<svg:use [attr.xlink:href]="value" />'}))
                     .createAsync(SomeCmp)
                     .then((fixture) => {
                       let cmp = fixture.debugElement.componentInstance;
                       let useEl = getDOM().firstChild(fixture.debugElement.nativeElement);

                       cmp.value = '#id';
                       fixture.detectChanges();

                       expect(
                           getDOM().getAttributeNS(useEl, 'http://www.w3.org/1999/xlink', 'href'))
                           .toEqual('#id');

                       cmp.value = null;
                       fixture.detectChanges();

                       expect(
                           getDOM().hasAttributeNS(useEl, 'http://www.w3.org/1999/xlink', 'href'))
                           .toEqual(false);

                       async.done();
                     });
               }));
      });
    }
  });
}

@Injectable()
class MyService {
  greeting: string;
  constructor() { this.greeting = 'hello'; }
}

@Component({selector: 'simple-imp-cmp', template: ''})
class SimpleImperativeViewComponent {
  done: any;

  constructor(self: ElementRef, renderer: Renderer) {
    var hostElement = self.nativeElement;
    getDOM().appendChild(hostElement, el('hello imp view'));
  }
}

@Directive({selector: 'dynamic-vp'})
class DynamicViewport {
  done: Promise<any>;
  constructor(vc: ViewContainerRef, compiler: ComponentResolver) {
    var myService = new MyService();
    myService.greeting = 'dynamic greet';

    var injector = ReflectiveInjector.resolveAndCreate(
        [{provide: MyService, useValue: myService}], vc.injector);
    this.done = compiler.resolveComponent(ChildCompUsingService)
                    .then((componentFactory) => vc.createComponent(componentFactory, 0, injector));
  }
}

@Directive({selector: '[my-dir]', inputs: ['dirProp: elprop'], exportAs: 'mydir'})
class MyDir {
  dirProp: string;
  constructor() { this.dirProp = ''; }
}

@Directive({selector: '[title]', inputs: ['title']})
class DirectiveWithTitle {
  title: string;
}

@Directive({selector: '[title]', inputs: ['title'], host: {'[title]': 'title'}})
class DirectiveWithTitleAndHostProperty {
  title: string;
}

@Component({selector: 'event-cmp', template: '<div (click)="noop()"></div>'})
class EventCmp {
  noop() {}
}

@Component({
  selector: 'push-cmp',
  inputs: ['prop'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template:
      '{{field}}<div (click)="noop()"></div><div *ngIf="true" (click)="noop()"></div><event-cmp></event-cmp>',
  directives: [EventCmp, NgIf]
})
class PushCmp {
  numberOfChecks: number;
  prop: any;

  constructor() { this.numberOfChecks = 0; }

  noop() {}

  get field() {
    this.numberOfChecks++;
    return 'fixed';
  }
}

@Component({
  selector: 'push-cmp-with-ref',
  inputs: ['prop'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '{{field}}'
})
class PushCmpWithRef {
  numberOfChecks: number;
  ref: ChangeDetectorRef;
  prop: any;

  constructor(ref: ChangeDetectorRef) {
    this.numberOfChecks = 0;
    this.ref = ref;
  }

  get field() {
    this.numberOfChecks++;
    return 'fixed';
  }

  propagate() { this.ref.markForCheck(); }
}

@Component({
  selector: 'push-cmp-with-host-event',
  host: {'(click)': 'ctxCallback($event)'},
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ''
})
class PushCmpWithHostEvent {
  ctxCallback: Function = (_: any) => {};
}

@Component({
  selector: 'push-cmp-with-async',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '{{field | async}}',
  pipes: [AsyncPipe]
})
class PushCmpWithAsyncPipe {
  numberOfChecks: number = 0;
  promise: Promise<any>;
  completer: PromiseCompleter<any>;

  constructor() {
    this.completer = PromiseWrapper.completer();
    this.promise = this.completer.promise;
  }

  get field() {
    this.numberOfChecks++;
    return this.promise;
  }

  resolve(value: any) { this.completer.resolve(value); }
}

@Component({selector: 'my-comp', directives: []})
class MyComp {
  ctxProp: string;
  ctxNumProp: number;
  ctxBoolProp: boolean;
  constructor() {
    this.ctxProp = 'initial value';
    this.ctxNumProp = 0;
    this.ctxBoolProp = false;
  }

  throwError() { throw 'boom'; }
}

@Component({
  selector: 'child-cmp',
  inputs: ['dirProp'],
  viewProviders: [MyService],
  directives: [MyDir],
  template: '{{ctxProp}}'
})
class ChildComp {
  ctxProp: string;
  dirProp: string;
  constructor(service: MyService) {
    this.ctxProp = service.greeting;
    this.dirProp = null;
  }
}

@Component({selector: 'child-cmp-no-template', directives: [], template: ''})
class ChildCompNoTemplate {
  ctxProp: string = 'hello';
}

@Component({selector: 'child-cmp-svc', template: '{{ctxProp}}'})
class ChildCompUsingService {
  ctxProp: string;
  constructor(service: MyService) { this.ctxProp = service.greeting; }
}

@Directive({selector: 'some-directive'})
class SomeDirective {
}

class SomeDirectiveMissingAnnotation {}

@Component({
  selector: 'cmp-with-host',
  template: '<p>Component with an injected host</p>',
  directives: [SomeDirective]
})
class CompWithHost {
  myHost: SomeDirective;
  constructor(@Host() someComp: SomeDirective) { this.myHost = someComp; }
}

@Component({selector: '[child-cmp2]', viewProviders: [MyService]})
class ChildComp2 {
  ctxProp: string;
  dirProp: string;
  constructor(service: MyService) {
    this.ctxProp = service.greeting;
    this.dirProp = null;
  }
}

class SomeViewportContext {
  constructor(public someTmpl: string) {}
}

@Directive({selector: '[some-viewport]'})
class SomeViewport {
  constructor(public container: ViewContainerRef, templateRef: TemplateRef<SomeViewportContext>) {
    container.createEmbeddedView(templateRef, new SomeViewportContext('hello'));
    container.createEmbeddedView(templateRef, new SomeViewportContext('again'));
  }
}

@Pipe({name: 'double'})
class DoublePipe implements PipeTransform, OnDestroy {
  ngOnDestroy() {}
  transform(value: any) { return `${value}${value}`; }
}

@Directive({selector: '[emitter]', outputs: ['event']})
class DirectiveEmittingEvent {
  msg: string;
  event: EventEmitter<any>;

  constructor() {
    this.msg = '';
    this.event = new EventEmitter();
  }

  fireEvent(msg: string) { ObservableWrapper.callEmit(this.event, msg); }
}

@Directive({selector: '[update-host-attributes]', host: {'role': 'button'}})
class DirectiveUpdatingHostAttributes {
}

@Directive({selector: '[update-host-properties]', host: {'[id]': 'id'}})
class DirectiveUpdatingHostProperties {
  id: string;

  constructor() { this.id = 'one'; }
}

@Directive({selector: '[listener]', host: {'(event)': 'onEvent($event)'}})
class DirectiveListeningEvent {
  msg: string;

  constructor() { this.msg = ''; }

  onEvent(msg: string) { this.msg = msg; }
}

@Directive({
  selector: '[listener]',
  host: {
    '(domEvent)': 'onEvent($event.type)',
    '(window:domEvent)': 'onWindowEvent($event.type)',
    '(document:domEvent)': 'onDocumentEvent($event.type)',
    '(body:domEvent)': 'onBodyEvent($event.type)'
  }
})
class DirectiveListeningDomEvent {
  eventTypes: string[] = [];
  onEvent(eventType: string) { this.eventTypes.push(eventType); }
  onWindowEvent(eventType: string) { this.eventTypes.push('window_' + eventType); }
  onDocumentEvent(eventType: string) { this.eventTypes.push('document_' + eventType); }
  onBodyEvent(eventType: string) { this.eventTypes.push('body_' + eventType); }
}

var globalCounter = 0;
@Directive({selector: '[listenerother]', host: {'(window:domEvent)': 'onEvent($event.type)'}})
class DirectiveListeningDomEventOther {
  eventType: string;
  constructor() { this.eventType = ''; }
  onEvent(eventType: string) {
    globalCounter++;
    this.eventType = 'other_' + eventType;
  }
}

@Directive({selector: '[listenerprevent]', host: {'(click)': 'onEvent($event)'}})
class DirectiveListeningDomEventPrevent {
  onEvent(event: any) { return false; }
}

@Directive({selector: '[listenernoprevent]', host: {'(click)': 'onEvent($event)'}})
class DirectiveListeningDomEventNoPrevent {
  onEvent(event: any) { return true; }
}

@Directive({selector: '[id]', inputs: ['id']})
class IdDir {
  id: string;
}

@Directive({selector: '[customEvent]'})
class EventDir {
  @Output() customEvent = new EventEmitter();
  doSomething() {}
}

@Directive({selector: '[static]'})
class NeedsAttribute {
  typeAttribute: string;
  staticAttribute: string;
  fooAttribute: string;
  constructor(
      @Attribute('type') typeAttribute: string, @Attribute('static') staticAttribute: string,
      @Attribute('foo') fooAttribute: string) {
    this.typeAttribute = typeAttribute;
    this.staticAttribute = staticAttribute;
    this.fooAttribute = fooAttribute;
  }
}

@Injectable()
class PublicApi {
}

@Directive({
  selector: '[public-api]',
  providers: [
    /* @ts2dart_Provider */ {provide: PublicApi, useExisting: PrivateImpl, deps: []}
  ]
})
class PrivateImpl extends PublicApi {
}

@Directive({selector: '[needs-public-api]'})
class NeedsPublicApi {
  constructor(@Host() api: PublicApi) { expect(api instanceof PrivateImpl).toBe(true); }
}

class ToolbarContext {
  constructor(public toolbarProp: string) {}
}

@Directive({selector: '[toolbarpart]'})
class ToolbarPart {
  templateRef: TemplateRef<ToolbarContext>;
  constructor(templateRef: TemplateRef<ToolbarContext>) { this.templateRef = templateRef; }
}

@Directive({selector: '[toolbarVc]', inputs: ['toolbarVc']})
class ToolbarViewContainer {
  vc: ViewContainerRef;
  constructor(vc: ViewContainerRef) { this.vc = vc; }

  set toolbarVc(part: ToolbarPart) {
    this.vc.createEmbeddedView(part.templateRef, new ToolbarContext('From toolbar'), 0);
  }
}

@Component({
  selector: 'toolbar',
  template: 'TOOLBAR(<div *ngFor="let  part of query" [toolbarVc]="part"></div>)',
  directives: [ToolbarViewContainer, NgFor]
})
class ToolbarComponent {
  query: QueryList<ToolbarPart>;
  ctxProp: string;

  constructor(@Query(ToolbarPart) query: QueryList<ToolbarPart>) {
    this.ctxProp = 'hello world';
    this.query = query;
  }
}

@Directive({selector: '[two-way]', inputs: ['control'], outputs: ['controlChange']})
class DirectiveWithTwoWayBinding {
  controlChange = new EventEmitter();
  control: any = null;

  triggerChange(value: any) { ObservableWrapper.callEmit(this.controlChange, value); }
}

@Injectable()
class InjectableService {
}

function createInjectableWithLogging(inj: Injector) {
  inj.get(ComponentProvidingLoggingInjectable).created = true;
  return new InjectableService();
}

@Component({
  selector: 'component-providing-logging-injectable',
  providers: [
    /* @ts2dart_Provider */ {
      provide: InjectableService,
      useFactory: createInjectableWithLogging,
      deps: [Injector]
    }
  ],
  template: ''
})
class ComponentProvidingLoggingInjectable {
  created: boolean = false;
}


@Directive({selector: 'directive-providing-injectable', providers: [[InjectableService]]})
class DirectiveProvidingInjectable {
}

@Component({
  selector: 'directive-providing-injectable',
  viewProviders: [[InjectableService]],
  template: ''
})
class DirectiveProvidingInjectableInView {
}

@Component({
  selector: 'directive-providing-injectable',
  providers: [/* @ts2dart_Provider */ {provide: InjectableService, useValue: 'host'}],
  viewProviders: [/* @ts2dart_Provider */ {provide: InjectableService, useValue: 'view'}],
  template: ''
})
class DirectiveProvidingInjectableInHostAndView {
}


@Component({selector: 'directive-consuming-injectable', template: ''})
class DirectiveConsumingInjectable {
  injectable: any;

  constructor(@Host() @Inject(InjectableService) injectable: any) { this.injectable = injectable; }
}



@Component({selector: 'directive-containing-directive-consuming-an-injectable'})
class DirectiveContainingDirectiveConsumingAnInjectable {
  directive: any;
}

@Component({selector: 'directive-consuming-injectable-unbounded', template: ''})
class DirectiveConsumingInjectableUnbounded {
  injectable: any;

  constructor(
      injectable: InjectableService,
      @SkipSelf() parent: DirectiveContainingDirectiveConsumingAnInjectable) {
    this.injectable = injectable;
    parent.directive = this;
  }
}


/* @ts2dart_const */
class EventBus {
  parentEventBus: EventBus;
  name: string;

  constructor(parentEventBus: EventBus, name: string) {
    this.parentEventBus = parentEventBus;
    this.name = name;
  }
}

@Directive({
  selector: 'grand-parent-providing-event-bus',
  providers: [
    /* @ts2dart_Provider */ {provide: EventBus, useValue: new EventBus(null, 'grandparent')}
  ]
})
class GrandParentProvidingEventBus {
  bus: EventBus;

  constructor(bus: EventBus) { this.bus = bus; }
}

function createParentBus(peb: EventBus) {
  return new EventBus(peb, 'parent');
}

@Component({
  selector: 'parent-providing-event-bus',
  providers: [
    {provide: EventBus, useFactory: createParentBus, deps: [[EventBus, new SkipSelfMetadata()]]}
  ],
  directives: [forwardRef(() => ChildConsumingEventBus)],
  template: `<child-consuming-event-bus></child-consuming-event-bus>`
})
class ParentProvidingEventBus {
  bus: EventBus;
  grandParentBus: EventBus;

  constructor(bus: EventBus, @SkipSelf() grandParentBus: EventBus) {
    this.bus = bus;
    this.grandParentBus = grandParentBus;
  }
}

@Directive({selector: 'child-consuming-event-bus'})
class ChildConsumingEventBus {
  bus: EventBus;

  constructor(@SkipSelf() bus: EventBus) { this.bus = bus; }
}

@Directive({selector: '[someImpvp]', inputs: ['someImpvp']})
class SomeImperativeViewport {
  view: EmbeddedViewRef<Object>;
  anchor: any;
  constructor(
      public vc: ViewContainerRef, public templateRef: TemplateRef<Object>,
      @Inject(ANCHOR_ELEMENT) anchor: any) {
    this.view = null;
    this.anchor = anchor;
  }

  set someImpvp(value: boolean) {
    if (isPresent(this.view)) {
      this.vc.clear();
      this.view = null;
    }
    if (value) {
      this.view = this.vc.createEmbeddedView(this.templateRef);
      var nodes = this.view.rootNodes;
      for (var i = 0; i < nodes.length; i++) {
        getDOM().appendChild(this.anchor, nodes[i]);
      }
    }
  }
}

@Directive({selector: '[export-dir]', exportAs: 'dir'})
class ExportDir {
}

@Component({selector: 'comp'})
class ComponentWithoutView {
}

@Directive({selector: '[no-duplicate]'})
class DuplicateDir {
  constructor(elRef: ElementRef) {
    getDOM().setText(elRef.nativeElement, getDOM().getText(elRef.nativeElement) + 'noduplicate');
  }
}

@Directive({selector: '[no-duplicate]'})
class OtherDuplicateDir {
  constructor(elRef: ElementRef) {
    getDOM().setText(
        elRef.nativeElement, getDOM().getText(elRef.nativeElement) + 'othernoduplicate');
  }
}

@Directive({selector: 'directive-throwing-error'})
class DirectiveThrowingAnError {
  constructor() { throw new BaseException('BOOM'); }
}

@Component({
  selector: 'component-with-template',
  directives: [NgFor],
  template: `No View Decorator: <div *ngFor="let item of items">{{item}}</div>`
})
class ComponentWithTemplate {
  items = [1, 2, 3];
}

@Directive({selector: 'with-prop-decorators'})
class DirectiveWithPropDecorators {
  target: any;

  @Input('elProp') dirProp: string;
  @Output('elEvent') event = new EventEmitter();

  @HostBinding('attr.my-attr') myAttr: string;
  @HostListener('click', ['$event.target'])
  onClick(target: any) { this.target = target; }

  fireEvent(msg: any) { ObservableWrapper.callEmit(this.event, msg); }
}

@Component({selector: 'some-cmp'})
class SomeCmp {
  value: any;
}
