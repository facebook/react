/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

const cachedStyleNameToValueMap: Map<string, string> = new Map();

export function getStyleXValues(data: any, mappedStyles: Object = {}) {
  if (Array.isArray(data)) {
    data.forEach(entry => {
      if (Array.isArray(entry)) {
        getStyleXValues(entry, mappedStyles);
      } else {
        crawlObjectProperties(entry, mappedStyles);
      }
    });
  } else {
    crawlObjectProperties(data, mappedStyles);
  }

  return Object.fromEntries<string, any>(Object.entries(mappedStyles).sort());
}

function crawlObjectProperties(entry: Object, mappedStyles: Object) {
  const keys = Object.keys(entry);
  keys.forEach(key => {
    const value = entry[key];
    if (typeof value === 'string') {
      mappedStyles[key] = getPropertyValueForStyleName(value);
    } else {
      const nestedStyle = {};
      mappedStyles[key] = nestedStyle;
      getStyleXValues([value], nestedStyle);
    }
  });
}

function getPropertyValueForStyleName(styleName: string): string | null {
  if (cachedStyleNameToValueMap.has(styleName)) {
    return ((cachedStyleNameToValueMap.get(styleName): any): string);
  }

  for (
    let styleSheetIndex = 0;
    styleSheetIndex < document.styleSheets.length;
    styleSheetIndex++
  ) {
    const styleSheet = ((document.styleSheets[
      styleSheetIndex
    ]: any): CSSStyleSheet);
    // $FlowFixMe Flow doesn't konw about these properties
    const rules = styleSheet.rules || styleSheet.cssRules;
    for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex++) {
      const rule = rules[ruleIndex];
      // $FlowFixMe Flow doesn't konw about these properties
      const {cssText, selectorText, style} = rule;

      if (selectorText != null) {
        if (selectorText.startsWith(`.${styleName}`)) {
          const match = cssText.match(/{ *([a-z\-]+):/);
          if (match !== null) {
            const property = match[1];
            const value = style.getPropertyValue(property);

            cachedStyleNameToValueMap.set(styleName, value);

            return value;
          } else {
            return null;
          }
        }
      }
    }
  }

  return null;
}
