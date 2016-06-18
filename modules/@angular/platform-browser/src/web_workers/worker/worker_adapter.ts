import {DomAdapter, setRootDomAdapter} from '../../dom/dom_adapter';
import {Type} from '../../facade/lang';


/**
 * This adapter is required to log error messages.
 *
 * Note: other methods all throw as the DOM is not accessible directly in web worker context.
 */
export class WorkerDomAdapter extends DomAdapter {
  static makeCurrent() { setRootDomAdapter(new WorkerDomAdapter()); }

  logError(error: any /** TODO #9100 */) {
    if (console.error) {
      console.error(error);
    } else {
      console.log(error);
    }
  }

  log(error: any /** TODO #9100 */) { console.log(error); }

  logGroup(error: any /** TODO #9100 */) {
    if (console.group) {
      console.group(error);
      this.logError(error);
    } else {
      console.log(error);
    }
  }

  logGroupEnd() {
    if (console.groupEnd) {
      console.groupEnd();
    }
  }

  hasProperty(element: any /** TODO #9100 */, name: string): boolean { throw 'not implemented'; }
  setProperty(el: Element, name: string, value: any) { throw 'not implemented'; }
  getProperty(el: Element, name: string): any { throw 'not implemented'; }
  invoke(el: Element, methodName: string, args: any[]): any { throw 'not implemented'; }

  getXHR(): Type { throw 'not implemented'; }

  get attrToPropMap(): {[key: string]: string} { throw 'not implemented'; }
  set attrToPropMap(value: {[key: string]: string}) { throw 'not implemented'; }

