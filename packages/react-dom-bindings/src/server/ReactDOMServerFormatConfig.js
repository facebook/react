/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList} from 'shared/ReactTypes';

import {
  checkHtmlStringCoercion,
  checkCSSPropertyStringCoercion,
  checkAttributeStringCoercion,
} from 'shared/CheckStringCoercion';

import {Children} from 'react';

import {
  enableFilterEmptyStringAttributesDOM,
  enableCustomElementPropertySupport,
  enableFloat,
  enableFizzExternalRuntime,
} from 'shared/ReactFeatureFlags';

import type {
  Destination,
  Chunk,
  PrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

import {
  writeChunk,
  writeChunkAndReturn,
  stringToChunk,
  stringToPrecomputedChunk,
  clonePrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

import isAttributeNameSafe from '../shared/isAttributeNameSafe';
import isUnitlessNumber from '../shared/isUnitlessNumber';
import getAttributeAlias from '../shared/getAttributeAlias';

import {checkControlledValueProps} from '../shared/ReactControlledValuePropTypes';
import {validateProperties as validateARIAProperties} from '../shared/ReactDOMInvalidARIAHook';
import {validateProperties as validateInputProperties} from '../shared/ReactDOMNullInputValuePropHook';
import {validateProperties as validateUnknownProperties} from '../shared/ReactDOMUnknownPropertyHook';
import warnValidStyle from '../shared/warnValidStyle';

import escapeTextForBrowser from './escapeTextForBrowser';
import hyphenateStyleName from '../shared/hyphenateStyleName';
import hasOwnProperty from 'shared/hasOwnProperty';
import sanitizeURL from '../shared/sanitizeURL';
import isArray from 'shared/isArray';

import {
  clientRenderBoundary as clientRenderFunction,
  completeBoundary as completeBoundaryFunction,
  completeBoundaryWithStyles as styleInsertionFunction,
  completeSegment as completeSegmentFunction,
} from './fizz-instruction-set/ReactDOMFizzInstructionSetInlineCodeStrings';

import {
  getValueDescriptorExpectingObjectForWarning,
  getValueDescriptorExpectingEnumForWarning,
  describeDifferencesForStylesheets,
  describeDifferencesForStylesheetOverPreinit,
  describeDifferencesForScripts,
  describeDifferencesForScriptOverPreinit,
  describeDifferencesForPreinits,
  describeDifferencesForPreinitOverStylesheet,
  describeDifferencesForPreinitOverScript,
  describeDifferencesForPreloads,
  describeDifferencesForPreloadOverImplicitPreload,
} from '../shared/ReactDOMResourceValidation';

import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';
const ReactDOMCurrentDispatcher = ReactDOMSharedInternals.Dispatcher;

const ReactDOMServerDispatcher = enableFloat
  ? {
      prefetchDNS,
      preconnect,
      preload,
      preinit,
    }
  : {};

let currentResources: null | Resources = null;
const currentResourcesStack = [];

export function prepareToRender(resources: Resources): mixed {
  currentResourcesStack.push(currentResources);
  currentResources = resources;

  const previousHostDispatcher = ReactDOMCurrentDispatcher.current;
  ReactDOMCurrentDispatcher.current = ReactDOMServerDispatcher;
  return previousHostDispatcher;
}

export function cleanupAfterRender(previousDispatcher: mixed) {
  currentResources = currentResourcesStack.pop();
  ReactDOMCurrentDispatcher.current = previousDispatcher;
}

// Used to distinguish these contexts from ones used in other renderers.
// E.g. this can be used to distinguish legacy renderers from this modern one.
export const isPrimaryRenderer = true;

export type StreamingFormat = 0 | 1;
const ScriptStreamingFormat: StreamingFormat = 0;
const DataStreamingFormat: StreamingFormat = 1;

export type InstructionState = number;
const NothingSent /*                      */ = 0b0000;
const SentCompleteSegmentFunction /*      */ = 0b0001;
const SentCompleteBoundaryFunction /*     */ = 0b0010;
const SentClientRenderFunction /*         */ = 0b0100;
const SentStyleInsertionFunction /*       */ = 0b1000;

// Per response, global state that is not contextual to the rendering subtree.
export type ResponseState = {
  bootstrapChunks: Array<Chunk | PrecomputedChunk>,
  placeholderPrefix: PrecomputedChunk,
  segmentPrefix: PrecomputedChunk,
  boundaryPrefix: string,
  idPrefix: string,
  nextSuspenseID: number,
  streamingFormat: StreamingFormat,

  // state for script streaming format, unused if using external runtime / data
  startInlineScript: PrecomputedChunk,
  instructions: InstructionState,

  // state for data streaming format
  externalRuntimeConfig: BootstrapScriptDescriptor | null,

  // preamble and postamble chunks and state
  htmlChunks: null | Array<Chunk | PrecomputedChunk>,
  headChunks: null | Array<Chunk | PrecomputedChunk>,
  hasBody: boolean,

  // Hoistable chunks
  charsetChunks: Array<Chunk | PrecomputedChunk>,
  preconnectChunks: Array<Chunk | PrecomputedChunk>,
  preloadChunks: Array<Chunk | PrecomputedChunk>,
  hoistableChunks: Array<Chunk | PrecomputedChunk>,

  // Module-global-like reference for flushing/hoisting state of style resources
  // We need to track whether the current request has flushed any style resources
  // without sending an instruction to hoist them. we do that here
  stylesToHoist: boolean,

  // We allow the legacy renderer to extend this object.

  ...
};

const dataElementQuotedEnd = stringToPrecomputedChunk('"></template>');

const startInlineScript = stringToPrecomputedChunk('<script>');
const endInlineScript = stringToPrecomputedChunk('</script>');

const startScriptSrc = stringToPrecomputedChunk('<script src="');
const startModuleSrc = stringToPrecomputedChunk('<script type="module" src="');
const scriptIntegirty = stringToPrecomputedChunk('" integrity="');
const endAsyncScript = stringToPrecomputedChunk('" async=""></script>');

/**
 * This escaping function is designed to work with bootstrapScriptContent only.
 * because we know we are escaping the entire script. We can avoid for instance
 * escaping html comment string sequences that are valid javascript as well because
 * if there are no sebsequent <script sequences the html parser will never enter
 * script data double escaped state (see: https://www.w3.org/TR/html53/syntax.html#script-data-double-escaped-state)
 *
 * While untrusted script content should be made safe before using this api it will
 * ensure that the script cannot be early terminated or never terminated state
 */
function escapeBootstrapScriptContent(scriptText: string) {
  if (__DEV__) {
    checkHtmlStringCoercion(scriptText);
  }
  return ('' + scriptText).replace(scriptRegex, scriptReplacer);
}
const scriptRegex = /(<\/|<)(s)(cript)/gi;
const scriptReplacer = (
  match: string,
  prefix: string,
  s: string,
  suffix: string,
) => `${prefix}${s === 's' ? '\\u0073' : '\\u0053'}${suffix}`;

export type BootstrapScriptDescriptor = {
  src: string,
  integrity?: string,
};
// Allows us to keep track of what we've already written so we can refer back to it.
// if passed externalRuntimeConfig and the enableFizzExternalRuntime feature flag
// is set, the server will send instructions via data attributes (instead of inline scripts)
export function createResponseState(
  identifierPrefix: string | void,
  nonce: string | void,
  bootstrapScriptContent: string | void,
  bootstrapScripts: $ReadOnlyArray<string | BootstrapScriptDescriptor> | void,
  bootstrapModules: $ReadOnlyArray<string | BootstrapScriptDescriptor> | void,
  externalRuntimeConfig: string | BootstrapScriptDescriptor | void,
): ResponseState {
  const idPrefix = identifierPrefix === undefined ? '' : identifierPrefix;
  const inlineScriptWithNonce =
    nonce === undefined
      ? startInlineScript
      : stringToPrecomputedChunk(
          '<script nonce="' + escapeTextForBrowser(nonce) + '">',
        );
  const bootstrapChunks: Array<Chunk | PrecomputedChunk> = [];
  let externalRuntimeDesc = null;
  let streamingFormat = ScriptStreamingFormat;
  if (bootstrapScriptContent !== undefined) {
    bootstrapChunks.push(
      inlineScriptWithNonce,
      stringToChunk(escapeBootstrapScriptContent(bootstrapScriptContent)),
      endInlineScript,
    );
  }
  if (enableFizzExternalRuntime) {
    if (!enableFloat) {
      throw new Error(
        'enableFizzExternalRuntime without enableFloat is not supported. This should never appear in production, since it means you are using a misconfigured React bundle.',
      );
    }
    if (externalRuntimeConfig !== undefined) {
      streamingFormat = DataStreamingFormat;
      if (typeof externalRuntimeConfig === 'string') {
        externalRuntimeDesc = {
          src: externalRuntimeConfig,
          integrity: undefined,
        };
      } else {
        externalRuntimeDesc = externalRuntimeConfig;
      }
    }
  }
  if (bootstrapScripts !== undefined) {
    for (let i = 0; i < bootstrapScripts.length; i++) {
      const scriptConfig = bootstrapScripts[i];
      const src =
        typeof scriptConfig === 'string' ? scriptConfig : scriptConfig.src;
      const integrity =
        typeof scriptConfig === 'string' ? undefined : scriptConfig.integrity;
      bootstrapChunks.push(
        startScriptSrc,
        stringToChunk(escapeTextForBrowser(src)),
      );
      if (integrity) {
        bootstrapChunks.push(
          scriptIntegirty,
          stringToChunk(escapeTextForBrowser(integrity)),
        );
      }
      bootstrapChunks.push(endAsyncScript);
    }
  }
  if (bootstrapModules !== undefined) {
    for (let i = 0; i < bootstrapModules.length; i++) {
      const scriptConfig = bootstrapModules[i];
      const src =
        typeof scriptConfig === 'string' ? scriptConfig : scriptConfig.src;
      const integrity =
        typeof scriptConfig === 'string' ? undefined : scriptConfig.integrity;
      bootstrapChunks.push(
        startModuleSrc,
        stringToChunk(escapeTextForBrowser(src)),
      );
      if (integrity) {
        bootstrapChunks.push(
          scriptIntegirty,
          stringToChunk(escapeTextForBrowser(integrity)),
        );
      }
      bootstrapChunks.push(endAsyncScript);
    }
  }
  return {
    bootstrapChunks: bootstrapChunks,
    placeholderPrefix: stringToPrecomputedChunk(idPrefix + 'P:'),
    segmentPrefix: stringToPrecomputedChunk(idPrefix + 'S:'),
    boundaryPrefix: idPrefix + 'B:',
    idPrefix: idPrefix,
    nextSuspenseID: 0,
    streamingFormat,
    startInlineScript: inlineScriptWithNonce,
    instructions: NothingSent,
    externalRuntimeConfig: externalRuntimeDesc,
    htmlChunks: null,
    headChunks: null,
    hasBody: false,
    charsetChunks: [],
    preconnectChunks: [],
    preloadChunks: [],
    hoistableChunks: [],
    stylesToHoist: false,
  };
}

// Constants for the insertion mode we're currently writing in. We don't encode all HTML5 insertion
// modes. We only include the variants as they matter for the sake of our purposes.
// We don't actually provide the namespace therefore we use constants instead of the string.
const ROOT_HTML_MODE = 0; // Used for the root most element tag.
// We have a less than HTML_HTML_MODE check elsewhere. If you add more cases here, make sure it
// still makes sense
const HTML_HTML_MODE = 1; // Used for the <html> if it is at the top level.
export const HTML_MODE = 2;
const SVG_MODE = 3;
const MATHML_MODE = 4;
const HTML_TABLE_MODE = 5;
const HTML_TABLE_BODY_MODE = 6;
const HTML_TABLE_ROW_MODE = 7;
const HTML_COLGROUP_MODE = 8;
// We have a greater than HTML_TABLE_MODE check elsewhere. If you add more cases here, make sure it
// still makes sense

type InsertionMode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// Lets us keep track of contextual state and pick it back up after suspending.
export type FormatContext = {
  insertionMode: InsertionMode, // root/svg/html/mathml/table
  selectedValue: null | string | Array<string>, // the selected value(s) inside a <select>, or null outside <select>
  noscriptTagInScope: boolean,
};

function createFormatContext(
  insertionMode: InsertionMode,
  selectedValue: null | string,
  noscriptTagInScope: boolean,
): FormatContext {
  return {
    insertionMode,
    selectedValue,
    noscriptTagInScope,
  };
}

export function createRootFormatContext(namespaceURI?: string): FormatContext {
  const insertionMode =
    namespaceURI === 'http://www.w3.org/2000/svg'
      ? SVG_MODE
      : namespaceURI === 'http://www.w3.org/1998/Math/MathML'
      ? MATHML_MODE
      : ROOT_HTML_MODE;
  return createFormatContext(insertionMode, null, false);
}

export function getChildFormatContext(
  parentContext: FormatContext,
  type: string,
  props: Object,
): FormatContext {
  switch (type) {
    case 'noscript':
      return createFormatContext(HTML_MODE, null, true);
    case 'select':
      return createFormatContext(
        HTML_MODE,
        props.value != null ? props.value : props.defaultValue,
        parentContext.noscriptTagInScope,
      );
    case 'svg':
      return createFormatContext(
        SVG_MODE,
        null,
        parentContext.noscriptTagInScope,
      );
    case 'math':
      return createFormatContext(
        MATHML_MODE,
        null,
        parentContext.noscriptTagInScope,
      );
    case 'foreignObject':
      return createFormatContext(
        HTML_MODE,
        null,
        parentContext.noscriptTagInScope,
      );
    // Table parents are special in that their children can only be created at all if they're
    // wrapped in a table parent. So we need to encode that we're entering this mode.
    case 'table':
      return createFormatContext(
        HTML_TABLE_MODE,
        null,
        parentContext.noscriptTagInScope,
      );
    case 'thead':
    case 'tbody':
    case 'tfoot':
      return createFormatContext(
        HTML_TABLE_BODY_MODE,
        null,
        parentContext.noscriptTagInScope,
      );
    case 'colgroup':
      return createFormatContext(
        HTML_COLGROUP_MODE,
        null,
        parentContext.noscriptTagInScope,
      );
    case 'tr':
      return createFormatContext(
        HTML_TABLE_ROW_MODE,
        null,
        parentContext.noscriptTagInScope,
      );
  }
  if (parentContext.insertionMode >= HTML_TABLE_MODE) {
    // Whatever tag this was, it wasn't a table parent or other special parent, so we must have
    // entered plain HTML again.
    return createFormatContext(
      HTML_MODE,
      null,
      parentContext.noscriptTagInScope,
    );
  }
  if (parentContext.insertionMode === ROOT_HTML_MODE) {
    if (type === 'html') {
      // We've emitted the root and is now in <html> mode.
      return createFormatContext(HTML_HTML_MODE, null, false);
    } else {
      // We've emitted the root and is now in plain HTML mode.
      return createFormatContext(HTML_MODE, null, false);
    }
  } else if (parentContext.insertionMode === HTML_HTML_MODE) {
    // We've emitted the document element and is now in plain HTML mode.
    return createFormatContext(HTML_MODE, null, false);
  }
  return parentContext;
}

export type SuspenseBoundaryID = null | PrecomputedChunk;

export const UNINITIALIZED_SUSPENSE_BOUNDARY_ID: SuspenseBoundaryID = null;

export function assignSuspenseBoundaryID(
  responseState: ResponseState,
): SuspenseBoundaryID {
  const generatedID = responseState.nextSuspenseID++;
  return stringToPrecomputedChunk(
    responseState.boundaryPrefix + generatedID.toString(16),
  );
}

export function makeId(
  responseState: ResponseState,
  treeId: string,
  localId: number,
): string {
  const idPrefix = responseState.idPrefix;

  let id = ':' + idPrefix + 'R' + treeId;

  // Unless this is the first id at this level, append a number at the end
  // that represents the position of this useId hook among all the useId
  // hooks for this fiber.
  if (localId > 0) {
    id += 'H' + localId.toString(32);
  }

  return id + ':';
}

function encodeHTMLTextNode(text: string): string {
  return escapeTextForBrowser(text);
}

const textSeparator = stringToPrecomputedChunk('<!-- -->');

export function pushTextInstance(
  target: Array<Chunk | PrecomputedChunk>,
  text: string,
  responseState: ResponseState,
  textEmbedded: boolean,
): boolean {
  if (text === '') {
    // Empty text doesn't have a DOM node representation and the hydration is aware of this.
    return textEmbedded;
  }
  if (textEmbedded) {
    target.push(textSeparator);
  }
  target.push(stringToChunk(encodeHTMLTextNode(text)));
  return true;
}

// Called when Fizz is done with a Segment. Currently the only purpose is to conditionally
// emit a text separator when we don't know for sure it is safe to omit
export function pushSegmentFinale(
  target: Array<Chunk | PrecomputedChunk>,
  responseState: ResponseState,
  lastPushedText: boolean,
  textEmbedded: boolean,
): void {
  if (lastPushedText && textEmbedded) {
    target.push(textSeparator);
  }
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

function pushStyleAttribute(
  target: Array<Chunk | PrecomputedChunk>,
  style: Object,
): void {
  if (typeof style !== 'object') {
    throw new Error(
      'The `style` prop expects a mapping from style properties to values, ' +
        "not a string. For example, style={{marginRight: spacing + 'em'}} when " +
        'using JSX.',
    );
  }

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
      if (__DEV__) {
        checkCSSPropertyStringCoercion(styleValue, styleName);
      }
      valueChunk = stringToChunk(
        escapeTextForBrowser(('' + styleValue).trim()),
      );
    } else {
      if (__DEV__) {
        warnValidStyle(styleName, styleValue);
      }

      nameChunk = processStyleName(styleName);
      if (typeof styleValue === 'number') {
        if (styleValue !== 0 && !isUnitlessNumber(styleName)) {
          valueChunk = stringToChunk(styleValue + 'px'); // Presumes implicit 'px' suffix for unitless numbers
        } else {
          valueChunk = stringToChunk('' + styleValue);
        }
      } else {
        if (__DEV__) {
          checkCSSPropertyStringCoercion(styleValue, styleName);
        }
        valueChunk = stringToChunk(
          escapeTextForBrowser(('' + styleValue).trim()),
        );
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

function pushBooleanAttribute(
  target: Array<Chunk | PrecomputedChunk>,
  name: string,
  value: string | boolean | number | Function | Object, // not null or undefined
): void {
  if (value && typeof value !== 'function' && typeof value !== 'symbol') {
    target.push(attributeSeparator, stringToChunk(name), attributeEmptyString);
  }
}

function pushStringAttribute(
  target: Array<Chunk | PrecomputedChunk>,
  name: string,
  value: string | boolean | number | Function | Object, // not null or undefined
): void {
  if (
    typeof value !== 'function' &&
    typeof value !== 'symbol' &&
    typeof value !== 'boolean'
  ) {
    target.push(
      attributeSeparator,
      stringToChunk(name),
      attributeAssign,
      stringToChunk(escapeTextForBrowser(value)),
      attributeEnd,
    );
  }
}

function pushAttribute(
  target: Array<Chunk | PrecomputedChunk>,
  name: string,
  value: string | boolean | number | Function | Object, // not null or undefined
): void {
  switch (name) {
    // These are very common props and therefore are in the beginning of the switch.
    // TODO: aria-label is a very common prop but allows booleans so is not like the others
    // but should ideally go in this list too.
    case 'className': {
      pushStringAttribute(target, 'class', value);
      break;
    }
    case 'tabIndex': {
      pushStringAttribute(target, 'tabindex', value);
      break;
    }
    case 'dir':
    case 'role':
    case 'viewBox':
    case 'width':
    case 'height': {
      pushStringAttribute(target, name, value);
      break;
    }
    case 'style': {
      pushStyleAttribute(target, value);
      return;
    }
    case 'src':
    case 'href':
    case 'action':
      if (enableFilterEmptyStringAttributesDOM) {
        if (value === '') {
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
    // Fall through to the last case which shouldn't remove empty strings.
    case 'formAction': {
      if (
        value == null ||
        typeof value === 'function' ||
        typeof value === 'symbol' ||
        typeof value === 'boolean'
      ) {
        return;
      }
      if (__DEV__) {
        checkAttributeStringCoercion(value, name);
      }
      const sanitizedValue = sanitizeURL('' + value);
      target.push(
        attributeSeparator,
        stringToChunk(name),
        attributeAssign,
        stringToChunk(escapeTextForBrowser(sanitizedValue)),
        attributeEnd,
      );
      return;
    }
    case 'defaultValue':
    case 'defaultChecked': // These shouldn't be set as attributes on generic HTML elements.
    case 'innerHTML': // Must use dangerouslySetInnerHTML instead.
    case 'suppressContentEditableWarning':
    case 'suppressHydrationWarning':
      // Ignored. These are built-in to React on the client.
      return;
    case 'autoFocus':
    case 'multiple':
    case 'muted': {
      pushBooleanAttribute(target, name.toLowerCase(), value);
      return;
    }
    case 'xlinkHref': {
      if (
        typeof value === 'function' ||
        typeof value === 'symbol' ||
        typeof value === 'boolean'
      ) {
        return;
      }
      if (__DEV__) {
        checkAttributeStringCoercion(value, name);
      }
      const sanitizedValue = sanitizeURL('' + value);
      target.push(
        attributeSeparator,
        stringToChunk('xlink:href'),
        attributeAssign,
        stringToChunk(escapeTextForBrowser(sanitizedValue)),
        attributeEnd,
      );
      return;
    }
    case 'contentEditable':
    case 'spellCheck':
    case 'draggable':
    case 'value':
    case 'autoReverse':
    case 'externalResourcesRequired':
    case 'focusable':
    case 'preserveAlpha': {
      // Booleanish String
      // These are "enumerated" attributes that accept "true" and "false".
      // In React, we let users pass `true` and `false` even though technically
      // these aren't boolean attributes (they are coerced to strings).
      if (typeof value !== 'function' && typeof value !== 'symbol') {
        target.push(
          attributeSeparator,
          stringToChunk(name),
          attributeAssign,
          stringToChunk(escapeTextForBrowser(value)),
          attributeEnd,
        );
      }
      return;
    }
    case 'allowFullScreen':
    case 'async':
    case 'autoPlay':
    case 'controls':
    case 'default':
    case 'defer':
    case 'disabled':
    case 'disablePictureInPicture':
    case 'disableRemotePlayback':
    case 'formNoValidate':
    case 'hidden':
    case 'loop':
    case 'noModule':
    case 'noValidate':
    case 'open':
    case 'playsInline':
    case 'readOnly':
    case 'required':
    case 'reversed':
    case 'scoped':
    case 'seamless':
    case 'itemScope': {
      // Boolean
      if (value && typeof value !== 'function' && typeof value !== 'symbol') {
        target.push(
          attributeSeparator,
          stringToChunk(name),
          attributeEmptyString,
        );
      }
      return;
    }
    case 'capture':
    case 'download': {
      // Overloaded Boolean
      if (value === true) {
        target.push(
          attributeSeparator,
          stringToChunk(name),
          attributeEmptyString,
        );
      } else if (value === false) {
        // Ignored
      } else if (typeof value !== 'function' && typeof value !== 'symbol') {
        target.push(
          attributeSeparator,
          stringToChunk(name),
          attributeAssign,
          stringToChunk(escapeTextForBrowser(value)),
          attributeEnd,
        );
      }
      return;
    }
    case 'cols':
    case 'rows':
    case 'size':
    case 'span': {
      // These are HTML attributes that must be positive numbers.
      if (
        typeof value !== 'function' &&
        typeof value !== 'symbol' &&
        !isNaN(value) &&
        (value: any) >= 1
      ) {
        target.push(
          attributeSeparator,
          stringToChunk(name),
          attributeAssign,
          stringToChunk(escapeTextForBrowser(value)),
          attributeEnd,
        );
      }
      return;
    }
    case 'rowSpan':
    case 'start': {
      // These are HTML attributes that must be numbers.
      if (
        typeof value !== 'function' &&
        typeof value !== 'symbol' &&
        !isNaN(value)
      ) {
        target.push(
          attributeSeparator,
          stringToChunk(name),
          attributeAssign,
          stringToChunk(escapeTextForBrowser(value)),
          attributeEnd,
        );
      }
      return;
    }
    case 'xlinkActuate':
      pushStringAttribute(target, 'xlink:actuate', value);
      return;
    case 'xlinkArcrole':
      pushStringAttribute(target, 'xlink:arcrole', value);
      return;
    case 'xlinkRole':
      pushStringAttribute(target, 'xlink:role', value);
      return;
    case 'xlinkShow':
      pushStringAttribute(target, 'xlink:show', value);
      return;
    case 'xlinkTitle':
      pushStringAttribute(target, 'xlink:title', value);
      return;
    case 'xlinkType':
      pushStringAttribute(target, 'xlink:type', value);
      return;
    case 'xmlBase':
      pushStringAttribute(target, 'xml:base', value);
      return;
    case 'xmlLang':
      pushStringAttribute(target, 'xml:lang', value);
      return;
    case 'xmlSpace':
      pushStringAttribute(target, 'xml:space', value);
      return;
    default:
      if (
        // shouldIgnoreAttribute
        // We have already filtered out null/undefined and reserved words.
        name.length > 2 &&
        (name[0] === 'o' || name[0] === 'O') &&
        (name[1] === 'n' || name[1] === 'N')
      ) {
        return;
      }

      const attributeName = getAttributeAlias(name);
      if (isAttributeNameSafe(attributeName)) {
        // shouldRemoveAttribute
        switch (typeof value) {
          case 'function':
          case 'symbol': // eslint-disable-line
            return;
          case 'boolean': {
            const prefix = attributeName.toLowerCase().slice(0, 5);
            if (prefix !== 'data-' && prefix !== 'aria-') {
              return;
            }
          }
        }
        target.push(
          attributeSeparator,
          stringToChunk(attributeName),
          attributeAssign,
          stringToChunk(escapeTextForBrowser(value)),
          attributeEnd,
        );
      }
  }
}

const endOfStartTag = stringToPrecomputedChunk('>');
const endOfStartTagSelfClosing = stringToPrecomputedChunk('/>');

function pushInnerHTML(
  target: Array<Chunk | PrecomputedChunk>,
  innerHTML: any,
  children: any,
) {
  if (innerHTML != null) {
    if (children != null) {
      throw new Error(
        'Can only set one of `children` or `props.dangerouslySetInnerHTML`.',
      );
    }

    if (typeof innerHTML !== 'object' || !('__html' in innerHTML)) {
      throw new Error(
        '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
          'Please visit https://reactjs.org/link/dangerously-set-inner-html ' +
          'for more information.',
      );
    }

    const html = innerHTML.__html;
    if (html !== null && html !== undefined) {
      if (__DEV__) {
        checkHtmlStringCoercion(html);
      }
      target.push(stringToChunk('' + html));
    }
  }
}

// TODO: Move these to ResponseState so that we warn for every request.
// It would help debugging in stateful servers (e.g. service worker).
let didWarnDefaultInputValue = false;
let didWarnDefaultChecked = false;
let didWarnDefaultSelectValue = false;
let didWarnDefaultTextareaValue = false;
let didWarnInvalidOptionChildren = false;
let didWarnInvalidOptionInnerHTML = false;
let didWarnSelectedSetOnOption = false;

function checkSelectProp(props: any, propName: string) {
  if (__DEV__) {
    const value = props[propName];
    if (value != null) {
      const array = isArray(value);
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
}

function pushStartSelect(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
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
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
  }

  target.push(endOfStartTag);
  pushInnerHTML(target, innerHTML, children);
  return children;
}

function flattenOptionChildren(children: mixed): string {
  let content = '';
  // Flatten children and warn if they aren't strings or numbers;
  // invalid types are ignored.
  Children.forEach((children: any), function (child) {
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
          'Cannot infer the option value of complex children. ' +
            'Pass a `value` prop or use a plain string as children to <option>.',
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
  formatContext: FormatContext,
): ReactNodeList {
  const selectedValue = formatContext.selectedValue;

  target.push(startChunkForTag('option'));

  let children = null;
  let value = null;
  let selected = null;
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
        case 'dangerouslySetInnerHTML':
          innerHTML = propValue;
          break;
        case 'value':
          value = propValue;
        // We intentionally fallthrough to also set the attribute on the node.
        default:
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
  }

  if (selectedValue != null) {
    let stringValue;
    if (value !== null) {
      if (__DEV__) {
        checkAttributeStringCoercion(value, 'value');
      }
      stringValue = '' + value;
    } else {
      if (__DEV__) {
        if (innerHTML !== null) {
          if (!didWarnInvalidOptionInnerHTML) {
            didWarnInvalidOptionInnerHTML = true;
            console.error(
              'Pass a `value` prop if you set dangerouslyInnerHTML so React knows ' +
                'which value should be selected.',
            );
          }
        }
      }
      stringValue = flattenOptionChildren(children);
    }
    if (isArray(selectedValue)) {
      // multiple
      for (let i = 0; i < selectedValue.length; i++) {
        if (__DEV__) {
          checkAttributeStringCoercion(selectedValue[i], 'value');
        }
        const v = '' + selectedValue[i];
        if (v === stringValue) {
          target.push(selectedMarkerAttribute);
          break;
        }
      }
    } else {
      if (__DEV__) {
        checkAttributeStringCoercion(selectedValue, 'select.value');
      }
      if ('' + selectedValue === stringValue) {
        target.push(selectedMarkerAttribute);
      }
    }
  } else if (selected) {
    target.push(selectedMarkerAttribute);
  }

  target.push(endOfStartTag);
  pushInnerHTML(target, innerHTML, children);
  return children;
}

function pushInput(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
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

  let value = null;
  let defaultValue = null;
  let checked = null;
  let defaultChecked = null;

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      switch (propKey) {
        case 'children':
        case 'dangerouslySetInnerHTML':
          throw new Error(
            `${'input'} is a self-closing tag and must neither have \`children\` nor ` +
              'use `dangerouslySetInnerHTML`.',
          );
        case 'defaultChecked':
          defaultChecked = propValue;
          break;
        case 'defaultValue':
          defaultValue = propValue;
          break;
        case 'checked':
          checked = propValue;
          break;
        case 'value':
          value = propValue;
          break;
        default:
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
  }

  if (checked !== null) {
    pushBooleanAttribute(target, 'checked', checked);
  } else if (defaultChecked !== null) {
    pushBooleanAttribute(target, 'checked', defaultChecked);
  }
  if (value !== null) {
    pushAttribute(target, 'value', value);
  } else if (defaultValue !== null) {
    pushAttribute(target, 'value', defaultValue);
  }

  target.push(endOfStartTagSelfClosing);
  return null;
}

function pushStartTextArea(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
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
  let defaultValue = null;
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
          value = propValue;
          break;
        case 'defaultValue':
          defaultValue = propValue;
          break;
        case 'dangerouslySetInnerHTML':
          throw new Error(
            '`dangerouslySetInnerHTML` does not make sense on <textarea>.',
          );
        default:
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
  }
  if (value === null && defaultValue !== null) {
    value = defaultValue;
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

    if (value != null) {
      throw new Error(
        'If you supply `defaultValue` on a <textarea>, do not pass children.',
      );
    }

    if (isArray(children)) {
      if (children.length > 1) {
        throw new Error('<textarea> can only have at most one child.');
      }

      // TODO: remove the coercion and the DEV check below because it will
      // always be overwritten by the coercion several lines below it. #22309
      if (__DEV__) {
        checkHtmlStringCoercion(children[0]);
      }
      value = '' + children[0];
    }
    if (__DEV__) {
      checkHtmlStringCoercion(children);
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

  // ToString and push directly instead of recurse over children.
  // We don't really support complex children in the value anyway.
  // This also currently avoids a trailing comment node which breaks textarea.
  if (value !== null) {
    if (__DEV__) {
      checkAttributeStringCoercion(value, 'value');
    }
    target.push(stringToChunk(encodeHTMLTextNode('' + value)));
  }

  return null;
}

function pushMeta(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  responseState: ResponseState,
  textEmbedded: boolean,
  insertionMode: InsertionMode,
  noscriptTagInScope: boolean,
): null {
  if (enableFloat) {
    if (
      insertionMode === SVG_MODE ||
      noscriptTagInScope ||
      props.itemProp != null
    ) {
      return pushSelfClosing(target, props, 'meta');
    } else {
      if (textEmbedded) {
        // This link follows text but we aren't writing a tag. while not as efficient as possible we need
        // to be safe and assume text will follow by inserting a textSeparator
        target.push(textSeparator);
      }

      if (typeof props.charSet === 'string') {
        return pushSelfClosing(responseState.charsetChunks, props, 'meta');
      } else {
        return pushSelfClosing(responseState.hoistableChunks, props, 'meta');
      }
    }
  } else {
    return pushSelfClosing(target, props, 'meta');
  }
}

function pushLink(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  responseState: ResponseState,
  resources: Resources,
  textEmbedded: boolean,
  insertionMode: InsertionMode,
  noscriptTagInScope: boolean,
): null {
  if (enableFloat) {
    const rel = props.rel;
    const href = props.href;
    const precedence = props.precedence;
    if (
      insertionMode === SVG_MODE ||
      noscriptTagInScope ||
      props.itemProp != null ||
      typeof rel !== 'string' ||
      typeof href !== 'string' ||
      href === ''
    ) {
      if (__DEV__) {
        if (rel === 'stylesheet' && typeof props.precedence === 'string') {
          if (typeof href !== 'string' || !href) {
            console.error(
              'React encountered a `<link rel="stylesheet" .../>` with a `precedence` prop and expected the `href` prop to be a non-empty string but ecountered %s instead. If your intent was to have React hoist and deduplciate this stylesheet using the `precedence` prop ensure there is a non-empty string `href` prop as well, otherwise remove the `precedence` prop.',
              getValueDescriptorExpectingObjectForWarning(href),
            );
          }
        }
      }
      pushLinkImpl(target, props);
      return null;
    }

    if (props.rel === 'stylesheet') {
      // This <link> may hoistable as a Stylesheet Resource, otherwise it will emit in place
      const key = getResourceKey('style', href);
      if (
        typeof precedence !== 'string' ||
        props.disabled != null ||
        props.onLoad ||
        props.onError
      ) {
        // This stylesheet is either not opted into Resource semantics or has conflicting properties which
        // disqualify it for such. We can still create a preload resource to help it load faster on the
        // client
        if (__DEV__) {
          if (typeof precedence === 'string') {
            if (props.disabled != null) {
              console.error(
                'React encountered a `<link rel="stylesheet" .../>` with a `precedence` prop and a `disabled` prop. The presence of the `disabled` prop indicates an intent to manage the stylesheet active state from your from your Component code and React will not hoist or deduplicate this stylesheet. If your intent was to have React hoist and deduplciate this stylesheet using the `precedence` prop remove the `disabled` prop, otherwise remove the `precedence` prop.',
              );
            } else if (props.onLoad || props.onError) {
              const propDescription =
                props.onLoad && props.onError
                  ? '`onLoad` and `onError` props'
                  : props.onLoad
                  ? '`onLoad` prop'
                  : '`onError` prop';
              console.error(
                'React encountered a `<link rel="stylesheet" .../>` with a `precedence` prop and %s. The presence of loading and error handlers indicates an intent to manage the stylesheet loading state from your from your Component code and React will not hoist or deduplicate this stylesheet. If your intent was to have React hoist and deduplciate this stylesheet using the `precedence` prop remove the %s, otherwise remove the `precedence` prop.',
                propDescription,
                propDescription,
              );
            }
          }
        }
        let resource = resources.preloadsMap.get(key);
        if (!resource) {
          resource = {
            type: 'preload',
            chunks: ([]: Array<Chunk | PrecomputedChunk>),
            state: NoState,
            props: preloadAsStylePropsFromProps(href, props),
          };
          resources.preloadsMap.set(key, resource);
          if (__DEV__) {
            markAsImplicitResourceDEV(resource, props, resource.props);
          }
        }
        pushLinkImpl(resource.chunks, resource.props);
        resources.usedStylesheets.add(resource);
        return pushLinkImpl(target, props);
      } else {
        // This stylesheet refers to a Resource and we create a new one if necessary
        let resource = resources.stylesMap.get(key);
        if (__DEV__) {
          const devResource = getAsResourceDEV(resource);
          if (devResource) {
            switch (devResource.__provenance) {
              case 'rendered': {
                const differenceDescription = describeDifferencesForStylesheets(
                  // Diff the props from the JSX element, not the derived resource props
                  props,
                  devResource.__originalProps,
                );
                if (differenceDescription) {
                  console.error(
                    'React encountered a <link rel="stylesheet" href="%s" .../> with a `precedence` prop that has props that conflict' +
                      ' with another hoistable stylesheet with the same `href`. When using `precedence` with <link rel="stylsheet" .../>' +
                      ' the props from the first encountered instance will be used and props from later instances will be ignored.' +
                      ' Update the props on either <link rel="stylesheet" .../> instance so they agree.%s',
                    href,
                    differenceDescription,
                  );
                }
                break;
              }
              case 'preinit': {
                const differenceDescription =
                  describeDifferencesForStylesheetOverPreinit(
                    // Diff the props from the JSX element, not the derived resource props
                    props,
                    devResource.__propsEquivalent,
                  );
                if (differenceDescription) {
                  console.error(
                    'React encountered a <link rel="stylesheet" precedence="%s" href="%s" .../> with props that conflict' +
                      ' with the options provided to `ReactDOM.preinit("%s", { as: "style", ... })`. React will use the first props or preinitialization' +
                      ' options encountered when rendering a hoistable stylesheet with a particular `href` and will ignore any newer props or' +
                      ' options. The first instance of this stylesheet resource was created using the `ReactDOM.preinit()` function.' +
                      ' Please note, `ReactDOM.preinit()` is modeled off of module import assertions capabilities and does not support' +
                      ' arbitrary props. If you need to have props not included with the preinit options you will need to rely on rendering' +
                      ' <link> tags only.%s',
                    precedence,
                    href,
                    href,
                    differenceDescription,
                  );
                }
                break;
              }
            }
          }
        }
        if (!resource) {
          const resourceProps = stylesheetPropsFromRawProps(props);
          const preloadResource = resources.preloadsMap.get(key);
          if (preloadResource) {
            // If we already had a preload we don't want that resource to flush directly.
            // We let the newly created resource govern flushing.
            preloadResource.state |= Blocked;
            adoptPreloadPropsForStylesheetProps(
              resourceProps,
              preloadResource.props,
            );
          }
          resource = {
            type: 'stylesheet',
            chunks: ([]: Array<Chunk | PrecomputedChunk>),
            state: NoState,
            props: resourceProps,
          };
          resources.stylesMap.set(key, resource);
          if (__DEV__) {
            markAsRenderedResourceDEV(resource, props);
          }
          let precedenceSet = resources.precedences.get(precedence);
          if (!precedenceSet) {
            precedenceSet = new Set();
            resources.precedences.set(precedence, precedenceSet);
            const emptyStyleResource = {
              type: 'style',
              chunks: ([]: Array<Chunk | PrecomputedChunk>),
              state: NoState,
              props: {
                precedence,
                hrefs: ([]: Array<string>),
              },
            };
            precedenceSet.add(emptyStyleResource);
            if (__DEV__) {
              if (resources.stylePrecedences.has(precedence)) {
                console.error(
                  'React constructed an empty style resource when a style resource already exists for this precedence: "%s". This is a bug in React.',
                  precedence,
                );
              }
            }
            resources.stylePrecedences.set(precedence, emptyStyleResource);
          }
          precedenceSet.add(resource);
        }
        if (resources.boundaryResources) {
          resources.boundaryResources.add(resource);
        }
        if (textEmbedded) {
          // This link follows text but we aren't writing a tag. while not as efficient as possible we need
          // to be safe and assume text will follow by inserting a textSeparator
          target.push(textSeparator);
        }
        return null;
      }
    } else if (props.onLoad || props.onError) {
      // When using load handlers we cannot hoist and need to emit links in place
      return pushLinkImpl(target, props);
    } else {
      // We can hoist this link so we may need to emit a text separator.
      // @TODO refactor text separators so we don't have to defensively add
      // them when we don't end up emitting a tag as a result of pushStartInstance
      if (textEmbedded) {
        // This link follows text but we aren't writing a tag. while not as efficient as possible we need
        // to be safe and assume text will follow by inserting a textSeparator
        target.push(textSeparator);
      }

      switch (props.rel) {
        case 'preconnect':
        case 'dns-prefetch':
          return pushLinkImpl(responseState.preconnectChunks, props);
        case 'preload':
          return pushLinkImpl(responseState.preloadChunks, props);
        default:
          return pushLinkImpl(responseState.hoistableChunks, props);
      }
    }
  } else {
    return pushLinkImpl(target, props);
  }
}

function pushLinkImpl(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
): null {
  target.push(startChunkForTag('link'));

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      switch (propKey) {
        case 'children':
        case 'dangerouslySetInnerHTML':
          throw new Error(
            `${'link'} is a self-closing tag and must neither have \`children\` nor ` +
              'use `dangerouslySetInnerHTML`.',
          );
        default:
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
  }

  target.push(endOfStartTagSelfClosing);
  return null;
}

function pushStyle(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  resources: Resources,
  textEmbedded: boolean,
  insertionMode: InsertionMode,
  noscriptTagInScope: boolean,
): ReactNodeList {
  if (__DEV__) {
    if (hasOwnProperty.call(props, 'children')) {
      const children = props.children;

      const child = Array.isArray(children)
        ? children.length < 2
          ? children[0]
          : null
        : children;

      if (
        typeof child === 'function' ||
        typeof child === 'symbol' ||
        Array.isArray(child)
      ) {
        const childType =
          typeof child === 'function'
            ? 'a Function'
            : typeof child === 'symbol'
            ? 'a Sybmol'
            : 'an Array';
        console.error(
          'React expect children of <style> tags to be a string, number, or object with a `toString` method but found %s instead. ' +
            'In browsers style Elements can only have `Text` Nodes as children.',
          childType,
        );
      }
    }
  }
  if (enableFloat) {
    const precedence = props.precedence;
    const href = props.href;

    if (
      insertionMode === SVG_MODE ||
      noscriptTagInScope ||
      props.itemProp != null ||
      typeof precedence !== 'string' ||
      typeof href !== 'string' ||
      href === ''
    ) {
      // This style tag is not able to be turned into a Style Resource
      return pushStyleImpl(target, props);
    }

    if (__DEV__) {
      if (href.includes(' ')) {
        console.error(
          'React expected the `href` prop for a <style> tag opting into hoisting semantics using the `precedence` prop to not have any spaces but ecountered spaces instead. using spaces in this prop will cause hydration of this style to fail on the client. The href for the <style> where this ocurred is "%s".',
          href,
        );
      }
    }

    const key = getResourceKey('style', href);
    let resource = resources.stylesMap.get(key);
    if (!resource) {
      resource = resources.stylePrecedences.get(precedence);
      if (!resource) {
        resource = {
          type: 'style',
          chunks: [],
          state: NoState,
          props: {
            precedence,
            hrefs: [href],
          },
        };
        resources.stylePrecedences.set(precedence, resource);
        const precedenceSet: Set<StyleResource> = new Set();
        precedenceSet.add(resource);
        if (__DEV__) {
          if (resources.precedences.has(precedence)) {
            console.error(
              'React constructed a new style precedence set when one already exists for this precedence: "%s". This is a bug in React.',
              precedence,
            );
          }
        }
        resources.precedences.set(precedence, precedenceSet);
      } else {
        resource.props.hrefs.push(href);
      }
      resources.stylesMap.set(key, resource);
      if (resources.boundaryResources) {
        resources.boundaryResources.add(resource);
      }
      pushStyleContents(resource.chunks, props);
    }

    if (textEmbedded) {
      // This link follows text but we aren't writing a tag. while not as efficient as possible we need
      // to be safe and assume text will follow by inserting a textSeparator
      target.push(textSeparator);
    }
  } else {
    return pushStartGenericElement(target, props, 'style');
  }
}

function pushStyleImpl(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
): ReactNodeList {
  target.push(startChunkForTag('style'));

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
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
  }
  target.push(endOfStartTag);

  const child = Array.isArray(children)
    ? children.length < 2
      ? children[0]
      : null
    : children;
  if (
    typeof child !== 'function' &&
    typeof child !== 'symbol' &&
    child !== null &&
    child !== undefined
  ) {
    // eslint-disable-next-line react-internal/safe-string-coercion
    target.push(stringToChunk(escapeTextForBrowser('' + child)));
  }
  pushInnerHTML(target, innerHTML, children);
  target.push(endTag1, stringToChunk('style'), endTag2);
  return null;
}

function pushStyleContents(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
): void {
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
      }
    }
  }

  const child = Array.isArray(children)
    ? children.length < 2
      ? children[0]
      : null
    : children;
  if (
    typeof child !== 'function' &&
    typeof child !== 'symbol' &&
    child !== null &&
    child !== undefined
  ) {
    // eslint-disable-next-line react-internal/safe-string-coercion
    target.push(stringToChunk(escapeTextForBrowser('' + child)));
  }
  pushInnerHTML(target, innerHTML, children);
  return;
}

function pushSelfClosing(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  tag: string,
): null {
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
          throw new Error(
            `${tag} is a self-closing tag and must neither have \`children\` nor ` +
              'use `dangerouslySetInnerHTML`.',
          );
        default:
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
  }

  target.push(endOfStartTagSelfClosing);
  return null;
}

function pushStartMenuItem(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
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
          throw new Error(
            'menuitems cannot have `children` nor `dangerouslySetInnerHTML`.',
          );
        default:
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
  }

  target.push(endOfStartTag);
  return null;
}

function pushTitle(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  responseState: ResponseState,
  insertionMode: InsertionMode,
  noscriptTagInScope: boolean,
): ReactNodeList {
  if (__DEV__) {
    if (hasOwnProperty.call(props, 'children')) {
      const children = props.children;

      const child = Array.isArray(children)
        ? children.length < 2
          ? children[0]
          : null
        : children;

      if (Array.isArray(children) && children.length > 1) {
        console.error(
          'React expects the `children` prop of <title> tags to be a string, number, or object with a novel `toString` method but found an Array with length %s instead.' +
            ' Browsers treat all child Nodes of <title> tags as Text content and React expects to be able to convert `children` of <title> tags to a single string value' +
            ' which is why Arrays of length greater than 1 are not supported. When using JSX it can be commong to combine text nodes and value nodes.' +
            ' For example: <title>hello {nameOfUser}</title>. While not immediately apparent, `children` in this case is an Array with length 2. If your `children` prop' +
            ' is using this form try rewriting it using a template string: <title>{`hello ${nameOfUser}`}</title>.',
          children.length,
        );
      } else if (typeof child === 'function' || typeof child === 'symbol') {
        const childType =
          typeof child === 'function' ? 'a Function' : 'a Sybmol';
        console.error(
          'React expect children of <title> tags to be a string, number, or object with a novel `toString` method but found %s instead.' +
            ' Browsers treat all child Nodes of <title> tags as Text content and React expects to be able to convert children of <title>' +
            ' tags to a single string value.',
          childType,
        );
      } else if (child && child.toString === {}.toString) {
        if (child.$$typeof != null) {
          console.error(
            'React expects the `children` prop of <title> tags to be a string, number, or object with a novel `toString` method but found an object that appears to be' +
              ' a React element which never implements a suitable `toString` method. Browsers treat all child Nodes of <title> tags as Text content and React expects to' +
              ' be able to convert children of <title> tags to a single string value which is why rendering React elements is not supported. If the `children` of <title> is' +
              ' a React Component try moving the <title> tag into that component. If the `children` of <title> is some HTML markup change it to be Text only to be valid HTML.',
          );
        } else {
          console.error(
            'React expects the `children` prop of <title> tags to be a string, number, or object with a novel `toString` method but found an object that does not implement' +
              ' a suitable `toString` method. Browsers treat all child Nodes of <title> tags as Text content and React expects to be able to convert children of <title> tags' +
              ' to a single string value. Using the default `toString` method available on every object is almost certainly an error. Consider whether the `children` of this <title>' +
              ' is an object in error and change it to a string or number value if so. Otherwise implement a `toString` method that React can use to produce a valid <title>.',
          );
        }
      }
    }
  }

  if (enableFloat) {
    if (
      insertionMode !== SVG_MODE &&
      !noscriptTagInScope &&
      props.itemProp == null
    ) {
      pushTitleImpl(responseState.hoistableChunks, props);
      return null;
    } else {
      return pushTitleImpl(target, props);
    }
  } else {
    return pushTitleImpl(target, props);
  }
}

function pushTitleImpl(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
): null {
  target.push(startChunkForTag('title'));

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
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
  }
  target.push(endOfStartTag);

  const child = Array.isArray(children)
    ? children.length < 2
      ? children[0]
      : null
    : children;
  if (
    typeof child !== 'function' &&
    typeof child !== 'symbol' &&
    child !== null &&
    child !== undefined
  ) {
    // eslint-disable-next-line react-internal/safe-string-coercion
    target.push(stringToChunk(escapeTextForBrowser('' + child)));
  }
  pushInnerHTML(target, innerHTML, children);
  target.push(endTag1, stringToChunk('title'), endTag2);
  return null;
}

function pushStartTitle(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
): ReactNodeList {
  target.push(startChunkForTag('title'));

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
        case 'dangerouslySetInnerHTML':
          throw new Error(
            '`dangerouslySetInnerHTML` does not make sense on <title>.',
          );
        default:
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
  }
  target.push(endOfStartTag);

  if (__DEV__) {
    const childForValidation =
      Array.isArray(children) && children.length < 2
        ? children[0] || null
        : children;
    if (Array.isArray(children) && children.length > 1) {
      console.error(
        'A title element received an array with more than 1 element as children. ' +
          'In browsers title Elements can only have Text Nodes as children. If ' +
          'the children being rendered output more than a single text node in aggregate the browser ' +
          'will display markup and comments as text in the title and hydration will likely fail and ' +
          'fall back to client rendering',
      );
    } else if (
      childForValidation != null &&
      childForValidation.$$typeof != null
    ) {
      console.error(
        'A title element received a React element for children. ' +
          'In the browser title Elements can only have Text Nodes as children. If ' +
          'the children being rendered output more than a single text node in aggregate the browser ' +
          'will display markup and comments as text in the title and hydration will likely fail and ' +
          'fall back to client rendering',
      );
    } else if (
      childForValidation != null &&
      typeof childForValidation !== 'string' &&
      typeof childForValidation !== 'number'
    ) {
      console.error(
        'A title element received a value that was not a string or number for children. ' +
          'In the browser title Elements can only have Text Nodes as children. If ' +
          'the children being rendered output more than a single text node in aggregate the browser ' +
          'will display markup and comments as text in the title and hydration will likely fail and ' +
          'fall back to client rendering',
      );
    }
  }

  return children;
}

function pushStartHead(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  responseState: ResponseState,
  insertionMode: InsertionMode,
): ReactNodeList {
  if (enableFloat) {
    if (insertionMode < HTML_MODE && responseState.headChunks === null) {
      // This <head> is the Document.head and should be part of the preamble
      responseState.headChunks = [];
      return pushStartGenericElement(responseState.headChunks, props, 'head');
    } else {
      // This <head> is deep and is likely just an error. we emit it inline though.
      // Validation should warn that this tag is the the wrong spot.
      return pushStartGenericElement(target, props, 'head');
    }
  } else {
    return pushStartGenericElement(target, props, 'head');
  }
}

function pushStartHtml(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  responseState: ResponseState,
  insertionMode: InsertionMode,
): ReactNodeList {
  if (enableFloat) {
    if (insertionMode === ROOT_HTML_MODE && responseState.htmlChunks === null) {
      // This <html> is the Document.documentElement and should be part of the preamble
      responseState.htmlChunks = [DOCTYPE];
      return pushStartGenericElement(responseState.htmlChunks, props, 'html');
    } else {
      // This <html> is deep and is likely just an error. we emit it inline though.
      // Validation should warn that this tag is the the wrong spot.
      return pushStartGenericElement(target, props, 'html');
    }
  } else {
    if (insertionMode === ROOT_HTML_MODE) {
      // If we're rendering the html tag and we're at the root (i.e. not in foreignObject)
      // then we also emit the DOCTYPE as part of the root content as a convenience for
      // rendering the whole document.
      target.push(DOCTYPE);
    }
    return pushStartGenericElement(target, props, 'html');
  }
}

function pushScript(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  resources: Resources,
  textEmbedded: boolean,
  insertionMode: InsertionMode,
  noscriptTagInScope: boolean,
): null {
  if (enableFloat) {
    if (
      insertionMode === SVG_MODE ||
      noscriptTagInScope ||
      props.itemProp != null ||
      typeof props.src !== 'string' ||
      !props.src
    ) {
      // This script will not be a resource nor can it be preloaded, we bailout early
      // and emit it in place.
      return pushScriptImpl(target, props);
    }

    const src = props.src;
    const key = getResourceKey('script', src);
    if (props.async !== true || props.onLoad || props.onError) {
      // we don't want to preload nomodule scripts
      if (props.noModule !== true) {
        // We can't resourcify scripts with load listeners. To avoid ambiguity with
        // other Resourcified async scripts on the server we omit them from the server
        // stream and expect them to be inserted during hydration on the client.
        // We can still preload them however so the client can start fetching the script
        // as soon as possible
        let resource = resources.preloadsMap.get(key);
        if (!resource) {
          resource = {
            type: 'preload',
            chunks: [],
            state: NoState,
            props: preloadAsScriptPropsFromProps(props.src, props),
          };
          resources.preloadsMap.set(key, resource);
          if (__DEV__) {
            markAsImplicitResourceDEV(resource, props, resource.props);
          }
          resources.usedScripts.add(resource);
          pushLinkImpl(resource.chunks, resource.props);
        }
      }

      if (props.async !== true) {
        // This is not an async script, we can preloaded it but it still needs to
        // be emitted in place since it needs to hydrate on the client
        pushScriptImpl(target, props);
        return null;
      }
    } else {
      // We can make this <script> into a ScriptResource
      let resource = resources.scriptsMap.get(key);
      if (__DEV__) {
        const devResource = getAsResourceDEV(resource);
        if (devResource) {
          switch (devResource.__provenance) {
            case 'rendered': {
              const differenceDescription = describeDifferencesForScripts(
                // Diff the props from the JSX element, not the derived resource props
                props,
                devResource.__originalProps,
              );
              if (differenceDescription) {
                console.error(
                  'React encountered a <script async={true} src="%s" .../> that has props that conflict' +
                    ' with another hoistable script with the same `src`. When rendering hoistable scripts (async scripts without any loading handlers)' +
                    ' the props from the first encountered instance will be used and props from later instances will be ignored.' +
                    ' Update the props on both <script async={true} .../> instance so they agree.%s',
                  src,
                  differenceDescription,
                );
              }
              break;
            }
            case 'preinit': {
              const differenceDescription =
                describeDifferencesForScriptOverPreinit(
                  // Diff the props from the JSX element, not the derived resource props
                  props,
                  devResource.__propsEquivalent,
                );
              if (differenceDescription) {
                console.error(
                  'React encountered a <script async={true} src="%s" .../> with props that conflict' +
                    ' with the options provided to `ReactDOM.preinit("%s", { as: "script", ... })`. React will use the first props or preinitialization' +
                    ' options encountered when rendering a hoistable script with a particular `src` and will ignore any newer props or' +
                    ' options. The first instance of this script resource was created using the `ReactDOM.preinit()` function.' +
                    ' Please note, `ReactDOM.preinit()` is modeled off of module import assertions capabilities and does not support' +
                    ' arbitrary props. If you need to have props not included with the preinit options you will need to rely on rendering' +
                    ' <script> tags only.%s',
                  src,
                  src,
                  differenceDescription,
                );
              }
              break;
            }
          }
        }
      }
      if (!resource) {
        resource = {
          type: 'script',
          chunks: [],
          state: NoState,
          props: null,
        };
        resources.scriptsMap.set(key, resource);
        if (__DEV__) {
          markAsRenderedResourceDEV(resource, props);
        }
        // Add to the script flushing queue
        resources.scripts.add(resource);

        let scriptProps = props;
        const preloadResource = resources.preloadsMap.get(key);
        if (preloadResource) {
          // If we already had a preload we don't want that resource to flush directly.
          // We let the newly created resource govern flushing.
          preloadResource.state |= Blocked;
          scriptProps = {...props};
          adoptPreloadPropsForScriptProps(scriptProps, preloadResource.props);
        }
        // encode the tag as Chunks
        pushScriptImpl(resource.chunks, scriptProps);
      }
    }

    if (textEmbedded) {
      // This script follows text but we aren't writing a tag. while not as efficient as possible we need
      // to be safe and assume text will follow by inserting a textSeparator
      target.push(textSeparator);
    }
    return null;
  } else {
    return pushScriptImpl(target, props);
  }
}

function pushScriptImpl(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
): null {
  target.push(startChunkForTag('script'));

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
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
  }
  target.push(endOfStartTag);

  if (__DEV__) {
    if (children != null && typeof children !== 'string') {
      const descriptiveStatement =
        typeof children === 'number'
          ? 'a number for children'
          : Array.isArray(children)
          ? 'an array for children'
          : 'something unexpected for children';
      console.error(
        'A script element was rendered with %s. If script element has children it must be a single string.' +
          ' Consider using dangerouslySetInnerHTML or passing a plain string as children.',
        descriptiveStatement,
      );
    }
  }

  pushInnerHTML(target, innerHTML, children);
  if (typeof children === 'string') {
    target.push(stringToChunk(encodeHTMLTextNode(children)));
  }
  target.push(endTag1, stringToChunk('script'), endTag2);
  return null;
}

function pushStartGenericElement(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  tag: string,
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
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
  }

  target.push(endOfStartTag);
  pushInnerHTML(target, innerHTML, children);
  if (typeof children === 'string') {
    // Special case children as a string to avoid the unnecessary comment.
    // TODO: Remove this special case after the general optimization is in place.
    target.push(stringToChunk(encodeHTMLTextNode(children)));
    return null;
  }
  return children;
}

