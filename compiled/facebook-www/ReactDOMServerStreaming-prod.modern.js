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

/*


 JS Implementation of MurmurHash3 (r136) (as of May 20, 2011)

 Copyright (c) 2011 Gary Court
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
*/
"use strict";
var React = require("react"),
  ReactDOM = require("react-dom");
function murmurhash3_32_gc(key, seed) {
  var remainder = key.length & 3;
  var bytes = key.length - remainder;
  var h1 = seed;
  for (seed = 0; seed < bytes; ) {
    var k1 =
      (key.charCodeAt(seed) & 255) |
      ((key.charCodeAt(++seed) & 255) << 8) |
      ((key.charCodeAt(++seed) & 255) << 16) |
      ((key.charCodeAt(++seed) & 255) << 24);
    ++seed;
    k1 =
      (3432918353 * (k1 & 65535) +
        (((3432918353 * (k1 >>> 16)) & 65535) << 16)) &
      4294967295;
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 =
      (461845907 * (k1 & 65535) + (((461845907 * (k1 >>> 16)) & 65535) << 16)) &
      4294967295;
    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = (5 * (h1 & 65535) + (((5 * (h1 >>> 16)) & 65535) << 16)) & 4294967295;
    h1 = (h1 & 65535) + 27492 + ((((h1 >>> 16) + 58964) & 65535) << 16);
  }
  k1 = 0;
  switch (remainder) {
    case 3:
      k1 ^= (key.charCodeAt(seed + 2) & 255) << 16;
    case 2:
      k1 ^= (key.charCodeAt(seed + 1) & 255) << 8;
    case 1:
      (k1 ^= key.charCodeAt(seed) & 255),
        (k1 =
          (3432918353 * (k1 & 65535) +
            (((3432918353 * (k1 >>> 16)) & 65535) << 16)) &
          4294967295),
        (k1 = (k1 << 15) | (k1 >>> 17)),
        (h1 ^=
          (461845907 * (k1 & 65535) +
            (((461845907 * (k1 >>> 16)) & 65535) << 16)) &
          4294967295);
  }
  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 =
    (2246822507 * (h1 & 65535) + (((2246822507 * (h1 >>> 16)) & 65535) << 16)) &
    4294967295;
  h1 ^= h1 >>> 13;
  h1 =
    (3266489909 * (h1 & 65535) + (((3266489909 * (h1 >>> 16)) & 65535) << 16)) &
    4294967295;
  return (h1 ^ (h1 >>> 16)) >>> 0;
}
function writeChunk(destination, chunk) {
  destination.buffer += chunk;
}
function writeChunkAndReturn(destination, chunk) {
  destination.buffer += chunk;
  return !0;
}
var assign = Object.assign,
  dynamicFeatureFlags = require("ReactFeatureFlags"),
  enableTransitionTracing = dynamicFeatureFlags.enableTransitionTracing,
  enableCustomElementPropertySupport =
    dynamicFeatureFlags.enableCustomElementPropertySupport,
  enableAsyncActions = dynamicFeatureFlags.enableAsyncActions,
  enableUseDeferredValueInitialArg =
    dynamicFeatureFlags.enableUseDeferredValueInitialArg,
  hasOwnProperty = Object.prototype.hasOwnProperty,
  VALID_ATTRIBUTE_NAME_REGEX = RegExp(
    "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
  ),
  illegalAttributeNameCache = {},
  validatedAttributeNameCache = {};
function isAttributeNameSafe(attributeName) {
  if (hasOwnProperty.call(validatedAttributeNameCache, attributeName))
    return !0;
  if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) return !1;
  if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName))
    return (validatedAttributeNameCache[attributeName] = !0);
  illegalAttributeNameCache[attributeName] = !0;
  return !1;
}
var unitlessNumbers = new Set(
    "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
      " "
    )
  ),
  aliases = new Map([
    ["acceptCharset", "accept-charset"],
    ["htmlFor", "for"],
    ["httpEquiv", "http-equiv"],
    ["crossOrigin", "crossorigin"],
    ["accentHeight", "accent-height"],
    ["alignmentBaseline", "alignment-baseline"],
    ["arabicForm", "arabic-form"],
    ["baselineShift", "baseline-shift"],
    ["capHeight", "cap-height"],
    ["clipPath", "clip-path"],
    ["clipRule", "clip-rule"],
    ["colorInterpolation", "color-interpolation"],
    ["colorInterpolationFilters", "color-interpolation-filters"],
    ["colorProfile", "color-profile"],
    ["colorRendering", "color-rendering"],
    ["dominantBaseline", "dominant-baseline"],
    ["enableBackground", "enable-background"],
    ["fillOpacity", "fill-opacity"],
    ["fillRule", "fill-rule"],
    ["floodColor", "flood-color"],
    ["floodOpacity", "flood-opacity"],
    ["fontFamily", "font-family"],
    ["fontSize", "font-size"],
    ["fontSizeAdjust", "font-size-adjust"],
    ["fontStretch", "font-stretch"],
    ["fontStyle", "font-style"],
    ["fontVariant", "font-variant"],
    ["fontWeight", "font-weight"],
    ["glyphName", "glyph-name"],
    ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
    ["glyphOrientationVertical", "glyph-orientation-vertical"],
    ["horizAdvX", "horiz-adv-x"],
    ["horizOriginX", "horiz-origin-x"],
    ["imageRendering", "image-rendering"],
    ["letterSpacing", "letter-spacing"],
    ["lightingColor", "lighting-color"],
    ["markerEnd", "marker-end"],
    ["markerMid", "marker-mid"],
    ["markerStart", "marker-start"],
    ["overlinePosition", "overline-position"],
    ["overlineThickness", "overline-thickness"],
    ["paintOrder", "paint-order"],
    ["panose-1", "panose-1"],
    ["pointerEvents", "pointer-events"],
    ["renderingIntent", "rendering-intent"],
    ["shapeRendering", "shape-rendering"],
    ["stopColor", "stop-color"],
    ["stopOpacity", "stop-opacity"],
    ["strikethroughPosition", "strikethrough-position"],
    ["strikethroughThickness", "strikethrough-thickness"],
    ["strokeDasharray", "stroke-dasharray"],
    ["strokeDashoffset", "stroke-dashoffset"],
    ["strokeLinecap", "stroke-linecap"],
    ["strokeLinejoin", "stroke-linejoin"],
    ["strokeMiterlimit", "stroke-miterlimit"],
    ["strokeOpacity", "stroke-opacity"],
    ["strokeWidth", "stroke-width"],
    ["textAnchor", "text-anchor"],
    ["textDecoration", "text-decoration"],
    ["textRendering", "text-rendering"],
    ["transformOrigin", "transform-origin"],
    ["underlinePosition", "underline-position"],
    ["underlineThickness", "underline-thickness"],
    ["unicodeBidi", "unicode-bidi"],
    ["unicodeRange", "unicode-range"],
    ["unitsPerEm", "units-per-em"],
    ["vAlphabetic", "v-alphabetic"],
    ["vHanging", "v-hanging"],
    ["vIdeographic", "v-ideographic"],
    ["vMathematical", "v-mathematical"],
    ["vectorEffect", "vector-effect"],
    ["vertAdvY", "vert-adv-y"],
    ["vertOriginX", "vert-origin-x"],
    ["vertOriginY", "vert-origin-y"],
    ["wordSpacing", "word-spacing"],
    ["writingMode", "writing-mode"],
    ["xmlnsXlink", "xmlns:xlink"],
    ["xHeight", "x-height"]
  ]),
  matchHtmlRegExp = /["'&<>]/;
function escapeTextForBrowser(text) {
  if ("boolean" === typeof text || "number" === typeof text) return "" + text;
  text = "" + text;
  var match = matchHtmlRegExp.exec(text);
  if (match) {
    var html = "",
      index,
      lastIndex = 0;
    for (index = match.index; index < text.length; index++) {
      switch (text.charCodeAt(index)) {
        case 34:
          match = "&quot;";
          break;
        case 38:
          match = "&amp;";
          break;
        case 39:
          match = "&#x27;";
          break;
        case 60:
          match = "&lt;";
          break;
        case 62:
          match = "&gt;";
          break;
        default:
          continue;
      }
      lastIndex !== index && (html += text.slice(lastIndex, index));
      lastIndex = index + 1;
      html += match;
    }
    text = lastIndex !== index ? html + text.slice(lastIndex, index) : html;
  }
  return text;
}
var uppercasePattern = /([A-Z])/g,
  msPattern = /^ms-/,
  isJavaScriptProtocol =
    /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
function sanitizeURL(url) {
  return isJavaScriptProtocol.test("" + url)
    ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')"
    : url;
}
var isArrayImpl = Array.isArray,
  ReactSharedInternals =
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  ReactDOMCurrentDispatcher =
    ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Dispatcher,
  ReactDOMServerDispatcher = {
    prefetchDNS: prefetchDNS,
    preconnect: preconnect,
    preload: preload,
    preloadModule: preloadModule,
    preinitStyle: preinitStyle,
    preinitScript: preinitScript,
    preinitModuleScript: preinitModuleScript
  },
  PRELOAD_NO_CREDS = [],
  scriptRegex = /(<\/|<)(s)(cript)/gi;
function scriptReplacer(match, prefix, s, suffix) {
  return "" + prefix + ("s" === s ? "\\u0073" : "\\u0053") + suffix;
}
function createFormatContext(insertionMode, selectedValue, tagScope) {
  return {
    insertionMode: insertionMode,
    selectedValue: selectedValue,
    tagScope: tagScope
  };
}
function getChildFormatContext(parentContext, type, props) {
  switch (type) {
    case "noscript":
      return createFormatContext(2, null, parentContext.tagScope | 1);
    case "select":
      return createFormatContext(
        2,
        null != props.value ? props.value : props.defaultValue,
        parentContext.tagScope
      );
    case "svg":
      return createFormatContext(3, null, parentContext.tagScope);
    case "picture":
      return createFormatContext(2, null, parentContext.tagScope | 2);
    case "math":
      return createFormatContext(4, null, parentContext.tagScope);
    case "foreignObject":
      return createFormatContext(2, null, parentContext.tagScope);
    case "table":
      return createFormatContext(5, null, parentContext.tagScope);
    case "thead":
    case "tbody":
    case "tfoot":
      return createFormatContext(6, null, parentContext.tagScope);
    case "colgroup":
      return createFormatContext(8, null, parentContext.tagScope);
    case "tr":
      return createFormatContext(7, null, parentContext.tagScope);
  }
  return 5 <= parentContext.insertionMode
    ? createFormatContext(2, null, parentContext.tagScope)
    : 0 === parentContext.insertionMode
    ? "html" === type
      ? createFormatContext(1, null, parentContext.tagScope)
      : createFormatContext(2, null, parentContext.tagScope)
    : 1 === parentContext.insertionMode
    ? createFormatContext(2, null, parentContext.tagScope)
    : parentContext;
}
function pushTextInstance(target, text, renderState, textEmbedded) {
  if ("" === text) return textEmbedded;
  textEmbedded && target.push("\x3c!-- --\x3e");
  target.push(escapeTextForBrowser(text));
  return !0;
}
var styleNameCache = new Map();
function pushStyleAttribute(target, style) {
  if ("object" !== typeof style)
    throw Error(
      "The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX."
    );
  var isFirst = !0,
    styleName;
  for (styleName in style)
    if (hasOwnProperty.call(style, styleName)) {
      var styleValue = style[styleName];
      if (
        null != styleValue &&
        "boolean" !== typeof styleValue &&
        "" !== styleValue
      ) {
        if (0 === styleName.indexOf("--")) {
          var nameChunk = escapeTextForBrowser(styleName);
          styleValue = escapeTextForBrowser(("" + styleValue).trim());
        } else
          (nameChunk = styleNameCache.get(styleName)),
            void 0 === nameChunk &&
              ((nameChunk = escapeTextForBrowser(
                styleName
                  .replace(uppercasePattern, "-$1")
                  .toLowerCase()
                  .replace(msPattern, "-ms-")
              )),
              styleNameCache.set(styleName, nameChunk)),
            (styleValue =
              "number" === typeof styleValue
                ? 0 === styleValue || unitlessNumbers.has(styleName)
                  ? "" + styleValue
                  : styleValue + "px"
                : escapeTextForBrowser(("" + styleValue).trim()));
        isFirst
          ? ((isFirst = !1),
            target.push(' style="', nameChunk, ":", styleValue))
          : target.push(";", nameChunk, ":", styleValue);
      }
    }
  isFirst || target.push('"');
}
function pushBooleanAttribute(target, name, value) {
  value &&
    "function" !== typeof value &&
    "symbol" !== typeof value &&
    target.push(" ", name, '=""');
}
function pushStringAttribute(target, name, value) {
  "function" !== typeof value &&
    "symbol" !== typeof value &&
    "boolean" !== typeof value &&
    target.push(" ", name, '="', escapeTextForBrowser(value), '"');
}
escapeTextForBrowser(
  "javascript:throw new Error('A React form was unexpectedly submitted.')"
);
function pushAdditionalFormField(value, key) {
  this.push('<input type="hidden"');
  if ("string" !== typeof value)
    throw Error(
      "File/Blob fields are not yet supported in progressive forms. It probably means you are closing over binary data or FormData in a Server Action."
    );
  pushStringAttribute(this, "name", key);
  pushStringAttribute(this, "value", value);
  this.push("/>");
}
function pushFormActionAttribute(
  target,
  resumableState,
  renderState,
  formAction,
  formEncType,
  formMethod,
  formTarget,
  name
) {
  null != name && pushAttribute(target, "name", name);
  null != formAction && pushAttribute(target, "formAction", formAction);
  null != formEncType && pushAttribute(target, "formEncType", formEncType);
  null != formMethod && pushAttribute(target, "formMethod", formMethod);
  null != formTarget && pushAttribute(target, "formTarget", formTarget);
  return null;
}
function pushAttribute(target, name, value) {
  switch (name) {
    case "className":
      pushStringAttribute(target, "class", value);
      break;
    case "tabIndex":
      pushStringAttribute(target, "tabindex", value);
      break;
    case "dir":
    case "role":
    case "viewBox":
    case "width":
    case "height":
      pushStringAttribute(target, name, value);
      break;
    case "style":
      pushStyleAttribute(target, value);
      break;
    case "src":
    case "href":
      if ("" === value) break;
    case "action":
    case "formAction":
      if (
        null == value ||
        "function" === typeof value ||
        "symbol" === typeof value ||
        "boolean" === typeof value
      )
        break;
      value = sanitizeURL("" + value);
      target.push(" ", name, '="', escapeTextForBrowser(value), '"');
      break;
    case "defaultValue":
    case "defaultChecked":
    case "innerHTML":
    case "suppressContentEditableWarning":
    case "suppressHydrationWarning":
      break;
    case "autoFocus":
    case "multiple":
    case "muted":
      pushBooleanAttribute(target, name.toLowerCase(), value);
      break;
    case "xlinkHref":
      if (
        "function" === typeof value ||
        "symbol" === typeof value ||
        "boolean" === typeof value
      )
        break;
      value = sanitizeURL("" + value);
      target.push(" ", "xlink:href", '="', escapeTextForBrowser(value), '"');
      break;
    case "contentEditable":
    case "spellCheck":
    case "draggable":
    case "value":
    case "autoReverse":
    case "externalResourcesRequired":
    case "focusable":
    case "preserveAlpha":
      "function" !== typeof value &&
        "symbol" !== typeof value &&
        target.push(" ", name, '="', escapeTextForBrowser(value), '"');
      break;
    case "allowFullScreen":
    case "async":
    case "autoPlay":
    case "controls":
    case "default":
    case "defer":
    case "disabled":
    case "disablePictureInPicture":
    case "disableRemotePlayback":
    case "formNoValidate":
    case "hidden":
    case "loop":
    case "noModule":
    case "noValidate":
    case "open":
    case "playsInline":
    case "readOnly":
    case "required":
    case "reversed":
    case "scoped":
    case "seamless":
    case "itemScope":
      value &&
        "function" !== typeof value &&
        "symbol" !== typeof value &&
        target.push(" ", name, '=""');
      break;
    case "capture":
    case "download":
      !0 === value
        ? target.push(" ", name, '=""')
        : !1 !== value &&
          "function" !== typeof value &&
          "symbol" !== typeof value &&
          target.push(" ", name, '="', escapeTextForBrowser(value), '"');
      break;
    case "cols":
    case "rows":
    case "size":
    case "span":
      "function" !== typeof value &&
        "symbol" !== typeof value &&
        !isNaN(value) &&
        1 <= value &&
        target.push(" ", name, '="', escapeTextForBrowser(value), '"');
      break;
    case "rowSpan":
    case "start":
      "function" === typeof value ||
        "symbol" === typeof value ||
        isNaN(value) ||
        target.push(" ", name, '="', escapeTextForBrowser(value), '"');
      break;
    case "xlinkActuate":
      pushStringAttribute(target, "xlink:actuate", value);
      break;
    case "xlinkArcrole":
      pushStringAttribute(target, "xlink:arcrole", value);
      break;
    case "xlinkRole":
      pushStringAttribute(target, "xlink:role", value);
      break;
    case "xlinkShow":
      pushStringAttribute(target, "xlink:show", value);
      break;
    case "xlinkTitle":
      pushStringAttribute(target, "xlink:title", value);
      break;
    case "xlinkType":
      pushStringAttribute(target, "xlink:type", value);
      break;
    case "xmlBase":
      pushStringAttribute(target, "xml:base", value);
      break;
    case "xmlLang":
      pushStringAttribute(target, "xml:lang", value);
      break;
    case "xmlSpace":
      pushStringAttribute(target, "xml:space", value);
      break;
    default:
      if (
        !(2 < name.length) ||
        ("o" !== name[0] && "O" !== name[0]) ||
        ("n" !== name[1] && "N" !== name[1])
      )
        if (((name = aliases.get(name) || name), isAttributeNameSafe(name))) {
          switch (typeof value) {
            case "function":
            case "symbol":
              return;
            case "boolean":
              var prefix$7 = name.toLowerCase().slice(0, 5);
              if ("data-" !== prefix$7 && "aria-" !== prefix$7) return;
          }
          target.push(" ", name, '="', escapeTextForBrowser(value), '"');
        }
  }
}
function pushInnerHTML(target, innerHTML, children) {
  if (null != innerHTML) {
    if (null != children)
      throw Error(
        "Can only set one of `children` or `props.dangerouslySetInnerHTML`."
      );
    if ("object" !== typeof innerHTML || !("__html" in innerHTML))
      throw Error(
        "`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://reactjs.org/link/dangerously-set-inner-html for more information."
      );
    innerHTML = innerHTML.__html;
    null !== innerHTML && void 0 !== innerHTML && target.push("" + innerHTML);
  }
}
function flattenOptionChildren(children) {
  var content = "";
  React.Children.forEach(children, function (child) {
    null != child && (content += child);
  });
  return content;
}
function pushLink(
  target,
  props,
  resumableState,
  renderState,
  textEmbedded,
  insertionMode,
  noscriptTagInScope
) {
  var rel = props.rel,
    href = props.href,
    precedence = props.precedence;
  if (
    3 === insertionMode ||
    noscriptTagInScope ||
    null != props.itemProp ||
    "string" !== typeof rel ||
    "string" !== typeof href ||
    "" === href
  )
    return pushLinkImpl(target, props), null;
  if ("stylesheet" === props.rel) {
    if (
      "string" !== typeof precedence ||
      null != props.disabled ||
      props.onLoad ||
      props.onError
    )
      return pushLinkImpl(target, props);
    insertionMode = renderState.styles.get(precedence);
    noscriptTagInScope = resumableState.styleResources.hasOwnProperty(href)
      ? resumableState.styleResources[href]
      : void 0;
    null !== noscriptTagInScope
      ? ((resumableState.styleResources[href] = null),
        insertionMode ||
          ((insertionMode = {
            precedence: escapeTextForBrowser(precedence),
            rules: [],
            hrefs: [],
            sheets: new Map()
          }),
          renderState.styles.set(precedence, insertionMode)),
        (props = {
          state: 0,
          props: assign({}, props, {
            "data-precedence": props.precedence,
            precedence: null
          })
        }),
        noscriptTagInScope &&
          (2 === noscriptTagInScope.length &&
            adoptPreloadCredentials(props.props, noscriptTagInScope),
          (resumableState = renderState.preloads.stylesheets.get(href)) &&
          0 < resumableState.length
            ? (resumableState.length = 0)
            : (props.state = 1)),
        insertionMode.sheets.set(href, props),
        renderState.boundaryResources &&
          renderState.boundaryResources.stylesheets.add(props))
      : insertionMode &&
        (href = insertionMode.sheets.get(href)) &&
        renderState.boundaryResources &&
        renderState.boundaryResources.stylesheets.add(href);
    textEmbedded && target.push("\x3c!-- --\x3e");
    return null;
  }
  if (props.onLoad || props.onError) return pushLinkImpl(target, props);
  textEmbedded && target.push("\x3c!-- --\x3e");
  switch (props.rel) {
    case "preconnect":
    case "dns-prefetch":
      return pushLinkImpl(renderState.preconnectChunks, props);
    case "preload":
      return pushLinkImpl(renderState.preloadChunks, props);
    default:
      return pushLinkImpl(renderState.hoistableChunks, props);
  }
}
function pushLinkImpl(target, props) {
  target.push(startChunkForTag("link"));
  for (var propKey in props)
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];
      if (null != propValue)
        switch (propKey) {
          case "children":
          case "dangerouslySetInnerHTML":
            throw Error(
              "link is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`."
            );
          default:
            pushAttribute(target, propKey, propValue);
        }
    }
  target.push("/>");
  return null;
}
function pushSelfClosing(target, props, tag) {
  target.push(startChunkForTag(tag));
  for (var propKey in props)
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];
      if (null != propValue)
        switch (propKey) {
          case "children":
          case "dangerouslySetInnerHTML":
            throw Error(
              tag +
                " is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`."
            );
          default:
            pushAttribute(target, propKey, propValue);
        }
    }
  target.push("/>");
  return null;
}
function pushTitleImpl(target, props) {
  target.push(startChunkForTag("title"));
  var children = null,
    innerHTML = null,
    propKey;
  for (propKey in props)
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];
      if (null != propValue)
        switch (propKey) {
          case "children":
            children = propValue;
            break;
          case "dangerouslySetInnerHTML":
            innerHTML = propValue;
            break;
          default:
            pushAttribute(target, propKey, propValue);
        }
    }
  target.push(">");
  props = Array.isArray(children)
    ? 2 > children.length
      ? children[0]
      : null
    : children;
  "function" !== typeof props &&
    "symbol" !== typeof props &&
    null !== props &&
    void 0 !== props &&
    target.push(escapeTextForBrowser("" + props));
  pushInnerHTML(target, innerHTML, children);
  target.push(endChunkForTag("title"));
  return null;
}
function pushScriptImpl(target, props) {
  target.push(startChunkForTag("script"));
  var children = null,
    innerHTML = null,
    propKey;
  for (propKey in props)
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];
      if (null != propValue)
        switch (propKey) {
          case "children":
            children = propValue;
            break;
          case "dangerouslySetInnerHTML":
            innerHTML = propValue;
            break;
          default:
            pushAttribute(target, propKey, propValue);
        }
    }
  target.push(">");
  pushInnerHTML(target, innerHTML, children);
  "string" === typeof children && target.push(escapeTextForBrowser(children));
  target.push(endChunkForTag("script"));
  return null;
}
function pushStartGenericElement(target, props, tag) {
  target.push(startChunkForTag(tag));
  var innerHTML = (tag = null),
    propKey;
  for (propKey in props)
    if (hasOwnProperty.call(props, propKey)) {
      var propValue = props[propKey];
      if (null != propValue)
        switch (propKey) {
          case "children":
            tag = propValue;
            break;
          case "dangerouslySetInnerHTML":
            innerHTML = propValue;
            break;
          default:
            pushAttribute(target, propKey, propValue);
        }
    }
  target.push(">");
  pushInnerHTML(target, innerHTML, tag);
  return "string" === typeof tag
    ? (target.push(escapeTextForBrowser(tag)), null)
    : tag;
}
var VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/,
  validatedTagCache = new Map();
