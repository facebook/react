import {Inject, Injectable, OpaqueToken, RenderComponentType, Renderer, RootRenderer, ViewEncapsulation} from '@angular/core';

import {StringMapWrapper} from '../facade/collection';
import {BaseException} from '../facade/exceptions';
import {Json, RegExpWrapper, StringWrapper, isArray, isBlank, isPresent, isString, stringify} from '../facade/lang';

import {DomSharedStylesHost} from './shared_styles_host';

import {AnimationKeyframe, AnimationStyles, AnimationPlayer, AnimationDriver, RenderDebugInfo,} from '../../core_private';

import {EventManager} from './events/event_manager';
import {DOCUMENT} from './dom_tokens';
import {getDOM} from './dom_adapter';
import {camelCaseToDashCase} from './util';

const NAMESPACE_URIS = {
  'xlink': 'http://www.w3.org/1999/xlink',
  'svg': 'http://www.w3.org/2000/svg'
};
const TEMPLATE_COMMENT_TEXT = 'template bindings={}';
var TEMPLATE_BINDINGS_EXP = /^template bindings=(.*)$/g;

export abstract class DomRootRenderer implements RootRenderer {
  protected registeredComponents: Map<string, DomRenderer> = new Map<string, DomRenderer>();

  constructor(
      public document: any, public eventManager: EventManager,
      public sharedStylesHost: DomSharedStylesHost, public animationDriver: AnimationDriver) {}

  renderComponent(componentProto: RenderComponentType): Renderer {
    var renderer = this.registeredComponents.get(componentProto.id);
    if (isBlank(renderer)) {
      renderer = new DomRenderer(this, componentProto, this.animationDriver);
      this.registeredComponents.set(componentProto.id, renderer);
    }
    return renderer;
  }
}

@Injectable()
export class DomRootRenderer_ extends DomRootRenderer {
  constructor(
      @Inject(DOCUMENT) _document: any, _eventManager: EventManager,
      sharedStylesHost: DomSharedStylesHost, animationDriver: AnimationDriver) {
    super(_document, _eventManager, sharedStylesHost, animationDriver);
  }
}

export class DomRenderer implements Renderer {
  private _contentAttr: string;
  private _hostAttr: string;
  private _styles: string[];

  constructor(
      private _rootRenderer: DomRootRenderer, private componentProto: RenderComponentType,
      private _animationDriver: AnimationDriver) {
    this._styles = _flattenStyles(componentProto.id, componentProto.styles, []);
    if (componentProto.encapsulation !== ViewEncapsulation.Native) {
      this._rootRenderer.sharedStylesHost.addStyles(this._styles);
    }
    if (this.componentProto.encapsulation === ViewEncapsulation.Emulated) {
      this._contentAttr = _shimContentAttribute(componentProto.id);
      this._hostAttr = _shimHostAttribute(componentProto.id);
    } else {
      this._contentAttr = null;
      this._hostAttr = null;
    }
  }

  selectRootElement(selectorOrNode: string|any, debugInfo: RenderDebugInfo): Element {
    var el: any /** TODO #9100 */;
    if (isString(selectorOrNode)) {
      el = getDOM().querySelector(this._rootRenderer.document, selectorOrNode);
      if (isBlank(el)) {
        throw new BaseException(`The selector "${selectorOrNode}" did not match any elements`);
      }
    } else {
      el = selectorOrNode;
    }
    getDOM().clearNodes(el);
    return el;
  }

  createElement(parent: Element, name: string, debugInfo: RenderDebugInfo): Node {
    var nsAndName = splitNamespace(name);
    var el = isPresent(nsAndName[0]) ?
        getDOM().createElementNS(
            (NAMESPACE_URIS as any /** TODO #9100 */)[nsAndName[0]], nsAndName[1]) :
        getDOM().createElement(nsAndName[1]);
    if (isPresent(this._contentAttr)) {
      getDOM().setAttribute(el, this._contentAttr, '');
    }
    if (isPresent(parent)) {
      getDOM().appendChild(parent, el);
    }
    return el;
  }

