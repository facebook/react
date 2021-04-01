/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';

import {Children} from 'react';

import {enableFilterEmptyStringAttributesDOM} from 'shared/ReactFeatureFlags';

import type {
  Destination,
  Chunk,
  PrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

import {
  writeChunk,
  stringToChunk,
  stringToPrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

import {
  getPropertyInfo,
  isAttributeNameSafe,
  BOOLEAN,
  OVERLOADED_BOOLEAN,
  NUMERIC,
  POSITIVE_NUMERIC,
} from '../shared/DOMProperty';
import {isUnitlessNumber} from '../shared/CSSProperty';

import {checkControlledValueProps} from '../shared/ReactControlledValuePropTypes';
import {validateProperties as validateARIAProperties} from '../shared/ReactDOMInvalidARIAHook';
import {validateProperties as validateInputProperties} from '../shared/ReactDOMNullInputValuePropHook';
import {validateProperties as validateUnknownProperties} from '../shared/ReactDOMUnknownPropertyHook';
import warnValidStyle from '../shared/warnValidStyle';

import escapeTextForBrowser from './escapeTextForBrowser';
import hyphenateStyleName from '../shared/hyphenateStyleName';
import invariant from 'shared/invariant';
import hasOwnProperty from 'shared/hasOwnProperty';
import sanitizeURL from '../shared/sanitizeURL';

const isArray = Array.isArray;

// Per response, global state that is not contextual to the rendering subtree.
export type ResponseState = {
  placeholderPrefix: PrecomputedChunk,
  segmentPrefix: PrecomputedChunk,
  boundaryPrefix: string,
  opaqueIdentifierPrefix: PrecomputedChunk,
  nextSuspenseID: number,
  sentCompleteSegmentFunction: boolean,
  sentCompleteBoundaryFunction: boolean,
  sentClientRenderFunction: boolean,
};

// Allows us to keep track of what we've already written so we can refer back to it.
export function createResponseState(
  identifierPrefix: string = '',
): ResponseState {
  return {
    placeholderPrefix: stringToPrecomputedChunk(identifierPrefix + 'P:'),
    segmentPrefix: stringToPrecomputedChunk(identifierPrefix + 'S:'),
    boundaryPrefix: identifierPrefix + 'B:',
    opaqueIdentifierPrefix: stringToPrecomputedChunk(identifierPrefix + 'R:'),
    nextSuspenseID: 0,
    sentCompleteSegmentFunction: false,
    sentCompleteBoundaryFunction: false,
    sentClientRenderFunction: false,
  };
}

// Constants for the insertion mode we're currently writing in. We don't encode all HTML5 insertion
// modes. We only include the variants as they matter for the sake of our purposes.
// We don't actually provide the namespace therefore we use constants instead of the string.
const HTML_MODE = 0;
const SVG_MODE = 1;
const MATHML_MODE = 2;
const HTML_TABLE_MODE = 4;
const HTML_TABLE_BODY_MODE = 5;
const HTML_TABLE_ROW_MODE = 6;
const HTML_COLGROUP_MODE = 7;
// We have a greater than HTML_TABLE_MODE check elsewhere. If you add more cases here, make sure it
// still makes sense

type InsertionMode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Lets us keep track of contextual state and pick it back up after suspending.
export type FormatContext = {
  insertionMode: InsertionMode, // root/svg/html/mathml/table
  selectedValue: null | string | Array<string>, // the selected value(s) inside a <select>, or null outside <select>
};

function createFormatContext(
  insertionMode: InsertionMode,
  selectedValue: null | string,
): FormatContext {
  return {
    insertionMode,
    selectedValue,
  };
}

export function createRootFormatContext(namespaceURI?: string): FormatContext {
  const insertionMode =
    namespaceURI === 'http://www.w3.org/2000/svg'
      ? SVG_MODE
      : namespaceURI === 'http://www.w3.org/1998/Math/MathML'
      ? MATHML_MODE
      : HTML_MODE;
  return createFormatContext(insertionMode, null);
}

export function getChildFormatContext(
  parentContext: FormatContext,
  type: string,
  props: Object,
): FormatContext {
  switch (type) {
    case 'select':
      return createFormatContext(
        HTML_MODE,
        props.value != null ? props.value : props.defaultValue,
      );
    case 'svg':
      return createFormatContext(SVG_MODE, null);
    case 'math':
      return createFormatContext(MATHML_MODE, null);
    case 'foreignObject':
      return createFormatContext(HTML_MODE, null);
    // Table parents are special in that their children can only be created at all if they're
    // wrapped in a table parent. So we need to encode that we're entering this mode.
    case 'table':
      return createFormatContext(HTML_TABLE_MODE, null);
    case 'thead':
    case 'tbody':
    case 'tfoot':
      return createFormatContext(HTML_TABLE_BODY_MODE, null);
    case 'colgroup':
      return createFormatContext(HTML_COLGROUP_MODE, null);
    case 'tr':
      return createFormatContext(HTML_TABLE_ROW_MODE, null);
  }
  if (parentContext.insertionMode >= HTML_TABLE_MODE) {
    // Whatever tag this was, it wasn't a table parent or other special parent, so we must have
    // entered plain HTML again.
    return createFormatContext(HTML_MODE, null);
  }
  return parentContext;
}

// This object is used to lazily reuse the ID of the first generated node, or assign one.
// We can't assign an ID up front because the node we're attaching it to might already
// have one. So we need to lazily use that if it's available.
export type SuspenseBoundaryID = {
  formattedID: null | PrecomputedChunk,
};

export function createSuspenseBoundaryID(
  responseState: ResponseState,
): SuspenseBoundaryID {
  return {formattedID: null};
}

function encodeHTMLTextNode(text: string): string {
  return escapeTextForBrowser(text);
}

function assignAnID(
  responseState: ResponseState,
  id: SuspenseBoundaryID,
): PrecomputedChunk {
  // TODO: This approach doesn't yield deterministic results since this is assigned during render.
  const generatedID = responseState.nextSuspenseID++;
  return (id.formattedID = stringToPrecomputedChunk(
    responseState.boundaryPrefix + generatedID.toString(16),
  ));
}

const dummyNode1 = stringToPrecomputedChunk('<template id="');
const dummyNode2 = stringToPrecomputedChunk('"></template>');

function pushDummyNodeWithID(
  target: Array<Chunk | PrecomputedChunk>,
  responseState: ResponseState,
  assignID: SuspenseBoundaryID,
): void {
  const id = assignAnID(responseState, assignID);
  target.push(dummyNode1, id, dummyNode2);
}

export function pushEmpty(
  target: Array<Chunk | PrecomputedChunk>,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
): void {
  if (assignID !== null) {
    pushDummyNodeWithID(target, responseState, assignID);
  }
}

const textSeparator = stringToPrecomputedChunk('<!-- -->');

export function pushTextInstance(
  target: Array<Chunk | PrecomputedChunk>,
  text: string,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
): void {
  if (assignID !== null) {
    pushDummyNodeWithID(target, responseState, assignID);
  }
  if (text === '') {
    // Empty text doesn't have a DOM node representation and the hydration is aware of this.
    return;
  }
  // TODO: Avoid adding a text separator in common cases.
  target.push(stringToChunk(encodeHTMLTextNode(text)), textSeparator);
}

const styleNameCache: Map<string, PrecomputedChunk> = new Map();
function processStyleName(styleName: string): PrecomputedChunk {
  const chunk = styleNameCache.get(styleName);
  if (chunk !== undefined) {
    return chunk;
  }
  const result = stringToPrecomputedChunk(
    escapeTextForBrowser(hyphenateStyleName(styleName)),
  );
  styleNameCache.set(styleName, result);
  return result;
}

const styleAttributeStart = stringToPrecomputedChunk(' style="');
const styleAssign = stringToPrecomputedChunk(':');
const styleSeparator = stringToPrecomputedChunk(';');

function pushStyle(
  target: Array<Chunk | PrecomputedChunk>,
  responseState: ResponseState,
  style: Object,
): void {
  invariant(
    typeof style === 'object',
    'The `style` prop expects a mapping from style properties to values, ' +
      "not a string. For example, style={{marginRight: spacing + 'em'}} when " +
      'using JSX.',
  );

  let isFirst = true;
  for (const styleName in style) {
    if (!hasOwnProperty.call(style, styleName)) {
      continue;
    }
    // If you provide unsafe user data here they can inject arbitrary CSS
    // which may be problematic (I couldn't repro this):
    // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
    // http://www.thespanner.co.uk/2007/11/26/ultimate-xss-css-injection/
    // This is not an XSS hole but instead a potential CSS injection issue
    // which has lead to a greater discussion about how we're going to
    // trust URLs moving forward. See #2115901
    const styleValue = style[styleName];
    if (
      styleValue == null ||
      typeof styleValue === 'boolean' ||
      styleValue === ''
    ) {
      // TODO: We used to set empty string as a style with an empty value. Does that ever make sense?
      continue;
    }

    let nameChunk;
    let valueChunk;
    const isCustomProperty = styleName.indexOf('--') === 0;
    if (isCustomProperty) {
      nameChunk = stringToChunk(escapeTextForBrowser(styleName));
      valueChunk = stringToChunk(
        escapeTextForBrowser(('' + styleValue).trim()),
      );
    } else {
      if (__DEV__) {
        warnValidStyle(styleName, styleValue);
      }

      nameChunk = processStyleName(styleName);
      if (typeof styleValue === 'number') {
        if (
          styleValue !== 0 &&
          !hasOwnProperty.call(isUnitlessNumber, styleName)
        ) {
          valueChunk = stringToChunk(styleValue + 'px'); // Presumes implicit 'px' suffix for unitless numbers
        } else {
          valueChunk = stringToChunk('' + styleValue);
        }
      } else {
        valueChunk = stringToChunk(('' + styleValue).trim());
      }
    }
    if (isFirst) {
      isFirst = false;
      // If it's first, we don't need any separators prefixed.
      target.push(styleAttributeStart, nameChunk, styleAssign, valueChunk);
    } else {
      target.push(styleSeparator, nameChunk, styleAssign, valueChunk);
    }
  }
  if (!isFirst) {
    target.push(attributeEnd);
  }
}

const attributeSeparator = stringToPrecomputedChunk(' ');
const attributeAssign = stringToPrecomputedChunk('="');
const attributeEnd = stringToPrecomputedChunk('"');
const attributeEmptyString = stringToPrecomputedChunk('=""');

function pushAttribute(
  target: Array<Chunk | PrecomputedChunk>,
  responseState: ResponseState,
  name: string,
  value: string | boolean | number | Function | Object, // not null or undefined
): void {
  switch (name) {
    case 'style': {
      pushStyle(target, responseState, value);
      return;
    }
    case 'defaultValue':
    case 'defaultChecked': // These shouldn't be set as attributes on generic HTML elements.
    case 'innerHTML': // Must use dangerouslySetInnerHTML instead.
    case 'suppressContentEditableWarning':
    case 'suppressHydrationWarning':
      // Ignored. These are built-in to React on the client.
      return;
  }
  if (
    // shouldIgnoreAttribute
    // We have already filtered out null/undefined and reserved words.
    name.length > 2 &&
    (name[0] === 'o' || name[0] === 'O') &&
    (name[1] === 'n' || name[1] === 'N')
  ) {
    return;
  }

  const propertyInfo = getPropertyInfo(name);
  if (propertyInfo !== null) {
    // shouldRemoveAttribute
    switch (typeof value) {
      case 'function':
      // $FlowIssue symbol is perfectly valid here
      case 'symbol': // eslint-disable-line
        return;
      case 'boolean': {
        if (!propertyInfo.acceptsBooleans) {
          return;
        }
      }
    }
    if (enableFilterEmptyStringAttributesDOM) {
      if (propertyInfo.removeEmptyString && value === '') {
        if (__DEV__) {
          if (name === 'src') {
            console.error(
              'An empty string ("") was passed to the %s attribute. ' +
                'This may cause the browser to download the whole page again over the network. ' +
                'To fix this, either do not render the element at all ' +
                'or pass null to %s instead of an empty string.',
              name,
              name,
            );
          } else {
            console.error(
              'An empty string ("") was passed to the %s attribute. ' +
                'To fix this, either do not render the element at all ' +
                'or pass null to %s instead of an empty string.',
              name,
              name,
            );
          }
        }
        return;
      }
    }

    const attributeName = propertyInfo.attributeName;
    const attributeNameChunk = stringToChunk(attributeName); // TODO: If it's known we can cache the chunk.

    switch (propertyInfo.type) {
      case BOOLEAN:
        if (value) {
          target.push(
            attributeSeparator,
            attributeNameChunk,
            attributeEmptyString,
          );
        }
        return;
      case OVERLOADED_BOOLEAN:
        if (value === true) {
          target.push(
            attributeSeparator,
            attributeNameChunk,
            attributeEmptyString,
          );
        } else if (value === false) {
          // Ignored
        } else {
          target.push(
            attributeSeparator,
            attributeNameChunk,
            attributeAssign,
            escapeTextForBrowser(value),
            attributeEnd,
          );
        }
        return;
      case NUMERIC:
        if (!isNaN(value)) {
          target.push(
            attributeSeparator,
            attributeNameChunk,
            attributeAssign,
            escapeTextForBrowser(value),
            attributeEnd,
          );
        }
        break;
      case POSITIVE_NUMERIC:
        if (!isNaN(value) && (value: any) >= 1) {
          target.push(
            attributeSeparator,
            attributeNameChunk,
            attributeAssign,
            escapeTextForBrowser(value),
            attributeEnd,
          );
        }
        break;
      default:
        if (propertyInfo.sanitizeURL) {
          value = '' + (value: any);
          sanitizeURL(value);
        }
        target.push(
          attributeSeparator,
          attributeNameChunk,
          attributeAssign,
          escapeTextForBrowser(value),
          attributeEnd,
        );
    }
  } else if (isAttributeNameSafe(name)) {
    // shouldRemoveAttribute
    switch (typeof value) {
      case 'function':
      // $FlowIssue symbol is perfectly valid here
      case 'symbol': // eslint-disable-line
        return;
      case 'boolean': {
        const prefix = name.toLowerCase().slice(0, 5);
        if (prefix !== 'data-' && prefix !== 'aria-') {
          return;
        }
      }
    }
    target.push(
      attributeSeparator,
      stringToChunk(name),
      attributeAssign,
      escapeTextForBrowser(value),
      attributeEnd,
    );
  }
}

const endOfStartTag = stringToPrecomputedChunk('>');
const endOfStartTagSelfClosing = stringToPrecomputedChunk('/>');

const idAttr = stringToPrecomputedChunk(' id="');
const attrEnd = stringToPrecomputedChunk('"');

function pushID(
  target: Array<Chunk | PrecomputedChunk>,
  responseState: ResponseState,
  assignID: SuspenseBoundaryID,
  existingID: mixed,
): void {
  if (
    existingID !== null &&
    existingID !== undefined &&
    (typeof existingID === 'string' || typeof existingID === 'object')
  ) {
    // We can reuse the existing ID for our purposes.
    assignID.formattedID = stringToPrecomputedChunk(
      escapeTextForBrowser(existingID),
    );
  } else {
    const encodedID = assignAnID(responseState, assignID);
    target.push(idAttr, encodedID, attrEnd);
  }
}

function pushInnerHTML(
  target: Array<Chunk | PrecomputedChunk>,
  innerHTML,
  children,
) {
  if (innerHTML != null) {
    invariant(
      children == null,
      'Can only set one of `children` or `props.dangerouslySetInnerHTML`.',
    );

    invariant(
      typeof innerHTML === 'object' && '__html' in innerHTML,
      '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
        'Please visit https://reactjs.org/link/dangerously-set-inner-html ' +
        'for more information.',
    );
    const html = innerHTML.__html;
    target.push(stringToChunk(html));
  }
}

// TODO: Move these to ResponseState so that we warn for every request.
// It would help debugging in stateful servers (e.g. service worker).
let didWarnDefaultInputValue = false;
let didWarnDefaultChecked = false;
let didWarnDefaultSelectValue = false;
let didWarnDefaultTextareaValue = false;
let didWarnInvalidOptionChildren = false;
let didWarnSelectedSetOnOption = false;

function checkSelectProp(props, propName) {
  if (__DEV__) {
    const array = isArray(props[propName]);
    if (props.multiple && !array) {
      console.error(
        'The `%s` prop supplied to <select> must be an array if ' +
          '`multiple` is true.',
        propName,
      );
    } else if (!props.multiple && array) {
      console.error(
        'The `%s` prop supplied to <select> must be a scalar ' +
          'value if `multiple` is false.',
        propName,
      );
    }
  }
}

function pushStartSelect(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
): ReactNodeList {
  if (__DEV__) {
    checkControlledValueProps('select', props);

    checkSelectProp(props, 'value');
    checkSelectProp(props, 'defaultValue');

    if (
      props.value !== undefined &&
      props.defaultValue !== undefined &&
      !didWarnDefaultSelectValue
    ) {
      console.error(
        'Select elements must be either controlled or uncontrolled ' +
          '(specify either the value prop, or the defaultValue prop, but not ' +
          'both). Decide between using a controlled or uncontrolled select ' +
          'element and remove one of these props. More info: ' +
          'https://reactjs.org/link/controlled-components',
      );
      didWarnDefaultSelectValue = true;
    }
  }

  target.push(startChunkForTag('select'));

  let children = null;
  let innerHTML = null;
  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      switch (propKey) {
        case 'children':
          children = propValue;
          break;
        case 'dangerouslySetInnerHTML':
          // TODO: This doesn't really make sense for select since it can't use the controlled
          // value in the innerHTML.
          innerHTML = propValue;
          break;
        case 'defaultValue':
        case 'value':
          // These are set on the Context instead and applied to the nested options.
          break;
        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }
  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTag);
  pushInnerHTML(target, innerHTML, children);
  return children;
}

function flattenOptionChildren(children: mixed): string {
  let content = '';
  // Flatten children and warn if they aren't strings or numbers;
  // invalid types are ignored.
  Children.forEach((children: any), function(child) {
    if (child == null) {
      return;
    }
    content += (child: any);
    if (__DEV__) {
      if (
        !didWarnInvalidOptionChildren &&
        typeof child !== 'string' &&
        typeof child !== 'number'
      ) {
        didWarnInvalidOptionChildren = true;
        console.error(
          'Only strings and numbers are supported as <option> children.',
        );
      }
    }
  });
  return content;
}

const selectedMarkerAttribute = stringToPrecomputedChunk(' selected=""');

function pushStartOption(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  responseState: ResponseState,
  formatContext: FormatContext,
  assignID: null | SuspenseBoundaryID,
): ReactNodeList {
  const selectedValue = formatContext.selectedValue;

  target.push(startChunkForTag('option'));

  let children = null;
  let value = null;
  let selected = null;
  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      switch (propKey) {
        case 'children':
          children = propValue;
          break;
        case 'selected':
          // ignore
          selected = propValue;
          if (__DEV__) {
            // TODO: Remove support for `selected` in <option>.
            if (!didWarnSelectedSetOnOption) {
              console.error(
                'Use the `defaultValue` or `value` props on <select> instead of ' +
                  'setting `selected` on <option>.',
              );
              didWarnSelectedSetOnOption = true;
            }
          }
          break;
        case 'value':
          value = propValue;
          break;
        case 'dangerouslySetInnerHTML':
          invariant(
            false,
            '`dangerouslySetInnerHTML` does not work on <option>.',
          );
        // eslint-disable-next-line-no-fallthrough
        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  if (selectedValue !== null) {
    let stringValue;
    if (value !== null) {
      stringValue = '' + value;
    } else {
      stringValue = children = flattenOptionChildren(children);
    }
    if (isArray(selectedValue)) {
      // multiple
      for (let i = 0; i < selectedValue.length; i++) {
        const v = '' + selectedValue[i];
        if (v === stringValue) {
          target.push(selectedMarkerAttribute);
          break;
        }
      }
    } else if (selectedValue === stringValue) {
      target.push(selectedMarkerAttribute);
    }
  } else if (selected) {
    target.push(selectedMarkerAttribute);
  }

  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTag);
  return children;
}

function pushInput(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
): ReactNodeList {
  if (__DEV__) {
    checkControlledValueProps('input', props);

    if (
      props.checked !== undefined &&
      props.defaultChecked !== undefined &&
      !didWarnDefaultChecked
    ) {
      console.error(
        '%s contains an input of type %s with both checked and defaultChecked props. ' +
          'Input elements must be either controlled or uncontrolled ' +
          '(specify either the checked prop, or the defaultChecked prop, but not ' +
          'both). Decide between using a controlled or uncontrolled input ' +
          'element and remove one of these props. More info: ' +
          'https://reactjs.org/link/controlled-components',
        'A component',
        props.type,
      );
      didWarnDefaultChecked = true;
    }
    if (
      props.value !== undefined &&
      props.defaultValue !== undefined &&
      !didWarnDefaultInputValue
    ) {
      console.error(
        '%s contains an input of type %s with both value and defaultValue props. ' +
          'Input elements must be either controlled or uncontrolled ' +
          '(specify either the value prop, or the defaultValue prop, but not ' +
          'both). Decide between using a controlled or uncontrolled input ' +
          'element and remove one of these props. More info: ' +
          'https://reactjs.org/link/controlled-components',
        'A component',
        props.type,
      );
      didWarnDefaultInputValue = true;
    }
  }

  target.push(startChunkForTag('input'));

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      switch (propKey) {
        case 'children':
        case 'dangerouslySetInnerHTML':
          invariant(
            false,
            '%s is a self-closing tag and must neither have `children` nor ' +
              'use `dangerouslySetInnerHTML`.',
            'input',
          );
        // eslint-disable-next-line-no-fallthrough
        case 'defaultChecked':
          // Previously "checked" would win but now it's enumeration order dependent.
          // There's a warning in either case.
          pushAttribute(target, responseState, 'checked', propValue);
          break;
        case 'defaultValue':
          // Previously "value" would win but now it's enumeration order dependent.
          // There's a warning in either case.
          pushAttribute(target, responseState, 'value', propValue);
          break;
        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }
  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTagSelfClosing);
  return null;
}

