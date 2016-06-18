import {Injectable, RenderComponentType, Renderer, RootRenderer, ViewEncapsulation} from '@angular/core';

import {AnimationKeyframe, AnimationPlayer, AnimationStyles, RenderDebugInfo} from '../../../core_private';
import {ObservableWrapper} from '../../facade/async';
import {ListWrapper} from '../../facade/collection';
import {isBlank, isPresent} from '../../facade/lang';
import {ClientMessageBrokerFactory, FnArg, UiArguments} from '../shared/client_message_broker';
import {MessageBus} from '../shared/message_bus';
import {EVENT_CHANNEL, RENDERER_CHANNEL} from '../shared/messaging_api';
import {RenderStore} from '../shared/render_store';
import {RenderStoreObject, Serializer} from '../shared/serializer';

import {deserializeGenericEvent} from './event_deserializer';

@Injectable()
export class WebWorkerRootRenderer implements RootRenderer {
  private _messageBroker: any /** TODO #9100 */;
  public globalEvents: NamedEventEmitter = new NamedEventEmitter();
  private _componentRenderers: Map<string, WebWorkerRenderer> =
      new Map<string, WebWorkerRenderer>();

  constructor(
      messageBrokerFactory: ClientMessageBrokerFactory, bus: MessageBus,
      private _serializer: Serializer, private _renderStore: RenderStore) {
    this._messageBroker = messageBrokerFactory.createMessageBroker(RENDERER_CHANNEL);
    bus.initChannel(EVENT_CHANNEL);
    var source = bus.from(EVENT_CHANNEL);
    ObservableWrapper.subscribe(source, (message) => this._dispatchEvent(message));
  }

  private _dispatchEvent(message: {[key: string]: any}): void {
    var eventName = message['eventName'];
    var target = message['eventTarget'];
    var event = deserializeGenericEvent(message['event']);
    if (isPresent(target)) {
      this.globalEvents.dispatchEvent(eventNameWithTarget(target, eventName), event);
    } else {
      var element =
          <WebWorkerRenderNode>this._serializer.deserialize(message['element'], RenderStoreObject);
      element.events.dispatchEvent(eventName, event);
    }
  }

  renderComponent(componentType: RenderComponentType): Renderer {
    var result = this._componentRenderers.get(componentType.id);
    if (isBlank(result)) {
      result = new WebWorkerRenderer(this, componentType);
      this._componentRenderers.set(componentType.id, result);
      var id = this._renderStore.allocateId();
      this._renderStore.store(result, id);
      this.runOnService('renderComponent', [
        new FnArg(componentType, RenderComponentType),
        new FnArg(result, RenderStoreObject),
      ]);
    }
    return result;
  }

  runOnService(fnName: string, fnArgs: FnArg[]) {
    var args = new UiArguments(fnName, fnArgs);
    this._messageBroker.runOnService(args, null);
  }

  allocateNode(): WebWorkerRenderNode {
    var result = new WebWorkerRenderNode();
    var id = this._renderStore.allocateId();
    this._renderStore.store(result, id);
    return result;
  }

  allocateId(): number { return this._renderStore.allocateId(); }

  destroyNodes(nodes: any[]) {
    for (var i = 0; i < nodes.length; i++) {
      this._renderStore.remove(nodes[i]);
    }
  }
}

export class WebWorkerRenderer implements Renderer, RenderStoreObject {
  constructor(
      private _rootRenderer: WebWorkerRootRenderer, private _componentType: RenderComponentType) {}

  private _runOnService(fnName: string, fnArgs: FnArg[]) {
    var fnArgsWithRenderer = [new FnArg(this, RenderStoreObject)].concat(fnArgs);
    this._rootRenderer.runOnService(fnName, fnArgsWithRenderer);
  }

  selectRootElement(selectorOrNode: string, debugInfo?: RenderDebugInfo): any {
    var node = this._rootRenderer.allocateNode();
    this._runOnService(
        'selectRootElement', [new FnArg(selectorOrNode, null), new FnArg(node, RenderStoreObject)]);
    return node;
  }

  createElement(parentElement: any, name: string, debugInfo?: RenderDebugInfo): any {
    var node = this._rootRenderer.allocateNode();
    this._runOnService('createElement', [
      new FnArg(parentElement, RenderStoreObject), new FnArg(name, null),
      new FnArg(node, RenderStoreObject)
    ]);
    return node;
  }

  createViewRoot(hostElement: any): any {
    var viewRoot = this._componentType.encapsulation === ViewEncapsulation.Native ?
        this._rootRenderer.allocateNode() :
        hostElement;
    this._runOnService(
        'createViewRoot',
        [new FnArg(hostElement, RenderStoreObject), new FnArg(viewRoot, RenderStoreObject)]);
    return viewRoot;
  }

  createTemplateAnchor(parentElement: any, debugInfo?: RenderDebugInfo): any {
    var node = this._rootRenderer.allocateNode();
    this._runOnService(
        'createTemplateAnchor',
        [new FnArg(parentElement, RenderStoreObject), new FnArg(node, RenderStoreObject)]);
    return node;
  }

