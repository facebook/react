/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactNodeList, ReactCustomFormAction} from 'shared/ReactTypes';
import type {
  CrossOriginEnum,
  PreloadImplOptions,
  PreloadModuleImplOptions,
  PreinitStyleOptions,
  PreinitScriptOptions,
  PreinitModuleScriptOptions,
  ImportMap,
} from 'react-dom/src/shared/ReactDOMTypes';

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
  enableFormActions,
  enableFizzExternalRuntime,
} from 'shared/ReactFeatureFlags';

import type {
  Destination,
  Chunk,
  PrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';

import type {FormStatus} from '../shared/ReactDOMFormActions';

import {
  writeChunk,
  writeChunkAndReturn,
  stringToChunk,
  stringToPrecomputedChunk,
  clonePrecomputedChunk,
} from 'react-server/src/ReactServerStreamConfig';
import {
  resolveRequest,
  getResumableState,
  flushResources,
} from 'react-server/src/ReactFizzServer';

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
  formReplaying as formReplayingRuntime,
} from './fizz-instruction-set/ReactDOMFizzInstructionSetInlineCodeStrings';

import {getValueDescriptorExpectingObjectForWarning} from '../shared/ReactDOMResourceValidation';

import {NotPending} from '../shared/ReactDOMFormActions';

import ReactDOMSharedInternals from 'shared/ReactDOMSharedInternals';
const ReactDOMCurrentDispatcher = ReactDOMSharedInternals.Dispatcher;

const ReactDOMServerDispatcher = {
  prefetchDNS,
  preconnect,
  preload,
  preloadModule,
  preinitStyle,
  preinitScript,
  preinitModuleScript,
};

export function prepareHostDispatcher() {
  ReactDOMCurrentDispatcher.current = ReactDOMServerDispatcher;
}

// Used to distinguish these contexts from ones used in other renderers.
// E.g. this can be used to distinguish legacy renderers from this modern one.
export const isPrimaryRenderer = true;

export type StreamingFormat = 0 | 1;
const ScriptStreamingFormat: StreamingFormat = 0;
const DataStreamingFormat: StreamingFormat = 1;

export type InstructionState = number;
const NothingSent /*                      */ = 0b00000;
const SentCompleteSegmentFunction /*      */ = 0b00001;
const SentCompleteBoundaryFunction /*     */ = 0b00010;
const SentClientRenderFunction /*         */ = 0b00100;
const SentStyleInsertionFunction /*       */ = 0b01000;
const SentFormReplayingRuntime /*         */ = 0b10000;

// Per request, global state that is not contextual to the rendering subtree.
// This cannot be resumed and therefore should only contain things that are
// temporary working state or are never used in the prerender pass.
export type RenderState = {
  // These can be recreated from resumable state.
  placeholderPrefix: PrecomputedChunk,
  segmentPrefix: PrecomputedChunk,
  boundaryPrefix: PrecomputedChunk,

  // inline script streaming format, unused if using external runtime / data
  startInlineScript: PrecomputedChunk,

  // the preamble must always flush before resuming, so all these chunks must
  // be null or empty when resuming.

  // preamble chunks
  htmlChunks: null | Array<Chunk | PrecomputedChunk>,
  headChunks: null | Array<Chunk | PrecomputedChunk>,

  // Hoistable chunks
  charsetChunks: Array<Chunk | PrecomputedChunk>,
  preconnectChunks: Array<Chunk | PrecomputedChunk>,
  importMapChunks: Array<Chunk | PrecomputedChunk>,
  preloadChunks: Array<Chunk | PrecomputedChunk>,
  hoistableChunks: Array<Chunk | PrecomputedChunk>,

  // Module-global-like reference for current boundary resources
  boundaryResources: ?BoundaryResources,

  // Module-global-like reference for flushing/hoisting state of style resources
  // We need to track whether the current request has flushed any style resources
  // without sending an instruction to hoist them. we do that here
  stylesToHoist: boolean,

  // We allow the legacy renderer to extend this object.

  ...
};

// Per response, global state that is not contextual to the rendering subtree.
// This is resumable and therefore should be serializable.
export type ResumableState = {
  // external runtime script chunks
  externalRuntimeScript: null | ExternalRuntimeScript, // TODO: Move to a serializable format
  bootstrapChunks: Array<Chunk | PrecomputedChunk>, // TODO: Move to a serializable format.
  idPrefix: string,
  nextFormID: number,
  streamingFormat: StreamingFormat,

  // state for script streaming format, unused if using external runtime / data
  instructions: InstructionState,

  // postamble state
  hasBody: boolean,
  hasHtml: boolean,

  // Resources

  // Request local cache
  preloadsMap: Map<string, PreloadResource>,
  preconnectsMap: Map<string, PreconnectResource>,
  stylesMap: Map<string, StyleResource>,
  scriptsMap: Map<string, ScriptResource>,

  // Flushing queues for Resource dependencies
  preconnects: Set<PreconnectResource>,
  fontPreloads: Set<PreloadResource>,
  highImagePreloads: Set<PreloadResource>,
  // usedImagePreloads: Set<PreloadResource>,
  precedences: Map<string, Set<StyleResource>>,
  stylePrecedences: Map<string, StyleTagResource>,
  bootstrapScripts: Set<PreloadResource>,
  scripts: Set<ScriptResource>,
  bulkPreloads: Set<PreloadResource>,
};

const dataElementQuotedEnd = stringToPrecomputedChunk('"></template>');

const startInlineScript = stringToPrecomputedChunk('<script>');
const endInlineScript = stringToPrecomputedChunk('</script>');

const startScriptSrc = stringToPrecomputedChunk('<script src="');
const startModuleSrc = stringToPrecomputedChunk('<script type="module" src="');
const scriptNonce = stringToPrecomputedChunk('" nonce="');
const scriptIntegirty = stringToPrecomputedChunk('" integrity="');
const scriptCrossOrigin = stringToPrecomputedChunk('" crossorigin="');
const endAsyncScript = stringToPrecomputedChunk('" async=""></script>');

/**
 * This escaping function is designed to work with bootstrapScriptContent and importMap only.
 * because we know we are escaping the entire script. We can avoid for instance
 * escaping html comment string sequences that are valid javascript as well because
 * if there are no sebsequent <script sequences the html parser will never enter
 * script data double escaped state (see: https://www.w3.org/TR/html53/syntax.html#script-data-double-escaped-state)
 *
 * While untrusted script content should be made safe before using this api it will
 * ensure that the script cannot be early terminated or never terminated state
 */
function escapeBootstrapAndImportMapScriptContent(scriptText: string) {
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
  crossOrigin?: string,
};
export type ExternalRuntimeScript = {
  src: string,
  chunks: Array<Chunk | PrecomputedChunk>,
};

const importMapScriptStart = stringToPrecomputedChunk(
  '<script type="importmap">',
);
const importMapScriptEnd = stringToPrecomputedChunk('</script>');

// Allows us to keep track of what we've already written so we can refer back to it.
// if passed externalRuntimeConfig and the enableFizzExternalRuntime feature flag
// is set, the server will send instructions via data attributes (instead of inline scripts)
export function createRenderState(
  resumableState: ResumableState,
  nonce: string | void,
  importMap: ImportMap | void,
): RenderState {
  const inlineScriptWithNonce =
    nonce === undefined
      ? startInlineScript
      : stringToPrecomputedChunk(
          '<script nonce="' + escapeTextForBrowser(nonce) + '">',
        );
  const idPrefix = resumableState.idPrefix;
  const importMapChunks: Array<Chunk | PrecomputedChunk> = [];
  if (importMap !== undefined) {
    const map = importMap;
    importMapChunks.push(importMapScriptStart);
    importMapChunks.push(
      stringToChunk(
        escapeBootstrapAndImportMapScriptContent(JSON.stringify(map)),
      ),
    );
    importMapChunks.push(importMapScriptEnd);
  }
  return {
    placeholderPrefix: stringToPrecomputedChunk(idPrefix + 'P:'),
    segmentPrefix: stringToPrecomputedChunk(idPrefix + 'S:'),
    boundaryPrefix: stringToPrecomputedChunk(idPrefix + 'B:'),
    startInlineScript: inlineScriptWithNonce,
    htmlChunks: null,
    headChunks: null,
    charsetChunks: [],
    preconnectChunks: [],
    importMapChunks,
    preloadChunks: [],
    hoistableChunks: [],
    nonce,
    // like a module global for currently rendering boundary
    boundaryResources: null,
    stylesToHoist: false,
  };
}

