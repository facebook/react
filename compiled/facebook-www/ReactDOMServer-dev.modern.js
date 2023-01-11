/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @preserve-invariant-messages
 */

'use strict';

if (__DEV__) {
  (function() {
"use strict";

var React = require("react");
var ReactDOM = require("react-dom");

var ReactVersion = "18.3.0-www-modern-7002a6743-20230110";

// This refers to a WWW module.
var warningWWW = require("warning");
function warn(format) {
  {
    {
      for (
        var _len = arguments.length,
          args = new Array(_len > 1 ? _len - 1 : 0),
          _key = 1;
        _key < _len;
        _key++
      ) {
        args[_key - 1] = arguments[_key];
      }

      printWarning("warn", format, args);
    }
  }
}
function error(format) {
  {
    {
      for (
        var _len2 = arguments.length,
          args = new Array(_len2 > 1 ? _len2 - 1 : 0),
          _key2 = 1;
        _key2 < _len2;
        _key2++
      ) {
        args[_key2 - 1] = arguments[_key2];
      }

      printWarning("error", format, args);
    }
  }
}

function printWarning(level, format, args) {
  {
    var React = require("react");

    var ReactSharedInternals =
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED; // Defensive in case this is fired before React is initialized.

    if (ReactSharedInternals != null) {
      var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;
      var stack = ReactDebugCurrentFrame.getStackAddendum();

      if (stack !== "") {
        format += "%s";
        args.push(stack);
      }
    } // TODO: don't ignore level and pass it down somewhere too.

    args.unshift(format);
    args.unshift(false);
    warningWWW.apply(null, args);
  }
}

function scheduleWork(callback) {
  callback();
}
function beginWriting(destination) {}
function writeChunk(destination, chunk) {
  writeChunkAndReturn(destination, chunk);
}
function writeChunkAndReturn(destination, chunk) {
  return destination.push(chunk);
}
function completeWriting(destination) {}
function close(destination) {
  destination.push(null);
}
function stringToChunk(content) {
  return content;
}
function stringToPrecomputedChunk(content) {
  return content;
}
function clonePrecomputedChunk(chunk) {
  return chunk;
}
function closeWithError(destination, error) {
  // $FlowFixMe: This is an Error object or the destination accepts other types.
  destination.destroy(error);
}

/*
 * The `'' + value` pattern (used in perf-sensitive code) throws for Symbol
 * and Temporal.* types. See https://github.com/facebook/react/pull/22064.
 *
 * The functions in this module will throw an easier-to-understand,
 * easier-to-debug exception with a clear errors message message explaining the
 * problem. (Instead of a confusing exception thrown inside the implementation
 * of the `value` object).
 */
// $FlowFixMe only called in DEV, so void return is not possible.
function typeName(value) {
  {
    // toStringTag is needed for namespaced types like Temporal.Instant
    var hasToStringTag = typeof Symbol === "function" && Symbol.toStringTag;
    var type =
      (hasToStringTag && value[Symbol.toStringTag]) ||
      value.constructor.name ||
      "Object"; // $FlowFixMe

    return type;
  }
} // $FlowFixMe only called in DEV, so void return is not possible.

function willCoercionThrow(value) {
  {
    try {
      testStringCoercion(value);
      return false;
    } catch (e) {
      return true;
    }
  }
}

function testStringCoercion(value) {
  // If you ended up here by following an exception call stack, here's what's
  // happened: you supplied an object or symbol value to React (as a prop, key,
  // DOM attribute, CSS property, string ref, etc.) and when React tried to
  // coerce it to a string using `'' + value`, an exception was thrown.
  //
  // The most common types that will cause this exception are `Symbol` instances
  // and Temporal objects like `Temporal.Instant`. But any object that has a
  // `valueOf` or `[Symbol.toPrimitive]` method that throws will also cause this
  // exception. (Library authors do this to prevent users from using built-in
  // numeric operators like `+` or comparison operators like `>=` because custom
  // methods are needed to perform accurate arithmetic or comparison.)
  //
  // To fix the problem, coerce this object or symbol value to a string before
  // passing it to React. The most reliable way is usually `String(value)`.
  //
  // To find which value is throwing, check the browser or debugger console.
  // Before this exception was thrown, there should be `console.error` output
  // that shows the type (Symbol, Temporal.PlainDate, etc.) that caused the
  // problem and how that type was used: key, atrribute, input value prop, etc.
  // In most cases, this console output also shows the component and its
  // ancestor components where the exception happened.
  //
  // eslint-disable-next-line react-internal/safe-string-coercion
  return "" + value;
}

function checkAttributeStringCoercion(value, attributeName) {
  {
    if (willCoercionThrow(value)) {
      error(
        "The provided `%s` attribute is an unsupported type %s." +
          " This value must be coerced to a string before before using it here.",
        attributeName,
        typeName(value)
      );

      return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
    }
  }
}
function checkCSSPropertyStringCoercion(value, propName) {
  {
    if (willCoercionThrow(value)) {
      error(
        "The provided `%s` CSS property is an unsupported type %s." +
          " This value must be coerced to a string before before using it here.",
        propName,
        typeName(value)
      );

      return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
    }
  }
}
function checkHtmlStringCoercion(value) {
  {
    if (willCoercionThrow(value)) {
      error(
        "The provided HTML markup uses a value of unsupported type %s." +
          " This value must be coerced to a string before before using it here.",
        typeName(value)
      );

      return testStringCoercion(value); // throw (to help callers find troubleshooting comments)
    }
  }
}

// Re-export dynamic flags from the www version.
var dynamicFeatureFlags = require("ReactFeatureFlags");

var disableInputAttributeSyncing =
    dynamicFeatureFlags.disableInputAttributeSyncing,
  enableTrustedTypesIntegration =
    dynamicFeatureFlags.enableTrustedTypesIntegration,
  disableSchedulerTimeoutBasedOnReactExpirationTime =
    dynamicFeatureFlags.disableSchedulerTimeoutBasedOnReactExpirationTime,
  warnAboutSpreadingKeyToJSX = dynamicFeatureFlags.warnAboutSpreadingKeyToJSX,
  replayFailedUnitOfWorkWithInvokeGuardedCallback =
    dynamicFeatureFlags.replayFailedUnitOfWorkWithInvokeGuardedCallback,
  enableFilterEmptyStringAttributesDOM =
    dynamicFeatureFlags.enableFilterEmptyStringAttributesDOM,
  enableLegacyFBSupport = dynamicFeatureFlags.enableLegacyFBSupport,
  deferRenderPhaseUpdateToNextBatch =
    dynamicFeatureFlags.deferRenderPhaseUpdateToNextBatch,
  enableDebugTracing = dynamicFeatureFlags.enableDebugTracing,
  skipUnmountedBoundaries = dynamicFeatureFlags.skipUnmountedBoundaries,
  enableUseRefAccessWarning = dynamicFeatureFlags.enableUseRefAccessWarning,
  disableNativeComponentFrames =
    dynamicFeatureFlags.disableNativeComponentFrames,
  disableSchedulerTimeoutInWorkLoop =
    dynamicFeatureFlags.disableSchedulerTimeoutInWorkLoop,
  enableLazyContextPropagation =
    dynamicFeatureFlags.enableLazyContextPropagation,
  enableSyncDefaultUpdates = dynamicFeatureFlags.enableSyncDefaultUpdates,
  enableUnifiedSyncLane = dynamicFeatureFlags.enableUnifiedSyncLane,
  enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay =
    dynamicFeatureFlags.enableCapturePhaseSelectiveHydrationWithoutDiscreteEventReplay,
  enableTransitionTracing = dynamicFeatureFlags.enableTransitionTracing; // On WWW, true is used for a new modern build.
var enableProfilerNestedUpdateScheduledHook =
  dynamicFeatureFlags.enableProfilerNestedUpdateScheduledHook;
var enableFloat = true;

var enableSchedulingProfiler = dynamicFeatureFlags.enableSchedulingProfiler; // Note: we'll want to remove this when we to userland implementation.

// $FlowFixMe[method-unbinding]
var hasOwnProperty = Object.prototype.hasOwnProperty;

// It is handled by React separately and shouldn't be written to the DOM.

var RESERVED = 0; // A simple string attribute.
// Attributes that aren't in the filter are presumed to have this type.

var STRING = 1; // A string attribute that accepts booleans in React. In HTML, these are called
// "enumerated" attributes with "true" and "false" as possible values.
// When true, it should be set to a "true" string.
// When false, it should be set to a "false" string.

var BOOLEANISH_STRING = 2; // A real boolean attribute.
// When true, it should be present (set either to an empty string or its name).
// When false, it should be omitted.

var BOOLEAN = 3; // An attribute that can be used as a flag as well as with a value.
// When true, it should be present (set either to an empty string or its name).
// When false, it should be omitted.
// For any other value, should be present with that value.

var OVERLOADED_BOOLEAN = 4; // An attribute that must be numeric or parse as a numeric.
// When falsy, it should be removed.

var NUMERIC = 5; // An attribute that must be positive numeric or parse as a positive numeric.
// When falsy, it should be removed.

var POSITIVE_NUMERIC = 6;
/* eslint-disable max-len */

var ATTRIBUTE_NAME_START_CHAR =
  ":A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
/* eslint-enable max-len */

var ATTRIBUTE_NAME_CHAR =
  ATTRIBUTE_NAME_START_CHAR + "\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040";
var VALID_ATTRIBUTE_NAME_REGEX = new RegExp(
  "^[" + ATTRIBUTE_NAME_START_CHAR + "][" + ATTRIBUTE_NAME_CHAR + "]*$"
);
var illegalAttributeNameCache = {};
var validatedAttributeNameCache = {};
function isAttributeNameSafe(attributeName) {
  if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) {
    return true;
  }

  if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) {
    return false;
  }

  if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
    validatedAttributeNameCache[attributeName] = true;
    return true;
  }

  illegalAttributeNameCache[attributeName] = true;

  {
    error("Invalid attribute name: `%s`", attributeName);
  }

  return false;
}
function shouldRemoveAttributeWithWarning(
  name,
  value,
  propertyInfo,
  isCustomComponentTag
) {
  if (propertyInfo !== null && propertyInfo.type === RESERVED) {
    return false;
  }

  switch (typeof value) {
    case "function":
    case "symbol":
      // eslint-disable-line
      return true;

    case "boolean": {
      if (isCustomComponentTag) {
        return false;
      }

      if (propertyInfo !== null) {
        return !propertyInfo.acceptsBooleans;
      } else {
        var prefix = name.toLowerCase().slice(0, 5);
        return prefix !== "data-" && prefix !== "aria-";
      }
    }

    default:
      return false;
  }
}
function getPropertyInfo(name) {
  return properties.hasOwnProperty(name) ? properties[name] : null;
} // $FlowFixMe[missing-this-annot]

function PropertyInfoRecord(
  name,
  type,
  mustUseProperty,
  attributeName,
  attributeNamespace,
  sanitizeURL,
  removeEmptyString
) {
  this.acceptsBooleans =
    type === BOOLEANISH_STRING ||
    type === BOOLEAN ||
    type === OVERLOADED_BOOLEAN;
  this.attributeName = attributeName;
  this.attributeNamespace = attributeNamespace;
  this.mustUseProperty = mustUseProperty;
  this.propertyName = name;
  this.type = type;
  this.sanitizeURL = sanitizeURL;
  this.removeEmptyString = removeEmptyString;
} // When adding attributes to this list, be sure to also add them to
// the `possibleStandardNames` module to ensure casing and incorrect
// name warnings.

var properties = {}; // These props are reserved by React. They shouldn't be written to the DOM.

var reservedProps = [
  "children",
  "dangerouslySetInnerHTML", // TODO: This prevents the assignment of defaultValue to regular
  // elements (not just inputs). Now that ReactDOMInput assigns to the
  // defaultValue property -- do we need this?
  "defaultValue",
  "defaultChecked",
  "innerHTML",
  "suppressContentEditableWarning",
  "suppressHydrationWarning",
  "style"
];

{
  reservedProps.push("innerText", "textContent");
}

reservedProps.forEach(function(name) {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    name,
    RESERVED,
    false, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false
  );
}); // A few React string attributes have a different name.
// This is a mapping from React prop names to the attribute names.

[
  ["acceptCharset", "accept-charset"],
  ["className", "class"],
  ["htmlFor", "for"],
  ["httpEquiv", "http-equiv"]
].forEach(function(_ref) {
  var name = _ref[0],
    attributeName = _ref[1];
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    name,
    STRING,
    false, // mustUseProperty
    attributeName, // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false
  );
}); // These are "enumerated" HTML attributes that accept "true" and "false".
// In React, we let users pass `true` and `false` even though technically
// these aren't boolean attributes (they are coerced to strings).

["contentEditable", "draggable", "spellCheck", "value"].forEach(function(name) {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    name,
    BOOLEANISH_STRING,
    false, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false
  );
}); // These are "enumerated" SVG attributes that accept "true" and "false".
// In React, we let users pass `true` and `false` even though technically
// these aren't boolean attributes (they are coerced to strings).
// Since these are SVG attributes, their attribute names are case-sensitive.

[
  "autoReverse",
  "externalResourcesRequired",
  "focusable",
  "preserveAlpha"
].forEach(function(name) {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    name,
    BOOLEANISH_STRING,
    false, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false
  );
}); // These are HTML boolean attributes.

[
  "allowFullScreen",
  "async", // Note: there is a special case that prevents it from being written to the DOM
  // on the client side because the browsers are inconsistent. Instead we call focus().
  "autoFocus",
  "autoPlay",
  "controls",
  "default",
  "defer",
  "disabled",
  "disablePictureInPicture",
  "disableRemotePlayback",
  "formNoValidate",
  "hidden",
  "loop",
  "noModule",
  "noValidate",
  "open",
  "playsInline",
  "readOnly",
  "required",
  "reversed",
  "scoped",
  "seamless", // Microdata
  "itemScope"
].forEach(function(name) {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    name,
    BOOLEAN,
    false, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false
  );
}); // These are the few React props that we set as DOM properties
// rather than attributes. These are all booleans.

[
  "checked", // Note: `option.selected` is not updated if `select.multiple` is
  // disabled with `removeAttribute`. We have special logic for handling this.
  "multiple",
  "muted",
  "selected" // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
].forEach(function(name) {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    name,
    BOOLEAN,
    true, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false
  );
}); // These are HTML attributes that are "overloaded booleans": they behave like
// booleans, but can also accept a string value.

[
  "capture",
  "download" // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
].forEach(function(name) {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    name,
    OVERLOADED_BOOLEAN,
    false, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false
  );
}); // These are HTML attributes that must be positive numbers.

[
  "cols",
  "rows",
  "size",
  "span" // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
].forEach(function(name) {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    name,
    POSITIVE_NUMERIC,
    false, // mustUseProperty
    name, // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false
  );
}); // These are HTML attributes that must be numbers.

["rowSpan", "start"].forEach(function(name) {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    name,
    NUMERIC,
    false, // mustUseProperty
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false
  );
});
var CAMELIZE = /[\-\:]([a-z])/g;

var capitalize = function(token) {
  return token[1].toUpperCase();
}; // This is a list of all SVG attributes that need special casing, namespacing,
// or boolean value assignment. Regular attributes that just accept strings
// and have the same names are omitted, just like in the HTML attribute filter.
// Some of these attributes can be hard to find. This list was created by
// scraping the MDN documentation.

[
  "accent-height",
  "alignment-baseline",
  "arabic-form",
  "baseline-shift",
  "cap-height",
  "clip-path",
  "clip-rule",
  "color-interpolation",
  "color-interpolation-filters",
  "color-profile",
  "color-rendering",
  "dominant-baseline",
  "enable-background",
  "fill-opacity",
  "fill-rule",
  "flood-color",
  "flood-opacity",
  "font-family",
  "font-size",
  "font-size-adjust",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-weight",
  "glyph-name",
  "glyph-orientation-horizontal",
  "glyph-orientation-vertical",
  "horiz-adv-x",
  "horiz-origin-x",
  "image-rendering",
  "letter-spacing",
  "lighting-color",
  "marker-end",
  "marker-mid",
  "marker-start",
  "overline-position",
  "overline-thickness",
  "paint-order",
  "panose-1",
  "pointer-events",
  "rendering-intent",
  "shape-rendering",
  "stop-color",
  "stop-opacity",
  "strikethrough-position",
  "strikethrough-thickness",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "text-anchor",
  "text-decoration",
  "text-rendering",
  "underline-position",
  "underline-thickness",
  "unicode-bidi",
  "unicode-range",
  "units-per-em",
  "v-alphabetic",
  "v-hanging",
  "v-ideographic",
  "v-mathematical",
  "vector-effect",
  "vert-adv-y",
  "vert-origin-x",
  "vert-origin-y",
  "word-spacing",
  "writing-mode",
  "xmlns:xlink",
  "x-height" // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
].forEach(function(attributeName) {
  var name = attributeName.replace(CAMELIZE, capitalize); // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions

  properties[name] = new PropertyInfoRecord(
    name,
    STRING,
    false, // mustUseProperty
    attributeName,
    null, // attributeNamespace
    false, // sanitizeURL
    false
  );
}); // String SVG attributes with the xlink namespace.

[
  "xlink:actuate",
  "xlink:arcrole",
  "xlink:role",
  "xlink:show",
  "xlink:title",
  "xlink:type" // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
].forEach(function(attributeName) {
  var name = attributeName.replace(CAMELIZE, capitalize); // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions

  properties[name] = new PropertyInfoRecord(
    name,
    STRING,
    false, // mustUseProperty
    attributeName,
    "http://www.w3.org/1999/xlink",
    false, // sanitizeURL
    false
  );
}); // String SVG attributes with the xml namespace.

[
  "xml:base",
  "xml:lang",
  "xml:space" // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
].forEach(function(attributeName) {
  var name = attributeName.replace(CAMELIZE, capitalize); // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions

  properties[name] = new PropertyInfoRecord(
    name,
    STRING,
    false, // mustUseProperty
    attributeName,
    "http://www.w3.org/XML/1998/namespace",
    false, // sanitizeURL
    false
  );
}); // These attribute exists both in HTML and SVG.
// The attribute name is case-sensitive in SVG so we can't just use
// the React name like we do for attributes that exist only in HTML.

["tabIndex", "crossOrigin"].forEach(function(attributeName) {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[attributeName] = new PropertyInfoRecord(
    attributeName,
    STRING,
    false, // mustUseProperty
    attributeName.toLowerCase(), // attributeName
    null, // attributeNamespace
    false, // sanitizeURL
    false
  );
}); // These attributes accept URLs. These must not allow javascript: URLS.
// These will also need to accept Trusted Types object in the future.

var xlinkHref = "xlinkHref"; // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions

properties[xlinkHref] = new PropertyInfoRecord(
  "xlinkHref",
  STRING,
  false, // mustUseProperty
  "xlink:href",
  "http://www.w3.org/1999/xlink",
  true, // sanitizeURL
  false
);
["src", "href", "action", "formAction"].forEach(function(attributeName) {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[attributeName] = new PropertyInfoRecord(
    attributeName,
    STRING,
    false, // mustUseProperty
    attributeName.toLowerCase(), // attributeName
    null, // attributeNamespace
    true, // sanitizeURL
    true
  );
});

/**
 * CSS properties which accept numbers but are not in units of "px".
 */
var isUnitlessNumber = {
  animationIterationCount: true,
  aspectRatio: true,
  borderImageOutset: true,
  borderImageSlice: true,
  borderImageWidth: true,
  boxFlex: true,
  boxFlexGroup: true,
  boxOrdinalGroup: true,
  columnCount: true,
  columns: true,
  flex: true,
  flexGrow: true,
  flexPositive: true,
  flexShrink: true,
  flexNegative: true,
  flexOrder: true,
  gridArea: true,
  gridRow: true,
  gridRowEnd: true,
  gridRowSpan: true,
  gridRowStart: true,
  gridColumn: true,
  gridColumnEnd: true,
  gridColumnSpan: true,
  gridColumnStart: true,
  fontWeight: true,
  lineClamp: true,
  lineHeight: true,
  opacity: true,
  order: true,
  orphans: true,
  tabSize: true,
  widows: true,
  zIndex: true,
  zoom: true,
  // SVG-related properties
  fillOpacity: true,
  floodOpacity: true,
  stopOpacity: true,
  strokeDasharray: true,
  strokeDashoffset: true,
  strokeMiterlimit: true,
  strokeOpacity: true,
  strokeWidth: true
};
/**
 * @param {string} prefix vendor-specific prefix, eg: Webkit
 * @param {string} key style name, eg: transitionDuration
 * @return {string} style name prefixed with `prefix`, properly camelCased, eg:
 * WebkitTransitionDuration
 */

function prefixKey(prefix, key) {
  return prefix + key.charAt(0).toUpperCase() + key.substring(1);
}
/**
 * Support style names that may come passed in prefixed by adding permutations
 * of vendor prefixes.
 */

var prefixes = ["Webkit", "ms", "Moz", "O"]; // Using Object.keys here, or else the vanilla for-in loop makes IE8 go into an
// infinite loop, because it iterates over the newly added props too.

Object.keys(isUnitlessNumber).forEach(function(prop) {
  prefixes.forEach(function(prefix) {
    isUnitlessNumber[prefixKey(prefix, prop)] = isUnitlessNumber[prop];
  });
});

var hasReadOnlyValue = {
  button: true,
  checkbox: true,
  image: true,
  hidden: true,
  radio: true,
  reset: true,
  submit: true
};
function checkControlledValueProps(tagName, props) {
  {
    if (
      !(
        hasReadOnlyValue[props.type] ||
        props.onChange ||
        props.onInput ||
        props.readOnly ||
        props.disabled ||
        props.value == null
      )
    ) {
      error(
        "You provided a `value` prop to a form field without an " +
          "`onChange` handler. This will render a read-only field. If " +
          "the field should be mutable use `defaultValue`. Otherwise, " +
          "set either `onChange` or `readOnly`."
      );
    }

    if (
      !(
        props.onChange ||
        props.readOnly ||
        props.disabled ||
        props.checked == null
      )
    ) {
      error(
        "You provided a `checked` prop to a form field without an " +
          "`onChange` handler. This will render a read-only field. If " +
          "the field should be mutable use `defaultChecked`. Otherwise, " +
          "set either `onChange` or `readOnly`."
      );
    }
  }
}

function isCustomComponent(tagName, props) {
  if (tagName.indexOf("-") === -1) {
    return typeof props.is === "string";
  }

  switch (tagName) {
    // These are reserved SVG and MathML elements.
    // We don't mind this list too much because we expect it to never grow.
    // The alternative is to track the namespace in a few places which is convoluted.
    // https://w3c.github.io/webcomponents/spec/custom/#custom-elements-core-concepts
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return false;

    default:
      return true;
  }
}

var ariaProperties = {
  "aria-current": 0,
  // state
  "aria-description": 0,
  "aria-details": 0,
  "aria-disabled": 0,
  // state
  "aria-hidden": 0,
  // state
  "aria-invalid": 0,
  // state
  "aria-keyshortcuts": 0,
  "aria-label": 0,
  "aria-roledescription": 0,
  // Widget Attributes
  "aria-autocomplete": 0,
  "aria-checked": 0,
  "aria-expanded": 0,
  "aria-haspopup": 0,
  "aria-level": 0,
  "aria-modal": 0,
  "aria-multiline": 0,
  "aria-multiselectable": 0,
  "aria-orientation": 0,
  "aria-placeholder": 0,
  "aria-pressed": 0,
  "aria-readonly": 0,
  "aria-required": 0,
  "aria-selected": 0,
  "aria-sort": 0,
  "aria-valuemax": 0,
  "aria-valuemin": 0,
  "aria-valuenow": 0,
  "aria-valuetext": 0,
  // Live Region Attributes
  "aria-atomic": 0,
  "aria-busy": 0,
  "aria-live": 0,
  "aria-relevant": 0,
  // Drag-and-Drop Attributes
  "aria-dropeffect": 0,
  "aria-grabbed": 0,
  // Relationship Attributes
  "aria-activedescendant": 0,
  "aria-colcount": 0,
  "aria-colindex": 0,
  "aria-colspan": 0,
  "aria-controls": 0,
  "aria-describedby": 0,
  "aria-errormessage": 0,
  "aria-flowto": 0,
  "aria-labelledby": 0,
  "aria-owns": 0,
  "aria-posinset": 0,
  "aria-rowcount": 0,
  "aria-rowindex": 0,
  "aria-rowspan": 0,
  "aria-setsize": 0
};

var warnedProperties = {};
var rARIA = new RegExp("^(aria)-[" + ATTRIBUTE_NAME_CHAR + "]*$");
var rARIACamel = new RegExp("^(aria)[A-Z][" + ATTRIBUTE_NAME_CHAR + "]*$");

function validateProperty(tagName, name) {
  {
    if (hasOwnProperty.call(warnedProperties, name) && warnedProperties[name]) {
      return true;
    }

    if (rARIACamel.test(name)) {
      var ariaName = "aria-" + name.slice(4).toLowerCase();
      var correctName = ariaProperties.hasOwnProperty(ariaName)
        ? ariaName
        : null; // If this is an aria-* attribute, but is not listed in the known DOM
      // DOM properties, then it is an invalid aria-* attribute.

      if (correctName == null) {
        error(
          "Invalid ARIA attribute `%s`. ARIA attributes follow the pattern aria-* and must be lowercase.",
          name
        );

        warnedProperties[name] = true;
        return true;
      } // aria-* attributes should be lowercase; suggest the lowercase version.

      if (name !== correctName) {
        error(
          "Invalid ARIA attribute `%s`. Did you mean `%s`?",
          name,
          correctName
        );

        warnedProperties[name] = true;
        return true;
      }
    }

    if (rARIA.test(name)) {
      var lowerCasedName = name.toLowerCase();
      var standardName = ariaProperties.hasOwnProperty(lowerCasedName)
        ? lowerCasedName
        : null; // If this is an aria-* attribute, but is not listed in the known DOM
      // DOM properties, then it is an invalid aria-* attribute.

      if (standardName == null) {
        warnedProperties[name] = true;
        return false;
      } // aria-* attributes should be lowercase; suggest the lowercase version.

      if (name !== standardName) {
        error(
          "Unknown ARIA attribute `%s`. Did you mean `%s`?",
          name,
          standardName
        );

        warnedProperties[name] = true;
        return true;
      }
    }
  }

  return true;
}

function warnInvalidARIAProps(type, props) {
  {
    var invalidProps = [];

    for (var key in props) {
      var isValid = validateProperty(type, key);

      if (!isValid) {
        invalidProps.push(key);
      }
    }

    var unknownPropString = invalidProps
      .map(function(prop) {
        return "`" + prop + "`";
      })
      .join(", ");

    if (invalidProps.length === 1) {
      error(
        "Invalid aria prop %s on <%s> tag. " +
          "For details, see https://reactjs.org/link/invalid-aria-props",
        unknownPropString,
        type
      );
    } else if (invalidProps.length > 1) {
      error(
        "Invalid aria props %s on <%s> tag. " +
          "For details, see https://reactjs.org/link/invalid-aria-props",
        unknownPropString,
        type
      );
    }
  }
}

function validateProperties(type, props) {
  if (isCustomComponent(type, props)) {
    return;
  }

  warnInvalidARIAProps(type, props);
}

var didWarnValueNull = false;
function validateProperties$1(type, props) {
  {
    if (type !== "input" && type !== "textarea" && type !== "select") {
      return;
    }

    if (props != null && props.value === null && !didWarnValueNull) {
      didWarnValueNull = true;

      if (type === "select" && props.multiple) {
        error(
          "`value` prop on `%s` should not be null. " +
            "Consider using an empty array when `multiple` is set to `true` " +
            "to clear the component or `undefined` for uncontrolled components.",
          type
        );
      } else {
        error(
          "`value` prop on `%s` should not be null. " +
            "Consider using an empty string to clear the component or `undefined` " +
            "for uncontrolled components.",
          type
        );
      }
    }
  }
}

// When adding attributes to the HTML or SVG allowed attribute list, be sure to
// also add them to this module to ensure casing and incorrect name
// warnings.
var possibleStandardNames = {
  // HTML
  accept: "accept",
  acceptcharset: "acceptCharset",
  "accept-charset": "acceptCharset",
  accesskey: "accessKey",
  action: "action",
  allowfullscreen: "allowFullScreen",
  alt: "alt",
  as: "as",
  async: "async",
  autocapitalize: "autoCapitalize",
  autocomplete: "autoComplete",
  autocorrect: "autoCorrect",
  autofocus: "autoFocus",
  autoplay: "autoPlay",
  autosave: "autoSave",
  capture: "capture",
  cellpadding: "cellPadding",
  cellspacing: "cellSpacing",
  challenge: "challenge",
  charset: "charSet",
  checked: "checked",
  children: "children",
  cite: "cite",
  class: "className",
  classid: "classID",
  classname: "className",
  cols: "cols",
  colspan: "colSpan",
  content: "content",
  contenteditable: "contentEditable",
  contextmenu: "contextMenu",
  controls: "controls",
  controlslist: "controlsList",
  coords: "coords",
  crossorigin: "crossOrigin",
  dangerouslysetinnerhtml: "dangerouslySetInnerHTML",
  data: "data",
  datetime: "dateTime",
  default: "default",
  defaultchecked: "defaultChecked",
  defaultvalue: "defaultValue",
  defer: "defer",
  dir: "dir",
  disabled: "disabled",
  disablepictureinpicture: "disablePictureInPicture",
  disableremoteplayback: "disableRemotePlayback",
  download: "download",
  draggable: "draggable",
  enctype: "encType",
  enterkeyhint: "enterKeyHint",
  fetchpriority: "fetchPriority",
  for: "htmlFor",
  form: "form",
  formmethod: "formMethod",
  formaction: "formAction",
  formenctype: "formEncType",
  formnovalidate: "formNoValidate",
  formtarget: "formTarget",
  frameborder: "frameBorder",
  headers: "headers",
  height: "height",
  hidden: "hidden",
  high: "high",
  href: "href",
  hreflang: "hrefLang",
  htmlfor: "htmlFor",
  httpequiv: "httpEquiv",
  "http-equiv": "httpEquiv",
  icon: "icon",
  id: "id",
  imagesizes: "imageSizes",
  imagesrcset: "imageSrcSet",
  innerhtml: "innerHTML",
  inputmode: "inputMode",
  integrity: "integrity",
  is: "is",
  itemid: "itemID",
  itemprop: "itemProp",
  itemref: "itemRef",
  itemscope: "itemScope",
  itemtype: "itemType",
  keyparams: "keyParams",
  keytype: "keyType",
  kind: "kind",
  label: "label",
  lang: "lang",
  list: "list",
  loop: "loop",
  low: "low",
  manifest: "manifest",
  marginwidth: "marginWidth",
  marginheight: "marginHeight",
  max: "max",
  maxlength: "maxLength",
  media: "media",
  mediagroup: "mediaGroup",
  method: "method",
  min: "min",
  minlength: "minLength",
  multiple: "multiple",
  muted: "muted",
  name: "name",
  nomodule: "noModule",
  nonce: "nonce",
  novalidate: "noValidate",
  open: "open",
  optimum: "optimum",
  pattern: "pattern",
  placeholder: "placeholder",
  playsinline: "playsInline",
  poster: "poster",
  preload: "preload",
  profile: "profile",
  radiogroup: "radioGroup",
  readonly: "readOnly",
  referrerpolicy: "referrerPolicy",
  rel: "rel",
  required: "required",
  reversed: "reversed",
  role: "role",
  rows: "rows",
  rowspan: "rowSpan",
  sandbox: "sandbox",
  scope: "scope",
  scoped: "scoped",
  scrolling: "scrolling",
  seamless: "seamless",
  selected: "selected",
  shape: "shape",
  size: "size",
  sizes: "sizes",
  span: "span",
  spellcheck: "spellCheck",
  src: "src",
  srcdoc: "srcDoc",
  srclang: "srcLang",
  srcset: "srcSet",
  start: "start",
  step: "step",
  style: "style",
  summary: "summary",
  tabindex: "tabIndex",
  target: "target",
  title: "title",
  type: "type",
  usemap: "useMap",
  value: "value",
  width: "width",
  wmode: "wmode",
  wrap: "wrap",
  // SVG
  about: "about",
  accentheight: "accentHeight",
  "accent-height": "accentHeight",
  accumulate: "accumulate",
  additive: "additive",
  alignmentbaseline: "alignmentBaseline",
  "alignment-baseline": "alignmentBaseline",
  allowreorder: "allowReorder",
  alphabetic: "alphabetic",
  amplitude: "amplitude",
  arabicform: "arabicForm",
  "arabic-form": "arabicForm",
  ascent: "ascent",
  attributename: "attributeName",
  attributetype: "attributeType",
  autoreverse: "autoReverse",
  azimuth: "azimuth",
  basefrequency: "baseFrequency",
  baselineshift: "baselineShift",
  "baseline-shift": "baselineShift",
  baseprofile: "baseProfile",
  bbox: "bbox",
  begin: "begin",
  bias: "bias",
  by: "by",
  calcmode: "calcMode",
  capheight: "capHeight",
  "cap-height": "capHeight",
  clip: "clip",
  clippath: "clipPath",
  "clip-path": "clipPath",
  clippathunits: "clipPathUnits",
  cliprule: "clipRule",
  "clip-rule": "clipRule",
  color: "color",
  colorinterpolation: "colorInterpolation",
  "color-interpolation": "colorInterpolation",
  colorinterpolationfilters: "colorInterpolationFilters",
  "color-interpolation-filters": "colorInterpolationFilters",
  colorprofile: "colorProfile",
  "color-profile": "colorProfile",
  colorrendering: "colorRendering",
  "color-rendering": "colorRendering",
  contentscripttype: "contentScriptType",
  contentstyletype: "contentStyleType",
  cursor: "cursor",
  cx: "cx",
  cy: "cy",
  d: "d",
  datatype: "datatype",
  decelerate: "decelerate",
  descent: "descent",
  diffuseconstant: "diffuseConstant",
  direction: "direction",
  display: "display",
  divisor: "divisor",
  dominantbaseline: "dominantBaseline",
  "dominant-baseline": "dominantBaseline",
  dur: "dur",
  dx: "dx",
  dy: "dy",
  edgemode: "edgeMode",
  elevation: "elevation",
  enablebackground: "enableBackground",
  "enable-background": "enableBackground",
  end: "end",
  exponent: "exponent",
  externalresourcesrequired: "externalResourcesRequired",
  fill: "fill",
  fillopacity: "fillOpacity",
  "fill-opacity": "fillOpacity",
  fillrule: "fillRule",
  "fill-rule": "fillRule",
  filter: "filter",
  filterres: "filterRes",
  filterunits: "filterUnits",
  floodopacity: "floodOpacity",
  "flood-opacity": "floodOpacity",
  floodcolor: "floodColor",
  "flood-color": "floodColor",
  focusable: "focusable",
  fontfamily: "fontFamily",
  "font-family": "fontFamily",
  fontsize: "fontSize",
  "font-size": "fontSize",
  fontsizeadjust: "fontSizeAdjust",
  "font-size-adjust": "fontSizeAdjust",
  fontstretch: "fontStretch",
  "font-stretch": "fontStretch",
  fontstyle: "fontStyle",
  "font-style": "fontStyle",
  fontvariant: "fontVariant",
  "font-variant": "fontVariant",
  fontweight: "fontWeight",
  "font-weight": "fontWeight",
  format: "format",
  from: "from",
  fx: "fx",
  fy: "fy",
  g1: "g1",
  g2: "g2",
  glyphname: "glyphName",
  "glyph-name": "glyphName",
  glyphorientationhorizontal: "glyphOrientationHorizontal",
  "glyph-orientation-horizontal": "glyphOrientationHorizontal",
  glyphorientationvertical: "glyphOrientationVertical",
  "glyph-orientation-vertical": "glyphOrientationVertical",
  glyphref: "glyphRef",
  gradienttransform: "gradientTransform",
  gradientunits: "gradientUnits",
  hanging: "hanging",
  horizadvx: "horizAdvX",
  "horiz-adv-x": "horizAdvX",
  horizoriginx: "horizOriginX",
  "horiz-origin-x": "horizOriginX",
  ideographic: "ideographic",
  imagerendering: "imageRendering",
  "image-rendering": "imageRendering",
  in2: "in2",
  in: "in",
  inlist: "inlist",
  intercept: "intercept",
  k1: "k1",
  k2: "k2",
  k3: "k3",
  k4: "k4",
  k: "k",
  kernelmatrix: "kernelMatrix",
  kernelunitlength: "kernelUnitLength",
  kerning: "kerning",
  keypoints: "keyPoints",
  keysplines: "keySplines",
  keytimes: "keyTimes",
  lengthadjust: "lengthAdjust",
  letterspacing: "letterSpacing",
  "letter-spacing": "letterSpacing",
  lightingcolor: "lightingColor",
  "lighting-color": "lightingColor",
  limitingconeangle: "limitingConeAngle",
  local: "local",
  markerend: "markerEnd",
  "marker-end": "markerEnd",
  markerheight: "markerHeight",
  markermid: "markerMid",
  "marker-mid": "markerMid",
  markerstart: "markerStart",
  "marker-start": "markerStart",
  markerunits: "markerUnits",
  markerwidth: "markerWidth",
  mask: "mask",
  maskcontentunits: "maskContentUnits",
  maskunits: "maskUnits",
  mathematical: "mathematical",
  mode: "mode",
  numoctaves: "numOctaves",
  offset: "offset",
  opacity: "opacity",
  operator: "operator",
  order: "order",
  orient: "orient",
  orientation: "orientation",
  origin: "origin",
  overflow: "overflow",
  overlineposition: "overlinePosition",
  "overline-position": "overlinePosition",
  overlinethickness: "overlineThickness",
  "overline-thickness": "overlineThickness",
  paintorder: "paintOrder",
  "paint-order": "paintOrder",
  panose1: "panose1",
  "panose-1": "panose1",
  pathlength: "pathLength",
  patterncontentunits: "patternContentUnits",
  patterntransform: "patternTransform",
  patternunits: "patternUnits",
  pointerevents: "pointerEvents",
  "pointer-events": "pointerEvents",
  points: "points",
  pointsatx: "pointsAtX",
  pointsaty: "pointsAtY",
  pointsatz: "pointsAtZ",
  prefix: "prefix",
  preservealpha: "preserveAlpha",
  preserveaspectratio: "preserveAspectRatio",
  primitiveunits: "primitiveUnits",
  property: "property",
  r: "r",
  radius: "radius",
  refx: "refX",
  refy: "refY",
  renderingintent: "renderingIntent",
  "rendering-intent": "renderingIntent",
  repeatcount: "repeatCount",
  repeatdur: "repeatDur",
  requiredextensions: "requiredExtensions",
  requiredfeatures: "requiredFeatures",
  resource: "resource",
  restart: "restart",
  result: "result",
  results: "results",
  rotate: "rotate",
  rx: "rx",
  ry: "ry",
  scale: "scale",
  security: "security",
  seed: "seed",
  shaperendering: "shapeRendering",
  "shape-rendering": "shapeRendering",
  slope: "slope",
  spacing: "spacing",
  specularconstant: "specularConstant",
  specularexponent: "specularExponent",
  speed: "speed",
  spreadmethod: "spreadMethod",
  startoffset: "startOffset",
  stddeviation: "stdDeviation",
  stemh: "stemh",
  stemv: "stemv",
  stitchtiles: "stitchTiles",
  stopcolor: "stopColor",
  "stop-color": "stopColor",
  stopopacity: "stopOpacity",
  "stop-opacity": "stopOpacity",
  strikethroughposition: "strikethroughPosition",
  "strikethrough-position": "strikethroughPosition",
  strikethroughthickness: "strikethroughThickness",
  "strikethrough-thickness": "strikethroughThickness",
  string: "string",
  stroke: "stroke",
  strokedasharray: "strokeDasharray",
  "stroke-dasharray": "strokeDasharray",
  strokedashoffset: "strokeDashoffset",
  "stroke-dashoffset": "strokeDashoffset",
  strokelinecap: "strokeLinecap",
  "stroke-linecap": "strokeLinecap",
  strokelinejoin: "strokeLinejoin",
  "stroke-linejoin": "strokeLinejoin",
  strokemiterlimit: "strokeMiterlimit",
  "stroke-miterlimit": "strokeMiterlimit",
  strokewidth: "strokeWidth",
  "stroke-width": "strokeWidth",
  strokeopacity: "strokeOpacity",
  "stroke-opacity": "strokeOpacity",
  suppresscontenteditablewarning: "suppressContentEditableWarning",
  suppresshydrationwarning: "suppressHydrationWarning",
  surfacescale: "surfaceScale",
  systemlanguage: "systemLanguage",
  tablevalues: "tableValues",
  targetx: "targetX",
  targety: "targetY",
  textanchor: "textAnchor",
  "text-anchor": "textAnchor",
  textdecoration: "textDecoration",
  "text-decoration": "textDecoration",
  textlength: "textLength",
  textrendering: "textRendering",
  "text-rendering": "textRendering",
  to: "to",
  transform: "transform",
  typeof: "typeof",
  u1: "u1",
  u2: "u2",
  underlineposition: "underlinePosition",
  "underline-position": "underlinePosition",
  underlinethickness: "underlineThickness",
  "underline-thickness": "underlineThickness",
  unicode: "unicode",
  unicodebidi: "unicodeBidi",
  "unicode-bidi": "unicodeBidi",
  unicoderange: "unicodeRange",
  "unicode-range": "unicodeRange",
  unitsperem: "unitsPerEm",
  "units-per-em": "unitsPerEm",
  unselectable: "unselectable",
  valphabetic: "vAlphabetic",
  "v-alphabetic": "vAlphabetic",
  values: "values",
  vectoreffect: "vectorEffect",
  "vector-effect": "vectorEffect",
  version: "version",
  vertadvy: "vertAdvY",
  "vert-adv-y": "vertAdvY",
  vertoriginx: "vertOriginX",
  "vert-origin-x": "vertOriginX",
  vertoriginy: "vertOriginY",
  "vert-origin-y": "vertOriginY",
  vhanging: "vHanging",
  "v-hanging": "vHanging",
  videographic: "vIdeographic",
  "v-ideographic": "vIdeographic",
  viewbox: "viewBox",
  viewtarget: "viewTarget",
  visibility: "visibility",
  vmathematical: "vMathematical",
  "v-mathematical": "vMathematical",
  vocab: "vocab",
  widths: "widths",
  wordspacing: "wordSpacing",
  "word-spacing": "wordSpacing",
  writingmode: "writingMode",
  "writing-mode": "writingMode",
  x1: "x1",
  x2: "x2",
  x: "x",
  xchannelselector: "xChannelSelector",
  xheight: "xHeight",
  "x-height": "xHeight",
  xlinkactuate: "xlinkActuate",
  "xlink:actuate": "xlinkActuate",
  xlinkarcrole: "xlinkArcrole",
  "xlink:arcrole": "xlinkArcrole",
  xlinkhref: "xlinkHref",
  "xlink:href": "xlinkHref",
  xlinkrole: "xlinkRole",
  "xlink:role": "xlinkRole",
  xlinkshow: "xlinkShow",
  "xlink:show": "xlinkShow",
  xlinktitle: "xlinkTitle",
  "xlink:title": "xlinkTitle",
  xlinktype: "xlinkType",
  "xlink:type": "xlinkType",
  xmlbase: "xmlBase",
  "xml:base": "xmlBase",
  xmllang: "xmlLang",
  "xml:lang": "xmlLang",
  xmlns: "xmlns",
  "xml:space": "xmlSpace",
  xmlnsxlink: "xmlnsXlink",
  "xmlns:xlink": "xmlnsXlink",
  xmlspace: "xmlSpace",
  y1: "y1",
  y2: "y2",
  y: "y",
  ychannelselector: "yChannelSelector",
  z: "z",
  zoomandpan: "zoomAndPan"
};

