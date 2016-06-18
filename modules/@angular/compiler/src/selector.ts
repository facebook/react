import {ListWrapper, Map} from '../src/facade/collection';
import {BaseException} from '../src/facade/exceptions';
import {RegExpMatcherWrapper, RegExpWrapper, StringWrapper, isBlank, isPresent} from '../src/facade/lang';

const _EMPTY_ATTR_VALUE = /*@ts2dart_const*/ '';

// TODO: Can't use `const` here as
// in Dart this is not transpiled into `final` yet...
var _SELECTOR_REGEXP = RegExpWrapper.create(
    '(\\:not\\()|' +                          //":not("
    '([-\\w]+)|' +                            // "tag"
    '(?:\\.([-\\w]+))|' +                     // ".class"
    '(?:\\[([-\\w*]+)(?:=([^\\]]*))?\\])|' +  // "[name]", "[name=value]" or "[name*=value]"
    '(\\))|' +                                // ")"
    '(\\s*,\\s*)');                           // ","

/**
 * A css selector contains an element name,
 * css classes and attribute/value pairs with the purpose
 * of selecting subsets out of them.
 */
export class CssSelector {
  element: string = null;
  classNames: string[] = [];
  attrs: string[] = [];
  notSelectors: CssSelector[] = [];

  static parse(selector: string): CssSelector[] {
    var results: CssSelector[] = [];
    var _addResult = (res: CssSelector[], cssSel: CssSelector) => {
      if (cssSel.notSelectors.length > 0 && isBlank(cssSel.element) &&
          ListWrapper.isEmpty(cssSel.classNames) && ListWrapper.isEmpty(cssSel.attrs)) {
        cssSel.element = '*';
      }
      res.push(cssSel);
    };
    var cssSelector = new CssSelector();
    var matcher = RegExpWrapper.matcher(_SELECTOR_REGEXP, selector);
    var match: string[];
    var current = cssSelector;
    var inNot = false;
    while (isPresent(match = RegExpMatcherWrapper.next(matcher))) {
      if (isPresent(match[1])) {
        if (inNot) {
          throw new BaseException('Nesting :not is not allowed in a selector');
        }
        inNot = true;
        current = new CssSelector();
        cssSelector.notSelectors.push(current);
      }
      if (isPresent(match[2])) {
        current.setElement(match[2]);
      }
      if (isPresent(match[3])) {
        current.addClassName(match[3]);
      }
      if (isPresent(match[4])) {
        current.addAttribute(match[4], match[5]);
      }
      if (isPresent(match[6])) {
        inNot = false;
        current = cssSelector;
      }
      if (isPresent(match[7])) {
        if (inNot) {
          throw new BaseException('Multiple selectors in :not are not supported');
        }
        _addResult(results, cssSelector);
        cssSelector = current = new CssSelector();
      }
    }
    _addResult(results, cssSelector);
    return results;
  }

  isElementSelector(): boolean {
    return isPresent(this.element) && ListWrapper.isEmpty(this.classNames) &&
        ListWrapper.isEmpty(this.attrs) && this.notSelectors.length === 0;
  }

  setElement(element: string = null) { this.element = element; }

  /** Gets a template string for an element that matches the selector. */
  getMatchingElementTemplate(): string {
    let tagName = isPresent(this.element) ? this.element : 'div';
    let classAttr = this.classNames.length > 0 ? ` class="${this.classNames.join(' ')}"` : '';

    let attrs = '';
    for (let i = 0; i < this.attrs.length; i += 2) {
      let attrName = this.attrs[i];
      let attrValue = this.attrs[i + 1] !== '' ? `="${this.attrs[i + 1]}"` : '';
      attrs += ` ${attrName}${attrValue}`;
    }

    return `<${tagName}${classAttr}${attrs}></${tagName}>`;
  }

  addAttribute(name: string, value: string = _EMPTY_ATTR_VALUE) {
    this.attrs.push(name);
    if (isPresent(value)) {
      value = value.toLowerCase();
    } else {
      value = _EMPTY_ATTR_VALUE;
    }
    this.attrs.push(value);
  }

  addClassName(name: string) { this.classNames.push(name.toLowerCase()); }

  toString(): string {
    var res = '';
    if (isPresent(this.element)) {
      res += this.element;
    }
    if (isPresent(this.classNames)) {
      for (var i = 0; i < this.classNames.length; i++) {
        res += '.' + this.classNames[i];
      }
    }
    if (isPresent(this.attrs)) {
      for (var i = 0; i < this.attrs.length;) {
        var attrName = this.attrs[i++];
        var attrValue = this.attrs[i++];
        res += '[' + attrName;
        if (attrValue.length > 0) {
          res += '=' + attrValue;
        }
        res += ']';
      }
    }
    this.notSelectors.forEach(notSelector => res += `:not(${notSelector})`);
    return res;
  }
}

