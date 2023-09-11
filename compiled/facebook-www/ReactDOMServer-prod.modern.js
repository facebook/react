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

"use strict";
var React = require("react"),
  ReactDOM = require("react-dom");
function formatProdErrorMessage(code) {
  for (
    var url = "https://reactjs.org/docs/error-decoder.html?invariant=" + code,
      i = 1;
    i < arguments.length;
    i++
  )
    url += "&args[]=" + encodeURIComponent(arguments[i]);
  return (
    "Minified React error #" +
    code +
    "; visit " +
    url +
    " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
  );
}
var assign = Object.assign,
  dynamicFeatureFlags = require("ReactFeatureFlags"),
  enableTransitionTracing = dynamicFeatureFlags.enableTransitionTracing,
  enableCustomElementPropertySupport =
    dynamicFeatureFlags.enableCustomElementPropertySupport,
  enableAsyncActions = dynamicFeatureFlags.enableAsyncActions,
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
    preinit: preinit,
    preinitModule: preinitModule
  },
  scriptRegex = /(<\/|<)(s)(cript)/gi;
function scriptReplacer(match, prefix, s, suffix) {
  return "" + prefix + ("s" === s ? "\\u0073" : "\\u0053") + suffix;
}
function createResumableState(
  identifierPrefix,
  nonce,
  bootstrapScriptContent,
  bootstrapScripts,
  bootstrapModules,
  externalRuntimeConfig
) {
  var idPrefix = void 0 === identifierPrefix ? "" : identifierPrefix;
  identifierPrefix = [];
  var streamingFormat = 0,
    externalRuntimeScript = null;
  if (void 0 !== bootstrapScriptContent) {
    var inlineScriptWithNonce =
      void 0 === nonce
        ? "<script>"
        : '<script nonce="' + escapeTextForBrowser(nonce) + '">';
    identifierPrefix.push(
      inlineScriptWithNonce,
      ("" + bootstrapScriptContent).replace(scriptRegex, scriptReplacer),
      "\x3c/script>"
    );
  }
  void 0 !== externalRuntimeConfig &&
    ((streamingFormat = 1),
    "string" === typeof externalRuntimeConfig
      ? ((externalRuntimeScript = { src: externalRuntimeConfig, chunks: [] }),
        pushScriptImpl(externalRuntimeScript.chunks, {
          src: externalRuntimeConfig,
          async: !0,
          integrity: void 0,
          nonce: nonce
        }))
      : ((externalRuntimeScript = {
          src: externalRuntimeConfig.src,
          chunks: []
        }),
        pushScriptImpl(externalRuntimeScript.chunks, {
          src: externalRuntimeConfig.src,
          async: !0,
          integrity: externalRuntimeConfig.integrity,
          nonce: nonce
        })));
  bootstrapScriptContent = {
    externalRuntimeScript: externalRuntimeScript,
    bootstrapChunks: identifierPrefix,
    idPrefix: idPrefix,
    nextSuspenseID: 0,
    streamingFormat: streamingFormat,
    instructions: 0,
    hasBody: !1,
    hasHtml: !1,
    preloadsMap: new Map(),
    preconnectsMap: new Map(),
    stylesMap: new Map(),
    scriptsMap: new Map(),
    preconnects: new Set(),
    fontPreloads: new Set(),
    highImagePreloads: new Set(),
    precedences: new Map(),
    stylePrecedences: new Map(),
    bootstrapScripts: new Set(),
    scripts: new Set(),
    bulkPreloads: new Set()
  };
  if (void 0 !== bootstrapScripts)
    for (
      externalRuntimeConfig = 0;
      externalRuntimeConfig < bootstrapScripts.length;
      externalRuntimeConfig++
    ) {
      externalRuntimeScript = bootstrapScripts[externalRuntimeConfig];
      idPrefix =
        "string" === typeof externalRuntimeScript
          ? externalRuntimeScript
          : externalRuntimeScript.src;
      streamingFormat =
        "string" === typeof externalRuntimeScript
          ? void 0
          : externalRuntimeScript.integrity;
      externalRuntimeScript =
        "string" === typeof externalRuntimeScript ||
        null == externalRuntimeScript.crossOrigin
          ? void 0
          : "use-credentials" === externalRuntimeScript.crossOrigin
          ? "use-credentials"
          : "";
      inlineScriptWithNonce = {
        rel: "preload",
        href: idPrefix,
        as: "script",
        fetchPriority: "low",
        nonce: nonce,
        integrity: streamingFormat,
        crossOrigin: externalRuntimeScript
      };
      var resource = {
        type: "preload",
        chunks: [],
        state: 0,
        props: inlineScriptWithNonce
      };
      bootstrapScriptContent.preloadsMap.set("[script]" + idPrefix, resource);
      bootstrapScriptContent.bootstrapScripts.add(resource);
      pushLinkImpl(resource.chunks, inlineScriptWithNonce);
      identifierPrefix.push('<script src="', escapeTextForBrowser(idPrefix));
      nonce && identifierPrefix.push('" nonce="', escapeTextForBrowser(nonce));
      streamingFormat &&
        identifierPrefix.push(
          '" integrity="',
          escapeTextForBrowser(streamingFormat)
        );
      "string" === typeof externalRuntimeScript &&
        identifierPrefix.push(
          '" crossorigin="',
          escapeTextForBrowser(externalRuntimeScript)
        );
      identifierPrefix.push('" async="">\x3c/script>');
    }
  if (void 0 !== bootstrapModules)
    for (
      bootstrapScripts = 0;
      bootstrapScripts < bootstrapModules.length;
      bootstrapScripts++
    )
      (streamingFormat = bootstrapModules[bootstrapScripts]),
        (externalRuntimeConfig =
          "string" === typeof streamingFormat
            ? streamingFormat
            : streamingFormat.src),
        (idPrefix =
          "string" === typeof streamingFormat
            ? void 0
            : streamingFormat.integrity),
        (streamingFormat =
          "string" === typeof streamingFormat ||
          null == streamingFormat.crossOrigin
            ? void 0
            : "use-credentials" === streamingFormat.crossOrigin
            ? "use-credentials"
            : ""),
        (externalRuntimeScript = {
          rel: "modulepreload",
          href: externalRuntimeConfig,
          fetchPriority: "low",
          nonce: nonce,
          integrity: idPrefix,
          crossOrigin: streamingFormat
        }),
        (inlineScriptWithNonce = {
          type: "preload",
          chunks: [],
          state: 0,
          props: externalRuntimeScript
        }),
        bootstrapScriptContent.preloadsMap.set(
          "[script]" + externalRuntimeConfig,
          inlineScriptWithNonce
        ),
        bootstrapScriptContent.bootstrapScripts.add(inlineScriptWithNonce),
        pushLinkImpl(inlineScriptWithNonce.chunks, externalRuntimeScript),
        identifierPrefix.push(
          '<script type="module" src="',
          escapeTextForBrowser(externalRuntimeConfig)
        ),
        nonce &&
          identifierPrefix.push('" nonce="', escapeTextForBrowser(nonce)),
        idPrefix &&
          identifierPrefix.push(
            '" integrity="',
            escapeTextForBrowser(idPrefix)
          ),
        "string" === typeof streamingFormat &&
          identifierPrefix.push(
            '" crossorigin="',
            escapeTextForBrowser(streamingFormat)
          ),
        identifierPrefix.push('" async="">\x3c/script>');
  return bootstrapScriptContent;
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
var styleNameCache = new Map();
function pushStyleAttribute(target, style) {
  if ("object" !== typeof style) throw Error(formatProdErrorMessage(62));
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
  if ("string" !== typeof value) throw Error(formatProdErrorMessage(480));
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
              var prefix = name.toLowerCase().slice(0, 5);
              if ("data-" !== prefix && "aria-" !== prefix) return;
          }
          target.push(" ", name, '="', escapeTextForBrowser(value), '"');
        }
  }
}
function pushInnerHTML(target, innerHTML, children) {
  if (null != innerHTML) {
    if (null != children) throw Error(formatProdErrorMessage(60));
    if ("object" !== typeof innerHTML || !("__html" in innerHTML))
      throw Error(formatProdErrorMessage(61));
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
    insertionMode = "[style]" + href;
    if (
      "string" !== typeof precedence ||
      null != props.disabled ||
      props.onLoad ||
      props.onError
    )
      return pushLinkImpl(target, props);
    noscriptTagInScope = resumableState.stylesMap.get(insertionMode);
    noscriptTagInScope ||
      ((props = assign({}, props, {
        "data-precedence": props.precedence,
        precedence: null
      })),
      (noscriptTagInScope = resumableState.preloadsMap.get(insertionMode)),
      (rel = 0),
      noscriptTagInScope &&
        ((noscriptTagInScope.state |= 4),
        (href = noscriptTagInScope.props),
        null == props.crossOrigin && (props.crossOrigin = href.crossOrigin),
        null == props.integrity && (props.integrity = href.integrity),
        noscriptTagInScope.state & 3 && (rel = 8)),
      (noscriptTagInScope = {
        type: "stylesheet",
        chunks: [],
        state: rel,
        props: props
      }),
      resumableState.stylesMap.set(insertionMode, noscriptTagInScope),
      (props = resumableState.precedences.get(precedence)),
      props ||
        ((props = new Set()),
        resumableState.precedences.set(precedence, props),
        (insertionMode = {
          type: "style",
          chunks: [],
          state: 0,
          props: { precedence: precedence, hrefs: [] }
        }),
        props.add(insertionMode),
        resumableState.stylePrecedences.set(precedence, insertionMode)),
      props.add(noscriptTagInScope));
    renderState.boundaryResources &&
      renderState.boundaryResources.add(noscriptTagInScope);
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
            throw Error(formatProdErrorMessage(399, "link"));
          default:
            pushAttribute(target, propKey, propValue);
        }
    }
  target.push("/>");
  return null;
}
function getImagePreloadKey(href, imageSrcSet, imageSizes) {
  var uniquePart = "";
  "string" === typeof imageSrcSet && "" !== imageSrcSet
    ? ((uniquePart += "[" + imageSrcSet + "]"),
      "string" === typeof imageSizes && (uniquePart += "[" + imageSizes + "]"))
    : (uniquePart += "[][]" + href);
  return "[image]" + uniquePart;
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
            throw Error(formatProdErrorMessage(399, tag));
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
  target.push("</", "title", ">");
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
  target.push("</", "script", ">");
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
    if (!VALID_TAG_REGEX.test(tag))
      throw Error(formatProdErrorMessage(65, tag));
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
                throw Error(formatProdErrorMessage(91));
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
        if (null != value$jscomp$0) throw Error(formatProdErrorMessage(92));
        if (isArrayImpl(children$jscomp$1) && 1 < children$jscomp$1.length)
          throw Error(formatProdErrorMessage(93));
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
                throw Error(formatProdErrorMessage(399, "input"));
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
                throw Error(formatProdErrorMessage(400));
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
        var key = "[script]" + props.src,
          resource = resumableState.scriptsMap.get(key);
        if (!resource) {
          resource = { type: "script", chunks: [], state: 0, props: null };
          resumableState.scriptsMap.set(key, resource);
          resumableState.scripts.add(resource);
          var scriptProps = props,
            preloadResource = resumableState.preloadsMap.get(key);
          if (preloadResource) {
            preloadResource.state |= 4;
            var resourceProps = (scriptProps = assign({}, props)),
              preloadProps = preloadResource.props;
            null == resourceProps.crossOrigin &&
              (resourceProps.crossOrigin = preloadProps.crossOrigin);
            null == resourceProps.integrity &&
              (resourceProps.integrity = preloadProps.integrity);
          }
          pushScriptImpl(resource.chunks, scriptProps);
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
        target$jscomp$0.push("</", "style", ">");
        var JSCompiler_inline_result$jscomp$3 = null;
      } else {
        var key$jscomp$0 = "[style]" + href,
          resource$jscomp$0 = resumableState.stylesMap.get(key$jscomp$0);
        if (!resource$jscomp$0) {
          if (
            (resource$jscomp$0 =
              resumableState.stylePrecedences.get(precedence))
          )
            resource$jscomp$0.props.hrefs.push(href);
          else {
            resource$jscomp$0 = {
              type: "style",
              chunks: [],
              state: 0,
              props: { precedence: precedence, hrefs: [href] }
            };
            resumableState.stylePrecedences.set(precedence, resource$jscomp$0);
            var precedenceSet = new Set();
            precedenceSet.add(resource$jscomp$0);
            resumableState.precedences.set(precedence, precedenceSet);
          }
          resumableState.stylesMap.set(key$jscomp$0, resource$jscomp$0);
          renderState.boundaryResources &&
            renderState.boundaryResources.add(resource$jscomp$0);
          var target = resource$jscomp$0.chunks,
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
        if (null != children$jscomp$6) throw Error(formatProdErrorMessage(60));
        if (
          "object" !== typeof innerHTML$jscomp$5 ||
          !("__html" in innerHTML$jscomp$5)
        )
          throw Error(formatProdErrorMessage(61));
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
        "lazy" !== props.loading &&
        ("string" === typeof src || "string" === typeof srcSet) &&
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
        var sizes = props.sizes,
          key$jscomp$1 = getImagePreloadKey(src, srcSet, sizes),
          resource$jscomp$1 = resumableState.preloadsMap.get(key$jscomp$1);
        resource$jscomp$1 ||
          ((resource$jscomp$1 = {
            type: "preload",
            chunks: [],
            state: 0,
            props: {
              rel: "preload",
              as: "image",
              href: srcSet ? void 0 : src,
              imageSrcSet: srcSet,
              imageSizes: sizes,
              crossOrigin: props.crossOrigin,
              integrity: props.integrity,
              type: props.type,
              fetchPriority: props.fetchPriority,
              referrerPolicy: props.referrerPolicy
            }
          }),
          resumableState.preloadsMap.set(key$jscomp$1, resource$jscomp$1),
          pushLinkImpl(resource$jscomp$1.chunks, resource$jscomp$1.props));
        "high" === props.fetchPriority ||
        10 > resumableState.highImagePreloads.size
          ? resumableState.highImagePreloads.add(resource$jscomp$1)
          : resumableState.bulkPreloads.add(resource$jscomp$1);
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
        var JSCompiler_inline_result$jscomp$5 = pushStartGenericElement(
          renderState.headChunks,
          props,
          "head"
        );
      } else
        JSCompiler_inline_result$jscomp$5 = pushStartGenericElement(
          target$jscomp$0,
          props,
          "head"
        );
      return JSCompiler_inline_result$jscomp$5;
    case "html":
      if (
        0 === formatContext.insertionMode &&
        null === renderState.htmlChunks
      ) {
        renderState.htmlChunks = [""];
        var JSCompiler_inline_result$jscomp$6 = pushStartGenericElement(
          renderState.htmlChunks,
          props,
          "html"
        );
      } else
        JSCompiler_inline_result$jscomp$6 = pushStartGenericElement(
          target$jscomp$0,
          props,
          "html"
        );
      return JSCompiler_inline_result$jscomp$6;
    default:
      if (-1 !== type.indexOf("-")) {
        target$jscomp$0.push(startChunkForTag(type));
        var children$jscomp$7 = null,
          innerHTML$jscomp$6 = null,
          propKey$jscomp$9;
        for (propKey$jscomp$9 in props)
          if (hasOwnProperty.call(props, propKey$jscomp$9)) {
            var propValue$jscomp$9 = props[propKey$jscomp$9];
            if (
              !(
                null == propValue$jscomp$9 ||
                (enableCustomElementPropertySupport &&
                  ("function" === typeof propValue$jscomp$9 ||
                    "object" === typeof propValue$jscomp$9)) ||
                (enableCustomElementPropertySupport &&
                  !1 === propValue$jscomp$9)
              )
            )
              switch (
                (enableCustomElementPropertySupport &&
                  !0 === propValue$jscomp$9 &&
                  (propValue$jscomp$9 = ""),
                enableCustomElementPropertySupport &&
                  "className" === propKey$jscomp$9 &&
                  (propKey$jscomp$9 = "class"),
                propKey$jscomp$9)
              ) {
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
                default:
                  isAttributeNameSafe(propKey$jscomp$9) &&
                    "function" !== typeof propValue$jscomp$9 &&
                    "symbol" !== typeof propValue$jscomp$9 &&
                    target$jscomp$0.push(
                      " ",
                      propKey$jscomp$9,
                      '="',
                      escapeTextForBrowser(propValue$jscomp$9),
                      '"'
                    );
              }
          }
        target$jscomp$0.push(">");
        pushInnerHTML(target$jscomp$0, innerHTML$jscomp$6, children$jscomp$7);
        return children$jscomp$7;
      }
  }
  return pushStartGenericElement(target$jscomp$0, props, type);
}
function writeBootstrap(destination, resumableState) {
  resumableState = resumableState.bootstrapChunks;
  for (var i = 0; i < resumableState.length - 1; i++)
    destination.push(resumableState[i]);
  return i < resumableState.length
    ? ((i = resumableState[i]),
      (resumableState.length = 0),
      destination.push(i))
    : !0;
}
function writeStartPendingSuspenseBoundary(destination, renderState, id) {
  destination.push('\x3c!--$?--\x3e<template id="');
  if (null === id) throw Error(formatProdErrorMessage(395));
  destination.push(id);
  return destination.push('"></template>');
}
function writeStartSegment(destination, renderState, formatContext, id) {
  switch (formatContext.insertionMode) {
    case 0:
    case 1:
    case 2:
      return (
        destination.push('<div hidden id="'),
        destination.push(renderState.segmentPrefix),
        (renderState = id.toString(16)),
        destination.push(renderState),
        destination.push('">')
      );
    case 3:
      return (
        destination.push('<svg aria-hidden="true" style="display:none" id="'),
        destination.push(renderState.segmentPrefix),
        (renderState = id.toString(16)),
        destination.push(renderState),
        destination.push('">')
      );
    case 4:
      return (
        destination.push('<math aria-hidden="true" style="display:none" id="'),
        destination.push(renderState.segmentPrefix),
        (renderState = id.toString(16)),
        destination.push(renderState),
        destination.push('">')
      );
    case 5:
      return (
        destination.push('<table hidden id="'),
        destination.push(renderState.segmentPrefix),
        (renderState = id.toString(16)),
        destination.push(renderState),
        destination.push('">')
      );
    case 6:
      return (
        destination.push('<table hidden><tbody id="'),
        destination.push(renderState.segmentPrefix),
        (renderState = id.toString(16)),
        destination.push(renderState),
        destination.push('">')
      );
    case 7:
      return (
        destination.push('<table hidden><tr id="'),
        destination.push(renderState.segmentPrefix),
        (renderState = id.toString(16)),
        destination.push(renderState),
        destination.push('">')
      );
    case 8:
      return (
        destination.push('<table hidden><colgroup id="'),
        destination.push(renderState.segmentPrefix),
        (renderState = id.toString(16)),
        destination.push(renderState),
        destination.push('">')
      );
    default:
      throw Error(formatProdErrorMessage(397));
  }
}
function writeEndSegment(destination, formatContext) {
  switch (formatContext.insertionMode) {
    case 0:
    case 1:
    case 2:
      return destination.push("</div>");
    case 3:
      return destination.push("</svg>");
    case 4:
      return destination.push("</math>");
    case 5:
      return destination.push("</table>");
    case 6:
      return destination.push("</tbody></table>");
    case 7:
      return destination.push("</tr></table>");
    case 8:
      return destination.push("</colgroup></table>");
    default:
      throw Error(formatProdErrorMessage(397));
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
function flushStyleTagsLateForBoundary(resource) {
  if ("stylesheet" === resource.type && 0 === (resource.state & 1))
    currentlyRenderingBoundaryHasStylesToHoist = !0;
  else if ("style" === resource.type) {
    var chunks = resource.chunks,
      hrefs = resource.props.hrefs,
      i = 0;
    if (chunks.length) {
      this.push('<style media="not all" data-precedence="');
      resource = escapeTextForBrowser(resource.props.precedence);
      this.push(resource);
      if (hrefs.length) {
        for (this.push('" data-href="'); i < hrefs.length - 1; i++)
          (resource = escapeTextForBrowser(hrefs[i])),
            this.push(resource),
            this.push(" ");
        i = escapeTextForBrowser(hrefs[i]);
        this.push(i);
      }
      this.push('">');
      for (i = 0; i < chunks.length; i++) this.push(chunks[i]);
      destinationHasCapacity = this.push("</style>");
      currentlyRenderingBoundaryHasStylesToHoist = !0;
      chunks.length = 0;
      hrefs.length = 0;
    }
  }
}
function writeResourcesForBoundary(
  destination,
  boundaryResources,
  renderState
) {
  currentlyRenderingBoundaryHasStylesToHoist = !1;
  destinationHasCapacity = !0;
  boundaryResources.forEach(flushStyleTagsLateForBoundary, destination);
  currentlyRenderingBoundaryHasStylesToHoist &&
    (renderState.stylesToHoist = !0);
  return destinationHasCapacity;
}
function flushResourceInPreamble(resource) {
  if (0 === (resource.state & 7)) {
    for (var chunks = resource.chunks, i = 0; i < chunks.length; i++)
      this.push(chunks[i]);
    resource.state |= 1;
  }
}
function flushResourceLate(resource) {
  if (0 === (resource.state & 7)) {
    for (var chunks = resource.chunks, i = 0; i < chunks.length; i++)
      this.push(chunks[i]);
    resource.state |= 2;
  }
}
var precedenceStyleTagResource = null,
  didFlushPrecedence = !1;
function flushStyleInPreamble(resource, key, set) {
  key = resource.chunks;
  if (resource.state & 3) set.delete(resource);
  else if ("style" === resource.type) precedenceStyleTagResource = resource;
  else {
    pushLinkImpl(key, resource.props);
    for (set = 0; set < key.length; set++) this.push(key[set]);
    resource.state |= 1;
    didFlushPrecedence = !0;
  }
}
function flushAllStylesInPreamble(set, precedence) {
  didFlushPrecedence = !1;
  set.forEach(flushStyleInPreamble, this);
  set.clear();
  set = precedenceStyleTagResource.chunks;
  var hrefs = precedenceStyleTagResource.props.hrefs;
  if (!1 === didFlushPrecedence || set.length) {
    this.push('<style data-precedence="');
    precedence = escapeTextForBrowser(precedence);
    this.push(precedence);
    precedence = 0;
    if (hrefs.length) {
      for (
        this.push('" data-href="');
        precedence < hrefs.length - 1;
        precedence++
      ) {
        var chunk = escapeTextForBrowser(hrefs[precedence]);
        this.push(chunk);
        this.push(" ");
      }
      precedence = escapeTextForBrowser(hrefs[precedence]);
      this.push(precedence);
    }
    this.push('">');
    for (precedence = 0; precedence < set.length; precedence++)
      this.push(set[precedence]);
    this.push("</style>");
    set.length = 0;
    hrefs.length = 0;
  }
}
function preloadLateStyle(resource) {
  if (!(resource.state & 8) && "style" !== resource.type) {
    var chunks = resource.chunks,
      props = resource.props;
    pushLinkImpl(chunks, {
      rel: "preload",
      as: "style",
      href: resource.props.href,
      crossOrigin: props.crossOrigin,
      fetchPriority: props.fetchPriority,
      integrity: props.integrity,
      media: props.media,
      hrefLang: props.hrefLang,
      referrerPolicy: props.referrerPolicy
    });
    for (props = 0; props < chunks.length; props++) this.push(chunks[props]);
    resource.state |= 8;
    chunks.length = 0;
  }
}
function preloadLateStyles(set) {
  set.forEach(preloadLateStyle, this);
  set.clear();
}
function writeStyleResourceDependenciesInJS(destination, boundaryResources) {
  destination.push("[");
  var nextArrayOpenBrackChunk = "[";
  boundaryResources.forEach(function (resource) {
    if ("style" !== resource.type && !(resource.state & 1))
      if (resource.state & 3)
        destination.push(nextArrayOpenBrackChunk),
          (resource = escapeJSObjectForInstructionScripts(
            "" + resource.props.href
          )),
          destination.push(resource),
          destination.push("]"),
          (nextArrayOpenBrackChunk = ",[");
      else if ("stylesheet" === resource.type) {
        destination.push(nextArrayOpenBrackChunk);
        var precedence = resource.props["data-precedence"],
          props = resource.props,
          coercedHref = sanitizeURL("" + resource.props.href);
        coercedHref = escapeJSObjectForInstructionScripts(coercedHref);
        destination.push(coercedHref);
        precedence = "" + precedence;
        destination.push(",");
        precedence = escapeJSObjectForInstructionScripts(precedence);
        destination.push(precedence);
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
                throw Error(formatProdErrorMessage(399, "link"));
              default:
                writeStyleResourceAttributeInJS(
                  destination,
                  propKey,
                  precedence
                );
            }
        destination.push("]");
        nextArrayOpenBrackChunk = ",[";
        resource.state |= 2;
      }
  });
  destination.push("]");
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
  destination.push(",");
  attributeName = escapeJSObjectForInstructionScripts(attributeName);
  destination.push(attributeName);
  destination.push(",");
  attributeName = escapeJSObjectForInstructionScripts(name);
  destination.push(attributeName);
}
function writeStyleResourceDependenciesInAttr(destination, boundaryResources) {
  destination.push("[");
  var nextArrayOpenBrackChunk = "[";
  boundaryResources.forEach(function (resource) {
    if ("style" !== resource.type && !(resource.state & 1))
      if (resource.state & 3)
        destination.push(nextArrayOpenBrackChunk),
          (resource = escapeTextForBrowser(
            JSON.stringify("" + resource.props.href)
          )),
          destination.push(resource),
          destination.push("]"),
          (nextArrayOpenBrackChunk = ",[");
      else if ("stylesheet" === resource.type) {
        destination.push(nextArrayOpenBrackChunk);
        var precedence = resource.props["data-precedence"],
          props = resource.props,
          coercedHref = sanitizeURL("" + resource.props.href);
        coercedHref = escapeTextForBrowser(JSON.stringify(coercedHref));
        destination.push(coercedHref);
        precedence = "" + precedence;
        destination.push(",");
        precedence = escapeTextForBrowser(JSON.stringify(precedence));
        destination.push(precedence);
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
                throw Error(formatProdErrorMessage(399, "link"));
              default:
                writeStyleResourceAttributeInAttr(
                  destination,
                  propKey,
                  precedence
                );
            }
        destination.push("]");
        nextArrayOpenBrackChunk = ",[";
        resource.state |= 2;
      }
  });
  destination.push("]");
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
  destination.push(",");
  attributeName = escapeTextForBrowser(JSON.stringify(attributeName));
  destination.push(attributeName);
  destination.push(",");
  attributeName = escapeTextForBrowser(JSON.stringify(name));
  destination.push(attributeName);
}
function prefetchDNS(href) {
  var request = currentRequest ? currentRequest : null;
  if (request) {
    var resumableState = request.resumableState;
    if ("string" === typeof href && href) {
      var key = "[prefetchDNS]" + href,
        resource = resumableState.preconnectsMap.get(key);
      resource ||
        ((resource = { type: "preconnect", chunks: [], state: 0, props: null }),
        resumableState.preconnectsMap.set(key, resource),
        pushLinkImpl(resource.chunks, { href: href, rel: "dns-prefetch" }));
      resumableState.preconnects.add(resource);
      enqueueFlush(request);
    }
  }
}
function preconnect(href, options) {
  var request = currentRequest ? currentRequest : null;
  if (request) {
    var resumableState = request.resumableState;
    if ("string" === typeof href && href) {
      options =
        null == options || "string" !== typeof options.crossOrigin
          ? null
          : "use-credentials" === options.crossOrigin
          ? "use-credentials"
          : "";
      var key =
          "[preconnect][" + (null === options ? "null" : options) + "]" + href,
        resource = resumableState.preconnectsMap.get(key);
      resource ||
        ((resource = { type: "preconnect", chunks: [], state: 0, props: null }),
        resumableState.preconnectsMap.set(key, resource),
        pushLinkImpl(resource.chunks, {
          rel: "preconnect",
          href: href,
          crossOrigin: options
        }));
      resumableState.preconnects.add(resource);
      enqueueFlush(request);
    }
  }
}
function preload(href, options) {
  var request = currentRequest ? currentRequest : null;
  if (request) {
    var resumableState = request.resumableState;
    if (
      "string" === typeof href &&
      href &&
      "object" === typeof options &&
      null !== options &&
      "string" === typeof options.as &&
      options.as
    ) {
      var as = options.as;
      var key =
        "image" === as
          ? getImagePreloadKey(href, options.imageSrcSet, options.imageSizes)
          : "[" + as + "]" + href;
      var resource = resumableState.preloadsMap.get(key);
      resource ||
        ((resource = {
          type: "preload",
          chunks: [],
          state: 0,
          props: {
            rel: "preload",
            as: as,
            href: "image" === as && options.imageSrcSet ? void 0 : href,
            crossOrigin: "font" === as ? "" : options.crossOrigin,
            integrity: options.integrity,
            type: options.type,
            nonce: options.nonce,
            fetchPriority: options.fetchPriority,
            imageSrcSet: options.imageSrcSet,
            imageSizes: options.imageSizes,
            referrerPolicy: options.referrerPolicy
          }
        }),
        resumableState.preloadsMap.set(key, resource),
        pushLinkImpl(resource.chunks, resource.props));
      "font" === as
        ? resumableState.fontPreloads.add(resource)
        : "image" === as && "high" === options.fetchPriority
        ? resumableState.highImagePreloads.add(resource)
        : resumableState.bulkPreloads.add(resource);
      enqueueFlush(request);
    }
  }
}
function preloadModule(href, options) {
  var request = currentRequest ? currentRequest : null;
  if (request) {
    var resumableState = request.resumableState;
    if ("string" === typeof href && href) {
      var as =
          options && "string" === typeof options.as ? options.as : "script",
        key = "[" + as + "]" + href,
        resource = resumableState.preloadsMap.get(key);
      resource ||
        ((resource = {
          type: "preload",
          chunks: [],
          state: 0,
          props: {
            rel: "modulepreload",
            as: "script" !== as ? as : void 0,
            href: href,
            crossOrigin: options ? options.crossOrigin : void 0,
            integrity: options ? options.integrity : void 0
          }
        }),
        resumableState.preloadsMap.set(key, resource),
        pushLinkImpl(resource.chunks, resource.props));
      resumableState.bulkPreloads.add(resource);
      enqueueFlush(request);
    }
  }
}
function preinit(href, options) {
  var request = currentRequest ? currentRequest : null;
  if (request) {
    var resumableState = request.resumableState;
    if (
      "string" === typeof href &&
      href &&
      "object" === typeof options &&
      null !== options
    ) {
      var as = options.as;
      switch (as) {
        case "style":
          var key = "[" + as + "]" + href,
            resource = resumableState.stylesMap.get(key);
          as = options.precedence || "default";
          if (!resource) {
            resource = 0;
            var preloadResource = resumableState.preloadsMap.get(key);
            preloadResource && preloadResource.state & 3 && (resource = 8);
            resource = {
              type: "stylesheet",
              chunks: [],
              state: resource,
              props: {
                rel: "stylesheet",
                href: href,
                "data-precedence": as,
                crossOrigin: options.crossOrigin,
                integrity: options.integrity,
                fetchPriority: options.fetchPriority
              }
            };
            resumableState.stylesMap.set(key, resource);
            href = resumableState.precedences.get(as);
            href ||
              ((href = new Set()),
              resumableState.precedences.set(as, href),
              (options = {
                type: "style",
                chunks: [],
                state: 0,
                props: { precedence: as, hrefs: [] }
              }),
              href.add(options),
              resumableState.stylePrecedences.set(as, options));
            href.add(resource);
            enqueueFlush(request);
          }
          break;
        case "script":
          (key = "[" + as + "]" + href),
            (as = resumableState.scriptsMap.get(key)),
            as ||
              ((as = { type: "script", chunks: [], state: 0, props: null }),
              resumableState.scriptsMap.set(key, as),
              (href = {
                src: href,
                async: !0,
                crossOrigin: options.crossOrigin,
                integrity: options.integrity,
                nonce: options.nonce,
                fetchPriority: options.fetchPriority
              }),
              resumableState.scripts.add(as),
              pushScriptImpl(as.chunks, href),
              enqueueFlush(request));
      }
    }
  }
}
function preinitModule(href, options) {
  var request = currentRequest ? currentRequest : null;
  if (request) {
    var resumableState = request.resumableState;
    if ("string" === typeof href && href) {
      var as =
        options && "string" === typeof options.as ? options.as : "script";
      switch (as) {
        case "script":
          var key = "[" + as + "]" + href;
          as = resumableState.scriptsMap.get(key);
          as ||
            ((as = { type: "script", chunks: [], state: 0, props: null }),
            resumableState.scriptsMap.set(key, as),
            (href = {
              src: href,
              type: "module",
              async: !0,
              crossOrigin: options ? options.crossOrigin : void 0,
              integrity: options ? options.integrity : void 0
            }),
            resumableState.scripts.add(as),
            pushScriptImpl(as.chunks, href),
            enqueueFlush(request));
      }
    }
  }
}
function hoistStyleResource(resource) {
  this.add(resource);
}
function createRenderState(resumableState, nonce, generateStaticMarkup) {
  nonce =
    void 0 === nonce
      ? "<script>"
      : '<script nonce="' + escapeTextForBrowser(nonce) + '">';
  resumableState = resumableState.idPrefix;
  return {
    placeholderPrefix: resumableState + "P:",
    segmentPrefix: resumableState + "S:",
    boundaryPrefix: resumableState + "B:",
    startInlineScript: nonce,
    htmlChunks: null,
    headChunks: null,
    charsetChunks: [],
    preconnectChunks: [],
    importMapChunks: [],
    preloadChunks: [],
    hoistableChunks: [],
    boundaryResources: null,
    stylesToHoist: !1,
    generateStaticMarkup: generateStaticMarkup
  };
}
function pushTextInstance(target, text, renderState, textEmbedded) {
  if (renderState.generateStaticMarkup)
    return target.push(escapeTextForBrowser(text)), !1;
  "" === text
    ? (target = textEmbedded)
    : (textEmbedded && target.push("\x3c!-- --\x3e"),
      target.push(escapeTextForBrowser(text)),
      (target = !0));
  return target;
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
  MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
function getIteratorFn(maybeIterable) {
  if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
  maybeIterable =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable["@@iterator"];
  return "function" === typeof maybeIterable ? maybeIterable : null;
}
function getComponentNameFromType(type) {
  if (null == type) return null;
  if ("function" === typeof type) return type.displayName || type.name || null;
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
        } catch (x) {
          break;
        }
      case REACT_SERVER_CONTEXT_TYPE:
        return (type.displayName || type._globalName) + ".Provider";
    }
  return null;
}
var emptyContextObject = {},
  currentActiveSnapshot = null;
