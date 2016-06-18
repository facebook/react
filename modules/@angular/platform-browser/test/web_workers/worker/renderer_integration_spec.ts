import {inject, ddescribe, describe, it, iit, expect, beforeEach, beforeEachProviders,} from '@angular/core/testing/testing_internal';
import {AsyncTestCompleter} from '@angular/core/testing/testing_internal';
import {TestInjector} from '@angular/core/testing';
import {TestComponentBuilder} from '@angular/compiler/testing';
import {getDOM} from '@angular/platform-browser/src/dom/dom_adapter';
import {provide, Injector, ViewMetadata, Component, Injectable, ComponentRef} from '@angular/core';
import {NgIf} from '@angular/common';
import {WebWorkerRootRenderer} from '@angular/platform-browser/src/web_workers/worker/renderer';
import {ClientMessageBrokerFactory, ClientMessageBrokerFactory_} from '@angular/platform-browser/src/web_workers/shared/client_message_broker';
import {Serializer} from '@angular/platform-browser/src/web_workers/shared/serializer';
import {RootRenderer} from '@angular/core/src/render/api';
import {DomRootRenderer, DomRootRenderer_} from '@angular/platform-browser/src/dom/dom_renderer';
import {DebugDomRootRenderer} from '@angular/core/src/debug/debug_renderer';
import {RenderStore} from '@angular/platform-browser/src/web_workers/shared/render_store';
import {MessageBasedRenderer} from '@angular/platform-browser/src/web_workers/ui/renderer';
import {createPairedMessageBuses, PairedMessageBuses} from '../shared/web_worker_test_util';
import {ServiceMessageBrokerFactory_} from '@angular/platform-browser/src/web_workers/shared/service_message_broker';
import {CompilerConfig} from '@angular/compiler';
import {dispatchEvent} from '../../../../platform-browser/testing/browser_util';
import {TEST_BROWSER_PLATFORM_PROVIDERS, TEST_BROWSER_APPLICATION_PROVIDERS} from '@angular/platform-browser/testing';