function pushStartCustomElement(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  tag: string,
): ReactNodeList {
  target.push(startChunkForTag(tag));

  let children = null;
  let innerHTML = null;
  for (let propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      let propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      if (
        enableCustomElementPropertySupport &&
        (typeof propValue === 'function' || typeof propValue === 'object')
      ) {
        // It is normal to render functions and objects on custom elements when
        // client rendering, but when server rendering the output isn't useful,
        // so skip it.
        continue;
      }
      if (enableCustomElementPropertySupport && propValue === false) {
        continue;
      }
      if (enableCustomElementPropertySupport && propValue === true) {
        propValue = '';
      }
      if (enableCustomElementPropertySupport && propKey === 'className') {
        // className gets rendered as class on the client, so it should be
        // rendered as class on the server.
        propKey = 'class';
      }
      switch (propKey) {
        case 'children':
          children = propValue;
          break;
        case 'dangerouslySetInnerHTML':
          innerHTML = propValue;
          break;
        case 'style':
          pushStyleAttribute(target, propValue);
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
              stringToChunk(escapeTextForBrowser(propValue)),
              attributeEnd,
            );
          }
          break;
      }
    }
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
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
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
    if (children != null) {
      throw new Error(
        'Can only set one of `children` or `props.dangerouslySetInnerHTML`.',
      );
    }

    if (typeof innerHTML !== 'object' || !('__html' in innerHTML)) {
      throw new Error(
        '`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. ' +
          'Please visit https://reactjs.org/link/dangerously-set-inner-html ' +
          'for more information.',
      );
    }

    const html = innerHTML.__html;
    if (html !== null && html !== undefined) {
      if (typeof html === 'string' && html.length > 0 && html[0] === '\n') {
        target.push(leadingNewline, stringToChunk(html));
      } else {
        if (__DEV__) {
          checkHtmlStringCoercion(html);
        }
        target.push(stringToChunk('' + html));
      }
    }
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
const validatedTagCache = new Map<string, PrecomputedChunk>();
function startChunkForTag(tag: string): PrecomputedChunk {
  let tagStartChunk = validatedTagCache.get(tag);
  if (tagStartChunk === undefined) {
    if (!VALID_TAG_REGEX.test(tag)) {
      throw new Error(`Invalid tag: ${tag}`);
    }

    tagStartChunk = stringToPrecomputedChunk('<' + tag);
    validatedTagCache.set(tag, tagStartChunk);
  }
  return tagStartChunk;
}