  createViewRoot(hostElement: any): any {
    var nodesParent: any /** TODO #9100 */;
    if (this.componentProto.encapsulation === ViewEncapsulation.Native) {
      nodesParent = getDOM().createShadowRoot(hostElement);
      this._rootRenderer.sharedStylesHost.addHost(nodesParent);
      for (var i = 0; i < this._styles.length; i++) {
        getDOM().appendChild(nodesParent, getDOM().createStyleElement(this._styles[i]));
      }
    } else {
      if (isPresent(this._hostAttr)) {
        getDOM().setAttribute(hostElement, this._hostAttr, '');
      }
      nodesParent = hostElement;
    }
    return nodesParent;
  }

  createTemplateAnchor(parentElement: any, debugInfo: RenderDebugInfo): any {
    var comment = getDOM().createComment(TEMPLATE_COMMENT_TEXT);
    if (isPresent(parentElement)) {
      getDOM().appendChild(parentElement, comment);
    }
    return comment;
  }

  createText(parentElement: any, value: string, debugInfo: RenderDebugInfo): any {
    var node = getDOM().createTextNode(value);
    if (isPresent(parentElement)) {
      getDOM().appendChild(parentElement, node);
    }
    return node;
  }

  projectNodes(parentElement: any, nodes: any[]) {
    if (isBlank(parentElement)) return;
    appendNodes(parentElement, nodes);
  }

  attachViewAfter(node: any, viewRootNodes: any[]) { moveNodesAfterSibling(node, viewRootNodes); }

  detachView(viewRootNodes: any[]) {
    for (var i = 0; i < viewRootNodes.length; i++) {
      getDOM().remove(viewRootNodes[i]);
    }
  }

  destroyView(hostElement: any, viewAllNodes: any[]) {
    if (this.componentProto.encapsulation === ViewEncapsulation.Native && isPresent(hostElement)) {
      this._rootRenderer.sharedStylesHost.removeHost(getDOM().getShadowRoot(hostElement));
    }
  }

  listen(renderElement: any, name: string, callback: Function): Function {
    return this._rootRenderer.eventManager.addEventListener(
        renderElement, name, decoratePreventDefault(callback));
  }

  listenGlobal(target: string, name: string, callback: Function): Function {
    return this._rootRenderer.eventManager.addGlobalEventListener(
        target, name, decoratePreventDefault(callback));
  }

  setElementProperty(renderElement: any, propertyName: string, propertyValue: any): void {
    getDOM().setProperty(renderElement, propertyName, propertyValue);
  }

  setElementAttribute(renderElement: any, attributeName: string, attributeValue: string): void {
    var attrNs: any /** TODO #9100 */;
    var nsAndName = splitNamespace(attributeName);
    if (isPresent(nsAndName[0])) {
      attributeName = nsAndName[0] + ':' + nsAndName[1];
      attrNs = (NAMESPACE_URIS as any /** TODO #9100 */)[nsAndName[0]];
    }
    if (isPresent(attributeValue)) {
      if (isPresent(attrNs)) {
        getDOM().setAttributeNS(renderElement, attrNs, attributeName, attributeValue);
      } else {
        getDOM().setAttribute(renderElement, attributeName, attributeValue);
      }
    } else {
      if (isPresent(attrNs)) {
        getDOM().removeAttributeNS(renderElement, attrNs, nsAndName[1]);
      } else {
        getDOM().removeAttribute(renderElement, attributeName);
      }
    }
  }