/**
 * Reads a list of CssSelectors and allows to calculate which ones
 * are contained in a given CssSelector.
 */
export class SelectorMatcher {
  static createNotMatcher(notSelectors: CssSelector[]): SelectorMatcher {
    var notMatcher = new SelectorMatcher();
    notMatcher.addSelectables(notSelectors, null);
    return notMatcher;
  }

  private _elementMap = new Map<string, SelectorContext[]>();
  private _elementPartialMap = new Map<string, SelectorMatcher>();
  private _classMap = new Map<string, SelectorContext[]>();
  private _classPartialMap = new Map<string, SelectorMatcher>();
  private _attrValueMap = new Map<string, Map<string, SelectorContext[]>>();
  private _attrValuePartialMap = new Map<string, Map<string, SelectorMatcher>>();
  private _listContexts: SelectorListContext[] = [];

  addSelectables(cssSelectors: CssSelector[], callbackCtxt?: any) {
    var listContext: SelectorListContext = null;
    if (cssSelectors.length > 1) {
      listContext = new SelectorListContext(cssSelectors);
      this._listContexts.push(listContext);
    }
    for (var i = 0; i < cssSelectors.length; i++) {
      this._addSelectable(cssSelectors[i], callbackCtxt, listContext);
    }
  }

  /**
   * Add an object that can be found later on by calling `match`.
   * @param cssSelector A css selector
   * @param callbackCtxt An opaque object that will be given to the callback of the `match` function
   */
  private _addSelectable(
      cssSelector: CssSelector, callbackCtxt: any, listContext: SelectorListContext) {
    var matcher: SelectorMatcher = this;
    var element = cssSelector.element;
    var classNames = cssSelector.classNames;
    var attrs = cssSelector.attrs;
    var selectable = new SelectorContext(cssSelector, callbackCtxt, listContext);

    if (isPresent(element)) {
      var isTerminal = attrs.length === 0 && classNames.length === 0;
      if (isTerminal) {
        this._addTerminal(matcher._elementMap, element, selectable);
      } else {
        matcher = this._addPartial(matcher._elementPartialMap, element);
      }
    }

    if (isPresent(classNames)) {
      for (var index = 0; index < classNames.length; index++) {
        var isTerminal = attrs.length === 0 && index === classNames.length - 1;
        var className = classNames[index];
        if (isTerminal) {
          this._addTerminal(matcher._classMap, className, selectable);
        } else {
          matcher = this._addPartial(matcher._classPartialMap, className);
        }
      }
    }

    if (isPresent(attrs)) {
      for (var index = 0; index < attrs.length;) {
        var isTerminal = index === attrs.length - 2;
        var attrName = attrs[index++];
        var attrValue = attrs[index++];
        if (isTerminal) {
          var terminalMap = matcher._attrValueMap;
          var terminalValuesMap = terminalMap.get(attrName);
          if (isBlank(terminalValuesMap)) {
            terminalValuesMap = new Map<string, SelectorContext[]>();
            terminalMap.set(attrName, terminalValuesMap);
          }
          this._addTerminal(terminalValuesMap, attrValue, selectable);
        } else {
          var parttialMap = matcher._attrValuePartialMap;
          var partialValuesMap = parttialMap.get(attrName);
          if (isBlank(partialValuesMap)) {
            partialValuesMap = new Map<string, SelectorMatcher>();
            parttialMap.set(attrName, partialValuesMap);
          }
          matcher = this._addPartial(partialValuesMap, attrValue);
        }
      }
    }
  }

  private _addTerminal(
      map: Map<string, SelectorContext[]>, name: string, selectable: SelectorContext) {
    var terminalList = map.get(name);
    if (isBlank(terminalList)) {
      terminalList = [];
      map.set(name, terminalList);
    }
    terminalList.push(selectable);
  }

  private _addPartial(map: Map<string, SelectorMatcher>, name: string): SelectorMatcher {
    var matcher = map.get(name);
    if (isBlank(matcher)) {
      matcher = new SelectorMatcher();
      map.set(name, matcher);
    }
    return matcher;
  }