var validateProperty$1 = function() {};

{
  var warnedProperties$1 = {};
  var EVENT_NAME_REGEX = /^on./;
  var INVALID_EVENT_NAME_REGEX = /^on[^A-Z]/;
  var rARIA$1 = new RegExp("^(aria)-[" + ATTRIBUTE_NAME_CHAR + "]*$");
  var rARIACamel$1 = new RegExp("^(aria)[A-Z][" + ATTRIBUTE_NAME_CHAR + "]*$");

  validateProperty$1 = function(tagName, name, value, eventRegistry) {
    if (
      hasOwnProperty.call(warnedProperties$1, name) &&
      warnedProperties$1[name]
    ) {
      return true;
    }

    var lowerCasedName = name.toLowerCase();

    if (lowerCasedName === "onfocusin" || lowerCasedName === "onfocusout") {
      error(
        "React uses onFocus and onBlur instead of onFocusIn and onFocusOut. " +
          "All React events are normalized to bubble, so onFocusIn and onFocusOut " +
          "are not needed/supported by React."
      );

      warnedProperties$1[name] = true;
      return true;
    } // We can't rely on the event system being injected on the server.

    if (eventRegistry != null) {
      var registrationNameDependencies =
          eventRegistry.registrationNameDependencies,
        possibleRegistrationNames = eventRegistry.possibleRegistrationNames;

      if (registrationNameDependencies.hasOwnProperty(name)) {
        return true;
      }

      var registrationName = possibleRegistrationNames.hasOwnProperty(
        lowerCasedName
      )
        ? possibleRegistrationNames[lowerCasedName]
        : null;

      if (registrationName != null) {
        error(
          "Invalid event handler property `%s`. Did you mean `%s`?",
          name,
          registrationName
        );

        warnedProperties$1[name] = true;
        return true;
      }

      if (EVENT_NAME_REGEX.test(name)) {
        error("Unknown event handler property `%s`. It will be ignored.", name);

        warnedProperties$1[name] = true;
        return true;
      }
    } else if (EVENT_NAME_REGEX.test(name)) {
      // If no event plugins have been injected, we are in a server environment.
      // So we can't tell if the event name is correct for sure, but we can filter
      // out known bad ones like `onclick`. We can't suggest a specific replacement though.
      if (INVALID_EVENT_NAME_REGEX.test(name)) {
        error(
          "Invalid event handler property `%s`. " +
            "React events use the camelCase naming convention, for example `onClick`.",
          name
        );
      }

      warnedProperties$1[name] = true;
      return true;
    } // Let the ARIA attribute hook validate ARIA attributes

    if (rARIA$1.test(name) || rARIACamel$1.test(name)) {
      return true;
    }

    if (lowerCasedName === "innerhtml") {
      error(
        "Directly setting property `innerHTML` is not permitted. " +
          "For more information, lookup documentation on `dangerouslySetInnerHTML`."
      );

      warnedProperties$1[name] = true;
      return true;
    }

    if (lowerCasedName === "aria") {
      error(
        "The `aria` attribute is reserved for future use in React. " +
          "Pass individual `aria-` attributes instead."
      );

      warnedProperties$1[name] = true;
      return true;
    }

    if (
      lowerCasedName === "is" &&
      value !== null &&
      value !== undefined &&
      typeof value !== "string"
    ) {
      error(
        "Received a `%s` for a string attribute `is`. If this is expected, cast " +
          "the value to a string.",
        typeof value
      );

      warnedProperties$1[name] = true;
      return true;
    }

    if (typeof value === "number" && isNaN(value)) {
      error(
        "Received NaN for the `%s` attribute. If this is expected, cast " +
          "the value to a string.",
        name
      );

      warnedProperties$1[name] = true;
      return true;
    }

    var propertyInfo = getPropertyInfo(name);
    var isReserved = propertyInfo !== null && propertyInfo.type === RESERVED; // Known attributes should match the casing specified in the property config.

    if (possibleStandardNames.hasOwnProperty(lowerCasedName)) {
      var standardName = possibleStandardNames[lowerCasedName];

      if (standardName !== name) {
        error(
          "Invalid DOM property `%s`. Did you mean `%s`?",
          name,
          standardName
        );

        warnedProperties$1[name] = true;
        return true;
      }
    } else if (!isReserved && name !== lowerCasedName) {
      // Unknown attributes should have lowercase casing since that's how they
      // will be cased anyway with server rendering.
      error(
        "React does not recognize the `%s` prop on a DOM element. If you " +
          "intentionally want it to appear in the DOM as a custom " +
          "attribute, spell it as lowercase `%s` instead. " +
          "If you accidentally passed it from a parent component, remove " +
          "it from the DOM element.",
        name,
        lowerCasedName
      );

      warnedProperties$1[name] = true;
      return true;
    }

    if (
      typeof value === "boolean" &&
      shouldRemoveAttributeWithWarning(name, value, propertyInfo, false)
    ) {
      if (value) {
        error(
          "Received `%s` for a non-boolean attribute `%s`.\n\n" +
            "If you want to write it to the DOM, pass a string instead: " +
            '%s="%s" or %s={value.toString()}.',
          value,
          name,
          name,
          value,
          name
        );
      } else {
        error(
          "Received `%s` for a non-boolean attribute `%s`.\n\n" +
            "If you want to write it to the DOM, pass a string instead: " +
            '%s="%s" or %s={value.toString()}.\n\n' +
            "If you used to conditionally omit it with %s={condition && value}, " +
            "pass %s={condition ? value : undefined} instead.",
          value,
          name,
          name,
          value,
          name,
          name,
          name
        );
      }

      warnedProperties$1[name] = true;
      return true;
    } // Now that we've validated casing, do not validate
    // data types for reserved props

    if (isReserved) {
      return true;
    } // Warn when a known attribute is a bad type

    if (shouldRemoveAttributeWithWarning(name, value, propertyInfo, false)) {
      warnedProperties$1[name] = true;
      return false;
    } // Warn when passing the strings 'false' or 'true' into a boolean prop

    if (
      (value === "false" || value === "true") &&
      propertyInfo !== null &&
      propertyInfo.type === BOOLEAN
    ) {
      error(
        "Received the string `%s` for the boolean attribute `%s`. " +
          "%s " +
          "Did you mean %s={%s}?",
        value,
        name,
        value === "false"
          ? "The browser will interpret it as a truthy value."
          : 'Although this works, it will not work as expected if you pass the string "false".',
        name,
        value
      );

      warnedProperties$1[name] = true;
      return true;
    }

    return true;
  };
}

var warnUnknownProperties = function(type, props, eventRegistry) {
  {
    var unknownProps = [];

    for (var key in props) {
      var isValid = validateProperty$1(type, key, props[key], eventRegistry);

      if (!isValid) {
        unknownProps.push(key);
      }
    }

    var unknownPropString = unknownProps
      .map(function(prop) {
        return "`" + prop + "`";
      })
      .join(", ");

    if (unknownProps.length === 1) {
      error(
        "Invalid value for prop %s on <%s> tag. Either remove it from the element, " +
          "or pass a string or number value to keep it in the DOM. " +
          "For details, see https://reactjs.org/link/attribute-behavior ",
        unknownPropString,
        type
      );
    } else if (unknownProps.length > 1) {
      error(
        "Invalid values for props %s on <%s> tag. Either remove them from the element, " +
          "or pass a string or number value to keep them in the DOM. " +
          "For details, see https://reactjs.org/link/attribute-behavior ",
        unknownPropString,
        type
      );
    }
  }
};

function validateProperties$2(type, props, eventRegistry) {
  if (isCustomComponent(type, props)) {
    return;
  }

  warnUnknownProperties(type, props, eventRegistry);
}

var warnValidStyle = function() {};

{
  // 'msTransform' is correct, but the other prefixes should be capitalized
  var badVendoredStyleNamePattern = /^(?:webkit|moz|o)[A-Z]/;
  var msPattern = /^-ms-/;
  var hyphenPattern = /-(.)/g; // style values shouldn't contain a semicolon

  var badStyleValueWithSemicolonPattern = /;\s*$/;
  var warnedStyleNames = {};
  var warnedStyleValues = {};
  var warnedForNaNValue = false;
  var warnedForInfinityValue = false;

  var camelize = function(string) {
    return string.replace(hyphenPattern, function(_, character) {
      return character.toUpperCase();
    });
  };

  var warnHyphenatedStyleName = function(name) {
    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
      return;
    }

    warnedStyleNames[name] = true;

    error(
      "Unsupported style property %s. Did you mean %s?",
      name, // As Andi Smith suggests
      // (http://www.andismith.com/blog/2012/02/modernizr-prefixed/), an `-ms` prefix
      // is converted to lowercase `ms`.
      camelize(name.replace(msPattern, "ms-"))
    );
  };

  var warnBadVendoredStyleName = function(name) {
    if (warnedStyleNames.hasOwnProperty(name) && warnedStyleNames[name]) {
      return;
    }

    warnedStyleNames[name] = true;

    error(
      "Unsupported vendor-prefixed style property %s. Did you mean %s?",
      name,
      name.charAt(0).toUpperCase() + name.slice(1)
    );
  };

  var warnStyleValueWithSemicolon = function(name, value) {
    if (warnedStyleValues.hasOwnProperty(value) && warnedStyleValues[value]) {
      return;
    }

    warnedStyleValues[value] = true;

    error(
      "Style property values shouldn't contain a semicolon. " +
        'Try "%s: %s" instead.',
      name,
      value.replace(badStyleValueWithSemicolonPattern, "")
    );
  };

  var warnStyleValueIsNaN = function(name, value) {
    if (warnedForNaNValue) {
      return;
    }

    warnedForNaNValue = true;

    error("`NaN` is an invalid value for the `%s` css style property.", name);
  };

  var warnStyleValueIsInfinity = function(name, value) {
    if (warnedForInfinityValue) {
      return;
    }

    warnedForInfinityValue = true;

    error(
      "`Infinity` is an invalid value for the `%s` css style property.",
      name
    );
  };

  warnValidStyle = function(name, value) {
    if (name.indexOf("-") > -1) {
      warnHyphenatedStyleName(name);
    } else if (badVendoredStyleNamePattern.test(name)) {
      warnBadVendoredStyleName(name);
    } else if (badStyleValueWithSemicolonPattern.test(value)) {
      warnStyleValueWithSemicolon(name, value);
    }

    if (typeof value === "number") {
      if (isNaN(value)) {
        warnStyleValueIsNaN(name, value);
      } else if (!isFinite(value)) {
        warnStyleValueIsInfinity(name, value);
      }
    }
  };
}

var warnValidStyle$1 = warnValidStyle;

// code copied and modified from escape-html
var matchHtmlRegExp = /["'&<>]/;
/**
 * Escapes special characters and HTML entities in a given html string.
 *
 * @param  {string} string HTML string to escape for later insertion
 * @return {string}
 * @public
 */

function escapeHtml(string) {
  {
    checkHtmlStringCoercion(string);
  }

  var str = "" + string;
  var match = matchHtmlRegExp.exec(str);

  if (!match) {
    return str;
  }

  var escape;
  var html = "";
  var index;
  var lastIndex = 0;

  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        // "
        escape = "&quot;";
        break;

      case 38:
        // &
        escape = "&amp;";
        break;

      case 39:
        // '
        escape = "&#x27;"; // modified from escape-html; used to be '&#39'

        break;

      case 60:
        // <
        escape = "&lt;";
        break;

      case 62:
        // >
        escape = "&gt;";
        break;

      default:
        continue;
    }

    if (lastIndex !== index) {
      html += str.substring(lastIndex, index);
    }

    lastIndex = index + 1;
    html += escape;
  }

  return lastIndex !== index ? html + str.substring(lastIndex, index) : html;
} // end code copied and modified from escape-html

/**
 * Escapes text to prevent scripting attacks.
 *
 * @param {*} text Text value to escape.
 * @return {string} An escaped string.
 */

function escapeTextForBrowser(text) {
  if (typeof text === "boolean" || typeof text === "number") {
    // this shortcircuit helps perf for types that we know will never have
    // special characters, especially given that this function is used often
    // for numeric dom ids.
    return "" + text;
  }

  return escapeHtml(text);
}

var uppercasePattern = /([A-Z])/g;
var msPattern$1 = /^ms-/;
/**
 * Hyphenates a camelcased CSS property name, for example:
 *
 *   > hyphenateStyleName('backgroundColor')
 *   < "background-color"
 *   > hyphenateStyleName('MozTransition')
 *   < "-moz-transition"
 *   > hyphenateStyleName('msTransition')
 *   < "-ms-transition"
 *
 * As Modernizr suggests (http://modernizr.com/docs/#prefixed), an `ms` prefix
 * is converted to `-ms-`.
 */

function hyphenateStyleName(name) {
  return name
    .replace(uppercasePattern, "-$1")
    .toLowerCase()
    .replace(msPattern$1, "-ms-");
}

// and any newline or tab are filtered out as if they're not part of the URL.
// https://url.spec.whatwg.org/#url-parsing
// Tab or newline are defined as \r\n\t:
// https://infra.spec.whatwg.org/#ascii-tab-or-newline
// A C0 control is a code point in the range \u0000 NULL to \u001F
// INFORMATION SEPARATOR ONE, inclusive:
// https://infra.spec.whatwg.org/#c0-control-or-space

/* eslint-disable max-len */

var isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*\:/i;

function sanitizeURL(url) {
  {
    if (isJavaScriptProtocol.test(url)) {
      throw new Error(
        "React has blocked a javascript: URL as a security precaution."
      );
    }
  }
}

var isArrayImpl = Array.isArray; // eslint-disable-next-line no-redeclare

function isArray(a) {
  return isArrayImpl(a);
}

var assign = Object.assign;

function validatePreloadResourceDifference(
  originalProps,
  originalImplicit,
  latestProps,
  latestImplicit
) {
  {
    var href = originalProps.href;
    var originalWarningName = getResourceNameForWarning(
      "preload",
      originalProps,
      originalImplicit
    );
    var latestWarningName = getResourceNameForWarning(
      "preload",
      latestProps,
      latestImplicit
    );

    if (latestProps.as !== originalProps.as) {
      error(
        'A %s is using the same href "%s" as a %s. This is always an error and React will only keep the first preload' +
          " for any given href, discarding subsequent instances. To fix, find where you are using this href in link" +
          " tags or in calls to ReactDOM.preload() or ReactDOM.preinit() and either make the Resource types agree or" +
          " update the hrefs to be distinct for different Resource types.",
        latestWarningName,
        href,
        originalWarningName
      );
    } else {
      var missingProps = null;
      var extraProps = null;
      var differentProps = null;

      if (originalProps.media != null && latestProps.media == null) {
        missingProps = missingProps || {};
        missingProps.media = originalProps.media;
      }

      for (var propName in latestProps) {
        var propValue = latestProps[propName];
        var originalValue = originalProps[propName];

        if (propValue != null && propValue !== originalValue) {
          if (originalValue == null) {
            extraProps = extraProps || {};
            extraProps[propName] = propValue;
          } else {
            differentProps = differentProps || {};
            differentProps[propName] = {
              original: originalValue,
              latest: propValue
            };
          }
        }
      }

      if (missingProps || extraProps || differentProps) {
        warnDifferentProps(
          href,
          "href",
          originalWarningName,
          latestWarningName,
          extraProps,
          missingProps,
          differentProps
        );
      }
    }
  }
}
function validateStyleResourceDifference(originalProps, latestProps) {
  {
    var href = originalProps.href; // eslint-disable-next-line no-labels

    var originalWarningName = getResourceNameForWarning(
      "style",
      originalProps,
      false
    );
    var latestWarningName = getResourceNameForWarning(
      "style",
      latestProps,
      false
    );
    var missingProps = null;
    var extraProps = null;
    var differentProps = null;

    if (originalProps.media != null && latestProps.media == null) {
      missingProps = missingProps || {};
      missingProps.media = originalProps.media;
    }

    for (var propName in latestProps) {
      var propValue = latestProps[propName];
      var originalValue = originalProps[propName];

      if (propValue != null && propValue !== originalValue) {
        propName = propName === "data-precedence" ? "precedence" : propName;

        if (originalValue == null) {
          extraProps = extraProps || {};
          extraProps[propName] = propValue;
        } else {
          differentProps = differentProps || {};
          differentProps[propName] = {
            original: originalValue,
            latest: propValue
          };
        }
      }
    }

    if (missingProps || extraProps || differentProps) {
      warnDifferentProps(
        href,
        "href",
        originalWarningName,
        latestWarningName,
        extraProps,
        missingProps,
        differentProps
      );
    }
  }
}
function validateScriptResourceDifference(originalProps, latestProps) {
  {
    var src = originalProps.src; // eslint-disable-next-line no-labels

    var originalWarningName = getResourceNameForWarning(
      "script",
      originalProps,
      false
    );
    var latestWarningName = getResourceNameForWarning(
      "script",
      latestProps,
      false
    );
    var extraProps = null;
    var differentProps = null;

    for (var propName in latestProps) {
      var propValue = latestProps[propName];
      var originalValue = originalProps[propName];

      if (propValue != null && propValue !== originalValue) {
        if (originalValue == null) {
          extraProps = extraProps || {};
          extraProps[propName] = propValue;
        } else {
          differentProps = differentProps || {};
          differentProps[propName] = {
            original: originalValue,
            latest: propValue
          };
        }
      }
    }

    if (extraProps || differentProps) {
      warnDifferentProps(
        src,
        "src",
        originalWarningName,
        latestWarningName,
        extraProps,
        null,
        differentProps
      );
    }
  }
}
function validateStyleAndHintProps(preloadProps, styleProps, implicitPreload) {
  {
    var href = preloadProps.href;
    var originalWarningName = getResourceNameForWarning(
      "preload",
      preloadProps,
      implicitPreload
    );
    var latestWarningName = getResourceNameForWarning(
      "style",
      styleProps,
      false
    );

    if (preloadProps.as !== "style") {
      error(
        'While creating a %s for href "%s" a %s for this same href was found. When preloading a stylesheet the' +
          ' "as" prop must be of type "style". This most likely ocurred by rendering a preload link with an incorrect' +
          ' "as" prop or by calling ReactDOM.preload with an incorrect "as" option.',
        latestWarningName,
        href,
        originalWarningName
      );
    }

    var missingProps = null;
    var extraProps = null;
    var differentProps = null;

    for (var propName in styleProps) {
      var styleValue = styleProps[propName];
      var preloadValue = preloadProps[propName];

      switch (propName) {
        // Check for difference on specific props that cross over or influence
        // the relationship between the preload and stylesheet
        case "crossOrigin":
        case "referrerPolicy":
        case "media":
        case "title": {
          if (
            preloadValue !== styleValue &&
            !(preloadValue == null && styleValue == null)
          ) {
            if (styleValue == null) {
              missingProps = missingProps || {};
              missingProps[propName] = preloadValue;
            } else if (preloadValue == null) {
              extraProps = extraProps || {};
              extraProps[propName] = styleValue;
            } else {
              differentProps = differentProps || {};
              differentProps[propName] = {
                original: preloadValue,
                latest: styleValue
              };
            }
          }
        }
      }
    }

    if (missingProps || extraProps || differentProps) {
      warnDifferentProps(
        href,
        "href",
        originalWarningName,
        latestWarningName,
        extraProps,
        missingProps,
        differentProps
      );
    }
  }
}
function validateScriptAndHintProps(
  preloadProps,
  scriptProps,
  implicitPreload
) {
  {
    var href = preloadProps.href;
    var originalWarningName = getResourceNameForWarning(
      "preload",
      preloadProps,
      implicitPreload
    );
    var latestWarningName = getResourceNameForWarning(
      "script",
      scriptProps,
      false
    );

    if (preloadProps.as !== "script") {
      error(
        'While creating a %s for href "%s" a %s for this same url was found. When preloading a script the' +
          ' "as" prop must be of type "script". This most likely ocurred by rendering a preload link with an incorrect' +
          ' "as" prop or by calling ReactDOM.preload with an incorrect "as" option.',
        latestWarningName,
        href,
        originalWarningName
      );
    }

    var missingProps = null;
    var extraProps = null;
    var differentProps = null;

    for (var propName in scriptProps) {
      var scriptValue = scriptProps[propName];
      var preloadValue = preloadProps[propName];

      switch (propName) {
        // Check for difference on specific props that cross over or influence
        // the relationship between the preload and stylesheet
        case "crossOrigin":
        case "referrerPolicy":
        case "integrity": {
          if (
            preloadValue !== scriptValue &&
            !(preloadValue == null && scriptValue == null)
          ) {
            if (scriptValue == null) {
              missingProps = missingProps || {};
              missingProps[propName] = preloadValue;
            } else if (preloadValue == null) {
              extraProps = extraProps || {};
              extraProps[propName] = scriptValue;
            } else {
              differentProps = differentProps || {};
              differentProps[propName] = {
                original: preloadValue,
                latest: scriptValue
              };
            }
          }
        }
      }
    }

    if (missingProps || extraProps || differentProps) {
      warnDifferentProps(
        href,
        "href",
        originalWarningName,
        latestWarningName,
        extraProps,
        missingProps,
        differentProps
      );
    }
  }
}

function warnDifferentProps(
  url,
  urlPropKey,
  originalName,
  latestName,
  extraProps,
  missingProps,
  differentProps
) {
  {
    var juxtaposedNameStatement =
      latestName === originalName
        ? "an earlier instance of this Resource"
        : "a " + originalName + " with the same " + urlPropKey;
    var comparisonStatement = "";

    if (missingProps !== null && typeof missingProps === "object") {
      for (var propName in missingProps) {
        comparisonStatement +=
          "\n  " +
          propName +
          ': missing or null in latest props, "' +
          missingProps[propName] +
          '" in original props';
      }
    }

    if (extraProps !== null && typeof extraProps === "object") {
      for (var _propName in extraProps) {
        comparisonStatement +=
          "\n  " +
          _propName +
          ': "' +
          extraProps[_propName] +
          '" in latest props, missing or null in original props';
      }
    }

    if (differentProps !== null && typeof differentProps === "object") {
      for (var _propName2 in differentProps) {
        comparisonStatement +=
          "\n  " +
          _propName2 +
          ': "' +
          differentProps[_propName2].latest +
          '" in latest props, "' +
          differentProps[_propName2].original +
          '" in original props';
      }
    }

    error(
      'A %s with %s "%s" has props that disagree with those found on %s. Resources always use the props' +
        " that were provided the first time they are encountered so any differences will be ignored. Please" +
        " update Resources that share an %s to have props that agree. The differences are described below.%s",
      latestName,
      urlPropKey,
      url,
      juxtaposedNameStatement,
      urlPropKey,
      comparisonStatement
    );
  }
}

function getResourceNameForWarning(type, props, implicit) {
  {
    switch (type) {
      case "style": {
        return "style Resource";
      }

      case "script": {
        return "script Resource";
      }

      case "preload": {
        if (implicit) {
          return "preload for a " + props.as + " Resource";
        }

        return 'preload Resource (as "' + props.as + '")';
      }
    }
  }

  return "Resource";
}
function validateLinkPropsForStyleResource(props) {
  {
    // This should only be called when we know we are opting into Resource semantics (i.e. precedence is not null)
    var href = props.href,
      onLoad = props.onLoad,
      onError = props.onError,
      disabled = props.disabled;
    var allProps = ["onLoad", "onError", "disabled"];
    var includedProps = [];
    if (onLoad) includedProps.push("onLoad");
    if (onError) includedProps.push("onError");
    if (disabled != null) includedProps.push("disabled");
    var allPropsUnionPhrase = propNamesListJoin(allProps, "or");
    var includedPropsPhrase = propNamesListJoin(includedProps, "and");
    includedPropsPhrase += includedProps.length === 1 ? " prop" : " props";

    if (includedProps.length) {
      error(
        'A link (rel="stylesheet") element with href "%s" has the precedence prop but also included the %s.' +
          " When using %s React will opt out of Resource behavior. If you meant for this" +
          " element to be treated as a Resource remove the %s. Otherwise remove the precedence prop.",
        href,
        includedPropsPhrase,
        allPropsUnionPhrase,
        includedPropsPhrase
      );

      return true;
    }
  }

  return false;
}

function propNamesListJoin(list, combinator) {
  switch (list.length) {
    case 0:
      return "";

    case 1:
      return list[0];

    case 2:
      return list[0] + " " + combinator + " " + list[1];

    default:
      return (
        list.slice(0, -1).join(", ") +
        ", " +
        combinator +
        " " +
        list[list.length - 1]
      );
  }
}

function validateLinkPropsForPreloadResource(linkProps) {
  {
    var href = linkProps.href,
      as = linkProps.as;

    if (as === "font") {
      var name = getResourceNameForWarning("preload", linkProps, false);

      if (!hasOwnProperty.call(linkProps, "crossOrigin")) {
        error(
          'A %s with href "%s" did not specify the crossOrigin prop. Font preloads must always use' +
            ' anonymouse CORS mode. To fix add an empty string, "anonymous", or any other string' +
            ' value except "use-credentials" for the crossOrigin prop of all font preloads.',
          name,
          href
        );
      } else if (linkProps.crossOrigin === "use-credentials") {
        error(
          'A %s with href "%s" specified a crossOrigin value of "use-credentials". Font preloads must always use' +
            ' anonymouse CORS mode. To fix use an empty string, "anonymous", or any other string' +
            ' value except "use-credentials" for the crossOrigin prop of all font preloads.',
          name,
          href
        );
      }
    }
  }
}
function validatePreloadArguments(href, options) {
  {
    if (!href || typeof href !== "string") {
      var typeOfArg = getValueDescriptorExpectingObjectForWarning(href);

      error(
        "ReactDOM.preload() expected the first argument to be a string representing an href but found %s instead.",
        typeOfArg
      );
    } else if (typeof options !== "object" || options === null) {
      var _typeOfArg = getValueDescriptorExpectingObjectForWarning(options);

      error(
        'ReactDOM.preload() expected the second argument to be an options argument containing at least an "as" property' +
          ' specifying the Resource type. It found %s instead. The href for the preload call where this warning originated is "%s".',
        _typeOfArg,
        href
      );
    } else {
      var as = options.as;

      switch (as) {
        // Font specific validation of options
        case "font": {
          if (options.crossOrigin === "use-credentials") {
            error(
              'ReactDOM.preload() was called with an "as" type of "font" and with a "crossOrigin" option of "use-credentials".' +
                ' Fonts preloading must use crossOrigin "anonymous" to be functional. Please update your font preload to omit' +
                ' the crossOrigin option or change it to any other value than "use-credentials" (Browsers default all other values' +
                ' to anonymous mode). The href for the preload call where this warning originated is "%s"',
              href
            );
          }

          break;
        }

        case "script":
        case "style": {
          break;
        }
        // We have an invalid as type and need to warn

        default: {
          var typeOfAs = getValueDescriptorExpectingEnumForWarning(as);

          error(
            'ReactDOM.preload() expected a valid "as" type in the options (second) argument but found %s instead.' +
              " Please use one of the following valid values instead: %s. The href for the preload call where this" +
              ' warning originated is "%s".',
            typeOfAs,
            '"style", "font", or "script"',
            href
          );
        }
      }
    }
  }
}
function validatePreinitArguments(href, options) {
  {
    if (!href || typeof href !== "string") {
      var typeOfArg = getValueDescriptorExpectingObjectForWarning(href);

      error(
        "ReactDOM.preinit() expected the first argument to be a string representing an href but found %s instead.",
        typeOfArg
      );
    } else if (typeof options !== "object" || options === null) {
      var _typeOfArg2 = getValueDescriptorExpectingObjectForWarning(options);

      error(
        'ReactDOM.preinit() expected the second argument to be an options argument containing at least an "as" property' +
          ' specifying the Resource type. It found %s instead. The href for the preload call where this warning originated is "%s".',
        _typeOfArg2,
        href
      );
    } else {
      var as = options.as;

      switch (as) {
        case "style":
        case "script": {
          break;
        }
        // We have an invalid as type and need to warn

        default: {
          var typeOfAs = getValueDescriptorExpectingEnumForWarning(as);

          error(
            'ReactDOM.preinit() expected the second argument to be an options argument containing at least an "as" property' +
              ' specifying the Resource type. It found %s instead. Currently, valid resource types for for preinit are "style"' +
              ' and "script". The href for the preinit call where this warning originated is "%s".',
            typeOfAs,
            href
          );
        }
      }
    }
  }
}

function getValueDescriptorExpectingObjectForWarning(thing) {
  return thing === null
    ? "null"
    : thing === undefined
    ? "undefined"
    : thing === ""
    ? "an empty string"
    : 'something with type "' + typeof thing + '"';
}

function getValueDescriptorExpectingEnumForWarning(thing) {
  return thing === null
    ? "null"
    : thing === undefined
    ? "undefined"
    : thing === ""
    ? "an empty string"
    : typeof thing === "string"
    ? JSON.stringify(thing)
    : 'something with type "' + typeof thing + '"';
}

function createResources() {
  return {
    // persistent
    preloadsMap: new Map(),
    stylesMap: new Map(),
    scriptsMap: new Map(),
    headsMap: new Map(),
    // cleared on flush
    charset: null,
    bases: new Set(),
    preconnects: new Set(),
    fontPreloads: new Set(),
    // usedImagePreloads: new Set(),
    precedences: new Map(),
    usedStylePreloads: new Set(),
    scripts: new Set(),
    usedScriptPreloads: new Set(),
    explicitStylePreloads: new Set(),
    // explicitImagePreloads: new Set(),
    explicitScriptPreloads: new Set(),
    headResources: new Set(),
    // cache for tracking structured meta tags
    structuredMetaKeys: new Map(),
    // like a module global for currently rendering boundary
    boundaryResources: null
  };
}
function createBoundaryResources() {
  return new Set();
}
var currentResources = null;
var currentResourcesStack = [];
function prepareToRenderResources(resources) {
  currentResourcesStack.push(currentResources);
  currentResources = resources;
}
function finishRenderingResources() {
  currentResources = currentResourcesStack.pop();
}
function setCurrentlyRenderingBoundaryResourcesTarget(
  resources,
  boundaryResources
) {
  resources.boundaryResources = boundaryResources;
}
var ReactDOMServerFloatDispatcher = {
  preload: preload,
  preinit: preinit
};

