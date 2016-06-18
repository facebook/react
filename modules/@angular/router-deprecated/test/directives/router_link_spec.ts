import {beforeEach, ddescribe, xdescribe, describe, expect, iit, inject, beforeEachProviders, it, xit,} from '@angular/core/testing/testing_internal';
import {TestComponentBuilder} from '@angular/compiler/testing';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';

import {SpyRouter, SpyLocation} from '../spies';
import {provide, Component} from '@angular/core';
import {Location} from '@angular/common';
import {Router, RouteRegistry, RouterLink, RouterOutlet, Route, RouteParams, ComponentInstruction} from '@angular/router-deprecated';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';
import {ResolvedInstruction} from '@angular/router-deprecated/src/instruction';
import {By} from '@angular/platform-browser/src/dom/debug/by';

let dummyInstruction = new ResolvedInstruction(
    new ComponentInstruction('detail', [], null, null, true, '0', null, 'Detail'), null, {});

export function main() {
  describe('routerLink directive', function() {
    var tcb: TestComponentBuilder;

    beforeEachProviders(() => [{provide: Location, useValue: makeDummyLocation()}, {
                          provide: Router,
                          useValue: makeDummyRouter()
                        }]);

    beforeEach(
        inject([TestComponentBuilder], (tcBuilder: any /** TODO #9100 */) => { tcb = tcBuilder; }));

    it('should update a[href] attribute',
       inject([AsyncTestCompleter], (async: AsyncTestCompleter) => {

         tcb.createAsync(TestComponent).then((testComponent) => {
           testComponent.detectChanges();
           let anchorElement =
               testComponent.debugElement.query(By.css('a.detail-view')).nativeElement;
           expect(getDOM().getAttribute(anchorElement, 'href')).toEqual('detail');
           async.done();
         });
       }));


    it('should call router.navigate when a link is clicked',
       inject(
           [AsyncTestCompleter, Router],
           (async: AsyncTestCompleter, router: any /** TODO #9100 */) => {

             tcb.createAsync(TestComponent).then((testComponent) => {
               testComponent.detectChanges();
               // TODO: shouldn't this be just 'click' rather than '^click'?
               testComponent.debugElement.query(By.css('a.detail-view'))
                   .triggerEventHandler('click', null);
               expect(router.spy('navigateByInstruction')).toHaveBeenCalledWith(dummyInstruction);
               async.done();
             });
           }));

    it('should call router.navigate when a link is clicked if target is _self',
       inject(
           [AsyncTestCompleter, Router],
           (async: AsyncTestCompleter, router: any /** TODO #9100 */) => {

             tcb.createAsync(TestComponent).then((testComponent) => {
               testComponent.detectChanges();
               testComponent.debugElement.query(By.css('a.detail-view-self'))
                   .triggerEventHandler('click', null);
               expect(router.spy('navigateByInstruction')).toHaveBeenCalledWith(dummyInstruction);
               async.done();
             });
           }));

    it('should NOT call router.navigate when a link is clicked if target is set to other than _self',
       inject(
           [AsyncTestCompleter, Router],
           (async: AsyncTestCompleter, router: any /** TODO #9100 */) => {

             tcb.createAsync(TestComponent).then((testComponent) => {
               testComponent.detectChanges();
               testComponent.debugElement.query(By.css('a.detail-view-blank'))
                   .triggerEventHandler('click', null);
               expect(router.spy('navigateByInstruction')).not.toHaveBeenCalled();
               async.done();
             });
           }));
  });
}

@Component({selector: 'user-cmp', template: 'hello {{user}}'})
class UserCmp {
  user: string;
  constructor(params: RouteParams) { this.user = params.get('name'); }
}

@Component({
  selector: 'test-component',
  template: `
    <div>
      <a [routerLink]="['/Detail']"
         class="detail-view">
           detail view
      </a>
      <a [routerLink]="['/Detail']"
         class="detail-view-self"
         target="_self">
           detail view with _self target
      </a>
      <a [routerLink]="['/Detail']"
         class="detail-view-blank"
         target="_blank">
           detail view with _blank target
      </a>
    </div>`,
  directives: [RouterLink]
})
class TestComponent {
}

function makeDummyLocation() {
  var dl = new SpyLocation();
  dl.spy('prepareExternalUrl').andCallFake((url: any /** TODO #9100 */) => url);
  return dl;
}

function makeDummyRouter() {
  var dr = new SpyRouter();
  dr.spy('generate').andCallFake((routeParams: any /** TODO #9100 */) => dummyInstruction);
  dr.spy('isRouteActive').andCallFake((_: any /** TODO #9100 */) => false);
  dr.spy('navigateInstruction');
  return dr;
}