function pushStartTextArea(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
): ReactNodeList {
  if (__DEV__) {
    checkControlledValueProps('textarea', props);
    if (
      props.value !== undefined &&
      props.defaultValue !== undefined &&
      !didWarnDefaultTextareaValue
    ) {
      console.error(
        'Textarea elements must be either controlled or uncontrolled ' +
          '(specify either the value prop, or the defaultValue prop, but not ' +
          'both). Decide between using a controlled or uncontrolled textarea ' +
          'and remove one of these props. More info: ' +
          'https://reactjs.org/link/controlled-components',
      );
      didWarnDefaultTextareaValue = true;
    }
  }

  target.push(startChunkForTag('textarea'));

  let value = null;
  let children = null;
  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      switch (propKey) {
        case 'children':
          children = propValue;
          break;
        case 'value':
        case 'defaultValue':
          // Previously "checked" would win but now it's enumeration order dependent.
          // There's a warning in either case.
          value = propValue;
          break;
        case 'dangerouslySetInnerHTML':
          invariant(
            false,
            '`dangerouslySetInnerHTML` does not make sense on <textarea>.',
          );
        // eslint-disable-next-line-no-fallthrough
        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }
  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTag);

  // TODO (yungsters): Remove support for children content in <textarea>.
  if (children != null) {
    if (__DEV__) {
      console.error(
        'Use the `defaultValue` or `value` props instead of setting ' +
          'children on <textarea>.',
      );
    }
    invariant(
      value == null,
      'If you supply `defaultValue` on a <textarea>, do not pass children.',
    );
    if (isArray(children)) {
      invariant(
        children.length <= 1,
        '<textarea> can only have at most one child.',
      );
      value = '' + children[0];
    }
    value = '' + children;
  }

  if (typeof value === 'string' && value[0] === '\n') {
    // text/html ignores the first character in these tags if it's a newline
    // Prefer to break application/xml over text/html (for now) by adding
    // a newline specifically to get eaten by the parser. (Alternately for
    // textareas, replacing "^\n" with "\r\n" doesn't get eaten, and the first
    // \r is normalized out by HTMLTextAreaElement#value.)
    // See: <http://www.w3.org/TR/html-polyglot/#newlines-in-textarea-and-pre>
    // See: <http://www.w3.org/TR/html5/syntax.html#element-restrictions>
    // See: <http://www.w3.org/TR/html5/syntax.html#newlines>
    // See: Parsing of "textarea" "listing" and "pre" elements
    //  from <http://www.w3.org/TR/html5/syntax.html#parsing-main-inbody>
    target.push(leadingNewline);
  }

  return value;
}