function preload(href, options) {
  if (!currentResources) {
    // While we expect that preload calls are primarily going to be observed
    // during render because effects and events don't run on the server it is
    // still possible that these get called in module scope. This is valid on
    // the client since there is still a document to interact with but on the
    // server we need a request to associate the call to. Because of this we
    // simply return and do not warn.
    return;
  }

  var resources = currentResources;

  {
    validatePreloadArguments(href, options);
  }

  if (
    typeof href === "string" &&
    href &&
    typeof options === "object" &&
    options !== null
  ) {
    var as = options.as;
    var resource = resources.preloadsMap.get(href);

    if (resource) {
      {
        var originallyImplicit = resource._dev_implicit_construction === true;
        var latestProps = preloadPropsFromPreloadOptions(href, as, options);
        validatePreloadResourceDifference(
          resource.props,
          originallyImplicit,
          latestProps,
          false
        );
      }
    } else {
      resource = createPreloadResource(
        resources,
        href,
        as,
        preloadPropsFromPreloadOptions(href, as, options)
      );
    }

    switch (as) {
      case "font": {
        resources.fontPreloads.add(resource);
        break;
      }

      case "style": {
        resources.explicitStylePreloads.add(resource);
        break;
      }

      case "script": {
        resources.explicitScriptPreloads.add(resource);
        break;
      }
    }
  }
}

function preinit(href, options) {
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
} // On the server, preinit may be called outside of render when sending an
// external SSR runtime as part of the initial resources payload. Since this
// is an internal React call, we do not need to use the resources stack.

function preinitImpl(resources, href, options) {
  {
    validatePreinitArguments(href, options);
  }

  if (
    typeof href === "string" &&
    href &&
    typeof options === "object" &&
    options !== null
  ) {
    var as = options.as;

    switch (as) {
      case "style": {
        var resource = resources.stylesMap.get(href);

        if (resource) {
          {
            var latestProps = stylePropsFromPreinitOptions(
              href,
              resource.precedence,
              options
            );
            validateStyleResourceDifference(resource.props, latestProps);
          }
        } else {
          var precedence = options.precedence || "default";
          var resourceProps = stylePropsFromPreinitOptions(
            href,
            precedence,
            options
          );
          resource = createStyleResource(
            resources,
            href,
            precedence,
            resourceProps
          );
        }

        resource.set.add(resource);
        resources.explicitStylePreloads.add(resource.hint);
        return;
      }

      case "script": {
        var src = href;

        var _resource = resources.scriptsMap.get(src);

        if (_resource) {
          {
            var _latestProps = scriptPropsFromPreinitOptions(src, options);

            validateScriptResourceDifference(_resource.props, _latestProps);
          }
        } else {
          var scriptProps = scriptPropsFromPreinitOptions(src, options);
          _resource = createScriptResource(resources, src, scriptProps);
          resources.scripts.add(_resource);
        }

        return;
      }
    }
  }
}

function preloadPropsFromPreloadOptions(href, as, options) {
  return {
    href: href,
    rel: "preload",
    as: as,
    crossOrigin: as === "font" ? "" : options.crossOrigin,
    integrity: options.integrity
  };
}

function preloadPropsFromRawProps(href, as, rawProps) {
  var props = assign({}, rawProps);

  props.href = href;
  props.rel = "preload";
  props.as = as;

  if (as === "font") {
    // Font preloads always need CORS anonymous mode so we set it here
    // regardless of the props provided. This should warn elsewhere in
    // dev
    props.crossOrigin = "";
  }

  return props;
}

function preloadAsStylePropsFromProps(href, props) {
  return {
    rel: "preload",
    as: "style",
    href: href,
    crossOrigin: props.crossOrigin,
    integrity: props.integrity,
    media: props.media,
    hrefLang: props.hrefLang,
    referrerPolicy: props.referrerPolicy
  };
}

function preloadAsScriptPropsFromProps(href, props) {
  return {
    rel: "preload",
    as: "script",
    href: href,
    crossOrigin: props.crossOrigin,
    integrity: props.integrity,
    referrerPolicy: props.referrerPolicy
  };
}

function createPreloadResource(resources, href, as, props) {
  var preloadsMap = resources.preloadsMap;

  {
    if (preloadsMap.has(href)) {
      error(
        "createPreloadResource was called when a preload Resource matching the same href already exists. This is a bug in React."
      );
    }
  }

  var resource = {
    type: "preload",
    as: as,
    href: href,
    flushed: false,
    props: props
  };
  preloadsMap.set(href, resource);
  return resource;
}

function stylePropsFromRawProps(href, precedence, rawProps) {
  var props = assign({}, rawProps);

  props.href = href;
  props.rel = "stylesheet";
  props["data-precedence"] = precedence;
  delete props.precedence;
  return props;
}

function stylePropsFromPreinitOptions(href, precedence, options) {
  return {
    rel: "stylesheet",
    href: href,
    "data-precedence": precedence,
    crossOrigin: options.crossOrigin
  };
}

function createStyleResource(resources, href, precedence, props) {
  {
    if (resources.stylesMap.has(href)) {
      error(
        "createStyleResource was called when a style Resource matching the same href already exists. This is a bug in React."
      );
    }
  }

  var stylesMap = resources.stylesMap,
    preloadsMap = resources.preloadsMap,
    precedences = resources.precedences; // If this is the first time we've seen this precedence we encode it's position in our set even though
  // we don't add the resource to this set yet

  var precedenceSet = precedences.get(precedence);

  if (!precedenceSet) {
    precedenceSet = new Set();
    precedences.set(precedence, precedenceSet);
  }

  var hint = preloadsMap.get(href);

  if (hint) {
    // If a preload for this style Resource already exists there are certain props we want to adopt
    // on the style Resource, primarily focussed on making sure the style network pathways utilize
    // the preload pathways. For instance if you have diffreent crossOrigin attributes for a preload
    // and a stylesheet the stylesheet will make a new request even if the preload had already loaded
    adoptPreloadPropsForStyleProps(props, hint.props);

    {
      validateStyleAndHintProps(
        hint.props,
        props,
        hint._dev_implicit_construction
      );
    }
  } else {
    var preloadResourceProps = preloadAsStylePropsFromProps(href, props);
    hint = createPreloadResource(
      resources,
      href,
      "style",
      preloadResourceProps
    );

    {
      hint._dev_implicit_construction = true;
    }

    resources.explicitStylePreloads.add(hint);
  }

  var resource = {
    type: "style",
    href: href,
    precedence: precedence,
    flushed: false,
    inShell: false,
    props: props,
    hint: hint,
    set: precedenceSet
  };
  stylesMap.set(href, resource);
  return resource;
}

function adoptPreloadPropsForStyleProps(resourceProps, preloadProps) {
  if (resourceProps.crossOrigin == null)
    resourceProps.crossOrigin = preloadProps.crossOrigin;
  if (resourceProps.referrerPolicy == null)
    resourceProps.referrerPolicy = preloadProps.referrerPolicy;
  if (resourceProps.title == null) resourceProps.title = preloadProps.title;
}

function scriptPropsFromPreinitOptions(src, options) {
  return {
    src: src,
    async: true,
    crossOrigin: options.crossOrigin,
    integrity: options.integrity
  };
}

function scriptPropsFromRawProps(src, rawProps) {
  var props = assign({}, rawProps);

  props.src = src;
  return props;
}

function createScriptResource(resources, src, props) {
  {
    if (resources.scriptsMap.has(src)) {
      error(
        "createScriptResource was called when a script Resource matching the same src already exists. This is a bug in React."
      );
    }
  }

  var scriptsMap = resources.scriptsMap,
    preloadsMap = resources.preloadsMap;
  var hint = preloadsMap.get(src);

  if (hint) {
    // If a preload for this style Resource already exists there are certain props we want to adopt
    // on the style Resource, primarily focussed on making sure the style network pathways utilize
    // the preload pathways. For instance if you have diffreent crossOrigin attributes for a preload
    // and a stylesheet the stylesheet will make a new request even if the preload had already loaded
    adoptPreloadPropsForScriptProps(props, hint.props);

    {
      validateScriptAndHintProps(
        hint.props,
        props,
        hint._dev_implicit_construction
      );
    }
  } else {
    var preloadResourceProps = preloadAsScriptPropsFromProps(src, props);
    hint = createPreloadResource(
      resources,
      src,
      "script",
      preloadResourceProps
    );

    {
      hint._dev_implicit_construction = true;
    }

    resources.explicitScriptPreloads.add(hint);
  }

  var resource = {
    type: "script",
    src: src,
    flushed: false,
    props: props,
    hint: hint
  };
  scriptsMap.set(src, resource);
  return resource;
}

function adoptPreloadPropsForScriptProps(resourceProps, preloadProps) {
  if (resourceProps.crossOrigin == null)
    resourceProps.crossOrigin = preloadProps.crossOrigin;
  if (resourceProps.referrerPolicy == null)
    resourceProps.referrerPolicy = preloadProps.referrerPolicy;
  if (resourceProps.integrity == null)
    resourceProps.integrity = preloadProps.integrity;
}

function titlePropsFromRawProps(child, rawProps) {
  var props = assign({}, rawProps);

  props.children = child;
  return props;
}

function resourcesFromElement(type, props) {
  if (!currentResources) {
    throw new Error(
      '"currentResources" was expected to exist. This is a bug in React.'
    );
  }

  var resources = currentResources;

  switch (type) {
    case "title": {
      var children = props.children;
      var child;

      if (Array.isArray(children)) {
        child = children.length === 1 ? children[0] : null;
      } else {
        child = children;
      }

      if (
        typeof child !== "function" &&
        typeof child !== "symbol" &&
        child !== null &&
        child !== undefined
      ) {
        // eslint-disable-next-line react-internal/safe-string-coercion
        var childString = "" + child;
        var key = "title::" + childString;
        var resource = resources.headsMap.get(key);

        if (!resource) {
          resource = {
            type: "title",
            props: titlePropsFromRawProps(childString, props),
            flushed: false
          };
          resources.headsMap.set(key, resource);
          resources.headResources.add(resource);
        }
      }

      return true;
    }

    case "meta": {
      var _key, propertyPath;

      if (typeof props.charSet === "string") {
        _key = "charSet";
      } else if (typeof props.content === "string") {
        var contentKey = "::" + props.content;

        if (typeof props.httpEquiv === "string") {
          _key = "httpEquiv::" + props.httpEquiv + contentKey;
        } else if (typeof props.name === "string") {
          _key = "name::" + props.name + contentKey;
        } else if (typeof props.itemProp === "string") {
          _key = "itemProp::" + props.itemProp + contentKey;
        } else if (typeof props.property === "string") {
          var property = props.property;
          _key = "property::" + property + contentKey;
          propertyPath = property;
          var parentPath = property
            .split(":")
            .slice(0, -1)
            .join(":");
          var parentResource = resources.structuredMetaKeys.get(parentPath);

          if (parentResource) {
            _key = parentResource.key + "::child::" + _key;
          }
        }
      }

      if (_key) {
        if (!resources.headsMap.has(_key)) {
          var _resource2 = {
            type: "meta",
            key: _key,
            props: assign({}, props),
            flushed: false
          };
          resources.headsMap.set(_key, _resource2);

          if (_key === "charSet") {
            resources.charset = _resource2;
          } else {
            if (propertyPath) {
              resources.structuredMetaKeys.set(propertyPath, _resource2);
            }

            resources.headResources.add(_resource2);
          }
        }
      }

      return true;
    }

    case "base": {
      var target = props.target,
        href = props.href; // We mirror the key construction on the client since we will likely unify
      // this code in the future to better guarantee key semantics are identical
      // in both environments

      var _key2 = "base";
      _key2 +=
        typeof href === "string" ? '[href="' + href + '"]' : ":not([href])";
      _key2 +=
        typeof target === "string"
          ? '[target="' + target + '"]'
          : ":not([target])";

      if (!resources.headsMap.has(_key2)) {
        var _resource3 = {
          type: "base",
          props: assign({}, props),
          flushed: false
        };
        resources.headsMap.set(_key2, _resource3);
        resources.bases.add(_resource3);
      }

      return true;
    }
  }

  return false;
} // Construct a resource from link props.

function resourcesFromLink(props) {
  if (!currentResources) {
    throw new Error(
      '"currentResources" was expected to exist. This is a bug in React.'
    );
  }

  var resources = currentResources;
  var rel = props.rel,
    href = props.href;

  if (!href || typeof href !== "string" || !rel || typeof rel !== "string") {
    return false;
  }

  var key = "";

  switch (rel) {
    case "stylesheet": {
      var onLoad = props.onLoad,
        onError = props.onError,
        precedence = props.precedence,
        disabled = props.disabled;

      if (
        typeof precedence !== "string" ||
        onLoad ||
        onError ||
        disabled != null
      ) {
        // This stylesheet is either not opted into Resource semantics or has conflicting properties which
        // disqualify it for such. We can still create a preload resource to help it load faster on the
        // client
        {
          validateLinkPropsForStyleResource(props);
        }

        var preloadResource = resources.preloadsMap.get(href);

        if (!preloadResource) {
          preloadResource = createPreloadResource(
            resources,
            href,
            "style",
            preloadAsStylePropsFromProps(href, props)
          );

          {
            preloadResource._dev_implicit_construction = true;
          }

          resources.usedStylePreloads.add(preloadResource);
        }

        return false;
      } else {
        // We are able to convert this link element to a resource exclusively. We construct the relevant Resource
        // and return true indicating that this link was fully consumed.
        var _resource4 = resources.stylesMap.get(href);

        if (_resource4) {
          {
            var resourceProps = stylePropsFromRawProps(href, precedence, props);
            adoptPreloadPropsForStyleProps(
              resourceProps,
              _resource4.hint.props
            );
            validateStyleResourceDifference(_resource4.props, resourceProps);
          }
        } else {
          var _resourceProps = stylePropsFromRawProps(href, precedence, props);

          _resource4 = createStyleResource(
            // $FlowFixMe[incompatible-call] found when upgrading Flow
            currentResources,
            href,
            precedence,
            _resourceProps
          );
          resources.usedStylePreloads.add(_resource4.hint);
        }

        if (resources.boundaryResources) {
          resources.boundaryResources.add(_resource4);
        } else {
          _resource4.set.add(_resource4);
        }

        return true;
      }
    }

    case "preload": {
      var as = props.as;

      switch (as) {
        case "script":
        case "style":
        case "font": {
          {
            validateLinkPropsForPreloadResource(props);
          }

          var _resource5 = resources.preloadsMap.get(href);

          if (_resource5) {
            {
              var originallyImplicit =
                _resource5._dev_implicit_construction === true;
              var latestProps = preloadPropsFromRawProps(href, as, props);
              validatePreloadResourceDifference(
                _resource5.props,
                originallyImplicit,
                latestProps,
                false
              );
            }
          } else {
            _resource5 = createPreloadResource(
              resources,
              href,
              as,
              preloadPropsFromRawProps(href, as, props)
            );

            switch (as) {
              case "script": {
                resources.explicitScriptPreloads.add(_resource5);
                break;
              }

              case "style": {
                resources.explicitStylePreloads.add(_resource5);
                break;
              }

              case "font": {
                resources.fontPreloads.add(_resource5);
                break;
              }
            }
          }

          return true;
        }
      }

      break;
    }
  }

  if (props.onLoad || props.onError) {
    // When a link has these props we can't treat it is a Resource but if we rendered it on the
    // server it would look like a Resource in the rendered html (the onLoad/onError aren't emitted)
    // Instead we expect the client to insert them rather than hydrate them which also guarantees
    // that the onLoad and onError won't fire before the event handlers are attached
    return true;
  }

  var sizes = typeof props.sizes === "string" ? props.sizes : "";
  var media = typeof props.media === "string" ? props.media : "";
  key =
    "rel:" + rel + "::href:" + href + "::sizes:" + sizes + "::media:" + media;
  var resource = resources.headsMap.get(key);

  if (!resource) {
    resource = {
      type: "link",
      props: assign({}, props),
      flushed: false
    };
    resources.headsMap.set(key, resource);

    switch (rel) {
      case "preconnect":
      case "dns-prefetch": {
        resources.preconnects.add(resource);
        break;
      }

      default: {
        resources.headResources.add(resource);
      }
    }
  }

  return true;
} // Construct a resource from link props.

function resourcesFromScript(props) {
  if (!currentResources) {
    throw new Error(
      '"currentResources" was expected to exist. This is a bug in React.'
    );
  }

  var resources = currentResources;
  var src = props.src,
    async = props.async,
    onLoad = props.onLoad,
    onError = props.onError;

  if (!src || typeof src !== "string") {
    return false;
  }

  if (async) {
    if (onLoad || onError) {
      var preloadResource = resources.preloadsMap.get(src);

      if (!preloadResource) {
        preloadResource = createPreloadResource(
          resources,
          src,
          "script",
          preloadAsScriptPropsFromProps(src, props)
        );

        {
          preloadResource._dev_implicit_construction = true;
        }

        resources.usedScriptPreloads.add(preloadResource);
      }
    } else {
      var resource = resources.scriptsMap.get(src);

      if (resource) {
        {
          var latestProps = scriptPropsFromRawProps(src, props);
          adoptPreloadPropsForScriptProps(latestProps, resource.hint.props);
          validateScriptResourceDifference(resource.props, latestProps);
        }
      } else {
        var resourceProps = scriptPropsFromRawProps(src, props);
        resource = createScriptResource(resources, src, resourceProps);
        resources.scripts.add(resource);
      }
    }

    return true;
  }

  return false;
}
function hoistResources(resources, source) {
  var currentBoundaryResources = resources.boundaryResources;

  if (currentBoundaryResources) {
    source.forEach(function(resource) {
      return currentBoundaryResources.add(resource);
    });
    source.clear();
  }
}
function hoistResourcesToRoot(resources, boundaryResources) {
  boundaryResources.forEach(function(resource) {
    return resource.set.add(resource);
  });
  boundaryResources.clear();
}

// The build script is at scripts/rollup/generate-inline-fizz-runtime.js.
// Run `yarn generate-inline-fizz-runtime` to generate.
var clientRenderBoundary =
  '$RX=function(b,c,d,e){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data="$!",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),b._reactRetry&&b._reactRetry())};';
var completeBoundary =
  '$RC=function(b,c,e){c=document.getElementById(c);c.parentNode.removeChild(c);var a=document.getElementById(b);if(a){b=a.previousSibling;if(e)b.data="$!",a.setAttribute("data-dgst",e);else{e=b.parentNode;a=b.nextSibling;var f=0;do{if(a&&8===a.nodeType){var d=a.data;if("/$"===d)if(0===f)break;else f--;else"$"!==d&&"$?"!==d&&"$!"!==d||f++}d=a.nextSibling;e.removeChild(a);a=d}while(a);for(;c.firstChild;)e.insertBefore(c.firstChild,a);b.data="$"}b._reactRetry&&b._reactRetry()}};';
var completeBoundaryWithStyles =
  '$RM=new Map;\n$RR=function(p,q,v){function r(l){this.s=l}for(var t=$RC,u=$RM,m=new Map,n=document,g,e,f=n.querySelectorAll("link[data-precedence],style[data-precedence]"),d=0;e=f[d++];)m.set(e.dataset.precedence,g=e);e=0;f=[];for(var c,h,b,a;c=v[e++];){var k=0;h=c[k++];if(b=u.get(h))"l"!==b.s&&f.push(b);else{a=n.createElement("link");a.href=h;a.rel="stylesheet";for(a.dataset.precedence=d=c[k++];b=c[k++];)a.setAttribute(b,c[k++]);b=a._p=new Promise(function(l,w){a.onload=l;a.onerror=w});b.then(r.bind(b,\n"l"),r.bind(b,"e"));u.set(h,b);f.push(b);c=m.get(d)||g;c===g&&(g=a);m.set(d,a);c?c.parentNode.insertBefore(a,c.nextSibling):(d=n.head,d.insertBefore(a,d.firstChild))}}Promise.all(f).then(t.bind(null,p,q,""),t.bind(null,p,q,"Resource failed to load"))};';
var completeSegment =
  "$RS=function(a,b){a=document.getElementById(a);b=document.getElementById(b);for(a.parentNode.removeChild(a);a.firstChild;)b.parentNode.insertBefore(a.firstChild,b);b.parentNode.removeChild(b)};";

var ReactDOMSharedInternals =
  ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

var ReactDOMCurrentDispatcher = ReactDOMSharedInternals.Dispatcher;
var ReactDOMServerDispatcher = ReactDOMServerFloatDispatcher;
function prepareToRender(resources) {
  prepareToRenderResources(resources);
  var previousHostDispatcher = ReactDOMCurrentDispatcher.current;
  ReactDOMCurrentDispatcher.current = ReactDOMServerDispatcher;
  return previousHostDispatcher;
}
function cleanupAfterRender(previousDispatcher) {
  finishRenderingResources();
  ReactDOMCurrentDispatcher.current = previousDispatcher;
} // Used to distinguish these contexts from ones used in other renderers.
var ScriptStreamingFormat = 0;
var DataStreamingFormat = 1; // Per response, global state that is not contextual to the rendering subtree.

var dataElementQuotedEnd = stringToPrecomputedChunk('"></template>');
var startInlineScript = stringToPrecomputedChunk("<script>");
var endInlineScript = stringToPrecomputedChunk("</script>");
var startScriptSrc = stringToPrecomputedChunk('<script src="');
var startModuleSrc = stringToPrecomputedChunk('<script type="module" src="');
var scriptIntegirty = stringToPrecomputedChunk('" integrity="');
var endAsyncScript = stringToPrecomputedChunk('" async=""></script>');
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

function escapeBootstrapScriptContent(scriptText) {
  {
    checkHtmlStringCoercion(scriptText);
  }

  return ("" + scriptText).replace(scriptRegex, scriptReplacer);
}

var scriptRegex = /(<\/|<)(s)(cript)/gi;

var scriptReplacer = function(match, prefix, s, suffix) {
  return "" + prefix + (s === "s" ? "\\u0073" : "\\u0053") + suffix;
}; // Allows us to keep track of what we've already written so we can refer back to it.
// if passed externalRuntimeConfig and the enableFizzExternalRuntime feature flag
// is set, the server will send instructions via data attributes (instead of inline scripts)

function createResponseState(
  identifierPrefix,
  nonce,
  bootstrapScriptContent,
  bootstrapScripts,
  bootstrapModules,
  externalRuntimeConfig
) {
  var idPrefix = identifierPrefix === undefined ? "" : identifierPrefix;
  var inlineScriptWithNonce =
    nonce === undefined
      ? startInlineScript
      : stringToPrecomputedChunk(
          '<script nonce="' + escapeTextForBrowser(nonce) + '">'
        );
  var bootstrapChunks = [];
  var externalRuntimeDesc = null;
  var streamingFormat = ScriptStreamingFormat;

  if (bootstrapScriptContent !== undefined) {
    bootstrapChunks.push(
      inlineScriptWithNonce,
      stringToChunk(escapeBootstrapScriptContent(bootstrapScriptContent)),
      endInlineScript
    );
  }

  {
    if (externalRuntimeConfig !== undefined) {
      streamingFormat = DataStreamingFormat;

      if (typeof externalRuntimeConfig === "string") {
        externalRuntimeDesc = {
          src: externalRuntimeConfig,
          integrity: undefined
        };
      } else {
        externalRuntimeDesc = externalRuntimeConfig;
      }
    }
  }

  if (bootstrapScripts !== undefined) {
    for (var i = 0; i < bootstrapScripts.length; i++) {
      var scriptConfig = bootstrapScripts[i];
      var src =
        typeof scriptConfig === "string" ? scriptConfig : scriptConfig.src;
      var integrity =
        typeof scriptConfig === "string" ? undefined : scriptConfig.integrity;
      bootstrapChunks.push(
        startScriptSrc,
        stringToChunk(escapeTextForBrowser(src))
      );

      if (integrity) {
        bootstrapChunks.push(
          scriptIntegirty,
          stringToChunk(escapeTextForBrowser(integrity))
        );
      }

      bootstrapChunks.push(endAsyncScript);
    }
  }

  if (bootstrapModules !== undefined) {
    for (var _i = 0; _i < bootstrapModules.length; _i++) {
      var _scriptConfig = bootstrapModules[_i];

      var _src =
        typeof _scriptConfig === "string" ? _scriptConfig : _scriptConfig.src;

      var _integrity =
        typeof _scriptConfig === "string" ? undefined : _scriptConfig.integrity;

      bootstrapChunks.push(
        startModuleSrc,
        stringToChunk(escapeTextForBrowser(_src))
      );

      if (_integrity) {
        bootstrapChunks.push(
          scriptIntegirty,
          stringToChunk(escapeTextForBrowser(_integrity))
        );
      }

      bootstrapChunks.push(endAsyncScript);
    }
  }

  return {
    bootstrapChunks: bootstrapChunks,
    placeholderPrefix: stringToPrecomputedChunk(idPrefix + "P:"),
    segmentPrefix: stringToPrecomputedChunk(idPrefix + "S:"),
    boundaryPrefix: idPrefix + "B:",
    idPrefix: idPrefix,
    nextSuspenseID: 0,
    streamingFormat: streamingFormat,
    startInlineScript: inlineScriptWithNonce,
    sentCompleteSegmentFunction: false,
    sentCompleteBoundaryFunction: false,
    sentClientRenderFunction: false,
    sentStyleInsertionFunction: false,
    externalRuntimeConfig: externalRuntimeDesc
  };
} // Constants for the insertion mode we're currently writing in. We don't encode all HTML5 insertion
// modes. We only include the variants as they matter for the sake of our purposes.
// We don't actually provide the namespace therefore we use constants instead of the string.

var ROOT_HTML_MODE = 0; // Used for the root most element tag.

var HTML_MODE = 1;
var SVG_MODE = 2;
var MATHML_MODE = 3;
var HTML_TABLE_MODE = 4;
var HTML_TABLE_BODY_MODE = 5;
var HTML_TABLE_ROW_MODE = 6;
var HTML_COLGROUP_MODE = 7; // We have a greater than HTML_TABLE_MODE check elsewhere. If you add more cases here, make sure it
// still makes sense
// Lets us keep track of contextual state and pick it back up after suspending.

function createFormatContext(insertionMode, selectedValue, noscriptTagInScope) {
  return {
    insertionMode: insertionMode,
    selectedValue: selectedValue,
    noscriptTagInScope: noscriptTagInScope
  };
}
function getChildFormatContext(parentContext, type, props) {
  switch (type) {
    case "noscript":
      return createFormatContext(HTML_MODE, null, true);

    case "select":
      return createFormatContext(
        HTML_MODE,
        props.value != null ? props.value : props.defaultValue,
        parentContext.noscriptTagInScope
      );

    case "svg":
      return createFormatContext(
        SVG_MODE,
        null,
        parentContext.noscriptTagInScope
      );

    case "math":
      return createFormatContext(
        MATHML_MODE,
        null,
        parentContext.noscriptTagInScope
      );

    case "foreignObject":
      return createFormatContext(
        HTML_MODE,
        null,
        parentContext.noscriptTagInScope
      );
    // Table parents are special in that their children can only be created at all if they're
    // wrapped in a table parent. So we need to encode that we're entering this mode.

    case "table":
      return createFormatContext(
        HTML_TABLE_MODE,
        null,
        parentContext.noscriptTagInScope
      );

    case "thead":
    case "tbody":
    case "tfoot":
      return createFormatContext(
        HTML_TABLE_BODY_MODE,
        null,
        parentContext.noscriptTagInScope
      );

    case "colgroup":
      return createFormatContext(
        HTML_COLGROUP_MODE,
        null,
        parentContext.noscriptTagInScope
      );

    case "tr":
      return createFormatContext(
        HTML_TABLE_ROW_MODE,
        null,
        parentContext.noscriptTagInScope
      );
  }

  if (parentContext.insertionMode >= HTML_TABLE_MODE) {
    // Whatever tag this was, it wasn't a table parent or other special parent, so we must have
    // entered plain HTML again.
    return createFormatContext(
      HTML_MODE,
      null,
      parentContext.noscriptTagInScope
    );
  }

  if (parentContext.insertionMode === ROOT_HTML_MODE) {
    // We've emitted the root and is now in plain HTML mode.
    return createFormatContext(
      HTML_MODE,
      null,
      parentContext.noscriptTagInScope
    );
  }

  return parentContext;
}
var UNINITIALIZED_SUSPENSE_BOUNDARY_ID = null;
function assignSuspenseBoundaryID(responseState) {
  var generatedID = responseState.nextSuspenseID++;
  return stringToPrecomputedChunk(
    responseState.boundaryPrefix + generatedID.toString(16)
  );
}
function makeId(responseState, treeId, localId) {
  var idPrefix = responseState.idPrefix;
  var id = ":" + idPrefix + "R" + treeId; // Unless this is the first id at this level, append a number at the end
  // that represents the position of this useId hook among all the useId
  // hooks for this fiber.

  if (localId > 0) {
    id += "H" + localId.toString(32);
  }

  return id + ":";
}

function encodeHTMLTextNode(text) {
  return escapeTextForBrowser(text);
}

var textSeparator = stringToPrecomputedChunk("<!-- -->");
function pushTextInstance(target, text, responseState, textEmbedded) {
  if (text === "") {
    // Empty text doesn't have a DOM node representation and the hydration is aware of this.
    return textEmbedded;
  }

  if (textEmbedded) {
    target.push(textSeparator);
  }

  target.push(stringToChunk(encodeHTMLTextNode(text)));
  return true;
} // Called when Fizz is done with a Segment. Currently the only purpose is to conditionally
// emit a text separator when we don't know for sure it is safe to omit

function pushSegmentFinale(
  target,
  responseState,
  lastPushedText,
  textEmbedded
) {
  if (lastPushedText && textEmbedded) {
    target.push(textSeparator);
  }
}
var styleNameCache = new Map();

function processStyleName(styleName) {
  var chunk = styleNameCache.get(styleName);

  if (chunk !== undefined) {
    return chunk;
  }

  var result = stringToPrecomputedChunk(
    escapeTextForBrowser(hyphenateStyleName(styleName))
  );
  styleNameCache.set(styleName, result);
  return result;
}

var styleAttributeStart = stringToPrecomputedChunk(' style="');
var styleAssign = stringToPrecomputedChunk(":");
var styleSeparator = stringToPrecomputedChunk(";");

function pushStyle(target, responseState, style) {
  if (typeof style !== "object") {
    throw new Error(
      "The `style` prop expects a mapping from style properties to values, " +
        "not a string. For example, style={{marginRight: spacing + 'em'}} when " +
        "using JSX."
    );
  }

  var isFirst = true;

  for (var styleName in style) {
    if (!hasOwnProperty.call(style, styleName)) {
      continue;
    } // If you provide unsafe user data here they can inject arbitrary CSS
    // which may be problematic (I couldn't repro this):
    // https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
    // http://www.thespanner.co.uk/2007/11/26/ultimate-xss-css-injection/
    // This is not an XSS hole but instead a potential CSS injection issue
    // which has lead to a greater discussion about how we're going to
    // trust URLs moving forward. See #2115901

    var styleValue = style[styleName];

    if (
      styleValue == null ||
      typeof styleValue === "boolean" ||
      styleValue === ""
    ) {
      // TODO: We used to set empty string as a style with an empty value. Does that ever make sense?
      continue;
    }

    var nameChunk = void 0;
    var valueChunk = void 0;
    var isCustomProperty = styleName.indexOf("--") === 0;

    if (isCustomProperty) {
      nameChunk = stringToChunk(escapeTextForBrowser(styleName));

      {
        checkCSSPropertyStringCoercion(styleValue, styleName);
      }

      valueChunk = stringToChunk(
        escapeTextForBrowser(("" + styleValue).trim())
      );
    } else {
      {
        warnValidStyle$1(styleName, styleValue);
      }

      nameChunk = processStyleName(styleName);

      if (typeof styleValue === "number") {
        if (
          styleValue !== 0 &&
          !hasOwnProperty.call(isUnitlessNumber, styleName)
        ) {
          valueChunk = stringToChunk(styleValue + "px"); // Presumes implicit 'px' suffix for unitless numbers
        } else {
          valueChunk = stringToChunk("" + styleValue);
        }
      } else {
        {
          checkCSSPropertyStringCoercion(styleValue, styleName);
        }

        valueChunk = stringToChunk(
          escapeTextForBrowser(("" + styleValue).trim())
        );
      }
    }

    if (isFirst) {
      isFirst = false; // If it's first, we don't need any separators prefixed.

      target.push(styleAttributeStart, nameChunk, styleAssign, valueChunk);
    } else {
      target.push(styleSeparator, nameChunk, styleAssign, valueChunk);
    }
  }

  if (!isFirst) {
    target.push(attributeEnd);
  }
}

var attributeSeparator = stringToPrecomputedChunk(" ");
var attributeAssign = stringToPrecomputedChunk('="');
var attributeEnd = stringToPrecomputedChunk('"');
var attributeEmptyString = stringToPrecomputedChunk('=""');

function pushAttribute(target, responseState, name, value) {
  // not null or undefined
  switch (name) {
    case "style": {
      pushStyle(target, responseState, value);
      return;
    }

    case "defaultValue":
    case "defaultChecked": // These shouldn't be set as attributes on generic HTML elements.

    case "innerHTML": // Must use dangerouslySetInnerHTML instead.

    case "suppressContentEditableWarning":
    case "suppressHydrationWarning":
      // Ignored. These are built-in to React on the client.
      return;
  }

  if (
    // shouldIgnoreAttribute
    // We have already filtered out null/undefined and reserved words.
    name.length > 2 &&
    (name[0] === "o" || name[0] === "O") &&
    (name[1] === "n" || name[1] === "N")
  ) {
    return;
  }

  var propertyInfo = getPropertyInfo(name);

  if (propertyInfo !== null) {
    // shouldRemoveAttribute
    switch (typeof value) {
      case "function":
      case "symbol":
        // eslint-disable-line
        return;

      case "boolean": {
        if (!propertyInfo.acceptsBooleans) {
          return;
        }
      }
    }

    if (enableFilterEmptyStringAttributesDOM) {
      if (propertyInfo.removeEmptyString && value === "") {
        {
          if (name === "src") {
            error(
              'An empty string ("") was passed to the %s attribute. ' +
                "This may cause the browser to download the whole page again over the network. " +
                "To fix this, either do not render the element at all " +
                "or pass null to %s instead of an empty string.",
              name,
              name
            );
          } else {
            error(
              'An empty string ("") was passed to the %s attribute. ' +
                "To fix this, either do not render the element at all " +
                "or pass null to %s instead of an empty string.",
              name,
              name
            );
          }
        }

        return;
      }
    }

    var attributeName = propertyInfo.attributeName;
    var attributeNameChunk = stringToChunk(attributeName); // TODO: If it's known we can cache the chunk.

    switch (propertyInfo.type) {
      case BOOLEAN:
        if (value) {
          target.push(
            attributeSeparator,
            attributeNameChunk,
            attributeEmptyString
          );
        }

        return;

      case OVERLOADED_BOOLEAN:
        if (value === true) {
          target.push(
            attributeSeparator,
            attributeNameChunk,
            attributeEmptyString
          );
        } else if (value === false);
        else {
          target.push(
            attributeSeparator,
            attributeNameChunk,
            attributeAssign,
            stringToChunk(escapeTextForBrowser(value)),
            attributeEnd
          );
        }

        return;

      case NUMERIC:
        if (!isNaN(value)) {
          target.push(
            attributeSeparator,
            attributeNameChunk,
            attributeAssign,
            stringToChunk(escapeTextForBrowser(value)),
            attributeEnd
          );
        }

        break;

      case POSITIVE_NUMERIC:
        if (!isNaN(value) && value >= 1) {
          target.push(
            attributeSeparator,
            attributeNameChunk,
            attributeAssign,
            stringToChunk(escapeTextForBrowser(value)),
            attributeEnd
          );
        }

        break;

      default:
        if (propertyInfo.sanitizeURL) {
          {
            checkAttributeStringCoercion(value, attributeName);
          }

          value = "" + value;
          sanitizeURL(value);
        }

        target.push(
          attributeSeparator,
          attributeNameChunk,
          attributeAssign,
          stringToChunk(escapeTextForBrowser(value)),
          attributeEnd
        );
    }
  } else if (isAttributeNameSafe(name)) {
    // shouldRemoveAttribute
    switch (typeof value) {
      case "function":
      case "symbol":
        // eslint-disable-line
        return;

      case "boolean": {
        var prefix = name.toLowerCase().slice(0, 5);

        if (prefix !== "data-" && prefix !== "aria-") {
          return;
        }
      }
    }

    target.push(
      attributeSeparator,
      stringToChunk(name),
      attributeAssign,
      stringToChunk(escapeTextForBrowser(value)),
      attributeEnd
    );
  }
}

var endOfStartTag = stringToPrecomputedChunk(">");
var endOfStartTagSelfClosing = stringToPrecomputedChunk("/>");

