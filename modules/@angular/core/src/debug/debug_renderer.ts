import {StringMapWrapper} from '../../src/facade/collection';
import {AnimationKeyframe} from '../animation/animation_keyframe';
import {AnimationPlayer} from '../animation/animation_player';
import {AnimationStyles} from '../animation/animation_styles';
import {isPresent} from '../facade/lang';
import {RenderComponentType, RenderDebugInfo, Renderer, RootRenderer} from '../render/api';

import {DebugElement, DebugNode, EventListener, getDebugNode, indexDebugNode, removeDebugNodeFromIndex} from './debug_node';

export class DebugDomRootRenderer implements RootRenderer {
  constructor(private _delegate: RootRenderer) {}

  renderComponent(componentProto: RenderComponentType): Renderer {
    return new DebugDomRenderer(this._delegate.renderComponent(componentProto));
  }
}

export class DebugDomRenderer implements Renderer {
  constructor(private _delegate: Renderer) {}

  selectRootElement(selectorOrNode: string|any, debugInfo?: RenderDebugInfo): any {
    var nativeEl = this._delegate.selectRootElement(selectorOrNode, debugInfo);
    var debugEl = new DebugElement(nativeEl, null, debugInfo);
    indexDebugNode(debugEl);
    return nativeEl;
  }

  createElement(parentElement: any, name: string, debugInfo?: RenderDebugInfo): any {
    var nativeEl = this._delegate.createElement(parentElement, name, debugInfo);
    var debugEl = new DebugElement(nativeEl, getDebugNode(parentElement), debugInfo);
    debugEl.name = name;
    indexDebugNode(debugEl);
    return nativeEl;
  }

  createViewRoot(hostElement: any): any { return this._delegate.createViewRoot(hostElement); }

  createTemplateAnchor(parentElement: any, debugInfo?: RenderDebugInfo): any {
    var comment = this._delegate.createTemplateAnchor(parentElement, debugInfo);
    var debugEl = new DebugNode(comment, getDebugNode(parentElement), debugInfo);
    indexDebugNode(debugEl);
    return comment;
  }

  createText(parentElement: any, value: string, debugInfo?: RenderDebugInfo): any {
    var text = this._delegate.createText(parentElement, value, debugInfo);
    var debugEl = new DebugNode(text, getDebugNode(parentElement), debugInfo);
    indexDebugNode(debugEl);
    return text;
  }

  projectNodes(parentElement: any, nodes: any[]) {
    var debugParent = getDebugNode(parentElement);
    if (isPresent(debugParent) && debugParent instanceof DebugElement) {
      let debugElement = debugParent;
      nodes.forEach((node) => { debugElement.addChild(getDebugNode(node)); });
    }
    this._delegate.projectNodes(parentElement, nodes);
  }

  attachViewAfter(node: any, viewRootNodes: any[]) {
    var debugNode = getDebugNode(node);
    if (isPresent(debugNode)) {
      var debugParent = debugNode.parent;
      if (viewRootNodes.length > 0 && isPresent(debugParent)) {
        var debugViewRootNodes: DebugNode[] = [];
        viewRootNodes.forEach((rootNode) => debugViewRootNodes.push(getDebugNode(rootNode)));
        debugParent.insertChildrenAfter(debugNode, debugViewRootNodes);
      }
    }
    this._delegate.attachViewAfter(node, viewRootNodes);
  }

  detachView(viewRootNodes: any[]) {
    viewRootNodes.forEach((node) => {
      var debugNode = getDebugNode(node);
      if (isPresent(debugNode) && isPresent(debugNode.parent)) {
        debugNode.parent.removeChild(debugNode);
      }
    });
    this._delegate.detachView(viewRootNodes);
  }

  destroyView(hostElement: any, viewAllNodes: any[]) {
    viewAllNodes.forEach((node) => { removeDebugNodeFromIndex(getDebugNode(node)); });
    this._delegate.destroyView(hostElement, viewAllNodes);
  }

  listen(renderElement: any, name: string, callback: Function): Function {
    var debugEl = getDebugNode(renderElement);
    if (isPresent(debugEl)) {
      debugEl.listeners.push(new EventListener(name, callback));
    }
    return this._delegate.listen(renderElement, name, callback);
  }

  listenGlobal(target: string, name: string, callback: Function): Function {
    return this._delegate.listenGlobal(target, name, callback);
  }

  setElementProperty(renderElement: any, propertyName: string, propertyValue: any) {
    var debugEl = getDebugNode(renderElement);
    if (isPresent(debugEl) && debugEl instanceof DebugElement) {
      debugEl.properties[propertyName] = propertyValue;
    }
    this._delegate.setElementProperty(renderElement, propertyName, propertyValue);
  }

  setElementAttribute(renderElement: any, attributeName: string, attributeValue: string) {
    var debugEl = getDebugNode(renderElement);
    if (isPresent(debugEl) && debugEl instanceof DebugElement) {
      debugEl.attributes[attributeName] = attributeValue;
    }
    this._delegate.setElementAttribute(renderElement, attributeName, attributeValue);
  }

  setBindingDebugInfo(renderElement: any, propertyName: string, propertyValue: string) {
    this._delegate.setBindingDebugInfo(renderElement, propertyName, propertyValue);
  }

  setElementClass(renderElement: any, className: string, isAdd: boolean) {
    var debugEl = getDebugNode(renderElement);
    if (isPresent(debugEl) && debugEl instanceof DebugElement) {
      debugEl.classes[className] = isAdd;
    }
    this._delegate.setElementClass(renderElement, className, isAdd);
  }

  setElementStyle(renderElement: any, styleName: string, styleValue: string) {
    var debugEl = getDebugNode(renderElement);
    if (isPresent(debugEl) && debugEl instanceof DebugElement) {
      debugEl.styles[styleName] = styleValue;
    }
    this._delegate.setElementStyle(renderElement, styleName, styleValue);
  }

  invokeElementMethod(renderElement: any, methodName: string, args?: any[]) {
    this._delegate.invokeElementMethod(renderElement, methodName, args);
  }

  setText(renderNode: any, text: string) { this._delegate.setText(renderNode, text); }

  animate(
      element: any, startingStyles: AnimationStyles, keyframes: AnimationKeyframe[],
      duration: number, delay: number, easing: string): AnimationPlayer {
    return this._delegate.animate(element, startingStyles, keyframes, duration, delay, easing);
  }
}