export function createResumableState(
  identifierPrefix: string | void,
  nonce: string | void,
  bootstrapScriptContent: string | void,
  bootstrapScripts: $ReadOnlyArray<string | BootstrapScriptDescriptor> | void,
  bootstrapModules: $ReadOnlyArray<string | BootstrapScriptDescriptor> | void,
  externalRuntimeConfig: string | BootstrapScriptDescriptor | void,
): ResumableState {
  const idPrefix = identifierPrefix === undefined ? '' : identifierPrefix;
  const bootstrapChunks: Array<Chunk | PrecomputedChunk> = [];
  let streamingFormat = ScriptStreamingFormat;
  let externalRuntimeScript: null | ExternalRuntimeScript = null;
  if (bootstrapScriptContent !== undefined) {
    const inlineScriptWithNonce =
      nonce === undefined
        ? startInlineScript
        : stringToPrecomputedChunk(
            '<script nonce="' + escapeTextForBrowser(nonce) + '">',
          );
    bootstrapChunks.push(
      inlineScriptWithNonce,
      stringToChunk(
        escapeBootstrapAndImportMapScriptContent(bootstrapScriptContent),
      ),
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
        externalRuntimeScript = {
          src: externalRuntimeConfig,
          chunks: [],
        };
        pushScriptImpl(externalRuntimeScript.chunks, {
          src: externalRuntimeConfig,
          async: true,
          integrity: undefined,
          nonce: nonce,
        });
      } else {
        externalRuntimeScript = {
          src: externalRuntimeConfig.src,
          chunks: [],
        };
        pushScriptImpl(externalRuntimeScript.chunks, {
          src: externalRuntimeConfig.src,
          async: true,
          integrity: externalRuntimeConfig.integrity,
          nonce: nonce,
        });
      }
    }
  }

  const resumableState: ResumableState = {
    externalRuntimeScript: externalRuntimeScript,
    bootstrapChunks: bootstrapChunks,
    idPrefix: idPrefix,
    nextFormID: 0,
    streamingFormat,
    instructions: NothingSent,
    hasBody: false,
    hasHtml: false,

    // @TODO add bootstrap script to implicit preloads

    // persistent
    preloadsMap: new Map(),
    preconnectsMap: new Map(),
    stylesMap: new Map(),
    scriptsMap: new Map(),

    // cleared on flush
    preconnects: new Set(),
    fontPreloads: new Set(),
    highImagePreloads: new Set(),
    // usedImagePreloads: new Set(),
    precedences: new Map(),
    stylePrecedences: new Map(),
    bootstrapScripts: new Set(),
    scripts: new Set(),
    bulkPreloads: new Set(),
  };

  if (bootstrapScripts !== undefined) {
    for (let i = 0; i < bootstrapScripts.length; i++) {
      const scriptConfig = bootstrapScripts[i];
      const src =
        typeof scriptConfig === 'string' ? scriptConfig : scriptConfig.src;
      const integrity =
        typeof scriptConfig === 'string' ? undefined : scriptConfig.integrity;
      const crossOrigin =
        typeof scriptConfig === 'string' || scriptConfig.crossOrigin == null
          ? undefined
          : scriptConfig.crossOrigin === 'use-credentials'
          ? 'use-credentials'
          : '';

      preloadBootstrapScript(
        resumableState,
        src,
        nonce,
        integrity,
        crossOrigin,
      );

      bootstrapChunks.push(
        startScriptSrc,
        stringToChunk(escapeTextForBrowser(src)),
      );
      if (nonce) {
        bootstrapChunks.push(
          scriptNonce,
          stringToChunk(escapeTextForBrowser(nonce)),
        );
      }
      if (integrity) {
        bootstrapChunks.push(
          scriptIntegirty,
          stringToChunk(escapeTextForBrowser(integrity)),
        );
      }
      if (typeof crossOrigin === 'string') {
        bootstrapChunks.push(
          scriptCrossOrigin,
          stringToChunk(escapeTextForBrowser(crossOrigin)),
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
      const crossOrigin =
        typeof scriptConfig === 'string' || scriptConfig.crossOrigin == null
          ? undefined
          : scriptConfig.crossOrigin === 'use-credentials'
          ? 'use-credentials'
          : '';

      preloadBootstrapModule(
        resumableState,
        src,
        nonce,
        integrity,
        crossOrigin,
      );

      bootstrapChunks.push(
        startModuleSrc,
        stringToChunk(escapeTextForBrowser(src)),
      );

      if (nonce) {
        bootstrapChunks.push(
          scriptNonce,
          stringToChunk(escapeTextForBrowser(nonce)),
        );
      }
      if (integrity) {
        bootstrapChunks.push(
          scriptIntegirty,
          stringToChunk(escapeTextForBrowser(integrity)),
        );
      }
      if (typeof crossOrigin === 'string') {
        bootstrapChunks.push(
          scriptCrossOrigin,
          stringToChunk(escapeTextForBrowser(crossOrigin)),
        );
      }
      bootstrapChunks.push(endAsyncScript);
    }
  }

  return resumableState;
}

// Constants for the insertion mode we're currently writing in. We don't encode all HTML5 insertion
// modes. We only include the variants as they matter for the sake of our purposes.
// We don't actually provide the namespace therefore we use constants instead of the string.
export const ROOT_HTML_MODE = 0; // Used for the root most element tag.
// We have a less than HTML_HTML_MODE check elsewhere. If you add more cases here, make sure it
// still makes sense
const HTML_HTML_MODE = 1; // Used for the <html> if it is at the top level.
const HTML_MODE = 2;
const SVG_MODE = 3;
const MATHML_MODE = 4;
const HTML_TABLE_MODE = 5;
const HTML_TABLE_BODY_MODE = 6;
const HTML_TABLE_ROW_MODE = 7;
const HTML_COLGROUP_MODE = 8;
// We have a greater than HTML_TABLE_MODE check elsewhere. If you add more cases here, make sure it
// still makes sense

type InsertionMode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const NO_SCOPE = /*         */ 0b00;
const NOSCRIPT_SCOPE = /*   */ 0b01;
const PICTURE_SCOPE = /*    */ 0b10;

// Lets us keep track of contextual state and pick it back up after suspending.
export type FormatContext = {
  insertionMode: InsertionMode, // root/svg/html/mathml/table
  selectedValue: null | string | Array<string>, // the selected value(s) inside a <select>, or null outside <select>
  tagScope: number,
};

function createFormatContext(
  insertionMode: InsertionMode,
  selectedValue: null | string,
  tagScope: number,
): FormatContext {
  return {
    insertionMode,
    selectedValue,
    tagScope,
  };
}

export function createRootFormatContext(namespaceURI?: string): FormatContext {
  const insertionMode =
    namespaceURI === 'http://www.w3.org/2000/svg'
      ? SVG_MODE
      : namespaceURI === 'http://www.w3.org/1998/Math/MathML'
      ? MATHML_MODE
      : ROOT_HTML_MODE;
  return createFormatContext(insertionMode, null, NO_SCOPE);
}

export function getChildFormatContext(
  parentContext: FormatContext,
  type: string,
  props: Object,
): FormatContext {
  switch (type) {
    case 'noscript':
      return createFormatContext(
        HTML_MODE,
        null,
        parentContext.tagScope | NOSCRIPT_SCOPE,
      );
    case 'select':
      return createFormatContext(
        HTML_MODE,
        props.value != null ? props.value : props.defaultValue,
        parentContext.tagScope,
      );
    case 'svg':
      return createFormatContext(SVG_MODE, null, parentContext.tagScope);
    case 'picture':
      return createFormatContext(
        HTML_MODE,
        null,
        parentContext.tagScope | PICTURE_SCOPE,
      );
    case 'math':
      return createFormatContext(MATHML_MODE, null, parentContext.tagScope);
    case 'foreignObject':
      return createFormatContext(HTML_MODE, null, parentContext.tagScope);
    // Table parents are special in that their children can only be created at all if they're
    // wrapped in a table parent. So we need to encode that we're entering this mode.
    case 'table':
      return createFormatContext(HTML_TABLE_MODE, null, parentContext.tagScope);
    case 'thead':
    case 'tbody':
    case 'tfoot':
      return createFormatContext(
        HTML_TABLE_BODY_MODE,
        null,
        parentContext.tagScope,
      );
    case 'colgroup':
      return createFormatContext(
        HTML_COLGROUP_MODE,
        null,
        parentContext.tagScope,
      );
    case 'tr':
      return createFormatContext(
        HTML_TABLE_ROW_MODE,
        null,
        parentContext.tagScope,
      );
  }
  if (parentContext.insertionMode >= HTML_TABLE_MODE) {
    // Whatever tag this was, it wasn't a table parent or other special parent, so we must have
    // entered plain HTML again.
    return createFormatContext(HTML_MODE, null, parentContext.tagScope);
  }
  if (parentContext.insertionMode === ROOT_HTML_MODE) {
    if (type === 'html') {
      // We've emitted the root and is now in <html> mode.
      return createFormatContext(HTML_HTML_MODE, null, parentContext.tagScope);
    } else {
      // We've emitted the root and is now in plain HTML mode.
      return createFormatContext(HTML_MODE, null, parentContext.tagScope);
    }
  } else if (parentContext.insertionMode === HTML_HTML_MODE) {
    // We've emitted the document element and is now in plain HTML mode.
    return createFormatContext(HTML_MODE, null, parentContext.tagScope);
  }
  return parentContext;
}

export function makeId(
  resumableState: ResumableState,
  treeId: string,
  localId: number,
): string {
  const idPrefix = resumableState.idPrefix;

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
  renderState: RenderState,
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
  renderState: RenderState,
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

function makeFormFieldPrefix(resumableState: ResumableState): string {
  const id = resumableState.nextFormID++;
  return resumableState.idPrefix + id;
}

// Since this will likely be repeated a lot in the HTML, we use a more concise message
// than on the client and hopefully it's googleable.
const actionJavaScriptURL = stringToPrecomputedChunk(
  escapeTextForBrowser(
    // eslint-disable-next-line no-script-url
    "javascript:throw new Error('A React form was unexpectedly submitted.')",
  ),
);

const startHiddenInputChunk = stringToPrecomputedChunk('<input type="hidden"');

function pushAdditionalFormField(
  this: Array<Chunk | PrecomputedChunk>,
  value: string | File,
  key: string,
): void {
  const target: Array<Chunk | PrecomputedChunk> = this;
  target.push(startHiddenInputChunk);
  if (typeof value !== 'string') {
    throw new Error(
      'File/Blob fields are not yet supported in progressive forms. ' +
        'It probably means you are closing over binary data or FormData in a Server Action.',
    );
  }
  pushStringAttribute(target, 'name', key);
  pushStringAttribute(target, 'value', value);
  target.push(endOfStartTagSelfClosing);
}

function pushAdditionalFormFields(
  target: Array<Chunk | PrecomputedChunk>,
  formData: null | FormData,
) {
  if (formData !== null) {
    // $FlowFixMe[prop-missing]: FormData has forEach.
    formData.forEach(pushAdditionalFormField, target);
  }
}

function pushFormActionAttribute(
  target: Array<Chunk | PrecomputedChunk>,
  resumableState: ResumableState,
  renderState: RenderState,
  formAction: any,
  formEncType: any,
  formMethod: any,
  formTarget: any,
  name: any,
): null | FormData {
  let formData = null;
  if (enableFormActions && typeof formAction === 'function') {
    // Function form actions cannot control the form properties
    if (__DEV__) {
      if (name !== null && !didWarnFormActionName) {
        didWarnFormActionName = true;
        console.error(
          'Cannot specify a "name" prop for a button that specifies a function as a formAction. ' +
            'React needs it to encode which action should be invoked. It will get overridden.',
        );
      }
      if (
        (formEncType !== null || formMethod !== null) &&
        !didWarnFormActionMethod
      ) {
        didWarnFormActionMethod = true;
        console.error(
          'Cannot specify a formEncType or formMethod for a button that specifies a ' +
            'function as a formAction. React provides those automatically. They will get overridden.',
        );
      }
      if (formTarget !== null && !didWarnFormActionTarget) {
        didWarnFormActionTarget = true;
        console.error(
          'Cannot specify a formTarget for a button that specifies a function as a formAction. ' +
            'The function will always be executed in the same window.',
        );
      }
    }
    const customAction: ReactCustomFormAction = formAction.$$FORM_ACTION;
    if (typeof customAction === 'function') {
      // This action has a custom progressive enhancement form that can submit the form
      // back to the server if it's invoked before hydration. Such as a Server Action.
      const prefix = makeFormFieldPrefix(resumableState);
      const customFields = formAction.$$FORM_ACTION(prefix);
      name = customFields.name;
      formAction = customFields.action || '';
      formEncType = customFields.encType;
      formMethod = customFields.method;
      formTarget = customFields.target;
      formData = customFields.data;
    } else {
      // Set a javascript URL that doesn't do anything. We don't expect this to be invoked
      // because we'll preventDefault in the Fizz runtime, but it can happen if a form is
      // manually submitted or if someone calls stopPropagation before React gets the event.
      // If CSP is used to block javascript: URLs that's fine too. It just won't show this
      // error message but the URL will be logged.
      target.push(
        attributeSeparator,
        stringToChunk('formAction'),
        attributeAssign,
        actionJavaScriptURL,
        attributeEnd,
      );
      name = null;
      formAction = null;
      formEncType = null;
      formMethod = null;
      formTarget = null;
      injectFormReplayingRuntime(resumableState, renderState);
    }
  }
  if (name != null) {
    pushAttribute(target, 'name', name);
  }
  if (formAction != null) {
    pushAttribute(target, 'formAction', formAction);
  }
  if (formEncType != null) {
    pushAttribute(target, 'formEncType', formEncType);
  }
  if (formMethod != null) {
    pushAttribute(target, 'formMethod', formMethod);
  }
  if (formTarget != null) {
    pushAttribute(target, 'formTarget', formTarget);
  }
  return formData;
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
    case 'href': {
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
    }
    // Fall through to the last case which shouldn't remove empty strings.
    case 'action':
    case 'formAction': {
      // TODO: Consider only special casing these for each tag.
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

// TODO: Move these to RenderState so that we warn for every request.
// It would help debugging in stateful servers (e.g. service worker).
let didWarnDefaultInputValue = false;
let didWarnDefaultChecked = false;
let didWarnDefaultSelectValue = false;
let didWarnDefaultTextareaValue = false;
let didWarnInvalidOptionChildren = false;
let didWarnInvalidOptionInnerHTML = false;
let didWarnSelectedSetOnOption = false;
let didWarnFormActionType = false;
let didWarnFormActionName = false;
let didWarnFormActionTarget = false;
let didWarnFormActionMethod = false;

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

const formReplayingRuntimeScript =
  stringToPrecomputedChunk(formReplayingRuntime);

function injectFormReplayingRuntime(
  resumableState: ResumableState,
  renderState: RenderState,
): void {
  // If we haven't sent it yet, inject the runtime that tracks submitted JS actions
  // for later replaying by Fiber. If we use an external runtime, we don't need
  // to emit anything. It's always used.
  if (
    (resumableState.instructions & SentFormReplayingRuntime) === NothingSent &&
    (!enableFizzExternalRuntime || !resumableState.externalRuntimeScript)
  ) {
    resumableState.instructions |= SentFormReplayingRuntime;
    resumableState.bootstrapChunks.unshift(
      renderState.startInlineScript,
      formReplayingRuntimeScript,
      endInlineScript,
    );
  }
}

const formStateMarkerIsMatching = stringToPrecomputedChunk('<!--F!-->');
const formStateMarkerIsNotMatching = stringToPrecomputedChunk('<!--F-->');

export function pushFormStateMarkerIsMatching(
  target: Array<Chunk | PrecomputedChunk>,
) {
  target.push(formStateMarkerIsMatching);
}

export function pushFormStateMarkerIsNotMatching(
  target: Array<Chunk | PrecomputedChunk>,
) {
  target.push(formStateMarkerIsNotMatching);
}

function pushStartForm(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  resumableState: ResumableState,
  renderState: RenderState,
): ReactNodeList {
  target.push(startChunkForTag('form'));

  let children = null;
  let innerHTML = null;
  let formAction = null;
  let formEncType = null;
  let formMethod = null;
  let formTarget = null;

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
        case 'action':
          formAction = propValue;
          break;
        case 'encType':
          formEncType = propValue;
          break;
        case 'method':
          formMethod = propValue;
          break;
        case 'target':
          formTarget = propValue;
          break;
        default:
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
  }

  let formData = null;
  let formActionName = null;
  if (enableFormActions && typeof formAction === 'function') {
    // Function form actions cannot control the form properties
    if (__DEV__) {
      if (
        (formEncType !== null || formMethod !== null) &&
        !didWarnFormActionMethod
      ) {
        didWarnFormActionMethod = true;
        console.error(
          'Cannot specify a encType or method for a form that specifies a ' +
            'function as the action. React provides those automatically. ' +
            'They will get overridden.',
        );
      }
      if (formTarget !== null && !didWarnFormActionTarget) {
        didWarnFormActionTarget = true;
        console.error(
          'Cannot specify a target for a form that specifies a function as the action. ' +
            'The function will always be executed in the same window.',
        );
      }
    }
    const customAction: ReactCustomFormAction = formAction.$$FORM_ACTION;
    if (typeof customAction === 'function') {
      // This action has a custom progressive enhancement form that can submit the form
      // back to the server if it's invoked before hydration. Such as a Server Action.
      const prefix = makeFormFieldPrefix(resumableState);
      const customFields = formAction.$$FORM_ACTION(prefix);
      formAction = customFields.action || '';
      formEncType = customFields.encType;
      formMethod = customFields.method;
      formTarget = customFields.target;
      formData = customFields.data;
      formActionName = customFields.name;
    } else {
      // Set a javascript URL that doesn't do anything. We don't expect this to be invoked
      // because we'll preventDefault in the Fizz runtime, but it can happen if a form is
      // manually submitted or if someone calls stopPropagation before React gets the event.
      // If CSP is used to block javascript: URLs that's fine too. It just won't show this
      // error message but the URL will be logged.
      target.push(
        attributeSeparator,
        stringToChunk('action'),
        attributeAssign,
        actionJavaScriptURL,
        attributeEnd,
      );
      formAction = null;
      formEncType = null;
      formMethod = null;
      formTarget = null;
      injectFormReplayingRuntime(resumableState, renderState);
    }
  }
  if (formAction != null) {
    pushAttribute(target, 'action', formAction);
  }
  if (formEncType != null) {
    pushAttribute(target, 'encType', formEncType);
  }
  if (formMethod != null) {
    pushAttribute(target, 'method', formMethod);
  }
  if (formTarget != null) {
    pushAttribute(target, 'target', formTarget);
  }

  target.push(endOfStartTag);

  if (formActionName !== null) {
    target.push(startHiddenInputChunk);
    pushStringAttribute(target, 'name', formActionName);
    target.push(endOfStartTagSelfClosing);
    pushAdditionalFormFields(target, formData);
  }

  pushInnerHTML(target, innerHTML, children);
  if (typeof children === 'string') {
    // Special case children as a string to avoid the unnecessary comment.
    // TODO: Remove this special case after the general optimization is in place.
    target.push(stringToChunk(encodeHTMLTextNode(children)));
    return null;
  }
  return children;
}

function pushInput(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  resumableState: ResumableState,
  renderState: RenderState,
): ReactNodeList {
  if (__DEV__) {
    checkControlledValueProps('input', props);
  }

  target.push(startChunkForTag('input'));

  let name = null;
  let formAction = null;
  let formEncType = null;
  let formMethod = null;
  let formTarget = null;
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
        case 'name':
          name = propValue;
          break;
        case 'formAction':
          formAction = propValue;
          break;
        case 'formEncType':
          formEncType = propValue;
          break;
        case 'formMethod':
          formMethod = propValue;
          break;
        case 'formTarget':
          formTarget = propValue;
          break;
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

  if (__DEV__) {
    if (
      formAction !== null &&
      props.type !== 'image' &&
      props.type !== 'submit' &&
      !didWarnFormActionType
    ) {
      didWarnFormActionType = true;
      console.error(
        'An input can only specify a formAction along with type="submit" or type="image".',
      );
    }
  }

  const formData = pushFormActionAttribute(
    target,
    resumableState,
    renderState,
    formAction,
    formEncType,
    formMethod,
    formTarget,
    name,
  );

  if (__DEV__) {
    if (checked !== null && defaultChecked !== null && !didWarnDefaultChecked) {
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
    if (value !== null && defaultValue !== null && !didWarnDefaultInputValue) {
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

  // We place any additional hidden form fields after the input.
  pushAdditionalFormFields(target, formData);

  return null;
}

function pushStartButton(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  resumableState: ResumableState,
  renderState: RenderState,
): ReactNodeList {
  target.push(startChunkForTag('button'));

  let children = null;
  let innerHTML = null;
  let name = null;
  let formAction = null;
  let formEncType = null;
  let formMethod = null;
  let formTarget = null;

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
        case 'name':
          name = propValue;
          break;
        case 'formAction':
          formAction = propValue;
          break;
        case 'formEncType':
          formEncType = propValue;
          break;
        case 'formMethod':
          formMethod = propValue;
          break;
        case 'formTarget':
          formTarget = propValue;
          break;
        default:
          pushAttribute(target, propKey, propValue);
          break;
      }
    }
  }

  if (__DEV__) {
    if (
      formAction !== null &&
      props.type != null &&
      props.type !== 'submit' &&
      !didWarnFormActionType
    ) {
      didWarnFormActionType = true;
      console.error(
        'A button can only specify a formAction along with type="submit" or no type.',
      );
    }
  }

  const formData = pushFormActionAttribute(
    target,
    resumableState,
    renderState,
    formAction,
    formEncType,
    formMethod,
    formTarget,
    name,
  );

  target.push(endOfStartTag);

  // We place any additional hidden form fields we need to include inside the button itself.
  pushAdditionalFormFields(target, formData);

  pushInnerHTML(target, innerHTML, children);
  if (typeof children === 'string') {
    // Special case children as a string to avoid the unnecessary comment.
    // TODO: Remove this special case after the general optimization is in place.
    target.push(stringToChunk(encodeHTMLTextNode(children)));
    return null;
  }

  return children;
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
  renderState: RenderState,
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
        return pushSelfClosing(renderState.charsetChunks, props, 'meta');
      } else if (props.name === 'viewport') {
        // "viewport" isn't related to preconnect but it has the right priority
        return pushSelfClosing(renderState.preconnectChunks, props, 'meta');
      } else {
        return pushSelfClosing(renderState.hoistableChunks, props, 'meta');
      }
    }
  } else {
    return pushSelfClosing(target, props, 'meta');
  }
}

