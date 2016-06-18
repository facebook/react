import {Type, isBlank} from '../facade/lang';

var _DOM: DomAdapter = null;

export function getDOM() {
  return _DOM;
}

export function setDOM(adapter: DomAdapter) {
  _DOM = adapter;
}

export function setRootDomAdapter(adapter: DomAdapter) {
  if (isBlank(_DOM)) {
    _DOM = adapter;
  }
}

/* tslint:disable:requireParameterType */
/**
 * Provides DOM operations in an environment-agnostic way.
 */
export abstract class DomAdapter {
  public xhrType: Type = null;
  abstract hasProperty(element: any /** TODO #9100 */, name: string): boolean;
  abstract setProperty(el: Element, name: string, value: any): any /** TODO #9100 */;
  abstract getProperty(el: Element, name: string): any;
  abstract invoke(el: Element, methodName: string, args: any[]): any;

  abstract logError(error: any /** TODO #9100 */): any /** TODO #9100 */;
  abstract log(error: any /** TODO #9100 */): any /** TODO #9100 */;
  abstract logGroup(error: any /** TODO #9100 */): any /** TODO #9100 */;
  abstract logGroupEnd(): any /** TODO #9100 */;

  /** @deprecated */
  getXHR(): Type { return this.xhrType; }

  /**
   * Maps attribute names to their corresponding property names for cases
   * where attribute name doesn't match property name.
   */
  get attrToPropMap(): {[key: string]: string} { return this._attrToPropMap; };
  set attrToPropMap(value: {[key: string]: string}) { this._attrToPropMap = value; };
  /** @internal */
  _attrToPropMap: {[key: string]: string};