function pushSelfClosing(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  tag: string,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
): ReactNodeList {
  target.push(startChunkForTag(tag));

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      switch (propKey) {
        case 'children':
        case 'dangerouslySetInnerHTML':
          invariant(
            false,
            '%s is a self-closing tag and must neither have `children` nor ' +
              'use `dangerouslySetInnerHTML`.',
            tag,
          );
        // eslint-disable-next-line-no-fallthrough
        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }
  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTagSelfClosing);
  return null;
}

function pushStartMenuItem(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
): ReactNodeList {
  target.push(startChunkForTag('menuitem'));

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      switch (propKey) {
        case 'children':
        case 'dangerouslySetInnerHTML':
          invariant(
            false,
            'menuitems cannot have `children` nor `dangerouslySetInnerHTML`.',
          );
        // eslint-disable-next-line-no-fallthrough
        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }
  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTag);
  return null;
}

function pushStartGenericElement(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  tag: string,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
): ReactNodeList {
  target.push(startChunkForTag(tag));

  let children = null;
  let innerHTML = null;
  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      switch (propKey) {
        case 'children':
          children = propValue;
          break;
        case 'dangerouslySetInnerHTML':
          innerHTML = propValue;
          break;
        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }
  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTag);
  pushInnerHTML(target, innerHTML, children);
  return children;
}

