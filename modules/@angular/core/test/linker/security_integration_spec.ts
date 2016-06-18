import {ddescribe, describe, expect, inject, beforeEachProviders, beforeEach, afterEach, it,} from '@angular/core/testing/testing_internal';
import {TestComponentBuilder} from '@angular/compiler/testing';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';
import {PromiseWrapper} from '../../src/facade/async';
import {provide, Injectable, OpaqueToken} from '@angular/core';
import {CompilerConfig} from '@angular/compiler';
import {Component, ViewMetadata} from '@angular/core/src/metadata';
import {IS_DART} from '../../src/facade/lang';
import {el} from '@angular/platform-browser/testing';

import {DomSanitizationService} from '@angular/platform-browser';

const ANCHOR_ELEMENT = /*@ts2dart_const*/ new OpaqueToken('AnchorElement');

export function main() {
  if (IS_DART) {
    declareTests({useJit: false});
  } else {
    describe('jit', () => { declareTests({useJit: true}); });

    describe('no jit', () => { declareTests({useJit: false}); });
  }
}

@Component({selector: 'my-comp', directives: []})
class SecuredComponent {
  ctxProp: string;
  constructor() { this.ctxProp = 'some value'; }
}

function itAsync(msg: string, injections: Function[], f: Function): void;
function itAsync(
    msg: string, f: (tcb: TestComponentBuilder, atc: AsyncTestCompleter) => void): void;
function itAsync(
    msg: string, f: Function[] | ((tcb: TestComponentBuilder, atc: AsyncTestCompleter) => void),
    fn?: Function): void {
  if (f instanceof Function) {
    it(msg, inject([TestComponentBuilder, AsyncTestCompleter], <Function>f));
  } else {
    let injections = f;
    it(msg, inject(injections, fn));
  }
}