  /**
   * Find the objects that have been added via `addSelectable`
   * whose css selector is contained in the given css selector.
   * @param cssSelector A css selector
   * @param matchedCallback This callback will be called with the object handed into `addSelectable`
   * @return boolean true if a match was found
  */
  match(cssSelector: CssSelector, matchedCallback: (c: CssSelector, a: any) => void): boolean {
    var result = false;
    var element = cssSelector.element;
    var classNames = cssSelector.classNames;
    var attrs = cssSelector.attrs;

    for (var i = 0; i < this._listContexts.length; i++) {
      this._listContexts[i].alreadyMatched = false;
    }

    result = this._matchTerminal(this._elementMap, element, cssSelector, matchedCallback) || result;
    result = this._matchPartial(this._elementPartialMap, element, cssSelector, matchedCallback) ||
        result;

    if (isPresent(classNames)) {
      for (var index = 0; index < classNames.length; index++) {
        var className = classNames[index];
        result =
            this._matchTerminal(this._classMap, className, cssSelector, matchedCallback) || result;
        result =
            this._matchPartial(this._classPartialMap, className, cssSelector, matchedCallback) ||
            result;
      }
    }

    if (isPresent(attrs)) {
      for (var index = 0; index < attrs.length;) {
        var attrName = attrs[index++];
        var attrValue = attrs[index++];

        var terminalValuesMap = this._attrValueMap.get(attrName);
        if (!StringWrapper.equals(attrValue, _EMPTY_ATTR_VALUE)) {
          result = this._matchTerminal(
                       terminalValuesMap, _EMPTY_ATTR_VALUE, cssSelector, matchedCallback) ||
              result;
        }
        result = this._matchTerminal(terminalValuesMap, attrValue, cssSelector, matchedCallback) ||
            result;

        var partialValuesMap = this._attrValuePartialMap.get(attrName);
        if (!StringWrapper.equals(attrValue, _EMPTY_ATTR_VALUE)) {
          result = this._matchPartial(
                       partialValuesMap, _EMPTY_ATTR_VALUE, cssSelector, matchedCallback) ||
              result;
        }
        result =
            this._matchPartial(partialValuesMap, attrValue, cssSelector, matchedCallback) || result;
      }
    }
    return result;
  }

  /** @internal */
  _matchTerminal(
      map: Map<string, SelectorContext[]>, name: string, cssSelector: CssSelector,
      matchedCallback: (c: CssSelector, a: any) => void): boolean {
    if (isBlank(map) || isBlank(name)) {
      return false;
    }

    var selectables = map.get(name);
    var starSelectables = map.get('*');
    if (isPresent(starSelectables)) {
      selectables = selectables.concat(starSelectables);
    }
    if (isBlank(selectables)) {
      return false;
    }
    var selectable: SelectorContext;
    var result = false;
    for (var index = 0; index < selectables.length; index++) {
      selectable = selectables[index];
      result = selectable.finalize(cssSelector, matchedCallback) || result;
    }
    return result;
  }

  /** @internal */
  _matchPartial(
      map: Map<string, SelectorMatcher>, name: string, cssSelector: CssSelector,
      matchedCallback: (c: CssSelector, a: any) => void): boolean {
    if (isBlank(map) || isBlank(name)) {
      return false;
    }
    var nestedSelector = map.get(name);
    if (isBlank(nestedSelector)) {
      return false;
    }
    // TODO(perf): get rid of recursion and measure again
    // TODO(perf): don't pass the whole selector into the recursion,
    // but only the not processed parts
    return nestedSelector.match(cssSelector, matchedCallback);
  }
}


export class SelectorListContext {
  alreadyMatched: boolean = false;

  constructor(public selectors: CssSelector[]) {}
}

// Store context to pass back selector and context when a selector is matched
export class SelectorContext {
  notSelectors: CssSelector[];

  constructor(
      public selector: CssSelector, public cbContext: any,
      public listContext: SelectorListContext) {
    this.notSelectors = selector.notSelectors;
  }

  finalize(cssSelector: CssSelector, callback: (c: CssSelector, a: any) => void): boolean {
    var result = true;
    if (this.notSelectors.length > 0 &&
        (isBlank(this.listContext) || !this.listContext.alreadyMatched)) {
      var notMatcher = SelectorMatcher.createNotMatcher(this.notSelectors);
      result = !notMatcher.match(cssSelector, null);
    }
    if (result && isPresent(callback) &&
        (isBlank(this.listContext) || !this.listContext.alreadyMatched)) {
      if (isPresent(this.listContext)) {
        this.listContext.alreadyMatched = true;
      }
      callback(this.selector, this.cbContext);
    }
    return result;
  }
}