  createText(parentElement: any, value: string, debugInfo?: RenderDebugInfo): any {
    var node = this._rootRenderer.allocateNode();
    this._runOnService('createText', [
      new FnArg(parentElement, RenderStoreObject), new FnArg(value, null),
      new FnArg(node, RenderStoreObject)
    ]);
    return node;
  }

  projectNodes(parentElement: any, nodes: any[]) {
    this._runOnService(
        'projectNodes',
        [new FnArg(parentElement, RenderStoreObject), new FnArg(nodes, RenderStoreObject)]);
  }

  attachViewAfter(node: any, viewRootNodes: any[]) {
    this._runOnService(
        'attachViewAfter',
        [new FnArg(node, RenderStoreObject), new FnArg(viewRootNodes, RenderStoreObject)]);
  }

  detachView(viewRootNodes: any[]) {
    this._runOnService('detachView', [new FnArg(viewRootNodes, RenderStoreObject)]);
  }

  destroyView(hostElement: any, viewAllNodes: any[]) {
    this._runOnService(
        'destroyView',
        [new FnArg(hostElement, RenderStoreObject), new FnArg(viewAllNodes, RenderStoreObject)]);
    this._rootRenderer.destroyNodes(viewAllNodes);
  }

  setElementProperty(renderElement: any, propertyName: string, propertyValue: any) {
    this._runOnService('setElementProperty', [
      new FnArg(renderElement, RenderStoreObject), new FnArg(propertyName, null),
      new FnArg(propertyValue, null)
    ]);
  }

  setElementAttribute(renderElement: any, attributeName: string, attributeValue: string) {
    this._runOnService('setElementAttribute', [
      new FnArg(renderElement, RenderStoreObject), new FnArg(attributeName, null),
      new FnArg(attributeValue, null)
    ]);
  }

  setBindingDebugInfo(renderElement: any, propertyName: string, propertyValue: string) {
    this._runOnService('setBindingDebugInfo', [
      new FnArg(renderElement, RenderStoreObject), new FnArg(propertyName, null),
      new FnArg(propertyValue, null)
    ]);
  }

  setElementClass(renderElement: any, className: string, isAdd: boolean) {
    this._runOnService('setElementClass', [
      new FnArg(renderElement, RenderStoreObject), new FnArg(className, null),
      new FnArg(isAdd, null)
    ]);
  }

  setElementStyle(renderElement: any, styleName: string, styleValue: string) {
    this._runOnService('setElementStyle', [
      new FnArg(renderElement, RenderStoreObject), new FnArg(styleName, null),
      new FnArg(styleValue, null)
    ]);
  }

  invokeElementMethod(renderElement: any, methodName: string, args?: any[]) {
    this._runOnService('invokeElementMethod', [
      new FnArg(renderElement, RenderStoreObject), new FnArg(methodName, null),
      new FnArg(args, null)
    ]);
  }

  setText(renderNode: any, text: string) {
    this._runOnService(
        'setText', [new FnArg(renderNode, RenderStoreObject), new FnArg(text, null)]);
  }

  listen(renderElement: WebWorkerRenderNode, name: string, callback: Function): Function {
    renderElement.events.listen(name, callback);
    var unlistenCallbackId = this._rootRenderer.allocateId();
    this._runOnService('listen', [
      new FnArg(renderElement, RenderStoreObject), new FnArg(name, null),
      new FnArg(unlistenCallbackId, null)
    ]);
    return () => {
      renderElement.events.unlisten(name, callback);
      this._runOnService('listenDone', [new FnArg(unlistenCallbackId, null)]);
    };
  }

  listenGlobal(target: string, name: string, callback: Function): Function {
    this._rootRenderer.globalEvents.listen(eventNameWithTarget(target, name), callback);
    var unlistenCallbackId = this._rootRenderer.allocateId();
    this._runOnService(
        'listenGlobal',
        [new FnArg(target, null), new FnArg(name, null), new FnArg(unlistenCallbackId, null)]);
    return () => {
      this._rootRenderer.globalEvents.unlisten(eventNameWithTarget(target, name), callback);
      this._runOnService('listenDone', [new FnArg(unlistenCallbackId, null)]);
    };
  }

  animate(
      element: any, startingStyles: AnimationStyles, keyframes: AnimationKeyframe[],
      duration: number, delay: number, easing: string): AnimationPlayer {
    // TODO
    return null;
  }
}

export class NamedEventEmitter {
  private _listeners: Map<string, Function[]>;

  private _getListeners(eventName: string): Function[] {
    if (isBlank(this._listeners)) {
      this._listeners = new Map<string, Function[]>();
    }
    var listeners = this._listeners.get(eventName);
    if (isBlank(listeners)) {
      listeners = [];
      this._listeners.set(eventName, listeners);
    }
    return listeners;
  }

  listen(eventName: string, callback: Function) { this._getListeners(eventName).push(callback); }

  unlisten(eventName: string, callback: Function) {
    ListWrapper.remove(this._getListeners(eventName), callback);
  }

  dispatchEvent(eventName: string, event: any) {
    var listeners = this._getListeners(eventName);
    for (var i = 0; i < listeners.length; i++) {
      listeners[i](event);
    }
  }
}

function eventNameWithTarget(target: string, eventName: string): string {
  return `${target}:${eventName}`;
}

export class WebWorkerRenderNode { events: NamedEventEmitter = new NamedEventEmitter(); }
