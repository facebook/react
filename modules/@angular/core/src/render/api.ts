import {AnimationKeyframe} from '../../src/animation/animation_keyframe';
import {AnimationPlayer} from '../../src/animation/animation_player';
import {AnimationStyles} from '../../src/animation/animation_styles';
import {Injector} from '../di/injector';
import {unimplemented} from '../facade/exceptions';
import {ViewEncapsulation} from '../metadata/view';


/**
 * @experimental
 */
export class RenderComponentType {
  constructor(
      public id: string, public templateUrl: string, public slotCount: number,
      public encapsulation: ViewEncapsulation, public styles: Array<string|any[]>) {}
}

export abstract class RenderDebugInfo {
  get injector(): Injector { return unimplemented(); }
  get component(): any { return unimplemented(); }
  get providerTokens(): any[] { return unimplemented(); }
  get references(): {[key: string]: any} { return unimplemented(); }
  get context(): any { return unimplemented(); }
  get source(): string { return unimplemented(); }
}

/**
 * @experimental
 */
export abstract class Renderer {
  abstract selectRootElement(selectorOrNode: string|any, debugInfo?: RenderDebugInfo): any;

  abstract createElement(parentElement: any, name: string, debugInfo?: RenderDebugInfo): any;

  abstract createViewRoot(hostElement: any): any;

  abstract createTemplateAnchor(parentElement: any, debugInfo?: RenderDebugInfo): any;

  abstract createText(parentElement: any, value: string, debugInfo?: RenderDebugInfo): any;

  abstract projectNodes(parentElement: any, nodes: any[]): void;

  abstract attachViewAfter(node: any, viewRootNodes: any[]): void;

  abstract detachView(viewRootNodes: any[]): void;

  abstract destroyView(hostElement: any, viewAllNodes: any[]): void;

  abstract listen(renderElement: any, name: string, callback: Function): Function;

  abstract listenGlobal(target: string, name: string, callback: Function): Function;

  abstract setElementProperty(renderElement: any, propertyName: string, propertyValue: any): void;

  abstract setElementAttribute(renderElement: any, attributeName: string, attributeValue: string):
      void;

  /**
   * Used only in debug mode to serialize property changes to dom nodes as attributes.
   */
  abstract setBindingDebugInfo(renderElement: any, propertyName: string, propertyValue: string):
      void;

  abstract setElementClass(renderElement: any, className: string, isAdd: boolean): any
      /** TODO #9100 */;

  abstract setElementStyle(renderElement: any, styleName: string, styleValue: string): any
      /** TODO #9100 */;

  abstract invokeElementMethod(renderElement: any, methodName: string, args?: any[]): any
      /** TODO #9100 */;

  abstract setText(renderNode: any, text: string): any /** TODO #9100 */;

  abstract animate(
      element: any, startingStyles: AnimationStyles, keyframes: AnimationKeyframe[],
      duration: number, delay: number, easing: string): AnimationPlayer;
}

/**
 * Injectable service that provides a low-level interface for modifying the UI.
 *
 * Use this service to bypass Angular's templating and make custom UI changes that can't be
 * expressed declaratively. For example if you need to set a property or an attribute whose name is
 * not statically known, use {@link #setElementProperty} or {@link #setElementAttribute}
 * respectively.
 *
 * If you are implementing a custom renderer, you must implement this interface.
 *
 * The default Renderer implementation is `DomRenderer`. Also available is `WebWorkerRenderer`.
 * @experimental
 */
export abstract class RootRenderer {
  abstract renderComponent(componentType: RenderComponentType): Renderer;
}
