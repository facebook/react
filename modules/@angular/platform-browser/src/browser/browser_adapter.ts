import {setRootDomAdapter} from '../dom/dom_adapter';
import {ListWrapper} from '../facade/collection';
import {DateWrapper, global, isBlank, isFunction, isPresent, setValueOnPath} from '../facade/lang';

import {GenericBrowserDomAdapter} from './generic_browser_adapter';

var _attrToPropMap = {
  'class': 'className',
  'innerHtml': 'innerHTML',
  'readonly': 'readOnly',
  'tabindex': 'tabIndex'
};

const DOM_KEY_LOCATION_NUMPAD = 3;

// Map to convert some key or keyIdentifier values to what will be returned by getEventKey
var _keyMap = {
  // The following values are here for cross-browser compatibility and to match the W3C standard
  // cf http://www.w3.org/TR/DOM-Level-3-Events-key/
  '\b': 'Backspace',
  '\t': 'Tab',
  '\x7F': 'Delete',
  '\x1B': 'Escape',
  'Del': 'Delete',
  'Esc': 'Escape',
  'Left': 'ArrowLeft',
  'Right': 'ArrowRight',
  'Up': 'ArrowUp',
  'Down': 'ArrowDown',
  'Menu': 'ContextMenu',
  'Scroll': 'ScrollLock',
  'Win': 'OS'
};

// There is a bug in Chrome for numeric keypad keys:
// https://code.google.com/p/chromium/issues/detail?id=155654
// 1, 2, 3 ... are reported as A, B, C ...
var _chromeNumKeyPadMap = {
  'A': '1',
  'B': '2',
  'C': '3',
  'D': '4',
  'E': '5',
  'F': '6',
  'G': '7',
  'H': '8',
  'I': '9',
  'J': '*',
  'K': '+',
  'M': '-',
  'N': '.',
  'O': '/',
  '\x60': '0',
  '\x90': 'NumLock'
};

/**
 * A `DomAdapter` powered by full browser DOM APIs.
 */
/* tslint:disable:requireParameterType */
export class BrowserDomAdapter extends GenericBrowserDomAdapter {
  parse(templateHtml: string) { throw new Error('parse not implemented'); }
  static makeCurrent() { setRootDomAdapter(new BrowserDomAdapter()); }
  hasProperty(element: any /** TODO #9100 */, name: string): boolean { return name in element; }
  setProperty(el: /*element*/ any, name: string, value: any) { el[name] = value; }
  getProperty(el: /*element*/ any, name: string): any { return el[name]; }
  invoke(el: /*element*/ any, methodName: string, args: any[]): any {
    el[methodName].apply(el, args);
  }

  // TODO(tbosch): move this into a separate environment class once we have it
  logError(error: any /** TODO #9100 */) {
    if (window.console.error) {
      window.console.error(error);
    } else {
      window.console.log(error);
    }
  }

  log(error: any /** TODO #9100 */) { window.console.log(error); }

  logGroup(error: any /** TODO #9100 */) {
    if (window.console.group) {
      window.console.group(error);
      this.logError(error);
    } else {
      window.console.log(error);
    }
  }

  logGroupEnd() {
    if (window.console.groupEnd) {
      window.console.groupEnd();
    }
  }

  get attrToPropMap(): any { return _attrToPropMap; }

