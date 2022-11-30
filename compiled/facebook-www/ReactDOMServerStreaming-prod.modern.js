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
function writeChunk(destination, chunk) {
  destination.buffer += chunk;
}
function writeChunkAndReturn(destination, chunk) {
  destination.buffer += chunk;
  return !0;
}
var enableFilterEmptyStringAttributesDOM = require("ReactFeatureFlags")
    .enableFilterEmptyStringAttributesDOM,
  hasOwnProperty = Object.prototype.hasOwnProperty,
  VALID_ATTRIBUTE_NAME_REGEX = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
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
  reservedProps = "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(
    " "
  );
reservedProps.push("innerText", "textContent");
reservedProps.forEach(function(name) {
  properties[name] = new PropertyInfoRecord(name, 0, !1, name, null, !1, !1);
});
[
  ["acceptCharset", "accept-charset"],
  ["className", "class"],
  ["htmlFor", "for"],
  ["httpEquiv", "http-equiv"]
].forEach(function(_ref) {
  var name = _ref[0];
  properties[name] = new PropertyInfoRecord(name, 1, !1, _ref[1], null, !1, !1);
});
["contentEditable", "draggable", "spellCheck", "value"].forEach(function(name) {
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
].forEach(function(name) {
  properties[name] = new PropertyInfoRecord(name, 2, !1, name, null, !1, !1);
});
"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope"
  .split(" ")
  .forEach(function(name) {
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
["checked", "multiple", "muted", "selected"].forEach(function(name) {
  properties[name] = new PropertyInfoRecord(name, 3, !0, name, null, !1, !1);
});
["capture", "download"].forEach(function(name) {
  properties[name] = new PropertyInfoRecord(name, 4, !1, name, null, !1, !1);
});
["cols", "rows", "size", "span"].forEach(function(name) {
  properties[name] = new PropertyInfoRecord(name, 6, !1, name, null, !1, !1);
});
["rowSpan", "start"].forEach(function(name) {
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
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height"
  .split(" ")
  .forEach(function(attributeName) {
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
  .forEach(function(attributeName) {
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
["xml:base", "xml:lang", "xml:space"].forEach(function(attributeName) {
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
["tabIndex", "crossOrigin"].forEach(function(attributeName) {
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
["src", "href", "action", "formAction"].forEach(function(attributeName) {
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
Object.keys(isUnitlessNumber).forEach(function(prop) {
  prefixes.forEach(function(prefix) {
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
  isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
function sanitizeURL(url) {
  if (isJavaScriptProtocol.test(url))
    throw Error(
      "React has blocked a javascript: URL as a security precaution."
    );
}
var isArrayImpl = Array.isArray,
  assign = Object.assign,
  currentResources = null,
  currentResourcesStack = [],
  ReactDOMServerDispatcher = { preload: preload, preinit: preinit };
function preload(href, options) {
  if (currentResources) {
    var resources = currentResources;
    if (
      "string" === typeof href &&
      href &&
      "object" === typeof options &&
      null !== options
    ) {
      var as = options.as,
        resource = resources.preloadsMap.get(href);
      resource ||
        (resource = createPreloadResource(resources, href, as, {
          href: href,
          rel: "preload",
          as: as,
          crossOrigin: "font" === as ? "" : options.crossOrigin,
          integrity: options.integrity
        }));
      switch (as) {
        case "font":
          resources.fontPreloads.add(resource);
          break;
        case "style":
          resources.explicitStylePreloads.add(resource);
          break;
        case "script":
          resources.explicitScriptPreloads.add(resource);
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
  )
    switch (options.as) {
      case "style":
        var resource = resources.stylesMap.get(href);
        resource ||
          ((resource = options.precedence || "default"),
          (resource = createStyleResource(resources, href, resource, {
            rel: "stylesheet",
            href: href,
            "data-precedence": resource,
            crossOrigin: options.crossOrigin
          })));
        resource.set.add(resource);
        resources.explicitStylePreloads.add(resource.hint);
        break;
      case "script":
        (resource = resources.scriptsMap.get(href)),
          resource ||
            ((resource = createScriptResource(resources, href, {
              src: href,
              async: !0,
              crossOrigin: options.crossOrigin,
              integrity: options.integrity
            })),
            resources.scripts.add(resource));
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
  as = { type: "preload", as: as, href: href, flushed: !1, props: props };
  resources.preloadsMap.set(href, as);
  return as;
}
function createStyleResource(resources, href, precedence, props) {
  var stylesMap = resources.stylesMap,
    preloadsMap = resources.preloadsMap,
    precedences = resources.precedences,
    precedenceSet = precedences.get(precedence);
  precedenceSet ||
    ((precedenceSet = new Set()), precedences.set(precedence, precedenceSet));
  (preloadsMap = preloadsMap.get(href))
    ? ((resources = preloadsMap.props),
      null == props.crossOrigin && (props.crossOrigin = resources.crossOrigin),
      null == props.referrerPolicy &&
        (props.referrerPolicy = resources.referrerPolicy),
      null == props.title && (props.title = resources.title))
    : ((preloadsMap = preloadAsStylePropsFromProps(href, props)),
      (preloadsMap = createPreloadResource(
        resources,
        href,
        "style",
        preloadsMap
      )),
      resources.explicitStylePreloads.add(preloadsMap));
  precedence = {
    type: "style",
    href: href,
    precedence: precedence,
    flushed: !1,
    inShell: !1,
    props: props,
    hint: preloadsMap,
    set: precedenceSet
  };
  stylesMap.set(href, precedence);
  return precedence;
}
function createScriptResource(resources, src, props) {
  var scriptsMap = resources.scriptsMap,
    hint = resources.preloadsMap.get(src);
  hint
    ? ((resources = hint.props),
      null == props.crossOrigin && (props.crossOrigin = resources.crossOrigin),
      null == props.referrerPolicy &&
        (props.referrerPolicy = resources.referrerPolicy),
      null == props.integrity && (props.integrity = resources.integrity))
    : ((hint = preloadAsScriptPropsFromProps(src, props)),
      (hint = createPreloadResource(resources, src, "script", hint)),
      resources.explicitScriptPreloads.add(hint));
  props = { type: "script", src: src, flushed: !1, props: props, hint: hint };
  scriptsMap.set(src, props);
  return props;
}
function resourcesFromElement(type, props) {
  if (!currentResources)
    throw Error(
      '"currentResources" was expected to exist. This is a bug in React.'
    );
  var resources = currentResources;
  switch (type) {
    case "title":
      var child = props.children;
      Array.isArray(child) && 1 === child.length && (child = child[0]);
      if ("string" === typeof child || "number" === typeof child) {
        var key = "title::" + child;
        type = resources.headsMap.get(key);
        type ||
          ((props = assign({}, props)),
          (props.children = child),
          (type = { type: "title", props: props, flushed: !1 }),
          resources.headsMap.set(key, type),
          resources.headResources.add(type));
      }
      return !0;
    case "meta":
      if ("string" === typeof props.charSet) key = "charSet";
      else if ("string" === typeof props.content)
        if (
          ((type = "::" + props.content), "string" === typeof props.httpEquiv)
        )
          key = "httpEquiv::" + props.httpEquiv + type;
        else if ("string" === typeof props.name)
          key = "name::" + props.name + type;
        else if ("string" === typeof props.itemProp)
          key = "itemProp::" + props.itemProp + type;
        else if ("string" === typeof props.property) {
          var property = props.property;
          key = "property::" + property + type;
          child = property;
          type = property
            .split(":")
            .slice(0, -1)
            .join(":");
          (type = resources.structuredMetaKeys.get(type)) &&
            (key = type.key + "::child::" + key);
        }
      key &&
        !resources.headsMap.has(key) &&
        ((props = {
          type: "meta",
          key: key,
          props: assign({}, props),
          flushed: !1
        }),
        resources.headsMap.set(key, props),
        "charSet" === key
          ? (resources.charset = props)
          : (child && resources.structuredMetaKeys.set(child, props),
            resources.headResources.add(props)));
      return !0;
    case "base":
      return (
        (key = props.target),
        (child = props.href),
        (key =
          "base" +
          ("string" === typeof child
            ? '[href="' + child + '"]'
            : ":not([href])") +
          ("string" === typeof key
            ? '[target="' + key + '"]'
            : ":not([target])")),
        resources.headsMap.has(key) ||
          ((props = { type: "base", props: assign({}, props), flushed: !1 }),
          resources.headsMap.set(key, props),
          resources.bases.add(props)),
        !0
      );
  }
  return !1;
}
function resourcesFromLink(props) {
  if (!currentResources)
    throw Error(
      '"currentResources" was expected to exist. This is a bug in React.'
    );
  var resources = currentResources,
    rel = props.rel,
    href = props.href;
  if (!href || "string" !== typeof href || !rel || "string" !== typeof rel)
    return !1;
  switch (rel) {
    case "stylesheet":
      var onLoad = props.onLoad,
        onError = props.onError;
      rel = props.precedence;
      var disabled = props.disabled;
      if ("string" !== typeof rel || onLoad || onError || null != disabled)
        return (
          (rel = resources.preloadsMap.get(href)),
          rel ||
            ((rel = createPreloadResource(
              resources,
              href,
              "style",
              preloadAsStylePropsFromProps(href, props)
            )),
            resources.usedStylePreloads.add(rel)),
          !1
        );
      onLoad = resources.stylesMap.get(href);
      onLoad ||
        ((props = assign({}, props)),
        (props.href = href),
        (props.rel = "stylesheet"),
        (props["data-precedence"] = rel),
        delete props.precedence,
        (onLoad = createStyleResource(currentResources, href, rel, props)),
        resources.usedStylePreloads.add(onLoad.hint));
      resources.boundaryResources
        ? resources.boundaryResources.add(onLoad)
        : onLoad.set.add(onLoad);
      return !0;
    case "preload":
      switch (((onLoad = props.as), onLoad)) {
        case "script":
        case "style":
        case "font":
          rel = resources.preloadsMap.get(href);
          if (!rel)
            switch (
              ((props = assign({}, props)),
              (props.href = href),
              (props.rel = "preload"),
              (props.as = onLoad),
              "font" === onLoad && (props.crossOrigin = ""),
              (rel = createPreloadResource(resources, href, onLoad, props)),
              onLoad)
            ) {
              case "script":
                resources.explicitScriptPreloads.add(rel);
                break;
              case "style":
                resources.explicitStylePreloads.add(rel);
                break;
              case "font":
                resources.fontPreloads.add(rel);
            }
          return !0;
      }
  }
  if (props.onLoad || props.onError) return !0;
  href =
    "rel:" +
    rel +
    "::href:" +
    href +
    "::sizes:" +
    ("string" === typeof props.sizes ? props.sizes : "") +
    "::media:" +
    ("string" === typeof props.media ? props.media : "");
  onLoad = resources.headsMap.get(href);
  if (!onLoad)
    switch (
      ((onLoad = { type: "link", props: assign({}, props), flushed: !1 }),
      resources.headsMap.set(href, onLoad),
      rel)
    ) {
      case "preconnect":
      case "dns-prefetch":
        resources.preconnects.add(onLoad);
        break;
      default:
        resources.headResources.add(onLoad);
    }
  return !0;
}
function hoistResources(resources, source) {
  var currentBoundaryResources = resources.boundaryResources;
  currentBoundaryResources &&
    (source.forEach(function(resource) {
      return currentBoundaryResources.add(resource);
    }),
    source.clear());
}
function hoistResourcesToRoot(resources, boundaryResources) {
  boundaryResources.forEach(function(resource) {
    return resource.set.add(resource);
  });
  boundaryResources.clear();
}
var ReactDOMCurrentDispatcher =
    ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.Dispatcher,
  scriptRegex = /(<\/|<)(s)(cript)/gi;
function scriptReplacer(match, prefix, s, suffix) {
  return "" + prefix + ("s" === s ? "\\u0073" : "\\u0053") + suffix;
}
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
      return createFormatContext(1, null, !0);
    case "select":
      return createFormatContext(
        1,
        null != props.value ? props.value : props.defaultValue,
        parentContext.noscriptTagInScope
      );
    case "svg":
      return createFormatContext(2, null, parentContext.noscriptTagInScope);
    case "math":
      return createFormatContext(3, null, parentContext.noscriptTagInScope);
    case "foreignObject":
      return createFormatContext(1, null, parentContext.noscriptTagInScope);
    case "table":
      return createFormatContext(4, null, parentContext.noscriptTagInScope);
    case "thead":
    case "tbody":
    case "tfoot":
      return createFormatContext(5, null, parentContext.noscriptTagInScope);
    case "colgroup":
      return createFormatContext(7, null, parentContext.noscriptTagInScope);
    case "tr":
      return createFormatContext(6, null, parentContext.noscriptTagInScope);
  }
  return 4 <= parentContext.insertionMode || 0 === parentContext.insertionMode
    ? createFormatContext(1, null, parentContext.noscriptTagInScope)
    : parentContext;
}
function pushTextInstance(target, text, responseState, textEmbedded) {
  if ("" === text) return textEmbedded;
  textEmbedded && target.push("\x3c!-- --\x3e");
  target.push(escapeTextForBrowser(text));
  return !0;
}
var styleNameCache = new Map();
function pushStyle(target, responseState, style) {
  if ("object" !== typeof style)
    throw Error(
      "The `style` prop expects a mapping from style properties to values, not a string. For example, style={{marginRight: spacing + 'em'}} when using JSX."
    );
  responseState = !0;
  for (var styleName in style)
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
        responseState
          ? ((responseState = !1),
            target.push(' style="', nameChunk, ":", styleValue))
          : target.push(";", nameChunk, ":", styleValue);
      }
    }
  responseState || target.push('"');
}
function pushAttribute(target, responseState, name, value) {
  switch (name) {
    case "style":
      pushStyle(target, responseState, value);
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
  )
    if (
      ((responseState = properties.hasOwnProperty(name)
        ? properties[name]
        : null),
      null !== responseState)
    ) {
      switch (typeof value) {
        case "function":
        case "symbol":
          return;
        case "boolean":
          if (!responseState.acceptsBooleans) return;
      }
      if (
        !enableFilterEmptyStringAttributesDOM ||
        !responseState.removeEmptyString ||
        "" !== value
      )
        switch (((name = responseState.attributeName), responseState.type)) {
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
            responseState.sanitizeURL &&
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
            ((responseState = name.toLowerCase().slice(0, 5)),
            "data-" !== responseState && "aria-" !== responseState)
          )
            return;
      }
      target.push(" ", name, '="', escapeTextForBrowser(value), '"');
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
  React.Children.forEach(children, function(child) {
    null != child && (content += child);
  });
  return content;
}
function pushLinkImpl(target, props, responseState) {
  var isStylesheet = "stylesheet" === props.rel;
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
          case "precedence":
            if (isStylesheet) continue;
          default:
            pushAttribute(target, responseState, propKey, propValue);
        }
    }
  target.push("/>");
  return null;
}
function pushSelfClosing(target, props, tag, responseState) {
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
            pushAttribute(target, responseState, propKey, propValue);
        }
    }
  target.push("/>");
  return null;
}
function pushTitleImpl(target, props, responseState) {
  target.push(startChunkForTag("title"));
  var children = null,
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
            throw Error(
              "`dangerouslySetInnerHTML` does not make sense on <title>."
            );
          default:
            pushAttribute(target, responseState, propKey, propValue);
        }
    }
  target.push(">");
  props =
    Array.isArray(children) && 2 > children.length
      ? children[0] || null
      : children;
  ("string" !== typeof props && "number" !== typeof props) ||
    target.push(escapeTextForBrowser(props));
  target.push("</", "title", ">");
  return null;
}
function pushScriptImpl(target, props, responseState) {
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
            pushAttribute(target, responseState, propKey, propValue);
        }
    }
  target.push(">");
  pushInnerHTML(target, innerHTML, children);
  "string" === typeof children && target.push(escapeTextForBrowser(children));
  target.push("</", "script", ">");
  return null;
}
function pushStartGenericElement(target, props, tag, responseState) {
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
            pushAttribute(target, responseState, propKey, propValue);
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
  target,
  preamble,
  type,
  props,
  responseState,
  formatContext,
  textEmbedded
) {
  switch (type) {
    case "select":
      target.push(startChunkForTag("select"));
      var innerHTML = (textEmbedded = null),
        propKey;
      for (propKey in props)
        if (hasOwnProperty.call(props, propKey)) {
          var propValue = props[propKey];
          if (null != propValue)
            switch (propKey) {
              case "children":
                textEmbedded = propValue;
                break;
              case "dangerouslySetInnerHTML":
                innerHTML = propValue;
                break;
              case "defaultValue":
              case "value":
                break;
              default:
                pushAttribute(target, responseState, propKey, propValue);
            }
        }
      target.push(">");
      pushInnerHTML(target, innerHTML, textEmbedded);
      return textEmbedded;
    case "option":
      textEmbedded = formatContext.selectedValue;
      target.push(startChunkForTag("option"));
      var selected = (propKey = propValue = null),
        innerHTML$jscomp$0 = null;
      for (innerHTML in props)
        if (hasOwnProperty.call(props, innerHTML)) {
          var propValue$jscomp$0 = props[innerHTML];
          if (null != propValue$jscomp$0)
            switch (innerHTML) {
              case "children":
                propValue = propValue$jscomp$0;
                break;
              case "selected":
                selected = propValue$jscomp$0;
                break;
              case "dangerouslySetInnerHTML":
                innerHTML$jscomp$0 = propValue$jscomp$0;
                break;
              case "value":
                propKey = propValue$jscomp$0;
              default:
                pushAttribute(
                  target,
                  responseState,
                  innerHTML,
                  propValue$jscomp$0
                );
            }
        }
      if (null != textEmbedded)
        if (
          ((props =
            null !== propKey ? "" + propKey : flattenOptionChildren(propValue)),
          isArrayImpl(textEmbedded))
        )
          for (
            responseState = 0;
            responseState < textEmbedded.length;
            responseState++
          ) {
            if ("" + textEmbedded[responseState] === props) {
              target.push(' selected=""');
              break;
            }
          }
        else "" + textEmbedded === props && target.push(' selected=""');
      else selected && target.push(' selected=""');
      target.push(">");
      pushInnerHTML(target, innerHTML$jscomp$0, propValue);
      return propValue;
    case "textarea":
      target.push(startChunkForTag("textarea"));
      propValue = innerHTML = textEmbedded = null;
      for (innerHTML$jscomp$0 in props)
        if (
          hasOwnProperty.call(props, innerHTML$jscomp$0) &&
          ((propKey = props[innerHTML$jscomp$0]), null != propKey)
        )
          switch (innerHTML$jscomp$0) {
            case "children":
              propValue = propKey;
              break;
            case "value":
              textEmbedded = propKey;
              break;
            case "defaultValue":
              innerHTML = propKey;
              break;
            case "dangerouslySetInnerHTML":
              throw Error(
                "`dangerouslySetInnerHTML` does not make sense on <textarea>."
              );
            default:
              pushAttribute(target, responseState, innerHTML$jscomp$0, propKey);
          }
      null === textEmbedded && null !== innerHTML && (textEmbedded = innerHTML);
      target.push(">");
      if (null != propValue) {
        if (null != textEmbedded)
          throw Error(
            "If you supply `defaultValue` on a <textarea>, do not pass children."
          );
        if (isArrayImpl(propValue) && 1 < propValue.length)
          throw Error("<textarea> can only have at most one child.");
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
      propKey = innerHTML$jscomp$0 = innerHTML = textEmbedded = null;
      for (propValue in props)
        if (
          hasOwnProperty.call(props, propValue) &&
          ((selected = props[propValue]), null != selected)
        )
          switch (propValue) {
            case "children":
            case "dangerouslySetInnerHTML":
              throw Error(
                "input is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`."
              );
            case "defaultChecked":
              propKey = selected;
              break;
            case "defaultValue":
              innerHTML = selected;
              break;
            case "checked":
              innerHTML$jscomp$0 = selected;
              break;
            case "value":
              textEmbedded = selected;
              break;
            default:
              pushAttribute(target, responseState, propValue, selected);
          }
      null !== innerHTML$jscomp$0
        ? pushAttribute(target, responseState, "checked", innerHTML$jscomp$0)
        : null !== propKey &&
          pushAttribute(target, responseState, "checked", propKey);
      null !== textEmbedded
        ? pushAttribute(target, responseState, "value", textEmbedded)
        : null !== innerHTML &&
          pushAttribute(target, responseState, "value", innerHTML);
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
              throw Error(
                "menuitems cannot have `children` nor `dangerouslySetInnerHTML`."
              );
            default:
              pushAttribute(
                target,
                responseState,
                propKey$jscomp$0,
                textEmbedded
              );
          }
      target.push(">");
      return null;
    case "title":
      return (
        (target =
          2 !== formatContext.insertionMode &&
          !formatContext.noscriptTagInScope &&
          resourcesFromElement("title", props)
            ? null
            : pushTitleImpl(target, props, responseState)),
        target
      );
    case "link":
      return (
        !formatContext.noscriptTagInScope && resourcesFromLink(props)
          ? (textEmbedded && target.push("\x3c!-- --\x3e"), (target = null))
          : (target = pushLinkImpl(target, props, responseState)),
        target
      );
    case "script":
      if ((innerHTML = !formatContext.noscriptTagInScope)) {
        if (!currentResources)
          throw Error(
            '"currentResources" was expected to exist. This is a bug in React.'
          );
        innerHTML = currentResources;
        propValue = props.src;
        innerHTML$jscomp$0 = props.onLoad;
        propKey = props.onError;
        propValue && "string" === typeof propValue
          ? props.async
            ? (innerHTML$jscomp$0 || propKey
                ? ((innerHTML$jscomp$0 = innerHTML.preloadsMap.get(propValue)),
                  innerHTML$jscomp$0 ||
                    ((innerHTML$jscomp$0 = createPreloadResource(
                      innerHTML,
                      propValue,
                      "script",
                      preloadAsScriptPropsFromProps(propValue, props)
                    )),
                    innerHTML.usedScriptPreloads.add(innerHTML$jscomp$0)))
                : ((innerHTML$jscomp$0 = innerHTML.scriptsMap.get(propValue)),
                  innerHTML$jscomp$0 ||
                    ((innerHTML$jscomp$0 = assign({}, props)),
                    (innerHTML$jscomp$0.src = propValue),
                    (innerHTML$jscomp$0 = createScriptResource(
                      innerHTML,
                      propValue,
                      innerHTML$jscomp$0
                    )),
                    innerHTML.scripts.add(innerHTML$jscomp$0))),
              (innerHTML = !0))
            : (innerHTML = !1)
          : (innerHTML = !1);
      }
      innerHTML
        ? (textEmbedded && target.push("\x3c!-- --\x3e"), (target = null))
        : (target = pushScriptImpl(target, props, responseState));
      return target;
    case "meta":
      return (
        !formatContext.noscriptTagInScope && resourcesFromElement("meta", props)
          ? (textEmbedded && target.push("\x3c!-- --\x3e"), (target = null))
          : (target = pushSelfClosing(target, props, "meta", responseState)),
        target
      );
    case "base":
      return (
        !formatContext.noscriptTagInScope && resourcesFromElement("base", props)
          ? (textEmbedded && target.push("\x3c!-- --\x3e"), (target = null))
          : (target = pushSelfClosing(target, props, "base", responseState)),
        target
      );
    case "listing":
    case "pre":
      target.push(startChunkForTag(type));
      innerHTML = textEmbedded = null;
      for (selected in props)
        if (
          hasOwnProperty.call(props, selected) &&
          ((propValue = props[selected]), null != propValue)
        )
          switch (selected) {
            case "children":
              textEmbedded = propValue;
              break;
            case "dangerouslySetInnerHTML":
              innerHTML = propValue;
              break;
            default:
              pushAttribute(target, responseState, selected, propValue);
          }
      target.push(">");
      if (null != innerHTML) {
        if (null != textEmbedded)
          throw Error(
            "Can only set one of `children` or `props.dangerouslySetInnerHTML`."
          );
        if ("object" !== typeof innerHTML || !("__html" in innerHTML))
          throw Error(
            "`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. Please visit https://reactjs.org/link/dangerously-set-inner-html for more information."
          );
        props = innerHTML.__html;
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
      return pushSelfClosing(target, props, type, responseState);
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return pushStartGenericElement(target, props, type, responseState);
    case "head":
      return pushStartGenericElement(preamble, props, type, responseState);
    case "html":
      return (
        0 === formatContext.insertionMode && preamble.push("<!DOCTYPE html>"),
        pushStartGenericElement(preamble, props, type, responseState)
      );
    default:
      if (-1 === type.indexOf("-") && "string" !== typeof props.is)
        return pushStartGenericElement(target, props, type, responseState);
      target.push(startChunkForTag(type));
      innerHTML = textEmbedded = null;
      for (propValue$jscomp$0 in props)
        if (
          hasOwnProperty.call(props, propValue$jscomp$0) &&
          ((propValue = props[propValue$jscomp$0]),
          null != propValue &&
            "function" !== typeof propValue &&
            "object" !== typeof propValue &&
            !1 !== propValue)
        )
          switch (
            (!0 === propValue && (propValue = ""),
            "className" === propValue$jscomp$0 &&
              (propValue$jscomp$0 = "class"),
            propValue$jscomp$0)
          ) {
            case "children":
              textEmbedded = propValue;
              break;
            case "dangerouslySetInnerHTML":
              innerHTML = propValue;
              break;
            case "style":
              pushStyle(target, responseState, propValue);
              break;
            case "suppressContentEditableWarning":
            case "suppressHydrationWarning":
              break;
            default:
              isAttributeNameSafe(propValue$jscomp$0) &&
                "function" !== typeof propValue &&
                "symbol" !== typeof propValue &&
                target.push(
                  " ",
                  propValue$jscomp$0,
                  '="',
                  escapeTextForBrowser(propValue),
                  '"'
                );
          }
      target.push(">");
      pushInnerHTML(target, innerHTML, textEmbedded);
      return textEmbedded;
  }
}
function pushEndInstance(target, postamble, type) {
  switch (type) {
    case "title":
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
      return;
    case "body":
      postamble.unshift("</", type, ">");
      return;
    case "html":
      postamble.push("</", type, ">");
      return;
  }
  target.push("</", type, ">");
}
function writeStartPendingSuspenseBoundary(destination, responseState, id) {
  destination.buffer += '\x3c!--$?--\x3e<template id="';
  if (null === id)
    throw Error(
      "An ID must have been assigned before we can complete the boundary."
    );
  destination.buffer += id;
  return writeChunkAndReturn(destination, '"></template>');
}
function writeStartSegment(destination, responseState, formatContext, id) {
  switch (formatContext.insertionMode) {
    case 0:
    case 1:
      return (
        (destination.buffer += '<div hidden id="'),
        (destination.buffer += responseState.segmentPrefix),
        (responseState = id.toString(16)),
        (destination.buffer += responseState),
        writeChunkAndReturn(destination, '">')
      );
    case 2:
      return (
        (destination.buffer +=
          '<svg aria-hidden="true" style="display:none" id="'),
        (destination.buffer += responseState.segmentPrefix),
        (responseState = id.toString(16)),
        (destination.buffer += responseState),
        writeChunkAndReturn(destination, '">')
      );
    case 3:
      return (
        (destination.buffer +=
          '<math aria-hidden="true" style="display:none" id="'),
        (destination.buffer += responseState.segmentPrefix),
        (responseState = id.toString(16)),
        (destination.buffer += responseState),
        writeChunkAndReturn(destination, '">')
      );
    case 4:
      return (
        (destination.buffer += '<table hidden id="'),
        (destination.buffer += responseState.segmentPrefix),
        (responseState = id.toString(16)),
        (destination.buffer += responseState),
        writeChunkAndReturn(destination, '">')
      );
    case 5:
      return (
        (destination.buffer += '<table hidden><tbody id="'),
        (destination.buffer += responseState.segmentPrefix),
        (responseState = id.toString(16)),
        (destination.buffer += responseState),
        writeChunkAndReturn(destination, '">')
      );
    case 6:
      return (
        (destination.buffer += '<table hidden><tr id="'),
        (destination.buffer += responseState.segmentPrefix),
        (responseState = id.toString(16)),
        (destination.buffer += responseState),
        writeChunkAndReturn(destination, '">')
      );
    case 7:
      return (
        (destination.buffer += '<table hidden><colgroup id="'),
        (destination.buffer += responseState.segmentPrefix),
        (responseState = id.toString(16)),
        (destination.buffer += responseState),
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
      return writeChunkAndReturn(destination, "</div>");
    case 2:
      return writeChunkAndReturn(destination, "</svg>");
    case 3:
      return writeChunkAndReturn(destination, "</math>");
    case 4:
      return writeChunkAndReturn(destination, "</table>");
    case 5:
      return writeChunkAndReturn(destination, "</tbody></table>");
    case 6:
      return writeChunkAndReturn(destination, "</tr></table>");
    case 7:
      return writeChunkAndReturn(destination, "</colgroup></table>");
    default:
      throw Error("Unknown insertion mode. This is a bug in React.");
  }
}
var regexForJSStringsInInstructionScripts = /[<\u2028\u2029]/g;
function escapeJSStringsForInstructionScripts(input) {
  return JSON.stringify(input).replace(
    regexForJSStringsInInstructionScripts,
    function(match) {
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
  return JSON.stringify(input).replace(regexForJSStringsInScripts, function(
    match
  ) {
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
  });
}
function writeInitialResources(
  destination,
  resources,
  responseState,
  willFlushAllSegments
) {
  function flushLinkResource(resource) {
    resource.flushed ||
      (pushLinkImpl(target, resource.props, responseState),
      (resource.flushed = !0));
  }
  !willFlushAllSegments &&
    responseState.externalRuntimeConfig &&
    ((willFlushAllSegments = responseState.externalRuntimeConfig),
    preinitImpl(resources, willFlushAllSegments.src, {
      as: "script",
      integrity: willFlushAllSegments.integrity
    }));
  var target = [];
  willFlushAllSegments = resources.charset;
  var bases = resources.bases,
    preconnects = resources.preconnects,
    fontPreloads = resources.fontPreloads,
    precedences = resources.precedences,
    usedStylePreloads = resources.usedStylePreloads,
    scripts = resources.scripts,
    usedScriptPreloads = resources.usedScriptPreloads,
    explicitStylePreloads = resources.explicitStylePreloads,
    explicitScriptPreloads = resources.explicitScriptPreloads,
    headResources = resources.headResources;
  willFlushAllSegments &&
    (pushSelfClosing(target, willFlushAllSegments.props, "meta", responseState),
    (willFlushAllSegments.flushed = !0),
    (resources.charset = null));
  bases.forEach(function(r) {
    pushSelfClosing(target, r.props, "base", responseState);
    r.flushed = !0;
  });
  bases.clear();
  preconnects.forEach(function(r) {
    pushLinkImpl(target, r.props, responseState);
    r.flushed = !0;
  });
  preconnects.clear();
  fontPreloads.forEach(function(r) {
    pushLinkImpl(target, r.props, responseState);
    r.flushed = !0;
  });
  fontPreloads.clear();
  precedences.forEach(function(p, precedence) {
    p.size
      ? (p.forEach(function(r) {
          pushLinkImpl(target, r.props, responseState);
          r.flushed = !0;
          r.inShell = !0;
          r.hint.flushed = !0;
        }),
        p.clear())
      : target.push(
          '<style data-precedence="',
          escapeTextForBrowser(precedence),
          '"></style>'
        );
  });
  usedStylePreloads.forEach(flushLinkResource);
  usedStylePreloads.clear();
  scripts.forEach(function(r) {
    pushScriptImpl(target, r.props, responseState);
    r.flushed = !0;
    r.hint.flushed = !0;
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
      case "title":
        pushTitleImpl(target, r.props, responseState);
        break;
      case "meta":
        pushSelfClosing(target, r.props, "meta", responseState);
        break;
      case "link":
        pushLinkImpl(target, r.props, responseState);
    }
    r.flushed = !0;
  });
  headResources.clear();
  willFlushAllSegments = !0;
  for (resources = 0; resources < target.length - 1; resources++)
    destination.buffer += target[resources];
  resources < target.length &&
    (willFlushAllSegments = writeChunkAndReturn(
      destination,
      target[resources]
    ));
  return willFlushAllSegments;
}
function writeImmediateResources(destination, resources, responseState) {
  function flushLinkResource(resource) {
    resource.flushed ||
      (pushLinkImpl(target, resource.props, responseState),
      (resource.flushed = !0));
  }
  var target = [],
    charset = resources.charset,
    preconnects = resources.preconnects,
    fontPreloads = resources.fontPreloads,
    usedStylePreloads = resources.usedStylePreloads,
    scripts = resources.scripts,
    usedScriptPreloads = resources.usedScriptPreloads,
    explicitStylePreloads = resources.explicitStylePreloads,
    explicitScriptPreloads = resources.explicitScriptPreloads,
    headResources = resources.headResources;
  charset &&
    (pushSelfClosing(target, charset.props, "meta", responseState),
    (charset.flushed = !0),
    (resources.charset = null));
  preconnects.forEach(function(r) {
    pushLinkImpl(target, r.props, responseState);
    r.flushed = !0;
  });
  preconnects.clear();
  fontPreloads.forEach(function(r) {
    pushLinkImpl(target, r.props, responseState);
    r.flushed = !0;
  });
  fontPreloads.clear();
  usedStylePreloads.forEach(flushLinkResource);
  usedStylePreloads.clear();
  scripts.forEach(function(r) {
    pushStartGenericElement(target, r.props, "script", responseState);
    pushEndInstance(target, target, "script", r.props);
    r.flushed = !0;
    r.hint.flushed = !0;
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
      case "title":
        pushTitleImpl(target, r.props, responseState);
        break;
      case "meta":
        pushSelfClosing(target, r.props, "meta", responseState);
        break;
      case "link":
        pushLinkImpl(target, r.props, responseState);
    }
    r.flushed = !0;
  });
  headResources.clear();
  charset = !0;
  for (resources = 0; resources < target.length - 1; resources++)
    destination.buffer += target[resources];
  resources < target.length &&
    (charset = writeChunkAndReturn(destination, target[resources]));
  return charset;
}
function writeStyleResourceDependenciesInJS(destination, boundaryResources) {
  destination.buffer += "[";
  var nextArrayOpenBrackChunk = "[";
  boundaryResources.forEach(function(resource) {
    if (!resource.inShell)
      if (resource.flushed)
        (destination.buffer += nextArrayOpenBrackChunk),
          writeChunk(
            destination,
            escapeJSObjectForInstructionScripts("" + resource.href)
          ),
          (destination.buffer += "]"),
          (nextArrayOpenBrackChunk = ",[");
      else {
        destination.buffer += nextArrayOpenBrackChunk;
        var precedence = resource.precedence,
          props = resource.props,
          coercedHref = "" + resource.href;
        sanitizeURL(coercedHref);
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
                  throw Error(
                    "link is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`."
                  );
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
                        (precedence.buffer += ","),
                        (coercedHref = escapeJSObjectForInstructionScripts(
                          coercedHref
                        )),
                        (precedence.buffer += coercedHref),
                        (precedence.buffer += ","),
                        (coercedHref = escapeJSObjectForInstructionScripts(
                          propValue
                        )),
                        (precedence.buffer += coercedHref);
                  }
              }
          }
        destination.buffer += "]";
        nextArrayOpenBrackChunk = ",[";
        resource.flushed = !0;
        resource.hint.flushed = !0;
      }
  });
  destination.buffer += "]";
}
function writeStyleResourceDependenciesInAttr(destination, boundaryResources) {
  destination.buffer += "[";
  var nextArrayOpenBrackChunk = "[";
  boundaryResources.forEach(function(resource) {
    if (!resource.inShell)
      if (resource.flushed)
        (destination.buffer += nextArrayOpenBrackChunk),
          writeChunk(
            destination,
            escapeTextForBrowser(JSON.stringify("" + resource.href))
          ),
          (destination.buffer += "]"),
          (nextArrayOpenBrackChunk = ",[");
      else {
        destination.buffer += nextArrayOpenBrackChunk;
        var precedence = resource.precedence,
          props = resource.props,
          coercedHref = "" + resource.href;
        sanitizeURL(coercedHref);
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
                  throw Error(
                    "link is a self-closing tag and must neither have `children` nor use `dangerouslySetInnerHTML`."
                  );
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
                        (precedence.buffer += ","),
                        (coercedHref = escapeTextForBrowser(
                          JSON.stringify(coercedHref)
                        )),
                        (precedence.buffer += coercedHref),
                        (precedence.buffer += ","),
                        (coercedHref = escapeTextForBrowser(
                          JSON.stringify(propValue)
                        )),
                        (precedence.buffer += coercedHref);
                  }
              }
          }
        destination.buffer += "]";
        nextArrayOpenBrackChunk = ",[";
        resource.flushed = !0;
        resource.hint.flushed = !0;
      }
  });
  destination.buffer += "]";
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
    isMounted: function() {
      return !1;
    },
    enqueueSetState: function(inst, payload) {
      inst = inst._reactInternals;
      null !== inst.queue && inst.queue.push(payload);
    },
    enqueueReplaceState: function(inst, payload) {
      inst = inst._reactInternals;
      inst.replace = !0;
      inst.queue = [payload];
    },
    enqueueForceUpdate: function() {}
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
            function(fulfilledValue) {
              if ("pending" === thenable.status) {
                var fulfilledThenable = thenable;
                fulfilledThenable.status = "fulfilled";
                fulfilledThenable.value = fulfilledValue;
              }
            },
            function(error) {
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
function throwOnUseEventCall() {
  throw Error(
    "A function wrapped in useEvent can't be called during rendering."
  );
}
function unsupportedStartTransition() {
  throw Error("startTransition cannot be called during server rendering.");
}
function unsupportedRefresh() {
  throw Error("Cache cannot be refreshed during server rendering.");
}
function noop$1() {}
var HooksDispatcher = {
    readContext: function(context) {
      return context._currentValue;
    },
    useContext: function(context) {
      resolveCurrentlyRenderingComponent();
      return context._currentValue;
    },
    useMemo: useMemo,
    useReducer: useReducer,
    useRef: function(initialValue) {
      currentlyRenderingComponent = resolveCurrentlyRenderingComponent();
      workInProgressHook = createWorkInProgressHook();
      var previousRef = workInProgressHook.memoizedState;
      return null === previousRef
        ? ((initialValue = { current: initialValue }),
          (workInProgressHook.memoizedState = initialValue))
        : previousRef;
    },
    useState: function(initialState) {
      return useReducer(basicStateReducer, initialState);
    },
    useInsertionEffect: noop$1,
    useLayoutEffect: function() {},
    useCallback: function(callback, deps) {
      return useMemo(function() {
        return callback;
      }, deps);
    },
    useImperativeHandle: noop$1,
    useEffect: noop$1,
    useDebugValue: noop$1,
    useDeferredValue: function(value) {
      resolveCurrentlyRenderingComponent();
      return value;
    },
    useTransition: function() {
      resolveCurrentlyRenderingComponent();
      return [!1, unsupportedStartTransition];
    },
    useId: function() {
      var JSCompiler_inline_result = currentlyRenderingTask.treeContext;
      var overflow = JSCompiler_inline_result.overflow;
      JSCompiler_inline_result = JSCompiler_inline_result.id;
      JSCompiler_inline_result =
        (
          JSCompiler_inline_result &
          ~(1 << (32 - clz32(JSCompiler_inline_result) - 1))
        ).toString(32) + overflow;
      var responseState = currentResponseState;
      if (null === responseState)
        throw Error(
          "Invalid hook call. Hooks can only be called inside of the body of a function component."
        );
      overflow = localIdCounter++;
      JSCompiler_inline_result =
        ":" + responseState.idPrefix + "R" + JSCompiler_inline_result;
      0 < overflow && (JSCompiler_inline_result += "H" + overflow.toString(32));
      return JSCompiler_inline_result + ":";
    },
    useMutableSource: function(source, getSnapshot) {
      resolveCurrentlyRenderingComponent();
      return getSnapshot(source._source);
    },
    useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
      if (void 0 === getServerSnapshot)
        throw Error(
          "Missing getServerSnapshot, which is required for server-rendered content. Will revert to client rendering."
        );
      return getServerSnapshot();
    },
    useCacheRefresh: function() {
      return unsupportedRefresh;
    },
    useEvent: function() {
      return throwOnUseEventCall;
    },
    useMemoCache: function(size) {
      for (var data = Array(size), i = 0; i < size; i++)
        data[i] = REACT_MEMO_CACHE_SENTINEL;
      return data;
    },
    use: function(usable) {
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
          return usable._currentValue;
      }
      throw Error("An unsupported type was passed to use(): " + String(usable));
    }
  },
  currentResponseState = null,
  DefaultCacheDispatcher = {
    getCacheSignal: function() {
      throw Error("Not implemented.");
    },
    getCacheForType: function() {
      throw Error("Not implemented.");
    }
  },
  ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher,
  ReactCurrentCache = ReactSharedInternals.ReactCurrentCache;
function defaultErrorHandler(error) {
  console.error(error);
  return null;
}
function noop$2() {}
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
    ping: function() {
      request.pingedTasks.push(task);
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
    ? ((request.status = 2),
      (request = request.destination),
      (request.done = !0),
      (request.fatal = !0),
      (request.error = error))
    : ((request.status = 1), (request.fatalError = error));
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
        (prevThenableState = ref._currentValue);
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
          ? contextType._currentValue
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
  else if ("string" === typeof type)
    (prevThenableState = task.blockedSegment),
      (ref = pushStartInstance(
        prevThenableState.chunks,
        request.preamble,
        type,
        props,
        request.responseState,
        prevThenableState.formatContext,
        prevThenableState.lastPushedText
      )),
      (prevThenableState.lastPushedText = !1),
      (initialState = prevThenableState.formatContext),
      (prevThenableState.formatContext = getChildFormatContext(
        initialState,
        type,
        props
      )),
      renderNode(request, task, ref),
      (prevThenableState.formatContext = initialState),
      pushEndInstance(prevThenableState.chunks, request.postamble, type),
      (prevThenableState.lastPushedText = !1);
  else {
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
              contentRootSegment.lastPushedText &&
                contentRootSegment.textEmbedded &&
                contentRootSegment.chunks.push("\x3c!-- --\x3e"),
              (contentRootSegment.status = 1),
              0 === contextType.pendingTasks &&
                (null !== request.completedRootSegment ||
                  0 < request.pendingRootTasks) &&
                hoistResourcesToRoot(request.resources, contextType.resources),
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
          ref = type._currentValue;
          type._currentValue = props;
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
          if (null === request)
            throw Error(
              "Tried to pop a Context at the root of the app. This is a bug in React."
            );
          props = request.parentValue;
          request.context._currentValue =
            props === REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED
              ? request.context._defaultValue
              : props;
          request = currentActiveSnapshot = request.parent;
          task.context = request;
          return;
        case REACT_CONTEXT_TYPE:
          props = props.children;
          props = props(type._currentValue);
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
      "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: " +
        ((null == type ? type : typeof type) + ".")
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
        throw Error(
          "Portals are not currently supported by the server renderer. Render them conditionally so that they only appear on the client render."
        );
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
      "Objects are not valid as a React child (found: " +
        ("[object Object]" === request
          ? "object with keys {" + Object.keys(node).join(", ") + "}"
          : request) +
        "). If you meant to render a collection of children, use an array instead."
    );
  }
  "string" === typeof node
    ? ((prevThenableState = task.blockedSegment),
      (prevThenableState.lastPushedText = pushTextInstance(
        task.blockedSegment.chunks,
        node,
        request.responseState,
        prevThenableState.lastPushedText
      )))
    : "number" === typeof node &&
      ((prevThenableState = task.blockedSegment),
      (prevThenableState.lastPushedText = pushTextInstance(
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
      var thenableState$16 = getThenableStateAfterSuspending(),
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
        thenableState$16,
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
      throw ((task.blockedSegment.formatContext = previousFormatContext),
      (task.legacyContext = previousLegacyContext),
      (task.context = previousContext),
      switchContext(previousContext),
      node);
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
      boundary.fallbackAbortableTasks.forEach(function(fallbackTask) {
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
        throw Error(
          "There can only be one root segment. This is a bug in React."
        );
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
            (null !== request.completedRootSegment ||
              0 < request.pendingRootTasks) &&
              hoistResourcesToRoot(request.resources, boundary.resources),
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
function flushSubtree(request, destination, segment) {
  segment.parentFlushed = !0;
  switch (segment.status) {
    case 0:
      var segmentID = (segment.id = request.nextSegmentId++);
      segment.lastPushedText = !1;
      segment.textEmbedded = !1;
      request = request.responseState;
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
  if (boundary.forceClientRender)
    (boundary = boundary.errorDigest),
      writeChunkAndReturn(destination, "\x3c!--$!--\x3e"),
      writeChunk(destination, "<template"),
      boundary &&
        (writeChunk(destination, ' data-dgst="'),
        writeChunk(destination, escapeTextForBrowser(boundary)),
        writeChunk(destination, '"')),
      writeChunkAndReturn(destination, "></template>"),
      flushSubtree(request, destination, segment);
  else if (0 < boundary.pendingTasks) {
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
  } else if (boundary.byteSize > request.progressiveChunkSize)
    (boundary.rootSegmentID = request.nextSegmentId++),
      request.completedBoundaries.push(boundary),
      writeStartPendingSuspenseBoundary(
        destination,
        request.responseState,
        boundary.id
      ),
      flushSubtree(request, destination, segment);
  else {
    hoistResources(request.resources, boundary.resources);
    writeChunkAndReturn(destination, "\x3c!--$--\x3e");
    segment = boundary.completedSegments;
    if (1 !== segment.length)
      throw Error(
        "A previously unvisited boundary must have exactly one root segment. This is a bug in React."
      );
    flushSegment(request, destination, segment[0]);
  }
  return writeChunkAndReturn(destination, "\x3c!--/$--\x3e");
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
  request = request.responseState;
  completedSegments = boundary.id;
  i = boundary.rootSegmentID;
  boundary = boundary.resources;
  var hasStyleDependencies;
  b: {
    for (hasStyleDependencies = boundary.values(); ; ) {
      var resource = hasStyleDependencies.next().value;
      if (!resource) break;
      if (!resource.inShell) {
        hasStyleDependencies = !0;
        break b;
      }
    }
    hasStyleDependencies = !1;
  }
  (resource = 0 === request.streamingFormat)
    ? (writeChunk(destination, request.startInlineScript),
      hasStyleDependencies
        ? request.sentCompleteBoundaryFunction
          ? request.sentStyleInsertionFunction
            ? writeChunk(destination, '$RR("')
            : ((request.sentStyleInsertionFunction = !0),
              writeChunk(
                destination,
                '$RM=new Map;\n$RR=function(p,q,v){function r(l){this.s=l}for(var t=$RC,u=$RM,m=new Map,n=document,g,e,f=n.querySelectorAll("link[data-precedence],style[data-precedence]"),d=0;e=f[d++];)m.set(e.dataset.precedence,g=e);e=0;f=[];for(var c,h,b,a;c=v[e++];){var k=0;h=c[k++];if(b=u.get(h))"l"!==b.s&&f.push(b);else{a=n.createElement("link");a.href=h;a.rel="stylesheet";for(a.dataset.precedence=d=c[k++];b=c[k++];)a.setAttribute(b,c[k++]);b=a._p=new Promise(function(l,w){a.onload=l;a.onerror=w});b.then(r.bind(b,\n"l"),r.bind(b,"e"));u.set(h,b);f.push(b);c=m.get(d)||g;c===g&&(g=a);m.set(d,a);c?c.parentNode.insertBefore(a,c.nextSibling):(d=n.head,d.insertBefore(a,d.firstChild))}}Promise.all(f).then(t.bind(null,p,q,""),t.bind(null,p,q,"Resource failed to load"))};;$RR("'
              ))
          : ((request.sentCompleteBoundaryFunction = !0),
            (request.sentStyleInsertionFunction = !0),
            writeChunk(
              destination,
              '$RC=function(b,c,e){c=document.getElementById(c);c.parentNode.removeChild(c);var a=document.getElementById(b);if(a){b=a.previousSibling;if(e)b.data="$!",a.setAttribute("data-dgst",e);else{e=b.parentNode;a=b.nextSibling;var f=0;do{if(a&&8===a.nodeType){var d=a.data;if("/$"===d)if(0===f)break;else f--;else"$"!==d&&"$?"!==d&&"$!"!==d||f++}d=a.nextSibling;e.removeChild(a);a=d}while(a);for(;c.firstChild;)e.insertBefore(c.firstChild,a);b.data="$"}b._reactRetry&&b._reactRetry()}};;$RM=new Map;\n$RR=function(p,q,v){function r(l){this.s=l}for(var t=$RC,u=$RM,m=new Map,n=document,g,e,f=n.querySelectorAll("link[data-precedence],style[data-precedence]"),d=0;e=f[d++];)m.set(e.dataset.precedence,g=e);e=0;f=[];for(var c,h,b,a;c=v[e++];){var k=0;h=c[k++];if(b=u.get(h))"l"!==b.s&&f.push(b);else{a=n.createElement("link");a.href=h;a.rel="stylesheet";for(a.dataset.precedence=d=c[k++];b=c[k++];)a.setAttribute(b,c[k++]);b=a._p=new Promise(function(l,w){a.onload=l;a.onerror=w});b.then(r.bind(b,\n"l"),r.bind(b,"e"));u.set(h,b);f.push(b);c=m.get(d)||g;c===g&&(g=a);m.set(d,a);c?c.parentNode.insertBefore(a,c.nextSibling):(d=n.head,d.insertBefore(a,d.firstChild))}}Promise.all(f).then(t.bind(null,p,q,""),t.bind(null,p,q,"Resource failed to load"))};;$RR("'
            ))
        : request.sentCompleteBoundaryFunction
        ? writeChunk(destination, '$RC("')
        : ((request.sentCompleteBoundaryFunction = !0),
          writeChunk(
            destination,
            '$RC=function(b,c,e){c=document.getElementById(c);c.parentNode.removeChild(c);var a=document.getElementById(b);if(a){b=a.previousSibling;if(e)b.data="$!",a.setAttribute("data-dgst",e);else{e=b.parentNode;a=b.nextSibling;var f=0;do{if(a&&8===a.nodeType){var d=a.data;if("/$"===d)if(0===f)break;else f--;else"$"!==d&&"$?"!==d&&"$!"!==d||f++}d=a.nextSibling;e.removeChild(a);a=d}while(a);for(;c.firstChild;)e.insertBefore(c.firstChild,a);b.data="$"}b._reactRetry&&b._reactRetry()}};;$RC("'
          )))
    : hasStyleDependencies
    ? writeChunk(destination, '<template data-rri="" data-bid="')
    : writeChunk(destination, '<template data-rci="" data-bid="');
  if (null === completedSegments)
    throw Error(
      "An ID must have been assigned before we can complete the boundary."
    );
  i = i.toString(16);
  writeChunk(destination, completedSegments);
  resource
    ? writeChunk(destination, '","')
    : writeChunk(destination, '" data-sid="');
  writeChunk(destination, request.segmentPrefix);
  writeChunk(destination, i);
  hasStyleDependencies
    ? resource
      ? (writeChunk(destination, '",'),
        writeStyleResourceDependenciesInJS(destination, boundary))
      : (writeChunk(destination, '" data-sty="'),
        writeStyleResourceDependenciesInAttr(destination, boundary))
    : resource && writeChunk(destination, '"');
  destination = resource
    ? writeChunkAndReturn(destination, ")\x3c/script>")
    : writeChunkAndReturn(destination, '"></template>');
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
      throw Error(
        "A root segment ID must have been assigned by now. This is a bug in React."
      );
    return flushSegmentContainer(request, destination, segment);
  }
  flushSegmentContainer(request, destination, segment);
  request = request.responseState;
  (boundary = 0 === request.streamingFormat)
    ? (writeChunk(destination, request.startInlineScript),
      request.sentCompleteSegmentFunction
        ? writeChunk(destination, '$RS("')
        : ((request.sentCompleteSegmentFunction = !0),
          writeChunk(
            destination,
            '$RS=function(a,b){a=document.getElementById(a);b=document.getElementById(b);for(a.parentNode.removeChild(a);a.firstChild;)b.parentNode.insertBefore(a.firstChild,b);b.parentNode.removeChild(b)};;$RS("'
          )))
    : writeChunk(destination, '<template data-rsi="" data-sid="');
  writeChunk(destination, request.segmentPrefix);
  segmentID = segmentID.toString(16);
  writeChunk(destination, segmentID);
  boundary
    ? writeChunk(destination, '","')
    : writeChunk(destination, '" data-pid="');
  writeChunk(destination, request.placeholderPrefix);
  writeChunk(destination, segmentID);
  destination = boundary
    ? writeChunkAndReturn(destination, '")\x3c/script>')
    : writeChunkAndReturn(destination, '"></template>');
  return destination;
}
function flushCompletedQueues(request, destination) {
  try {
    var i,
      completedRootSegment = request.completedRootSegment;
    if (null !== completedRootSegment)
      if (0 === request.pendingRootTasks) {
        var preamble = request.preamble;
        for (i = 0; i < preamble.length; i++) destination.buffer += preamble[i];
        writeInitialResources(
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
          writeChunk(destination, bootstrapChunks[completedRootSegment]);
        completedRootSegment < bootstrapChunks.length &&
          writeChunkAndReturn(
            destination,
            bootstrapChunks[completedRootSegment]
          );
      } else return;
    else
      writeImmediateResources(
        destination,
        request.resources,
        request.responseState
      );
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
        ? ((bootstrapChunks.buffer += responseState.startInlineScript),
          responseState.sentClientRenderFunction
            ? (bootstrapChunks.buffer += '$RX("')
            : ((responseState.sentClientRenderFunction = !0),
              (bootstrapChunks.buffer +=
                '$RX=function(b,c,d,e){var a=document.getElementById(b);a&&(b=a.previousSibling,b.data="$!",a=a.dataset,c&&(a.dgst=c),d&&(a.msg=d),e&&(a.stck=e),b._reactRetry&&b._reactRetry())};;$RX("')))
        : (bootstrapChunks.buffer += '<template data-rxi="" data-bid="');
      if (null === boundaryID)
        throw Error(
          "An ID must have been assigned before we can complete the boundary."
        );
      bootstrapChunks.buffer += boundaryID;
      scriptFormat && (bootstrapChunks.buffer += '"');
      if (errorDigest || errorMessage || errorComponentStack)
        if (scriptFormat) {
          bootstrapChunks.buffer += ",";
          var chunk = escapeJSStringsForInstructionScripts(errorDigest || "");
          bootstrapChunks.buffer += chunk;
        } else {
          bootstrapChunks.buffer += '" data-dgst="';
          var chunk$jscomp$0 = escapeTextForBrowser(errorDigest || "");
          bootstrapChunks.buffer += chunk$jscomp$0;
        }
      if (errorMessage || errorComponentStack)
        if (scriptFormat) {
          bootstrapChunks.buffer += ",";
          var chunk$jscomp$1 = escapeJSStringsForInstructionScripts(
            errorMessage || ""
          );
          bootstrapChunks.buffer += chunk$jscomp$1;
        } else {
          bootstrapChunks.buffer += '" data-msg="';
          var chunk$jscomp$2 = escapeTextForBrowser(errorMessage || "");
          bootstrapChunks.buffer += chunk$jscomp$2;
        }
      if (errorComponentStack)
        if (scriptFormat) {
          bootstrapChunks.buffer += ",";
          var chunk$jscomp$3 = escapeJSStringsForInstructionScripts(
            errorComponentStack
          );
          bootstrapChunks.buffer += chunk$jscomp$3;
        } else {
          bootstrapChunks.buffer += '" data-stck="';
          var chunk$jscomp$4 = escapeTextForBrowser(errorComponentStack);
          bootstrapChunks.buffer += chunk$jscomp$4;
        }
      if (
        scriptFormat
          ? !writeChunkAndReturn(bootstrapChunks, ")\x3c/script>")
          : !writeChunkAndReturn(bootstrapChunks, '"></template>')
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
      var boundary$18 = partialBoundaries[i];
      a: {
        clientRenderedBoundaries = request;
        boundary = destination;
        clientRenderedBoundaries.resources.boundaryResources =
          boundary$18.resources;
        var completedSegments = boundary$18.completedSegments;
        for (
          responseState = 0;
          responseState < completedSegments.length;
          responseState++
        )
          if (
            !flushPartiallyCompletedSegment(
              clientRenderedBoundaries,
              boundary,
              boundary$18,
              completedSegments[responseState]
            )
          ) {
            responseState++;
            completedSegments.splice(0, responseState);
            var JSCompiler_inline_result = !1;
            break a;
          }
        completedSegments.splice(0, responseState);
        JSCompiler_inline_result = !0;
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
    if (
      0 === request.allPendingTasks &&
      0 === request.pingedTasks.length &&
      0 === request.clientRenderedBoundaries.length &&
      0 === request.completedBoundaries.length
    ) {
      request = request.postamble;
      for (i = 0; i < request.length; i++) destination.buffer += request[i];
      destination.done = !0;
    }
  }
}
function abort(request, reason) {
  try {
    var abortableTasks = request.abortableTasks;
    if (0 < abortableTasks.size) {
      var error =
        void 0 === reason
          ? Error("The render was aborted by the server without a reason.")
          : reason;
      abortableTasks.forEach(function(task) {
        return abortTask(task, request, error);
      });
      abortableTasks.clear();
    }
    null !== request.destination &&
      flushCompletedQueues(request, request.destination);
  } catch (error$21) {
    logRecoverableError(request, error$21), fatalError(request, error$21);
  }
}
exports.abortStream = function(stream) {
  abort(stream.request);
};
exports.debug = function(stream) {
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
exports.hasFinished = function(stream) {
  return stream.destination.done;
};
exports.renderNextChunk = function(stream) {
  var request = stream.request;
  stream = stream.destination;
  if (2 !== request.status) {
    var prevContext = currentActiveSnapshot,
      prevDispatcher = ReactCurrentDispatcher$1.current;
    ReactCurrentDispatcher$1.current = HooksDispatcher;
    var prevCacheDispatcher = ReactCurrentCache.current;
    ReactCurrentCache.current = DefaultCacheDispatcher;
    var resources = request.resources;
    currentResourcesStack.push(currentResources);
    currentResources = resources;
    resources = ReactDOMCurrentDispatcher.current;
    ReactDOMCurrentDispatcher.current = ReactDOMServerDispatcher;
    var prevResponseState = currentResponseState;
    currentResponseState = request.responseState;
    try {
      var pingedTasks = request.pingedTasks,
        i;
      for (i = 0; i < pingedTasks.length; i++) {
        var task = pingedTasks[i],
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
            segment.lastPushedText &&
              segment.textEmbedded &&
              segment.chunks.push("\x3c!-- --\x3e");
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
              var boundary = task.blockedBoundary,
                error$jscomp$0 = x,
                errorDigest = logRecoverableError(request, error$jscomp$0);
              null === boundary
                ? fatalError(request, error$jscomp$0)
                : (boundary.pendingTasks--,
                  boundary.forceClientRender ||
                    ((boundary.forceClientRender = !0),
                    (boundary.errorDigest = errorDigest),
                    boundary.parentFlushed &&
                      request.clientRenderedBoundaries.push(boundary)));
              request.allPendingTasks--;
              if (0 === request.allPendingTasks) {
                var onAllReady = request.onAllReady;
                onAllReady();
              }
            }
          } finally {
            request.resources.boundaryResources = null;
          }
        }
      }
      pingedTasks.splice(0, i);
      null !== request.destination &&
        flushCompletedQueues(request, request.destination);
    } catch (error) {
      logRecoverableError(request, error), fatalError(request, error);
    } finally {
      (currentResponseState = prevResponseState),
        (ReactCurrentDispatcher$1.current = prevDispatcher),
        (ReactCurrentCache.current = prevCacheDispatcher),
        (currentResources = currentResourcesStack.pop()),
        (ReactDOMCurrentDispatcher.current = resources),
        prevDispatcher === HooksDispatcher && switchContext(prevContext);
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
      logRecoverableError(request, error), fatalError(request, error);
    }
  }
  if (stream.fatal) throw stream.error;
  request = stream.buffer;
  stream.buffer = "";
  return request;
};
exports.renderToStream = function(children, options) {
  var destination = { buffer: "", done: !1, fatal: !1, error: null },
    identifierPrefix = options ? options.identifierPrefix : void 0,
    bootstrapScriptContent = options ? options.bootstrapScriptContent : void 0,
    bootstrapScripts = options ? options.bootstrapScripts : void 0,
    bootstrapModules = options ? options.bootstrapModules : void 0,
    externalRuntimeConfig = options
      ? options.unstable_externalRuntimeSrc
      : void 0;
  identifierPrefix = void 0 === identifierPrefix ? "" : identifierPrefix;
  var JSCompiler_inline_result = [];
  var externalRuntimeDesc = null,
    streamingFormat = 0;
  void 0 !== bootstrapScriptContent &&
    JSCompiler_inline_result.push(
      "<script>",
      ("" + bootstrapScriptContent).replace(scriptRegex, scriptReplacer),
      "\x3c/script>"
    );
  void 0 !== externalRuntimeConfig &&
    ((streamingFormat = 1),
    (externalRuntimeDesc =
      "string" === typeof externalRuntimeConfig
        ? { src: externalRuntimeConfig, integrity: void 0 }
        : externalRuntimeConfig));
  if (void 0 !== bootstrapScripts)
    for (
      bootstrapScriptContent = 0;
      bootstrapScriptContent < bootstrapScripts.length;
      bootstrapScriptContent++
    ) {
      externalRuntimeConfig = bootstrapScripts[bootstrapScriptContent];
      var integrity =
        "string" === typeof externalRuntimeConfig
          ? void 0
          : externalRuntimeConfig.integrity;
      JSCompiler_inline_result.push(
        '<script src="',
        escapeTextForBrowser(
          "string" === typeof externalRuntimeConfig
            ? externalRuntimeConfig
            : externalRuntimeConfig.src
        )
      );
      integrity &&
        JSCompiler_inline_result.push(
          '" integrity="',
          escapeTextForBrowser(integrity)
        );
      JSCompiler_inline_result.push('" async="">\x3c/script>');
    }
  if (void 0 !== bootstrapModules)
    for (
      bootstrapScripts = 0;
      bootstrapScripts < bootstrapModules.length;
      bootstrapScripts++
    )
      (bootstrapScriptContent = bootstrapModules[bootstrapScripts]),
        (externalRuntimeConfig =
          "string" === typeof bootstrapScriptContent
            ? void 0
            : bootstrapScriptContent.integrity),
        JSCompiler_inline_result.push(
          '<script type="module" src="',
          escapeTextForBrowser(
            "string" === typeof bootstrapScriptContent
              ? bootstrapScriptContent
              : bootstrapScriptContent.src
          )
        ),
        externalRuntimeConfig &&
          JSCompiler_inline_result.push(
            '" integrity="',
            escapeTextForBrowser(externalRuntimeConfig)
          ),
        JSCompiler_inline_result.push('" async="">\x3c/script>');
  JSCompiler_inline_result = {
    bootstrapChunks: JSCompiler_inline_result,
    placeholderPrefix: identifierPrefix + "P:",
    segmentPrefix: identifierPrefix + "S:",
    boundaryPrefix: identifierPrefix + "B:",
    idPrefix: identifierPrefix,
    nextSuspenseID: 0,
    streamingFormat: streamingFormat,
    startInlineScript: "<script>",
    sentCompleteSegmentFunction: !1,
    sentCompleteBoundaryFunction: !1,
    sentClientRenderFunction: !1,
    sentStyleInsertionFunction: !1,
    externalRuntimeConfig: externalRuntimeDesc
  };
  bootstrapModules = createFormatContext(0, null, !1);
  externalRuntimeDesc = options ? options.progressiveChunkSize : void 0;
  streamingFormat = options.onError;
  options = [];
  identifierPrefix = new Set();
  bootstrapScripts = {
    preloadsMap: new Map(),
    stylesMap: new Map(),
    scriptsMap: new Map(),
    headsMap: new Map(),
    charset: null,
    bases: new Set(),
    preconnects: new Set(),
    fontPreloads: new Set(),
    precedences: new Map(),
    usedStylePreloads: new Set(),
    scripts: new Set(),
    usedScriptPreloads: new Set(),
    explicitStylePreloads: new Set(),
    explicitScriptPreloads: new Set(),
    headResources: new Set(),
    structuredMetaKeys: new Map(),
    boundaryResources: null
  };
  JSCompiler_inline_result = {
    destination: null,
    responseState: JSCompiler_inline_result,
    progressiveChunkSize:
      void 0 === externalRuntimeDesc ? 12800 : externalRuntimeDesc,
    status: 0,
    fatalError: null,
    nextSegmentId: 0,
    allPendingTasks: 0,
    pendingRootTasks: 0,
    resources: bootstrapScripts,
    completedRootSegment: null,
    abortableTasks: identifierPrefix,
    pingedTasks: options,
    clientRenderedBoundaries: [],
    completedBoundaries: [],
    partialBoundaries: [],
    preamble: [],
    postamble: [],
    onError: void 0 === streamingFormat ? defaultErrorHandler : streamingFormat,
    onAllReady: noop$2,
    onShellReady: noop$2,
    onShellError: noop$2,
    onFatalError: noop$2
  };
  bootstrapModules = createPendingSegment(
    JSCompiler_inline_result,
    0,
    null,
    bootstrapModules,
    !1,
    !1
  );
  bootstrapModules.parentFlushed = !0;
  children = createTask(
    JSCompiler_inline_result,
    null,
    children,
    null,
    bootstrapModules,
    identifierPrefix,
    emptyContextObject,
    null,
    emptyTreeContext
  );
  options.push(children);
  if (destination.fatal) throw destination.error;
  return { destination: destination, request: JSCompiler_inline_result };
};