  parse(templateHtml: string) { throw 'not implemented'; }
  query(selector: string): any { throw 'not implemented'; }
  querySelector(el: any /** TODO #9100 */, selector: string): HTMLElement {
    throw 'not implemented';
  }
  querySelectorAll(el: any /** TODO #9100 */, selector: string): any[] { throw 'not implemented'; }
  on(el: any /** TODO #9100 */, evt: any /** TODO #9100 */, listener: any /** TODO #9100 */) {
    throw 'not implemented';
  }
  onAndCancel(
      el: any /** TODO #9100 */, evt: any /** TODO #9100 */,
      listener: any /** TODO #9100 */): Function {
    throw 'not implemented';
  }
  dispatchEvent(el: any /** TODO #9100 */, evt: any /** TODO #9100 */) { throw 'not implemented'; }
  createMouseEvent(eventType: any /** TODO #9100 */): any { throw 'not implemented'; }
  createEvent(eventType: string): any { throw 'not implemented'; }
  preventDefault(evt: any /** TODO #9100 */) { throw 'not implemented'; }
  isPrevented(evt: any /** TODO #9100 */): boolean { throw 'not implemented'; }
  getInnerHTML(el: any /** TODO #9100 */): string { throw 'not implemented'; }
  getTemplateContent(el: any /** TODO #9100 */): any { throw 'not implemented'; }
  getOuterHTML(el: any /** TODO #9100 */): string { throw 'not implemented'; }
  nodeName(node: any /** TODO #9100 */): string { throw 'not implemented'; }
  nodeValue(node: any /** TODO #9100 */): string { throw 'not implemented'; }
  type(node: any /** TODO #9100 */): string { throw 'not implemented'; }
  content(node: any /** TODO #9100 */): any { throw 'not implemented'; }
  firstChild(el: any /** TODO #9100 */): Node { throw 'not implemented'; }
  nextSibling(el: any /** TODO #9100 */): Node { throw 'not implemented'; }
  parentElement(el: any /** TODO #9100 */): Node { throw 'not implemented'; }
  childNodes(el: any /** TODO #9100 */): Node[] { throw 'not implemented'; }
  childNodesAsList(el: any /** TODO #9100 */): Node[] { throw 'not implemented'; }
  clearNodes(el: any /** TODO #9100 */) { throw 'not implemented'; }
  appendChild(el: any /** TODO #9100 */, node: any /** TODO #9100 */) { throw 'not implemented'; }
  removeChild(el: any /** TODO #9100 */, node: any /** TODO #9100 */) { throw 'not implemented'; }
  replaceChild(
      el: any /** TODO #9100 */, newNode: any /** TODO #9100 */, oldNode: any /** TODO #9100 */) {
    throw 'not implemented';
  }
  remove(el: any /** TODO #9100 */): Node { throw 'not implemented'; }
  insertBefore(el: any /** TODO #9100 */, node: any /** TODO #9100 */) { throw 'not implemented'; }
  insertAllBefore(el: any /** TODO #9100 */, nodes: any /** TODO #9100 */) {
    throw 'not implemented';
  }
  insertAfter(el: any /** TODO #9100 */, node: any /** TODO #9100 */) { throw 'not implemented'; }
  setInnerHTML(el: any /** TODO #9100 */, value: any /** TODO #9100 */) { throw 'not implemented'; }
  getText(el: any /** TODO #9100 */): string { throw 'not implemented'; }
  setText(el: any /** TODO #9100 */, value: string) { throw 'not implemented'; }
  getValue(el: any /** TODO #9100 */): string { throw 'not implemented'; }
  setValue(el: any /** TODO #9100 */, value: string) { throw 'not implemented'; }
  getChecked(el: any /** TODO #9100 */): boolean { throw 'not implemented'; }
  setChecked(el: any /** TODO #9100 */, value: boolean) { throw 'not implemented'; }
  createComment(text: string): any { throw 'not implemented'; }
  createTemplate(html: any /** TODO #9100 */): HTMLElement { throw 'not implemented'; }
  createElement(tagName: any /** TODO #9100 */, doc?: any /** TODO #9100 */): HTMLElement {
    throw 'not implemented';
  }
  createElementNS(ns: string, tagName: string, doc?: any /** TODO #9100 */): Element {
    throw 'not implemented';
  }
  createTextNode(text: string, doc?: any /** TODO #9100 */): Text { throw 'not implemented'; }
  createScriptTag(attrName: string, attrValue: string, doc?: any /** TODO #9100 */): HTMLElement {
    throw 'not implemented';
  }
  createStyleElement(css: string, doc?: any /** TODO #9100 */): HTMLStyleElement {
    throw 'not implemented';
  }
  createShadowRoot(el: any /** TODO #9100 */): any { throw 'not implemented'; }
  getShadowRoot(el: any /** TODO #9100 */): any { throw 'not implemented'; }
  getHost(el: any /** TODO #9100 */): any { throw 'not implemented'; }
  getDistributedNodes(el: any /** TODO #9100 */): Node[] { throw 'not implemented'; }
  clone(node: Node): Node { throw 'not implemented'; }
  getElementsByClassName(element: any /** TODO #9100 */, name: string): HTMLElement[] {
    throw 'not implemented';
  }
  getElementsByTagName(element: any /** TODO #9100 */, name: string): HTMLElement[] {
    throw 'not implemented';
  }
  classList(element: any /** TODO #9100 */): any[] { throw 'not implemented'; }
  addClass(element: any /** TODO #9100 */, className: string) { throw 'not implemented'; }
  removeClass(element: any /** TODO #9100 */, className: string) { throw 'not implemented'; }
  hasClass(element: any /** TODO #9100 */, className: string): boolean { throw 'not implemented'; }
  setStyle(element: any /** TODO #9100 */, styleName: string, styleValue: string) {
    throw 'not implemented';
  }
  removeStyle(element: any /** TODO #9100 */, styleName: string) { throw 'not implemented'; }
  getStyle(element: any /** TODO #9100 */, styleName: string): string { throw 'not implemented'; }
  hasStyle(element: any /** TODO #9100 */, styleName: string, styleValue?: string): boolean {
    throw 'not implemented';
  }
  tagName(element: any /** TODO #9100 */): string { throw 'not implemented'; }
  attributeMap(element: any /** TODO #9100 */): Map<string, string> { throw 'not implemented'; }
  hasAttribute(element: any /** TODO #9100 */, attribute: string): boolean {
    throw 'not implemented';
  }
  hasAttributeNS(element: any /** TODO #9100 */, ns: string, attribute: string): boolean {
    throw 'not implemented';
  }
  getAttribute(element: any /** TODO #9100 */, attribute: string): string {
    throw 'not implemented';
  }
  getAttributeNS(element: any /** TODO #9100 */, ns: string, attribute: string): string {
    throw 'not implemented';
  }
  setAttribute(element: any /** TODO #9100 */, name: string, value: string) {
    throw 'not implemented';
  }
  setAttributeNS(element: any /** TODO #9100 */, ns: string, name: string, value: string) {
    throw 'not implemented';
  }
  removeAttribute(element: any /** TODO #9100 */, attribute: string) { throw 'not implemented'; }
  removeAttributeNS(element: any /** TODO #9100 */, ns: string, attribute: string) {
    throw 'not implemented';
  }
  templateAwareRoot(el: any /** TODO #9100 */) { throw 'not implemented'; }
  createHtmlDocument(): HTMLDocument { throw 'not implemented'; }
  defaultDoc(): HTMLDocument { throw 'not implemented'; }
  getBoundingClientRect(el: any /** TODO #9100 */) { throw 'not implemented'; }
  getTitle(): string { throw 'not implemented'; }
  setTitle(newTitle: string) { throw 'not implemented'; }
  elementMatches(n: any /** TODO #9100 */, selector: string): boolean { throw 'not implemented'; }
  isTemplateElement(el: any): boolean { throw 'not implemented'; }
  isTextNode(node: any /** TODO #9100 */): boolean { throw 'not implemented'; }
  isCommentNode(node: any /** TODO #9100 */): boolean { throw 'not implemented'; }
  isElementNode(node: any /** TODO #9100 */): boolean { throw 'not implemented'; }
  hasShadowRoot(node: any /** TODO #9100 */): boolean { throw 'not implemented'; }
  isShadowRoot(node: any /** TODO #9100 */): boolean { throw 'not implemented'; }
  importIntoDoc(node: Node): Node { throw 'not implemented'; }
  adoptNode(node: Node): Node { throw 'not implemented'; }
  getHref(element: any /** TODO #9100 */): string { throw 'not implemented'; }
  getEventKey(event: any /** TODO #9100 */): string { throw 'not implemented'; }
  resolveAndSetHref(element: any /** TODO #9100 */, baseUrl: string, href: string) {
    throw 'not implemented';
  }
  supportsDOMEvents(): boolean { throw 'not implemented'; }
  supportsNativeShadowDOM(): boolean { throw 'not implemented'; }
  getGlobalEventTarget(target: string): any { throw 'not implemented'; }
  getHistory(): History { throw 'not implemented'; }
  getLocation(): Location { throw 'not implemented'; }
  getBaseHref(): string { throw 'not implemented'; }
  resetBaseElement(): void { throw 'not implemented'; }
  getUserAgent(): string { throw 'not implemented'; }
  setData(element: any /** TODO #9100 */, name: string, value: string) { throw 'not implemented'; }
  getComputedStyle(element: any /** TODO #9100 */): any { throw 'not implemented'; }
  getData(element: any /** TODO #9100 */, name: string): string { throw 'not implemented'; }
  setGlobalVar(name: string, value: any) { throw 'not implemented'; }
  requestAnimationFrame(callback: any /** TODO #9100 */): number { throw 'not implemented'; }
  cancelAnimationFrame(id: any /** TODO #9100 */) { throw 'not implemented'; }
  performanceNow(): number { throw 'not implemented'; }
  getAnimationPrefix(): string { throw 'not implemented'; }
  getTransitionEnd(): string { throw 'not implemented'; }
  supportsAnimation(): boolean { throw 'not implemented'; }
  supportsWebAnimation(): boolean { throw 'not implemented'; }

  supportsCookies(): boolean { return false; }
  getCookie(name: string): string { throw 'not implemented'; }
  setCookie(name: string, value: string) { throw 'not implemented'; }
}