function pushStartCustomElement(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  tag: string,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
): ReactNodeList {
  target.push(startChunkForTag(tag));

  let children = null;
  let innerHTML = null;
  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      switch (propKey) {
        case 'children':
          children = propValue;
          break;
        case 'dangerouslySetInnerHTML':
          innerHTML = propValue;
          break;
        case 'style':
          pushStyle(target, responseState, propValue);
          break;
        case 'suppressContentEditableWarning':
        case 'suppressHydrationWarning':
          // Ignored. These are built-in to React on the client.
          break;
        default:
          if (
            isAttributeNameSafe(propKey) &&
            typeof propValue !== 'function' &&
            typeof propValue !== 'symbol'
          ) {
            target.push(
              attributeSeparator,
              stringToChunk(propKey),
              attributeAssign,
              escapeTextForBrowser(propValue),
              attributeEnd,
            );
          }
          break;
      }
    }
  }
  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTag);
  pushInnerHTML(target, innerHTML, children);
  return children;
}

const leadingNewline = stringToPrecomputedChunk('\n');

function pushStartPreformattedElement(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  tag: string,
  responseState: ResponseState,
  assignID: null | SuspenseBoundaryID,
): ReactNodeList {
  target.push(startChunkForTag(tag));

  let children = null;
  let innerHTML = null;
  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      switch (propKey) {
        case 'children':
          children = propValue;
          break;
        case 'dangerouslySetInnerHTML':
          innerHTML = propValue;
          break;
        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }
  if (assignID !== null) {
    pushID(target, responseState, assignID, props.id);
  }

  target.push(endOfStartTag);

  // text/html ignores the first character in these tags if it's a newline
  // Prefer to break application/xml over text/html (for now) by adding
  // a newline specifically to get eaten by the parser. (Alternately for
  // textareas, replacing "^\n" with "\r\n" doesn't get eaten, and the first
  // \r is normalized out by HTMLTextAreaElement#value.)
  // See: <http://www.w3.org/TR/html-polyglot/#newlines-in-textarea-and-pre>
  // See: <http://www.w3.org/TR/html5/syntax.html#element-restrictions>
  // See: <http://www.w3.org/TR/html5/syntax.html#newlines>
  // See: Parsing of "textarea" "listing" and "pre" elements
  //  from <http://www.w3.org/TR/html5/syntax.html#parsing-main-inbody>
  // TODO: This doesn't deal with the case where the child is an array
  // or component that returns a string.
  if (innerHTML != null) {
    invariant(
      children == null,
      'Can only set one of `children` or `props.dangerouslySetInnerHTML`.',
    );

    invariant(
      typeof innerHTML === 'object' && '__html' in innerHTML,
      '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
        'Please visit https://reactjs.org/link/dangerously-set-inner-html ' +
        'for more information.',
    );
    const html = innerHTML.__html;
    if (typeof html === 'string' && html[0] === '\n') {
      target.push(leadingNewline);
    }
    target.push(stringToChunk(html));
  }
  if (typeof children === 'string' && children[0] === '\n') {
    target.push(leadingNewline);
  }
  return children;
}