  setBindingDebugInfo(renderElement: any, propertyName: string, propertyValue: string): void {
    var dashCasedPropertyName = camelCaseToDashCase(propertyName);
    if (getDOM().isCommentNode(renderElement)) {
      var existingBindings = RegExpWrapper.firstMatch(
          TEMPLATE_BINDINGS_EXP,
          StringWrapper.replaceAll(getDOM().getText(renderElement), /\n/g, ''));
      var parsedBindings = Json.parse(existingBindings[1]);
      (parsedBindings as any /** TODO #9100 */)[dashCasedPropertyName] = propertyValue;
      getDOM().setText(
          renderElement,
          StringWrapper.replace(TEMPLATE_COMMENT_TEXT, '{}', Json.stringify(parsedBindings)));
    } else {
      this.setElementAttribute(renderElement, propertyName, propertyValue);
    }
  }

  setElementClass(renderElement: any, className: string, isAdd: boolean): void {
    if (isAdd) {
      getDOM().addClass(renderElement, className);
    } else {
      getDOM().removeClass(renderElement, className);
    }
  }

  setElementStyle(renderElement: any, styleName: string, styleValue: string): void {
    if (isPresent(styleValue)) {
      getDOM().setStyle(renderElement, styleName, stringify(styleValue));
    } else {
      getDOM().removeStyle(renderElement, styleName);
    }
  }

  invokeElementMethod(renderElement: any, methodName: string, args: any[]): void {
    getDOM().invoke(renderElement, methodName, args);
  }

  setText(renderNode: any, text: string): void { getDOM().setText(renderNode, text); }

  animate(
      element: any, startingStyles: AnimationStyles, keyframes: AnimationKeyframe[],
      duration: number, delay: number, easing: string): AnimationPlayer {
    return this._animationDriver.animate(
        element, startingStyles, keyframes, duration, delay, easing);
  }
}

function moveNodesAfterSibling(sibling: any /** TODO #9100 */, nodes: any /** TODO #9100 */) {
  var parent = getDOM().parentElement(sibling);
  if (nodes.length > 0 && isPresent(parent)) {
    var nextSibling = getDOM().nextSibling(sibling);
    if (isPresent(nextSibling)) {
      for (var i = 0; i < nodes.length; i++) {
        getDOM().insertBefore(nextSibling, nodes[i]);
      }
    } else {
      for (var i = 0; i < nodes.length; i++) {
        getDOM().appendChild(parent, nodes[i]);
      }
    }
  }
}

function appendNodes(parent: any /** TODO #9100 */, nodes: any /** TODO #9100 */) {
  for (var i = 0; i < nodes.length; i++) {
    getDOM().appendChild(parent, nodes[i]);
  }
}

function decoratePreventDefault(eventHandler: Function): Function {
  return (event: any /** TODO #9100 */) => {
    var allowDefaultBehavior = eventHandler(event);
    if (allowDefaultBehavior === false) {
      // TODO(tbosch): move preventDefault into event plugins...
      getDOM().preventDefault(event);
    }
  };
}

var COMPONENT_REGEX = /%COMP%/g;
export const COMPONENT_VARIABLE = '%COMP%';
export const HOST_ATTR = `_nghost-${COMPONENT_VARIABLE}`;
export const CONTENT_ATTR = `_ngcontent-${COMPONENT_VARIABLE}`;

function _shimContentAttribute(componentShortId: string): string {
  return StringWrapper.replaceAll(CONTENT_ATTR, COMPONENT_REGEX, componentShortId);
}

function _shimHostAttribute(componentShortId: string): string {
  return StringWrapper.replaceAll(HOST_ATTR, COMPONENT_REGEX, componentShortId);
}

function _flattenStyles(compId: string, styles: Array<any|any[]>, target: string[]): string[] {
  for (var i = 0; i < styles.length; i++) {
    var style = styles[i];
    if (isArray(style)) {
      _flattenStyles(compId, style, target);
    } else {
      style = StringWrapper.replaceAll(style, COMPONENT_REGEX, compId);
      target.push(style);
    }
  }
  return target;
}

var NS_PREFIX_RE = /^:([^:]+):(.+)/g;

function splitNamespace(name: string): string[] {
  if (name[0] != ':') {
    return [null, name];
  }
  let match = RegExpWrapper.firstMatch(NS_PREFIX_RE, name);
  return [match[1], match[2]];
}