  query(selector: string): any { return document.querySelector(selector); }
  querySelector(el: any /** TODO #9100 */, selector: string): HTMLElement {
    return el.querySelector(selector);
  }
  querySelectorAll(el: any /** TODO #9100 */, selector: string): any[] {
    return el.querySelectorAll(selector);
  }
  on(el: any /** TODO #9100 */, evt: any /** TODO #9100 */, listener: any /** TODO #9100 */) {
    el.addEventListener(evt, listener, false);
  }
  onAndCancel(
      el: any /** TODO #9100 */, evt: any /** TODO #9100 */,
      listener: any /** TODO #9100 */): Function {
    el.addEventListener(evt, listener, false);
    // Needed to follow Dart's subscription semantic, until fix of
    // https://code.google.com/p/dart/issues/detail?id=17406
    return () => { el.removeEventListener(evt, listener, false); };
  }
  dispatchEvent(el: any /** TODO #9100 */, evt: any /** TODO #9100 */) { el.dispatchEvent(evt); }
  createMouseEvent(eventType: string): MouseEvent {
    var evt: MouseEvent = document.createEvent('MouseEvent');
    evt.initEvent(eventType, true, true);
    return evt;
  }
  createEvent(eventType: any /** TODO #9100 */): Event {
    var evt: Event = document.createEvent('Event');
    evt.initEvent(eventType, true, true);
    return evt;
  }
  preventDefault(evt: Event) {
    evt.preventDefault();
    evt.returnValue = false;
  }
  isPrevented(evt: Event): boolean {
    return evt.defaultPrevented || isPresent(evt.returnValue) && !evt.returnValue;
  }
  getInnerHTML(el: any /** TODO #9100 */): string { return el.innerHTML; }
  getTemplateContent(el: any /** TODO #9100 */): Node {
    return 'content' in el && el instanceof HTMLTemplateElement ? el.content : null;
  }
  getOuterHTML(el: any /** TODO #9100 */): string { return el.outerHTML; }
  nodeName(node: Node): string { return node.nodeName; }
  nodeValue(node: Node): string { return node.nodeValue; }
  type(node: HTMLInputElement): string { return node.type; }
  content(node: Node): Node {
    if (this.hasProperty(node, 'content')) {
      return (<any>node).content;
    } else {
      return node;
    }
  }
  firstChild(el: any /** TODO #9100 */): Node { return el.firstChild; }
  nextSibling(el: any /** TODO #9100 */): Node { return el.nextSibling; }
  parentElement(el: any /** TODO #9100 */): Node { return el.parentNode; }
  childNodes(el: any /** TODO #9100 */): Node[] { return el.childNodes; }
  childNodesAsList(el: any /** TODO #9100 */): any[] {
    var childNodes = el.childNodes;
    var res = ListWrapper.createFixedSize(childNodes.length);
    for (var i = 0; i < childNodes.length; i++) {
      res[i] = childNodes[i];
    }
    return res;
  }
  clearNodes(el: any /** TODO #9100 */) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }
  appendChild(el: any /** TODO #9100 */, node: any /** TODO #9100 */) { el.appendChild(node); }
  removeChild(el: any /** TODO #9100 */, node: any /** TODO #9100 */) { el.removeChild(node); }
  replaceChild(el: Node, newChild: any /** TODO #9100 */, oldChild: any /** TODO #9100 */) {
    el.replaceChild(newChild, oldChild);
  }
  remove(node: any /** TODO #9100 */): Node {
    if (node.parentNode) {
      node.parentNode.removeChild(node);
    }
    return node;
  }
  insertBefore(el: any /** TODO #9100 */, node: any /** TODO #9100 */) {
    el.parentNode.insertBefore(node, el);
  }
  insertAllBefore(el: any /** TODO #9100 */, nodes: any /** TODO #9100 */) {
    nodes.forEach((n: any /** TODO #9100 */) => el.parentNode.insertBefore(n, el));
  }
  insertAfter(el: any /** TODO #9100 */, node: any /** TODO #9100 */) {
    el.parentNode.insertBefore(node, el.nextSibling);
  }
  setInnerHTML(el: any /** TODO #9100 */, value: any /** TODO #9100 */) { el.innerHTML = value; }
  getText(el: any /** TODO #9100 */): string { return el.textContent; }
  // TODO(vicb): removed Element type because it does not support StyleElement
  setText(el: any /** TODO #9100 */, value: string) { el.textContent = value; }
  getValue(el: any /** TODO #9100 */): string { return el.value; }
  setValue(el: any /** TODO #9100 */, value: string) { el.value = value; }
  getChecked(el: any /** TODO #9100 */): boolean { return el.checked; }
  setChecked(el: any /** TODO #9100 */, value: boolean) { el.checked = value; }
  createComment(text: string): Comment { return document.createComment(text); }
  createTemplate(html: any /** TODO #9100 */): HTMLElement {
    var t = document.createElement('template');
    t.innerHTML = html;
    return t;
  }
  createElement(tagName: any /* TODO #9100 */, doc = document): HTMLElement {
    return doc.createElement(tagName);
  }
  createElementNS(ns: any /* TODO #9100 */, tagName: any /* TODO #9100 */, doc = document):
      Element {
    return doc.createElementNS(ns, tagName);
  }
  createTextNode(text: string, doc = document): Text { return doc.createTextNode(text); }
  createScriptTag(attrName: string, attrValue: string, doc = document): HTMLScriptElement {
    var el = <HTMLScriptElement>doc.createElement('SCRIPT');
    el.setAttribute(attrName, attrValue);
    return el;
  }
  createStyleElement(css: string, doc = document): HTMLStyleElement {
    var style = <HTMLStyleElement>doc.createElement('style');
    this.appendChild(style, this.createTextNode(css));
    return style;
  }
  createShadowRoot(el: HTMLElement): DocumentFragment { return (<any>el).createShadowRoot(); }
  getShadowRoot(el: HTMLElement): DocumentFragment { return (<any>el).shadowRoot; }
  getHost(el: HTMLElement): HTMLElement { return (<any>el).host; }
  clone(node: Node): Node { return node.cloneNode(true); }
  getElementsByClassName(element: any /** TODO #9100 */, name: string): HTMLElement[] {
    return element.getElementsByClassName(name);
  }
  getElementsByTagName(element: any /** TODO #9100 */, name: string): HTMLElement[] {
    return element.getElementsByTagName(name);
  }
  classList(element: any /** TODO #9100 */): any[] {
    return <any[]>Array.prototype.slice.call(element.classList, 0);
  }
  addClass(element: any /** TODO #9100 */, className: string) { element.classList.add(className); }
  removeClass(element: any /** TODO #9100 */, className: string) {
    element.classList.remove(className);
  }
  hasClass(element: any /** TODO #9100 */, className: string): boolean {
    return element.classList.contains(className);
  }
  setStyle(element: any /** TODO #9100 */, styleName: string, styleValue: string) {
    element.style[styleName] = styleValue;
  }
  removeStyle(element: any /** TODO #9100 */, stylename: string) {
    element.style[stylename] = null;
  }
  getStyle(element: any /** TODO #9100 */, stylename: string): string {
    return element.style[stylename];
  }
  hasStyle(element: any /** TODO #9100 */, styleName: string, styleValue: string = null): boolean {
    var value = this.getStyle(element, styleName) || '';
    return styleValue ? value == styleValue : value.length > 0;
  }
  tagName(element: any /** TODO #9100 */): string { return element.tagName; }
  attributeMap(element: any /** TODO #9100 */): Map<string, string> {
    var res = new Map<string, string>();
    var elAttrs = element.attributes;
    for (var i = 0; i < elAttrs.length; i++) {
      var attrib = elAttrs[i];
      res.set(attrib.name, attrib.value);
    }
    return res;
  }
  hasAttribute(element: any /** TODO #9100 */, attribute: string): boolean {
    return element.hasAttribute(attribute);
  }
  hasAttributeNS(element: any /** TODO #9100 */, ns: string, attribute: string): boolean {
    return element.hasAttributeNS(ns, attribute);
  }
  getAttribute(element: any /** TODO #9100 */, attribute: string): string {
    return element.getAttribute(attribute);
  }
  getAttributeNS(element: any /** TODO #9100 */, ns: string, name: string): string {
    return element.getAttributeNS(ns, name);
  }
  setAttribute(element: any /** TODO #9100 */, name: string, value: string) {
    element.setAttribute(name, value);
  }
  setAttributeNS(element: any /** TODO #9100 */, ns: string, name: string, value: string) {
    element.setAttributeNS(ns, name, value);
  }
  removeAttribute(element: any /** TODO #9100 */, attribute: string) {
    element.removeAttribute(attribute);
  }
  removeAttributeNS(element: any /** TODO #9100 */, ns: string, name: string) {
    element.removeAttributeNS(ns, name);
  }
  templateAwareRoot(el: any /** TODO #9100 */): any {
    return this.isTemplateElement(el) ? this.content(el) : el;
  }
  createHtmlDocument(): HTMLDocument {
    return document.implementation.createHTMLDocument('fakeTitle');
  }
  defaultDoc(): HTMLDocument { return document; }
  getBoundingClientRect(el: any /** TODO #9100 */): any {
    try {
      return el.getBoundingClientRect();
    } catch (e) {
      return {top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0};
    }
  }
  getTitle(): string { return document.title; }
  setTitle(newTitle: string) { document.title = newTitle || ''; }
  elementMatches(n: any /** TODO #9100 */, selector: string): boolean {
    var matches = false;
    if (n instanceof HTMLElement) {
      if (n.matches) {
        matches = n.matches(selector);
      } else if (n.msMatchesSelector) {
        matches = n.msMatchesSelector(selector);
      } else if (n.webkitMatchesSelector) {
        matches = n.webkitMatchesSelector(selector);
      }
    }
    return matches;
  }
  isTemplateElement(el: any): boolean {
    return el instanceof HTMLElement && el.nodeName == 'TEMPLATE';
  }
  isTextNode(node: Node): boolean { return node.nodeType === Node.TEXT_NODE; }
  isCommentNode(node: Node): boolean { return node.nodeType === Node.COMMENT_NODE; }
  isElementNode(node: Node): boolean { return node.nodeType === Node.ELEMENT_NODE; }
  hasShadowRoot(node: any /** TODO #9100 */): boolean {
    return node instanceof HTMLElement && isPresent(node.shadowRoot);
  }
  isShadowRoot(node: any /** TODO #9100 */): boolean { return node instanceof DocumentFragment; }
  importIntoDoc(node: Node): any {
    var toImport = node;
    if (this.isTemplateElement(node)) {
      toImport = this.content(node);
    }
    return document.importNode(toImport, true);
  }
  adoptNode(node: Node): any { return document.adoptNode(node); }
  getHref(el: Element): string { return (<any>el).href; }
  getEventKey(event: any /** TODO #9100 */): string {
    var key = event.key;
    if (isBlank(key)) {
      key = event.keyIdentifier;
      // keyIdentifier is defined in the old draft of DOM Level 3 Events implemented by Chrome and
      // Safari
      // cf
      // http://www.w3.org/TR/2007/WD-DOM-Level-3-Events-20071221/events.html#Events-KeyboardEvents-Interfaces
      if (isBlank(key)) {
        return 'Unidentified';
      }
      if (key.startsWith('U+')) {
        key = String.fromCharCode(parseInt(key.substring(2), 16));
        if (event.location === DOM_KEY_LOCATION_NUMPAD && _chromeNumKeyPadMap.hasOwnProperty(key)) {
          // There is a bug in Chrome for numeric keypad keys:
          // https://code.google.com/p/chromium/issues/detail?id=155654
          // 1, 2, 3 ... are reported as A, B, C ...
          key = (_chromeNumKeyPadMap as any /** TODO #9100 */)[key];
        }
      }
    }
    if (_keyMap.hasOwnProperty(key)) {
      key = (_keyMap as any /** TODO #9100 */)[key];
    }
    return key;
  }
  getGlobalEventTarget(target: string): EventTarget {
    if (target == 'window') {
      return window;
    } else if (target == 'document') {
      return document;
    } else if (target == 'body') {
      return document.body;
    }
  }
  getHistory(): History { return window.history; }
  getLocation(): Location { return window.location; }
  getBaseHref(): string {
    var href = getBaseElementHref();
    if (isBlank(href)) {
      return null;
    }
    return relativePath(href);
  }
  resetBaseElement(): void { baseElement = null; }
  getUserAgent(): string { return window.navigator.userAgent; }
  setData(element: any /** TODO #9100 */, name: string, value: string) {
    this.setAttribute(element, 'data-' + name, value);
  }
  getData(element: any /** TODO #9100 */, name: string): string {
    return this.getAttribute(element, 'data-' + name);
  }
  getComputedStyle(element: any /** TODO #9100 */): any { return getComputedStyle(element); }
  // TODO(tbosch): move this into a separate environment class once we have it
  setGlobalVar(path: string, value: any) { setValueOnPath(global, path, value); }
  requestAnimationFrame(callback: any /** TODO #9100 */): number {
    return window.requestAnimationFrame(callback);
  }
  cancelAnimationFrame(id: number) { window.cancelAnimationFrame(id); }
  supportsWebAnimation(): boolean {
    return isFunction((document as any /** TODO #9100 */).body['animate']);
  }
  performanceNow(): number {
    // performance.now() is not available in all browsers, see
    // http://caniuse.com/#search=performance.now
    if (isPresent(window.performance) && isPresent(window.performance.now)) {
      return window.performance.now();
    } else {
      return DateWrapper.toMillis(DateWrapper.now());
    }
  }

  supportsCookies(): boolean { return true; }

  getCookie(name: string): string { return parseCookieValue(document.cookie, name); }

  setCookie(name: string, value: string) {
    // document.cookie is magical, assigning into it assigns/overrides one cookie value, but does
    // not clear other cookies.
    document.cookie = encodeURIComponent(name) + '=' + encodeURIComponent(value);
  }
}


var baseElement: any /** TODO #9100 */ = null;
function getBaseElementHref(): string {
  if (isBlank(baseElement)) {
    baseElement = document.querySelector('base');
    if (isBlank(baseElement)) {
      return null;
    }
  }
  return baseElement.getAttribute('href');
}

// based on urlUtils.js in AngularJS 1
var urlParsingNode: any /** TODO #9100 */ = null;
function relativePath(url: any /** TODO #9100 */): string {
  if (isBlank(urlParsingNode)) {
    urlParsingNode = document.createElement('a');
  }
  urlParsingNode.setAttribute('href', url);
  return (urlParsingNode.pathname.charAt(0) === '/') ? urlParsingNode.pathname :
                                                       '/' + urlParsingNode.pathname;
}

export function parseCookieValue(cookie: string, name: string): string {
  name = encodeURIComponent(name);
  let cookies = cookie.split(';');
  for (let cookie of cookies) {
    let [key, value] = cookie.split('=', 2);
    if (key.trim() === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}