// We accept any tag to be rendered but since this gets injected into arbitrary
// HTML, we want to make sure that it's a safe tag.
// http://www.w3.org/TR/REC-xml/#NT-Name
const VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/; // Simplified subset
const validatedTagCache = new Map();
function startChunkForTag(tag: string): PrecomputedChunk {
  let tagStartChunk = validatedTagCache.get(tag);
  if (tagStartChunk === undefined) {
    invariant(VALID_TAG_REGEX.test(tag), 'Invalid tag: %s', tag);
    tagStartChunk = stringToPrecomputedChunk('<' + tag);
    validatedTagCache.set(tag, tagStartChunk);
  }
  return tagStartChunk;
}

export function pushStartInstance(
  target: Array<Chunk | PrecomputedChunk>,
  type: string,
  props: Object,
  responseState: ResponseState,
  formatContext: FormatContext,
  assignID: null | SuspenseBoundaryID,
): ReactNodeList {
  if (__DEV__) {
    validateARIAProperties(type, props);
    validateInputProperties(type, props);
    validateUnknownProperties(type, props, null);

    if (
      !props.suppressContentEditableWarning &&
      props.contentEditable &&
      props.children != null
    ) {
      console.error(
        'A component is `contentEditable` and contains `children` managed by ' +
          'React. It is now your responsibility to guarantee that none of ' +
          'those nodes are unexpectedly modified or duplicated. This is ' +
          'probably not intentional.',
      );
    }

    if (
      formatContext.insertionMode !== SVG_MODE &&
      formatContext.insertionMode !== MATHML_MODE
    ) {
      if (
        type.indexOf('-') === -1 &&
        typeof props.is !== 'string' &&
        type.toLowerCase() !== type
      ) {
        console.error(
          '<%s /> is using incorrect casing. ' +
            'Use PascalCase for React components, ' +
            'or lowercase for HTML elements.',
          type,
        );
      }
    }
  }

  switch (type) {
    // Special tags
    case 'select':
      return pushStartSelect(target, props, responseState, assignID);
    case 'option':
      return pushStartOption(
        target,
        props,
        responseState,
        formatContext,
        assignID,
      );
    case 'textarea':
      return pushStartTextArea(target, props, responseState, assignID);
    case 'input':
      return pushInput(target, props, responseState, assignID);
    case 'menuitem':
      return pushStartMenuItem(target, props, responseState, assignID);
    // Newline eating tags
    case 'listing':
    case 'pre': {
      return pushStartPreformattedElement(
        target,
        props,
        type,
        responseState,
        assignID,
      );
    }
    // Omitted close tags
    case 'area':
    case 'base':
    case 'br':
    case 'col':
    case 'embed':
    case 'hr':
    case 'img':
    case 'keygen':
    case 'link':
    case 'meta':
    case 'param':
    case 'source':
    case 'track':
    case 'wbr': {
      return pushSelfClosing(target, props, type, responseState, assignID);
    }
    // These are reserved SVG and MathML elements, that are never custom elements.
    // https://w3c.github.io/webcomponents/spec/custom/#custom-elements-core-concepts
    case 'annotation-xml':
    case 'color-profile':
    case 'font-face':
    case 'font-face-src':
    case 'font-face-uri':
    case 'font-face-format':
    case 'font-face-name':
    case 'missing-glyph': {
      return pushStartGenericElement(
        target,
        props,
        type,
        responseState,
        assignID,
      );
    }
    default: {
      if (type.indexOf('-') === -1 && typeof props.is !== 'string') {
        // Generic element
        return pushStartGenericElement(
          target,
          props,
          type,
          responseState,
          assignID,
        );
      } else {
        // Custom element
        return pushStartCustomElement(
          target,
          props,
          type,
          responseState,
          assignID,
        );
      }
    }
  }
}