function popToNearestCommonAncestor(prev, next) {
  if (prev !== next) {
    prev.context._currentValue2 = prev.parentValue;
    prev = prev.parent;
    var parentNext = next.parent;
    if (null === prev) {
      if (null !== parentNext) throw Error(formatProdErrorMessage(401));
    } else {
      if (null === parentNext) throw Error(formatProdErrorMessage(401));
      popToNearestCommonAncestor(prev, parentNext);
    }
    next.context._currentValue2 = next.value;
  }
}
function popAllPrevious(prev) {
  prev.context._currentValue2 = prev.parentValue;
  prev = prev.parent;
  null !== prev && popAllPrevious(prev);
}
function pushAllNext(next) {
  var parentNext = next.parent;
  null !== parentNext && pushAllNext(parentNext);
  next.context._currentValue2 = next.value;
}
function popPreviousToCommonLevel(prev, next) {
  prev.context._currentValue2 = prev.parentValue;
  prev = prev.parent;
  if (null === prev) throw Error(formatProdErrorMessage(402));
  prev.depth === next.depth
    ? popToNearestCommonAncestor(prev, next)
    : popPreviousToCommonLevel(prev, next);
}
function popNextToCommonLevel(prev, next) {
  var parentNext = next.parent;
  if (null === parentNext) throw Error(formatProdErrorMessage(402));
  prev.depth === parentNext.depth
    ? popToNearestCommonAncestor(prev, parentNext)
    : popNextToCommonLevel(prev, parentNext);
  next.context._currentValue2 = next.value;
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
var SuspenseException = Error(formatProdErrorMessage(460));
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
  if (null === suspendedThenable) throw Error(formatProdErrorMessage(459));
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
    throw Error(formatProdErrorMessage(321));
  return currentlyRenderingComponent;
}
function createHook() {
  if (0 < numberOfReRenders) throw Error(formatProdErrorMessage(312));
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
  currentlyRenderingTask = currentlyRenderingComponent = null;
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
  if (25 <= numberOfReRenders) throw Error(formatProdErrorMessage(301));
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
  throw Error(formatProdErrorMessage(440));
}
function unsupportedStartTransition() {
  throw Error(formatProdErrorMessage(394));
}
function unsupportedSetOptimisticState() {
  throw Error(formatProdErrorMessage(479));
}
function useOptimistic(passthrough) {
  resolveCurrentlyRenderingComponent();
  return [passthrough, unsupportedSetOptimisticState];
}
function useFormState(action, initialState, permalink) {
  function dispatch(payload) {
    boundAction(payload);
  }
  resolveCurrentlyRenderingComponent();
  formStateCounter++;
  var boundAction = action.bind(null, initialState);
  "function" === typeof boundAction.$$FORM_ACTION &&
    (dispatch.$$FORM_ACTION = function (prefix) {
      prefix = boundAction.$$FORM_ACTION(prefix);
      void 0 !== permalink && (prefix.action = permalink + "");
      return prefix;
    });
  return [initialState, dispatch];
}
function unwrapThenable(thenable) {
  var index = thenableIndexCounter;
  thenableIndexCounter += 1;
  null === thenableState && (thenableState = []);
  return trackUsedThenable(thenableState, thenable, index);
}
function unsupportedRefresh() {
  throw Error(formatProdErrorMessage(393));
}
function noop$1() {}
var HooksDispatcher = {
  readContext: function (context) {
    return context._currentValue2;
  },
  use: function (usable) {
    if (null !== usable && "object" === typeof usable) {
      if ("function" === typeof usable.then) return unwrapThenable(usable);
      if (
        usable.$$typeof === REACT_CONTEXT_TYPE ||
        usable.$$typeof === REACT_SERVER_CONTEXT_TYPE
      )
        return usable._currentValue2;
    }
    throw Error(formatProdErrorMessage(438, String(usable)));
  },
  useContext: function (context) {
    resolveCurrentlyRenderingComponent();
    return context._currentValue2;
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
  useDeferredValue: function (value) {
    resolveCurrentlyRenderingComponent();
    return value;
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
    if (null === resumableState) throw Error(formatProdErrorMessage(404));
    overflow = localIdCounter++;
    JSCompiler_inline_result =
      ":" + resumableState.idPrefix + "R" + JSCompiler_inline_result;
    0 < overflow && (JSCompiler_inline_result += "H" + overflow.toString(32));
    return JSCompiler_inline_result + ":";
  },
  useSyncExternalStore: function (subscribe, getSnapshot, getServerSnapshot) {
    if (void 0 === getServerSnapshot) throw Error(formatProdErrorMessage(407));
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
      throw Error(formatProdErrorMessage(248));
    },
    getCacheForType: function () {
      throw Error(formatProdErrorMessage(248));
    }
  },
  ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher,
  ReactCurrentCache = ReactSharedInternals.ReactCurrentCache;
function defaultErrorHandler(error) {
  console.error(error);
  return null;
}
function noop() {}
function createRequest(
  children,
  resumableState,
  renderState,
  rootFormatContext,
  progressiveChunkSize,
  onError,
  onAllReady,
  onShellReady,
  onShellError,
  onFatalError,
  onPostpone
) {
  ReactDOMCurrentDispatcher.current = ReactDOMServerDispatcher;
  var pingedTasks = [],
    abortSet = new Set();
  resumableState = {
    destination: null,
    flushScheduled: !1,
    resumableState: resumableState,
    renderState: renderState,
    rootFormatContext: rootFormatContext,
    progressiveChunkSize:
      void 0 === progressiveChunkSize ? 12800 : progressiveChunkSize,
    status: 0,
    fatalError: null,
    nextSegmentId: 0,
    allPendingTasks: 0,
    pendingRootTasks: 0,
    completedRootSegment: null,
    abortableTasks: abortSet,
    pingedTasks: pingedTasks,
    clientRenderedBoundaries: [],
    completedBoundaries: [],
    partialBoundaries: [],
    trackedPostpones: null,
    onError: void 0 === onError ? defaultErrorHandler : onError,
    onPostpone: void 0 === onPostpone ? noop : onPostpone,
    onAllReady: void 0 === onAllReady ? noop : onAllReady,
    onShellReady: void 0 === onShellReady ? noop : onShellReady,
    onShellError: void 0 === onShellError ? noop : onShellError,
    onFatalError: void 0 === onFatalError ? noop : onFatalError
  };
  renderState = createPendingSegment(
    resumableState,
    0,
    null,
    rootFormatContext,
    !1,
    !1
  );
  renderState.parentFlushed = !0;
  children = createTask(
    resumableState,
    null,
    children,
    null,
    renderState,
    abortSet,
    null,
    rootFormatContext,
    emptyContextObject,
    null,
    emptyTreeContext
  );
  pingedTasks.push(children);
  return resumableState;
}
var currentRequest = null;
function createTask(
  request,
  thenableState,
  node,
  blockedBoundary,
  blockedSegment,
  abortSet,
  keyPath,
  formatContext,
  legacyContext,
  context,
  treeContext
) {
  request.allPendingTasks++;
  null === blockedBoundary
    ? request.pendingRootTasks++
    : blockedBoundary.pendingTasks++;
  var task = {
    node: node,
    ping: function () {
      request.pingedTasks.push(task);
      1 === request.pingedTasks.length &&
        ((request.flushScheduled = null !== request.destination),
        performWork(request));
    },
    blockedBoundary: blockedBoundary,
    blockedSegment: blockedSegment,
    abortSet: abortSet,
    keyPath: keyPath,
    formatContext: formatContext,
    legacyContext: legacyContext,
    context: context,
    treeContext: treeContext,
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
function logRecoverableError(request, error) {
  request = request.onError(error);
  if (null != request && "string" !== typeof request)
    throw Error(
      'onError returned something with a type other than "string". onError should return a string and may return null or undefined but must not return anything else. It received something of type "' +
        typeof request +
        '" instead'
    );
  return request;
}
function fatalError(request, error) {
  var onShellError = request.onShellError;
  onShellError(error);
  onShellError = request.onFatalError;
  onShellError(error);
  null !== request.destination
    ? ((request.status = 2), request.destination.destroy(error))
    : ((request.status = 1), (request.fatalError = error));
}
function finishFunctionComponent(
  request,
  task,
  children,
  hasId,
  formStateCount,
  formStateMatchingIndex
) {
  var didEmitFormStateMarkers = !1;
  if (0 !== formStateCount) {
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
  hasId
    ? ((hasId = task.treeContext),
      (task.treeContext = pushTreeContext(hasId, 1, 0)),
      renderNode(request, task, children, 0),
      (task.treeContext = hasId))
    : didEmitFormStateMarkers
    ? renderNode(request, task, children, 0)
    : renderNodeDestructiveImpl(request, task, null, children, 0);
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
function renderElement(request, task, prevThenableState, type, props, ref) {
  if ("function" === typeof type)
    if (type.prototype && type.prototype.isReactComponent) {
      var JSCompiler_inline_result = emptyContextObject;
      prevThenableState = type.contextType;
      "object" === typeof prevThenableState &&
        null !== prevThenableState &&
        (JSCompiler_inline_result = prevThenableState._currentValue2);
      JSCompiler_inline_result = new type(props, JSCompiler_inline_result);
      ref =
        void 0 !== JSCompiler_inline_result.state
          ? JSCompiler_inline_result.state
          : null;
      JSCompiler_inline_result.updater = classComponentUpdater;
      JSCompiler_inline_result.props = props;
      JSCompiler_inline_result.state = ref;
      prevThenableState = { queue: [], replace: !1 };
      JSCompiler_inline_result._reactInternals = prevThenableState;
      var contextType = type.contextType;
      JSCompiler_inline_result.context =
        "object" === typeof contextType && null !== contextType
          ? contextType._currentValue2
          : emptyContextObject;
      contextType = type.getDerivedStateFromProps;
      "function" === typeof contextType &&
        ((contextType = contextType(props, ref)),
        (ref =
          null === contextType || void 0 === contextType
            ? ref
            : assign({}, ref, contextType)),
        (JSCompiler_inline_result.state = ref));
      if (
        "function" !== typeof type.getDerivedStateFromProps &&
        "function" !==
          typeof JSCompiler_inline_result.getSnapshotBeforeUpdate &&
        ("function" ===
          typeof JSCompiler_inline_result.UNSAFE_componentWillMount ||
          "function" === typeof JSCompiler_inline_result.componentWillMount)
      )
        if (
          ((type = JSCompiler_inline_result.state),
          "function" === typeof JSCompiler_inline_result.componentWillMount &&
            JSCompiler_inline_result.componentWillMount(),
          "function" ===
            typeof JSCompiler_inline_result.UNSAFE_componentWillMount &&
            JSCompiler_inline_result.UNSAFE_componentWillMount(),
          type !== JSCompiler_inline_result.state &&
            classComponentUpdater.enqueueReplaceState(
              JSCompiler_inline_result,
              JSCompiler_inline_result.state,
              null
            ),
          null !== prevThenableState.queue &&
            0 < prevThenableState.queue.length)
        )
          if (
            ((type = prevThenableState.queue),
            (contextType = prevThenableState.replace),
            (prevThenableState.queue = null),
            (prevThenableState.replace = !1),
            contextType && 1 === type.length)
          )
            JSCompiler_inline_result.state = type[0];
          else {
            prevThenableState = contextType
              ? type[0]
              : JSCompiler_inline_result.state;
            ref = !0;
            for (
              contextType = contextType ? 1 : 0;
              contextType < type.length;
              contextType++
            ) {
              var partial = type[contextType];
              partial =
                "function" === typeof partial
                  ? partial.call(
                      JSCompiler_inline_result,
                      prevThenableState,
                      props,
                      void 0
                    )
                  : partial;
              null != partial &&
                (ref
                  ? ((ref = !1),
                    (prevThenableState = assign(
                      {},
                      prevThenableState,
                      partial
                    )))
                  : assign(prevThenableState, partial));
            }
            JSCompiler_inline_result.state = prevThenableState;
          }
        else prevThenableState.queue = null;
      props = JSCompiler_inline_result.render();
      renderNodeDestructiveImpl(request, task, null, props, 0);
    } else
      (currentlyRenderingComponent = {}),
        (currentlyRenderingTask = task),
        (formStateCounter = localIdCounter = 0),
        (formStateMatchingIndex = -1),
        (thenableIndexCounter = 0),
        (thenableState = prevThenableState),
        (JSCompiler_inline_result = type(props, void 0)),
        (props = finishHooks(type, props, JSCompiler_inline_result, void 0)),
        finishFunctionComponent(
          request,
          task,
          props,
          0 !== localIdCounter,
          formStateCounter,
          formStateMatchingIndex
        );
  else if ("string" === typeof type) {
    JSCompiler_inline_result = task.blockedSegment;
    ref = pushStartInstance(
      JSCompiler_inline_result.chunks,
      type,
      props,
      request.resumableState,
      request.renderState,
      task.formatContext,
      JSCompiler_inline_result.lastPushedText
    );
    JSCompiler_inline_result.lastPushedText = !1;
    prevThenableState = task.formatContext;
    task.formatContext = getChildFormatContext(prevThenableState, type, props);
    renderNode(request, task, ref, 0);
    task.formatContext = prevThenableState;
    a: {
      task = JSCompiler_inline_result.chunks;
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
          if (1 >= prevThenableState.insertionMode) {
            request.hasBody = !0;
            break a;
          }
          break;
        case "html":
          if (0 === prevThenableState.insertionMode) {
            request.hasHtml = !0;
            break a;
          }
      }
      task.push("</", type, ">");
    }
    JSCompiler_inline_result.lastPushedText = !1;
  } else {
    switch (type) {
      case REACT_LEGACY_HIDDEN_TYPE:
      case REACT_DEBUG_TRACING_MODE_TYPE:
      case REACT_STRICT_MODE_TYPE:
      case REACT_PROFILER_TYPE:
      case REACT_FRAGMENT_TYPE:
        renderNodeDestructiveImpl(request, task, null, props.children, 0);
        return;
      case REACT_OFFSCREEN_TYPE:
        "hidden" !== props.mode &&
          renderNodeDestructiveImpl(request, task, null, props.children, 0);
        return;
      case REACT_SUSPENSE_LIST_TYPE:
        renderNodeDestructiveImpl(request, task, null, props.children, 0);
        return;
      case REACT_SCOPE_TYPE:
        renderNodeDestructiveImpl(request, task, null, props.children, 0);
        return;
      case REACT_SUSPENSE_TYPE:
        a: {
          type = task.blockedBoundary;
          prevThenableState = task.blockedSegment;
          ref = props.fallback;
          props = props.children;
          contextType = new Set();
          partial = task.keyPath;
          partial = {
            status: 0,
            id: null,
            rootSegmentID: -1,
            parentFlushed: !1,
            pendingTasks: 0,
            completedSegments: [],
            byteSize: 0,
            fallbackAbortableTasks: contextType,
            errorDigest: null,
            resources: new Set(),
            keyPath: partial
          };
          var boundarySegment = createPendingSegment(
            request,
            prevThenableState.chunks.length,
            partial,
            task.formatContext,
            !1,
            !1
          );
          prevThenableState.children.push(boundarySegment);
          prevThenableState.lastPushedText = !1;
          var contentRootSegment = createPendingSegment(
            request,
            0,
            null,
            task.formatContext,
            !1,
            !1
          );
          contentRootSegment.parentFlushed = !0;
          task.blockedBoundary = partial;
          task.blockedSegment = contentRootSegment;
          request.renderState.boundaryResources = partial.resources;
          try {
            if (
              (renderNode(request, task, props, 0),
              request.renderState.generateStaticMarkup ||
                (contentRootSegment.lastPushedText &&
                  contentRootSegment.textEmbedded &&
                  contentRootSegment.chunks.push("\x3c!-- --\x3e")),
              (contentRootSegment.status = 1),
              queueCompletedSegment(partial, contentRootSegment),
              0 === partial.pendingTasks && 0 === partial.status)
            ) {
              partial.status = 1;
              break a;
            }
          } catch (error) {
            (contentRootSegment.status = 4),
              (partial.status = 4),
              (JSCompiler_inline_result = logRecoverableError(request, error)),
              (partial.errorDigest = JSCompiler_inline_result);
          } finally {
            (request.renderState.boundaryResources = type
              ? type.resources
              : null),
              (task.blockedBoundary = type),
              (task.blockedSegment = prevThenableState);
          }
          task = createTask(
            request,
            null,
            ref,
            type,
            boundarySegment,
            contextType,
            task.keyPath,
            task.formatContext,
            task.legacyContext,
            task.context,
            task.treeContext
          );
          request.pingedTasks.push(task);
        }
        return;
    }
    if ("object" === typeof type && null !== type)
      switch (type.$$typeof) {
        case REACT_FORWARD_REF_TYPE:
          type = type.render;
          currentlyRenderingComponent = {};
          currentlyRenderingTask = task;
          formStateCounter = localIdCounter = 0;
          formStateMatchingIndex = -1;
          thenableIndexCounter = 0;
          thenableState = prevThenableState;
          JSCompiler_inline_result = type(props, ref);
          props = finishHooks(type, props, JSCompiler_inline_result, ref);
          finishFunctionComponent(
            request,
            task,
            props,
            0 !== localIdCounter,
            formStateCounter,
            formStateMatchingIndex
          );
          return;
        case REACT_MEMO_TYPE:
          type = type.type;
          props = resolveDefaultProps(type, props);
          renderElement(request, task, prevThenableState, type, props, ref);
          return;
        case REACT_PROVIDER_TYPE:
          JSCompiler_inline_result = props.children;
          type = type._context;
          props = props.value;
          prevThenableState = type._currentValue2;
          type._currentValue2 = props;
          ref = currentActiveSnapshot;
          currentActiveSnapshot = props = {
            parent: ref,
            depth: null === ref ? 0 : ref.depth + 1,
            context: type,
            parentValue: prevThenableState,
            value: props
          };
          task.context = props;
          renderNodeDestructiveImpl(
            request,
            task,
            null,
            JSCompiler_inline_result,
            0
          );
          request = currentActiveSnapshot;
          if (null === request) throw Error(formatProdErrorMessage(403));
          props = request.parentValue;
          request.context._currentValue2 =
            props === REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED
              ? request.context._defaultValue
              : props;
          request = currentActiveSnapshot = request.parent;
          task.context = request;
          return;
        case REACT_CONTEXT_TYPE:
          props = props.children;
          props = props(type._currentValue2);
          renderNodeDestructiveImpl(request, task, null, props, 0);
          return;
        case REACT_LAZY_TYPE:
          JSCompiler_inline_result = type._init;
          type = JSCompiler_inline_result(type._payload);
          props = resolveDefaultProps(type, props);
          renderElement(request, task, prevThenableState, type, props, void 0);
          return;
      }
    throw Error(
      formatProdErrorMessage(130, null == type ? type : typeof type, "")
    );
  }
}
function renderNodeDestructiveImpl(
  request,
  task,
  prevThenableState,
  node,
  childIndex
) {
  task.node = node;
  task.childIndex = childIndex;
  if ("object" === typeof node && null !== node) {
    switch (node.$$typeof) {
      case REACT_ELEMENT_TYPE:
        var type = node.type,
          key = node.key,
          props = node.props;
        node = node.ref;
        var name = getComponentNameFromType(type),
          prevKeyPath = task.keyPath;
        task.keyPath = [task.keyPath, name, null == key ? childIndex : key];
        renderElement(request, task, prevThenableState, type, props, node);
        task.keyPath = prevKeyPath;
        return;
      case REACT_PORTAL_TYPE:
        throw Error(formatProdErrorMessage(257));
      case REACT_LAZY_TYPE:
        prevThenableState = node._init;
        node = prevThenableState(node._payload);
        renderNodeDestructiveImpl(request, task, null, node, childIndex);
        return;
    }
    if (isArrayImpl(node)) {
      renderChildrenArray(request, task, node, childIndex);
      return;
    }
    if ((prevThenableState = getIteratorFn(node)))
      if ((prevThenableState = prevThenableState.call(node))) {
        node = prevThenableState.next();
        if (!node.done) {
          type = [];
          do type.push(node.value), (node = prevThenableState.next());
          while (!node.done);
          renderChildrenArray(request, task, type, childIndex);
        }
        return;
      }
    if ("function" === typeof node.then)
      return renderNodeDestructiveImpl(
        request,
        task,
        null,
        unwrapThenable(node),
        childIndex
      );
    if (
      node.$$typeof === REACT_CONTEXT_TYPE ||
      node.$$typeof === REACT_SERVER_CONTEXT_TYPE
    )
      return renderNodeDestructiveImpl(
        request,
        task,
        null,
        node._currentValue2,
        childIndex
      );
    request = Object.prototype.toString.call(node);
    throw Error(
      formatProdErrorMessage(
        31,
        "[object Object]" === request
          ? "object with keys {" + Object.keys(node).join(", ") + "}"
          : request
      )
    );
  }
  "string" === typeof node
    ? ((childIndex = task.blockedSegment),
      (childIndex.lastPushedText = pushTextInstance(
        task.blockedSegment.chunks,
        node,
        request.renderState,
        childIndex.lastPushedText
      )))
    : "number" === typeof node &&
      ((childIndex = task.blockedSegment),
      (childIndex.lastPushedText = pushTextInstance(
        task.blockedSegment.chunks,
        "" + node,
        request.renderState,
        childIndex.lastPushedText
      )));
}
function renderChildrenArray(request, task, children, childIndex) {
  for (
    var prevTreeContext = task.treeContext,
      totalChildren = children.length,
      i = 0;
    i < totalChildren;
    i++
  ) {
    var node = children[i];
    task.treeContext = pushTreeContext(prevTreeContext, totalChildren, i);
    if (isArrayImpl(node)) {
      var prevKeyPath = task.keyPath;
      task.keyPath = [task.keyPath, "", childIndex];
      renderChildrenArray(request, task, node, i);
      task.keyPath = prevKeyPath;
    } else {
      if ((prevKeyPath = getIteratorFn(node)))
        if ((prevKeyPath = prevKeyPath.call(node))) {
          node = prevKeyPath.next();
          if (!node.done) {
            var prevKeyPath$13 = task.keyPath;
            task.keyPath = [task.keyPath, "", childIndex];
            var nestedChildren = [];
            do nestedChildren.push(node.value), (node = prevKeyPath.next());
            while (!node.done);
            renderChildrenArray(request, task, nestedChildren, i);
            task.keyPath = prevKeyPath$13;
          }
          continue;
        }
      renderNode(request, task, node, i);
    }
  }
  task.treeContext = prevTreeContext;
}
function renderNode(request, task, node, childIndex) {
  var segment = task.blockedSegment,
    childrenLength = segment.children.length,
    chunkLength = segment.chunks.length,
    previousFormatContext = task.formatContext,
    previousLegacyContext = task.legacyContext,
    previousContext = task.context,
    previousKeyPath = task.keyPath,
    previousTreeContext = task.treeContext;
  try {
    return renderNodeDestructiveImpl(request, task, null, node, childIndex);
  } catch (thrownValue) {
    if (
      (resetHooksState(),
      (segment.children.length = childrenLength),
      (segment.chunks.length = chunkLength),
      (node =
        thrownValue === SuspenseException
          ? getSuspendedThenable()
          : thrownValue),
      "object" === typeof node &&
        null !== node &&
        "function" === typeof node.then)
    )
      (childIndex = getThenableStateAfterSuspending()),
        (segment = task.blockedSegment),
        (childrenLength = createPendingSegment(
          request,
          segment.chunks.length,
          null,
          task.formatContext,
          segment.lastPushedText,
          !0
        )),
        segment.children.push(childrenLength),
        (segment.lastPushedText = !1),
        (request = createTask(
          request,
          childIndex,
          task.node,
          task.blockedBoundary,
          childrenLength,
          task.abortSet,
          task.keyPath,
          task.formatContext,
          task.legacyContext,
          task.context,
          task.treeContext
        )),
        (request.childIndex = task.childIndex),
        (request = request.ping),
        node.then(request, request),
        (task.formatContext = previousFormatContext),
        (task.legacyContext = previousLegacyContext),
        (task.context = previousContext),
        (task.keyPath = previousKeyPath),
        (task.treeContext = previousTreeContext),
        switchContext(previousContext);
    else
      throw (
        ((task.formatContext = previousFormatContext),
        (task.legacyContext = previousLegacyContext),
        (task.context = previousContext),
        (task.keyPath = previousKeyPath),
        (task.treeContext = previousTreeContext),
        switchContext(previousContext),
        node)
      );
  }
}
function abortTaskSoft(task) {
  var boundary = task.blockedBoundary;
  task = task.blockedSegment;
  task.status = 3;
  finishedTask(this, boundary, task);
}
function abortTask(task, request, error) {
  var boundary = task.blockedBoundary;
  task.blockedSegment.status = 3;
  null === boundary
    ? (request.allPendingTasks--,
      1 !== request.status &&
        2 !== request.status &&
        (logRecoverableError(request, error), fatalError(request, error)))
    : (boundary.pendingTasks--,
      4 !== boundary.status &&
        ((boundary.status = 4),
        (boundary.errorDigest = request.onError(error)),
        boundary.parentFlushed &&
          request.clientRenderedBoundaries.push(boundary)),
      boundary.fallbackAbortableTasks.forEach(function (fallbackTask) {
        return abortTask(fallbackTask, request, error);
      }),
      boundary.fallbackAbortableTasks.clear(),
      request.allPendingTasks--,
      0 === request.allPendingTasks && ((task = request.onAllReady), task()));
}
function queueCompletedSegment(boundary, segment) {
  if (
    0 === segment.chunks.length &&
    1 === segment.children.length &&
    null === segment.children[0].boundary
  ) {
    var childSegment = segment.children[0];
    childSegment.id = segment.id;
    childSegment.parentFlushed = !0;
    1 === childSegment.status && queueCompletedSegment(boundary, childSegment);
  } else boundary.completedSegments.push(segment);
}
function finishedTask(request, boundary, segment) {
  if (null === boundary) {
    if (segment.parentFlushed) {
      if (null !== request.completedRootSegment)
        throw Error(formatProdErrorMessage(389));
      request.completedRootSegment = segment;
    }
    request.pendingRootTasks--;
    0 === request.pendingRootTasks &&
      ((request.onShellError = noop),
      (boundary = request.onShellReady),
      boundary());
  } else
    boundary.pendingTasks--,
      4 !== boundary.status &&
        (0 === boundary.pendingTasks
          ? (0 === boundary.status && (boundary.status = 1),
            segment.parentFlushed &&
              1 === segment.status &&
              queueCompletedSegment(boundary, segment),
            boundary.parentFlushed &&
              request.completedBoundaries.push(boundary),
            boundary.fallbackAbortableTasks.forEach(abortTaskSoft, request),
            boundary.fallbackAbortableTasks.clear())
          : segment.parentFlushed &&
            1 === segment.status &&
            (queueCompletedSegment(boundary, segment),
            1 === boundary.completedSegments.length &&
              boundary.parentFlushed &&
              request.partialBoundaries.push(boundary)));
  request.allPendingTasks--;
  0 === request.allPendingTasks && ((request = request.onAllReady), request());
}
function performWork(request$jscomp$1) {
  if (2 !== request$jscomp$1.status) {
    var prevContext = currentActiveSnapshot,
      prevDispatcher = ReactCurrentDispatcher.current;
    ReactCurrentDispatcher.current = HooksDispatcher;
    var prevCacheDispatcher = ReactCurrentCache.current;
    ReactCurrentCache.current = DefaultCacheDispatcher;
    var prevRequest = currentRequest;
    currentRequest = request$jscomp$1;
    var prevResumableState = currentResumableState;
    currentResumableState = request$jscomp$1.resumableState;
    try {
      var pingedTasks = request$jscomp$1.pingedTasks,
        i;
      for (i = 0; i < pingedTasks.length; i++) {
        var task = pingedTasks[i];
        var request = request$jscomp$1,
          blockedBoundary = task.blockedBoundary;
        request.renderState.boundaryResources = blockedBoundary
          ? blockedBoundary.resources
          : null;
        var segment = task.blockedSegment;
        if (0 === segment.status) {
          switchContext(task.context);
          var childrenLength = segment.children.length,
            chunkLength = segment.chunks.length;
          try {
            var prevThenableState = task.thenableState;
            task.thenableState = null;
            renderNodeDestructiveImpl(
              request,
              task,
              prevThenableState,
              task.node,
              task.childIndex
            );
            request.renderState.generateStaticMarkup ||
              (segment.lastPushedText &&
                segment.textEmbedded &&
                segment.chunks.push("\x3c!-- --\x3e"));
            task.abortSet.delete(task);
            segment.status = 1;
            finishedTask(request, task.blockedBoundary, segment);
          } catch (thrownValue) {
            resetHooksState();
            segment.children.length = childrenLength;
            segment.chunks.length = chunkLength;
            var x =
              thrownValue === SuspenseException
                ? getSuspendedThenable()
                : thrownValue;
            if (
              "object" === typeof x &&
              null !== x &&
              "function" === typeof x.then
            ) {
              var ping = task.ping;
              x.then(ping, ping);
              task.thenableState = getThenableStateAfterSuspending();
            } else {
              task.abortSet.delete(task);
              segment.status = 4;
              var errorDigest = void 0,
                request$jscomp$0 = request,
                boundary = task.blockedBoundary,
                error$jscomp$0 = x;
              errorDigest = logRecoverableError(
                request$jscomp$0,
                error$jscomp$0
              );
              null === boundary
                ? fatalError(request$jscomp$0, error$jscomp$0)
                : (boundary.pendingTasks--,
                  4 !== boundary.status &&
                    ((boundary.status = 4),
                    (boundary.errorDigest = errorDigest),
                    boundary.parentFlushed &&
                      request$jscomp$0.clientRenderedBoundaries.push(
                        boundary
                      )));
              request$jscomp$0.allPendingTasks--;
              if (0 === request$jscomp$0.allPendingTasks) {
                var onAllReady = request$jscomp$0.onAllReady;
                onAllReady();
              }
            }
          } finally {
            request.renderState.boundaryResources = null;
          }
        }
      }
      pingedTasks.splice(0, i);
      null !== request$jscomp$1.destination &&
        flushCompletedQueues(request$jscomp$1, request$jscomp$1.destination);
    } catch (error) {
      logRecoverableError(request$jscomp$1, error),
        fatalError(request$jscomp$1, error);
    } finally {
      (currentResumableState = prevResumableState),
        (ReactCurrentDispatcher.current = prevDispatcher),
        (ReactCurrentCache.current = prevCacheDispatcher),
        prevDispatcher === HooksDispatcher && switchContext(prevContext),
        (currentRequest = prevRequest);
    }
  }
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
      destination.push('<template id="');
      destination.push(request.placeholderPrefix);
      request = segmentID.toString(16);
      destination.push(request);
      return destination.push('"></template>');
    case 1:
      segment.status = 2;
      var r = !0;
      segmentID = segment.chunks;
      var chunkIdx = 0;
      segment = segment.children;
      for (var childIdx = 0; childIdx < segment.length; childIdx++) {
        for (r = segment[childIdx]; chunkIdx < r.index; chunkIdx++)
          destination.push(segmentID[chunkIdx]);
        r = flushSegment(request, destination, r);
      }
      for (; chunkIdx < segmentID.length - 1; chunkIdx++)
        destination.push(segmentID[chunkIdx]);
      chunkIdx < segmentID.length &&
        (r = destination.push(segmentID[chunkIdx]));
      return r;
    default:
      throw Error(formatProdErrorMessage(390));
  }
}
function flushSegment(request, destination, segment) {
  var boundary = segment.boundary;
  if (null === boundary) return flushSubtree(request, destination, segment);
  boundary.parentFlushed = !0;
  if (4 === boundary.status)
    return (
      request.renderState.generateStaticMarkup ||
        ((boundary = boundary.errorDigest),
        destination.push("\x3c!--$!--\x3e"),
        destination.push("<template"),
        boundary &&
          (destination.push(' data-dgst="'),
          (boundary = escapeTextForBrowser(boundary)),
          destination.push(boundary),
          destination.push('"')),
        destination.push("></template>")),
      flushSubtree(request, destination, segment),
      (request = request.renderState.generateStaticMarkup
        ? !0
        : destination.push("\x3c!--/$--\x3e")),
      request
    );
  if (1 !== boundary.status) {
    if (0 === boundary.status) {
      var JSCompiler_inline_result = request.renderState;
      var generatedID = request.resumableState.nextSuspenseID++;
      JSCompiler_inline_result =
        JSCompiler_inline_result.boundaryPrefix + generatedID.toString(16);
      boundary.id = JSCompiler_inline_result;
    }
    boundary.rootSegmentID = request.nextSegmentId++;
    0 < boundary.completedSegments.length &&
      request.partialBoundaries.push(boundary);
    writeStartPendingSuspenseBoundary(
      destination,
      request.renderState,
      boundary.id
    );
    flushSubtree(request, destination, segment);
    return destination.push("\x3c!--/$--\x3e");
  }
  if (boundary.byteSize > request.progressiveChunkSize)
    return (
      (boundary.rootSegmentID = request.nextSegmentId++),
      request.completedBoundaries.push(boundary),
      writeStartPendingSuspenseBoundary(
        destination,
        request.renderState,
        boundary.id
      ),
      flushSubtree(request, destination, segment),
      destination.push("\x3c!--/$--\x3e")
    );
  (segment = request.renderState.boundaryResources) &&
    boundary.resources.forEach(hoistStyleResource, segment);
  request.renderState.generateStaticMarkup ||
    destination.push("\x3c!--$--\x3e");
  segment = boundary.completedSegments;
  if (1 !== segment.length) throw Error(formatProdErrorMessage(391));
  flushSegment(request, destination, segment[0]);
  request = request.renderState.generateStaticMarkup
    ? !0
    : destination.push("\x3c!--/$--\x3e");
  return request;
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
  i = boundary.id;
  var contentSegmentID = boundary.rootSegmentID;
  boundary = boundary.resources;
  var requiresStyleInsertion = request.stylesToHoist;
  request.stylesToHoist = !1;
  var scriptFormat = 0 === completedSegments.streamingFormat;
  scriptFormat
    ? (destination.push(request.startInlineScript),
      requiresStyleInsertion
        ? 0 === (completedSegments.instructions & 2)
          ? ((completedSegments.instructions |= 10),
            destination.push(
              '$RC=function(b,c,e){c=document.getElementById(c);c.parentNode.removeChild(c);var a=document.getElementById(b);if(a){b=a.previousSibling;if(e)b.data="$!",a.setAttribute("data-dgst",e);else{e=b.parentNode;a=b.nextSibling;var f=0;do{if(a&&8===a.nodeType){var d=a.data;if("/$"===d)if(0===f)break;else f--;else"$"!==d&&"$?"!==d&&"$!"!==d||f++}d=a.nextSibling;e.removeChild(a);a=d}while(a);for(;c.firstChild;)e.insertBefore(c.firstChild,a);b.data="$"}b._reactRetry&&b._reactRetry()}};$RM=new Map;\n$RR=function(r,t,w){for(var u=$RC,n=$RM,p=new Map,q=document,g,b,h=q.querySelectorAll("link[data-precedence],style[data-precedence]"),v=[],k=0;b=h[k++];)"not all"===b.getAttribute("media")?v.push(b):("LINK"===b.tagName&&n.set(b.getAttribute("href"),b),p.set(b.dataset.precedence,g=b));b=0;h=[];var l,a;for(k=!0;;){if(k){var f=w[b++];if(!f){k=!1;b=0;continue}var c=!1,m=0;var d=f[m++];if(a=n.get(d)){var e=a._p;c=!0}else{a=q.createElement("link");a.href=d;a.rel="stylesheet";for(a.dataset.precedence=\nl=f[m++];e=f[m++];)a.setAttribute(e,f[m++]);e=a._p=new Promise(function(x,y){a.onload=x;a.onerror=y});n.set(d,a)}d=a.getAttribute("media");!e||"l"===e.s||d&&!matchMedia(d).matches||h.push(e);if(c)continue}else{a=v[b++];if(!a)break;l=a.getAttribute("data-precedence");a.removeAttribute("media")}c=p.get(l)||g;c===g&&(g=a);p.set(l,a);c?c.parentNode.insertBefore(a,c.nextSibling):(c=q.head,c.insertBefore(a,c.firstChild))}Promise.all(h).then(u.bind(null,r,t,""),u.bind(null,r,t,"Resource failed to load"))};$RR("'
            ))
          : 0 === (completedSegments.instructions & 8)
          ? ((completedSegments.instructions |= 8),
            destination.push(
              '$RM=new Map;\n$RR=function(r,t,w){for(var u=$RC,n=$RM,p=new Map,q=document,g,b,h=q.querySelectorAll("link[data-precedence],style[data-precedence]"),v=[],k=0;b=h[k++];)"not all"===b.getAttribute("media")?v.push(b):("LINK"===b.tagName&&n.set(b.getAttribute("href"),b),p.set(b.dataset.precedence,g=b));b=0;h=[];var l,a;for(k=!0;;){if(k){var f=w[b++];if(!f){k=!1;b=0;continue}var c=!1,m=0;var d=f[m++];if(a=n.get(d)){var e=a._p;c=!0}else{a=q.createElement("link");a.href=d;a.rel="stylesheet";for(a.dataset.precedence=\nl=f[m++];e=f[m++];)a.setAttribute(e,f[m++]);e=a._p=new Promise(function(x,y){a.onload=x;a.onerror=y});n.set(d,a)}d=a.getAttribute("media");!e||"l"===e.s||d&&!matchMedia(d).matches||h.push(e);if(c)continue}else{a=v[b++];if(!a)break;l=a.getAttribute("data-precedence");a.removeAttribute("media")}c=p.get(l)||g;c===g&&(g=a);p.set(l,a);c?c.parentNode.insertBefore(a,c.nextSibling):(c=q.head,c.insertBefore(a,c.firstChild))}Promise.all(h).then(u.bind(null,r,t,""),u.bind(null,r,t,"Resource failed to load"))};$RR("'
            ))
          : destination.push('$RR("')
        : 0 === (completedSegments.instructions & 2)
        ? ((completedSegments.instructions |= 2),
          destination.push(
            '$RC=function(b,c,e){c=document.getElementById(c);c.parentNode.removeChild(c);var a=document.getElementById(b);if(a){b=a.previousSibling;if(e)b.data="$!",a.setAttribute("data-dgst",e);else{e=b.parentNode;a=b.nextSibling;var f=0;do{if(a&&8===a.nodeType){var d=a.data;if("/$"===d)if(0===f)break;else f--;else"$"!==d&&"$?"!==d&&"$!"!==d||f++}d=a.nextSibling;e.removeChild(a);a=d}while(a);for(;c.firstChild;)e.insertBefore(c.firstChild,a);b.data="$"}b._reactRetry&&b._reactRetry()}};$RC("'
          ))
        : destination.push('$RC("'))
    : requiresStyleInsertion
    ? destination.push('<template data-rri="" data-bid="')
    : destination.push('<template data-rci="" data-bid="');
  if (null === i) throw Error(formatProdErrorMessage(395));
  contentSegmentID = contentSegmentID.toString(16);
  destination.push(i);
  scriptFormat ? destination.push('","') : destination.push('" data-sid="');
  destination.push(request.segmentPrefix);
  destination.push(contentSegmentID);
  requiresStyleInsertion
    ? scriptFormat
      ? (destination.push('",'),
        writeStyleResourceDependenciesInJS(destination, boundary))
      : (destination.push('" data-sty="'),
        writeStyleResourceDependenciesInAttr(destination, boundary))
    : scriptFormat && destination.push('"');
  request = scriptFormat
    ? destination.push(")\x3c/script>")
    : destination.push('"></template>');
  return writeBootstrap(destination, completedSegments) && request;
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
      throw Error(formatProdErrorMessage(392));
    return flushSegmentContainer(request, destination, segment);
  }
  flushSegmentContainer(request, destination, segment);
  boundary = request.resumableState;
  request = request.renderState;
  (segment = 0 === boundary.streamingFormat)
    ? (destination.push(request.startInlineScript),
      0 === (boundary.instructions & 1)
        ? ((boundary.instructions |= 1),
          destination.push(
            '$RS=function(a,b){a=document.getElementById(a);b=document.getElementById(b);for(a.parentNode.removeChild(a);a.firstChild;)b.parentNode.insertBefore(a.firstChild,b);b.parentNode.removeChild(b)};;$RS("'
          ))
        : destination.push('$RS("'))
    : destination.push('<template data-rsi="" data-sid="');
  destination.push(request.segmentPrefix);
  segmentID = segmentID.toString(16);
  destination.push(segmentID);
  segment ? destination.push('","') : destination.push('" data-pid="');
  destination.push(request.placeholderPrefix);
  destination.push(segmentID);
  destination = segment
    ? destination.push('")\x3c/script>')
    : destination.push('"></template>');
  return destination;
}
function flushCompletedQueues(request, destination) {
  try {
    var i,
      completedRootSegment = request.completedRootSegment;
    if (null !== completedRootSegment)
      if (0 === request.pendingRootTasks) {
        var resumableState = request.resumableState,
          renderState = request.renderState;
        if (
          0 !== request.allPendingTasks &&
          resumableState.externalRuntimeScript
        ) {
          var _resumableState$exter = resumableState.externalRuntimeScript,
            chunks = _resumableState$exter.chunks,
            key = "[script]" + _resumableState$exter.src,
            resource = resumableState.scriptsMap.get(key);
          resource ||
            ((resource = {
              type: "script",
              chunks: chunks,
              state: 0,
              props: null
            }),
            resumableState.scriptsMap.set(key, resource),
            resumableState.scripts.add(resource));
        }
        var htmlChunks = renderState.htmlChunks,
          headChunks = renderState.headChunks;
        _resumableState$exter = 0;
        if (htmlChunks) {
          for (
            _resumableState$exter = 0;
            _resumableState$exter < htmlChunks.length;
            _resumableState$exter++
          )
            destination.push(htmlChunks[_resumableState$exter]);
          if (headChunks)
            for (
              _resumableState$exter = 0;
              _resumableState$exter < headChunks.length;
              _resumableState$exter++
            )
              destination.push(headChunks[_resumableState$exter]);
          else {
            var chunk = startChunkForTag("head");
            destination.push(chunk);
            destination.push(">");
          }
        } else if (headChunks)
          for (
            _resumableState$exter = 0;
            _resumableState$exter < headChunks.length;
            _resumableState$exter++
          )
            destination.push(headChunks[_resumableState$exter]);
        var charsetChunks = renderState.charsetChunks;
        for (
          _resumableState$exter = 0;
          _resumableState$exter < charsetChunks.length;
          _resumableState$exter++
        )
          destination.push(charsetChunks[_resumableState$exter]);
        charsetChunks.length = 0;
        resumableState.preconnects.forEach(
          flushResourceInPreamble,
          destination
        );
        resumableState.preconnects.clear();
        var preconnectChunks = renderState.preconnectChunks;
        for (
          _resumableState$exter = 0;
          _resumableState$exter < preconnectChunks.length;
          _resumableState$exter++
        )
          destination.push(preconnectChunks[_resumableState$exter]);
        preconnectChunks.length = 0;
        resumableState.fontPreloads.forEach(
          flushResourceInPreamble,
          destination
        );
        resumableState.fontPreloads.clear();
        resumableState.highImagePreloads.forEach(
          flushResourceInPreamble,
          destination
        );
        resumableState.highImagePreloads.clear();
        resumableState.precedences.forEach(
          flushAllStylesInPreamble,
          destination
        );
        var importMapChunks = renderState.importMapChunks;
        for (
          _resumableState$exter = 0;
          _resumableState$exter < importMapChunks.length;
          _resumableState$exter++
        )
          destination.push(importMapChunks[_resumableState$exter]);
        importMapChunks.length = 0;
        resumableState.bootstrapScripts.forEach(
          flushResourceInPreamble,
          destination
        );
        resumableState.scripts.forEach(flushResourceInPreamble, destination);
        resumableState.scripts.clear();
        resumableState.bulkPreloads.forEach(
          flushResourceInPreamble,
          destination
        );
        resumableState.bulkPreloads.clear();
        var preloadChunks = renderState.preloadChunks;
        for (
          _resumableState$exter = 0;
          _resumableState$exter < preloadChunks.length;
          _resumableState$exter++
        )
          destination.push(preloadChunks[_resumableState$exter]);
        preloadChunks.length = 0;
        var hoistableChunks = renderState.hoistableChunks;
        for (
          _resumableState$exter = 0;
          _resumableState$exter < hoistableChunks.length;
          _resumableState$exter++
        )
          destination.push(hoistableChunks[_resumableState$exter]);
        hoistableChunks.length = 0;
        htmlChunks &&
          null === headChunks &&
          (destination.push("</"),
          destination.push("head"),
          destination.push(">"));
        flushSegment(request, destination, completedRootSegment);
        request.completedRootSegment = null;
        writeBootstrap(destination, request.resumableState);
      } else return;
    else if (0 < request.pendingRootTasks) return;
    var resumableState$jscomp$0 = request.resumableState,
      renderState$jscomp$0 = request.renderState;
    completedRootSegment = 0;
    resumableState$jscomp$0.preconnects.forEach(flushResourceLate, destination);
    resumableState$jscomp$0.preconnects.clear();
    var preconnectChunks$jscomp$0 = renderState$jscomp$0.preconnectChunks;
    for (
      completedRootSegment = 0;
      completedRootSegment < preconnectChunks$jscomp$0.length;
      completedRootSegment++
    )
      destination.push(preconnectChunks$jscomp$0[completedRootSegment]);
    preconnectChunks$jscomp$0.length = 0;
    resumableState$jscomp$0.fontPreloads.forEach(
      flushResourceLate,
      destination
    );
    resumableState$jscomp$0.fontPreloads.clear();
    resumableState$jscomp$0.highImagePreloads.forEach(
      flushResourceInPreamble,
      destination
    );
    resumableState$jscomp$0.highImagePreloads.clear();
    resumableState$jscomp$0.precedences.forEach(preloadLateStyles, destination);
    resumableState$jscomp$0.scripts.forEach(flushResourceLate, destination);
    resumableState$jscomp$0.scripts.clear();
    resumableState$jscomp$0.bulkPreloads.forEach(
      flushResourceLate,
      destination
    );
    resumableState$jscomp$0.bulkPreloads.clear();
    var preloadChunks$jscomp$0 = renderState$jscomp$0.preloadChunks;
    for (
      completedRootSegment = 0;
      completedRootSegment < preloadChunks$jscomp$0.length;
      completedRootSegment++
    )
      destination.push(preloadChunks$jscomp$0[completedRootSegment]);
    preloadChunks$jscomp$0.length = 0;
    var hoistableChunks$jscomp$0 = renderState$jscomp$0.hoistableChunks;
    for (
      completedRootSegment = 0;
      completedRootSegment < hoistableChunks$jscomp$0.length;
      completedRootSegment++
    )
      destination.push(hoistableChunks$jscomp$0[completedRootSegment]);
    hoistableChunks$jscomp$0.length = 0;
    var clientRenderedBoundaries = request.clientRenderedBoundaries;
    for (i = 0; i < clientRenderedBoundaries.length; i++) {
      var boundary = clientRenderedBoundaries[i];
      resumableState$jscomp$0 = destination;
      var resumableState$jscomp$1 = request.resumableState,
        boundaryID = boundary.id,
        errorDigest = boundary.errorDigest,
        errorMessage = boundary.errorMessage,
        errorComponentStack = boundary.errorComponentStack,
        scriptFormat = 0 === resumableState$jscomp$1.streamingFormat;
      scriptFormat
        ? (resumableState$jscomp$0.push(request.renderState.startInlineScript),
          0 === (resumableState$jscomp$1.instructions & 4)
            ? ((resumableState$jscomp$1.instructions |= 4),
              resumableState$jscomp$0.push(
                '$RX=function(b,c,d,e){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data="$!",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),b._reactRetry&&b._reactRetry())};;$RX("'
              ))
            : resumableState$jscomp$0.push('$RX("'))
        : resumableState$jscomp$0.push('<template data-rxi="" data-bid="');
      if (null === boundaryID) throw Error(formatProdErrorMessage(395));
      resumableState$jscomp$0.push(boundaryID);
      scriptFormat && resumableState$jscomp$0.push('"');
      if (errorDigest || errorMessage || errorComponentStack)
        if (scriptFormat) {
          resumableState$jscomp$0.push(",");
          var chunk$jscomp$0 = escapeJSStringsForInstructionScripts(
            errorDigest || ""
          );
          resumableState$jscomp$0.push(chunk$jscomp$0);
        } else {
          resumableState$jscomp$0.push('" data-dgst="');
          var chunk$jscomp$1 = escapeTextForBrowser(errorDigest || "");
          resumableState$jscomp$0.push(chunk$jscomp$1);
        }
      if (errorMessage || errorComponentStack)
        if (scriptFormat) {
          resumableState$jscomp$0.push(",");
          var chunk$jscomp$2 = escapeJSStringsForInstructionScripts(
            errorMessage || ""
          );
          resumableState$jscomp$0.push(chunk$jscomp$2);
        } else {
          resumableState$jscomp$0.push('" data-msg="');
          var chunk$jscomp$3 = escapeTextForBrowser(errorMessage || "");
          resumableState$jscomp$0.push(chunk$jscomp$3);
        }
      if (errorComponentStack)
        if (scriptFormat) {
          resumableState$jscomp$0.push(",");
          var chunk$jscomp$4 =
            escapeJSStringsForInstructionScripts(errorComponentStack);
          resumableState$jscomp$0.push(chunk$jscomp$4);
        } else {
          resumableState$jscomp$0.push('" data-stck="');
          var chunk$jscomp$5 = escapeTextForBrowser(errorComponentStack);
          resumableState$jscomp$0.push(chunk$jscomp$5);
        }
      if (
        scriptFormat
          ? !resumableState$jscomp$0.push(")\x3c/script>")
          : !resumableState$jscomp$0.push('"></template>')
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
      var boundary$16 = partialBoundaries[i];
      a: {
        clientRenderedBoundaries = request;
        boundary = destination;
        clientRenderedBoundaries.renderState.boundaryResources =
          boundary$16.resources;
        var completedSegments = boundary$16.completedSegments;
        for (
          resumableState$jscomp$1 = 0;
          resumableState$jscomp$1 < completedSegments.length;
          resumableState$jscomp$1++
        )
          if (
            !flushPartiallyCompletedSegment(
              clientRenderedBoundaries,
              boundary,
              boundary$16,
              completedSegments[resumableState$jscomp$1]
            )
          ) {
            resumableState$jscomp$1++;
            completedSegments.splice(0, resumableState$jscomp$1);
            var JSCompiler_inline_result = !1;
            break a;
          }
        completedSegments.splice(0, resumableState$jscomp$1);
        JSCompiler_inline_result = writeResourcesForBoundary(
          boundary,
          boundary$16.resources,
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
      (request = request.resumableState),
      request.hasBody &&
        (destination.push("</"),
        destination.push("body"),
        destination.push(">")),
      request.hasHtml &&
        (destination.push("</"),
        destination.push("html"),
        destination.push(">")),
      destination.push(null));
  }
}
function enqueueFlush(request) {
  if (
    !1 === request.flushScheduled &&
    0 === request.pingedTasks.length &&
    null !== request.destination
  ) {
    var destination = request.destination;
    request.flushScheduled = !0;
    flushCompletedQueues(request, destination);
  }
}
function abort(request, reason) {
  try {
    var abortableTasks = request.abortableTasks;
    if (0 < abortableTasks.size) {
      var error =
        void 0 === reason ? Error(formatProdErrorMessage(432)) : reason;
      abortableTasks.forEach(function (task) {
        return abortTask(task, request, error);
      });
      abortableTasks.clear();
    }
    null !== request.destination &&
      flushCompletedQueues(request, request.destination);
  } catch (error$18) {
    logRecoverableError(request, error$18), fatalError(request, error$18);
  }
}
function onError() {}
function renderToStringImpl(
  children,
  options,
  generateStaticMarkup,
  abortReason
) {
  var didFatal = !1,
    fatalError$jscomp$0 = null,
    result = "",
    destination = {
      push: function (chunk) {
        null !== chunk && (result += chunk);
        return !0;
      },
      destroy: function (error) {
        didFatal = !0;
        fatalError$jscomp$0 = error;
      }
    },
    readyToStream = !1;
  options = createResumableState(
    options ? options.identifierPrefix : void 0,
    void 0,
    void 0,
    void 0,
    void 0,
    void 0
  );
  children = createRequest(
    children,
    options,
    createRenderState(options, void 0, generateStaticMarkup),
    createFormatContext(0, null, 0),
    Infinity,
    onError,
    void 0,
    function () {
      readyToStream = !0;
    },
    void 0,
    void 0,
    void 0
  );
  children.flushScheduled = null !== children.destination;
  performWork(children);
  abort(children, abortReason);
  if (1 === children.status)
    (children.status = 2), destination.destroy(children.fatalError);
  else if (2 !== children.status && null === children.destination) {
    children.destination = destination;
    try {
      flushCompletedQueues(children, destination);
    } catch (error) {
      logRecoverableError(children, error), fatalError(children, error);
    }
  }
  if (didFatal && fatalError$jscomp$0 !== abortReason)
    throw fatalError$jscomp$0;
  if (!readyToStream) throw Error(formatProdErrorMessage(426));
  return result;
}
exports.renderToNodeStream = function () {
  throw Error(formatProdErrorMessage(207));
};
exports.renderToStaticMarkup = function (children, options) {
  return renderToStringImpl(
    children,
    options,
    !0,
    'The server used "renderToStaticMarkup" which does not support Suspense. If you intended to have the server wait for the suspended component please switch to "renderToReadableStream" which supports Suspense on the server'
  );
};
exports.renderToStaticNodeStream = function () {
  throw Error(formatProdErrorMessage(208));
};
exports.renderToString = function (children, options) {
  return renderToStringImpl(
    children,
    options,
    !1,
    'The server used "renderToString" which does not support Suspense. If you intended for this Suspense boundary to render the fallback content on the server consider throwing an Error somewhere within the Suspense boundary. If you intended to have the server wait for the suspended component please switch to "renderToReadableStream" which supports Suspense on the server'
  );
};
exports.version = "18.3.0-www-modern-2eb07bc4";