const DOCTYPE: PrecomputedChunk = stringToPrecomputedChunk('<!DOCTYPE html>');

export function pushStartInstance(
  target: Array<Chunk | PrecomputedChunk>,
  type: string,
  props: Object,
  resources: Resources,
  responseState: ResponseState,
  formatContext: FormatContext,
  textEmbedded: boolean,
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
      if (type.indexOf('-') === -1 && type.toLowerCase() !== type) {
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
    case 'div':
    case 'span':
    case 'svg':
    case 'path':
    case 'a':
    case 'g':
    case 'p':
    case 'li':
      // Fast track very common tags
      break;
    // Special tags
    case 'select':
      return pushStartSelect(target, props);
    case 'option':
      return pushStartOption(target, props, formatContext);
    case 'textarea':
      return pushStartTextArea(target, props);
    case 'input':
      return pushInput(target, props);
    case 'menuitem':
      return pushStartMenuItem(target, props);
    case 'title':
      return enableFloat
        ? pushTitle(
            target,
            props,
            responseState,
            formatContext.insertionMode,
            formatContext.noscriptTagInScope,
          )
        : pushStartTitle(target, props);
    case 'link':
      return pushLink(
        target,
        props,
        responseState,
        resources,
        textEmbedded,
        formatContext.insertionMode,
        formatContext.noscriptTagInScope,
      );
    case 'script':
      return enableFloat
        ? pushScript(
            target,
            props,
            resources,
            textEmbedded,
            formatContext.insertionMode,
            formatContext.noscriptTagInScope,
          )
        : pushStartGenericElement(target, props, type);
    case 'style':
      return pushStyle(
        target,
        props,
        resources,
        textEmbedded,
        formatContext.insertionMode,
        formatContext.noscriptTagInScope,
      );
    case 'meta':
      return pushMeta(
        target,
        props,
        responseState,
        textEmbedded,
        formatContext.insertionMode,
        formatContext.noscriptTagInScope,
      );
    // Newline eating tags
    case 'listing':
    case 'pre': {
      return pushStartPreformattedElement(target, props, type);
    }
    // Omitted close tags
    case 'base':
    case 'area':
    case 'br':
    case 'col':
    case 'embed':
    case 'hr':
    case 'img':
    case 'keygen':
    case 'param':
    case 'source':
    case 'track':
    case 'wbr': {
      return pushSelfClosing(target, props, type);
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
      return pushStartGenericElement(target, props, type);
    }
    // Preamble start tags
    case 'head':
      return pushStartHead(
        target,
        props,
        responseState,
        formatContext.insertionMode,
      );
    case 'html': {
      return pushStartHtml(
        target,
        props,
        responseState,
        formatContext.insertionMode,
      );
    }
    default: {
      if (type.indexOf('-') !== -1) {
        // Custom element
        return pushStartCustomElement(target, props, type);
      }
    }
  }
  // Generic element
  return pushStartGenericElement(target, props, type);
}

