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
function writeChunk(destination, chunk) {
  destination.push(chunk);
}
var assign = Object.assign,
  enableFilterEmptyStringAttributesDOM =
    require("ReactFeatureFlags").enableFilterEmptyStringAttributesDOM,
  hasOwnProperty = Object.prototype.hasOwnProperty,
  VALID_ATTRIBUTE_NAME_REGEX =
    /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
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
function PropertyInfoRecord(
  name,
  type,
  mustUseProperty,
  attributeName,
  attributeNamespace,
  sanitizeURL,
  removeEmptyString
) {
  this.acceptsBooleans = 2 === type || 3 === type || 4 === type;
  this.attributeName = attributeName;
  this.attributeNamespace = attributeNamespace;
  this.mustUseProperty = mustUseProperty;
  this.propertyName = name;
  this.type = type;
  this.sanitizeURL = sanitizeURL;
  this.removeEmptyString = removeEmptyString;
}
var properties = {},
  reservedProps =
    "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(
      " "
    );
reservedProps.push("innerText", "textContent");
reservedProps.forEach(function (name) {
  properties[name] = new PropertyInfoRecord(name, 0, !1, name, null, !1, !1);
});
[
  ["acceptCharset", "accept-charset"],
  ["className", "class"],
  ["htmlFor", "for"],
  ["httpEquiv", "http-equiv"]
].forEach(function (_ref) {
  var name = _ref[0];
  properties[name] = new PropertyInfoRecord(name, 1, !1, _ref[1], null, !1, !1);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function (
  name
) {
  properties[name] = new PropertyInfoRecord(
    name,
    2,
    !1,
    name.toLowerCase(),
    null,
    !1,
    !1
  );
});
[
  "autoReverse",
  "externalResourcesRequired",
  "focusable",
  "preserveAlpha"
].forEach(function (name) {
  properties[name] = new PropertyInfoRecord(name, 2, !1, name, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope"
  .split(" ")
  .forEach(function (name) {
    properties[name] = new PropertyInfoRecord(
      name,
      3,
      !1,
      name.toLowerCase(),
      null,
      !1,
      !1
    );
  });
["checked", "multiple", "muted", "selected"].forEach(function (name) {
  properties[name] = new PropertyInfoRecord(name, 3, !0, name, null, !1, !1);
});
["capture", "download"].forEach(function (name) {
  properties[name] = new PropertyInfoRecord(name, 4, !1, name, null, !1, !1);
});
["cols", "rows", "size", "span"].forEach(function (name) {
  properties[name] = new PropertyInfoRecord(name, 6, !1, name, null, !1, !1);
});
["rowSpan", "start"].forEach(function (name) {
  properties[name] = new PropertyInfoRecord(
    name,
    5,
    !1,
    name.toLowerCase(),
    null,
    !1,
    !1
  );
});
var CAMELIZE = /[\-:]([a-z])/g;
function capitalize(token) {
  return token[1].toUpperCase();
}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering transform-origin underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height"
  .split(" ")
  .forEach(function (attributeName) {
    var name = attributeName.replace(CAMELIZE, capitalize);
    properties[name] = new PropertyInfoRecord(
      name,
      1,
      !1,
      attributeName,
      null,
      !1,
      !1
    );
  });
"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type"
  .split(" ")
  .forEach(function (attributeName) {
    var name = attributeName.replace(CAMELIZE, capitalize);
    properties[name] = new PropertyInfoRecord(
      name,
      1,
      !1,
      attributeName,
      "http://www.w3.org/1999/xlink",
      !1,
      !1
    );
  });
["xml:base", "xml:lang", "xml:space"].forEach(function (attributeName) {
  var name = attributeName.replace(CAMELIZE, capitalize);
  properties[name] = new PropertyInfoRecord(
    name,
    1,
    !1,
    attributeName,
    "http://www.w3.org/XML/1998/namespace",
    !1,
    !1
  );
});
["tabIndex", "crossOrigin"].forEach(function (attributeName) {
  properties[attributeName] = new PropertyInfoRecord(
    attributeName,
    1,
    !1,
    attributeName.toLowerCase(),
    null,
    !1,
    !1
  );
});
properties.xlinkHref = new PropertyInfoRecord(
  "xlinkHref",
  1,
  !1,
  "xlink:href",
  "http://www.w3.org/1999/xlink",
  !0,
  !1
);
["src", "href", "action", "formAction"].forEach(function (attributeName) {
  properties[attributeName] = new PropertyInfoRecord(
    attributeName,
    1,
    !1,
    attributeName.toLowerCase(),
    null,
    !0,
    !0
  );
});
var isUnitlessNumber = {
    animationIterationCount: !0,
    aspectRatio: !0,
    borderImageOutset: !0,
    borderImageSlice: !0,
    borderImageWidth: !0,
    boxFlex: !0,
    boxFlexGroup: !0,
    boxOrdinalGroup: !0,
    columnCount: !0,
    columns: !0,
    flex: !0,
    flexGrow: !0,
    flexPositive: !0,
    flexShrink: !0,
    flexNegative: !0,
    flexOrder: !0,
    gridArea: !0,
    gridRow: !0,
    gridRowEnd: !0,
    gridRowSpan: !0,
    gridRowStart: !0,
    gridColumn: !0,
    gridColumnEnd: !0,
    gridColumnSpan: !0,
    gridColumnStart: !0,
    fontWeight: !0,
    lineClamp: !0,
    lineHeight: !0,
    opacity: !0,
    order: !0,
    orphans: !0,
    tabSize: !0,
    widows: !0,
    zIndex: !0,
    zoom: !0,
    fillOpacity: !0,
    floodOpacity: !0,
    stopOpacity: !0,
    strokeDasharray: !0,
    strokeDashoffset: !0,
    strokeMiterlimit: !0,
    strokeOpacity: !0,
    strokeWidth: !0
  },
  prefixes = ["Webkit", "ms", "Moz", "O"];
Object.keys(isUnitlessNumber).forEach(function (prop) {
  prefixes.forEach(function (prefix) {
    prefix = prefix + prop.charAt(0).toUpperCase() + prop.substring(1);
    isUnitlessNumber[prefix] = isUnitlessNumber[prop];
  });
});
var matchHtmlRegExp = /["'&<>]/;
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
      lastIndex !== index && (html += text.substring(lastIndex, index));
      lastIndex = index + 1;
      html += match;
    }
    text = lastIndex !== index ? html + text.substring(lastIndex, index) : html;
  }
  return text;
}
var uppercasePattern = /([A-Z])/g,
  msPattern = /^ms-/,
  isJavaScriptProtocol =
    /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
function sanitizeURL(url) {
  if (isJavaScriptProtocol.test(url)) throw Error(formatProdErrorMessage(323));
}
var isArrayImpl = Array.isArray,
  ReactDOMCurrentDispatcher =
    ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Dispatcher,
  ReactDOMServerDispatcher = { preload: preload, preinit: preinit },
  currentResources = null,
  currentResourcesStack = [];
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
      return createFormatContext(2, null, !0);
    case "select":
      return createFormatContext(
        2,
        null != props.value ? props.value : props.defaultValue,
        parentContext.noscriptTagInScope
      );
    case "svg":
      return createFormatContext(3, null, parentContext.noscriptTagInScope);
    case "math":
      return createFormatContext(4, null, parentContext.noscriptTagInScope);
    case "foreignObject":
      return createFormatContext(2, null, parentContext.noscriptTagInScope);
    case "table":
      return createFormatContext(5, null, parentContext.noscriptTagInScope);
    case "thead":
    case "tbody":
    case "tfoot":
      return createFormatContext(6, null, parentContext.noscriptTagInScope);
    case "colgroup":
      return createFormatContext(8, null, parentContext.noscriptTagInScope);
    case "tr":
      return createFormatContext(7, null, parentContext.noscriptTagInScope);
  }
  return 5 <= parentContext.insertionMode
    ? createFormatContext(2, null, parentContext.noscriptTagInScope)
    : 0 === parentContext.insertionMode
    ? "html" === type
      ? createFormatContext(1, null, !1)
      : createFormatContext(2, null, !1)
    : 1 === parentContext.insertionMode
    ? createFormatContext(2, null, !1)
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
        } else {
          nameChunk = styleName;
          var chunk = styleNameCache.get(nameChunk);
          void 0 !== chunk
            ? (nameChunk = chunk)
            : ((chunk = escapeTextForBrowser(
                nameChunk
                  .replace(uppercasePattern, "-$1")
                  .toLowerCase()
                  .replace(msPattern, "-ms-")
              )),
              styleNameCache.set(nameChunk, chunk),
              (nameChunk = chunk));
          styleValue =
            "number" === typeof styleValue
              ? 0 === styleValue ||
                hasOwnProperty.call(isUnitlessNumber, styleName)
                ? "" + styleValue
                : styleValue + "px"
              : escapeTextForBrowser(("" + styleValue).trim());
        }
        isFirst
          ? ((isFirst = !1),
            target.push(' style="', nameChunk, ":", styleValue))
          : target.push(";", nameChunk, ":", styleValue);
      }
    }
  isFirst || target.push('"');
}
function pushAttribute(target, name, value) {
  switch (name) {
    case "style":
      pushStyleAttribute(target, value);
      return;
    case "defaultValue":
    case "defaultChecked":
    case "innerHTML":
    case "suppressContentEditableWarning":
    case "suppressHydrationWarning":
      return;
  }
  if (
    !(2 < name.length) ||
    ("o" !== name[0] && "O" !== name[0]) ||
    ("n" !== name[1] && "N" !== name[1])
  ) {
    var JSCompiler_inline_result = properties.hasOwnProperty(name)
      ? properties[name]
      : null;
    if (null !== JSCompiler_inline_result) {
      switch (typeof value) {
        case "function":
        case "symbol":
          return;
        case "boolean":
          if (!JSCompiler_inline_result.acceptsBooleans) return;
      }
      if (
        !enableFilterEmptyStringAttributesDOM ||
        !JSCompiler_inline_result.removeEmptyString ||
        "" !== value
      )
        switch (
          ((name = JSCompiler_inline_result.attributeName),
          JSCompiler_inline_result.type)
        ) {
          case 3:
            value && target.push(" ", name, '=""');
            break;
          case 4:
            !0 === value
              ? target.push(" ", name, '=""')
              : !1 !== value &&
                target.push(" ", name, '="', escapeTextForBrowser(value), '"');
            break;
          case 5:
            isNaN(value) ||
              target.push(" ", name, '="', escapeTextForBrowser(value), '"');
            break;
          case 6:
            !isNaN(value) &&
              1 <= value &&
              target.push(" ", name, '="', escapeTextForBrowser(value), '"');
            break;
          default:
            JSCompiler_inline_result.sanitizeURL &&
              ((value = "" + value), sanitizeURL(value)),
              target.push(" ", name, '="', escapeTextForBrowser(value), '"');
        }
    } else if (isAttributeNameSafe(name)) {
      switch (typeof value) {
        case "function":
        case "symbol":
          return;
        case "boolean":
          if (
            ((JSCompiler_inline_result = name.toLowerCase().slice(0, 5)),
            "data-" !== JSCompiler_inline_result &&
              "aria-" !== JSCompiler_inline_result)
          )
            return;
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
  responseState,
  resources,
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
    "string" !== typeof rel ||
    "string" !== typeof href ||
    "" === href
  )
    return pushLinkImpl(target, props), null;
  if ("stylesheet" === props.rel) {
    responseState = "[style]" + href;
    if (
      "string" !== typeof precedence ||
      null != props.disabled ||
      props.onLoad ||
      props.onError
    )
      return (
        (textEmbedded = resources.preloadsMap.get(responseState)),
        textEmbedded ||
          ((textEmbedded = {
            type: "preload",
            chunks: [],
            state: 0,
            props: preloadAsStylePropsFromProps(href, props)
          }),
          resources.preloadsMap.set(responseState, textEmbedded)),
        pushLinkImpl(textEmbedded.chunks, textEmbedded.props),
        resources.usedStylesheets.add(textEmbedded),
        pushLinkImpl(target, props)
      );
    href = resources.stylesMap.get(responseState);
    if (!href) {
      props = assign({}, props, {
        "data-precedence": props.precedence,
        precedence: null
      });
      if ((href = resources.preloadsMap.get(responseState)))
        (href.state |= 4),
          (href = href.props),
          null == props.crossOrigin && (props.crossOrigin = href.crossOrigin),
          null == props.integrity && (props.integrity = href.integrity);
      href = {
        type: "stylesheet",
        chunks: [],
        state: resources.boundaryResources ? 4 : 0,
        props: props
      };
      resources.stylesMap.set(responseState, href);
      props = resources.precedences.get(precedence);
      props ||
        ((props = new Set()), resources.precedences.set(precedence, props));
      props.add(href);
    }
    resources.boundaryResources && resources.boundaryResources.add(href);
    textEmbedded && target.push("\x3c!-- --\x3e");
    return null;
  }
  if (props.onLoad || props.onError) return pushLinkImpl(target, props);
  textEmbedded && target.push("\x3c!-- --\x3e");
  switch (props.rel) {
    case "preconnect":
    case "dns-prefetch":
      return pushLinkImpl(responseState.preconnectChunks, props);
    case "preload":
      return pushLinkImpl(responseState.preloadChunks, props);
    default:
      return pushLinkImpl(responseState.hoistableChunks, props);
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
function pushStyleImpl(target, props) {
  target.push(startChunkForTag("style"));
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
  target.push("</", "style", ">");
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
  target,
  type,
  props,
  resources,
  responseState,
  formatContext,
  textEmbedded
) {
  switch (type) {
    case "select":
      target.push(startChunkForTag("select"));
      resources = textEmbedded = null;
      for (var propKey in props)
        if (hasOwnProperty.call(props, propKey)) {
          var propValue = props[propKey];
          if (null != propValue)
            switch (propKey) {
              case "children":
                textEmbedded = propValue;
                break;
              case "dangerouslySetInnerHTML":
                resources = propValue;
                break;
              case "defaultValue":
              case "value":
                break;
              default:
                pushAttribute(target, propKey, propValue);
            }
        }
      target.push(">");
      pushInnerHTML(target, resources, textEmbedded);
      return textEmbedded;
    case "option":
      textEmbedded = formatContext.selectedValue;
      target.push(startChunkForTag("option"));
      var value = (resources = null),
        innerHTML = (propKey = null);
      for (propValue in props)
        if (hasOwnProperty.call(props, propValue)) {
          var propValue$jscomp$0 = props[propValue];
          if (null != propValue$jscomp$0)
            switch (propValue) {
              case "children":
                resources = propValue$jscomp$0;
                break;
              case "selected":
                propKey = propValue$jscomp$0;
                break;
              case "dangerouslySetInnerHTML":
                innerHTML = propValue$jscomp$0;
                break;
              case "value":
                value = propValue$jscomp$0;
              default:
                pushAttribute(target, propValue, propValue$jscomp$0);
            }
        }
      if (null != textEmbedded)
        if (
          ((props =
            null !== value ? "" + value : flattenOptionChildren(resources)),
          isArrayImpl(textEmbedded))
        )
          for (propValue = 0; propValue < textEmbedded.length; propValue++) {
            if ("" + textEmbedded[propValue] === props) {
              target.push(' selected=""');
              break;
            }
          }
        else "" + textEmbedded === props && target.push(' selected=""');
      else propKey && target.push(' selected=""');
      target.push(">");
      pushInnerHTML(target, innerHTML, resources);
      return resources;
    case "textarea":
      target.push(startChunkForTag("textarea"));
      propValue = resources = textEmbedded = null;
      for (value in props)
        if (
          hasOwnProperty.call(props, value) &&
          ((innerHTML = props[value]), null != innerHTML)
        )
          switch (value) {
            case "children":
              propValue = innerHTML;
              break;
            case "value":
              textEmbedded = innerHTML;
              break;
            case "defaultValue":
              resources = innerHTML;
              break;
            case "dangerouslySetInnerHTML":
              throw Error(formatProdErrorMessage(91));
            default:
              pushAttribute(target, value, innerHTML);
          }
      null === textEmbedded && null !== resources && (textEmbedded = resources);
      target.push(">");
      if (null != propValue) {
        if (null != textEmbedded) throw Error(formatProdErrorMessage(92));
        if (isArrayImpl(propValue) && 1 < propValue.length)
          throw Error(formatProdErrorMessage(93));
        textEmbedded = "" + propValue;
      }
      "string" === typeof textEmbedded &&
        "\n" === textEmbedded[0] &&
        target.push("\n");
      null !== textEmbedded &&
        target.push(escapeTextForBrowser("" + textEmbedded));
      return null;
    case "input":
      target.push(startChunkForTag("input"));
      value = propValue = resources = textEmbedded = null;
      for (innerHTML in props)
        if (
          hasOwnProperty.call(props, innerHTML) &&
          ((propKey = props[innerHTML]), null != propKey)
        )
          switch (innerHTML) {
            case "children":
            case "dangerouslySetInnerHTML":
              throw Error(formatProdErrorMessage(399, "input"));
            case "defaultChecked":
              value = propKey;
              break;
            case "defaultValue":
              resources = propKey;
              break;
            case "checked":
              propValue = propKey;
              break;
            case "value":
              textEmbedded = propKey;
              break;
            default:
              pushAttribute(target, innerHTML, propKey);
          }
      null !== propValue
        ? pushAttribute(target, "checked", propValue)
        : null !== value && pushAttribute(target, "checked", value);
      null !== textEmbedded
        ? pushAttribute(target, "value", textEmbedded)
        : null !== resources && pushAttribute(target, "value", resources);
      target.push("/>");
      return null;
    case "menuitem":
      target.push(startChunkForTag("menuitem"));
      for (var propKey$jscomp$0 in props)
        if (
          hasOwnProperty.call(props, propKey$jscomp$0) &&
          ((textEmbedded = props[propKey$jscomp$0]), null != textEmbedded)
        )
          switch (propKey$jscomp$0) {
            case "children":
            case "dangerouslySetInnerHTML":
              throw Error(formatProdErrorMessage(400));
            default:
              pushAttribute(target, propKey$jscomp$0, textEmbedded);
          }
      target.push(">");
      return null;
    case "title":
      return (
        3 === formatContext.insertionMode || formatContext.noscriptTagInScope
          ? (target = pushTitleImpl(target, props))
          : (pushTitleImpl(responseState.hoistableChunks, props),
            (target = null)),
        target
      );
    case "link":
      return pushLink(
        target,
        props,
        responseState,
        resources,
        textEmbedded,
        formatContext.insertionMode,
        formatContext.noscriptTagInScope
      );
    case "script":
      a: if (
        3 === formatContext.insertionMode ||
        formatContext.noscriptTagInScope ||
        "string" !== typeof props.src ||
        !props.src
      )
        target = pushScriptImpl(target, props);
      else {
        value = "[script]" + props.src;
        if (!0 !== props.async || props.onLoad || props.onError) {
          if (
            ((propValue = resources.preloadsMap.get(value)),
            propValue ||
              ((propValue = {
                type: "preload",
                chunks: [],
                state: 0,
                props: {
                  rel: "preload",
                  as: "script",
                  href: props.src,
                  crossOrigin: props.crossOrigin,
                  integrity: props.integrity,
                  referrerPolicy: props.referrerPolicy
                }
              }),
              resources.preloadsMap.set(value, propValue),
              resources.usedScripts.add(propValue),
              pushLinkImpl(propValue.chunks, propValue.props)),
            !0 !== props.async)
          ) {
            pushScriptImpl(target, props);
            target = null;
            break a;
          }
        } else if (
          ((propValue = resources.scriptsMap.get(value)), !propValue)
        ) {
          propValue = { type: "script", chunks: [], state: 0, props: null };
          resources.scriptsMap.set(value, propValue);
          resources.scripts.add(propValue);
          innerHTML = props;
          if ((resources = resources.preloadsMap.get(value)))
            (resources.state |= 4),
              (props = innerHTML = assign({}, props)),
              (resources = resources.props),
              null == props.crossOrigin &&
                (props.crossOrigin = resources.crossOrigin),
              null == props.integrity &&
                (props.integrity = resources.integrity);
          pushScriptImpl(propValue.chunks, innerHTML);
        }
        textEmbedded && target.push("\x3c!-- --\x3e");
        target = null;
      }
      return target;
    case "style":
      return (
        (propValue = props.precedence),
        (innerHTML = props.href),
        3 === formatContext.insertionMode ||
        formatContext.noscriptTagInScope ||
        "string" !== typeof propValue ||
        "string" !== typeof innerHTML ||
        "" === innerHTML
          ? (target = pushStyleImpl(target, props))
          : ((value = "[style]" + innerHTML),
            (innerHTML = resources.stylesMap.get(value)),
            innerHTML ||
              ((innerHTML = {
                type: "style",
                chunks: [],
                state: resources.boundaryResources ? 4 : 0,
                props: assign({}, props, {
                  "data-precedence": props.precedence,
                  precedence: null,
                  "data-href": props.href,
                  href: null
                })
              }),
              resources.stylesMap.set(value, innerHTML),
              pushStyleImpl(innerHTML.chunks, innerHTML.props),
              (props = resources.precedences.get(propValue)),
              props ||
                ((props = new Set()),
                resources.precedences.set(propValue, props)),
              props.add(innerHTML),
              resources.boundaryResources &&
                resources.boundaryResources.add(innerHTML)),
            textEmbedded && target.push("\x3c!-- --\x3e"),
            (target = void 0)),
        target
      );
    case "meta":
      return (
        3 === formatContext.insertionMode || formatContext.noscriptTagInScope
          ? (target = pushSelfClosing(target, props, "meta"))
          : (textEmbedded && target.push("\x3c!-- --\x3e"),
            (target =
              "string" === typeof props.charSet
                ? pushSelfClosing(responseState.charsetChunks, props, "meta")
                : pushSelfClosing(
                    responseState.hoistableChunks,
                    props,
                    "meta"
                  ))),
        target
      );
    case "listing":
    case "pre":
      target.push(startChunkForTag(type));
      resources = textEmbedded = null;
      for (propValue$jscomp$0 in props)
        if (
          hasOwnProperty.call(props, propValue$jscomp$0) &&
          ((propValue = props[propValue$jscomp$0]), null != propValue)
        )
          switch (propValue$jscomp$0) {
            case "children":
              textEmbedded = propValue;
              break;
            case "dangerouslySetInnerHTML":
              resources = propValue;
              break;
            default:
              pushAttribute(target, propValue$jscomp$0, propValue);
          }
      target.push(">");
      if (null != resources) {
        if (null != textEmbedded) throw Error(formatProdErrorMessage(60));
        if ("object" !== typeof resources || !("__html" in resources))
          throw Error(formatProdErrorMessage(61));
        props = resources.__html;
        null !== props &&
          void 0 !== props &&
          ("string" === typeof props && 0 < props.length && "\n" === props[0]
            ? target.push("\n", props)
            : target.push("" + props));
      }
      "string" === typeof textEmbedded &&
        "\n" === textEmbedded[0] &&
        target.push("\n");
      return textEmbedded;
    case "base":
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
    case "wbr":
      return pushSelfClosing(target, props, type);
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return pushStartGenericElement(target, props, type);
    case "head":
      return (
        2 > formatContext.insertionMode && null === responseState.headChunks
          ? ((responseState.headChunks = []),
            (target = pushStartGenericElement(
              responseState.headChunks,
              props,
              "head"
            )))
          : (target = pushStartGenericElement(target, props, "head")),
        target
      );
    case "html":
      return (
        0 === formatContext.insertionMode && null === responseState.htmlChunks
          ? ((responseState.htmlChunks = ["<!DOCTYPE html>"]),
            (target = pushStartGenericElement(
              responseState.htmlChunks,
              props,
              "html"
            )))
          : (target = pushStartGenericElement(target, props, "html")),
        target
      );
    default:
      if (-1 === type.indexOf("-") && "string" !== typeof props.is)
        return pushStartGenericElement(target, props, type);
      target.push(startChunkForTag(type));
      resources = textEmbedded = null;
      for (var propKey$jscomp$1 in props)
        if (
          hasOwnProperty.call(props, propKey$jscomp$1) &&
          ((propValue = props[propKey$jscomp$1]),
          null != propValue &&
            "function" !== typeof propValue &&
            "object" !== typeof propValue &&
            !1 !== propValue)
        )
          switch (
            (!0 === propValue && (propValue = ""),
            "className" === propKey$jscomp$1 && (propKey$jscomp$1 = "class"),
            propKey$jscomp$1)
          ) {
            case "children":
              textEmbedded = propValue;
              break;
            case "dangerouslySetInnerHTML":
              resources = propValue;
              break;
            case "style":
              pushStyleAttribute(target, propValue);
              break;
            case "suppressContentEditableWarning":
            case "suppressHydrationWarning":
              break;
            default:
              isAttributeNameSafe(propKey$jscomp$1) &&
                "function" !== typeof propValue &&
                "symbol" !== typeof propValue &&
                target.push(
                  " ",
                  propKey$jscomp$1,
                  '="',
                  escapeTextForBrowser(propValue),
                  '"'
                );
          }
      target.push(">");
      pushInnerHTML(target, resources, textEmbedded);
      return textEmbedded;
  }
}
function writeStartPendingSuspenseBoundary(destination, responseState, id) {
  destination.push('\x3c!--$?--\x3e<template id="');
  if (null === id) throw Error(formatProdErrorMessage(395));
  destination.push(id);
  return destination.push('"></template>');
}
function writeStartSegment(destination, responseState, formatContext, id) {
  switch (formatContext.insertionMode) {
    case 0:
    case 1:
    case 2:
      return (
        destination.push('<div hidden id="'),
        destination.push(responseState.segmentPrefix),
        (responseState = id.toString(16)),
        destination.push(responseState),
        destination.push('">')
      );
    case 3:
      return (
        destination.push('<svg aria-hidden="true" style="display:none" id="'),
        destination.push(responseState.segmentPrefix),
        (responseState = id.toString(16)),
        destination.push(responseState),
        destination.push('">')
      );
    case 4:
      return (
        destination.push('<math aria-hidden="true" style="display:none" id="'),
        destination.push(responseState.segmentPrefix),
        (responseState = id.toString(16)),
        destination.push(responseState),
        destination.push('">')
      );
    case 5:
      return (
        destination.push('<table hidden id="'),
        destination.push(responseState.segmentPrefix),
        (responseState = id.toString(16)),
        destination.push(responseState),
        destination.push('">')
      );
    case 6:
      return (
        destination.push('<table hidden><tbody id="'),
        destination.push(responseState.segmentPrefix),
        (responseState = id.toString(16)),
        destination.push(responseState),
        destination.push('">')
      );
    case 7:
      return (
        destination.push('<table hidden><tr id="'),
        destination.push(responseState.segmentPrefix),
        (responseState = id.toString(16)),
        destination.push(responseState),
        destination.push('">')
      );
    case 8:
      return (
        destination.push('<table hidden><colgroup id="'),
        destination.push(responseState.segmentPrefix),
        (responseState = id.toString(16)),
        destination.push(responseState),
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
var didWrite = !1;
function flushStyleTagsLateForBoundary(resource) {
  if ("style" === resource.type && 0 === (resource.state & 3)) {
    !1 === didWrite &&
      ((didWrite = !0), this.push('<template data-precedence="">'));
    for (var chunks = resource.chunks, i = 0; i < chunks.length; i++)
      this.push(chunks[i]);
    resource.state |= 2;
  }
}
function writeResourcesForBoundary(destination, boundaryResources) {
  didWrite = !1;
  boundaryResources.forEach(flushStyleTagsLateForBoundary, destination);
  return didWrite ? destination.push("</template>") : !0;
}
function flushResourceInPreamble(resource) {
  if (0 === (resource.state & 7)) {
    for (var chunks = resource.chunks, i = 0; i < chunks.length; i++)
      this.push(chunks[i]);
    resource.state |= 1;
  }
}
function flushResourceLate(resource) {
  if (0 === (resource.state & 3)) {
    for (var chunks = resource.chunks, i = 0; i < chunks.length; i++)
      this.push(chunks[i]);
    resource.state |= 2;
  }
}
var didFlush = !1;
function flushUnblockedStyle(resource, key, set) {
  key = resource.chunks;
  if (resource.state & 3) set.delete(resource);
  else if (!(resource.state & 4)) {
    didFlush = !0;
    "stylesheet" === resource.type && pushLinkImpl(key, resource.props);
    for (var i = 0; i < key.length; i++) this.push(key[i]);
    resource.state |= 1;
    set.delete(resource);
  }
}
function flushUnblockedStyles(set, precedence) {
  didFlush = !1;
  set.forEach(flushUnblockedStyle, this);
  didFlush ||
    (this.push('<style data-precedence="'),
    (set = escapeTextForBrowser(precedence)),
    this.push(set),
    this.push('"></style>'));
}
function preloadBlockedStyle(resource) {
  if ("style" !== resource.type) {
    var chunks = resource.chunks,
      preloadProps = preloadAsStylePropsFromProps(
        resource.props.href,
        resource.props
      );
    pushLinkImpl(chunks, preloadProps);
    for (preloadProps = 0; preloadProps < chunks.length; preloadProps++)
      this.push(chunks[preloadProps]);
    resource.state |= 8;
    chunks.length = 0;
  }
}
function preloadBlockedStyles(set) {
  set.forEach(preloadBlockedStyle, this);
  set.clear();
}
function preloadLateStyle(resource) {
  if ("style" !== resource.type) {
    var chunks = resource.chunks,
      preloadProps = preloadAsStylePropsFromProps(
        resource.props.href,
        resource.props
      );
    pushLinkImpl(chunks, preloadProps);
    for (preloadProps = 0; preloadProps < chunks.length; preloadProps++)
      this.push(chunks[preloadProps]);
    resource.state |= 8;
    chunks.length = 0;
  }
}
function preloadLateStyles(set) {
  set.forEach(preloadLateStyle, this);
  set.clear();
}
function writePreamble(
  destination,
  resources,
  responseState,
  willFlushAllSegments
) {
  !willFlushAllSegments &&
    responseState.externalRuntimeConfig &&
    ((willFlushAllSegments = responseState.externalRuntimeConfig),
    preinitImpl(resources, willFlushAllSegments.src, {
      as: "script",
      integrity: willFlushAllSegments.integrity
    }));
  willFlushAllSegments = responseState.htmlChunks;
  var headChunks = responseState.headChunks,
    i = 0;
  if (willFlushAllSegments) {
    for (i = 0; i < willFlushAllSegments.length; i++)
      destination.push(willFlushAllSegments[i]);
    if (headChunks)
      for (i = 0; i < headChunks.length; i++) destination.push(headChunks[i]);
    else
      writeChunk(destination, startChunkForTag("head")), destination.push(">");
  } else if (headChunks)
    for (i = 0; i < headChunks.length; i++) destination.push(headChunks[i]);
  var charsetChunks = responseState.charsetChunks;
  for (i = 0; i < charsetChunks.length; i++) destination.push(charsetChunks[i]);
  charsetChunks.length = 0;
  charsetChunks = responseState.preconnectChunks;
  for (i = 0; i < charsetChunks.length; i++) destination.push(charsetChunks[i]);
  charsetChunks.length = 0;
  resources.fontPreloads.forEach(flushResourceInPreamble, destination);
  resources.fontPreloads.clear();
  resources.precedences.forEach(flushUnblockedStyles, destination);
  resources.precedences.forEach(preloadBlockedStyles, destination);
  resources.usedStylesheets.forEach(function (resource) {
    if (
      !resources.stylesMap.has(
        "[" + resource.props.as + "]" + resource.props.href
      )
    )
      for (resource = resource.chunks, i = 0; i < resource.length; i++)
        destination.push(resource[i]);
  });
  resources.usedStylesheets.clear();
  resources.scripts.forEach(flushResourceInPreamble, destination);
  resources.scripts.clear();
  resources.usedScripts.forEach(flushResourceInPreamble, destination);
  resources.usedScripts.clear();
  resources.explicitStylesheetPreloads.forEach(
    flushResourceInPreamble,
    destination
  );
  resources.explicitStylesheetPreloads.clear();
  resources.explicitScriptPreloads.forEach(
    flushResourceInPreamble,
    destination
  );
  resources.explicitScriptPreloads.clear();
  resources.explicitOtherPreloads.forEach(flushResourceInPreamble, destination);
  resources.explicitOtherPreloads.clear();
  charsetChunks = responseState.preloadChunks;
  for (i = 0; i < charsetChunks.length; i++) destination.push(charsetChunks[i]);
  charsetChunks.length = 0;
  responseState = responseState.hoistableChunks;
  for (i = 0; i < responseState.length; i++) destination.push(responseState[i]);
  responseState.length = 0;
  willFlushAllSegments &&
    null === headChunks &&
    (destination.push("</"), destination.push("head"), destination.push(">"));
}
function writeHoistables(destination, resources, responseState) {
  var i = 0,
    preconnectChunks = responseState.preconnectChunks;
  for (i = 0; i < preconnectChunks.length; i++)
    destination.push(preconnectChunks[i]);
  preconnectChunks.length = 0;
  resources.fontPreloads.forEach(flushResourceLate, destination);
  resources.fontPreloads.clear();
  resources.precedences.forEach(preloadLateStyles, destination);
  resources.usedStylesheets.forEach(function (resource) {
    if (
      !resources.stylesMap.has(
        "[" + resource.props.as + "]" + resource.props.href
      )
    )
      for (resource = resource.chunks, i = 0; i < resource.length; i++)
        destination.push(resource[i]);
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
  preconnectChunks = responseState.preloadChunks;
  for (i = 0; i < preconnectChunks.length; i++)
    destination.push(preconnectChunks[i]);
  preconnectChunks.length = 0;
  responseState = responseState.hoistableChunks;
  for (i = 0; i < responseState.length; i++) destination.push(responseState[i]);
  responseState.length = 0;
}
function writeStyleResourceDependenciesInJS(destination, boundaryResources) {
  destination.push("[");
  var nextArrayOpenBrackChunk = "[";
  boundaryResources.forEach(function (resource) {
    if (!(resource.state & 1))
      if (resource.state & 3)
        destination.push(nextArrayOpenBrackChunk),
          (resource = escapeJSObjectForInstructionScripts(
            "" +
              ("style" === resource.type
                ? resource.props["data-href"]
                : resource.props.href)
          )),
          destination.push(resource),
          destination.push("]"),
          (nextArrayOpenBrackChunk = ",[");
      else if ("stylesheet" === resource.type) {
        destination.push(nextArrayOpenBrackChunk);
        var precedence = resource.props["data-precedence"],
          props = resource.props,
          coercedHref = "" + resource.props.href;
        sanitizeURL(coercedHref);
        coercedHref = escapeJSObjectForInstructionScripts(coercedHref);
        destination.push(coercedHref);
        precedence = "" + precedence;
        destination.push(",");
        precedence = escapeJSObjectForInstructionScripts(precedence);
        destination.push(precedence);
        for (var propKey in props)
          if (hasOwnProperty.call(props, propKey)) {
            var propValue = props[propKey];
            if (null != propValue)
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
                  a: {
                    precedence = destination;
                    var name = propKey;
                    coercedHref = name.toLowerCase();
                    switch (typeof propValue) {
                      case "function":
                      case "symbol":
                        break a;
                    }
                    switch (name) {
                      case "innerHTML":
                      case "dangerouslySetInnerHTML":
                      case "suppressContentEditableWarning":
                      case "suppressHydrationWarning":
                      case "style":
                        break a;
                      case "className":
                        coercedHref = "class";
                        break;
                      case "hidden":
                        if (!1 === propValue) break a;
                        break;
                      case "src":
                      case "href":
                        sanitizeURL("" + propValue);
                        break;
                      default:
                        if (!isAttributeNameSafe(name)) break a;
                    }
                    if (
                      !(2 < name.length) ||
                      ("o" !== name[0] && "O" !== name[0]) ||
                      ("n" !== name[1] && "N" !== name[1])
                    )
                      (propValue = "" + propValue),
                        precedence.push(","),
                        (coercedHref =
                          escapeJSObjectForInstructionScripts(coercedHref)),
                        precedence.push(coercedHref),
                        precedence.push(","),
                        (coercedHref =
                          escapeJSObjectForInstructionScripts(propValue)),
                        precedence.push(coercedHref);
                  }
              }
          }
        destination.push("]");
        nextArrayOpenBrackChunk = ",[";
        resource.state |= 2;
      }
  });
  destination.push("]");
}
function writeStyleResourceDependenciesInAttr(destination, boundaryResources) {
  destination.push("[");
  var nextArrayOpenBrackChunk = "[";
  boundaryResources.forEach(function (resource) {
    if (!(resource.state & 1))
      if (resource.state & 3)
        destination.push(nextArrayOpenBrackChunk),
          (resource = escapeTextForBrowser(
            JSON.stringify(
              "" +
                ("style" === resource.type
                  ? resource.props["data-href"]
                  : resource.props.href)
            )
          )),
          destination.push(resource),
          destination.push("]"),
          (nextArrayOpenBrackChunk = ",[");
      else if ("stylesheet" === resource.type) {
        destination.push(nextArrayOpenBrackChunk);
        var precedence = resource.props["data-precedence"],
          props = resource.props,
          coercedHref = "" + resource.props.href;
        sanitizeURL(coercedHref);
        coercedHref = escapeTextForBrowser(JSON.stringify(coercedHref));
        destination.push(coercedHref);
        precedence = "" + precedence;
        destination.push(",");
        precedence = escapeTextForBrowser(JSON.stringify(precedence));
        destination.push(precedence);
        for (var propKey in props)
          if (hasOwnProperty.call(props, propKey)) {
            var propValue = props[propKey];
            if (null != propValue)
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
                  a: {
                    precedence = destination;
                    var name = propKey;
                    coercedHref = name.toLowerCase();
                    switch (typeof propValue) {
                      case "function":
                      case "symbol":
                        break a;
                    }
                    switch (name) {
                      case "innerHTML":
                      case "dangerouslySetInnerHTML":
                      case "suppressContentEditableWarning":
                      case "suppressHydrationWarning":
                      case "style":
                        break a;
                      case "className":
                        coercedHref = "class";
                        break;
                      case "hidden":
                        if (!1 === propValue) break a;
                        break;
                      case "src":
                      case "href":
                        sanitizeURL("" + propValue);
                        break;
                      default:
                        if (!isAttributeNameSafe(name)) break a;
                    }
                    if (
                      !(2 < name.length) ||
                      ("o" !== name[0] && "O" !== name[0]) ||
                      ("n" !== name[1] && "N" !== name[1])
                    )
                      (propValue = "" + propValue),
                        precedence.push(","),
                        (coercedHref = escapeTextForBrowser(
                          JSON.stringify(coercedHref)
                        )),
                        precedence.push(coercedHref),
                        precedence.push(","),
                        (coercedHref = escapeTextForBrowser(
                          JSON.stringify(propValue)
                        )),
                        precedence.push(coercedHref);
                  }
              }
          }
        destination.push("]");
        nextArrayOpenBrackChunk = ",[";
        resource.state |= 2;
      }
  });
  destination.push("]");
}
function preload(href, options) {
  if (currentResources) {
    var resources = currentResources;
    if (
      "string" === typeof href &&
      href &&
      "object" === typeof options &&
      null !== options &&
      "string" === typeof options.as
    ) {
      var as = options.as,
        key = "[" + as + "]" + href,
        resource = resources.preloadsMap.get(key);
      resource ||
        ((resource = {
          type: "preload",
          chunks: [],
          state: 0,
          props: {
            rel: "preload",
            as: as,
            href: href,
            crossOrigin: "font" === as ? "" : options.crossOrigin,
            integrity: options.integrity
          }
        }),
        resources.preloadsMap.set(key, resource),
        pushLinkImpl(resource.chunks, resource.props));
      switch (as) {
        case "font":
          resources.fontPreloads.add(resource);
          break;
        case "style":
          resources.explicitStylesheetPreloads.add(resource);
          break;
        case "script":
          resources.explicitScriptPreloads.add(resource);
          break;
        default:
          resources.explicitOtherPreloads.add(resource);
      }
    }
  }
}
function preinit(href, options) {
  currentResources && preinitImpl(currentResources, href, options);
}
function preinitImpl(resources, href, options) {
  if (
    "string" === typeof href &&
    href &&
    "object" === typeof options &&
    null !== options
  ) {
    var as = options.as;
    switch (as) {
      case "style":
        var key = "[" + as + "]" + href;
        as = resources.stylesMap.get(key);
        var precedence = options.precedence || "default";
        as ||
          ((as = {
            type: "stylesheet",
            chunks: [],
            state: 0,
            props: {
              rel: "stylesheet",
              href: href,
              "data-precedence": precedence,
              crossOrigin: options.crossOrigin,
              integrity: options.integrity
            }
          }),
          resources.stylesMap.set(key, as),
          (href = resources.precedences.get(precedence)),
          href ||
            ((href = new Set()), resources.precedences.set(precedence, href)),
          href.add(as));
        break;
      case "script":
        (precedence = "[" + as + "]" + href),
          (as = resources.scriptsMap.get(precedence)),
          as ||
            ((as = { type: "script", chunks: [], state: 0, props: null }),
            resources.scriptsMap.set(precedence, as),
            (href = {
              src: href,
              async: !0,
              crossOrigin: options.crossOrigin,
              integrity: options.integrity
            }),
            resources.scripts.add(as),
            pushScriptImpl(as.chunks, href));
    }
  }
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
function hoistStylesheetResource(resource) {
  this.add(resource);
}
function unblockStylesheet(resource) {
  resource.state &= -5;
}
function createResponseState$1(
  generateStaticMarkup,
  identifierPrefix,
  externalRuntimeConfig
) {
  identifierPrefix = void 0 === identifierPrefix ? "" : identifierPrefix;
  var externalRuntimeDesc = null,
    streamingFormat = 0;
  void 0 !== externalRuntimeConfig &&
    ((streamingFormat = 1),
    (externalRuntimeDesc =
      "string" === typeof externalRuntimeConfig
        ? { src: externalRuntimeConfig, integrity: void 0 }
        : externalRuntimeConfig));
  return {
    bootstrapChunks: [],
    placeholderPrefix: identifierPrefix + "P:",
    segmentPrefix: identifierPrefix + "S:",
    boundaryPrefix: identifierPrefix + "B:",
    idPrefix: identifierPrefix,
    nextSuspenseID: 0,
    streamingFormat: streamingFormat,
    startInlineScript: "<script>",
    instructions: 0,
    externalRuntimeConfig: externalRuntimeDesc,
    htmlChunks: null,
    headChunks: null,
    hasBody: !1,
    charsetChunks: [],
    preconnectChunks: [],
    preloadChunks: [],
    hoistableChunks: [],
    generateStaticMarkup: generateStaticMarkup
  };
}
function pushTextInstance$1(target, text, responseState, textEmbedded) {
  if (responseState.generateStaticMarkup)
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
  REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED = Symbol.for(
    "react.default_value"
  ),
  REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel"),
  MAYBE_ITERATOR_SYMBOL = Symbol.iterator,
  ReactSharedInternals =
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  emptyContextObject = {},
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
function noop() {}
function trackUsedThenable(thenableState, thenable, index) {
  index = thenableState[index];
  void 0 === index
    ? thenableState.push(thenable)
    : index !== thenable && (thenable.then(noop, noop), (thenable = index));
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
      (thenableIndexCounter = localIdCounter = 0),
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
function unsupportedRefresh() {
  throw Error(formatProdErrorMessage(393));
}
function noop$1() {}
var HooksDispatcher = {
    readContext: function (context) {
      return context._currentValue2;
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
    useLayoutEffect: function () {},
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
      var responseState = currentResponseState;
      if (null === responseState) throw Error(formatProdErrorMessage(404));
      overflow = localIdCounter++;
      JSCompiler_inline_result =
        ":" + responseState.idPrefix + "R" + JSCompiler_inline_result;
      0 < overflow && (JSCompiler_inline_result += "H" + overflow.toString(32));
      return JSCompiler_inline_result + ":";
    },
    useMutableSource: function (source, getSnapshot) {
      resolveCurrentlyRenderingComponent();
      return getSnapshot(source._source);
    },
    useSyncExternalStore: function (subscribe, getSnapshot, getServerSnapshot) {
      if (void 0 === getServerSnapshot)
        throw Error(formatProdErrorMessage(407));
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
    },
    use: function (usable) {
      if (null !== usable && "object" === typeof usable) {
        if ("function" === typeof usable.then) {
          var index = thenableIndexCounter;
          thenableIndexCounter += 1;
          null === thenableState && (thenableState = []);
          return trackUsedThenable(thenableState, usable, index);
        }
        if (
          usable.$$typeof === REACT_CONTEXT_TYPE ||
          usable.$$typeof === REACT_SERVER_CONTEXT_TYPE
        )
          return usable._currentValue2;
      }
      throw Error(formatProdErrorMessage(438, String(usable)));
    }
  },
  currentResponseState = null,
  DefaultCacheDispatcher = {
    getCacheSignal: function () {
      throw Error(formatProdErrorMessage(248));
    },
    getCacheForType: function () {
      throw Error(formatProdErrorMessage(248));
    }
  },
  ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher,
  ReactCurrentCache = ReactSharedInternals.ReactCurrentCache;
function defaultErrorHandler(error) {
  console.error(error);
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
  var pingedTasks = [],
    abortSet = new Set(),
    resources = {
      preloadsMap: new Map(),
      stylesMap: new Map(),
      scriptsMap: new Map(),
      fontPreloads: new Set(),
      precedences: new Map(),
      usedStylesheets: new Set(),
      scripts: new Set(),
      usedScripts: new Set(),
      explicitStylesheetPreloads: new Set(),
      explicitScriptPreloads: new Set(),
      explicitOtherPreloads: new Set(),
      boundaryResources: null
    };
  responseState = {
    destination: null,
    responseState: responseState,
    progressiveChunkSize:
      void 0 === progressiveChunkSize ? 12800 : progressiveChunkSize,
    status: 0,
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
    onError: void 0 === onError ? defaultErrorHandler : onError,
    onAllReady: void 0 === onAllReady ? noop$2 : onAllReady,
    onShellReady: void 0 === onShellReady ? noop$2 : onShellReady,
    onShellError: void 0 === onShellError ? noop$2 : onShellError,
    onFatalError: void 0 === onFatalError ? noop$2 : onFatalError
  };
  rootFormatContext = createPendingSegment(
    responseState,
    0,
    null,
    rootFormatContext,
    !1,
    !1
  );
  rootFormatContext.parentFlushed = !0;
  children = createTask(
    responseState,
    null,
    children,
    null,
    rootFormatContext,
    abortSet,
    emptyContextObject,
    null,
    emptyTreeContext
  );
  pingedTasks.push(children);
  return responseState;
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
  null === blockedBoundary
    ? request.pendingRootTasks++
    : blockedBoundary.pendingTasks++;
  var task = {
    node: node,
    ping: function () {
      var pingedTasks = request.pingedTasks;
      pingedTasks.push(task);
      1 === pingedTasks.length && performWork(request);
    },
    blockedBoundary: blockedBoundary,
    blockedSegment: blockedSegment,
    abortSet: abortSet,
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
  formatContext,
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
    formatContext: formatContext,
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
function hoistCompletedBoundaryResources(request, completedBoundary) {
  if (null !== request.completedRootSegment || 0 < request.pendingRootTasks)
    (request = completedBoundary.resources),
      request.forEach(unblockStylesheet),
      request.clear();
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
      prevThenableState = emptyContextObject;
      ref = type.contextType;
      "object" === typeof ref &&
        null !== ref &&
        (prevThenableState = ref._currentValue2);
      prevThenableState = new type(props, prevThenableState);
      var initialState =
        void 0 !== prevThenableState.state ? prevThenableState.state : null;
      prevThenableState.updater = classComponentUpdater;
      prevThenableState.props = props;
      prevThenableState.state = initialState;
      ref = { queue: [], replace: !1 };
      prevThenableState._reactInternals = ref;
      var contextType = type.contextType;
      prevThenableState.context =
        "object" === typeof contextType && null !== contextType
          ? contextType._currentValue2
          : emptyContextObject;
      contextType = type.getDerivedStateFromProps;
      "function" === typeof contextType &&
        ((contextType = contextType(props, initialState)),
        (initialState =
          null === contextType || void 0 === contextType
            ? initialState
            : assign({}, initialState, contextType)),
        (prevThenableState.state = initialState));
      if (
        "function" !== typeof type.getDerivedStateFromProps &&
        "function" !== typeof prevThenableState.getSnapshotBeforeUpdate &&
        ("function" === typeof prevThenableState.UNSAFE_componentWillMount ||
          "function" === typeof prevThenableState.componentWillMount)
      )
        if (
          ((type = prevThenableState.state),
          "function" === typeof prevThenableState.componentWillMount &&
            prevThenableState.componentWillMount(),
          "function" === typeof prevThenableState.UNSAFE_componentWillMount &&
            prevThenableState.UNSAFE_componentWillMount(),
          type !== prevThenableState.state &&
            classComponentUpdater.enqueueReplaceState(
              prevThenableState,
              prevThenableState.state,
              null
            ),
          null !== ref.queue && 0 < ref.queue.length)
        )
          if (
            ((type = ref.queue),
            (contextType = ref.replace),
            (ref.queue = null),
            (ref.replace = !1),
            contextType && 1 === type.length)
          )
            prevThenableState.state = type[0];
          else {
            ref = contextType ? type[0] : prevThenableState.state;
            initialState = !0;
            for (
              contextType = contextType ? 1 : 0;
              contextType < type.length;
              contextType++
            ) {
              var partial = type[contextType];
              partial =
                "function" === typeof partial
                  ? partial.call(prevThenableState, ref, props, void 0)
                  : partial;
              null != partial &&
                (initialState
                  ? ((initialState = !1), (ref = assign({}, ref, partial)))
                  : assign(ref, partial));
            }
            prevThenableState.state = ref;
          }
        else ref.queue = null;
      props = prevThenableState.render();
      renderNodeDestructiveImpl(request, task, null, props);
    } else if (
      ((currentlyRenderingComponent = {}),
      (currentlyRenderingTask = task),
      (thenableIndexCounter = localIdCounter = 0),
      (thenableState = prevThenableState),
      (prevThenableState = type(props, void 0)),
      (props = finishHooks(type, props, prevThenableState, void 0)),
      0 !== localIdCounter)
    ) {
      type = task.treeContext;
      task.treeContext = pushTreeContext(type, 1, 0);
      try {
        renderNodeDestructiveImpl(request, task, null, props);
      } finally {
        task.treeContext = type;
      }
    } else renderNodeDestructiveImpl(request, task, null, props);
  else if ("string" === typeof type) {
    prevThenableState = task.blockedSegment;
    initialState = pushStartInstance(
      prevThenableState.chunks,
      type,
      props,
      request.resources,
      request.responseState,
      prevThenableState.formatContext,
      prevThenableState.lastPushedText
    );
    prevThenableState.lastPushedText = !1;
    ref = prevThenableState.formatContext;
    prevThenableState.formatContext = getChildFormatContext(ref, type, props);
    renderNode(request, task, initialState);
    prevThenableState.formatContext = ref;
    a: {
      task = prevThenableState.chunks;
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
          if (1 >= ref.insertionMode) {
            request.responseState.hasBody = !0;
            break a;
          }
          break;
        case "html":
          if (0 === ref.insertionMode) break a;
      }
      task.push("</", type, ">");
    }
    prevThenableState.lastPushedText = !1;
  } else {
    switch (type) {
      case REACT_LEGACY_HIDDEN_TYPE:
      case REACT_DEBUG_TRACING_MODE_TYPE:
      case REACT_STRICT_MODE_TYPE:
      case REACT_PROFILER_TYPE:
      case REACT_FRAGMENT_TYPE:
        renderNodeDestructiveImpl(request, task, null, props.children);
        return;
      case REACT_OFFSCREEN_TYPE:
        "hidden" !== props.mode &&
          renderNodeDestructiveImpl(request, task, null, props.children);
        return;
      case REACT_SUSPENSE_LIST_TYPE:
        renderNodeDestructiveImpl(request, task, null, props.children);
        return;
      case REACT_SCOPE_TYPE:
        renderNodeDestructiveImpl(request, task, null, props.children);
        return;
      case REACT_SUSPENSE_TYPE:
        a: {
          type = task.blockedBoundary;
          prevThenableState = task.blockedSegment;
          ref = props.fallback;
          props = props.children;
          initialState = new Set();
          contextType = {
            id: null,
            rootSegmentID: -1,
            parentFlushed: !1,
            pendingTasks: 0,
            forceClientRender: !1,
            completedSegments: [],
            byteSize: 0,
            fallbackAbortableTasks: initialState,
            errorDigest: null,
            resources: new Set()
          };
          partial = createPendingSegment(
            request,
            prevThenableState.chunks.length,
            contextType,
            prevThenableState.formatContext,
            !1,
            !1
          );
          prevThenableState.children.push(partial);
          prevThenableState.lastPushedText = !1;
          var contentRootSegment = createPendingSegment(
            request,
            0,
            null,
            prevThenableState.formatContext,
            !1,
            !1
          );
          contentRootSegment.parentFlushed = !0;
          task.blockedBoundary = contextType;
          task.blockedSegment = contentRootSegment;
          request.resources.boundaryResources = contextType.resources;
          try {
            if (
              (renderNode(request, task, props),
              request.responseState.generateStaticMarkup ||
                (contentRootSegment.lastPushedText &&
                  contentRootSegment.textEmbedded &&
                  contentRootSegment.chunks.push("\x3c!-- --\x3e")),
              (contentRootSegment.status = 1),
              0 === contextType.pendingTasks &&
                hoistCompletedBoundaryResources(request, contextType),
              queueCompletedSegment(contextType, contentRootSegment),
              0 === contextType.pendingTasks)
            )
              break a;
          } catch (error) {
            (contentRootSegment.status = 4),
              (contextType.forceClientRender = !0),
              (contextType.errorDigest = logRecoverableError(request, error));
          } finally {
            (request.resources.boundaryResources = type
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
            partial,
            initialState,
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
          thenableIndexCounter = localIdCounter = 0;
          thenableState = prevThenableState;
          prevThenableState = type(props, ref);
          props = finishHooks(type, props, prevThenableState, ref);
          if (0 !== localIdCounter) {
            type = task.treeContext;
            task.treeContext = pushTreeContext(type, 1, 0);
            try {
              renderNodeDestructiveImpl(request, task, null, props);
            } finally {
              task.treeContext = type;
            }
          } else renderNodeDestructiveImpl(request, task, null, props);
          return;
        case REACT_MEMO_TYPE:
          type = type.type;
          props = resolveDefaultProps(type, props);
          renderElement(request, task, prevThenableState, type, props, ref);
          return;
        case REACT_PROVIDER_TYPE:
          prevThenableState = props.children;
          type = type._context;
          props = props.value;
          ref = type._currentValue2;
          type._currentValue2 = props;
          initialState = currentActiveSnapshot;
          currentActiveSnapshot = props = {
            parent: initialState,
            depth: null === initialState ? 0 : initialState.depth + 1,
            context: type,
            parentValue: ref,
            value: props
          };
          task.context = props;
          renderNodeDestructiveImpl(request, task, null, prevThenableState);
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
          renderNodeDestructiveImpl(request, task, null, props);
          return;
        case REACT_LAZY_TYPE:
          ref = type._init;
          type = ref(type._payload);
          props = resolveDefaultProps(type, props);
          renderElement(request, task, prevThenableState, type, props, void 0);
          return;
      }
    throw Error(
      formatProdErrorMessage(130, null == type ? type : typeof type, "")
    );
  }
}
function renderNodeDestructiveImpl(request, task, prevThenableState, node) {
  task.node = node;
  if ("object" === typeof node && null !== node) {
    switch (node.$$typeof) {
      case REACT_ELEMENT_TYPE:
        renderElement(
          request,
          task,
          prevThenableState,
          node.type,
          node.props,
          node.ref
        );
        return;
      case REACT_PORTAL_TYPE:
        throw Error(formatProdErrorMessage(257));
      case REACT_LAZY_TYPE:
        prevThenableState = node._init;
        node = prevThenableState(node._payload);
        renderNodeDestructiveImpl(request, task, null, node);
        return;
    }
    if (isArrayImpl(node)) {
      renderChildrenArray(request, task, node);
      return;
    }
    null === node || "object" !== typeof node
      ? (prevThenableState = null)
      : ((prevThenableState =
          (MAYBE_ITERATOR_SYMBOL && node[MAYBE_ITERATOR_SYMBOL]) ||
          node["@@iterator"]),
        (prevThenableState =
          "function" === typeof prevThenableState ? prevThenableState : null));
    if (
      prevThenableState &&
      (prevThenableState = prevThenableState.call(node))
    ) {
      node = prevThenableState.next();
      if (!node.done) {
        var children = [];
        do children.push(node.value), (node = prevThenableState.next());
        while (!node.done);
        renderChildrenArray(request, task, children);
      }
      return;
    }
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
    ? ((prevThenableState = task.blockedSegment),
      (prevThenableState.lastPushedText = pushTextInstance$1(
        task.blockedSegment.chunks,
        node,
        request.responseState,
        prevThenableState.lastPushedText
      )))
    : "number" === typeof node &&
      ((prevThenableState = task.blockedSegment),
      (prevThenableState.lastPushedText = pushTextInstance$1(
        task.blockedSegment.chunks,
        "" + node,
        request.responseState,
        prevThenableState.lastPushedText
      )));
}
function renderChildrenArray(request, task, children) {
  for (var totalChildren = children.length, i = 0; i < totalChildren; i++) {
    var prevTreeContext = task.treeContext;
    task.treeContext = pushTreeContext(prevTreeContext, totalChildren, i);
    try {
      renderNode(request, task, children[i]);
    } finally {
      task.treeContext = prevTreeContext;
    }
  }
}
function renderNode(request, task, node) {
  var previousFormatContext = task.blockedSegment.formatContext,
    previousLegacyContext = task.legacyContext,
    previousContext = task.context;
  try {
    return renderNodeDestructiveImpl(request, task, null, node);
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
      var thenableState$13 = getThenableStateAfterSuspending(),
        segment = task.blockedSegment,
        newSegment = createPendingSegment(
          request,
          segment.chunks.length,
          null,
          segment.formatContext,
          segment.lastPushedText,
          !0
        );
      segment.children.push(newSegment);
      segment.lastPushedText = !1;
      request = createTask(
        request,
        thenableState$13,
        task.node,
        task.blockedBoundary,
        newSegment,
        task.abortSet,
        task.legacyContext,
        task.context,
        task.treeContext
      ).ping;
      node.then(request, request);
      task.blockedSegment.formatContext = previousFormatContext;
      task.legacyContext = previousLegacyContext;
      task.context = previousContext;
      switchContext(previousContext);
    } else
      throw (
        ((task.blockedSegment.formatContext = previousFormatContext),
        (task.legacyContext = previousLegacyContext),
        (task.context = previousContext),
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
      boundary.forceClientRender ||
        ((boundary.forceClientRender = !0),
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
      ((request.onShellError = noop$2),
      (boundary = request.onShellReady),
      boundary());
  } else
    boundary.pendingTasks--,
      boundary.forceClientRender ||
        (0 === boundary.pendingTasks
          ? (segment.parentFlushed &&
              1 === segment.status &&
              queueCompletedSegment(boundary, segment),
            hoistCompletedBoundaryResources(request, boundary),
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
      prevDispatcher = ReactCurrentDispatcher$1.current;
    ReactCurrentDispatcher$1.current = HooksDispatcher;
    var prevCacheDispatcher = ReactCurrentCache.current;
    ReactCurrentCache.current = DefaultCacheDispatcher;
    var resources = request$jscomp$1.resources;
    currentResourcesStack.push(currentResources);
    currentResources = resources;
    resources = ReactDOMCurrentDispatcher.current;
    ReactDOMCurrentDispatcher.current = ReactDOMServerDispatcher;
    var prevResponseState = currentResponseState;
    currentResponseState = request$jscomp$1.responseState;
    try {
      var pingedTasks = request$jscomp$1.pingedTasks,
        i;
      for (i = 0; i < pingedTasks.length; i++) {
        var task = pingedTasks[i];
        var request = request$jscomp$1,
          blockedBoundary = task.blockedBoundary;
        request.resources.boundaryResources = blockedBoundary
          ? blockedBoundary.resources
          : null;
        var segment = task.blockedSegment;
        if (0 === segment.status) {
          switchContext(task.context);
          try {
            var prevThenableState = task.thenableState;
            task.thenableState = null;
            renderNodeDestructiveImpl(
              request,
              task,
              prevThenableState,
              task.node
            );
            request.responseState.generateStaticMarkup ||
              (segment.lastPushedText &&
                segment.textEmbedded &&
                segment.chunks.push("\x3c!-- --\x3e"));
            task.abortSet.delete(task);
            segment.status = 1;
            finishedTask(request, task.blockedBoundary, segment);
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
              var ping = task.ping;
              x.then(ping, ping);
              task.thenableState = getThenableStateAfterSuspending();
            } else {
              task.abortSet.delete(task);
              segment.status = 4;
              var request$jscomp$0 = request,
                boundary = task.blockedBoundary,
                error$jscomp$0 = x,
                errorDigest = logRecoverableError(
                  request$jscomp$0,
                  error$jscomp$0
                );
              null === boundary
                ? fatalError(request$jscomp$0, error$jscomp$0)
                : (boundary.pendingTasks--,
                  boundary.forceClientRender ||
                    ((boundary.forceClientRender = !0),
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
            request.resources.boundaryResources = null;
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
      (currentResponseState = prevResponseState),
        (ReactCurrentDispatcher$1.current = prevDispatcher),
        (ReactCurrentCache.current = prevCacheDispatcher),
        (currentResources = currentResourcesStack.pop()),
        (ReactDOMCurrentDispatcher.current = resources),
        prevDispatcher === HooksDispatcher && switchContext(prevContext);
    }
  }
}
function flushSubtree(request, destination, segment) {
  segment.parentFlushed = !0;
  switch (segment.status) {
    case 0:
      var segmentID = (segment.id = request.nextSegmentId++);
      segment.lastPushedText = !1;
      segment.textEmbedded = !1;
      request = request.responseState;
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
  if (boundary.forceClientRender)
    return (
      request.responseState.generateStaticMarkup ||
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
      (request = request.responseState.generateStaticMarkup
        ? !0
        : destination.push("\x3c!--/$--\x3e")),
      request
    );
  if (0 < boundary.pendingTasks) {
    boundary.rootSegmentID = request.nextSegmentId++;
    0 < boundary.completedSegments.length &&
      request.partialBoundaries.push(boundary);
    var JSCompiler_inline_result = request.responseState;
    var generatedID = JSCompiler_inline_result.nextSuspenseID++;
    JSCompiler_inline_result =
      JSCompiler_inline_result.boundaryPrefix + generatedID.toString(16);
    boundary = boundary.id = JSCompiler_inline_result;
    writeStartPendingSuspenseBoundary(
      destination,
      request.responseState,
      boundary
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
        request.responseState,
        boundary.id
      ),
      flushSubtree(request, destination, segment),
      destination.push("\x3c!--/$--\x3e")
    );
  segment = boundary.resources;
  if ((JSCompiler_inline_result = request.resources.boundaryResources))
    segment.forEach(hoistStylesheetResource, JSCompiler_inline_result),
      segment.clear();
  request.responseState.generateStaticMarkup ||
    destination.push("\x3c!--$--\x3e");
  segment = boundary.completedSegments;
  if (1 !== segment.length) throw Error(formatProdErrorMessage(391));
  flushSegment(request, destination, segment[0]);
  request = request.responseState.generateStaticMarkup
    ? !0
    : destination.push("\x3c!--/$--\x3e");
  return request;
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
  request.resources.boundaryResources = boundary.resources;
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
  writeResourcesForBoundary(destination, boundary.resources);
  request = request.responseState;
  completedSegments = boundary.id;
  i = boundary.rootSegmentID;
  boundary = boundary.resources;
  var hasStyleDependencies;
  b: {
    for (hasStyleDependencies = boundary.values(); ; ) {
      var resource = hasStyleDependencies.next().value;
      if (!resource) break;
      if (0 === (resource.state & 1)) {
        hasStyleDependencies = !0;
        break b;
      }
    }
    hasStyleDependencies = !1;
  }
  (resource = 0 === request.streamingFormat)
    ? (destination.push(request.startInlineScript),
      hasStyleDependencies
        ? 0 === (request.instructions & 2)
          ? ((request.instructions |= 10),
            destination.push(
              '$RC=function(b,c,e){c=document.getElementById(c);c.parentNode.removeChild(c);var a=document.getElementById(b);if(a){b=a.previousSibling;if(e)b.data="$!",a.setAttribute("data-dgst",e);else{e=b.parentNode;a=b.nextSibling;var f=0;do{if(a&&8===a.nodeType){var d=a.data;if("/$"===d)if(0===f)break;else f--;else"$"!==d&&"$?"!==d&&"$!"!==d||f++}d=a.nextSibling;e.removeChild(a);a=d}while(a);for(;c.firstChild;)e.insertBefore(c.firstChild,a);b.data="$"}b._reactRetry&&b._reactRetry()}};$RM=new Map;\n$RR=function(p,q,w){function r(l){this.s=l}for(var t=$RC,m=$RM,u=new Map,n=new Map,g=document,h,e,f=g.querySelectorAll("template[data-precedence]"),c=0;e=f[c++];){for(var b=e.content.firstChild;b;b=b.nextSibling)u.set(b.getAttribute("data-href"),b);e.parentNode.removeChild(e)}f=g.querySelectorAll("link[data-precedence],style[data-precedence]");for(c=0;e=f[c++];)m.set(e.getAttribute("STYLE"===e.nodeName?"data-href":"href"),e),n.set(e.dataset.precedence,h=e);e=0;f=[];for(var d,\nv,a;d=w[e++];){var k=0;b=d[k++];if(!(a=m.get(b))){if(a=u.get(b))c=a.getAttribute("data-precedence");else{a=g.createElement("link");a.href=b;a.rel="stylesheet";for(a.dataset.precedence=c=d[k++];v=d[k++];)a.setAttribute(v,d[k++]);d=a._p=new Promise(function(l,x){a.onload=l;a.onerror=x});d.then(r.bind(d,"l"),r.bind(d,"e"))}m.set(b,a);b=n.get(c)||h;b===h&&(h=a);n.set(c,a);b?b.parentNode.insertBefore(a,b.nextSibling):(c=g.head,c.insertBefore(a,c.firstChild))}d=a._p;c=a.getAttribute("media");!d||"l"===\nd.s||c&&!matchMedia(c).matches||f.push(d)}Promise.all(f).then(t.bind(null,p,q,""),t.bind(null,p,q,"Resource failed to load"))};$RR("'
            ))
          : 0 === (request.instructions & 8)
          ? ((request.instructions |= 8),
            destination.push(
              '$RM=new Map;\n$RR=function(p,q,w){function r(l){this.s=l}for(var t=$RC,m=$RM,u=new Map,n=new Map,g=document,h,e,f=g.querySelectorAll("template[data-precedence]"),c=0;e=f[c++];){for(var b=e.content.firstChild;b;b=b.nextSibling)u.set(b.getAttribute("data-href"),b);e.parentNode.removeChild(e)}f=g.querySelectorAll("link[data-precedence],style[data-precedence]");for(c=0;e=f[c++];)m.set(e.getAttribute("STYLE"===e.nodeName?"data-href":"href"),e),n.set(e.dataset.precedence,h=e);e=0;f=[];for(var d,\nv,a;d=w[e++];){var k=0;b=d[k++];if(!(a=m.get(b))){if(a=u.get(b))c=a.getAttribute("data-precedence");else{a=g.createElement("link");a.href=b;a.rel="stylesheet";for(a.dataset.precedence=c=d[k++];v=d[k++];)a.setAttribute(v,d[k++]);d=a._p=new Promise(function(l,x){a.onload=l;a.onerror=x});d.then(r.bind(d,"l"),r.bind(d,"e"))}m.set(b,a);b=n.get(c)||h;b===h&&(h=a);n.set(c,a);b?b.parentNode.insertBefore(a,b.nextSibling):(c=g.head,c.insertBefore(a,c.firstChild))}d=a._p;c=a.getAttribute("media");!d||"l"===\nd.s||c&&!matchMedia(c).matches||f.push(d)}Promise.all(f).then(t.bind(null,p,q,""),t.bind(null,p,q,"Resource failed to load"))};$RR("'
            ))
          : destination.push('$RR("')
        : 0 === (request.instructions & 2)
        ? ((request.instructions |= 2),
          destination.push(
            '$RC=function(b,c,e){c=document.getElementById(c);c.parentNode.removeChild(c);var a=document.getElementById(b);if(a){b=a.previousSibling;if(e)b.data="$!",a.setAttribute("data-dgst",e);else{e=b.parentNode;a=b.nextSibling;var f=0;do{if(a&&8===a.nodeType){var d=a.data;if("/$"===d)if(0===f)break;else f--;else"$"!==d&&"$?"!==d&&"$!"!==d||f++}d=a.nextSibling;e.removeChild(a);a=d}while(a);for(;c.firstChild;)e.insertBefore(c.firstChild,a);b.data="$"}b._reactRetry&&b._reactRetry()}};$RC("'
          ))
        : destination.push('$RC("'))
    : hasStyleDependencies
    ? destination.push('<template data-rri="" data-bid="')
    : destination.push('<template data-rci="" data-bid="');
  if (null === completedSegments) throw Error(formatProdErrorMessage(395));
  i = i.toString(16);
  destination.push(completedSegments);
  resource ? destination.push('","') : destination.push('" data-sid="');
  destination.push(request.segmentPrefix);
  destination.push(i);
  hasStyleDependencies
    ? resource
      ? (destination.push('",'),
        writeStyleResourceDependenciesInJS(destination, boundary))
      : (destination.push('" data-sty="'),
        writeStyleResourceDependenciesInAttr(destination, boundary))
    : resource && destination.push('"');
  destination = resource
    ? destination.push(")\x3c/script>")
    : destination.push('"></template>');
  return destination;
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
  request = request.responseState;
  (boundary = 0 === request.streamingFormat)
    ? (destination.push(request.startInlineScript),
      0 === (request.instructions & 1)
        ? ((request.instructions |= 1),
          destination.push(
            '$RS=function(a,b){a=document.getElementById(a);b=document.getElementById(b);for(a.parentNode.removeChild(a);a.firstChild;)b.parentNode.insertBefore(a.firstChild,b);b.parentNode.removeChild(b)};;$RS("'
          ))
        : destination.push('$RS("'))
    : destination.push('<template data-rsi="" data-sid="');
  destination.push(request.segmentPrefix);
  segmentID = segmentID.toString(16);
  destination.push(segmentID);
  boundary ? destination.push('","') : destination.push('" data-pid="');
  destination.push(request.placeholderPrefix);
  destination.push(segmentID);
  destination = boundary
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
        writePreamble(
          destination,
          request.resources,
          request.responseState,
          0 === request.allPendingTasks
        );
        flushSegment(request, destination, completedRootSegment);
        request.completedRootSegment = null;
        var bootstrapChunks = request.responseState.bootstrapChunks;
        for (
          completedRootSegment = 0;
          completedRootSegment < bootstrapChunks.length - 1;
          completedRootSegment++
        )
          destination.push(bootstrapChunks[completedRootSegment]);
        completedRootSegment < bootstrapChunks.length &&
          destination.push(bootstrapChunks[completedRootSegment]);
      } else return;
    else writeHoistables(destination, request.resources, request.responseState);
    var clientRenderedBoundaries = request.clientRenderedBoundaries;
    for (i = 0; i < clientRenderedBoundaries.length; i++) {
      var boundary = clientRenderedBoundaries[i];
      bootstrapChunks = destination;
      var responseState = request.responseState,
        boundaryID = boundary.id,
        errorDigest = boundary.errorDigest,
        errorMessage = boundary.errorMessage,
        errorComponentStack = boundary.errorComponentStack,
        scriptFormat = 0 === responseState.streamingFormat;
      scriptFormat
        ? (bootstrapChunks.push(responseState.startInlineScript),
          0 === (responseState.instructions & 4)
            ? ((responseState.instructions |= 4),
              bootstrapChunks.push(
                '$RX=function(b,c,d,e){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data="$!",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),b._reactRetry&&b._reactRetry())};;$RX("'
              ))
            : bootstrapChunks.push('$RX("'))
        : bootstrapChunks.push('<template data-rxi="" data-bid="');
      if (null === boundaryID) throw Error(formatProdErrorMessage(395));
      bootstrapChunks.push(boundaryID);
      scriptFormat && bootstrapChunks.push('"');
      if (errorDigest || errorMessage || errorComponentStack)
        if (scriptFormat) {
          bootstrapChunks.push(",");
          var chunk = escapeJSStringsForInstructionScripts(errorDigest || "");
          bootstrapChunks.push(chunk);
        } else {
          bootstrapChunks.push('" data-dgst="');
          var chunk$jscomp$0 = escapeTextForBrowser(errorDigest || "");
          bootstrapChunks.push(chunk$jscomp$0);
        }
      if (errorMessage || errorComponentStack)
        if (scriptFormat) {
          bootstrapChunks.push(",");
          var chunk$jscomp$1 = escapeJSStringsForInstructionScripts(
            errorMessage || ""
          );
          bootstrapChunks.push(chunk$jscomp$1);
        } else {
          bootstrapChunks.push('" data-msg="');
          var chunk$jscomp$2 = escapeTextForBrowser(errorMessage || "");
          bootstrapChunks.push(chunk$jscomp$2);
        }
      if (errorComponentStack)
        if (scriptFormat) {
          bootstrapChunks.push(",");
          var chunk$jscomp$3 =
            escapeJSStringsForInstructionScripts(errorComponentStack);
          bootstrapChunks.push(chunk$jscomp$3);
        } else {
          bootstrapChunks.push('" data-stck="');
          var chunk$jscomp$4 = escapeTextForBrowser(errorComponentStack);
          bootstrapChunks.push(chunk$jscomp$4);
        }
      if (
        scriptFormat
          ? !bootstrapChunks.push(")\x3c/script>")
          : !bootstrapChunks.push('"></template>')
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
      var boundary$15 = partialBoundaries[i];
      a: {
        clientRenderedBoundaries = request;
        boundary = destination;
        clientRenderedBoundaries.resources.boundaryResources =
          boundary$15.resources;
        var completedSegments = boundary$15.completedSegments;
        for (
          responseState = 0;
          responseState < completedSegments.length;
          responseState++
        )
          if (
            !flushPartiallyCompletedSegment(
              clientRenderedBoundaries,
              boundary,
              boundary$15,
              completedSegments[responseState]
            )
          ) {
            responseState++;
            completedSegments.splice(0, responseState);
            var JSCompiler_inline_result = !1;
            break a;
          }
        completedSegments.splice(0, responseState);
        JSCompiler_inline_result = writeResourcesForBoundary(
          boundary,
          boundary$15.resources
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
      ((request = request.responseState),
      request.hasBody &&
        (destination.push("</"),
        destination.push("body"),
        destination.push(">")),
      request.htmlChunks &&
        (destination.push("</"),
        destination.push("html"),
        destination.push(">")),
      destination.push(null));
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
  } catch (error$17) {
    logRecoverableError(request, error$17), fatalError(request, error$17);
  }
}
function onError() {}
function renderToStringImpl(
  children,
  options,
  generateStaticMarkup,
  abortReason,
  unstable_externalRuntimeSrc
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
  children = createRequest(
    children,
    createResponseState$1(
      generateStaticMarkup,
      options ? options.identifierPrefix : void 0,
      unstable_externalRuntimeSrc
    ),
    { insertionMode: 2, selectedValue: null, noscriptTagInScope: !1 },
    Infinity,
    onError,
    void 0,
    function () {
      readyToStream = !0;
    },
    void 0,
    void 0
  );
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
exports.version = "18.3.0-www-modern-6396b6641-20230209";