function pushInnerHTML(target, innerHTML, children) {
  if (innerHTML != null) {
    if (children != null) {
      throw new Error(
        "Can only set one of `children` or `props.dangerouslySetInnerHTML`."
      );
    }

    if (typeof innerHTML !== "object" || !("__html" in innerHTML)) {
      throw new Error(
        "`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. " +
          "Please visit https://reactjs.org/link/dangerously-set-inner-html " +
          "for more information."
      );
    }

    var html = innerHTML.__html;

    if (html !== null && html !== undefined) {
      {
        checkHtmlStringCoercion(html);
      }

      target.push(stringToChunk("" + html));
    }
  }
} // TODO: Move these to ResponseState so that we warn for every request.
// It would help debugging in stateful servers (e.g. service worker).

var didWarnDefaultInputValue = false;
var didWarnDefaultChecked = false;
var didWarnDefaultSelectValue = false;
var didWarnDefaultTextareaValue = false;
var didWarnInvalidOptionChildren = false;
var didWarnInvalidOptionInnerHTML = false;
var didWarnSelectedSetOnOption = false;

function checkSelectProp(props, propName) {
  {
    var value = props[propName];

    if (value != null) {
      var array = isArray(value);

      if (props.multiple && !array) {
        error(
          "The `%s` prop supplied to <select> must be an array if " +
            "`multiple` is true.",
          propName
        );
      } else if (!props.multiple && array) {
        error(
          "The `%s` prop supplied to <select> must be a scalar " +
            "value if `multiple` is false.",
          propName
        );
      }
    }
  }
}