const endTag1 = stringToPrecomputedChunk('</');
const endTag2 = stringToPrecomputedChunk('>');

export function pushEndInstance(
  target: Array<Chunk | PrecomputedChunk>,
  type: string,
  props: Object,
): void {
  switch (type) {
    // Omitted close tags
    // TODO: Instead of repeating this switch we could try to pass a flag from above.
    // That would require returning a tuple. Which might be ok if it gets inlined.
    case 'area':
    case 'base':
    case 'br':
    case 'col':
    case 'embed':
    case 'hr':
    case 'img':
    case 'input':
    case 'keygen':
    case 'link':
    case 'meta':
    case 'param':
    case 'source':
    case 'track':
    case 'wbr': {
      // No close tag needed.
      break;
    }
    default: {
      target.push(endTag1, stringToChunk(type), endTag2);
    }
  }
}

// Structural Nodes

// A placeholder is a node inside a hidden partial tree that can be filled in later, but before
// display. It's never visible to users. We use the template tag because it can be used in every
// type of parent. <script> tags also work in every other tag except <colgroup>.
const placeholder1 = stringToPrecomputedChunk('<template id="');
const placeholder2 = stringToPrecomputedChunk('"></template>');
export function writePlaceholder(
  destination: Destination,
  responseState: ResponseState,
  id: number,
): boolean {
  writeChunk(destination, placeholder1);
  writeChunk(destination, responseState.placeholderPrefix);
  const formattedID = stringToChunk(id.toString(16));
  writeChunk(destination, formattedID);
  return writeChunk(destination, placeholder2);
}

// Suspense boundaries are encoded as comments.
const startCompletedSuspenseBoundary = stringToPrecomputedChunk('<!--$-->');
const startPendingSuspenseBoundary = stringToPrecomputedChunk('<!--$?-->');
const startClientRenderedSuspenseBoundary = stringToPrecomputedChunk(
  '<!--$!-->',
);
const endSuspenseBoundary = stringToPrecomputedChunk('<!--/$-->');

export function writeStartCompletedSuspenseBoundary(
  destination: Destination,
  id: SuspenseBoundaryID,
): boolean {
  return writeChunk(destination, startCompletedSuspenseBoundary);
}
export function writeStartPendingSuspenseBoundary(
  destination: Destination,
  id: SuspenseBoundaryID,
): boolean {
  return writeChunk(destination, startPendingSuspenseBoundary);
}
export function writeStartClientRenderedSuspenseBoundary(
  destination: Destination,
  id: SuspenseBoundaryID,
): boolean {
  return writeChunk(destination, startClientRenderedSuspenseBoundary);
}
export function writeEndSuspenseBoundary(destination: Destination): boolean {
  return writeChunk(destination, endSuspenseBoundary);
}

const startSegmentHTML = stringToPrecomputedChunk('<div hidden id="');
const startSegmentHTML2 = stringToPrecomputedChunk('">');
const endSegmentHTML = stringToPrecomputedChunk('</div>');

const startSegmentSVG = stringToPrecomputedChunk(
  '<svg aria-hidden="true" style="display:none" id="',
);
const startSegmentSVG2 = stringToPrecomputedChunk('">');
const endSegmentSVG = stringToPrecomputedChunk('</svg>');

const startSegmentMathML = stringToPrecomputedChunk(
  '<math aria-hidden="true" style="display:none" id="',
);
const startSegmentMathML2 = stringToPrecomputedChunk('">');
const endSegmentMathML = stringToPrecomputedChunk('</math>');

const startSegmentTable = stringToPrecomputedChunk('<table hidden id="');
const startSegmentTable2 = stringToPrecomputedChunk('">');
const endSegmentTable = stringToPrecomputedChunk('</table>');

const startSegmentTableBody = stringToPrecomputedChunk(
  '<table hidden><tbody id="',
);
const startSegmentTableBody2 = stringToPrecomputedChunk('">');
const endSegmentTableBody = stringToPrecomputedChunk('</tbody></table>');

