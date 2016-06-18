import {beforeEach, ddescribe, describe, expect, iit, inject, it, xit,} from '@angular/core/testing/testing_internal';
import {TestComponentBuilder, ComponentFixture} from '@angular/compiler/testing';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';
import {Component, Directive} from '@angular/core';
import {ElementRef} from '@angular/core/src/linker/element_ref';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';

export function main() {
  describe('non-bindable', () => {
    it('should not interpolate children',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template = '<div>{{text}}<span ngNonBindable>{{text}}</span></div>';
             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.detectChanges();
                   expect(fixture.debugElement.nativeElement).toHaveText('foo{{text}}');
                   async.done();
                 });
           }));

    it('should ignore directives on child nodes',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template = '<div ngNonBindable><span id=child test-dec>{{text}}</span></div>';
             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.detectChanges();

                   // We must use getDOM().querySelector instead of fixture.query here
                   // since the elements inside are not compiled.
                   var span = getDOM().querySelector(fixture.debugElement.nativeElement, '#child');
                   expect(getDOM().hasClass(span, 'compiled')).toBeFalsy();
                   async.done();
                 });
           }));

    it('should trigger directives on the same node',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var template = '<div><span id=child ngNonBindable test-dec>{{text}}</span></div>';
             tcb.overrideTemplate(TestComponent, template)
                 .createAsync(TestComponent)
                 .then((fixture) => {
                   fixture.detectChanges();
                   var span = getDOM().querySelector(fixture.debugElement.nativeElement, '#child');
                   expect(getDOM().hasClass(span, 'compiled')).toBeTruthy();
                   async.done();
                 });
           }));
  })
}

@Directive({selector: '[test-dec]'})
class TestDirective {
  constructor(el: ElementRef) { getDOM().addClass(el.nativeElement, 'compiled'); }
}

@Component({selector: 'test-cmp', directives: [TestDirective], template: ''})
class TestComponent {
  text: string;
  constructor() { this.text = 'foo'; }
}