function startChunkForTag(tag) {
  var tagStartChunk = validatedTagCache.get(tag);
  if (void 0 === tagStartChunk) {
    if (!VALID_TAG_REGEX.test(tag)) throw Error("Invalid tag: " + tag);
    tagStartChunk = "<" + tag;
    validatedTagCache.set(tag, tagStartChunk);
  }
  return tagStartChunk;
}
function pushStartInstance(
  target$jscomp$0,
  type,
  props,
  resumableState,
  renderState,
  formatContext,
  textEmbedded
) {
  switch (type) {
    case "div":
    case "span":
    case "svg":
    case "path":
    case "a":
    case "g":
    case "p":
    case "li":
      break;
    case "select":
      target$jscomp$0.push(startChunkForTag("select"));
      var children = null,
        innerHTML = null,
        propKey;
      for (propKey in props)
        if (hasOwnProperty.call(props, propKey)) {
          var propValue = props[propKey];
          if (null != propValue)
            switch (propKey) {
              case "children":
                children = propValue;
                break;
              case "dangerouslySetInnerHTML":
                innerHTML = propValue;
                break;
              case "defaultValue":
              case "value":
                break;
              default:
                pushAttribute(target$jscomp$0, propKey, propValue);
            }
        }
      target$jscomp$0.push(">");
      pushInnerHTML(target$jscomp$0, innerHTML, children);
      return children;
    case "option":
      var selectedValue = formatContext.selectedValue;
      target$jscomp$0.push(startChunkForTag("option"));
      var children$jscomp$0 = null,
        value = null,
        selected = null,
        innerHTML$jscomp$0 = null,
        propKey$jscomp$0;
      for (propKey$jscomp$0 in props)
        if (hasOwnProperty.call(props, propKey$jscomp$0)) {
          var propValue$jscomp$0 = props[propKey$jscomp$0];
          if (null != propValue$jscomp$0)
            switch (propKey$jscomp$0) {
              case "children":
                children$jscomp$0 = propValue$jscomp$0;
                break;
              case "selected":
                selected = propValue$jscomp$0;
                break;
              case "dangerouslySetInnerHTML":
                innerHTML$jscomp$0 = propValue$jscomp$0;
                break;
              case "value":
                value = propValue$jscomp$0;
              default:
                pushAttribute(
                  target$jscomp$0,
                  propKey$jscomp$0,
                  propValue$jscomp$0
                );
            }
        }
      if (null != selectedValue) {
        var stringValue =
          null !== value
            ? "" + value
            : flattenOptionChildren(children$jscomp$0);
        if (isArrayImpl(selectedValue))
          for (var i = 0; i < selectedValue.length; i++) {
            if ("" + selectedValue[i] === stringValue) {
              target$jscomp$0.push(' selected=""');
              break;
            }
          }
        else
          "" + selectedValue === stringValue &&
            target$jscomp$0.push(' selected=""');
      } else selected && target$jscomp$0.push(' selected=""');
      target$jscomp$0.push(">");
      pushInnerHTML(target$jscomp$0, innerHTML$jscomp$0, children$jscomp$0);
      return children$jscomp$0;
    case "textarea":
      target$jscomp$0.push(startChunkForTag("textarea"));
      var value$jscomp$0 = null,
        defaultValue = null,
        children$jscomp$1 = null,
        propKey$jscomp$1;
      for (propKey$jscomp$1 in props)
        if (hasOwnProperty.call(props, propKey$jscomp$1)) {
          var propValue$jscomp$1 = props[propKey$jscomp$1];
          if (null != propValue$jscomp$1)
            switch (propKey$jscomp$1) {
              case "children":
                children$jscomp$1 = propValue$jscomp$1;
                break;
              case "value":
                value$jscomp$0 = propValue$jscomp$1;
                break;
              case "defaultValue":
                defaultValue = propValue$jscomp$1;
                break;
              case "dangerouslySetInnerHTML":
                throw Error(
                  "`dangerouslySetInnerHTML` does not make sense on <textarea>."
                );
              default:
                pushAttribute(
                  target$jscomp$0,
                  propKey$jscomp$1,
                  propValue$jscomp$1
                );
            }
        }
      null === value$jscomp$0 &&
        null !== defaultValue &&
        (value$jscomp$0 = defaultValue);
      target$jscomp$0.push(">");
      if (null != children$jscomp$1) {
        if (null != value$jscomp$0)
          throw Error(
            "If you supply `defaultValue` on a <textarea>, do not pass children."
          );
        if (isArrayImpl(children$jscomp$1)) {
          if (1 < children$jscomp$1.length)
            throw Error("<textarea> can only have at most one child.");
          value$jscomp$0 = "" + children$jscomp$1[0];
        }
        value$jscomp$0 = "" + children$jscomp$1;
      }
      "string" === typeof value$jscomp$0 &&
        "\n" === value$jscomp$0[0] &&
        target$jscomp$0.push("\n");
      null !== value$jscomp$0 &&
        target$jscomp$0.push(escapeTextForBrowser("" + value$jscomp$0));
      return null;
    case "input":
      target$jscomp$0.push(startChunkForTag("input"));
      var name = null,
        formAction = null,
        formEncType = null,
        formMethod = null,
        formTarget = null,
        value$jscomp$1 = null,
        defaultValue$jscomp$0 = null,
        checked = null,
        defaultChecked = null,
        propKey$jscomp$2;
      for (propKey$jscomp$2 in props)
        if (hasOwnProperty.call(props, propKey$jscomp$2)) {
          var propValue$jscomp$2 = props[propKey$jscomp$2];
          if (null != propValue$jscomp$2)
            switch (propKey$jscomp$2) {
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(
                  "input is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`."
                );
              case "name":
                name = propValue$jscomp$2;
                break;
              case "formAction":
                formAction = propValue$jscomp$2;
                break;
              case "formEncType":
                formEncType = propValue$jscomp$2;
                break;
              case "formMethod":
                formMethod = propValue$jscomp$2;
                break;
              case "formTarget":
                formTarget = propValue$jscomp$2;
                break;
              case "defaultChecked":
                defaultChecked = propValue$jscomp$2;
                break;
              case "defaultValue":
                defaultValue$jscomp$0 = propValue$jscomp$2;
                break;
              case "checked":
                checked = propValue$jscomp$2;
                break;
              case "value":
                value$jscomp$1 = propValue$jscomp$2;
                break;
              default:
                pushAttribute(
                  target$jscomp$0,
                  propKey$jscomp$2,
                  propValue$jscomp$2
                );
            }
        }
      var formData = pushFormActionAttribute(
        target$jscomp$0,
        resumableState,
        renderState,
        formAction,
        formEncType,
        formMethod,
        formTarget,
        name
      );
      null !== checked
        ? pushBooleanAttribute(target$jscomp$0, "checked", checked)
        : null !== defaultChecked &&
          pushBooleanAttribute(target$jscomp$0, "checked", defaultChecked);
      null !== value$jscomp$1
        ? pushAttribute(target$jscomp$0, "value", value$jscomp$1)
        : null !== defaultValue$jscomp$0 &&
          pushAttribute(target$jscomp$0, "value", defaultValue$jscomp$0);
      target$jscomp$0.push("/>");
      null !== formData &&
        formData.forEach(pushAdditionalFormField, target$jscomp$0);
      return null;
    case "button":
      target$jscomp$0.push(startChunkForTag("button"));
      var children$jscomp$2 = null,
        innerHTML$jscomp$1 = null,
        name$jscomp$0 = null,
        formAction$jscomp$0 = null,
        formEncType$jscomp$0 = null,
        formMethod$jscomp$0 = null,
        formTarget$jscomp$0 = null,
        propKey$jscomp$3;
      for (propKey$jscomp$3 in props)
        if (hasOwnProperty.call(props, propKey$jscomp$3)) {
          var propValue$jscomp$3 = props[propKey$jscomp$3];
          if (null != propValue$jscomp$3)
            switch (propKey$jscomp$3) {
              case "children":
                children$jscomp$2 = propValue$jscomp$3;
                break;
              case "dangerouslySetInnerHTML":
                innerHTML$jscomp$1 = propValue$jscomp$3;
                break;
              case "name":
                name$jscomp$0 = propValue$jscomp$3;
                break;
              case "formAction":
                formAction$jscomp$0 = propValue$jscomp$3;
                break;
              case "formEncType":
                formEncType$jscomp$0 = propValue$jscomp$3;
                break;
              case "formMethod":
                formMethod$jscomp$0 = propValue$jscomp$3;
                break;
              case "formTarget":
                formTarget$jscomp$0 = propValue$jscomp$3;
                break;
              default:
                pushAttribute(
                  target$jscomp$0,
                  propKey$jscomp$3,
                  propValue$jscomp$3
                );
            }
        }
      var formData$jscomp$0 = pushFormActionAttribute(
        target$jscomp$0,
        resumableState,
        renderState,
        formAction$jscomp$0,
        formEncType$jscomp$0,
        formMethod$jscomp$0,
        formTarget$jscomp$0,
        name$jscomp$0
      );
      target$jscomp$0.push(">");
      null !== formData$jscomp$0 &&
        formData$jscomp$0.forEach(pushAdditionalFormField, target$jscomp$0);
      pushInnerHTML(target$jscomp$0, innerHTML$jscomp$1, children$jscomp$2);
      if ("string" === typeof children$jscomp$2) {
        target$jscomp$0.push(escapeTextForBrowser(children$jscomp$2));
        var JSCompiler_inline_result = null;
      } else JSCompiler_inline_result = children$jscomp$2;
      return JSCompiler_inline_result;
    case "form":
      target$jscomp$0.push(startChunkForTag("form"));
      var children$jscomp$3 = null,
        innerHTML$jscomp$2 = null,
        formAction$jscomp$1 = null,
        formEncType$jscomp$1 = null,
        formMethod$jscomp$1 = null,
        formTarget$jscomp$1 = null,
        propKey$jscomp$4;
      for (propKey$jscomp$4 in props)
        if (hasOwnProperty.call(props, propKey$jscomp$4)) {
          var propValue$jscomp$4 = props[propKey$jscomp$4];
          if (null != propValue$jscomp$4)
            switch (propKey$jscomp$4) {
              case "children":
                children$jscomp$3 = propValue$jscomp$4;
                break;
              case "dangerouslySetInnerHTML":
                innerHTML$jscomp$2 = propValue$jscomp$4;
                break;
              case "action":
                formAction$jscomp$1 = propValue$jscomp$4;
                break;
              case "encType":
                formEncType$jscomp$1 = propValue$jscomp$4;
                break;
              case "method":
                formMethod$jscomp$1 = propValue$jscomp$4;
                break;
              case "target":
                formTarget$jscomp$1 = propValue$jscomp$4;
                break;
              default:
                pushAttribute(
                  target$jscomp$0,
                  propKey$jscomp$4,
                  propValue$jscomp$4
                );
            }
        }
      null != formAction$jscomp$1 &&
        pushAttribute(target$jscomp$0, "action", formAction$jscomp$1);
      null != formEncType$jscomp$1 &&
        pushAttribute(target$jscomp$0, "encType", formEncType$jscomp$1);
      null != formMethod$jscomp$1 &&
        pushAttribute(target$jscomp$0, "method", formMethod$jscomp$1);
      null != formTarget$jscomp$1 &&
        pushAttribute(target$jscomp$0, "target", formTarget$jscomp$1);
      target$jscomp$0.push(">");
      pushInnerHTML(target$jscomp$0, innerHTML$jscomp$2, children$jscomp$3);
      if ("string" === typeof children$jscomp$3) {
        target$jscomp$0.push(escapeTextForBrowser(children$jscomp$3));
        var JSCompiler_inline_result$jscomp$0 = null;
      } else JSCompiler_inline_result$jscomp$0 = children$jscomp$3;
      return JSCompiler_inline_result$jscomp$0;
    case "menuitem":
      target$jscomp$0.push(startChunkForTag("menuitem"));
      for (var propKey$jscomp$5 in props)
        if (hasOwnProperty.call(props, propKey$jscomp$5)) {
          var propValue$jscomp$5 = props[propKey$jscomp$5];
          if (null != propValue$jscomp$5)
            switch (propKey$jscomp$5) {
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(
                  "menuitems cannot have `children` nor `dangerouslySetInnerHTML`."
                );
              default:
                pushAttribute(
                  target$jscomp$0,
                  propKey$jscomp$5,
                  propValue$jscomp$5
                );
            }
        }
      target$jscomp$0.push(">");
      return null;
    case "title":
      if (
        3 === formatContext.insertionMode ||
        formatContext.tagScope & 1 ||
        null != props.itemProp
      )
        var JSCompiler_inline_result$jscomp$1 = pushTitleImpl(
          target$jscomp$0,
          props
        );
      else
        pushTitleImpl(renderState.hoistableChunks, props),
          (JSCompiler_inline_result$jscomp$1 = null);
      return JSCompiler_inline_result$jscomp$1;
    case "link":
      return pushLink(
        target$jscomp$0,
        props,
        resumableState,
        renderState,
        textEmbedded,
        formatContext.insertionMode,
        !!(formatContext.tagScope & 1)
      );
    case "script":
      var asyncProp = props.async;
      if (
        "string" !== typeof props.src ||
        !props.src ||
        !asyncProp ||
        "function" === typeof asyncProp ||
        "symbol" === typeof asyncProp ||
        props.onLoad ||
        props.onError ||
        3 === formatContext.insertionMode ||
        formatContext.tagScope & 1 ||
        null != props.itemProp
      )
        var JSCompiler_inline_result$jscomp$2 = pushScriptImpl(
          target$jscomp$0,
          props
        );
      else {
        var key = props.src;
        if ("module" === props.type) {
          var resources = resumableState.moduleScriptResources;
          var preloads = renderState.preloads.moduleScripts;
        } else
          (resources = resumableState.scriptResources),
            (preloads = renderState.preloads.scripts);
        var resourceState = resources.hasOwnProperty(key)
          ? resources[key]
          : void 0;
        if (null !== resourceState) {
          resources[key] = null;
          var scriptProps = props;
          if (resourceState) {
            2 === resourceState.length &&
              ((scriptProps = assign({}, props)),
              adoptPreloadCredentials(scriptProps, resourceState));
            var preloadResource = preloads.get(key);
            preloadResource && (preloadResource.length = 0);
          }
          var resource = [];
          renderState.scripts.add(resource);
          pushScriptImpl(resource, scriptProps);
        }
        textEmbedded && target$jscomp$0.push("\x3c!-- --\x3e");
        JSCompiler_inline_result$jscomp$2 = null;
      }
      return JSCompiler_inline_result$jscomp$2;
    case "style":
      var precedence = props.precedence,
        href = props.href;
      if (
        3 === formatContext.insertionMode ||
        formatContext.tagScope & 1 ||
        null != props.itemProp ||
        "string" !== typeof precedence ||
        "string" !== typeof href ||
        "" === href
      ) {
        target$jscomp$0.push(startChunkForTag("style"));
        var children$jscomp$4 = null,
          innerHTML$jscomp$3 = null,
          propKey$jscomp$6;
        for (propKey$jscomp$6 in props)
          if (hasOwnProperty.call(props, propKey$jscomp$6)) {
            var propValue$jscomp$6 = props[propKey$jscomp$6];
            if (null != propValue$jscomp$6)
              switch (propKey$jscomp$6) {
                case "children":
                  children$jscomp$4 = propValue$jscomp$6;
                  break;
                case "dangerouslySetInnerHTML":
                  innerHTML$jscomp$3 = propValue$jscomp$6;
                  break;
                default:
                  pushAttribute(
                    target$jscomp$0,
                    propKey$jscomp$6,
                    propValue$jscomp$6
                  );
              }
          }
        target$jscomp$0.push(">");
        var child = Array.isArray(children$jscomp$4)
          ? 2 > children$jscomp$4.length
            ? children$jscomp$4[0]
            : null
          : children$jscomp$4;
        "function" !== typeof child &&
          "symbol" !== typeof child &&
          null !== child &&
          void 0 !== child &&
          target$jscomp$0.push(escapeTextForBrowser("" + child));
        pushInnerHTML(target$jscomp$0, innerHTML$jscomp$3, children$jscomp$4);
        target$jscomp$0.push(endChunkForTag("style"));
        var JSCompiler_inline_result$jscomp$3 = null;
      } else {
        var styleQueue = renderState.styles.get(precedence);
        if (
          null !==
          (resumableState.styleResources.hasOwnProperty(href)
            ? resumableState.styleResources[href]
            : void 0)
        ) {
          resumableState.styleResources[href] = null;
          styleQueue
            ? styleQueue.hrefs.push(escapeTextForBrowser(href))
            : ((styleQueue = {
                precedence: escapeTextForBrowser(precedence),
                rules: [],
                hrefs: [escapeTextForBrowser(href)],
                sheets: new Map()
              }),
              renderState.styles.set(precedence, styleQueue));
          var target = styleQueue.rules,
            children$jscomp$5 = null,
            innerHTML$jscomp$4 = null,
            propKey$jscomp$7;
          for (propKey$jscomp$7 in props)
            if (hasOwnProperty.call(props, propKey$jscomp$7)) {
              var propValue$jscomp$7 = props[propKey$jscomp$7];
              if (null != propValue$jscomp$7)
                switch (propKey$jscomp$7) {
                  case "children":
                    children$jscomp$5 = propValue$jscomp$7;
                    break;
                  case "dangerouslySetInnerHTML":
                    innerHTML$jscomp$4 = propValue$jscomp$7;
                }
            }
          var child$jscomp$0 = Array.isArray(children$jscomp$5)
            ? 2 > children$jscomp$5.length
              ? children$jscomp$5[0]
              : null
            : children$jscomp$5;
          "function" !== typeof child$jscomp$0 &&
            "symbol" !== typeof child$jscomp$0 &&
            null !== child$jscomp$0 &&
            void 0 !== child$jscomp$0 &&
            target.push(escapeTextForBrowser("" + child$jscomp$0));
          pushInnerHTML(target, innerHTML$jscomp$4, children$jscomp$5);
        }
        styleQueue &&
          renderState.boundaryResources &&
          renderState.boundaryResources.styles.add(styleQueue);
        textEmbedded && target$jscomp$0.push("\x3c!-- --\x3e");
        JSCompiler_inline_result$jscomp$3 = void 0;
      }
      return JSCompiler_inline_result$jscomp$3;
    case "meta":
      if (
        3 === formatContext.insertionMode ||
        formatContext.tagScope & 1 ||
        null != props.itemProp
      )
        var JSCompiler_inline_result$jscomp$4 = pushSelfClosing(
          target$jscomp$0,
          props,
          "meta"
        );
      else
        textEmbedded && target$jscomp$0.push("\x3c!-- --\x3e"),
          (JSCompiler_inline_result$jscomp$4 =
            "string" === typeof props.charSet
              ? pushSelfClosing(renderState.charsetChunks, props, "meta")
              : "viewport" === props.name
              ? pushSelfClosing(renderState.preconnectChunks, props, "meta")
              : pushSelfClosing(renderState.hoistableChunks, props, "meta"));
      return JSCompiler_inline_result$jscomp$4;
    case "listing":
    case "pre":
      target$jscomp$0.push(startChunkForTag(type));
      var children$jscomp$6 = null,
        innerHTML$jscomp$5 = null,
        propKey$jscomp$8;
      for (propKey$jscomp$8 in props)
        if (hasOwnProperty.call(props, propKey$jscomp$8)) {
          var propValue$jscomp$8 = props[propKey$jscomp$8];
          if (null != propValue$jscomp$8)
            switch (propKey$jscomp$8) {
              case "children":
                children$jscomp$6 = propValue$jscomp$8;
                break;
              case "dangerouslySetInnerHTML":
                innerHTML$jscomp$5 = propValue$jscomp$8;
                break;
              default:
                pushAttribute(
                  target$jscomp$0,
                  propKey$jscomp$8,
                  propValue$jscomp$8
                );
            }
        }
      target$jscomp$0.push(">");
      if (null != innerHTML$jscomp$5) {
        if (null != children$jscomp$6)
          throw Error(
            "Can only set one of `children` or `props.dangerouslySetInnerHTML`."
          );
        if (
          "object" !== typeof innerHTML$jscomp$5 ||
          !("__html" in innerHTML$jscomp$5)
        )
          throw Error(
            "`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://reactjs.org/link/dangerously-set-inner-html for more information."
          );
        var html = innerHTML$jscomp$5.__html;
        null !== html &&
          void 0 !== html &&
          ("string" === typeof html && 0 < html.length && "\n" === html[0]
            ? target$jscomp$0.push("\n", html)
            : target$jscomp$0.push("" + html));
      }
      "string" === typeof children$jscomp$6 &&
        "\n" === children$jscomp$6[0] &&
        target$jscomp$0.push("\n");
      return children$jscomp$6;
    case "img":
      var src = props.src,
        srcSet = props.srcSet;
      if (
        !(
          "lazy" === props.loading ||
          (!src && !srcSet) ||
          ("string" !== typeof src && null != src) ||
          ("string" !== typeof srcSet && null != srcSet)
        ) &&
        "low" !== props.fetchPriority &&
        !1 === !!(formatContext.tagScope & 2) &&
        ("string" !== typeof src ||
          ":" !== src[4] ||
          ("d" !== src[0] && "D" !== src[0]) ||
          ("a" !== src[1] && "A" !== src[1]) ||
          ("t" !== src[2] && "T" !== src[2]) ||
          ("a" !== src[3] && "A" !== src[3])) &&
        ("string" !== typeof srcSet ||
          ":" !== srcSet[4] ||
          ("d" !== srcSet[0] && "D" !== srcSet[0]) ||
          ("a" !== srcSet[1] && "A" !== srcSet[1]) ||
          ("t" !== srcSet[2] && "T" !== srcSet[2]) ||
          ("a" !== srcSet[3] && "A" !== srcSet[3]))
      ) {
        var sizes = "string" === typeof props.sizes ? props.sizes : void 0,
          key$jscomp$0 = srcSet ? srcSet + "\n" + (sizes || "") : src,
          promotablePreloads = renderState.preloads.images,
          resource$jscomp$0 = promotablePreloads.get(key$jscomp$0);
        if (resource$jscomp$0) {
          if (
            "high" === props.fetchPriority ||
            10 > renderState.highImagePreloads.size
          )
            promotablePreloads.delete(key$jscomp$0),
              renderState.highImagePreloads.add(resource$jscomp$0);
        } else if (
          !resumableState.imageResources.hasOwnProperty(key$jscomp$0)
        ) {
          resumableState.imageResources[key$jscomp$0] = PRELOAD_NO_CREDS;
          var input = props.crossOrigin;
          var JSCompiler_inline_result$jscomp$5 =
            "string" === typeof input
              ? "use-credentials" === input
                ? input
                : ""
              : void 0;
          var headers = renderState.headers,
            header;
          headers &&
          0 < headers.remainingCapacity &&
          ("high" === props.fetchPriority ||
            500 > headers.highImagePreloads.length) &&
          ((header = getPreloadAsHeader(src, "image", {
            imageSrcSet: props.srcSet,
            imageSizes: props.sizes,
            crossOrigin: JSCompiler_inline_result$jscomp$5,
            integrity: props.integrity,
            nonce: props.nonce,
            type: props.type,
            fetchPriority: props.fetchPriority,
            referrerPolicy: props.refererPolicy
          })),
          2 <= (headers.remainingCapacity -= header.length))
            ? ((renderState.resets.image[key$jscomp$0] = PRELOAD_NO_CREDS),
              headers.highImagePreloads && (headers.highImagePreloads += ", "),
              (headers.highImagePreloads += header))
            : ((resource$jscomp$0 = []),
              pushLinkImpl(resource$jscomp$0, {
                rel: "preload",
                as: "image",
                href: srcSet ? void 0 : src,
                imageSrcSet: srcSet,
                imageSizes: sizes,
                crossOrigin: JSCompiler_inline_result$jscomp$5,
                integrity: props.integrity,
                type: props.type,
                fetchPriority: props.fetchPriority,
                referrerPolicy: props.referrerPolicy
              }),
              "high" === props.fetchPriority ||
              10 > renderState.highImagePreloads.size
                ? renderState.highImagePreloads.add(resource$jscomp$0)
                : (renderState.bulkPreloads.add(resource$jscomp$0),
                  promotablePreloads.set(key$jscomp$0, resource$jscomp$0)));
        }
      }
      return pushSelfClosing(target$jscomp$0, props, "img");
    case "base":
    case "area":
    case "br":
    case "col":
    case "embed":
    case "hr":
    case "keygen":
    case "param":
    case "source":
    case "track":
    case "wbr":
      return pushSelfClosing(target$jscomp$0, props, type);
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      break;
    case "head":
      if (2 > formatContext.insertionMode && null === renderState.headChunks) {
        renderState.headChunks = [];
        var JSCompiler_inline_result$jscomp$6 = pushStartGenericElement(
          renderState.headChunks,
          props,
          "head"
        );
      } else
        JSCompiler_inline_result$jscomp$6 = pushStartGenericElement(
          target$jscomp$0,
          props,
          "head"
        );
      return JSCompiler_inline_result$jscomp$6;
    case "html":
      if (
        0 === formatContext.insertionMode &&
        null === renderState.htmlChunks
      ) {
        renderState.htmlChunks = ["<!DOCTYPE html>"];
        var JSCompiler_inline_result$jscomp$7 = pushStartGenericElement(
          renderState.htmlChunks,
          props,
          "html"
        );
      } else
        JSCompiler_inline_result$jscomp$7 = pushStartGenericElement(
          target$jscomp$0,
          props,
          "html"
        );
      return JSCompiler_inline_result$jscomp$7;
    default:
      if (-1 !== type.indexOf("-")) {
        target$jscomp$0.push(startChunkForTag(type));
        var children$jscomp$7 = null,
          innerHTML$jscomp$6 = null,
          propKey$jscomp$9;
        for (propKey$jscomp$9 in props)
          if (hasOwnProperty.call(props, propKey$jscomp$9)) {
            var propValue$jscomp$9 = props[propKey$jscomp$9];
            if (null != propValue$jscomp$9) {
              var attributeName = propKey$jscomp$9;
              switch (propKey$jscomp$9) {
                case "children":
                  children$jscomp$7 = propValue$jscomp$9;
                  break;
                case "dangerouslySetInnerHTML":
                  innerHTML$jscomp$6 = propValue$jscomp$9;
                  break;
                case "style":
                  pushStyleAttribute(target$jscomp$0, propValue$jscomp$9);
                  break;
                case "suppressContentEditableWarning":
                case "suppressHydrationWarning":
                  break;
                case "className":
                  enableCustomElementPropertySupport &&
                    (attributeName = "class");
                default:
                  if (
                    isAttributeNameSafe(propKey$jscomp$9) &&
                    "function" !== typeof propValue$jscomp$9 &&
                    "symbol" !== typeof propValue$jscomp$9
                  ) {
                    if (enableCustomElementPropertySupport)
                      if (!1 === propValue$jscomp$9) continue;
                      else if (!0 === propValue$jscomp$9)
                        propValue$jscomp$9 = "";
                      else if ("object" === typeof propValue$jscomp$9) continue;
                    target$jscomp$0.push(
                      " ",
                      attributeName,
                      '="',
                      escapeTextForBrowser(propValue$jscomp$9),
                      '"'
                    );
                  }
              }
            }
          }
        target$jscomp$0.push(">");
        pushInnerHTML(target$jscomp$0, innerHTML$jscomp$6, children$jscomp$7);
        return children$jscomp$7;
      }
  }
  return pushStartGenericElement(target$jscomp$0, props, type);
}
var endTagCache = new Map();
function endChunkForTag(tag) {
  var chunk = endTagCache.get(tag);
  void 0 === chunk && ((chunk = "</" + tag + ">"), endTagCache.set(tag, chunk));
  return chunk;
}
function writeBootstrap(destination, renderState) {
  renderState = renderState.bootstrapChunks;
  for (var i = 0; i < renderState.length - 1; i++)
    destination.buffer += renderState[i];
  return i < renderState.length
    ? ((i = renderState[i]),
      (renderState.length = 0),
      writeChunkAndReturn(destination, i))
    : !0;
}
function writeStartPendingSuspenseBoundary(destination, renderState, id) {
  destination.buffer += '\x3c!--$?--\x3e<template id="';
  if (null === id)
    throw Error(
      "An ID must have been assigned before we can complete the boundary."
    );
  destination.buffer += renderState.boundaryPrefix;
  renderState = id.toString(16);
  destination.buffer += renderState;
  return writeChunkAndReturn(destination, '"></template>');
}
function writeStartSegment(destination, renderState, formatContext, id) {
  switch (formatContext.insertionMode) {
    case 0:
    case 1:
    case 2:
      return (
        (destination.buffer += '<div hidden id="'),
        (destination.buffer += renderState.segmentPrefix),
        (renderState = id.toString(16)),
        (destination.buffer += renderState),
        writeChunkAndReturn(destination, '">')
      );
    case 3:
      return (
        (destination.buffer +=
          '<svg aria-hidden="true" style="display:none" id="'),
        (destination.buffer += renderState.segmentPrefix),
        (renderState = id.toString(16)),
        (destination.buffer += renderState),
        writeChunkAndReturn(destination, '">')
      );
    case 4:
      return (
        (destination.buffer +=
          '<math aria-hidden="true" style="display:none" id="'),
        (destination.buffer += renderState.segmentPrefix),
        (renderState = id.toString(16)),
        (destination.buffer += renderState),
        writeChunkAndReturn(destination, '">')
      );
    case 5:
      return (
        (destination.buffer += '<table hidden id="'),
        (destination.buffer += renderState.segmentPrefix),
        (renderState = id.toString(16)),
        (destination.buffer += renderState),
        writeChunkAndReturn(destination, '">')
      );
    case 6:
      return (
        (destination.buffer += '<table hidden><tbody id="'),
        (destination.buffer += renderState.segmentPrefix),
        (renderState = id.toString(16)),
        (destination.buffer += renderState),
        writeChunkAndReturn(destination, '">')
      );
    case 7:
      return (
        (destination.buffer += '<table hidden><tr id="'),
        (destination.buffer += renderState.segmentPrefix),
        (renderState = id.toString(16)),
        (destination.buffer += renderState),
        writeChunkAndReturn(destination, '">')
      );
    case 8:
      return (
        (destination.buffer += '<table hidden><colgroup id="'),
        (destination.buffer += renderState.segmentPrefix),
        (renderState = id.toString(16)),
        (destination.buffer += renderState),
        writeChunkAndReturn(destination, '">')
      );
    default:
      throw Error("Unknown insertion mode. This is a bug in React.");
  }
}
function writeEndSegment(destination, formatContext) {
  switch (formatContext.insertionMode) {
    case 0:
    case 1:
    case 2:
      return writeChunkAndReturn(destination, "</div>");
    case 3:
      return writeChunkAndReturn(destination, "</svg>");
    case 4:
      return writeChunkAndReturn(destination, "</math>");
    case 5:
      return writeChunkAndReturn(destination, "</table>");
    case 6:
      return writeChunkAndReturn(destination, "</tbody></table>");
    case 7:
      return writeChunkAndReturn(destination, "</tr></table>");
    case 8:
      return writeChunkAndReturn(destination, "</colgroup></table>");
    default:
      throw Error("Unknown insertion mode. This is a bug in React.");
  }
}
var regexForJSStringsInInstructionScripts = /[<\u2028\u2029]/g;
function escapeJSStringsForInstructionScripts(input) {
  return JSON.stringify(input).replace(
    regexForJSStringsInInstructionScripts,
    function (match) {
      switch (match) {
        case "<":
          return "\\u003c";
        case "\u2028":
          return "\\u2028";
        case "\u2029":
          return "\\u2029";
        default:
          throw Error(
            "escapeJSStringsForInstructionScripts encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React"
          );
      }
    }
  );
}
var regexForJSStringsInScripts = /[&><\u2028\u2029]/g;
function escapeJSObjectForInstructionScripts(input) {
  return JSON.stringify(input).replace(
    regexForJSStringsInScripts,
    function (match) {
      switch (match) {
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
        default:
          throw Error(
            "escapeJSObjectForInstructionScripts encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React"
          );
      }
    }
  );
}
var currentlyRenderingBoundaryHasStylesToHoist = !1,
  destinationHasCapacity = !0;