const endTag1 = stringToPrecomputedChunk('</');
const endTag2 = stringToPrecomputedChunk('>');

export function pushEndInstance(
  target: Array<Chunk | PrecomputedChunk>,
  type: string,
  props: Object,
  responseState: ResponseState,
  formatContext: FormatContext,
): void {
  switch (type) {
    // When float is on we expect title and script tags to always be pushed in
    // a unit and never return children. when we end up pushing the end tag we
    // want to ensure there is no extra closing tag pushed
    case 'title':
    case 'style':
    case 'script': {
      if (!enableFloat) {
        break;
      }
      // Fall through
    }

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
      return;
    }
    // Postamble end tags
    // When float is enabled we omit the end tags for body and html when
    // they represent the Document.body and Document.documentElement Nodes.
    // This is so we can withhold them until the postamble when we know
    // we won't emit any more tags
    case 'body': {
      if (enableFloat && formatContext.insertionMode <= HTML_HTML_MODE) {
        responseState.hasBody = true;
        return;
      }
      break;
    }
    case 'html':
      if (enableFloat && formatContext.insertionMode === ROOT_HTML_MODE) {
        return;
      }
      break;
  }
  target.push(endTag1, stringToChunk(type), endTag2);
}

export function writeCompletedRoot(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  const bootstrapChunks = responseState.bootstrapChunks;
  let i = 0;
  for (; i < bootstrapChunks.length - 1; i++) {
    writeChunk(destination, bootstrapChunks[i]);
  }
  if (i < bootstrapChunks.length) {
    return writeChunkAndReturn(destination, bootstrapChunks[i]);
  }
  return true;
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
  return writeChunkAndReturn(destination, placeholder2);
}

// Suspense boundaries are encoded as comments.
const startCompletedSuspenseBoundary = stringToPrecomputedChunk('<!--$-->');
const startPendingSuspenseBoundary1 = stringToPrecomputedChunk(
  '<!--$?--><template id="',
);
const startPendingSuspenseBoundary2 = stringToPrecomputedChunk('"></template>');
const startClientRenderedSuspenseBoundary =
  stringToPrecomputedChunk('<!--$!-->');
const endSuspenseBoundary = stringToPrecomputedChunk('<!--/$-->');

const clientRenderedSuspenseBoundaryError1 =
  stringToPrecomputedChunk('<template');
const clientRenderedSuspenseBoundaryErrorAttrInterstitial =
  stringToPrecomputedChunk('"');
const clientRenderedSuspenseBoundaryError1A =
  stringToPrecomputedChunk(' data-dgst="');
const clientRenderedSuspenseBoundaryError1B =
  stringToPrecomputedChunk(' data-msg="');
const clientRenderedSuspenseBoundaryError1C =
  stringToPrecomputedChunk(' data-stck="');
const clientRenderedSuspenseBoundaryError2 =
  stringToPrecomputedChunk('></template>');

export function pushStartCompletedSuspenseBoundary(
  target: Array<Chunk | PrecomputedChunk>,
) {
  target.push(startCompletedSuspenseBoundary);
}

export function pushEndCompletedSuspenseBoundary(
  target: Array<Chunk | PrecomputedChunk>,
) {
  target.push(endSuspenseBoundary);
}