const startSegmentTableRow = stringToPrecomputedChunk('<table hidden><tr id="');
const startSegmentTableRow2 = stringToPrecomputedChunk('">');
const endSegmentTableRow = stringToPrecomputedChunk('</tr></table>');

const startSegmentColGroup = stringToPrecomputedChunk(
  '<table hidden><colgroup id="',
);
const startSegmentColGroup2 = stringToPrecomputedChunk('">');
const endSegmentColGroup = stringToPrecomputedChunk('</colgroup></table>');

export function writeStartSegment(
  destination: Destination,
  responseState: ResponseState,
  formatContext: FormatContext,
  id: number,
): boolean {
  switch (formatContext.insertionMode) {
    case HTML_MODE: {
      writeChunk(destination, startSegmentHTML);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunk(destination, startSegmentHTML2);
    }
    case SVG_MODE: {
      writeChunk(destination, startSegmentSVG);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunk(destination, startSegmentSVG2);
    }
    case MATHML_MODE: {
      writeChunk(destination, startSegmentMathML);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunk(destination, startSegmentMathML2);
    }
    case HTML_TABLE_MODE: {
      writeChunk(destination, startSegmentTable);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunk(destination, startSegmentTable2);
    }
    // TODO: For the rest of these, there will be extra wrapper nodes that never
    // get deleted from the document. We need to delete the table too as part
    // of the injected scripts. They are invisible though so it's not too terrible
    // and it's kind of an edge case to suspend in a table. Totally supported though.
    case HTML_TABLE_BODY_MODE: {
      writeChunk(destination, startSegmentTableBody);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunk(destination, startSegmentTableBody2);
    }
    case HTML_TABLE_ROW_MODE: {
      writeChunk(destination, startSegmentTableRow);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunk(destination, startSegmentTableRow2);
    }
    case HTML_COLGROUP_MODE: {
      writeChunk(destination, startSegmentColGroup);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunk(destination, startSegmentColGroup2);
    }
    default: {
      invariant(false, 'Unknown insertion mode. This is a bug in React.');
    }
  }
}
export function writeEndSegment(
  destination: Destination,
  formatContext: FormatContext,
): boolean {
  switch (formatContext.insertionMode) {
    case HTML_MODE: {
      return writeChunk(destination, endSegmentHTML);
    }
    case SVG_MODE: {
      return writeChunk(destination, endSegmentSVG);
    }
    case MATHML_MODE: {
      return writeChunk(destination, endSegmentMathML);
    }
    case HTML_TABLE_MODE: {
      return writeChunk(destination, endSegmentTable);
    }
    case HTML_TABLE_BODY_MODE: {
      return writeChunk(destination, endSegmentTableBody);
    }
    case HTML_TABLE_ROW_MODE: {
      return writeChunk(destination, endSegmentTableRow);
    }
    case HTML_COLGROUP_MODE: {
      return writeChunk(destination, endSegmentColGroup);
    }
    default: {
      invariant(false, 'Unknown insertion mode. This is a bug in React.');
    }
  }
}

// Instruction Set

// The following code is the source scripts that we then minify and inline below,
// with renamed function names that we hope don't collide:

// const COMMENT_NODE = 8;
// const SUSPENSE_START_DATA = '$';
// const SUSPENSE_END_DATA = '/$';
// const SUSPENSE_PENDING_START_DATA = '$?';
// const SUSPENSE_FALLBACK_START_DATA = '$!';
//
// function clientRenderBoundary(suspenseBoundaryID) {
//   // Find the fallback's first element.
//   let suspenseNode = document.getElementById(suspenseBoundaryID);
//   if (!suspenseNode) {
//     // The user must have already navigated away from this tree.
//     // E.g. because the parent was hydrated.
//     return;
//   }
//   // Find the boundary around the fallback. This might include text nodes.
//   do {
//     suspenseNode = suspenseNode.previousSibling;
//   } while (
//     suspenseNode.nodeType !== COMMENT_NODE ||
//     suspenseNode.data !== SUSPENSE_PENDING_START_DATA
//   );
//   // Tag it to be client rendered.
//   suspenseNode.data = SUSPENSE_FALLBACK_START_DATA;
//   // Tell React to retry it if the parent already hydrated.
//   if (suspenseNode._reactRetry) {
//     suspenseNode._reactRetry();
//   }
// }
//
// function completeBoundary(suspenseBoundaryID, contentID) {
//   // Find the fallback's first element.
//   let suspenseNode = document.getElementById(suspenseBoundaryID);
//   const contentNode = document.getElementById(contentID);
//   // We'll detach the content node so that regardless of what happens next we don't leave in the tree.
//   // This might also help by not causing recalcing each time we move a child from here to the target.
//   contentNode.parentNode.removeChild(contentNode);
//   if (!suspenseNode) {
//     // The user must have already navigated away from this tree.
//     // E.g. because the parent was hydrated. That's fine there's nothing to do
//     // but we have to make sure that we already deleted the container node.
//     return;
//   }
//   // Find the boundary around the fallback. This might include text nodes.
//   do {
//     suspenseNode = suspenseNode.previousSibling;
//   } while (
//     suspenseNode.nodeType !== COMMENT_NODE ||
//     suspenseNode.data !== SUSPENSE_PENDING_START_DATA
//   );
//
//   // Clear all the existing children. This is complicated because
//   // there can be embedded Suspense boundaries in the fallback.
//   // This is similar to clearSuspenseBoundary in ReactDOMHostConfig.
//   // TOOD: We could avoid this if we never emitted suspense boundaries in fallback trees.
//   // They never hydrate anyway. However, currently we support incrementally loading the fallback.
//   const parentInstance = suspenseNode.parentNode;
//   let node = suspenseNode.nextSibling;
//   let depth = 0;
//   do {
//     if (node && node.nodeType === COMMENT_NODE) {
//       const data = node.data;
//       if (data === SUSPENSE_END_DATA) {
//         if (depth === 0) {
//           break;
//         } else {
//           depth--;
//         }
//       } else if (
//         data === SUSPENSE_START_DATA ||
//         data === SUSPENSE_PENDING_START_DATA ||
//         data === SUSPENSE_FALLBACK_START_DATA
//       ) {
//         depth++;
//       }
//     }
//
//     const nextNode = node.nextSibling;
//     parentInstance.removeChild(node);
//     node = nextNode;
//   } while (node);
//
//   const endOfBoundary = node;
//
//   // Insert all the children from the contentNode between the start and end of suspense boundary.
//   while (contentNode.firstChild) {
//     parentInstance.insertBefore(contentNode.firstChild, endOfBoundary);
//   }