  abstract parse(templateHtml: string): any /** TODO #9100 */;
  abstract query(selector: string): any;
  abstract querySelector(el: any /** TODO #9100 */, selector: string): HTMLElement;
  abstract querySelectorAll(el: any /** TODO #9100 */, selector: string): any[];
  abstract on(
      el: any /** TODO #9100 */, evt: any /** TODO #9100 */, listener: any /** TODO #9100 */): any
      /** TODO #9100 */;
  abstract onAndCancel(
      el: any /** TODO #9100 */, evt: any /** TODO #9100 */,
      listener: any /** TODO #9100 */): Function;
  abstract dispatchEvent(el: any /** TODO #9100 */, evt: any /** TODO #9100 */): any
      /** TODO #9100 */;
  abstract createMouseEvent(eventType: any /** TODO #9100 */): any;
  abstract createEvent(eventType: string): any;
  abstract preventDefault(evt: any /** TODO #9100 */): any /** TODO #9100 */;
  abstract isPrevented(evt: any /** TODO #9100 */): boolean;
  abstract getInnerHTML(el: any /** TODO #9100 */): string;
  /** Returns content if el is a <template> element, null otherwise. */
  abstract getTemplateContent(el: any /** TODO #9100 */): any;
  abstract getOuterHTML(el: any /** TODO #9100 */): string;
  abstract nodeName(node: any /** TODO #9100 */): string;
  abstract nodeValue(node: any /** TODO #9100 */): string;
  abstract type(node: any /** TODO #9100 */): string;
  abstract content(node: any /** TODO #9100 */): any;
  abstract firstChild(el: any /** TODO #9100 */): Node;
  abstract nextSibling(el: any /** TODO #9100 */): Node;
  abstract parentElement(el: any /** TODO #9100 */): Node;
  abstract childNodes(el: any /** TODO #9100 */): Node[];
  abstract childNodesAsList(el: any /** TODO #9100 */): Node[];
  abstract clearNodes(el: any /** TODO #9100 */): any /** TODO #9100 */;
  abstract appendChild(el: any /** TODO #9100 */, node: any /** TODO #9100 */): any
      /** TODO #9100 */;
  abstract removeChild(el: any /** TODO #9100 */, node: any /** TODO #9100 */): any
      /** TODO #9100 */;
  abstract replaceChild(
      el: any /** TODO #9100 */, newNode: any /** TODO #9100 */,
      oldNode: any /** TODO #9100 */): any /** TODO #9100 */;
  abstract remove(el: any /** TODO #9100 */): Node;
  abstract insertBefore(el: any /** TODO #9100 */, node: any /** TODO #9100 */): any
      /** TODO #9100 */;
  abstract insertAllBefore(el: any /** TODO #9100 */, nodes: any /** TODO #9100 */): any
      /** TODO #9100 */;
  abstract insertAfter(el: any /** TODO #9100 */, node: any /** TODO #9100 */): any
      /** TODO #9100 */;
  abstract setInnerHTML(el: any /** TODO #9100 */, value: any /** TODO #9100 */): any
      /** TODO #9100 */;
  abstract getText(el: any /** TODO #9100 */): string;
  abstract setText(el: any /** TODO #9100 */, value: string): any /** TODO #9100 */;
  abstract getValue(el: any /** TODO #9100 */): string;
  abstract setValue(el: any /** TODO #9100 */, value: string): any /** TODO #9100 */;
  abstract getChecked(el: any /** TODO #9100 */): boolean;
  abstract setChecked(el: any /** TODO #9100 */, value: boolean): any /** TODO #9100 */;
  abstract createComment(text: string): any;
  abstract createTemplate(html: any /** TODO #9100 */): HTMLElement;
  abstract createElement(tagName: any /** TODO #9100 */, doc?: any /** TODO #9100 */): HTMLElement;
  abstract createElementNS(ns: string, tagName: string, doc?: any /** TODO #9100 */): Element;
  abstract createTextNode(text: string, doc?: any /** TODO #9100 */): Text;
  abstract createScriptTag(attrName: string, attrValue: string, doc?: any /** TODO #9100 */):
      HTMLElement;
  abstract createStyleElement(css: string, doc?: any /** TODO #9100 */): HTMLStyleElement;
  abstract createShadowRoot(el: any /** TODO #9100 */): any;
  abstract getShadowRoot(el: any /** TODO #9100 */): any;
  abstract getHost(el: any /** TODO #9100 */): any;
  abstract getDistributedNodes(el: any /** TODO #9100 */): Node[];
  abstract clone /*<T extends Node>*/ (node: Node /*T*/): Node /*T*/;
  abstract getElementsByClassName(element: any /** TODO #9100 */, name: string): HTMLElement[];
  abstract getElementsByTagName(element: any /** TODO #9100 */, name: string): HTMLElement[];
  abstract classList(element: any /** TODO #9100 */): any[];
  abstract addClass(element: any /** TODO #9100 */, className: string): any /** TODO #9100 */;
  abstract removeClass(element: any /** TODO #9100 */, className: string): any /** TODO #9100 */;
  abstract hasClass(element: any /** TODO #9100 */, className: string): boolean;
  abstract setStyle(element: any /** TODO #9100 */, styleName: string, styleValue: string): any
      /** TODO #9100 */;
  abstract removeStyle(element: any /** TODO #9100 */, styleName: string): any /** TODO #9100 */;
  abstract getStyle(element: any /** TODO #9100 */, styleName: string): string;
  abstract hasStyle(element: any /** TODO #9100 */, styleName: string, styleValue?: string):
      boolean;
  abstract tagName(element: any /** TODO #9100 */): string;
  abstract attributeMap(element: any /** TODO #9100 */): Map<string, string>;
  abstract hasAttribute(element: any /** TODO #9100 */, attribute: string): boolean;
  abstract hasAttributeNS(element: any /** TODO #9100 */, ns: string, attribute: string): boolean;
  abstract getAttribute(element: any /** TODO #9100 */, attribute: string): string;
  abstract getAttributeNS(element: any /** TODO #9100 */, ns: string, attribute: string): string;
  abstract setAttribute(element: any /** TODO #9100 */, name: string, value: string): any
      /** TODO #9100 */;
  abstract setAttributeNS(element: any /** TODO #9100 */, ns: string, name: string, value: string):
      any /** TODO #9100 */;
  abstract removeAttribute(element: any /** TODO #9100 */, attribute: string): any
      /** TODO #9100 */;
  abstract removeAttributeNS(element: any /** TODO #9100 */, ns: string, attribute: string): any
      /** TODO #9100 */;
  abstract templateAwareRoot(el: any /** TODO #9100 */): any /** TODO #9100 */;
  abstract createHtmlDocument(): HTMLDocument;
  abstract defaultDoc(): HTMLDocument;
  abstract getBoundingClientRect(el: any /** TODO #9100 */): any /** TODO #9100 */;
  abstract getTitle(): string;
  abstract setTitle(newTitle: string): any /** TODO #9100 */;
  abstract elementMatches(n: any /** TODO #9100 */, selector: string): boolean;
  abstract isTemplateElement(el: any): boolean;
  abstract isTextNode(node: any /** TODO #9100 */): boolean;
  abstract isCommentNode(node: any /** TODO #9100 */): boolean;
  abstract isElementNode(node: any /** TODO #9100 */): boolean;
  abstract hasShadowRoot(node: any /** TODO #9100 */): boolean;
  abstract isShadowRoot(node: any /** TODO #9100 */): boolean;
  abstract importIntoDoc /*<T extends Node>*/ (node: Node /*T*/): Node /*T*/;
  abstract adoptNode /*<T extends Node>*/ (node: Node /*T*/): Node /*T*/;
  abstract getHref(element: any /** TODO #9100 */): string;
  abstract getEventKey(event: any /** TODO #9100 */): string;
  abstract resolveAndSetHref(element: any /** TODO #9100 */, baseUrl: string, href: string): any
      /** TODO #9100 */;
  abstract supportsDOMEvents(): boolean;
  abstract supportsNativeShadowDOM(): boolean;
  abstract getGlobalEventTarget(target: string): any;
  abstract getHistory(): History;
  abstract getLocation(): Location;
  abstract getBaseHref(): string;
  abstract resetBaseElement(): void;
  abstract getUserAgent(): string;
  abstract setData(element: any /** TODO #9100 */, name: string, value: string): any
      /** TODO #9100 */;
  abstract getComputedStyle(element: any /** TODO #9100 */): any;
  abstract getData(element: any /** TODO #9100 */, name: string): string;
  abstract setGlobalVar(name: string, value: any): any /** TODO #9100 */;
  abstract requestAnimationFrame(callback: any /** TODO #9100 */): number;
  abstract cancelAnimationFrame(id: any /** TODO #9100 */): any /** TODO #9100 */;
  abstract supportsWebAnimation(): boolean;
  abstract performanceNow(): number;
  abstract getAnimationPrefix(): string;
  abstract getTransitionEnd(): string;
  abstract supportsAnimation(): boolean;

  abstract supportsCookies(): boolean;
  abstract getCookie(name: string): string;
  abstract setCookie(name: string, value: string): any /** TODO #9100 */;
}