function declareTests({useJit}: {useJit: boolean}) {
  describe('security integration tests', function() {

    beforeEachProviders(
        () =>
            [{
              provide: CompilerConfig,
              useValue: new CompilerConfig({genDebugInfo: true, useJit: useJit})
            },
             {provide: ANCHOR_ELEMENT, useValue: el('<div></div>')}]);

    let originalLog: (msg: any) => any;
    beforeEach(() => {
      originalLog = getDOM().log;
      getDOM().log = (msg) => { /* disable logging */ };
    });
    afterEach(() => { getDOM().log = originalLog; });


    itAsync(
        'should disallow binding on*', (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
          let tpl = `<div [attr.onclick]="ctxProp"></div>`;
          tcb = tcb.overrideView(SecuredComponent, new ViewMetadata({template: tpl}));
          PromiseWrapper.catchError(tcb.createAsync(SecuredComponent), (e) => {
            expect(e.message).toContain(
                `Template parse errors:\n` +
                `Binding to event attribute 'onclick' is disallowed ` +
                `for security reasons, please use (click)=... `);
            async.done();
            return null;
          });
        });

    describe('safe HTML values', function() {
      itAsync(
          'should not escape values marked as trusted',
          [TestComponentBuilder, AsyncTestCompleter, DomSanitizationService],
          (tcb: TestComponentBuilder, async: AsyncTestCompleter,
           sanitizer: DomSanitizationService) => {
            let tpl = `<a [href]="ctxProp">Link Title</a>`;
            tcb.overrideView(SecuredComponent, new ViewMetadata({template: tpl, directives: []}))
                .createAsync(SecuredComponent)
                .then((fixture) => {
                  let e = fixture.debugElement.children[0].nativeElement;
                  let ci = fixture.debugElement.componentInstance;
                  let trusted = sanitizer.bypassSecurityTrustUrl('javascript:alert(1)');
                  ci.ctxProp = trusted;
                  fixture.detectChanges();
                  expect(getDOM().getProperty(e, 'href')).toEqual('javascript:alert(1)');

                  async.done();
                });
          });

      itAsync(
          'should error when using the wrong trusted value',
          [TestComponentBuilder, AsyncTestCompleter, DomSanitizationService],
          (tcb: TestComponentBuilder, async: AsyncTestCompleter,
           sanitizer: DomSanitizationService) => {
            let tpl = `<a [href]="ctxProp">Link Title</a>`;
            tcb.overrideView(SecuredComponent, new ViewMetadata({template: tpl, directives: []}))
                .createAsync(SecuredComponent)
                .then((fixture) => {
                  let trusted = sanitizer.bypassSecurityTrustScript('javascript:alert(1)');
                  let ci = fixture.debugElement.componentInstance;
                  ci.ctxProp = trusted;
                  expect(() => fixture.detectChanges())
                      .toThrowErrorWith('Required a safe URL, got a Script');

                  async.done();
                });
          });

      itAsync(
          'should warn when using in string interpolation',
          [TestComponentBuilder, AsyncTestCompleter, DomSanitizationService],
          (tcb: TestComponentBuilder, async: AsyncTestCompleter,
           sanitizer: DomSanitizationService) => {
            let tpl = `<a href="/foo/{{ctxProp}}">Link Title</a>`;
            tcb.overrideView(SecuredComponent, new ViewMetadata({template: tpl, directives: []}))
                .createAsync(SecuredComponent)
                .then((fixture) => {
                  let e = fixture.debugElement.children[0].nativeElement;
                  let trusted = sanitizer.bypassSecurityTrustUrl('bar/baz');
                  let ci = fixture.debugElement.componentInstance;
                  ci.ctxProp = trusted;
                  fixture.detectChanges();
                  expect(getDOM().getProperty(e, 'href')).toMatch(/SafeValue(%20| )must(%20| )use/);

                  async.done();
                });
          });
    });

    describe('sanitizing', () => {
      itAsync(
          'should escape unsafe attributes',
          (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
            let tpl = `<a [href]="ctxProp">Link Title</a>`;
            tcb.overrideView(SecuredComponent, new ViewMetadata({template: tpl, directives: []}))
                .createAsync(SecuredComponent)
                .then((fixture) => {
                  let e = fixture.debugElement.children[0].nativeElement;
                  let ci = fixture.debugElement.componentInstance;
                  ci.ctxProp = 'hello';
                  fixture.detectChanges();
                  // In the browser, reading href returns an absolute URL. On the server side,
                  // it just echoes back the property.
                  expect(getDOM().getProperty(e, 'href')).toMatch(/.*\/?hello$/);

                  ci.ctxProp = 'javascript:alert(1)';
                  fixture.detectChanges();
                  expect(getDOM().getProperty(e, 'href')).toEqual('unsafe:javascript:alert(1)');

                  async.done();
                });
          });

      itAsync(
          'should escape unsafe style values',
          (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
            let tpl = `<div [style.background]="ctxProp">Text</div>`;
            tcb.overrideView(SecuredComponent, new ViewMetadata({template: tpl, directives: []}))
                .createAsync(SecuredComponent)
                .then((fixture) => {
                  let e = fixture.debugElement.children[0].nativeElement;
                  let ci = fixture.debugElement.componentInstance;
                  // Make sure binding harmless values works.
                  ci.ctxProp = 'red';
                  fixture.detectChanges();
                  // In some browsers, this will contain the full background specification, not just
                  // the color.
                  expect(getDOM().getStyle(e, 'background')).toMatch(/red.*/);

                  ci.ctxProp = 'url(javascript:evil())';
                  fixture.detectChanges();
                  // Updated value gets rejected, no value change.
                  expect(getDOM().getStyle(e, 'background')).not.toContain('javascript');

                  async.done();
                });
          });

      itAsync(
          'should escape unsafe HTML values',
          (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
            let tpl = `<div [innerHTML]="ctxProp">Text</div>`;
            tcb.overrideView(SecuredComponent, new ViewMetadata({template: tpl, directives: []}))
                .createAsync(SecuredComponent)
                .then((fixture) => {
                  let e = fixture.debugElement.children[0].nativeElement;
                  let ci = fixture.debugElement.componentInstance;
                  // Make sure binding harmless values works.
                  ci.ctxProp = 'some <p>text</p>';
                  fixture.detectChanges();
                  expect(getDOM().getInnerHTML(e)).toEqual('some <p>text</p>');

                  ci.ctxProp = 'ha <script>evil()</script>';
                  fixture.detectChanges();
                  expect(getDOM().getInnerHTML(e)).toEqual('ha evil()');

                  ci.ctxProp = 'also <img src="x" onerror="evil()"> evil';
                  fixture.detectChanges();
                  expect(getDOM().getInnerHTML(e)).toEqual('also <img src="x"> evil');

                  ci.ctxProp = 'also <iframe srcdoc="evil"> evil';
                  fixture.detectChanges();
                  expect(getDOM().getInnerHTML(e)).toEqual('also  evil');

                  async.done();
                });
          });
    });

  });
}