function flushStyleTagsLateForBoundary(styleQueue) {
  var rules = styleQueue.rules,
    hrefs = styleQueue.hrefs,
    i = 0;
  if (hrefs.length) {
    this.buffer += '<style media="not all" data-precedence="';
    this.buffer += styleQueue.precedence;
    for (this.buffer += '" data-href="'; i < hrefs.length - 1; i++)
      (this.buffer += hrefs[i]), (this.buffer += " ");
    this.buffer += hrefs[i];
    this.buffer += '">';
    for (i = 0; i < rules.length; i++) this.buffer += rules[i];
    destinationHasCapacity = writeChunkAndReturn(this, "</style>");
    currentlyRenderingBoundaryHasStylesToHoist = !0;
    rules.length = 0;
    hrefs.length = 0;
  }
}
function hasStylesToHoist(stylesheet) {
  return 2 !== stylesheet.state
    ? (currentlyRenderingBoundaryHasStylesToHoist = !0)
    : !1;
}
function writeResourcesForBoundary(
  destination,
  boundaryResources,
  renderState
) {
  currentlyRenderingBoundaryHasStylesToHoist = !1;
  destinationHasCapacity = !0;
  boundaryResources.styles.forEach(flushStyleTagsLateForBoundary, destination);
  boundaryResources.stylesheets.forEach(hasStylesToHoist);
  currentlyRenderingBoundaryHasStylesToHoist &&
    (renderState.stylesToHoist = !0);
  return destinationHasCapacity;
}
function flushResource(resource) {
  for (var i = 0; i < resource.length; i++) this.buffer += resource[i];
  resource.length = 0;
}
var stylesheetFlushingQueue = [];
function flushStyleInPreamble(stylesheet) {
  pushLinkImpl(stylesheetFlushingQueue, stylesheet.props);
  for (var i = 0; i < stylesheetFlushingQueue.length; i++)
    this.buffer += stylesheetFlushingQueue[i];
  stylesheetFlushingQueue.length = 0;
  stylesheet.state = 2;
}
function flushStylesInPreamble(styleQueue) {
  var hasStylesheets = 0 < styleQueue.sheets.size;
  styleQueue.sheets.forEach(flushStyleInPreamble, this);
  styleQueue.sheets.clear();
  var rules = styleQueue.rules,
    hrefs = styleQueue.hrefs;
  if (!hasStylesheets || hrefs.length) {
    this.buffer += '<style data-precedence="';
    this.buffer += styleQueue.precedence;
    styleQueue = 0;
    if (hrefs.length) {
      for (
        this.buffer += '" data-href="';
        styleQueue < hrefs.length - 1;
        styleQueue++
      )
        (this.buffer += hrefs[styleQueue]), (this.buffer += " ");
      this.buffer += hrefs[styleQueue];
    }
    this.buffer += '">';
    for (styleQueue = 0; styleQueue < rules.length; styleQueue++)
      this.buffer += rules[styleQueue];
    this.buffer += "</style>";
    rules.length = 0;
    hrefs.length = 0;
  }
}
function preloadLateStyle(stylesheet) {
  if (0 === stylesheet.state) {
    stylesheet.state = 1;
    var props = stylesheet.props;
    pushLinkImpl(stylesheetFlushingQueue, {
      rel: "preload",
      as: "style",
      href: stylesheet.props.href,
      crossOrigin: props.crossOrigin,
      fetchPriority: props.fetchPriority,
      integrity: props.integrity,
      media: props.media,
      hrefLang: props.hrefLang,
      referrerPolicy: props.referrerPolicy
    });
    for (
      stylesheet = 0;
      stylesheet < stylesheetFlushingQueue.length;
      stylesheet++
    )
      this.buffer += stylesheetFlushingQueue[stylesheet];
    stylesheetFlushingQueue.length = 0;
  }
}
function preloadLateStyles(styleQueue) {
  styleQueue.sheets.forEach(preloadLateStyle, this);
  styleQueue.sheets.clear();
}
function writeStyleResourceDependenciesInJS(destination, boundaryResources) {
  destination.buffer += "[";
  var nextArrayOpenBrackChunk = "[";
  boundaryResources.stylesheets.forEach(function (resource) {
    if (2 !== resource.state)
      if (3 === resource.state)
        (destination.buffer += nextArrayOpenBrackChunk),
          writeChunk(
            destination,
            escapeJSObjectForInstructionScripts("" + resource.props.href)
          ),
          (destination.buffer += "]"),
          (nextArrayOpenBrackChunk = ",[");
      else {
        destination.buffer += nextArrayOpenBrackChunk;
        var precedence = resource.props["data-precedence"],
          props = resource.props,
          coercedHref = sanitizeURL("" + resource.props.href);
        writeChunk(
          destination,
          escapeJSObjectForInstructionScripts(coercedHref)
        );
        precedence = "" + precedence;
        writeChunk(destination, ",");
        writeChunk(
          destination,
          escapeJSObjectForInstructionScripts(precedence)
        );
        for (var propKey in props)
          if (
            hasOwnProperty.call(props, propKey) &&
            ((precedence = props[propKey]), null != precedence)
          )
            switch (propKey) {
              case "href":
              case "rel":
              case "precedence":
              case "data-precedence":
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(
                  "link is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`."
                );
              default:
                writeStyleResourceAttributeInJS(
                  destination,
                  propKey,
                  precedence
                );
            }
        destination.buffer += "]";
        nextArrayOpenBrackChunk = ",[";
        resource.state = 3;
      }
  });
  destination.buffer += "]";
}
function writeStyleResourceAttributeInJS(destination, name, value) {
  var attributeName = name.toLowerCase();
  switch (typeof value) {
    case "function":
    case "symbol":
      return;
  }
  switch (name) {
    case "innerHTML":
    case "dangerouslySetInnerHTML":
    case "suppressContentEditableWarning":
    case "suppressHydrationWarning":
    case "style":
      return;
    case "className":
      attributeName = "class";
      name = "" + value;
      break;
    case "hidden":
      if (!1 === value) return;
      name = "";
      break;
    case "src":
    case "href":
      value = sanitizeURL(value);
      name = "" + value;
      break;
    default:
      if (
        (2 < name.length &&
          ("o" === name[0] || "O" === name[0]) &&
          ("n" === name[1] || "N" === name[1])) ||
        !isAttributeNameSafe(name)
      )
        return;
      name = "" + value;
  }
  destination.buffer += ",";
  attributeName = escapeJSObjectForInstructionScripts(attributeName);
  destination.buffer += attributeName;
  destination.buffer += ",";
  attributeName = escapeJSObjectForInstructionScripts(name);
  destination.buffer += attributeName;
}
function writeStyleResourceDependenciesInAttr(destination, boundaryResources) {
  destination.buffer += "[";
  var nextArrayOpenBrackChunk = "[";
  boundaryResources.stylesheets.forEach(function (resource) {
    if (2 !== resource.state)
      if (3 === resource.state)
        (destination.buffer += nextArrayOpenBrackChunk),
          writeChunk(
            destination,
            escapeTextForBrowser(JSON.stringify("" + resource.props.href))
          ),
          (destination.buffer += "]"),
          (nextArrayOpenBrackChunk = ",[");
      else {
        destination.buffer += nextArrayOpenBrackChunk;
        var precedence = resource.props["data-precedence"],
          props = resource.props,
          coercedHref = sanitizeURL("" + resource.props.href);
        writeChunk(
          destination,
          escapeTextForBrowser(JSON.stringify(coercedHref))
        );
        precedence = "" + precedence;
        writeChunk(destination, ",");
        writeChunk(
          destination,
          escapeTextForBrowser(JSON.stringify(precedence))
        );
        for (var propKey in props)
          if (
            hasOwnProperty.call(props, propKey) &&
            ((precedence = props[propKey]), null != precedence)
          )
            switch (propKey) {
              case "href":
              case "rel":
              case "precedence":
              case "data-precedence":
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(
                  "link is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`."
                );
              default:
                writeStyleResourceAttributeInAttr(
                  destination,
                  propKey,
                  precedence
                );
            }
        destination.buffer += "]";
        nextArrayOpenBrackChunk = ",[";
        resource.state = 3;
      }
  });
  destination.buffer += "]";
}
function writeStyleResourceAttributeInAttr(destination, name, value) {
  var attributeName = name.toLowerCase();
  switch (typeof value) {
    case "function":
    case "symbol":
      return;
  }
  switch (name) {
    case "innerHTML":
    case "dangerouslySetInnerHTML":
    case "suppressContentEditableWarning":
    case "suppressHydrationWarning":
    case "style":
      return;
    case "className":
      attributeName = "class";
      name = "" + value;
      break;
    case "hidden":
      if (!1 === value) return;
      name = "";
      break;
    case "src":
    case "href":
      value = sanitizeURL(value);
      name = "" + value;
      break;
    default:
      if (
        (2 < name.length &&
          ("o" === name[0] || "O" === name[0]) &&
          ("n" === name[1] || "N" === name[1])) ||
        !isAttributeNameSafe(name)
      )
        return;
      name = "" + value;
  }
  destination.buffer += ",";
  attributeName = escapeTextForBrowser(JSON.stringify(attributeName));
  destination.buffer += attributeName;
  destination.buffer += ",";
  attributeName = escapeTextForBrowser(JSON.stringify(name));
  destination.buffer += attributeName;
}
function prefetchDNS(href) {
  var request = currentRequest ? currentRequest : null;
  if (request) {
    var resumableState = request.resumableState,
      renderState = request.renderState;
    if ("string" === typeof href && href) {
      if (!resumableState.dnsResources.hasOwnProperty(href)) {
        resumableState.dnsResources[href] = null;
        resumableState = renderState.headers;
        var header, JSCompiler_temp;
        if (
          (JSCompiler_temp =
            resumableState && 0 < resumableState.remainingCapacity)
        )
          JSCompiler_temp =
            ((header =
              "<" +
              ("" + href).replace(
                regexForHrefInLinkHeaderURLContext,
                escapeHrefForLinkHeaderURLContextReplacer
              ) +
              ">; rel=dns-prefetch"),
            2 <= (resumableState.remainingCapacity -= header.length));
        JSCompiler_temp
          ? ((renderState.resets.dns[href] = null),
            resumableState.preconnects && (resumableState.preconnects += ", "),
            (resumableState.preconnects += header))
          : ((header = []),
            pushLinkImpl(header, { href: href, rel: "dns-prefetch" }),
            renderState.preconnects.add(header));
      }
      enqueueFlush(request);
    }
  }
}
function preconnect(href, crossOrigin) {
  var request = currentRequest ? currentRequest : null;
  if (request) {
    var resumableState = request.resumableState,
      renderState = request.renderState;
    if ("string" === typeof href && href) {
      var bucket =
        "use-credentials" === crossOrigin
          ? "credentials"
          : "string" === typeof crossOrigin
          ? "anonymous"
          : "default";
      if (!resumableState.connectResources[bucket].hasOwnProperty(href)) {
        resumableState.connectResources[bucket][href] = null;
        resumableState = renderState.headers;
        var header, JSCompiler_temp;
        if (
          (JSCompiler_temp =
            resumableState && 0 < resumableState.remainingCapacity)
        ) {
          JSCompiler_temp =
            "<" +
            ("" + href).replace(
              regexForHrefInLinkHeaderURLContext,
              escapeHrefForLinkHeaderURLContextReplacer
            ) +
            ">; rel=preconnect";
          if ("string" === typeof crossOrigin) {
            var escapedCrossOrigin = ("" + crossOrigin).replace(
              regexForLinkHeaderQuotedParamValueContext,
              escapeStringForLinkHeaderQuotedParamValueContextReplacer
            );
            JSCompiler_temp += '; crossorigin="' + escapedCrossOrigin + '"';
          }
          JSCompiler_temp =
            ((header = JSCompiler_temp),
            2 <= (resumableState.remainingCapacity -= header.length));
        }
        JSCompiler_temp
          ? ((renderState.resets.connect[bucket][href] = null),
            resumableState.preconnects && (resumableState.preconnects += ", "),
            (resumableState.preconnects += header))
          : ((bucket = []),
            pushLinkImpl(bucket, {
              rel: "preconnect",
              href: href,
              crossOrigin: crossOrigin
            }),
            renderState.preconnects.add(bucket));
      }
      enqueueFlush(request);
    }
  }
}
function preload(href, as, options) {
  var request = currentRequest ? currentRequest : null;
  if (request) {
    var resumableState = request.resumableState,
      renderState = request.renderState;
    if (as && href) {
      switch (as) {
        case "image":
          if (options) {
            var imageSrcSet = options.imageSrcSet;
            var imageSizes = options.imageSizes;
            var fetchPriority = options.fetchPriority;
          }
          var key = imageSrcSet
            ? imageSrcSet + "\n" + (imageSizes || "")
            : href;
          if (resumableState.imageResources.hasOwnProperty(key)) return;
          resumableState.imageResources[key] = PRELOAD_NO_CREDS;
          resumableState = renderState.headers;
          var header;
          resumableState &&
          0 < resumableState.remainingCapacity &&
          "high" === fetchPriority &&
          ((header = getPreloadAsHeader(href, as, options)),
          2 <= (resumableState.remainingCapacity -= header.length))
            ? ((renderState.resets.image[key] = PRELOAD_NO_CREDS),
              resumableState.highImagePreloads &&
                (resumableState.highImagePreloads += ", "),
              (resumableState.highImagePreloads += header))
            : ((resumableState = []),
              pushLinkImpl(
                resumableState,
                assign(
                  { rel: "preload", href: imageSrcSet ? void 0 : href, as: as },
                  options
                )
              ),
              "high" === fetchPriority
                ? renderState.highImagePreloads.add(resumableState)
                : (renderState.bulkPreloads.add(resumableState),
                  renderState.preloads.images.set(key, resumableState)));
          break;
        case "style":
          if (resumableState.styleResources.hasOwnProperty(href)) return;
          imageSrcSet = [];
          pushLinkImpl(
            imageSrcSet,
            assign({ rel: "preload", href: href, as: as }, options)
          );
          resumableState.styleResources[href] =
            !options ||
            ("string" !== typeof options.crossOrigin &&
              "string" !== typeof options.integrity)
              ? PRELOAD_NO_CREDS
              : [options.crossOrigin, options.integrity];
          renderState.preloads.stylesheets.set(href, imageSrcSet);
          renderState.bulkPreloads.add(imageSrcSet);
          break;
        case "script":
          if (resumableState.scriptResources.hasOwnProperty(href)) return;
          imageSrcSet = [];
          renderState.preloads.scripts.set(href, imageSrcSet);
          renderState.bulkPreloads.add(imageSrcSet);
          pushLinkImpl(
            imageSrcSet,
            assign({ rel: "preload", href: href, as: as }, options)
          );
          resumableState.scriptResources[href] =
            !options ||
            ("string" !== typeof options.crossOrigin &&
              "string" !== typeof options.integrity)
              ? PRELOAD_NO_CREDS
              : [options.crossOrigin, options.integrity];
          break;
        default:
          if (resumableState.unknownResources.hasOwnProperty(as)) {
            if (
              ((imageSrcSet = resumableState.unknownResources[as]),
              imageSrcSet.hasOwnProperty(href))
            )
              return;
          } else
            (imageSrcSet = {}),
              (resumableState.unknownResources[as] = imageSrcSet);
          imageSrcSet[href] = PRELOAD_NO_CREDS;
          if (
            (resumableState = renderState.headers) &&
            0 < resumableState.remainingCapacity &&
            "font" === as &&
            ((key = getPreloadAsHeader(href, as, options)),
            2 <= (resumableState.remainingCapacity -= key.length))
          )
            (renderState.resets.font[href] = PRELOAD_NO_CREDS),
              resumableState.fontPreloads &&
                (resumableState.fontPreloads += ", "),
              (resumableState.fontPreloads += key);
          else
            switch (
              ((resumableState = []),
              (href = assign({ rel: "preload", href: href, as: as }, options)),
              pushLinkImpl(resumableState, href),
              as)
            ) {
              case "font":
                renderState.fontPreloads.add(resumableState);
                break;
              default:
                renderState.bulkPreloads.add(resumableState);
            }
      }
      enqueueFlush(request);
    }
  }
}
function preloadModule(href, options) {
  var request = currentRequest ? currentRequest : null;
  if (request) {
    var resumableState = request.resumableState,
      renderState = request.renderState;
    if (href) {
      var as =
        options && "string" === typeof options.as ? options.as : "script";
      switch (as) {
        case "script":
          if (resumableState.moduleScriptResources.hasOwnProperty(href)) return;
          as = [];
          resumableState.moduleScriptResources[href] =
            !options ||
            ("string" !== typeof options.crossOrigin &&
              "string" !== typeof options.integrity)
              ? PRELOAD_NO_CREDS
              : [options.crossOrigin, options.integrity];
          renderState.preloads.moduleScripts.set(href, as);
          break;
        default:
          if (resumableState.moduleUnknownResources.hasOwnProperty(as)) {
            var resources = resumableState.unknownResources[as];
            if (resources.hasOwnProperty(href)) return;
          } else
            (resources = {}),
              (resumableState.moduleUnknownResources[as] = resources);
          as = [];
          resources[href] = PRELOAD_NO_CREDS;
      }
      pushLinkImpl(as, assign({ rel: "modulepreload", href: href }, options));
      renderState.bulkPreloads.add(as);
      enqueueFlush(request);
    }
  }
}
function preinitStyle(href, precedence, options) {
  var request = currentRequest ? currentRequest : null;
  if (request) {
    var resumableState = request.resumableState,
      renderState = request.renderState;
    if (href) {
      precedence = precedence || "default";
      var styleQueue = renderState.styles.get(precedence),
        resourceState = resumableState.styleResources.hasOwnProperty(href)
          ? resumableState.styleResources[href]
          : void 0;
      null !== resourceState &&
        ((resumableState.styleResources[href] = null),
        styleQueue ||
          ((styleQueue = {
            precedence: escapeTextForBrowser(precedence),
            rules: [],
            hrefs: [],
            sheets: new Map()
          }),
          renderState.styles.set(precedence, styleQueue)),
        (precedence = {
          state: 0,
          props: assign(
            { rel: "stylesheet", href: href, "data-precedence": precedence },
            options
          )
        }),
        resourceState &&
          (2 === resourceState.length &&
            adoptPreloadCredentials(precedence.props, resourceState),
          (renderState = renderState.preloads.stylesheets.get(href)) &&
          0 < renderState.length
            ? (renderState.length = 0)
            : (precedence.state = 1)),
        styleQueue.sheets.set(href, precedence),
        enqueueFlush(request));
    }
  }
}
function preinitScript(src, options) {
  var request = currentRequest ? currentRequest : null;
  if (request) {
    var resumableState = request.resumableState,
      renderState = request.renderState;
    if (src) {
      var resourceState = resumableState.scriptResources.hasOwnProperty(src)
        ? resumableState.scriptResources[src]
        : void 0;
      null !== resourceState &&
        ((resumableState.scriptResources[src] = null),
        (options = assign({ src: src, async: !0 }, options)),
        resourceState &&
          (2 === resourceState.length &&
            adoptPreloadCredentials(options, resourceState),
          (src = renderState.preloads.scripts.get(src))) &&
          (src.length = 0),
        (src = []),
        renderState.scripts.add(src),
        pushScriptImpl(src, options),
        enqueueFlush(request));
    }
  }
}
function preinitModuleScript(src, options) {
  var request = currentRequest ? currentRequest : null;
  if (request) {
    var resumableState = request.resumableState,
      renderState = request.renderState;
    if (src) {
      var resourceState = resumableState.moduleScriptResources.hasOwnProperty(
        src
      )
        ? resumableState.moduleScriptResources[src]
        : void 0;
      null !== resourceState &&
        ((resumableState.moduleScriptResources[src] = null),
        (options = assign({ src: src, type: "module", async: !0 }, options)),
        resourceState &&
          (2 === resourceState.length &&
            adoptPreloadCredentials(options, resourceState),
          (src = renderState.preloads.moduleScripts.get(src))) &&
          (src.length = 0),
        (src = []),
        renderState.scripts.add(src),
        pushScriptImpl(src, options),
        enqueueFlush(request));
    }
  }
}
function adoptPreloadCredentials(target, preloadState) {
  null == target.crossOrigin && (target.crossOrigin = preloadState[0]);
  null == target.integrity && (target.integrity = preloadState[1]);
}
function getPreloadAsHeader(href, as, params) {
  href = ("" + href).replace(
    regexForHrefInLinkHeaderURLContext,
    escapeHrefForLinkHeaderURLContextReplacer
  );
  as = ("" + as).replace(
    regexForLinkHeaderQuotedParamValueContext,
    escapeStringForLinkHeaderQuotedParamValueContextReplacer
  );
  as = "<" + href + '>; rel=preload; as="' + as + '"';
  for (var paramName in params)
    hasOwnProperty.call(params, paramName) &&
      ((href = params[paramName]),
      "string" === typeof href &&
        (as +=
          "; " +
          paramName.toLowerCase() +
          '="' +
          ("" + href).replace(
            regexForLinkHeaderQuotedParamValueContext,
            escapeStringForLinkHeaderQuotedParamValueContextReplacer
          ) +
          '"'));
  return as;
}
var regexForHrefInLinkHeaderURLContext = /[<>\r\n]/g;
function escapeHrefForLinkHeaderURLContextReplacer(match) {
  switch (match) {
    case "<":
      return "%3C";
    case ">":
      return "%3E";
    case "\n":
      return "%0A";
    case "\r":
      return "%0D";
    default:
      throw Error(
        "escapeLinkHrefForHeaderContextReplacer encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React"
      );
  }
}
var regexForLinkHeaderQuotedParamValueContext = /["';,\r\n]/g;
function escapeStringForLinkHeaderQuotedParamValueContextReplacer(match) {
  switch (match) {
    case '"':
      return "%22";
    case "'":
      return "%27";
    case ";":
      return "%3B";
    case ",":
      return "%2C";
    case "\n":
      return "%0A";
    case "\r":
      return "%0D";
    default:
      throw Error(
        "escapeStringForLinkHeaderQuotedParamValueContextReplacer encountered a match it does not know how to replace. this means the match regex and the replacement characters are no longer in sync. This is a bug in React"
      );
  }
}
function hoistStyleQueueDependency(styleQueue) {
  this.styles.add(styleQueue);
}
function hoistStylesheetDependency(stylesheet) {
  this.stylesheets.add(stylesheet);
}
var REACT_ELEMENT_TYPE = Symbol.for("react.element"),
  REACT_PORTAL_TYPE = Symbol.for("react.portal"),
  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"),
  REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"),
  REACT_PROFILER_TYPE = Symbol.for("react.profiler"),
  REACT_PROVIDER_TYPE = Symbol.for("react.provider"),
  REACT_CONTEXT_TYPE = Symbol.for("react.context"),
  REACT_SERVER_CONTEXT_TYPE = Symbol.for("react.server_context"),
  REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"),
  REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"),
  REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"),
  REACT_MEMO_TYPE = Symbol.for("react.memo"),
  REACT_LAZY_TYPE = Symbol.for("react.lazy"),
  REACT_SCOPE_TYPE = Symbol.for("react.scope"),
  REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for("react.debug_trace_mode"),
  REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen"),
  REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden"),
  REACT_CACHE_TYPE = Symbol.for("react.cache"),
  REACT_TRACING_MARKER_TYPE = Symbol.for("react.tracing_marker"),
  REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED = Symbol.for(
    "react.default_value"
  ),
  REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel"),
  MAYBE_ITERATOR_SYMBOL = Symbol.iterator,
  REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference");
function getComponentNameFromType(type) {
  if (null == type) return null;
  if ("function" === typeof type)
    return type.$$typeof === REACT_CLIENT_REFERENCE
      ? null
      : type.displayName || type.name || null;
  if ("string" === typeof type) return type;
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
    case REACT_CACHE_TYPE:
      return "Cache";
    case REACT_TRACING_MARKER_TYPE:
      if (enableTransitionTracing) return "TracingMarker";
  }
  if ("object" === typeof type)
    switch (type.$$typeof) {
      case REACT_CONTEXT_TYPE:
        return (type.displayName || "Context") + ".Consumer";
      case REACT_PROVIDER_TYPE:
        return (type._context.displayName || "Context") + ".Provider";
      case REACT_FORWARD_REF_TYPE:
        var innerType = type.render;
        type = type.displayName;
        type ||
          ((type = innerType.displayName || innerType.name || ""),
          (type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef"));
        return type;
      case REACT_MEMO_TYPE:
        return (
          (innerType = type.displayName || null),
          null !== innerType
            ? innerType
            : getComponentNameFromType(type.type) || "Memo"
        );
      case REACT_LAZY_TYPE:
        innerType = type._payload;
        type = type._init;
        try {
          return getComponentNameFromType(type(innerType));
        } catch (x) {}
    }
  return null;
}
var prefix;
function describeBuiltInComponentFrame(name) {
  if (void 0 === prefix)
    try {
      throw Error();
    } catch (x) {
      var match = x.stack.trim().match(/\n( *(at )?)/);
      prefix = (match && match[1]) || "";
    }
  return "\n" + prefix + name;
}
var reentry = !1;
function describeNativeComponentFrame(fn, construct) {
  if (!fn || reentry) return "";
  reentry = !0;
  var previousPrepareStackTrace = Error.prepareStackTrace;
  Error.prepareStackTrace = void 0;
  var RunInRootFrame = {
    DetermineComponentFrameRoot: function () {
      try {
        if (construct) {
          var Fake = function () {
            throw Error();
          };
          Object.defineProperty(Fake.prototype, "props", {
            set: function () {
              throw Error();
            }
          });
          if ("object" === typeof Reflect && Reflect.construct) {
            try {
              Reflect.construct(Fake, []);
            } catch (x) {
              var control = x;
            }
            Reflect.construct(fn, [], Fake);
          } else {
            try {
              Fake.call();
            } catch (x$17) {
              control = x$17;
            }
            fn.call(Fake.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (x$18) {
            control = x$18;
          }
          (Fake = fn()) &&
            "function" === typeof Fake.catch &&
            Fake.catch(function () {});
        }
      } catch (sample) {
        if (sample && control && "string" === typeof sample.stack)
          return [sample.stack, control.stack];
      }
      return [null, null];
    }
  };
  RunInRootFrame.DetermineComponentFrameRoot.displayName =
    "DetermineComponentFrameRoot";
  var namePropDescriptor = Object.getOwnPropertyDescriptor(
    RunInRootFrame.DetermineComponentFrameRoot,
    "name"
  );
  namePropDescriptor &&
    namePropDescriptor.configurable &&
    Object.defineProperty(RunInRootFrame.DetermineComponentFrameRoot, "name", {
      value: "DetermineComponentFrameRoot"
    });
  try {
    var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(),
      sampleStack = _RunInRootFrame$Deter[0],
      controlStack = _RunInRootFrame$Deter[1];
    if (sampleStack && controlStack) {
      var sampleLines = sampleStack.split("\n"),
        controlLines = controlStack.split("\n");
      for (
        namePropDescriptor = RunInRootFrame = 0;
        RunInRootFrame < sampleLines.length &&
        !sampleLines[RunInRootFrame].includes("DetermineComponentFrameRoot");

      )
        RunInRootFrame++;
      for (
        ;
        namePropDescriptor < controlLines.length &&
        !controlLines[namePropDescriptor].includes(
          "DetermineComponentFrameRoot"
        );

      )
        namePropDescriptor++;
      if (
        RunInRootFrame === sampleLines.length ||
        namePropDescriptor === controlLines.length
      )
        for (
          RunInRootFrame = sampleLines.length - 1,
            namePropDescriptor = controlLines.length - 1;
          1 <= RunInRootFrame &&
          0 <= namePropDescriptor &&
          sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor];

        )
          namePropDescriptor--;
      for (
        ;
        1 <= RunInRootFrame && 0 <= namePropDescriptor;
        RunInRootFrame--, namePropDescriptor--
      )
        if (sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
          if (1 !== RunInRootFrame || 1 !== namePropDescriptor) {
            do
              if (
                (RunInRootFrame--,
                namePropDescriptor--,
                0 > namePropDescriptor ||
                  sampleLines[RunInRootFrame] !==
                    controlLines[namePropDescriptor])
              ) {
                var frame =
                  "\n" +
                  sampleLines[RunInRootFrame].replace(" at new ", " at ");
                fn.displayName &&
                  frame.includes("<anonymous>") &&
                  (frame = frame.replace("<anonymous>", fn.displayName));
                return frame;
              }
            while (1 <= RunInRootFrame && 0 <= namePropDescriptor);
          }
          break;
        }
    }
  } finally {
    (reentry = !1), (Error.prepareStackTrace = previousPrepareStackTrace);
  }
  return (previousPrepareStackTrace = fn ? fn.displayName || fn.name : "")
    ? describeBuiltInComponentFrame(previousPrepareStackTrace)
    : "";
}
var emptyContextObject = {},
  currentActiveSnapshot = null;
function popToNearestCommonAncestor(prev, next) {
  if (prev !== next) {
    prev.context._currentValue = prev.parentValue;
    prev = prev.parent;
    var parentNext = next.parent;
    if (null === prev) {
      if (null !== parentNext)
        throw Error(
          "The stacks must reach the root at the same time. This is a bug in React."
        );
    } else {
      if (null === parentNext)
        throw Error(
          "The stacks must reach the root at the same time. This is a bug in React."
        );
      popToNearestCommonAncestor(prev, parentNext);
    }
    next.context._currentValue = next.value;
  }
}
function popAllPrevious(prev) {
  prev.context._currentValue = prev.parentValue;
  prev = prev.parent;
  null !== prev && popAllPrevious(prev);
}
function pushAllNext(next) {
  var parentNext = next.parent;
  null !== parentNext && pushAllNext(parentNext);
  next.context._currentValue = next.value;
}
function popPreviousToCommonLevel(prev, next) {
  prev.context._currentValue = prev.parentValue;
  prev = prev.parent;
  if (null === prev)
    throw Error(
      "The depth must equal at least at zero before reaching the root. This is a bug in React."
    );
  prev.depth === next.depth
    ? popToNearestCommonAncestor(prev, next)
    : popPreviousToCommonLevel(prev, next);
}
function popNextToCommonLevel(prev, next) {
  var parentNext = next.parent;
  if (null === parentNext)
    throw Error(
      "The depth must equal at least at zero before reaching the root. This is a bug in React."
    );
  prev.depth === parentNext.depth
    ? popToNearestCommonAncestor(prev, parentNext)
    : popNextToCommonLevel(prev, parentNext);
  next.context._currentValue = next.value;
}
function switchContext(newSnapshot) {
  var prev = currentActiveSnapshot;
  prev !== newSnapshot &&
    (null === prev
      ? pushAllNext(newSnapshot)
      : null === newSnapshot
      ? popAllPrevious(prev)
      : prev.depth === newSnapshot.depth
      ? popToNearestCommonAncestor(prev, newSnapshot)
      : prev.depth > newSnapshot.depth
      ? popPreviousToCommonLevel(prev, newSnapshot)
      : popNextToCommonLevel(prev, newSnapshot),
    (currentActiveSnapshot = newSnapshot));
}
var classComponentUpdater = {
    isMounted: function () {
      return !1;
    },
    enqueueSetState: function (inst, payload) {
      inst = inst._reactInternals;
      null !== inst.queue && inst.queue.push(payload);
    },
    enqueueReplaceState: function (inst, payload) {
      inst = inst._reactInternals;
      inst.replace = !0;
      inst.queue = [payload];
    },
    enqueueForceUpdate: function () {}
  },
  emptyTreeContext = { id: 1, overflow: "" };
function pushTreeContext(baseContext, totalChildren, index) {
  var baseIdWithLeadingBit = baseContext.id;
  baseContext = baseContext.overflow;
  var baseLength = 32 - clz32(baseIdWithLeadingBit) - 1;
  baseIdWithLeadingBit &= ~(1 << baseLength);
  index += 1;
  var length = 32 - clz32(totalChildren) + baseLength;
  if (30 < length) {
    var numberOfOverflowBits = baseLength - (baseLength % 5);
    length = (
      baseIdWithLeadingBit &
      ((1 << numberOfOverflowBits) - 1)
    ).toString(32);
    baseIdWithLeadingBit >>= numberOfOverflowBits;
    baseLength -= numberOfOverflowBits;
    return {
      id:
        (1 << (32 - clz32(totalChildren) + baseLength)) |
        (index << baseLength) |
        baseIdWithLeadingBit,
      overflow: length + baseContext
    };
  }
  return {
    id: (1 << length) | (index << baseLength) | baseIdWithLeadingBit,
    overflow: baseContext
  };
}
var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback,
  log = Math.log,
  LN2 = Math.LN2;
function clz32Fallback(x) {
  x >>>= 0;
  return 0 === x ? 32 : (31 - ((log(x) / LN2) | 0)) | 0;
}
var SuspenseException = Error(
  "Suspense Exception: This is not a real error! It's an implementation detail of `use` to interrupt the current render. You must either rethrow it immediately, or move the `use` call outside of the `try/catch` block. Capturing without rethrowing will lead to unexpected behavior.\n\nTo handle async errors, wrap your component in an error boundary, or call the promise's `.catch` method and pass the result to `use`"
);
function noop$2() {}
function trackUsedThenable(thenableState, thenable, index) {
  index = thenableState[index];
  void 0 === index
    ? thenableState.push(thenable)
    : index !== thenable && (thenable.then(noop$2, noop$2), (thenable = index));
  switch (thenable.status) {
    case "fulfilled":
      return thenable.value;
    case "rejected":
      throw thenable.reason;
    default:
      if ("string" !== typeof thenable.status)
        switch (
          ((thenableState = thenable),
          (thenableState.status = "pending"),
          thenableState.then(
            function (fulfilledValue) {
              if ("pending" === thenable.status) {
                var fulfilledThenable = thenable;
                fulfilledThenable.status = "fulfilled";
                fulfilledThenable.value = fulfilledValue;
              }
            },
            function (error) {
              if ("pending" === thenable.status) {
                var rejectedThenable = thenable;
                rejectedThenable.status = "rejected";
                rejectedThenable.reason = error;
              }
            }
          ),
          thenable.status)
        ) {
          case "fulfilled":
            return thenable.value;
          case "rejected":
            throw thenable.reason;
        }
      suspendedThenable = thenable;
      throw SuspenseException;
  }
}
var suspendedThenable = null;
function getSuspendedThenable() {
  if (null === suspendedThenable)
    throw Error(
      "Expected a suspended thenable. This is a bug in React. Please file an issue."
    );
  var thenable = suspendedThenable;
  suspendedThenable = null;
  return thenable;
}
function is(x, y) {
  return (x === y && (0 !== x || 1 / x === 1 / y)) || (x !== x && y !== y);
}
var objectIs = "function" === typeof Object.is ? Object.is : is,
  currentlyRenderingComponent = null,
  currentlyRenderingTask = null,
  currentlyRenderingRequest = null,
  currentlyRenderingKeyPath = null,
  firstWorkInProgressHook = null,
  workInProgressHook = null,
  isReRender = !1,
  didScheduleRenderPhaseUpdate = !1,
  localIdCounter = 0,
  formStateCounter = 0,
  formStateMatchingIndex = -1,
  thenableIndexCounter = 0,
  thenableState = null,
  renderPhaseUpdates = null,
  numberOfReRenders = 0;
function resolveCurrentlyRenderingComponent() {
  if (null === currentlyRenderingComponent)
    throw Error(
      "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:\n1. You might have mismatching versions of React and the renderer (such as React DOM)\n2. You might be breaking the Rules of Hooks\n3. You might have more than one copy of React in the same app\nSee https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem."
    );
  return currentlyRenderingComponent;
}
function createHook() {
  if (0 < numberOfReRenders)
    throw Error("Rendered more hooks than during the previous render");
  return { memoizedState: null, queue: null, next: null };
}
function createWorkInProgressHook() {
  null === workInProgressHook
    ? null === firstWorkInProgressHook
      ? ((isReRender = !1),
        (firstWorkInProgressHook = workInProgressHook = createHook()))
      : ((isReRender = !0), (workInProgressHook = firstWorkInProgressHook))
    : null === workInProgressHook.next
    ? ((isReRender = !1),
      (workInProgressHook = workInProgressHook.next = createHook()))
    : ((isReRender = !0), (workInProgressHook = workInProgressHook.next));
  return workInProgressHook;
}
function finishHooks(Component, props, children, refOrContext) {
  for (; didScheduleRenderPhaseUpdate; )
    (didScheduleRenderPhaseUpdate = !1),
      (formStateCounter = localIdCounter = 0),
      (formStateMatchingIndex = -1),
      (thenableIndexCounter = 0),
      (numberOfReRenders += 1),
      (workInProgressHook = null),
      (children = Component(props, refOrContext));
  resetHooksState();
  return children;
}
function getThenableStateAfterSuspending() {
  var state = thenableState;
  thenableState = null;
  return state;
}
function resetHooksState() {
  currentlyRenderingKeyPath =
    currentlyRenderingRequest =
    currentlyRenderingTask =
    currentlyRenderingComponent =
      null;
  didScheduleRenderPhaseUpdate = !1;
  firstWorkInProgressHook = null;
  numberOfReRenders = 0;
  workInProgressHook = renderPhaseUpdates = null;
}
function basicStateReducer(state, action) {
  return "function" === typeof action ? action(state) : action;
}
function useReducer(reducer, initialArg, init) {
  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();
  if (isReRender) {
    var queue = workInProgressHook.queue;
    initialArg = queue.dispatch;
    if (
      null !== renderPhaseUpdates &&
      ((init = renderPhaseUpdates.get(queue)), void 0 !== init)
    ) {
      renderPhaseUpdates.delete(queue);
      queue = workInProgressHook.memoizedState;
      do (queue = reducer(queue, init.action)), (init = init.next);
      while (null !== init);
      workInProgressHook.memoizedState = queue;
      return [queue, initialArg];
    }
    return [workInProgressHook.memoizedState, initialArg];
  }
  reducer =
    reducer === basicStateReducer
      ? "function" === typeof initialArg
        ? initialArg()
        : initialArg
      : void 0 !== init
      ? init(initialArg)
      : initialArg;
  workInProgressHook.memoizedState = reducer;
  reducer = workInProgressHook.queue = { last: null, dispatch: null };
  reducer = reducer.dispatch = dispatchAction.bind(
    null,
    currentlyRenderingComponent,
    reducer
  );
  return [workInProgressHook.memoizedState, reducer];
}
function useMemo(nextCreate, deps) {
  currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
  workInProgressHook = createWorkInProgressHook();
  deps = void 0 === deps ? null : deps;
  if (null !== workInProgressHook) {
    var prevState = workInProgressHook.memoizedState;
    if (null !== prevState && null !== deps) {
      var prevDeps = prevState[1];
      a: if (null === prevDeps) prevDeps = !1;
      else {
        for (var i = 0; i < prevDeps.length && i < deps.length; i++)
          if (!objectIs(deps[i], prevDeps[i])) {
            prevDeps = !1;
            break a;
          }
        prevDeps = !0;
      }
      if (prevDeps) return prevState[0];
    }
  }
  nextCreate = nextCreate();
  workInProgressHook.memoizedState = [nextCreate, deps];
  return nextCreate;
}
function dispatchAction(componentIdentity, queue, action) {
  if (25 <= numberOfReRenders)
    throw Error(
      "Too many re-renders. React limits the number of renders to prevent an infinite loop."
    );
  if (componentIdentity === currentlyRenderingComponent)
    if (
      ((didScheduleRenderPhaseUpdate = !0),
      (componentIdentity = { action: action, next: null }),
      null === renderPhaseUpdates && (renderPhaseUpdates = new Map()),
      (action = renderPhaseUpdates.get(queue)),
      void 0 === action)
    )
      renderPhaseUpdates.set(queue, componentIdentity);
    else {
      for (queue = action; null !== queue.next; ) queue = queue.next;
      queue.next = componentIdentity;
    }
}
function throwOnUseEffectEventCall() {
  throw Error(
    "A function wrapped in useEffectEvent can't be called during rendering."
  );
}
function unsupportedStartTransition() {
  throw Error("startTransition cannot be called during server rendering.");
}
function unsupportedSetOptimisticState() {
  throw Error("Cannot update optimistic state while rendering.");
}
function useOptimistic(passthrough) {
  resolveCurrentlyRenderingComponent();
  return [passthrough, unsupportedSetOptimisticState];
}
function useFormState(action, initialState, permalink) {
  resolveCurrentlyRenderingComponent();
  var formStateHookIndex = formStateCounter++,
    request = currentlyRenderingRequest;
  if ("function" === typeof action.$$FORM_ACTION) {
    var nextPostbackStateKey = null,
      componentKeyPath = currentlyRenderingKeyPath;
    request = request.formState;
    var isSignatureEqual = action.$$IS_SIGNATURE_EQUAL;
    if (null !== request && "function" === typeof isSignatureEqual) {
      var postbackKey = request[1];
      isSignatureEqual.call(action, request[2], request[3]) &&
        ((nextPostbackStateKey =
          void 0 !== permalink
            ? "p" + permalink
            : "k" +
              murmurhash3_32_gc(
                JSON.stringify([componentKeyPath, null, formStateHookIndex]),
                0
              )),
        postbackKey === nextPostbackStateKey &&
          ((formStateMatchingIndex = formStateHookIndex),
          (initialState = request[0])));
    }
    var boundAction = action.bind(null, initialState);
    action = function (payload) {
      boundAction(payload);
    };
    "function" === typeof boundAction.$$FORM_ACTION &&
      (action.$$FORM_ACTION = function (prefix) {
        prefix = boundAction.$$FORM_ACTION(prefix);
        void 0 !== permalink &&
          ((permalink += ""), (prefix.action = permalink));
        var formData = prefix.data;
        formData &&
          (null === nextPostbackStateKey &&
            (nextPostbackStateKey =
              void 0 !== permalink
                ? "p" + permalink
                : "k" +
                  murmurhash3_32_gc(
                    JSON.stringify([
                      componentKeyPath,
                      null,
                      formStateHookIndex
                    ]),
                    0
                  )),
          formData.append("$ACTION_KEY", nextPostbackStateKey));
        return prefix;
      });
    return [initialState, action];
  }
  var boundAction$23 = action.bind(null, initialState);
  return [
    initialState,
    function (payload) {
      boundAction$23(payload);
    }
  ];
}
function unwrapThenable(thenable) {
  var index = thenableIndexCounter;
  thenableIndexCounter += 1;
  null === thenableState && (thenableState = []);
  return trackUsedThenable(thenableState, thenable, index);
}
function unsupportedRefresh() {
  throw Error("Cache cannot be refreshed during server rendering.");
}
function noop$1() {}
var HooksDispatcher = {
  readContext: function (context) {
    return context._currentValue;
  },
  use: function (usable) {
    if (null !== usable && "object" === typeof usable) {
      if ("function" === typeof usable.then) return unwrapThenable(usable);
      if (
        usable.$$typeof === REACT_CONTEXT_TYPE ||
        usable.$$typeof === REACT_SERVER_CONTEXT_TYPE
      )
        return usable._currentValue;
    }
    throw Error("An unsupported type was passed to use(): " + String(usable));
  },
  useContext: function (context) {
    resolveCurrentlyRenderingComponent();
    return context._currentValue;
  },
  useMemo: useMemo,
  useReducer: useReducer,
  useRef: function (initialValue) {
    currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
    workInProgressHook = createWorkInProgressHook();
    var previousRef = workInProgressHook.memoizedState;
    return null === previousRef
      ? ((initialValue = { current: initialValue }),
        (workInProgressHook.memoizedState = initialValue))
      : previousRef;
  },
  useState: function (initialState) {
    return useReducer(basicStateReducer, initialState);
  },
  useInsertionEffect: noop$1,
  useLayoutEffect: noop$1,
  useCallback: function (callback, deps) {
    return useMemo(function () {
      return callback;
    }, deps);
  },
  useImperativeHandle: noop$1,
  useEffect: noop$1,
  useDebugValue: noop$1,
  useDeferredValue: function (value, initialValue) {
    resolveCurrentlyRenderingComponent();
    return enableUseDeferredValueInitialArg
      ? void 0 !== initialValue
        ? initialValue
        : value
      : value;
  },
  useTransition: function () {
    resolveCurrentlyRenderingComponent();
    return [!1, unsupportedStartTransition];
  },
  useId: function () {
    var JSCompiler_inline_result = currentlyRenderingTask.treeContext;
    var overflow = JSCompiler_inline_result.overflow;
    JSCompiler_inline_result = JSCompiler_inline_result.id;
    JSCompiler_inline_result =
      (
        JSCompiler_inline_result &
        ~(1 << (32 - clz32(JSCompiler_inline_result) - 1))
      ).toString(32) + overflow;
    var resumableState = currentResumableState;
    if (null === resumableState)
      throw Error(
        "Invalid hook call. Hooks can only be called inside of the body of a function component."
      );
    overflow = localIdCounter++;
    JSCompiler_inline_result =
      ":" + resumableState.idPrefix + "R" + JSCompiler_inline_result;
    0 < overflow && (JSCompiler_inline_result += "H" + overflow.toString(32));
    return JSCompiler_inline_result + ":";
  },
  useSyncExternalStore: function (subscribe, getSnapshot, getServerSnapshot) {
    if (void 0 === getServerSnapshot)
      throw Error(
        "Missing getServerSnapshot, which is required for server-rendered content. Will revert to client rendering."
      );
    return getServerSnapshot();
  },
  useCacheRefresh: function () {
    return unsupportedRefresh;
  },
  useEffectEvent: function () {
    return throwOnUseEffectEventCall;
  },
  useMemoCache: function (size) {
    for (var data = Array(size), i = 0; i < size; i++)
      data[i] = REACT_MEMO_CACHE_SENTINEL;
    return data;
  }
};
enableAsyncActions &&
  ((HooksDispatcher.useOptimistic = useOptimistic),
  (HooksDispatcher.useFormState = useFormState));
var currentResumableState = null,
  DefaultCacheDispatcher = {
    getCacheSignal: function () {
      throw Error("Not implemented.");
    },
    getCacheForType: function () {
      throw Error("Not implemented.");
    }
  },
  ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher,
  ReactCurrentCache = ReactSharedInternals.ReactCurrentCache;
function defaultErrorHandler(error) {
  console.error(error);
  return null;
}
function noop() {}
var currentRequest = null;
function pingTask(request, task) {
  request.pingedTasks.push(task);
  1 === request.pingedTasks.length &&
    (request.flushScheduled = null !== request.destination);
}
function createSuspenseBoundary(request, fallbackAbortableTasks) {
  return {
    status: 0,
    rootSegmentID: -1,
    parentFlushed: !1,
    pendingTasks: 0,
    completedSegments: [],
    byteSize: 0,
    fallbackAbortableTasks: fallbackAbortableTasks,
    errorDigest: null,
    resources: { styles: new Set(), stylesheets: new Set() },
    trackedContentKeyPath: null,
    trackedFallbackNode: null
  };
}
function createRenderTask(
  request,
  thenableState,
  node,
  childIndex,
  blockedBoundary,
  blockedSegment,
  abortSet,
  keyPath,
  formatContext,
  legacyContext,
  context,
  treeContext,
  componentStack
) {
  request.allPendingTasks++;
  null === blockedBoundary
    ? request.pendingRootTasks++
    : blockedBoundary.pendingTasks++;
  var task = {
    replay: null,
    node: node,
    childIndex: childIndex,
    ping: function () {
      return pingTask(request, task);
    },
    blockedBoundary: blockedBoundary,
    blockedSegment: blockedSegment,
    abortSet: abortSet,
    keyPath: keyPath,
    formatContext: formatContext,
    legacyContext: legacyContext,
    context: context,
    treeContext: treeContext,
    componentStack: componentStack,
    thenableState: thenableState
  };
  abortSet.add(task);
  return task;
}
function createReplayTask(
  request,
  thenableState,
  replay,
  node,
  childIndex,
  blockedBoundary,
  abortSet,
  keyPath,
  formatContext,
  legacyContext,
  context,
  treeContext,
  componentStack
) {
  request.allPendingTasks++;
  null === blockedBoundary
    ? request.pendingRootTasks++
    : blockedBoundary.pendingTasks++;
  replay.pendingTasks++;
  var task = {
    replay: replay,
    node: node,
    childIndex: childIndex,
    ping: function () {
      return pingTask(request, task);
    },
    blockedBoundary: blockedBoundary,
    blockedSegment: null,
    abortSet: abortSet,
    keyPath: keyPath,
    formatContext: formatContext,
    legacyContext: legacyContext,
    context: context,
    treeContext: treeContext,
    componentStack: componentStack,
    thenableState: thenableState
  };
  abortSet.add(task);
  return task;
}
function createPendingSegment(
  request,
  index,
  boundary,
  parentFormatContext,
  lastPushedText,
  textEmbedded
) {
  return {
    status: 0,
    id: -1,
    index: index,
    parentFlushed: !1,
    chunks: [],
    children: [],
    parentFormatContext: parentFormatContext,
    boundary: boundary,
    lastPushedText: lastPushedText,
    textEmbedded: textEmbedded
  };
}
function createBuiltInComponentStack(task, type) {
  return { tag: 0, parent: task.componentStack, type: type };
}
function getThrownInfo(request, node) {
  if (node && null !== request.trackedPostpones) {
    try {
      request = "";
      do {
        switch (node.tag) {
          case 0:
            request += describeBuiltInComponentFrame(node.type, null, null);
            break;
          case 1:
            request += describeNativeComponentFrame(node.type, !1);
            break;
          case 2:
            request += describeNativeComponentFrame(node.type, !0);
        }
        node = node.parent;
      } while (node);
      var JSCompiler_temp = request;
    } catch (x) {
      JSCompiler_temp =
        "\nError generating stack: " + x.message + "\n" + x.stack;
    }
    JSCompiler_temp = { componentStack: JSCompiler_temp };
  } else JSCompiler_temp = {};
  return JSCompiler_temp;
}
function logRecoverableError(request, error, errorInfo) {
  request = request.onError(error, errorInfo);
  if (null == request || "string" === typeof request) return request;
}
function fatalError(request, error) {
  var onShellError = request.onShellError;
  onShellError(error);
  onShellError = request.onFatalError;
  onShellError(error);
  null !== request.destination
    ? ((request.status = 2),
      (request = request.destination),
      (request.done = !0),
      (request.fatal = !0),
      (request.error = error))
    : ((request.status = 1), (request.fatalError = error));
}
function finishFunctionComponent(
  request,
  task,
  keyPath,
  children,
  hasId,
  formStateCount,
  formStateMatchingIndex
) {
  var didEmitFormStateMarkers = !1;
  if (0 !== formStateCount && null !== request.formState) {
    var segment = task.blockedSegment;
    if (null !== segment) {
      didEmitFormStateMarkers = !0;
      segment = segment.chunks;
      for (var i = 0; i < formStateCount; i++)
        i === formStateMatchingIndex
          ? segment.push("\x3c!--F!--\x3e")
          : segment.push("\x3c!--F--\x3e");
    }
  }
  formStateCount = task.keyPath;
  task.keyPath = keyPath;
  hasId
    ? ((keyPath = task.treeContext),
      (task.treeContext = pushTreeContext(keyPath, 1, 0)),
      renderNode(request, task, children, -1),
      (task.treeContext = keyPath))
    : didEmitFormStateMarkers
    ? renderNode(request, task, children, -1)
    : renderNodeDestructive(request, task, null, children, -1);
  task.keyPath = formStateCount;
}
function resolveDefaultProps(Component, baseProps) {
  if (Component && Component.defaultProps) {
    baseProps = assign({}, baseProps);
    Component = Component.defaultProps;
    for (var propName in Component)
      void 0 === baseProps[propName] &&
        (baseProps[propName] = Component[propName]);
    return baseProps;
  }
  return baseProps;
}
function renderElement(
  request,
  task,
  keyPath,
  prevThenableState,
  type,
  props,
  ref
) {
  if ("function" === typeof type)
    if (type.prototype && type.prototype.isReactComponent) {
      prevThenableState = task.componentStack;
      task.componentStack = { tag: 2, parent: task.componentStack, type: type };
      ref = emptyContextObject;
      var contextType = type.contextType;
      "object" === typeof contextType &&
        null !== contextType &&
        (ref = contextType._currentValue);
      ref = new type(props, ref);
      var initialState = void 0 !== ref.state ? ref.state : null;
      ref.updater = classComponentUpdater;
      ref.props = props;
      ref.state = initialState;
      contextType = { queue: [], replace: !1 };
      ref._reactInternals = contextType;
      var contextType$jscomp$0 = type.contextType;
      ref.context =
        "object" === typeof contextType$jscomp$0 &&
        null !== contextType$jscomp$0
          ? contextType$jscomp$0._currentValue
          : emptyContextObject;
      contextType$jscomp$0 = type.getDerivedStateFromProps;
      "function" === typeof contextType$jscomp$0 &&
        ((contextType$jscomp$0 = contextType$jscomp$0(props, initialState)),
        (initialState =
          null === contextType$jscomp$0 || void 0 === contextType$jscomp$0
            ? initialState
            : assign({}, initialState, contextType$jscomp$0)),
        (ref.state = initialState));
      if (
        "function" !== typeof type.getDerivedStateFromProps &&
        "function" !== typeof ref.getSnapshotBeforeUpdate &&
        ("function" === typeof ref.UNSAFE_componentWillMount ||
          "function" === typeof ref.componentWillMount)
      )
        if (
          ((type = ref.state),
          "function" === typeof ref.componentWillMount &&
            ref.componentWillMount(),
          "function" === typeof ref.UNSAFE_componentWillMount &&
            ref.UNSAFE_componentWillMount(),
          type !== ref.state &&
            classComponentUpdater.enqueueReplaceState(ref, ref.state, null),
          null !== contextType.queue && 0 < contextType.queue.length)
        )
          if (
            ((type = contextType.queue),
            (contextType$jscomp$0 = contextType.replace),
            (contextType.queue = null),
            (contextType.replace = !1),
            contextType$jscomp$0 && 1 === type.length)
          )
            ref.state = type[0];
          else {
            contextType = contextType$jscomp$0 ? type[0] : ref.state;
            initialState = !0;
            for (
              contextType$jscomp$0 = contextType$jscomp$0 ? 1 : 0;
              contextType$jscomp$0 < type.length;
              contextType$jscomp$0++
            ) {
              var partial = type[contextType$jscomp$0];
              partial =
                "function" === typeof partial
                  ? partial.call(ref, contextType, props, void 0)
                  : partial;
              null != partial &&
                (initialState
                  ? ((initialState = !1),
                    (contextType = assign({}, contextType, partial)))
                  : assign(contextType, partial));
            }
            ref.state = contextType;
          }
        else contextType.queue = null;
      props = ref.render();
      type = task.keyPath;
      task.keyPath = keyPath;
      renderNodeDestructive(request, task, null, props, -1);
      task.keyPath = type;
      task.componentStack = prevThenableState;
    } else
      (ref = task.componentStack),
        (task.componentStack = {
          tag: 1,
          parent: task.componentStack,
          type: type
        }),
        (currentlyRenderingComponent = {}),
        (currentlyRenderingTask = task),
        (currentlyRenderingRequest = request),
        (currentlyRenderingKeyPath = keyPath),
        (formStateCounter = localIdCounter = 0),
        (formStateMatchingIndex = -1),
        (thenableIndexCounter = 0),
        (thenableState = prevThenableState),
        (prevThenableState = type(props, void 0)),
        (props = finishHooks(type, props, prevThenableState, void 0)),
        finishFunctionComponent(
          request,
          task,
          keyPath,
          props,
          0 !== localIdCounter,
          formStateCounter,
          formStateMatchingIndex
        ),
        (task.componentStack = ref);
  else if ("string" === typeof type) {
    prevThenableState = task.componentStack;
    task.componentStack = createBuiltInComponentStack(task, type);
    ref = task.blockedSegment;
    if (null === ref)
      (ref = props.children),
        (contextType = task.formatContext),
        (initialState = task.keyPath),
        (task.formatContext = getChildFormatContext(contextType, type, props)),
        (task.keyPath = keyPath),
        renderNode(request, task, ref, -1),
        (task.formatContext = contextType),
        (task.keyPath = initialState);
    else {
      initialState = pushStartInstance(
        ref.chunks,
        type,
        props,
        request.resumableState,
        request.renderState,
        task.formatContext,
        ref.lastPushedText
      );
      ref.lastPushedText = !1;
      contextType = task.formatContext;
      contextType$jscomp$0 = task.keyPath;
      task.formatContext = getChildFormatContext(contextType, type, props);
      task.keyPath = keyPath;
      renderNode(request, task, initialState, -1);
      task.formatContext = contextType;
      task.keyPath = contextType$jscomp$0;
      a: {
        keyPath = ref.chunks;
        request = request.resumableState;
        switch (type) {
          case "title":
          case "style":
          case "script":
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
          case "wbr":
            break a;
          case "body":
            if (1 >= contextType.insertionMode) {
              request.hasBody = !0;
              break a;
            }
            break;
          case "html":
            if (0 === contextType.insertionMode) {
              request.hasHtml = !0;
              break a;
            }
        }
        keyPath.push(endChunkForTag(type));
      }
      ref.lastPushedText = !1;
    }
    task.componentStack = prevThenableState;
  } else {
    switch (type) {
      case REACT_LEGACY_HIDDEN_TYPE:
      case REACT_DEBUG_TRACING_MODE_TYPE:
      case REACT_STRICT_MODE_TYPE:
      case REACT_PROFILER_TYPE:
      case REACT_FRAGMENT_TYPE:
        type = task.keyPath;
        task.keyPath = keyPath;
        renderNodeDestructive(request, task, null, props.children, -1);
        task.keyPath = type;
        return;
      case REACT_OFFSCREEN_TYPE:
        "hidden" !== props.mode &&
          ((type = task.keyPath),
          (task.keyPath = keyPath),
          renderNodeDestructive(request, task, null, props.children, -1),
          (task.keyPath = type));
        return;
      case REACT_SUSPENSE_LIST_TYPE:
        type = task.componentStack;
        task.componentStack = createBuiltInComponentStack(task, "SuspenseList");
        prevThenableState = task.keyPath;
        task.keyPath = keyPath;
        renderNodeDestructive(request, task, null, props.children, -1);
        task.keyPath = prevThenableState;
        task.componentStack = type;
        return;
      case REACT_SCOPE_TYPE:
        type = task.keyPath;
        task.keyPath = keyPath;
        renderNodeDestructive(request, task, null, props.children, -1);
        task.keyPath = type;
        return;
      case REACT_SUSPENSE_TYPE:
        a: if (null !== task.replay) {
          type = task.keyPath;
          task.keyPath = keyPath;
          keyPath = props.children;
          try {
            renderNode(request, task, keyPath, -1);
          } finally {
            task.keyPath = type;
          }
        } else {
          var previousComponentStack = task.componentStack;
          type = task.componentStack = createBuiltInComponentStack(
            task,
            "Suspense"
          );
          var prevKeyPath = task.keyPath;
          prevThenableState = task.blockedBoundary;
          var parentSegment = task.blockedSegment;
          ref = props.fallback;
          var content = props.children;
          props = new Set();
          contextType$jscomp$0 = createSuspenseBoundary(request, props);
          null !== request.trackedPostpones &&
            (contextType$jscomp$0.trackedContentKeyPath = keyPath);
          partial = createPendingSegment(
            request,
            parentSegment.chunks.length,
            contextType$jscomp$0,
            task.formatContext,
            !1,
            !1
          );
          parentSegment.children.push(partial);
          parentSegment.lastPushedText = !1;
          var contentRootSegment = createPendingSegment(
            request,
            0,
            null,
            task.formatContext,
            !1,
            !1
          );
          contentRootSegment.parentFlushed = !0;
          task.blockedBoundary = contextType$jscomp$0;
          task.blockedSegment = contentRootSegment;
          request.renderState.boundaryResources =
            contextType$jscomp$0.resources;
          task.keyPath = keyPath;
          try {
            if (
              (renderNode(request, task, content, -1),
              contentRootSegment.lastPushedText &&
                contentRootSegment.textEmbedded &&
                contentRootSegment.chunks.push("\x3c!-- --\x3e"),
              (contentRootSegment.status = 1),
              queueCompletedSegment(contextType$jscomp$0, contentRootSegment),
              0 === contextType$jscomp$0.pendingTasks &&
                0 === contextType$jscomp$0.status)
            ) {
              contextType$jscomp$0.status = 1;
              task.componentStack = previousComponentStack;
              break a;
            }
          } catch (error) {
            (contentRootSegment.status = 4),
              (contextType$jscomp$0.status = 4),
              (contextType = getThrownInfo(request, task.componentStack)),
              (initialState = logRecoverableError(request, error, contextType)),
              (contextType$jscomp$0.errorDigest = initialState),
              untrackBoundary(request, contextType$jscomp$0);
          } finally {
            (request.renderState.boundaryResources = prevThenableState
              ? prevThenableState.resources
              : null),
              (task.blockedBoundary = prevThenableState),
              (task.blockedSegment = parentSegment),
              (task.keyPath = prevKeyPath),
              (task.componentStack = previousComponentStack);
          }
          contextType = [keyPath[0], "Suspense Fallback", keyPath[2]];
          initialState = request.trackedPostpones;
          null !== initialState &&
            ((previousComponentStack = [
              contextType[1],
              contextType[2],
              [],
              null
            ]),
            initialState.workingMap.set(contextType, previousComponentStack),
            5 === contextType$jscomp$0.status
              ? (initialState.workingMap.get(keyPath)[4] =
                  previousComponentStack)
              : (contextType$jscomp$0.trackedFallbackNode =
                  previousComponentStack));
          task = createRenderTask(
            request,
            null,
            ref,
            -1,
            prevThenableState,
            partial,
            props,
            contextType,
            task.formatContext,
            task.legacyContext,
            task.context,
            task.treeContext,
            type
          );
          request.pingedTasks.push(task);
        }
        return;
    }
    if ("object" === typeof type && null !== type)
      switch (type.$$typeof) {
        case REACT_FORWARD_REF_TYPE:
          contextType = task.componentStack;
          task.componentStack = {
            tag: 1,
            parent: task.componentStack,
            type: type.render
          };
          type = type.render;
          currentlyRenderingComponent = {};
          currentlyRenderingTask = task;
          currentlyRenderingRequest = request;
          currentlyRenderingKeyPath = keyPath;
          formStateCounter = localIdCounter = 0;
          formStateMatchingIndex = -1;
          thenableIndexCounter = 0;
          thenableState = prevThenableState;
          prevThenableState = type(props, ref);
          props = finishHooks(type, props, prevThenableState, ref);
          finishFunctionComponent(
            request,
            task,
            keyPath,
            props,
            0 !== localIdCounter,
            formStateCounter,
            formStateMatchingIndex
          );
          task.componentStack = contextType;
          return;
        case REACT_MEMO_TYPE:
          type = type.type;
          props = resolveDefaultProps(type, props);
          renderElement(
            request,
            task,
            keyPath,
            prevThenableState,
            type,
            props,
            ref
          );
          return;
        case REACT_PROVIDER_TYPE:
          ref = props.children;
          prevThenableState = task.keyPath;
          type = type._context;
          props = props.value;
          contextType = type._currentValue;
          type._currentValue = props;
          initialState = currentActiveSnapshot;
          currentActiveSnapshot = props = {
            parent: initialState,
            depth: null === initialState ? 0 : initialState.depth + 1,
            context: type,
            parentValue: contextType,
            value: props
          };
          task.context = props;
          task.keyPath = keyPath;
          renderNodeDestructive(request, task, null, ref, -1);
          request = currentActiveSnapshot;
          if (null === request)
            throw Error(
              "Tried to pop a Context at the root of the app. This is a bug in React."
            );
          keyPath = request.parentValue;
          request.context._currentValue =
            keyPath === REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED
              ? request.context._defaultValue
              : keyPath;
          request = currentActiveSnapshot = request.parent;
          task.context = request;
          task.keyPath = prevThenableState;
          return;
        case REACT_CONTEXT_TYPE:
          props = props.children;
          props = props(type._currentValue);
          type = task.keyPath;
          task.keyPath = keyPath;
          renderNodeDestructive(request, task, null, props, -1);
          task.keyPath = type;
          return;
        case REACT_LAZY_TYPE:
          ref = task.componentStack;
          task.componentStack = createBuiltInComponentStack(task, "Lazy");
          contextType = type._init;
          type = contextType(type._payload);
          props = resolveDefaultProps(type, props);
          renderElement(
            request,
            task,
            keyPath,
            prevThenableState,
            type,
            props,
            void 0
          );
          task.componentStack = ref;
          return;
      }
    throw Error(
      "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " +
        ((null == type ? type : typeof type) + ".")
    );
  }
}
function resumeNode(request, task, segmentId, node, childIndex) {
  var prevReplay = task.replay,
    blockedBoundary = task.blockedBoundary,
    resumedSegment = createPendingSegment(
      request,
      0,
      null,
      task.formatContext,
      !1,
      !1
    );
  resumedSegment.id = segmentId;
  resumedSegment.parentFlushed = !0;
  try {
    (task.replay = null),
      (task.blockedSegment = resumedSegment),
      renderNode(request, task, node, childIndex),
      (resumedSegment.status = 1),
      null === blockedBoundary
        ? (request.completedRootSegment = resumedSegment)
        : (queueCompletedSegment(blockedBoundary, resumedSegment),
          blockedBoundary.parentFlushed &&
            request.partialBoundaries.push(blockedBoundary));
  } finally {
    (task.replay = prevReplay), (task.blockedSegment = null);
  }
}
function renderNodeDestructive(
  request,
  task,
  prevThenableState,
  node$jscomp$0,
  childIndex
) {
  if (null !== task.replay && "number" === typeof task.replay.slots)
    resumeNode(request, task, task.replay.slots, node$jscomp$0, childIndex);
  else {
    task.node = node$jscomp$0;
    task.childIndex = childIndex;
    if ("object" === typeof node$jscomp$0 && null !== node$jscomp$0) {
      switch (node$jscomp$0.$$typeof) {
        case REACT_ELEMENT_TYPE:
          var type = node$jscomp$0.type,
            key = node$jscomp$0.key,
            props = node$jscomp$0.props,
            ref = node$jscomp$0.ref,
            name = getComponentNameFromType(type),
            keyOrIndex =
              null == key ? (-1 === childIndex ? 0 : childIndex) : key;
          key = [task.keyPath, name, keyOrIndex];
          if (null !== task.replay)
            a: {
              var replay = task.replay;
              childIndex = replay.nodes;
              for (
                node$jscomp$0 = 0;
                node$jscomp$0 < childIndex.length;
                node$jscomp$0++
              ) {
                var node = childIndex[node$jscomp$0];
                if (keyOrIndex === node[1]) {
                  if (4 === node.length) {
                    if (null !== name && name !== node[0])
                      throw Error(
                        "Expected the resume to render <" +
                          node[0] +
                          "> in this slot but instead it rendered <" +
                          name +
                          ">. The tree doesn't match so React will fallback to client rendering."
                      );
                    var childNodes = node[2];
                    name = node[3];
                    node = task.node;
                    task.replay = {
                      nodes: childNodes,
                      slots: name,
                      pendingTasks: 1
                    };
                    try {
                      renderElement(
                        request,
                        task,
                        key,
                        prevThenableState,
                        type,
                        props,
                        ref
                      );
                      if (
                        1 === task.replay.pendingTasks &&
                        0 < task.replay.nodes.length
                      )
                        throw Error(
                          "Couldn't find all resumable slots by key/index during replaying. The tree doesn't match so React will fallback to client rendering."
                        );
                      task.replay.pendingTasks--;
                    } catch (x) {
                      if (
                        "object" === typeof x &&
                        null !== x &&
                        (x === SuspenseException ||
                          "function" === typeof x.then)
                      )
                        throw (task.node === node && (task.replay = replay), x);
                      task.replay.pendingTasks--;
                      props = getThrownInfo(request, task.componentStack);
                      key = request;
                      request = task.blockedBoundary;
                      prevThenableState = x;
                      props = logRecoverableError(
                        key,
                        prevThenableState,
                        props
                      );
                      abortRemainingReplayNodes(
                        key,
                        request,
                        childNodes,
                        name,
                        prevThenableState,
                        props
                      );
                    }
                    task.replay = replay;
                  } else {
                    if (type !== REACT_SUSPENSE_TYPE)
                      throw Error(
                        "Expected the resume to render <Suspense> in this slot but instead it rendered <" +
                          (getComponentNameFromType(type) || "Unknown") +
                          ">. The tree doesn't match so React will fallback to client rendering."
                      );
                    b: {
                      replay = void 0;
                      prevThenableState = node[5];
                      type = node[2];
                      ref = node[3];
                      name = null === node[4] ? [] : node[4][2];
                      node = null === node[4] ? null : node[4][3];
                      keyOrIndex = task.componentStack;
                      var suspenseComponentStack = (task.componentStack =
                          createBuiltInComponentStack(task, "Suspense")),
                        prevKeyPath = task.keyPath,
                        previousReplaySet = task.replay,
                        parentBoundary = task.blockedBoundary,
                        content = props.children;
                      props = props.fallback;
                      var fallbackAbortSet = new Set(),
                        resumedBoundary = createSuspenseBoundary(
                          request,
                          fallbackAbortSet
                        );
                      resumedBoundary.parentFlushed = !0;
                      resumedBoundary.rootSegmentID = prevThenableState;
                      task.blockedBoundary = resumedBoundary;
                      task.replay = {
                        nodes: type,
                        slots: ref,
                        pendingTasks: 1
                      };
                      request.renderState.boundaryResources =
                        resumedBoundary.resources;
                      try {
                        renderNode(request, task, content, -1);
                        if (
                          1 === task.replay.pendingTasks &&
                          0 < task.replay.nodes.length
                        )
                          throw Error(
                            "Couldn't find all resumable slots by key/index during replaying. The tree doesn't match so React will fallback to client rendering."
                          );
                        task.replay.pendingTasks--;
                        if (
                          0 === resumedBoundary.pendingTasks &&
                          0 === resumedBoundary.status
                        ) {
                          resumedBoundary.status = 1;
                          request.completedBoundaries.push(resumedBoundary);
                          break b;
                        }
                      } catch (error) {
                        (resumedBoundary.status = 4),
                          (childNodes = getThrownInfo(
                            request,
                            task.componentStack
                          )),
                          (replay = logRecoverableError(
                            request,
                            error,
                            childNodes
                          )),
                          (resumedBoundary.errorDigest = replay),
                          task.replay.pendingTasks--,
                          request.clientRenderedBoundaries.push(
                            resumedBoundary
                          );
                      } finally {
                        (request.renderState.boundaryResources = parentBoundary
                          ? parentBoundary.resources
                          : null),
                          (task.blockedBoundary = parentBoundary),
                          (task.replay = previousReplaySet),
                          (task.keyPath = prevKeyPath),
                          (task.componentStack = keyOrIndex);
                      }
                      task = createReplayTask(
                        request,
                        null,
                        { nodes: name, slots: node, pendingTasks: 0 },
                        props,
                        -1,
                        parentBoundary,
                        fallbackAbortSet,
                        [key[0], "Suspense Fallback", key[2]],
                        task.formatContext,
                        task.legacyContext,
                        task.context,
                        task.treeContext,
                        suspenseComponentStack
                      );
                      request.pingedTasks.push(task);
                    }
                  }
                  childIndex.splice(node$jscomp$0, 1);
                  break a;
                }
              }
            }
          else
            renderElement(
              request,
              task,
              key,
              prevThenableState,
              type,
              props,
              ref
            );
          return;
        case REACT_PORTAL_TYPE:
          throw Error(
            "Portals are not currently supported by the server renderer. Render them conditionally so that they only appear on the client render."
          );
        case REACT_LAZY_TYPE:
          props = task.componentStack;
          task.componentStack = createBuiltInComponentStack(task, "Lazy");
          key = node$jscomp$0._init;
          node$jscomp$0 = key(node$jscomp$0._payload);
          task.componentStack = props;
          renderNodeDestructive(request, task, null, node$jscomp$0, childIndex);
          return;
      }
      if (isArrayImpl(node$jscomp$0)) {
        renderChildrenArray(request, task, node$jscomp$0, childIndex);
        return;
      }
      null === node$jscomp$0 || "object" !== typeof node$jscomp$0
        ? (props = null)
        : ((props =
            (MAYBE_ITERATOR_SYMBOL && node$jscomp$0[MAYBE_ITERATOR_SYMBOL]) ||
            node$jscomp$0["@@iterator"]),
          (props = "function" === typeof props ? props : null));
      if (props && (props = props.call(node$jscomp$0))) {
        node$jscomp$0 = props.next();
        if (!node$jscomp$0.done) {
          key = [];
          do key.push(node$jscomp$0.value), (node$jscomp$0 = props.next());
          while (!node$jscomp$0.done);
          renderChildrenArray(request, task, key, childIndex);
        }
        return;
      }
      if ("function" === typeof node$jscomp$0.then)
        return renderNodeDestructive(
          request,
          task,
          null,
          unwrapThenable(node$jscomp$0),
          childIndex
        );
      if (
        node$jscomp$0.$$typeof === REACT_CONTEXT_TYPE ||
        node$jscomp$0.$$typeof === REACT_SERVER_CONTEXT_TYPE
      )
        return renderNodeDestructive(
          request,
          task,
          null,
          node$jscomp$0._currentValue,
          childIndex
        );
      childIndex = Object.prototype.toString.call(node$jscomp$0);
      throw Error(
        "Objects are not valid as a React child (found: " +
          ("[object Object]" === childIndex
            ? "object with keys {" + Object.keys(node$jscomp$0).join(", ") + "}"
            : childIndex) +
          "). If you meant to render a collection of children, use an array instead."
      );
    }
    "string" === typeof node$jscomp$0
      ? ((childIndex = task.blockedSegment),
        null !== childIndex &&
          (childIndex.lastPushedText = pushTextInstance(
            childIndex.chunks,
            node$jscomp$0,
            request.renderState,
            childIndex.lastPushedText
          )))
      : "number" === typeof node$jscomp$0 &&
        ((childIndex = task.blockedSegment),
        null !== childIndex &&
          (childIndex.lastPushedText = pushTextInstance(
            childIndex.chunks,
            "" + node$jscomp$0,
            request.renderState,
            childIndex.lastPushedText
          )));
  }
}
function renderChildrenArray(request, task, children, childIndex) {
  var prevKeyPath = task.keyPath;
  if (
    -1 !== childIndex &&
    ((task.keyPath = [task.keyPath, "Fragment", childIndex]),
    null !== task.replay)
  ) {
    for (
      var replay = task.replay, replayNodes = replay.nodes, j = 0;
      j < replayNodes.length;
      j++
    ) {
      var node = replayNodes[j];
      if (node[1] === childIndex) {
        childIndex = node[2];
        node = node[3];
        task.replay = { nodes: childIndex, slots: node, pendingTasks: 1 };
        try {
          renderChildrenArray(request, task, children, -1);
          if (1 === task.replay.pendingTasks && 0 < task.replay.nodes.length)
            throw Error(
              "Couldn't find all resumable slots by key/index during replaying. The tree doesn't match so React will fallback to client rendering."
            );
          task.replay.pendingTasks--;
        } catch (x) {
          if (
            "object" === typeof x &&
            null !== x &&
            (x === SuspenseException || "function" === typeof x.then)
          )
            throw x;
          task.replay.pendingTasks--;
          children = getThrownInfo(request, task.componentStack);
          var boundary = task.blockedBoundary,
            error = x;
          children = logRecoverableError(request, error, children);
          abortRemainingReplayNodes(
            request,
            boundary,
            childIndex,
            node,
            error,
            children
          );
        }
        task.replay = replay;
        replayNodes.splice(j, 1);
        break;
      }
    }
    task.keyPath = prevKeyPath;
    return;
  }
  replay = task.treeContext;
  replayNodes = children.length;
  if (
    null !== task.replay &&
    ((j = task.replay.slots), null !== j && "object" === typeof j)
  ) {
    for (childIndex = 0; childIndex < replayNodes; childIndex++)
      (node = children[childIndex]),
        (task.treeContext = pushTreeContext(replay, replayNodes, childIndex)),
        (boundary = j[childIndex]),
        "number" === typeof boundary
          ? (resumeNode(request, task, boundary, node, childIndex),
            delete j[childIndex])
          : renderNode(request, task, node, childIndex);
    task.treeContext = replay;
    task.keyPath = prevKeyPath;
    return;
  }
  for (j = 0; j < replayNodes; j++)
    (childIndex = children[j]),
      (task.treeContext = pushTreeContext(replay, replayNodes, j)),
      renderNode(request, task, childIndex, j);
  task.treeContext = replay;
  task.keyPath = prevKeyPath;
}
function untrackBoundary(request, boundary) {
  request = request.trackedPostpones;
  null !== request &&
    ((boundary = boundary.trackedContentKeyPath),
    null !== boundary &&
      ((boundary = request.workingMap.get(boundary)),
      void 0 !== boundary &&
        ((boundary.length = 4), (boundary[2] = []), (boundary[3] = null))));
}
function renderNode(request, task, node, childIndex) {
  var previousFormatContext = task.formatContext,
    previousLegacyContext = task.legacyContext,
    previousContext = task.context,
    previousKeyPath = task.keyPath,
    previousTreeContext = task.treeContext,
    previousComponentStack = task.componentStack,
    segment = task.blockedSegment;
  if (null === segment)
    try {
      return renderNodeDestructive(request, task, null, node, childIndex);
    } catch (thrownValue) {
      if (
        (resetHooksState(),
        (node =
          thrownValue === SuspenseException
            ? getSuspendedThenable()
            : thrownValue),
        "object" === typeof node &&
          null !== node &&
          "function" === typeof node.then)
      ) {
        childIndex = getThenableStateAfterSuspending();
        request = createReplayTask(
          request,
          childIndex,
          task.replay,
          task.node,
          task.childIndex,
          task.blockedBoundary,
          task.abortSet,
          task.keyPath,
          task.formatContext,
          task.legacyContext,
          task.context,
          task.treeContext,
          null !== task.componentStack ? task.componentStack.parent : null
        ).ping;
        node.then(request, request);
        task.formatContext = previousFormatContext;
        task.legacyContext = previousLegacyContext;
        task.context = previousContext;
        task.keyPath = previousKeyPath;
        task.treeContext = previousTreeContext;
        task.componentStack = previousComponentStack;
        switchContext(previousContext);
        return;
      }
    }
  else {
    var childrenLength = segment.children.length,
      chunkLength = segment.chunks.length;
    try {
      return renderNodeDestructive(request, task, null, node, childIndex);
    } catch (thrownValue$38) {
      if (
        (resetHooksState(),
        (segment.children.length = childrenLength),
        (segment.chunks.length = chunkLength),
        (node =
          thrownValue$38 === SuspenseException
            ? getSuspendedThenable()
            : thrownValue$38),
        "object" === typeof node &&
          null !== node &&
          "function" === typeof node.then)
      ) {
        childIndex = getThenableStateAfterSuspending();
        segment = task.blockedSegment;
        childrenLength = createPendingSegment(
          request,
          segment.chunks.length,
          null,
          task.formatContext,
          segment.lastPushedText,
          !0
        );
        segment.children.push(childrenLength);
        segment.lastPushedText = !1;
        request = createRenderTask(
          request,
          childIndex,
          task.node,
          task.childIndex,
          task.blockedBoundary,
          childrenLength,
          task.abortSet,
          task.keyPath,
          task.formatContext,
          task.legacyContext,
          task.context,
          task.treeContext,
          null !== task.componentStack ? task.componentStack.parent : null
        ).ping;
        node.then(request, request);
        task.formatContext = previousFormatContext;
        task.legacyContext = previousLegacyContext;
        task.context = previousContext;
        task.keyPath = previousKeyPath;
        task.treeContext = previousTreeContext;
        task.componentStack = previousComponentStack;
        switchContext(previousContext);
        return;
      }
    }
  }
  task.formatContext = previousFormatContext;
  task.legacyContext = previousLegacyContext;
  task.context = previousContext;
  task.keyPath = previousKeyPath;
  task.treeContext = previousTreeContext;
  switchContext(previousContext);
  throw node;
}
function abortTaskSoft(task) {
  var boundary = task.blockedBoundary;
  task = task.blockedSegment;
  null !== task && ((task.status = 3), finishedTask(this, boundary, task));
}
function abortRemainingReplayNodes(
  request$jscomp$0,
  boundary,
  nodes,
  slots,
  error,
  errorDigest$jscomp$0
) {
  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];
    if (4 === node.length)
      abortRemainingReplayNodes(
        request$jscomp$0,
        boundary,
        node[2],
        node[3],
        error,
        errorDigest$jscomp$0
      );
    else {
      node = node[5];
      var request = request$jscomp$0,
        errorDigest = errorDigest$jscomp$0,
        resumedBoundary = createSuspenseBoundary(request, new Set());
      resumedBoundary.parentFlushed = !0;
      resumedBoundary.rootSegmentID = node;
      resumedBoundary.status = 4;
      resumedBoundary.errorDigest = errorDigest;
      resumedBoundary.parentFlushed &&
        request.clientRenderedBoundaries.push(resumedBoundary);
    }
  }
  nodes.length = 0;
  if (null !== slots) {
    if (null === boundary)
      throw Error(
        "We should not have any resumable nodes in the shell. This is a bug in React."
      );
    4 !== boundary.status &&
      ((boundary.status = 4),
      (boundary.errorDigest = errorDigest$jscomp$0),
      boundary.parentFlushed &&
        request$jscomp$0.clientRenderedBoundaries.push(boundary));
    if ("object" === typeof slots) for (var index in slots) delete slots[index];
  }
}
function abortTask(task, request, error) {
  var boundary = task.blockedBoundary,
    segment = task.blockedSegment;
  null !== segment && (segment.status = 3);
  if (null === boundary) {
    if (((boundary = {}), 1 !== request.status && 2 !== request.status)) {
      task = task.replay;
      if (null === task) {
        logRecoverableError(request, error, boundary);
        fatalError(request, error);
        return;
      }
      task.pendingTasks--;
      0 === task.pendingTasks &&
        0 < task.nodes.length &&
        ((boundary = logRecoverableError(request, error, boundary)),
        abortRemainingReplayNodes(
          request,
          null,
          task.nodes,
          task.slots,
          error,
          boundary
        ));
      request.pendingRootTasks--;
      0 === request.pendingRootTasks && completeShell(request);
    }
  } else
    boundary.pendingTasks--,
      4 !== boundary.status &&
        ((boundary.status = 4),
        (task = getThrownInfo(request, task.componentStack)),
        (task = logRecoverableError(request, error, task)),
        (boundary.errorDigest = task),
        untrackBoundary(request, boundary),
        boundary.parentFlushed &&
          request.clientRenderedBoundaries.push(boundary)),
      boundary.fallbackAbortableTasks.forEach(function (fallbackTask) {
        return abortTask(fallbackTask, request, error);
      }),
      boundary.fallbackAbortableTasks.clear();
  request.allPendingTasks--;
  0 === request.allPendingTasks && completeAll(request);
}
function safelyEmitEarlyPreloads(request, shellComplete) {
  try {
    var renderState = request.renderState,
      onHeaders = renderState.onHeaders;
    if (onHeaders) {
      var headers = renderState.headers;
      if (headers) {
        renderState.headers = null;
        var linkHeader = headers.preconnects;
        headers.fontPreloads &&
          (linkHeader && (linkHeader += ", "),
          (linkHeader += headers.fontPreloads));
        headers.highImagePreloads &&
          (linkHeader && (linkHeader += ", "),
          (linkHeader += headers.highImagePreloads));
        if (!shellComplete) {
          var queueIter = renderState.styles.values(),
            queueStep = queueIter.next();
          b: for (
            ;
            0 < headers.remainingCapacity && !queueStep.done;
            queueStep = queueIter.next()
          )
            for (
              var sheetIter = queueStep.value.sheets.values(),
                sheetStep = sheetIter.next();
              0 < headers.remainingCapacity && !sheetStep.done;
              sheetStep = sheetIter.next()
            ) {
              var sheet = sheetStep.value,
                props = sheet.props,
                key = props.href,
                props$jscomp$0 = sheet.props,
                header = getPreloadAsHeader(props$jscomp$0.href, "style", {
                  crossOrigin: props$jscomp$0.crossOrigin,
                  integrity: props$jscomp$0.integrity,
                  nonce: props$jscomp$0.nonce,
                  type: props$jscomp$0.type,
                  fetchPriority: props$jscomp$0.fetchPriority,
                  referrerPolicy: props$jscomp$0.referrerPolicy,
                  media: props$jscomp$0.media
                });
              if (2 <= (headers.remainingCapacity -= header.length))
                (renderState.resets.style[key] = PRELOAD_NO_CREDS),
                  linkHeader && (linkHeader += ", "),
                  (linkHeader += header),
                  (renderState.resets.style[key] =
                    "string" === typeof props.crossOrigin ||
                    "string" === typeof props.integrity
                      ? [props.crossOrigin, props.integrity]
                      : PRELOAD_NO_CREDS);
              else break b;
            }
        }
        linkHeader ? onHeaders({ Link: linkHeader }) : onHeaders({});
      }
    }
  } catch (error) {
    logRecoverableError(request, error, {});
  }
}
function completeShell(request) {
  null === request.trackedPostpones && safelyEmitEarlyPreloads(request, !0);
  request.onShellError = noop;
  request = request.onShellReady;
  request();
}
function completeAll(request) {
  safelyEmitEarlyPreloads(
    request,
    null === request.trackedPostpones
      ? !0
      : null === request.completedRootSegment ||
          5 !== request.completedRootSegment.status
  );
  request = request.onAllReady;
  request();
}
function queueCompletedSegment(boundary, segment) {
  if (
    0 === segment.chunks.length &&
    1 === segment.children.length &&
    null === segment.children[0].boundary &&
    -1 === segment.children[0].id
  ) {
    var childSegment = segment.children[0];
    childSegment.id = segment.id;
    childSegment.parentFlushed = !0;
    1 === childSegment.status && queueCompletedSegment(boundary, childSegment);
  } else boundary.completedSegments.push(segment);
}
function finishedTask(request, boundary, segment) {
  if (null === boundary) {
    if (null !== segment && segment.parentFlushed) {
      if (null !== request.completedRootSegment)
        throw Error(
          "There can only be one root segment. This is a bug in React."
        );
      request.completedRootSegment = segment;
    }
    request.pendingRootTasks--;
    0 === request.pendingRootTasks && completeShell(request);
  } else
    boundary.pendingTasks--,
      4 !== boundary.status &&
        (0 === boundary.pendingTasks
          ? (0 === boundary.status && (boundary.status = 1),
            null !== segment &&
              segment.parentFlushed &&
              1 === segment.status &&
              queueCompletedSegment(boundary, segment),
            boundary.parentFlushed &&
              request.completedBoundaries.push(boundary),
            1 === boundary.status &&
              (boundary.fallbackAbortableTasks.forEach(abortTaskSoft, request),
              boundary.fallbackAbortableTasks.clear()))
          : null !== segment &&
            segment.parentFlushed &&
            1 === segment.status &&
            (queueCompletedSegment(boundary, segment),
            1 === boundary.completedSegments.length &&
              boundary.parentFlushed &&
              request.partialBoundaries.push(boundary)));
  request.allPendingTasks--;
  0 === request.allPendingTasks && completeAll(request);
}
function flushSubtree(request, destination, segment) {
  segment.parentFlushed = !0;
  switch (segment.status) {
    case 0:
      segment.id = request.nextSegmentId++;
    case 5:
      var segmentID = segment.id;
      segment.lastPushedText = !1;
      segment.textEmbedded = !1;
      request = request.renderState;
      writeChunk(destination, '<template id="');
      writeChunk(destination, request.placeholderPrefix);
      request = segmentID.toString(16);
      writeChunk(destination, request);
      return writeChunkAndReturn(destination, '"></template>');
    case 1:
      segment.status = 2;
      var r = !0;
      segmentID = segment.chunks;
      var chunkIdx = 0;
      segment = segment.children;
      for (var childIdx = 0; childIdx < segment.length; childIdx++) {
        for (r = segment[childIdx]; chunkIdx < r.index; chunkIdx++)
          destination.buffer += segmentID[chunkIdx];
        r = flushSegment(request, destination, r);
      }
      for (; chunkIdx < segmentID.length - 1; chunkIdx++)
        destination.buffer += segmentID[chunkIdx];
      chunkIdx < segmentID.length &&
        (r = writeChunkAndReturn(destination, segmentID[chunkIdx]));
      return r;
    default:
      throw Error(
        "Aborted, errored or already flushed boundaries should not be flushed again. This is a bug in React."
      );
  }
}
function flushSegment(request, destination, segment) {
  var boundary = segment.boundary;
  if (null === boundary) return flushSubtree(request, destination, segment);
  boundary.parentFlushed = !0;
  if (4 === boundary.status)
    (boundary = boundary.errorDigest),
      writeChunkAndReturn(destination, "\x3c!--$!--\x3e"),
      writeChunk(destination, "<template"),
      boundary &&
        (writeChunk(destination, ' data-dgst="'),
        writeChunk(destination, escapeTextForBrowser(boundary)),
        writeChunk(destination, '"')),
      writeChunkAndReturn(destination, "></template>"),
      flushSubtree(request, destination, segment);
  else if (1 !== boundary.status)
    0 === boundary.status && (boundary.rootSegmentID = request.nextSegmentId++),
      0 < boundary.completedSegments.length &&
        request.partialBoundaries.push(boundary),
      writeStartPendingSuspenseBoundary(
        destination,
        request.renderState,
        boundary.rootSegmentID
      ),
      flushSubtree(request, destination, segment);
  else if (boundary.byteSize > request.progressiveChunkSize)
    (boundary.rootSegmentID = request.nextSegmentId++),
      request.completedBoundaries.push(boundary),
      writeStartPendingSuspenseBoundary(
        destination,
        request.renderState,
        boundary.rootSegmentID
      ),
      flushSubtree(request, destination, segment);
  else {
    segment = boundary.resources;
    var currentBoundaryResources = request.renderState.boundaryResources;
    currentBoundaryResources &&
      (segment.styles.forEach(
        hoistStyleQueueDependency,
        currentBoundaryResources
      ),
      segment.stylesheets.forEach(
        hoistStylesheetDependency,
        currentBoundaryResources
      ));
    writeChunkAndReturn(destination, "\x3c!--$--\x3e");
    boundary = boundary.completedSegments;
    if (1 !== boundary.length)
      throw Error(
        "A previously unvisited boundary must have exactly one root segment. This is a bug in React."
      );
    flushSegment(request, destination, boundary[0]);
  }
  return writeChunkAndReturn(destination, "\x3c!--/$--\x3e");
}
function flushSegmentContainer(request, destination, segment) {
  writeStartSegment(
    destination,
    request.renderState,
    segment.parentFormatContext,
    segment.id
  );
  flushSegment(request, destination, segment);
  return writeEndSegment(destination, segment.parentFormatContext);
}
function flushCompletedBoundary(request, destination, boundary) {
  request.renderState.boundaryResources = boundary.resources;
  for (
    var completedSegments = boundary.completedSegments, i = 0;
    i < completedSegments.length;
    i++
  )
    flushPartiallyCompletedSegment(
      request,
      destination,
      boundary,
      completedSegments[i]
    );
  completedSegments.length = 0;
  writeResourcesForBoundary(
    destination,
    boundary.resources,
    request.renderState
  );
  completedSegments = request.resumableState;
  request = request.renderState;
  i = boundary.rootSegmentID;
  boundary = boundary.resources;
  var requiresStyleInsertion = request.stylesToHoist;
  request.stylesToHoist = !1;
  var scriptFormat = 0 === completedSegments.streamingFormat;
  scriptFormat
    ? (writeChunk(destination, request.startInlineScript),
      requiresStyleInsertion
        ? 0 === (completedSegments.instructions & 2)
          ? ((completedSegments.instructions |= 10),
            writeChunk(
              destination,
              '$RC=function(b,c,e){c=document.getElementById(c);c.parentNode.removeChild(c);var a=document.getElementById(b);if(a){b=a.previousSibling;if(e)b.data="$!",a.setAttribute("data-dgst",e);else{e=b.parentNode;a=b.nextSibling;var f=0;do{if(a&&8===a.nodeType){var d=a.data;if("/$"===d)if(0===f)break;else f--;else"$"!==d&&"$?"!==d&&"$!"!==d||f++}d=a.nextSibling;e.removeChild(a);a=d}while(a);for(;c.firstChild;)e.insertBefore(c.firstChild,a);b.data="$"}b._reactRetry&&b._reactRetry()}};$RM=new Map;\n$RR=function(r,t,w){for(var u=$RC,n=$RM,p=new Map,q=document,g,b,h=q.querySelectorAll("link[data-precedence],style[data-precedence]"),v=[],k=0;b=h[k++];)"not all"===b.getAttribute("media")?v.push(b):("LINK"===b.tagName&&n.set(b.getAttribute("href"),b),p.set(b.dataset.precedence,g=b));b=0;h=[];var l,a;for(k=!0;;){if(k){var f=w[b++];if(!f){k=!1;b=0;continue}var c=!1,m=0;var d=f[m++];if(a=n.get(d)){var e=a._p;c=!0}else{a=q.createElement("link");a.href=d;a.rel="stylesheet";for(a.dataset.precedence=\nl=f[m++];e=f[m++];)a.setAttribute(e,f[m++]);e=a._p=new Promise(function(x,y){a.onload=x;a.onerror=y});n.set(d,a)}d=a.getAttribute("media");!e||"l"===e.s||d&&!matchMedia(d).matches||h.push(e);if(c)continue}else{a=v[b++];if(!a)break;l=a.getAttribute("data-precedence");a.removeAttribute("media")}c=p.get(l)||g;c===g&&(g=a);p.set(l,a);c?c.parentNode.insertBefore(a,c.nextSibling):(c=q.head,c.insertBefore(a,c.firstChild))}Promise.all(h).then(u.bind(null,r,t,""),u.bind(null,r,t,"Resource failed to load"))};$RR("'
            ))
          : 0 === (completedSegments.instructions & 8)
          ? ((completedSegments.instructions |= 8),
            writeChunk(
              destination,
              '$RM=new Map;\n$RR=function(r,t,w){for(var u=$RC,n=$RM,p=new Map,q=document,g,b,h=q.querySelectorAll("link[data-precedence],style[data-precedence]"),v=[],k=0;b=h[k++];)"not all"===b.getAttribute("media")?v.push(b):("LINK"===b.tagName&&n.set(b.getAttribute("href"),b),p.set(b.dataset.precedence,g=b));b=0;h=[];var l,a;for(k=!0;;){if(k){var f=w[b++];if(!f){k=!1;b=0;continue}var c=!1,m=0;var d=f[m++];if(a=n.get(d)){var e=a._p;c=!0}else{a=q.createElement("link");a.href=d;a.rel="stylesheet";for(a.dataset.precedence=\nl=f[m++];e=f[m++];)a.setAttribute(e,f[m++]);e=a._p=new Promise(function(x,y){a.onload=x;a.onerror=y});n.set(d,a)}d=a.getAttribute("media");!e||"l"===e.s||d&&!matchMedia(d).matches||h.push(e);if(c)continue}else{a=v[b++];if(!a)break;l=a.getAttribute("data-precedence");a.removeAttribute("media")}c=p.get(l)||g;c===g&&(g=a);p.set(l,a);c?c.parentNode.insertBefore(a,c.nextSibling):(c=q.head,c.insertBefore(a,c.firstChild))}Promise.all(h).then(u.bind(null,r,t,""),u.bind(null,r,t,"Resource failed to load"))};$RR("'
            ))
          : writeChunk(destination, '$RR("')
        : 0 === (completedSegments.instructions & 2)
        ? ((completedSegments.instructions |= 2),
          writeChunk(
            destination,
            '$RC=function(b,c,e){c=document.getElementById(c);c.parentNode.removeChild(c);var a=document.getElementById(b);if(a){b=a.previousSibling;if(e)b.data="$!",a.setAttribute("data-dgst",e);else{e=b.parentNode;a=b.nextSibling;var f=0;do{if(a&&8===a.nodeType){var d=a.data;if("/$"===d)if(0===f)break;else f--;else"$"!==d&&"$?"!==d&&"$!"!==d||f++}d=a.nextSibling;e.removeChild(a);a=d}while(a);for(;c.firstChild;)e.insertBefore(c.firstChild,a);b.data="$"}b._reactRetry&&b._reactRetry()}};$RC("'
          ))
        : writeChunk(destination, '$RC("'))
    : requiresStyleInsertion
    ? writeChunk(destination, '<template data-rri="" data-bid="')
    : writeChunk(destination, '<template data-rci="" data-bid="');
  completedSegments = i.toString(16);
  writeChunk(destination, request.boundaryPrefix);
  writeChunk(destination, completedSegments);
  scriptFormat
    ? writeChunk(destination, '","')
    : writeChunk(destination, '" data-sid="');
  writeChunk(destination, request.segmentPrefix);
  writeChunk(destination, completedSegments);
  requiresStyleInsertion
    ? scriptFormat
      ? (writeChunk(destination, '",'),
        writeStyleResourceDependenciesInJS(destination, boundary))
      : (writeChunk(destination, '" data-sty="'),
        writeStyleResourceDependenciesInAttr(destination, boundary))
    : scriptFormat && writeChunk(destination, '"');
  completedSegments = scriptFormat
    ? writeChunkAndReturn(destination, ")\x3c/script>")
    : writeChunkAndReturn(destination, '"></template>');
  return writeBootstrap(destination, request) && completedSegments;
}
function flushPartiallyCompletedSegment(
  request,
  destination,
  boundary,
  segment
) {
  if (2 === segment.status) return !0;
  var segmentID = segment.id;
  if (-1 === segmentID) {
    if (-1 === (segment.id = boundary.rootSegmentID))
      throw Error(
        "A root segment ID must have been assigned by now. This is a bug in React."
      );
    return flushSegmentContainer(request, destination, segment);
  }
  if (segmentID === boundary.rootSegmentID)
    return flushSegmentContainer(request, destination, segment);
  flushSegmentContainer(request, destination, segment);
  boundary = request.resumableState;
  request = request.renderState;
  (segment = 0 === boundary.streamingFormat)
    ? (writeChunk(destination, request.startInlineScript),
      0 === (boundary.instructions & 1)
        ? ((boundary.instructions |= 1),
          writeChunk(
            destination,
            '$RS=function(a,b){a=document.getElementById(a);b=document.getElementById(b);for(a.parentNode.removeChild(a);a.firstChild;)b.parentNode.insertBefore(a.firstChild,b);b.parentNode.removeChild(b)};$RS("'
          ))
        : writeChunk(destination, '$RS("'))
    : writeChunk(destination, '<template data-rsi="" data-sid="');
  writeChunk(destination, request.segmentPrefix);
  segmentID = segmentID.toString(16);
  writeChunk(destination, segmentID);
  segment
    ? writeChunk(destination, '","')
    : writeChunk(destination, '" data-pid="');
  writeChunk(destination, request.placeholderPrefix);
  writeChunk(destination, segmentID);
  destination = segment
    ? writeChunkAndReturn(destination, '")\x3c/script>')
    : writeChunkAndReturn(destination, '"></template>');
  return destination;
}
function flushCompletedQueues(request, destination) {
  try {
    var i,
      completedRootSegment = request.completedRootSegment;
    if (null !== completedRootSegment)
      if (5 !== completedRootSegment.status && 0 === request.pendingRootTasks) {
        var renderState = request.renderState;
        if (
          (0 !== request.allPendingTasks ||
            null !== request.trackedPostpones) &&
          renderState.externalRuntimeScript
        ) {
          var _renderState$external = renderState.externalRuntimeScript,
            resumableState = request.resumableState,
            src = _renderState$external.src,
            chunks = _renderState$external.chunks;
          resumableState.scriptResources.hasOwnProperty(src) ||
            ((resumableState.scriptResources[src] = null),
            renderState.scripts.add(chunks));
        }
        var htmlChunks = renderState.htmlChunks,
          headChunks = renderState.headChunks;
        _renderState$external = 0;
        if (htmlChunks) {
          for (
            _renderState$external = 0;
            _renderState$external < htmlChunks.length;
            _renderState$external++
          )
            writeChunk(destination, htmlChunks[_renderState$external]);
          if (headChunks)
            for (
              _renderState$external = 0;
              _renderState$external < headChunks.length;
              _renderState$external++
            )
              writeChunk(destination, headChunks[_renderState$external]);
          else
            writeChunk(destination, startChunkForTag("head")),
              writeChunk(destination, ">");
        } else if (headChunks)
          for (
            _renderState$external = 0;
            _renderState$external < headChunks.length;
            _renderState$external++
          )
            writeChunk(destination, headChunks[_renderState$external]);
        var charsetChunks = renderState.charsetChunks;
        for (
          _renderState$external = 0;
          _renderState$external < charsetChunks.length;
          _renderState$external++
        )
          writeChunk(destination, charsetChunks[_renderState$external]);
        charsetChunks.length = 0;
        renderState.preconnects.forEach(flushResource, destination);
        renderState.preconnects.clear();
        var preconnectChunks = renderState.preconnectChunks;
        for (
          _renderState$external = 0;
          _renderState$external < preconnectChunks.length;
          _renderState$external++
        )
          writeChunk(destination, preconnectChunks[_renderState$external]);
        preconnectChunks.length = 0;
        renderState.fontPreloads.forEach(flushResource, destination);
        renderState.fontPreloads.clear();
        renderState.highImagePreloads.forEach(flushResource, destination);
        renderState.highImagePreloads.clear();
        renderState.styles.forEach(flushStylesInPreamble, destination);
        var importMapChunks = renderState.importMapChunks;
        for (
          _renderState$external = 0;
          _renderState$external < importMapChunks.length;
          _renderState$external++
        )
          writeChunk(destination, importMapChunks[_renderState$external]);
        importMapChunks.length = 0;
        renderState.bootstrapScripts.forEach(flushResource, destination);
        renderState.scripts.forEach(flushResource, destination);
        renderState.scripts.clear();
        renderState.bulkPreloads.forEach(flushResource, destination);
        renderState.bulkPreloads.clear();
        var preloadChunks = renderState.preloadChunks;
        for (
          _renderState$external = 0;
          _renderState$external < preloadChunks.length;
          _renderState$external++
        )
          writeChunk(destination, preloadChunks[_renderState$external]);
        preloadChunks.length = 0;
        var hoistableChunks = renderState.hoistableChunks;
        for (
          _renderState$external = 0;
          _renderState$external < hoistableChunks.length;
          _renderState$external++
        )
          writeChunk(destination, hoistableChunks[_renderState$external]);
        hoistableChunks.length = 0;
        htmlChunks &&
          null === headChunks &&
          writeChunk(destination, endChunkForTag("head"));
        flushSegment(request, destination, completedRootSegment);
        request.completedRootSegment = null;
        writeBootstrap(destination, request.renderState);
      } else return;
    var renderState$jscomp$0 = request.renderState;
    completedRootSegment = 0;
    renderState$jscomp$0.preconnects.forEach(flushResource, destination);
    renderState$jscomp$0.preconnects.clear();
    var preconnectChunks$jscomp$0 = renderState$jscomp$0.preconnectChunks;
    for (
      completedRootSegment = 0;
      completedRootSegment < preconnectChunks$jscomp$0.length;
      completedRootSegment++
    )
      writeChunk(destination, preconnectChunks$jscomp$0[completedRootSegment]);
    preconnectChunks$jscomp$0.length = 0;
    renderState$jscomp$0.fontPreloads.forEach(flushResource, destination);
    renderState$jscomp$0.fontPreloads.clear();
    renderState$jscomp$0.highImagePreloads.forEach(flushResource, destination);
    renderState$jscomp$0.highImagePreloads.clear();
    renderState$jscomp$0.styles.forEach(preloadLateStyles, destination);
    renderState$jscomp$0.scripts.forEach(flushResource, destination);
    renderState$jscomp$0.scripts.clear();
    renderState$jscomp$0.bulkPreloads.forEach(flushResource, destination);
    renderState$jscomp$0.bulkPreloads.clear();
    var preloadChunks$jscomp$0 = renderState$jscomp$0.preloadChunks;
    for (
      completedRootSegment = 0;
      completedRootSegment < preloadChunks$jscomp$0.length;
      completedRootSegment++
    )
      writeChunk(destination, preloadChunks$jscomp$0[completedRootSegment]);
    preloadChunks$jscomp$0.length = 0;
    var hoistableChunks$jscomp$0 = renderState$jscomp$0.hoistableChunks;
    for (
      completedRootSegment = 0;
      completedRootSegment < hoistableChunks$jscomp$0.length;
      completedRootSegment++
    )
      writeChunk(destination, hoistableChunks$jscomp$0[completedRootSegment]);
    hoistableChunks$jscomp$0.length = 0;
    var clientRenderedBoundaries = request.clientRenderedBoundaries;
    for (i = 0; i < clientRenderedBoundaries.length; i++) {
      var boundary = clientRenderedBoundaries[i];
      renderState$jscomp$0 = destination;
      var resumableState$jscomp$0 = request.resumableState,
        renderState$jscomp$1 = request.renderState,
        id = boundary.rootSegmentID,
        errorDigest = boundary.errorDigest,
        errorMessage = boundary.errorMessage,
        errorComponentStack = boundary.errorComponentStack,
        scriptFormat = 0 === resumableState$jscomp$0.streamingFormat;
      scriptFormat
        ? ((renderState$jscomp$0.buffer +=
            renderState$jscomp$1.startInlineScript),
          0 === (resumableState$jscomp$0.instructions & 4)
            ? ((resumableState$jscomp$0.instructions |= 4),
              (renderState$jscomp$0.buffer +=
                '$RX=function(b,c,d,e){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data="$!",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),b._reactRetry&&b._reactRetry())};;$RX("'))
            : (renderState$jscomp$0.buffer += '$RX("'))
        : (renderState$jscomp$0.buffer += '<template data-rxi="" data-bid="');
      renderState$jscomp$0.buffer += renderState$jscomp$1.boundaryPrefix;
      var chunk = id.toString(16);
      renderState$jscomp$0.buffer += chunk;
      scriptFormat && (renderState$jscomp$0.buffer += '"');
      if (errorDigest || errorMessage || errorComponentStack)
        if (scriptFormat) {
          renderState$jscomp$0.buffer += ",";
          var chunk$jscomp$0 = escapeJSStringsForInstructionScripts(
            errorDigest || ""
          );
          renderState$jscomp$0.buffer += chunk$jscomp$0;
        } else {
          renderState$jscomp$0.buffer += '" data-dgst="';
          var chunk$jscomp$1 = escapeTextForBrowser(errorDigest || "");
          renderState$jscomp$0.buffer += chunk$jscomp$1;
        }
      if (errorMessage || errorComponentStack)
        if (scriptFormat) {
          renderState$jscomp$0.buffer += ",";
          var chunk$jscomp$2 = escapeJSStringsForInstructionScripts(
            errorMessage || ""
          );
          renderState$jscomp$0.buffer += chunk$jscomp$2;
        } else {
          renderState$jscomp$0.buffer += '" data-msg="';
          var chunk$jscomp$3 = escapeTextForBrowser(errorMessage || "");
          renderState$jscomp$0.buffer += chunk$jscomp$3;
        }
      if (errorComponentStack)
        if (scriptFormat) {
          renderState$jscomp$0.buffer += ",";
          var chunk$jscomp$4 =
            escapeJSStringsForInstructionScripts(errorComponentStack);
          renderState$jscomp$0.buffer += chunk$jscomp$4;
        } else {
          renderState$jscomp$0.buffer += '" data-stck="';
          var chunk$jscomp$5 = escapeTextForBrowser(errorComponentStack);
          renderState$jscomp$0.buffer += chunk$jscomp$5;
        }
      if (
        scriptFormat
          ? !writeChunkAndReturn(renderState$jscomp$0, ")\x3c/script>")
          : !writeChunkAndReturn(renderState$jscomp$0, '"></template>')
      ) {
        request.destination = null;
        i++;
        clientRenderedBoundaries.splice(0, i);
        return;
      }
    }
    clientRenderedBoundaries.splice(0, i);
    var completedBoundaries = request.completedBoundaries;
    for (i = 0; i < completedBoundaries.length; i++)
      if (
        !flushCompletedBoundary(request, destination, completedBoundaries[i])
      ) {
        request.destination = null;
        i++;
        completedBoundaries.splice(0, i);
        return;
      }
    completedBoundaries.splice(0, i);
    var partialBoundaries = request.partialBoundaries;
    for (i = 0; i < partialBoundaries.length; i++) {
      var boundary$42 = partialBoundaries[i];
      a: {
        clientRenderedBoundaries = request;
        boundary = destination;
        clientRenderedBoundaries.renderState.boundaryResources =
          boundary$42.resources;
        var completedSegments = boundary$42.completedSegments;
        for (
          resumableState$jscomp$0 = 0;
          resumableState$jscomp$0 < completedSegments.length;
          resumableState$jscomp$0++
        )
          if (
            !flushPartiallyCompletedSegment(
              clientRenderedBoundaries,
              boundary,
              boundary$42,
              completedSegments[resumableState$jscomp$0]
            )
          ) {
            resumableState$jscomp$0++;
            completedSegments.splice(0, resumableState$jscomp$0);
            var JSCompiler_inline_result = !1;
            break a;
          }
        completedSegments.splice(0, resumableState$jscomp$0);
        JSCompiler_inline_result = writeResourcesForBoundary(
          boundary,
          boundary$42.resources,
          clientRenderedBoundaries.renderState
        );
      }
      if (!JSCompiler_inline_result) {
        request.destination = null;
        i++;
        partialBoundaries.splice(0, i);
        return;
      }
    }
    partialBoundaries.splice(0, i);
    var largeBoundaries = request.completedBoundaries;
    for (i = 0; i < largeBoundaries.length; i++)
      if (!flushCompletedBoundary(request, destination, largeBoundaries[i])) {
        request.destination = null;
        i++;
        largeBoundaries.splice(0, i);
        return;
      }
    largeBoundaries.splice(0, i);
  } finally {
    0 === request.allPendingTasks &&
      0 === request.pingedTasks.length &&
      0 === request.clientRenderedBoundaries.length &&
      0 === request.completedBoundaries.length &&
      ((request.flushScheduled = !1),
      (i = request.resumableState),
      i.hasBody && writeChunk(destination, endChunkForTag("body")),
      i.hasHtml && writeChunk(destination, endChunkForTag("html")),
      (destination.done = !0),
      (request.destination = null));
  }
}
function enqueueFlush(request) {
  !1 === request.flushScheduled &&
    0 === request.pingedTasks.length &&
    null !== request.destination &&
    (request.flushScheduled = !0);
}
function abort(request, reason) {
  try {
    var abortableTasks = request.abortableTasks;
    if (0 < abortableTasks.size) {
      var error =
        void 0 === reason
          ? Error("The render was aborted by the server without a reason.")
          : reason;
      abortableTasks.forEach(function (task) {
        return abortTask(task, request, error);
      });
      abortableTasks.clear();
    }
    null !== request.destination &&
      flushCompletedQueues(request, request.destination);
  } catch (error$44) {
    logRecoverableError(request, error$44, {}), fatalError(request, error$44);
  }
}
exports.abortStream = function (stream, reason) {
  abort(stream.request, reason);
};
exports.debug = function (stream) {
  stream = stream.request;
  return {
    pendingRootTasks: stream.pendingRootTasks,
    clientRenderedBoundaries: stream.clientRenderedBoundaries.length,
    completedBoundaries: stream.completedBoundaries.length,
    partialBoundaries: stream.partialBoundaries.length,
    allPendingTasks: stream.allPendingTasks,
    pingedTasks: stream.pingedTasks.length
  };
};
exports.hasFinished = function (stream) {
  return stream.destination.done;
};
exports.renderNextChunk = function (stream) {
  var request = stream.request;
  stream = stream.destination;
  if (2 !== request.status) {
    var prevContext = currentActiveSnapshot,
      prevDispatcher = ReactCurrentDispatcher.current;
    ReactCurrentDispatcher.current = HooksDispatcher;
    var prevCacheDispatcher = ReactCurrentCache.current;
    ReactCurrentCache.current = DefaultCacheDispatcher;
    var prevRequest = currentRequest;
    currentRequest = request;
    var prevResumableState = currentResumableState;
    currentResumableState = request.resumableState;
    try {
      var pingedTasks = request.pingedTasks,
        i;
      for (i = 0; i < pingedTasks.length; i++) {
        var task = pingedTasks[i],
          blockedBoundary = task.blockedBoundary;
        request.renderState.boundaryResources = blockedBoundary
          ? blockedBoundary.resources
          : null;
        var segment = task.blockedSegment;
        if (null === segment) {
          var errorDigest = void 0,
            task$jscomp$0 = task;
          if (0 !== task$jscomp$0.replay.pendingTasks) {
            switchContext(task$jscomp$0.context);
            try {
              var prevThenableState = task$jscomp$0.thenableState;
              task$jscomp$0.thenableState = null;
              renderNodeDestructive(
                request,
                task$jscomp$0,
                prevThenableState,
                task$jscomp$0.node,
                task$jscomp$0.childIndex
              );
              if (
                1 === task$jscomp$0.replay.pendingTasks &&
                0 < task$jscomp$0.replay.nodes.length
              )
                throw Error(
                  "Couldn't find all resumable slots by key/index during replaying. The tree doesn't match so React will fallback to client rendering."
                );
              task$jscomp$0.replay.pendingTasks--;
              task$jscomp$0.abortSet.delete(task$jscomp$0);
              finishedTask(request, task$jscomp$0.blockedBoundary, null);
            } catch (thrownValue) {
              resetHooksState();
              var x =
                thrownValue === SuspenseException
                  ? getSuspendedThenable()
                  : thrownValue;
              if (
                "object" === typeof x &&
                null !== x &&
                "function" === typeof x.then
              ) {
                var ping = task$jscomp$0.ping;
                x.then(ping, ping);
                task$jscomp$0.thenableState = getThenableStateAfterSuspending();
              } else {
                task$jscomp$0.replay.pendingTasks--;
                task$jscomp$0.abortSet.delete(task$jscomp$0);
                var errorInfo = getThrownInfo(
                    request,
                    task$jscomp$0.componentStack
                  ),
                  boundary = task$jscomp$0.blockedBoundary,
                  replayNodes = task$jscomp$0.replay.nodes,
                  resumeSlots = task$jscomp$0.replay.slots;
                errorDigest = logRecoverableError(request, x, errorInfo);
                abortRemainingReplayNodes(
                  request,
                  boundary,
                  replayNodes,
                  resumeSlots,
                  x,
                  errorDigest
                );
                request.pendingRootTasks--;
                0 === request.pendingRootTasks && completeShell(request);
                request.allPendingTasks--;
                0 === request.allPendingTasks && completeAll(request);
              }
            } finally {
              request.renderState.boundaryResources = null;
            }
          }
        } else {
          errorDigest = void 0;
          task$jscomp$0 = task;
          var segment$jscomp$0 = segment;
          if (0 === segment$jscomp$0.status) {
            switchContext(task$jscomp$0.context);
            var childrenLength = segment$jscomp$0.children.length,
              chunkLength = segment$jscomp$0.chunks.length;
            try {
              var prevThenableState$jscomp$0 = task$jscomp$0.thenableState;
              task$jscomp$0.thenableState = null;
              renderNodeDestructive(
                request,
                task$jscomp$0,
                prevThenableState$jscomp$0,
                task$jscomp$0.node,
                task$jscomp$0.childIndex
              );
              segment$jscomp$0.lastPushedText &&
                segment$jscomp$0.textEmbedded &&
                segment$jscomp$0.chunks.push("\x3c!-- --\x3e");
              task$jscomp$0.abortSet.delete(task$jscomp$0);
              segment$jscomp$0.status = 1;
              finishedTask(
                request,
                task$jscomp$0.blockedBoundary,
                segment$jscomp$0
              );
            } catch (thrownValue) {
              resetHooksState();
              segment$jscomp$0.children.length = childrenLength;
              segment$jscomp$0.chunks.length = chunkLength;
              var x$jscomp$0 =
                thrownValue === SuspenseException
                  ? getSuspendedThenable()
                  : thrownValue;
              if (
                "object" === typeof x$jscomp$0 &&
                null !== x$jscomp$0 &&
                "function" === typeof x$jscomp$0.then
              ) {
                var ping$jscomp$0 = task$jscomp$0.ping;
                x$jscomp$0.then(ping$jscomp$0, ping$jscomp$0);
                task$jscomp$0.thenableState = getThenableStateAfterSuspending();
              } else {
                var errorInfo$jscomp$0 = getThrownInfo(
                  request,
                  task$jscomp$0.componentStack
                );
                task$jscomp$0.abortSet.delete(task$jscomp$0);
                segment$jscomp$0.status = 4;
                var boundary$jscomp$0 = task$jscomp$0.blockedBoundary;
                errorDigest = logRecoverableError(
                  request,
                  x$jscomp$0,
                  errorInfo$jscomp$0
                );
                null === boundary$jscomp$0
                  ? fatalError(request, x$jscomp$0)
                  : (boundary$jscomp$0.pendingTasks--,
                    4 !== boundary$jscomp$0.status &&
                      ((boundary$jscomp$0.status = 4),
                      (boundary$jscomp$0.errorDigest = errorDigest),
                      untrackBoundary(request, boundary$jscomp$0),
                      boundary$jscomp$0.parentFlushed &&
                        request.clientRenderedBoundaries.push(
                          boundary$jscomp$0
                        )));
                request.allPendingTasks--;
                0 === request.allPendingTasks && completeAll(request);
              }
            } finally {
              request.renderState.boundaryResources = null;
            }
          }
        }
      }
      pingedTasks.splice(0, i);
      null !== request.destination &&
        flushCompletedQueues(request, request.destination);
    } catch (error) {
      logRecoverableError(request, error, {}), fatalError(request, error);
    } finally {
      (currentResumableState = prevResumableState),
        (ReactCurrentDispatcher.current = prevDispatcher),
        (ReactCurrentCache.current = prevCacheDispatcher),
        prevDispatcher === HooksDispatcher && switchContext(prevContext),
        (currentRequest = prevRequest);
    }
  }
  if (1 === request.status)
    (request.status = 2),
      (request = request.fatalError),
      (stream.done = !0),
      (stream.fatal = !0),
      (stream.error = request);
  else if (2 !== request.status && null === request.destination) {
    request.destination = stream;
    try {
      flushCompletedQueues(request, stream);
    } catch (error) {
      logRecoverableError(request, error, {}), fatalError(request, error);
    }
  }
  if (stream.fatal) throw stream.error;
  request = stream.buffer;
  stream.buffer = "";
  return request;
};
exports.renderToStream = function (children, options) {
  var destination = { buffer: "", done: !1, fatal: !1, error: null };
  var JSCompiler_inline_result = options ? options.identifierPrefix : void 0;
  var streamingFormat = 0;
  void 0 !== (options ? options.unstable_externalRuntimeSrc : void 0) &&
    (streamingFormat = 1);
  JSCompiler_inline_result = {
    idPrefix:
      void 0 === JSCompiler_inline_result ? "" : JSCompiler_inline_result,
    nextFormID: 0,
    streamingFormat: streamingFormat,
    bootstrapScriptContent: options ? options.bootstrapScriptContent : void 0,
    bootstrapScripts: options ? options.bootstrapScripts : void 0,
    bootstrapModules: options ? options.bootstrapModules : void 0,
    instructions: 0,
    hasBody: !1,
    hasHtml: !1,
    unknownResources: {},
    dnsResources: {},
    connectResources: { default: {}, anonymous: {}, credentials: {} },
    imageResources: {},
    styleResources: {},
    scriptResources: {},
    moduleUnknownResources: {},
    moduleScriptResources: {}
  };
  streamingFormat = options ? options.unstable_externalRuntimeSrc : void 0;
  var idPrefix = JSCompiler_inline_result.idPrefix,
    bootstrapChunks = [],
    externalRuntimeScript = null,
    bootstrapScriptContent = JSCompiler_inline_result.bootstrapScriptContent,
    bootstrapScripts = JSCompiler_inline_result.bootstrapScripts,
    bootstrapModules = JSCompiler_inline_result.bootstrapModules;
  void 0 !== bootstrapScriptContent &&
    bootstrapChunks.push(
      "<script>",
      ("" + bootstrapScriptContent).replace(scriptRegex, scriptReplacer),
      "\x3c/script>"
    );
  void 0 !== streamingFormat &&
    ("string" === typeof streamingFormat
      ? ((externalRuntimeScript = { src: streamingFormat, chunks: [] }),
        pushScriptImpl(externalRuntimeScript.chunks, {
          src: streamingFormat,
          async: !0,
          integrity: void 0,
          nonce: void 0
        }))
      : ((externalRuntimeScript = { src: streamingFormat.src, chunks: [] }),
        pushScriptImpl(externalRuntimeScript.chunks, {
          src: streamingFormat.src,
          async: !0,
          integrity: streamingFormat.integrity,
          nonce: void 0
        })));
  streamingFormat = {
    placeholderPrefix: idPrefix + "P:",
    segmentPrefix: idPrefix + "S:",
    boundaryPrefix: idPrefix + "B:",
    startInlineScript: "<script>",
    htmlChunks: null,
    headChunks: null,
    externalRuntimeScript: externalRuntimeScript,
    bootstrapChunks: bootstrapChunks,
    onHeaders: void 0,
    headers: null,
    resets: {
      font: {},
      dns: {},
      connect: { default: {}, anonymous: {}, credentials: {} },
      image: {},
      style: {}
    },
    charsetChunks: [],
    preconnectChunks: [],
    importMapChunks: [],
    preloadChunks: [],
    hoistableChunks: [],
    preconnects: new Set(),
    fontPreloads: new Set(),
    highImagePreloads: new Set(),
    styles: new Map(),
    bootstrapScripts: new Set(),
    scripts: new Set(),
    bulkPreloads: new Set(),
    preloads: {
      images: new Map(),
      stylesheets: new Map(),
      scripts: new Map(),
      moduleScripts: new Map()
    },
    nonce: void 0,
    boundaryResources: null,
    stylesToHoist: !1
  };
  if (void 0 !== bootstrapScripts)
    for (idPrefix = 0; idPrefix < bootstrapScripts.length; idPrefix++) {
      var scriptConfig = bootstrapScripts[idPrefix],
        integrity = (bootstrapScriptContent = void 0),
        props = {
          rel: "preload",
          as: "script",
          fetchPriority: "low",
          nonce: void 0
        };
      "string" === typeof scriptConfig
        ? (props.href = externalRuntimeScript = scriptConfig)
        : ((props.href = externalRuntimeScript = scriptConfig.src),
          (props.integrity = integrity =
            "string" === typeof scriptConfig.integrity
              ? scriptConfig.integrity
              : void 0),
          (props.crossOrigin = bootstrapScriptContent =
            "string" === typeof scriptConfig || null == scriptConfig.crossOrigin
              ? void 0
              : "use-credentials" === scriptConfig.crossOrigin
              ? "use-credentials"
              : ""));
      scriptConfig = JSCompiler_inline_result;
      var href = externalRuntimeScript;
      scriptConfig.scriptResources[href] = null;
      scriptConfig.moduleScriptResources[href] = null;
      scriptConfig = [];
      pushLinkImpl(scriptConfig, props);
      streamingFormat.bootstrapScripts.add(scriptConfig);
      bootstrapChunks.push(
        '<script src="',
        escapeTextForBrowser(externalRuntimeScript)
      );
      "string" === typeof integrity &&
        bootstrapChunks.push('" integrity="', escapeTextForBrowser(integrity));
      "string" === typeof bootstrapScriptContent &&
        bootstrapChunks.push(
          '" crossorigin="',
          escapeTextForBrowser(bootstrapScriptContent)
        );
      bootstrapChunks.push('" async="">\x3c/script>');
    }
  if (void 0 !== bootstrapModules)
    for (
      bootstrapScripts = 0;
      bootstrapScripts < bootstrapModules.length;
      bootstrapScripts++
    )
      (props = bootstrapModules[bootstrapScripts]),
        (bootstrapScriptContent = externalRuntimeScript = void 0),
        (integrity = {
          rel: "modulepreload",
          fetchPriority: "low",
          nonce: void 0
        }),
        "string" === typeof props
          ? (integrity.href = idPrefix = props)
          : ((integrity.href = idPrefix = props.src),
            (integrity.integrity = bootstrapScriptContent =
              "string" === typeof props.integrity ? props.integrity : void 0),
            (integrity.crossOrigin = externalRuntimeScript =
              "string" === typeof props || null == props.crossOrigin
                ? void 0
                : "use-credentials" === props.crossOrigin
                ? "use-credentials"
                : "")),
        (props = JSCompiler_inline_result),
        (scriptConfig = idPrefix),
        (props.scriptResources[scriptConfig] = null),
        (props.moduleScriptResources[scriptConfig] = null),
        (props = []),
        pushLinkImpl(props, integrity),
        streamingFormat.bootstrapScripts.add(props),
        bootstrapChunks.push(
          '<script type="module" src="',
          escapeTextForBrowser(idPrefix)
        ),
        "string" === typeof bootstrapScriptContent &&
          bootstrapChunks.push(
            '" integrity="',
            escapeTextForBrowser(bootstrapScriptContent)
          ),
        "string" === typeof externalRuntimeScript &&
          bootstrapChunks.push(
            '" crossorigin="',
            escapeTextForBrowser(externalRuntimeScript)
          ),
        bootstrapChunks.push('" async="">\x3c/script>');
  bootstrapChunks = createFormatContext(0, null, 0);
  bootstrapScripts = options ? options.progressiveChunkSize : void 0;
  idPrefix = options.onError;
  ReactDOMCurrentDispatcher.current = ReactDOMServerDispatcher;
  options = [];
  bootstrapModules = new Set();
  JSCompiler_inline_result = {
    destination: null,
    flushScheduled: !1,
    resumableState: JSCompiler_inline_result,
    renderState: streamingFormat,
    rootFormatContext: bootstrapChunks,
    progressiveChunkSize:
      void 0 === bootstrapScripts ? 12800 : bootstrapScripts,
    status: 0,
    fatalError: null,
    nextSegmentId: 0,
    allPendingTasks: 0,
    pendingRootTasks: 0,
    completedRootSegment: null,
    abortableTasks: bootstrapModules,
    pingedTasks: options,
    clientRenderedBoundaries: [],
    completedBoundaries: [],
    partialBoundaries: [],
    trackedPostpones: null,
    onError: void 0 === idPrefix ? defaultErrorHandler : idPrefix,
    onPostpone: noop,
    onAllReady: noop,
    onShellReady: noop,
    onShellError: noop,
    onFatalError: noop,
    formState: null
  };
  streamingFormat = createPendingSegment(
    JSCompiler_inline_result,
    0,
    null,
    bootstrapChunks,
    !1,
    !1
  );
  streamingFormat.parentFlushed = !0;
  children = createRenderTask(
    JSCompiler_inline_result,
    null,
    children,
    -1,
    null,
    streamingFormat,
    bootstrapModules,
    null,
    bootstrapChunks,
    emptyContextObject,
    null,
    emptyTreeContext,
    null
  );
  options.push(children);
  JSCompiler_inline_result.flushScheduled =
    null !== JSCompiler_inline_result.destination;
  if (destination.fatal) throw destination.error;
  return { destination: destination, request: JSCompiler_inline_result };
};