export function writeStartCompletedSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  return writeChunkAndReturn(destination, startCompletedSuspenseBoundary);
}
export function writeStartPendingSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
  id: SuspenseBoundaryID,
): boolean {
  writeChunk(destination, startPendingSuspenseBoundary1);

  if (id === null) {
    throw new Error(
      'An ID must have been assigned before we can complete the boundary.',
    );
  }

  writeChunk(destination, id);
  return writeChunkAndReturn(destination, startPendingSuspenseBoundary2);
}
export function writeStartClientRenderedSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
  errorDigest: ?string,
  errorMesssage: ?string,
  errorComponentStack: ?string,
): boolean {
  let result;
  result = writeChunkAndReturn(
    destination,
    startClientRenderedSuspenseBoundary,
  );
  writeChunk(destination, clientRenderedSuspenseBoundaryError1);
  if (errorDigest) {
    writeChunk(destination, clientRenderedSuspenseBoundaryError1A);
    writeChunk(destination, stringToChunk(escapeTextForBrowser(errorDigest)));
    writeChunk(
      destination,
      clientRenderedSuspenseBoundaryErrorAttrInterstitial,
    );
  }
  if (__DEV__) {
    if (errorMesssage) {
      writeChunk(destination, clientRenderedSuspenseBoundaryError1B);
      writeChunk(
        destination,
        stringToChunk(escapeTextForBrowser(errorMesssage)),
      );
      writeChunk(
        destination,
        clientRenderedSuspenseBoundaryErrorAttrInterstitial,
      );
    }
    if (errorComponentStack) {
      writeChunk(destination, clientRenderedSuspenseBoundaryError1C);
      writeChunk(
        destination,
        stringToChunk(escapeTextForBrowser(errorComponentStack)),
      );
      writeChunk(
        destination,
        clientRenderedSuspenseBoundaryErrorAttrInterstitial,
      );
    }
  }
  result = writeChunkAndReturn(
    destination,
    clientRenderedSuspenseBoundaryError2,
  );
  return result;
}
export function writeEndCompletedSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  return writeChunkAndReturn(destination, endSuspenseBoundary);
}
export function writeEndPendingSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  return writeChunkAndReturn(destination, endSuspenseBoundary);
}
export function writeEndClientRenderedSuspenseBoundary(
  destination: Destination,
  responseState: ResponseState,
): boolean {
  return writeChunkAndReturn(destination, endSuspenseBoundary);
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
    case ROOT_HTML_MODE:
    case HTML_HTML_MODE:
    case HTML_MODE: {
      writeChunk(destination, startSegmentHTML);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunkAndReturn(destination, startSegmentHTML2);
    }
    case SVG_MODE: {
      writeChunk(destination, startSegmentSVG);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunkAndReturn(destination, startSegmentSVG2);
    }
    case MATHML_MODE: {
      writeChunk(destination, startSegmentMathML);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunkAndReturn(destination, startSegmentMathML2);
    }
    case HTML_TABLE_MODE: {
      writeChunk(destination, startSegmentTable);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunkAndReturn(destination, startSegmentTable2);
    }
    // TODO: For the rest of these, there will be extra wrapper nodes that never
    // get deleted from the document. We need to delete the table too as part
    // of the injected scripts. They are invisible though so it's not too terrible
    // and it's kind of an edge case to suspend in a table. Totally supported though.
    case HTML_TABLE_BODY_MODE: {
      writeChunk(destination, startSegmentTableBody);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunkAndReturn(destination, startSegmentTableBody2);
    }
    case HTML_TABLE_ROW_MODE: {
      writeChunk(destination, startSegmentTableRow);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunkAndReturn(destination, startSegmentTableRow2);
    }
    case HTML_COLGROUP_MODE: {
      writeChunk(destination, startSegmentColGroup);
      writeChunk(destination, responseState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunkAndReturn(destination, startSegmentColGroup2);
    }
    default: {
      throw new Error('Unknown insertion mode. This is a bug in React.');
    }
  }
}
export function writeEndSegment(
  destination: Destination,
  formatContext: FormatContext,
): boolean {
  switch (formatContext.insertionMode) {
    case ROOT_HTML_MODE:
    case HTML_HTML_MODE:
    case HTML_MODE: {
      return writeChunkAndReturn(destination, endSegmentHTML);
    }
    case SVG_MODE: {
      return writeChunkAndReturn(destination, endSegmentSVG);
    }
    case MATHML_MODE: {
      return writeChunkAndReturn(destination, endSegmentMathML);
    }
    case HTML_TABLE_MODE: {
      return writeChunkAndReturn(destination, endSegmentTable);
    }
    case HTML_TABLE_BODY_MODE: {
      return writeChunkAndReturn(destination, endSegmentTableBody);
    }
    case HTML_TABLE_ROW_MODE: {
      return writeChunkAndReturn(destination, endSegmentTableRow);
    }
    case HTML_COLGROUP_MODE: {
      return writeChunkAndReturn(destination, endSegmentColGroup);
    }
    default: {
      throw new Error('Unknown insertion mode. This is a bug in React.');
    }
  }
}

const completeSegmentScript1Full = stringToPrecomputedChunk(
  completeSegmentFunction + ';$RS("',
);
const completeSegmentScript1Partial = stringToPrecomputedChunk('$RS("');
const completeSegmentScript2 = stringToPrecomputedChunk('","');
const completeSegmentScriptEnd = stringToPrecomputedChunk('")</script>');

const completeSegmentData1 = stringToPrecomputedChunk(
  '<template data-rsi="" data-sid="',
);
const completeSegmentData2 = stringToPrecomputedChunk('" data-pid="');
const completeSegmentDataEnd = dataElementQuotedEnd;

export function writeCompletedSegmentInstruction(
  destination: Destination,
  responseState: ResponseState,
  contentSegmentID: number,
): boolean {
  const scriptFormat =
    !enableFizzExternalRuntime ||
    responseState.streamingFormat === ScriptStreamingFormat;
  if (scriptFormat) {
    writeChunk(destination, responseState.startInlineScript);
    if (
      (responseState.instructions & SentCompleteSegmentFunction) ===
      NothingSent
    ) {
      // The first time we write this, we'll need to include the full implementation.
      responseState.instructions |= SentCompleteSegmentFunction;
      writeChunk(destination, completeSegmentScript1Full);
    } else {
      // Future calls can just reuse the same function.
      writeChunk(destination, completeSegmentScript1Partial);
    }
  } else {
    writeChunk(destination, completeSegmentData1);
  }

  // Write function arguments, which are string literals
  writeChunk(destination, responseState.segmentPrefix);
  const formattedID = stringToChunk(contentSegmentID.toString(16));
  writeChunk(destination, formattedID);
  if (scriptFormat) {
    writeChunk(destination, completeSegmentScript2);
  } else {
    writeChunk(destination, completeSegmentData2);
  }
  writeChunk(destination, responseState.placeholderPrefix);
  writeChunk(destination, formattedID);

  if (scriptFormat) {
    return writeChunkAndReturn(destination, completeSegmentScriptEnd);
  } else {
    return writeChunkAndReturn(destination, completeSegmentDataEnd);
  }
}

const completeBoundaryScript1Full = stringToPrecomputedChunk(
  completeBoundaryFunction + '$RC("',
);
const completeBoundaryScript1Partial = stringToPrecomputedChunk('$RC("');

const completeBoundaryWithStylesScript1FullBoth = stringToPrecomputedChunk(
  completeBoundaryFunction + styleInsertionFunction + '$RR("',
);
const completeBoundaryWithStylesScript1FullPartial = stringToPrecomputedChunk(
  styleInsertionFunction + '$RR("',
);

const completeBoundaryWithStylesScript1Partial =
  stringToPrecomputedChunk('$RR("');
const completeBoundaryScript2 = stringToPrecomputedChunk('","');
const completeBoundaryScript3a = stringToPrecomputedChunk('",');
const completeBoundaryScript3b = stringToPrecomputedChunk('"');
const completeBoundaryScriptEnd = stringToPrecomputedChunk(')</script>');

const completeBoundaryData1 = stringToPrecomputedChunk(
  '<template data-rci="" data-bid="',
);
const completeBoundaryWithStylesData1 = stringToPrecomputedChunk(
  '<template data-rri="" data-bid="',
);
const completeBoundaryData2 = stringToPrecomputedChunk('" data-sid="');
const completeBoundaryData3a = stringToPrecomputedChunk('" data-sty="');
const completeBoundaryDataEnd = dataElementQuotedEnd;

export function writeCompletedBoundaryInstruction(
  destination: Destination,
  responseState: ResponseState,
  boundaryID: SuspenseBoundaryID,
  contentSegmentID: number,
  boundaryResources: BoundaryResources,
): boolean {
  let requiresStyleInsertion;
  if (enableFloat) {
    requiresStyleInsertion = responseState.stylesToHoist;
    // If necessary stylesheets will be flushed with this instruction.
    // Any style tags not yet hoisted in the Document will also be hoisted.
    // We reset this state since after this instruction executes all styles
    // up to this point will have been hoisted
    responseState.stylesToHoist = false;
  }
  const scriptFormat =
    !enableFizzExternalRuntime ||
    responseState.streamingFormat === ScriptStreamingFormat;
  if (scriptFormat) {
    writeChunk(destination, responseState.startInlineScript);
    if (enableFloat && requiresStyleInsertion) {
      if (
        (responseState.instructions & SentCompleteBoundaryFunction) ===
        NothingSent
      ) {
        responseState.instructions |=
          SentStyleInsertionFunction | SentCompleteBoundaryFunction;
        writeChunk(
          destination,
          clonePrecomputedChunk(completeBoundaryWithStylesScript1FullBoth),
        );
      } else if (
        (responseState.instructions & SentStyleInsertionFunction) ===
        NothingSent
      ) {
        responseState.instructions |= SentStyleInsertionFunction;
        writeChunk(destination, completeBoundaryWithStylesScript1FullPartial);
      } else {
        writeChunk(destination, completeBoundaryWithStylesScript1Partial);
      }
    } else {
      if (
        (responseState.instructions & SentCompleteBoundaryFunction) ===
        NothingSent
      ) {
        responseState.instructions |= SentCompleteBoundaryFunction;
        writeChunk(destination, completeBoundaryScript1Full);
      } else {
        writeChunk(destination, completeBoundaryScript1Partial);
      }
    }
  } else {
    if (enableFloat && requiresStyleInsertion) {
      writeChunk(destination, completeBoundaryWithStylesData1);
    } else {
      writeChunk(destination, completeBoundaryData1);
    }
  }

  if (boundaryID === null) {
    throw new Error(
      'An ID must have been assigned before we can complete the boundary.',
    );
  }

  // Write function arguments, which are string and array literals
  const formattedContentID = stringToChunk(contentSegmentID.toString(16));
  writeChunk(destination, boundaryID);
  if (scriptFormat) {
    writeChunk(destination, completeBoundaryScript2);
  } else {
    writeChunk(destination, completeBoundaryData2);
  }
  writeChunk(destination, responseState.segmentPrefix);
  writeChunk(destination, formattedContentID);
  if (enableFloat && requiresStyleInsertion) {
    // Script and data writers must format this differently:
    //  - script writer emits an array literal, whose string elements are
    //    escaped for javascript  e.g. ["A", "B"]
    //  - data writer emits a string literal, which is escaped as html
    //    e.g. [&#34;A&#34;, &#34;B&#34;]
    if (scriptFormat) {
      writeChunk(destination, completeBoundaryScript3a);
      // boundaryResources encodes an array literal
      writeStyleResourceDependenciesInJS(destination, boundaryResources);
    } else {
      writeChunk(destination, completeBoundaryData3a);
      writeStyleResourceDependenciesInAttr(destination, boundaryResources);
    }
  } else {
    if (scriptFormat) {
      writeChunk(destination, completeBoundaryScript3b);
    }
  }
  if (scriptFormat) {
    return writeChunkAndReturn(destination, completeBoundaryScriptEnd);
  } else {
    return writeChunkAndReturn(destination, completeBoundaryDataEnd);
  }
}

const clientRenderScript1Full = stringToPrecomputedChunk(
  clientRenderFunction + ';$RX("',
);
const clientRenderScript1Partial = stringToPrecomputedChunk('$RX("');
const clientRenderScript1A = stringToPrecomputedChunk('"');
const clientRenderErrorScriptArgInterstitial = stringToPrecomputedChunk(',');
const clientRenderScriptEnd = stringToPrecomputedChunk(')</script>');

const clientRenderData1 = stringToPrecomputedChunk(
  '<template data-rxi="" data-bid="',
);
const clientRenderData2 = stringToPrecomputedChunk('" data-dgst="');
const clientRenderData3 = stringToPrecomputedChunk('" data-msg="');
const clientRenderData4 = stringToPrecomputedChunk('" data-stck="');
const clientRenderDataEnd = dataElementQuotedEnd;

export function writeClientRenderBoundaryInstruction(
  destination: Destination,
  responseState: ResponseState,
  boundaryID: SuspenseBoundaryID,
  errorDigest: ?string,
  errorMessage?: string,
  errorComponentStack?: string,
): boolean {
  const scriptFormat =
    !enableFizzExternalRuntime ||
    responseState.streamingFormat === ScriptStreamingFormat;
  if (scriptFormat) {
    writeChunk(destination, responseState.startInlineScript);
    if (
      (responseState.instructions & SentClientRenderFunction) ===
      NothingSent
    ) {
      // The first time we write this, we'll need to include the full implementation.
      responseState.instructions |= SentClientRenderFunction;
      writeChunk(destination, clientRenderScript1Full);
    } else {
      // Future calls can just reuse the same function.
      writeChunk(destination, clientRenderScript1Partial);
    }
  } else {
    // <template data-rxi="" data-bid="
    writeChunk(destination, clientRenderData1);
  }

  if (boundaryID === null) {
    throw new Error(
      'An ID must have been assigned before we can complete the boundary.',
    );
  }

  writeChunk(destination, boundaryID);
  if (scriptFormat) {
    // " needs to be inserted for scripts, since ArgInterstitual does not contain
    // leading or trailing quotes
    writeChunk(destination, clientRenderScript1A);
  }

  if (errorDigest || errorMessage || errorComponentStack) {
    if (scriptFormat) {
      // ,"JSONString"
      writeChunk(destination, clientRenderErrorScriptArgInterstitial);
      writeChunk(
        destination,
        stringToChunk(escapeJSStringsForInstructionScripts(errorDigest || '')),
      );
    } else {
      // " data-dgst="HTMLString
      writeChunk(destination, clientRenderData2);
      writeChunk(
        destination,
        stringToChunk(escapeTextForBrowser(errorDigest || '')),
      );
    }
  }
  if (errorMessage || errorComponentStack) {
    if (scriptFormat) {
      // ,"JSONString"
      writeChunk(destination, clientRenderErrorScriptArgInterstitial);
      writeChunk(
        destination,
        stringToChunk(escapeJSStringsForInstructionScripts(errorMessage || '')),
      );
    } else {
      // " data-msg="HTMLString
      writeChunk(destination, clientRenderData3);
      writeChunk(
        destination,
        stringToChunk(escapeTextForBrowser(errorMessage || '')),
      );
    }
  }
  if (errorComponentStack) {
    // ,"JSONString"
    if (scriptFormat) {
      writeChunk(destination, clientRenderErrorScriptArgInterstitial);
      writeChunk(
        destination,
        stringToChunk(
          escapeJSStringsForInstructionScripts(errorComponentStack),
        ),
      );
    } else {
      // " data-stck="HTMLString
      writeChunk(destination, clientRenderData4);
      writeChunk(
        destination,
        stringToChunk(escapeTextForBrowser(errorComponentStack)),
      );
    }
  }

  if (scriptFormat) {
    // ></script>
    return writeChunkAndReturn(destination, clientRenderScriptEnd);
  } else {
    // "></template>
    return writeChunkAndReturn(destination, clientRenderDataEnd);
  }
}

const regexForJSStringsInInstructionScripts = /[<\u2028\u2029]/g;
function escapeJSStringsForInstructionScripts(input: string): string {
  const escaped = JSON.stringify(input);
  return escaped.replace(regexForJSStringsInInstructionScripts, match => {
    switch (match) {
      // santizing breaking out of strings and script tags
      case '<':
        return '\\u003c';
      case '\u2028':
        return '\\u2028';
      case '\u2029':
        return '\\u2029';
      default: {
        // eslint-disable-next-line react-internal/prod-error-codes
        throw new Error(
          'escapeJSStringsForInstructionScripts encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React',
        );
      }
    }
  });
}

const regexForJSStringsInScripts = /[&><\u2028\u2029]/g;
function escapeJSObjectForInstructionScripts(input: Object): string {
  const escaped = JSON.stringify(input);
  return escaped.replace(regexForJSStringsInScripts, match => {
    switch (match) {
      // santizing breaking out of strings and script tags
      case '&':
        return '\\u0026';
      case '>':
        return '\\u003e';
      case '<':
        return '\\u003c';
      case '\u2028':
        return '\\u2028';
      case '\u2029':
        return '\\u2029';
      default: {
        // eslint-disable-next-line react-internal/prod-error-codes
        throw new Error(
          'escapeJSObjectForInstructionScripts encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React',
        );
      }
    }
  });
}

const lateStyleTagResourceOpen1 = stringToPrecomputedChunk(
  '<style media="not all" data-precedence="',
);
const lateStyleTagResourceOpen2 = stringToPrecomputedChunk('" data-href="');
const lateStyleTagResourceOpen3 = stringToPrecomputedChunk('">');
const lateStyleTagTemplateClose = stringToPrecomputedChunk('</style>');

// Tracks whether the boundary currently flushing is flushign style tags or has any
// stylesheet dependencies not flushed in the Preamble.
let currentlyRenderingBoundaryHasStylesToHoist = false;

// Acts as a return value for the forEach execution of style tag flushing.
let destinationHasCapacity = true;

function flushStyleTagsLateForBoundary(
  this: Destination,
  resource: StyleResource,
) {
  if (
    resource.type === 'stylesheet' &&
    (resource.state & FlushedInPreamble) === NoState
  ) {
    currentlyRenderingBoundaryHasStylesToHoist = true;
  } else if (resource.type === 'style') {
    const chunks = resource.chunks;
    const hrefs = resource.props.hrefs;
    let i = 0;
    if (chunks.length) {
      writeChunk(this, lateStyleTagResourceOpen1);
      writeChunk(
        this,
        stringToChunk(escapeTextForBrowser(resource.props.precedence)),
      );
      if (hrefs.length) {
        writeChunk(this, lateStyleTagResourceOpen2);
        for (; i < hrefs.length - 1; i++) {
          writeChunk(this, stringToChunk(escapeTextForBrowser(hrefs[i])));
          writeChunk(this, spaceSeparator);
        }
        writeChunk(this, stringToChunk(escapeTextForBrowser(hrefs[i])));
      }
      writeChunk(this, lateStyleTagResourceOpen3);
      for (i = 0; i < chunks.length; i++) {
        writeChunk(this, chunks[i]);
      }
      destinationHasCapacity = writeChunkAndReturn(
        this,
        lateStyleTagTemplateClose,
      );

      // We wrote style tags for this boundary and we may need to emit a script
      // to hoist them.
      currentlyRenderingBoundaryHasStylesToHoist = true;

      // style resources can flush continuously since more rules may be written into
      // them with new hrefs. Instead of marking it flushed, we simply reset the chunks
      // and hrefs
      chunks.length = 0;
      hrefs.length = 0;
    }
  }
}