//   suspenseNode.data = SUSPENSE_START_DATA;
//   if (suspenseNode._reactRetry) {
//     suspenseNode._reactRetry();
//   }
// }
//
// function completeSegment(containerID, placeholderID) {
//   const segmentContainer = document.getElementById(containerID);
//   const placeholderNode = document.getElementById(placeholderID);
//   // We always expect both nodes to exist here because, while we might
//   // have navigated away from the main tree, we still expect the detached
//   // tree to exist.
//   segmentContainer.parentNode.removeChild(segmentContainer);
//   while (segmentContainer.firstChild) {
//     placeholderNode.parentNode.insertBefore(
//       segmentContainer.firstChild,
//       placeholderNode,
//     );
//   }
//   placeholderNode.parentNode.removeChild(placeholderNode);
// }

const completeSegmentFunction =
  'function $RS(b,f){var a=document.getElementById(b),c=document.getElementById(f);for(a.parentNode.removeChild(a);a.firstChild;)c.parentNode.insertBefore(a.firstChild,c);c.parentNode.removeChild(c)}';
const completeBoundaryFunction =
  'function $RC(b,f){var a=document.getElementById(b),c=document.getElementById(f);c.parentNode.removeChild(c);if(a){do a=a.previousSibling;while(8!==a.nodeType||"$?"!==a.data);var h=a.parentNode,d=a.nextSibling,g=0;do{if(d&&8===d.nodeType){var e=d.data;if("/$"===e)if(0===g)break;else g--;else"$"!==e&&"$?"!==e&&"$!"!==e||g++}e=d.nextSibling;h.removeChild(d);d=e}while(d);for(;c.firstChild;)h.insertBefore(c.firstChild,d);a.data="$";a._reactRetry&&a._reactRetry()}}';
const clientRenderFunction =
  'function $RX(b){if(b=document.getElementById(b)){do b=b.previousSibling;while(8!==b.nodeType||"$?"!==b.data);b.data="$!";b._reactRetry&&b._reactRetry()}}';

const completeSegmentScript1Full = stringToPrecomputedChunk(
  '<script>' + completeSegmentFunction + ';$RS("',
);
const completeSegmentScript1Partial = stringToPrecomputedChunk('<script>$RS("');
const completeSegmentScript2 = stringToPrecomputedChunk('","');
const completeSegmentScript3 = stringToPrecomputedChunk('")</script>');

export function writeCompletedSegmentInstruction(
  destination: Destination,
  responseState: ResponseState,
  contentSegmentID: number,
): boolean {
  if (!responseState.sentCompleteSegmentFunction) {
    // The first time we write this, we'll need to include the full implementation.
    responseState.sentCompleteSegmentFunction = true;
    writeChunk(destination, completeSegmentScript1Full);
  } else {
    // Future calls can just reuse the same function.
    writeChunk(destination, completeSegmentScript1Partial);
  }
  writeChunk(destination, responseState.segmentPrefix);
  const formattedID = stringToChunk(contentSegmentID.toString(16));
  writeChunk(destination, formattedID);
  writeChunk(destination, completeSegmentScript2);
  writeChunk(destination, responseState.placeholderPrefix);
  writeChunk(destination, formattedID);
  return writeChunk(destination, completeSegmentScript3);
}

const completeBoundaryScript1Full = stringToPrecomputedChunk(
  '<script>' + completeBoundaryFunction + ';$RC("',
);
const completeBoundaryScript1Partial = stringToPrecomputedChunk(
  '<script>$RC("',
);
const completeBoundaryScript2 = stringToPrecomputedChunk('","');
const completeBoundaryScript3 = stringToPrecomputedChunk('")</script>');

export function writeCompletedBoundaryInstruction(
  destination: Destination,
  responseState: ResponseState,
  boundaryID: SuspenseBoundaryID,
  contentSegmentID: number,
): boolean {
  if (!responseState.sentCompleteBoundaryFunction) {
    // The first time we write this, we'll need to include the full implementation.
    responseState.sentCompleteBoundaryFunction = true;
    writeChunk(destination, completeBoundaryScript1Full);
  } else {
    // Future calls can just reuse the same function.
    writeChunk(destination, completeBoundaryScript1Partial);
  }
  const formattedBoundaryID = boundaryID.formattedID;
  invariant(
    formattedBoundaryID !== null,
    'An ID must have been assigned before we can complete the boundary.',
  );
  const formattedContentID = stringToChunk(contentSegmentID.toString(16));
  writeChunk(destination, formattedBoundaryID);
  writeChunk(destination, completeBoundaryScript2);
  writeChunk(destination, responseState.segmentPrefix);
  writeChunk(destination, formattedContentID);
  return writeChunk(destination, completeBoundaryScript3);
}

const clientRenderScript1Full = stringToPrecomputedChunk(
  '<script>' + clientRenderFunction + ';$RX("',
);
const clientRenderScript1Partial = stringToPrecomputedChunk('<script>$RX("');
const clientRenderScript2 = stringToPrecomputedChunk('")</script>');

export function writeClientRenderBoundaryInstruction(
  destination: Destination,
  responseState: ResponseState,
  boundaryID: SuspenseBoundaryID,
): boolean {
  if (!responseState.sentClientRenderFunction) {
    // The first time we write this, we'll need to include the full implementation.
    responseState.sentClientRenderFunction = true;
    writeChunk(destination, clientRenderScript1Full);
  } else {
    // Future calls can just reuse the same function.
    writeChunk(destination, clientRenderScript1Partial);
  }
  const formattedBoundaryID = boundaryID.formattedID;
  invariant(
    formattedBoundaryID !== null,
    'An ID must have been assigned before we can complete the boundary.',
  );
  writeChunk(destination, formattedBoundaryID);
  return writeChunk(destination, clientRenderScript2);
}
