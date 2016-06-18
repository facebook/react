import {isDevMode} from '@angular/core';

import {DomAdapter, getDOM} from '../dom/dom_adapter';

import {sanitizeUrl} from './url_sanitizer';



/** A <body> element that can be safely used to parse untrusted HTML. Lazily initialized below. */
let inertElement: HTMLElement = null;
/** Lazily initialized to make sure the DOM adapter gets set before use. */
let DOM: DomAdapter = null;

/** Returns an HTML element that is guaranteed to not execute code when creating elements in it. */
function getInertElement() {
  if (inertElement) return inertElement;
  DOM = getDOM();

  // Prefer using <template> element if supported.
  let templateEl = DOM.createElement('template');
  if ('content' in templateEl) return templateEl;

  let doc = DOM.createHtmlDocument();
  inertElement = DOM.querySelector(doc, 'body');
  if (inertElement == null) {
    // usually there should be only one body element in the document, but IE doesn't have any, so we
    // need to create one.
    let html = DOM.createElement('html', doc);
    inertElement = DOM.createElement('body', doc);
    DOM.appendChild(html, inertElement);
    DOM.appendChild(doc, html);
  }
  return inertElement;
}

function tagSet(tags: string): {[k: string]: boolean} {
  let res: {[k: string]: boolean} = {};
  for (let t of tags.split(',')) res[t.toLowerCase()] = true;
  return res;
}

function merge(...sets: {[k: string]: boolean}[]): {[k: string]: boolean} {
  let res: {[k: string]: boolean} = {};
  for (let s of sets) {
    for (let v in s) {
      if (s.hasOwnProperty(v)) res[v] = true;
    }
  }
  return res;
}

// Good source of info about elements and attributes
// http://dev.w3.org/html5/spec/Overview.html#semantics
// http://simon.html5.org/html-elements

// Safe Void Elements - HTML5
// http://dev.w3.org/html5/spec/Overview.html#void-elements
const VOID_ELEMENTS = tagSet('area,br,col,hr,img,wbr');

// Elements that you can, intentionally, leave open (and which close themselves)
// http://dev.w3.org/html5/spec/Overview.html#optional-tags
const OPTIONAL_END_TAG_BLOCK_ELEMENTS = tagSet('colgroup,dd,dt,li,p,tbody,td,tfoot,th,thead,tr');
const OPTIONAL_END_TAG_INLINE_ELEMENTS = tagSet('rp,rt');
const OPTIONAL_END_TAG_ELEMENTS =
    merge(OPTIONAL_END_TAG_INLINE_ELEMENTS, OPTIONAL_END_TAG_BLOCK_ELEMENTS);

// Safe Block Elements - HTML5
const BLOCK_ELEMENTS = merge(
    OPTIONAL_END_TAG_BLOCK_ELEMENTS,
    tagSet(
        'address,article,' +
        'aside,blockquote,caption,center,del,dir,div,dl,figure,figcaption,footer,h1,h2,h3,h4,h5,' +
        'h6,header,hgroup,hr,ins,map,menu,nav,ol,pre,section,table,ul'));

// Inline Elements - HTML5
const INLINE_ELEMENTS = merge(
    OPTIONAL_END_TAG_INLINE_ELEMENTS,
    tagSet(
        'a,abbr,acronym,b,' +
        'bdi,bdo,big,br,cite,code,del,dfn,em,font,i,img,ins,kbd,label,map,mark,q,ruby,rp,rt,s,' +
        'samp,small,span,strike,strong,sub,sup,time,tt,u,var'));

const VALID_ELEMENTS =
    merge(VOID_ELEMENTS, BLOCK_ELEMENTS, INLINE_ELEMENTS, OPTIONAL_END_TAG_ELEMENTS);

// Attributes that have href and hence need to be sanitized
const URI_ATTRS = tagSet('background,cite,href,longdesc,src,xlink:href');

const HTML_ATTRS = tagSet(
    'abbr,align,alt,axis,bgcolor,border,cellpadding,cellspacing,class,clear,' +
    'color,cols,colspan,compact,coords,dir,face,headers,height,hreflang,hspace,' +
    'ismap,lang,language,nohref,nowrap,rel,rev,rows,rowspan,rules,' +
    'scope,scrolling,shape,size,span,start,summary,tabindex,target,title,type,' +
    'valign,value,vspace,width');

// NB: This currently conciously doesn't support SVG. SVG sanitization has had several security
// issues in the past, so it seems safer to leave it out if possible. If support for binding SVG via
// innerHTML is required, SVG attributes should be added here.

// NB: Sanitization does not allow <form> elements or other active elements (<button> etc). Those
// can be sanitized, but they increase security surface area without a legitimate use case, so they
// are left out here.

const VALID_ATTRS = merge(URI_ATTRS, HTML_ATTRS);

/**
 * SanitizingHtmlSerializer serializes a DOM fragment, stripping out any unsafe elements and unsafe
 * attributes.
 */
class SanitizingHtmlSerializer {
  private buf: string[] = [];