export function writeResourcesForBoundary(
  destination: Destination,
  boundaryResources: BoundaryResources,
  responseState: ResponseState,
): boolean {
  // Reset these on each invocation, they are only safe to read in this function
  currentlyRenderingBoundaryHasStylesToHoist = false;
  destinationHasCapacity = true;

  // Flush each Boundary resource
  boundaryResources.forEach(flushStyleTagsLateForBoundary, destination);
  if (currentlyRenderingBoundaryHasStylesToHoist) {
    responseState.stylesToHoist = true;
  }
  return destinationHasCapacity;
}

function flushResourceInPreamble<T: Resource>(this: Destination, resource: T) {
  if ((resource.state & (Flushed | Blocked)) === NoState) {
    const chunks = resource.chunks;
    for (let i = 0; i < chunks.length; i++) {
      writeChunk(this, chunks[i]);
    }
    resource.state |= FlushedInPreamble;
  }
}

function flushResourceLate<T: Resource>(this: Destination, resource: T) {
  if ((resource.state & (Flushed | Blocked)) === NoState) {
    const chunks = resource.chunks;
    for (let i = 0; i < chunks.length; i++) {
      writeChunk(this, chunks[i]);
    }
    resource.state |= FlushedLate;
  }
}

// This must always be read after flushing stylesheet styles. we know we will encounter a style resource
// per precedence and it will be set before ready so we cast this to avoid an extra check at runtime
let precedenceStyleTagResource: StyleTagResource = (null: any);

// This flags let's us opt out of flushing a placeholder style tag to emit the precedence in the right order.
// If a stylesheet was flushed then we have the precedence order preserved and only need to emit <style> tags
// if there are actual chunks to flush
let didFlushPrecedence = false;

function flushStyleInPreamble(
  this: Destination,
  resource: StyleResource,
  key: mixed,
  set: Set<StyleResource>,
) {
  const chunks = resource.chunks;
  if (resource.state & Flushed) {
    // In theory this should never happen because we clear from the
    // Set on flush but to ensure correct semantics we don't emit
    // anything if we are in this state.
    set.delete(resource);
  } else {
    // We can emit this style or stylesheet as is.
    if (resource.type === 'style') {
      precedenceStyleTagResource = resource;
      return;
    }

    // We still need to encode stylesheet chunks
    // because unlike most Hoistables and Resources we do not eagerly encode
    // them during render. This is because if we flush late we have to send a
    // different encoding and we don't want to encode multiple times
    pushLinkImpl(chunks, resource.props);
    for (let i = 0; i < chunks.length; i++) {
      writeChunk(this, chunks[i]);
    }
    resource.state |= FlushedInPreamble;
    didFlushPrecedence = true;
  }
}

const styleTagResourceOpen1 = stringToPrecomputedChunk(
  '<style data-precedence="',
);
const styleTagResourceOpen2 = stringToPrecomputedChunk('" data-href="');
const spaceSeparator = stringToPrecomputedChunk(' ');
const styleTagResourceOpen3 = stringToPrecomputedChunk('">');

const styleTagResourceClose = stringToPrecomputedChunk('</style>');

function flushAllStylesInPreamble(
  this: Destination,
  set: Set<StyleResource>,
  precedence: string,
) {
  didFlushPrecedence = false;
  set.forEach(flushStyleInPreamble, this);
  set.clear();

  const chunks = precedenceStyleTagResource.chunks;
  const hrefs = precedenceStyleTagResource.props.hrefs;
  if (didFlushPrecedence === false || chunks.length) {
    writeChunk(this, styleTagResourceOpen1);
    writeChunk(this, stringToChunk(escapeTextForBrowser(precedence)));
    let i = 0;
    if (hrefs.length) {
      writeChunk(this, styleTagResourceOpen2);
      for (; i < hrefs.length - 1; i++) {
        writeChunk(this, stringToChunk(escapeTextForBrowser(hrefs[i])));
        writeChunk(this, spaceSeparator);
      }
      writeChunk(this, stringToChunk(escapeTextForBrowser(hrefs[i])));
    }
    writeChunk(this, styleTagResourceOpen3);
    for (i = 0; i < chunks.length; i++) {
      writeChunk(this, chunks[i]);
    }
    writeChunk(this, styleTagResourceClose);

    // style resources can flush continuously since more rules may be written into
    // them with new hrefs. Instead of marking it flushed, we simply reset the chunks
    // and hrefs
    chunks.length = 0;
    hrefs.length = 0;
  }
}

function preloadLateStyle(this: Destination, resource: StyleResource) {
  if (__DEV__) {
    if (resource.state & PreloadFlushed) {
      console.error(
        'React encountered a Stylesheet Resource that already flushed a Preload when it was not expected to. This is a bug in React.',
      );
    }
  }

  if (resource.type === 'style') {
    // <style> tags do not need to be preloaded
    return;
  }

  const chunks = resource.chunks;
  const preloadProps = preloadAsStylePropsFromProps(
    resource.props.href,
    resource.props,
  );
  pushLinkImpl(chunks, preloadProps);
  for (let i = 0; i < chunks.length; i++) {
    writeChunk(this, chunks[i]);
  }
  resource.state |= PreloadFlushed;
  chunks.length = 0;
}

function preloadLateStyles(
  this: Destination,
  set: Set<StyleResource>,
  precedence: string,
) {
  set.forEach(preloadLateStyle, this);
  set.clear();
}

// We don't bother reporting backpressure at the moment because we expect to
// flush the entire preamble in a single pass. This probably should be modified
// in the future to be backpressure sensitive but that requires a larger refactor
// of the flushing code in Fizz.
export function writePreamble(
  destination: Destination,
  resources: Resources,
  responseState: ResponseState,
  willFlushAllSegments: boolean,
): void {
  // This function must be called exactly once on every request
  if (
    enableFizzExternalRuntime &&
    !willFlushAllSegments &&
    responseState.externalRuntimeConfig
  ) {
    // If the root segment is incomplete due to suspended tasks
    // (e.g. willFlushAllSegments = false) and we are using data
    // streaming format, ensure the external runtime is sent.
    // (User code could choose to send this even earlier by calling
    //  preinit(...), if they know they will suspend).
    const {src, integrity} = responseState.externalRuntimeConfig;
    preinitImpl(resources, src, {as: 'script', integrity});
  }

  const htmlChunks = responseState.htmlChunks;
  const headChunks = responseState.headChunks;

  let i = 0;

  // Emit open tags before Hoistables and Resources
  if (htmlChunks) {
    // We have an <html> to emit as part of the preamble
    for (i = 0; i < htmlChunks.length; i++) {
      writeChunk(destination, htmlChunks[i]);
    }
    if (headChunks) {
      for (i = 0; i < headChunks.length; i++) {
        writeChunk(destination, headChunks[i]);
      }
    } else {
      // We did not render a head but we emitted an <html> so we emit one now
      writeChunk(destination, startChunkForTag('head'));
      writeChunk(destination, endOfStartTag);
    }
  } else if (headChunks) {
    // We do not have an <html> but we do have a <head>
    for (i = 0; i < headChunks.length; i++) {
      writeChunk(destination, headChunks[i]);
    }
  }

  // Emit high priority Hoistables
  const charsetChunks = responseState.charsetChunks;
  for (i = 0; i < charsetChunks.length; i++) {
    writeChunk(destination, charsetChunks[i]);
  }
  charsetChunks.length = 0;

  // emit preconnect resources
  resources.preconnects.forEach(flushResourceInPreamble, destination);
  resources.preconnects.clear();

  const preconnectChunks = responseState.preconnectChunks;
  for (i = 0; i < preconnectChunks.length; i++) {
    writeChunk(destination, preconnectChunks[i]);
  }
  preconnectChunks.length = 0;

  resources.fontPreloads.forEach(flushResourceInPreamble, destination);
  resources.fontPreloads.clear();

  // Flush unblocked stylesheets by precedence
  resources.precedences.forEach(flushAllStylesInPreamble, destination);

  resources.usedStylesheets.forEach(resource => {
    const key = getResourceKey(resource.props.as, resource.props.href);
    if (resources.stylesMap.has(key)) {
      // The underlying stylesheet is represented both as a used stylesheet
      // (a regular component we will attempt to preload) and as a StylesheetResource.
      // We don't want to emit two preloads for the same href so we defer
      // the preload rules of the StylesheetResource when there is a conflict
    } else {
      const chunks = resource.chunks;
      for (i = 0; i < chunks.length; i++) {
        writeChunk(destination, chunks[i]);
      }
    }
  });
  resources.usedStylesheets.clear();

  resources.scripts.forEach(flushResourceInPreamble, destination);
  resources.scripts.clear();

  resources.usedScripts.forEach(flushResourceInPreamble, destination);
  resources.usedScripts.clear();

  resources.explicitStylesheetPreloads.forEach(
    flushResourceInPreamble,
    destination,
  );
  resources.explicitStylesheetPreloads.clear();

  resources.explicitScriptPreloads.forEach(
    flushResourceInPreamble,
    destination,
  );
  resources.explicitScriptPreloads.clear();

  resources.explicitOtherPreloads.forEach(flushResourceInPreamble, destination);
  resources.explicitOtherPreloads.clear();

  // Write embedding preloadChunks
  const preloadChunks = responseState.preloadChunks;
  for (i = 0; i < preloadChunks.length; i++) {
    writeChunk(destination, preloadChunks[i]);
  }
  preloadChunks.length = 0;

  // Write embedding hoistableChunks
  const hoistableChunks = responseState.hoistableChunks;
  for (i = 0; i < hoistableChunks.length; i++) {
    writeChunk(destination, hoistableChunks[i]);
  }
  hoistableChunks.length = 0;

  // Flush closing head if necessary
  if (htmlChunks && headChunks === null) {
    // We have an <html> rendered but no <head> rendered. We however inserted
    // a <head> up above so we need to emit the </head> now. This is safe because
    // if the main content contained the </head> it would also have provided a
    // <head>. This means that all the content inside <html> is either <body> or
    // invalid HTML
    writeChunk(destination, endTag1);
    writeChunk(destination, stringToChunk('head'));
    writeChunk(destination, endTag2);
  }
}

// We don't bother reporting backpressure at the moment because we expect to
// flush the entire preamble in a single pass. This probably should be modified
// in the future to be backpressure sensitive but that requires a larger refactor
// of the flushing code in Fizz.
export function writeHoistables(
  destination: Destination,
  resources: Resources,
  responseState: ResponseState,
): void {
  let i = 0;

  // Emit high priority Hoistables

  // We omit charsetChunks because we have already sent the shell and if it wasn't
  // already sent it is too late now.

  resources.preconnects.forEach(flushResourceLate, destination);
  resources.preconnects.clear();

  const preconnectChunks = responseState.preconnectChunks;
  for (i = 0; i < preconnectChunks.length; i++) {
    writeChunk(destination, preconnectChunks[i]);
  }
  preconnectChunks.length = 0;

  resources.fontPreloads.forEach(flushResourceLate, destination);
  resources.fontPreloads.clear();

  // Preload any stylesheets. these will emit in a render instruction that follows this
  // but we want to kick off preloading as soon as possible
  resources.precedences.forEach(preloadLateStyles, destination);

  resources.usedStylesheets.forEach(resource => {
    const key = getResourceKey(resource.props.as, resource.props.href);
    if (resources.stylesMap.has(key)) {
      // The underlying stylesheet is represented both as a used stylesheet
      // (a regular component we will attempt to preload) and as a StylesheetResource.
      // We don't want to emit two preloads for the same href so we defer
      // the preload rules of the StylesheetResource when there is a conflict
    } else {
      const chunks = resource.chunks;
      for (i = 0; i < chunks.length; i++) {
        writeChunk(destination, chunks[i]);
      }
    }
  });
  resources.usedStylesheets.clear();

  resources.scripts.forEach(flushResourceLate, destination);
  resources.scripts.clear();

  resources.usedScripts.forEach(flushResourceLate, destination);
  resources.usedScripts.clear();

  resources.explicitStylesheetPreloads.forEach(flushResourceLate, destination);
  resources.explicitStylesheetPreloads.clear();

  resources.explicitScriptPreloads.forEach(flushResourceLate, destination);
  resources.explicitScriptPreloads.clear();

  resources.explicitOtherPreloads.forEach(flushResourceLate, destination);
  resources.explicitOtherPreloads.clear();

  // Write embedding preloadChunks
  const preloadChunks = responseState.preloadChunks;
  for (i = 0; i < preloadChunks.length; i++) {
    writeChunk(destination, preloadChunks[i]);
  }
  preloadChunks.length = 0;

  // Write embedding hoistableChunks
  const hoistableChunks = responseState.hoistableChunks;
  for (i = 0; i < hoistableChunks.length; i++) {
    writeChunk(destination, hoistableChunks[i]);
  }
  hoistableChunks.length = 0;
}

export function writePostamble(
  destination: Destination,
  responseState: ResponseState,
): void {
  if (responseState.hasBody) {
    writeChunk(destination, endTag1);
    writeChunk(destination, stringToChunk('body'));
    writeChunk(destination, endTag2);
  }
  if (responseState.htmlChunks) {
    writeChunk(destination, endTag1);
    writeChunk(destination, stringToChunk('html'));
    writeChunk(destination, endTag2);
  }
}

const arrayFirstOpenBracket = stringToPrecomputedChunk('[');
const arraySubsequentOpenBracket = stringToPrecomputedChunk(',[');
const arrayInterstitial = stringToPrecomputedChunk(',');
const arrayCloseBracket = stringToPrecomputedChunk(']');

// This function writes a 2D array of strings to be embedded in javascript.
// E.g.
//  [["JS_escaped_string1", "JS_escaped_string2"]]
function writeStyleResourceDependenciesInJS(
  destination: Destination,
  boundaryResources: BoundaryResources,
): void {
  writeChunk(destination, arrayFirstOpenBracket);

  let nextArrayOpenBrackChunk = arrayFirstOpenBracket;
  boundaryResources.forEach(resource => {
    if (resource.type === 'style') {
      // Style dependencies don't require coordinated reveal and can be omitted
    } else if (resource.state & FlushedInPreamble) {
      // We can elide this dependency because it was flushed in the shell and
      // should be ready before content is shown on the client
    } else if (resource.state & Flushed) {
      // We only need to emit the href because this resource flushed in an earlier
      // boundary already which encoded the attributes necessary to construct
      // the resource instance on the client.
      writeChunk(destination, nextArrayOpenBrackChunk);
      writeStyleResourceDependencyHrefOnlyInJS(
        destination,
        resource.props.href,
      );
      writeChunk(destination, arrayCloseBracket);
      nextArrayOpenBrackChunk = arraySubsequentOpenBracket;
    } else if (resource.type === 'stylesheet') {
      // We need to emit the whole resource for insertion on the client
      writeChunk(destination, nextArrayOpenBrackChunk);
      writeStyleResourceDependencyInJS(
        destination,
        resource.props.href,
        resource.props['data-precedence'],
        resource.props,
      );
      writeChunk(destination, arrayCloseBracket);
      nextArrayOpenBrackChunk = arraySubsequentOpenBracket;

      resource.state |= FlushedLate;
    }
  });
  writeChunk(destination, arrayCloseBracket);
}

/* Helper functions */
function writeStyleResourceDependencyHrefOnlyInJS(
  destination: Destination,
  href: string,
) {
  // We should actually enforce this earlier when the resource is created but for
  // now we make sure we are actually dealing with a string here.
  if (__DEV__) {
    checkAttributeStringCoercion(href, 'href');
  }
  const coercedHref = '' + (href: any);
  writeChunk(
    destination,
    stringToChunk(escapeJSObjectForInstructionScripts(coercedHref)),
  );
}

function writeStyleResourceDependencyInJS(
  destination: Destination,
  href: mixed,
  precedence: mixed,
  props: Object,
) {
  // eslint-disable-next-line react-internal/safe-string-coercion
  const coercedHref = sanitizeURL('' + (href: any));
  writeChunk(
    destination,
    stringToChunk(escapeJSObjectForInstructionScripts(coercedHref)),
  );

  if (__DEV__) {
    checkAttributeStringCoercion(precedence, 'precedence');
  }
  const coercedPrecedence = '' + (precedence: any);
  writeChunk(destination, arrayInterstitial);
  writeChunk(
    destination,
    stringToChunk(escapeJSObjectForInstructionScripts(coercedPrecedence)),
  );

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      switch (propKey) {
        case 'href':
        case 'rel':
        case 'precedence':
        case 'data-precedence': {
          break;
        }
        case 'children':
        case 'dangerouslySetInnerHTML':
          throw new Error(
            `${'link'} is a self-closing tag and must neither have \`children\` nor ` +
              'use `dangerouslySetInnerHTML`.',
          );
        default:
          writeStyleResourceAttributeInJS(destination, propKey, propValue);
          break;
      }
    }
  }
  return null;
}