function pushLink(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  resumableState: ResumableState,
  renderState: RenderState,
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
        return pushLinkImpl(target, props);
      } else {
        // This stylesheet refers to a Resource and we create a new one if necessary
        let resource = resumableState.stylesMap.get(key);
        if (!resource) {
          const resourceProps = stylesheetPropsFromRawProps(props);
          const preloadResource = resumableState.preloadsMap.get(key);
          let state = NoState;
          if (preloadResource) {
            // If we already had a preload we don't want that resource to flush directly.
            // We let the newly created resource govern flushing.
            preloadResource.state |= Blocked;
            adoptPreloadPropsForStylesheetProps(
              resourceProps,
              preloadResource.props,
            );
            if (preloadResource.state & Flushed) {
              state = PreloadFlushed;
            }
          }
          resource = {
            type: 'stylesheet',
            chunks: ([]: Array<Chunk | PrecomputedChunk>),
            state,
            props: resourceProps,
          };
          resumableState.stylesMap.set(key, resource);
          let precedenceSet = resumableState.precedences.get(precedence);
          if (!precedenceSet) {
            precedenceSet = new Set();
            resumableState.precedences.set(precedence, precedenceSet);
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
              if (resumableState.stylePrecedences.has(precedence)) {
                console.error(
                  'React constructed an empty style resource when a style resource already exists for this precedence: "%s". This is a bug in React.',
                  precedence,
                );
              }
            }
            resumableState.stylePrecedences.set(precedence, emptyStyleResource);
          }
          precedenceSet.add(resource);
        }
        if (renderState.boundaryResources) {
          renderState.boundaryResources.add(resource);
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
          return pushLinkImpl(renderState.preconnectChunks, props);
        case 'preload':
          return pushLinkImpl(renderState.preloadChunks, props);
        default:
          return pushLinkImpl(renderState.hoistableChunks, props);
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
  resumableState: ResumableState,
  renderState: RenderState,
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
    let resource = resumableState.stylesMap.get(key);
    if (!resource) {
      resource = resumableState.stylePrecedences.get(precedence);
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
        resumableState.stylePrecedences.set(precedence, resource);
        const precedenceSet: Set<StyleResource> = new Set();
        precedenceSet.add(resource);
        if (__DEV__) {
          if (resumableState.precedences.has(precedence)) {
            console.error(
              'React constructed a new style precedence set when one already exists for this precedence: "%s". This is a bug in React.',
              precedence,
            );
          }
        }
        resumableState.precedences.set(precedence, precedenceSet);
      } else {
        resource.props.hrefs.push(href);
      }
      resumableState.stylesMap.set(key, resource);
      if (renderState.boundaryResources) {
        renderState.boundaryResources.add(resource);
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

function getImagePreloadKey(
  href: string,
  imageSrcSet: ?string,
  imageSizes: ?string,
) {
  let uniquePart = '';
  if (typeof imageSrcSet === 'string' && imageSrcSet !== '') {
    uniquePart += '[' + imageSrcSet + ']';
    if (typeof imageSizes === 'string') {
      uniquePart += '[' + imageSizes + ']';
    }
  } else {
    uniquePart += '[][]' + href;
  }
  return getResourceKey('image', uniquePart);
}

function pushImg(
  target: Array<Chunk | PrecomputedChunk>,
  props: Object,
  resumableState: ResumableState,
  pictureTagInScope: boolean,
): null {
  const {src, srcSet} = props;
  if (
    props.loading !== 'lazy' &&
    (typeof src === 'string' || typeof srcSet === 'string') &&
    props.fetchPriority !== 'low' &&
    pictureTagInScope === false &&
    // We exclude data URIs in src and srcSet since these should not be preloaded
    !(
      typeof src === 'string' &&
      src[4] === ':' &&
      (src[0] === 'd' || src[0] === 'D') &&
      (src[1] === 'a' || src[1] === 'A') &&
      (src[2] === 't' || src[2] === 'T') &&
      (src[3] === 'a' || src[3] === 'A')
    ) &&
    !(
      typeof srcSet === 'string' &&
      srcSet[4] === ':' &&
      (srcSet[0] === 'd' || srcSet[0] === 'D') &&
      (srcSet[1] === 'a' || srcSet[1] === 'A') &&
      (srcSet[2] === 't' || srcSet[2] === 'T') &&
      (srcSet[3] === 'a' || srcSet[3] === 'A')
    )
  ) {
    // We have a suspensey image and ought to preload it to optimize the loading of display blocking
    // resumableState.
    const {sizes} = props;
    const key = getImagePreloadKey(src, srcSet, sizes);
    let resource = resumableState.preloadsMap.get(key);
    if (!resource) {
      resource = {
        type: 'preload',
        chunks: [],
        state: NoState,
        props: {
          rel: 'preload',
          as: 'image',
          // There is a bug in Safari where imageSrcSet is not respected on preload links
          // so we omit the href here if we have imageSrcSet b/c safari will load the wrong image.
          // This harms older browers that do not support imageSrcSet by making their preloads not work
          // but this population is shrinking fast and is already small so we accept this tradeoff.
          href: srcSet ? undefined : src,
          imageSrcSet: srcSet,
          imageSizes: sizes,
          crossOrigin: props.crossOrigin,
          integrity: props.integrity,
          type: props.type,
          fetchPriority: props.fetchPriority,
          referrerPolicy: props.referrerPolicy,
        },
      };
      resumableState.preloadsMap.set(key, resource);
      pushLinkImpl(resource.chunks, resource.props);
    }
    if (
      props.fetchPriority === 'high' ||
      resumableState.highImagePreloads.size < 10
    ) {
      resumableState.highImagePreloads.add(resource);
    } else {
      resumableState.bulkPreloads.add(resource);
    }
  }
  return pushSelfClosing(target, props, 'img');
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
  renderState: RenderState,
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
      pushTitleImpl(renderState.hoistableChunks, props);
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
  renderState: RenderState,
  insertionMode: InsertionMode,
): ReactNodeList {
  if (enableFloat) {
    if (insertionMode < HTML_MODE && renderState.headChunks === null) {
      // This <head> is the Document.head and should be part of the preamble
      renderState.headChunks = [];
      return pushStartGenericElement(renderState.headChunks, props, 'head');
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
  renderState: RenderState,
  insertionMode: InsertionMode,
): ReactNodeList {
  if (enableFloat) {
    if (insertionMode === ROOT_HTML_MODE && renderState.htmlChunks === null) {
      // This <html> is the Document.documentElement and should be part of the preamble
      renderState.htmlChunks = [DOCTYPE];
      return pushStartGenericElement(renderState.htmlChunks, props, 'html');
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
  resumableState: ResumableState,
  textEmbedded: boolean,
  insertionMode: InsertionMode,
  noscriptTagInScope: boolean,
): null {
  if (enableFloat) {
    const asyncProp = props.async;
    if (
      typeof props.src !== 'string' ||
      !props.src ||
      !(
        asyncProp &&
        typeof asyncProp !== 'function' &&
        typeof asyncProp !== 'symbol'
      ) ||
      props.onLoad ||
      props.onError ||
      insertionMode === SVG_MODE ||
      noscriptTagInScope ||
      props.itemProp != null
    ) {
      // This script will not be a resource, we bailout early and emit it in place.
      return pushScriptImpl(target, props);
    }

    const src = props.src;
    const key = getResourceKey('script', src);
    // We can make this <script> into a ScriptResource
    let resource = resumableState.scriptsMap.get(key);
    if (!resource) {
      resource = {
        type: 'script',
        chunks: [],
        state: NoState,
        props: null,
      };
      resumableState.scriptsMap.set(key, resource);
      // Add to the script flushing queue
      resumableState.scripts.add(resource);

      let scriptProps = props;
      const preloadResource = resumableState.preloadsMap.get(key);
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

export const doctypeChunk: PrecomputedChunk =
  stringToPrecomputedChunk('<!DOCTYPE html>');

import {doctypeChunk as DOCTYPE} from 'react-server/src/ReactFizzConfig';

export function pushStartInstance(
  target: Array<Chunk | PrecomputedChunk>,
  type: string,
  props: Object,
  resumableState: ResumableState,
  renderState: RenderState,
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
      return pushInput(target, props, resumableState, renderState);
    case 'button':
      return pushStartButton(target, props, resumableState, renderState);
    case 'form':
      return pushStartForm(target, props, resumableState, renderState);
    case 'menuitem':
      return pushStartMenuItem(target, props);
    case 'title':
      return enableFloat
        ? pushTitle(
            target,
            props,
            renderState,
            formatContext.insertionMode,
            !!(formatContext.tagScope & NOSCRIPT_SCOPE),
          )
        : pushStartTitle(target, props);
    case 'link':
      return pushLink(
        target,
        props,
        resumableState,
        renderState,
        textEmbedded,
        formatContext.insertionMode,
        !!(formatContext.tagScope & NOSCRIPT_SCOPE),
      );
    case 'script':
      return enableFloat
        ? pushScript(
            target,
            props,
            resumableState,
            textEmbedded,
            formatContext.insertionMode,
            !!(formatContext.tagScope & NOSCRIPT_SCOPE),
          )
        : pushStartGenericElement(target, props, type);
    case 'style':
      return pushStyle(
        target,
        props,
        resumableState,
        renderState,
        textEmbedded,
        formatContext.insertionMode,
        !!(formatContext.tagScope & NOSCRIPT_SCOPE),
      );
    case 'meta':
      return pushMeta(
        target,
        props,
        renderState,
        textEmbedded,
        formatContext.insertionMode,
        !!(formatContext.tagScope & NOSCRIPT_SCOPE),
      );
    // Newline eating tags
    case 'listing':
    case 'pre': {
      return pushStartPreformattedElement(target, props, type);
    }
    case 'img': {
      return enableFloat
        ? pushImg(
            target,
            props,
            resumableState,
            !!(formatContext.tagScope & PICTURE_SCOPE),
          )
        : pushSelfClosing(target, props, type);
    }
    // Omitted close tags
    case 'base':
    case 'area':
    case 'br':
    case 'col':
    case 'embed':
    case 'hr':
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
      break;
    }
    // Preamble start tags
    case 'head':
      return pushStartHead(
        target,
        props,
        renderState,
        formatContext.insertionMode,
      );
    case 'html': {
      return pushStartHtml(
        target,
        props,
        renderState,
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
  resumableState: ResumableState,
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
        resumableState.hasBody = true;
        return;
      }
      break;
    }
    case 'html':
      if (enableFloat && formatContext.insertionMode === ROOT_HTML_MODE) {
        resumableState.hasHtml = true;
        return;
      }
      break;
  }
  target.push(endTag1, stringToChunk(type), endTag2);
}

function writeBootstrap(
  destination: Destination,
  resumableState: ResumableState,
): boolean {
  const bootstrapChunks = resumableState.bootstrapChunks;
  let i = 0;
  for (; i < bootstrapChunks.length - 1; i++) {
    writeChunk(destination, bootstrapChunks[i]);
  }
  if (i < bootstrapChunks.length) {
    const lastChunk = bootstrapChunks[i];
    bootstrapChunks.length = 0;
    return writeChunkAndReturn(destination, lastChunk);
  }
  return true;
}

export function writeCompletedRoot(
  destination: Destination,
  resumableState: ResumableState,
): boolean {
  return writeBootstrap(destination, resumableState);
}

// Structural Nodes

// A placeholder is a node inside a hidden partial tree that can be filled in later, but before
// display. It's never visible to users. We use the template tag because it can be used in every
// type of parent. <script> tags also work in every other tag except <colgroup>.
const placeholder1 = stringToPrecomputedChunk('<template id="');
const placeholder2 = stringToPrecomputedChunk('"></template>');
export function writePlaceholder(
  destination: Destination,
  renderState: RenderState,
  id: number,
): boolean {
  writeChunk(destination, placeholder1);
  writeChunk(destination, renderState.placeholderPrefix);
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
  renderState: RenderState,
): boolean {
  return writeChunkAndReturn(destination, startCompletedSuspenseBoundary);
}
export function writeStartPendingSuspenseBoundary(
  destination: Destination,
  renderState: RenderState,
  id: number,
): boolean {
  writeChunk(destination, startPendingSuspenseBoundary1);

  if (id === null) {
    throw new Error(
      'An ID must have been assigned before we can complete the boundary.',
    );
  }

  writeChunk(destination, renderState.boundaryPrefix);
  writeChunk(destination, stringToChunk(id.toString(16)));
  return writeChunkAndReturn(destination, startPendingSuspenseBoundary2);
}
export function writeStartClientRenderedSuspenseBoundary(
  destination: Destination,
  renderState: RenderState,
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
  renderState: RenderState,
): boolean {
  return writeChunkAndReturn(destination, endSuspenseBoundary);
}
export function writeEndPendingSuspenseBoundary(
  destination: Destination,
  renderState: RenderState,
): boolean {
  return writeChunkAndReturn(destination, endSuspenseBoundary);
}
export function writeEndClientRenderedSuspenseBoundary(
  destination: Destination,
  renderState: RenderState,
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
  renderState: RenderState,
  formatContext: FormatContext,
  id: number,
): boolean {
  switch (formatContext.insertionMode) {
    case ROOT_HTML_MODE:
    case HTML_HTML_MODE:
    case HTML_MODE: {
      writeChunk(destination, startSegmentHTML);
      writeChunk(destination, renderState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunkAndReturn(destination, startSegmentHTML2);
    }
    case SVG_MODE: {
      writeChunk(destination, startSegmentSVG);
      writeChunk(destination, renderState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunkAndReturn(destination, startSegmentSVG2);
    }
    case MATHML_MODE: {
      writeChunk(destination, startSegmentMathML);
      writeChunk(destination, renderState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunkAndReturn(destination, startSegmentMathML2);
    }
    case HTML_TABLE_MODE: {
      writeChunk(destination, startSegmentTable);
      writeChunk(destination, renderState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunkAndReturn(destination, startSegmentTable2);
    }
    // TODO: For the rest of these, there will be extra wrapper nodes that never
    // get deleted from the document. We need to delete the table too as part
    // of the injected scripts. They are invisible though so it's not too terrible
    // and it's kind of an edge case to suspend in a table. Totally supported though.
    case HTML_TABLE_BODY_MODE: {
      writeChunk(destination, startSegmentTableBody);
      writeChunk(destination, renderState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunkAndReturn(destination, startSegmentTableBody2);
    }
    case HTML_TABLE_ROW_MODE: {
      writeChunk(destination, startSegmentTableRow);
      writeChunk(destination, renderState.segmentPrefix);
      writeChunk(destination, stringToChunk(id.toString(16)));
      return writeChunkAndReturn(destination, startSegmentTableRow2);
    }
    case HTML_COLGROUP_MODE: {
      writeChunk(destination, startSegmentColGroup);
      writeChunk(destination, renderState.segmentPrefix);
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
  completeSegmentFunction + '$RS("',
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
  resumableState: ResumableState,
  renderState: RenderState,
  contentSegmentID: number,
): boolean {
  const scriptFormat =
    !enableFizzExternalRuntime ||
    resumableState.streamingFormat === ScriptStreamingFormat;
  if (scriptFormat) {
    writeChunk(destination, renderState.startInlineScript);
    if (
      (resumableState.instructions & SentCompleteSegmentFunction) ===
      NothingSent
    ) {
      // The first time we write this, we'll need to include the full implementation.
      resumableState.instructions |= SentCompleteSegmentFunction;
      writeChunk(destination, completeSegmentScript1Full);
    } else {
      // Future calls can just reuse the same function.
      writeChunk(destination, completeSegmentScript1Partial);
    }
  } else {
    writeChunk(destination, completeSegmentData1);
  }

  // Write function arguments, which are string literals
  writeChunk(destination, renderState.segmentPrefix);
  const formattedID = stringToChunk(contentSegmentID.toString(16));
  writeChunk(destination, formattedID);
  if (scriptFormat) {
    writeChunk(destination, completeSegmentScript2);
  } else {
    writeChunk(destination, completeSegmentData2);
  }
  writeChunk(destination, renderState.placeholderPrefix);
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
  resumableState: ResumableState,
  renderState: RenderState,
  id: number,
  boundaryResources: BoundaryResources,
): boolean {
  let requiresStyleInsertion;
  if (enableFloat) {
    requiresStyleInsertion = renderState.stylesToHoist;
    // If necessary stylesheets will be flushed with this instruction.
    // Any style tags not yet hoisted in the Document will also be hoisted.
    // We reset this state since after this instruction executes all styles
    // up to this point will have been hoisted
    renderState.stylesToHoist = false;
  }
  const scriptFormat =
    !enableFizzExternalRuntime ||
    resumableState.streamingFormat === ScriptStreamingFormat;
  if (scriptFormat) {
    writeChunk(destination, renderState.startInlineScript);
    if (enableFloat && requiresStyleInsertion) {
      if (
        (resumableState.instructions & SentCompleteBoundaryFunction) ===
        NothingSent
      ) {
        resumableState.instructions |=
          SentStyleInsertionFunction | SentCompleteBoundaryFunction;
        writeChunk(
          destination,
          clonePrecomputedChunk(completeBoundaryWithStylesScript1FullBoth),
        );
      } else if (
        (resumableState.instructions & SentStyleInsertionFunction) ===
        NothingSent
      ) {
        resumableState.instructions |= SentStyleInsertionFunction;
        writeChunk(destination, completeBoundaryWithStylesScript1FullPartial);
      } else {
        writeChunk(destination, completeBoundaryWithStylesScript1Partial);
      }
    } else {
      if (
        (resumableState.instructions & SentCompleteBoundaryFunction) ===
        NothingSent
      ) {
        resumableState.instructions |= SentCompleteBoundaryFunction;
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

  const idChunk = stringToChunk(id.toString(16));

  writeChunk(destination, renderState.boundaryPrefix);
  writeChunk(destination, idChunk);

  // Write function arguments, which are string and array literals
  if (scriptFormat) {
    writeChunk(destination, completeBoundaryScript2);
  } else {
    writeChunk(destination, completeBoundaryData2);
  }
  writeChunk(destination, renderState.segmentPrefix);
  writeChunk(destination, idChunk);
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
  let writeMore;
  if (scriptFormat) {
    writeMore = writeChunkAndReturn(destination, completeBoundaryScriptEnd);
  } else {
    writeMore = writeChunkAndReturn(destination, completeBoundaryDataEnd);
  }
  return writeBootstrap(destination, resumableState) && writeMore;
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
  resumableState: ResumableState,
  renderState: RenderState,
  id: number,
  errorDigest: ?string,
  errorMessage?: string,
  errorComponentStack?: string,
): boolean {
  const scriptFormat =
    !enableFizzExternalRuntime ||
    resumableState.streamingFormat === ScriptStreamingFormat;
  if (scriptFormat) {
    writeChunk(destination, renderState.startInlineScript);
    if (
      (resumableState.instructions & SentClientRenderFunction) ===
      NothingSent
    ) {
      // The first time we write this, we'll need to include the full implementation.
      resumableState.instructions |= SentClientRenderFunction;
      writeChunk(destination, clientRenderScript1Full);
    } else {
      // Future calls can just reuse the same function.
      writeChunk(destination, clientRenderScript1Partial);
    }
  } else {
    // <template data-rxi="" data-bid="
    writeChunk(destination, clientRenderData1);
  }

  writeChunk(destination, renderState.boundaryPrefix);
  writeChunk(destination, stringToChunk(id.toString(16)));
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
  renderState: RenderState,
): boolean {
  // Reset these on each invocation, they are only safe to read in this function
  currentlyRenderingBoundaryHasStylesToHoist = false;
  destinationHasCapacity = true;

  // Flush each Boundary resource
  boundaryResources.forEach(flushStyleTagsLateForBoundary, destination);
  if (currentlyRenderingBoundaryHasStylesToHoist) {
    renderState.stylesToHoist = true;
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
  if (resource.state & PreloadFlushed) {
    // This resource has already had a preload flushed
    return;
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
  resumableState: ResumableState,
  renderState: RenderState,
  willFlushAllSegments: boolean,
): void {
  // This function must be called exactly once on every request
  if (
    enableFizzExternalRuntime &&
    !willFlushAllSegments &&
    resumableState.externalRuntimeScript
  ) {
    // If the root segment is incomplete due to suspended tasks
    // (e.g. willFlushAllSegments = false) and we are using data
    // streaming format, ensure the external runtime is sent.
    // (User code could choose to send this even earlier by calling
    //  preinit(...), if they know they will suspend).
    const {src, chunks} = resumableState.externalRuntimeScript;
    internalPreinitScript(resumableState, src, chunks);
  }

  const htmlChunks = renderState.htmlChunks;
  const headChunks = renderState.headChunks;

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
  const charsetChunks = renderState.charsetChunks;
  for (i = 0; i < charsetChunks.length; i++) {
    writeChunk(destination, charsetChunks[i]);
  }
  charsetChunks.length = 0;

  // emit preconnect resources
  resumableState.preconnects.forEach(flushResourceInPreamble, destination);
  resumableState.preconnects.clear();

  const preconnectChunks = renderState.preconnectChunks;
  for (i = 0; i < preconnectChunks.length; i++) {
    writeChunk(destination, preconnectChunks[i]);
  }
  preconnectChunks.length = 0;

  resumableState.fontPreloads.forEach(flushResourceInPreamble, destination);
  resumableState.fontPreloads.clear();

  resumableState.highImagePreloads.forEach(
    flushResourceInPreamble,
    destination,
  );
  resumableState.highImagePreloads.clear();

  // Flush unblocked stylesheets by precedence
  resumableState.precedences.forEach(flushAllStylesInPreamble, destination);

  const importMapChunks = renderState.importMapChunks;
  for (i = 0; i < importMapChunks.length; i++) {
    writeChunk(destination, importMapChunks[i]);
  }
  importMapChunks.length = 0;

  resumableState.bootstrapScripts.forEach(flushResourceInPreamble, destination);

  resumableState.scripts.forEach(flushResourceInPreamble, destination);
  resumableState.scripts.clear();

  resumableState.bulkPreloads.forEach(flushResourceInPreamble, destination);
  resumableState.bulkPreloads.clear();

  // Write embedding preloadChunks
  const preloadChunks = renderState.preloadChunks;
  for (i = 0; i < preloadChunks.length; i++) {
    writeChunk(destination, preloadChunks[i]);
  }
  preloadChunks.length = 0;

  // Write embedding hoistableChunks
  const hoistableChunks = renderState.hoistableChunks;
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
  resumableState: ResumableState,
  renderState: RenderState,
): void {
  let i = 0;

  // Emit high priority Hoistables

  // We omit charsetChunks because we have already sent the shell and if it wasn't
  // already sent it is too late now.

  resumableState.preconnects.forEach(flushResourceLate, destination);
  resumableState.preconnects.clear();

  const preconnectChunks = renderState.preconnectChunks;
  for (i = 0; i < preconnectChunks.length; i++) {
    writeChunk(destination, preconnectChunks[i]);
  }
  preconnectChunks.length = 0;

  resumableState.fontPreloads.forEach(flushResourceLate, destination);
  resumableState.fontPreloads.clear();

  resumableState.highImagePreloads.forEach(
    flushResourceInPreamble,
    destination,
  );
  resumableState.highImagePreloads.clear();

  // Preload any stylesheets. these will emit in a render instruction that follows this
  // but we want to kick off preloading as soon as possible
  resumableState.precedences.forEach(preloadLateStyles, destination);

  // We only hoist importmaps that are configured through createResponse and that will
  // always flush in the preamble. Generally we don't expect people to render them as
  // tags when using React but if you do they are going to be treated like regular inline
  // scripts and flush after other hoistables which is problematic

  // bootstrap scripts should flush above script priority but these can only flush in the preamble
  // so we elide the code here for performance

  resumableState.scripts.forEach(flushResourceLate, destination);
  resumableState.scripts.clear();

  resumableState.bulkPreloads.forEach(flushResourceLate, destination);
  resumableState.bulkPreloads.clear();

  // Write embedding preloadChunks
  const preloadChunks = renderState.preloadChunks;
  for (i = 0; i < preloadChunks.length; i++) {
    writeChunk(destination, preloadChunks[i]);
  }
  preloadChunks.length = 0;

  // Write embedding hoistableChunks
  const hoistableChunks = renderState.hoistableChunks;
  for (i = 0; i < hoistableChunks.length; i++) {
    writeChunk(destination, hoistableChunks[i]);
  }
  hoistableChunks.length = 0;
}

export function writePostamble(
  destination: Destination,
  resumableState: ResumableState,
): void {
  if (resumableState.hasBody) {
    writeChunk(destination, endTag1);
    writeChunk(destination, stringToChunk('body'));
    writeChunk(destination, endTag2);
  }
  if (resumableState.hasHtml) {
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

type PreconnectProps = {
  rel: 'preconnect' | 'dns-prefetch',
  href: string,
  [string]: mixed,
};
type PreconnectResource = TResource<'preconnect', null>;

type PreloadAsProps = {
  rel: 'preload',
  as: string,
  href: ?string,
  [string]: mixed,
};
type PreloadModuleProps = {
  rel: 'modulepreload',
  href: ?string,
  [string]: mixed,
};
type PreloadProps = PreloadAsProps | PreloadModuleProps;
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
type ModuleProps = {
  async: true,
  src: string,
  type: 'module',
  [string]: mixed,
};
type ScriptResource = TResource<'script', null>;

type Resource =
  | StyleResource
  | ScriptResource
  | PreloadResource
  | PreconnectResource;

export type BoundaryResources = Set<StyleResource>;

export function createBoundaryResources(): BoundaryResources {
  return new Set();
}

export function setCurrentlyRenderingBoundaryResourcesTarget(
  renderState: RenderState,
  boundaryResources: null | BoundaryResources,
) {
  renderState.boundaryResources = boundaryResources;
}

function getResourceKey(as: string, href: string): string {
  return `[${as}]${href}`;
}

function prefetchDNS(href: string) {
  if (!enableFloat) {
    return;
  }
  const request = resolveRequest();
  if (!request) {
    // In async contexts we can sometimes resolve resources from AsyncLocalStorage. If we can't we can also
    // possibly get them from the stack if we are not in an async context. Since we were not able to resolve
    // the resources for this call in either case we opt to do nothing. We can consider making this a warning
    // but there may be times where calling a function outside of render is intentional (i.e. to warm up data
    // fetching) and we don't want to warn in those cases.
    return;
  }
  const resumableState = getResumableState(request);

  if (typeof href === 'string' && href) {
    const key = getResourceKey('prefetchDNS', href);
    let resource = resumableState.preconnectsMap.get(key);
    if (!resource) {
      resource = {
        type: 'preconnect',
        chunks: [],
        state: NoState,
        props: null,
      };
      resumableState.preconnectsMap.set(key, resource);
      pushLinkImpl(
        resource.chunks,
        ({href, rel: 'dns-prefetch'}: PreconnectProps),
      );
    }
    resumableState.preconnects.add(resource);
    flushResources(request);
  }
}

function preconnect(href: string, crossOrigin: ?CrossOriginEnum) {
  if (!enableFloat) {
    return;
  }
  const request = resolveRequest();
  if (!request) {
    // In async contexts we can sometimes resolve resources from AsyncLocalStorage. If we can't we can also
    // possibly get them from the stack if we are not in an async context. Since we were not able to resolve
    // the resources for this call in either case we opt to do nothing. We can consider making this a warning
    // but there may be times where calling a function outside of render is intentional (i.e. to warm up data
    // fetching) and we don't want to warn in those cases.
    return;
  }
  const resumableState = getResumableState(request);

  if (typeof href === 'string' && href) {
    const key = `[preconnect][${
      typeof crossOrigin === 'string' ? crossOrigin : 'null'
    }]${href}`;
    let resource = resumableState.preconnectsMap.get(key);
    if (!resource) {
      resource = {
        type: 'preconnect',
        chunks: [],
        state: NoState,
        props: null,
      };
      resumableState.preconnectsMap.set(key, resource);
      pushLinkImpl(
        resource.chunks,
        ({rel: 'preconnect', href, crossOrigin}: PreconnectProps),
      );
    }
    resumableState.preconnects.add(resource);
    flushResources(request);
  }
}

function preload(href: string, as: string, options?: ?PreloadImplOptions) {
  if (!enableFloat) {
    return;
  }
  const request = resolveRequest();
  if (!request) {
    // In async contexts we can sometimes resolve resources from AsyncLocalStorage. If we can't we can also
    // possibly get them from the stack if we are not in an async context. Since we were not able to resolve
    // the resources for this call in either case we opt to do nothing. We can consider making this a warning
    // but there may be times where calling a function outside of render is intentional (i.e. to warm up data
    // fetching) and we don't want to warn in those cases.
    return;
  }
  const resumableState = getResumableState(request);
  if (as && href) {
    options = options || {};
    let key: string;
    if (as === 'image') {
      // For image preloads the key contains either the imageSrcSet + imageSizes or the href but not
      // both. This is to prevent identical calls with the same srcSet and sizes to be duplicated
      // by varying the href. this is an edge case but it is the most correct behavior.
      key = getImagePreloadKey(href, options.imageSrcSet, options.imageSizes);
    } else {
      key = getResourceKey(as, href);
    }
    let resource = resumableState.preloadsMap.get(key);
    if (!resource) {
      const props = Object.assign(
        ({
          rel: 'preload',
          href: as === 'image' && options.imageSrcSet ? undefined : href,
          as,
        }: PreloadProps),
        options,
      );
      resource = {
        type: 'preload',
        chunks: [],
        state: NoState,
        props,
      };
      resumableState.preloadsMap.set(key, resource);
      pushLinkImpl(resource.chunks, resource.props);
    }
    if (as === 'font') {
      resumableState.fontPreloads.add(resource);
    } else if (as === 'image' && resource.props.fetchPriority === 'high') {
      resumableState.highImagePreloads.add(resource);
    } else {
      resumableState.bulkPreloads.add(resource);
    }
    flushResources(request);
  }
}

function preloadModule(
  href: string,
  options?: ?PreloadModuleImplOptions,
): void {
  if (!enableFloat) {
    return;
  }
  const request = resolveRequest();
  if (!request) {
    // In async contexts we can sometimes resolve resources from AsyncLocalStorage. If we can't we can also
    // possibly get them from the stack if we are not in an async context. Since we were not able to resolve
    // the resources for this call in either case we opt to do nothing. We can consider making this a warning
    // but there may be times where calling a function outside of render is intentional (i.e. to warm up data
    // fetching) and we don't want to warn in those cases.
    return;
  }
  const resumableState = getResumableState(request);
  if (href) {
    const as =
      options && typeof options.as === 'string' ? options.as : 'script';
    const key = getResourceKey(as, href);
    let resource = resumableState.preloadsMap.get(key);
    const props: PreloadModuleProps = Object.assign(
      ({
        rel: 'modulepreload',
        href,
      }: PreloadModuleProps),
      options,
    );
    if (!resource) {
      resource = {
        type: 'preload',
        chunks: [],
        state: NoState,
        props,
      };
      resumableState.preloadsMap.set(key, resource);
      pushLinkImpl(resource.chunks, resource.props);
    }
    resumableState.bulkPreloads.add(resource);
    flushResources(request);
  }
}

function preinitStyle(
  href: string,
  precedence: ?string,
  options?: ?PreinitStyleOptions,
): void {
  if (!enableFloat) {
    return;
  }
  const request = resolveRequest();
  if (!request) {
    // In async contexts we can sometimes resolve resources from AsyncLocalStorage. If we can't we can also
    // possibly get them from the stack if we are not in an async context. Since we were not able to resolve
    // the resources for this call in either case we opt to do nothing. We can consider making this a warning
    // but there may be times where calling a function outside of render is intentional (i.e. to warm up data
    // fetching) and we don't want to warn in those cases.
    return;
  }
  const resumableState = getResumableState(request);
  if (href) {
    const as = 'style';
    const key = getResourceKey(as, href);
    let resource = resumableState.stylesMap.get(key);
    if (!resource) {
      precedence = precedence || 'default';
      let state = NoState;
      const preloadResource = resumableState.preloadsMap.get(key);
      if (preloadResource && preloadResource.state & Flushed) {
        state = PreloadFlushed;
      }
      const props: StylesheetProps = Object.assign(
        ({
          rel: 'stylesheet',
          href,
          'data-precedence': precedence,
        }: StylesheetProps),
        options,
      );
      resource = {
        type: 'stylesheet',
        chunks: ([]: Array<Chunk | PrecomputedChunk>),
        state,
        props,
      };
      resumableState.stylesMap.set(key, resource);
      let precedenceSet = resumableState.precedences.get(precedence);
      if (!precedenceSet) {
        precedenceSet = new Set();
        resumableState.precedences.set(precedence, precedenceSet);
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
          if (resumableState.stylePrecedences.has(precedence)) {
            console.error(
              'React constructed an empty style resource when a style resource already exists for this precedence: "%s". This is a bug in React.',
              precedence,
            );
          }
        }
        resumableState.stylePrecedences.set(precedence, emptyStyleResource);
      }
      precedenceSet.add(resource);
      flushResources(request);
    }
    return;
  }
}

function preinitScript(src: string, options?: ?PreinitScriptOptions): void {
  if (!enableFloat) {
    return;
  }
  const request = resolveRequest();
  if (!request) {
    // In async contexts we can sometimes resolve resources from AsyncLocalStorage. If we can't we can also
    // possibly get them from the stack if we are not in an async context. Since we were not able to resolve
    // the resources for this call in either case we opt to do nothing. We can consider making this a warning
    // but there may be times where calling a function outside of render is intentional (i.e. to warm up data
    // fetching) and we don't want to warn in those cases.
    return;
  }
  const resumableState = getResumableState(request);
  if (src) {
    const key = getResourceKey('script', src);
    let resource = resumableState.scriptsMap.get(key);
    if (!resource) {
      resource = {
        type: 'script',
        chunks: [],
        state: NoState,
        props: null,
      };
      resumableState.scriptsMap.set(key, resource);
      const props: ScriptProps = Object.assign(
        ({
          src,
          async: true,
        }: ScriptProps),
        options,
      );
      resumableState.scripts.add(resource);
      pushScriptImpl(resource.chunks, props);
      flushResources(request);
    }
    return;
  }
}

function preinitModuleScript(
  src: string,
  options?: ?PreinitModuleScriptOptions,
): void {
  if (!enableFloat) {
    return;
  }
  const request = resolveRequest();
  if (!request) {
    // In async contexts we can sometimes resolve resources from AsyncLocalStorage. If we can't we can also
    // possibly get them from the stack if we are not in an async context. Since we were not able to resolve
    // the resources for this call in either case we opt to do nothing. We can consider making this a warning
    // but there may be times where calling a function outside of render is intentional (i.e. to warm up data
    // fetching) and we don't want to warn in those cases.
    return;
  }
  const resumableState = getResumableState(request);
  if (src) {
    const key = getResourceKey('script', src);
    let resource = resumableState.scriptsMap.get(key);
    if (!resource) {
      resource = {
        type: 'script',
        chunks: [],
        state: NoState,
        props: null,
      };
      resumableState.scriptsMap.set(key, resource);
      const props = Object.assign(
        ({
          src,
          type: 'module',
          async: true,
        }: ModuleProps),
        options,
      );
      resumableState.scripts.add(resource);
      pushScriptImpl(resource.chunks, props);
      flushResources(request);
    }
    return;
  }
}

// This function is only safe to call at Request start time since it assumes
// that each script has not already been preloaded. If we find a need to preload
// scripts at any other point in time we will need to check whether the preload
// already exists and not assume it
function preloadBootstrapScript(
  resumableState: ResumableState,
  src: string,
  nonce: ?string,
  integrity: ?string,
  crossOrigin: ?string,
): void {
  const key = getResourceKey('script', src);
  if (__DEV__) {
    if (resumableState.preloadsMap.has(key)) {
      // This is coded as a React error because it should be impossible for a userspace preload to preempt this call
      // If a userspace preload can preempt it then this assumption is broken and we need to reconsider this strategy
      // rather than instruct the user to not preload their bootstrap scripts themselves
      console.error(
        'Internal React Error: React expected bootstrap script with src "%s" to not have been preloaded already. please file an issue',
        src,
      );
    }
  }
  const props: PreloadProps = {
    rel: 'preload',
    href: src,
    as: 'script',
    fetchPriority: 'low',
    nonce,
    integrity,
    crossOrigin,
  };
  const resource: PreloadResource = {
    type: 'preload',
    chunks: [],
    state: NoState,
    props,
  };
  resumableState.preloadsMap.set(key, resource);
  resumableState.bootstrapScripts.add(resource);
  pushLinkImpl(resource.chunks, props);
}

// This function is only safe to call at Request start time since it assumes
// that each module has not already been preloaded. If we find a need to preload
// scripts at any other point in time we will need to check whether the preload
// already exists and not assume it
function preloadBootstrapModule(
  resumableState: ResumableState,
  src: string,
  nonce: ?string,
  integrity: ?string,
  crossOrigin: ?string,
): void {
  const key = getResourceKey('script', src);
  if (__DEV__) {
    if (resumableState.preloadsMap.has(key)) {
      // This is coded as a React error because it should be impossible for a userspace preload to preempt this call
      // If a userspace preload can preempt it then this assumption is broken and we need to reconsider this strategy
      // rather than instruct the user to not preload their bootstrap scripts themselves
      console.error(
        'Internal React Error: React expected bootstrap module with src "%s" to not have been preloaded already. please file an issue',
        src,
      );
    }
  }
  const props: PreloadModuleProps = {
    rel: 'modulepreload',
    href: src,
    fetchPriority: 'low',
    nonce,
    integrity,
    crossOrigin,
  };
  const resource: PreloadResource = {
    type: 'preload',
    chunks: [],
    state: NoState,
    props,
  };
  resumableState.preloadsMap.set(key, resource);
  resumableState.bootstrapScripts.add(resource);
  pushLinkImpl(resource.chunks, props);
  return;
}

function internalPreinitScript(
  resumableState: ResumableState,
  src: string,
  chunks: Array<Chunk | PrecomputedChunk>,
): void {
  const key = getResourceKey('script', src);
  let resource = resumableState.scriptsMap.get(key);
  if (!resource) {
    resource = {
      type: 'script',
      chunks,
      state: NoState,
      props: null,
    };
    resumableState.scriptsMap.set(key, resource);
    resumableState.scripts.add(resource);
  }
  return;
}

function preloadAsStylePropsFromProps(href: string, props: any): PreloadProps {
  return {
    rel: 'preload',
    as: 'style',
    href: href,
    crossOrigin: props.crossOrigin,
    fetchPriority: props.fetchPriority,
    integrity: props.integrity,
    media: props.media,
    hrefLang: props.hrefLang,
    referrerPolicy: props.referrerPolicy,
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
  renderState: RenderState,
  source: BoundaryResources,
): void {
  const currentBoundaryResources = renderState.boundaryResources;
  if (currentBoundaryResources) {
    source.forEach(hoistStyleResource, currentBoundaryResources);
  }
}

export type TransitionStatus = FormStatus;
export const NotPendingTransition: TransitionStatus = NotPending;