export function main() {
  function createWebWorkerBrokerFactory(
      messageBuses: PairedMessageBuses, workerSerializer: Serializer, uiSerializer: Serializer,
      domRootRenderer: DomRootRenderer, uiRenderStore: RenderStore): ClientMessageBrokerFactory {
    var uiMessageBus = messageBuses.ui;
    var workerMessageBus = messageBuses.worker;

    // set up the worker side
    var webWorkerBrokerFactory =
        new ClientMessageBrokerFactory_(workerMessageBus, workerSerializer);

    // set up the ui side
    var uiMessageBrokerFactory = new ServiceMessageBrokerFactory_(uiMessageBus, uiSerializer);
    var renderer = new MessageBasedRenderer(
        uiMessageBrokerFactory, uiMessageBus, uiSerializer, uiRenderStore, domRootRenderer);
    renderer.start();

    return webWorkerBrokerFactory;
  }

  function createWorkerRenderer(
      workerSerializer: Serializer, uiSerializer: Serializer, domRootRenderer: DomRootRenderer,
      uiRenderStore: RenderStore, workerRenderStore: RenderStore): RootRenderer {
    var messageBuses = createPairedMessageBuses();
    var brokerFactory = createWebWorkerBrokerFactory(
        messageBuses, workerSerializer, uiSerializer, domRootRenderer, uiRenderStore);
    var workerRootRenderer = new WebWorkerRootRenderer(
        brokerFactory, messageBuses.worker, workerSerializer, workerRenderStore);
    return new DebugDomRootRenderer(workerRootRenderer);
  }

  describe('Web Worker Renderer', () => {
    var uiInjector: Injector;
    var uiRenderStore: RenderStore;
    var workerRenderStore: RenderStore;

    beforeEachProviders(() => {
      uiRenderStore = new RenderStore();
      var testUiInjector = new TestInjector();
      testUiInjector.platformProviders = TEST_BROWSER_PLATFORM_PROVIDERS;
      testUiInjector.applicationProviders = TEST_BROWSER_APPLICATION_PROVIDERS;
      testUiInjector.addProviders([
        Serializer, {provide: RenderStore, useValue: uiRenderStore},
        {provide: DomRootRenderer, useClass: DomRootRenderer_},
        {provide: RootRenderer, useExisting: DomRootRenderer}
      ]);
      uiInjector = testUiInjector.createInjector();
      var uiSerializer = uiInjector.get(Serializer);
      var domRootRenderer = uiInjector.get(DomRootRenderer);
      workerRenderStore = new RenderStore();
      return [
        Serializer, {provide: CompilerConfig, useValue: new CompilerConfig({genDebugInfo: true})},
        {provide: RenderStore, useValue: workerRenderStore}, {
          provide: RootRenderer,
          useFactory: (workerSerializer: Serializer) => {
            return createWorkerRenderer(
                workerSerializer, uiSerializer, domRootRenderer, uiRenderStore, workerRenderStore);
          },
          deps: [Serializer]
        }
      ];
    });

    function getRenderElement(workerEl: any) {
      var id = workerRenderStore.serialize(workerEl);
      return uiRenderStore.deserialize(id);
    }

    function getRenderer(componentRef: ComponentRef<any>) {
      return (<any>componentRef.hostView).internalView.renderer;
    }

    it('should update text nodes',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(MyComp2, new ViewMetadata({template: '<div>{{ctxProp}}</div>'}))
                 .createAsync(MyComp2)
                 .then((fixture) => {
                   var renderEl = getRenderElement(fixture.debugElement.nativeElement);
                   expect(renderEl).toHaveText('');

                   fixture.debugElement.componentInstance.ctxProp = 'Hello World!';
                   fixture.detectChanges();
                   expect(renderEl).toHaveText('Hello World!');
                   async.done();

                 });
           }));

    it('should update any element property/attributes/class/style(s) independent of the compilation on the root element and other elements',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(
                    MyComp2,
                    new ViewMetadata({template: '<input [title]="y" style="position:absolute">'}))
                 .createAsync(MyComp2)
                 .then((fixture) => {
                   var checkSetters =
                       (componentRef: any /** TODO #9100 */, workerEl: any /** TODO #9100 */) => {
                         var renderer = getRenderer(componentRef);
                         var el = getRenderElement(workerEl);
                         renderer.setElementProperty(workerEl, 'tabIndex', 1);
                         expect((<HTMLInputElement>el).tabIndex).toEqual(1);

                         renderer.setElementClass(workerEl, 'a', true);
                         expect(getDOM().hasClass(el, 'a')).toBe(true);
                         renderer.setElementClass(workerEl, 'a', false);
                         expect(getDOM().hasClass(el, 'a')).toBe(false);

                         renderer.setElementStyle(workerEl, 'width', '10px');
                         expect(getDOM().getStyle(el, 'width')).toEqual('10px');
                         renderer.setElementStyle(workerEl, 'width', null);
                         expect(getDOM().getStyle(el, 'width')).toEqual('');

                         renderer.setElementAttribute(workerEl, 'someattr', 'someValue');
                         expect(getDOM().getAttribute(el, 'someattr')).toEqual('someValue');
                       };

                   // root element
                   checkSetters(fixture.componentRef, fixture.debugElement.nativeElement);
                   // nested elements
                   checkSetters(
                       fixture.componentRef, fixture.debugElement.children[0].nativeElement);

                   async.done();
                 });
           }));

    it('should update any template comment property/attributes',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             var tpl = '<template [ngIf]="ctxBoolProp"></template>';
             tcb.overrideView(MyComp2, new ViewMetadata({template: tpl, directives: [NgIf]}))

                 .createAsync(MyComp2)
                 .then((fixture) => {
                   (<MyComp2>fixture.debugElement.componentInstance).ctxBoolProp = true;
                   fixture.detectChanges();
                   var el = getRenderElement(fixture.debugElement.nativeElement);
                   expect(getDOM().getInnerHTML(el)).toContain('"ng-reflect-ng-if": "true"');
                   async.done();
                 });
           }));

    it('should add and remove fragments',
       inject(
           [TestComponentBuilder, AsyncTestCompleter],
           (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
             tcb.overrideView(MyComp2, new ViewMetadata({
                                template: '<template [ngIf]="ctxBoolProp">hello</template>',
                                directives: [NgIf]
                              }))
                 .createAsync(MyComp2)
                 .then((fixture) => {

                   var rootEl = getRenderElement(fixture.debugElement.nativeElement);
                   expect(rootEl).toHaveText('');

                   fixture.debugElement.componentInstance.ctxBoolProp = true;
                   fixture.detectChanges();
                   expect(rootEl).toHaveText('hello');

                   fixture.debugElement.componentInstance.ctxBoolProp = false;
                   fixture.detectChanges();
                   expect(rootEl).toHaveText('');

                   async.done();
                 });
           }));

    if (getDOM().supportsDOMEvents()) {
      it('should call actions on the element',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(MyComp2, new ViewMetadata({template: '<input [title]="y">'}))
                   .createAsync(MyComp2)
                   .then((fixture) => {
                     var el = fixture.debugElement.children[0];
                     getRenderer(fixture.componentRef)
                         .invokeElementMethod(el.nativeElement, 'setAttribute', ['a', 'b']);

                     expect(getDOM().getAttribute(getRenderElement(el.nativeElement), 'a'))
                         .toEqual('b');
                     async.done();
                   });
             }));

      it('should listen to events',
         inject(
             [TestComponentBuilder, AsyncTestCompleter],
             (tcb: TestComponentBuilder, async: AsyncTestCompleter) => {
               tcb.overrideView(
                      MyComp2, new ViewMetadata({template: '<input (change)="ctxNumProp = 1">'}))
                   .createAsync(MyComp2)
                   .then((fixture) => {
                     var el = fixture.debugElement.children[0];
                     dispatchEvent(getRenderElement(el.nativeElement), 'change');
                     expect(fixture.componentInstance.ctxNumProp).toBe(1);

                     fixture.destroy();

                     async.done();
                   });
             }));
    }
  });
}


@Component({selector: 'my-comp', directives: []})
@Injectable()
class MyComp2 {
  ctxProp: string;
  ctxNumProp: any /** TODO #9100 */;
  ctxBoolProp: boolean;
  constructor() {
    this.ctxProp = 'initial value';
    this.ctxNumProp = 0;
    this.ctxBoolProp = false;
  }

  throwError() { throw 'boom'; }
}