function writeStyleResourceAttributeInJS(
  destination: Destination,
  name: string,
  value: string | boolean | number | Function | Object, // not null or undefined
): void {
  let attributeName = name.toLowerCase();
  let attributeValue;
  switch (typeof value) {
    case 'function':
    case 'symbol':
      return;
  }

  switch (name) {
    // Reserved names
    case 'innerHTML':
    case 'dangerouslySetInnerHTML':
    case 'suppressContentEditableWarning':
    case 'suppressHydrationWarning':
    case 'style':
      // Ignored
      return;

    // Attribute renames
    case 'className': {
      attributeName = 'class';
      if (__DEV__) {
        checkAttributeStringCoercion(value, attributeName);
      }
      attributeValue = '' + (value: any);
      break;
    }
    // Booleans
    case 'hidden': {
      if (value === false) {
        return;
      }
      attributeValue = '';
      break;
    }
    // Santized URLs
    case 'src':
    case 'href': {
      value = sanitizeURL(value);
      if (__DEV__) {
        checkAttributeStringCoercion(value, attributeName);
      }
      attributeValue = '' + (value: any);
      break;
    }
    default: {
      if (
        // unrecognized event handlers are not SSR'd and we (apparently)
        // use on* as hueristic for these handler props
        name.length > 2 &&
        (name[0] === 'o' || name[0] === 'O') &&
        (name[1] === 'n' || name[1] === 'N')
      ) {
        return;
      }
      if (!isAttributeNameSafe(name)) {
        return;
      }
      if (__DEV__) {
        checkAttributeStringCoercion(value, attributeName);
      }
      attributeValue = '' + (value: any);
    }
  }
  writeChunk(destination, arrayInterstitial);
  writeChunk(
    destination,
    stringToChunk(escapeJSObjectForInstructionScripts(attributeName)),
  );
  writeChunk(destination, arrayInterstitial);
  writeChunk(
    destination,
    stringToChunk(escapeJSObjectForInstructionScripts(attributeValue)),
  );
}

// This function writes a 2D array of strings to be embedded in an attribute
// value and read with JSON.parse in ReactDOMServerExternalRuntime.js
// E.g.
//  [[&quot;JSON_escaped_string1&quot;, &quot;JSON_escaped_string2&quot;]]
function writeStyleResourceDependenciesInAttr(
  destination: Destination,
  boundaryResources: BoundaryResources,
): void {
  writeChunk(destination, arrayFirstOpenBracket);

  let nextArrayOpenBrackChunk = arrayFirstOpenBracket;
  boundaryResources.forEach(resource => {
    if (resource.type === 'style') {
      // Style dependencies don't require coordinated reveal and can be omitted
    } else if (resource.state & FlushedInPreamble) {
      // We can elide this dependency because it was flushed in the shell and
      // should be ready before content is shown on the client
    } else if (resource.state & Flushed) {
      // We only need to emit the href because this resource flushed in an earlier
      // boundary already which encoded the attributes necessary to construct
      // the resource instance on the client.
      writeChunk(destination, nextArrayOpenBrackChunk);
      writeStyleResourceDependencyHrefOnlyInAttr(
        destination,
        resource.props.href,
      );
      writeChunk(destination, arrayCloseBracket);
      nextArrayOpenBrackChunk = arraySubsequentOpenBracket;
    } else if (resource.type === 'stylesheet') {
      // We need to emit the whole resource for insertion on the client
      writeChunk(destination, nextArrayOpenBrackChunk);
      writeStyleResourceDependencyInAttr(
        destination,
        resource.props.href,
        resource.props['data-precedence'],
        resource.props,
      );
      writeChunk(destination, arrayCloseBracket);
      nextArrayOpenBrackChunk = arraySubsequentOpenBracket;

      resource.state |= FlushedLate;
    }
  });
  writeChunk(destination, arrayCloseBracket);
}

/* Helper functions */
function writeStyleResourceDependencyHrefOnlyInAttr(
  destination: Destination,
  href: string,
) {
  // We should actually enforce this earlier when the resource is created but for
  // now we make sure we are actually dealing with a string here.
  if (__DEV__) {
    checkAttributeStringCoercion(href, 'href');
  }
  const coercedHref = '' + (href: any);
  writeChunk(
    destination,
    stringToChunk(escapeTextForBrowser(JSON.stringify(coercedHref))),
  );
}

function writeStyleResourceDependencyInAttr(
  destination: Destination,
  href: mixed,
  precedence: mixed,
  props: Object,
) {
  // eslint-disable-next-line react-internal/safe-string-coercion
  const coercedHref = sanitizeURL('' + (href: any));
  writeChunk(
    destination,
    stringToChunk(escapeTextForBrowser(JSON.stringify(coercedHref))),
  );

  if (__DEV__) {
    checkAttributeStringCoercion(precedence, 'precedence');
  }
  const coercedPrecedence = '' + (precedence: any);
  writeChunk(destination, arrayInterstitial);
  writeChunk(
    destination,
    stringToChunk(escapeTextForBrowser(JSON.stringify(coercedPrecedence))),
  );

  for (const propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      const propValue = props[propKey];
      if (propValue == null) {
        continue;
      }
      switch (propKey) {
        case 'href':
        case 'rel':
        case 'precedence':
        case 'data-precedence': {
          break;
        }
        case 'children':
        case 'dangerouslySetInnerHTML':
          throw new Error(
            `${'link'} is a self-closing tag and must neither have \`children\` nor ` +
              'use `dangerouslySetInnerHTML`.',
          );
        default:
          writeStyleResourceAttributeInAttr(destination, propKey, propValue);
          break;
      }
    }
  }
  return null;
}

function writeStyleResourceAttributeInAttr(
  destination: Destination,
  name: string,
  value: string | boolean | number | Function | Object, // not null or undefined
): void {
  let attributeName = name.toLowerCase();
  let attributeValue;
  switch (typeof value) {
    case 'function':
    case 'symbol':
      return;
  }

  switch (name) {
    // Reserved names
    case 'innerHTML':
    case 'dangerouslySetInnerHTML':
    case 'suppressContentEditableWarning':
    case 'suppressHydrationWarning':
    case 'style':
      // Ignored
      return;

    // Attribute renames
    case 'className': {
      attributeName = 'class';
      if (__DEV__) {
        checkAttributeStringCoercion(value, attributeName);
      }
      attributeValue = '' + (value: any);
      break;
    }

    // Booleans
    case 'hidden': {
      if (value === false) {
        return;
      }
      attributeValue = '';
      break;
    }

    // Santized URLs
    case 'src':
    case 'href': {
      value = sanitizeURL(value);
      if (__DEV__) {
        checkAttributeStringCoercion(value, attributeName);
      }
      attributeValue = '' + (value: any);
      break;
    }
    default: {
      if (
        // unrecognized event handlers are not SSR'd and we (apparently)
        // use on* as hueristic for these handler props
        name.length > 2 &&
        (name[0] === 'o' || name[0] === 'O') &&
        (name[1] === 'n' || name[1] === 'N')
      ) {
        return;
      }
      if (!isAttributeNameSafe(name)) {
        return;
      }
      if (__DEV__) {
        checkAttributeStringCoercion(value, attributeName);
      }
      attributeValue = '' + (value: any);
    }
  }
  writeChunk(destination, arrayInterstitial);
  writeChunk(
    destination,
    stringToChunk(escapeTextForBrowser(JSON.stringify(attributeName))),
  );
  writeChunk(destination, arrayInterstitial);
  writeChunk(
    destination,
    stringToChunk(escapeTextForBrowser(JSON.stringify(attributeValue))),
  );
}

/**
 * Resources
 */

type ResourceStateTag = number;
const NoState /*            */ = 0b0000;
// These tags indicate whether the Resource was flushed and in which phase
const FlushedInPreamble /*  */ = 0b0001;
const FlushedLate /*        */ = 0b0010;
const Flushed /*            */ = 0b0011;
// This tag indicates whether this Resource is blocked from flushing.
// This currently is only used with stylesheets that are blocked by a Boundary
const Blocked /*            */ = 0b0100;
// This tag indicates whether this Resource has been preloaded.
// This generally only makes sense for Resources other than PreloadResource
const PreloadFlushed /*     */ = 0b1000;

type TResource<
  T: 'stylesheet' | 'style' | 'script' | 'preload' | 'preconnect',
  P,
> = {
  type: T,
  chunks: Array<Chunk | PrecomputedChunk>,
  state: ResourceStateTag,
  props: P,
};
// Dev extensions.
// Stylesheets and Scripts rendered with jsx
type RenderedResourceDEV = {
  __provenance: 'rendered',
  __originalProps: any,
};
// Preloads, Stylesheets, and Scripts from ReactDOM.preload or ReactDOM.preinit
type ImperativeResourceDEV = {
  __provenance: 'preload' | 'preinit',
  __originalHref: string,
  __originalOptions: any,
  __propsEquivalent: any,
};
// Preloads created for normal components we rendered but know we can preload early such as
// sync Scripts and stylesheets without precedence or with onLoad/onError handlers
type ImplicitResourceDEV = {
  __provenance: 'implicit',
  __underlyingProps: any,
  __impliedProps: any,
};
type ResourceDEV =
  | RenderedResourceDEV
  | ImperativeResourceDEV
  | ImplicitResourceDEV;

type PreconnectProps = {
  rel: 'preconnect' | 'dns-prefetch',
  href: string,
  [string]: mixed,
};
type PreconnectResource = TResource<'preconnect', null>;

type PreloadProps = {
  rel: 'preload',
  as: string,
  href: string,
  [string]: mixed,
};
type PreloadResource = TResource<'preload', PreloadProps>;

type StylesheetProps = {
  rel: 'stylesheet',
  href: string,
  'data-precedence': string,
  [string]: mixed,
};
type StylesheetResource = TResource<'stylesheet', StylesheetProps>;

type StyleTagProps = {
  hrefs: Array<string>,
  precedence: string,
};
type StyleTagResource = TResource<'style', StyleTagProps>;

type StyleResource = StylesheetResource | StyleTagResource;

type ScriptProps = {
  async: true,
  src: string,
  [string]: mixed,
};
type ScriptResource = TResource<'script', null>;

type Resource =
  | StyleResource
  | ScriptResource
  | PreloadResource
  | PreconnectResource;

export type Resources = {
  // Request local cache
  preloadsMap: Map<string, PreloadResource>,
  preconnectsMap: Map<string, PreconnectResource>,
  stylesMap: Map<string, StyleResource>,
  scriptsMap: Map<string, ScriptResource>,

  // Flushing queues for Resource dependencies
  preconnects: Set<PreconnectResource>,
  fontPreloads: Set<PreloadResource>,
  // usedImagePreloads: Set<PreloadResource>,
  precedences: Map<string, Set<StyleResource>>,
  stylePrecedences: Map<string, StyleTagResource>,
  usedStylesheets: Set<PreloadResource>,
  scripts: Set<ScriptResource>,
  usedScripts: Set<PreloadResource>,
  explicitStylesheetPreloads: Set<PreloadResource>,
  // explicitImagePreloads: Set<PreloadResource>,
  explicitScriptPreloads: Set<PreloadResource>,
  explicitOtherPreloads: Set<PreloadResource>,

  // Module-global-like reference for current boundary resources
  boundaryResources: ?BoundaryResources,
  ...
};

// @TODO add bootstrap script to implicit preloads
export function createResources(): Resources {
  return {
    // persistent
    preloadsMap: new Map(),
    preconnectsMap: new Map(),
    stylesMap: new Map(),
    scriptsMap: new Map(),

    // cleared on flush
    preconnects: new Set(),
    fontPreloads: new Set(),
    // usedImagePreloads: new Set(),
    precedences: new Map(),
    stylePrecedences: new Map(),
    usedStylesheets: new Set(),
    scripts: new Set(),
    usedScripts: new Set(),
    explicitStylesheetPreloads: new Set(),
    // explicitImagePreloads: new Set(),
    explicitScriptPreloads: new Set(),
    explicitOtherPreloads: new Set(),

    // like a module global for currently rendering boundary
    boundaryResources: null,
  };
}

export type BoundaryResources = Set<StyleResource>;

export function createBoundaryResources(): BoundaryResources {
  return new Set();
}

export function setCurrentlyRenderingBoundaryResourcesTarget(
  resources: Resources,
  boundaryResources: null | BoundaryResources,
) {
  resources.boundaryResources = boundaryResources;
}

function getResourceKey(as: string, href: string): string {
  return `[${as}]${href}`;
}

export function prefetchDNS(href: string, options?: mixed) {
  if (!currentResources) {
    // While we expect that preconnect calls are primarily going to be observed
    // during render because effects and events don't run on the server it is
    // still possible that these get called in module scope. This is valid on
    // the client since there is still a document to interact with but on the
    // server we need a request to associate the call to. Because of this we
    // simply return and do not warn.
    return;
  }
  const resources = currentResources;
  if (__DEV__) {
    if (typeof href !== 'string' || !href) {
      console.error(
        'ReactDOM.prefetchDNS(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.',
        getValueDescriptorExpectingObjectForWarning(href),
      );
    } else if (options != null) {
      if (
        typeof options === 'object' &&
        options.hasOwnProperty('crossOrigin')
      ) {
        console.error(
          'ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. It looks like the you are attempting to set a crossOrigin property for this DNS lookup hint. Browsers do not perform DNS queries using CORS and setting this attribute on the resource hint has no effect. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.',
          getValueDescriptorExpectingEnumForWarning(options),
        );
      } else {
        console.error(
          'ReactDOM.prefetchDNS(): Expected only one argument, `href`, but encountered %s as a second argument instead. This argument is reserved for future options and is currently disallowed. Try calling ReactDOM.prefetchDNS() with just a single string argument, `href`.',
          getValueDescriptorExpectingEnumForWarning(options),
        );
      }
    }
  }

  if (typeof href === 'string' && href) {
    const key = getResourceKey('prefetchDNS', href);
    let resource = resources.preconnectsMap.get(key);
    if (!resource) {
      resource = {
        type: 'preconnect',
        chunks: [],
        state: NoState,
        props: null,
      };
      resources.preconnectsMap.set(key, resource);
      pushLinkImpl(
        resource.chunks,
        ({href, rel: 'dns-prefetch'}: PreconnectProps),
      );
    }
    resources.preconnects.add(resource);
  }
}

export function preconnect(href: string, options?: {crossOrigin?: string}) {
  if (!currentResources) {
    // While we expect that preconnect calls are primarily going to be observed
    // during render because effects and events don't run on the server it is
    // still possible that these get called in module scope. This is valid on
    // the client since there is still a document to interact with but on the
    // server we need a request to associate the call to. Because of this we
    // simply return and do not warn.
    return;
  }
  const resources = currentResources;
  if (__DEV__) {
    if (typeof href !== 'string' || !href) {
      console.error(
        'ReactDOM.preconnect(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.',
        getValueDescriptorExpectingObjectForWarning(href),
      );
    } else if (options != null && typeof options !== 'object') {
      console.error(
        'ReactDOM.preconnect(): Expected the `options` argument (second) to be an object but encountered %s instead. The only supported option at this time is `crossOrigin` which accepts a string.',
        getValueDescriptorExpectingEnumForWarning(options),
      );
    } else if (options != null && typeof options.crossOrigin !== 'string') {
      console.error(
        'ReactDOM.preconnect(): Expected the `crossOrigin` option (second argument) to be a string but encountered %s instead. Try removing this option or passing a string value instead.',
        getValueDescriptorExpectingObjectForWarning(options.crossOrigin),
      );
    }
  }

  if (typeof href === 'string' && href) {
    const crossOrigin =
      options == null || typeof options.crossOrigin !== 'string'
        ? null
        : options.crossOrigin === 'use-credentials'
        ? 'use-credentials'
        : '';

    const key = `[preconnect][${
      crossOrigin === null ? 'null' : crossOrigin
    }]${href}`;
    let resource = resources.preconnectsMap.get(key);
    if (!resource) {
      resource = {
        type: 'preconnect',
        chunks: [],
        state: NoState,
        props: null,
      };
      resources.preconnectsMap.set(key, resource);
      pushLinkImpl(
        resource.chunks,
        ({rel: 'preconnect', href, crossOrigin}: PreconnectProps),
      );
    }
    resources.preconnects.add(resource);
  }
}

