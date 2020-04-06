/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

function prettifyCssPropertyName(cssPropertyName: string): string {
  const resultArray = [];
  let wordStartIndex = 0;

  for (let i = 1; i < cssPropertyName.length; i++) {
    const ch = cssPropertyName.charAt(i);
    if (ch === ch.toUpperCase()) {
      resultArray.push(cssPropertyName.substring(wordStartIndex, i).toLowerCase());
      wordStartIndex = i;
    }
  }

  resultArray.push(cssPropertyName.substring(wordStartIndex, cssPropertyName.length).toLowerCase());

  const resultString = resultArray.join('-');
  const firstChar = cssPropertyName.charAt(0);
  return firstChar === firstChar.toUpperCase() ? '-' + resultString : resultString;
}


/**
 * Converts given style object to object to style string.
 * If given object is <code>null</code> or <code>undefined</code> returns empty string.
 * Example:
 * <pre>
 *   const styleObj = {marginTop: '1px', WebkitLineClamp: 5}
 *   const str = createDangerousStringForStyles(styleObj);
 *   str === "margin-top: '1px'; -webkit-line-clamp: 5;"
 * </pre>
 * All properties written in camelCase will be converted
 * to ones divided with dashes.
 * <br>
 * All properties written in UpperCamelCase will be converted
 * to ones divided with dashed and starting with one dash (see example above).
 * <br>
 * Note that all values will be kept as they have been declared in the object.
 * @param styleObject {Object}
 * @returns {string}
 */
export default function createDangerousStringForStyles(styleObject: Object): string {
  if (!styleObject) {
    return '';
  }
  return Object.entries(styleObject)
    .map(entry => {
      const cssPropertyName = entry[0];
      const value = entry[1];
      const prettifiedProperty = prettifyCssPropertyName(cssPropertyName);
      return `${prettifiedProperty}: ${value};`;
    })
    .join(' ');
}