function pushStartSelect(target, props, responseState) {
  {
    checkControlledValueProps("select", props);
    checkSelectProp(props, "value");
    checkSelectProp(props, "defaultValue");

    if (
      props.value !== undefined &&
      props.defaultValue !== undefined &&
      !didWarnDefaultSelectValue
    ) {
      error(
        "Select elements must be either controlled or uncontrolled " +
          "(specify either the value prop, or the defaultValue prop, but not " +
          "both). Decide between using a controlled or uncontrolled select " +
          "element and remove one of these props. More info: " +
          "https://reactjs.org/link/controlled-components"
      );

      didWarnDefaultSelectValue = true;
    }
  }

  target.push(startChunkForTag("select"));
  var children = null;
  var innerHTML = null;

  for (var propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case "children":
          children = propValue;
          break;

        case "dangerouslySetInnerHTML":
          // TODO: This doesn't really make sense for select since it can't use the controlled
          // value in the innerHTML.
          innerHTML = propValue;
          break;

        case "defaultValue":
        case "value":
          // These are set on the Context instead and applied to the nested options.
          break;

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  target.push(endOfStartTag);
  pushInnerHTML(target, innerHTML, children);
  return children;
}

function flattenOptionChildren(children) {
  var content = ""; // Flatten children and warn if they aren't strings or numbers;
  // invalid types are ignored.

  React.Children.forEach(children, function(child) {
    if (child == null) {
      return;
    }

    content += child;

    {
      if (
        !didWarnInvalidOptionChildren &&
        typeof child !== "string" &&
        typeof child !== "number"
      ) {
        didWarnInvalidOptionChildren = true;

        error(
          "Cannot infer the option value of complex children. " +
            "Pass a `value` prop or use a plain string as children to <option>."
        );
      }
    }
  });
  return content;
}

var selectedMarkerAttribute = stringToPrecomputedChunk(' selected=""');

function pushStartOption(target, props, responseState, formatContext) {
  var selectedValue = formatContext.selectedValue;
  target.push(startChunkForTag("option"));
  var children = null;
  var value = null;
  var selected = null;
  var innerHTML = null;

  for (var propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case "children":
          children = propValue;
          break;

        case "selected":
          // ignore
          selected = propValue;

          {
            // TODO: Remove support for `selected` in <option>.
            if (!didWarnSelectedSetOnOption) {
              error(
                "Use the `defaultValue` or `value` props on <select> instead of " +
                  "setting `selected` on <option>."
              );

              didWarnSelectedSetOnOption = true;
            }
          }

          break;

        case "dangerouslySetInnerHTML":
          innerHTML = propValue;
          break;
        // eslint-disable-next-line-no-fallthrough

        case "value":
          value = propValue;
        // We intentionally fallthrough to also set the attribute on the node.
        // eslint-disable-next-line-no-fallthrough

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  if (selectedValue != null) {
    var stringValue;

    if (value !== null) {
      {
        checkAttributeStringCoercion(value, "value");
      }

      stringValue = "" + value;
    } else {
      {
        if (innerHTML !== null) {
          if (!didWarnInvalidOptionInnerHTML) {
            didWarnInvalidOptionInnerHTML = true;

            error(
              "Pass a `value` prop if you set dangerouslyInnerHTML so React knows " +
                "which value should be selected."
            );
          }
        }
      }

      stringValue = flattenOptionChildren(children);
    }

    if (isArray(selectedValue)) {
      // multiple
      for (var i = 0; i < selectedValue.length; i++) {
        {
          checkAttributeStringCoercion(selectedValue[i], "value");
        }

        var v = "" + selectedValue[i];

        if (v === stringValue) {
          target.push(selectedMarkerAttribute);
          break;
        }
      }
    } else {
      {
        checkAttributeStringCoercion(selectedValue, "select.value");
      }

      if ("" + selectedValue === stringValue) {
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

function pushInput(target, props, responseState) {
  {
    checkControlledValueProps("input", props);

    if (
      props.checked !== undefined &&
      props.defaultChecked !== undefined &&
      !didWarnDefaultChecked
    ) {
      error(
        "%s contains an input of type %s with both checked and defaultChecked props. " +
          "Input elements must be either controlled or uncontrolled " +
          "(specify either the checked prop, or the defaultChecked prop, but not " +
          "both). Decide between using a controlled or uncontrolled input " +
          "element and remove one of these props. More info: " +
          "https://reactjs.org/link/controlled-components",
        "A component",
        props.type
      );

      didWarnDefaultChecked = true;
    }

    if (
      props.value !== undefined &&
      props.defaultValue !== undefined &&
      !didWarnDefaultInputValue
    ) {
      error(
        "%s contains an input of type %s with both value and defaultValue props. " +
          "Input elements must be either controlled or uncontrolled " +
          "(specify either the value prop, or the defaultValue prop, but not " +
          "both). Decide between using a controlled or uncontrolled input " +
          "element and remove one of these props. More info: " +
          "https://reactjs.org/link/controlled-components",
        "A component",
        props.type
      );

      didWarnDefaultInputValue = true;
    }
  }

  target.push(startChunkForTag("input"));
  var value = null;
  var defaultValue = null;
  var checked = null;
  var defaultChecked = null;

  for (var propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case "children":
        case "dangerouslySetInnerHTML":
          throw new Error(
            "input" +
              " is a self-closing tag and must neither have `children` nor " +
              "use `dangerouslySetInnerHTML`."
          );
        // eslint-disable-next-line-no-fallthrough

        case "defaultChecked":
          defaultChecked = propValue;
          break;

        case "defaultValue":
          defaultValue = propValue;
          break;

        case "checked":
          checked = propValue;
          break;

        case "value":
          value = propValue;
          break;

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  if (checked !== null) {
    pushAttribute(target, responseState, "checked", checked);
  } else if (defaultChecked !== null) {
    pushAttribute(target, responseState, "checked", defaultChecked);
  }

  if (value !== null) {
    pushAttribute(target, responseState, "value", value);
  } else if (defaultValue !== null) {
    pushAttribute(target, responseState, "value", defaultValue);
  }

  target.push(endOfStartTagSelfClosing);
  return null;
}

function pushStartTextArea(target, props, responseState) {
  {
    checkControlledValueProps("textarea", props);

    if (
      props.value !== undefined &&
      props.defaultValue !== undefined &&
      !didWarnDefaultTextareaValue
    ) {
      error(
        "Textarea elements must be either controlled or uncontrolled " +
          "(specify either the value prop, or the defaultValue prop, but not " +
          "both). Decide between using a controlled or uncontrolled textarea " +
          "and remove one of these props. More info: " +
          "https://reactjs.org/link/controlled-components"
      );

      didWarnDefaultTextareaValue = true;
    }
  }

  target.push(startChunkForTag("textarea"));
  var value = null;
  var defaultValue = null;
  var children = null;

  for (var propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case "children":
          children = propValue;
          break;

        case "value":
          value = propValue;
          break;

        case "defaultValue":
          defaultValue = propValue;
          break;

        case "dangerouslySetInnerHTML":
          throw new Error(
            "`dangerouslySetInnerHTML` does not make sense on <textarea>."
          );
        // eslint-disable-next-line-no-fallthrough

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  if (value === null && defaultValue !== null) {
    value = defaultValue;
  }

  target.push(endOfStartTag); // TODO (yungsters): Remove support for children content in <textarea>.

  if (children != null) {
    {
      error(
        "Use the `defaultValue` or `value` props instead of setting " +
          "children on <textarea>."
      );
    }

    if (value != null) {
      throw new Error(
        "If you supply `defaultValue` on a <textarea>, do not pass children."
      );
    }

    if (isArray(children)) {
      if (children.length > 1) {
        throw new Error("<textarea> can only have at most one child.");
      } // TODO: remove the coercion and the DEV check below because it will
      // always be overwritten by the coercion several lines below it. #22309

      {
        checkHtmlStringCoercion(children[0]);
      }

      value = "" + children[0];
    }

    {
      checkHtmlStringCoercion(children);
    }

    value = "" + children;
  }

  if (typeof value === "string" && value[0] === "\n") {
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
  } // ToString and push directly instead of recurse over children.
  // We don't really support complex children in the value anyway.
  // This also currently avoids a trailing comment node which breaks textarea.

  if (value !== null) {
    {
      checkAttributeStringCoercion(value, "value");
    }

    target.push(stringToChunk(encodeHTMLTextNode("" + value)));
  }

  return null;
}

function pushBase(
  target,
  props,
  responseState,
  textEmbedded,
  noscriptTagInScope
) {
  if (!noscriptTagInScope && resourcesFromElement("base", props)) {
    if (textEmbedded) {
      // This link follows text but we aren't writing a tag. while not as efficient as possible we need
      // to be safe and assume text will follow by inserting a textSeparator
      target.push(textSeparator);
    } // We have converted this link exclusively to a resource and no longer
    // need to emit it

    return null;
  }

  return pushSelfClosing(target, props, "base", responseState);
}

function pushMeta(
  target,
  props,
  responseState,
  textEmbedded,
  noscriptTagInScope
) {
  if (!noscriptTagInScope && resourcesFromElement("meta", props)) {
    if (textEmbedded) {
      // This link follows text but we aren't writing a tag. while not as efficient as possible we need
      // to be safe and assume text will follow by inserting a textSeparator
      target.push(textSeparator);
    } // We have converted this link exclusively to a resource and no longer
    // need to emit it

    return null;
  }

  return pushSelfClosing(target, props, "meta", responseState);
}

function pushLink(
  target,
  props,
  responseState,
  textEmbedded,
  noscriptTagInScope
) {
  if (!noscriptTagInScope && resourcesFromLink(props)) {
    if (textEmbedded) {
      // This link follows text but we aren't writing a tag. while not as efficient as possible we need
      // to be safe and assume text will follow by inserting a textSeparator
      target.push(textSeparator);
    } // We have converted this link exclusively to a resource and no longer
    // need to emit it

    return null;
  }

  return pushLinkImpl(target, props, responseState);
}

function pushLinkImpl(target, props, responseState) {
  var isStylesheet = props.rel === "stylesheet";
  target.push(startChunkForTag("link"));

  for (var propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case "children":
        case "dangerouslySetInnerHTML":
          throw new Error(
            "link" +
              " is a self-closing tag and must neither have `children` nor " +
              "use `dangerouslySetInnerHTML`."
          );

        case "precedence": {
          if (isStylesheet) {
            // precedence is a reversed property for stylesheets to opt-into resource semantcs
            continue;
          } // intentionally fall through
        }
        // eslint-disable-next-line-no-fallthrough

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  target.push(endOfStartTagSelfClosing);
  return null;
}

function pushSelfClosing(target, props, tag, responseState) {
  target.push(startChunkForTag(tag));

  for (var propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case "children":
        case "dangerouslySetInnerHTML":
          throw new Error(
            tag +
              " is a self-closing tag and must neither have `children` nor " +
              "use `dangerouslySetInnerHTML`."
          );
        // eslint-disable-next-line-no-fallthrough

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  target.push(endOfStartTagSelfClosing);
  return null;
}

function pushStartMenuItem(target, props, responseState) {
  target.push(startChunkForTag("menuitem"));

  for (var propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case "children":
        case "dangerouslySetInnerHTML":
          throw new Error(
            "menuitems cannot have `children` nor `dangerouslySetInnerHTML`."
          );
        // eslint-disable-next-line-no-fallthrough

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  target.push(endOfStartTag);
  return null;
}

function pushTitle(
  target,
  props,
  responseState,
  insertionMode,
  noscriptTagInScope
) {
  {
    var children = props.children;
    var childForValidation =
      Array.isArray(children) && children.length < 2
        ? children[0] || null
        : children;

    if (Array.isArray(children) && children.length > 1) {
      error(
        "A title element received an array with more than 1 element as children. " +
          "In browsers title Elements can only have Text Nodes as children. If " +
          "the children being rendered output more than a single text node in aggregate the browser " +
          "will display markup and comments as text in the title and hydration will likely fail and " +
          "fall back to client rendering"
      );
    } else if (
      childForValidation != null &&
      childForValidation.$$typeof != null
    ) {
      error(
        "A title element received a React element for children. " +
          "In the browser title Elements can only have Text Nodes as children. If " +
          "the children being rendered output more than a single text node in aggregate the browser " +
          "will display markup and comments as text in the title and hydration will likely fail and " +
          "fall back to client rendering"
      );
    } else if (
      childForValidation != null &&
      typeof childForValidation !== "string" &&
      typeof childForValidation !== "number"
    ) {
      error(
        "A title element received a value that was not a string or number for children. " +
          "In the browser title Elements can only have Text Nodes as children. If " +
          "the children being rendered output more than a single text node in aggregate the browser " +
          "will display markup and comments as text in the title and hydration will likely fail and " +
          "fall back to client rendering"
      );
    }
  }

  if (
    // title is valid in SVG so we avoid resour
    insertionMode !== SVG_MODE &&
    !noscriptTagInScope &&
    resourcesFromElement("title", props)
  ) {
    // We have converted this link exclusively to a resource and no longer
    // need to emit it
    return null;
  }

  return pushTitleImpl(target, props, responseState);
}

function pushTitleImpl(target, props, responseState) {
  target.push(startChunkForTag("title"));
  var children = null;

  for (var propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case "children":
          children = propValue;
          break;

        case "dangerouslySetInnerHTML":
          throw new Error(
            "`dangerouslySetInnerHTML` does not make sense on <title>."
          );
        // eslint-disable-next-line-no-fallthrough

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  target.push(endOfStartTag);
  var child = Array.isArray(children)
    ? children.length < 2
      ? children[0]
      : null
    : children;

  if (
    typeof child !== "function" &&
    typeof child !== "symbol" &&
    child !== null &&
    child !== undefined
  ) {
    // eslint-disable-next-line react-internal/safe-string-coercion
    target.push(stringToChunk(escapeTextForBrowser("" + child)));
  }

  target.push(endTag1, stringToChunk("title"), endTag2);
  return null;
}

function pushStartHead(target, preamble, props, tag, responseState) {
  return pushStartGenericElement(preamble, props, tag, responseState);
}

function pushStartHtml(
  target,
  preamble,
  props,
  tag,
  responseState,
  formatContext
) {
  target = preamble;

  if (formatContext.insertionMode === ROOT_HTML_MODE) {
    // If we're rendering the html tag and we're at the root (i.e. not in foreignObject)
    // then we also emit the DOCTYPE as part of the root content as a convenience for
    // rendering the whole document.
    target.push(DOCTYPE);
  }

  return pushStartGenericElement(target, props, tag, responseState);
}

function pushScript(
  target,
  props,
  responseState,
  textEmbedded,
  noscriptTagInScope
) {
  if (!noscriptTagInScope && resourcesFromScript(props)) {
    if (textEmbedded) {
      // This link follows text but we aren't writing a tag. while not as efficient as possible we need
      // to be safe and assume text will follow by inserting a textSeparator
      target.push(textSeparator);
    } // We have converted this link exclusively to a resource and no longer
    // need to emit it

    return null;
  }

  return pushScriptImpl(target, props, responseState);
}

function pushScriptImpl(target, props, responseState) {
  target.push(startChunkForTag("script"));
  var children = null;
  var innerHTML = null;

  for (var propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case "children":
          children = propValue;
          break;

        case "dangerouslySetInnerHTML":
          innerHTML = propValue;
          break;

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  target.push(endOfStartTag);

  {
    if (children != null && typeof children !== "string") {
      var descriptiveStatement =
        typeof children === "number"
          ? "a number for children"
          : Array.isArray(children)
          ? "an array for children"
          : "something unexpected for children";

      error(
        "A script element was rendered with %s. If script element has children it must be a single string." +
          " Consider using dangerouslySetInnerHTML or passing a plain string as children.",
        descriptiveStatement
      );
    }
  }

  pushInnerHTML(target, innerHTML, children);

  if (typeof children === "string") {
    target.push(stringToChunk(encodeHTMLTextNode(children)));
  }

  target.push(endTag1, stringToChunk("script"), endTag2);
  return null;
}

function pushStartGenericElement(target, props, tag, responseState) {
  target.push(startChunkForTag(tag));
  var children = null;
  var innerHTML = null;

  for (var propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case "children":
          children = propValue;
          break;

        case "dangerouslySetInnerHTML":
          innerHTML = propValue;
          break;

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  target.push(endOfStartTag);
  pushInnerHTML(target, innerHTML, children);

  if (typeof children === "string") {
    // Special case children as a string to avoid the unnecessary comment.
    // TODO: Remove this special case after the general optimization is in place.
    target.push(stringToChunk(encodeHTMLTextNode(children)));
    return null;
  }

  return children;
}

function pushStartCustomElement(target, props, tag, responseState) {
  target.push(startChunkForTag(tag));
  var children = null;
  var innerHTML = null;

  for (var propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      if (typeof propValue === "function" || typeof propValue === "object") {
        // It is normal to render functions and objects on custom elements when
        // client rendering, but when server rendering the output isn't useful,
        // so skip it.
        continue;
      }

      if (propValue === false) {
        continue;
      }

      if (propValue === true) {
        propValue = "";
      }

      if (propKey === "className") {
        // className gets rendered as class on the client, so it should be
        // rendered as class on the server.
        propKey = "class";
      }

      switch (propKey) {
        case "children":
          children = propValue;
          break;

        case "dangerouslySetInnerHTML":
          innerHTML = propValue;
          break;

        case "style":
          pushStyle(target, responseState, propValue);
          break;

        case "suppressContentEditableWarning":
        case "suppressHydrationWarning":
          // Ignored. These are built-in to React on the client.
          break;

        default:
          if (
            isAttributeNameSafe(propKey) &&
            typeof propValue !== "function" &&
            typeof propValue !== "symbol"
          ) {
            target.push(
              attributeSeparator,
              stringToChunk(propKey),
              attributeAssign,
              stringToChunk(escapeTextForBrowser(propValue)),
              attributeEnd
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

var leadingNewline = stringToPrecomputedChunk("\n");

function pushStartPreformattedElement(target, props, tag, responseState) {
  target.push(startChunkForTag(tag));
  var children = null;
  var innerHTML = null;

  for (var propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case "children":
          children = propValue;
          break;

        case "dangerouslySetInnerHTML":
          innerHTML = propValue;
          break;

        default:
          pushAttribute(target, responseState, propKey, propValue);
          break;
      }
    }
  }

  target.push(endOfStartTag); // text/html ignores the first character in these tags if it's a newline
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
        "Can only set one of `children` or `props.dangerouslySetInnerHTML`."
      );
    }

    if (typeof innerHTML !== "object" || !("__html" in innerHTML)) {
      throw new Error(
        "`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. " +
          "Please visit https://reactjs.org/link/dangerously-set-inner-html " +
          "for more information."
      );
    }

    var html = innerHTML.__html;

    if (html !== null && html !== undefined) {
      if (typeof html === "string" && html.length > 0 && html[0] === "\n") {
        target.push(leadingNewline, stringToChunk(html));
      } else {
        {
          checkHtmlStringCoercion(html);
        }

        target.push(stringToChunk("" + html));
      }
    }
  }

  if (typeof children === "string" && children[0] === "\n") {
    target.push(leadingNewline);
  }

  return children;
} // We accept any tag to be rendered but since this gets injected into arbitrary
// HTML, we want to make sure that it's a safe tag.
// http://www.w3.org/TR/REC-xml/#NT-Name

var VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/; // Simplified subset

var validatedTagCache = new Map();

function startChunkForTag(tag) {
  var tagStartChunk = validatedTagCache.get(tag);

  if (tagStartChunk === undefined) {
    if (!VALID_TAG_REGEX.test(tag)) {
      throw new Error("Invalid tag: " + tag);
    }

    tagStartChunk = stringToPrecomputedChunk("<" + tag);
    validatedTagCache.set(tag, tagStartChunk);
  }

  return tagStartChunk;
}

var DOCTYPE = stringToPrecomputedChunk("<!DOCTYPE html>");
function pushStartInstance(
  target,
  preamble,
  type,
  props,
  responseState,
  formatContext,
  textEmbedded
) {
  {
    validateProperties(type, props);
    validateProperties$1(type, props);
    validateProperties$2(type, props, null);

    if (
      !props.suppressContentEditableWarning &&
      props.contentEditable &&
      props.children != null
    ) {
      error(
        "A component is `contentEditable` and contains `children` managed by " +
          "React. It is now your responsibility to guarantee that none of " +
          "those nodes are unexpectedly modified or duplicated. This is " +
          "probably not intentional."
      );
    }

    if (
      formatContext.insertionMode !== SVG_MODE &&
      formatContext.insertionMode !== MATHML_MODE
    ) {
      if (
        type.indexOf("-") === -1 &&
        typeof props.is !== "string" &&
        type.toLowerCase() !== type
      ) {
        error(
          "<%s /> is using incorrect casing. " +
            "Use PascalCase for React components, " +
            "or lowercase for HTML elements.",
          type
        );
      }
    }
  }

  switch (type) {
    // Special tags
    case "select":
      return pushStartSelect(target, props, responseState);

    case "option":
      return pushStartOption(target, props, responseState, formatContext);

    case "textarea":
      return pushStartTextArea(target, props, responseState);

    case "input":
      return pushInput(target, props, responseState);

    case "menuitem":
      return pushStartMenuItem(target, props, responseState);

    case "title":
      return pushTitle(
        target,
        props,
        responseState,
        formatContext.insertionMode,
        formatContext.noscriptTagInScope
      );

    case "link":
      return pushLink(
        target,
        props,
        responseState,
        textEmbedded,
        formatContext.noscriptTagInScope
      );

    case "script":
      return pushScript(
        target,
        props,
        responseState,
        textEmbedded,
        formatContext.noscriptTagInScope
      );

    case "meta":
      return pushMeta(
        target,
        props,
        responseState,
        textEmbedded,
        formatContext.noscriptTagInScope
      );

    case "base":
      return pushBase(
        target,
        props,
        responseState,
        textEmbedded,
        formatContext.noscriptTagInScope
      );
    // Newline eating tags

    case "listing":
    case "pre": {
      return pushStartPreformattedElement(target, props, type, responseState);
    }
    // Omitted close tags

    case "area":
    case "br":
    case "col":
    case "embed":
    case "hr":
    case "img":
    case "keygen":
    case "param":
    case "source":
    case "track":
    case "wbr": {
      return pushSelfClosing(target, props, type, responseState);
    }
    // These are reserved SVG and MathML elements, that are never custom elements.
    // https://w3c.github.io/webcomponents/spec/custom/#custom-elements-core-concepts

    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph": {
      return pushStartGenericElement(target, props, type, responseState);
    }
    // Preamble start tags

    case "head":
      return pushStartHead(target, preamble, props, type, responseState);

    case "html": {
      return pushStartHtml(
        target,
        preamble,
        props,
        type,
        responseState,
        formatContext
      );
    }

    default: {
      if (type.indexOf("-") === -1 && typeof props.is !== "string") {
        // Generic element
        return pushStartGenericElement(target, props, type, responseState);
      } else {
        // Custom element
        return pushStartCustomElement(target, props, type, responseState);
      }
    }
  }
}
var endTag1 = stringToPrecomputedChunk("</");
var endTag2 = stringToPrecomputedChunk(">");
function pushEndInstance(target, postamble, type, props) {
  switch (type) {
    // When float is on we expect title and script tags to always be pushed in
    // a unit and never return children. when we end up pushing the end tag we
    // want to ensure there is no extra closing tag pushed
    case "title":
    case "script":
    // Omitted close tags
    // TODO: Instead of repeating this switch we could try to pass a flag from above.
    // That would require returning a tuple. Which might be ok if it gets inlined.
    // eslint-disable-next-line-no-fallthrough

    case "area":
    case "base":
    case "br":
    case "col":
    case "embed":
    case "hr":
    case "img":
    case "input":
    case "keygen":
    case "link":
    case "meta":
    case "param":
    case "source":
    case "track":
    case "wbr": {
      // No close tag needed.
      return;
    }
    // Postamble end tags

    case "body": {
      {
        postamble.unshift(endTag1, stringToChunk(type), endTag2);
        return;
      }
    }

    case "html": {
      postamble.push(endTag1, stringToChunk(type), endTag2);
      return;
    }
  }

  target.push(endTag1, stringToChunk(type), endTag2);
}
function writeCompletedRoot(destination, responseState) {
  var bootstrapChunks = responseState.bootstrapChunks;
  var i = 0;

  for (; i < bootstrapChunks.length - 1; i++) {
    writeChunk(destination, bootstrapChunks[i]);
  }

  if (i < bootstrapChunks.length) {
    return writeChunkAndReturn(destination, bootstrapChunks[i]);
  }

  return true;
} // Structural Nodes
// A placeholder is a node inside a hidden partial tree that can be filled in later, but before
// display. It's never visible to users. We use the template tag because it can be used in every
// type of parent. <script> tags also work in every other tag except <colgroup>.

var placeholder1 = stringToPrecomputedChunk('<template id="');
var placeholder2 = stringToPrecomputedChunk('"></template>');
function writePlaceholder(destination, responseState, id) {
  writeChunk(destination, placeholder1);
  writeChunk(destination, responseState.placeholderPrefix);
  var formattedID = stringToChunk(id.toString(16));
  writeChunk(destination, formattedID);
  return writeChunkAndReturn(destination, placeholder2);
} // Suspense boundaries are encoded as comments.

var startCompletedSuspenseBoundary = stringToPrecomputedChunk("<!--$-->");
var startPendingSuspenseBoundary1 = stringToPrecomputedChunk(
  '<!--$?--><template id="'
);
var startPendingSuspenseBoundary2 = stringToPrecomputedChunk('"></template>');
var startClientRenderedSuspenseBoundary = stringToPrecomputedChunk("<!--$!-->");
var endSuspenseBoundary = stringToPrecomputedChunk("<!--/$-->");
var clientRenderedSuspenseBoundaryError1 = stringToPrecomputedChunk(
  "<template"
);
var clientRenderedSuspenseBoundaryErrorAttrInterstitial = stringToPrecomputedChunk(
  '"'
);
var clientRenderedSuspenseBoundaryError1A = stringToPrecomputedChunk(
  ' data-dgst="'
);
var clientRenderedSuspenseBoundaryError1B = stringToPrecomputedChunk(
  ' data-msg="'
);
var clientRenderedSuspenseBoundaryError1C = stringToPrecomputedChunk(
  ' data-stck="'
);
var clientRenderedSuspenseBoundaryError2 = stringToPrecomputedChunk(
  "></template>"
);
function writeStartCompletedSuspenseBoundary(destination, responseState) {
  return writeChunkAndReturn(destination, startCompletedSuspenseBoundary);
}
function writeStartPendingSuspenseBoundary(destination, responseState, id) {
  writeChunk(destination, startPendingSuspenseBoundary1);

  if (id === null) {
    throw new Error(
      "An ID must have been assigned before we can complete the boundary."
    );
  }

  writeChunk(destination, id);
  return writeChunkAndReturn(destination, startPendingSuspenseBoundary2);
}
function writeStartClientRenderedSuspenseBoundary(
  destination,
  responseState,
  errorDigest,
  errorMesssage,
  errorComponentStack
) {
  var result;
  result = writeChunkAndReturn(
    destination,
    startClientRenderedSuspenseBoundary
  );
  writeChunk(destination, clientRenderedSuspenseBoundaryError1);

  if (errorDigest) {
    writeChunk(destination, clientRenderedSuspenseBoundaryError1A);
    writeChunk(destination, stringToChunk(escapeTextForBrowser(errorDigest)));
    writeChunk(
      destination,
      clientRenderedSuspenseBoundaryErrorAttrInterstitial
    );
  }

  {
    if (errorMesssage) {
      writeChunk(destination, clientRenderedSuspenseBoundaryError1B);
      writeChunk(
        destination,
        stringToChunk(escapeTextForBrowser(errorMesssage))
      );
      writeChunk(
        destination,
        clientRenderedSuspenseBoundaryErrorAttrInterstitial
      );
    }

    if (errorComponentStack) {
      writeChunk(destination, clientRenderedSuspenseBoundaryError1C);
      writeChunk(
        destination,
        stringToChunk(escapeTextForBrowser(errorComponentStack))
      );
      writeChunk(
        destination,
        clientRenderedSuspenseBoundaryErrorAttrInterstitial
      );
    }
  }

  result = writeChunkAndReturn(
    destination,
    clientRenderedSuspenseBoundaryError2
  );
  return result;
}
function writeEndCompletedSuspenseBoundary(destination, responseState) {
  return writeChunkAndReturn(destination, endSuspenseBoundary);
}
function writeEndPendingSuspenseBoundary(destination, responseState) {
  return writeChunkAndReturn(destination, endSuspenseBoundary);
}
function writeEndClientRenderedSuspenseBoundary(destination, responseState) {
  return writeChunkAndReturn(destination, endSuspenseBoundary);
}
var startSegmentHTML = stringToPrecomputedChunk('<div hidden id="');
var startSegmentHTML2 = stringToPrecomputedChunk('">');
var endSegmentHTML = stringToPrecomputedChunk("</div>");
var startSegmentSVG = stringToPrecomputedChunk(
  '<svg aria-hidden="true" style="display:none" id="'
);
var startSegmentSVG2 = stringToPrecomputedChunk('">');
var endSegmentSVG = stringToPrecomputedChunk("</svg>");
var startSegmentMathML = stringToPrecomputedChunk(
  '<math aria-hidden="true" style="display:none" id="'
);
var startSegmentMathML2 = stringToPrecomputedChunk('">');
var endSegmentMathML = stringToPrecomputedChunk("</math>");
var startSegmentTable = stringToPrecomputedChunk('<table hidden id="');
var startSegmentTable2 = stringToPrecomputedChunk('">');
var endSegmentTable = stringToPrecomputedChunk("</table>");
var startSegmentTableBody = stringToPrecomputedChunk(
  '<table hidden><tbody id="'
);
var startSegmentTableBody2 = stringToPrecomputedChunk('">');
var endSegmentTableBody = stringToPrecomputedChunk("</tbody></table>");
var startSegmentTableRow = stringToPrecomputedChunk('<table hidden><tr id="');
var startSegmentTableRow2 = stringToPrecomputedChunk('">');
var endSegmentTableRow = stringToPrecomputedChunk("</tr></table>");
var startSegmentColGroup = stringToPrecomputedChunk(
  '<table hidden><colgroup id="'
);
var startSegmentColGroup2 = stringToPrecomputedChunk('">');
var endSegmentColGroup = stringToPrecomputedChunk("</colgroup></table>");
function writeStartSegment(destination, responseState, formatContext, id) {
  switch (formatContext.insertionMode) {
    case ROOT_HTML_MODE:
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
      throw new Error("Unknown insertion mode. This is a bug in React.");
    }
  }
}
function writeEndSegment(destination, formatContext) {
  switch (formatContext.insertionMode) {
    case ROOT_HTML_MODE:
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
      throw new Error("Unknown insertion mode. This is a bug in React.");
    }
  }
}
var completeSegmentScript1Full = stringToPrecomputedChunk(
  completeSegment + ';$RS("'
);
var completeSegmentScript1Partial = stringToPrecomputedChunk('$RS("');
var completeSegmentScript2 = stringToPrecomputedChunk('","');
var completeSegmentScriptEnd = stringToPrecomputedChunk('")</script>');
var completeSegmentData1 = stringToPrecomputedChunk(
  '<template data-rsi="" data-sid="'
);
var completeSegmentData2 = stringToPrecomputedChunk('" data-pid="');
var completeSegmentDataEnd = dataElementQuotedEnd;
function writeCompletedSegmentInstruction(
  destination,
  responseState,
  contentSegmentID
) {
  var scriptFormat = responseState.streamingFormat === ScriptStreamingFormat;

  if (scriptFormat) {
    writeChunk(destination, responseState.startInlineScript);

    if (!responseState.sentCompleteSegmentFunction) {
      // The first time we write this, we'll need to include the full implementation.
      responseState.sentCompleteSegmentFunction = true;
      writeChunk(destination, completeSegmentScript1Full);
    } else {
      // Future calls can just reuse the same function.
      writeChunk(destination, completeSegmentScript1Partial);
    }
  } else {
    writeChunk(destination, completeSegmentData1);
  } // Write function arguments, which are string literals

  writeChunk(destination, responseState.segmentPrefix);
  var formattedID = stringToChunk(contentSegmentID.toString(16));
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
var completeBoundaryScript1Full = stringToPrecomputedChunk(
  completeBoundary + ';$RC("'
);
var completeBoundaryScript1Partial = stringToPrecomputedChunk('$RC("');
var completeBoundaryWithStylesScript1FullBoth = stringToPrecomputedChunk(
  completeBoundary + ";" + completeBoundaryWithStyles + ';$RR("'
);
var completeBoundaryWithStylesScript1FullPartial = stringToPrecomputedChunk(
  completeBoundaryWithStyles + ';$RR("'
);
var completeBoundaryWithStylesScript1Partial = stringToPrecomputedChunk(
  '$RR("'
);
var completeBoundaryScript2 = stringToPrecomputedChunk('","');
var completeBoundaryScript3a = stringToPrecomputedChunk('",');
var completeBoundaryScript3b = stringToPrecomputedChunk('"');
var completeBoundaryScriptEnd = stringToPrecomputedChunk(")</script>");
var completeBoundaryData1 = stringToPrecomputedChunk(
  '<template data-rci="" data-bid="'
);
var completeBoundaryWithStylesData1 = stringToPrecomputedChunk(
  '<template data-rri="" data-bid="'
);
var completeBoundaryData2 = stringToPrecomputedChunk('" data-sid="');
var completeBoundaryData3a = stringToPrecomputedChunk('" data-sty="');
var completeBoundaryDataEnd = dataElementQuotedEnd;
function writeCompletedBoundaryInstruction(
  destination,
  responseState,
  boundaryID,
  contentSegmentID,
  boundaryResources
) {
  var hasStyleDependencies;

  {
    hasStyleDependencies = hasStyleResourceDependencies(boundaryResources);
  }

  var scriptFormat = responseState.streamingFormat === ScriptStreamingFormat;

  if (scriptFormat) {
    writeChunk(destination, responseState.startInlineScript);

    if (hasStyleDependencies) {
      if (!responseState.sentCompleteBoundaryFunction) {
        responseState.sentCompleteBoundaryFunction = true;
        responseState.sentStyleInsertionFunction = true;
        writeChunk(
          destination,
          clonePrecomputedChunk(completeBoundaryWithStylesScript1FullBoth)
        );
      } else if (!responseState.sentStyleInsertionFunction) {
        responseState.sentStyleInsertionFunction = true;
        writeChunk(destination, completeBoundaryWithStylesScript1FullPartial);
      } else {
        writeChunk(destination, completeBoundaryWithStylesScript1Partial);
      }
    } else {
      if (!responseState.sentCompleteBoundaryFunction) {
        responseState.sentCompleteBoundaryFunction = true;
        writeChunk(destination, completeBoundaryScript1Full);
      } else {
        writeChunk(destination, completeBoundaryScript1Partial);
      }
    }
  } else {
    if (hasStyleDependencies) {
      writeChunk(destination, completeBoundaryWithStylesData1);
    } else {
      writeChunk(destination, completeBoundaryData1);
    }
  }

  if (boundaryID === null) {
    throw new Error(
      "An ID must have been assigned before we can complete the boundary."
    );
  } // Write function arguments, which are string and array literals

  var formattedContentID = stringToChunk(contentSegmentID.toString(16));
  writeChunk(destination, boundaryID);

  if (scriptFormat) {
    writeChunk(destination, completeBoundaryScript2);
  } else {
    writeChunk(destination, completeBoundaryData2);
  }

  writeChunk(destination, responseState.segmentPrefix);
  writeChunk(destination, formattedContentID);

  if (hasStyleDependencies) {
    // Script and data writers must format this differently:
    //  - script writer emits an array literal, whose string elements are
    //    escaped for javascript  e.g. ["A", "B"]
    //  - data writer emits a string literal, which is escaped as html
    //    e.g. [&#34;A&#34;, &#34;B&#34;]
    if (scriptFormat) {
      writeChunk(destination, completeBoundaryScript3a); // boundaryResources encodes an array literal

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
var clientRenderScript1Full = stringToPrecomputedChunk(
  clientRenderBoundary + ';$RX("'
);
var clientRenderScript1Partial = stringToPrecomputedChunk('$RX("');
var clientRenderScript1A = stringToPrecomputedChunk('"');
var clientRenderErrorScriptArgInterstitial = stringToPrecomputedChunk(",");
var clientRenderScriptEnd = stringToPrecomputedChunk(")</script>");
var clientRenderData1 = stringToPrecomputedChunk(
  '<template data-rxi="" data-bid="'
);
var clientRenderData2 = stringToPrecomputedChunk('" data-dgst="');
var clientRenderData3 = stringToPrecomputedChunk('" data-msg="');
var clientRenderData4 = stringToPrecomputedChunk('" data-stck="');
var clientRenderDataEnd = dataElementQuotedEnd;
function writeClientRenderBoundaryInstruction(
  destination,
  responseState,
  boundaryID,
  errorDigest,
  errorMessage,
  errorComponentStack
) {
  var scriptFormat = responseState.streamingFormat === ScriptStreamingFormat;

  if (scriptFormat) {
    writeChunk(destination, responseState.startInlineScript);

    if (!responseState.sentClientRenderFunction) {
      // The first time we write this, we'll need to include the full implementation.
      responseState.sentClientRenderFunction = true;
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
      "An ID must have been assigned before we can complete the boundary."
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
        stringToChunk(escapeJSStringsForInstructionScripts(errorDigest || ""))
      );
    } else {
      // " data-dgst="HTMLString
      writeChunk(destination, clientRenderData2);
      writeChunk(
        destination,
        stringToChunk(escapeTextForBrowser(errorDigest || ""))
      );
    }
  }

  if (errorMessage || errorComponentStack) {
    if (scriptFormat) {
      // ,"JSONString"
      writeChunk(destination, clientRenderErrorScriptArgInterstitial);
      writeChunk(
        destination,
        stringToChunk(escapeJSStringsForInstructionScripts(errorMessage || ""))
      );
    } else {
      // " data-msg="HTMLString
      writeChunk(destination, clientRenderData3);
      writeChunk(
        destination,
        stringToChunk(escapeTextForBrowser(errorMessage || ""))
      );
    }
  }

  if (errorComponentStack) {
    // ,"JSONString"
    if (scriptFormat) {
      writeChunk(destination, clientRenderErrorScriptArgInterstitial);
      writeChunk(
        destination,
        stringToChunk(escapeJSStringsForInstructionScripts(errorComponentStack))
      );
    } else {
      // " data-stck="HTMLString
      writeChunk(destination, clientRenderData4);
      writeChunk(
        destination,
        stringToChunk(escapeTextForBrowser(errorComponentStack))
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
var regexForJSStringsInInstructionScripts = /[<\u2028\u2029]/g;

function escapeJSStringsForInstructionScripts(input) {
  var escaped = JSON.stringify(input);
  return escaped.replace(regexForJSStringsInInstructionScripts, function(
    match
  ) {
    switch (match) {
      // santizing breaking out of strings and script tags
      case "<":
        return "\\u003c";

      case "\u2028":
        return "\\u2028";

      case "\u2029":
        return "\\u2029";

      default: {
        // eslint-disable-next-line react-internal/prod-error-codes
        throw new Error(
          "escapeJSStringsForInstructionScripts encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React"
        );
      }
    }
  });
}

var regexForJSStringsInScripts = /[&><\u2028\u2029]/g;

function escapeJSObjectForInstructionScripts(input) {
  var escaped = JSON.stringify(input);
  return escaped.replace(regexForJSStringsInScripts, function(match) {
    switch (match) {
      // santizing breaking out of strings and script tags
      case "&":
        return "\\u0026";

      case ">":
        return "\\u003e";

      case "<":
        return "\\u003c";

      case "\u2028":
        return "\\u2028";

      case "\u2029":
        return "\\u2029";

      default: {
        // eslint-disable-next-line react-internal/prod-error-codes
        throw new Error(
          "escapeJSObjectForInstructionScripts encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React"
        );
      }
    }
  });
}

var precedencePlaceholderStart = stringToPrecomputedChunk(
  '<style data-precedence="'
);
var precedencePlaceholderEnd = stringToPrecomputedChunk('"></style>');
function writeInitialResources(
  destination,
  resources,
  responseState,
  willFlushAllSegments
) {
  // Write initially discovered resources after the shell completes
  if (!willFlushAllSegments && responseState.externalRuntimeConfig) {
    // If the root segment is incomplete due to suspended tasks
    // (e.g. willFlushAllSegments = false) and we are using data
    // streaming format, ensure the external runtime is sent.
    // (User code could choose to send this even earlier by calling
    //  preinit(...), if they know they will suspend).
    var _responseState$extern = responseState.externalRuntimeConfig,
      src = _responseState$extern.src,
      integrity = _responseState$extern.integrity;
    preinitImpl(resources, src, {
      as: "script",
      integrity: integrity
    });
  } // $FlowFixMe[missing-local-annot]

  function flushLinkResource(resource) {
    if (!resource.flushed) {
      pushLinkImpl(target, resource.props, responseState);
      resource.flushed = true;
    }
  }

  var target = [];
  var charset = resources.charset,
    bases = resources.bases,
    preconnects = resources.preconnects,
    fontPreloads = resources.fontPreloads,
    precedences = resources.precedences,
    usedStylePreloads = resources.usedStylePreloads,
    scripts = resources.scripts,
    usedScriptPreloads = resources.usedScriptPreloads,
    explicitStylePreloads = resources.explicitStylePreloads,
    explicitScriptPreloads = resources.explicitScriptPreloads,
    headResources = resources.headResources;

  if (charset) {
    pushSelfClosing(target, charset.props, "meta", responseState);
    charset.flushed = true;
    resources.charset = null;
  }

  bases.forEach(function(r) {
    pushSelfClosing(target, r.props, "base", responseState);
    r.flushed = true;
  });
  bases.clear();
  preconnects.forEach(function(r) {
    // font preload Resources should not already be flushed so we elide this check
    pushLinkImpl(target, r.props, responseState);
    r.flushed = true;
  });
  preconnects.clear();
  fontPreloads.forEach(function(r) {
    // font preload Resources should not already be flushed so we elide this check
    pushLinkImpl(target, r.props, responseState);
    r.flushed = true;
  });
  fontPreloads.clear(); // Flush stylesheets first by earliest precedence

  precedences.forEach(function(p, precedence) {
    if (p.size) {
      p.forEach(function(r) {
        // resources should not already be flushed so we elide this check
        pushLinkImpl(target, r.props, responseState);
        r.flushed = true;
        r.inShell = true;
        r.hint.flushed = true;
      });
      p.clear();
    } else {
      target.push(
        precedencePlaceholderStart,
        stringToChunk(escapeTextForBrowser(precedence)),
        precedencePlaceholderEnd
      );
    }
  });
  usedStylePreloads.forEach(flushLinkResource);
  usedStylePreloads.clear();
  scripts.forEach(function(r) {
    // should never be flushed already
    pushScriptImpl(target, r.props, responseState);
    r.flushed = true;
    r.hint.flushed = true;
  });
  scripts.clear();
  usedScriptPreloads.forEach(flushLinkResource);
  usedScriptPreloads.clear();
  explicitStylePreloads.forEach(flushLinkResource);
  explicitStylePreloads.clear();
  explicitScriptPreloads.forEach(flushLinkResource);
  explicitScriptPreloads.clear();
  headResources.forEach(function(r) {
    switch (r.type) {
      case "title": {
        pushTitleImpl(target, r.props, responseState);
        break;
      }

      case "meta": {
        pushSelfClosing(target, r.props, "meta", responseState);
        break;
      }

      case "link": {
        pushLinkImpl(target, r.props, responseState);
        break;
      }
    }

    r.flushed = true;
  });
  headResources.clear();
  var i;
  var r = true;

  for (i = 0; i < target.length - 1; i++) {
    writeChunk(destination, target[i]);
  }

  if (i < target.length) {
    r = writeChunkAndReturn(destination, target[i]);
  }

  return r;
}
function writeImmediateResources(destination, resources, responseState) {
  // $FlowFixMe[missing-local-annot]
  function flushLinkResource(resource) {
    if (!resource.flushed) {
      pushLinkImpl(target, resource.props, responseState);
      resource.flushed = true;
    }
  }

  var target = [];
  var charset = resources.charset,
    preconnects = resources.preconnects,
    fontPreloads = resources.fontPreloads,
    usedStylePreloads = resources.usedStylePreloads,
    scripts = resources.scripts,
    usedScriptPreloads = resources.usedScriptPreloads,
    explicitStylePreloads = resources.explicitStylePreloads,
    explicitScriptPreloads = resources.explicitScriptPreloads,
    headResources = resources.headResources;

  if (charset) {
    pushSelfClosing(target, charset.props, "meta", responseState);
    charset.flushed = true;
    resources.charset = null;
  }

  preconnects.forEach(function(r) {
    // font preload Resources should not already be flushed so we elide this check
    pushLinkImpl(target, r.props, responseState);
    r.flushed = true;
  });
  preconnects.clear();
  fontPreloads.forEach(function(r) {
    // font preload Resources should not already be flushed so we elide this check
    pushLinkImpl(target, r.props, responseState);
    r.flushed = true;
  });
  fontPreloads.clear();
  usedStylePreloads.forEach(flushLinkResource);
  usedStylePreloads.clear();
  scripts.forEach(function(r) {
    // should never be flushed already
    pushStartGenericElement(target, r.props, "script", responseState);
    pushEndInstance(target, target, "script", r.props);
    r.flushed = true;
    r.hint.flushed = true;
  });
  scripts.clear();
  usedScriptPreloads.forEach(flushLinkResource);
  usedScriptPreloads.clear();
  explicitStylePreloads.forEach(flushLinkResource);
  explicitStylePreloads.clear();
  explicitScriptPreloads.forEach(flushLinkResource);
  explicitScriptPreloads.clear();
  headResources.forEach(function(r) {
    switch (r.type) {
      case "title": {
        pushTitleImpl(target, r.props, responseState);
        break;
      }

      case "meta": {
        pushSelfClosing(target, r.props, "meta", responseState);
        break;
      }

      case "link": {
        pushLinkImpl(target, r.props, responseState);
        break;
      }
    }

    r.flushed = true;
  });
  headResources.clear();
  var i;
  var r = true;

  for (i = 0; i < target.length - 1; i++) {
    writeChunk(destination, target[i]);
  }

  if (i < target.length) {
    r = writeChunkAndReturn(destination, target[i]);
  }

  return r;
}

function hasStyleResourceDependencies(boundaryResources) {
  var iter = boundaryResources.values(); // At the moment boundaries only accumulate style resources
  // so we assume the type is correct and don't check it

  while (true) {
    var _iter$next = iter.next(),
      resource = _iter$next.value;

    if (!resource) break; // If every style Resource flushed in the shell we do not need to send
    // any dependencies

    if (!resource.inShell) {
      return true;
    }
  }

  return false;
}

var arrayFirstOpenBracket = stringToPrecomputedChunk("[");
var arraySubsequentOpenBracket = stringToPrecomputedChunk(",[");
var arrayInterstitial = stringToPrecomputedChunk(",");
var arrayCloseBracket = stringToPrecomputedChunk("]"); // This function writes a 2D array of strings to be embedded in javascript.
// E.g.
//  [["JS_escaped_string1", "JS_escaped_string2"]]

function writeStyleResourceDependenciesInJS(destination, boundaryResources) {
  writeChunk(destination, arrayFirstOpenBracket);
  var nextArrayOpenBrackChunk = arrayFirstOpenBracket;
  boundaryResources.forEach(function(resource) {
    if (resource.inShell);
    else if (resource.flushed) {
      writeChunk(destination, nextArrayOpenBrackChunk);
      writeStyleResourceDependencyHrefOnlyInJS(destination, resource.href);
      writeChunk(destination, arrayCloseBracket);
      nextArrayOpenBrackChunk = arraySubsequentOpenBracket;
    } else {
      writeChunk(destination, nextArrayOpenBrackChunk);
      writeStyleResourceDependencyInJS(
        destination,
        resource.href,
        resource.precedence,
        resource.props
      );
      writeChunk(destination, arrayCloseBracket);
      nextArrayOpenBrackChunk = arraySubsequentOpenBracket;
      resource.flushed = true;
      resource.hint.flushed = true;
    }
  });
  writeChunk(destination, arrayCloseBracket);
}
/* Helper functions */

function writeStyleResourceDependencyHrefOnlyInJS(destination, href) {
  // We should actually enforce this earlier when the resource is created but for
  // now we make sure we are actually dealing with a string here.
  {
    checkAttributeStringCoercion(href, "href");
  }

  var coercedHref = "" + href;
  writeChunk(
    destination,
    stringToChunk(escapeJSObjectForInstructionScripts(coercedHref))
  );
}

function writeStyleResourceDependencyInJS(
  destination,
  href,
  precedence,
  props
) {
  {
    checkAttributeStringCoercion(href, "href");
  }

  var coercedHref = "" + href;
  sanitizeURL(coercedHref);
  writeChunk(
    destination,
    stringToChunk(escapeJSObjectForInstructionScripts(coercedHref))
  );

  {
    checkAttributeStringCoercion(precedence, "precedence");
  }

  var coercedPrecedence = "" + precedence;
  writeChunk(destination, arrayInterstitial);
  writeChunk(
    destination,
    stringToChunk(escapeJSObjectForInstructionScripts(coercedPrecedence))
  );

  for (var propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case "href":
        case "rel":
        case "precedence":
        case "data-precedence": {
          break;
        }

        case "children":
        case "dangerouslySetInnerHTML":
          throw new Error(
            "link" +
              " is a self-closing tag and must neither have `children` nor " +
              "use `dangerouslySetInnerHTML`."
          );
        // eslint-disable-next-line-no-fallthrough

        default:
          writeStyleResourceAttributeInJS(destination, propKey, propValue);
          break;
      }
    }
  }

  return null;
}

function writeStyleResourceAttributeInJS(destination, name, value) {
  // not null or undefined
  var attributeName = name.toLowerCase();
  var attributeValue;

  switch (typeof value) {
    case "function":
    case "symbol":
      return;
  }

  switch (name) {
    // Reserved names
    case "innerHTML":
    case "dangerouslySetInnerHTML":
    case "suppressContentEditableWarning":
    case "suppressHydrationWarning":
    case "style":
      // Ignored
      return;
    // Attribute renames

    case "className":
      attributeName = "class";
      break;
    // Booleans

    case "hidden":
      if (value === false) {
        return;
      }

      attributeValue = "";
      break;
    // Santized URLs

    case "src":
    case "href": {
      {
        checkAttributeStringCoercion(value, attributeName);
      }

      attributeValue = "" + value;
      sanitizeURL(attributeValue);
      break;
    }

    default: {
      if (!isAttributeNameSafe(name)) {
        return;
      }
    }
  }

  if (
    // shouldIgnoreAttribute
    // We have already filtered out null/undefined and reserved words.
    name.length > 2 &&
    (name[0] === "o" || name[0] === "O") &&
    (name[1] === "n" || name[1] === "N")
  ) {
    return;
  }

  {
    checkAttributeStringCoercion(value, attributeName);
  }

  attributeValue = "" + value;
  writeChunk(destination, arrayInterstitial);
  writeChunk(
    destination,
    stringToChunk(escapeJSObjectForInstructionScripts(attributeName))
  );
  writeChunk(destination, arrayInterstitial);
  writeChunk(
    destination,
    stringToChunk(escapeJSObjectForInstructionScripts(attributeValue))
  );
} // This function writes a 2D array of strings to be embedded in an attribute
// value and read with JSON.parse in ReactDOMServerExternalRuntime.js
// E.g.
//  [[&quot;JSON_escaped_string1&quot;, &quot;JSON_escaped_string2&quot;]]

function writeStyleResourceDependenciesInAttr(destination, boundaryResources) {
  writeChunk(destination, arrayFirstOpenBracket);
  var nextArrayOpenBrackChunk = arrayFirstOpenBracket;
  boundaryResources.forEach(function(resource) {
    if (resource.inShell);
    else if (resource.flushed) {
      writeChunk(destination, nextArrayOpenBrackChunk);
      writeStyleResourceDependencyHrefOnlyInAttr(destination, resource.href);
      writeChunk(destination, arrayCloseBracket);
      nextArrayOpenBrackChunk = arraySubsequentOpenBracket;
    } else {
      writeChunk(destination, nextArrayOpenBrackChunk);
      writeStyleResourceDependencyInAttr(
        destination,
        resource.href,
        resource.precedence,
        resource.props
      );
      writeChunk(destination, arrayCloseBracket);
      nextArrayOpenBrackChunk = arraySubsequentOpenBracket;
      resource.flushed = true;
      resource.hint.flushed = true;
    }
  });
  writeChunk(destination, arrayCloseBracket);
}
/* Helper functions */

function writeStyleResourceDependencyHrefOnlyInAttr(destination, href) {
  // We should actually enforce this earlier when the resource is created but for
  // now we make sure we are actually dealing with a string here.
  {
    checkAttributeStringCoercion(href, "href");
  }

  var coercedHref = "" + href;
  writeChunk(
    destination,
    stringToChunk(escapeTextForBrowser(JSON.stringify(coercedHref)))
  );
}

function writeStyleResourceDependencyInAttr(
  destination,
  href,
  precedence,
  props
) {
  {
    checkAttributeStringCoercion(href, "href");
  }

  var coercedHref = "" + href;
  sanitizeURL(coercedHref);
  writeChunk(
    destination,
    stringToChunk(escapeTextForBrowser(JSON.stringify(coercedHref)))
  );

  {
    checkAttributeStringCoercion(precedence, "precedence");
  }

  var coercedPrecedence = "" + precedence;
  writeChunk(destination, arrayInterstitial);
  writeChunk(
    destination,
    stringToChunk(escapeTextForBrowser(JSON.stringify(coercedPrecedence)))
  );

  for (var propKey in props) {
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];

      if (propValue == null) {
        continue;
      }

      switch (propKey) {
        case "href":
        case "rel":
        case "precedence":
        case "data-precedence": {
          break;
        }

        case "children":
        case "dangerouslySetInnerHTML":
          throw new Error(
            "link" +
              " is a self-closing tag and must neither have `children` nor " +
              "use `dangerouslySetInnerHTML`."
          );
        // eslint-disable-next-line-no-fallthrough

        default:
          writeStyleResourceAttributeInAttr(destination, propKey, propValue);
          break;
      }
    }
  }

  return null;
}

function writeStyleResourceAttributeInAttr(destination, name, value) {
  // not null or undefined
  var attributeName = name.toLowerCase();
  var attributeValue;

  switch (typeof value) {
    case "function":
    case "symbol":
      return;
  }

  switch (name) {
    // Reserved names
    case "innerHTML":
    case "dangerouslySetInnerHTML":
    case "suppressContentEditableWarning":
    case "suppressHydrationWarning":
    case "style":
      // Ignored
      return;
    // Attribute renames

    case "className":
      attributeName = "class";
      break;
    // Booleans

    case "hidden":
      if (value === false) {
        return;
      }

      attributeValue = "";
      break;
    // Santized URLs

    case "src":
    case "href": {
      {
        checkAttributeStringCoercion(value, attributeName);
      }

      attributeValue = "" + value;
      sanitizeURL(attributeValue);
      break;
    }

    default: {
      if (!isAttributeNameSafe(name)) {
        return;
      }
    }
  }

  if (
    // shouldIgnoreAttribute
    // We have already filtered out null/undefined and reserved words.
    name.length > 2 &&
    (name[0] === "o" || name[0] === "O") &&
    (name[1] === "n" || name[1] === "N")
  ) {
    return;
  }

  {
    checkAttributeStringCoercion(value, attributeName);
  }

  attributeValue = "" + value;
  writeChunk(destination, arrayInterstitial);
  writeChunk(
    destination,
    stringToChunk(escapeTextForBrowser(JSON.stringify(attributeName)))
  );
  writeChunk(destination, arrayInterstitial);
  writeChunk(
    destination,
    stringToChunk(escapeTextForBrowser(JSON.stringify(attributeValue)))
  );
}

function createResponseState$1(
  generateStaticMarkup,
  identifierPrefix,
  externalRuntimeConfig
) {
  var responseState = createResponseState(
    identifierPrefix,
    undefined,
    undefined,
    undefined,
    undefined,
    externalRuntimeConfig
  );
  return {
    // Keep this in sync with ReactDOMServerFormatConfig
    bootstrapChunks: responseState.bootstrapChunks,
    placeholderPrefix: responseState.placeholderPrefix,
    segmentPrefix: responseState.segmentPrefix,
    boundaryPrefix: responseState.boundaryPrefix,
    idPrefix: responseState.idPrefix,
    nextSuspenseID: responseState.nextSuspenseID,
    streamingFormat: responseState.streamingFormat,
    startInlineScript: responseState.startInlineScript,
    sentCompleteSegmentFunction: responseState.sentCompleteSegmentFunction,
    sentCompleteBoundaryFunction: responseState.sentCompleteBoundaryFunction,
    sentClientRenderFunction: responseState.sentClientRenderFunction,
    sentStyleInsertionFunction: responseState.sentStyleInsertionFunction,
    externalRuntimeConfig: responseState.externalRuntimeConfig,
    // This is an extra field for the legacy renderer
    generateStaticMarkup: generateStaticMarkup
  };
}
function createRootFormatContext() {
  return {
    insertionMode: HTML_MODE,
    // We skip the root mode because we don't want to emit the DOCTYPE in legacy mode.
    selectedValue: null,
    noscriptTagInScope: false
  };
}
function pushTextInstance$1(target, text, responseState, textEmbedded) {
  if (responseState.generateStaticMarkup) {
    target.push(stringToChunk(escapeTextForBrowser(text)));
    return false;
  } else {
    return pushTextInstance(target, text, responseState, textEmbedded);
  }
}
function pushSegmentFinale$1(
  target,
  responseState,
  lastPushedText,
  textEmbedded
) {
  if (responseState.generateStaticMarkup) {
    return;
  } else {
    return pushSegmentFinale(
      target,
      responseState,
      lastPushedText,
      textEmbedded
    );
  }
}
function writeStartCompletedSuspenseBoundary$1(destination, responseState) {
  if (responseState.generateStaticMarkup) {
    // A completed boundary is done and doesn't need a representation in the HTML
    // if we're not going to be hydrating it.
    return true;
  }

  return writeStartCompletedSuspenseBoundary(destination);
}
function writeStartClientRenderedSuspenseBoundary$1(
  destination,
  responseState, // flushing these error arguments are not currently supported in this legacy streaming format.
  errorDigest,
  errorMessage,
  errorComponentStack
) {
  if (responseState.generateStaticMarkup) {
    // A client rendered boundary is done and doesn't need a representation in the HTML
    // since we'll never hydrate it. This is arguably an error in static generation.
    return true;
  }

  return writeStartClientRenderedSuspenseBoundary(
    destination,
    responseState,
    errorDigest,
    errorMessage,
    errorComponentStack
  );
}
function writeEndCompletedSuspenseBoundary$1(destination, responseState) {
  if (responseState.generateStaticMarkup) {
    return true;
  }

  return writeEndCompletedSuspenseBoundary(destination);
}
function writeEndClientRenderedSuspenseBoundary$1(destination, responseState) {
  if (responseState.generateStaticMarkup) {
    return true;
  }

  return writeEndClientRenderedSuspenseBoundary(destination);
}

// ATTENTION
// When adding new symbols to this file,
// Please consider also adding to 'react-devtools-shared/src/backend/ReactSymbols'
// The Symbol used to tag the ReactElement-like types.
var REACT_ELEMENT_TYPE = Symbol.for("react.element");
var REACT_PORTAL_TYPE = Symbol.for("react.portal");
var REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
var REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode");
var REACT_PROFILER_TYPE = Symbol.for("react.profiler");
var REACT_PROVIDER_TYPE = Symbol.for("react.provider");
var REACT_CONTEXT_TYPE = Symbol.for("react.context");
var REACT_SERVER_CONTEXT_TYPE = Symbol.for("react.server_context");
var REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref");
var REACT_SUSPENSE_TYPE = Symbol.for("react.suspense");
var REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list");
var REACT_MEMO_TYPE = Symbol.for("react.memo");
var REACT_LAZY_TYPE = Symbol.for("react.lazy");
var REACT_SCOPE_TYPE = Symbol.for("react.scope");
var REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for("react.debug_trace_mode");
var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen");
var REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden");
var REACT_CACHE_TYPE = Symbol.for("react.cache");
var REACT_TRACING_MARKER_TYPE = Symbol.for("react.tracing_marker");
var REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED = Symbol.for(
  "react.default_value"
);
var REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel");
var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
var FAUX_ITERATOR_SYMBOL = "@@iterator";
function getIteratorFn(maybeIterable) {
  if (maybeIterable === null || typeof maybeIterable !== "object") {
    return null;
  }

  var maybeIterator =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable[FAUX_ITERATOR_SYMBOL];

  if (typeof maybeIterator === "function") {
    return maybeIterator;
  }

  return null;
}

function getWrappedName(outerType, innerType, wrapperName) {
  var displayName = outerType.displayName;

  if (displayName) {
    return displayName;
  }

  var functionName = innerType.displayName || innerType.name || "";
  return functionName !== ""
    ? wrapperName + "(" + functionName + ")"
    : wrapperName;
} // Keep in sync with react-reconciler/getComponentNameFromFiber

function getContextName(type) {
  return type.displayName || "Context";
} // Note that the reconciler package should generally prefer to use getComponentNameFromFiber() instead.

function getComponentNameFromType(type) {
  if (type == null) {
    // Host root, text node or just invalid type.
    return null;
  }

  {
    if (typeof type.tag === "number") {
      error(
        "Received an unexpected object in getComponentNameFromType(). " +
          "This is likely a bug in React. Please file an issue."
      );
    }
  }

  if (typeof type === "function") {
    return type.displayName || type.name || null;
  }

  if (typeof type === "string") {
    return type;
  }

  switch (type) {
    case REACT_FRAGMENT_TYPE:
      return "Fragment";

    case REACT_PORTAL_TYPE:
      return "Portal";

    case REACT_PROFILER_TYPE:
      return "Profiler";

    case REACT_STRICT_MODE_TYPE:
      return "StrictMode";

    case REACT_SUSPENSE_TYPE:
      return "Suspense";

    case REACT_SUSPENSE_LIST_TYPE:
      return "SuspenseList";

    case REACT_CACHE_TYPE: {
      return "Cache";
    }

    // eslint-disable-next-line no-fallthrough

    case REACT_TRACING_MARKER_TYPE:
      if (enableTransitionTracing) {
        return "TracingMarker";
      }
  }

  if (typeof type === "object") {
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE:
        var context = type;
        return getContextName(context) + ".Consumer";

      case REACT_PROVIDER_TYPE:
        var provider = type;
        return getContextName(provider._context) + ".Provider";

      case REACT_FORWARD_REF_TYPE:
        return getWrappedName(type, type.render, "ForwardRef");

      case REACT_MEMO_TYPE:
        var outerName = type.displayName || null;

        if (outerName !== null) {
          return outerName;
        }

        return getComponentNameFromType(type.type) || "Memo";

      case REACT_LAZY_TYPE: {
        var lazyComponent = type;
        var payload = lazyComponent._payload;
        var init = lazyComponent._init;

        try {
          return getComponentNameFromType(init(payload));
        } catch (x) {
          return null;
        }
      }

      case REACT_SERVER_CONTEXT_TYPE: {
        var context2 = type;
        return (context2.displayName || context2._globalName) + ".Provider";
      }

      // eslint-disable-next-line no-fallthrough
    }
  }

  return null;
}

// Helpers to patch console.logs to avoid logging during side-effect free
// replaying on render function. This currently only patches the object
// lazily which won't cover if the log function was extracted eagerly.
// We could also eagerly patch the method.
var disabledDepth = 0;
var prevLog;
var prevInfo;
var prevWarn;
var prevError;
var prevGroup;
var prevGroupCollapsed;
var prevGroupEnd;

function disabledLog() {}

disabledLog.__reactDisabledLog = true;
function disableLogs() {
  {
    if (disabledDepth === 0) {
      /* eslint-disable react-internal/no-production-logging */
      prevLog = console.log;
      prevInfo = console.info;
      prevWarn = console.warn;
      prevError = console.error;
      prevGroup = console.group;
      prevGroupCollapsed = console.groupCollapsed;
      prevGroupEnd = console.groupEnd; // https://github.com/facebook/react/issues/19099

      var props = {
        configurable: true,
        enumerable: true,
        value: disabledLog,
        writable: true
      }; // $FlowFixMe Flow thinks console is immutable.

      Object.defineProperties(console, {
        info: props,
        log: props,
        warn: props,
        error: props,
        group: props,
        groupCollapsed: props,
        groupEnd: props
      });
      /* eslint-enable react-internal/no-production-logging */
    }

    disabledDepth++;
  }
}
function reenableLogs() {
  {
    disabledDepth--;

    if (disabledDepth === 0) {
      /* eslint-disable react-internal/no-production-logging */
      var props = {
        configurable: true,
        enumerable: true,
        writable: true
      }; // $FlowFixMe Flow thinks console is immutable.

      Object.defineProperties(console, {
        log: assign({}, props, {
          value: prevLog
        }),
        info: assign({}, props, {
          value: prevInfo
        }),
        warn: assign({}, props, {
          value: prevWarn
        }),
        error: assign({}, props, {
          value: prevError
        }),
        group: assign({}, props, {
          value: prevGroup
        }),
        groupCollapsed: assign({}, props, {
          value: prevGroupCollapsed
        }),
        groupEnd: assign({}, props, {
          value: prevGroupEnd
        })
      });
      /* eslint-enable react-internal/no-production-logging */
    }

    if (disabledDepth < 0) {
      error(
        "disabledDepth fell below zero. " +
          "This is a bug in React. Please file an issue."
      );
    }
  }
}

var ReactSharedInternals =
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

var ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
var prefix;
function describeBuiltInComponentFrame(name, source, ownerFn) {
  {
    if (prefix === undefined) {
      // Extract the VM specific prefix used by each line.
      try {
        throw Error();
      } catch (x) {
        var match = x.stack.trim().match(/\n( *(at )?)/);
        prefix = (match && match[1]) || "";
      }
    } // We use the prefix to ensure our stacks line up with native stack frames.

    return "\n" + prefix + name;
  }
}
var reentry = false;
var componentFrameCache;

{
  var PossiblyWeakMap = typeof WeakMap === "function" ? WeakMap : Map;
  componentFrameCache = new PossiblyWeakMap();
}

function describeNativeComponentFrame(fn, construct) {
  // If something asked for a stack inside a fake render, it should get ignored.
  if (disableNativeComponentFrames || !fn || reentry) {
    return "";
  }

  {
    var frame = componentFrameCache.get(fn);

    if (frame !== undefined) {
      return frame;
    }
  }

  var control;
  reentry = true;
  var previousPrepareStackTrace = Error.prepareStackTrace; // $FlowFixMe It does accept undefined.

  Error.prepareStackTrace = undefined;
  var previousDispatcher;

  {
    previousDispatcher = ReactCurrentDispatcher.current; // Set the dispatcher in DEV because this might be call in the render function
    // for warnings.

    ReactCurrentDispatcher.current = null;
    disableLogs();
  }

  try {
    // This should throw.
    if (construct) {
      // Something should be setting the props in the constructor.
      var Fake = function() {
        throw Error();
      }; // $FlowFixMe

      Object.defineProperty(Fake.prototype, "props", {
        set: function() {
          // We use a throwing setter instead of frozen or non-writable props
          // because that won't throw in a non-strict mode function.
          throw Error();
        }
      });

      if (typeof Reflect === "object" && Reflect.construct) {
        // We construct a different control for this case to include any extra
        // frames added by the construct call.
        try {
          Reflect.construct(Fake, []);
        } catch (x) {
          control = x;
        }

        Reflect.construct(fn, [], Fake);
      } else {
        try {
          Fake.call();
        } catch (x) {
          control = x;
        } // $FlowFixMe[prop-missing] found when upgrading Flow

        fn.call(Fake.prototype);
      }
    } else {
      try {
        throw Error();
      } catch (x) {
        control = x;
      } // TODO(luna): This will currently only throw if the function component
      // tries to access React/ReactDOM/props. We should probably make this throw
      // in simple components too

      fn();
    }
  } catch (sample) {
    // This is inlined manually because closure doesn't do it for us.
    if (sample && control && typeof sample.stack === "string") {
      // This extracts the first frame from the sample that isn't also in the control.
      // Skipping one frame that we assume is the frame that calls the two.
      var sampleLines = sample.stack.split("\n");
      var controlLines = control.stack.split("\n");
      var s = sampleLines.length - 1;
      var c = controlLines.length - 1;

      while (s >= 1 && c >= 0 && sampleLines[s] !== controlLines[c]) {
        // We expect at least one stack frame to be shared.
        // Typically this will be the root most one. However, stack frames may be
        // cut off due to maximum stack limits. In this case, one maybe cut off
        // earlier than the other. We assume that the sample is longer or the same
        // and there for cut off earlier. So we should find the root most frame in
        // the sample somewhere in the control.
        c--;
      }

      for (; s >= 1 && c >= 0; s--, c--) {
        // Next we find the first one that isn't the same which should be the
        // frame that called our sample function and the control.
        if (sampleLines[s] !== controlLines[c]) {
          // In V8, the first line is describing the message but other VMs don't.
          // If we're about to return the first line, and the control is also on the same
          // line, that's a pretty good indicator that our sample threw at same line as
          // the control. I.e. before we entered the sample frame. So we ignore this result.
          // This can happen if you passed a class to function component, or non-function.
          if (s !== 1 || c !== 1) {
            do {
              s--;
              c--; // We may still have similar intermediate frames from the construct call.
              // The next one that isn't the same should be our match though.

              if (c < 0 || sampleLines[s] !== controlLines[c]) {
                // V8 adds a "new" prefix for native classes. Let's remove it to make it prettier.
                var _frame = "\n" + sampleLines[s].replace(" at new ", " at "); // If our component frame is labeled "<anonymous>"
                // but we have a user-provided "displayName"
                // splice it in to make the stack more readable.

                if (fn.displayName && _frame.includes("<anonymous>")) {
                  _frame = _frame.replace("<anonymous>", fn.displayName);
                }

                {
                  if (typeof fn === "function") {
                    componentFrameCache.set(fn, _frame);
                  }
                } // Return the line we found.

                return _frame;
              }
            } while (s >= 1 && c >= 0);
          }

          break;
        }
      }
    }
  } finally {
    reentry = false;

    {
      ReactCurrentDispatcher.current = previousDispatcher;
      reenableLogs();
    }

    Error.prepareStackTrace = previousPrepareStackTrace;
  } // Fallback to just using the name if we couldn't make it throw.

  var name = fn ? fn.displayName || fn.name : "";
  var syntheticFrame = name ? describeBuiltInComponentFrame(name) : "";

  {
    if (typeof fn === "function") {
      componentFrameCache.set(fn, syntheticFrame);
    }
  }

  return syntheticFrame;
}

function describeClassComponentFrame(ctor, source, ownerFn) {
  {
    return describeNativeComponentFrame(ctor, true);
  }
}
function describeFunctionComponentFrame(fn, source, ownerFn) {
  {
    return describeNativeComponentFrame(fn, false);
  }
}

var ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

var emptyContextObject = {};

{
  Object.freeze(emptyContextObject);
}

var rendererSigil;

{
  // Use this to detect multiple renderers using the same context
  rendererSigil = {};
} // Used to store the parent path of all context overrides in a shared linked list.
// Forming a reverse tree.
// The structure of a context snapshot is an implementation of this file.
// Currently, it's implemented as tracking the current active node.

var rootContextSnapshot = null; // We assume that this runtime owns the "current" field on all ReactContext instances.
// This global (actually thread local) state represents what state all those "current",
// fields are currently in.

var currentActiveSnapshot = null;

function popNode(prev) {
  {
    prev.context._currentValue2 = prev.parentValue;
  }
}

function pushNode(next) {
  {
    next.context._currentValue2 = next.value;
  }
}

function popToNearestCommonAncestor(prev, next) {
  if (prev === next);
  else {
    popNode(prev);
    var parentPrev = prev.parent;
    var parentNext = next.parent;

    if (parentPrev === null) {
      if (parentNext !== null) {
        throw new Error(
          "The stacks must reach the root at the same time. This is a bug in React."
        );
      }
    } else {
      if (parentNext === null) {
        throw new Error(
          "The stacks must reach the root at the same time. This is a bug in React."
        );
      }

      popToNearestCommonAncestor(parentPrev, parentNext);
    } // On the way back, we push the new ones that weren't common.

    pushNode(next);
  }
}

function popAllPrevious(prev) {
  popNode(prev);
  var parentPrev = prev.parent;

  if (parentPrev !== null) {
    popAllPrevious(parentPrev);
  }
}

function pushAllNext(next) {
  var parentNext = next.parent;

  if (parentNext !== null) {
    pushAllNext(parentNext);
  }

  pushNode(next);
}

function popPreviousToCommonLevel(prev, next) {
  popNode(prev);
  var parentPrev = prev.parent;

  if (parentPrev === null) {
    throw new Error(
      "The depth must equal at least at zero before reaching the root. This is a bug in React."
    );
  }

  if (parentPrev.depth === next.depth) {
    // We found the same level. Now we just need to find a shared ancestor.
    popToNearestCommonAncestor(parentPrev, next);
  } else {
    // We must still be deeper.
    popPreviousToCommonLevel(parentPrev, next);
  }
}

function popNextToCommonLevel(prev, next) {
  var parentNext = next.parent;

  if (parentNext === null) {
    throw new Error(
      "The depth must equal at least at zero before reaching the root. This is a bug in React."
    );
  }

  if (prev.depth === parentNext.depth) {
    // We found the same level. Now we just need to find a shared ancestor.
    popToNearestCommonAncestor(prev, parentNext);
  } else {
    // We must still be deeper.
    popNextToCommonLevel(prev, parentNext);
  }

  pushNode(next);
} // Perform context switching to the new snapshot.
// To make it cheap to read many contexts, while not suspending, we make the switch eagerly by
// updating all the context's current values. That way reads, always just read the current value.
// At the cost of updating contexts even if they're never read by this subtree.

function switchContext(newSnapshot) {
  // The basic algorithm we need to do is to pop back any contexts that are no longer on the stack.
  // We also need to update any new contexts that are now on the stack with the deepest value.
  // The easiest way to update new contexts is to just reapply them in reverse order from the
  // perspective of the backpointers. To avoid allocating a lot when switching, we use the stack
  // for that. Therefore this algorithm is recursive.
  // 1) First we pop which ever snapshot tree was deepest. Popping old contexts as we go.
  // 2) Then we find the nearest common ancestor from there. Popping old contexts as we go.
  // 3) Then we reapply new contexts on the way back up the stack.
  var prev = currentActiveSnapshot;
  var next = newSnapshot;

  if (prev !== next) {
    if (prev === null) {
      // $FlowFixMe: This has to be non-null since it's not equal to prev.
      pushAllNext(next);
    } else if (next === null) {
      popAllPrevious(prev);
    } else if (prev.depth === next.depth) {
      popToNearestCommonAncestor(prev, next);
    } else if (prev.depth > next.depth) {
      popPreviousToCommonLevel(prev, next);
    } else {
      popNextToCommonLevel(prev, next);
    }

    currentActiveSnapshot = next;
  }
}
function pushProvider(context, nextValue) {
  var prevValue;

  {
    prevValue = context._currentValue2;
    context._currentValue2 = nextValue;

    {
      if (
        context._currentRenderer2 !== undefined &&
        context._currentRenderer2 !== null &&
        context._currentRenderer2 !== rendererSigil
      ) {
        error(
          "Detected multiple renderers concurrently rendering the " +
            "same context provider. This is currently unsupported."
        );
      }

      context._currentRenderer2 = rendererSigil;
    }
  }

  var prevNode = currentActiveSnapshot;
  var newNode = {
    parent: prevNode,
    depth: prevNode === null ? 0 : prevNode.depth + 1,
    context: context,
    parentValue: prevValue,
    value: nextValue
  };
  currentActiveSnapshot = newNode;
  return newNode;
}
function popProvider(context) {
  var prevSnapshot = currentActiveSnapshot;

  if (prevSnapshot === null) {
    throw new Error(
      "Tried to pop a Context at the root of the app. This is a bug in React."
    );
  }

  {
    if (prevSnapshot.context !== context) {
      error(
        "The parent context is not the expected context. This is probably a bug in React."
      );
    }
  }

  {
    var _value = prevSnapshot.parentValue;

    if (_value === REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED) {
      prevSnapshot.context._currentValue2 = prevSnapshot.context._defaultValue;
    } else {
      prevSnapshot.context._currentValue2 = _value;
    }

    {
      if (
        context._currentRenderer2 !== undefined &&
        context._currentRenderer2 !== null &&
        context._currentRenderer2 !== rendererSigil
      ) {
        error(
          "Detected multiple renderers concurrently rendering the " +
            "same context provider. This is currently unsupported."
        );
      }

      context._currentRenderer2 = rendererSigil;
    }
  }

  return (currentActiveSnapshot = prevSnapshot.parent);
}
function getActiveContext() {
  return currentActiveSnapshot;
}
function readContext(context) {
  var value = context._currentValue2;
  return value;
}

/**
 * `ReactInstanceMap` maintains a mapping from a public facing stateful
 * instance (key) and the internal representation (value). This allows public
 * methods to accept the user facing instance as an argument and map them back
 * to internal methods.
 *
 * Note that this module is currently shared and assumed to be stateless.
 * If this becomes an actual Map, that will break.
 */
function get(key) {
  return key._reactInternals;
}
function set(key, value) {
  key._reactInternals = value;
}

var didWarnAboutNoopUpdateForComponent = {};
var didWarnAboutDeprecatedWillMount = {};
var didWarnAboutUninitializedState;
var didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate;
var didWarnAboutLegacyLifecyclesAndDerivedState;
var didWarnAboutUndefinedDerivedState;
var warnOnUndefinedDerivedState;
var warnOnInvalidCallback;
var didWarnAboutDirectlyAssigningPropsToState;
var didWarnAboutInvalidateContextType;

{
  didWarnAboutUninitializedState = new Set();
  didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate = new Set();
  didWarnAboutLegacyLifecyclesAndDerivedState = new Set();
  didWarnAboutDirectlyAssigningPropsToState = new Set();
  didWarnAboutUndefinedDerivedState = new Set();
  didWarnAboutInvalidateContextType = new Set();
  var didWarnOnInvalidCallback = new Set();

  warnOnInvalidCallback = function(callback, callerName) {
    if (callback === null || typeof callback === "function") {
      return;
    }

    var key = callerName + "_" + callback;

    if (!didWarnOnInvalidCallback.has(key)) {
      didWarnOnInvalidCallback.add(key);

      error(
        "%s(...): Expected the last optional `callback` argument to be a " +
          "function. Instead received: %s.",
        callerName,
        callback
      );
    }
  };

  warnOnUndefinedDerivedState = function(type, partialState) {
    if (partialState === undefined) {
      var componentName = getComponentNameFromType(type) || "Component";

      if (!didWarnAboutUndefinedDerivedState.has(componentName)) {
        didWarnAboutUndefinedDerivedState.add(componentName);

        error(
          "%s.getDerivedStateFromProps(): A valid state object (or null) must be returned. " +
            "You have returned undefined.",
          componentName
        );
      }
    }
  };
}

function warnNoop(publicInstance, callerName) {
  {
    var _constructor = publicInstance.constructor;
    var componentName =
      (_constructor && getComponentNameFromType(_constructor)) || "ReactClass";
    var warningKey = componentName + "." + callerName;

    if (didWarnAboutNoopUpdateForComponent[warningKey]) {
      return;
    }

    error(
      "%s(...): Can only update a mounting component. " +
        "This usually means you called %s() outside componentWillMount() on the server. " +
        "This is a no-op.\n\nPlease check the code for the %s component.",
      callerName,
      callerName,
      componentName
    );

    didWarnAboutNoopUpdateForComponent[warningKey] = true;
  }
}

var classComponentUpdater = {
  isMounted: function(inst) {
    return false;
  },
  // $FlowFixMe[missing-local-annot]
  enqueueSetState: function(inst, payload, callback) {
    var internals = get(inst);

    if (internals.queue === null) {
      warnNoop(inst, "setState");
    } else {
      internals.queue.push(payload);

      {
        if (callback !== undefined && callback !== null) {
          warnOnInvalidCallback(callback, "setState");
        }
      }
    }
  },
  enqueueReplaceState: function(inst, payload, callback) {
    var internals = get(inst);
    internals.replace = true;
    internals.queue = [payload];

    {
      if (callback !== undefined && callback !== null) {
        warnOnInvalidCallback(callback, "setState");
      }
    }
  },
  // $FlowFixMe[missing-local-annot]
  enqueueForceUpdate: function(inst, callback) {
    var internals = get(inst);

    if (internals.queue === null) {
      warnNoop(inst, "forceUpdate");
    } else {
      {
        if (callback !== undefined && callback !== null) {
          warnOnInvalidCallback(callback, "setState");
        }
      }
    }
  }
};

function applyDerivedStateFromProps(
  instance,
  ctor,
  getDerivedStateFromProps,
  prevState,
  nextProps
) {
  var partialState = getDerivedStateFromProps(nextProps, prevState);

  {
    warnOnUndefinedDerivedState(ctor, partialState);
  } // Merge the partial state and the previous state.

  var newState =
    partialState === null || partialState === undefined
      ? prevState
      : assign({}, prevState, partialState);
  return newState;
}

function constructClassInstance(ctor, props, maskedLegacyContext) {
  var context = emptyContextObject;
  var contextType = ctor.contextType;

  {
    if ("contextType" in ctor) {
      var isValid = // Allow null for conditional declaration
        contextType === null ||
        (contextType !== undefined &&
          contextType.$$typeof === REACT_CONTEXT_TYPE &&
          contextType._context === undefined); // Not a <Context.Consumer>

      if (!isValid && !didWarnAboutInvalidateContextType.has(ctor)) {
        didWarnAboutInvalidateContextType.add(ctor);
        var addendum = "";

        if (contextType === undefined) {
          addendum =
            " However, it is set to undefined. " +
            "This can be caused by a typo or by mixing up named and default imports. " +
            "This can also happen due to a circular dependency, so " +
            "try moving the createContext() call to a separate file.";
        } else if (typeof contextType !== "object") {
          addendum = " However, it is set to a " + typeof contextType + ".";
        } else if (contextType.$$typeof === REACT_PROVIDER_TYPE) {
          addendum = " Did you accidentally pass the Context.Provider instead?";
        } else if (contextType._context !== undefined) {
          // <Context.Consumer>
          addendum = " Did you accidentally pass the Context.Consumer instead?";
        } else {
          addendum =
            " However, it is set to an object with keys {" +
            Object.keys(contextType).join(", ") +
            "}.";
        }

        error(
          "%s defines an invalid contextType. " +
            "contextType should point to the Context object returned by React.createContext().%s",
          getComponentNameFromType(ctor) || "Component",
          addendum
        );
      }
    }
  }

  if (typeof contextType === "object" && contextType !== null) {
    context = readContext(contextType);
  }

  var instance = new ctor(props, context);

  {
    if (
      typeof ctor.getDerivedStateFromProps === "function" &&
      (instance.state === null || instance.state === undefined)
    ) {
      var componentName = getComponentNameFromType(ctor) || "Component";

      if (!didWarnAboutUninitializedState.has(componentName)) {
        didWarnAboutUninitializedState.add(componentName);

        error(
          "`%s` uses `getDerivedStateFromProps` but its initial state is " +
            "%s. This is not recommended. Instead, define the initial state by " +
            "assigning an object to `this.state` in the constructor of `%s`. " +
            "This ensures that `getDerivedStateFromProps` arguments have a consistent shape.",
          componentName,
          instance.state === null ? "null" : "undefined",
          componentName
        );
      }
    } // If new component APIs are defined, "unsafe" lifecycles won't be called.
    // Warn about these lifecycles if they are present.
    // Don't warn about react-lifecycles-compat polyfilled methods though.

    if (
      typeof ctor.getDerivedStateFromProps === "function" ||
      typeof instance.getSnapshotBeforeUpdate === "function"
    ) {
      var foundWillMountName = null;
      var foundWillReceivePropsName = null;
      var foundWillUpdateName = null;

      if (
        typeof instance.componentWillMount === "function" &&
        instance.componentWillMount.__suppressDeprecationWarning !== true
      ) {
        foundWillMountName = "componentWillMount";
      } else if (typeof instance.UNSAFE_componentWillMount === "function") {
        foundWillMountName = "UNSAFE_componentWillMount";
      }

      if (
        typeof instance.componentWillReceiveProps === "function" &&
        instance.componentWillReceiveProps.__suppressDeprecationWarning !== true
      ) {
        foundWillReceivePropsName = "componentWillReceiveProps";
      } else if (
        typeof instance.UNSAFE_componentWillReceiveProps === "function"
      ) {
        foundWillReceivePropsName = "UNSAFE_componentWillReceiveProps";
      }

      if (
        typeof instance.componentWillUpdate === "function" &&
        instance.componentWillUpdate.__suppressDeprecationWarning !== true
      ) {
        foundWillUpdateName = "componentWillUpdate";
      } else if (typeof instance.UNSAFE_componentWillUpdate === "function") {
        foundWillUpdateName = "UNSAFE_componentWillUpdate";
      }

      if (
        foundWillMountName !== null ||
        foundWillReceivePropsName !== null ||
        foundWillUpdateName !== null
      ) {
        var _componentName = getComponentNameFromType(ctor) || "Component";

        var newApiName =
          typeof ctor.getDerivedStateFromProps === "function"
            ? "getDerivedStateFromProps()"
            : "getSnapshotBeforeUpdate()";

        if (!didWarnAboutLegacyLifecyclesAndDerivedState.has(_componentName)) {
          didWarnAboutLegacyLifecyclesAndDerivedState.add(_componentName);

          error(
            "Unsafe legacy lifecycles will not be called for components using new component APIs.\n\n" +
              "%s uses %s but also contains the following legacy lifecycles:%s%s%s\n\n" +
              "The above lifecycles should be removed. Learn more about this warning here:\n" +
              "https://reactjs.org/link/unsafe-component-lifecycles",
            _componentName,
            newApiName,
            foundWillMountName !== null ? "\n  " + foundWillMountName : "",
            foundWillReceivePropsName !== null
              ? "\n  " + foundWillReceivePropsName
              : "",
            foundWillUpdateName !== null ? "\n  " + foundWillUpdateName : ""
          );
        }
      }
    }
  }

  return instance;
}

function checkClassInstance(instance, ctor, newProps) {
  {
    var name = getComponentNameFromType(ctor) || "Component";
    var renderPresent = instance.render;

    if (!renderPresent) {
      if (ctor.prototype && typeof ctor.prototype.render === "function") {
        error(
          "%s(...): No `render` method found on the returned component " +
            "instance: did you accidentally return an object from the constructor?",
          name
        );
      } else {
        error(
          "%s(...): No `render` method found on the returned component " +
            "instance: you may have forgotten to define `render`.",
          name
        );
      }
    }

    if (
      instance.getInitialState &&
      !instance.getInitialState.isReactClassApproved &&
      !instance.state
    ) {
      error(
        "getInitialState was defined on %s, a plain JavaScript class. " +
          "This is only supported for classes created using React.createClass. " +
          "Did you mean to define a state property instead?",
        name
      );
    }

    if (
      instance.getDefaultProps &&
      !instance.getDefaultProps.isReactClassApproved
    ) {
      error(
        "getDefaultProps was defined on %s, a plain JavaScript class. " +
          "This is only supported for classes created using React.createClass. " +
          "Use a static property to define defaultProps instead.",
        name
      );
    }

    if (instance.propTypes) {
      error(
        "propTypes was defined as an instance property on %s. Use a static " +
          "property to define propTypes instead.",
        name
      );
    }

    if (instance.contextType) {
      error(
        "contextType was defined as an instance property on %s. Use a static " +
          "property to define contextType instead.",
        name
      );
    }

    {
      if (ctor.childContextTypes) {
        error(
          "%s uses the legacy childContextTypes API which is no longer supported. " +
            "Use React.createContext() instead.",
          name
        );
      }

      if (ctor.contextTypes) {
        error(
          "%s uses the legacy contextTypes API which is no longer supported. " +
            "Use React.createContext() with static contextType instead.",
          name
        );
      }
    }

    if (typeof instance.componentShouldUpdate === "function") {
      error(
        "%s has a method called " +
          "componentShouldUpdate(). Did you mean shouldComponentUpdate()? " +
          "The name is phrased as a question because the function is " +
          "expected to return a value.",
        name
      );
    }

    if (
      ctor.prototype &&
      ctor.prototype.isPureReactComponent &&
      typeof instance.shouldComponentUpdate !== "undefined"
    ) {
      error(
        "%s has a method called shouldComponentUpdate(). " +
          "shouldComponentUpdate should not be used when extending React.PureComponent. " +
          "Please extend React.Component if shouldComponentUpdate is used.",
        getComponentNameFromType(ctor) || "A pure component"
      );
    }

    if (typeof instance.componentDidUnmount === "function") {
      error(
        "%s has a method called " +
          "componentDidUnmount(). But there is no such lifecycle method. " +
          "Did you mean componentWillUnmount()?",
        name
      );
    }

    if (typeof instance.componentDidReceiveProps === "function") {
      error(
        "%s has a method called " +
          "componentDidReceiveProps(). But there is no such lifecycle method. " +
          "If you meant to update the state in response to changing props, " +
          "use componentWillReceiveProps(). If you meant to fetch data or " +
          "run side-effects or mutations after React has updated the UI, use componentDidUpdate().",
        name
      );
    }

    if (typeof instance.componentWillRecieveProps === "function") {
      error(
        "%s has a method called " +
          "componentWillRecieveProps(). Did you mean componentWillReceiveProps()?",
        name
      );
    }

    if (typeof instance.UNSAFE_componentWillRecieveProps === "function") {
      error(
        "%s has a method called " +
          "UNSAFE_componentWillRecieveProps(). Did you mean UNSAFE_componentWillReceiveProps()?",
        name
      );
    }

    var hasMutatedProps = instance.props !== newProps;

    if (instance.props !== undefined && hasMutatedProps) {
      error(
        "%s(...): When calling super() in `%s`, make sure to pass " +
          "up the same props that your component's constructor was passed.",
        name,
        name
      );
    }

    if (instance.defaultProps) {
      error(
        "Setting defaultProps as an instance property on %s is not supported and will be ignored." +
          " Instead, define defaultProps as a static property on %s.",
        name,
        name
      );
    }

    if (
      typeof instance.getSnapshotBeforeUpdate === "function" &&
      typeof instance.componentDidUpdate !== "function" &&
      !didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.has(ctor)
    ) {
      didWarnAboutGetSnapshotBeforeUpdateWithoutDidUpdate.add(ctor);

      error(
        "%s: getSnapshotBeforeUpdate() should be used with componentDidUpdate(). " +
          "This component defines getSnapshotBeforeUpdate() only.",
        getComponentNameFromType(ctor)
      );
    }

    if (typeof instance.getDerivedStateFromProps === "function") {
      error(
        "%s: getDerivedStateFromProps() is defined as an instance method " +
          "and will be ignored. Instead, declare it as a static method.",
        name
      );
    }

    if (typeof instance.getDerivedStateFromError === "function") {
      error(
        "%s: getDerivedStateFromError() is defined as an instance method " +
          "and will be ignored. Instead, declare it as a static method.",
        name
      );
    }

    if (typeof ctor.getSnapshotBeforeUpdate === "function") {
      error(
        "%s: getSnapshotBeforeUpdate() is defined as a static method " +
          "and will be ignored. Instead, declare it as an instance method.",
        name
      );
    }

    var state = instance.state;

    if (state && (typeof state !== "object" || isArray(state))) {
      error("%s.state: must be set to an object or null", name);
    }

    if (
      typeof instance.getChildContext === "function" &&
      typeof ctor.childContextTypes !== "object"
    ) {
      error(
        "%s.getChildContext(): childContextTypes must be defined in order to " +
          "use getChildContext().",
        name
      );
    }
  }
}

function callComponentWillMount(type, instance) {
  var oldState = instance.state;

  if (typeof instance.componentWillMount === "function") {
    {
      if (instance.componentWillMount.__suppressDeprecationWarning !== true) {
        var componentName = getComponentNameFromType(type) || "Unknown";

        if (!didWarnAboutDeprecatedWillMount[componentName]) {
          warn(
            // keep this warning in sync with ReactStrictModeWarning.js
            "componentWillMount has been renamed, and is not recommended for use. " +
              "See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n" +
              "* Move code from componentWillMount to componentDidMount (preferred in most cases) " +
              "or the constructor.\n" +
              "\nPlease update the following components: %s",
            componentName
          );

          didWarnAboutDeprecatedWillMount[componentName] = true;
        }
      }
    }

    instance.componentWillMount();
  }

  if (typeof instance.UNSAFE_componentWillMount === "function") {
    instance.UNSAFE_componentWillMount();
  }

  if (oldState !== instance.state) {
    {
      error(
        "%s.componentWillMount(): Assigning directly to this.state is " +
          "deprecated (except inside a component's " +
          "constructor). Use setState instead.",
        getComponentNameFromType(type) || "Component"
      );
    }

    classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
  }
}

function processUpdateQueue(
  internalInstance,
  inst,
  props,
  maskedLegacyContext
) {
  if (internalInstance.queue !== null && internalInstance.queue.length > 0) {
    var oldQueue = internalInstance.queue;
    var oldReplace = internalInstance.replace;
    internalInstance.queue = null;
    internalInstance.replace = false;

    if (oldReplace && oldQueue.length === 1) {
      inst.state = oldQueue[0];
    } else {
      var nextState = oldReplace ? oldQueue[0] : inst.state;
      var dontMutate = true;

      for (var i = oldReplace ? 1 : 0; i < oldQueue.length; i++) {
        var partial = oldQueue[i];
        var partialState =
          typeof partial === "function"
            ? partial.call(inst, nextState, props, maskedLegacyContext)
            : partial;

        if (partialState != null) {
          if (dontMutate) {
            dontMutate = false;
            nextState = assign({}, nextState, partialState);
          } else {
            assign(nextState, partialState);
          }
        }
      }

      inst.state = nextState;
    }
  } else {
    internalInstance.queue = null;
  }
} // Invokes the mount life-cycles on a previously never rendered instance.

function mountClassInstance(instance, ctor, newProps, maskedLegacyContext) {
  {
    checkClassInstance(instance, ctor, newProps);
  }

  var initialState = instance.state !== undefined ? instance.state : null;
  instance.updater = classComponentUpdater;
  instance.props = newProps;
  instance.state = initialState; // We don't bother initializing the refs object on the server, since we're not going to resolve them anyway.
  // The internal instance will be used to manage updates that happen during this mount.

  var internalInstance = {
    queue: [],
    replace: false
  };
  set(instance, internalInstance);
  var contextType = ctor.contextType;

  if (typeof contextType === "object" && contextType !== null) {
    instance.context = readContext(contextType);
  } else {
    instance.context = emptyContextObject;
  }

  {
    if (instance.state === newProps) {
      var componentName = getComponentNameFromType(ctor) || "Component";

      if (!didWarnAboutDirectlyAssigningPropsToState.has(componentName)) {
        didWarnAboutDirectlyAssigningPropsToState.add(componentName);

        error(
          "%s: It is not recommended to assign props directly to state " +
            "because updates to props won't be reflected in state. " +
            "In most cases, it is better to use props directly.",
          componentName
        );
      }
    }
  }

  var getDerivedStateFromProps = ctor.getDerivedStateFromProps;

  if (typeof getDerivedStateFromProps === "function") {
    instance.state = applyDerivedStateFromProps(
      instance,
      ctor,
      getDerivedStateFromProps,
      initialState,
      newProps
    );
  } // In order to support react-lifecycles-compat polyfilled components,
  // Unsafe lifecycles should not be invoked for components using the new APIs.

  if (
    typeof ctor.getDerivedStateFromProps !== "function" &&
    typeof instance.getSnapshotBeforeUpdate !== "function" &&
    (typeof instance.UNSAFE_componentWillMount === "function" ||
      typeof instance.componentWillMount === "function")
  ) {
    callComponentWillMount(ctor, instance); // If we had additional state updates during this life-cycle, let's
    // process them now.

    processUpdateQueue(
      internalInstance,
      instance,
      newProps,
      maskedLegacyContext
    );
  }
}

// Ids are base 32 strings whose binary representation corresponds to the
// position of a node in a tree.
// Every time the tree forks into multiple children, we add additional bits to
// the left of the sequence that represent the position of the child within the
// current level of children.
//
//      00101       00010001011010101
//      ╰─┬─╯       ╰───────┬───────╯
//   Fork 5 of 20       Parent id
//
// The leading 0s are important. In the above example, you only need 3 bits to
// represent slot 5. However, you need 5 bits to represent all the forks at
// the current level, so we must account for the empty bits at the end.
//
// For this same reason, slots are 1-indexed instead of 0-indexed. Otherwise,
// the zeroth id at a level would be indistinguishable from its parent.
//
// If a node has only one child, and does not materialize an id (i.e. does not
// contain a useId hook), then we don't need to allocate any space in the
// sequence. It's treated as a transparent indirection. For example, these two
// trees produce the same ids:
//
// <>                          <>
//   <Indirection>               <A />
//     <A />                     <B />
//   </Indirection>            </>
//   <B />
// </>
//
// However, we cannot skip any node that materializes an id. Otherwise, a parent
// id that does not fork would be indistinguishable from its child id. For
// example, this tree does not fork, but the parent and child must have
// different ids.
//
// <Parent>
//   <Child />
// </Parent>
//
// To handle this scenario, every time we materialize an id, we allocate a
// new level with a single slot. You can think of this as a fork with only one
// prong, or an array of children with length 1.
//
// It's possible for the size of the sequence to exceed 32 bits, the max
// size for bitwise operations. When this happens, we make more room by
// converting the right part of the id to a string and storing it in an overflow
// variable. We use a base 32 string representation, because 32 is the largest
// power of 2 that is supported by toString(). We want the base to be large so
// that the resulting ids are compact, and we want the base to be a power of 2
// because every log2(base) bits corresponds to a single character, i.e. every
// log2(32) = 5 bits. That means we can lop bits off the end 5 at a time without
// affecting the final result.
var emptyTreeContext = {
  id: 1,
  overflow: ""
};
function getTreeId(context) {
  var overflow = context.overflow;
  var idWithLeadingBit = context.id;
  var id = idWithLeadingBit & ~getLeadingBit(idWithLeadingBit);
  return id.toString(32) + overflow;
}
function pushTreeContext(baseContext, totalChildren, index) {
  var baseIdWithLeadingBit = baseContext.id;
  var baseOverflow = baseContext.overflow; // The leftmost 1 marks the end of the sequence, non-inclusive. It's not part
  // of the id; we use it to account for leading 0s.

  var baseLength = getBitLength(baseIdWithLeadingBit) - 1;
  var baseId = baseIdWithLeadingBit & ~(1 << baseLength);
  var slot = index + 1;
  var length = getBitLength(totalChildren) + baseLength; // 30 is the max length we can store without overflowing, taking into
  // consideration the leading 1 we use to mark the end of the sequence.

  if (length > 30) {
    // We overflowed the bitwise-safe range. Fall back to slower algorithm.
    // This branch assumes the length of the base id is greater than 5; it won't
    // work for smaller ids, because you need 5 bits per character.
    //
    // We encode the id in multiple steps: first the base id, then the
    // remaining digits.
    //
    // Each 5 bit sequence corresponds to a single base 32 character. So for
    // example, if the current id is 23 bits long, we can convert 20 of those
    // bits into a string of 4 characters, with 3 bits left over.
    //
    // First calculate how many bits in the base id represent a complete
    // sequence of characters.
    var numberOfOverflowBits = baseLength - (baseLength % 5); // Then create a bitmask that selects only those bits.

    var newOverflowBits = (1 << numberOfOverflowBits) - 1; // Select the bits, and convert them to a base 32 string.

    var newOverflow = (baseId & newOverflowBits).toString(32); // Now we can remove those bits from the base id.

    var restOfBaseId = baseId >> numberOfOverflowBits;
    var restOfBaseLength = baseLength - numberOfOverflowBits; // Finally, encode the rest of the bits using the normal algorithm. Because
    // we made more room, this time it won't overflow.

    var restOfLength = getBitLength(totalChildren) + restOfBaseLength;
    var restOfNewBits = slot << restOfBaseLength;
    var id = restOfNewBits | restOfBaseId;
    var overflow = newOverflow + baseOverflow;
    return {
      id: (1 << restOfLength) | id,
      overflow: overflow
    };
  } else {
    // Normal path
    var newBits = slot << baseLength;

    var _id = newBits | baseId;

    var _overflow = baseOverflow;
    return {
      id: (1 << length) | _id,
      overflow: _overflow
    };
  }
}

function getBitLength(number) {
  return 32 - clz32(number);
}

function getLeadingBit(id) {
  return 1 << (getBitLength(id) - 1);
} // TODO: Math.clz32 is supported in Node 12+. Maybe we can drop the fallback.

var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback; // Count leading zeros.
// Based on:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

var log = Math.log;
var LN2 = Math.LN2;

function clz32Fallback(x) {
  var asUint = x >>> 0;

  if (asUint === 0) {
    return 32;
  }

  return (31 - ((log(asUint) / LN2) | 0)) | 0;
}

// Corresponds to ReactFiberWakeable and ReactFlightWakeable modules. Generally,
// changes to one module should be reflected in the others.
// TODO: Rename this module and the corresponding Fiber one to "Thenable"
// instead of "Wakeable". Or some other more appropriate name.
// An error that is thrown (e.g. by `use`) to trigger Suspense. If we
// detect this is caught by userspace, we'll log a warning in development.
var SuspenseException = new Error(
  "Suspense Exception: This is not a real error! It's an implementation " +
    "detail of `use` to interrupt the current render. You must either " +
    "rethrow it immediately, or move the `use` call outside of the " +
    "`try/catch` block. Capturing without rethrowing will lead to " +
    "unexpected behavior.\n\n" +
    "To handle async errors, wrap your component in an error boundary, or " +
    "call the promise's `.catch` method and pass the result to `use`"
);
function createThenableState() {
  // The ThenableState is created the first time a component suspends. If it
  // suspends again, we'll reuse the same state.
  return [];
}

function noop() {}

function trackUsedThenable(thenableState, thenable, index) {
  var previous = thenableState[index];

  if (previous === undefined) {
    thenableState.push(thenable);
  } else {
    if (previous !== thenable) {
      // Reuse the previous thenable, and drop the new one. We can assume
      // they represent the same value, because components are idempotent.
      // Avoid an unhandled rejection errors for the Promises that we'll
      // intentionally ignore.
      thenable.then(noop, noop);
      thenable = previous;
    }
  } // We use an expando to track the status and result of a thenable so that we
  // can synchronously unwrap the value. Think of this as an extension of the
  // Promise API, or a custom interface that is a superset of Thenable.
  //
  // If the thenable doesn't have a status, set it to "pending" and attach
  // a listener that will update its status and result when it resolves.

  switch (thenable.status) {
    case "fulfilled": {
      var fulfilledValue = thenable.value;
      return fulfilledValue;
    }

    case "rejected": {
      var rejectedError = thenable.reason;
      throw rejectedError;
    }

    default: {
      if (typeof thenable.status === "string");
      else {
        var pendingThenable = thenable;
        pendingThenable.status = "pending";
        pendingThenable.then(
          function(fulfilledValue) {
            if (thenable.status === "pending") {
              var fulfilledThenable = thenable;
              fulfilledThenable.status = "fulfilled";
              fulfilledThenable.value = fulfilledValue;
            }
          },
          function(error) {
            if (thenable.status === "pending") {
              var rejectedThenable = thenable;
              rejectedThenable.status = "rejected";
              rejectedThenable.reason = error;
            }
          }
        ); // Check one more time in case the thenable resolved synchronously

        switch (thenable.status) {
          case "fulfilled": {
            var fulfilledThenable = thenable;
            return fulfilledThenable.value;
          }

          case "rejected": {
            var rejectedThenable = thenable;
            throw rejectedThenable.reason;
          }
        }
      } // Suspend.
      //
      // Throwing here is an implementation detail that allows us to unwind the
      // call stack. But we shouldn't allow it to leak into userspace. Throw an
      // opaque placeholder value instead of the actual thenable. If it doesn't
      // get captured by the work loop, log a warning, because that means
      // something in userspace must have caught it.

      suspendedThenable = thenable;
      throw SuspenseException;
    }
  }
} // This is used to track the actual thenable that suspended so it can be
// passed to the rest of the Suspense implementation — which, for historical
// reasons, expects to receive a thenable.

var suspendedThenable = null;
function getSuspendedThenable() {
  // This is called right after `use` suspends by throwing an exception. `use`
  // throws an opaque value instead of the thenable itself so that it can't be
  // caught in userspace. Then the work loop accesses the actual thenable using
  // this function.
  if (suspendedThenable === null) {
    throw new Error(
      "Expected a suspended thenable. This is a bug in React. Please file " +
        "an issue."
    );
  }

  var thenable = suspendedThenable;
  suspendedThenable = null;
  return thenable;
}

/**
 * inlined Object.is polyfill to avoid requiring consumers ship their own
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
 */
function is(x, y) {
  return (
    (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y) // eslint-disable-line no-self-compare
  );
}

var objectIs = typeof Object.is === "function" ? Object.is : is; // $FlowFixMe[method-unbinding]

var currentlyRenderingComponent = null;
var currentlyRenderingTask = null;
var firstWorkInProgressHook = null;
var workInProgressHook = null; // Whether the work-in-progress hook is a re-rendered hook

var isReRender = false; // Whether an update was scheduled during the currently executing render pass.

var didScheduleRenderPhaseUpdate = false; // Counts the number of useId hooks in this component

var localIdCounter = 0; // Counts the number of use(thenable) calls in this component

var thenableIndexCounter = 0;
var thenableState = null; // Lazily created map of render-phase updates

var renderPhaseUpdates = null; // Counter to prevent infinite loops.

var numberOfReRenders = 0;
var RE_RENDER_LIMIT = 25;
var isInHookUserCodeInDev = false; // In DEV, this is the name of the currently executing primitive hook

var currentHookNameInDev;

function resolveCurrentlyRenderingComponent() {
  if (currentlyRenderingComponent === null) {
    throw new Error(
      "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for" +
        " one of the following reasons:\n" +
        "1. You might have mismatching versions of React and the renderer (such as React DOM)\n" +
        "2. You might be breaking the Rules of Hooks\n" +
        "3. You might have more than one copy of React in the same app\n" +
        "See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem."
    );
  }

  {
    if (isInHookUserCodeInDev) {
      error(
        "Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. " +
          "You can only call Hooks at the top level of your React function. " +
          "For more information, see " +
          "https://reactjs.org/link/rules-of-hooks"
      );
    }
  }

  return currentlyRenderingComponent;
}

function areHookInputsEqual(nextDeps, prevDeps) {
  if (prevDeps === null) {
    {
      error(
        "%s received a final argument during this render, but not during " +
          "the previous render. Even though the final argument is optional, " +
          "its type cannot change between renders.",
        currentHookNameInDev
      );
    }

    return false;
  }

  {
    // Don't bother comparing lengths in prod because these arrays should be
    // passed inline.
    if (nextDeps.length !== prevDeps.length) {
      error(
        "The final argument passed to %s changed size between renders. The " +
          "order and size of this array must remain constant.\n\n" +
          "Previous: %s\n" +
          "Incoming: %s",
        currentHookNameInDev,
        "[" + nextDeps.join(", ") + "]",
        "[" + prevDeps.join(", ") + "]"
      );
    }
  } // $FlowFixMe[incompatible-use] found when upgrading Flow

  for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
    // $FlowFixMe[incompatible-use] found when upgrading Flow
    if (objectIs(nextDeps[i], prevDeps[i])) {
      continue;
    }

    return false;
  }

  return true;
}

function createHook() {
  if (numberOfReRenders > 0) {
    throw new Error("Rendered more hooks than during the previous render");
  }

  return {
    memoizedState: null,
    queue: null,
    next: null
  };
}

function createWorkInProgressHook() {
  if (workInProgressHook === null) {
    // This is the first hook in the list
    if (firstWorkInProgressHook === null) {
      isReRender = false;
      firstWorkInProgressHook = workInProgressHook = createHook();
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true;
      workInProgressHook = firstWorkInProgressHook;
    }
  } else {
    if (workInProgressHook.next === null) {
      isReRender = false; // Append to the end of the list

      workInProgressHook = workInProgressHook.next = createHook();
    } else {
      // There's already a work-in-progress. Reuse it.
      isReRender = true;
      workInProgressHook = workInProgressHook.next;
    }
  }

  return workInProgressHook;
}

function prepareToUseHooks(task, componentIdentity, prevThenableState) {
  currentlyRenderingComponent = componentIdentity;
  currentlyRenderingTask = task;

  {
    isInHookUserCodeInDev = false;
  } // The following should have already been reset
  // didScheduleRenderPhaseUpdate = false;
  // firstWorkInProgressHook = null;
  // numberOfReRenders = 0;
  // renderPhaseUpdates = null;
  // workInProgressHook = null;

  localIdCounter = 0;
  thenableIndexCounter = 0;
  thenableState = prevThenableState;
}
function finishHooks(Component, props, children, refOrContext) {
  // This must be called after every function component to prevent hooks from
  // being used in classes.
  while (didScheduleRenderPhaseUpdate) {
    // Updates were scheduled during the render phase. They are stored in
    // the `renderPhaseUpdates` map. Call the component again, reusing the
    // work-in-progress hooks and applying the additional updates on top. Keep
    // restarting until no more updates are scheduled.
    didScheduleRenderPhaseUpdate = false;
    localIdCounter = 0;
    thenableIndexCounter = 0;
    numberOfReRenders += 1; // Start over from the beginning of the list

    workInProgressHook = null;
    children = Component(props, refOrContext);
  }

  resetHooksState();
  return children;
}
function getThenableStateAfterSuspending() {
  var state = thenableState;
  thenableState = null;
  return state;
}
function checkDidRenderIdHook() {
  // This should be called immediately after every finishHooks call.
  // Conceptually, it's part of the return value of finishHooks; it's only a
  // separate function to avoid using an array tuple.
  var didRenderIdHook = localIdCounter !== 0;
  return didRenderIdHook;
} // Reset the internal hooks state if an error occurs while rendering a component

function resetHooksState() {
  {
    isInHookUserCodeInDev = false;
  }

  currentlyRenderingComponent = null;
  currentlyRenderingTask = null;
  didScheduleRenderPhaseUpdate = false;
  firstWorkInProgressHook = null;
  numberOfReRenders = 0;
  renderPhaseUpdates = null;
  workInProgressHook = null;
}

function readContext$1(context) {
  {
    if (isInHookUserCodeInDev) {
      error(
        "Context can only be read while React is rendering. " +
          "In classes, you can read it in the render method or getDerivedStateFromProps. " +
          "In function components, you can read it directly in the function body, but not " +
          "inside Hooks like useReducer() or useMemo()."
      );
    }
  }

  return readContext(context);
}

function useContext(context) {
  {
    currentHookNameInDev = "useContext";
  }

  resolveCurrentlyRenderingComponent();
  return readContext(context);
}

function basicStateReducer(state, action) {
  // $FlowFixMe: Flow doesn't like mixed types
  return typeof action === "function" ? action(state) : action;
}

function useState(initialState) {
  {
    currentHookNameInDev = "useState";
  }

  return useReducer(
    basicStateReducer, // useReducer has a special case to support lazy useState initializers
    initialState
  );
}
function useReducer(reducer, initialArg, init) {
  {
    if (reducer !== basicStateReducer) {
      currentHookNameInDev = "useReducer";
    }
  }

  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();

  if (isReRender) {
    // This is a re-render. Apply the new render phase updates to the previous
    // current hook.
    var queue = workInProgressHook.queue;
    var dispatch = queue.dispatch;

    if (renderPhaseUpdates !== null) {
      // Render phase updates are stored in a map of queue -> linked list
      var firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);

      if (firstRenderPhaseUpdate !== undefined) {
        // $FlowFixMe[incompatible-use] found when upgrading Flow
        renderPhaseUpdates.delete(queue); // $FlowFixMe[incompatible-use] found when upgrading Flow

        var newState = workInProgressHook.memoizedState;
        var update = firstRenderPhaseUpdate;

        do {
          // Process this render phase update. We don't have to check the
          // priority because it will always be the same as the current
          // render's.
          var action = update.action;

          {
            isInHookUserCodeInDev = true;
          }

          newState = reducer(newState, action);

          {
            isInHookUserCodeInDev = false;
          } // $FlowFixMe[incompatible-type] we bail out when we get a null

          update = update.next;
        } while (update !== null); // $FlowFixMe[incompatible-use] found when upgrading Flow

        workInProgressHook.memoizedState = newState;
        return [newState, dispatch];
      }
    } // $FlowFixMe[incompatible-use] found when upgrading Flow

    return [workInProgressHook.memoizedState, dispatch];
  } else {
    {
      isInHookUserCodeInDev = true;
    }

    var initialState;

    if (reducer === basicStateReducer) {
      // Special case for `useState`.
      initialState =
        typeof initialArg === "function" ? initialArg() : initialArg;
    } else {
      initialState = init !== undefined ? init(initialArg) : initialArg;
    }

    {
      isInHookUserCodeInDev = false;
    } // $FlowFixMe[incompatible-use] found when upgrading Flow

    workInProgressHook.memoizedState = initialState; // $FlowFixMe[incompatible-use] found when upgrading Flow

    var _queue = (workInProgressHook.queue = {
      last: null,
      dispatch: null
    });

    var _dispatch = (_queue.dispatch = dispatchAction.bind(
      null,
      currentlyRenderingComponent,
      _queue
    )); // $FlowFixMe[incompatible-use] found when upgrading Flow

    return [workInProgressHook.memoizedState, _dispatch];
  }
}

function useMemo(nextCreate, deps) {
  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();
  var nextDeps = deps === undefined ? null : deps;

  if (workInProgressHook !== null) {
    var prevState = workInProgressHook.memoizedState;

    if (prevState !== null) {
      if (nextDeps !== null) {
        var prevDeps = prevState[1];

        if (areHookInputsEqual(nextDeps, prevDeps)) {
          return prevState[0];
        }
      }
    }
  }

  {
    isInHookUserCodeInDev = true;
  }

  var nextValue = nextCreate();

  {
    isInHookUserCodeInDev = false;
  } // $FlowFixMe[incompatible-use] found when upgrading Flow

  workInProgressHook.memoizedState = [nextValue, nextDeps];
  return nextValue;
}

function useRef(initialValue) {
  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();
  var previousRef = workInProgressHook.memoizedState;

  if (previousRef === null) {
    var ref = {
      current: initialValue
    };

    {
      Object.seal(ref);
    } // $FlowFixMe[incompatible-use] found when upgrading Flow

    workInProgressHook.memoizedState = ref;
    return ref;
  } else {
    return previousRef;
  }
}

function useLayoutEffect(create, inputs) {
  {
    currentHookNameInDev = "useLayoutEffect";

    error(
      "useLayoutEffect does nothing on the server, because its effect cannot " +
        "be encoded into the server renderer's output format. This will lead " +
        "to a mismatch between the initial, non-hydrated UI and the intended " +
        "UI. To avoid this, useLayoutEffect should only be used in " +
        "components that render exclusively on the client. " +
        "See https://reactjs.org/link/uselayouteffect-ssr for common fixes."
    );
  }
}

function dispatchAction(componentIdentity, queue, action) {
  if (numberOfReRenders >= RE_RENDER_LIMIT) {
    throw new Error(
      "Too many re-renders. React limits the number of renders to prevent " +
        "an infinite loop."
    );
  }

  if (componentIdentity === currentlyRenderingComponent) {
    // This is a render phase update. Stash it in a lazily-created map of
    // queue -> linked list of updates. After this render pass, we'll restart
    // and apply the stashed updates on top of the work-in-progress hook.
    didScheduleRenderPhaseUpdate = true;
    var update = {
      action: action,
      next: null
    };

    if (renderPhaseUpdates === null) {
      renderPhaseUpdates = new Map();
    }

    var firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);

    if (firstRenderPhaseUpdate === undefined) {
      // $FlowFixMe[incompatible-use] found when upgrading Flow
      renderPhaseUpdates.set(queue, update);
    } else {
      // Append the update to the end of the list.
      var lastRenderPhaseUpdate = firstRenderPhaseUpdate;

      while (lastRenderPhaseUpdate.next !== null) {
        lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
      }

      lastRenderPhaseUpdate.next = update;
    }
  }
}

function useCallback(callback, deps) {
  return useMemo(function() {
    return callback;
  }, deps);
}

function throwOnUseEffectEventCall() {
  throw new Error(
    "A function wrapped in useEffectEvent can't be called during rendering."
  );
}

function useEffectEvent(callback) {
  // $FlowIgnore[incompatible-return]
  return throwOnUseEffectEventCall;
} // TODO Decide on how to implement this hook for server rendering.
// If a mutation occurs during render, consider triggering a Suspense boundary
// and falling back to client rendering.

function useMutableSource(source, getSnapshot, subscribe) {
  resolveCurrentlyRenderingComponent();
  return getSnapshot(source._source);
}

function useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
  if (getServerSnapshot === undefined) {
    throw new Error(
      "Missing getServerSnapshot, which is required for " +
        "server-rendered content. Will revert to client rendering."
    );
  }

  return getServerSnapshot();
}

function useDeferredValue(value) {
  resolveCurrentlyRenderingComponent();
  return value;
}

function unsupportedStartTransition() {
  throw new Error("startTransition cannot be called during server rendering.");
}

function useTransition() {
  resolveCurrentlyRenderingComponent();
  return [false, unsupportedStartTransition];
}

function useId() {
  var task = currentlyRenderingTask;
  var treeId = getTreeId(task.treeContext);
  var responseState = currentResponseState;

  if (responseState === null) {
    throw new Error(
      "Invalid hook call. Hooks can only be called inside of the body of a function component."
    );
  }

  var localId = localIdCounter++;
  return makeId(responseState, treeId, localId);
}

function use(usable) {
  if (usable !== null && typeof usable === "object") {
    // $FlowFixMe[method-unbinding]
    if (typeof usable.then === "function") {
      // This is a thenable.
      var thenable = usable; // Track the position of the thenable within this fiber.

      var index = thenableIndexCounter;
      thenableIndexCounter += 1;

      if (thenableState === null) {
        thenableState = createThenableState();
      }

      return trackUsedThenable(thenableState, thenable, index);
    } else if (
      usable.$$typeof === REACT_CONTEXT_TYPE ||
      usable.$$typeof === REACT_SERVER_CONTEXT_TYPE
    ) {
      var context = usable;
      return readContext$1(context);
    }
  } // eslint-disable-next-line react-internal/safe-string-coercion

  throw new Error("An unsupported type was passed to use(): " + String(usable));
}

function unsupportedRefresh() {
  throw new Error("Cache cannot be refreshed during server rendering.");
}

function useCacheRefresh() {
  return unsupportedRefresh;
}

function useMemoCache(size) {
  var data = new Array(size);

  for (var i = 0; i < size; i++) {
    data[i] = REACT_MEMO_CACHE_SENTINEL;
  }

  return data;
}

function noop$1() {}

var HooksDispatcher = {
  readContext: readContext$1,
  useContext: useContext,
  useMemo: useMemo,
  useReducer: useReducer,
  useRef: useRef,
  useState: useState,
  useInsertionEffect: noop$1,
  useLayoutEffect: useLayoutEffect,
  useCallback: useCallback,
  // useImperativeHandle is not run in the server environment
  useImperativeHandle: noop$1,
  // Effects are not run in the server environment.
  useEffect: noop$1,
  // Debugging effect
  useDebugValue: noop$1,
  useDeferredValue: useDeferredValue,
  useTransition: useTransition,
  useId: useId,
  // Subscriptions are not setup in a server environment.
  useMutableSource: useMutableSource,
  useSyncExternalStore: useSyncExternalStore
};

{
  HooksDispatcher.useCacheRefresh = useCacheRefresh;
}

{
  HooksDispatcher.useEffectEvent = useEffectEvent;
}

{
  HooksDispatcher.useMemoCache = useMemoCache;
}

{
  HooksDispatcher.use = use;
}

var currentResponseState = null;
function setCurrentResponseState(responseState) {
  currentResponseState = responseState;
}

function getCacheSignal() {
  throw new Error("Not implemented.");
}

function getCacheForType(resourceType) {
  throw new Error("Not implemented.");
}

var DefaultCacheDispatcher = {
  getCacheSignal: getCacheSignal,
  getCacheForType: getCacheForType
};

function getStackByComponentStackNode(componentStack) {
  try {
    var info = "";
    var node = componentStack;

    do {
      switch (node.tag) {
        case 0:
          info += describeBuiltInComponentFrame(node.type, null, null);
          break;

        case 1:
          info += describeFunctionComponentFrame(node.type, null, null);
          break;

        case 2:
          info += describeClassComponentFrame(node.type, null, null);
          break;
      } // $FlowFixMe[incompatible-type] we bail out when we get a null

      node = node.parent;
    } while (node);

    return info;
  } catch (x) {
    return "\nError generating stack: " + x.message + "\n" + x.stack;
  }
}

var ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher;
var ReactCurrentCache = ReactSharedInternals.ReactCurrentCache;
var ReactDebugCurrentFrame$1 = ReactSharedInternals.ReactDebugCurrentFrame;
var PENDING = 0;
var COMPLETED = 1;
var FLUSHED = 2;
var ABORTED = 3;
var ERRORED = 4;
var OPEN = 0;
var CLOSING = 1;
var CLOSED = 2; // This is a default heuristic for how to split up the HTML content into progressive
// loading. Our goal is to be able to display additional new content about every 500ms.
// Faster than that is unnecessary and should be throttled on the client. It also
// adds unnecessary overhead to do more splits. We don't know if it's a higher or lower
// end device but higher end suffer less from the overhead than lower end does from
// not getting small enough pieces. We error on the side of low end.
// We base this on low end 3G speeds which is about 500kbits per second. We assume
// that there can be a reasonable drop off from max bandwidth which leaves you with
// as little as 80%. We can receive half of that each 500ms - at best. In practice,
// a little bandwidth is lost to processing and contention - e.g. CSS and images that
// are downloaded along with the main content. So we estimate about half of that to be
// the lower end throughput. In other words, we expect that you can at least show
// about 12.5kb of content per 500ms. Not counting starting latency for the first
// paint.
// 500 * 1024 / 8 * .8 * 0.5 / 2

var DEFAULT_PROGRESSIVE_CHUNK_SIZE = 12800;

function defaultErrorHandler(error) {
  console["error"](error); // Don't transform to our wrapper

  return null;
}

function noop$2() {}

function createRequest(
  children,
  responseState,
  rootFormatContext,
  progressiveChunkSize,
  onError,
  onAllReady,
  onShellReady,
  onShellError,
  onFatalError
) {
  var pingedTasks = [];
  var abortSet = new Set();
  var resources = createResources();
  var request = {
    destination: null,
    responseState: responseState,
    progressiveChunkSize:
      progressiveChunkSize === undefined
        ? DEFAULT_PROGRESSIVE_CHUNK_SIZE
        : progressiveChunkSize,
    status: OPEN,
    fatalError: null,
    nextSegmentId: 0,
    allPendingTasks: 0,
    pendingRootTasks: 0,
    resources: resources,
    completedRootSegment: null,
    abortableTasks: abortSet,
    pingedTasks: pingedTasks,
    clientRenderedBoundaries: [],
    completedBoundaries: [],
    partialBoundaries: [],
    preamble: [],
    postamble: [],
    onError: onError === undefined ? defaultErrorHandler : onError,
    onAllReady: onAllReady === undefined ? noop$2 : onAllReady,
    onShellReady: onShellReady === undefined ? noop$2 : onShellReady,
    onShellError: onShellError === undefined ? noop$2 : onShellError,
    onFatalError: onFatalError === undefined ? noop$2 : onFatalError
  }; // This segment represents the root fallback.

  var rootSegment = createPendingSegment(
    request,
    0,
    null,
    rootFormatContext, // Root segments are never embedded in Text on either edge
    false,
    false
  ); // There is no parent so conceptually, we're unblocked to flush this segment.

  rootSegment.parentFlushed = true;
  var rootTask = createTask(
    request,
    null,
    children,
    null,
    rootSegment,
    abortSet,
    emptyContextObject,
    rootContextSnapshot,
    emptyTreeContext
  );
  pingedTasks.push(rootTask);
  return request;
}

function pingTask(request, task) {
  var pingedTasks = request.pingedTasks;
  pingedTasks.push(task);

  if (pingedTasks.length === 1) {
    scheduleWork(function() {
      return performWork(request);
    });
  }
}

function createSuspenseBoundary(request, fallbackAbortableTasks) {
  return {
    id: UNINITIALIZED_SUSPENSE_BOUNDARY_ID,
    rootSegmentID: -1,
    parentFlushed: false,
    pendingTasks: 0,
    forceClientRender: false,
    completedSegments: [],
    byteSize: 0,
    fallbackAbortableTasks: fallbackAbortableTasks,
    errorDigest: null,
    resources: createBoundaryResources()
  };
}

function createTask(
  request,
  thenableState,
  node,
  blockedBoundary,
  blockedSegment,
  abortSet,
  legacyContext,
  context,
  treeContext
) {
  request.allPendingTasks++;

  if (blockedBoundary === null) {
    request.pendingRootTasks++;
  } else {
    blockedBoundary.pendingTasks++;
  }

  var task = {
    node: node,
    ping: function() {
      return pingTask(request, task);
    },
    blockedBoundary: blockedBoundary,
    blockedSegment: blockedSegment,
    abortSet: abortSet,
    legacyContext: legacyContext,
    context: context,
    treeContext: treeContext,
    thenableState: thenableState
  };

  {
    task.componentStack = null;
  }

  abortSet.add(task);
  return task;
}

function createPendingSegment(
  request,
  index,
  boundary,
  formatContext,
  lastPushedText,
  textEmbedded
) {
  return {
    status: PENDING,
    id: -1,
    // lazily assigned later
    index: index,
    parentFlushed: false,
    chunks: [],
    children: [],
    formatContext: formatContext,
    boundary: boundary,
    lastPushedText: lastPushedText,
    textEmbedded: textEmbedded
  };
} // DEV-only global reference to the currently executing task

var currentTaskInDEV = null;

function getCurrentStackInDEV() {
  {
    if (currentTaskInDEV === null || currentTaskInDEV.componentStack === null) {
      return "";
    }

    return getStackByComponentStackNode(currentTaskInDEV.componentStack);
  }
}

function pushBuiltInComponentStackInDEV(task, type) {
  {
    task.componentStack = {
      tag: 0,
      parent: task.componentStack,
      type: type
    };
  }
}

function pushFunctionComponentStackInDEV(task, type) {
  {
    task.componentStack = {
      tag: 1,
      parent: task.componentStack,
      type: type
    };
  }
}

function pushClassComponentStackInDEV(task, type) {
  {
    task.componentStack = {
      tag: 2,
      parent: task.componentStack,
      type: type
    };
  }
}

function popComponentStackInDEV(task) {
  {
    if (task.componentStack === null) {
      error(
        "Unexpectedly popped too many stack frames. This is a bug in React."
      );
    } else {
      task.componentStack = task.componentStack.parent;
    }
  }
} // stash the component stack of an unwinding error until it is processed

var lastBoundaryErrorComponentStackDev = null;

function captureBoundaryErrorDetailsDev(boundary, error) {
  {
    var errorMessage;

    if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error.message === "string") {
      errorMessage = error.message;
    } else {
      // eslint-disable-next-line react-internal/safe-string-coercion
      errorMessage = String(error);
    }

    var errorComponentStack =
      lastBoundaryErrorComponentStackDev || getCurrentStackInDEV();
    lastBoundaryErrorComponentStackDev = null;
    boundary.errorMessage = errorMessage;
    boundary.errorComponentStack = errorComponentStack;
  }
}

function logRecoverableError(request, error) {
  // If this callback errors, we intentionally let that error bubble up to become a fatal error
  // so that someone fixes the error reporting instead of hiding it.
  var errorDigest = request.onError(error);

  if (errorDigest != null && typeof errorDigest !== "string") {
    // eslint-disable-next-line react-internal/prod-error-codes
    throw new Error(
      'onError returned something with a type other than "string". onError should return a string and may return null or undefined but must not return anything else. It received something of type "' +
        typeof errorDigest +
        '" instead'
    );
  }

  return errorDigest;
}

function fatalError(request, error) {
  // This is called outside error handling code such as if the root errors outside
  // a suspense boundary or if the root suspense boundary's fallback errors.
  // It's also called if React itself or its host configs errors.
  var onShellError = request.onShellError;
  onShellError(error);
  var onFatalError = request.onFatalError;
  onFatalError(error);

  if (request.destination !== null) {
    request.status = CLOSED;
    closeWithError(request.destination, error);
  } else {
    request.status = CLOSING;
    request.fatalError = error;
  }
}

function renderSuspenseBoundary(request, task, props) {
  pushBuiltInComponentStackInDEV(task, "Suspense");
  var parentBoundary = task.blockedBoundary;
  var parentSegment = task.blockedSegment; // Each time we enter a suspense boundary, we split out into a new segment for
  // the fallback so that we can later replace that segment with the content.
  // This also lets us split out the main content even if it doesn't suspend,
  // in case it ends up generating a large subtree of content.

  var fallback = props.fallback;
  var content = props.children;
  var fallbackAbortSet = new Set();
  var newBoundary = createSuspenseBoundary(request, fallbackAbortSet);
  var insertionIndex = parentSegment.chunks.length; // The children of the boundary segment is actually the fallback.

  var boundarySegment = createPendingSegment(
    request,
    insertionIndex,
    newBoundary,
    parentSegment.formatContext, // boundaries never require text embedding at their edges because comment nodes bound them
    false,
    false
  );
  parentSegment.children.push(boundarySegment); // The parentSegment has a child Segment at this index so we reset the lastPushedText marker on the parent

  parentSegment.lastPushedText = false; // This segment is the actual child content. We can start rendering that immediately.

  var contentRootSegment = createPendingSegment(
    request,
    0,
    null,
    parentSegment.formatContext, // boundaries never require text embedding at their edges because comment nodes bound them
    false,
    false
  ); // We mark the root segment as having its parent flushed. It's not really flushed but there is
  // no parent segment so there's nothing to wait on.

  contentRootSegment.parentFlushed = true; // Currently this is running synchronously. We could instead schedule this to pingedTasks.
  // I suspect that there might be some efficiency benefits from not creating the suspended task
  // and instead just using the stack if possible.
  // TODO: Call this directly instead of messing with saving and restoring contexts.
  // We can reuse the current context and task to render the content immediately without
  // context switching. We just need to temporarily switch which boundary and which segment
  // we're writing to. If something suspends, it'll spawn new suspended task with that context.

  task.blockedBoundary = newBoundary;
  task.blockedSegment = contentRootSegment;

  {
    setCurrentlyRenderingBoundaryResourcesTarget(
      request.resources,
      newBoundary.resources
    );
  }

  try {
    // We use the safe form because we don't handle suspending here. Only error handling.
    renderNode(request, task, content);
    pushSegmentFinale$1(
      contentRootSegment.chunks,
      request.responseState,
      contentRootSegment.lastPushedText,
      contentRootSegment.textEmbedded
    );
    contentRootSegment.status = COMPLETED;

    if (enableFloat) {
      if (newBoundary.pendingTasks === 0) {
        hoistCompletedBoundaryResources(request, newBoundary);
      }
    }

    queueCompletedSegment(newBoundary, contentRootSegment);

    if (newBoundary.pendingTasks === 0) {
      // This must have been the last segment we were waiting on. This boundary is now complete.
      // Therefore we won't need the fallback. We early return so that we don't have to create
      // the fallback.
      popComponentStackInDEV(task);
      return;
    }
  } catch (error) {
    contentRootSegment.status = ERRORED;
    newBoundary.forceClientRender = true;
    newBoundary.errorDigest = logRecoverableError(request, error);

    {
      captureBoundaryErrorDetailsDev(newBoundary, error);
    } // We don't need to decrement any task numbers because we didn't spawn any new task.
    // We don't need to schedule any task because we know the parent has written yet.
    // We do need to fallthrough to create the fallback though.
  } finally {
    {
      setCurrentlyRenderingBoundaryResourcesTarget(
        request.resources,
        parentBoundary ? parentBoundary.resources : null
      );
    }

    task.blockedBoundary = parentBoundary;
    task.blockedSegment = parentSegment;
  } // We create suspended task for the fallback because we don't want to actually work
  // on it yet in case we finish the main content, so we queue for later.

  var suspendedFallbackTask = createTask(
    request,
    null,
    fallback,
    parentBoundary,
    boundarySegment,
    fallbackAbortSet,
    task.legacyContext,
    task.context,
    task.treeContext
  );

  {
    suspendedFallbackTask.componentStack = task.componentStack;
  } // TODO: This should be queued at a separate lower priority queue so that we only work
  // on preparing fallbacks if we don't have any more main content to task on.

  request.pingedTasks.push(suspendedFallbackTask);
  popComponentStackInDEV(task);
}

function hoistCompletedBoundaryResources(request, completedBoundary) {
  if (request.completedRootSegment !== null || request.pendingRootTasks > 0) {
    // The Shell has not flushed yet. we can hoist Resources for this boundary
    // all the way to the Root.
    hoistResourcesToRoot(request.resources, completedBoundary.resources);
  } // We don't hoist if the root already flushed because late resources will be hoisted
  // as boundaries flush
}

function renderHostElement(request, task, type, props) {
  pushBuiltInComponentStackInDEV(task, type);
  var segment = task.blockedSegment;
  var children = pushStartInstance(
    segment.chunks,
    request.preamble,
    type,
    props,
    request.responseState,
    segment.formatContext,
    segment.lastPushedText
  );
  segment.lastPushedText = false;
  var prevContext = segment.formatContext;
  segment.formatContext = getChildFormatContext(prevContext, type, props); // We use the non-destructive form because if something suspends, we still
  // need to pop back up and finish this subtree of HTML.

  renderNode(request, task, children); // We expect that errors will fatal the whole task and that we don't need
  // the correct context. Therefore this is not in a finally.

  segment.formatContext = prevContext;
  pushEndInstance(segment.chunks, request.postamble, type);
  segment.lastPushedText = false;
  popComponentStackInDEV(task);
}

function shouldConstruct(Component) {
  return Component.prototype && Component.prototype.isReactComponent;
}

function renderWithHooks(
  request,
  task,
  prevThenableState,
  Component,
  props,
  secondArg
) {
  var componentIdentity = {};
  prepareToUseHooks(task, componentIdentity, prevThenableState);
  var result = Component(props, secondArg);
  return finishHooks(Component, props, result, secondArg);
}

function finishClassComponent(request, task, instance, Component, props) {
  var nextChildren = instance.render();

  {
    if (instance.props !== props) {
      if (!didWarnAboutReassigningProps) {
        error(
          "It looks like %s is reassigning its own `this.props` while rendering. " +
            "This is not supported and can lead to confusing bugs.",
          getComponentNameFromType(Component) || "a component"
        );
      }

      didWarnAboutReassigningProps = true;
    }
  }

  renderNodeDestructive(request, task, null, nextChildren);
}

function renderClassComponent(request, task, Component, props) {
  pushClassComponentStackInDEV(task, Component);
  var maskedContext = undefined;
  var instance = constructClassInstance(Component, props);
  mountClassInstance(instance, Component, props, maskedContext);
  finishClassComponent(request, task, instance, Component, props);
  popComponentStackInDEV(task);
}

var didWarnAboutBadClass = {};
var didWarnAboutModulePatternComponent = {};
var didWarnAboutContextTypeOnFunctionComponent = {};
var didWarnAboutGetDerivedStateOnFunctionComponent = {};
var didWarnAboutReassigningProps = false;
var didWarnAboutDefaultPropsOnFunctionComponent = {};
var didWarnAboutGenerators = false;
var didWarnAboutMaps = false;
var hasWarnedAboutUsingContextAsConsumer = false; // This would typically be a function component but we still support module pattern
// components for some reason.

function renderIndeterminateComponent(
  request,
  task,
  prevThenableState,
  Component,
  props
) {
  var legacyContext;

  pushFunctionComponentStackInDEV(task, Component);

  {
    if (
      Component.prototype &&
      typeof Component.prototype.render === "function"
    ) {
      var componentName = getComponentNameFromType(Component) || "Unknown";

      if (!didWarnAboutBadClass[componentName]) {
        error(
          "The <%s /> component appears to have a render method, but doesn't extend React.Component. " +
            "This is likely to cause errors. Change %s to extend React.Component instead.",
          componentName,
          componentName
        );

        didWarnAboutBadClass[componentName] = true;
      }
    }
  }

  var value = renderWithHooks(
    request,
    task,
    prevThenableState,
    Component,
    props,
    legacyContext
  );
  var hasId = checkDidRenderIdHook();

  {
    // Support for module components is deprecated and is removed behind a flag.
    // Whether or not it would crash later, we want to show a good message in DEV first.
    if (
      typeof value === "object" &&
      value !== null &&
      typeof value.render === "function" &&
      value.$$typeof === undefined
    ) {
      var _componentName = getComponentNameFromType(Component) || "Unknown";

      if (!didWarnAboutModulePatternComponent[_componentName]) {
        error(
          "The <%s /> component appears to be a function component that returns a class instance. " +
            "Change %s to a class that extends React.Component instead. " +
            "If you can't use a class try assigning the prototype on the function as a workaround. " +
            "`%s.prototype = React.Component.prototype`. Don't use an arrow function since it " +
            "cannot be called with `new` by React.",
          _componentName,
          _componentName,
          _componentName
        );

        didWarnAboutModulePatternComponent[_componentName] = true;
      }
    }
  }

  {
    // Proceed under the assumption that this is a function component
    {
      if (Component.contextTypes) {
        error(
          "%s uses the legacy contextTypes API which is no longer supported. " +
            "Use React.createContext() with React.useContext() instead.",
          getComponentNameFromType(Component) || "Unknown"
        );
      }
    }

    {
      validateFunctionComponentInDev(Component);
    } // We're now successfully past this task, and we don't have to pop back to
    // the previous task every again, so we can use the destructive recursive form.

    if (hasId) {
      // This component materialized an id. We treat this as its own level, with
      // a single "child" slot.
      var prevTreeContext = task.treeContext;
      var totalChildren = 1;
      var index = 0;
      task.treeContext = pushTreeContext(prevTreeContext, totalChildren, index);

      try {
        renderNodeDestructive(request, task, null, value);
      } finally {
        task.treeContext = prevTreeContext;
      }
    } else {
      renderNodeDestructive(request, task, null, value);
    }
  }

  popComponentStackInDEV(task);
}

function validateFunctionComponentInDev(Component) {
  {
    if (Component) {
      if (Component.childContextTypes) {
        error(
          "%s(...): childContextTypes cannot be defined on a function component.",
          Component.displayName || Component.name || "Component"
        );
      }
    }

    if (Component.defaultProps !== undefined) {
      var componentName = getComponentNameFromType(Component) || "Unknown";

      if (!didWarnAboutDefaultPropsOnFunctionComponent[componentName]) {
        error(
          "%s: Support for defaultProps will be removed from function components " +
            "in a future major release. Use JavaScript default parameters instead.",
          componentName
        );

        didWarnAboutDefaultPropsOnFunctionComponent[componentName] = true;
      }
    }

    if (typeof Component.getDerivedStateFromProps === "function") {
      var _componentName3 = getComponentNameFromType(Component) || "Unknown";

      if (!didWarnAboutGetDerivedStateOnFunctionComponent[_componentName3]) {
        error(
          "%s: Function components do not support getDerivedStateFromProps.",
          _componentName3
        );

        didWarnAboutGetDerivedStateOnFunctionComponent[_componentName3] = true;
      }
    }

    if (
      typeof Component.contextType === "object" &&
      Component.contextType !== null
    ) {
      var _componentName4 = getComponentNameFromType(Component) || "Unknown";

      if (!didWarnAboutContextTypeOnFunctionComponent[_componentName4]) {
        error(
          "%s: Function components do not support contextType.",
          _componentName4
        );

        didWarnAboutContextTypeOnFunctionComponent[_componentName4] = true;
      }
    }
  }
}

function resolveDefaultProps(Component, baseProps) {
  if (Component && Component.defaultProps) {
    // Resolve default props. Taken from ReactElement
    var props = assign({}, baseProps);
    var defaultProps = Component.defaultProps;

    for (var propName in defaultProps) {
      if (props[propName] === undefined) {
        props[propName] = defaultProps[propName];
      }
    }

    return props;
  }

  return baseProps;
}

function renderForwardRef(request, task, prevThenableState, type, props, ref) {
  pushFunctionComponentStackInDEV(task, type.render);
  var children = renderWithHooks(
    request,
    task,
    prevThenableState,
    type.render,
    props,
    ref
  );
  var hasId = checkDidRenderIdHook();

  if (hasId) {
    // This component materialized an id. We treat this as its own level, with
    // a single "child" slot.
    var prevTreeContext = task.treeContext;
    var totalChildren = 1;
    var index = 0;
    task.treeContext = pushTreeContext(prevTreeContext, totalChildren, index);

    try {
      renderNodeDestructive(request, task, null, children);
    } finally {
      task.treeContext = prevTreeContext;
    }
  } else {
    renderNodeDestructive(request, task, null, children);
  }

  popComponentStackInDEV(task);
}

function renderMemo(request, task, prevThenableState, type, props, ref) {
  var innerType = type.type;
  var resolvedProps = resolveDefaultProps(innerType, props);
  renderElement(
    request,
    task,
    prevThenableState,
    innerType,
    resolvedProps,
    ref
  );
}

function renderContextConsumer(request, task, context, props) {
  // The logic below for Context differs depending on PROD or DEV mode. In
  // DEV mode, we create a separate object for Context.Consumer that acts
  // like a proxy to Context. This proxy object adds unnecessary code in PROD
  // so we use the old behaviour (Context.Consumer references Context) to
  // reduce size and overhead. The separate object references context via
  // a property called "_context", which also gives us the ability to check
  // in DEV mode if this property exists or not and warn if it does not.
  {
    if (context._context === undefined) {
      // This may be because it's a Context (rather than a Consumer).
      // Or it may be because it's older React where they're the same thing.
      // We only want to warn if we're sure it's a new React.
      if (context !== context.Consumer) {
        if (!hasWarnedAboutUsingContextAsConsumer) {
          hasWarnedAboutUsingContextAsConsumer = true;

          error(
            "Rendering <Context> directly is not supported and will be removed in " +
              "a future major release. Did you mean to render <Context.Consumer> instead?"
          );
        }
      }
    } else {
      context = context._context;
    }
  }

  var render = props.children;

  {
    if (typeof render !== "function") {
      error(
        "A context consumer was rendered with multiple children, or a child " +
          "that isn't a function. A context consumer expects a single child " +
          "that is a function. If you did pass a function, make sure there " +
          "is no trailing or leading whitespace around it."
      );
    }
  }

  var newValue = readContext(context);
  var newChildren = render(newValue);
  renderNodeDestructive(request, task, null, newChildren);
}

function renderContextProvider(request, task, type, props) {
  var context = type._context;
  var value = props.value;
  var children = props.children;
  var prevSnapshot;

  {
    prevSnapshot = task.context;
  }

  task.context = pushProvider(context, value);
  renderNodeDestructive(request, task, null, children);
  task.context = popProvider(context);

  {
    if (prevSnapshot !== task.context) {
      error(
        "Popping the context provider did not return back to the original snapshot. This is a bug in React."
      );
    }
  }
}

function renderLazyComponent(
  request,
  task,
  prevThenableState,
  lazyComponent,
  props,
  ref
) {
  pushBuiltInComponentStackInDEV(task, "Lazy");
  var payload = lazyComponent._payload;
  var init = lazyComponent._init;
  var Component = init(payload);
  var resolvedProps = resolveDefaultProps(Component, props);
  renderElement(
    request,
    task,
    prevThenableState,
    Component,
    resolvedProps,
    ref
  );
  popComponentStackInDEV(task);
}

function renderOffscreen(request, task, props) {
  var mode = props.mode;

  if (mode === "hidden");
  else {
    // A visible Offscreen boundary is treated exactly like a fragment: a
    // pure indirection.
    renderNodeDestructive(request, task, null, props.children);
  }
}

function renderElement(request, task, prevThenableState, type, props, ref) {
  if (typeof type === "function") {
    if (shouldConstruct(type)) {
      renderClassComponent(request, task, type, props);
      return;
    } else {
      renderIndeterminateComponent(
        request,
        task,
        prevThenableState,
        type,
        props
      );
      return;
    }
  }

  if (typeof type === "string") {
    renderHostElement(request, task, type, props);
    return;
  }

  switch (type) {
    // LegacyHidden acts the same as a fragment. This only works because we
    // currently assume that every instance of LegacyHidden is accompanied by a
    // host component wrapper. In the hidden mode, the host component is given a
    // `hidden` attribute, which ensures that the initial HTML is not visible.
    // To support the use of LegacyHidden as a true fragment, without an extra
    // DOM node, we would have to hide the initial HTML in some other way.
    // TODO: Delete in LegacyHidden. It's an unstable API only used in the
    // www build. As a migration step, we could add a special prop to Offscreen
    // that simulates the old behavior (no hiding, no change to effects).
    case REACT_LEGACY_HIDDEN_TYPE:
    case REACT_DEBUG_TRACING_MODE_TYPE:
    case REACT_STRICT_MODE_TYPE:
    case REACT_PROFILER_TYPE:
    case REACT_FRAGMENT_TYPE: {
      renderNodeDestructive(request, task, null, props.children);
      return;
    }

    case REACT_OFFSCREEN_TYPE: {
      renderOffscreen(request, task, props);
      return;
    }

    case REACT_SUSPENSE_LIST_TYPE: {
      pushBuiltInComponentStackInDEV(task, "SuspenseList"); // TODO: SuspenseList should control the boundaries.

      renderNodeDestructive(request, task, null, props.children);
      popComponentStackInDEV(task);
      return;
    }

    case REACT_SCOPE_TYPE: {
      {
        renderNodeDestructive(request, task, null, props.children);
        return;
      }
    }
    // eslint-disable-next-line-no-fallthrough

    case REACT_SUSPENSE_TYPE: {
      {
        renderSuspenseBoundary(request, task, props);
      }

      return;
    }
  }

  if (typeof type === "object" && type !== null) {
    switch (type.$$typeof) {
      case REACT_FORWARD_REF_TYPE: {
        renderForwardRef(request, task, prevThenableState, type, props, ref);
        return;
      }

      case REACT_MEMO_TYPE: {
        renderMemo(request, task, prevThenableState, type, props, ref);
        return;
      }

      case REACT_PROVIDER_TYPE: {
        renderContextProvider(request, task, type, props);
        return;
      }

      case REACT_CONTEXT_TYPE: {
        renderContextConsumer(request, task, type, props);
        return;
      }

      case REACT_LAZY_TYPE: {
        renderLazyComponent(request, task, prevThenableState, type, props);
        return;
      }
    }
  }

  var info = "";

  {
    if (
      type === undefined ||
      (typeof type === "object" &&
        type !== null &&
        Object.keys(type).length === 0)
    ) {
      info +=
        " You likely forgot to export your component from the file " +
        "it's defined in, or you might have mixed up default and " +
        "named imports.";
    }
  }

  throw new Error(
    "Element type is invalid: expected a string (for built-in " +
      "components) or a class/function (for composite components) " +
      ("but got: " + (type == null ? type : typeof type) + "." + info)
  );
} // $FlowFixMe[missing-local-annot]

function validateIterable(iterable, iteratorFn) {
  {
    // We don't support rendering Generators because it's a mutation.
    // See https://github.com/facebook/react/issues/12995
    if (
      typeof Symbol === "function" && // $FlowFixMe Flow doesn't know about toStringTag
      iterable[Symbol.toStringTag] === "Generator"
    ) {
      if (!didWarnAboutGenerators) {
        error(
          "Using Generators as children is unsupported and will likely yield " +
            "unexpected results because enumerating a generator mutates it. " +
            "You may convert it to an array with `Array.from()` or the " +
            "`[...spread]` operator before rendering. Keep in mind " +
            "you might need to polyfill these features for older browsers."
        );
      }

      didWarnAboutGenerators = true;
    } // Warn about using Maps as children

    if (iterable.entries === iteratorFn) {
      if (!didWarnAboutMaps) {
        error(
          "Using Maps as children is not supported. " +
            "Use an array of keyed ReactElements instead."
        );
      }

      didWarnAboutMaps = true;
    }
  }
}

function renderNodeDestructive(
  request,
  task, // The thenable state reused from the previous attempt, if any. This is almost
  // always null, except when called by retryTask.
  prevThenableState,
  node
) {
  {
    // In Dev we wrap renderNodeDestructiveImpl in a try / catch so we can capture
    // a component stack at the right place in the tree. We don't do this in renderNode
    // becuase it is not called at every layer of the tree and we may lose frames
    try {
      return renderNodeDestructiveImpl(request, task, prevThenableState, node);
    } catch (x) {
      if (typeof x === "object" && x !== null && typeof x.then === "function");
      else {
        // This is an error, stash the component stack if it is null.
        lastBoundaryErrorComponentStackDev =
          lastBoundaryErrorComponentStackDev !== null
            ? lastBoundaryErrorComponentStackDev
            : getCurrentStackInDEV();
      } // rethrow so normal suspense logic can handle thrown value accordingly

      throw x;
    }
  }
} // This function by it self renders a node and consumes the task by mutating it
// to update the current execution state.

function renderNodeDestructiveImpl(request, task, prevThenableState, node) {
  // Stash the node we're working on. We'll pick up from this task in case
  // something suspends.
  task.node = node; // Handle object types

  if (typeof node === "object" && node !== null) {
    switch (node.$$typeof) {
      case REACT_ELEMENT_TYPE: {
        var element = node;
        var type = element.type;
        var props = element.props;
        var ref = element.ref;
        renderElement(request, task, prevThenableState, type, props, ref);
        return;
      }

      case REACT_PORTAL_TYPE:
        throw new Error(
          "Portals are not currently supported by the server renderer. " +
            "Render them conditionally so that they only appear on the client render."
        );
      // eslint-disable-next-line-no-fallthrough

      case REACT_LAZY_TYPE: {
        var lazyNode = node;
        var payload = lazyNode._payload;
        var init = lazyNode._init;
        var resolvedNode;

        {
          try {
            resolvedNode = init(payload);
          } catch (x) {
            if (
              typeof x === "object" &&
              x !== null &&
              typeof x.then === "function"
            ) {
              // this Lazy initializer is suspending. push a temporary frame onto the stack so it can be
              // popped off in spawnNewSuspendedTask. This aligns stack behavior between Lazy in element position
              // vs Component position. We do not want the frame for Errors so we exclusively do this in
              // the wakeable branch
              pushBuiltInComponentStackInDEV(task, "Lazy");
            }

            throw x;
          }
        }

        renderNodeDestructive(request, task, null, resolvedNode);
        return;
      }
    }

    if (isArray(node)) {
      renderChildrenArray(request, task, node);
      return;
    }

    var iteratorFn = getIteratorFn(node);

    if (iteratorFn) {
      {
        validateIterable(node, iteratorFn);
      }

      var iterator = iteratorFn.call(node);

      if (iterator) {
        // We need to know how many total children are in this set, so that we
        // can allocate enough id slots to acommodate them. So we must exhaust
        // the iterator before we start recursively rendering the children.
        // TODO: This is not great but I think it's inherent to the id
        // generation algorithm.
        var step = iterator.next(); // If there are not entries, we need to push an empty so we start by checking that.

        if (!step.done) {
          var children = [];

          do {
            children.push(step.value);
            step = iterator.next();
          } while (!step.done);

          renderChildrenArray(request, task, children);
          return;
        }

        return;
      }
    } // $FlowFixMe[method-unbinding]

    var childString = Object.prototype.toString.call(node);
    throw new Error(
      "Objects are not valid as a React child (found: " +
        (childString === "[object Object]"
          ? "object with keys {" + Object.keys(node).join(", ") + "}"
          : childString) +
        "). " +
        "If you meant to render a collection of children, use an array " +
        "instead."
    );
  }

  if (typeof node === "string") {
    var segment = task.blockedSegment;
    segment.lastPushedText = pushTextInstance$1(
      task.blockedSegment.chunks,
      node,
      request.responseState,
      segment.lastPushedText
    );
    return;
  }

  if (typeof node === "number") {
    var _segment = task.blockedSegment;
    _segment.lastPushedText = pushTextInstance$1(
      task.blockedSegment.chunks,
      "" + node,
      request.responseState,
      _segment.lastPushedText
    );
    return;
  }

  {
    if (typeof node === "function") {
      error(
        "Functions are not valid as a React child. This may happen if " +
          "you return a Component instead of <Component /> from render. " +
          "Or maybe you meant to call this function rather than return it."
      );
    }
  }
}

function renderChildrenArray(request, task, children) {
  var totalChildren = children.length;

  for (var i = 0; i < totalChildren; i++) {
    var prevTreeContext = task.treeContext;
    task.treeContext = pushTreeContext(prevTreeContext, totalChildren, i);

    try {
      // We need to use the non-destructive form so that we can safely pop back
      // up and render the sibling if something suspends.
      renderNode(request, task, children[i]);
    } finally {
      task.treeContext = prevTreeContext;
    }
  }
}

function spawnNewSuspendedTask(request, task, thenableState, x) {
  // Something suspended, we'll need to create a new segment and resolve it later.
  var segment = task.blockedSegment;
  var insertionIndex = segment.chunks.length;
  var newSegment = createPendingSegment(
    request,
    insertionIndex,
    null,
    segment.formatContext, // Adopt the parent segment's leading text embed
    segment.lastPushedText, // Assume we are text embedded at the trailing edge
    true
  );
  segment.children.push(newSegment); // Reset lastPushedText for current Segment since the new Segment "consumed" it

  segment.lastPushedText = false;
  var newTask = createTask(
    request,
    thenableState,
    task.node,
    task.blockedBoundary,
    newSegment,
    task.abortSet,
    task.legacyContext,
    task.context,
    task.treeContext
  );

  {
    if (task.componentStack !== null) {
      // We pop one task off the stack because the node that suspended will be tried again,
      // which will add it back onto the stack.
      newTask.componentStack = task.componentStack.parent;
    }
  }

  var ping = newTask.ping;
  x.then(ping, ping);
} // This is a non-destructive form of rendering a node. If it suspends it spawns
// a new task and restores the context of this task to what it was before.

function renderNode(request, task, node) {
  // TODO: Store segment.children.length here and reset it in case something
  // suspended partially through writing something.
  // Snapshot the current context in case something throws to interrupt the
  // process.
  var previousFormatContext = task.blockedSegment.formatContext;
  var previousLegacyContext = task.legacyContext;
  var previousContext = task.context;
  var previousComponentStack = null;

  {
    previousComponentStack = task.componentStack;
  }

  try {
    return renderNodeDestructive(request, task, null, node);
  } catch (thrownValue) {
    resetHooksState();
    var x =
      thrownValue === SuspenseException // This is a special type of exception used for Suspense. For historical
        ? // reasons, the rest of the Suspense implementation expects the thrown
          // value to be a thenable, because before `use` existed that was the
          // (unstable) API for suspending. This implementation detail can change
          // later, once we deprecate the old API in favor of `use`.
          getSuspendedThenable()
        : thrownValue; // $FlowFixMe[method-unbinding]

    if (typeof x === "object" && x !== null && typeof x.then === "function") {
      var wakeable = x;
      var thenableState = getThenableStateAfterSuspending();
      spawnNewSuspendedTask(request, task, thenableState, wakeable); // Restore the context. We assume that this will be restored by the inner
      // functions in case nothing throws so we don't use "finally" here.

      task.blockedSegment.formatContext = previousFormatContext;
      task.legacyContext = previousLegacyContext;
      task.context = previousContext; // Restore all active ReactContexts to what they were before.

      switchContext(previousContext);

      {
        task.componentStack = previousComponentStack;
      }

      return;
    } else {
      // Restore the context. We assume that this will be restored by the inner
      // functions in case nothing throws so we don't use "finally" here.
      task.blockedSegment.formatContext = previousFormatContext;
      task.legacyContext = previousLegacyContext;
      task.context = previousContext; // Restore all active ReactContexts to what they were before.

      switchContext(previousContext);

      {
        task.componentStack = previousComponentStack;
      } // We assume that we don't need the correct context.
      // Let's terminate the rest of the tree and don't render any siblings.

      throw x;
    }
  }
}

function erroredTask(request, boundary, segment, error) {
  // Report the error to a global handler.
  var errorDigest = logRecoverableError(request, error);

  if (boundary === null) {
    fatalError(request, error);
  } else {
    boundary.pendingTasks--;

    if (!boundary.forceClientRender) {
      boundary.forceClientRender = true;
      boundary.errorDigest = errorDigest;

      {
        captureBoundaryErrorDetailsDev(boundary, error);
      } // Regardless of what happens next, this boundary won't be displayed,
      // so we can flush it, if the parent already flushed.

      if (boundary.parentFlushed) {
        // We don't have a preference where in the queue this goes since it's likely
        // to error on the client anyway. However, intentionally client-rendered
        // boundaries should be flushed earlier so that they can start on the client.
        // We reuse the same queue for errors.
        request.clientRenderedBoundaries.push(boundary);
      }
    }
  }

  request.allPendingTasks--;

  if (request.allPendingTasks === 0) {
    var onAllReady = request.onAllReady;
    onAllReady();
  }
}

function abortTaskSoft(task) {
  // This aborts task without aborting the parent boundary that it blocks.
  // It's used for when we didn't need this task to complete the tree.
  // If task was needed, then it should use abortTask instead.
  var request = this;
  var boundary = task.blockedBoundary;
  var segment = task.blockedSegment;
  segment.status = ABORTED;
  finishedTask(request, boundary, segment);
}

function abortTask(task, request, error) {
  // This aborts the task and aborts the parent that it blocks, putting it into
  // client rendered mode.
  var boundary = task.blockedBoundary;
  var segment = task.blockedSegment;
  segment.status = ABORTED;

  if (boundary === null) {
    request.allPendingTasks--; // We didn't complete the root so we have nothing to show. We can close
    // the request;

    if (request.status !== CLOSING && request.status !== CLOSED) {
      logRecoverableError(request, error);
      fatalError(request, error);
    }
  } else {
    boundary.pendingTasks--;

    if (!boundary.forceClientRender) {
      boundary.forceClientRender = true;
      boundary.errorDigest = request.onError(error);

      {
        var errorPrefix = "The server did not finish this Suspense boundary: ";
        var errorMessage;

        if (error && typeof error.message === "string") {
          errorMessage = errorPrefix + error.message;
        } else {
          // eslint-disable-next-line react-internal/safe-string-coercion
          errorMessage = errorPrefix + String(error);
        }

        var previousTaskInDev = currentTaskInDEV;
        currentTaskInDEV = task;

        try {
          captureBoundaryErrorDetailsDev(boundary, errorMessage);
        } finally {
          currentTaskInDEV = previousTaskInDev;
        }
      }

      if (boundary.parentFlushed) {
        request.clientRenderedBoundaries.push(boundary);
      }
    } // If this boundary was still pending then we haven't already cancelled its fallbacks.
    // We'll need to abort the fallbacks, which will also error that parent boundary.

    boundary.fallbackAbortableTasks.forEach(function(fallbackTask) {
      return abortTask(fallbackTask, request, error);
    });
    boundary.fallbackAbortableTasks.clear();
    request.allPendingTasks--;

    if (request.allPendingTasks === 0) {
      var onAllReady = request.onAllReady;
      onAllReady();
    }
  }
}

function queueCompletedSegment(boundary, segment) {
  if (
    segment.chunks.length === 0 &&
    segment.children.length === 1 &&
    segment.children[0].boundary === null
  ) {
    // This is an empty segment. There's nothing to write, so we can instead transfer the ID
    // to the child. That way any existing references point to the child.
    var childSegment = segment.children[0];
    childSegment.id = segment.id;
    childSegment.parentFlushed = true;

    if (childSegment.status === COMPLETED) {
      queueCompletedSegment(boundary, childSegment);
    }
  } else {
    var completedSegments = boundary.completedSegments;
    completedSegments.push(segment);
  }
}

function finishedTask(request, boundary, segment) {
  if (boundary === null) {
    if (segment.parentFlushed) {
      if (request.completedRootSegment !== null) {
        throw new Error(
          "There can only be one root segment. This is a bug in React."
        );
      }

      request.completedRootSegment = segment;
    }

    request.pendingRootTasks--;

    if (request.pendingRootTasks === 0) {
      // We have completed the shell so the shell can't error anymore.
      request.onShellError = noop$2;
      var onShellReady = request.onShellReady;
      onShellReady();
    }
  } else {
    boundary.pendingTasks--;

    if (boundary.forceClientRender);
    else if (boundary.pendingTasks === 0) {
      // This must have been the last segment we were waiting on. This boundary is now complete.
      if (segment.parentFlushed) {
        // Our parent segment already flushed, so we need to schedule this segment to be emitted.
        // If it is a segment that was aborted, we'll write other content instead so we don't need
        // to emit it.
        if (segment.status === COMPLETED) {
          queueCompletedSegment(boundary, segment);
        }
      }

      {
        hoistCompletedBoundaryResources(request, boundary);
      }

      if (boundary.parentFlushed) {
        // The segment might be part of a segment that didn't flush yet, but if the boundary's
        // parent flushed, we need to schedule the boundary to be emitted.
        request.completedBoundaries.push(boundary);
      } // We can now cancel any pending task on the fallback since we won't need to show it anymore.
      // This needs to happen after we read the parentFlushed flags because aborting can finish
      // work which can trigger user code, which can start flushing, which can change those flags.

      boundary.fallbackAbortableTasks.forEach(abortTaskSoft, request);
      boundary.fallbackAbortableTasks.clear();
    } else {
      if (segment.parentFlushed) {
        // Our parent already flushed, so we need to schedule this segment to be emitted.
        // If it is a segment that was aborted, we'll write other content instead so we don't need
        // to emit it.
        if (segment.status === COMPLETED) {
          queueCompletedSegment(boundary, segment);
          var completedSegments = boundary.completedSegments;

          if (completedSegments.length === 1) {
            // This is the first time since we last flushed that we completed anything.
            // We can schedule this boundary to emit its partially completed segments early
            // in case the parent has already been flushed.
            if (boundary.parentFlushed) {
              request.partialBoundaries.push(boundary);
            }
          }
        }
      }
    }
  }

  request.allPendingTasks--;

  if (request.allPendingTasks === 0) {
    // This needs to be called at the very end so that we can synchronously write the result
    // in the callback if needed.
    var onAllReady = request.onAllReady;
    onAllReady();
  }
}

function retryTask(request, task) {
  {
    var blockedBoundary = task.blockedBoundary;
    setCurrentlyRenderingBoundaryResourcesTarget(
      request.resources,
      blockedBoundary ? blockedBoundary.resources : null
    );
  }

  var segment = task.blockedSegment;

  if (segment.status !== PENDING) {
    // We completed this by other means before we had a chance to retry it.
    return;
  } // We restore the context to what it was when we suspended.
  // We don't restore it after we leave because it's likely that we'll end up
  // needing a very similar context soon again.

  switchContext(task.context);
  var prevTaskInDEV = null;

  {
    prevTaskInDEV = currentTaskInDEV;
    currentTaskInDEV = task;
  }

  try {
    // We call the destructive form that mutates this task. That way if something
    // suspends again, we can reuse the same task instead of spawning a new one.
    // Reset the task's thenable state before continuing, so that if a later
    // component suspends we can reuse the same task object. If the same
    // component suspends again, the thenable state will be restored.
    var prevThenableState = task.thenableState;
    task.thenableState = null;
    renderNodeDestructive(request, task, prevThenableState, task.node);
    pushSegmentFinale$1(
      segment.chunks,
      request.responseState,
      segment.lastPushedText,
      segment.textEmbedded
    );
    task.abortSet.delete(task);
    segment.status = COMPLETED;
    finishedTask(request, task.blockedBoundary, segment);
  } catch (thrownValue) {
    resetHooksState();
    var x =
      thrownValue === SuspenseException // This is a special type of exception used for Suspense. For historical
        ? // reasons, the rest of the Suspense implementation expects the thrown
          // value to be a thenable, because before `use` existed that was the
          // (unstable) API for suspending. This implementation detail can change
          // later, once we deprecate the old API in favor of `use`.
          getSuspendedThenable()
        : thrownValue; // $FlowFixMe[method-unbinding]

    if (typeof x === "object" && x !== null && typeof x.then === "function") {
      // Something suspended again, let's pick it back up later.
      var ping = task.ping;
      x.then(ping, ping);
      task.thenableState = getThenableStateAfterSuspending();
    } else {
      task.abortSet.delete(task);
      segment.status = ERRORED;
      erroredTask(request, task.blockedBoundary, segment, x);
    }
  } finally {
    {
      setCurrentlyRenderingBoundaryResourcesTarget(request.resources, null);
    }

    {
      currentTaskInDEV = prevTaskInDEV;
    }
  }
}

function performWork(request) {
  if (request.status === CLOSED) {
    return;
  }

  var prevContext = getActiveContext();
  var prevDispatcher = ReactCurrentDispatcher$1.current;
  ReactCurrentDispatcher$1.current = HooksDispatcher;
  var prevCacheDispatcher;

  {
    prevCacheDispatcher = ReactCurrentCache.current;
    ReactCurrentCache.current = DefaultCacheDispatcher;
  }

  var previousHostDispatcher = prepareToRender(request.resources);
  var prevGetCurrentStackImpl;

  {
    prevGetCurrentStackImpl = ReactDebugCurrentFrame$1.getCurrentStack;
    ReactDebugCurrentFrame$1.getCurrentStack = getCurrentStackInDEV;
  }

  var prevResponseState = currentResponseState;
  setCurrentResponseState(request.responseState);

  try {
    var pingedTasks = request.pingedTasks;
    var i;

    for (i = 0; i < pingedTasks.length; i++) {
      var task = pingedTasks[i];
      retryTask(request, task);
    }

    pingedTasks.splice(0, i);

    if (request.destination !== null) {
      flushCompletedQueues(request, request.destination);
    }
  } catch (error) {
    logRecoverableError(request, error);
    fatalError(request, error);
  } finally {
    setCurrentResponseState(prevResponseState);
    ReactCurrentDispatcher$1.current = prevDispatcher;

    {
      ReactCurrentCache.current = prevCacheDispatcher;
    }

    cleanupAfterRender(previousHostDispatcher);

    {
      ReactDebugCurrentFrame$1.getCurrentStack = prevGetCurrentStackImpl;
    }

    if (prevDispatcher === HooksDispatcher) {
      // This means that we were in a reentrant work loop. This could happen
      // in a renderer that supports synchronous work like renderToString,
      // when it's called from within another renderer.
      // Normally we don't bother switching the contexts to their root/default
      // values when leaving because we'll likely need the same or similar
      // context again. However, when we're inside a synchronous loop like this
      // we'll to restore the context to what it was before returning.
      switchContext(prevContext);
    }
  }
}

function flushSubtree(request, destination, segment) {
  segment.parentFlushed = true;

  switch (segment.status) {
    case PENDING: {
      // We're emitting a placeholder for this segment to be filled in later.
      // Therefore we'll need to assign it an ID - to refer to it by.
      var segmentID = (segment.id = request.nextSegmentId++); // When this segment finally completes it won't be embedded in text since it will flush separately

      segment.lastPushedText = false;
      segment.textEmbedded = false;
      return writePlaceholder(destination, request.responseState, segmentID);
    }

    case COMPLETED: {
      segment.status = FLUSHED;
      var r = true;
      var chunks = segment.chunks;
      var chunkIdx = 0;
      var children = segment.children;

      for (var childIdx = 0; childIdx < children.length; childIdx++) {
        var nextChild = children[childIdx]; // Write all the chunks up until the next child.

        for (; chunkIdx < nextChild.index; chunkIdx++) {
          writeChunk(destination, chunks[chunkIdx]);
        }

        r = flushSegment(request, destination, nextChild);
      } // Finally just write all the remaining chunks

      for (; chunkIdx < chunks.length - 1; chunkIdx++) {
        writeChunk(destination, chunks[chunkIdx]);
      }

      if (chunkIdx < chunks.length) {
        r = writeChunkAndReturn(destination, chunks[chunkIdx]);
      }

      return r;
    }

    default: {
      throw new Error(
        "Aborted, errored or already flushed boundaries should not be flushed again. This is a bug in React."
      );
    }
  }
}

function flushSegment(request, destination, segment) {
  var boundary = segment.boundary;

  if (boundary === null) {
    // Not a suspense boundary.
    return flushSubtree(request, destination, segment);
  }

  boundary.parentFlushed = true; // This segment is a Suspense boundary. We need to decide whether to
  // emit the content or the fallback now.

  if (boundary.forceClientRender) {
    // Emit a client rendered suspense boundary wrapper.
    // We never queue the inner boundary so we'll never emit its content or partial segments.
    writeStartClientRenderedSuspenseBoundary$1(
      destination,
      request.responseState,
      boundary.errorDigest,
      boundary.errorMessage,
      boundary.errorComponentStack
    ); // Flush the fallback.

    flushSubtree(request, destination, segment);
    return writeEndClientRenderedSuspenseBoundary$1(
      destination,
      request.responseState
    );
  } else if (boundary.pendingTasks > 0) {
    // This boundary is still loading. Emit a pending suspense boundary wrapper.
    // Assign an ID to refer to the future content by.
    boundary.rootSegmentID = request.nextSegmentId++;

    if (boundary.completedSegments.length > 0) {
      // If this is at least partially complete, we can queue it to be partially emitted early.
      request.partialBoundaries.push(boundary);
    } /// This is the first time we should have referenced this ID.

    var id = (boundary.id = assignSuspenseBoundaryID(request.responseState));
    writeStartPendingSuspenseBoundary(destination, request.responseState, id); // Flush the fallback.

    flushSubtree(request, destination, segment);
    return writeEndPendingSuspenseBoundary(destination, request.responseState);
  } else if (boundary.byteSize > request.progressiveChunkSize) {
    // This boundary is large and will be emitted separately so that we can progressively show
    // other content. We add it to the queue during the flush because we have to ensure that
    // the parent flushes first so that there's something to inject it into.
    // We also have to make sure that it's emitted into the queue in a deterministic slot.
    // I.e. we can't insert it here when it completes.
    // Assign an ID to refer to the future content by.
    boundary.rootSegmentID = request.nextSegmentId++;
    request.completedBoundaries.push(boundary); // Emit a pending rendered suspense boundary wrapper.

    writeStartPendingSuspenseBoundary(
      destination,
      request.responseState,
      boundary.id
    ); // Flush the fallback.

    flushSubtree(request, destination, segment);
    return writeEndPendingSuspenseBoundary(destination, request.responseState);
  } else {
    {
      hoistResources(request.resources, boundary.resources);
    } // We can inline this boundary's content as a complete boundary.

    writeStartCompletedSuspenseBoundary$1(destination, request.responseState);
    var completedSegments = boundary.completedSegments;

    if (completedSegments.length !== 1) {
      throw new Error(
        "A previously unvisited boundary must have exactly one root segment. This is a bug in React."
      );
    }

    var contentSegment = completedSegments[0];
    flushSegment(request, destination, contentSegment);
    return writeEndCompletedSuspenseBoundary$1(
      destination,
      request.responseState
    );
  }
}

function flushInitialResources(
  destination,
  resources,
  responseState,
  willFlushAllSegments
) {
  writeInitialResources(
    destination,
    resources,
    responseState,
    willFlushAllSegments
  );
}

function flushImmediateResources(destination, request) {
  writeImmediateResources(
    destination,
    request.resources,
    request.responseState
  );
}

function flushClientRenderedBoundary(request, destination, boundary) {
  return writeClientRenderBoundaryInstruction(
    destination,
    request.responseState,
    boundary.id,
    boundary.errorDigest,
    boundary.errorMessage,
    boundary.errorComponentStack
  );
}

function flushSegmentContainer(request, destination, segment) {
  writeStartSegment(
    destination,
    request.responseState,
    segment.formatContext,
    segment.id
  );
  flushSegment(request, destination, segment);
  return writeEndSegment(destination, segment.formatContext);
}

function flushCompletedBoundary(request, destination, boundary) {
  {
    setCurrentlyRenderingBoundaryResourcesTarget(
      request.resources,
      boundary.resources
    );
  }

  var completedSegments = boundary.completedSegments;
  var i = 0;

  for (; i < completedSegments.length; i++) {
    var segment = completedSegments[i];
    flushPartiallyCompletedSegment(request, destination, boundary, segment);
  }

  completedSegments.length = 0;
  return writeCompletedBoundaryInstruction(
    destination,
    request.responseState,
    boundary.id,
    boundary.rootSegmentID,
    boundary.resources
  );
}

function flushPartialBoundary(request, destination, boundary) {
  {
    setCurrentlyRenderingBoundaryResourcesTarget(
      request.resources,
      boundary.resources
    );
  }

  var completedSegments = boundary.completedSegments;
  var i = 0;

  for (; i < completedSegments.length; i++) {
    var segment = completedSegments[i];

    if (
      !flushPartiallyCompletedSegment(request, destination, boundary, segment)
    ) {
      i++;
      completedSegments.splice(0, i); // Only write as much as the buffer wants. Something higher priority
      // might want to write later.

      return false;
    }
  }

  completedSegments.splice(0, i);
  return true;
}

function flushPartiallyCompletedSegment(
  request,
  destination,
  boundary,
  segment
) {
  if (segment.status === FLUSHED) {
    // We've already flushed this inline.
    return true;
  }

  var segmentID = segment.id;

  if (segmentID === -1) {
    // This segment wasn't previously referred to. This happens at the root of
    // a boundary. We make kind of a leap here and assume this is the root.
    var rootSegmentID = (segment.id = boundary.rootSegmentID);

    if (rootSegmentID === -1) {
      throw new Error(
        "A root segment ID must have been assigned by now. This is a bug in React."
      );
    }

    return flushSegmentContainer(request, destination, segment);
  } else {
    flushSegmentContainer(request, destination, segment);
    return writeCompletedSegmentInstruction(
      destination,
      request.responseState,
      segmentID
    );
  }
}

function flushCompletedQueues(request, destination) {
  try {
    // The structure of this is to go through each queue one by one and write
    // until the sink tells us to stop. When we should stop, we still finish writing
    // that item fully and then yield. At that point we remove the already completed
    // items up until the point we completed them.
    var i;
    var completedRootSegment = request.completedRootSegment;

    if (completedRootSegment !== null) {
      if (request.pendingRootTasks === 0) {
        if (enableFloat) {
          var preamble = request.preamble;

          for (i = 0; i < preamble.length; i++) {
            // we expect the preamble to be tiny and will ignore backpressure
            writeChunk(destination, preamble[i]);
          }

          flushInitialResources(
            destination,
            request.resources,
            request.responseState,
            request.allPendingTasks === 0
          );
        }

        flushSegment(request, destination, completedRootSegment);
        request.completedRootSegment = null;
        writeCompletedRoot(destination, request.responseState);
      } else {
        // We haven't flushed the root yet so we don't need to check any other branches further down
        return;
      }
    } else if (enableFloat) {
      flushImmediateResources(destination, request);
    } // We emit client rendering instructions for already emitted boundaries first.
    // This is so that we can signal to the client to start client rendering them as
    // soon as possible.

    var clientRenderedBoundaries = request.clientRenderedBoundaries;

    for (i = 0; i < clientRenderedBoundaries.length; i++) {
      var boundary = clientRenderedBoundaries[i];

      if (!flushClientRenderedBoundary(request, destination, boundary)) {
        request.destination = null;
        i++;
        clientRenderedBoundaries.splice(0, i);
        return;
      }
    }

    clientRenderedBoundaries.splice(0, i); // Next we emit any complete boundaries. It's better to favor boundaries
    // that are completely done since we can actually show them, than it is to emit
    // any individual segments from a partially complete boundary.

    var completedBoundaries = request.completedBoundaries;

    for (i = 0; i < completedBoundaries.length; i++) {
      var _boundary = completedBoundaries[i];

      if (!flushCompletedBoundary(request, destination, _boundary)) {
        request.destination = null;
        i++;
        completedBoundaries.splice(0, i);
        return;
      }
    }

    completedBoundaries.splice(0, i); // Allow anything written so far to flush to the underlying sink before
    // we continue with lower priorities.

    completeWriting(destination);
    beginWriting(destination); // TODO: Here we'll emit data used by hydration.
    // Next we emit any segments of any boundaries that are partially complete
    // but not deeply complete.

    var partialBoundaries = request.partialBoundaries;

    for (i = 0; i < partialBoundaries.length; i++) {
      var _boundary2 = partialBoundaries[i];

      if (!flushPartialBoundary(request, destination, _boundary2)) {
        request.destination = null;
        i++;
        partialBoundaries.splice(0, i);
        return;
      }
    }

    partialBoundaries.splice(0, i); // Next we check the completed boundaries again. This may have had
    // boundaries added to it in case they were too larged to be inlined.
    // New ones might be added in this loop.

    var largeBoundaries = request.completedBoundaries;

    for (i = 0; i < largeBoundaries.length; i++) {
      var _boundary3 = largeBoundaries[i];

      if (!flushCompletedBoundary(request, destination, _boundary3)) {
        request.destination = null;
        i++;
        largeBoundaries.splice(0, i);
        return;
      }
    }

    largeBoundaries.splice(0, i);
  } finally {
    if (
      request.allPendingTasks === 0 &&
      request.pingedTasks.length === 0 &&
      request.clientRenderedBoundaries.length === 0 &&
      request.completedBoundaries.length === 0 // We don't need to check any partially completed segments because
      // either they have pending task or they're complete.
    ) {
      {
        var postamble = request.postamble;

        for (var _i = 0; _i < postamble.length; _i++) {
          writeChunk(destination, postamble[_i]);
        }
      }

      {
        if (request.abortableTasks.size !== 0) {
          error(
            "There was still abortable task at the root when we closed. This is a bug in React."
          );
        }
      } // We're done.

      close(destination);
    }
  }
}

function startWork(request) {
  scheduleWork(function() {
    return performWork(request);
  });
}
function startFlowing(request, destination) {
  if (request.status === CLOSING) {
    request.status = CLOSED;
    closeWithError(destination, request.fatalError);
    return;
  }

  if (request.status === CLOSED) {
    return;
  }

  if (request.destination !== null) {
    // We're already flowing.
    return;
  }

  request.destination = destination;

  try {
    flushCompletedQueues(request, destination);
  } catch (error) {
    logRecoverableError(request, error);
    fatalError(request, error);
  }
} // This is called to early terminate a request. It puts all pending boundaries in client rendered state.

function abort(request, reason) {
  try {
    var abortableTasks = request.abortableTasks;

    if (abortableTasks.size > 0) {
      var error =
        reason === undefined
          ? new Error("The render was aborted by the server without a reason.")
          : reason;
      abortableTasks.forEach(function(task) {
        return abortTask(task, request, error);
      });
      abortableTasks.clear();
    }

    if (request.destination !== null) {
      flushCompletedQueues(request, request.destination);
    }
  } catch (error) {
    logRecoverableError(request, error);
    fatalError(request, error);
  }
}

function onError() {
  // Non-fatal errors are ignored.
}

function renderToStringImpl(
  children,
  options,
  generateStaticMarkup,
  abortReason,
  unstable_externalRuntimeSrc
) {
  var didFatal = false;
  var fatalError = null;
  var result = "";
  var destination = {
    // $FlowFixMe[missing-local-annot]
    push: function(chunk) {
      if (chunk !== null) {
        result += chunk;
      }

      return true;
    },
    // $FlowFixMe[missing-local-annot]
    destroy: function(error) {
      didFatal = true;
      fatalError = error;
    }
  };
  var readyToStream = false;

  function onShellReady() {
    readyToStream = true;
  }

  var request = createRequest(
    children,
    createResponseState$1(
      generateStaticMarkup,
      options ? options.identifierPrefix : undefined,
      unstable_externalRuntimeSrc
    ),
    createRootFormatContext(),
    Infinity,
    onError,
    undefined,
    onShellReady,
    undefined,
    undefined
  );
  startWork(request); // If anything suspended and is still pending, we'll abort it before writing.
  // That way we write only client-rendered boundaries from the start.

  abort(request, abortReason);
  startFlowing(request, destination);

  if (didFatal && fatalError !== abortReason) {
    throw fatalError;
  }

  if (!readyToStream) {
    // Note: This error message is the one we use on the client. It doesn't
    // really make sense here. But this is the legacy server renderer, anyway.
    // We're going to delete it soon.
    throw new Error(
      "A component suspended while responding to synchronous input. This " +
        "will cause the UI to be replaced with a loading indicator. To fix, " +
        "updates that suspend should be wrapped with startTransition."
    );
  }

  return result;
}

function renderToString(children, options) {
  return renderToStringImpl(
    children,
    options,
    false,
    'The server used "renderToString" which does not support Suspense. If you intended for this Suspense boundary to render the fallback content on the server consider throwing an Error somewhere within the Suspense boundary. If you intended to have the server wait for the suspended component please switch to "renderToReadableStream" which supports Suspense on the server'
  );
}

function renderToStaticMarkup(children, options) {
  return renderToStringImpl(
    children,
    options,
    true,
    'The server used "renderToStaticMarkup" which does not support Suspense. If you intended to have the server wait for the suspended component please switch to "renderToReadableStream" which supports Suspense on the server'
  );
}

function renderToNodeStream() {
  throw new Error(
    "ReactDOMServer.renderToNodeStream(): The streaming API is not available " +
      "in the browser. Use ReactDOMServer.renderToString() instead."
  );
}

function renderToStaticNodeStream() {
  throw new Error(
    "ReactDOMServer.renderToStaticNodeStream(): The streaming API is not available " +
      "in the browser. Use ReactDOMServer.renderToStaticMarkup() instead."
  );
}

exports.renderToNodeStream = renderToNodeStream;
exports.renderToStaticMarkup = renderToStaticMarkup;
exports.renderToStaticNodeStream = renderToStaticNodeStream;
exports.renderToString = renderToString;
exports.version = ReactVersion;

  })();
}