  sanitizeChildren(el: Element): string {
    // This cannot use a TreeWalker, as it has to run on Angular's various DOM adapters.
    // However this code never accesses properties off of `document` before deleting its contents
    // again, so it shouldn't be vulnerable to DOM clobbering.
    let current: Node = el.firstChild;
    while (current) {
      if (DOM.isElementNode(current)) {
        this.startElement(current);
      } else if (DOM.isTextNode(current)) {
        this.chars(DOM.nodeValue(current));
      }
      if (DOM.firstChild(current)) {
        current = DOM.firstChild(current);
        continue;
      }
      while (current) {
        // Leaving the element. Walk up and to the right, closing tags as we go.
        if (DOM.isElementNode(current)) {
          this.endElement(DOM.nodeName(current).toLowerCase());
        }
        if (DOM.nextSibling(current)) {
          current = DOM.nextSibling(current);
          break;
        }
        current = DOM.parentElement(current);
      }
    }
    return this.buf.join('');
  }

  private startElement(element: any) {
    let tagName = DOM.nodeName(element).toLowerCase();
    tagName = tagName.toLowerCase();
    if (VALID_ELEMENTS.hasOwnProperty(tagName)) {
      this.buf.push('<');
      this.buf.push(tagName);
      DOM.attributeMap(element).forEach((value: string, attrName: string) => {
        let lower = attrName.toLowerCase();
        if (!VALID_ATTRS.hasOwnProperty(lower)) return;
        // TODO(martinprobst): Special case image URIs for data:image/...
        if (URI_ATTRS[lower]) value = sanitizeUrl(value);
        this.buf.push(' ');
        this.buf.push(attrName);
        this.buf.push('="');
        this.buf.push(encodeEntities(value));
        this.buf.push('"');
      });
      this.buf.push('>');
    }
  }

  private endElement(tagName: string) {
    tagName = tagName.toLowerCase();
    if (VALID_ELEMENTS.hasOwnProperty(tagName) && !VOID_ELEMENTS.hasOwnProperty(tagName)) {
      this.buf.push('</');
      this.buf.push(tagName);
      this.buf.push('>');
    }
  }

  private chars(chars: any /** TODO #9100 */) { this.buf.push(encodeEntities(chars)); }
}

// Regular Expressions for parsing tags and attributes
const SURROGATE_PAIR_REGEXP = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
// ! to ~ is the ASCII range.
const NON_ALPHANUMERIC_REGEXP = /([^\#-~ |!])/g;

/**
 * Escapes all potentially dangerous characters, so that the
 * resulting string can be safely inserted into attribute or
 * element text.
 * @param value
 * @returns {string} escaped text
 */
function encodeEntities(value: any /** TODO #9100 */) {
  return value.replace(/&/g, '&amp;')
      .replace(
          SURROGATE_PAIR_REGEXP,
          function(match: any /** TODO #9100 */) {
            let hi = match.charCodeAt(0);
            let low = match.charCodeAt(1);
            return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';';
          })
      .replace(
          NON_ALPHANUMERIC_REGEXP,
          function(match: any /** TODO #9100 */) { return '&#' + match.charCodeAt(0) + ';'; })
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
}

/**
 * When IE9-11 comes across an unknown namespaced attribute e.g. 'xlink:foo' it adds 'xmlns:ns1'
 * attribute to declare ns1 namespace and prefixes the attribute with 'ns1' (e.g. 'ns1:xlink:foo').
 *
 * This is undesirable since we don't want to allow any of these custom attributes. This method
 * strips them all.
 */
function stripCustomNsAttrs(el: any) {
  DOM.attributeMap(el).forEach((_, attrName) => {
    if (attrName === 'xmlns:ns1' || attrName.indexOf('ns1:') === 0) {
      DOM.removeAttribute(el, attrName);
    }
  });
  for (let n of DOM.childNodesAsList(el)) {
    if (DOM.isElementNode(n)) stripCustomNsAttrs(n);
  }
}

/**
 * Sanitizes the given unsafe, untrusted HTML fragment, and returns HTML text that is safe to add to
 * the DOM in a browser environment.
 */
export function sanitizeHtml(unsafeHtml: string): string {
  try {
    let containerEl = getInertElement();
    // Make sure unsafeHtml is actually a string (TypeScript types are not enforced at runtime).
    unsafeHtml = unsafeHtml ? String(unsafeHtml) : '';

    // mXSS protection. Repeatedly parse the document to make sure it stabilizes, so that a browser
    // trying to auto-correct incorrect HTML cannot cause formerly inert HTML to become dangerous.
    let mXSSAttempts = 5;
    let parsedHtml = unsafeHtml;

    do {
      if (mXSSAttempts === 0) {
        throw new Error('Failed to sanitize html because the input is unstable');
      }
      mXSSAttempts--;

      unsafeHtml = parsedHtml;
      DOM.setInnerHTML(containerEl, unsafeHtml);
      if ((DOM.defaultDoc() as any).documentMode) {
        // strip custom-namespaced attributes on IE<=11
        stripCustomNsAttrs(containerEl);
      }
      parsedHtml = DOM.getInnerHTML(containerEl);
    } while (unsafeHtml !== parsedHtml);

    let sanitizer = new SanitizingHtmlSerializer();
    let safeHtml = sanitizer.sanitizeChildren(DOM.getTemplateContent(containerEl) || containerEl);

    // Clear out the body element.
    let parent = DOM.getTemplateContent(containerEl) || containerEl;
    for (let child of DOM.childNodesAsList(parent)) {
      DOM.removeChild(parent, child);
    }

    if (isDevMode() && safeHtml !== unsafeHtml) {
      DOM.log('WARNING: sanitizing HTML stripped some content.');
    }

    return safeHtml;
  } catch (e) {
    // In case anything goes wrong, clear out inertElement to reset the entire DOM structure.
    inertElement = null;
    throw e;
  }
}
