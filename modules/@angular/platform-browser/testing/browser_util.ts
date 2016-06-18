import {getDOM} from '../src/dom/dom_adapter';
import {ListWrapper} from '../src/facade/collection';
import {RegExp, RegExpWrapper, StringWrapper, global, isPresent, isString} from '../src/facade/lang';

export class BrowserDetection {
  private _overrideUa: string;
  private get _ua(): string {
    if (isPresent(this._overrideUa)) {
      return this._overrideUa;
    } else {
      return isPresent(getDOM()) ? getDOM().getUserAgent() : '';
    }
  }

  static setup() { browserDetection = new BrowserDetection(null); }

  constructor(ua: string) { this._overrideUa = ua; }

  get isFirefox(): boolean { return this._ua.indexOf('Firefox') > -1; }

  get isAndroid(): boolean {
    return this._ua.indexOf('Mozilla/5.0') > -1 && this._ua.indexOf('Android') > -1 &&
        this._ua.indexOf('AppleWebKit') > -1 && this._ua.indexOf('Chrome') == -1;
  }

  get isEdge(): boolean { return this._ua.indexOf('Edge') > -1; }

  get isIE(): boolean { return this._ua.indexOf('Trident') > -1; }

  get isWebkit(): boolean {
    return this._ua.indexOf('AppleWebKit') > -1 && this._ua.indexOf('Edge') == -1;
  }

  get isIOS7(): boolean {
    return this._ua.indexOf('iPhone OS 7') > -1 || this._ua.indexOf('iPad OS 7') > -1;
  }

  get isSlow(): boolean { return this.isAndroid || this.isIE || this.isIOS7; }

  // The Intl API is only properly supported in recent Chrome and Opera.
  // Note: Edge is disguised as Chrome 42, so checking the "Edge" part is needed,
  // see https://msdn.microsoft.com/en-us/library/hh869301(v=vs.85).aspx
  get supportsIntlApi(): boolean { return !!(<any>global).Intl; }

  get isChromeDesktop(): boolean {
    return this._ua.indexOf('Chrome') > -1 && this._ua.indexOf('Mobile Safari') == -1 &&
        this._ua.indexOf('Edge') == -1;
  }
}

BrowserDetection.setup();

export function dispatchEvent(
    element: any /** TODO #9100 */, eventType: any /** TODO #9100 */): void {
  getDOM().dispatchEvent(element, getDOM().createEvent(eventType));
}

export function el(html: string): HTMLElement {
  return <HTMLElement>getDOM().firstChild(getDOM().content(getDOM().createTemplate(html)));
}

export function normalizeCSS(css: string): string {
  css = StringWrapper.replaceAll(css, /\s+/g, ' ');
  css = StringWrapper.replaceAll(css, /:\s/g, ':');
  css = StringWrapper.replaceAll(css, /'/g, '"');
  css = StringWrapper.replaceAll(css, / }/g, '}');
  css = StringWrapper.replaceAllMapped(
      css, /url\((\"|\s)(.+)(\"|\s)\)(\s*)/g,
      (match: any /** TODO #9100 */) => `url("${match[2]}")`);
  css = StringWrapper.replaceAllMapped(
      css, /\[(.+)=([^"\]]+)\]/g, (match: any /** TODO #9100 */) => `[${match[1]}="${match[2]}"]`);
  return css;
}

var _singleTagWhitelist = ['br', 'hr', 'input'];
export function stringifyElement(el: any /** TODO #9100 */): string {
  var result = '';
  if (getDOM().isElementNode(el)) {
    var tagName = getDOM().tagName(el).toLowerCase();

    // Opening tag
    result += `<${tagName}`;

    // Attributes in an ordered way
    var attributeMap = getDOM().attributeMap(el);
    var keys: any[] /** TODO #9100 */ = [];
    attributeMap.forEach((v, k) => keys.push(k));
    ListWrapper.sort(keys);
    for (let i = 0; i < keys.length; i++) {
      var key = keys[i];
      var attValue = attributeMap.get(key);
      if (!isString(attValue)) {
        result += ` ${key}`;
      } else {
        result += ` ${key}="${attValue}"`;
      }
    }
    result += '>';

    // Children
    var childrenRoot = getDOM().templateAwareRoot(el);
    var children = isPresent(childrenRoot) ? getDOM().childNodes(childrenRoot) : [];
    for (let j = 0; j < children.length; j++) {
      result += stringifyElement(children[j]);
    }

    // Closing tag
    if (!ListWrapper.contains(_singleTagWhitelist, tagName)) {
      result += `</${tagName}>`;
    }
  } else if (getDOM().isCommentNode(el)) {
    result += `<!--${getDOM().nodeValue(el)}-->`;
  } else {
    result += getDOM().getText(el);
  }

  return result;
}

export var browserDetection: BrowserDetection = new BrowserDetection(null);