type PreloadAs = 'style' | 'font' | 'script';
type PreloadOptions = {
  as: PreloadAs,
  crossOrigin?: string,
  integrity?: string,
  type?: string,
};
export function preload(href: string, options: PreloadOptions) {
  if (!currentResources) {
    // While we expect that preload calls are primarily going to be observed
    // during render because effects and events don't run on the server it is
    // still possible that these get called in module scope. This is valid on
    // the client since there is still a document to interact with but on the
    // server we need a request to associate the call to. Because of this we
    // simply return and do not warn.
    return;
  }
  const resources = currentResources;
  if (__DEV__) {
    if (typeof href !== 'string' || !href) {
      console.error(
        'ReactDOM.preload(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.',
        getValueDescriptorExpectingObjectForWarning(href),
      );
    } else if (options == null || typeof options !== 'object') {
      console.error(
        'ReactDOM.preload(): Expected the `options` argument (second) to be an object with an `as` property describing the type of resource to be preloaded but encountered %s instead.',
        getValueDescriptorExpectingEnumForWarning(options),
      );
    } else if (typeof options.as !== 'string') {
      console.error(
        'ReactDOM.preload(): Expected the `as` property in the `options` argument (second) to contain a string value describing the type of resource to be preloaded but encountered %s instead. Values that are valid in for the `as` attribute of a `<link rel="preload" as="..." />` tag are valid here.',
        getValueDescriptorExpectingEnumForWarning(options.as),
      );
    }
  }
  if (
    typeof href === 'string' &&
    href &&
    typeof options === 'object' &&
    options !== null &&
    typeof options.as === 'string'
  ) {
    const as = options.as;
    const key = getResourceKey(as, href);
    let resource = resources.preloadsMap.get(key);
    if (__DEV__) {
      const devResource = getAsResourceDEV(resource);
      if (devResource) {
        switch (devResource.__provenance) {
          case 'preload': {
            const differenceDescription = describeDifferencesForPreloads(
              options,
              devResource.__originalOptions,
            );
            if (differenceDescription) {
              console.error(
                'ReactDOM.preload(): The options provided conflict with another call to `ReactDOM.preload("%s", { as: "%s", ...})`.' +
                  ' React will always use the options it first encounters when preloading a resource for a given `href` and `as` type, and any later options will be ignored if different.' +
                  ' Try updating all calls to `ReactDOM.preload()` with the same `href` and `as` type to use the same options, or eliminate one of the calls.%s',
                href,
                as,
                differenceDescription,
              );
            }
            break;
          }
          case 'implicit': {
            const differenceDescription =
              describeDifferencesForPreloadOverImplicitPreload(
                options,
                devResource.__impliedProps,
              );
            if (differenceDescription) {
              const elementDescription =
                as === 'style'
                  ? '<link rel="stylesheet" ... />'
                  : as === 'script'
                  ? '<script ... />'
                  : null;
              if (elementDescription) {
                console.error(
                  'ReactDOM.preload(): For `href` "%s", The options provided conflict with props on a matching %s element. When the preload' +
                    ' options disagree with the underlying resource it usually means the browser will not be able to use the preload when the resource' +
                    ' is fetched, negating any benefit the preload would provide. React will preload the resource using props derived from the resource instead' +
                    ' and ignore the options provided to the `ReactDOM.preload()` call. In general, preloading is useful when you expect to' +
                    ' render a resource soon but have not yet done so. In this case since the underlying resource was already rendered the preload call' +
                    ' may be extraneous. Try removing the call, otherwise try adjusting both the props on the %s and the options' +
                    ' passed to `ReactDOM.preload()` to agree.%s',
                  href,
                  elementDescription,
                  elementDescription,
                  differenceDescription,
                );
              }
            }
            break;
          }
        }
      }
    }
    if (!resource) {
      resource = {
        type: 'preload',
        chunks: [],
        state: NoState,
        props: preloadPropsFromPreloadOptions(href, as, options),
      };
      resources.preloadsMap.set(key, resource);
      if (__DEV__) {
        markAsImperativeResourceDEV(
          resource,
          'preload',
          href,
          options,
          resource.props,
        );
      }

      pushLinkImpl(resource.chunks, resource.props);
    }
    switch (as) {
      case 'font': {
        resources.fontPreloads.add(resource);
        break;
      }
      case 'style': {
        resources.explicitStylesheetPreloads.add(resource);
        break;
      }
      case 'script': {
        resources.explicitScriptPreloads.add(resource);
        break;
      }
      default: {
        resources.explicitOtherPreloads.add(resource);
      }
    }
  }
}

type PreinitAs = 'style' | 'script';
type PreinitOptions = {
  as: PreinitAs,
  precedence?: string,
  crossOrigin?: string,
  integrity?: string,
};
export function preinit(href: string, options: PreinitOptions): void {
  if (!currentResources) {
    // While we expect that preinit calls are primarily going to be observed
    // during render because effects and events don't run on the server it is
    // still possible that these get called in module scope. This is valid on
    // the client since there is still a document to interact with but on the
    // server we need a request to associate the call to. Because of this we
    // simply return and do not warn.
    return;
  }
  preinitImpl(currentResources, href, options);
}

// On the server, preinit may be called outside of render when sending an
// external SSR runtime as part of the initial resources payload. Since this
// is an internal React call, we do not need to use the resources stack.
function preinitImpl(
  resources: Resources,
  href: string,
  options: PreinitOptions,
): void {
  if (__DEV__) {
    if (typeof href !== 'string' || !href) {
      console.error(
        'ReactDOM.preinit(): Expected the `href` argument (first) to be a non-empty string but encountered %s instead.',
        getValueDescriptorExpectingObjectForWarning(href),
      );
    } else if (options == null || typeof options !== 'object') {
      console.error(
        'ReactDOM.preinit(): Expected the `options` argument (second) to be an object with an `as` property describing the type of resource to be preinitialized but encountered %s instead.',
        getValueDescriptorExpectingEnumForWarning(options),
      );
    } else if (options.as !== 'style' && options.as !== 'script') {
      console.error(
        'ReactDOM.preinit(): Expected the `as` property in the `options` argument (second) to contain a valid value describing the type of resource to be preinitialized but encountered %s instead. Valid values for `as` are "style" and "script".',
        getValueDescriptorExpectingEnumForWarning(options.as),
      );
    }
  }
  if (
    typeof href === 'string' &&
    href &&
    typeof options === 'object' &&
    options !== null
  ) {
    const as = options.as;
    switch (as) {
      case 'style': {
        const key = getResourceKey(as, href);
        let resource = resources.stylesMap.get(key);
        const precedence = options.precedence || 'default';
        if (__DEV__) {
          const devResource = getAsResourceDEV(resource);
          if (devResource) {
            const resourceProps = stylesheetPropsFromPreinitOptions(
              href,
              precedence,
              options,
            );
            const propsEquivalent = {
              ...resourceProps,
              precedence: options.precedence,
              ['data-precedence']: null,
            };
            switch (devResource.__provenance) {
              case 'rendered': {
                const differenceDescription =
                  describeDifferencesForPreinitOverStylesheet(
                    // Diff the props from the JSX element, not the derived resource props
                    propsEquivalent,
                    devResource.__originalProps,
                  );
                if (differenceDescription) {
                  console.error(
                    'ReactDOM.preinit(): For `href` "%s", the options provided conflict with props found on a <link rel="stylesheet" precedence="%s" href="%s" .../> that was already rendered.' +
                      ' React will always use the props or options it first encounters for a hoistable stylesheet for a given `href` and any later props or options will be ignored if different.' +
                      ' Generally, ReactDOM.preinit() is useful when you are not yet rendering a stylesheet but you anticipate it will be used soon.' +
                      ' In this case the stylesheet was already rendered so preinitializing it does not provide any additional benefit.' +
                      ' To resolve, try making the props and options agree between the <link rel="stylesheet" .../> and the `ReactDOM.preinit()` call or' +
                      ' remove the `ReactDOM.preinit()` call.%s',
                    href,
                    devResource.__originalProps.precedence,
                    href,
                    differenceDescription,
                  );
                }
                break;
              }
              case 'preinit': {
                const differenceDescription = describeDifferencesForPreinits(
                  // Diff the props from the JSX element, not the derived resource props
                  propsEquivalent,
                  devResource.__propsEquivalent,
                );
                if (differenceDescription) {
                  console.error(
                    'ReactDOM.preinit(): For `href` "%s", the options provided conflict with another call to `ReactDOM.preinit("%s", { as: "style", ... })`.' +
                      ' React will always use the options it first encounters when preinitializing a hoistable stylesheet for a given `href` and any later options will be ignored if different.' +
                      ' Try updating all calls to `ReactDOM.preinit()` for a given `href` to use the same options, or only call `ReactDOM.preinit()` once per `href`.%s',
                    href,
                    href,
                    differenceDescription,
                  );
                }
                break;
              }
            }
          }
        }
        if (!resource) {
          resource = {
            type: 'stylesheet',
            chunks: ([]: Array<Chunk | PrecomputedChunk>),
            state: NoState,
            props: stylesheetPropsFromPreinitOptions(href, precedence, options),
          };
          resources.stylesMap.set(key, resource);
          if (__DEV__) {
            markAsImperativeResourceDEV(resource, 'preinit', href, options, {
              ...resource.props,
              precedence,
              ['data-precedence']: undefined,
            });
          }
          let precedenceSet = resources.precedences.get(precedence);
          if (!precedenceSet) {
            precedenceSet = new Set();
            resources.precedences.set(precedence, precedenceSet);
            const emptyStyleResource = {
              type: 'style',
              chunks: ([]: Array<Chunk | PrecomputedChunk>),
              state: NoState,
              props: {
                precedence,
                hrefs: ([]: Array<string>),
              },
            };
            precedenceSet.add(emptyStyleResource);
            if (__DEV__) {
              if (resources.stylePrecedences.has(precedence)) {
                console.error(
                  'React constructed an empty style resource when a style resource already exists for this precedence: "%s". This is a bug in React.',
                  precedence,
                );
              }
            }
            resources.stylePrecedences.set(precedence, emptyStyleResource);
          }
          precedenceSet.add(resource);
        }
        return;
      }
      case 'script': {
        const src = href;
        const key = getResourceKey(as, src);
        let resource = resources.scriptsMap.get(key);
        if (__DEV__) {
          const devResource = getAsResourceDEV(resource);
          if (devResource) {
            const propsEquivalent = scriptPropsFromPreinitOptions(src, options);
            switch (devResource.__provenance) {
              case 'rendered': {
                const differenceDescription =
                  describeDifferencesForPreinitOverScript(
                    // Diff the props from the JSX element, not the derived resource props
                    propsEquivalent,
                    devResource.__originalProps,
                  );
                if (differenceDescription) {
                  console.error(
                    'ReactDOM.preinit(): For `href` "%s", the options provided conflict with props found on a <script async={true} src="%s" .../> that was already rendered.' +
                      ' React will always use the props or options it first encounters for a hoistable script for a given `href` and any later props or options will be ignored if different.' +
                      ' Generally, ReactDOM.preinit() is useful when you are not yet rendering a script but you anticipate it will be used soon and want to go beyond preloading it and have it' +
                      ' execute early. In this case the script was already rendered so preinitializing it does not provide any additional benefit.' +
                      ' To resolve, try making the props and options agree between the <script .../> and the `ReactDOM.preinit()` call or remove the `ReactDOM.preinit()` call.%s',
                    href,
                    href,
                    differenceDescription,
                  );
                }
                break;
              }
              case 'preinit': {
                const differenceDescription = describeDifferencesForPreinits(
                  // Diff the props from the JSX element, not the derived resource props
                  propsEquivalent,
                  devResource.__propsEquivalent,
                );
                if (differenceDescription) {
                  console.error(
                    'ReactDOM.preinit(): For `href` "%s", the options provided conflict with another call to `ReactDOM.preinit("%s", { as: "script", ... })`.' +
                      ' React will always use the options it first encounters when preinitializing a hoistable script for a given `href` and any later options will be ignored if different.' +
                      ' Try updating all calls to `ReactDOM.preinit()` for a given `href` to use the same options, or only call `ReactDOM.preinit()` once per `href`.%s',
                    href,
                    href,
                    differenceDescription,
                  );
                }
                break;
              }
            }
          }
        }
        if (!resource) {
          resource = {
            type: 'script',
            chunks: [],
            state: NoState,
            props: null,
          };
          resources.scriptsMap.set(key, resource);
          const resourceProps = scriptPropsFromPreinitOptions(src, options);
          if (__DEV__) {
            markAsImperativeResourceDEV(
              resource,
              'preinit',
              href,
              options,
              resourceProps,
            );
          }
          resources.scripts.add(resource);
          pushScriptImpl(resource.chunks, resourceProps);
        }
        return;
      }
    }
  }
}

function preloadPropsFromPreloadOptions(
  href: string,
  as: PreloadAs,
  options: PreloadOptions,
): PreloadProps {
  return {
    rel: 'preload',
    as,
    href,
    crossOrigin: as === 'font' ? '' : options.crossOrigin,
    integrity: options.integrity,
    type: options.type,
  };
}

function preloadAsStylePropsFromProps(href: string, props: any): PreloadProps {
  return {
    rel: 'preload',
    as: 'style',
    href: href,
    crossOrigin: props.crossOrigin,
    integrity: props.integrity,
    media: props.media,
    hrefLang: props.hrefLang,
    referrerPolicy: props.referrerPolicy,
  };
}

function preloadAsScriptPropsFromProps(href: string, props: any): PreloadProps {
  return {
    rel: 'preload',
    as: 'script',
    href,
    crossOrigin: props.crossOrigin,
    integrity: props.integrity,
    referrerPolicy: props.referrerPolicy,
  };
}

function stylesheetPropsFromPreinitOptions(
  href: string,
  precedence: string,
  options: PreinitOptions,
): StylesheetProps {
  return {
    rel: 'stylesheet',
    href,
    'data-precedence': precedence,
    crossOrigin: options.crossOrigin,
    integrity: options.integrity,
  };
}

function stylesheetPropsFromRawProps(rawProps: any): StylesheetProps {
  return {
    ...rawProps,
    'data-precedence': rawProps.precedence,
    precedence: null,
  };
}

function adoptPreloadPropsForStylesheetProps(
  resourceProps: StylesheetProps,
  preloadProps: PreloadProps,
): void {
  if (resourceProps.crossOrigin == null)
    resourceProps.crossOrigin = preloadProps.crossOrigin;
  if (resourceProps.integrity == null)
    resourceProps.integrity = preloadProps.integrity;
}

function scriptPropsFromPreinitOptions(
  src: string,
  options: PreinitOptions,
): ScriptProps {
  return {
    src,
    async: true,
    crossOrigin: options.crossOrigin,
    integrity: options.integrity,
  };
}

function adoptPreloadPropsForScriptProps(
  resourceProps: ScriptProps,
  preloadProps: PreloadProps,
): void {
  if (resourceProps.crossOrigin == null)
    resourceProps.crossOrigin = preloadProps.crossOrigin;
  if (resourceProps.integrity == null)
    resourceProps.integrity = preloadProps.integrity;
}

function hoistStyleResource(this: BoundaryResources, resource: StyleResource) {
  this.add(resource);
}

export function hoistResources(
  resources: Resources,
  source: BoundaryResources,
): void {
  const currentBoundaryResources = resources.boundaryResources;
  if (currentBoundaryResources) {
    source.forEach(hoistStyleResource, currentBoundaryResources);
  }
}

function markAsRenderedResourceDEV(
  resource: Resource,
  originalProps: any,
): void {
  if (__DEV__) {
    const devResource: RenderedResourceDEV = (resource: any);
    if (typeof devResource.__provenance === 'string') {
      console.error(
        'Resource already marked for DEV type. This is a bug in React.',
      );
    }
    devResource.__provenance = 'rendered';
    devResource.__originalProps = originalProps;
  } else {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'markAsRenderedResourceDEV was included in a production build. This is a bug in React.',
    );
  }
}

function markAsImperativeResourceDEV(
  resource: Resource,
  provenance: 'preload' | 'preinit',
  originalHref: string,
  originalOptions: any,
  propsEquivalent: any,
): void {
  if (__DEV__) {
    const devResource: ImperativeResourceDEV = (resource: any);
    if (typeof devResource.__provenance === 'string') {
      console.error(
        'Resource already marked for DEV type. This is a bug in React.',
      );
    }
    devResource.__provenance = provenance;
    devResource.__originalHref = originalHref;
    devResource.__originalOptions = originalOptions;
    devResource.__propsEquivalent = propsEquivalent;
  } else {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'markAsImperativeResourceDEV was included in a production build. This is a bug in React.',
    );
  }
}

function markAsImplicitResourceDEV(
  resource: Resource,
  underlyingProps: any,
  impliedProps: any,
): void {
  if (__DEV__) {
    const devResource: ImplicitResourceDEV = (resource: any);
    if (typeof devResource.__provenance === 'string') {
      console.error(
        'Resource already marked for DEV type. This is a bug in React.',
      );
    }
    devResource.__provenance = 'implicit';
    devResource.__underlyingProps = underlyingProps;
    devResource.__impliedProps = impliedProps;
  } else {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'markAsImplicitResourceDEV was included in a production build. This is a bug in React.',
    );
  }
}

function getAsResourceDEV(
  resource: null | void | Resource,
): null | ResourceDEV {
  if (__DEV__) {
    if (resource) {
      if (typeof (resource: any).__provenance === 'string') {
        return (resource: any);
      }
      console.error(
        'Resource was not marked for DEV type. This is a bug in React.',
      );
    }
    return null;
  } else {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'getAsResourceDEV was included in a production build. This is a bug in React.',
    );
  }
}
