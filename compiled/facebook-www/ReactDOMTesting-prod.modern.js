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
 Modernizr 3.0.0pre (Custom Build) | MIT
*/
"use strict";
var React = require("react"),
  Scheduler = require("scheduler"),
  Internals = {
    usingClientEntryPoint: !1,
    Events: null,
    Dispatcher: { current: null }
  };
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
var randomKey = Math.random().toString(36).slice(2),
  internalInstanceKey = "__reactFiber$" + randomKey,
  internalPropsKey = "__reactProps$" + randomKey,
  internalContainerInstanceKey = "__reactContainer$" + randomKey,
  internalEventHandlersKey = "__reactEvents$" + randomKey,
  internalEventHandlerListenersKey = "__reactListeners$" + randomKey,
  internalEventHandlesSetKey = "__reactHandles$" + randomKey,
  internalRootNodeResourcesKey = "__reactResources$" + randomKey,
  internalResourceMarker = "__reactMarker$" + randomKey;
function detachDeletedInstance(node) {
  delete node[internalInstanceKey];
  delete node[internalPropsKey];
  delete node[internalEventHandlersKey];
  delete node[internalEventHandlerListenersKey];
  delete node[internalEventHandlesSetKey];
}
function getClosestInstanceFromNode(targetNode) {
  var targetInst = targetNode[internalInstanceKey];
  if (targetInst) return targetInst;
  for (var parentNode = targetNode.parentNode; parentNode; ) {
    if (
      (targetInst =
        parentNode[internalContainerInstanceKey] ||
        parentNode[internalInstanceKey])
    ) {
      parentNode = targetInst.alternate;
      if (
        null !== targetInst.child ||
        (null !== parentNode && null !== parentNode.child)
      )
        for (
          targetNode = getParentSuspenseInstance(targetNode);
          null !== targetNode;

        ) {
          if ((parentNode = targetNode[internalInstanceKey])) return parentNode;
          targetNode = getParentSuspenseInstance(targetNode);
        }
      return targetInst;
    }
    targetNode = parentNode;
    parentNode = targetNode.parentNode;
  }
  return null;
}
function getInstanceFromNode(node) {
  if (
    (node = node[internalInstanceKey] || node[internalContainerInstanceKey])
  ) {
    var tag = node.tag;
    if (
      5 === tag ||
      6 === tag ||
      13 === tag ||
      26 === tag ||
      27 === tag ||
      3 === tag
    )
      return node;
  }
  return null;
}
function getNodeFromInstance(inst) {
  var tag = inst.tag;
  if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return inst.stateNode;
  throw Error(formatProdErrorMessage(33));
}
function getFiberCurrentPropsFromNode(node) {
  return node[internalPropsKey] || null;
}
function getEventListenerSet(node) {
  var elementListenerSet = node[internalEventHandlersKey];
  void 0 === elementListenerSet &&
    (elementListenerSet = node[internalEventHandlersKey] = new Set());
  return elementListenerSet;
}
function addEventHandleToTarget(target, eventHandle) {
  var eventHandles = target[internalEventHandlesSetKey];
  void 0 === eventHandles &&
    (eventHandles = target[internalEventHandlesSetKey] = new Set());
  eventHandles.add(eventHandle);
}
function doesTargetHaveEventHandle(target, eventHandle) {
  target = target[internalEventHandlesSetKey];
  return void 0 === target ? !1 : target.has(eventHandle);
}
function getResourcesFromRoot(root) {
  var resources = root[internalRootNodeResourcesKey];
  resources ||
    (resources = root[internalRootNodeResourcesKey] =
      {
        styles: new Map(),
        scripts: new Map(),
        head: new Map(),
        lastStructuredMeta: new Map()
      });
  return resources;
}
var tagToRoleMappings = {
  ARTICLE: "article",
  ASIDE: "complementary",
  BODY: "document",
  BUTTON: "button",
  DATALIST: "listbox",
  DD: "definition",
  DETAILS: "group",
  DIALOG: "dialog",
  DT: "term",
  FIELDSET: "group",
  FIGURE: "figure",
  FORM: "form",
  FOOTER: "contentinfo",
  H1: "heading",
  H2: "heading",
  H3: "heading",
  H4: "heading",
  H5: "heading",
  H6: "heading",
  HEADER: "banner",
  HR: "separator",
  LEGEND: "legend",
  LI: "listitem",
  MATH: "math",
  MAIN: "main",
  MENU: "list",
  NAV: "navigation",
  OL: "list",
  OPTGROUP: "group",
  OPTION: "option",
  OUTPUT: "status",
  PROGRESS: "progressbar",
  SECTION: "region",
  SUMMARY: "button",
  TABLE: "table",
  TBODY: "rowgroup",
  TEXTAREA: "textbox",
  TFOOT: "rowgroup",
  TD: "cell",
  TH: "columnheader",
  THEAD: "rowgroup",
  TR: "row",
  UL: "list"
};
function getImplicitRole(element) {
  var mappedByTag = tagToRoleMappings[element.tagName];
  if (void 0 !== mappedByTag) return mappedByTag;
  switch (element.tagName) {
    case "A":
    case "AREA":
    case "LINK":
      if (element.hasAttribute("href")) return "link";
      break;
    case "IMG":
      if (0 < (element.getAttribute("alt") || "").length) return "img";
      break;
    case "INPUT":
      switch (((mappedByTag = element.type), mappedByTag)) {
        case "button":
        case "image":
        case "reset":
        case "submit":
          return "button";
        case "checkbox":
        case "radio":
          return mappedByTag;
        case "range":
          return "slider";
        case "email":
        case "tel":
        case "text":
        case "url":
          return element.hasAttribute("list") ? "combobox" : "textbox";
        case "search":
          return element.hasAttribute("list") ? "combobox" : "searchbox";
        default:
          return null;
      }
    case "SELECT":
      return element.hasAttribute("multiple") || 1 < element.size
        ? "listbox"
        : "combobox";
  }
  return null;
}
var allNativeEvents = new Set();
allNativeEvents.add("beforeblur");
allNativeEvents.add("afterblur");
var registrationNameDependencies = {};
function registerTwoPhaseEvent(registrationName, dependencies) {
  registerDirectEvent(registrationName, dependencies);
  registerDirectEvent(registrationName + "Capture", dependencies);
}
function registerDirectEvent(registrationName, dependencies) {
  registrationNameDependencies[registrationName] = dependencies;
  for (
    registrationName = 0;
    registrationName < dependencies.length;
    registrationName++
  )
    allNativeEvents.add(dependencies[registrationName]);
}
var canUseDOM = !(
    "undefined" === typeof window ||
    "undefined" === typeof window.document ||
    "undefined" === typeof window.document.createElement
  ),
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
function shouldRemoveAttributeWithWarning(
  name,
  value,
  propertyInfo,
  isCustomComponentTag
) {
  if (null !== propertyInfo && 0 === propertyInfo.type) return !1;
  switch (typeof value) {
    case "function":
    case "symbol":
      return !0;
    case "boolean":
      if (isCustomComponentTag) return !1;
      if (null !== propertyInfo) return !propertyInfo.acceptsBooleans;
      name = name.toLowerCase().slice(0, 5);
      return "data-" !== name && "aria-" !== name;
    default:
      return !1;
  }
}
function shouldRemoveAttribute(
  name,
  value,
  propertyInfo,
  isCustomComponentTag
) {
  if (
    null === value ||
    "undefined" === typeof value ||
    shouldRemoveAttributeWithWarning(
      name,
      value,
      propertyInfo,
      isCustomComponentTag
    )
  )
    return !0;
  if (isCustomComponentTag) return !1;
  if (null !== propertyInfo)
    switch (propertyInfo.type) {
      case 3:
        return !value;
      case 4:
        return !1 === value;
      case 5:
        return isNaN(value);
      case 6:
        return isNaN(value) || 1 > value;
    }
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
var properties = {};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style"
  .split(" ")
  .forEach(function (name) {
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
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height"
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
var isJavaScriptProtocol =
  /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
function setValueForProperty(node, name, value, isCustomComponentTag) {
  var JSCompiler_inline_result = properties.hasOwnProperty(name)
    ? properties[name]
    : null;
  if (
    null !== JSCompiler_inline_result
      ? 0 !== JSCompiler_inline_result.type
      : isCustomComponentTag ||
        !(2 < name.length) ||
        ("o" !== name[0] && "O" !== name[0]) ||
        ("n" !== name[1] && "N" !== name[1])
  )
    if (
      (shouldRemoveAttribute(
        name,
        value,
        JSCompiler_inline_result,
        isCustomComponentTag
      ) && (value = null),
      isCustomComponentTag || null === JSCompiler_inline_result)
    )
      isAttributeNameSafe(name) &&
        (null === value
          ? node.removeAttribute(name)
          : node.setAttribute(name, "" + value));
    else if (JSCompiler_inline_result.mustUseProperty)
      node[JSCompiler_inline_result.propertyName] =
        null === value
          ? 3 === JSCompiler_inline_result.type
            ? !1
            : ""
          : value;
    else if (
      ((name = JSCompiler_inline_result.attributeName),
      (isCustomComponentTag = JSCompiler_inline_result.attributeNamespace),
      null === value)
    )
      node.removeAttribute(name);
    else {
      var type$2 = JSCompiler_inline_result.type;
      if (3 === type$2 || (4 === type$2 && !0 === value)) value = "";
      else if (
        ((value = "" + value),
        JSCompiler_inline_result.sanitizeURL &&
          isJavaScriptProtocol.test(value.toString()))
      )
        throw Error(formatProdErrorMessage(323));
      isCustomComponentTag
        ? node.setAttributeNS(isCustomComponentTag, name, value)
        : node.setAttribute(name, value);
    }
}
var ReactSharedInternals =
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,
  REACT_ELEMENT_TYPE = Symbol.for("react.element"),
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
  REACT_SCOPE_TYPE = Symbol.for("react.scope");
Symbol.for("react.debug_trace_mode");
var REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen"),
  REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden"),
  REACT_CACHE_TYPE = Symbol.for("react.cache");
Symbol.for("react.tracing_marker");
var REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED = Symbol.for(
    "react.default_value"
  ),
  MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
function getIteratorFn(maybeIterable) {
  if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
  maybeIterable =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable["@@iterator"];
  return "function" === typeof maybeIterable ? maybeIterable : null;
}
var assign = Object.assign,
  prefix;
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
  try {
    if (construct)
      if (
        ((construct = function () {
          throw Error();
        }),
        Object.defineProperty(construct.prototype, "props", {
          set: function () {
            throw Error();
          }
        }),
        "object" === typeof Reflect && Reflect.construct)
      ) {
        try {
          Reflect.construct(construct, []);
        } catch (x) {
          var control = x;
        }
        Reflect.construct(fn, [], construct);
      } else {
        try {
          construct.call();
        } catch (x$3) {
          control = x$3;
        }
        fn.call(construct.prototype);
      }
    else {
      try {
        throw Error();
      } catch (x$4) {
        control = x$4;
      }
      fn();
    }
  } catch (sample) {
    if (sample && control && "string" === typeof sample.stack) {
      for (
        var sampleLines = sample.stack.split("\n"),
          controlLines = control.stack.split("\n"),
          s = sampleLines.length - 1,
          c = controlLines.length - 1;
        1 <= s && 0 <= c && sampleLines[s] !== controlLines[c];

      )
        c--;
      for (; 1 <= s && 0 <= c; s--, c--)
        if (sampleLines[s] !== controlLines[c]) {
          if (1 !== s || 1 !== c) {
            do
              if ((s--, c--, 0 > c || sampleLines[s] !== controlLines[c])) {
                var frame = "\n" + sampleLines[s].replace(" at new ", " at ");
                fn.displayName &&
                  frame.includes("<anonymous>") &&
                  (frame = frame.replace("<anonymous>", fn.displayName));
                return frame;
              }
            while (1 <= s && 0 <= c);
          }
          break;
        }
    }
  } finally {
    (reentry = !1), (Error.prepareStackTrace = previousPrepareStackTrace);
  }
  return (fn = fn ? fn.displayName || fn.name : "")
    ? describeBuiltInComponentFrame(fn)
    : "";
}
function describeFiber(fiber) {
  switch (fiber.tag) {
    case 26:
    case 27:
    case 5:
      return describeBuiltInComponentFrame(fiber.type);
    case 16:
      return describeBuiltInComponentFrame("Lazy");
    case 13:
      return describeBuiltInComponentFrame("Suspense");
    case 19:
      return describeBuiltInComponentFrame("SuspenseList");
    case 0:
    case 2:
    case 15:
      return (fiber = describeNativeComponentFrame(fiber.type, !1)), fiber;
    case 11:
      return (
        (fiber = describeNativeComponentFrame(fiber.type.render, !1)), fiber
      );
    case 1:
      return (fiber = describeNativeComponentFrame(fiber.type, !0)), fiber;
    default:
      return "";
  }
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
function getToStringValue(value) {
  switch (typeof value) {
    case "boolean":
    case "number":
    case "string":
    case "undefined":
      return value;
    case "object":
      return value;
    default:
      return "";
  }
}
function isCheckable(elem) {
  var type = elem.type;
  return (
    (elem = elem.nodeName) &&
    "input" === elem.toLowerCase() &&
    ("checkbox" === type || "radio" === type)
  );
}
function trackValueOnNode(node) {
  var valueField = isCheckable(node) ? "checked" : "value",
    descriptor = Object.getOwnPropertyDescriptor(
      node.constructor.prototype,
      valueField
    ),
    currentValue = "" + node[valueField];
  if (
    !node.hasOwnProperty(valueField) &&
    "undefined" !== typeof descriptor &&
    "function" === typeof descriptor.get &&
    "function" === typeof descriptor.set
  ) {
    var get = descriptor.get,
      set = descriptor.set;
    Object.defineProperty(node, valueField, {
      configurable: !0,
      get: function () {
        return get.call(this);
      },
      set: function (value) {
        currentValue = "" + value;
        set.call(this, value);
      }
    });
    Object.defineProperty(node, valueField, {
      enumerable: descriptor.enumerable
    });
    return {
      getValue: function () {
        return currentValue;
      },
      setValue: function (value) {
        currentValue = "" + value;
      },
      stopTracking: function () {
        node._valueTracker = null;
        delete node[valueField];
      }
    };
  }
}
function track(node) {
  node._valueTracker || (node._valueTracker = trackValueOnNode(node));
}
function updateValueIfChanged(node) {
  if (!node) return !1;
  var tracker = node._valueTracker;
  if (!tracker) return !0;
  var lastValue = tracker.getValue();
  var value = "";
  node &&
    (value = isCheckable(node)
      ? node.checked
        ? "true"
        : "false"
      : node.value);
  node = value;
  return node !== lastValue ? (tracker.setValue(node), !0) : !1;
}
function getActiveElement(doc) {
  doc = doc || ("undefined" !== typeof document ? document : void 0);
  if ("undefined" === typeof doc) return null;
  try {
    return doc.activeElement || doc.body;
  } catch (e) {
    return doc.body;
  }
}
function getHostProps(element, props) {
  var checked = props.checked;
  return assign({}, props, {
    defaultChecked: void 0,
    defaultValue: void 0,
    value: void 0,
    checked: null != checked ? checked : element._wrapperState.initialChecked
  });
}
function initWrapperState(element, props) {
  var defaultValue = null == props.defaultValue ? "" : props.defaultValue,
    JSCompiler_temp_const =
      null != props.checked ? props.checked : props.defaultChecked;
  defaultValue = getToStringValue(
    null != props.value ? props.value : defaultValue
  );
  element._wrapperState = {
    initialChecked: JSCompiler_temp_const,
    initialValue: defaultValue,
    controlled:
      "checkbox" === props.type || "radio" === props.type
        ? null != props.checked
        : null != props.value
  };
}
function updateChecked(element, props) {
  props = props.checked;
  null != props && setValueForProperty(element, "checked", props, !1);
}
function updateWrapper(element, props) {
  updateChecked(element, props);
  var value = getToStringValue(props.value),
    type = props.type;
  if (null != value)
    if ("number" === type) {
      if ((0 === value && "" === element.value) || element.value != value)
        element.value = "" + value;
    } else element.value !== "" + value && (element.value = "" + value);
  else if ("submit" === type || "reset" === type) {
    element.removeAttribute("value");
    return;
  }
  props.hasOwnProperty("value")
    ? setDefaultValue(element, props.type, value)
    : props.hasOwnProperty("defaultValue") &&
      setDefaultValue(
        element,
        props.type,
        getToStringValue(props.defaultValue)
      );
  null == props.checked &&
    null != props.defaultChecked &&
    (element.defaultChecked = !!props.defaultChecked);
}
function postMountWrapper(element, props, isHydrating) {
  if (props.hasOwnProperty("value") || props.hasOwnProperty("defaultValue")) {
    var type = props.type;
    if (
      !(
        ("submit" !== type && "reset" !== type) ||
        (void 0 !== props.value && null !== props.value)
      )
    )
      return;
    props = "" + element._wrapperState.initialValue;
    isHydrating || props === element.value || (element.value = props);
    element.defaultValue = props;
  }
  isHydrating = element.name;
  "" !== isHydrating && (element.name = "");
  element.defaultChecked = !!element._wrapperState.initialChecked;
  "" !== isHydrating && (element.name = isHydrating);
}
function setDefaultValue(node, type, value) {
  if ("number" !== type || getActiveElement(node.ownerDocument) !== node)
    null == value
      ? (node.defaultValue = "" + node._wrapperState.initialValue)
      : node.defaultValue !== "" + value && (node.defaultValue = "" + value);
}
var isArrayImpl = Array.isArray;
function updateOptions(node, multiple, propValue, setDefaultSelected) {
  node = node.options;
  if (multiple) {
    multiple = {};
    for (var i = 0; i < propValue.length; i++)
      multiple["$" + propValue[i]] = !0;
    for (propValue = 0; propValue < node.length; propValue++)
      (i = multiple.hasOwnProperty("$" + node[propValue].value)),
        node[propValue].selected !== i && (node[propValue].selected = i),
        i && setDefaultSelected && (node[propValue].defaultSelected = !0);
  } else {
    propValue = "" + getToStringValue(propValue);
    multiple = null;
    for (i = 0; i < node.length; i++) {
      if (node[i].value === propValue) {
        node[i].selected = !0;
        setDefaultSelected && (node[i].defaultSelected = !0);
        return;
      }
      null !== multiple || node[i].disabled || (multiple = node[i]);
    }
    null !== multiple && (multiple.selected = !0);
  }
}
function getHostProps$2(element, props) {
  if (null != props.dangerouslySetInnerHTML)
    throw Error(formatProdErrorMessage(91));
  return assign({}, props, {
    value: void 0,
    defaultValue: void 0,
    children: "" + element._wrapperState.initialValue
  });
}
function initWrapperState$2(element, props) {
  var initialValue = props.value;
  null == initialValue &&
    ((props = props.defaultValue),
    null == props && (props = ""),
    (initialValue = props));
  element._wrapperState = { initialValue: getToStringValue(initialValue) };
}
function updateWrapper$1(element, props) {
  var value = getToStringValue(props.value),
    defaultValue = getToStringValue(props.defaultValue);
  null != value &&
    ((value = "" + value),
    value !== element.value && (element.value = value),
    null == props.defaultValue &&
      element.defaultValue !== value &&
      (element.defaultValue = value));
  null != defaultValue && (element.defaultValue = "" + defaultValue);
}
function postMountWrapper$3(element) {
  var textContent = element.textContent;
  textContent === element._wrapperState.initialValue &&
    "" !== textContent &&
    null !== textContent &&
    (element.value = textContent);
}
function getIntrinsicNamespace(type) {
  switch (type) {
    case "svg":
      return "http://www.w3.org/2000/svg";
    case "math":
      return "http://www.w3.org/1998/Math/MathML";
    default:
      return "http://www.w3.org/1999/xhtml";
  }
}
function getChildNamespace(parentNamespace, type) {
  return null == parentNamespace ||
    "http://www.w3.org/1999/xhtml" === parentNamespace
    ? getIntrinsicNamespace(type)
    : "http://www.w3.org/2000/svg" === parentNamespace &&
      "foreignObject" === type
    ? "http://www.w3.org/1999/xhtml"
    : parentNamespace;
}
var reusableSVGContainer,
  setInnerHTML = (function (func) {
    return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction
      ? function (arg0, arg1, arg2, arg3) {
          MSApp.execUnsafeLocalFunction(function () {
            return func(arg0, arg1, arg2, arg3);
          });
        }
      : func;
  })(function (node, html) {
    if (
      "http://www.w3.org/2000/svg" !== node.namespaceURI ||
      "innerHTML" in node
    )
      node.innerHTML = html;
    else {
      reusableSVGContainer =
        reusableSVGContainer || document.createElement("div");
      reusableSVGContainer.innerHTML =
        "<svg>" + html.valueOf().toString() + "</svg>";
      for (html = reusableSVGContainer.firstChild; node.firstChild; )
        node.removeChild(node.firstChild);
      for (; html.firstChild; ) node.appendChild(html.firstChild);
    }
  });
function setTextContent(node, text) {
  if (text) {
    var firstChild = node.firstChild;
    if (
      firstChild &&
      firstChild === node.lastChild &&
      3 === firstChild.nodeType
    ) {
      firstChild.nodeValue = text;
      return;
    }
  }
  node.textContent = text;
}
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
function dangerousStyleValue(name, value, isCustomProperty) {
  return null == value || "boolean" === typeof value || "" === value
    ? ""
    : isCustomProperty ||
      "number" !== typeof value ||
      0 === value ||
      (isUnitlessNumber.hasOwnProperty(name) && isUnitlessNumber[name])
    ? ("" + value).trim()
    : value + "px";
}
function setValueForStyles(node, styles) {
  node = node.style;
  for (var styleName in styles)
    if (styles.hasOwnProperty(styleName)) {
      var isCustomProperty = 0 === styleName.indexOf("--"),
        styleValue = dangerousStyleValue(
          styleName,
          styles[styleName],
          isCustomProperty
        );
      "float" === styleName && (styleName = "cssFloat");
      isCustomProperty
        ? node.setProperty(styleName, styleValue)
        : (node[styleName] = styleValue);
    }
}
var voidElementTags = assign(
  { menuitem: !0 },
  {
    area: !0,
    base: !0,
    br: !0,
    col: !0,
    embed: !0,
    hr: !0,
    img: !0,
    input: !0,
    keygen: !0,
    link: !0,
    meta: !0,
    param: !0,
    source: !0,
    track: !0,
    wbr: !0
  }
);
function assertValidProps(tag, props) {
  if (props) {
    if (
      voidElementTags[tag] &&
      (null != props.children || null != props.dangerouslySetInnerHTML)
    )
      throw Error(formatProdErrorMessage(137, tag));
    if (null != props.dangerouslySetInnerHTML) {
      if (null != props.children) throw Error(formatProdErrorMessage(60));
      if (
        "object" !== typeof props.dangerouslySetInnerHTML ||
        !("__html" in props.dangerouslySetInnerHTML)
      )
        throw Error(formatProdErrorMessage(61));
    }
    if (null != props.style && "object" !== typeof props.style)
      throw Error(formatProdErrorMessage(62));
  }
}
function isCustomComponent(tagName, props) {
  if (-1 === tagName.indexOf("-")) return "string" === typeof props.is;
  switch (tagName) {
    case "annotation-xml":
    case "color-profile":
    case "font-face":
    case "font-face-src":
    case "font-face-uri":
    case "font-face-format":
    case "font-face-name":
    case "missing-glyph":
      return !1;
    default:
      return !0;
  }
}
var currentReplayingEvent = null;
function getEventTarget(nativeEvent) {
  nativeEvent = nativeEvent.target || nativeEvent.srcElement || window;
  nativeEvent.correspondingUseElement &&
    (nativeEvent = nativeEvent.correspondingUseElement);
  return 3 === nativeEvent.nodeType ? nativeEvent.parentNode : nativeEvent;
}
var restoreImpl = null,
  restoreTarget = null,
  restoreQueue = null;
function restoreStateOfTarget(target) {
  if ((target = getInstanceFromNode(target))) {
    if ("function" !== typeof restoreImpl)
      throw Error(formatProdErrorMessage(280));
    var stateNode = target.stateNode;
    stateNode &&
      ((stateNode = getFiberCurrentPropsFromNode(stateNode)),
      restoreImpl(target.stateNode, target.type, stateNode));
  }
}
function enqueueStateRestore(target) {
  restoreTarget
    ? restoreQueue
      ? restoreQueue.push(target)
      : (restoreQueue = [target])
    : (restoreTarget = target);
}
function restoreStateIfNeeded() {
  if (restoreTarget) {
    var target = restoreTarget,
      queuedTargets = restoreQueue;
    restoreQueue = restoreTarget = null;
    restoreStateOfTarget(target);
    if (queuedTargets)
      for (target = 0; target < queuedTargets.length; target++)
        restoreStateOfTarget(queuedTargets[target]);
  }
}
function batchedUpdatesImpl(fn, bookkeeping) {
  return fn(bookkeeping);
}
function flushSyncImpl() {}
var isInsideEventHandler = !1;
function batchedUpdates(fn, a, b) {
  if (isInsideEventHandler) return fn(a, b);
  isInsideEventHandler = !0;
  try {
    return batchedUpdatesImpl(fn, a, b);
  } finally {
    if (
      ((isInsideEventHandler = !1),
      null !== restoreTarget || null !== restoreQueue)
    )
      flushSyncImpl(), restoreStateIfNeeded();
  }
}
function getListener(inst, registrationName) {
  var stateNode = inst.stateNode;
  if (null === stateNode) return null;
  var props = getFiberCurrentPropsFromNode(stateNode);
  if (null === props) return null;
  stateNode = props[registrationName];
  a: switch (registrationName) {
    case "onClick":
    case "onClickCapture":
    case "onDoubleClick":
    case "onDoubleClickCapture":
    case "onMouseDown":
    case "onMouseDownCapture":
    case "onMouseMove":
    case "onMouseMoveCapture":
    case "onMouseUp":
    case "onMouseUpCapture":
    case "onMouseEnter":
      (props = !props.disabled) ||
        ((inst = inst.type),
        (props = !(
          "button" === inst ||
          "input" === inst ||
          "select" === inst ||
          "textarea" === inst
        )));
      inst = !props;
      break a;
    default:
      inst = !1;
  }
  if (inst) return null;
  if (stateNode && "function" !== typeof stateNode)
    throw Error(
      formatProdErrorMessage(231, registrationName, typeof stateNode)
    );
  return stateNode;
}
var passiveBrowserEventsSupported = !1;
if (canUseDOM)
  try {
    var options = {};
    Object.defineProperty(options, "passive", {
      get: function () {
        passiveBrowserEventsSupported = !0;
      }
    });
    window.addEventListener("test", options, options);
    window.removeEventListener("test", options, options);
  } catch (e) {
    passiveBrowserEventsSupported = !1;
  }
var ReactFbErrorUtils = require("ReactFbErrorUtils");
if ("function" !== typeof ReactFbErrorUtils.invokeGuardedCallback)
  throw Error(formatProdErrorMessage(255));
function invokeGuardedCallbackImpl(name, func, context, a, b, c, d, e, f) {
  ReactFbErrorUtils.invokeGuardedCallback.apply(this, arguments);
}
var hasError = !1,
  caughtError = null,
  hasRethrowError = !1,
  rethrowError = null,
  reporter = {
    onError: function (error) {
      hasError = !0;
      caughtError = error;
    }
  };
function invokeGuardedCallback(name, func, context, a, b, c, d, e, f) {
  hasError = !1;
  caughtError = null;
  invokeGuardedCallbackImpl.apply(reporter, arguments);
}
function invokeGuardedCallbackAndCatchFirstError(
  name,
  func,
  context,
  a,
  b,
  c,
  d,
  e,
  f
) {
  invokeGuardedCallback.apply(this, arguments);
  if (hasError) {
    if (hasError) {
      var error = caughtError;
      hasError = !1;
      caughtError = null;
    } else throw Error(formatProdErrorMessage(198));
    hasRethrowError || ((hasRethrowError = !0), (rethrowError = error));
  }
}
function getNearestMountedFiber(fiber) {
  var node = fiber,
    nearestMounted = fiber;
  if (fiber.alternate) for (; node.return; ) node = node.return;
  else {
    fiber = node;
    do
      (node = fiber),
        0 !== (node.flags & 4098) && (nearestMounted = node.return),
        (fiber = node.return);
    while (fiber);
  }
  return 3 === node.tag ? nearestMounted : null;
}
function getSuspenseInstanceFromFiber(fiber) {
  if (13 === fiber.tag) {
    var suspenseState = fiber.memoizedState;
    null === suspenseState &&
      ((fiber = fiber.alternate),
      null !== fiber && (suspenseState = fiber.memoizedState));
    if (null !== suspenseState) return suspenseState.dehydrated;
  }
  return null;
}
function assertIsMounted(fiber) {
  if (getNearestMountedFiber(fiber) !== fiber)
    throw Error(formatProdErrorMessage(188));
}
function findCurrentFiberUsingSlowPath(fiber) {
  var alternate = fiber.alternate;
  if (!alternate) {
    alternate = getNearestMountedFiber(fiber);
    if (null === alternate) throw Error(formatProdErrorMessage(188));
    return alternate !== fiber ? null : fiber;
  }
  for (var a = fiber, b = alternate; ; ) {
    var parentA = a.return;
    if (null === parentA) break;
    var parentB = parentA.alternate;
    if (null === parentB) {
      b = parentA.return;
      if (null !== b) {
        a = b;
        continue;
      }
      break;
    }
    if (parentA.child === parentB.child) {
      for (parentB = parentA.child; parentB; ) {
        if (parentB === a) return assertIsMounted(parentA), fiber;
        if (parentB === b) return assertIsMounted(parentA), alternate;
        parentB = parentB.sibling;
      }
      throw Error(formatProdErrorMessage(188));
    }
    if (a.return !== b.return) (a = parentA), (b = parentB);
    else {
      for (var didFindChild = !1, child$8 = parentA.child; child$8; ) {
        if (child$8 === a) {
          didFindChild = !0;
          a = parentA;
          b = parentB;
          break;
        }
        if (child$8 === b) {
          didFindChild = !0;
          b = parentA;
          a = parentB;
          break;
        }
        child$8 = child$8.sibling;
      }
      if (!didFindChild) {
        for (child$8 = parentB.child; child$8; ) {
          if (child$8 === a) {
            didFindChild = !0;
            a = parentB;
            b = parentA;
            break;
          }
          if (child$8 === b) {
            didFindChild = !0;
            b = parentB;
            a = parentA;
            break;
          }
          child$8 = child$8.sibling;
        }
        if (!didFindChild) throw Error(formatProdErrorMessage(189));
      }
    }
    if (a.alternate !== b) throw Error(formatProdErrorMessage(190));
  }
  if (3 !== a.tag) throw Error(formatProdErrorMessage(188));
  return a.stateNode.current === a ? fiber : alternate;
}
function findCurrentHostFiberImpl(node) {
  var tag = node.tag;
  if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return node;
  for (node = node.child; null !== node; ) {
    tag = findCurrentHostFiberImpl(node);
    if (null !== tag) return tag;
    node = node.sibling;
  }
  return null;
}
function isFiberSuspenseAndTimedOut(fiber) {
  var memoizedState = fiber.memoizedState;
  return (
    13 === fiber.tag &&
    null !== memoizedState &&
    null === memoizedState.dehydrated
  );
}
function doesFiberContain(parentFiber, childFiber) {
  for (
    var parentFiberAlternate = parentFiber.alternate;
    null !== childFiber;

  ) {
    if (childFiber === parentFiber || childFiber === parentFiberAlternate)
      return !0;
    childFiber = childFiber.return;
  }
  return !1;
}
var scheduleCallback = Scheduler.unstable_scheduleCallback,
  cancelCallback = Scheduler.unstable_cancelCallback,
  shouldYield = Scheduler.unstable_shouldYield,
  requestPaint = Scheduler.unstable_requestPaint,
  now = Scheduler.unstable_now,
  getCurrentPriorityLevel = Scheduler.unstable_getCurrentPriorityLevel,
  ImmediatePriority = Scheduler.unstable_ImmediatePriority,
  UserBlockingPriority = Scheduler.unstable_UserBlockingPriority,
  NormalPriority = Scheduler.unstable_NormalPriority,
  LowPriority = Scheduler.unstable_LowPriority,
  IdlePriority = Scheduler.unstable_IdlePriority,
  rendererID = null,
  injectedHook = null;
function onCommitRoot(root) {
  if (injectedHook && "function" === typeof injectedHook.onCommitFiberRoot)
    try {
      injectedHook.onCommitFiberRoot(
        rendererID,
        root,
        void 0,
        128 === (root.current.flags & 128)
      );
    } catch (err) {}
}
var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback,
  log = Math.log,
  LN2 = Math.LN2;
function clz32Fallback(x) {
  x >>>= 0;
  return 0 === x ? 32 : (31 - ((log(x) / LN2) | 0)) | 0;
}
var nextTransitionLane = 128,
  nextRetryLane = 8388608;
function getHighestPriorityLanes(lanes) {
  var pendingSyncLanes = lanes & 42;
  if (0 !== pendingSyncLanes) return pendingSyncLanes;
  switch (lanes & -lanes) {
    case 1:
      return 1;
    case 2:
      return 2;
    case 4:
      return 4;
    case 8:
      return 8;
    case 16:
      return 16;
    case 32:
      return 32;
    case 64:
      return 64;
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
    case 4194304:
      return lanes & 8388480;
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return lanes & 125829120;
    case 134217728:
      return 134217728;
    case 268435456:
      return 268435456;
    case 536870912:
      return 536870912;
    case 1073741824:
      return 1073741824;
    default:
      return lanes;
  }
}
function getNextLanes(root, wipLanes) {
  var pendingLanes = root.pendingLanes;
  if (0 === pendingLanes) return 0;
  var nextLanes = 0,
    suspendedLanes = root.suspendedLanes,
    pingedLanes = root.pingedLanes,
    nonIdlePendingLanes = pendingLanes & 268435455;
  if (0 !== nonIdlePendingLanes) {
    var nonIdleUnblockedLanes = nonIdlePendingLanes & ~suspendedLanes;
    0 !== nonIdleUnblockedLanes
      ? (nextLanes = getHighestPriorityLanes(nonIdleUnblockedLanes))
      : ((pingedLanes &= nonIdlePendingLanes),
        0 !== pingedLanes &&
          (nextLanes = getHighestPriorityLanes(pingedLanes)));
  } else
    (nonIdlePendingLanes = pendingLanes & ~suspendedLanes),
      0 !== nonIdlePendingLanes
        ? (nextLanes = getHighestPriorityLanes(nonIdlePendingLanes))
        : 0 !== pingedLanes &&
          (nextLanes = getHighestPriorityLanes(pingedLanes));
  if (0 === nextLanes) return 0;
  if (
    0 !== wipLanes &&
    wipLanes !== nextLanes &&
    0 === (wipLanes & suspendedLanes) &&
    ((suspendedLanes = nextLanes & -nextLanes),
    (pingedLanes = wipLanes & -wipLanes),
    suspendedLanes >= pingedLanes ||
      (32 === suspendedLanes && 0 !== (pingedLanes & 8388480)))
  )
    return wipLanes;
  0 === (root.current.mode & 32) &&
    0 !== (nextLanes & 8) &&
    (nextLanes |= pendingLanes & 32);
  wipLanes = root.entangledLanes;
  if (0 !== wipLanes)
    for (root = root.entanglements, wipLanes &= nextLanes; 0 < wipLanes; )
      (pendingLanes = 31 - clz32(wipLanes)),
        (suspendedLanes = 1 << pendingLanes),
        (nextLanes |= root[pendingLanes]),
        (wipLanes &= ~suspendedLanes);
  return nextLanes;
}
function computeExpirationTime(lane, currentTime) {
  switch (lane) {
    case 1:
    case 2:
    case 4:
    case 8:
      return currentTime + 250;
    case 16:
    case 32:
    case 64:
    case 128:
    case 256:
    case 512:
    case 1024:
    case 2048:
    case 4096:
    case 8192:
    case 16384:
    case 32768:
    case 65536:
    case 131072:
    case 262144:
    case 524288:
    case 1048576:
    case 2097152:
    case 4194304:
      return currentTime + 5e3;
    case 8388608:
    case 16777216:
    case 33554432:
    case 67108864:
      return -1;
    case 134217728:
    case 268435456:
    case 536870912:
    case 1073741824:
      return -1;
    default:
      return -1;
  }
}
function markStarvedLanesAsExpired(root, currentTime) {
  for (
    var suspendedLanes = root.suspendedLanes,
      pingedLanes = root.pingedLanes,
      expirationTimes = root.expirationTimes,
      lanes = root.pendingLanes & -125829121;
    0 < lanes;

  ) {
    var index$11 = 31 - clz32(lanes),
      lane = 1 << index$11,
      expirationTime = expirationTimes[index$11];
    if (-1 === expirationTime) {
      if (0 === (lane & suspendedLanes) || 0 !== (lane & pingedLanes))
        expirationTimes[index$11] = computeExpirationTime(lane, currentTime);
    } else expirationTime <= currentTime && (root.expiredLanes |= lane);
    lanes &= ~lane;
  }
}
function getLanesToRetrySynchronouslyOnError(root, originallyAttemptedLanes) {
  if (root.errorRecoveryDisabledLanes & originallyAttemptedLanes) return 0;
  root = root.pendingLanes & -1073741825;
  return 0 !== root ? root : root & 1073741824 ? 1073741824 : 0;
}
function includesBlockingLane(root, lanes) {
  return 0 !== (root.current.mode & 32) ? !1 : 0 !== (lanes & 60);
}
function claimNextTransitionLane() {
  var lane = nextTransitionLane;
  nextTransitionLane <<= 1;
  0 === (nextTransitionLane & 8388480) && (nextTransitionLane = 128);
  return lane;
}
function createLaneMap(initial) {
  for (var laneMap = [], i = 0; 31 > i; i++) laneMap.push(initial);
  return laneMap;
}
function markRootUpdated(root, updateLane, eventTime) {
  root.pendingLanes |= updateLane;
  536870912 !== updateLane &&
    ((root.suspendedLanes = 0), (root.pingedLanes = 0));
  root = root.eventTimes;
  updateLane = 31 - clz32(updateLane);
  root[updateLane] = eventTime;
}
function markRootFinished(root, remainingLanes) {
  var noLongerPendingLanes = root.pendingLanes & ~remainingLanes;
  root.pendingLanes = remainingLanes;
  root.suspendedLanes = 0;
  root.pingedLanes = 0;
  root.expiredLanes &= remainingLanes;
  root.mutableReadLanes &= remainingLanes;
  root.entangledLanes &= remainingLanes;
  root.errorRecoveryDisabledLanes &= remainingLanes;
  remainingLanes = root.entanglements;
  var eventTimes = root.eventTimes,
    expirationTimes = root.expirationTimes;
  for (root = root.hiddenUpdates; 0 < noLongerPendingLanes; ) {
    var index$13 = 31 - clz32(noLongerPendingLanes),
      lane = 1 << index$13;
    remainingLanes[index$13] = 0;
    eventTimes[index$13] = -1;
    expirationTimes[index$13] = -1;
    var hiddenUpdatesForLane = root[index$13];
    if (null !== hiddenUpdatesForLane)
      for (
        root[index$13] = null, index$13 = 0;
        index$13 < hiddenUpdatesForLane.length;
        index$13++
      ) {
        var update = hiddenUpdatesForLane[index$13];
        null !== update && (update.lane &= -1073741825);
      }
    noLongerPendingLanes &= ~lane;
  }
}
function markRootEntangled(root, entangledLanes) {
  var rootEntangledLanes = (root.entangledLanes |= entangledLanes);
  for (root = root.entanglements; rootEntangledLanes; ) {
    var index$14 = 31 - clz32(rootEntangledLanes),
      lane = 1 << index$14;
    (lane & entangledLanes) | (root[index$14] & entangledLanes) &&
      (root[index$14] |= entangledLanes);
    rootEntangledLanes &= ~lane;
  }
}
var currentUpdatePriority = 0;
function runWithPriority(priority, fn) {
  var previousPriority = currentUpdatePriority;
  try {
    return (currentUpdatePriority = priority), fn();
  } finally {
    currentUpdatePriority = previousPriority;
  }
}
function lanesToEventPriority(lanes) {
  lanes &= -lanes;
  return 2 < lanes
    ? 8 < lanes
      ? 0 !== (lanes & 268435455)
        ? 32
        : 536870912
      : 8
    : 2;
}
var _attemptSynchronousHydration,
  attemptContinuousHydration,
  attemptHydrationAtCurrentPriority,
  getCurrentUpdatePriority$1,
  attemptHydrationAtPriority,
  hasScheduledReplayAttempt = !1,
  queuedDiscreteEvents = [],
  queuedFocus = null,
  queuedDrag = null,
  queuedMouse = null,
  queuedPointers = new Map(),
  queuedPointerCaptures = new Map(),
  queuedExplicitHydrationTargets = [],
  discreteReplayableEvents =
    "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(
      " "
    );
function clearIfContinuousEvent(domEventName, nativeEvent) {
  switch (domEventName) {
    case "focusin":
    case "focusout":
      queuedFocus = null;
      break;
    case "dragenter":
    case "dragleave":
      queuedDrag = null;
      break;
    case "mouseover":
    case "mouseout":
      queuedMouse = null;
      break;
    case "pointerover":
    case "pointerout":
      queuedPointers.delete(nativeEvent.pointerId);
      break;
    case "gotpointercapture":
    case "lostpointercapture":
      queuedPointerCaptures.delete(nativeEvent.pointerId);
  }
}
function accumulateOrCreateContinuousQueuedReplayableEvent(
  existingQueuedEvent,
  blockedOn,
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent
) {
  if (
    null === existingQueuedEvent ||
    existingQueuedEvent.nativeEvent !== nativeEvent
  )
    return (
      (existingQueuedEvent = {
        blockedOn: blockedOn,
        domEventName: domEventName,
        eventSystemFlags: eventSystemFlags,
        nativeEvent: nativeEvent,
        targetContainers: [targetContainer]
      }),
      null !== blockedOn &&
        ((blockedOn = getInstanceFromNode(blockedOn)),
        null !== blockedOn && attemptContinuousHydration(blockedOn)),
      existingQueuedEvent
    );
  existingQueuedEvent.eventSystemFlags |= eventSystemFlags;
  blockedOn = existingQueuedEvent.targetContainers;
  null !== targetContainer &&
    -1 === blockedOn.indexOf(targetContainer) &&
    blockedOn.push(targetContainer);
  return existingQueuedEvent;
}
function queueIfContinuousEvent(
  blockedOn,
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent
) {
  switch (domEventName) {
    case "focusin":
      return (
        (queuedFocus = accumulateOrCreateContinuousQueuedReplayableEvent(
          queuedFocus,
          blockedOn,
          domEventName,
          eventSystemFlags,
          targetContainer,
          nativeEvent
        )),
        !0
      );
    case "dragenter":
      return (
        (queuedDrag = accumulateOrCreateContinuousQueuedReplayableEvent(
          queuedDrag,
          blockedOn,
          domEventName,
          eventSystemFlags,
          targetContainer,
          nativeEvent
        )),
        !0
      );
    case "mouseover":
      return (
        (queuedMouse = accumulateOrCreateContinuousQueuedReplayableEvent(
          queuedMouse,
          blockedOn,
          domEventName,
          eventSystemFlags,
          targetContainer,
          nativeEvent
        )),
        !0
      );
    case "pointerover":
      var pointerId = nativeEvent.pointerId;
      queuedPointers.set(
        pointerId,
        accumulateOrCreateContinuousQueuedReplayableEvent(
          queuedPointers.get(pointerId) || null,
          blockedOn,
          domEventName,
          eventSystemFlags,
          targetContainer,
          nativeEvent
        )
      );
      return !0;
    case "gotpointercapture":
      return (
        (pointerId = nativeEvent.pointerId),
        queuedPointerCaptures.set(
          pointerId,
          accumulateOrCreateContinuousQueuedReplayableEvent(
            queuedPointerCaptures.get(pointerId) || null,
            blockedOn,
            domEventName,
            eventSystemFlags,
            targetContainer,
            nativeEvent
          )
        ),
        !0
      );
  }
  return !1;
}
function attemptExplicitHydrationTarget(queuedTarget) {
  var targetInst = getClosestInstanceFromNode(queuedTarget.target);
  if (null !== targetInst) {
    var nearestMounted = getNearestMountedFiber(targetInst);
    if (null !== nearestMounted)
      if (((targetInst = nearestMounted.tag), 13 === targetInst)) {
        if (
          ((targetInst = getSuspenseInstanceFromFiber(nearestMounted)),
          null !== targetInst)
        ) {
          queuedTarget.blockedOn = targetInst;
          attemptHydrationAtPriority(queuedTarget.priority, function () {
            attemptHydrationAtCurrentPriority(nearestMounted);
          });
          return;
        }
      } else if (
        3 === targetInst &&
        nearestMounted.stateNode.current.memoizedState.isDehydrated
      ) {
        queuedTarget.blockedOn =
          3 === nearestMounted.tag
            ? nearestMounted.stateNode.containerInfo
            : null;
        return;
      }
  }
  queuedTarget.blockedOn = null;
}
function attemptReplayContinuousQueuedEvent(queuedEvent) {
  if (null !== queuedEvent.blockedOn) return !1;
  for (
    var targetContainers = queuedEvent.targetContainers;
    0 < targetContainers.length;

  ) {
    var nextBlockedOn = findInstanceBlockingEvent(
      queuedEvent.domEventName,
      queuedEvent.eventSystemFlags,
      targetContainers[0],
      queuedEvent.nativeEvent
    );
    if (null === nextBlockedOn) {
      nextBlockedOn = queuedEvent.nativeEvent;
      var nativeEventClone = new nextBlockedOn.constructor(
        nextBlockedOn.type,
        nextBlockedOn
      );
      currentReplayingEvent = nativeEventClone;
      nextBlockedOn.target.dispatchEvent(nativeEventClone);
      currentReplayingEvent = null;
    } else
      return (
        (targetContainers = getInstanceFromNode(nextBlockedOn)),
        null !== targetContainers &&
          attemptContinuousHydration(targetContainers),
        (queuedEvent.blockedOn = nextBlockedOn),
        !1
      );
    targetContainers.shift();
  }
  return !0;
}
function attemptReplayContinuousQueuedEventInMap(queuedEvent, key, map) {
  attemptReplayContinuousQueuedEvent(queuedEvent) && map.delete(key);
}
function replayUnblockedEvents() {
  hasScheduledReplayAttempt = !1;
  null !== queuedFocus &&
    attemptReplayContinuousQueuedEvent(queuedFocus) &&
    (queuedFocus = null);
  null !== queuedDrag &&
    attemptReplayContinuousQueuedEvent(queuedDrag) &&
    (queuedDrag = null);
  null !== queuedMouse &&
    attemptReplayContinuousQueuedEvent(queuedMouse) &&
    (queuedMouse = null);
  queuedPointers.forEach(attemptReplayContinuousQueuedEventInMap);
  queuedPointerCaptures.forEach(attemptReplayContinuousQueuedEventInMap);
}
function scheduleCallbackIfUnblocked(queuedEvent, unblocked) {
  queuedEvent.blockedOn === unblocked &&
    ((queuedEvent.blockedOn = null),
    hasScheduledReplayAttempt ||
      ((hasScheduledReplayAttempt = !0),
      Scheduler.unstable_scheduleCallback(
        Scheduler.unstable_NormalPriority,
        replayUnblockedEvents
      )));
}
function retryIfBlockedOn(unblocked) {
  function unblock(queuedEvent) {
    return scheduleCallbackIfUnblocked(queuedEvent, unblocked);
  }
  if (0 < queuedDiscreteEvents.length) {
    scheduleCallbackIfUnblocked(queuedDiscreteEvents[0], unblocked);
    for (var i = 1; i < queuedDiscreteEvents.length; i++) {
      var queuedEvent$jscomp$0 = queuedDiscreteEvents[i];
      queuedEvent$jscomp$0.blockedOn === unblocked &&
        (queuedEvent$jscomp$0.blockedOn = null);
    }
  }
  null !== queuedFocus && scheduleCallbackIfUnblocked(queuedFocus, unblocked);
  null !== queuedDrag && scheduleCallbackIfUnblocked(queuedDrag, unblocked);
  null !== queuedMouse && scheduleCallbackIfUnblocked(queuedMouse, unblocked);
  queuedPointers.forEach(unblock);
  queuedPointerCaptures.forEach(unblock);
  for (i = 0; i < queuedExplicitHydrationTargets.length; i++)
    (queuedEvent$jscomp$0 = queuedExplicitHydrationTargets[i]),
      queuedEvent$jscomp$0.blockedOn === unblocked &&
        (queuedEvent$jscomp$0.blockedOn = null);
  for (
    ;
    0 < queuedExplicitHydrationTargets.length &&
    ((i = queuedExplicitHydrationTargets[0]), null === i.blockedOn);

  )
    attemptExplicitHydrationTarget(i),
      null === i.blockedOn && queuedExplicitHydrationTargets.shift();
}
var ReactCurrentBatchConfig = ReactSharedInternals.ReactCurrentBatchConfig,
  _enabled = !0;
function dispatchDiscreteEvent(
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent
) {
  var previousPriority = currentUpdatePriority,
    prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = null;
  try {
    (currentUpdatePriority = 2),
      dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    (currentUpdatePriority = previousPriority),
      (ReactCurrentBatchConfig.transition = prevTransition);
  }
}
function dispatchContinuousEvent(
  domEventName,
  eventSystemFlags,
  container,
  nativeEvent
) {
  var previousPriority = currentUpdatePriority,
    prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = null;
  try {
    (currentUpdatePriority = 8),
      dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
  } finally {
    (currentUpdatePriority = previousPriority),
      (ReactCurrentBatchConfig.transition = prevTransition);
  }
}
function dispatchEvent(
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent
) {
  if (_enabled) {
    var blockedOn = findInstanceBlockingEvent(
      domEventName,
      eventSystemFlags,
      targetContainer,
      nativeEvent
    );
    if (null === blockedOn)
      dispatchEventForPluginEventSystem(
        domEventName,
        eventSystemFlags,
        nativeEvent,
        return_targetInst,
        targetContainer
      ),
        clearIfContinuousEvent(domEventName, nativeEvent);
    else if (
      queueIfContinuousEvent(
        blockedOn,
        domEventName,
        eventSystemFlags,
        targetContainer,
        nativeEvent
      )
    )
      nativeEvent.stopPropagation();
    else if (
      (clearIfContinuousEvent(domEventName, nativeEvent),
      eventSystemFlags & 4 &&
        -1 < discreteReplayableEvents.indexOf(domEventName))
    ) {
      for (; null !== blockedOn; ) {
        var fiber = getInstanceFromNode(blockedOn);
        null !== fiber && _attemptSynchronousHydration(fiber);
        fiber = findInstanceBlockingEvent(
          domEventName,
          eventSystemFlags,
          targetContainer,
          nativeEvent
        );
        null === fiber &&
          dispatchEventForPluginEventSystem(
            domEventName,
            eventSystemFlags,
            nativeEvent,
            return_targetInst,
            targetContainer
          );
        if (fiber === blockedOn) break;
        blockedOn = fiber;
      }
      null !== blockedOn && nativeEvent.stopPropagation();
    } else
      dispatchEventForPluginEventSystem(
        domEventName,
        eventSystemFlags,
        nativeEvent,
        null,
        targetContainer
      );
  }
}
var return_targetInst = null;
function findInstanceBlockingEvent(
  domEventName,
  eventSystemFlags,
  targetContainer,
  nativeEvent
) {
  return_targetInst = null;
  domEventName = getEventTarget(nativeEvent);
  domEventName = getClosestInstanceFromNode(domEventName);
  if (null !== domEventName)
    if (
      ((eventSystemFlags = getNearestMountedFiber(domEventName)),
      null === eventSystemFlags)
    )
      domEventName = null;
    else if (
      ((targetContainer = eventSystemFlags.tag), 13 === targetContainer)
    ) {
      domEventName = getSuspenseInstanceFromFiber(eventSystemFlags);
      if (null !== domEventName) return domEventName;
      domEventName = null;
    } else if (3 === targetContainer) {
      if (eventSystemFlags.stateNode.current.memoizedState.isDehydrated)
        return 3 === eventSystemFlags.tag
          ? eventSystemFlags.stateNode.containerInfo
          : null;
      domEventName = null;
    } else eventSystemFlags !== domEventName && (domEventName = null);
  return_targetInst = domEventName;
  return null;
}
function getEventPriority(domEventName) {
  switch (domEventName) {
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    case "beforeblur":
    case "afterblur":
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return 2;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return 8;
    case "message":
      switch (getCurrentPriorityLevel()) {
        case ImmediatePriority:
          return 2;
        case UserBlockingPriority:
          return 8;
        case NormalPriority:
        case LowPriority:
          return 32;
        case IdlePriority:
          return 536870912;
        default:
          return 32;
      }
    default:
      return 32;
  }
}
var root = null,
  startText = null,
  fallbackText = null;
function getData() {
  if (fallbackText) return fallbackText;
  var start,
    startValue = startText,
    startLength = startValue.length,
    end,
    endValue = "value" in root ? root.value : root.textContent,
    endLength = endValue.length;
  for (
    start = 0;
    start < startLength && startValue[start] === endValue[start];
    start++
  );
  var minEnd = startLength - start;
  for (
    end = 1;
    end <= minEnd &&
    startValue[startLength - end] === endValue[endLength - end];
    end++
  );
  return (fallbackText = endValue.slice(start, 1 < end ? 1 - end : void 0));
}
function getEventCharCode(nativeEvent) {
  var keyCode = nativeEvent.keyCode;
  "charCode" in nativeEvent
    ? ((nativeEvent = nativeEvent.charCode),
      0 === nativeEvent && 13 === keyCode && (nativeEvent = 13))
    : (nativeEvent = keyCode);
  10 === nativeEvent && (nativeEvent = 13);
  return 32 <= nativeEvent || 13 === nativeEvent ? nativeEvent : 0;
}
function functionThatReturnsTrue() {
  return !0;
}
function functionThatReturnsFalse() {
  return !1;
}
function createSyntheticEvent(Interface) {
  function SyntheticBaseEvent(
    reactName,
    reactEventType,
    targetInst,
    nativeEvent,
    nativeEventTarget
  ) {
    this._reactName = reactName;
    this._targetInst = targetInst;
    this.type = reactEventType;
    this.nativeEvent = nativeEvent;
    this.target = nativeEventTarget;
    this.currentTarget = null;
    for (var propName in Interface)
      Interface.hasOwnProperty(propName) &&
        ((reactName = Interface[propName]),
        (this[propName] = reactName
          ? reactName(nativeEvent)
          : nativeEvent[propName]));
    this.isDefaultPrevented = (
      null != nativeEvent.defaultPrevented
        ? nativeEvent.defaultPrevented
        : !1 === nativeEvent.returnValue
    )
      ? functionThatReturnsTrue
      : functionThatReturnsFalse;
    this.isPropagationStopped = functionThatReturnsFalse;
    return this;
  }
  assign(SyntheticBaseEvent.prototype, {
    preventDefault: function () {
      this.defaultPrevented = !0;
      var event = this.nativeEvent;
      event &&
        (event.preventDefault
          ? event.preventDefault()
          : "unknown" !== typeof event.returnValue && (event.returnValue = !1),
        (this.isDefaultPrevented = functionThatReturnsTrue));
    },
    stopPropagation: function () {
      var event = this.nativeEvent;
      event &&
        (event.stopPropagation
          ? event.stopPropagation()
          : "unknown" !== typeof event.cancelBubble &&
            (event.cancelBubble = !0),
        (this.isPropagationStopped = functionThatReturnsTrue));
    },
    persist: function () {},
    isPersistent: functionThatReturnsTrue
  });
  return SyntheticBaseEvent;
}
var EventInterface = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function (event) {
      return event.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  },
  SyntheticEvent = createSyntheticEvent(EventInterface),
  UIEventInterface = assign({}, EventInterface, { view: 0, detail: 0 }),
  SyntheticUIEvent = createSyntheticEvent(UIEventInterface),
  lastMovementX,
  lastMovementY,
  lastMouseEvent,
  MouseEventInterface = assign({}, UIEventInterface, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: getEventModifierState,
    button: 0,
    buttons: 0,
    relatedTarget: function (event) {
      return void 0 === event.relatedTarget
        ? event.fromElement === event.srcElement
          ? event.toElement
          : event.fromElement
        : event.relatedTarget;
    },
    movementX: function (event) {
      if ("movementX" in event) return event.movementX;
      event !== lastMouseEvent &&
        (lastMouseEvent && "mousemove" === event.type
          ? ((lastMovementX = event.screenX - lastMouseEvent.screenX),
            (lastMovementY = event.screenY - lastMouseEvent.screenY))
          : (lastMovementY = lastMovementX = 0),
        (lastMouseEvent = event));
      return lastMovementX;
    },
    movementY: function (event) {
      return "movementY" in event ? event.movementY : lastMovementY;
    }
  }),
  SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface),
  DragEventInterface = assign({}, MouseEventInterface, { dataTransfer: 0 }),
  SyntheticDragEvent = createSyntheticEvent(DragEventInterface),
  FocusEventInterface = assign({}, UIEventInterface, { relatedTarget: 0 }),
  SyntheticFocusEvent = createSyntheticEvent(FocusEventInterface),
  AnimationEventInterface = assign({}, EventInterface, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }),
  SyntheticAnimationEvent = createSyntheticEvent(AnimationEventInterface),
  ClipboardEventInterface = assign({}, EventInterface, {
    clipboardData: function (event) {
      return "clipboardData" in event
        ? event.clipboardData
        : window.clipboardData;
    }
  }),
  SyntheticClipboardEvent = createSyntheticEvent(ClipboardEventInterface),
  CompositionEventInterface = assign({}, EventInterface, { data: 0 }),
  SyntheticCompositionEvent = createSyntheticEvent(CompositionEventInterface),
  normalizeKey = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified"
  },
  translateToKey = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
  },
  modifierKeyToProp = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
function modifierStateGetter(keyArg) {
  var nativeEvent = this.nativeEvent;
  return nativeEvent.getModifierState
    ? nativeEvent.getModifierState(keyArg)
    : (keyArg = modifierKeyToProp[keyArg])
    ? !!nativeEvent[keyArg]
    : !1;
}
function getEventModifierState() {
  return modifierStateGetter;
}
var KeyboardEventInterface = assign({}, UIEventInterface, {
    key: function (nativeEvent) {
      if (nativeEvent.key) {
        var key = normalizeKey[nativeEvent.key] || nativeEvent.key;
        if ("Unidentified" !== key) return key;
      }
      return "keypress" === nativeEvent.type
        ? ((nativeEvent = getEventCharCode(nativeEvent)),
          13 === nativeEvent ? "Enter" : String.fromCharCode(nativeEvent))
        : "keydown" === nativeEvent.type || "keyup" === nativeEvent.type
        ? translateToKey[nativeEvent.keyCode] || "Unidentified"
        : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: getEventModifierState,
    charCode: function (event) {
      return "keypress" === event.type ? getEventCharCode(event) : 0;
    },
    keyCode: function (event) {
      return "keydown" === event.type || "keyup" === event.type
        ? event.keyCode
        : 0;
    },
    which: function (event) {
      return "keypress" === event.type
        ? getEventCharCode(event)
        : "keydown" === event.type || "keyup" === event.type
        ? event.keyCode
        : 0;
    }
  }),
  SyntheticKeyboardEvent = createSyntheticEvent(KeyboardEventInterface),
  PointerEventInterface = assign({}, MouseEventInterface, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0
  }),
  SyntheticPointerEvent = createSyntheticEvent(PointerEventInterface),
  TouchEventInterface = assign({}, UIEventInterface, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: getEventModifierState
  }),
  SyntheticTouchEvent = createSyntheticEvent(TouchEventInterface),
  TransitionEventInterface = assign({}, EventInterface, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }),
  SyntheticTransitionEvent = createSyntheticEvent(TransitionEventInterface),
  WheelEventInterface = assign({}, MouseEventInterface, {
    deltaX: function (event) {
      return "deltaX" in event
        ? event.deltaX
        : "wheelDeltaX" in event
        ? -event.wheelDeltaX
        : 0;
    },
    deltaY: function (event) {
      return "deltaY" in event
        ? event.deltaY
        : "wheelDeltaY" in event
        ? -event.wheelDeltaY
        : "wheelDelta" in event
        ? -event.wheelDelta
        : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }),
  SyntheticWheelEvent = createSyntheticEvent(WheelEventInterface),
  END_KEYCODES = [9, 13, 27, 32],
  canUseCompositionEvent = canUseDOM && "CompositionEvent" in window,
  documentMode = null;
canUseDOM &&
  "documentMode" in document &&
  (documentMode = document.documentMode);
var canUseTextInputEvent = canUseDOM && "TextEvent" in window && !documentMode,
  useFallbackCompositionData =
    canUseDOM &&
    (!canUseCompositionEvent ||
      (documentMode && 8 < documentMode && 11 >= documentMode)),
  SPACEBAR_CHAR = String.fromCharCode(32),
  hasSpaceKeypress = !1;
function isFallbackCompositionEnd(domEventName, nativeEvent) {
  switch (domEventName) {
    case "keyup":
      return -1 !== END_KEYCODES.indexOf(nativeEvent.keyCode);
    case "keydown":
      return 229 !== nativeEvent.keyCode;
    case "keypress":
    case "mousedown":
    case "focusout":
      return !0;
    default:
      return !1;
  }
}
function getDataFromCustomEvent(nativeEvent) {
  nativeEvent = nativeEvent.detail;
  return "object" === typeof nativeEvent && "data" in nativeEvent
    ? nativeEvent.data
    : null;
}
var isComposing = !1;
function getNativeBeforeInputChars(domEventName, nativeEvent) {
  switch (domEventName) {
    case "compositionend":
      return getDataFromCustomEvent(nativeEvent);
    case "keypress":
      if (32 !== nativeEvent.which) return null;
      hasSpaceKeypress = !0;
      return SPACEBAR_CHAR;
    case "textInput":
      return (
        (domEventName = nativeEvent.data),
        domEventName === SPACEBAR_CHAR && hasSpaceKeypress ? null : domEventName
      );
    default:
      return null;
  }
}
function getFallbackBeforeInputChars(domEventName, nativeEvent) {
  if (isComposing)
    return "compositionend" === domEventName ||
      (!canUseCompositionEvent &&
        isFallbackCompositionEnd(domEventName, nativeEvent))
      ? ((domEventName = getData()),
        (fallbackText = startText = root = null),
        (isComposing = !1),
        domEventName)
      : null;
  switch (domEventName) {
    case "paste":
      return null;
    case "keypress":
      if (
        !(nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) ||
        (nativeEvent.ctrlKey && nativeEvent.altKey)
      ) {
        if (nativeEvent.char && 1 < nativeEvent.char.length)
          return nativeEvent.char;
        if (nativeEvent.which) return String.fromCharCode(nativeEvent.which);
      }
      return null;
    case "compositionend":
      return useFallbackCompositionData && "ko" !== nativeEvent.locale
        ? null
        : nativeEvent.data;
    default:
      return null;
  }
}
var supportedInputTypes = {
  color: !0,
  date: !0,
  datetime: !0,
  "datetime-local": !0,
  email: !0,
  month: !0,
  number: !0,
  password: !0,
  range: !0,
  search: !0,
  tel: !0,
  text: !0,
  time: !0,
  url: !0,
  week: !0
};
function isTextInputElement(elem) {
  var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
  return "input" === nodeName
    ? !!supportedInputTypes[elem.type]
    : "textarea" === nodeName
    ? !0
    : !1;
}
function createAndAccumulateChangeEvent(
  dispatchQueue,
  inst,
  nativeEvent,
  target
) {
  enqueueStateRestore(target);
  inst = accumulateTwoPhaseListeners(inst, "onChange");
  0 < inst.length &&
    ((nativeEvent = new SyntheticEvent(
      "onChange",
      "change",
      null,
      nativeEvent,
      target
    )),
    dispatchQueue.push({ event: nativeEvent, listeners: inst }));
}
var activeElement = null,
  activeElementInst = null;
function runEventInBatch(dispatchQueue) {
  processDispatchQueue(dispatchQueue, 0);
}
function getInstIfValueChanged(targetInst) {
  var targetNode = getNodeFromInstance(targetInst);
  if (updateValueIfChanged(targetNode)) return targetInst;
}
function getTargetInstForChangeEvent(domEventName, targetInst) {
  if ("change" === domEventName) return targetInst;
}
var isInputEventSupported = !1;
if (canUseDOM) {
  var JSCompiler_inline_result$jscomp$225;
  if (canUseDOM) {
    var isSupported$jscomp$inline_376 = "oninput" in document;
    if (!isSupported$jscomp$inline_376) {
      var element$jscomp$inline_377 = document.createElement("div");
      element$jscomp$inline_377.setAttribute("oninput", "return;");
      isSupported$jscomp$inline_376 =
        "function" === typeof element$jscomp$inline_377.oninput;
    }
    JSCompiler_inline_result$jscomp$225 = isSupported$jscomp$inline_376;
  } else JSCompiler_inline_result$jscomp$225 = !1;
  isInputEventSupported =
    JSCompiler_inline_result$jscomp$225 &&
    (!document.documentMode || 9 < document.documentMode);
}
function stopWatchingForValueChange() {
  activeElement &&
    (activeElement.detachEvent("onpropertychange", handlePropertyChange),
    (activeElementInst = activeElement = null));
}
function handlePropertyChange(nativeEvent) {
  if (
    "value" === nativeEvent.propertyName &&
    getInstIfValueChanged(activeElementInst)
  ) {
    var dispatchQueue = [];
    createAndAccumulateChangeEvent(
      dispatchQueue,
      activeElementInst,
      nativeEvent,
      getEventTarget(nativeEvent)
    );
    batchedUpdates(runEventInBatch, dispatchQueue);
  }
}
function handleEventsForInputEventPolyfill(domEventName, target, targetInst) {
  "focusin" === domEventName
    ? (stopWatchingForValueChange(),
      (activeElement = target),
      (activeElementInst = targetInst),
      activeElement.attachEvent("onpropertychange", handlePropertyChange))
    : "focusout" === domEventName && stopWatchingForValueChange();
}
function getTargetInstForInputEventPolyfill(domEventName) {
  if (
    "selectionchange" === domEventName ||
    "keyup" === domEventName ||
    "keydown" === domEventName
  )
    return getInstIfValueChanged(activeElementInst);
}
function getTargetInstForClickEvent(domEventName, targetInst) {
  if ("click" === domEventName) return getInstIfValueChanged(targetInst);
}
function getTargetInstForInputOrChangeEvent(domEventName, targetInst) {
  if ("input" === domEventName || "change" === domEventName)
    return getInstIfValueChanged(targetInst);
}
function is(x, y) {
  return (x === y && (0 !== x || 1 / x === 1 / y)) || (x !== x && y !== y);
}
var objectIs = "function" === typeof Object.is ? Object.is : is;
function shallowEqual(objA, objB) {
  if (objectIs(objA, objB)) return !0;
  if (
    "object" !== typeof objA ||
    null === objA ||
    "object" !== typeof objB ||
    null === objB
  )
    return !1;
  var keysA = Object.keys(objA),
    keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return !1;
  for (keysB = 0; keysB < keysA.length; keysB++) {
    var currentKey = keysA[keysB];
    if (
      !hasOwnProperty.call(objB, currentKey) ||
      !objectIs(objA[currentKey], objB[currentKey])
    )
      return !1;
  }
  return !0;
}
function getLeafNode(node) {
  for (; node && node.firstChild; ) node = node.firstChild;
  return node;
}
function getNodeForCharacterOffset(root, offset) {
  var node = getLeafNode(root);
  root = 0;
  for (var nodeEnd; node; ) {
    if (3 === node.nodeType) {
      nodeEnd = root + node.textContent.length;
      if (root <= offset && nodeEnd >= offset)
        return { node: node, offset: offset - root };
      root = nodeEnd;
    }
    a: {
      for (; node; ) {
        if (node.nextSibling) {
          node = node.nextSibling;
          break a;
        }
        node = node.parentNode;
      }
      node = void 0;
    }
    node = getLeafNode(node);
  }
}
function containsNode(outerNode, innerNode) {
  return outerNode && innerNode
    ? outerNode === innerNode
      ? !0
      : outerNode && 3 === outerNode.nodeType
      ? !1
      : innerNode && 3 === innerNode.nodeType
      ? containsNode(outerNode, innerNode.parentNode)
      : "contains" in outerNode
      ? outerNode.contains(innerNode)
      : outerNode.compareDocumentPosition
      ? !!(outerNode.compareDocumentPosition(innerNode) & 16)
      : !1
    : !1;
}
function getActiveElementDeep() {
  for (
    var win = window, element = getActiveElement();
    element instanceof win.HTMLIFrameElement;

  ) {
    try {
      var JSCompiler_inline_result =
        "string" === typeof element.contentWindow.location.href;
    } catch (err) {
      JSCompiler_inline_result = !1;
    }
    if (JSCompiler_inline_result) win = element.contentWindow;
    else break;
    element = getActiveElement(win.document);
  }
  return element;
}
function hasSelectionCapabilities(elem) {
  var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
  return (
    nodeName &&
    (("input" === nodeName &&
      ("text" === elem.type ||
        "search" === elem.type ||
        "tel" === elem.type ||
        "url" === elem.type ||
        "password" === elem.type)) ||
      "textarea" === nodeName ||
      "true" === elem.contentEditable)
  );
}
function restoreSelection(priorSelectionInformation) {
  var curFocusedElem = getActiveElementDeep(),
    priorFocusedElem = priorSelectionInformation.focusedElem,
    priorSelectionRange = priorSelectionInformation.selectionRange;
  if (
    curFocusedElem !== priorFocusedElem &&
    priorFocusedElem &&
    priorFocusedElem.ownerDocument &&
    containsNode(
      priorFocusedElem.ownerDocument.documentElement,
      priorFocusedElem
    )
  ) {
    if (
      null !== priorSelectionRange &&
      hasSelectionCapabilities(priorFocusedElem)
    )
      if (
        ((curFocusedElem = priorSelectionRange.start),
        (priorSelectionInformation = priorSelectionRange.end),
        void 0 === priorSelectionInformation &&
          (priorSelectionInformation = curFocusedElem),
        "selectionStart" in priorFocusedElem)
      )
        (priorFocusedElem.selectionStart = curFocusedElem),
          (priorFocusedElem.selectionEnd = Math.min(
            priorSelectionInformation,
            priorFocusedElem.value.length
          ));
      else if (
        ((priorSelectionInformation =
          ((curFocusedElem = priorFocusedElem.ownerDocument || document) &&
            curFocusedElem.defaultView) ||
          window),
        priorSelectionInformation.getSelection)
      ) {
        priorSelectionInformation = priorSelectionInformation.getSelection();
        var length = priorFocusedElem.textContent.length,
          start = Math.min(priorSelectionRange.start, length);
        priorSelectionRange =
          void 0 === priorSelectionRange.end
            ? start
            : Math.min(priorSelectionRange.end, length);
        !priorSelectionInformation.extend &&
          start > priorSelectionRange &&
          ((length = priorSelectionRange),
          (priorSelectionRange = start),
          (start = length));
        length = getNodeForCharacterOffset(priorFocusedElem, start);
        var endMarker = getNodeForCharacterOffset(
          priorFocusedElem,
          priorSelectionRange
        );
        length &&
          endMarker &&
          (1 !== priorSelectionInformation.rangeCount ||
            priorSelectionInformation.anchorNode !== length.node ||
            priorSelectionInformation.anchorOffset !== length.offset ||
            priorSelectionInformation.focusNode !== endMarker.node ||
            priorSelectionInformation.focusOffset !== endMarker.offset) &&
          ((curFocusedElem = curFocusedElem.createRange()),
          curFocusedElem.setStart(length.node, length.offset),
          priorSelectionInformation.removeAllRanges(),
          start > priorSelectionRange
            ? (priorSelectionInformation.addRange(curFocusedElem),
              priorSelectionInformation.extend(
                endMarker.node,
                endMarker.offset
              ))
            : (curFocusedElem.setEnd(endMarker.node, endMarker.offset),
              priorSelectionInformation.addRange(curFocusedElem)));
      }
    curFocusedElem = [];
    for (
      priorSelectionInformation = priorFocusedElem;
      (priorSelectionInformation = priorSelectionInformation.parentNode);

    )
      1 === priorSelectionInformation.nodeType &&
        curFocusedElem.push({
          element: priorSelectionInformation,
          left: priorSelectionInformation.scrollLeft,
          top: priorSelectionInformation.scrollTop
        });
    "function" === typeof priorFocusedElem.focus && priorFocusedElem.focus();
    for (
      priorFocusedElem = 0;
      priorFocusedElem < curFocusedElem.length;
      priorFocusedElem++
    )
      (priorSelectionInformation = curFocusedElem[priorFocusedElem]),
        (priorSelectionInformation.element.scrollLeft =
          priorSelectionInformation.left),
        (priorSelectionInformation.element.scrollTop =
          priorSelectionInformation.top);
  }
}
var skipSelectionChangeEvent =
    canUseDOM && "documentMode" in document && 11 >= document.documentMode,
  activeElement$1 = null,
  activeElementInst$1 = null,
  lastSelection = null,
  mouseDown = !1;
function constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget) {
  var doc =
    nativeEventTarget.window === nativeEventTarget
      ? nativeEventTarget.document
      : 9 === nativeEventTarget.nodeType
      ? nativeEventTarget
      : nativeEventTarget.ownerDocument;
  mouseDown ||
    null == activeElement$1 ||
    activeElement$1 !== getActiveElement(doc) ||
    ((doc = activeElement$1),
    "selectionStart" in doc && hasSelectionCapabilities(doc)
      ? (doc = { start: doc.selectionStart, end: doc.selectionEnd })
      : ((doc = (
          (doc.ownerDocument && doc.ownerDocument.defaultView) ||
          window
        ).getSelection()),
        (doc = {
          anchorNode: doc.anchorNode,
          anchorOffset: doc.anchorOffset,
          focusNode: doc.focusNode,
          focusOffset: doc.focusOffset
        })),
    (lastSelection && shallowEqual(lastSelection, doc)) ||
      ((lastSelection = doc),
      (doc = accumulateTwoPhaseListeners(activeElementInst$1, "onSelect")),
      0 < doc.length &&
        ((nativeEvent = new SyntheticEvent(
          "onSelect",
          "select",
          null,
          nativeEvent,
          nativeEventTarget
        )),
        dispatchQueue.push({ event: nativeEvent, listeners: doc }),
        (nativeEvent.target = activeElement$1))));
}
function makePrefixMap(styleProp, eventName) {
  var prefixes = {};
  prefixes[styleProp.toLowerCase()] = eventName.toLowerCase();
  prefixes["Webkit" + styleProp] = "webkit" + eventName;
  prefixes["Moz" + styleProp] = "moz" + eventName;
  return prefixes;
}
var vendorPrefixes = {
    animationend: makePrefixMap("Animation", "AnimationEnd"),
    animationiteration: makePrefixMap("Animation", "AnimationIteration"),
    animationstart: makePrefixMap("Animation", "AnimationStart"),
    transitionend: makePrefixMap("Transition", "TransitionEnd")
  },
  prefixedEventNames = {},
  style = {};
canUseDOM &&
  ((style = document.createElement("div").style),
  "AnimationEvent" in window ||
    (delete vendorPrefixes.animationend.animation,
    delete vendorPrefixes.animationiteration.animation,
    delete vendorPrefixes.animationstart.animation),
  "TransitionEvent" in window ||
    delete vendorPrefixes.transitionend.transition);
function getVendorPrefixedEventName(eventName) {
  if (prefixedEventNames[eventName]) return prefixedEventNames[eventName];
  if (!vendorPrefixes[eventName]) return eventName;
  var prefixMap = vendorPrefixes[eventName],
    styleProp;
  for (styleProp in prefixMap)
    if (prefixMap.hasOwnProperty(styleProp) && styleProp in style)
      return (prefixedEventNames[eventName] = prefixMap[styleProp]);
  return eventName;
}
var ANIMATION_END = getVendorPrefixedEventName("animationend"),
  ANIMATION_ITERATION = getVendorPrefixedEventName("animationiteration"),
  ANIMATION_START = getVendorPrefixedEventName("animationstart"),
  TRANSITION_END = getVendorPrefixedEventName("transitionend"),
  topLevelEventsToReactNames = new Map(),
  simpleEventPluginEvents =
    "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
      " "
    );
topLevelEventsToReactNames.set("beforeblur", null);
topLevelEventsToReactNames.set("afterblur", null);
function registerSimpleEvent(domEventName, reactName) {
  topLevelEventsToReactNames.set(domEventName, reactName);
  registerTwoPhaseEvent(reactName, [domEventName]);
}
for (
  var i$jscomp$inline_417 = 0;
  i$jscomp$inline_417 < simpleEventPluginEvents.length;
  i$jscomp$inline_417++
) {
  var eventName$jscomp$inline_418 =
      simpleEventPluginEvents[i$jscomp$inline_417],
    domEventName$jscomp$inline_419 = eventName$jscomp$inline_418.toLowerCase(),
    capitalizedEvent$jscomp$inline_420 =
      eventName$jscomp$inline_418[0].toUpperCase() +
      eventName$jscomp$inline_418.slice(1);
  registerSimpleEvent(
    domEventName$jscomp$inline_419,
    "on" + capitalizedEvent$jscomp$inline_420
  );
}
registerSimpleEvent(ANIMATION_END, "onAnimationEnd");
registerSimpleEvent(ANIMATION_ITERATION, "onAnimationIteration");
registerSimpleEvent(ANIMATION_START, "onAnimationStart");
registerSimpleEvent("dblclick", "onDoubleClick");
registerSimpleEvent("focusin", "onFocus");
registerSimpleEvent("focusout", "onBlur");
registerSimpleEvent(TRANSITION_END, "onTransitionEnd");
registerDirectEvent("onMouseEnter", ["mouseout", "mouseover"]);
registerDirectEvent("onMouseLeave", ["mouseout", "mouseover"]);
registerDirectEvent("onPointerEnter", ["pointerout", "pointerover"]);
registerDirectEvent("onPointerLeave", ["pointerout", "pointerover"]);
registerTwoPhaseEvent(
  "onChange",
  "change click focusin focusout input keydown keyup selectionchange".split(" ")
);
registerTwoPhaseEvent(
  "onSelect",
  "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
    " "
  )
);
registerTwoPhaseEvent("onBeforeInput", [
  "compositionend",
  "keypress",
  "textInput",
  "paste"
]);
registerTwoPhaseEvent(
  "onCompositionEnd",
  "compositionend focusout keydown keypress keyup mousedown".split(" ")
);
registerTwoPhaseEvent(
  "onCompositionStart",
  "compositionstart focusout keydown keypress keyup mousedown".split(" ")
);
registerTwoPhaseEvent(
  "onCompositionUpdate",
  "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
);
var mediaEventTypes =
    "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
      " "
    ),
  nonDelegatedEvents = new Set(
    "cancel close invalid load scroll toggle".split(" ").concat(mediaEventTypes)
  );
function executeDispatch(event, listener, currentTarget) {
  var type = event.type || "unknown-event";
  event.currentTarget = currentTarget;
  invokeGuardedCallbackAndCatchFirstError(type, listener, void 0, event);
  event.currentTarget = null;
}
function processDispatchQueue(dispatchQueue, eventSystemFlags) {
  eventSystemFlags = 0 !== (eventSystemFlags & 4);
  for (var i = 0; i < dispatchQueue.length; i++) {
    var _dispatchQueue$i = dispatchQueue[i],
      event = _dispatchQueue$i.event;
    _dispatchQueue$i = _dispatchQueue$i.listeners;
    a: {
      var previousInstance = void 0;
      if (eventSystemFlags)
        for (
          var i$jscomp$0 = _dispatchQueue$i.length - 1;
          0 <= i$jscomp$0;
          i$jscomp$0--
        ) {
          var _dispatchListeners$i = _dispatchQueue$i[i$jscomp$0],
            instance = _dispatchListeners$i.instance,
            currentTarget = _dispatchListeners$i.currentTarget;
          _dispatchListeners$i = _dispatchListeners$i.listener;
          if (instance !== previousInstance && event.isPropagationStopped())
            break a;
          executeDispatch(event, _dispatchListeners$i, currentTarget);
          previousInstance = instance;
        }
      else
        for (
          i$jscomp$0 = 0;
          i$jscomp$0 < _dispatchQueue$i.length;
          i$jscomp$0++
        ) {
          _dispatchListeners$i = _dispatchQueue$i[i$jscomp$0];
          instance = _dispatchListeners$i.instance;
          currentTarget = _dispatchListeners$i.currentTarget;
          _dispatchListeners$i = _dispatchListeners$i.listener;
          if (instance !== previousInstance && event.isPropagationStopped())
            break a;
          executeDispatch(event, _dispatchListeners$i, currentTarget);
          previousInstance = instance;
        }
    }
  }
  if (hasRethrowError)
    throw (
      ((dispatchQueue = rethrowError),
      (hasRethrowError = !1),
      (rethrowError = null),
      dispatchQueue)
    );
}
function listenToNonDelegatedEvent(domEventName, targetElement) {
  var listenerSet = getEventListenerSet(targetElement),
    listenerSetKey = domEventName + "__bubble";
  listenerSet.has(listenerSetKey) ||
    (addTrappedEventListener(targetElement, domEventName, 2, !1),
    listenerSet.add(listenerSetKey));
}
function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
  var eventSystemFlags = 0;
  isCapturePhaseListener && (eventSystemFlags |= 4);
  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener
  );
}
var listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);
function listenToAllSupportedEvents(rootContainerElement) {
  if (!rootContainerElement[listeningMarker]) {
    rootContainerElement[listeningMarker] = !0;
    allNativeEvents.forEach(function (domEventName) {
      "selectionchange" !== domEventName &&
        (nonDelegatedEvents.has(domEventName) ||
          listenToNativeEvent(domEventName, !1, rootContainerElement),
        listenToNativeEvent(domEventName, !0, rootContainerElement));
    });
    var ownerDocument =
      9 === rootContainerElement.nodeType
        ? rootContainerElement
        : rootContainerElement.ownerDocument;
    null === ownerDocument ||
      ownerDocument[listeningMarker] ||
      ((ownerDocument[listeningMarker] = !0),
      listenToNativeEvent("selectionchange", !1, ownerDocument));
  }
}
function addTrappedEventListener(
  targetContainer,
  domEventName,
  eventSystemFlags,
  isCapturePhaseListener
) {
  switch (getEventPriority(domEventName)) {
    case 2:
      var listenerWrapper = dispatchDiscreteEvent;
      break;
    case 8:
      listenerWrapper = dispatchContinuousEvent;
      break;
    default:
      listenerWrapper = dispatchEvent;
  }
  eventSystemFlags = listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer
  );
  listenerWrapper = void 0;
  !passiveBrowserEventsSupported ||
    ("touchstart" !== domEventName &&
      "touchmove" !== domEventName &&
      "wheel" !== domEventName) ||
    (listenerWrapper = !0);
  isCapturePhaseListener
    ? void 0 !== listenerWrapper
      ? targetContainer.addEventListener(domEventName, eventSystemFlags, {
          capture: !0,
          passive: listenerWrapper
        })
      : targetContainer.addEventListener(domEventName, eventSystemFlags, !0)
    : void 0 !== listenerWrapper
    ? targetContainer.addEventListener(domEventName, eventSystemFlags, {
        passive: listenerWrapper
      })
    : targetContainer.addEventListener(domEventName, eventSystemFlags, !1);
}
function dispatchEventForPluginEventSystem(
  domEventName,
  eventSystemFlags,
  nativeEvent,
  targetInst$jscomp$0,
  targetContainer
) {
  var ancestorInst = targetInst$jscomp$0;
  if (
    0 === (eventSystemFlags & 1) &&
    0 === (eventSystemFlags & 2) &&
    null !== targetInst$jscomp$0
  )
    a: for (;;) {
      if (null === targetInst$jscomp$0) return;
      var nodeTag = targetInst$jscomp$0.tag;
      if (3 === nodeTag || 4 === nodeTag) {
        var container = targetInst$jscomp$0.stateNode.containerInfo;
        if (
          container === targetContainer ||
          (8 === container.nodeType && container.parentNode === targetContainer)
        )
          break;
        if (4 === nodeTag)
          for (nodeTag = targetInst$jscomp$0.return; null !== nodeTag; ) {
            var grandTag = nodeTag.tag;
            if (3 === grandTag || 4 === grandTag)
              if (
                ((grandTag = nodeTag.stateNode.containerInfo),
                grandTag === targetContainer ||
                  (8 === grandTag.nodeType &&
                    grandTag.parentNode === targetContainer))
              )
                return;
            nodeTag = nodeTag.return;
          }
        for (; null !== container; ) {
          nodeTag = getClosestInstanceFromNode(container);
          if (null === nodeTag) return;
          grandTag = nodeTag.tag;
          if (
            5 === grandTag ||
            6 === grandTag ||
            26 === grandTag ||
            27 === grandTag
          ) {
            targetInst$jscomp$0 = ancestorInst = nodeTag;
            continue a;
          }
          container = container.parentNode;
        }
      }
      targetInst$jscomp$0 = targetInst$jscomp$0.return;
    }
  batchedUpdates(function () {
    var targetInst = ancestorInst,
      nativeEventTarget = getEventTarget(nativeEvent),
      dispatchQueue = [];
    a: {
      var reactName = topLevelEventsToReactNames.get(domEventName);
      if (void 0 !== reactName) {
        var SyntheticEventCtor = SyntheticEvent,
          reactEventType = domEventName;
        switch (domEventName) {
          case "keypress":
            if (0 === getEventCharCode(nativeEvent)) break a;
          case "keydown":
          case "keyup":
            SyntheticEventCtor = SyntheticKeyboardEvent;
            break;
          case "focusin":
            reactEventType = "focus";
            SyntheticEventCtor = SyntheticFocusEvent;
            break;
          case "focusout":
            reactEventType = "blur";
            SyntheticEventCtor = SyntheticFocusEvent;
            break;
          case "beforeblur":
          case "afterblur":
            SyntheticEventCtor = SyntheticFocusEvent;
            break;
          case "click":
            if (2 === nativeEvent.button) break a;
          case "auxclick":
          case "dblclick":
          case "mousedown":
          case "mousemove":
          case "mouseup":
          case "mouseout":
          case "mouseover":
          case "contextmenu":
            SyntheticEventCtor = SyntheticMouseEvent;
            break;
          case "drag":
          case "dragend":
          case "dragenter":
          case "dragexit":
          case "dragleave":
          case "dragover":
          case "dragstart":
          case "drop":
            SyntheticEventCtor = SyntheticDragEvent;
            break;
          case "touchcancel":
          case "touchend":
          case "touchmove":
          case "touchstart":
            SyntheticEventCtor = SyntheticTouchEvent;
            break;
          case ANIMATION_END:
          case ANIMATION_ITERATION:
          case ANIMATION_START:
            SyntheticEventCtor = SyntheticAnimationEvent;
            break;
          case TRANSITION_END:
            SyntheticEventCtor = SyntheticTransitionEvent;
            break;
          case "scroll":
            SyntheticEventCtor = SyntheticUIEvent;
            break;
          case "wheel":
            SyntheticEventCtor = SyntheticWheelEvent;
            break;
          case "copy":
          case "cut":
          case "paste":
            SyntheticEventCtor = SyntheticClipboardEvent;
            break;
          case "gotpointercapture":
          case "lostpointercapture":
          case "pointercancel":
          case "pointerdown":
          case "pointermove":
          case "pointerout":
          case "pointerover":
          case "pointerup":
            SyntheticEventCtor = SyntheticPointerEvent;
        }
        var inCapturePhase = 0 !== (eventSystemFlags & 4);
        eventSystemFlags & 1
          ? ((inCapturePhase = accumulateEventHandleNonManagedNodeListeners(
              reactEventType,
              targetContainer,
              inCapturePhase
            )),
            0 < inCapturePhase.length &&
              ((reactName = new SyntheticEventCtor(
                reactName,
                reactEventType,
                null,
                nativeEvent,
                nativeEventTarget
              )),
              dispatchQueue.push({
                event: reactName,
                listeners: inCapturePhase
              })))
          : ((inCapturePhase = accumulateSinglePhaseListeners(
              targetInst,
              reactName,
              nativeEvent.type,
              inCapturePhase,
              !inCapturePhase && "scroll" === domEventName,
              nativeEvent
            )),
            0 < inCapturePhase.length &&
              ((reactName = new SyntheticEventCtor(
                reactName,
                reactEventType,
                null,
                nativeEvent,
                nativeEventTarget
              )),
              dispatchQueue.push({
                event: reactName,
                listeners: inCapturePhase
              })));
      }
    }
    if (0 === (eventSystemFlags & 7)) {
      a: {
        reactName =
          "mouseover" === domEventName || "pointerover" === domEventName;
        SyntheticEventCtor =
          "mouseout" === domEventName || "pointerout" === domEventName;
        if (
          reactName &&
          nativeEvent !== currentReplayingEvent &&
          (reactEventType =
            nativeEvent.relatedTarget || nativeEvent.fromElement) &&
          (getClosestInstanceFromNode(reactEventType) ||
            reactEventType[internalContainerInstanceKey])
        )
          break a;
        if (SyntheticEventCtor || reactName) {
          reactName =
            nativeEventTarget.window === nativeEventTarget
              ? nativeEventTarget
              : (reactName = nativeEventTarget.ownerDocument)
              ? reactName.defaultView || reactName.parentWindow
              : window;
          if (SyntheticEventCtor) {
            if (
              ((reactEventType =
                nativeEvent.relatedTarget || nativeEvent.toElement),
              (SyntheticEventCtor = targetInst),
              (reactEventType = reactEventType
                ? getClosestInstanceFromNode(reactEventType)
                : null),
              null !== reactEventType)
            ) {
              inCapturePhase = getNearestMountedFiber(reactEventType);
              var tag = reactEventType.tag;
              if (
                reactEventType !== inCapturePhase ||
                (5 !== tag && 27 !== tag && 6 !== tag)
              )
                reactEventType = null;
            }
          } else (SyntheticEventCtor = null), (reactEventType = targetInst);
          if (SyntheticEventCtor !== reactEventType) {
            tag = SyntheticMouseEvent;
            var leaveEventType = "onMouseLeave",
              enterEventType = "onMouseEnter",
              eventTypePrefix = "mouse";
            if ("pointerout" === domEventName || "pointerover" === domEventName)
              (tag = SyntheticPointerEvent),
                (leaveEventType = "onPointerLeave"),
                (enterEventType = "onPointerEnter"),
                (eventTypePrefix = "pointer");
            inCapturePhase =
              null == SyntheticEventCtor
                ? reactName
                : getNodeFromInstance(SyntheticEventCtor);
            var toNode =
              null == reactEventType
                ? reactName
                : getNodeFromInstance(reactEventType);
            reactName = new tag(
              leaveEventType,
              eventTypePrefix + "leave",
              SyntheticEventCtor,
              nativeEvent,
              nativeEventTarget
            );
            reactName.target = inCapturePhase;
            reactName.relatedTarget = toNode;
            leaveEventType = null;
            getClosestInstanceFromNode(nativeEventTarget) === targetInst &&
              ((tag = new tag(
                enterEventType,
                eventTypePrefix + "enter",
                reactEventType,
                nativeEvent,
                nativeEventTarget
              )),
              (tag.target = toNode),
              (tag.relatedTarget = inCapturePhase),
              (leaveEventType = tag));
            inCapturePhase = leaveEventType;
            if (SyntheticEventCtor && reactEventType)
              b: {
                tag = SyntheticEventCtor;
                enterEventType = reactEventType;
                eventTypePrefix = 0;
                for (toNode = tag; toNode; toNode = getParent(toNode))
                  eventTypePrefix++;
                toNode = 0;
                for (
                  leaveEventType = enterEventType;
                  leaveEventType;
                  leaveEventType = getParent(leaveEventType)
                )
                  toNode++;
                for (; 0 < eventTypePrefix - toNode; )
                  (tag = getParent(tag)), eventTypePrefix--;
                for (; 0 < toNode - eventTypePrefix; )
                  (enterEventType = getParent(enterEventType)), toNode--;
                for (; eventTypePrefix--; ) {
                  if (
                    tag === enterEventType ||
                    (null !== enterEventType &&
                      tag === enterEventType.alternate)
                  )
                    break b;
                  tag = getParent(tag);
                  enterEventType = getParent(enterEventType);
                }
                tag = null;
              }
            else tag = null;
            null !== SyntheticEventCtor &&
              accumulateEnterLeaveListenersForEvent(
                dispatchQueue,
                reactName,
                SyntheticEventCtor,
                tag,
                !1
              );
            null !== reactEventType &&
              null !== inCapturePhase &&
              accumulateEnterLeaveListenersForEvent(
                dispatchQueue,
                inCapturePhase,
                reactEventType,
                tag,
                !0
              );
          }
        }
      }
      a: {
        reactName = targetInst ? getNodeFromInstance(targetInst) : window;
        SyntheticEventCtor =
          reactName.nodeName && reactName.nodeName.toLowerCase();
        if (
          "select" === SyntheticEventCtor ||
          ("input" === SyntheticEventCtor && "file" === reactName.type)
        )
          var getTargetInstFunc = getTargetInstForChangeEvent;
        else if (isTextInputElement(reactName))
          if (isInputEventSupported)
            getTargetInstFunc = getTargetInstForInputOrChangeEvent;
          else {
            getTargetInstFunc = getTargetInstForInputEventPolyfill;
            var handleEventFunc = handleEventsForInputEventPolyfill;
          }
        else
          (SyntheticEventCtor = reactName.nodeName) &&
            "input" === SyntheticEventCtor.toLowerCase() &&
            ("checkbox" === reactName.type || "radio" === reactName.type) &&
            (getTargetInstFunc = getTargetInstForClickEvent);
        if (
          getTargetInstFunc &&
          (getTargetInstFunc = getTargetInstFunc(domEventName, targetInst))
        ) {
          createAndAccumulateChangeEvent(
            dispatchQueue,
            getTargetInstFunc,
            nativeEvent,
            nativeEventTarget
          );
          break a;
        }
        handleEventFunc && handleEventFunc(domEventName, reactName, targetInst);
        "focusout" === domEventName &&
          (handleEventFunc = reactName._wrapperState) &&
          handleEventFunc.controlled &&
          "number" === reactName.type &&
          setDefaultValue(reactName, "number", reactName.value);
      }
      handleEventFunc = targetInst ? getNodeFromInstance(targetInst) : window;
      switch (domEventName) {
        case "focusin":
          if (
            isTextInputElement(handleEventFunc) ||
            "true" === handleEventFunc.contentEditable
          )
            (activeElement$1 = handleEventFunc),
              (activeElementInst$1 = targetInst),
              (lastSelection = null);
          break;
        case "focusout":
          lastSelection = activeElementInst$1 = activeElement$1 = null;
          break;
        case "mousedown":
          mouseDown = !0;
          break;
        case "contextmenu":
        case "mouseup":
        case "dragend":
          mouseDown = !1;
          constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
          break;
        case "selectionchange":
          if (skipSelectionChangeEvent) break;
        case "keydown":
        case "keyup":
          constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
      }
      var fallbackData;
      if (canUseCompositionEvent)
        b: {
          switch (domEventName) {
            case "compositionstart":
              var eventType = "onCompositionStart";
              break b;
            case "compositionend":
              eventType = "onCompositionEnd";
              break b;
            case "compositionupdate":
              eventType = "onCompositionUpdate";
              break b;
          }
          eventType = void 0;
        }
      else
        isComposing
          ? isFallbackCompositionEnd(domEventName, nativeEvent) &&
            (eventType = "onCompositionEnd")
          : "keydown" === domEventName &&
            229 === nativeEvent.keyCode &&
            (eventType = "onCompositionStart");
      eventType &&
        (useFallbackCompositionData &&
          "ko" !== nativeEvent.locale &&
          (isComposing || "onCompositionStart" !== eventType
            ? "onCompositionEnd" === eventType &&
              isComposing &&
              (fallbackData = getData())
            : ((root = nativeEventTarget),
              (startText = "value" in root ? root.value : root.textContent),
              (isComposing = !0))),
        (handleEventFunc = accumulateTwoPhaseListeners(targetInst, eventType)),
        0 < handleEventFunc.length &&
          ((eventType = new SyntheticCompositionEvent(
            eventType,
            domEventName,
            null,
            nativeEvent,
            nativeEventTarget
          )),
          dispatchQueue.push({ event: eventType, listeners: handleEventFunc }),
          fallbackData
            ? (eventType.data = fallbackData)
            : ((fallbackData = getDataFromCustomEvent(nativeEvent)),
              null !== fallbackData && (eventType.data = fallbackData))));
      if (
        (fallbackData = canUseTextInputEvent
          ? getNativeBeforeInputChars(domEventName, nativeEvent)
          : getFallbackBeforeInputChars(domEventName, nativeEvent))
      )
        (targetInst = accumulateTwoPhaseListeners(targetInst, "onBeforeInput")),
          0 < targetInst.length &&
            ((nativeEventTarget = new SyntheticCompositionEvent(
              "onBeforeInput",
              "beforeinput",
              null,
              nativeEvent,
              nativeEventTarget
            )),
            dispatchQueue.push({
              event: nativeEventTarget,
              listeners: targetInst
            }),
            (nativeEventTarget.data = fallbackData));
    }
    processDispatchQueue(dispatchQueue, eventSystemFlags);
  });
}
function createDispatchListener(instance, listener, currentTarget) {
  return {
    instance: instance,
    listener: listener,
    currentTarget: currentTarget
  };
}
function accumulateSinglePhaseListeners(
  targetFiber,
  reactName,
  nativeEventType,
  inCapturePhase,
  accumulateTargetOnly,
  nativeEvent
) {
  reactName = inCapturePhase
    ? null !== reactName
      ? reactName + "Capture"
      : null
    : reactName;
  for (
    var listeners = [], instance = targetFiber, lastHostComponent = null;
    null !== instance;

  ) {
    var _instance = instance;
    targetFiber = _instance.stateNode;
    _instance = _instance.tag;
    (5 !== _instance && 26 !== _instance && 27 !== _instance) ||
    null === targetFiber
      ? 21 === _instance &&
        null !== lastHostComponent &&
        null !== targetFiber &&
        ((targetFiber = targetFiber[internalEventHandlerListenersKey] || null),
        null !== targetFiber &&
          targetFiber.forEach(function (entry) {
            entry.type === nativeEventType &&
              entry.capture === inCapturePhase &&
              listeners.push(
                createDispatchListener(
                  instance,
                  entry.callback,
                  lastHostComponent
                )
              );
          }))
      : ((lastHostComponent = targetFiber),
        (targetFiber =
          lastHostComponent[internalEventHandlerListenersKey] || null),
        null !== targetFiber &&
          targetFiber.forEach(function (entry) {
            entry.type === nativeEventType &&
              entry.capture === inCapturePhase &&
              listeners.push(
                createDispatchListener(
                  instance,
                  entry.callback,
                  lastHostComponent
                )
              );
          }),
        null !== reactName &&
          ((targetFiber = getListener(instance, reactName)),
          null != targetFiber &&
            listeners.push(
              createDispatchListener(instance, targetFiber, lastHostComponent)
            )));
    if (accumulateTargetOnly) break;
    "beforeblur" === nativeEvent.type &&
      ((targetFiber = nativeEvent._detachedInterceptFiber),
      null === targetFiber ||
        (targetFiber !== instance && targetFiber !== instance.alternate) ||
        (listeners = []));
    instance = instance.return;
  }
  return listeners;
}
function accumulateTwoPhaseListeners(targetFiber, reactName) {
  for (
    var captureName = reactName + "Capture", listeners = [];
    null !== targetFiber;

  ) {
    var _instance2 = targetFiber,
      stateNode = _instance2.stateNode;
    _instance2 = _instance2.tag;
    (5 !== _instance2 && 26 !== _instance2 && 27 !== _instance2) ||
      null === stateNode ||
      ((_instance2 = getListener(targetFiber, captureName)),
      null != _instance2 &&
        listeners.unshift(
          createDispatchListener(targetFiber, _instance2, stateNode)
        ),
      (_instance2 = getListener(targetFiber, reactName)),
      null != _instance2 &&
        listeners.push(
          createDispatchListener(targetFiber, _instance2, stateNode)
        ));
    targetFiber = targetFiber.return;
  }
  return listeners;
}
function getParent(inst) {
  if (null === inst) return null;
  do inst = inst.return;
  while (inst && 5 !== inst.tag && 27 !== inst.tag);
  return inst ? inst : null;
}
function accumulateEnterLeaveListenersForEvent(
  dispatchQueue,
  event,
  target,
  common,
  inCapturePhase
) {
  for (
    var registrationName = event._reactName, listeners = [];
    null !== target && target !== common;

  ) {
    var _instance3 = target,
      alternate = _instance3.alternate,
      stateNode = _instance3.stateNode;
    _instance3 = _instance3.tag;
    if (null !== alternate && alternate === common) break;
    (5 !== _instance3 && 26 !== _instance3 && 27 !== _instance3) ||
      null === stateNode ||
      ((alternate = stateNode),
      inCapturePhase
        ? ((stateNode = getListener(target, registrationName)),
          null != stateNode &&
            listeners.unshift(
              createDispatchListener(target, stateNode, alternate)
            ))
        : inCapturePhase ||
          ((stateNode = getListener(target, registrationName)),
          null != stateNode &&
            listeners.push(
              createDispatchListener(target, stateNode, alternate)
            )));
    target = target.return;
  }
  0 !== listeners.length &&
    dispatchQueue.push({ event: event, listeners: listeners });
}
function accumulateEventHandleNonManagedNodeListeners(
  reactEventType,
  currentTarget,
  inCapturePhase
) {
  var listeners = [],
    eventListeners = currentTarget[internalEventHandlerListenersKey] || null;
  null !== eventListeners &&
    eventListeners.forEach(function (entry) {
      entry.type === reactEventType &&
        entry.capture === inCapturePhase &&
        listeners.push(
          createDispatchListener(null, entry.callback, currentTarget)
        );
    });
  return listeners;
}
var NORMALIZE_NEWLINES_REGEX = /\r\n?/g,
  NORMALIZE_NULL_AND_REPLACEMENT_REGEX = /\u0000|\uFFFD/g;
function normalizeMarkupForTextOrAttribute(markup) {
  return ("string" === typeof markup ? markup : "" + markup)
    .replace(NORMALIZE_NEWLINES_REGEX, "\n")
    .replace(NORMALIZE_NULL_AND_REPLACEMENT_REGEX, "");
}
function checkForUnmatchedText(serverText, clientText, isConcurrentMode) {
  clientText = normalizeMarkupForTextOrAttribute(clientText);
  if (
    normalizeMarkupForTextOrAttribute(serverText) !== clientText &&
    isConcurrentMode
  )
    throw Error(formatProdErrorMessage(425));
}
function noop() {}
function createElement(type, props, rootContainerElement, parentNamespace) {
  rootContainerElement =
    9 === rootContainerElement.nodeType
      ? rootContainerElement
      : rootContainerElement.ownerDocument;
  "http://www.w3.org/1999/xhtml" === parentNamespace &&
    (parentNamespace = getIntrinsicNamespace(type));
  "http://www.w3.org/1999/xhtml" === parentNamespace
    ? "script" === type
      ? ((props = rootContainerElement.createElement("div")),
        (props.innerHTML = "<script>\x3c/script>"),
        (parentNamespace = props.removeChild(props.firstChild)))
      : "string" === typeof props.is
      ? (parentNamespace = rootContainerElement.createElement(type, {
          is: props.is
        }))
      : ((parentNamespace = rootContainerElement.createElement(type)),
        "select" === type &&
          ((type = parentNamespace),
          props.multiple
            ? (type.multiple = !0)
            : props.size && (type.size = props.size)))
    : (parentNamespace = rootContainerElement.createElementNS(
        parentNamespace,
        type
      ));
  return parentNamespace;
}
function setInitialProperties(domElement, tag, rawProps) {
  var isCustomComponentTag = isCustomComponent(tag, rawProps);
  switch (tag) {
    case "dialog":
      listenToNonDelegatedEvent("cancel", domElement);
      listenToNonDelegatedEvent("close", domElement);
      var props = rawProps;
      break;
    case "iframe":
    case "object":
    case "embed":
      listenToNonDelegatedEvent("load", domElement);
      props = rawProps;
      break;
    case "video":
    case "audio":
      for (props = 0; props < mediaEventTypes.length; props++)
        listenToNonDelegatedEvent(mediaEventTypes[props], domElement);
      props = rawProps;
      break;
    case "source":
      listenToNonDelegatedEvent("error", domElement);
      props = rawProps;
      break;
    case "img":
    case "image":
    case "link":
      listenToNonDelegatedEvent("error", domElement);
      listenToNonDelegatedEvent("load", domElement);
      props = rawProps;
      break;
    case "details":
      listenToNonDelegatedEvent("toggle", domElement);
      props = rawProps;
      break;
    case "input":
      initWrapperState(domElement, rawProps);
      props = getHostProps(domElement, rawProps);
      listenToNonDelegatedEvent("invalid", domElement);
      break;
    case "option":
      props = rawProps;
      break;
    case "select":
      domElement._wrapperState = { wasMultiple: !!rawProps.multiple };
      props = assign({}, rawProps, { value: void 0 });
      listenToNonDelegatedEvent("invalid", domElement);
      break;
    case "textarea":
      initWrapperState$2(domElement, rawProps);
      props = getHostProps$2(domElement, rawProps);
      listenToNonDelegatedEvent("invalid", domElement);
      break;
    default:
      props = rawProps;
  }
  assertValidProps(tag, props);
  var nextProps = props,
    propKey;
  for (propKey in nextProps)
    if (nextProps.hasOwnProperty(propKey)) {
      var nextProp = nextProps[propKey];
      "style" === propKey
        ? setValueForStyles(domElement, nextProp)
        : "dangerouslySetInnerHTML" === propKey
        ? ((nextProp = nextProp ? nextProp.__html : void 0),
          null != nextProp && setInnerHTML(domElement, nextProp))
        : "children" === propKey
        ? "string" === typeof nextProp
          ? "body" === tag ||
            ("textarea" === tag && "" === nextProp) ||
            setTextContent(domElement, nextProp)
          : "number" === typeof nextProp &&
            "body" !== tag &&
            setTextContent(domElement, "" + nextProp)
        : "suppressContentEditableWarning" !== propKey &&
          "suppressHydrationWarning" !== propKey &&
          "autoFocus" !== propKey &&
          (registrationNameDependencies.hasOwnProperty(propKey)
            ? null != nextProp &&
              "onScroll" === propKey &&
              listenToNonDelegatedEvent("scroll", domElement)
            : null != nextProp &&
              setValueForProperty(
                domElement,
                propKey,
                nextProp,
                isCustomComponentTag
              ));
    }
  switch (tag) {
    case "input":
      track(domElement);
      postMountWrapper(domElement, rawProps, !1);
      break;
    case "textarea":
      track(domElement);
      postMountWrapper$3(domElement);
      break;
    case "option":
      null != rawProps.value &&
        domElement.setAttribute("value", "" + getToStringValue(rawProps.value));
      break;
    case "select":
      domElement.multiple = !!rawProps.multiple;
      tag = rawProps.value;
      null != tag
        ? updateOptions(domElement, !!rawProps.multiple, tag, !1)
        : null != rawProps.defaultValue &&
          updateOptions(
            domElement,
            !!rawProps.multiple,
            rawProps.defaultValue,
            !0
          );
      break;
    default:
      "function" === typeof props.onClick && (domElement.onclick = noop);
  }
}
var valueStack = [],
  index = -1;
function createCursor(defaultValue) {
  return { current: defaultValue };
}
function pop(cursor) {
  0 > index ||
    ((cursor.current = valueStack[index]), (valueStack[index] = null), index--);
}
function push(cursor, value) {
  index++;
  valueStack[index] = cursor.current;
  cursor.current = value;
}
var contextStackCursor = createCursor(null),
  contextFiberStackCursor = createCursor(null),
  rootInstanceStackCursor = createCursor(null);
function pushHostContainer(fiber, nextRootInstance) {
  push(rootInstanceStackCursor, nextRootInstance);
  push(contextFiberStackCursor, fiber);
  push(contextStackCursor, null);
  fiber = nextRootInstance.nodeType;
  switch (fiber) {
    case 9:
    case 11:
      nextRootInstance = (nextRootInstance = nextRootInstance.documentElement)
        ? nextRootInstance.namespaceURI
        : getChildNamespace(null, "");
      break;
    default:
      (fiber = 8 === fiber ? nextRootInstance.parentNode : nextRootInstance),
        (nextRootInstance = fiber.namespaceURI || null),
        (fiber = fiber.tagName),
        (nextRootInstance = getChildNamespace(nextRootInstance, fiber));
  }
  pop(contextStackCursor);
  push(contextStackCursor, nextRootInstance);
}
function popHostContainer() {
  pop(contextStackCursor);
  pop(contextFiberStackCursor);
  pop(rootInstanceStackCursor);
}
function pushHostContext(fiber) {
  var context = contextStackCursor.current;
  var JSCompiler_inline_result = getChildNamespace(context, fiber.type);
  context !== JSCompiler_inline_result &&
    (push(contextFiberStackCursor, fiber),
    push(contextStackCursor, JSCompiler_inline_result));
}
function popHostContext(fiber) {
  contextFiberStackCursor.current === fiber &&
    (pop(contextStackCursor), pop(contextFiberStackCursor));
}
var Dispatcher = Internals.Dispatcher,
  lastCurrentDocument = null,
  previousDispatcher = null,
  ReactDOMClientDispatcher = { preload: preload, preinit: preinit },
  preloadResources = new Map();
function getRootNode(container) {
  return "function" === typeof container.getRootNode
    ? container.getRootNode()
    : container.ownerDocument;
}
function getCurrentResourceRoot() {
  var currentContainer = rootInstanceStackCursor.current;
  return currentContainer ? getRootNode(currentContainer) : null;
}
function resetInstance(resource) {
  resource.instance = void 0;
}
function clearRootResources(rootContainer) {
  rootContainer = getRootNode(rootContainer);
  rootContainer = getResourcesFromRoot(rootContainer);
  rootContainer.scripts.forEach(resetInstance);
  rootContainer.head.forEach(resetInstance);
}
function getDocumentForPreloads() {
  var root = getCurrentResourceRoot();
  if (root) return root.ownerDocument || root;
  try {
    return lastCurrentDocument || window.document;
  } catch (error) {
    return null;
  }
}
function getDocumentFromRoot(root) {
  return root.ownerDocument || root;
}
function preload(href, options) {
  var ownerDocument = getDocumentForPreloads();
  if (
    "string" === typeof href &&
    href &&
    "object" === typeof options &&
    null !== options &&
    ownerDocument
  ) {
    var as = options.as;
    preloadResources.get(href) ||
      createPreloadResource(ownerDocument, href, {
        href: href,
        rel: "preload",
        as: as,
        crossOrigin: "font" === as ? "" : options.crossOrigin,
        integrity: options.integrity
      });
  }
}
function preinit(href, options) {
  if (
    "string" === typeof href &&
    href &&
    "object" === typeof options &&
    null !== options
  ) {
    var resourceRoot = getCurrentResourceRoot(),
      as = options.as;
    if (resourceRoot)
      switch (as) {
        case "style":
          as = getResourcesFromRoot(resourceRoot).styles;
          var precedence = options.precedence || "default",
            resource = as.get(href);
          resource ||
            (resource = createStyleResource(
              as,
              resourceRoot,
              href,
              precedence,
              {
                rel: "stylesheet",
                href: href,
                "data-precedence": precedence,
                crossOrigin: options.crossOrigin
              }
            ));
          acquireResource(resource);
          break;
        case "script":
          (as = getResourcesFromRoot(resourceRoot).scripts),
            (precedence = as.get(href)) ||
              (precedence = createScriptResource(as, resourceRoot, href, {
                src: href,
                async: !0,
                crossOrigin: options.crossOrigin,
                integrity: options.integrity
              })),
            acquireResource(precedence);
      }
    else
      (resourceRoot = getDocumentForPreloads()) &&
        (preloadResources.get(href) ||
          createPreloadResource(resourceRoot, href, {
            href: href,
            rel: "preload",
            as: as,
            crossOrigin: "font" === as ? "" : options.crossOrigin,
            integrity: options.integrity
          }));
  }
}
function getResource(type, pendingProps) {
  var resourceRoot = getCurrentResourceRoot();
  if (!resourceRoot) throw Error(formatProdErrorMessage(446));
  switch (type) {
    case "base":
      resourceRoot = getDocumentFromRoot(resourceRoot);
      var headResources = getResourcesFromRoot(resourceRoot).head,
        target = pendingProps.target,
        href = pendingProps.href;
      href =
        "base" +
        ("string" === typeof href
          ? '[href="' +
            escapeSelectorAttributeValueInsideDoubleQuotes(href) +
            '"]'
          : ":not([href])");
      href +=
        "string" === typeof target
          ? '[target="' +
            escapeSelectorAttributeValueInsideDoubleQuotes(target) +
            '"]'
          : ":not([target])";
      target = headResources.get(href);
      target ||
        ((target = {
          type: "base",
          matcher: href,
          props: assign({}, pendingProps),
          count: 0,
          instance: null,
          root: resourceRoot
        }),
        headResources.set(href, target));
      return target;
    case "meta":
      var charSet = pendingProps.charSet,
        content = pendingProps.content,
        httpEquiv = pendingProps.httpEquiv,
        name = pendingProps.name,
        itemProp = pendingProps.itemProp,
        property = pendingProps.property;
      resourceRoot = getDocumentFromRoot(resourceRoot);
      var _getResourcesFromRoot = getResourcesFromRoot(resourceRoot);
      type = _getResourcesFromRoot.head;
      _getResourcesFromRoot = _getResourcesFromRoot.lastStructuredMeta;
      "string" === typeof charSet
        ? (headResources = "meta[charset]")
        : "string" === typeof content &&
          ("string" === typeof httpEquiv
            ? (headResources =
                'meta[http-equiv="' +
                escapeSelectorAttributeValueInsideDoubleQuotes(httpEquiv) +
                '"][content="' +
                escapeSelectorAttributeValueInsideDoubleQuotes(content) +
                '"]')
            : "string" === typeof property
            ? ((target = property),
              (headResources =
                'meta[property="' +
                escapeSelectorAttributeValueInsideDoubleQuotes(property) +
                '"][content="' +
                escapeSelectorAttributeValueInsideDoubleQuotes(content) +
                '"]'),
              (href = property.split(":").slice(0, -1).join(":")),
              (href = _getResourcesFromRoot.get(href)) &&
                (headResources = href.matcher + headResources))
            : "string" === typeof name
            ? (headResources =
                'meta[name="' +
                escapeSelectorAttributeValueInsideDoubleQuotes(name) +
                '"][content="' +
                escapeSelectorAttributeValueInsideDoubleQuotes(content) +
                '"]')
            : "string" === typeof itemProp &&
              (headResources =
                'meta[itemprop="' +
                escapeSelectorAttributeValueInsideDoubleQuotes(itemProp) +
                '"][content="' +
                escapeSelectorAttributeValueInsideDoubleQuotes(content) +
                '"]'));
      return headResources
        ? ((charSet = type.get(headResources)),
          charSet ||
            ((charSet = {
              type: "meta",
              matcher: headResources,
              property: target,
              parentResource: href,
              props: assign({}, pendingProps),
              count: 0,
              instance: null,
              root: resourceRoot
            }),
            type.set(headResources, charSet)),
          "string" === typeof charSet.property &&
            _getResourcesFromRoot.set(charSet.property, charSet),
          charSet)
        : null;
    case "title":
      return (
        (headResources = pendingProps.children),
        (headResources = Array.isArray(headResources)
          ? 1 === headResources.length
            ? headResources[0]
            : null
          : headResources),
        "function" !== typeof headResources &&
        "symbol" !== typeof headResources &&
        null !== headResources &&
        void 0 !== headResources
          ? ((headResources = "" + headResources),
            (resourceRoot = getDocumentFromRoot(resourceRoot)),
            (target = getResourcesFromRoot(resourceRoot).head),
            (href = "title:" + headResources),
            (type = target.get(href)),
            type ||
              ((pendingProps = assign({}, pendingProps)),
              (pendingProps.children = headResources),
              (type = {
                type: "title",
                props: pendingProps,
                count: 0,
                instance: null,
                root: resourceRoot
              }),
              target.set(href, type)),
            type)
          : null
      );
    case "link":
      switch (((headResources = pendingProps.rel), headResources)) {
        case "stylesheet":
          return (
            (target = getResourcesFromRoot(resourceRoot).styles),
            (href = pendingProps.precedence),
            (type = pendingProps.href),
            "string" === typeof type && "string" === typeof href
              ? ((headResources = target.get(type)),
                headResources ||
                  ((headResources = assign({}, pendingProps)),
                  (headResources["data-precedence"] = pendingProps.precedence),
                  (headResources.precedence = null),
                  (pendingProps = headResources =
                    createStyleResource(
                      target,
                      resourceRoot,
                      type,
                      href,
                      headResources
                    )),
                  !1 === pendingProps.loaded &&
                    null === pendingProps.hint &&
                    ((resourceRoot = pendingProps.href),
                    (target = pendingProps.props),
                    (target = {
                      rel: "preload",
                      as: "style",
                      href: target.href,
                      crossOrigin: target.crossOrigin,
                      integrity: target.integrity,
                      media: target.media,
                      hrefLang: target.hrefLang,
                      referrerPolicy: target.referrerPolicy
                    }),
                    (pendingProps.hint = createPreloadResource(
                      getDocumentFromRoot(pendingProps.root),
                      resourceRoot,
                      target
                    )))),
                headResources)
              : null
          );
        case "preload":
          return (
            (headResources = pendingProps.href),
            "string" === typeof headResources
              ? ((target = preloadResources.get(headResources)),
                target ||
                  ((pendingProps = assign({}, pendingProps)),
                  (target = createPreloadResource(
                    getDocumentFromRoot(resourceRoot),
                    headResources,
                    pendingProps
                  ))),
                target)
              : null
          );
        default:
          return (
            (target = pendingProps.href),
            (href = pendingProps.sizes),
            (type = pendingProps.media),
            "string" === typeof headResources && "string" === typeof target
              ? ((headResources =
                  "rel:" +
                  headResources +
                  "::href:" +
                  target +
                  ("::sizes:" + ("string" === typeof href ? href : "")) +
                  ("::media:" + ("string" === typeof type ? type : ""))),
                (resourceRoot = getDocumentFromRoot(resourceRoot)),
                (target = getResourcesFromRoot(resourceRoot).head),
                (href = target.get(headResources)),
                href ||
                  ((href = {
                    type: "link",
                    props: assign({}, pendingProps),
                    count: 0,
                    instance: null,
                    root: resourceRoot
                  }),
                  target.set(headResources, href)),
                href)
              : null
          );
      }
    case "script":
      return (
        (headResources = getResourcesFromRoot(resourceRoot).scripts),
        (target = pendingProps.src),
        pendingProps.async && "string" === typeof target
          ? ((href = headResources.get(target)),
            href ||
              ((pendingProps = assign({}, pendingProps)),
              (href = createScriptResource(
                headResources,
                resourceRoot,
                target,
                pendingProps
              ))),
            href)
          : null
      );
    default:
      throw Error(formatProdErrorMessage(444, type));
  }
}
function acquireResource(resource) {
  switch (resource.type) {
    case "base":
    case "title":
    case "link":
    case "meta":
      a: {
        resource.count++;
        var instance = resource.instance;
        if (!instance) {
          var props = resource.props,
            root$52 = resource.root,
            type = resource.type;
          switch (type) {
            case "title":
              var titles = root$52.querySelectorAll("title");
              for (instance = 0; instance < titles.length; instance++)
                if (titles[instance].textContent === props.children) {
                  instance = resource.instance = titles[instance];
                  instance[internalResourceMarker] = !0;
                  resource = instance;
                  break a;
                }
              instance = resource.instance = createResourceInstance(
                type,
                props,
                root$52
              );
              resource = titles[0];
              insertResourceInstanceBefore(
                root$52,
                instance,
                resource &&
                  "http://www.w3.org/2000/svg" !== resource.namespaceURI
                  ? resource
                  : null
              );
              break;
            case "meta":
              titles = null;
              var matcher = resource.matcher;
              instance = resource.property;
              var parentResource = resource.parentResource;
              if (parentResource && "string" === typeof instance) {
                if ((matcher = parentResource.instance))
                  for (
                    matcher = titles = matcher.nextSibling;
                    (parentResource = matcher);

                  )
                    if (
                      ((matcher = parentResource.nextSibling),
                      "META" === parentResource.nodeName)
                    ) {
                      var propertyAttr =
                        parentResource.getAttribute("property");
                      if ("string" === typeof propertyAttr) {
                        if (
                          propertyAttr === instance &&
                          parentResource.getAttribute("content") ===
                            props.content
                        ) {
                          resource.instance = parentResource;
                          parentResource[internalResourceMarker] = !0;
                          resource = parentResource;
                          break a;
                        }
                        if (instance.startsWith(propertyAttr + ":")) break;
                      }
                    }
              } else if ((instance = root$52.querySelector(matcher))) {
                resource.instance = instance;
                instance[internalResourceMarker] = !0;
                break;
              }
              instance = resource.instance = createResourceInstance(
                type,
                props,
                root$52
              );
              insertResourceInstanceBefore(root$52, instance, titles);
              break;
            case "link":
              titles = escapeSelectorAttributeValueInsideDoubleQuotes(
                props.rel
              );
              instance = escapeSelectorAttributeValueInsideDoubleQuotes(
                props.href
              );
              titles = 'link[rel="' + titles + '"][href="' + instance + '"]';
              "string" === typeof props.sizes &&
                ((instance = escapeSelectorAttributeValueInsideDoubleQuotes(
                  props.sizes
                )),
                (titles += '[sizes="' + instance + '"]'));
              "string" === typeof props.media &&
                ((instance = escapeSelectorAttributeValueInsideDoubleQuotes(
                  props.media
                )),
                (titles += '[media="' + instance + '"]'));
              if ((titles = root$52.querySelector(titles))) {
                instance = resource.instance = titles;
                instance[internalResourceMarker] = !0;
                break;
              }
              instance = resource.instance = createResourceInstance(
                type,
                props,
                root$52
              );
              insertResourceInstanceBefore(root$52, instance, null);
              break;
            case "base":
              (titles = root$52.querySelector(resource.matcher))
                ? ((instance = resource.instance = titles),
                  (instance[internalResourceMarker] = !0))
                : ((instance = resource.instance =
                    createResourceInstance(type, props, root$52)),
                  insertResourceInstanceBefore(
                    root$52,
                    instance,
                    root$52.querySelector("base")
                  ));
              break;
            default:
              throw Error(formatProdErrorMessage(457, type));
          }
        }
        resource = instance;
      }
      return resource;
    case "style":
      root$52 = resource.instance;
      if (!root$52)
        if (
          ((props = resource.root),
          (type = resource.precedence),
          (root$52 = escapeSelectorAttributeValueInsideDoubleQuotes(
            resource.props.href
          )),
          (titles = props.querySelector(
            'link[rel="stylesheet"][data-precedence][href="' + root$52 + '"]'
          )))
        )
          if (
            ((root$52 = resource.instance = titles),
            (root$52[internalResourceMarker] = !0),
            (resource.preloaded = !0),
            (props = titles._p))
          )
            switch (props.s) {
              case "l":
                resource.loaded = !0;
                resource.error = !1;
                break;
              case "e":
                resource.error = !0;
                break;
              default:
                attachLoadListeners(titles, resource);
            }
          else resource.loaded = !0;
        else {
          root$52 = resource.instance = createResourceInstance(
            "link",
            resource.props,
            getDocumentFromRoot(props)
          );
          attachLoadListeners(root$52, resource);
          titles = root$52;
          instance = props.querySelectorAll(
            'link[rel="stylesheet"][data-precedence]'
          );
          parentResource = matcher = instance.length
            ? instance[instance.length - 1]
            : null;
          for (
            propertyAttr = 0;
            propertyAttr < instance.length;
            propertyAttr++
          ) {
            var node = instance[propertyAttr];
            if (node.dataset.precedence === type) parentResource = node;
            else if (parentResource !== matcher) break;
          }
          if (parentResource)
            parentResource.parentNode.insertBefore(
              titles,
              parentResource.nextSibling
            );
          else if ((props = 9 === props.nodeType ? props.head : props))
            props.insertBefore(titles, props.firstChild);
          else throw Error(formatProdErrorMessage(447));
        }
      resource.count++;
      return root$52;
    case "script":
      return (
        (props = resource.instance),
        props ||
          ((root$52 = resource.root),
          (props = escapeSelectorAttributeValueInsideDoubleQuotes(
            resource.props.src
          )),
          (props = root$52.querySelector('script[async][src="' + props + '"]'))
            ? ((props = resource.instance = props),
              (props[internalResourceMarker] = !0))
            : ((props = resource.instance =
                createResourceInstance(
                  "script",
                  resource.props,
                  getDocumentFromRoot(root$52)
                )),
              insertResourceInstanceBefore(
                getDocumentFromRoot(root$52),
                props,
                null
              ))),
        props
      );
    case "preload":
      return resource.instance;
    default:
      throw Error(formatProdErrorMessage(443, resource.type));
  }
}
function releaseResource(resource) {
  switch (resource.type) {
    case "link":
    case "title":
    case "meta":
      if (0 === --resource.count) {
        var instance = resource.instance,
          parent = instance.parentNode;
        parent && parent.removeChild(instance);
        resource.instance = null;
      }
      break;
    case "style":
      resource.count--;
  }
}
function createResourceInstance(type, props, ownerDocument) {
  ownerDocument = createElement(
    type,
    props,
    ownerDocument,
    "http://www.w3.org/1999/xhtml"
  );
  setInitialProperties(ownerDocument, type, props);
  ownerDocument[internalResourceMarker] = !0;
  return ownerDocument;
}
function createStyleResource(styleResources, root, href, precedence, props) {
  var limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(href);
  limitedEscapedHref = root.querySelector(
    'link[rel="stylesheet"][href="' + limitedEscapedHref + '"]'
  );
  root = {
    type: "style",
    count: 0,
    href: href,
    precedence: precedence,
    props: props,
    hint: null,
    preloaded: !1,
    loaded: !1,
    error: !1,
    root: root,
    instance: null
  };
  styleResources.set(href, root);
  if (limitedEscapedHref)
    if ((styleResources = limitedEscapedHref._p))
      switch (styleResources.s) {
        case "l":
          root.loaded = !0;
          break;
        case "e":
          root.error = !0;
          break;
        default:
          attachLoadListeners(limitedEscapedHref, root);
      }
    else root.loaded = !0;
  else if ((href = preloadResources.get(href)))
    (root.hint = href),
      (styleResources = root.props),
      (href = href.props),
      null == styleResources.crossOrigin &&
        (styleResources.crossOrigin = href.crossOrigin),
      null == styleResources.referrerPolicy &&
        (styleResources.referrerPolicy = href.referrerPolicy),
      null == styleResources.title && (styleResources.title = href.title);
  return root;
}
function createScriptResource(scriptResources, root, src, props) {
  var limitedEscapedSrc = escapeSelectorAttributeValueInsideDoubleQuotes(src);
  limitedEscapedSrc = root.querySelector(
    'script[async][src="' + limitedEscapedSrc + '"]'
  );
  root = {
    type: "script",
    src: src,
    props: props,
    root: root,
    instance: limitedEscapedSrc || null
  };
  scriptResources.set(src, root);
  if (limitedEscapedSrc) limitedEscapedSrc[internalResourceMarker] = !0;
  else if ((scriptResources = preloadResources.get(src)))
    (scriptResources = scriptResources.props),
      null == props.crossOrigin &&
        (props.crossOrigin = scriptResources.crossOrigin),
      null == props.referrerPolicy &&
        (props.referrerPolicy = scriptResources.referrerPolicy),
      null == props.integrity &&
        (props.referrerPolicy = scriptResources.integrity);
  return root;
}
function createPreloadResource(ownerDocument, href, props) {
  var limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(href);
  (limitedEscapedHref = ownerDocument.querySelector(
    'link[rel="preload"][href="' + limitedEscapedHref + '"]'
  ))
    ? (limitedEscapedHref[internalResourceMarker] = !0)
    : ((limitedEscapedHref = createResourceInstance(
        "link",
        props,
        ownerDocument
      )),
      insertResourceInstanceBefore(ownerDocument, limitedEscapedHref, null));
  return {
    type: "preload",
    href: href,
    ownerDocument: ownerDocument,
    props: props,
    instance: limitedEscapedHref
  };
}
function attachLoadListeners(instance, resource) {
  var listeners = {};
  listeners.load = onResourceLoad.bind(
    null,
    instance,
    resource,
    listeners,
    loadAndErrorEventListenerOptions
  );
  listeners.error = onResourceError.bind(
    null,
    instance,
    resource,
    listeners,
    loadAndErrorEventListenerOptions
  );
  instance.addEventListener(
    "load",
    listeners.load,
    loadAndErrorEventListenerOptions
  );
  instance.addEventListener(
    "error",
    listeners.error,
    loadAndErrorEventListenerOptions
  );
}
var loadAndErrorEventListenerOptions = { passive: !0 };
function onResourceLoad(instance, resource, listeners, listenerOptions) {
  resource.loaded = !0;
  resource.error = !1;
  for (var event in listeners)
    instance.removeEventListener(event, listeners[event], listenerOptions);
}
function onResourceError(instance, resource, listeners, listenerOptions) {
  resource.loaded = !1;
  resource.error = !0;
  for (var event in listeners)
    instance.removeEventListener(event, listeners[event], listenerOptions);
}
function insertResourceInstanceBefore(ownerDocument, instance, before) {
  if ((ownerDocument = (before && before.parentNode) || ownerDocument.head))
    ownerDocument.insertBefore(instance, before);
  else throw Error(formatProdErrorMessage(447));
}
var escapeSelectorAttributeValueInsideDoubleQuotesRegex = /[\n"\\]/g;
function escapeSelectorAttributeValueInsideDoubleQuotes(value) {
  return value.replace(
    escapeSelectorAttributeValueInsideDoubleQuotesRegex,
    function (ch) {
      return "\\" + ch.charCodeAt(0).toString(16);
    }
  );
}
var eventsEnabled = null,
  selectionInformation = null;
function shouldSetTextContent(type, props) {
  return (
    "textarea" === type ||
    "noscript" === type ||
    "string" === typeof props.children ||
    "number" === typeof props.children ||
    ("object" === typeof props.dangerouslySetInnerHTML &&
      null !== props.dangerouslySetInnerHTML &&
      null != props.dangerouslySetInnerHTML.__html)
  );
}
var scheduleTimeout = "function" === typeof setTimeout ? setTimeout : void 0,
  cancelTimeout = "function" === typeof clearTimeout ? clearTimeout : void 0,
  localPromise = "function" === typeof Promise ? Promise : void 0;
function getInstanceFromScope(scopeInstance) {
  scopeInstance = scopeInstance[internalInstanceKey] || null;
  return scopeInstance;
}
var scheduleMicrotask =
  "function" === typeof queueMicrotask
    ? queueMicrotask
    : "undefined" !== typeof localPromise
    ? function (callback) {
        return localPromise
          .resolve(null)
          .then(callback)
          .catch(handleErrorInNextTick);
      }
    : scheduleTimeout;
function handleErrorInNextTick(error) {
  setTimeout(function () {
    throw error;
  });
}
function createEvent(type, bubbles) {
  var event = document.createEvent("Event");
  event.initEvent(type, bubbles, !1);
  return event;
}
function dispatchBeforeDetachedBlur(target, internalInstanceHandle) {
  var event = createEvent("beforeblur", !0);
  event._detachedInterceptFiber = internalInstanceHandle;
  target.dispatchEvent(event);
}
function dispatchAfterDetachedBlur(target) {
  var event = createEvent("afterblur", !1);
  event.relatedTarget = target;
  document.dispatchEvent(event);
}
function clearSuspenseBoundary(parentInstance, suspenseInstance) {
  var node = suspenseInstance,
    depth = 0;
  do {
    var nextNode = node.nextSibling;
    parentInstance.removeChild(node);
    if (nextNode && 8 === nextNode.nodeType)
      if (((node = nextNode.data), "/$" === node)) {
        if (0 === depth) {
          parentInstance.removeChild(nextNode);
          retryIfBlockedOn(suspenseInstance);
          return;
        }
        depth--;
      } else ("$" !== node && "$?" !== node && "$!" !== node) || depth++;
    node = nextNode;
  } while (node);
  retryIfBlockedOn(suspenseInstance);
}
function clearContainerSparingly(container) {
  var nextNode = container.firstChild;
  nextNode && 10 === nextNode.nodeType && (nextNode = nextNode.nextSibling);
  for (; nextNode; ) {
    var node = nextNode;
    nextNode = nextNode.nextSibling;
    switch (node.nodeName) {
      case "HTML":
      case "HEAD":
      case "BODY":
        clearContainerSparingly(node);
        detachDeletedInstance(node);
        continue;
      case "STYLE":
        continue;
      case "LINK":
        if ("stylesheet" === node.rel.toLowerCase()) continue;
    }
    container.removeChild(node);
  }
}
function getNextHydratable(node) {
  for (; null != node; node = node.nextSibling) {
    var nodeType = node.nodeType;
    if (1 === nodeType) {
      nodeType = node;
      switch (nodeType.tagName) {
        case "TITLE":
        case "META":
        case "BASE":
        case "HTML":
        case "HEAD":
        case "BODY":
          continue;
        case "LINK":
          if (
            "stylesheet" === nodeType.rel &&
            !nodeType.hasAttribute("data-precedence")
          )
            break;
          continue;
        case "STYLE":
          if (nodeType.hasAttribute("data-precedence")) continue;
          break;
        case "SCRIPT":
          if (nodeType.hasAttribute("async")) continue;
      }
      break;
    } else if (3 === nodeType) break;
    if (8 === nodeType) {
      nodeType = node.data;
      if ("$" === nodeType || "$!" === nodeType || "$?" === nodeType) break;
      if ("/$" === nodeType) return null;
    }
  }
  return node;
}
function getParentSuspenseInstance(targetInstance) {
  targetInstance = targetInstance.previousSibling;
  for (var depth = 0; targetInstance; ) {
    if (8 === targetInstance.nodeType) {
      var data = targetInstance.data;
      if ("$" === data || "$!" === data || "$?" === data) {
        if (0 === depth) return targetInstance;
        depth--;
      } else "/$" === data && depth++;
    }
    targetInstance = targetInstance.previousSibling;
  }
  return null;
}
function getBoundingRect(node) {
  node = node.getBoundingClientRect();
  return { x: node.left, y: node.top, width: node.width, height: node.height };
}
function isHiddenSubtree(fiber) {
  return 5 === fiber.tag && !0 === fiber.memoizedProps.hidden;
}
function setFocusIfFocusable(node) {
  function handleFocus() {
    didFocus = !0;
  }
  var didFocus = !1;
  try {
    node.addEventListener("focus", handleFocus),
      (node.focus || HTMLElement.prototype.focus).call(node);
  } finally {
    node.removeEventListener("focus", handleFocus);
  }
  return didFocus;
}
function setupIntersectionObserver(targets, callback, options) {
  var rectRatioCache = new Map();
  targets.forEach(function (target) {
    rectRatioCache.set(target, { rect: getBoundingRect(target), ratio: 0 });
  });
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var boundingClientRect = entry.boundingClientRect;
      rectRatioCache.set(entry.target, {
        rect: {
          x: boundingClientRect.left,
          y: boundingClientRect.top,
          width: boundingClientRect.width,
          height: boundingClientRect.height
        },
        ratio: entry.intersectionRatio
      });
    });
    callback(Array.from(rectRatioCache.values()));
  }, options);
  targets.forEach(function (target) {
    observer.observe(target);
  });
  return {
    disconnect: function () {
      return observer.disconnect();
    },
    observe: function (target) {
      rectRatioCache.set(target, { rect: getBoundingRect(target), ratio: 0 });
      observer.observe(target);
    },
    unobserve: function (target) {
      rectRatioCache.delete(target);
      observer.unobserve(target);
    }
  };
}
function isHostResourceType(type, props, hostContext) {
  switch (type) {
    case "base":
    case "meta":
      return !0;
    case "title":
      return "http://www.w3.org/2000/svg" !== hostContext;
    case "link":
      type = props.onError;
      if (props.onLoad || type) break;
      switch (props.rel) {
        case "stylesheet":
          return (
            (type = props.precedence),
            (hostContext = props.disabled),
            "string" === typeof props.href &&
              "string" === typeof type &&
              null == hostContext
          );
        default:
          return (
            (type = props.rel),
            "string" === typeof props.href && "string" === typeof type
          );
      }
    case "script":
      type = props.src;
      hostContext = props.onLoad;
      var onError$60 = props.onError;
      return (
        props.async && "string" === typeof type && !hostContext && !onError$60
      );
  }
  return !1;
}
function resolveSingletonInstance(type, props, rootContainerInstance) {
  props =
    9 === rootContainerInstance.nodeType
      ? rootContainerInstance
      : rootContainerInstance.ownerDocument;
  switch (type) {
    case "html":
      type = props.documentElement;
      if (!type) throw Error(formatProdErrorMessage(452));
      return type;
    case "head":
      type = props.head;
      if (!type) throw Error(formatProdErrorMessage(453));
      return type;
    case "body":
      type = props.body;
      if (!type) throw Error(formatProdErrorMessage(454));
      return type;
    default:
      throw Error(formatProdErrorMessage(451));
  }
}
var emptyContextObject = {},
  syncQueue = null,
  includesLegacySyncCallbacks = !1,
  isFlushingSyncQueue = !1;
function scheduleSyncCallback(callback) {
  null === syncQueue ? (syncQueue = [callback]) : syncQueue.push(callback);
}
function scheduleLegacySyncCallback(callback) {
  includesLegacySyncCallbacks = !0;
  scheduleSyncCallback(callback);
}
function flushSyncCallbacks() {
  if (!isFlushingSyncQueue && null !== syncQueue) {
    isFlushingSyncQueue = !0;
    var i = 0,
      previousUpdatePriority = currentUpdatePriority;
    try {
      var queue = syncQueue;
      for (currentUpdatePriority = 2; i < queue.length; i++) {
        var callback = queue[i];
        do callback = callback(!0);
        while (null !== callback);
      }
      syncQueue = null;
      includesLegacySyncCallbacks = !1;
    } catch (error) {
      throw (
        (null !== syncQueue && (syncQueue = syncQueue.slice(i + 1)),
        scheduleCallback(ImmediatePriority, flushSyncCallbacks),
        error)
      );
    } finally {
      (currentUpdatePriority = previousUpdatePriority),
        (isFlushingSyncQueue = !1);
    }
  }
  return null;
}
var forkStack = [],
  forkStackIndex = 0,
  treeForkProvider = null,
  treeForkCount = 0,
  idStack = [],
  idStackIndex = 0,
  treeContextProvider = null,
  treeContextId = 1,
  treeContextOverflow = "";
function pushTreeFork(workInProgress, totalChildren) {
  forkStack[forkStackIndex++] = treeForkCount;
  forkStack[forkStackIndex++] = treeForkProvider;
  treeForkProvider = workInProgress;
  treeForkCount = totalChildren;
}
function pushTreeId(workInProgress, totalChildren, index) {
  idStack[idStackIndex++] = treeContextId;
  idStack[idStackIndex++] = treeContextOverflow;
  idStack[idStackIndex++] = treeContextProvider;
  treeContextProvider = workInProgress;
  var baseIdWithLeadingBit = treeContextId;
  workInProgress = treeContextOverflow;
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
    treeContextId =
      (1 << (32 - clz32(totalChildren) + baseLength)) |
      (index << baseLength) |
      baseIdWithLeadingBit;
    treeContextOverflow = length + workInProgress;
  } else
    (treeContextId =
      (1 << length) | (index << baseLength) | baseIdWithLeadingBit),
      (treeContextOverflow = workInProgress);
}
function pushMaterializedTreeId(workInProgress) {
  null !== workInProgress.return &&
    (pushTreeFork(workInProgress, 1), pushTreeId(workInProgress, 1, 0));
}
function popTreeContext(workInProgress) {
  for (; workInProgress === treeForkProvider; )
    (treeForkProvider = forkStack[--forkStackIndex]),
      (forkStack[forkStackIndex] = null),
      (treeForkCount = forkStack[--forkStackIndex]),
      (forkStack[forkStackIndex] = null);
  for (; workInProgress === treeContextProvider; )
    (treeContextProvider = idStack[--idStackIndex]),
      (idStack[idStackIndex] = null),
      (treeContextOverflow = idStack[--idStackIndex]),
      (idStack[idStackIndex] = null),
      (treeContextId = idStack[--idStackIndex]),
      (idStack[idStackIndex] = null);
}
var hydrationParentFiber = null,
  nextHydratableInstance = null,
  isHydrating = !1,
  hydrationErrors = null;
function deleteHydratableInstance(returnFiber, instance) {
  var fiber = createFiber(5, null, null, 0);
  fiber.elementType = "DELETED";
  fiber.stateNode = instance;
  fiber.return = returnFiber;
  instance = returnFiber.deletions;
  null === instance
    ? ((returnFiber.deletions = [fiber]), (returnFiber.flags |= 16))
    : instance.push(fiber);
}
function tryHydrate(fiber, nextInstance) {
  switch (fiber.tag) {
    case 5:
      var type = fiber.type;
      nextInstance =
        1 !== nextInstance.nodeType ||
        type.toLowerCase() !== nextInstance.nodeName.toLowerCase()
          ? null
          : nextInstance;
      return null !== nextInstance
        ? ((fiber.stateNode = nextInstance),
          (hydrationParentFiber = fiber),
          (nextHydratableInstance = getNextHydratable(nextInstance.firstChild)),
          !0)
        : !1;
    case 6:
      return (
        (nextInstance =
          "" === fiber.pendingProps || 3 !== nextInstance.nodeType
            ? null
            : nextInstance),
        null !== nextInstance
          ? ((fiber.stateNode = nextInstance),
            (hydrationParentFiber = fiber),
            (nextHydratableInstance = null),
            !0)
          : !1
      );
    case 13:
      return (
        (nextInstance = 8 !== nextInstance.nodeType ? null : nextInstance),
        null !== nextInstance
          ? ((type =
              null !== treeContextProvider
                ? { id: treeContextId, overflow: treeContextOverflow }
                : null),
            (fiber.memoizedState = {
              dehydrated: nextInstance,
              treeContext: type,
              retryLane: 1073741824
            }),
            (type = createFiber(18, null, null, 0)),
            (type.stateNode = nextInstance),
            (type.return = fiber),
            (fiber.child = type),
            (hydrationParentFiber = fiber),
            (nextHydratableInstance = null),
            !0)
          : !1
      );
    default:
      return !1;
  }
}
function shouldClientRenderOnMismatch(fiber) {
  return 0 !== (fiber.mode & 1) && 0 === (fiber.flags & 128);
}
function tryToClaimNextHydratableInstance(fiber) {
  if (isHydrating) {
    var type = fiber.type;
    var JSCompiler_inline_result = fiber.pendingProps;
    if ("link" === type)
      JSCompiler_inline_result =
        "stylesheet" === JSCompiler_inline_result.rel &&
        "string" !== typeof JSCompiler_inline_result.precedence
          ? !0
          : !1;
    else if ("script" === type) {
      type = JSCompiler_inline_result.onLoad;
      var onError = JSCompiler_inline_result.onError;
      JSCompiler_inline_result = !(
        JSCompiler_inline_result.async &&
        (type || onError)
      );
    } else JSCompiler_inline_result = !0;
    if (JSCompiler_inline_result)
      if ((JSCompiler_inline_result = nextHydratableInstance)) {
        if (
          ((type = JSCompiler_inline_result),
          !tryHydrate(fiber, JSCompiler_inline_result))
        ) {
          if (shouldClientRenderOnMismatch(fiber))
            throw Error(formatProdErrorMessage(418));
          JSCompiler_inline_result = getNextHydratable(type.nextSibling);
          onError = hydrationParentFiber;
          JSCompiler_inline_result &&
          tryHydrate(fiber, JSCompiler_inline_result)
            ? deleteHydratableInstance(onError, type)
            : ((fiber.flags = (fiber.flags & -4097) | 2),
              (isHydrating = !1),
              (hydrationParentFiber = fiber));
        }
      } else {
        if (shouldClientRenderOnMismatch(fiber))
          throw Error(formatProdErrorMessage(418));
        fiber.flags = (fiber.flags & -4097) | 2;
        isHydrating = !1;
        hydrationParentFiber = fiber;
      }
    else
      (fiber.flags = (fiber.flags & -4097) | 2),
        (isHydrating = !1),
        (hydrationParentFiber = fiber);
  }
}
function prepareToHydrateHostInstance(fiber) {
  var instance = fiber.stateNode,
    type = fiber.type,
    props = fiber.memoizedProps;
  instance[internalInstanceKey] = fiber;
  instance[internalPropsKey] = props;
  var isConcurrentMode = 0 !== (fiber.mode & 1);
  switch (type) {
    case "dialog":
      listenToNonDelegatedEvent("cancel", instance);
      listenToNonDelegatedEvent("close", instance);
      break;
    case "iframe":
    case "object":
    case "embed":
      listenToNonDelegatedEvent("load", instance);
      break;
    case "video":
    case "audio":
      for (var i = 0; i < mediaEventTypes.length; i++)
        listenToNonDelegatedEvent(mediaEventTypes[i], instance);
      break;
    case "source":
      listenToNonDelegatedEvent("error", instance);
      break;
    case "img":
    case "image":
    case "link":
      listenToNonDelegatedEvent("error", instance);
      listenToNonDelegatedEvent("load", instance);
      break;
    case "details":
      listenToNonDelegatedEvent("toggle", instance);
      break;
    case "input":
      initWrapperState(instance, props);
      listenToNonDelegatedEvent("invalid", instance);
      break;
    case "select":
      instance._wrapperState = { wasMultiple: !!props.multiple };
      listenToNonDelegatedEvent("invalid", instance);
      break;
    case "textarea":
      initWrapperState$2(instance, props),
        listenToNonDelegatedEvent("invalid", instance);
  }
  assertValidProps(type, props);
  i = null;
  for (var propKey in props)
    if (props.hasOwnProperty(propKey)) {
      var nextProp = props[propKey];
      "children" === propKey
        ? "string" === typeof nextProp
          ? instance.textContent !== nextProp &&
            (!0 !== props.suppressHydrationWarning &&
              checkForUnmatchedText(
                instance.textContent,
                nextProp,
                isConcurrentMode
              ),
            (i = ["children", nextProp]))
          : "number" === typeof nextProp &&
            instance.textContent !== "" + nextProp &&
            (!0 !== props.suppressHydrationWarning &&
              checkForUnmatchedText(
                instance.textContent,
                nextProp,
                isConcurrentMode
              ),
            (i = ["children", "" + nextProp]))
        : registrationNameDependencies.hasOwnProperty(propKey) &&
          null != nextProp &&
          "onScroll" === propKey &&
          listenToNonDelegatedEvent("scroll", instance);
    }
  switch (type) {
    case "input":
      track(instance);
      postMountWrapper(instance, props, !0);
      break;
    case "textarea":
      track(instance);
      postMountWrapper$3(instance);
      break;
    case "select":
    case "option":
      break;
    default:
      "function" === typeof props.onClick && (instance.onclick = noop);
  }
  instance = i;
  fiber.updateQueue = instance;
  return null !== instance ? !0 : !1;
}
function popToNextHostParent(fiber) {
  for (
    fiber = fiber.return;
    null !== fiber &&
    5 !== fiber.tag &&
    3 !== fiber.tag &&
    13 !== fiber.tag &&
    27 !== fiber.tag;

  )
    fiber = fiber.return;
  hydrationParentFiber = fiber;
}
function popHydrationState(fiber) {
  if (fiber !== hydrationParentFiber) return !1;
  if (!isHydrating) return popToNextHostParent(fiber), (isHydrating = !0), !1;
  var shouldClear = !1;
  3 === fiber.tag ||
    27 === fiber.tag ||
    (5 === fiber.tag &&
      shouldSetTextContent(fiber.type, fiber.memoizedProps)) ||
    (shouldClear = !0);
  if (shouldClear && (shouldClear = nextHydratableInstance)) {
    if (shouldClientRenderOnMismatch(fiber))
      throw (warnIfUnhydratedTailNodes(), Error(formatProdErrorMessage(418)));
    for (; shouldClear; )
      deleteHydratableInstance(fiber, shouldClear),
        (shouldClear = getNextHydratable(shouldClear.nextSibling));
  }
  popToNextHostParent(fiber);
  if (13 === fiber.tag) {
    fiber = fiber.memoizedState;
    fiber = null !== fiber ? fiber.dehydrated : null;
    if (!fiber) throw Error(formatProdErrorMessage(317));
    a: {
      fiber = fiber.nextSibling;
      for (shouldClear = 0; fiber; ) {
        if (8 === fiber.nodeType) {
          var data = fiber.data;
          if ("/$" === data) {
            if (0 === shouldClear) {
              nextHydratableInstance = getNextHydratable(fiber.nextSibling);
              break a;
            }
            shouldClear--;
          } else
            ("$" !== data && "$!" !== data && "$?" !== data) || shouldClear++;
        }
        fiber = fiber.nextSibling;
      }
      nextHydratableInstance = null;
    }
  } else
    nextHydratableInstance = hydrationParentFiber
      ? getNextHydratable(fiber.stateNode.nextSibling)
      : null;
  return !0;
}
function warnIfUnhydratedTailNodes() {
  for (var nextInstance = nextHydratableInstance; nextInstance; )
    nextInstance = getNextHydratable(nextInstance.nextSibling);
}
function resetHydrationState() {
  nextHydratableInstance = hydrationParentFiber = null;
  isHydrating = !1;
}
function queueHydrationError(error) {
  null === hydrationErrors
    ? (hydrationErrors = [error])
    : hydrationErrors.push(error);
}
var concurrentQueues = [],
  concurrentQueuesIndex = 0,
  concurrentlyUpdatedLanes = 0;
function finishQueueingConcurrentUpdates() {
  for (
    var endIndex = concurrentQueuesIndex,
      i = (concurrentlyUpdatedLanes = concurrentQueuesIndex = 0);
    i < endIndex;

  ) {
    var fiber = concurrentQueues[i];
    concurrentQueues[i++] = null;
    var queue = concurrentQueues[i];
    concurrentQueues[i++] = null;
    var update = concurrentQueues[i];
    concurrentQueues[i++] = null;
    var lane = concurrentQueues[i];
    concurrentQueues[i++] = null;
    if (null !== queue && null !== update) {
      var pending = queue.pending;
      null === pending
        ? (update.next = update)
        : ((update.next = pending.next), (pending.next = update));
      queue.pending = update;
    }
    0 !== lane && markUpdateLaneFromFiberToRoot(fiber, update, lane);
  }
}
function enqueueUpdate(fiber, queue, update, lane) {
  concurrentQueues[concurrentQueuesIndex++] = fiber;
  concurrentQueues[concurrentQueuesIndex++] = queue;
  concurrentQueues[concurrentQueuesIndex++] = update;
  concurrentQueues[concurrentQueuesIndex++] = lane;
  concurrentlyUpdatedLanes |= lane;
  fiber.lanes |= lane;
  fiber = fiber.alternate;
  null !== fiber && (fiber.lanes |= lane);
}
function enqueueConcurrentRenderForLane(fiber, lane) {
  enqueueUpdate(fiber, null, null, lane);
  return getRootForUpdatedFiber(fiber);
}
function markUpdateLaneFromFiberToRoot(sourceFiber, update, lane) {
  sourceFiber.lanes |= lane;
  var alternate = sourceFiber.alternate;
  null !== alternate && (alternate.lanes |= lane);
  for (var isHidden = !1, parent = sourceFiber.return; null !== parent; )
    (parent.childLanes |= lane),
      (alternate = parent.alternate),
      null !== alternate && (alternate.childLanes |= lane),
      22 === parent.tag &&
        ((sourceFiber = parent.stateNode),
        null === sourceFiber || sourceFiber._visibility & 1 || (isHidden = !0)),
      (sourceFiber = parent),
      (parent = parent.return);
  isHidden &&
    null !== update &&
    3 === sourceFiber.tag &&
    ((parent = sourceFiber.stateNode),
    (isHidden = 31 - clz32(lane)),
    (parent = parent.hiddenUpdates),
    (sourceFiber = parent[isHidden]),
    null === sourceFiber
      ? (parent[isHidden] = [update])
      : sourceFiber.push(update),
    (update.lane = lane | 1073741824));
}
function getRootForUpdatedFiber(sourceFiber) {
  if (50 < nestedUpdateCount)
    throw (
      ((nestedUpdateCount = 0),
      (rootWithNestedUpdates = null),
      Error(formatProdErrorMessage(185)))
    );
  for (var parent = sourceFiber.return; null !== parent; )
    (sourceFiber = parent), (parent = sourceFiber.return);
  return 3 === sourceFiber.tag ? sourceFiber.stateNode : null;
}
var hasForceUpdate = !1;
function initializeUpdateQueue(fiber) {
  fiber.updateQueue = {
    baseState: fiber.memoizedState,
    firstBaseUpdate: null,
    lastBaseUpdate: null,
    shared: { pending: null, lanes: 0, hiddenCallbacks: null },
    callbacks: null
  };
}
function cloneUpdateQueue(current, workInProgress) {
  current = current.updateQueue;
  workInProgress.updateQueue === current &&
    (workInProgress.updateQueue = {
      baseState: current.baseState,
      firstBaseUpdate: current.firstBaseUpdate,
      lastBaseUpdate: current.lastBaseUpdate,
      shared: current.shared,
      callbacks: null
    });
}
function createUpdate(eventTime, lane) {
  return {
    eventTime: eventTime,
    lane: lane,
    tag: 0,
    payload: null,
    callback: null,
    next: null
  };
}
function enqueueUpdate$1(fiber, update, lane) {
  var updateQueue = fiber.updateQueue;
  if (null === updateQueue) return null;
  updateQueue = updateQueue.shared;
  if (0 !== (executionContext & 2)) {
    var pending = updateQueue.pending;
    null === pending
      ? (update.next = update)
      : ((update.next = pending.next), (pending.next = update));
    updateQueue.pending = update;
    update = getRootForUpdatedFiber(fiber);
    markUpdateLaneFromFiberToRoot(fiber, null, lane);
    return update;
  }
  enqueueUpdate(fiber, updateQueue, update, lane);
  return getRootForUpdatedFiber(fiber);
}
function entangleTransitions(root, fiber, lane) {
  fiber = fiber.updateQueue;
  if (null !== fiber && ((fiber = fiber.shared), 0 !== (lane & 8388480))) {
    var queueLanes = fiber.lanes;
    queueLanes &= root.pendingLanes;
    lane |= queueLanes;
    fiber.lanes = lane;
    markRootEntangled(root, lane);
  }
}
function enqueueCapturedUpdate(workInProgress, capturedUpdate) {
  var queue = workInProgress.updateQueue,
    current = workInProgress.alternate;
  if (
    null !== current &&
    ((current = current.updateQueue), queue === current)
  ) {
    var newFirst = null,
      newLast = null;
    queue = queue.firstBaseUpdate;
    if (null !== queue) {
      do {
        var clone = {
          eventTime: queue.eventTime,
          lane: queue.lane,
          tag: queue.tag,
          payload: queue.payload,
          callback: null,
          next: null
        };
        null === newLast
          ? (newFirst = newLast = clone)
          : (newLast = newLast.next = clone);
        queue = queue.next;
      } while (null !== queue);
      null === newLast
        ? (newFirst = newLast = capturedUpdate)
        : (newLast = newLast.next = capturedUpdate);
    } else newFirst = newLast = capturedUpdate;
    queue = {
      baseState: current.baseState,
      firstBaseUpdate: newFirst,
      lastBaseUpdate: newLast,
      shared: current.shared,
      callbacks: current.callbacks
    };
    workInProgress.updateQueue = queue;
    return;
  }
  workInProgress = queue.lastBaseUpdate;
  null === workInProgress
    ? (queue.firstBaseUpdate = capturedUpdate)
    : (workInProgress.next = capturedUpdate);
  queue.lastBaseUpdate = capturedUpdate;
}
function processUpdateQueue(
  workInProgress$jscomp$0,
  props,
  instance,
  renderLanes
) {
  var queue = workInProgress$jscomp$0.updateQueue;
  hasForceUpdate = !1;
  var firstBaseUpdate = queue.firstBaseUpdate,
    lastBaseUpdate = queue.lastBaseUpdate,
    pendingQueue = queue.shared.pending;
  if (null !== pendingQueue) {
    queue.shared.pending = null;
    var lastPendingUpdate = pendingQueue,
      firstPendingUpdate = lastPendingUpdate.next;
    lastPendingUpdate.next = null;
    null === lastBaseUpdate
      ? (firstBaseUpdate = firstPendingUpdate)
      : (lastBaseUpdate.next = firstPendingUpdate);
    lastBaseUpdate = lastPendingUpdate;
    var current = workInProgress$jscomp$0.alternate;
    null !== current &&
      ((current = current.updateQueue),
      (pendingQueue = current.lastBaseUpdate),
      pendingQueue !== lastBaseUpdate &&
        (null === pendingQueue
          ? (current.firstBaseUpdate = firstPendingUpdate)
          : (pendingQueue.next = firstPendingUpdate),
        (current.lastBaseUpdate = lastPendingUpdate)));
  }
  if (null !== firstBaseUpdate) {
    var newState = queue.baseState;
    lastBaseUpdate = 0;
    current = firstPendingUpdate = lastPendingUpdate = null;
    pendingQueue = firstBaseUpdate;
    do {
      var updateEventTime = pendingQueue.eventTime,
        updateLane = pendingQueue.lane & -1073741825,
        isHiddenUpdate = updateLane !== pendingQueue.lane;
      if (
        isHiddenUpdate
          ? (workInProgressRootRenderLanes & updateLane) === updateLane
          : (renderLanes & updateLane) === updateLane
      ) {
        null !== current &&
          (current = current.next =
            {
              eventTime: updateEventTime,
              lane: 0,
              tag: pendingQueue.tag,
              payload: pendingQueue.payload,
              callback: null,
              next: null
            });
        a: {
          var workInProgress = workInProgress$jscomp$0,
            update = pendingQueue;
          updateLane = props;
          updateEventTime = instance;
          switch (update.tag) {
            case 1:
              workInProgress = update.payload;
              if ("function" === typeof workInProgress) {
                newState = workInProgress.call(
                  updateEventTime,
                  newState,
                  updateLane
                );
                break a;
              }
              newState = workInProgress;
              break a;
            case 3:
              workInProgress.flags = (workInProgress.flags & -65537) | 128;
            case 0:
              workInProgress = update.payload;
              updateLane =
                "function" === typeof workInProgress
                  ? workInProgress.call(updateEventTime, newState, updateLane)
                  : workInProgress;
              if (null === updateLane || void 0 === updateLane) break a;
              newState = assign({}, newState, updateLane);
              break a;
            case 2:
              hasForceUpdate = !0;
          }
        }
        updateLane = pendingQueue.callback;
        null !== updateLane &&
          ((workInProgress$jscomp$0.flags |= 64),
          isHiddenUpdate && (workInProgress$jscomp$0.flags |= 8192),
          (isHiddenUpdate = queue.callbacks),
          null === isHiddenUpdate
            ? (queue.callbacks = [updateLane])
            : isHiddenUpdate.push(updateLane));
      } else
        (isHiddenUpdate = {
          eventTime: updateEventTime,
          lane: updateLane,
          tag: pendingQueue.tag,
          payload: pendingQueue.payload,
          callback: pendingQueue.callback,
          next: null
        }),
          null === current
            ? ((firstPendingUpdate = current = isHiddenUpdate),
              (lastPendingUpdate = newState))
            : (current = current.next = isHiddenUpdate),
          (lastBaseUpdate |= updateLane);
      pendingQueue = pendingQueue.next;
      if (null === pendingQueue)
        if (((pendingQueue = queue.shared.pending), null === pendingQueue))
          break;
        else
          (isHiddenUpdate = pendingQueue),
            (pendingQueue = isHiddenUpdate.next),
            (isHiddenUpdate.next = null),
            (queue.lastBaseUpdate = isHiddenUpdate),
            (queue.shared.pending = null);
    } while (1);
    null === current && (lastPendingUpdate = newState);
    queue.baseState = lastPendingUpdate;
    queue.firstBaseUpdate = firstPendingUpdate;
    queue.lastBaseUpdate = current;
    null === firstBaseUpdate && (queue.shared.lanes = 0);
    workInProgressRootSkippedLanes |= lastBaseUpdate;
    workInProgress$jscomp$0.lanes = lastBaseUpdate;
    workInProgress$jscomp$0.memoizedState = newState;
  }
}
function callCallback(callback, context) {
  if ("function" !== typeof callback)
    throw Error(formatProdErrorMessage(191, callback));
  callback.call(context);
}
function commitCallbacks(updateQueue, context) {
  var callbacks = updateQueue.callbacks;
  if (null !== callbacks)
    for (
      updateQueue.callbacks = null, updateQueue = 0;
      updateQueue < callbacks.length;
      updateQueue++
    )
      callCallback(callbacks[updateQueue], context);
}
function coerceRef(returnFiber, current, element) {
  returnFiber = element.ref;
  if (
    null !== returnFiber &&
    "function" !== typeof returnFiber &&
    "object" !== typeof returnFiber
  ) {
    if (element._owner) {
      element = element._owner;
      if (element) {
        if (1 !== element.tag) throw Error(formatProdErrorMessage(309));
        var inst = element.stateNode;
      }
      if (!inst) throw Error(formatProdErrorMessage(147, returnFiber));
      var resolvedInst = inst,
        stringRef = "" + returnFiber;
      if (
        null !== current &&
        null !== current.ref &&
        "function" === typeof current.ref &&
        current.ref._stringRef === stringRef
      )
        return current.ref;
      current = function (value) {
        var refs = resolvedInst.refs;
        null === value ? delete refs[stringRef] : (refs[stringRef] = value);
      };
      current._stringRef = stringRef;
      return current;
    }
    if ("string" !== typeof returnFiber)
      throw Error(formatProdErrorMessage(284));
    if (!element._owner) throw Error(formatProdErrorMessage(290, returnFiber));
  }
  return returnFiber;
}
function throwOnInvalidObjectType(returnFiber, newChild) {
  returnFiber = Object.prototype.toString.call(newChild);
  throw Error(
    formatProdErrorMessage(
      31,
      "[object Object]" === returnFiber
        ? "object with keys {" + Object.keys(newChild).join(", ") + "}"
        : returnFiber
    )
  );
}
function resolveLazy(lazyType) {
  var init = lazyType._init;
  return init(lazyType._payload);
}
function createChildReconciler(shouldTrackSideEffects) {
  function deleteChild(returnFiber, childToDelete) {
    if (shouldTrackSideEffects) {
      var deletions = returnFiber.deletions;
      null === deletions
        ? ((returnFiber.deletions = [childToDelete]), (returnFiber.flags |= 16))
        : deletions.push(childToDelete);
    }
  }
  function deleteRemainingChildren(returnFiber, currentFirstChild) {
    if (!shouldTrackSideEffects) return null;
    for (; null !== currentFirstChild; )
      deleteChild(returnFiber, currentFirstChild),
        (currentFirstChild = currentFirstChild.sibling);
    return null;
  }
  function mapRemainingChildren(returnFiber, currentFirstChild) {
    for (returnFiber = new Map(); null !== currentFirstChild; )
      null !== currentFirstChild.key
        ? returnFiber.set(currentFirstChild.key, currentFirstChild)
        : returnFiber.set(currentFirstChild.index, currentFirstChild),
        (currentFirstChild = currentFirstChild.sibling);
    return returnFiber;
  }
  function useFiber(fiber, pendingProps) {
    fiber = createWorkInProgress(fiber, pendingProps);
    fiber.index = 0;
    fiber.sibling = null;
    return fiber;
  }
  function placeChild(newFiber, lastPlacedIndex, newIndex) {
    newFiber.index = newIndex;
    if (!shouldTrackSideEffects)
      return (newFiber.flags |= 1048576), lastPlacedIndex;
    newIndex = newFiber.alternate;
    if (null !== newIndex)
      return (
        (newIndex = newIndex.index),
        newIndex < lastPlacedIndex
          ? ((newFiber.flags |= 16777218), lastPlacedIndex)
          : newIndex
      );
    newFiber.flags |= 16777218;
    return lastPlacedIndex;
  }
  function placeSingleChild(newFiber) {
    shouldTrackSideEffects &&
      null === newFiber.alternate &&
      (newFiber.flags |= 16777218);
    return newFiber;
  }
  function updateTextNode(returnFiber, current, textContent, lanes) {
    if (null === current || 6 !== current.tag)
      return (
        (current = createFiberFromText(textContent, returnFiber.mode, lanes)),
        (current.return = returnFiber),
        current
      );
    current = useFiber(current, textContent);
    current.return = returnFiber;
    return current;
  }
  function updateElement(returnFiber, current, element, lanes) {
    var elementType = element.type;
    if (elementType === REACT_FRAGMENT_TYPE)
      return updateFragment(
        returnFiber,
        current,
        element.props.children,
        lanes,
        element.key
      );
    if (
      null !== current &&
      (current.elementType === elementType ||
        ("object" === typeof elementType &&
          null !== elementType &&
          elementType.$$typeof === REACT_LAZY_TYPE &&
          resolveLazy(elementType) === current.type))
    )
      return (
        (lanes = useFiber(current, element.props)),
        (lanes.ref = coerceRef(returnFiber, current, element)),
        (lanes.return = returnFiber),
        lanes
      );
    lanes = createFiberFromTypeAndProps(
      element.type,
      element.key,
      element.props,
      null,
      returnFiber.mode,
      lanes
    );
    lanes.ref = coerceRef(returnFiber, current, element);
    lanes.return = returnFiber;
    return lanes;
  }
  function updatePortal(returnFiber, current, portal, lanes) {
    if (
      null === current ||
      4 !== current.tag ||
      current.stateNode.containerInfo !== portal.containerInfo ||
      current.stateNode.implementation !== portal.implementation
    )
      return (
        (current = createFiberFromPortal(portal, returnFiber.mode, lanes)),
        (current.return = returnFiber),
        current
      );
    current = useFiber(current, portal.children || []);
    current.return = returnFiber;
    return current;
  }
  function updateFragment(returnFiber, current, fragment, lanes, key) {
    if (null === current || 7 !== current.tag)
      return (
        (current = createFiberFromFragment(
          fragment,
          returnFiber.mode,
          lanes,
          key
        )),
        (current.return = returnFiber),
        current
      );
    current = useFiber(current, fragment);
    current.return = returnFiber;
    return current;
  }
  function createChild(returnFiber, newChild, lanes) {
    if (
      ("string" === typeof newChild && "" !== newChild) ||
      "number" === typeof newChild
    )
      return (
        (newChild = createFiberFromText(
          "" + newChild,
          returnFiber.mode,
          lanes
        )),
        (newChild.return = returnFiber),
        newChild
      );
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return (
            (lanes = createFiberFromTypeAndProps(
              newChild.type,
              newChild.key,
              newChild.props,
              null,
              returnFiber.mode,
              lanes
            )),
            (lanes.ref = coerceRef(returnFiber, null, newChild)),
            (lanes.return = returnFiber),
            lanes
          );
        case REACT_PORTAL_TYPE:
          return (
            (newChild = createFiberFromPortal(
              newChild,
              returnFiber.mode,
              lanes
            )),
            (newChild.return = returnFiber),
            newChild
          );
        case REACT_LAZY_TYPE:
          var init = newChild._init;
          return createChild(returnFiber, init(newChild._payload), lanes);
      }
      if (isArrayImpl(newChild) || getIteratorFn(newChild))
        return (
          (newChild = createFiberFromFragment(
            newChild,
            returnFiber.mode,
            lanes,
            null
          )),
          (newChild.return = returnFiber),
          newChild
        );
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    return null;
  }
  function updateSlot(returnFiber, oldFiber, newChild, lanes) {
    var key = null !== oldFiber ? oldFiber.key : null;
    if (
      ("string" === typeof newChild && "" !== newChild) ||
      "number" === typeof newChild
    )
      return null !== key
        ? null
        : updateTextNode(returnFiber, oldFiber, "" + newChild, lanes);
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return newChild.key === key
            ? updateElement(returnFiber, oldFiber, newChild, lanes)
            : null;
        case REACT_PORTAL_TYPE:
          return newChild.key === key
            ? updatePortal(returnFiber, oldFiber, newChild, lanes)
            : null;
        case REACT_LAZY_TYPE:
          return (
            (key = newChild._init),
            updateSlot(returnFiber, oldFiber, key(newChild._payload), lanes)
          );
      }
      if (isArrayImpl(newChild) || getIteratorFn(newChild))
        return null !== key
          ? null
          : updateFragment(returnFiber, oldFiber, newChild, lanes, null);
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    return null;
  }
  function updateFromMap(
    existingChildren,
    returnFiber,
    newIdx,
    newChild,
    lanes
  ) {
    if (
      ("string" === typeof newChild && "" !== newChild) ||
      "number" === typeof newChild
    )
      return (
        (existingChildren = existingChildren.get(newIdx) || null),
        updateTextNode(returnFiber, existingChildren, "" + newChild, lanes)
      );
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return (
            (existingChildren =
              existingChildren.get(
                null === newChild.key ? newIdx : newChild.key
              ) || null),
            updateElement(returnFiber, existingChildren, newChild, lanes)
          );
        case REACT_PORTAL_TYPE:
          return (
            (existingChildren =
              existingChildren.get(
                null === newChild.key ? newIdx : newChild.key
              ) || null),
            updatePortal(returnFiber, existingChildren, newChild, lanes)
          );
        case REACT_LAZY_TYPE:
          var init = newChild._init;
          return updateFromMap(
            existingChildren,
            returnFiber,
            newIdx,
            init(newChild._payload),
            lanes
          );
      }
      if (isArrayImpl(newChild) || getIteratorFn(newChild))
        return (
          (existingChildren = existingChildren.get(newIdx) || null),
          updateFragment(returnFiber, existingChildren, newChild, lanes, null)
        );
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    return null;
  }
  function reconcileChildrenArray(
    returnFiber,
    currentFirstChild,
    newChildren,
    lanes
  ) {
    for (
      var resultingFirstChild = null,
        previousNewFiber = null,
        oldFiber = currentFirstChild,
        newIdx = (currentFirstChild = 0),
        nextOldFiber = null;
      null !== oldFiber && newIdx < newChildren.length;
      newIdx++
    ) {
      oldFiber.index > newIdx
        ? ((nextOldFiber = oldFiber), (oldFiber = null))
        : (nextOldFiber = oldFiber.sibling);
      var newFiber = updateSlot(
        returnFiber,
        oldFiber,
        newChildren[newIdx],
        lanes
      );
      if (null === newFiber) {
        null === oldFiber && (oldFiber = nextOldFiber);
        break;
      }
      shouldTrackSideEffects &&
        oldFiber &&
        null === newFiber.alternate &&
        deleteChild(returnFiber, oldFiber);
      currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
      null === previousNewFiber
        ? (resultingFirstChild = newFiber)
        : (previousNewFiber.sibling = newFiber);
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }
    if (newIdx === newChildren.length)
      return (
        deleteRemainingChildren(returnFiber, oldFiber),
        isHydrating && pushTreeFork(returnFiber, newIdx),
        resultingFirstChild
      );
    if (null === oldFiber) {
      for (; newIdx < newChildren.length; newIdx++)
        (oldFiber = createChild(returnFiber, newChildren[newIdx], lanes)),
          null !== oldFiber &&
            ((currentFirstChild = placeChild(
              oldFiber,
              currentFirstChild,
              newIdx
            )),
            null === previousNewFiber
              ? (resultingFirstChild = oldFiber)
              : (previousNewFiber.sibling = oldFiber),
            (previousNewFiber = oldFiber));
      isHydrating && pushTreeFork(returnFiber, newIdx);
      return resultingFirstChild;
    }
    for (
      oldFiber = mapRemainingChildren(returnFiber, oldFiber);
      newIdx < newChildren.length;
      newIdx++
    )
      (nextOldFiber = updateFromMap(
        oldFiber,
        returnFiber,
        newIdx,
        newChildren[newIdx],
        lanes
      )),
        null !== nextOldFiber &&
          (shouldTrackSideEffects &&
            null !== nextOldFiber.alternate &&
            oldFiber.delete(
              null === nextOldFiber.key ? newIdx : nextOldFiber.key
            ),
          (currentFirstChild = placeChild(
            nextOldFiber,
            currentFirstChild,
            newIdx
          )),
          null === previousNewFiber
            ? (resultingFirstChild = nextOldFiber)
            : (previousNewFiber.sibling = nextOldFiber),
          (previousNewFiber = nextOldFiber));
    shouldTrackSideEffects &&
      oldFiber.forEach(function (child) {
        return deleteChild(returnFiber, child);
      });
    isHydrating && pushTreeFork(returnFiber, newIdx);
    return resultingFirstChild;
  }
  function reconcileChildrenIterator(
    returnFiber,
    currentFirstChild,
    newChildrenIterable,
    lanes
  ) {
    var iteratorFn = getIteratorFn(newChildrenIterable);
    if ("function" !== typeof iteratorFn)
      throw Error(formatProdErrorMessage(150));
    newChildrenIterable = iteratorFn.call(newChildrenIterable);
    if (null == newChildrenIterable) throw Error(formatProdErrorMessage(151));
    for (
      var previousNewFiber = (iteratorFn = null),
        oldFiber = currentFirstChild,
        newIdx = (currentFirstChild = 0),
        nextOldFiber = null,
        step = newChildrenIterable.next();
      null !== oldFiber && !step.done;
      newIdx++, step = newChildrenIterable.next()
    ) {
      oldFiber.index > newIdx
        ? ((nextOldFiber = oldFiber), (oldFiber = null))
        : (nextOldFiber = oldFiber.sibling);
      var newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
      if (null === newFiber) {
        null === oldFiber && (oldFiber = nextOldFiber);
        break;
      }
      shouldTrackSideEffects &&
        oldFiber &&
        null === newFiber.alternate &&
        deleteChild(returnFiber, oldFiber);
      currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
      null === previousNewFiber
        ? (iteratorFn = newFiber)
        : (previousNewFiber.sibling = newFiber);
      previousNewFiber = newFiber;
      oldFiber = nextOldFiber;
    }
    if (step.done)
      return (
        deleteRemainingChildren(returnFiber, oldFiber),
        isHydrating && pushTreeFork(returnFiber, newIdx),
        iteratorFn
      );
    if (null === oldFiber) {
      for (; !step.done; newIdx++, step = newChildrenIterable.next())
        (step = createChild(returnFiber, step.value, lanes)),
          null !== step &&
            ((currentFirstChild = placeChild(step, currentFirstChild, newIdx)),
            null === previousNewFiber
              ? (iteratorFn = step)
              : (previousNewFiber.sibling = step),
            (previousNewFiber = step));
      isHydrating && pushTreeFork(returnFiber, newIdx);
      return iteratorFn;
    }
    for (
      oldFiber = mapRemainingChildren(returnFiber, oldFiber);
      !step.done;
      newIdx++, step = newChildrenIterable.next()
    )
      (step = updateFromMap(oldFiber, returnFiber, newIdx, step.value, lanes)),
        null !== step &&
          (shouldTrackSideEffects &&
            null !== step.alternate &&
            oldFiber.delete(null === step.key ? newIdx : step.key),
          (currentFirstChild = placeChild(step, currentFirstChild, newIdx)),
          null === previousNewFiber
            ? (iteratorFn = step)
            : (previousNewFiber.sibling = step),
          (previousNewFiber = step));
    shouldTrackSideEffects &&
      oldFiber.forEach(function (child) {
        return deleteChild(returnFiber, child);
      });
    isHydrating && pushTreeFork(returnFiber, newIdx);
    return iteratorFn;
  }
  function reconcileChildFibers(
    returnFiber,
    currentFirstChild,
    newChild,
    lanes
  ) {
    "object" === typeof newChild &&
      null !== newChild &&
      newChild.type === REACT_FRAGMENT_TYPE &&
      null === newChild.key &&
      (newChild = newChild.props.children);
    if ("object" === typeof newChild && null !== newChild) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          a: {
            for (
              var key = newChild.key, child = currentFirstChild;
              null !== child;

            ) {
              if (child.key === key) {
                key = newChild.type;
                if (key === REACT_FRAGMENT_TYPE) {
                  if (7 === child.tag) {
                    deleteRemainingChildren(returnFiber, child.sibling);
                    currentFirstChild = useFiber(
                      child,
                      newChild.props.children
                    );
                    currentFirstChild.return = returnFiber;
                    returnFiber = currentFirstChild;
                    break a;
                  }
                } else if (
                  child.elementType === key ||
                  ("object" === typeof key &&
                    null !== key &&
                    key.$$typeof === REACT_LAZY_TYPE &&
                    resolveLazy(key) === child.type)
                ) {
                  deleteRemainingChildren(returnFiber, child.sibling);
                  currentFirstChild = useFiber(child, newChild.props);
                  currentFirstChild.ref = coerceRef(
                    returnFiber,
                    child,
                    newChild
                  );
                  currentFirstChild.return = returnFiber;
                  returnFiber = currentFirstChild;
                  break a;
                }
                deleteRemainingChildren(returnFiber, child);
                break;
              } else deleteChild(returnFiber, child);
              child = child.sibling;
            }
            newChild.type === REACT_FRAGMENT_TYPE
              ? ((currentFirstChild = createFiberFromFragment(
                  newChild.props.children,
                  returnFiber.mode,
                  lanes,
                  newChild.key
                )),
                (currentFirstChild.return = returnFiber),
                (returnFiber = currentFirstChild))
              : ((lanes = createFiberFromTypeAndProps(
                  newChild.type,
                  newChild.key,
                  newChild.props,
                  null,
                  returnFiber.mode,
                  lanes
                )),
                (lanes.ref = coerceRef(
                  returnFiber,
                  currentFirstChild,
                  newChild
                )),
                (lanes.return = returnFiber),
                (returnFiber = lanes));
          }
          return placeSingleChild(returnFiber);
        case REACT_PORTAL_TYPE:
          a: {
            for (child = newChild.key; null !== currentFirstChild; ) {
              if (currentFirstChild.key === child)
                if (
                  4 === currentFirstChild.tag &&
                  currentFirstChild.stateNode.containerInfo ===
                    newChild.containerInfo &&
                  currentFirstChild.stateNode.implementation ===
                    newChild.implementation
                ) {
                  deleteRemainingChildren(
                    returnFiber,
                    currentFirstChild.sibling
                  );
                  currentFirstChild = useFiber(
                    currentFirstChild,
                    newChild.children || []
                  );
                  currentFirstChild.return = returnFiber;
                  returnFiber = currentFirstChild;
                  break a;
                } else {
                  deleteRemainingChildren(returnFiber, currentFirstChild);
                  break;
                }
              else deleteChild(returnFiber, currentFirstChild);
              currentFirstChild = currentFirstChild.sibling;
            }
            currentFirstChild = createFiberFromPortal(
              newChild,
              returnFiber.mode,
              lanes
            );
            currentFirstChild.return = returnFiber;
            returnFiber = currentFirstChild;
          }
          return placeSingleChild(returnFiber);
        case REACT_LAZY_TYPE:
          return (
            (child = newChild._init),
            reconcileChildFibers(
              returnFiber,
              currentFirstChild,
              child(newChild._payload),
              lanes
            )
          );
      }
      if (isArrayImpl(newChild))
        return reconcileChildrenArray(
          returnFiber,
          currentFirstChild,
          newChild,
          lanes
        );
      if (getIteratorFn(newChild))
        return reconcileChildrenIterator(
          returnFiber,
          currentFirstChild,
          newChild,
          lanes
        );
      throwOnInvalidObjectType(returnFiber, newChild);
    }
    return ("string" === typeof newChild && "" !== newChild) ||
      "number" === typeof newChild
      ? ((newChild = "" + newChild),
        null !== currentFirstChild && 6 === currentFirstChild.tag
          ? (deleteRemainingChildren(returnFiber, currentFirstChild.sibling),
            (currentFirstChild = useFiber(currentFirstChild, newChild)),
            (currentFirstChild.return = returnFiber),
            (returnFiber = currentFirstChild))
          : (deleteRemainingChildren(returnFiber, currentFirstChild),
            (currentFirstChild = createFiberFromText(
              newChild,
              returnFiber.mode,
              lanes
            )),
            (currentFirstChild.return = returnFiber),
            (returnFiber = currentFirstChild)),
        placeSingleChild(returnFiber))
      : deleteRemainingChildren(returnFiber, currentFirstChild);
  }
  return reconcileChildFibers;
}
var reconcileChildFibers = createChildReconciler(!0),
  mountChildFibers = createChildReconciler(!1),
  currentTreeHiddenStackCursor = createCursor(null),
  prevRenderLanesStackCursor = createCursor(0);
function pushHiddenContext(fiber, context) {
  fiber = renderLanes$1;
  push(prevRenderLanesStackCursor, fiber);
  push(currentTreeHiddenStackCursor, context);
  renderLanes$1 = fiber | context.baseLanes;
}
function reuseHiddenContextOnStack() {
  push(prevRenderLanesStackCursor, renderLanes$1);
  push(currentTreeHiddenStackCursor, currentTreeHiddenStackCursor.current);
}
function popHiddenContext() {
  renderLanes$1 = prevRenderLanesStackCursor.current;
  pop(currentTreeHiddenStackCursor);
  pop(prevRenderLanesStackCursor);
}
var suspenseHandlerStackCursor = createCursor(null),
  shellBoundary = null;
function pushPrimaryTreeSuspenseHandler(handler) {
  var current = handler.alternate;
  !0 !== handler.pendingProps.unstable_avoidThisFallback ||
  (null !== current && null === currentTreeHiddenStackCursor.current)
    ? (push(suspenseHandlerStackCursor, handler),
      null === shellBoundary &&
        (null === current || null !== currentTreeHiddenStackCursor.current
          ? (shellBoundary = handler)
          : null !== current.memoizedState && (shellBoundary = handler)))
    : null === shellBoundary
    ? push(suspenseHandlerStackCursor, handler)
    : push(suspenseHandlerStackCursor, suspenseHandlerStackCursor.current);
}
function pushOffscreenSuspenseHandler(fiber) {
  if (22 === fiber.tag) {
    if ((push(suspenseHandlerStackCursor, fiber), null === shellBoundary)) {
      var current = fiber.alternate;
      null !== current &&
        null !== current.memoizedState &&
        (shellBoundary = fiber);
    }
  } else reuseSuspenseHandlerOnStack();
}
function reuseSuspenseHandlerOnStack() {
  push(suspenseHandlerStackCursor, suspenseHandlerStackCursor.current);
}
function popSuspenseHandler(fiber) {
  pop(suspenseHandlerStackCursor);
  shellBoundary === fiber && (shellBoundary = null);
}
var suspenseStackCursor = createCursor(0);
function findFirstSuspended(row) {
  for (var node = row; null !== node; ) {
    if (13 === node.tag) {
      var state = node.memoizedState;
      if (
        null !== state &&
        ((state = state.dehydrated),
        null === state || "$?" === state.data || "$!" === state.data)
      )
        return node;
    } else if (19 === node.tag && void 0 !== node.memoizedProps.revealOrder) {
      if (0 !== (node.flags & 128)) return node;
    } else if (null !== node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === row) break;
    for (; null === node.sibling; ) {
      if (null === node.return || node.return === row) return null;
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
  return null;
}
var workInProgressSources = [];
function resetWorkInProgressVersions() {
  for (var i = 0; i < workInProgressSources.length; i++)
    workInProgressSources[i]._workInProgressVersionPrimary = null;
  workInProgressSources.length = 0;
}
var SuspenseException = Error(formatProdErrorMessage(460));
function isThenableResolved(thenable) {
  thenable = thenable.status;
  return "fulfilled" === thenable || "rejected" === thenable;
}
function noop$1() {}
function trackUsedThenable(thenableState, thenable, index) {
  index = thenableState[index];
  void 0 === index
    ? thenableState.push(thenable)
    : index !== thenable && (thenable.then(noop$1, noop$1), (thenable = index));
  switch (thenable.status) {
    case "fulfilled":
      return thenable.value;
    case "rejected":
      throw thenable.reason;
    default:
      "string" === typeof thenable.status
        ? thenable.then(noop$1, noop$1)
        : ((thenableState = thenable),
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
          ));
      switch (thenable.status) {
        case "fulfilled":
          return thenable.value;
        case "rejected":
          throw thenable.reason;
      }
      suspendedThenable = thenable;
      throw SuspenseException;
  }
}
var suspendedThenable = null,
  ReactCurrentDispatcher$1 = ReactSharedInternals.ReactCurrentDispatcher,
  ReactCurrentBatchConfig$1 = ReactSharedInternals.ReactCurrentBatchConfig,
  renderLanes = 0,
  currentlyRenderingFiber = null,
  currentHook = null,
  workInProgressHook = null,
  didScheduleRenderPhaseUpdate = !1,
  didScheduleRenderPhaseUpdateDuringThisPass = !1,
  shouldDoubleInvokeUserFnsInHooksDEV = !1,
  localIdCounter = 0,
  thenableIndexCounter = 0,
  thenableState = null,
  globalClientIdCounter = 0;
function throwInvalidHookError() {
  throw Error(formatProdErrorMessage(321));
}
function areHookInputsEqual(nextDeps, prevDeps) {
  if (null === prevDeps) return !1;
  for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++)
    if (!objectIs(nextDeps[i], prevDeps[i])) return !1;
  return !0;
}
function renderWithHooks(
  current,
  workInProgress,
  Component,
  props,
  secondArg,
  nextRenderLanes
) {
  renderLanes = nextRenderLanes;
  currentlyRenderingFiber = workInProgress;
  workInProgress.memoizedState = null;
  workInProgress.updateQueue = null;
  workInProgress.lanes = 0;
  ReactCurrentDispatcher$1.current =
    null === current || null === current.memoizedState
      ? HooksDispatcherOnMount
      : HooksDispatcherOnUpdate;
  shouldDoubleInvokeUserFnsInHooksDEV = !1;
  current = Component(props, secondArg);
  shouldDoubleInvokeUserFnsInHooksDEV = !1;
  didScheduleRenderPhaseUpdateDuringThisPass &&
    (current = renderWithHooksAgain(
      workInProgress,
      Component,
      props,
      secondArg
    ));
  finishRenderingHooks();
  return current;
}
function finishRenderingHooks() {
  ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
  var didRenderTooFewHooks = null !== currentHook && null !== currentHook.next;
  renderLanes = 0;
  workInProgressHook = currentHook = currentlyRenderingFiber = null;
  didScheduleRenderPhaseUpdate = !1;
  thenableIndexCounter = 0;
  thenableState = null;
  if (didRenderTooFewHooks) throw Error(formatProdErrorMessage(300));
}
function renderWithHooksAgain(workInProgress, Component, props, secondArg) {
  var numberOfReRenders = 0;
  do {
    didScheduleRenderPhaseUpdateDuringThisPass = !1;
    thenableIndexCounter = 0;
    if (25 <= numberOfReRenders) throw Error(formatProdErrorMessage(301));
    numberOfReRenders += 1;
    workInProgressHook = currentHook = null;
    workInProgress.updateQueue = null;
    ReactCurrentDispatcher$1.current = HooksDispatcherOnRerender;
    var children = Component(props, secondArg);
  } while (didScheduleRenderPhaseUpdateDuringThisPass);
  return children;
}
function checkDidRenderIdHook() {
  var didRenderIdHook = 0 !== localIdCounter;
  localIdCounter = 0;
  return didRenderIdHook;
}
function bailoutHooks(current, workInProgress, lanes) {
  workInProgress.updateQueue = current.updateQueue;
  workInProgress.flags &= -2053;
  current.lanes &= ~lanes;
}
function resetHooksOnUnwind() {
  if (didScheduleRenderPhaseUpdate) {
    for (var hook = currentlyRenderingFiber.memoizedState; null !== hook; ) {
      var queue = hook.queue;
      null !== queue && (queue.pending = null);
      hook = hook.next;
    }
    didScheduleRenderPhaseUpdate = !1;
  }
  renderLanes = 0;
  workInProgressHook = currentHook = currentlyRenderingFiber = null;
  didScheduleRenderPhaseUpdateDuringThisPass = !1;
  thenableIndexCounter = localIdCounter = 0;
  thenableState = null;
}
function mountWorkInProgressHook() {
  var hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null
  };
  null === workInProgressHook
    ? (currentlyRenderingFiber.memoizedState = workInProgressHook = hook)
    : (workInProgressHook = workInProgressHook.next = hook);
  return workInProgressHook;
}
function updateWorkInProgressHook() {
  if (null === currentHook) {
    var nextCurrentHook = currentlyRenderingFiber.alternate;
    nextCurrentHook =
      null !== nextCurrentHook ? nextCurrentHook.memoizedState : null;
  } else nextCurrentHook = currentHook.next;
  var nextWorkInProgressHook =
    null === workInProgressHook
      ? currentlyRenderingFiber.memoizedState
      : workInProgressHook.next;
  if (null !== nextWorkInProgressHook)
    (workInProgressHook = nextWorkInProgressHook),
      (currentHook = nextCurrentHook);
  else {
    if (null === nextCurrentHook)
      if (null === currentlyRenderingFiber.alternate)
        nextCurrentHook = {
          memoizedState: null,
          baseState: null,
          baseQueue: null,
          queue: null,
          next: null
        };
      else throw Error(formatProdErrorMessage(310));
    currentHook = nextCurrentHook;
    nextCurrentHook = {
      memoizedState: currentHook.memoizedState,
      baseState: currentHook.baseState,
      baseQueue: currentHook.baseQueue,
      queue: currentHook.queue,
      next: null
    };
    null === workInProgressHook
      ? (currentlyRenderingFiber.memoizedState = workInProgressHook =
          nextCurrentHook)
      : (workInProgressHook = workInProgressHook.next = nextCurrentHook);
  }
  return workInProgressHook;
}
var createFunctionComponentUpdateQueue;
createFunctionComponentUpdateQueue = function () {
  return { lastEffect: null, events: null, stores: null };
};
function use(usable) {
  if (null !== usable && "object" === typeof usable) {
    if ("function" === typeof usable.then) {
      var index$86 = thenableIndexCounter;
      thenableIndexCounter += 1;
      null === thenableState && (thenableState = []);
      return trackUsedThenable(thenableState, usable, index$86);
    }
    if (
      usable.$$typeof === REACT_CONTEXT_TYPE ||
      usable.$$typeof === REACT_SERVER_CONTEXT_TYPE
    )
      return readContext(usable);
  }
  throw Error(formatProdErrorMessage(438, String(usable)));
}
function basicStateReducer(state, action) {
  return "function" === typeof action ? action(state) : action;
}
function updateReducer(reducer) {
  var hook = updateWorkInProgressHook(),
    queue = hook.queue;
  if (null === queue) throw Error(formatProdErrorMessage(311));
  queue.lastRenderedReducer = reducer;
  var current = currentHook,
    baseQueue = current.baseQueue,
    pendingQueue = queue.pending;
  if (null !== pendingQueue) {
    if (null !== baseQueue) {
      var baseFirst = baseQueue.next;
      baseQueue.next = pendingQueue.next;
      pendingQueue.next = baseFirst;
    }
    current.baseQueue = baseQueue = pendingQueue;
    queue.pending = null;
  }
  if (null !== baseQueue) {
    pendingQueue = baseQueue.next;
    current = current.baseState;
    var newBaseQueueFirst = (baseFirst = null),
      newBaseQueueLast = null,
      update = pendingQueue;
    do {
      var updateLane = update.lane & -1073741825;
      if (
        updateLane !== update.lane
          ? (workInProgressRootRenderLanes & updateLane) === updateLane
          : (renderLanes & updateLane) === updateLane
      )
        null !== newBaseQueueLast &&
          (newBaseQueueLast = newBaseQueueLast.next =
            {
              lane: 0,
              action: update.action,
              hasEagerState: update.hasEagerState,
              eagerState: update.eagerState,
              next: null
            }),
          (updateLane = update.action),
          shouldDoubleInvokeUserFnsInHooksDEV && reducer(current, updateLane),
          (current = update.hasEagerState
            ? update.eagerState
            : reducer(current, updateLane));
      else {
        var clone = {
          lane: updateLane,
          action: update.action,
          hasEagerState: update.hasEagerState,
          eagerState: update.eagerState,
          next: null
        };
        null === newBaseQueueLast
          ? ((newBaseQueueFirst = newBaseQueueLast = clone),
            (baseFirst = current))
          : (newBaseQueueLast = newBaseQueueLast.next = clone);
        currentlyRenderingFiber.lanes |= updateLane;
        workInProgressRootSkippedLanes |= updateLane;
      }
      update = update.next;
    } while (null !== update && update !== pendingQueue);
    null === newBaseQueueLast
      ? (baseFirst = current)
      : (newBaseQueueLast.next = newBaseQueueFirst);
    objectIs(current, hook.memoizedState) || (didReceiveUpdate = !0);
    hook.memoizedState = current;
    hook.baseState = baseFirst;
    hook.baseQueue = newBaseQueueLast;
    queue.lastRenderedState = current;
  }
  null === baseQueue && (queue.lanes = 0);
  return [hook.memoizedState, queue.dispatch];
}
function rerenderReducer(reducer) {
  var hook = updateWorkInProgressHook(),
    queue = hook.queue;
  if (null === queue) throw Error(formatProdErrorMessage(311));
  queue.lastRenderedReducer = reducer;
  var dispatch = queue.dispatch,
    lastRenderPhaseUpdate = queue.pending,
    newState = hook.memoizedState;
  if (null !== lastRenderPhaseUpdate) {
    queue.pending = null;
    var update = (lastRenderPhaseUpdate = lastRenderPhaseUpdate.next);
    do (newState = reducer(newState, update.action)), (update = update.next);
    while (update !== lastRenderPhaseUpdate);
    objectIs(newState, hook.memoizedState) || (didReceiveUpdate = !0);
    hook.memoizedState = newState;
    null === hook.baseQueue && (hook.baseState = newState);
    queue.lastRenderedState = newState;
  }
  return [newState, dispatch];
}
function readFromUnsubscribedMutableSource(root, source, getSnapshot) {
  var getVersion = source._getVersion;
  getVersion = getVersion(source._source);
  var JSCompiler_inline_result = source._workInProgressVersionPrimary;
  if (null !== JSCompiler_inline_result)
    root = JSCompiler_inline_result === getVersion;
  else if (
    ((root = root.mutableReadLanes), (root = (renderLanes & root) === root))
  )
    (source._workInProgressVersionPrimary = getVersion),
      workInProgressSources.push(source);
  if (root) return getSnapshot(source._source);
  workInProgressSources.push(source);
  throw Error(formatProdErrorMessage(350));
}
function useMutableSource(hook, source, getSnapshot, subscribe) {
  var root = workInProgressRoot;
  if (null === root) throw Error(formatProdErrorMessage(349));
  var getVersion = source._getVersion,
    version = getVersion(source._source),
    dispatcher = ReactCurrentDispatcher$1.current,
    _dispatcher$useState = dispatcher.useState(function () {
      return readFromUnsubscribedMutableSource(root, source, getSnapshot);
    }),
    setSnapshot = _dispatcher$useState[1],
    snapshot = _dispatcher$useState[0];
  _dispatcher$useState = workInProgressHook;
  var memoizedState = hook.memoizedState,
    refs = memoizedState.refs,
    prevGetSnapshot = refs.getSnapshot,
    prevSource = memoizedState.source;
  memoizedState = memoizedState.subscribe;
  var fiber = currentlyRenderingFiber;
  hook.memoizedState = { refs: refs, source: source, subscribe: subscribe };
  dispatcher.useEffect(
    function () {
      refs.getSnapshot = getSnapshot;
      refs.setSnapshot = setSnapshot;
      var maybeNewVersion = getVersion(source._source);
      objectIs(version, maybeNewVersion) ||
        ((maybeNewVersion = getSnapshot(source._source)),
        objectIs(snapshot, maybeNewVersion) ||
          (setSnapshot(maybeNewVersion),
          (maybeNewVersion = requestUpdateLane(fiber)),
          (root.mutableReadLanes |= maybeNewVersion & root.pendingLanes)),
        markRootEntangled(root, root.mutableReadLanes));
    },
    [getSnapshot, source, subscribe]
  );
  dispatcher.useEffect(
    function () {
      return subscribe(source._source, function () {
        var latestGetSnapshot = refs.getSnapshot,
          latestSetSnapshot = refs.setSnapshot;
        try {
          latestSetSnapshot(latestGetSnapshot(source._source));
          var lane = requestUpdateLane(fiber);
          root.mutableReadLanes |= lane & root.pendingLanes;
        } catch (error) {
          latestSetSnapshot(function () {
            throw error;
          });
        }
      });
    },
    [source, subscribe]
  );
  (objectIs(prevGetSnapshot, getSnapshot) &&
    objectIs(prevSource, source) &&
    objectIs(memoizedState, subscribe)) ||
    ((hook = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: basicStateReducer,
      lastRenderedState: snapshot
    }),
    (hook.dispatch = setSnapshot =
      dispatchSetState.bind(null, currentlyRenderingFiber, hook)),
    (_dispatcher$useState.queue = hook),
    (_dispatcher$useState.baseQueue = null),
    (snapshot = readFromUnsubscribedMutableSource(root, source, getSnapshot)),
    (_dispatcher$useState.memoizedState = _dispatcher$useState.baseState =
      snapshot));
  return snapshot;
}
function updateMutableSource(source, getSnapshot, subscribe) {
  var hook = updateWorkInProgressHook();
  return useMutableSource(hook, source, getSnapshot, subscribe);
}
function updateSyncExternalStore(subscribe, getSnapshot) {
  var fiber = currentlyRenderingFiber,
    hook = updateWorkInProgressHook(),
    nextSnapshot = getSnapshot(),
    snapshotChanged = !objectIs(
      (currentHook || hook).memoizedState,
      nextSnapshot
    );
  snapshotChanged &&
    ((hook.memoizedState = nextSnapshot), (didReceiveUpdate = !0));
  hook = hook.queue;
  updateEffect(subscribeToStore.bind(null, fiber, hook, subscribe), [
    subscribe
  ]);
  if (
    hook.getSnapshot !== getSnapshot ||
    snapshotChanged ||
    (null !== workInProgressHook && workInProgressHook.memoizedState.tag & 1)
  ) {
    fiber.flags |= 2048;
    pushEffect(
      9,
      updateStoreInstance.bind(null, fiber, hook, nextSnapshot, getSnapshot),
      void 0,
      null
    );
    subscribe = workInProgressRoot;
    if (null === subscribe) throw Error(formatProdErrorMessage(349));
    includesBlockingLane(subscribe, renderLanes) ||
      pushStoreConsistencyCheck(fiber, getSnapshot, nextSnapshot);
  }
  return nextSnapshot;
}
function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
  fiber.flags |= 16384;
  fiber = { getSnapshot: getSnapshot, value: renderedSnapshot };
  getSnapshot = currentlyRenderingFiber.updateQueue;
  null === getSnapshot
    ? ((getSnapshot = createFunctionComponentUpdateQueue()),
      (currentlyRenderingFiber.updateQueue = getSnapshot),
      (getSnapshot.stores = [fiber]))
    : ((renderedSnapshot = getSnapshot.stores),
      null === renderedSnapshot
        ? (getSnapshot.stores = [fiber])
        : renderedSnapshot.push(fiber));
}
function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
  inst.value = nextSnapshot;
  inst.getSnapshot = getSnapshot;
  checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
}
function subscribeToStore(fiber, inst, subscribe) {
  return subscribe(function () {
    checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
  });
}
function checkIfSnapshotChanged(inst) {
  var latestGetSnapshot = inst.getSnapshot;
  inst = inst.value;
  try {
    var nextValue = latestGetSnapshot();
    return !objectIs(inst, nextValue);
  } catch (error) {
    return !0;
  }
}
function forceStoreRerender(fiber) {
  var root = enqueueConcurrentRenderForLane(fiber, 2);
  null !== root && scheduleUpdateOnFiber(root, fiber, 2, -1);
}
function mountState(initialState) {
  var hook = mountWorkInProgressHook();
  "function" === typeof initialState && (initialState = initialState());
  hook.memoizedState = hook.baseState = initialState;
  initialState = {
    pending: null,
    lanes: 0,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState
  };
  hook.queue = initialState;
  initialState = initialState.dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    initialState
  );
  return [hook.memoizedState, initialState];
}
function pushEffect(tag, create, destroy, deps) {
  tag = { tag: tag, create: create, destroy: destroy, deps: deps, next: null };
  create = currentlyRenderingFiber.updateQueue;
  null === create
    ? ((create = createFunctionComponentUpdateQueue()),
      (currentlyRenderingFiber.updateQueue = create),
      (create.lastEffect = tag.next = tag))
    : ((destroy = create.lastEffect),
      null === destroy
        ? (create.lastEffect = tag.next = tag)
        : ((deps = destroy.next),
          (destroy.next = tag),
          (tag.next = deps),
          (create.lastEffect = tag)));
  return tag;
}
function updateRef() {
  return updateWorkInProgressHook().memoizedState;
}
function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
  var hook = mountWorkInProgressHook();
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(
    1 | hookFlags,
    create,
    void 0,
    void 0 === deps ? null : deps
  );
}
function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
  var hook = updateWorkInProgressHook();
  deps = void 0 === deps ? null : deps;
  var destroy = void 0;
  if (null !== currentHook) {
    var prevEffect = currentHook.memoizedState;
    destroy = prevEffect.destroy;
    if (null !== deps && areHookInputsEqual(deps, prevEffect.deps)) {
      hook.memoizedState = pushEffect(hookFlags, create, destroy, deps);
      return;
    }
  }
  currentlyRenderingFiber.flags |= fiberFlags;
  hook.memoizedState = pushEffect(1 | hookFlags, create, destroy, deps);
}
function mountEffect(create, deps) {
  mountEffectImpl(8390656, 8, create, deps);
}
function updateEffect(create, deps) {
  updateEffectImpl(2048, 8, create, deps);
}
function updateInsertionEffect(create, deps) {
  return updateEffectImpl(4, 2, create, deps);
}
function updateLayoutEffect(create, deps) {
  return updateEffectImpl(4, 4, create, deps);
}
function imperativeHandleEffect(create, ref) {
  if ("function" === typeof ref)
    return (
      (create = create()),
      ref(create),
      function () {
        ref(null);
      }
    );
  if (null !== ref && void 0 !== ref)
    return (
      (create = create()),
      (ref.current = create),
      function () {
        ref.current = null;
      }
    );
}
function updateImperativeHandle(ref, create, deps) {
  deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
  updateEffectImpl(4, 4, imperativeHandleEffect.bind(null, create, ref), deps);
}
function mountDebugValue() {}
function updateCallback(callback, deps) {
  var hook = updateWorkInProgressHook();
  deps = void 0 === deps ? null : deps;
  var prevState = hook.memoizedState;
  if (
    null !== prevState &&
    null !== deps &&
    areHookInputsEqual(deps, prevState[1])
  )
    return prevState[0];
  hook.memoizedState = [callback, deps];
  return callback;
}
function updateMemo(nextCreate, deps) {
  var hook = updateWorkInProgressHook();
  deps = void 0 === deps ? null : deps;
  var prevState = hook.memoizedState;
  if (
    null !== prevState &&
    null !== deps &&
    areHookInputsEqual(deps, prevState[1])
  )
    return prevState[0];
  shouldDoubleInvokeUserFnsInHooksDEV && nextCreate();
  nextCreate = nextCreate();
  hook.memoizedState = [nextCreate, deps];
  return nextCreate;
}
function updateDeferredValueImpl(hook, prevValue, value) {
  if (0 === (renderLanes & 42))
    return (
      hook.baseState && ((hook.baseState = !1), (didReceiveUpdate = !0)),
      (hook.memoizedState = value)
    );
  objectIs(value, prevValue) ||
    ((value = claimNextTransitionLane()),
    (currentlyRenderingFiber.lanes |= value),
    (workInProgressRootSkippedLanes |= value),
    (hook.baseState = !0));
  return prevValue;
}
function startTransition(setPending, callback) {
  var previousPriority = currentUpdatePriority;
  currentUpdatePriority =
    0 !== previousPriority && 8 > previousPriority ? previousPriority : 8;
  setPending(!0);
  var prevTransition = ReactCurrentBatchConfig$1.transition;
  ReactCurrentBatchConfig$1.transition = {};
  try {
    setPending(!1), callback();
  } finally {
    (currentUpdatePriority = previousPriority),
      (ReactCurrentBatchConfig$1.transition = prevTransition);
  }
}
function updateId() {
  return updateWorkInProgressHook().memoizedState;
}
function updateRefresh() {
  return updateWorkInProgressHook().memoizedState;
}
function refreshCache(fiber, seedKey, seedValue) {
  for (var provider = fiber.return; null !== provider; ) {
    switch (provider.tag) {
      case 24:
      case 3:
        var lane = requestUpdateLane(provider),
          eventTime = requestEventTime();
        fiber = createUpdate(eventTime, lane);
        var root$91 = enqueueUpdate$1(provider, fiber, lane);
        null !== root$91 &&
          (scheduleUpdateOnFiber(root$91, provider, lane, eventTime),
          entangleTransitions(root$91, provider, lane));
        provider = createCache();
        null !== seedKey &&
          void 0 !== seedKey &&
          null !== root$91 &&
          provider.data.set(seedKey, seedValue);
        fiber.payload = { cache: provider };
        return;
    }
    provider = provider.return;
  }
}
function dispatchReducerAction(fiber, queue, action) {
  var lane = requestUpdateLane(fiber);
  action = {
    lane: lane,
    action: action,
    hasEagerState: !1,
    eagerState: null,
    next: null
  };
  if (isRenderPhaseUpdate(fiber)) enqueueRenderPhaseUpdate(queue, action);
  else if (
    (enqueueUpdate(fiber, queue, action, lane),
    (action = getRootForUpdatedFiber(fiber)),
    null !== action)
  ) {
    var eventTime = requestEventTime();
    scheduleUpdateOnFiber(action, fiber, lane, eventTime);
    entangleTransitionUpdate(action, queue, lane);
  }
}
function dispatchSetState(fiber, queue, action) {
  var lane = requestUpdateLane(fiber),
    update = {
      lane: lane,
      action: action,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
  if (isRenderPhaseUpdate(fiber)) enqueueRenderPhaseUpdate(queue, update);
  else {
    var alternate = fiber.alternate;
    if (
      0 === fiber.lanes &&
      (null === alternate || 0 === alternate.lanes) &&
      ((alternate = queue.lastRenderedReducer), null !== alternate)
    )
      try {
        var currentState = queue.lastRenderedState,
          eagerState = alternate(currentState, action);
        update.hasEagerState = !0;
        update.eagerState = eagerState;
        if (objectIs(eagerState, currentState)) {
          enqueueUpdate(fiber, queue, update, 0);
          null === workInProgressRoot && finishQueueingConcurrentUpdates();
          return;
        }
      } catch (error) {
      } finally {
      }
    enqueueUpdate(fiber, queue, update, lane);
    action = getRootForUpdatedFiber(fiber);
    null !== action &&
      ((update = requestEventTime()),
      scheduleUpdateOnFiber(action, fiber, lane, update),
      entangleTransitionUpdate(action, queue, lane));
  }
}
function isRenderPhaseUpdate(fiber) {
  var alternate = fiber.alternate;
  return (
    fiber === currentlyRenderingFiber ||
    (null !== alternate && alternate === currentlyRenderingFiber)
  );
}
function enqueueRenderPhaseUpdate(queue, update) {
  didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate =
    !0;
  var pending = queue.pending;
  null === pending
    ? (update.next = update)
    : ((update.next = pending.next), (pending.next = update));
  queue.pending = update;
}
function entangleTransitionUpdate(root, queue, lane) {
  if (0 !== (lane & 8388480)) {
    var queueLanes = queue.lanes;
    queueLanes &= root.pendingLanes;
    lane |= queueLanes;
    queue.lanes = lane;
    markRootEntangled(root, lane);
  }
}
var ContextOnlyDispatcher = {
  readContext: readContext,
  useCallback: throwInvalidHookError,
  useContext: throwInvalidHookError,
  useEffect: throwInvalidHookError,
  useImperativeHandle: throwInvalidHookError,
  useInsertionEffect: throwInvalidHookError,
  useLayoutEffect: throwInvalidHookError,
  useMemo: throwInvalidHookError,
  useReducer: throwInvalidHookError,
  useRef: throwInvalidHookError,
  useState: throwInvalidHookError,
  useDebugValue: throwInvalidHookError,
  useDeferredValue: throwInvalidHookError,
  useTransition: throwInvalidHookError,
  useMutableSource: throwInvalidHookError,
  useSyncExternalStore: throwInvalidHookError,
  useId: throwInvalidHookError
};
ContextOnlyDispatcher.useCacheRefresh = throwInvalidHookError;
ContextOnlyDispatcher.use = throwInvalidHookError;
var HooksDispatcherOnMount = {
  readContext: readContext,
  useCallback: function (callback, deps) {
    mountWorkInProgressHook().memoizedState = [
      callback,
      void 0 === deps ? null : deps
    ];
    return callback;
  },
  useContext: readContext,
  useEffect: mountEffect,
  useImperativeHandle: function (ref, create, deps) {
    deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
    mountEffectImpl(
      4194308,
      4,
      imperativeHandleEffect.bind(null, create, ref),
      deps
    );
  },
  useLayoutEffect: function (create, deps) {
    return mountEffectImpl(4194308, 4, create, deps);
  },
  useInsertionEffect: function (create, deps) {
    mountEffectImpl(4, 2, create, deps);
  },
  useMemo: function (nextCreate, deps) {
    var hook = mountWorkInProgressHook();
    deps = void 0 === deps ? null : deps;
    shouldDoubleInvokeUserFnsInHooksDEV && nextCreate();
    nextCreate = nextCreate();
    hook.memoizedState = [nextCreate, deps];
    return nextCreate;
  },
  useReducer: function (reducer, initialArg, init) {
    var hook = mountWorkInProgressHook();
    initialArg = void 0 !== init ? init(initialArg) : initialArg;
    hook.memoizedState = hook.baseState = initialArg;
    reducer = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: reducer,
      lastRenderedState: initialArg
    };
    hook.queue = reducer;
    reducer = reducer.dispatch = dispatchReducerAction.bind(
      null,
      currentlyRenderingFiber,
      reducer
    );
    return [hook.memoizedState, reducer];
  },
  useRef: function (initialValue) {
    var hook = mountWorkInProgressHook();
    initialValue = { current: initialValue };
    return (hook.memoizedState = initialValue);
  },
  useState: mountState,
  useDebugValue: mountDebugValue,
  useDeferredValue: function (value) {
    return (mountWorkInProgressHook().memoizedState = value);
  },
  useTransition: function () {
    var _mountState = mountState(!1),
      isPending = _mountState[0];
    _mountState = startTransition.bind(null, _mountState[1]);
    mountWorkInProgressHook().memoizedState = _mountState;
    return [isPending, _mountState];
  },
  useMutableSource: function (source, getSnapshot, subscribe) {
    var hook = mountWorkInProgressHook();
    hook.memoizedState = {
      refs: { getSnapshot: getSnapshot, setSnapshot: null },
      source: source,
      subscribe: subscribe
    };
    return useMutableSource(hook, source, getSnapshot, subscribe);
  },
  useSyncExternalStore: function (subscribe, getSnapshot, getServerSnapshot) {
    var fiber = currentlyRenderingFiber,
      hook = mountWorkInProgressHook();
    if (isHydrating) {
      if (void 0 === getServerSnapshot)
        throw Error(formatProdErrorMessage(407));
      getServerSnapshot = getServerSnapshot();
    } else {
      getServerSnapshot = getSnapshot();
      var root$88 = workInProgressRoot;
      if (null === root$88) throw Error(formatProdErrorMessage(349));
      includesBlockingLane(root$88, renderLanes) ||
        pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
    }
    hook.memoizedState = getServerSnapshot;
    root$88 = { value: getServerSnapshot, getSnapshot: getSnapshot };
    hook.queue = root$88;
    mountEffect(subscribeToStore.bind(null, fiber, root$88, subscribe), [
      subscribe
    ]);
    fiber.flags |= 2048;
    pushEffect(
      9,
      updateStoreInstance.bind(
        null,
        fiber,
        root$88,
        getServerSnapshot,
        getSnapshot
      ),
      void 0,
      null
    );
    return getServerSnapshot;
  },
  useId: function () {
    var hook = mountWorkInProgressHook(),
      identifierPrefix = workInProgressRoot.identifierPrefix;
    if (isHydrating) {
      var JSCompiler_inline_result = treeContextOverflow;
      var idWithLeadingBit = treeContextId;
      JSCompiler_inline_result =
        (
          idWithLeadingBit & ~(1 << (32 - clz32(idWithLeadingBit) - 1))
        ).toString(32) + JSCompiler_inline_result;
      identifierPrefix =
        ":" + identifierPrefix + "R" + JSCompiler_inline_result;
      JSCompiler_inline_result = localIdCounter++;
      0 < JSCompiler_inline_result &&
        (identifierPrefix += "H" + JSCompiler_inline_result.toString(32));
      identifierPrefix += ":";
    } else
      (JSCompiler_inline_result = globalClientIdCounter++),
        (identifierPrefix =
          ":" +
          identifierPrefix +
          "r" +
          JSCompiler_inline_result.toString(32) +
          ":");
    return (hook.memoizedState = identifierPrefix);
  },
  useCacheRefresh: function () {
    return (mountWorkInProgressHook().memoizedState = refreshCache.bind(
      null,
      currentlyRenderingFiber
    ));
  }
};
HooksDispatcherOnMount.use = use;
var HooksDispatcherOnUpdate = {
  readContext: readContext,
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useInsertionEffect: updateInsertionEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: updateReducer,
  useRef: updateRef,
  useState: function () {
    return updateReducer(basicStateReducer);
  },
  useDebugValue: mountDebugValue,
  useDeferredValue: function (value) {
    var hook = updateWorkInProgressHook();
    return updateDeferredValueImpl(hook, currentHook.memoizedState, value);
  },
  useTransition: function () {
    var isPending = updateReducer(basicStateReducer)[0],
      start = updateWorkInProgressHook().memoizedState;
    return [isPending, start];
  },
  useMutableSource: updateMutableSource,
  useSyncExternalStore: updateSyncExternalStore,
  useId: updateId
};
HooksDispatcherOnUpdate.useCacheRefresh = updateRefresh;
HooksDispatcherOnUpdate.use = use;
var HooksDispatcherOnRerender = {
  readContext: readContext,
  useCallback: updateCallback,
  useContext: readContext,
  useEffect: updateEffect,
  useImperativeHandle: updateImperativeHandle,
  useInsertionEffect: updateInsertionEffect,
  useLayoutEffect: updateLayoutEffect,
  useMemo: updateMemo,
  useReducer: rerenderReducer,
  useRef: updateRef,
  useState: function () {
    return rerenderReducer(basicStateReducer);
  },
  useDebugValue: mountDebugValue,
  useDeferredValue: function (value) {
    var hook = updateWorkInProgressHook();
    return null === currentHook
      ? (hook.memoizedState = value)
      : updateDeferredValueImpl(hook, currentHook.memoizedState, value);
  },
  useTransition: function () {
    var isPending = rerenderReducer(basicStateReducer)[0],
      start = updateWorkInProgressHook().memoizedState;
    return [isPending, start];
  },
  useMutableSource: updateMutableSource,
  useSyncExternalStore: updateSyncExternalStore,
  useId: updateId
};
HooksDispatcherOnRerender.useCacheRefresh = updateRefresh;
HooksDispatcherOnRerender.use = use;
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
function applyDerivedStateFromProps(
  workInProgress,
  ctor,
  getDerivedStateFromProps,
  nextProps
) {
  ctor = workInProgress.memoizedState;
  getDerivedStateFromProps = getDerivedStateFromProps(nextProps, ctor);
  getDerivedStateFromProps =
    null === getDerivedStateFromProps || void 0 === getDerivedStateFromProps
      ? ctor
      : assign({}, ctor, getDerivedStateFromProps);
  workInProgress.memoizedState = getDerivedStateFromProps;
  0 === workInProgress.lanes &&
    (workInProgress.updateQueue.baseState = getDerivedStateFromProps);
}
var classComponentUpdater = {
  isMounted: function (component) {
    return (component = component._reactInternals)
      ? getNearestMountedFiber(component) === component
      : !1;
  },
  enqueueSetState: function (inst, payload, callback) {
    inst = inst._reactInternals;
    var eventTime = requestEventTime(),
      lane = requestUpdateLane(inst),
      update = createUpdate(eventTime, lane);
    update.payload = payload;
    void 0 !== callback && null !== callback && (update.callback = callback);
    payload = enqueueUpdate$1(inst, update, lane);
    null !== payload &&
      (scheduleUpdateOnFiber(payload, inst, lane, eventTime),
      entangleTransitions(payload, inst, lane));
  },
  enqueueReplaceState: function (inst, payload, callback) {
    inst = inst._reactInternals;
    var eventTime = requestEventTime(),
      lane = requestUpdateLane(inst),
      update = createUpdate(eventTime, lane);
    update.tag = 1;
    update.payload = payload;
    void 0 !== callback && null !== callback && (update.callback = callback);
    payload = enqueueUpdate$1(inst, update, lane);
    null !== payload &&
      (scheduleUpdateOnFiber(payload, inst, lane, eventTime),
      entangleTransitions(payload, inst, lane));
  },
  enqueueForceUpdate: function (inst, callback) {
    inst = inst._reactInternals;
    var eventTime = requestEventTime(),
      lane = requestUpdateLane(inst),
      update = createUpdate(eventTime, lane);
    update.tag = 2;
    void 0 !== callback && null !== callback && (update.callback = callback);
    callback = enqueueUpdate$1(inst, update, lane);
    null !== callback &&
      (scheduleUpdateOnFiber(callback, inst, lane, eventTime),
      entangleTransitions(callback, inst, lane));
  }
};
function checkShouldComponentUpdate(
  workInProgress,
  ctor,
  oldProps,
  newProps,
  oldState,
  newState,
  nextContext
) {
  workInProgress = workInProgress.stateNode;
  return "function" === typeof workInProgress.shouldComponentUpdate
    ? workInProgress.shouldComponentUpdate(newProps, newState, nextContext)
    : ctor.prototype && ctor.prototype.isPureReactComponent
    ? !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState)
    : !0;
}
function constructClassInstance(workInProgress, ctor, props) {
  var context = emptyContextObject,
    contextType = ctor.contextType;
  "object" === typeof contextType &&
    null !== contextType &&
    (context = readContext(contextType));
  ctor = new ctor(props, context);
  workInProgress.memoizedState =
    null !== ctor.state && void 0 !== ctor.state ? ctor.state : null;
  ctor.updater = classComponentUpdater;
  workInProgress.stateNode = ctor;
  ctor._reactInternals = workInProgress;
  return ctor;
}
function callComponentWillReceiveProps(
  workInProgress,
  instance,
  newProps,
  nextContext
) {
  workInProgress = instance.state;
  "function" === typeof instance.componentWillReceiveProps &&
    instance.componentWillReceiveProps(newProps, nextContext);
  "function" === typeof instance.UNSAFE_componentWillReceiveProps &&
    instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
  instance.state !== workInProgress &&
    classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
}
function mountClassInstance(workInProgress, ctor, newProps, renderLanes) {
  var instance = workInProgress.stateNode;
  instance.props = newProps;
  instance.state = workInProgress.memoizedState;
  instance.refs = {};
  initializeUpdateQueue(workInProgress);
  var contextType = ctor.contextType;
  instance.context =
    "object" === typeof contextType && null !== contextType
      ? readContext(contextType)
      : emptyContextObject;
  instance.state = workInProgress.memoizedState;
  contextType = ctor.getDerivedStateFromProps;
  "function" === typeof contextType &&
    (applyDerivedStateFromProps(workInProgress, ctor, contextType, newProps),
    (instance.state = workInProgress.memoizedState));
  "function" === typeof ctor.getDerivedStateFromProps ||
    "function" === typeof instance.getSnapshotBeforeUpdate ||
    ("function" !== typeof instance.UNSAFE_componentWillMount &&
      "function" !== typeof instance.componentWillMount) ||
    ((ctor = instance.state),
    "function" === typeof instance.componentWillMount &&
      instance.componentWillMount(),
    "function" === typeof instance.UNSAFE_componentWillMount &&
      instance.UNSAFE_componentWillMount(),
    ctor !== instance.state &&
      classComponentUpdater.enqueueReplaceState(instance, instance.state, null),
    processUpdateQueue(workInProgress, newProps, instance, renderLanes),
    (instance.state = workInProgress.memoizedState));
  "function" === typeof instance.componentDidMount &&
    (workInProgress.flags |= 4194308);
}
function createCapturedValueAtFiber(value, source) {
  try {
    var info = "",
      node = source;
    do (info += describeFiber(node)), (node = node.return);
    while (node);
    var JSCompiler_inline_result = info;
  } catch (x) {
    JSCompiler_inline_result =
      "\nError generating stack: " + x.message + "\n" + x.stack;
  }
  return {
    value: value,
    source: source,
    stack: JSCompiler_inline_result,
    digest: null
  };
}
function createCapturedValue(value, digest, stack) {
  return {
    value: value,
    source: null,
    stack: null != stack ? stack : null,
    digest: null != digest ? digest : null
  };
}
var ReactFiberErrorDialogWWW = require("ReactFiberErrorDialog");
if ("function" !== typeof ReactFiberErrorDialogWWW.showErrorDialog)
  throw Error(formatProdErrorMessage(320));
function logCapturedError(boundary, errorInfo) {
  try {
    !1 !==
      ReactFiberErrorDialogWWW.showErrorDialog({
        componentStack: null !== errorInfo.stack ? errorInfo.stack : "",
        error: errorInfo.value,
        errorBoundary:
          null !== boundary && 1 === boundary.tag ? boundary.stateNode : null
      }) && console.error(errorInfo.value);
  } catch (e$96) {
    setTimeout(function () {
      throw e$96;
    });
  }
}
function createRootErrorUpdate(fiber, errorInfo, lane) {
  lane = createUpdate(-1, lane);
  lane.tag = 3;
  lane.payload = { element: null };
  var error = errorInfo.value;
  lane.callback = function () {
    hasUncaughtError || ((hasUncaughtError = !0), (firstUncaughtError = error));
    logCapturedError(fiber, errorInfo);
  };
  return lane;
}
function createClassErrorUpdate(fiber, errorInfo, lane) {
  lane = createUpdate(-1, lane);
  lane.tag = 3;
  var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
  if ("function" === typeof getDerivedStateFromError) {
    var error = errorInfo.value;
    lane.payload = function () {
      return getDerivedStateFromError(error);
    };
    lane.callback = function () {
      logCapturedError(fiber, errorInfo);
    };
  }
  var inst = fiber.stateNode;
  null !== inst &&
    "function" === typeof inst.componentDidCatch &&
    (lane.callback = function () {
      logCapturedError(fiber, errorInfo);
      "function" !== typeof getDerivedStateFromError &&
        (null === legacyErrorBoundariesThatAlreadyFailed
          ? (legacyErrorBoundariesThatAlreadyFailed = new Set([this]))
          : legacyErrorBoundariesThatAlreadyFailed.add(this));
      var stack = errorInfo.stack;
      this.componentDidCatch(errorInfo.value, {
        componentStack: null !== stack ? stack : ""
      });
    });
  return lane;
}
function markSuspenseBoundaryShouldCapture(
  suspenseBoundary,
  returnFiber,
  sourceFiber,
  root,
  rootRenderLanes
) {
  if (0 === (suspenseBoundary.mode & 1))
    return (
      suspenseBoundary === returnFiber
        ? (suspenseBoundary.flags |= 65536)
        : ((suspenseBoundary.flags |= 128),
          (sourceFiber.flags |= 131072),
          (sourceFiber.flags &= -52805),
          1 === sourceFiber.tag &&
            (null === sourceFiber.alternate
              ? (sourceFiber.tag = 17)
              : ((returnFiber = createUpdate(-1, 2)),
                (returnFiber.tag = 2),
                enqueueUpdate$1(sourceFiber, returnFiber, 2))),
          (sourceFiber.lanes |= 2)),
      suspenseBoundary
    );
  suspenseBoundary.flags |= 65536;
  suspenseBoundary.lanes = rootRenderLanes;
  return suspenseBoundary;
}
var ReactCurrentOwner$1 = ReactSharedInternals.ReactCurrentOwner,
  SelectiveHydrationException = Error(formatProdErrorMessage(461)),
  didReceiveUpdate = !1;
function reconcileChildren(current, workInProgress, nextChildren, renderLanes) {
  workInProgress.child =
    null === current
      ? mountChildFibers(workInProgress, null, nextChildren, renderLanes)
      : reconcileChildFibers(
          workInProgress,
          current.child,
          nextChildren,
          renderLanes
        );
}
function updateForwardRef(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  Component = Component.render;
  var ref = workInProgress.ref;
  prepareToReadContext(workInProgress, renderLanes);
  nextProps = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps,
    ref,
    renderLanes
  );
  Component = checkDidRenderIdHook();
  if (null !== current && !didReceiveUpdate)
    return (
      bailoutHooks(current, workInProgress, renderLanes),
      bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
    );
  isHydrating && Component && pushMaterializedTreeId(workInProgress);
  workInProgress.flags |= 1;
  reconcileChildren(current, workInProgress, nextProps, renderLanes);
  return workInProgress.child;
}
function updateMemoComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  if (null === current) {
    var type = Component.type;
    if (
      "function" === typeof type &&
      !shouldConstruct(type) &&
      void 0 === type.defaultProps &&
      null === Component.compare &&
      void 0 === Component.defaultProps
    )
      return (
        (workInProgress.tag = 15),
        (workInProgress.type = type),
        updateSimpleMemoComponent(
          current,
          workInProgress,
          type,
          nextProps,
          renderLanes
        )
      );
    current = createFiberFromTypeAndProps(
      Component.type,
      null,
      nextProps,
      workInProgress,
      workInProgress.mode,
      renderLanes
    );
    current.ref = workInProgress.ref;
    current.return = workInProgress;
    return (workInProgress.child = current);
  }
  type = current.child;
  if (0 === (current.lanes & renderLanes)) {
    var prevProps = type.memoizedProps;
    Component = Component.compare;
    Component = null !== Component ? Component : shallowEqual;
    if (Component(prevProps, nextProps) && current.ref === workInProgress.ref)
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  }
  workInProgress.flags |= 1;
  current = createWorkInProgress(type, nextProps);
  current.ref = workInProgress.ref;
  current.return = workInProgress;
  return (workInProgress.child = current);
}
function updateSimpleMemoComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  if (null !== current) {
    var prevProps = current.memoizedProps;
    if (
      shallowEqual(prevProps, nextProps) &&
      current.ref === workInProgress.ref
    )
      if (
        ((didReceiveUpdate = !1),
        (workInProgress.pendingProps = nextProps = prevProps),
        0 !== (current.lanes & renderLanes))
      )
        0 !== (current.flags & 131072) && (didReceiveUpdate = !0);
      else
        return (
          (workInProgress.lanes = current.lanes),
          bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
        );
  }
  return updateFunctionComponent(
    current,
    workInProgress,
    Component,
    nextProps,
    renderLanes
  );
}
function updateOffscreenComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps,
    nextChildren = nextProps.children,
    nextIsDetached = 0 !== (workInProgress.stateNode._pendingVisibility & 2),
    prevState = null !== current ? current.memoizedState : null;
  markRef(current, workInProgress);
  if ("hidden" === nextProps.mode || nextIsDetached) {
    if (0 !== (workInProgress.flags & 128)) {
      renderLanes =
        null !== prevState ? prevState.baseLanes | renderLanes : renderLanes;
      if (null !== current) {
        nextProps = workInProgress.child = current.child;
        for (nextChildren = 0; null !== nextProps; )
          (nextChildren =
            nextChildren | nextProps.lanes | nextProps.childLanes),
            (nextProps = nextProps.sibling);
        workInProgress.childLanes = nextChildren & ~renderLanes;
      } else (workInProgress.childLanes = 0), (workInProgress.child = null);
      return deferHiddenOffscreenComponent(
        current,
        workInProgress,
        renderLanes
      );
    }
    if (0 === (workInProgress.mode & 1))
      (workInProgress.memoizedState = { baseLanes: 0, cachePool: null }),
        null !== current && pushTransition(workInProgress, null),
        reuseHiddenContextOnStack(),
        pushOffscreenSuspenseHandler(workInProgress);
    else if (0 !== (renderLanes & 1073741824))
      (workInProgress.memoizedState = { baseLanes: 0, cachePool: null }),
        null !== current &&
          pushTransition(
            workInProgress,
            null !== prevState ? prevState.cachePool : null
          ),
        null !== prevState
          ? pushHiddenContext(workInProgress, prevState)
          : reuseHiddenContextOnStack(),
        pushOffscreenSuspenseHandler(workInProgress);
    else
      return (
        (workInProgress.lanes = workInProgress.childLanes = 1073741824),
        deferHiddenOffscreenComponent(
          current,
          workInProgress,
          null !== prevState ? prevState.baseLanes | renderLanes : renderLanes
        )
      );
  } else
    null !== prevState
      ? (pushTransition(workInProgress, prevState.cachePool),
        pushHiddenContext(workInProgress, prevState),
        reuseSuspenseHandlerOnStack(),
        (workInProgress.memoizedState = null))
      : (null !== current && pushTransition(workInProgress, null),
        reuseHiddenContextOnStack(),
        reuseSuspenseHandlerOnStack());
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
function deferHiddenOffscreenComponent(current, workInProgress, nextBaseLanes) {
  var JSCompiler_inline_result = peekCacheFromPool();
  JSCompiler_inline_result =
    null === JSCompiler_inline_result
      ? null
      : { parent: CacheContext._currentValue, pool: JSCompiler_inline_result };
  workInProgress.memoizedState = {
    baseLanes: nextBaseLanes,
    cachePool: JSCompiler_inline_result
  };
  null !== current && pushTransition(workInProgress, null);
  reuseHiddenContextOnStack();
  pushOffscreenSuspenseHandler(workInProgress);
  return null;
}
function markRef(current, workInProgress) {
  var ref = workInProgress.ref;
  if (
    (null === current && null !== ref) ||
    (null !== current && current.ref !== ref)
  )
    (workInProgress.flags |= 512), (workInProgress.flags |= 2097152);
}
function updateFunctionComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  prepareToReadContext(workInProgress, renderLanes);
  Component = renderWithHooks(
    current,
    workInProgress,
    Component,
    nextProps,
    void 0,
    renderLanes
  );
  nextProps = checkDidRenderIdHook();
  if (null !== current && !didReceiveUpdate)
    return (
      bailoutHooks(current, workInProgress, renderLanes),
      bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
    );
  isHydrating && nextProps && pushMaterializedTreeId(workInProgress);
  workInProgress.flags |= 1;
  reconcileChildren(current, workInProgress, Component, renderLanes);
  return workInProgress.child;
}
function replayFunctionComponent(
  current,
  workInProgress,
  nextProps,
  Component,
  renderLanes
) {
  prepareToReadContext(workInProgress, renderLanes);
  nextProps = renderWithHooksAgain(
    workInProgress,
    Component,
    nextProps,
    void 0
  );
  finishRenderingHooks();
  Component = checkDidRenderIdHook();
  if (null !== current && !didReceiveUpdate)
    return (
      bailoutHooks(current, workInProgress, renderLanes),
      bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes)
    );
  isHydrating && Component && pushMaterializedTreeId(workInProgress);
  workInProgress.flags |= 1;
  reconcileChildren(current, workInProgress, nextProps, renderLanes);
  return workInProgress.child;
}
function updateClassComponent(
  current,
  workInProgress,
  Component,
  nextProps,
  renderLanes
) {
  prepareToReadContext(workInProgress, renderLanes);
  if (null === workInProgress.stateNode)
    resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress),
      constructClassInstance(workInProgress, Component, nextProps),
      mountClassInstance(workInProgress, Component, nextProps, renderLanes),
      (nextProps = !0);
  else if (null === current) {
    var instance = workInProgress.stateNode,
      oldProps = workInProgress.memoizedProps;
    instance.props = oldProps;
    var oldContext = instance.context,
      contextType = Component.contextType,
      nextContext = emptyContextObject;
    "object" === typeof contextType &&
      null !== contextType &&
      (nextContext = readContext(contextType));
    var getDerivedStateFromProps = Component.getDerivedStateFromProps;
    (contextType =
      "function" === typeof getDerivedStateFromProps ||
      "function" === typeof instance.getSnapshotBeforeUpdate) ||
      ("function" !== typeof instance.UNSAFE_componentWillReceiveProps &&
        "function" !== typeof instance.componentWillReceiveProps) ||
      ((oldProps !== nextProps || oldContext !== nextContext) &&
        callComponentWillReceiveProps(
          workInProgress,
          instance,
          nextProps,
          nextContext
        ));
    hasForceUpdate = !1;
    var oldState = workInProgress.memoizedState;
    instance.state = oldState;
    processUpdateQueue(workInProgress, nextProps, instance, renderLanes);
    oldContext = workInProgress.memoizedState;
    oldProps !== nextProps || oldState !== oldContext || hasForceUpdate
      ? ("function" === typeof getDerivedStateFromProps &&
          (applyDerivedStateFromProps(
            workInProgress,
            Component,
            getDerivedStateFromProps,
            nextProps
          ),
          (oldContext = workInProgress.memoizedState)),
        (oldProps =
          hasForceUpdate ||
          checkShouldComponentUpdate(
            workInProgress,
            Component,
            oldProps,
            nextProps,
            oldState,
            oldContext,
            nextContext
          ))
          ? (contextType ||
              ("function" !== typeof instance.UNSAFE_componentWillMount &&
                "function" !== typeof instance.componentWillMount) ||
              ("function" === typeof instance.componentWillMount &&
                instance.componentWillMount(),
              "function" === typeof instance.UNSAFE_componentWillMount &&
                instance.UNSAFE_componentWillMount()),
            "function" === typeof instance.componentDidMount &&
              (workInProgress.flags |= 4194308))
          : ("function" === typeof instance.componentDidMount &&
              (workInProgress.flags |= 4194308),
            (workInProgress.memoizedProps = nextProps),
            (workInProgress.memoizedState = oldContext)),
        (instance.props = nextProps),
        (instance.state = oldContext),
        (instance.context = nextContext),
        (nextProps = oldProps))
      : ("function" === typeof instance.componentDidMount &&
          (workInProgress.flags |= 4194308),
        (nextProps = !1));
  } else {
    instance = workInProgress.stateNode;
    cloneUpdateQueue(current, workInProgress);
    nextContext = workInProgress.memoizedProps;
    contextType =
      workInProgress.type === workInProgress.elementType
        ? nextContext
        : resolveDefaultProps(workInProgress.type, nextContext);
    instance.props = contextType;
    getDerivedStateFromProps = workInProgress.pendingProps;
    var oldContext$jscomp$0 = instance.context;
    oldContext = Component.contextType;
    oldProps = emptyContextObject;
    "object" === typeof oldContext &&
      null !== oldContext &&
      (oldProps = readContext(oldContext));
    oldState = Component.getDerivedStateFromProps;
    (oldContext =
      "function" === typeof oldState ||
      "function" === typeof instance.getSnapshotBeforeUpdate) ||
      ("function" !== typeof instance.UNSAFE_componentWillReceiveProps &&
        "function" !== typeof instance.componentWillReceiveProps) ||
      ((nextContext !== getDerivedStateFromProps ||
        oldContext$jscomp$0 !== oldProps) &&
        callComponentWillReceiveProps(
          workInProgress,
          instance,
          nextProps,
          oldProps
        ));
    hasForceUpdate = !1;
    oldContext$jscomp$0 = workInProgress.memoizedState;
    instance.state = oldContext$jscomp$0;
    processUpdateQueue(workInProgress, nextProps, instance, renderLanes);
    var newState = workInProgress.memoizedState;
    nextContext !== getDerivedStateFromProps ||
    oldContext$jscomp$0 !== newState ||
    hasForceUpdate
      ? ("function" === typeof oldState &&
          (applyDerivedStateFromProps(
            workInProgress,
            Component,
            oldState,
            nextProps
          ),
          (newState = workInProgress.memoizedState)),
        (contextType =
          hasForceUpdate ||
          checkShouldComponentUpdate(
            workInProgress,
            Component,
            contextType,
            nextProps,
            oldContext$jscomp$0,
            newState,
            oldProps
          ) ||
          !1)
          ? (oldContext ||
              ("function" !== typeof instance.UNSAFE_componentWillUpdate &&
                "function" !== typeof instance.componentWillUpdate) ||
              ("function" === typeof instance.componentWillUpdate &&
                instance.componentWillUpdate(nextProps, newState, oldProps),
              "function" === typeof instance.UNSAFE_componentWillUpdate &&
                instance.UNSAFE_componentWillUpdate(
                  nextProps,
                  newState,
                  oldProps
                )),
            "function" === typeof instance.componentDidUpdate &&
              (workInProgress.flags |= 4),
            "function" === typeof instance.getSnapshotBeforeUpdate &&
              (workInProgress.flags |= 1024))
          : ("function" !== typeof instance.componentDidUpdate ||
              (nextContext === current.memoizedProps &&
                oldContext$jscomp$0 === current.memoizedState) ||
              (workInProgress.flags |= 4),
            "function" !== typeof instance.getSnapshotBeforeUpdate ||
              (nextContext === current.memoizedProps &&
                oldContext$jscomp$0 === current.memoizedState) ||
              (workInProgress.flags |= 1024),
            (workInProgress.memoizedProps = nextProps),
            (workInProgress.memoizedState = newState)),
        (instance.props = nextProps),
        (instance.state = newState),
        (instance.context = oldProps),
        (nextProps = contextType))
      : ("function" !== typeof instance.componentDidUpdate ||
          (nextContext === current.memoizedProps &&
            oldContext$jscomp$0 === current.memoizedState) ||
          (workInProgress.flags |= 4),
        "function" !== typeof instance.getSnapshotBeforeUpdate ||
          (nextContext === current.memoizedProps &&
            oldContext$jscomp$0 === current.memoizedState) ||
          (workInProgress.flags |= 1024),
        (nextProps = !1));
  }
  return finishClassComponent(
    current,
    workInProgress,
    Component,
    nextProps,
    !1,
    renderLanes
  );
}
function finishClassComponent(
  current,
  workInProgress,
  Component,
  shouldUpdate,
  hasContext,
  renderLanes
) {
  markRef(current, workInProgress);
  hasContext = 0 !== (workInProgress.flags & 128);
  if (!shouldUpdate && !hasContext)
    return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
  shouldUpdate = workInProgress.stateNode;
  ReactCurrentOwner$1.current = workInProgress;
  Component =
    hasContext && "function" !== typeof Component.getDerivedStateFromError
      ? null
      : shouldUpdate.render();
  workInProgress.flags |= 1;
  null !== current && hasContext
    ? ((workInProgress.child = reconcileChildFibers(
        workInProgress,
        current.child,
        null,
        renderLanes
      )),
      (workInProgress.child = reconcileChildFibers(
        workInProgress,
        null,
        Component,
        renderLanes
      )))
    : reconcileChildren(current, workInProgress, Component, renderLanes);
  workInProgress.memoizedState = shouldUpdate.state;
  return workInProgress.child;
}
function mountHostRootWithoutHydrating(
  current,
  workInProgress,
  nextChildren,
  renderLanes,
  recoverableError
) {
  resetHydrationState();
  queueHydrationError(recoverableError);
  workInProgress.flags |= 256;
  reconcileChildren(current, workInProgress, nextChildren, renderLanes);
  return workInProgress.child;
}
var SUSPENDED_MARKER = { dehydrated: null, treeContext: null, retryLane: 0 };
function mountSuspenseOffscreenState(renderLanes) {
  return { baseLanes: renderLanes, cachePool: getSuspendedCache() };
}
function updateSuspenseComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps,
    showFallback = !1,
    didSuspend = 0 !== (workInProgress.flags & 128),
    JSCompiler_temp;
  (JSCompiler_temp = didSuspend) ||
    (JSCompiler_temp =
      null !== current && null === current.memoizedState
        ? !1
        : 0 !== (suspenseStackCursor.current & 2));
  JSCompiler_temp && ((showFallback = !0), (workInProgress.flags &= -129));
  if (null === current) {
    if (isHydrating) {
      showFallback
        ? pushPrimaryTreeSuspenseHandler(workInProgress)
        : reuseSuspenseHandlerOnStack();
      tryToClaimNextHydratableInstance(workInProgress);
      current = workInProgress.memoizedState;
      if (
        null !== current &&
        ((current = current.dehydrated), null !== current)
      )
        return (
          0 === (workInProgress.mode & 1)
            ? (workInProgress.lanes = 2)
            : "$!" === current.data
            ? (workInProgress.lanes = 16)
            : (workInProgress.lanes = 1073741824),
          null
        );
      popSuspenseHandler(workInProgress);
    }
    current = nextProps.children;
    didSuspend = nextProps.fallback;
    if (showFallback)
      return (
        reuseSuspenseHandlerOnStack(),
        (current = mountSuspenseFallbackChildren(
          workInProgress,
          current,
          didSuspend,
          renderLanes
        )),
        (workInProgress.child.memoizedState =
          mountSuspenseOffscreenState(renderLanes)),
        (workInProgress.memoizedState = SUSPENDED_MARKER),
        current
      );
    if ("number" === typeof nextProps.unstable_expectedLoadTime)
      return (
        reuseSuspenseHandlerOnStack(),
        (current = mountSuspenseFallbackChildren(
          workInProgress,
          current,
          didSuspend,
          renderLanes
        )),
        (workInProgress.child.memoizedState =
          mountSuspenseOffscreenState(renderLanes)),
        (workInProgress.memoizedState = SUSPENDED_MARKER),
        (workInProgress.lanes = 8388608),
        current
      );
    pushPrimaryTreeSuspenseHandler(workInProgress);
    return mountSuspensePrimaryChildren(workInProgress, current);
  }
  JSCompiler_temp = current.memoizedState;
  if (null !== JSCompiler_temp) {
    var dehydrated$108 = JSCompiler_temp.dehydrated;
    if (null !== dehydrated$108)
      return updateDehydratedSuspenseComponent(
        current,
        workInProgress,
        didSuspend,
        nextProps,
        dehydrated$108,
        JSCompiler_temp,
        renderLanes
      );
  }
  if (showFallback) {
    reuseSuspenseHandlerOnStack();
    showFallback = nextProps.fallback;
    didSuspend = workInProgress.mode;
    JSCompiler_temp = current.child;
    dehydrated$108 = JSCompiler_temp.sibling;
    var primaryChildProps = { mode: "hidden", children: nextProps.children };
    0 === (didSuspend & 1) && workInProgress.child !== JSCompiler_temp
      ? ((nextProps = workInProgress.child),
        (nextProps.childLanes = 0),
        (nextProps.pendingProps = primaryChildProps),
        (workInProgress.deletions = null))
      : ((nextProps = createWorkInProgress(JSCompiler_temp, primaryChildProps)),
        (nextProps.subtreeFlags = JSCompiler_temp.subtreeFlags & 14680064));
    null !== dehydrated$108
      ? (showFallback = createWorkInProgress(dehydrated$108, showFallback))
      : ((showFallback = createFiberFromFragment(
          showFallback,
          didSuspend,
          renderLanes,
          null
        )),
        (showFallback.flags |= 2));
    showFallback.return = workInProgress;
    nextProps.return = workInProgress;
    nextProps.sibling = showFallback;
    workInProgress.child = nextProps;
    nextProps = showFallback;
    showFallback = workInProgress.child;
    didSuspend = current.child.memoizedState;
    null === didSuspend
      ? (didSuspend = mountSuspenseOffscreenState(renderLanes))
      : ((JSCompiler_temp = didSuspend.cachePool),
        null !== JSCompiler_temp
          ? ((dehydrated$108 = CacheContext._currentValue),
            (JSCompiler_temp =
              JSCompiler_temp.parent !== dehydrated$108
                ? { parent: dehydrated$108, pool: dehydrated$108 }
                : JSCompiler_temp))
          : (JSCompiler_temp = getSuspendedCache()),
        (didSuspend = {
          baseLanes: didSuspend.baseLanes | renderLanes,
          cachePool: JSCompiler_temp
        }));
    showFallback.memoizedState = didSuspend;
    showFallback.childLanes = current.childLanes & ~renderLanes;
    workInProgress.memoizedState = SUSPENDED_MARKER;
    return nextProps;
  }
  pushPrimaryTreeSuspenseHandler(workInProgress);
  showFallback = current.child;
  current = showFallback.sibling;
  nextProps = createWorkInProgress(showFallback, {
    mode: "visible",
    children: nextProps.children
  });
  0 === (workInProgress.mode & 1) && (nextProps.lanes = renderLanes);
  nextProps.return = workInProgress;
  nextProps.sibling = null;
  null !== current &&
    ((renderLanes = workInProgress.deletions),
    null === renderLanes
      ? ((workInProgress.deletions = [current]), (workInProgress.flags |= 16))
      : renderLanes.push(current));
  workInProgress.child = nextProps;
  workInProgress.memoizedState = null;
  return nextProps;
}
function mountSuspensePrimaryChildren(workInProgress, primaryChildren) {
  primaryChildren = createFiberFromOffscreen(
    { mode: "visible", children: primaryChildren },
    workInProgress.mode,
    0,
    null
  );
  primaryChildren.return = workInProgress;
  return (workInProgress.child = primaryChildren);
}
function mountSuspenseFallbackChildren(
  workInProgress,
  primaryChildren,
  fallbackChildren,
  renderLanes
) {
  var mode = workInProgress.mode,
    progressedPrimaryFragment = workInProgress.child;
  primaryChildren = { mode: "hidden", children: primaryChildren };
  0 === (mode & 1) && null !== progressedPrimaryFragment
    ? ((progressedPrimaryFragment.childLanes = 0),
      (progressedPrimaryFragment.pendingProps = primaryChildren))
    : (progressedPrimaryFragment = createFiberFromOffscreen(
        primaryChildren,
        mode,
        0,
        null
      ));
  fallbackChildren = createFiberFromFragment(
    fallbackChildren,
    mode,
    renderLanes,
    null
  );
  progressedPrimaryFragment.return = workInProgress;
  fallbackChildren.return = workInProgress;
  progressedPrimaryFragment.sibling = fallbackChildren;
  workInProgress.child = progressedPrimaryFragment;
  return fallbackChildren;
}
function retrySuspenseComponentWithoutHydrating(
  current,
  workInProgress,
  renderLanes,
  recoverableError
) {
  null !== recoverableError && queueHydrationError(recoverableError);
  reconcileChildFibers(workInProgress, current.child, null, renderLanes);
  current = mountSuspensePrimaryChildren(
    workInProgress,
    workInProgress.pendingProps.children
  );
  current.flags |= 2;
  workInProgress.memoizedState = null;
  return current;
}
function updateDehydratedSuspenseComponent(
  current,
  workInProgress,
  didSuspend,
  nextProps,
  suspenseInstance,
  suspenseState,
  renderLanes
) {
  if (didSuspend) {
    if (workInProgress.flags & 256)
      return (
        pushPrimaryTreeSuspenseHandler(workInProgress),
        (workInProgress.flags &= -257),
        (suspenseState = createCapturedValue(
          Error(formatProdErrorMessage(422))
        )),
        retrySuspenseComponentWithoutHydrating(
          current,
          workInProgress,
          renderLanes,
          suspenseState
        )
      );
    if (null !== workInProgress.memoizedState)
      return (
        reuseSuspenseHandlerOnStack(),
        (workInProgress.child = current.child),
        (workInProgress.flags |= 128),
        null
      );
    reuseSuspenseHandlerOnStack();
    suspenseState = nextProps.fallback;
    suspenseInstance = workInProgress.mode;
    nextProps = createFiberFromOffscreen(
      { mode: "visible", children: nextProps.children },
      suspenseInstance,
      0,
      null
    );
    suspenseState = createFiberFromFragment(
      suspenseState,
      suspenseInstance,
      renderLanes,
      null
    );
    suspenseState.flags |= 2;
    nextProps.return = workInProgress;
    suspenseState.return = workInProgress;
    nextProps.sibling = suspenseState;
    workInProgress.child = nextProps;
    0 !== (workInProgress.mode & 1) &&
      reconcileChildFibers(workInProgress, current.child, null, renderLanes);
    workInProgress.child.memoizedState =
      mountSuspenseOffscreenState(renderLanes);
    workInProgress.memoizedState = SUSPENDED_MARKER;
    return suspenseState;
  }
  pushPrimaryTreeSuspenseHandler(workInProgress);
  if (0 === (workInProgress.mode & 1))
    return retrySuspenseComponentWithoutHydrating(
      current,
      workInProgress,
      renderLanes,
      null
    );
  if ("$!" === suspenseInstance.data) {
    suspenseState =
      suspenseInstance.nextSibling && suspenseInstance.nextSibling.dataset;
    if (suspenseState) var digest = suspenseState.dgst;
    suspenseState = digest;
    nextProps = Error(formatProdErrorMessage(419));
    nextProps.digest = suspenseState;
    suspenseState = createCapturedValue(nextProps, suspenseState, void 0);
    return retrySuspenseComponentWithoutHydrating(
      current,
      workInProgress,
      renderLanes,
      suspenseState
    );
  }
  digest = 0 !== (renderLanes & current.childLanes);
  if (didReceiveUpdate || digest) {
    nextProps = workInProgressRoot;
    if (null !== nextProps) {
      suspenseInstance = renderLanes & -renderLanes;
      if (0 !== (suspenseInstance & 42)) suspenseInstance = 1;
      else
        switch (suspenseInstance) {
          case 2:
            suspenseInstance = 1;
            break;
          case 8:
            suspenseInstance = 4;
            break;
          case 32:
            suspenseInstance = 16;
            break;
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            suspenseInstance = 64;
            break;
          case 536870912:
            suspenseInstance = 268435456;
            break;
          default:
            suspenseInstance = 0;
        }
      suspenseInstance =
        0 !== (suspenseInstance & (nextProps.suspendedLanes | renderLanes))
          ? 0
          : suspenseInstance;
      if (
        0 !== suspenseInstance &&
        suspenseInstance !== suspenseState.retryLane
      )
        throw (
          ((suspenseState.retryLane = suspenseInstance),
          enqueueConcurrentRenderForLane(current, suspenseInstance),
          scheduleUpdateOnFiber(nextProps, current, suspenseInstance, -1),
          SelectiveHydrationException)
        );
    }
    renderDidSuspendDelayIfPossible();
    return retrySuspenseComponentWithoutHydrating(
      current,
      workInProgress,
      renderLanes,
      null
    );
  }
  if ("$?" === suspenseInstance.data)
    return (
      (workInProgress.flags |= 128),
      (workInProgress.child = current.child),
      (workInProgress = retryDehydratedSuspenseBoundary.bind(null, current)),
      (suspenseInstance._reactRetry = workInProgress),
      null
    );
  current = suspenseState.treeContext;
  nextHydratableInstance = getNextHydratable(suspenseInstance.nextSibling);
  hydrationParentFiber = workInProgress;
  isHydrating = !0;
  hydrationErrors = null;
  null !== current &&
    ((idStack[idStackIndex++] = treeContextId),
    (idStack[idStackIndex++] = treeContextOverflow),
    (idStack[idStackIndex++] = treeContextProvider),
    (treeContextId = current.id),
    (treeContextOverflow = current.overflow),
    (treeContextProvider = workInProgress));
  workInProgress = mountSuspensePrimaryChildren(
    workInProgress,
    nextProps.children
  );
  workInProgress.flags |= 4096;
  return workInProgress;
}
function scheduleSuspenseWorkOnFiber(fiber, renderLanes, propagationRoot) {
  fiber.lanes |= renderLanes;
  var alternate = fiber.alternate;
  null !== alternate && (alternate.lanes |= renderLanes);
  scheduleContextWorkOnParentPath(fiber.return, renderLanes, propagationRoot);
}
function initSuspenseListRenderState(
  workInProgress,
  isBackwards,
  tail,
  lastContentRow,
  tailMode
) {
  var renderState = workInProgress.memoizedState;
  null === renderState
    ? (workInProgress.memoizedState = {
        isBackwards: isBackwards,
        rendering: null,
        renderingStartTime: 0,
        last: lastContentRow,
        tail: tail,
        tailMode: tailMode
      })
    : ((renderState.isBackwards = isBackwards),
      (renderState.rendering = null),
      (renderState.renderingStartTime = 0),
      (renderState.last = lastContentRow),
      (renderState.tail = tail),
      (renderState.tailMode = tailMode));
}
function updateSuspenseListComponent(current, workInProgress, renderLanes) {
  var nextProps = workInProgress.pendingProps,
    revealOrder = nextProps.revealOrder,
    tailMode = nextProps.tail;
  reconcileChildren(current, workInProgress, nextProps.children, renderLanes);
  nextProps = suspenseStackCursor.current;
  if (0 !== (nextProps & 2))
    (nextProps = (nextProps & 1) | 2), (workInProgress.flags |= 128);
  else {
    if (null !== current && 0 !== (current.flags & 128))
      a: for (current = workInProgress.child; null !== current; ) {
        if (13 === current.tag)
          null !== current.memoizedState &&
            scheduleSuspenseWorkOnFiber(current, renderLanes, workInProgress);
        else if (19 === current.tag)
          scheduleSuspenseWorkOnFiber(current, renderLanes, workInProgress);
        else if (null !== current.child) {
          current.child.return = current;
          current = current.child;
          continue;
        }
        if (current === workInProgress) break a;
        for (; null === current.sibling; ) {
          if (null === current.return || current.return === workInProgress)
            break a;
          current = current.return;
        }
        current.sibling.return = current.return;
        current = current.sibling;
      }
    nextProps &= 1;
  }
  push(suspenseStackCursor, nextProps);
  if (0 === (workInProgress.mode & 1)) workInProgress.memoizedState = null;
  else
    switch (revealOrder) {
      case "forwards":
        renderLanes = workInProgress.child;
        for (revealOrder = null; null !== renderLanes; )
          (current = renderLanes.alternate),
            null !== current &&
              null === findFirstSuspended(current) &&
              (revealOrder = renderLanes),
            (renderLanes = renderLanes.sibling);
        renderLanes = revealOrder;
        null === renderLanes
          ? ((revealOrder = workInProgress.child),
            (workInProgress.child = null))
          : ((revealOrder = renderLanes.sibling), (renderLanes.sibling = null));
        initSuspenseListRenderState(
          workInProgress,
          !1,
          revealOrder,
          renderLanes,
          tailMode
        );
        break;
      case "backwards":
        renderLanes = null;
        revealOrder = workInProgress.child;
        for (workInProgress.child = null; null !== revealOrder; ) {
          current = revealOrder.alternate;
          if (null !== current && null === findFirstSuspended(current)) {
            workInProgress.child = revealOrder;
            break;
          }
          current = revealOrder.sibling;
          revealOrder.sibling = renderLanes;
          renderLanes = revealOrder;
          revealOrder = current;
        }
        initSuspenseListRenderState(
          workInProgress,
          !0,
          renderLanes,
          null,
          tailMode
        );
        break;
      case "together":
        initSuspenseListRenderState(workInProgress, !1, null, null, void 0);
        break;
      default:
        workInProgress.memoizedState = null;
    }
  return workInProgress.child;
}
function resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress) {
  0 === (workInProgress.mode & 1) &&
    null !== current &&
    ((current.alternate = null),
    (workInProgress.alternate = null),
    (workInProgress.flags |= 2));
}
function bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes) {
  null !== current && (workInProgress.dependencies = current.dependencies);
  workInProgressRootSkippedLanes |= workInProgress.lanes;
  if (0 === (renderLanes & workInProgress.childLanes)) return null;
  if (null !== current && workInProgress.child !== current.child)
    throw Error(formatProdErrorMessage(153));
  if (null !== workInProgress.child) {
    current = workInProgress.child;
    renderLanes = createWorkInProgress(current, current.pendingProps);
    workInProgress.child = renderLanes;
    for (renderLanes.return = workInProgress; null !== current.sibling; )
      (current = current.sibling),
        (renderLanes = renderLanes.sibling =
          createWorkInProgress(current, current.pendingProps)),
        (renderLanes.return = workInProgress);
    renderLanes.sibling = null;
  }
  return workInProgress.child;
}
function attemptEarlyBailoutIfNoScheduledUpdate(
  current,
  workInProgress,
  renderLanes
) {
  switch (workInProgress.tag) {
    case 3:
      pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
      pushProvider(workInProgress, CacheContext, current.memoizedState.cache);
      resetHydrationState();
      break;
    case 26:
    case 27:
    case 5:
      pushHostContext(workInProgress);
      break;
    case 4:
      pushHostContainer(workInProgress, workInProgress.stateNode.containerInfo);
      break;
    case 10:
      pushProvider(
        workInProgress,
        workInProgress.type._context,
        workInProgress.memoizedProps.value
      );
      break;
    case 13:
      var state = workInProgress.memoizedState;
      if (null !== state) {
        if (null !== state.dehydrated)
          return (
            pushPrimaryTreeSuspenseHandler(workInProgress),
            (workInProgress.flags |= 128),
            null
          );
        if (0 !== (renderLanes & workInProgress.child.childLanes))
          return updateSuspenseComponent(current, workInProgress, renderLanes);
        pushPrimaryTreeSuspenseHandler(workInProgress);
        current = bailoutOnAlreadyFinishedWork(
          current,
          workInProgress,
          renderLanes
        );
        return null !== current ? current.sibling : null;
      }
      pushPrimaryTreeSuspenseHandler(workInProgress);
      break;
    case 19:
      state = 0 !== (renderLanes & workInProgress.childLanes);
      if (0 !== (current.flags & 128)) {
        if (state)
          return updateSuspenseListComponent(
            current,
            workInProgress,
            renderLanes
          );
        workInProgress.flags |= 128;
      }
      var renderState = workInProgress.memoizedState;
      null !== renderState &&
        ((renderState.rendering = null),
        (renderState.tail = null),
        (renderState.lastEffect = null));
      push(suspenseStackCursor, suspenseStackCursor.current);
      if (state) break;
      else return null;
    case 22:
    case 23:
      return (
        (workInProgress.lanes = 0),
        updateOffscreenComponent(current, workInProgress, renderLanes)
      );
    case 24:
      pushProvider(workInProgress, CacheContext, current.memoizedState.cache);
  }
  return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
}
var valueCursor = createCursor(null),
  currentlyRenderingFiber$1 = null,
  lastContextDependency = null,
  lastFullyObservedContext = null;
function resetContextDependencies() {
  lastFullyObservedContext =
    lastContextDependency =
    currentlyRenderingFiber$1 =
      null;
}
function pushProvider(providerFiber, context, nextValue) {
  push(valueCursor, context._currentValue);
  context._currentValue = nextValue;
}
function popProvider(context) {
  var currentValue = valueCursor.current;
  context._currentValue =
    currentValue === REACT_SERVER_CONTEXT_DEFAULT_VALUE_NOT_LOADED
      ? context._defaultValue
      : currentValue;
  pop(valueCursor);
}
function scheduleContextWorkOnParentPath(parent, renderLanes, propagationRoot) {
  for (; null !== parent; ) {
    var alternate = parent.alternate;
    (parent.childLanes & renderLanes) !== renderLanes
      ? ((parent.childLanes |= renderLanes),
        null !== alternate && (alternate.childLanes |= renderLanes))
      : null !== alternate &&
        (alternate.childLanes & renderLanes) !== renderLanes &&
        (alternate.childLanes |= renderLanes);
    if (parent === propagationRoot) break;
    parent = parent.return;
  }
}
function propagateContextChange(workInProgress, context, renderLanes) {
  var fiber = workInProgress.child;
  null !== fiber && (fiber.return = workInProgress);
  for (; null !== fiber; ) {
    var list = fiber.dependencies;
    if (null !== list) {
      var nextFiber = fiber.child;
      for (var dependency = list.firstContext; null !== dependency; ) {
        if (dependency.context === context) {
          if (1 === fiber.tag) {
            dependency = createUpdate(-1, renderLanes & -renderLanes);
            dependency.tag = 2;
            var updateQueue = fiber.updateQueue;
            if (null !== updateQueue) {
              updateQueue = updateQueue.shared;
              var pending = updateQueue.pending;
              null === pending
                ? (dependency.next = dependency)
                : ((dependency.next = pending.next),
                  (pending.next = dependency));
              updateQueue.pending = dependency;
            }
          }
          fiber.lanes |= renderLanes;
          dependency = fiber.alternate;
          null !== dependency && (dependency.lanes |= renderLanes);
          scheduleContextWorkOnParentPath(
            fiber.return,
            renderLanes,
            workInProgress
          );
          list.lanes |= renderLanes;
          break;
        }
        dependency = dependency.next;
      }
    } else if (10 === fiber.tag)
      nextFiber = fiber.type === workInProgress.type ? null : fiber.child;
    else if (18 === fiber.tag) {
      nextFiber = fiber.return;
      if (null === nextFiber) throw Error(formatProdErrorMessage(341));
      nextFiber.lanes |= renderLanes;
      list = nextFiber.alternate;
      null !== list && (list.lanes |= renderLanes);
      scheduleContextWorkOnParentPath(nextFiber, renderLanes, workInProgress);
      nextFiber = fiber.sibling;
    } else nextFiber = fiber.child;
    if (null !== nextFiber) nextFiber.return = fiber;
    else
      for (nextFiber = fiber; null !== nextFiber; ) {
        if (nextFiber === workInProgress) {
          nextFiber = null;
          break;
        }
        fiber = nextFiber.sibling;
        if (null !== fiber) {
          fiber.return = nextFiber.return;
          nextFiber = fiber;
          break;
        }
        nextFiber = nextFiber.return;
      }
    fiber = nextFiber;
  }
}
function prepareToReadContext(workInProgress, renderLanes) {
  currentlyRenderingFiber$1 = workInProgress;
  lastFullyObservedContext = lastContextDependency = null;
  workInProgress = workInProgress.dependencies;
  null !== workInProgress &&
    null !== workInProgress.firstContext &&
    (0 !== (workInProgress.lanes & renderLanes) && (didReceiveUpdate = !0),
    (workInProgress.firstContext = null));
}
function readContext(context) {
  var value = context._currentValue;
  if (lastFullyObservedContext !== context)
    if (
      ((context = { context: context, memoizedValue: value, next: null }),
      null === lastContextDependency)
    ) {
      if (null === currentlyRenderingFiber$1)
        throw Error(formatProdErrorMessage(308));
      lastContextDependency = context;
      currentlyRenderingFiber$1.dependencies = {
        lanes: 0,
        firstContext: context
      };
    } else lastContextDependency = lastContextDependency.next = context;
  return value;
}
var AbortControllerLocal =
    "undefined" !== typeof AbortController
      ? AbortController
      : function () {
          var listeners = [],
            signal = (this.signal = {
              aborted: !1,
              addEventListener: function (type, listener) {
                listeners.push(listener);
              }
            });
          this.abort = function () {
            signal.aborted = !0;
            listeners.forEach(function (listener) {
              return listener();
            });
          };
        },
  scheduleCallback$1 = Scheduler.unstable_scheduleCallback,
  NormalPriority$1 = Scheduler.unstable_NormalPriority,
  CacheContext = {
    $$typeof: REACT_CONTEXT_TYPE,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0,
    _defaultValue: null,
    _globalName: null
  };
function createCache() {
  return {
    controller: new AbortControllerLocal(),
    data: new Map(),
    refCount: 0
  };
}
function releaseCache(cache) {
  cache.refCount--;
  0 === cache.refCount &&
    scheduleCallback$1(NormalPriority$1, function () {
      cache.controller.abort();
    });
}
var ReactCurrentBatchConfig$2 = ReactSharedInternals.ReactCurrentBatchConfig,
  resumedCache = createCursor(null);
function peekCacheFromPool() {
  var cacheResumedFromPreviousRender = resumedCache.current;
  return null !== cacheResumedFromPreviousRender
    ? cacheResumedFromPreviousRender
    : workInProgressRoot.pooledCache;
}
function pushTransition(offscreenWorkInProgress, prevCachePool) {
  null === prevCachePool
    ? push(resumedCache, resumedCache.current)
    : push(resumedCache, prevCachePool.pool);
}
function getSuspendedCache() {
  var cacheFromPool = peekCacheFromPool();
  return null === cacheFromPool
    ? null
    : { parent: CacheContext._currentValue, pool: cacheFromPool };
}
var emptyObject = {};
function collectScopedNodesFromChildren(
  startingChild,
  fn$jscomp$0,
  scopedNodes$jscomp$0
) {
  for (; null !== startingChild; ) {
    var node = startingChild,
      fn = fn$jscomp$0,
      scopedNodes = scopedNodes$jscomp$0;
    if (5 === node.tag) {
      var type = node.type,
        memoizedProps = node.memoizedProps,
        instance = node.stateNode;
      null !== instance &&
        !0 === fn(type, memoizedProps || emptyObject, instance) &&
        scopedNodes.push(instance);
    }
    type = node.child;
    isFiberSuspenseAndTimedOut(node) && (type = node.child.sibling.child);
    null !== type && collectScopedNodesFromChildren(type, fn, scopedNodes);
    startingChild = startingChild.sibling;
  }
}
function collectFirstScopedNodeFromChildren(startingChild, fn$jscomp$0) {
  for (; null !== startingChild; ) {
    a: {
      var JSCompiler_inline_result = startingChild;
      var fn = fn$jscomp$0;
      if (5 === JSCompiler_inline_result.tag) {
        var type = JSCompiler_inline_result.type,
          memoizedProps = JSCompiler_inline_result.memoizedProps,
          instance = JSCompiler_inline_result.stateNode;
        if (null !== instance && !0 === fn(type, memoizedProps, instance)) {
          JSCompiler_inline_result = instance;
          break a;
        }
      }
      type = JSCompiler_inline_result.child;
      isFiberSuspenseAndTimedOut(JSCompiler_inline_result) &&
        (type = JSCompiler_inline_result.child.sibling.child);
      JSCompiler_inline_result =
        null !== type ? collectFirstScopedNodeFromChildren(type, fn) : null;
    }
    if (null !== JSCompiler_inline_result) return JSCompiler_inline_result;
    startingChild = startingChild.sibling;
  }
  return null;
}
function collectNearestChildContextValues(
  startingChild,
  context$jscomp$0,
  childContextValues$jscomp$0
) {
  for (; null !== startingChild; ) {
    var node = startingChild,
      context = context$jscomp$0,
      childContextValues = childContextValues$jscomp$0;
    if (10 === node.tag && node.type._context === context)
      childContextValues.push(node.memoizedProps.value);
    else {
      var child = node.child;
      isFiberSuspenseAndTimedOut(node) && (child = node.child.sibling.child);
      null !== child &&
        collectNearestChildContextValues(child, context, childContextValues);
    }
    startingChild = startingChild.sibling;
  }
}
function DO_NOT_USE_queryAllNodes(fn) {
  var currentFiber = getInstanceFromScope(this);
  if (null === currentFiber) return null;
  currentFiber = currentFiber.child;
  var scopedNodes = [];
  null !== currentFiber &&
    collectScopedNodesFromChildren(currentFiber, fn, scopedNodes);
  return 0 === scopedNodes.length ? null : scopedNodes;
}
function DO_NOT_USE_queryFirstNode(fn) {
  var currentFiber = getInstanceFromScope(this);
  if (null === currentFiber) return null;
  currentFiber = currentFiber.child;
  return null !== currentFiber
    ? collectFirstScopedNodeFromChildren(currentFiber, fn)
    : null;
}
function containsNode$1(node) {
  for (node = getClosestInstanceFromNode(node) || null; null !== node; ) {
    if (21 === node.tag && node.stateNode === this) return !0;
    node = node.return;
  }
  return !1;
}
function getChildContextValues(context) {
  var currentFiber = getInstanceFromScope(this);
  if (null === currentFiber) return [];
  currentFiber = currentFiber.child;
  var childContextValues = [];
  null !== currentFiber &&
    collectNearestChildContextValues(currentFiber, context, childContextValues);
  return childContextValues;
}
function markUpdate(workInProgress) {
  workInProgress.flags |= 4;
}
function markRef$1(workInProgress) {
  workInProgress.flags |= 2097664;
}
var appendAllChildren,
  updateHostContainer,
  updateHostComponent$1,
  updateHostText$1;
appendAllChildren = function (parent, workInProgress) {
  for (var node = workInProgress.child; null !== node; ) {
    if (5 === node.tag || 6 === node.tag) parent.appendChild(node.stateNode);
    else if (4 !== node.tag && 27 !== node.tag && null !== node.child) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    if (node === workInProgress) break;
    for (; null === node.sibling; ) {
      if (null === node.return || node.return === workInProgress) return;
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
};
updateHostContainer = function () {};
updateHostComponent$1 = function (current, workInProgress, type, newProps) {
  var oldProps = current.memoizedProps;
  if (oldProps !== newProps) {
    current = workInProgress.stateNode;
    var updatePayload = null;
    switch (type) {
      case "input":
        oldProps = getHostProps(current, oldProps);
        newProps = getHostProps(current, newProps);
        updatePayload = [];
        break;
      case "select":
        oldProps = assign({}, oldProps, { value: void 0 });
        newProps = assign({}, newProps, { value: void 0 });
        updatePayload = [];
        break;
      case "textarea":
        oldProps = getHostProps$2(current, oldProps);
        newProps = getHostProps$2(current, newProps);
        updatePayload = [];
        break;
      default:
        "function" !== typeof oldProps.onClick &&
          "function" === typeof newProps.onClick &&
          (current.onclick = noop);
    }
    assertValidProps(type, newProps);
    var styleName;
    type = null;
    for (JSCompiler_inline_result in oldProps)
      if (
        !newProps.hasOwnProperty(JSCompiler_inline_result) &&
        oldProps.hasOwnProperty(JSCompiler_inline_result) &&
        null != oldProps[JSCompiler_inline_result]
      )
        if ("style" === JSCompiler_inline_result) {
          var lastStyle = oldProps[JSCompiler_inline_result];
          for (styleName in lastStyle)
            lastStyle.hasOwnProperty(styleName) &&
              (type || (type = {}), (type[styleName] = ""));
        } else
          "dangerouslySetInnerHTML" !== JSCompiler_inline_result &&
            "children" !== JSCompiler_inline_result &&
            "suppressContentEditableWarning" !== JSCompiler_inline_result &&
            "suppressHydrationWarning" !== JSCompiler_inline_result &&
            "autoFocus" !== JSCompiler_inline_result &&
            (registrationNameDependencies.hasOwnProperty(
              JSCompiler_inline_result
            )
              ? updatePayload || (updatePayload = [])
              : (updatePayload = updatePayload || []).push(
                  JSCompiler_inline_result,
                  null
                ));
    for (JSCompiler_inline_result in newProps) {
      var nextProp = newProps[JSCompiler_inline_result];
      lastStyle =
        null != oldProps ? oldProps[JSCompiler_inline_result] : void 0;
      if (
        newProps.hasOwnProperty(JSCompiler_inline_result) &&
        nextProp !== lastStyle &&
        (null != nextProp || null != lastStyle)
      )
        if ("style" === JSCompiler_inline_result)
          if (lastStyle) {
            for (styleName in lastStyle)
              !lastStyle.hasOwnProperty(styleName) ||
                (nextProp && nextProp.hasOwnProperty(styleName)) ||
                (type || (type = {}), (type[styleName] = ""));
            for (styleName in nextProp)
              nextProp.hasOwnProperty(styleName) &&
                lastStyle[styleName] !== nextProp[styleName] &&
                (type || (type = {}), (type[styleName] = nextProp[styleName]));
          } else
            type ||
              (updatePayload || (updatePayload = []),
              updatePayload.push(JSCompiler_inline_result, type)),
              (type = nextProp);
        else
          "dangerouslySetInnerHTML" === JSCompiler_inline_result
            ? ((nextProp = nextProp ? nextProp.__html : void 0),
              (lastStyle = lastStyle ? lastStyle.__html : void 0),
              null != nextProp &&
                lastStyle !== nextProp &&
                (updatePayload = updatePayload || []).push(
                  JSCompiler_inline_result,
                  nextProp
                ))
            : "children" === JSCompiler_inline_result
            ? ("string" !== typeof nextProp && "number" !== typeof nextProp) ||
              (updatePayload = updatePayload || []).push(
                JSCompiler_inline_result,
                "" + nextProp
              )
            : "suppressContentEditableWarning" !== JSCompiler_inline_result &&
              "suppressHydrationWarning" !== JSCompiler_inline_result &&
              (registrationNameDependencies.hasOwnProperty(
                JSCompiler_inline_result
              )
                ? (null != nextProp &&
                    "onScroll" === JSCompiler_inline_result &&
                    listenToNonDelegatedEvent("scroll", current),
                  updatePayload ||
                    lastStyle === nextProp ||
                    (updatePayload = []))
                : (updatePayload = updatePayload || []).push(
                    JSCompiler_inline_result,
                    nextProp
                  ));
    }
    type && (updatePayload = updatePayload || []).push("style", type);
    var JSCompiler_inline_result = updatePayload;
    (workInProgress.updateQueue = JSCompiler_inline_result) &&
      markUpdate(workInProgress);
  }
};
updateHostText$1 = function (current, workInProgress, oldText, newText) {
  oldText !== newText && markUpdate(workInProgress);
};
function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
  if (!isHydrating)
    switch (renderState.tailMode) {
      case "hidden":
        hasRenderedATailFallback = renderState.tail;
        for (var lastTailNode = null; null !== hasRenderedATailFallback; )
          null !== hasRenderedATailFallback.alternate &&
            (lastTailNode = hasRenderedATailFallback),
            (hasRenderedATailFallback = hasRenderedATailFallback.sibling);
        null === lastTailNode
          ? (renderState.tail = null)
          : (lastTailNode.sibling = null);
        break;
      case "collapsed":
        lastTailNode = renderState.tail;
        for (var lastTailNode$134 = null; null !== lastTailNode; )
          null !== lastTailNode.alternate && (lastTailNode$134 = lastTailNode),
            (lastTailNode = lastTailNode.sibling);
        null === lastTailNode$134
          ? hasRenderedATailFallback || null === renderState.tail
            ? (renderState.tail = null)
            : (renderState.tail.sibling = null)
          : (lastTailNode$134.sibling = null);
    }
}
function bubbleProperties(completedWork) {
  var didBailout =
      null !== completedWork.alternate &&
      completedWork.alternate.child === completedWork.child,
    newChildLanes = 0,
    subtreeFlags = 0;
  if (didBailout)
    for (var child$135 = completedWork.child; null !== child$135; )
      (newChildLanes |= child$135.lanes | child$135.childLanes),
        (subtreeFlags |= child$135.subtreeFlags & 14680064),
        (subtreeFlags |= child$135.flags & 14680064),
        (child$135.return = completedWork),
        (child$135 = child$135.sibling);
  else
    for (child$135 = completedWork.child; null !== child$135; )
      (newChildLanes |= child$135.lanes | child$135.childLanes),
        (subtreeFlags |= child$135.subtreeFlags),
        (subtreeFlags |= child$135.flags),
        (child$135.return = completedWork),
        (child$135 = child$135.sibling);
  completedWork.subtreeFlags |= subtreeFlags;
  completedWork.childLanes = newChildLanes;
  return didBailout;
}
function completeWork(current, workInProgress, renderLanes) {
  var newProps = workInProgress.pendingProps;
  popTreeContext(workInProgress);
  switch (workInProgress.tag) {
    case 2:
    case 16:
    case 15:
    case 0:
    case 11:
    case 7:
    case 8:
    case 12:
    case 9:
    case 14:
      return bubbleProperties(workInProgress), null;
    case 1:
      return bubbleProperties(workInProgress), null;
    case 3:
      renderLanes = workInProgress.stateNode;
      newProps = null;
      null !== current && (newProps = current.memoizedState.cache);
      workInProgress.memoizedState.cache !== newProps &&
        (workInProgress.flags |= 2048);
      popProvider(CacheContext);
      popHostContainer();
      resetWorkInProgressVersions();
      renderLanes.pendingContext &&
        ((renderLanes.context = renderLanes.pendingContext),
        (renderLanes.pendingContext = null));
      if (null === current || null === current.child)
        popHydrationState(workInProgress)
          ? markUpdate(workInProgress)
          : null === current ||
            (current.memoizedState.isDehydrated &&
              0 === (workInProgress.flags & 256)) ||
            ((workInProgress.flags |= 1024),
            null !== hydrationErrors &&
              (queueRecoverableErrors(hydrationErrors),
              (hydrationErrors = null)));
      updateHostContainer(current, workInProgress);
      bubbleProperties(workInProgress);
      return null;
    case 26:
      return (
        popHostContext(workInProgress),
        (current ? current.ref : null) !== workInProgress.ref &&
          markRef$1(workInProgress),
        (null !== current &&
          current.memoizedState === workInProgress.memoizedState) ||
          markUpdate(workInProgress),
        bubbleProperties(workInProgress),
        null
      );
    case 27:
      popHostContext(workInProgress);
      renderLanes = rootInstanceStackCursor.current;
      var type = workInProgress.type;
      if (null !== current && null != workInProgress.stateNode)
        updateHostComponent$1(current, workInProgress, type, newProps),
          current.ref !== workInProgress.ref && markRef$1(workInProgress);
      else {
        if (!newProps) {
          if (null === workInProgress.stateNode)
            throw Error(formatProdErrorMessage(166));
          bubbleProperties(workInProgress);
          return null;
        }
        current = contextStackCursor.current;
        popHydrationState(workInProgress)
          ? prepareToHydrateHostInstance(workInProgress, current)
          : ((workInProgress.stateNode = resolveSingletonInstance(
              type,
              newProps,
              renderLanes
            )),
            markUpdate(workInProgress));
        null !== workInProgress.ref && markRef$1(workInProgress);
      }
      bubbleProperties(workInProgress);
      return null;
    case 5:
      popHostContext(workInProgress);
      renderLanes = workInProgress.type;
      if (null !== current && null != workInProgress.stateNode)
        updateHostComponent$1(current, workInProgress, renderLanes, newProps),
          current.ref !== workInProgress.ref && markRef$1(workInProgress);
      else {
        if (!newProps) {
          if (null === workInProgress.stateNode)
            throw Error(formatProdErrorMessage(166));
          bubbleProperties(workInProgress);
          return null;
        }
        current = contextStackCursor.current;
        if (popHydrationState(workInProgress))
          prepareToHydrateHostInstance(workInProgress, current) &&
            markUpdate(workInProgress);
        else {
          current = createElement(
            renderLanes,
            newProps,
            rootInstanceStackCursor.current,
            current
          );
          current[internalInstanceKey] = workInProgress;
          current[internalPropsKey] = newProps;
          appendAllChildren(current, workInProgress, !1, !1);
          workInProgress.stateNode = current;
          a: switch (
            (setInitialProperties(current, renderLanes, newProps), renderLanes)
          ) {
            case "button":
            case "input":
            case "select":
            case "textarea":
              current = !!newProps.autoFocus;
              break a;
            case "img":
              current = !0;
              break a;
            default:
              current = !1;
          }
          current && markUpdate(workInProgress);
        }
        null !== workInProgress.ref && markRef$1(workInProgress);
      }
      bubbleProperties(workInProgress);
      return null;
    case 6:
      if (current && null != workInProgress.stateNode)
        updateHostText$1(
          current,
          workInProgress,
          current.memoizedProps,
          newProps
        );
      else {
        if ("string" !== typeof newProps && null === workInProgress.stateNode)
          throw Error(formatProdErrorMessage(166));
        current = rootInstanceStackCursor.current;
        if (popHydrationState(workInProgress)) {
          current = workInProgress.stateNode;
          renderLanes = workInProgress.memoizedProps;
          current[internalInstanceKey] = workInProgress;
          if ((newProps = current.nodeValue !== renderLanes))
            if (((type = hydrationParentFiber), null !== type))
              switch (type.tag) {
                case 3:
                  checkForUnmatchedText(
                    current.nodeValue,
                    renderLanes,
                    0 !== (type.mode & 1)
                  );
                  break;
                case 27:
                case 5:
                  !0 !== type.memoizedProps.suppressHydrationWarning &&
                    checkForUnmatchedText(
                      current.nodeValue,
                      renderLanes,
                      0 !== (type.mode & 1)
                    );
              }
          newProps && markUpdate(workInProgress);
        } else
          (current = (
            9 === current.nodeType ? current : current.ownerDocument
          ).createTextNode(newProps)),
            (current[internalInstanceKey] = workInProgress),
            (workInProgress.stateNode = current);
      }
      bubbleProperties(workInProgress);
      return null;
    case 13:
      popSuspenseHandler(workInProgress);
      newProps = workInProgress.memoizedState;
      if (
        null === current ||
        (null !== current.memoizedState &&
          null !== current.memoizedState.dehydrated)
      ) {
        if (
          isHydrating &&
          null !== nextHydratableInstance &&
          0 !== (workInProgress.mode & 1) &&
          0 === (workInProgress.flags & 128)
        )
          warnIfUnhydratedTailNodes(),
            resetHydrationState(),
            (workInProgress.flags |= 98560),
            (type = !1);
        else if (
          ((type = popHydrationState(workInProgress)),
          null !== newProps && null !== newProps.dehydrated)
        ) {
          if (null === current) {
            if (!type) throw Error(formatProdErrorMessage(318));
            type = workInProgress.memoizedState;
            type = null !== type ? type.dehydrated : null;
            if (!type) throw Error(formatProdErrorMessage(317));
            type[internalInstanceKey] = workInProgress;
          } else
            resetHydrationState(),
              0 === (workInProgress.flags & 128) &&
                (workInProgress.memoizedState = null),
              (workInProgress.flags |= 4);
          bubbleProperties(workInProgress);
          type = !1;
        } else
          null !== hydrationErrors &&
            (queueRecoverableErrors(hydrationErrors), (hydrationErrors = null)),
            (type = !0);
        if (!type) return workInProgress.flags & 65536 ? workInProgress : null;
      }
      if (0 !== (workInProgress.flags & 128))
        return (workInProgress.lanes = renderLanes), workInProgress;
      renderLanes = null !== newProps;
      current = null !== current && null !== current.memoizedState;
      if (renderLanes) {
        newProps = workInProgress.child;
        type = null;
        null !== newProps.alternate &&
          null !== newProps.alternate.memoizedState &&
          null !== newProps.alternate.memoizedState.cachePool &&
          (type = newProps.alternate.memoizedState.cachePool.pool);
        var cache$145 = null;
        null !== newProps.memoizedState &&
          null !== newProps.memoizedState.cachePool &&
          (cache$145 = newProps.memoizedState.cachePool.pool);
        cache$145 !== type && (newProps.flags |= 2048);
      }
      renderLanes !== current &&
        renderLanes &&
        (workInProgress.child.flags |= 8192);
      null !== workInProgress.updateQueue && (workInProgress.flags |= 4);
      null !== workInProgress.updateQueue &&
        null != workInProgress.memoizedProps.suspenseCallback &&
        (workInProgress.flags |= 4);
      bubbleProperties(workInProgress);
      return null;
    case 4:
      return (
        popHostContainer(),
        updateHostContainer(current, workInProgress),
        null === current &&
          listenToAllSupportedEvents(workInProgress.stateNode.containerInfo),
        bubbleProperties(workInProgress),
        null
      );
    case 10:
      return (
        popProvider(workInProgress.type._context),
        bubbleProperties(workInProgress),
        null
      );
    case 17:
      return bubbleProperties(workInProgress), null;
    case 19:
      pop(suspenseStackCursor);
      type = workInProgress.memoizedState;
      if (null === type) return bubbleProperties(workInProgress), null;
      newProps = 0 !== (workInProgress.flags & 128);
      cache$145 = type.rendering;
      if (null === cache$145)
        if (newProps) cutOffTailIfNeeded(type, !1);
        else {
          if (
            0 !== workInProgressRootExitStatus ||
            (null !== current && 0 !== (current.flags & 128))
          )
            for (current = workInProgress.child; null !== current; ) {
              cache$145 = findFirstSuspended(current);
              if (null !== cache$145) {
                workInProgress.flags |= 128;
                cutOffTailIfNeeded(type, !1);
                current = cache$145.updateQueue;
                null !== current &&
                  ((workInProgress.updateQueue = current),
                  (workInProgress.flags |= 4));
                workInProgress.subtreeFlags = 0;
                current = renderLanes;
                for (renderLanes = workInProgress.child; null !== renderLanes; )
                  resetWorkInProgress(renderLanes, current),
                    (renderLanes = renderLanes.sibling);
                push(
                  suspenseStackCursor,
                  (suspenseStackCursor.current & 1) | 2
                );
                return workInProgress.child;
              }
              current = current.sibling;
            }
          null !== type.tail &&
            now() > workInProgressRootRenderTargetTime &&
            ((workInProgress.flags |= 128),
            (newProps = !0),
            cutOffTailIfNeeded(type, !1),
            (workInProgress.lanes = 8388608));
        }
      else {
        if (!newProps)
          if (((current = findFirstSuspended(cache$145)), null !== current)) {
            if (
              ((workInProgress.flags |= 128),
              (newProps = !0),
              (current = current.updateQueue),
              null !== current &&
                ((workInProgress.updateQueue = current),
                (workInProgress.flags |= 4)),
              cutOffTailIfNeeded(type, !0),
              null === type.tail &&
                "hidden" === type.tailMode &&
                !cache$145.alternate &&
                !isHydrating)
            )
              return bubbleProperties(workInProgress), null;
          } else
            2 * now() - type.renderingStartTime >
              workInProgressRootRenderTargetTime &&
              1073741824 !== renderLanes &&
              ((workInProgress.flags |= 128),
              (newProps = !0),
              cutOffTailIfNeeded(type, !1),
              (workInProgress.lanes = 8388608));
        type.isBackwards
          ? ((cache$145.sibling = workInProgress.child),
            (workInProgress.child = cache$145))
          : ((current = type.last),
            null !== current
              ? (current.sibling = cache$145)
              : (workInProgress.child = cache$145),
            (type.last = cache$145));
      }
      if (null !== type.tail)
        return (
          (workInProgress = type.tail),
          (type.rendering = workInProgress),
          (type.tail = workInProgress.sibling),
          (type.renderingStartTime = now()),
          (workInProgress.sibling = null),
          (current = suspenseStackCursor.current),
          push(suspenseStackCursor, newProps ? (current & 1) | 2 : current & 1),
          workInProgress
        );
      bubbleProperties(workInProgress);
      return null;
    case 21:
      return (
        null === current
          ? ((current = {
              DO_NOT_USE_queryAllNodes: DO_NOT_USE_queryAllNodes,
              DO_NOT_USE_queryFirstNode: DO_NOT_USE_queryFirstNode,
              containsNode: containsNode$1,
              getChildContextValues: getChildContextValues
            }),
            (workInProgress.stateNode = current),
            (current[internalInstanceKey] = workInProgress),
            null !== workInProgress.ref &&
              (markRef$1(workInProgress), markUpdate(workInProgress)))
          : (null !== workInProgress.ref && markUpdate(workInProgress),
            current.ref !== workInProgress.ref && markRef$1(workInProgress)),
        bubbleProperties(workInProgress),
        null
      );
    case 22:
    case 23:
      return (
        popSuspenseHandler(workInProgress),
        popHiddenContext(),
        (newProps = null !== workInProgress.memoizedState),
        null !== current
          ? (null !== current.memoizedState) !== newProps &&
            (workInProgress.flags |= 8192)
          : newProps && (workInProgress.flags |= 8192),
        newProps && 0 !== (workInProgress.mode & 1)
          ? 0 !== (renderLanes & 1073741824) &&
            0 === (workInProgress.flags & 128) &&
            (bubbleProperties(workInProgress),
            workInProgress.subtreeFlags & 6 && (workInProgress.flags |= 8192))
          : bubbleProperties(workInProgress),
        null !== workInProgress.updateQueue && (workInProgress.flags |= 4),
        (renderLanes = null),
        null !== current &&
          null !== current.memoizedState &&
          null !== current.memoizedState.cachePool &&
          (renderLanes = current.memoizedState.cachePool.pool),
        (newProps = null),
        null !== workInProgress.memoizedState &&
          null !== workInProgress.memoizedState.cachePool &&
          (newProps = workInProgress.memoizedState.cachePool.pool),
        newProps !== renderLanes && (workInProgress.flags |= 2048),
        null !== current && pop(resumedCache),
        null
      );
    case 24:
      return (
        (renderLanes = null),
        null !== current && (renderLanes = current.memoizedState.cache),
        workInProgress.memoizedState.cache !== renderLanes &&
          (workInProgress.flags |= 2048),
        popProvider(CacheContext),
        bubbleProperties(workInProgress),
        null
      );
    case 25:
      return null;
  }
  throw Error(formatProdErrorMessage(156, workInProgress.tag));
}
function unwindWork(current, workInProgress) {
  popTreeContext(workInProgress);
  switch (workInProgress.tag) {
    case 1:
      return (
        (current = workInProgress.flags),
        current & 65536
          ? ((workInProgress.flags = (current & -65537) | 128), workInProgress)
          : null
      );
    case 3:
      return (
        popProvider(CacheContext),
        popHostContainer(),
        resetWorkInProgressVersions(),
        (current = workInProgress.flags),
        0 !== (current & 65536) && 0 === (current & 128)
          ? ((workInProgress.flags = (current & -65537) | 128), workInProgress)
          : null
      );
    case 26:
    case 27:
    case 5:
      return popHostContext(workInProgress), null;
    case 13:
      popSuspenseHandler(workInProgress);
      current = workInProgress.memoizedState;
      if (null !== current && null !== current.dehydrated) {
        if (null === workInProgress.alternate)
          throw Error(formatProdErrorMessage(340));
        resetHydrationState();
      }
      current = workInProgress.flags;
      return current & 65536
        ? ((workInProgress.flags = (current & -65537) | 128), workInProgress)
        : null;
    case 19:
      return pop(suspenseStackCursor), null;
    case 4:
      return popHostContainer(), null;
    case 10:
      return popProvider(workInProgress.type._context), null;
    case 22:
    case 23:
      return (
        popSuspenseHandler(workInProgress),
        popHiddenContext(),
        null !== current && pop(resumedCache),
        (current = workInProgress.flags),
        current & 65536
          ? ((workInProgress.flags = (current & -65537) | 128), workInProgress)
          : null
      );
    case 24:
      return popProvider(CacheContext), null;
    case 25:
      return null;
    default:
      return null;
  }
}
function unwindInterruptedWork(current, interruptedWork) {
  popTreeContext(interruptedWork);
  switch (interruptedWork.tag) {
    case 3:
      popProvider(CacheContext);
      popHostContainer();
      resetWorkInProgressVersions();
      break;
    case 26:
    case 27:
    case 5:
      popHostContext(interruptedWork);
      break;
    case 4:
      popHostContainer();
      break;
    case 13:
      popSuspenseHandler(interruptedWork);
      break;
    case 19:
      pop(suspenseStackCursor);
      break;
    case 10:
      popProvider(interruptedWork.type._context);
      break;
    case 22:
    case 23:
      popSuspenseHandler(interruptedWork);
      popHiddenContext();
      null !== current && pop(resumedCache);
      break;
    case 24:
      popProvider(CacheContext);
  }
}
var offscreenSubtreeIsHidden = !1,
  offscreenSubtreeWasHidden = !1,
  PossiblyWeakSet = "function" === typeof WeakSet ? WeakSet : Set,
  nextEffect = null;
function safelyAttachRef(current, nearestMountedAncestor) {
  try {
    var ref = current.ref;
    if (null !== ref) {
      var instance = current.stateNode;
      switch (current.tag) {
        case 26:
        case 27:
        case 5:
          var instanceToUse = instance;
          break;
        default:
          instanceToUse = instance;
      }
      21 === current.tag && (instanceToUse = instance);
      "function" === typeof ref
        ? (current.refCleanup = ref(instanceToUse))
        : (ref.current = instanceToUse);
    }
  } catch (error) {
    captureCommitPhaseError(current, nearestMountedAncestor, error);
  }
}
function safelyDetachRef(current, nearestMountedAncestor) {
  var ref = current.ref,
    refCleanup = current.refCleanup;
  if (null !== ref)
    if ("function" === typeof refCleanup)
      try {
        refCleanup();
      } catch (error) {
        captureCommitPhaseError(current, nearestMountedAncestor, error);
      } finally {
        (current.refCleanup = null),
          (current = current.alternate),
          null != current && (current.refCleanup = null);
      }
    else if ("function" === typeof ref)
      try {
        ref(null);
      } catch (error$163) {
        captureCommitPhaseError(current, nearestMountedAncestor, error$163);
      }
    else ref.current = null;
}
function safelyCallDestroy(current, nearestMountedAncestor, destroy) {
  try {
    destroy();
  } catch (error) {
    captureCommitPhaseError(current, nearestMountedAncestor, error);
  }
}
var focusedInstanceHandle = null,
  shouldFireAfterActiveInstanceBlur = !1;
function commitBeforeMutationEffects(root, firstChild) {
  eventsEnabled = _enabled;
  root = getActiveElementDeep();
  if (hasSelectionCapabilities(root)) {
    if ("selectionStart" in root)
      var JSCompiler_temp = {
        start: root.selectionStart,
        end: root.selectionEnd
      };
    else
      a: {
        JSCompiler_temp =
          ((JSCompiler_temp = root.ownerDocument) &&
            JSCompiler_temp.defaultView) ||
          window;
        var selection =
          JSCompiler_temp.getSelection && JSCompiler_temp.getSelection();
        if (selection && 0 !== selection.rangeCount) {
          JSCompiler_temp = selection.anchorNode;
          var anchorOffset = selection.anchorOffset,
            focusNode = selection.focusNode;
          selection = selection.focusOffset;
          try {
            JSCompiler_temp.nodeType, focusNode.nodeType;
          } catch (e$22) {
            JSCompiler_temp = null;
            break a;
          }
          var length = 0,
            start = -1,
            end = -1,
            indexWithinAnchor = 0,
            indexWithinFocus = 0,
            node = root,
            parentNode = null;
          b: for (;;) {
            for (var next; ; ) {
              node !== JSCompiler_temp ||
                (0 !== anchorOffset && 3 !== node.nodeType) ||
                (start = length + anchorOffset);
              node !== focusNode ||
                (0 !== selection && 3 !== node.nodeType) ||
                (end = length + selection);
              3 === node.nodeType && (length += node.nodeValue.length);
              if (null === (next = node.firstChild)) break;
              parentNode = node;
              node = next;
            }
            for (;;) {
              if (node === root) break b;
              parentNode === JSCompiler_temp &&
                ++indexWithinAnchor === anchorOffset &&
                (start = length);
              parentNode === focusNode &&
                ++indexWithinFocus === selection &&
                (end = length);
              if (null !== (next = node.nextSibling)) break;
              node = parentNode;
              parentNode = node.parentNode;
            }
            node = next;
          }
          JSCompiler_temp =
            -1 === start || -1 === end ? null : { start: start, end: end };
        } else JSCompiler_temp = null;
      }
    JSCompiler_temp = JSCompiler_temp || { start: 0, end: 0 };
  } else JSCompiler_temp = null;
  selectionInformation = { focusedElem: root, selectionRange: JSCompiler_temp };
  root = null;
  JSCompiler_temp = selectionInformation.focusedElem;
  null !== JSCompiler_temp &&
    (root = getClosestInstanceFromNode(JSCompiler_temp));
  _enabled = !1;
  focusedInstanceHandle = root;
  for (nextEffect = firstChild; null !== nextEffect; ) {
    firstChild = nextEffect;
    root = firstChild.deletions;
    if (null !== root)
      for (
        JSCompiler_temp = 0;
        JSCompiler_temp < root.length;
        JSCompiler_temp++
      )
        (anchorOffset = root[JSCompiler_temp]),
          doesFiberContain(anchorOffset, focusedInstanceHandle) &&
            ((_enabled = shouldFireAfterActiveInstanceBlur = !0),
            dispatchBeforeDetachedBlur(
              selectionInformation.focusedElem,
              anchorOffset
            ),
            (_enabled = !1));
    root = firstChild.child;
    if (0 !== (firstChild.subtreeFlags & 9236) && null !== root)
      (root.return = firstChild), (nextEffect = root);
    else
      for (; null !== nextEffect; ) {
        firstChild = nextEffect;
        try {
          var current = firstChild.alternate,
            flags = firstChild.flags,
            JSCompiler_temp$jscomp$0;
          if (
            (JSCompiler_temp$jscomp$0 =
              !shouldFireAfterActiveInstanceBlur &&
              null !== focusedInstanceHandle)
          ) {
            var JSCompiler_temp$jscomp$1;
            if ((JSCompiler_temp$jscomp$1 = 13 === firstChild.tag))
              a: {
                if (null !== current) {
                  var oldState = current.memoizedState;
                  if (null === oldState || null !== oldState.dehydrated) {
                    var newState = firstChild.memoizedState;
                    JSCompiler_temp$jscomp$1 =
                      null !== newState && null === newState.dehydrated;
                    break a;
                  }
                }
                JSCompiler_temp$jscomp$1 = !1;
              }
            JSCompiler_temp$jscomp$0 =
              JSCompiler_temp$jscomp$1 &&
              doesFiberContain(firstChild, focusedInstanceHandle);
          }
          JSCompiler_temp$jscomp$0 &&
            ((shouldFireAfterActiveInstanceBlur = !0),
            (root = firstChild),
            (_enabled = !0),
            dispatchBeforeDetachedBlur(selectionInformation.focusedElem, root),
            (_enabled = !1));
          switch (firstChild.tag) {
            case 0:
              break;
            case 11:
            case 15:
              break;
            case 1:
              if (0 !== (flags & 1024) && null !== current) {
                var prevProps = current.memoizedProps,
                  prevState = current.memoizedState,
                  instance = firstChild.stateNode,
                  snapshot = instance.getSnapshotBeforeUpdate(
                    firstChild.elementType === firstChild.type
                      ? prevProps
                      : resolveDefaultProps(firstChild.type, prevProps),
                    prevState
                  );
                instance.__reactInternalSnapshotBeforeUpdate = snapshot;
              }
              break;
            case 3:
              if (0 !== (flags & 1024)) {
                var container = firstChild.stateNode.containerInfo,
                  nodeType = container.nodeType;
                if (9 === nodeType)
                  clearRootResources(container),
                    clearContainerSparingly(container);
                else if (1 === nodeType)
                  switch (container.nodeName) {
                    case "HEAD":
                      clearRootResources(container);
                    case "HTML":
                    case "BODY":
                      clearContainerSparingly(container);
                      break;
                    default:
                      container.textContent = "";
                  }
              }
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            default:
              if (0 !== (flags & 1024))
                throw Error(formatProdErrorMessage(163));
          }
        } catch (error) {
          captureCommitPhaseError(firstChild, firstChild.return, error);
        }
        root = firstChild.sibling;
        if (null !== root) {
          root.return = firstChild.return;
          nextEffect = root;
          break;
        }
        nextEffect = firstChild.return;
      }
  }
  current = shouldFireAfterActiveInstanceBlur;
  shouldFireAfterActiveInstanceBlur = !1;
  focusedInstanceHandle = null;
  return current;
}
function commitHookEffectListUnmount(
  flags,
  finishedWork,
  nearestMountedAncestor
) {
  var updateQueue = finishedWork.updateQueue;
  updateQueue = null !== updateQueue ? updateQueue.lastEffect : null;
  if (null !== updateQueue) {
    var effect = (updateQueue = updateQueue.next);
    do {
      if ((effect.tag & flags) === flags) {
        var destroy = effect.destroy;
        effect.destroy = void 0;
        void 0 !== destroy &&
          safelyCallDestroy(finishedWork, nearestMountedAncestor, destroy);
      }
      effect = effect.next;
    } while (effect !== updateQueue);
  }
}
function commitHookEffectListMount(flags, finishedWork) {
  finishedWork = finishedWork.updateQueue;
  finishedWork = null !== finishedWork ? finishedWork.lastEffect : null;
  if (null !== finishedWork) {
    var effect = (finishedWork = finishedWork.next);
    do {
      if ((effect.tag & flags) === flags) {
        var create = effect.create;
        effect.destroy = create();
      }
      effect = effect.next;
    } while (effect !== finishedWork);
  }
}
function commitHookLayoutEffects(finishedWork, hookFlags) {
  try {
    commitHookEffectListMount(hookFlags, finishedWork);
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}
function commitClassCallbacks(finishedWork) {
  var updateQueue = finishedWork.updateQueue;
  if (null !== updateQueue) {
    var instance = finishedWork.stateNode;
    try {
      commitCallbacks(updateQueue, instance);
    } catch (error) {
      captureCommitPhaseError(finishedWork, finishedWork.return, error);
    }
  }
}
function commitHostComponentMount(finishedWork) {
  var type = finishedWork.type,
    props = finishedWork.memoizedProps,
    instance = finishedWork.stateNode;
  try {
    a: switch (type) {
      case "button":
      case "input":
      case "select":
      case "textarea":
        props.autoFocus && instance.focus();
        break a;
      case "img":
        props.src && (instance.src = props.src);
    }
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}
function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
  var flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 15:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      flags & 4 && commitHookLayoutEffects(finishedWork, 5);
      break;
    case 1:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      if (flags & 4)
        if (((finishedRoot = finishedWork.stateNode), null === current))
          try {
            finishedRoot.componentDidMount();
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        else {
          var prevProps =
            finishedWork.elementType === finishedWork.type
              ? current.memoizedProps
              : resolveDefaultProps(finishedWork.type, current.memoizedProps);
          current = current.memoizedState;
          try {
            finishedRoot.componentDidUpdate(
              prevProps,
              current,
              finishedRoot.__reactInternalSnapshotBeforeUpdate
            );
          } catch (error$165) {
            captureCommitPhaseError(
              finishedWork,
              finishedWork.return,
              error$165
            );
          }
        }
      flags & 64 && commitClassCallbacks(finishedWork);
      flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
      break;
    case 3:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      if (flags & 64 && ((flags = finishedWork.updateQueue), null !== flags)) {
        finishedRoot = null;
        if (null !== finishedWork.child)
          switch (finishedWork.child.tag) {
            case 27:
            case 5:
              finishedRoot = finishedWork.child.stateNode;
              break;
            case 1:
              finishedRoot = finishedWork.child.stateNode;
          }
        try {
          commitCallbacks(flags, finishedRoot);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
      }
      break;
    case 26:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
      break;
    case 27:
    case 5:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      null === current && flags & 4 && commitHostComponentMount(finishedWork);
      flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
      break;
    case 12:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      break;
    case 13:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
      break;
    case 22:
      if (0 !== (finishedWork.mode & 1)) {
        if (
          ((prevProps =
            null !== finishedWork.memoizedState || offscreenSubtreeIsHidden),
          !prevProps)
        ) {
          current =
            (null !== current && null !== current.memoizedState) ||
            offscreenSubtreeWasHidden;
          var prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden,
            prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
          offscreenSubtreeIsHidden = prevProps;
          (offscreenSubtreeWasHidden = current) &&
          !prevOffscreenSubtreeWasHidden
            ? recursivelyTraverseReappearLayoutEffects(
                finishedRoot,
                finishedWork,
                0 !== (finishedWork.subtreeFlags & 8772)
              )
            : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
          offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
          offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
        }
      } else recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
      flags & 512 &&
        ("manual" === finishedWork.memoizedProps.mode
          ? safelyAttachRef(finishedWork, finishedWork.return)
          : safelyDetachRef(finishedWork, finishedWork.return));
      break;
    default:
      recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
  }
}
function detachFiberAfterEffects(fiber) {
  var alternate = fiber.alternate;
  null !== alternate &&
    ((fiber.alternate = null), detachFiberAfterEffects(alternate));
  fiber.child = null;
  fiber.deletions = null;
  fiber.sibling = null;
  5 === fiber.tag &&
    ((alternate = fiber.stateNode),
    null !== alternate && detachDeletedInstance(alternate));
  fiber.stateNode = null;
  fiber.return = null;
  fiber.dependencies = null;
  fiber.memoizedProps = null;
  fiber.memoizedState = null;
  fiber.pendingProps = null;
  fiber.stateNode = null;
  fiber.updateQueue = null;
}
function isHostParent(fiber) {
  return (
    5 === fiber.tag ||
    3 === fiber.tag ||
    26 === fiber.tag ||
    27 === fiber.tag ||
    4 === fiber.tag
  );
}
function getHostSibling(fiber) {
  a: for (;;) {
    for (; null === fiber.sibling; ) {
      if (null === fiber.return || isHostParent(fiber.return)) return null;
      fiber = fiber.return;
    }
    fiber.sibling.return = fiber.return;
    for (
      fiber = fiber.sibling;
      5 !== fiber.tag &&
      6 !== fiber.tag &&
      27 !== fiber.tag &&
      18 !== fiber.tag;

    ) {
      if (fiber.flags & 2) continue a;
      if (null === fiber.child || 4 === fiber.tag) continue a;
      else (fiber.child.return = fiber), (fiber = fiber.child);
    }
    if (!(fiber.flags & 2)) return fiber.stateNode;
  }
}
function insertOrAppendPlacementNodeIntoContainer(node, before, parent) {
  var tag = node.tag;
  if (5 === tag || 6 === tag)
    (node = node.stateNode),
      before
        ? 8 === parent.nodeType
          ? parent.parentNode.insertBefore(node, before)
          : parent.insertBefore(node, before)
        : (8 === parent.nodeType
            ? ((before = parent.parentNode), before.insertBefore(node, parent))
            : ((before = parent), before.appendChild(node)),
          (parent = parent._reactRootContainer),
          (null !== parent && void 0 !== parent) ||
            null !== before.onclick ||
            (before.onclick = noop));
  else if (4 !== tag && 27 !== tag && ((node = node.child), null !== node))
    for (
      insertOrAppendPlacementNodeIntoContainer(node, before, parent),
        node = node.sibling;
      null !== node;

    )
      insertOrAppendPlacementNodeIntoContainer(node, before, parent),
        (node = node.sibling);
}
function insertOrAppendPlacementNode(node, before, parent) {
  var tag = node.tag;
  if (5 === tag || 6 === tag)
    (node = node.stateNode),
      before ? parent.insertBefore(node, before) : parent.appendChild(node);
  else if (4 !== tag && 27 !== tag && ((node = node.child), null !== node))
    for (
      insertOrAppendPlacementNode(node, before, parent), node = node.sibling;
      null !== node;

    )
      insertOrAppendPlacementNode(node, before, parent), (node = node.sibling);
}
var hostParent = null,
  hostParentIsContainer = !1;
function recursivelyTraverseDeletionEffects(
  finishedRoot,
  nearestMountedAncestor,
  parent
) {
  for (parent = parent.child; null !== parent; )
    commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, parent),
      (parent = parent.sibling);
}
function commitDeletionEffectsOnFiber(
  finishedRoot,
  nearestMountedAncestor,
  deletedFiber
) {
  if (injectedHook && "function" === typeof injectedHook.onCommitFiberUnmount)
    try {
      injectedHook.onCommitFiberUnmount(rendererID, deletedFiber);
    } catch (err) {}
  switch (deletedFiber.tag) {
    case 26:
      offscreenSubtreeWasHidden ||
        safelyDetachRef(deletedFiber, nearestMountedAncestor);
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      deletedFiber.memoizedState && releaseResource(deletedFiber.memoizedState);
      break;
    case 27:
      offscreenSubtreeWasHidden ||
        safelyDetachRef(deletedFiber, nearestMountedAncestor);
      var prevHostParent = hostParent,
        prevHostParentIsContainer = hostParentIsContainer;
      hostParent = deletedFiber.stateNode;
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      deletedFiber = deletedFiber.stateNode;
      for (finishedRoot = deletedFiber.attributes; finishedRoot.length; )
        deletedFiber.removeAttributeNode(finishedRoot[0]);
      detachDeletedInstance(deletedFiber);
      hostParent = prevHostParent;
      hostParentIsContainer = prevHostParentIsContainer;
      break;
    case 5:
      offscreenSubtreeWasHidden ||
        safelyDetachRef(deletedFiber, nearestMountedAncestor);
    case 6:
      prevHostParent = hostParent;
      prevHostParentIsContainer = hostParentIsContainer;
      hostParent = null;
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      hostParent = prevHostParent;
      hostParentIsContainer = prevHostParentIsContainer;
      null !== hostParent &&
        (hostParentIsContainer
          ? ((finishedRoot = hostParent),
            (deletedFiber = deletedFiber.stateNode),
            8 === finishedRoot.nodeType
              ? finishedRoot.parentNode.removeChild(deletedFiber)
              : finishedRoot.removeChild(deletedFiber))
          : hostParent.removeChild(deletedFiber.stateNode));
      break;
    case 18:
      finishedRoot = finishedRoot.hydrationCallbacks;
      null !== finishedRoot &&
        (finishedRoot = finishedRoot.onDeleted) &&
        finishedRoot(deletedFiber.stateNode);
      null !== hostParent &&
        (hostParentIsContainer
          ? ((finishedRoot = hostParent),
            (deletedFiber = deletedFiber.stateNode),
            8 === finishedRoot.nodeType
              ? clearSuspenseBoundary(finishedRoot.parentNode, deletedFiber)
              : 1 === finishedRoot.nodeType &&
                clearSuspenseBoundary(finishedRoot, deletedFiber),
            retryIfBlockedOn(finishedRoot))
          : clearSuspenseBoundary(hostParent, deletedFiber.stateNode));
      break;
    case 4:
      prevHostParent = hostParent;
      prevHostParentIsContainer = hostParentIsContainer;
      hostParent = deletedFiber.stateNode.containerInfo;
      hostParentIsContainer = !0;
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      hostParent = prevHostParent;
      hostParentIsContainer = prevHostParentIsContainer;
      break;
    case 0:
    case 11:
    case 14:
    case 15:
      if (
        !offscreenSubtreeWasHidden &&
        ((prevHostParent = deletedFiber.updateQueue),
        null !== prevHostParent &&
          ((prevHostParent = prevHostParent.lastEffect),
          null !== prevHostParent))
      ) {
        prevHostParentIsContainer = prevHostParent = prevHostParent.next;
        do {
          var _effect = prevHostParentIsContainer,
            destroy = _effect.destroy;
          _effect = _effect.tag;
          void 0 !== destroy &&
            (0 !== (_effect & 2)
              ? safelyCallDestroy(deletedFiber, nearestMountedAncestor, destroy)
              : 0 !== (_effect & 4) &&
                safelyCallDestroy(
                  deletedFiber,
                  nearestMountedAncestor,
                  destroy
                ));
          prevHostParentIsContainer = prevHostParentIsContainer.next;
        } while (prevHostParentIsContainer !== prevHostParent);
      }
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      break;
    case 1:
      if (
        !offscreenSubtreeWasHidden &&
        (safelyDetachRef(deletedFiber, nearestMountedAncestor),
        (prevHostParent = deletedFiber.stateNode),
        "function" === typeof prevHostParent.componentWillUnmount)
      )
        try {
          (prevHostParent.props = deletedFiber.memoizedProps),
            (prevHostParent.state = deletedFiber.memoizedState),
            prevHostParent.componentWillUnmount();
        } catch (error) {
          captureCommitPhaseError(deletedFiber, nearestMountedAncestor, error);
        }
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      break;
    case 21:
      safelyDetachRef(deletedFiber, nearestMountedAncestor);
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
      break;
    case 22:
      safelyDetachRef(deletedFiber, nearestMountedAncestor);
      deletedFiber.mode & 1
        ? ((offscreenSubtreeWasHidden =
            (prevHostParent = offscreenSubtreeWasHidden) ||
            null !== deletedFiber.memoizedState),
          recursivelyTraverseDeletionEffects(
            finishedRoot,
            nearestMountedAncestor,
            deletedFiber
          ),
          (offscreenSubtreeWasHidden = prevHostParent))
        : recursivelyTraverseDeletionEffects(
            finishedRoot,
            nearestMountedAncestor,
            deletedFiber
          );
      break;
    default:
      recursivelyTraverseDeletionEffects(
        finishedRoot,
        nearestMountedAncestor,
        deletedFiber
      );
  }
}
function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {
  if (null === finishedWork.memoizedState) {
    var current = finishedWork.alternate;
    if (
      null !== current &&
      ((current = current.memoizedState),
      null !== current && ((current = current.dehydrated), null !== current))
    )
      try {
        retryIfBlockedOn(current);
        var hydrationCallbacks = finishedRoot.hydrationCallbacks;
        if (null !== hydrationCallbacks) {
          var onHydrated = hydrationCallbacks.onHydrated;
          onHydrated && onHydrated(current);
        }
      } catch (error) {
        captureCommitPhaseError(finishedWork, finishedWork.return, error);
      }
  }
}
function getRetryCache(finishedWork) {
  switch (finishedWork.tag) {
    case 13:
    case 19:
      var retryCache = finishedWork.stateNode;
      null === retryCache &&
        (retryCache = finishedWork.stateNode = new PossiblyWeakSet());
      return retryCache;
    case 22:
      return (
        (finishedWork = finishedWork.stateNode),
        (retryCache = finishedWork._retryCache),
        null === retryCache &&
          (retryCache = finishedWork._retryCache = new PossiblyWeakSet()),
        retryCache
      );
    default:
      throw Error(formatProdErrorMessage(435, finishedWork.tag));
  }
}
function attachSuspenseRetryListeners(finishedWork, wakeables) {
  var retryCache = getRetryCache(finishedWork);
  wakeables.forEach(function (wakeable) {
    var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
    retryCache.has(wakeable) ||
      (retryCache.add(wakeable), wakeable.then(retry, retry));
  });
}
function recursivelyTraverseMutationEffects(root$jscomp$0, parentFiber) {
  var deletions = parentFiber.deletions;
  if (null !== deletions)
    for (var i = 0; i < deletions.length; i++) {
      var childToDelete = deletions[i];
      try {
        var root = root$jscomp$0,
          returnFiber = parentFiber,
          parent = returnFiber;
        a: for (; null !== parent; ) {
          switch (parent.tag) {
            case 27:
            case 5:
              hostParent = parent.stateNode;
              hostParentIsContainer = !1;
              break a;
            case 3:
              hostParent = parent.stateNode.containerInfo;
              hostParentIsContainer = !0;
              break a;
            case 4:
              hostParent = parent.stateNode.containerInfo;
              hostParentIsContainer = !0;
              break a;
          }
          parent = parent.return;
        }
        if (null === hostParent) throw Error(formatProdErrorMessage(160));
        commitDeletionEffectsOnFiber(root, returnFiber, childToDelete);
        hostParent = null;
        hostParentIsContainer = !1;
        var alternate = childToDelete.alternate;
        null !== alternate && (alternate.return = null);
        childToDelete.return = null;
      } catch (error) {
        captureCommitPhaseError(childToDelete, parentFiber, error);
      }
    }
  if (parentFiber.subtreeFlags & 12854)
    for (parentFiber = parentFiber.child; null !== parentFiber; )
      commitMutationEffectsOnFiber(parentFiber, root$jscomp$0),
        (parentFiber = parentFiber.sibling);
}
function commitMutationEffectsOnFiber(finishedWork, root) {
  var current = finishedWork.alternate,
    flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 14:
    case 15:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      if (flags & 4) {
        try {
          commitHookEffectListUnmount(3, finishedWork, finishedWork.return),
            commitHookEffectListMount(3, finishedWork);
        } catch (error) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error);
        }
        try {
          commitHookEffectListUnmount(5, finishedWork, finishedWork.return);
        } catch (error$177) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error$177);
        }
      }
      break;
    case 1:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      flags & 512 &&
        null !== current &&
        safelyDetachRef(current, current.return);
      flags & 64 &&
        offscreenSubtreeIsHidden &&
        ((finishedWork = finishedWork.updateQueue),
        null !== finishedWork &&
          ((current = finishedWork.callbacks),
          null !== current &&
            ((flags = finishedWork.shared.hiddenCallbacks),
            (finishedWork.shared.hiddenCallbacks =
              null === flags ? current : flags.concat(current)))));
      break;
    case 26:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      flags & 512 &&
        null !== current &&
        safelyDetachRef(current, current.return);
      flags & 4 &&
        ((flags = finishedWork.memoizedState),
        null !== current &&
          ((current = current.memoizedState),
          current !== flags && releaseResource(current)),
        (finishedWork.stateNode = flags ? acquireResource(flags) : null));
      break;
    case 27:
      if (flags & 4 && null === finishedWork.alternate) {
        for (
          var singleton = finishedWork.stateNode,
            props = finishedWork.memoizedProps,
            node = singleton.firstChild;
          node;

        ) {
          var nextNode = node.nextSibling,
            nodeName = node.nodeName;
          node[internalResourceMarker] ||
            "HEAD" === nodeName ||
            "BODY" === nodeName ||
            "STYLE" === nodeName ||
            ("LINK" === nodeName && "stylesheet" === node.rel.toLowerCase()) ||
            singleton.removeChild(node);
          node = nextNode;
        }
        node = finishedWork.type;
        for (nextNode = singleton.attributes; nextNode.length; )
          singleton.removeAttributeNode(nextNode[0]);
        setInitialProperties(singleton, node, props);
        singleton[internalInstanceKey] = finishedWork;
        singleton[internalPropsKey] = props;
      }
    case 5:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      flags & 512 &&
        null !== current &&
        safelyDetachRef(current, current.return);
      if (finishedWork.flags & 32) {
        root = finishedWork.stateNode;
        try {
          setTextContent(root, "");
        } catch (error$178) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error$178);
        }
      }
      if (
        flags & 4 &&
        ((flags = finishedWork.stateNode),
        null != flags &&
          ((root = finishedWork.memoizedProps),
          (props = null !== current ? current.memoizedProps : root),
          (current = finishedWork.type),
          (singleton = finishedWork.updateQueue),
          (finishedWork.updateQueue = null),
          null !== singleton))
      )
        try {
          "input" === current &&
            "radio" === root.type &&
            null != root.name &&
            updateChecked(flags, root);
          isCustomComponent(current, props);
          var isCustomComponentTag = isCustomComponent(current, root);
          for (props = 0; props < singleton.length; props += 2) {
            var propKey = singleton[props],
              propValue = singleton[props + 1];
            "style" === propKey
              ? setValueForStyles(flags, propValue)
              : "dangerouslySetInnerHTML" === propKey
              ? setInnerHTML(flags, propValue)
              : "children" === propKey
              ? setTextContent(flags, propValue)
              : setValueForProperty(
                  flags,
                  propKey,
                  propValue,
                  isCustomComponentTag
                );
          }
          switch (current) {
            case "input":
              updateWrapper(flags, root);
              break;
            case "textarea":
              updateWrapper$1(flags, root);
              break;
            case "select":
              var wasMultiple = flags._wrapperState.wasMultiple;
              flags._wrapperState.wasMultiple = !!root.multiple;
              var value = root.value;
              null != value
                ? updateOptions(flags, !!root.multiple, value, !1)
                : wasMultiple !== !!root.multiple &&
                  (null != root.defaultValue
                    ? updateOptions(
                        flags,
                        !!root.multiple,
                        root.defaultValue,
                        !0
                      )
                    : updateOptions(
                        flags,
                        !!root.multiple,
                        root.multiple ? [] : "",
                        !1
                      ));
          }
          flags[internalPropsKey] = root;
        } catch (error$180) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error$180);
        }
      break;
    case 6:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      if (flags & 4) {
        if (null === finishedWork.stateNode)
          throw Error(formatProdErrorMessage(162));
        current = finishedWork.stateNode;
        flags = finishedWork.memoizedProps;
        try {
          current.nodeValue = flags;
        } catch (error$181) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error$181);
        }
      }
      break;
    case 3:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      if (flags & 4 && null !== current && current.memoizedState.isDehydrated)
        try {
          retryIfBlockedOn(root.containerInfo);
        } catch (error$182) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error$182);
        }
      break;
    case 4:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      break;
    case 13:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      current = finishedWork.child;
      current.flags & 8192 &&
        null !== current.memoizedState &&
        (null === current.alternate ||
          null === current.alternate.memoizedState) &&
        (globalMostRecentFallbackTime = now());
      if (flags & 4) {
        try {
          if (null !== finishedWork.memoizedState) {
            var suspenseCallback = finishedWork.memoizedProps.suspenseCallback;
            if ("function" === typeof suspenseCallback) {
              var wakeables = finishedWork.updateQueue;
              null !== wakeables && suspenseCallback(new Set(wakeables));
            }
          }
        } catch (error$183) {
          captureCommitPhaseError(finishedWork, finishedWork.return, error$183);
        }
        current = finishedWork.updateQueue;
        null !== current &&
          ((finishedWork.updateQueue = null),
          attachSuspenseRetryListeners(finishedWork, current));
      }
      break;
    case 22:
      flags & 512 &&
        null !== current &&
        safelyDetachRef(current, current.return);
      isCustomComponentTag = null !== finishedWork.memoizedState;
      propKey = null !== current && null !== current.memoizedState;
      finishedWork.mode & 1
        ? ((propValue = offscreenSubtreeIsHidden),
          (wasMultiple = offscreenSubtreeWasHidden),
          (offscreenSubtreeIsHidden = propValue || isCustomComponentTag),
          (offscreenSubtreeWasHidden = wasMultiple || propKey),
          recursivelyTraverseMutationEffects(root, finishedWork),
          (offscreenSubtreeWasHidden = wasMultiple),
          (offscreenSubtreeIsHidden = propValue))
        : recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      propValue = finishedWork.stateNode;
      propValue._current = finishedWork;
      propValue._visibility &= -3;
      propValue._visibility |= propValue._pendingVisibility & 2;
      if (
        flags & 8192 &&
        ((propValue._visibility = isCustomComponentTag
          ? propValue._visibility & -2
          : propValue._visibility | 1),
        isCustomComponentTag &&
          ((propValue = offscreenSubtreeIsHidden || offscreenSubtreeWasHidden),
          null === current ||
            propKey ||
            propValue ||
            (0 !== (finishedWork.mode & 1) &&
              recursivelyTraverseDisappearLayoutEffects(finishedWork))),
        null === finishedWork.memoizedProps ||
          "manual" !== finishedWork.memoizedProps.mode)
      )
        a: for (current = null, propKey = finishedWork; ; ) {
          if (5 === propKey.tag || 26 === propKey.tag || 27 === propKey.tag) {
            if (null === current) {
              current = propKey;
              try {
                (singleton = propKey.stateNode),
                  isCustomComponentTag
                    ? ((props = singleton.style),
                      "function" === typeof props.setProperty
                        ? props.setProperty("display", "none", "important")
                        : (props.display = "none"))
                    : ((node = propKey.stateNode),
                      (nextNode = propKey.memoizedProps.style),
                      (nodeName =
                        void 0 !== nextNode &&
                        null !== nextNode &&
                        nextNode.hasOwnProperty("display")
                          ? nextNode.display
                          : null),
                      (node.style.display = dangerousStyleValue(
                        "display",
                        nodeName
                      )));
              } catch (error) {
                captureCommitPhaseError(
                  finishedWork,
                  finishedWork.return,
                  error
                );
              }
            }
          } else if (6 === propKey.tag) {
            if (null === current)
              try {
                propKey.stateNode.nodeValue = isCustomComponentTag
                  ? ""
                  : propKey.memoizedProps;
              } catch (error$167) {
                captureCommitPhaseError(
                  finishedWork,
                  finishedWork.return,
                  error$167
                );
              }
          } else if (
            ((22 !== propKey.tag && 23 !== propKey.tag) ||
              null === propKey.memoizedState ||
              propKey === finishedWork) &&
            null !== propKey.child
          ) {
            propKey.child.return = propKey;
            propKey = propKey.child;
            continue;
          }
          if (propKey === finishedWork) break a;
          for (; null === propKey.sibling; ) {
            if (null === propKey.return || propKey.return === finishedWork)
              break a;
            current === propKey && (current = null);
            propKey = propKey.return;
          }
          current === propKey && (current = null);
          propKey.sibling.return = propKey.return;
          propKey = propKey.sibling;
        }
      flags & 4 &&
        ((current = finishedWork.updateQueue),
        null !== current &&
          ((flags = current.wakeables),
          null !== flags &&
            ((current.wakeables = null),
            attachSuspenseRetryListeners(finishedWork, flags))));
      break;
    case 19:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      flags & 4 &&
        ((current = finishedWork.updateQueue),
        null !== current &&
          ((finishedWork.updateQueue = null),
          attachSuspenseRetryListeners(finishedWork, current)));
      break;
    case 21:
      recursivelyTraverseMutationEffects(root, finishedWork);
      commitReconciliationEffects(finishedWork);
      flags & 512 &&
        (null !== current && safelyDetachRef(finishedWork, finishedWork.return),
        safelyAttachRef(finishedWork, finishedWork.return));
      flags & 4 && (finishedWork.stateNode[internalInstanceKey] = finishedWork);
      break;
    default:
      recursivelyTraverseMutationEffects(root, finishedWork),
        commitReconciliationEffects(finishedWork);
  }
}
function commitReconciliationEffects(finishedWork) {
  var flags = finishedWork.flags;
  if (flags & 2) {
    try {
      if (27 !== finishedWork.tag) {
        b: {
          for (var parent = finishedWork.return; null !== parent; ) {
            if (isHostParent(parent)) {
              var JSCompiler_inline_result = parent;
              break b;
            }
            parent = parent.return;
          }
          throw Error(formatProdErrorMessage(160));
        }
        switch (JSCompiler_inline_result.tag) {
          case 27:
            var parent$jscomp$0 = JSCompiler_inline_result.stateNode,
              before = getHostSibling(finishedWork);
            insertOrAppendPlacementNode(finishedWork, before, parent$jscomp$0);
            break;
          case 5:
            var parent$168 = JSCompiler_inline_result.stateNode;
            JSCompiler_inline_result.flags & 32 &&
              (setTextContent(parent$168, ""),
              (JSCompiler_inline_result.flags &= -33));
            var before$169 = getHostSibling(finishedWork);
            insertOrAppendPlacementNode(finishedWork, before$169, parent$168);
            break;
          case 3:
          case 4:
            var parent$170 = JSCompiler_inline_result.stateNode.containerInfo,
              before$171 = getHostSibling(finishedWork);
            insertOrAppendPlacementNodeIntoContainer(
              finishedWork,
              before$171,
              parent$170
            );
            break;
          default:
            throw Error(formatProdErrorMessage(161));
        }
      }
    } catch (error) {
      captureCommitPhaseError(finishedWork, finishedWork.return, error);
    }
    finishedWork.flags &= -3;
  }
  flags & 4096 && (finishedWork.flags &= -4097);
}
function recursivelyTraverseLayoutEffects(root, parentFiber) {
  if (parentFiber.subtreeFlags & 8772)
    for (parentFiber = parentFiber.child; null !== parentFiber; )
      commitLayoutEffectOnFiber(root, parentFiber.alternate, parentFiber),
        (parentFiber = parentFiber.sibling);
}
function recursivelyTraverseDisappearLayoutEffects(parentFiber) {
  for (parentFiber = parentFiber.child; null !== parentFiber; ) {
    var finishedWork = parentFiber;
    switch (finishedWork.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        commitHookEffectListUnmount(4, finishedWork, finishedWork.return);
        recursivelyTraverseDisappearLayoutEffects(finishedWork);
        break;
      case 1:
        safelyDetachRef(finishedWork, finishedWork.return);
        var instance = finishedWork.stateNode;
        if ("function" === typeof instance.componentWillUnmount) {
          var current = finishedWork,
            nearestMountedAncestor = finishedWork.return;
          try {
            var current$jscomp$0 = current;
            instance.props = current$jscomp$0.memoizedProps;
            instance.state = current$jscomp$0.memoizedState;
            instance.componentWillUnmount();
          } catch (error) {
            captureCommitPhaseError(current, nearestMountedAncestor, error);
          }
        }
        recursivelyTraverseDisappearLayoutEffects(finishedWork);
        break;
      case 26:
      case 27:
      case 5:
        safelyDetachRef(finishedWork, finishedWork.return);
        recursivelyTraverseDisappearLayoutEffects(finishedWork);
        break;
      case 22:
        safelyDetachRef(finishedWork, finishedWork.return);
        null === finishedWork.memoizedState &&
          recursivelyTraverseDisappearLayoutEffects(finishedWork);
        break;
      default:
        recursivelyTraverseDisappearLayoutEffects(finishedWork);
    }
    parentFiber = parentFiber.sibling;
  }
}
function recursivelyTraverseReappearLayoutEffects(
  finishedRoot$jscomp$0,
  parentFiber,
  includeWorkInProgressEffects
) {
  includeWorkInProgressEffects =
    includeWorkInProgressEffects && 0 !== (parentFiber.subtreeFlags & 8772);
  for (parentFiber = parentFiber.child; null !== parentFiber; ) {
    var current = parentFiber.alternate,
      finishedRoot = finishedRoot$jscomp$0,
      finishedWork = parentFiber,
      flags = finishedWork.flags;
    switch (finishedWork.tag) {
      case 0:
      case 11:
      case 15:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
        commitHookLayoutEffects(finishedWork, 4);
        break;
      case 1:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
        finishedRoot = finishedWork.stateNode;
        if ("function" === typeof finishedRoot.componentDidMount)
          try {
            finishedRoot.componentDidMount();
          } catch (error) {
            captureCommitPhaseError(finishedWork, finishedWork.return, error);
          }
        current = finishedWork.updateQueue;
        if (null !== current) {
          var hiddenCallbacks = current.shared.hiddenCallbacks;
          if (null !== hiddenCallbacks)
            for (
              current.shared.hiddenCallbacks = null, current = 0;
              current < hiddenCallbacks.length;
              current++
            )
              callCallback(hiddenCallbacks[current], finishedRoot);
        }
        includeWorkInProgressEffects &&
          flags & 64 &&
          commitClassCallbacks(finishedWork);
        safelyAttachRef(finishedWork, finishedWork.return);
        break;
      case 26:
      case 27:
      case 5:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
        includeWorkInProgressEffects &&
          null === current &&
          flags & 4 &&
          commitHostComponentMount(finishedWork);
        safelyAttachRef(finishedWork, finishedWork.return);
        break;
      case 12:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
        break;
      case 13:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
        includeWorkInProgressEffects &&
          flags & 4 &&
          commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
        break;
      case 22:
        null === finishedWork.memoizedState &&
          recursivelyTraverseReappearLayoutEffects(
            finishedRoot,
            finishedWork,
            includeWorkInProgressEffects
          );
        safelyAttachRef(finishedWork, finishedWork.return);
        break;
      default:
        recursivelyTraverseReappearLayoutEffects(
          finishedRoot,
          finishedWork,
          includeWorkInProgressEffects
        );
    }
    parentFiber = parentFiber.sibling;
  }
}
function commitHookPassiveMountEffects(finishedWork, hookFlags) {
  try {
    commitHookEffectListMount(hookFlags, finishedWork);
  } catch (error) {
    captureCommitPhaseError(finishedWork, finishedWork.return, error);
  }
}
function commitOffscreenPassiveMountEffects(current, finishedWork) {
  var previousCache = null;
  null !== current &&
    null !== current.memoizedState &&
    null !== current.memoizedState.cachePool &&
    (previousCache = current.memoizedState.cachePool.pool);
  current = null;
  null !== finishedWork.memoizedState &&
    null !== finishedWork.memoizedState.cachePool &&
    (current = finishedWork.memoizedState.cachePool.pool);
  current !== previousCache &&
    (null != current && current.refCount++,
    null != previousCache && releaseCache(previousCache));
}
function commitCachePassiveMountEffect(current, finishedWork) {
  current = null;
  null !== finishedWork.alternate &&
    (current = finishedWork.alternate.memoizedState.cache);
  finishedWork = finishedWork.memoizedState.cache;
  finishedWork !== current &&
    (finishedWork.refCount++, null != current && releaseCache(current));
}
function recursivelyTraversePassiveMountEffects(
  root,
  parentFiber,
  committedLanes,
  committedTransitions
) {
  if (parentFiber.subtreeFlags & 10256)
    for (parentFiber = parentFiber.child; null !== parentFiber; )
      commitPassiveMountOnFiber(
        root,
        parentFiber,
        committedLanes,
        committedTransitions
      ),
        (parentFiber = parentFiber.sibling);
}
function commitPassiveMountOnFiber(
  finishedRoot,
  finishedWork,
  committedLanes,
  committedTransitions
) {
  var flags = finishedWork.flags;
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 15:
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions
      );
      flags & 2048 && commitHookPassiveMountEffects(finishedWork, 9);
      break;
    case 3:
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions
      );
      flags & 2048 &&
        ((finishedRoot = null),
        null !== finishedWork.alternate &&
          (finishedRoot = finishedWork.alternate.memoizedState.cache),
        (finishedWork = finishedWork.memoizedState.cache),
        finishedWork !== finishedRoot &&
          (finishedWork.refCount++,
          null != finishedRoot && releaseCache(finishedRoot)));
      break;
    case 23:
      break;
    case 22:
      var instance = finishedWork.stateNode;
      null !== finishedWork.memoizedState
        ? instance._visibility & 4
          ? recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            )
          : finishedWork.mode & 1
          ? recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork)
          : ((instance._visibility |= 4),
            recursivelyTraversePassiveMountEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions
            ))
        : instance._visibility & 4
        ? recursivelyTraversePassiveMountEffects(
            finishedRoot,
            finishedWork,
            committedLanes,
            committedTransitions
          )
        : ((instance._visibility |= 4),
          recursivelyTraverseReconnectPassiveEffects(
            finishedRoot,
            finishedWork,
            committedLanes,
            committedTransitions,
            0 !== (finishedWork.subtreeFlags & 10256)
          ));
      flags & 2048 &&
        commitOffscreenPassiveMountEffects(
          finishedWork.alternate,
          finishedWork
        );
      break;
    case 24:
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions
      );
      flags & 2048 &&
        commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
      break;
    default:
      recursivelyTraversePassiveMountEffects(
        finishedRoot,
        finishedWork,
        committedLanes,
        committedTransitions
      );
  }
}
function recursivelyTraverseReconnectPassiveEffects(
  finishedRoot$jscomp$0,
  parentFiber,
  committedLanes$jscomp$0,
  committedTransitions$jscomp$0,
  includeWorkInProgressEffects
) {
  includeWorkInProgressEffects =
    includeWorkInProgressEffects && 0 !== (parentFiber.subtreeFlags & 10256);
  for (parentFiber = parentFiber.child; null !== parentFiber; ) {
    var finishedRoot = finishedRoot$jscomp$0,
      finishedWork = parentFiber,
      committedLanes = committedLanes$jscomp$0,
      committedTransitions = committedTransitions$jscomp$0,
      flags = finishedWork.flags;
    switch (finishedWork.tag) {
      case 0:
      case 11:
      case 15:
        recursivelyTraverseReconnectPassiveEffects(
          finishedRoot,
          finishedWork,
          committedLanes,
          committedTransitions,
          includeWorkInProgressEffects
        );
        commitHookPassiveMountEffects(finishedWork, 8);
        break;
      case 23:
        break;
      case 22:
        var instance = finishedWork.stateNode;
        null !== finishedWork.memoizedState
          ? instance._visibility & 4
            ? recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              )
            : finishedWork.mode & 1
            ? recursivelyTraverseAtomicPassiveEffects(
                finishedRoot,
                finishedWork
              )
            : ((instance._visibility |= 4),
              recursivelyTraverseReconnectPassiveEffects(
                finishedRoot,
                finishedWork,
                committedLanes,
                committedTransitions,
                includeWorkInProgressEffects
              ))
          : ((instance._visibility |= 4),
            recursivelyTraverseReconnectPassiveEffects(
              finishedRoot,
              finishedWork,
              committedLanes,
              committedTransitions,
              includeWorkInProgressEffects
            ));
        includeWorkInProgressEffects &&
          flags & 2048 &&
          commitOffscreenPassiveMountEffects(
            finishedWork.alternate,
            finishedWork
          );
        break;
      case 24:
        recursivelyTraverseReconnectPassiveEffects(
          finishedRoot,
          finishedWork,
          committedLanes,
          committedTransitions,
          includeWorkInProgressEffects
        );
        includeWorkInProgressEffects &&
          flags & 2048 &&
          commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
        break;
      default:
        recursivelyTraverseReconnectPassiveEffects(
          finishedRoot,
          finishedWork,
          committedLanes,
          committedTransitions,
          includeWorkInProgressEffects
        );
    }
    parentFiber = parentFiber.sibling;
  }
}
function recursivelyTraverseAtomicPassiveEffects(
  finishedRoot$jscomp$0,
  parentFiber
) {
  if (parentFiber.subtreeFlags & 10256)
    for (parentFiber = parentFiber.child; null !== parentFiber; ) {
      var finishedRoot = finishedRoot$jscomp$0,
        finishedWork = parentFiber,
        flags = finishedWork.flags;
      switch (finishedWork.tag) {
        case 22:
          recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
          flags & 2048 &&
            commitOffscreenPassiveMountEffects(
              finishedWork.alternate,
              finishedWork
            );
          break;
        case 24:
          recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
          flags & 2048 &&
            commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
          break;
        default:
          recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
      }
      parentFiber = parentFiber.sibling;
    }
}
function detachAlternateSiblings(parentFiber) {
  var previousFiber = parentFiber.alternate;
  if (
    null !== previousFiber &&
    ((parentFiber = previousFiber.child), null !== parentFiber)
  ) {
    previousFiber.child = null;
    do
      (previousFiber = parentFiber.sibling),
        (parentFiber.sibling = null),
        (parentFiber = previousFiber);
    while (null !== parentFiber);
  }
}
function recursivelyTraversePassiveUnmountEffects(parentFiber) {
  var deletions = parentFiber.deletions;
  if (0 !== (parentFiber.flags & 16)) {
    if (null !== deletions)
      for (var i = 0; i < deletions.length; i++) {
        var childToDelete = deletions[i];
        nextEffect = childToDelete;
        commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
          childToDelete,
          parentFiber
        );
      }
    detachAlternateSiblings(parentFiber);
  }
  if (parentFiber.subtreeFlags & 10256)
    for (parentFiber = parentFiber.child; null !== parentFiber; )
      commitPassiveUnmountOnFiber(parentFiber),
        (parentFiber = parentFiber.sibling);
}
function commitPassiveUnmountOnFiber(finishedWork) {
  switch (finishedWork.tag) {
    case 0:
    case 11:
    case 15:
      recursivelyTraversePassiveUnmountEffects(finishedWork);
      finishedWork.flags & 2048 &&
        commitHookEffectListUnmount(9, finishedWork, finishedWork.return);
      break;
    case 22:
      var instance = finishedWork.stateNode;
      null !== finishedWork.memoizedState &&
      instance._visibility & 4 &&
      (null === finishedWork.return || 13 !== finishedWork.return.tag)
        ? ((instance._visibility &= -5),
          recursivelyTraverseDisconnectPassiveEffects(finishedWork))
        : recursivelyTraversePassiveUnmountEffects(finishedWork);
      break;
    default:
      recursivelyTraversePassiveUnmountEffects(finishedWork);
  }
}
function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
  var deletions = parentFiber.deletions;
  if (0 !== (parentFiber.flags & 16)) {
    if (null !== deletions)
      for (var i = 0; i < deletions.length; i++) {
        var childToDelete = deletions[i];
        nextEffect = childToDelete;
        commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
          childToDelete,
          parentFiber
        );
      }
    detachAlternateSiblings(parentFiber);
  }
  for (parentFiber = parentFiber.child; null !== parentFiber; ) {
    deletions = parentFiber;
    switch (deletions.tag) {
      case 0:
      case 11:
      case 15:
        commitHookEffectListUnmount(8, deletions, deletions.return);
        recursivelyTraverseDisconnectPassiveEffects(deletions);
        break;
      case 22:
        i = deletions.stateNode;
        i._visibility & 4 &&
          ((i._visibility &= -5),
          recursivelyTraverseDisconnectPassiveEffects(deletions));
        break;
      default:
        recursivelyTraverseDisconnectPassiveEffects(deletions);
    }
    parentFiber = parentFiber.sibling;
  }
}
function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(
  deletedSubtreeRoot,
  nearestMountedAncestor
) {
  for (; null !== nextEffect; ) {
    var fiber = nextEffect;
    switch (fiber.tag) {
      case 0:
      case 11:
      case 15:
        commitHookEffectListUnmount(8, fiber, nearestMountedAncestor);
        break;
      case 23:
      case 22:
        if (
          null !== fiber.memoizedState &&
          null !== fiber.memoizedState.cachePool
        ) {
          var cache = fiber.memoizedState.cachePool.pool;
          null != cache && cache.refCount++;
        }
        break;
      case 24:
        releaseCache(fiber.memoizedState.cache);
    }
    cache = fiber.child;
    if (null !== cache) (cache.return = fiber), (nextEffect = cache);
    else
      a: for (fiber = deletedSubtreeRoot; null !== nextEffect; ) {
        cache = nextEffect;
        var sibling = cache.sibling,
          returnFiber = cache.return;
        detachFiberAfterEffects(cache);
        if (cache === fiber) {
          nextEffect = null;
          break a;
        }
        if (null !== sibling) {
          sibling.return = returnFiber;
          nextEffect = sibling;
          break a;
        }
        nextEffect = returnFiber;
      }
  }
}
var DefaultCacheDispatcher = {
    getCacheSignal: function () {
      return readContext(CacheContext).controller.signal;
    },
    getCacheForType: function (resourceType) {
      var cache = readContext(CacheContext),
        cacheForType = cache.data.get(resourceType);
      void 0 === cacheForType &&
        ((cacheForType = resourceType()),
        cache.data.set(resourceType, cacheForType));
      return cacheForType;
    }
  },
  COMPONENT_TYPE = 0,
  HAS_PSEUDO_CLASS_TYPE = 1,
  ROLE_TYPE = 2,
  TEST_NAME_TYPE = 3,
  TEXT_TYPE = 4;
if ("function" === typeof Symbol && Symbol.for) {
  var symbolFor = Symbol.for;
  COMPONENT_TYPE = symbolFor("selector.component");
  HAS_PSEUDO_CLASS_TYPE = symbolFor("selector.has_pseudo_class");
  ROLE_TYPE = symbolFor("selector.role");
  TEST_NAME_TYPE = symbolFor("selector.test_id");
  TEXT_TYPE = symbolFor("selector.text");
}
function findFiberRootForHostRoot(hostRoot) {
  var maybeFiber = getClosestInstanceFromNode(hostRoot) || null;
  if (null != maybeFiber) {
    if ("string" !== typeof maybeFiber.memoizedProps["data-testname"])
      throw Error(formatProdErrorMessage(364));
    return maybeFiber;
  }
  a: {
    hostRoot = [hostRoot];
    for (maybeFiber = 0; maybeFiber < hostRoot.length; ) {
      var current = hostRoot[maybeFiber++];
      if (current[internalContainerInstanceKey]) {
        hostRoot = getInstanceFromNode(current);
        break a;
      }
      hostRoot.push.apply(hostRoot, current.children);
    }
    hostRoot = null;
  }
  if (null === hostRoot) throw Error(formatProdErrorMessage(362));
  return hostRoot.stateNode.current;
}
function matchSelector(fiber$jscomp$0, selector$jscomp$0) {
  var tag = fiber$jscomp$0.tag;
  switch (selector$jscomp$0.$$typeof) {
    case COMPONENT_TYPE:
      if (fiber$jscomp$0.type === selector$jscomp$0.value) return !0;
      break;
    case HAS_PSEUDO_CLASS_TYPE:
      a: {
        selector$jscomp$0 = selector$jscomp$0.value;
        tag = [fiber$jscomp$0, 0];
        for (fiber$jscomp$0 = 0; fiber$jscomp$0 < tag.length; ) {
          var fiber = tag[fiber$jscomp$0++],
            tag$jscomp$0 = fiber.tag,
            selectorIndex = tag[fiber$jscomp$0++],
            selector = selector$jscomp$0[selectorIndex];
          if (
            (5 !== tag$jscomp$0 &&
              26 !== tag$jscomp$0 &&
              27 !== tag$jscomp$0) ||
            !isHiddenSubtree(fiber)
          ) {
            for (; null != selector && matchSelector(fiber, selector); )
              selectorIndex++, (selector = selector$jscomp$0[selectorIndex]);
            if (selectorIndex === selector$jscomp$0.length) {
              selector$jscomp$0 = !0;
              break a;
            } else
              for (fiber = fiber.child; null !== fiber; )
                tag.push(fiber, selectorIndex), (fiber = fiber.sibling);
          }
        }
        selector$jscomp$0 = !1;
      }
      return selector$jscomp$0;
    case ROLE_TYPE:
      if (5 === tag || 26 === tag || 27 === tag)
        if (
          ((tag = fiber$jscomp$0.stateNode),
          (selector$jscomp$0 = selector$jscomp$0.value),
          (fiber$jscomp$0 = (fiber$jscomp$0 = tag.getAttribute("role"))
            ? fiber$jscomp$0.trim().split(" ")
            : null),
          (selector$jscomp$0 =
            (null !== fiber$jscomp$0 &&
              0 <= fiber$jscomp$0.indexOf(selector$jscomp$0)) ||
            selector$jscomp$0 === getImplicitRole(tag)
              ? !0
              : !1),
          selector$jscomp$0)
        )
          return !0;
      break;
    case TEXT_TYPE:
      if (5 === tag || 6 === tag || 26 === tag || 27 === tag) {
        a: {
          switch (fiber$jscomp$0.tag) {
            case 26:
            case 27:
            case 5:
              tag = "";
              fiber$jscomp$0 = fiber$jscomp$0.stateNode.childNodes;
              for (
                selectorIndex = 0;
                selectorIndex < fiber$jscomp$0.length;
                selectorIndex++
              )
                (fiber = fiber$jscomp$0[selectorIndex]),
                  fiber.nodeType === Node.TEXT_NODE &&
                    (tag += fiber.textContent);
              break a;
            case 6:
              tag = fiber$jscomp$0.stateNode.textContent;
              break a;
          }
          tag = null;
        }
        if (null !== tag && 0 <= tag.indexOf(selector$jscomp$0.value))
          return !0;
      }
      break;
    case TEST_NAME_TYPE:
      if (5 === tag || 26 === tag || 27 === tag)
        if (
          ((tag = fiber$jscomp$0.memoizedProps["data-testname"]),
          "string" === typeof tag &&
            tag.toLowerCase() === selector$jscomp$0.value.toLowerCase())
        )
          return !0;
      break;
    default:
      throw Error(formatProdErrorMessage(365));
  }
  return !1;
}
function selectorToString(selector) {
  switch (selector.$$typeof) {
    case COMPONENT_TYPE:
      return (
        "<" + (getComponentNameFromType(selector.value) || "Unknown") + ">"
      );
    case HAS_PSEUDO_CLASS_TYPE:
      return ":has(" + (selectorToString(selector) || "") + ")";
    case ROLE_TYPE:
      return '[role="' + selector.value + '"]';
    case TEXT_TYPE:
      return '"' + selector.value + '"';
    case TEST_NAME_TYPE:
      return '[data-testname="' + selector.value + '"]';
    default:
      throw Error(formatProdErrorMessage(365));
  }
}
function findPaths(root, selectors) {
  var matchingFibers = [];
  root = [root, 0];
  for (var index = 0; index < root.length; ) {
    var fiber = root[index++],
      tag = fiber.tag,
      selectorIndex = root[index++],
      selector = selectors[selectorIndex];
    if ((5 !== tag && 26 !== tag && 27 !== tag) || !isHiddenSubtree(fiber)) {
      for (; null != selector && matchSelector(fiber, selector); )
        selectorIndex++, (selector = selectors[selectorIndex]);
      if (selectorIndex === selectors.length) matchingFibers.push(fiber);
      else
        for (fiber = fiber.child; null !== fiber; )
          root.push(fiber, selectorIndex), (fiber = fiber.sibling);
    }
  }
  return matchingFibers;
}
function findAllNodes(hostRoot, selectors) {
  hostRoot = findFiberRootForHostRoot(hostRoot);
  hostRoot = findPaths(hostRoot, selectors);
  selectors = [];
  hostRoot = Array.from(hostRoot);
  for (var index = 0; index < hostRoot.length; ) {
    var node = hostRoot[index++],
      tag = node.tag;
    if (5 === tag || 26 === tag || 27 === tag)
      isHiddenSubtree(node) || selectors.push(node.stateNode);
    else
      for (node = node.child; null !== node; )
        hostRoot.push(node), (node = node.sibling);
  }
  return selectors;
}
var ceil = Math.ceil,
  PossiblyWeakMap = "function" === typeof WeakMap ? WeakMap : Map,
  ReactCurrentDispatcher$2 = ReactSharedInternals.ReactCurrentDispatcher,
  ReactCurrentCache = ReactSharedInternals.ReactCurrentCache,
  ReactCurrentOwner$2 = ReactSharedInternals.ReactCurrentOwner,
  ReactCurrentBatchConfig$3 = ReactSharedInternals.ReactCurrentBatchConfig,
  executionContext = 0,
  workInProgressRoot = null,
  workInProgress = null,
  workInProgressRootRenderLanes = 0,
  workInProgressSuspendedReason = 0,
  workInProgressThrownValue = null,
  workInProgressRootDidAttachPingListener = !1,
  renderLanes$1 = 0,
  workInProgressRootExitStatus = 0,
  workInProgressRootFatalError = null,
  workInProgressRootSkippedLanes = 0,
  workInProgressRootInterleavedUpdatedLanes = 0,
  workInProgressRootPingedLanes = 0,
  workInProgressRootConcurrentErrors = null,
  workInProgressRootRecoverableErrors = null,
  globalMostRecentFallbackTime = 0,
  workInProgressRootRenderTargetTime = Infinity,
  workInProgressTransitions = null;
function resetRenderTimer() {
  workInProgressRootRenderTargetTime = now() + 500;
}
var hasUncaughtError = !1,
  firstUncaughtError = null,
  legacyErrorBoundariesThatAlreadyFailed = null,
  rootDoesHavePassiveEffects = !1,
  rootWithPendingPassiveEffects = null,
  pendingPassiveEffectsLanes = 0,
  pendingPassiveEffectsRemainingLanes = 0,
  pendingPassiveTransitions = null,
  nestedUpdateCount = 0,
  rootWithNestedUpdates = null,
  currentEventTime = -1,
  currentEventTransitionLane = 0;
function requestEventTime() {
  return 0 !== (executionContext & 6)
    ? now()
    : -1 !== currentEventTime
    ? currentEventTime
    : (currentEventTime = now());
}
function requestUpdateLane(fiber) {
  if (0 === (fiber.mode & 1)) return 2;
  if (0 !== (executionContext & 2) && 0 !== workInProgressRootRenderLanes)
    return workInProgressRootRenderLanes & -workInProgressRootRenderLanes;
  if (null !== ReactCurrentBatchConfig$2.transition)
    return (
      0 === currentEventTransitionLane &&
        (currentEventTransitionLane = claimNextTransitionLane()),
      currentEventTransitionLane
    );
  fiber = currentUpdatePriority;
  if (0 !== fiber) return fiber;
  fiber = window.event;
  fiber = void 0 === fiber ? 32 : getEventPriority(fiber.type);
  return fiber;
}
function scheduleUpdateOnFiber(root, fiber, lane, eventTime) {
  2 === workInProgressSuspendedReason &&
    root === workInProgressRoot &&
    (prepareFreshStack(root, 0),
    markRootSuspended$1(root, workInProgressRootRenderLanes));
  markRootUpdated(root, lane, eventTime);
  if (0 === (executionContext & 2) || root !== workInProgressRoot)
    root === workInProgressRoot &&
      (0 === (executionContext & 2) &&
        (workInProgressRootInterleavedUpdatedLanes |= lane),
      4 === workInProgressRootExitStatus &&
        markRootSuspended$1(root, workInProgressRootRenderLanes)),
      ensureRootIsScheduled(root, eventTime),
      2 === lane &&
        0 === executionContext &&
        0 === (fiber.mode & 1) &&
        (resetRenderTimer(),
        includesLegacySyncCallbacks && flushSyncCallbacks());
}
function ensureRootIsScheduled(root, currentTime) {
  var existingCallbackNode = root.callbackNode;
  markStarvedLanesAsExpired(root, currentTime);
  var nextLanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : 0
  );
  if (0 === nextLanes)
    null !== existingCallbackNode && cancelCallback(existingCallbackNode),
      (root.callbackNode = null),
      (root.callbackPriority = 0);
  else if (
    ((currentTime = nextLanes & -nextLanes),
    root.callbackPriority !== currentTime)
  ) {
    null != existingCallbackNode && cancelCallback(existingCallbackNode);
    if (0 !== (currentTime & 3))
      0 === root.tag
        ? scheduleLegacySyncCallback(performSyncWorkOnRoot.bind(null, root))
        : scheduleSyncCallback(performSyncWorkOnRoot.bind(null, root)),
        scheduleMicrotask(function () {
          0 === (executionContext & 6) && flushSyncCallbacks();
        }),
        (existingCallbackNode = null);
    else {
      switch (lanesToEventPriority(nextLanes)) {
        case 2:
          existingCallbackNode = ImmediatePriority;
          break;
        case 8:
          existingCallbackNode = UserBlockingPriority;
          break;
        case 32:
          existingCallbackNode = NormalPriority;
          break;
        case 536870912:
          existingCallbackNode = IdlePriority;
          break;
        default:
          existingCallbackNode = NormalPriority;
      }
      existingCallbackNode = scheduleCallback$2(
        existingCallbackNode,
        performConcurrentWorkOnRoot.bind(null, root)
      );
    }
    root.callbackPriority = currentTime;
    root.callbackNode = existingCallbackNode;
  }
}
function performConcurrentWorkOnRoot(root, didTimeout) {
  currentEventTime = -1;
  currentEventTransitionLane = 0;
  if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
  var originalCallbackNode = root.callbackNode;
  if (flushPassiveEffects() && root.callbackNode !== originalCallbackNode)
    return null;
  var lanes = getNextLanes(
    root,
    root === workInProgressRoot ? workInProgressRootRenderLanes : 0
  );
  if (0 === lanes) return null;
  didTimeout =
    includesBlockingLane(root, lanes) ||
    0 !== (lanes & root.expiredLanes) ||
    didTimeout
      ? renderRootSync(root, lanes)
      : renderRootConcurrent(root, lanes);
  if (0 !== didTimeout) {
    if (2 === didTimeout) {
      var originallyAttemptedLanes = lanes,
        errorRetryLanes = getLanesToRetrySynchronouslyOnError(
          root,
          originallyAttemptedLanes
        );
      0 !== errorRetryLanes &&
        ((lanes = errorRetryLanes),
        (didTimeout = recoverFromConcurrentError(
          root,
          originallyAttemptedLanes,
          errorRetryLanes
        )));
    }
    if (1 === didTimeout)
      throw (
        ((originalCallbackNode = workInProgressRootFatalError),
        prepareFreshStack(root, 0),
        markRootSuspended$1(root, lanes),
        ensureRootIsScheduled(root, now()),
        originalCallbackNode)
      );
    if (6 === didTimeout) markRootSuspended$1(root, lanes);
    else {
      errorRetryLanes = !includesBlockingLane(root, lanes);
      originallyAttemptedLanes = root.current.alternate;
      if (
        errorRetryLanes &&
        !isRenderConsistentWithExternalStores(originallyAttemptedLanes)
      ) {
        didTimeout = renderRootSync(root, lanes);
        if (2 === didTimeout) {
          errorRetryLanes = lanes;
          var errorRetryLanes$195 = getLanesToRetrySynchronouslyOnError(
            root,
            errorRetryLanes
          );
          0 !== errorRetryLanes$195 &&
            ((lanes = errorRetryLanes$195),
            (didTimeout = recoverFromConcurrentError(
              root,
              errorRetryLanes,
              errorRetryLanes$195
            )));
        }
        if (1 === didTimeout)
          throw (
            ((originalCallbackNode = workInProgressRootFatalError),
            prepareFreshStack(root, 0),
            markRootSuspended$1(root, lanes),
            ensureRootIsScheduled(root, now()),
            originalCallbackNode)
          );
      }
      root.finishedWork = originallyAttemptedLanes;
      root.finishedLanes = lanes;
      switch (didTimeout) {
        case 0:
        case 1:
          throw Error(formatProdErrorMessage(345));
        case 2:
          commitRoot(
            root,
            workInProgressRootRecoverableErrors,
            workInProgressTransitions
          );
          break;
        case 3:
          markRootSuspended$1(root, lanes);
          if (
            (lanes & 125829120) === lanes &&
            ((lanes = globalMostRecentFallbackTime + 500 - now()), 10 < lanes)
          ) {
            if (0 !== getNextLanes(root, 0)) break;
            root.timeoutHandle = scheduleTimeout(
              commitRoot.bind(
                null,
                root,
                workInProgressRootRecoverableErrors,
                workInProgressTransitions
              ),
              lanes
            );
            break;
          }
          commitRoot(
            root,
            workInProgressRootRecoverableErrors,
            workInProgressTransitions
          );
          break;
        case 4:
          markRootSuspended$1(root, lanes);
          if ((lanes & 8388480) === lanes) break;
          didTimeout = root.eventTimes;
          for (originallyAttemptedLanes = -1; 0 < lanes; )
            (errorRetryLanes$195 = 31 - clz32(lanes)),
              (errorRetryLanes = 1 << errorRetryLanes$195),
              (errorRetryLanes$195 = didTimeout[errorRetryLanes$195]),
              errorRetryLanes$195 > originallyAttemptedLanes &&
                (originallyAttemptedLanes = errorRetryLanes$195),
              (lanes &= ~errorRetryLanes);
          lanes = originallyAttemptedLanes;
          lanes = now() - lanes;
          lanes =
            (120 > lanes
              ? 120
              : 480 > lanes
              ? 480
              : 1080 > lanes
              ? 1080
              : 1920 > lanes
              ? 1920
              : 3e3 > lanes
              ? 3e3
              : 4320 > lanes
              ? 4320
              : 1960 * ceil(lanes / 1960)) - lanes;
          if (10 < lanes) {
            root.timeoutHandle = scheduleTimeout(
              commitRoot.bind(
                null,
                root,
                workInProgressRootRecoverableErrors,
                workInProgressTransitions
              ),
              lanes
            );
            break;
          }
          commitRoot(
            root,
            workInProgressRootRecoverableErrors,
            workInProgressTransitions
          );
          break;
        case 5:
          commitRoot(
            root,
            workInProgressRootRecoverableErrors,
            workInProgressTransitions
          );
          break;
        default:
          throw Error(formatProdErrorMessage(329));
      }
    }
  }
  ensureRootIsScheduled(root, now());
  return root.callbackNode === originalCallbackNode
    ? 2 === workInProgressSuspendedReason && workInProgressRoot === root
      ? ((root.callbackPriority = 0), (root.callbackNode = null))
      : performConcurrentWorkOnRoot.bind(null, root)
    : null;
}
function recoverFromConcurrentError(
  root,
  originallyAttemptedLanes,
  errorRetryLanes
) {
  var errorsFromFirstAttempt = workInProgressRootConcurrentErrors,
    wasRootDehydrated = root.current.memoizedState.isDehydrated;
  wasRootDehydrated && (prepareFreshStack(root, errorRetryLanes).flags |= 256);
  errorRetryLanes = renderRootSync(root, errorRetryLanes);
  if (2 !== errorRetryLanes) {
    if (workInProgressRootDidAttachPingListener && !wasRootDehydrated)
      return (
        (root.errorRecoveryDisabledLanes |= originallyAttemptedLanes),
        (workInProgressRootInterleavedUpdatedLanes |= originallyAttemptedLanes),
        4
      );
    root = workInProgressRootRecoverableErrors;
    workInProgressRootRecoverableErrors = errorsFromFirstAttempt;
    null !== root && queueRecoverableErrors(root);
  }
  return errorRetryLanes;
}
function queueRecoverableErrors(errors) {
  null === workInProgressRootRecoverableErrors
    ? (workInProgressRootRecoverableErrors = errors)
    : workInProgressRootRecoverableErrors.push.apply(
        workInProgressRootRecoverableErrors,
        errors
      );
}
function isRenderConsistentWithExternalStores(finishedWork) {
  for (var node = finishedWork; ; ) {
    if (node.flags & 16384) {
      var updateQueue = node.updateQueue;
      if (
        null !== updateQueue &&
        ((updateQueue = updateQueue.stores), null !== updateQueue)
      )
        for (var i = 0; i < updateQueue.length; i++) {
          var check = updateQueue[i],
            getSnapshot = check.getSnapshot;
          check = check.value;
          try {
            if (!objectIs(getSnapshot(), check)) return !1;
          } catch (error) {
            return !1;
          }
        }
    }
    updateQueue = node.child;
    if (node.subtreeFlags & 16384 && null !== updateQueue)
      (updateQueue.return = node), (node = updateQueue);
    else {
      if (node === finishedWork) break;
      for (; null === node.sibling; ) {
        if (null === node.return || node.return === finishedWork) return !0;
        node = node.return;
      }
      node.sibling.return = node.return;
      node = node.sibling;
    }
  }
  return !0;
}
function markRootSuspended$1(root, suspendedLanes) {
  suspendedLanes &= ~workInProgressRootPingedLanes;
  suspendedLanes &= ~workInProgressRootInterleavedUpdatedLanes;
  root.suspendedLanes |= suspendedLanes;
  root.pingedLanes &= ~suspendedLanes;
  for (root = root.expirationTimes; 0 < suspendedLanes; ) {
    var index$12 = 31 - clz32(suspendedLanes),
      lane = 1 << index$12;
    root[index$12] = -1;
    suspendedLanes &= ~lane;
  }
}
function performSyncWorkOnRoot(root) {
  if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
  flushPassiveEffects();
  var lanes = getNextLanes(root, 0);
  if (0 === (lanes & 3)) return ensureRootIsScheduled(root, now()), null;
  var exitStatus = renderRootSync(root, lanes);
  if (0 !== root.tag && 2 === exitStatus) {
    var originallyAttemptedLanes = lanes,
      errorRetryLanes = getLanesToRetrySynchronouslyOnError(
        root,
        originallyAttemptedLanes
      );
    0 !== errorRetryLanes &&
      ((lanes = errorRetryLanes),
      (exitStatus = recoverFromConcurrentError(
        root,
        originallyAttemptedLanes,
        errorRetryLanes
      )));
  }
  if (1 === exitStatus)
    throw (
      ((exitStatus = workInProgressRootFatalError),
      prepareFreshStack(root, 0),
      markRootSuspended$1(root, lanes),
      ensureRootIsScheduled(root, now()),
      exitStatus)
    );
  if (6 === exitStatus)
    return (
      markRootSuspended$1(root, lanes), ensureRootIsScheduled(root, now()), null
    );
  root.finishedWork = root.current.alternate;
  root.finishedLanes = lanes;
  commitRoot(
    root,
    workInProgressRootRecoverableErrors,
    workInProgressTransitions
  );
  ensureRootIsScheduled(root, now());
  return null;
}
function batchedUpdates$1(fn, a) {
  var prevExecutionContext = executionContext;
  executionContext |= 1;
  try {
    return fn(a);
  } finally {
    (executionContext = prevExecutionContext),
      0 === executionContext &&
        (resetRenderTimer(),
        includesLegacySyncCallbacks && flushSyncCallbacks());
  }
}
function flushSync(fn) {
  null !== rootWithPendingPassiveEffects &&
    0 === rootWithPendingPassiveEffects.tag &&
    0 === (executionContext & 6) &&
    flushPassiveEffects();
  var prevExecutionContext = executionContext;
  executionContext |= 1;
  var prevTransition = ReactCurrentBatchConfig$3.transition,
    previousPriority = currentUpdatePriority;
  try {
    if (
      ((ReactCurrentBatchConfig$3.transition = null),
      (currentUpdatePriority = 2),
      fn)
    )
      return fn();
  } finally {
    (currentUpdatePriority = previousPriority),
      (ReactCurrentBatchConfig$3.transition = prevTransition),
      (executionContext = prevExecutionContext),
      0 === (executionContext & 6) && flushSyncCallbacks();
  }
}
function resetWorkInProgressStack() {
  if (null !== workInProgress) {
    if (0 === workInProgressSuspendedReason)
      var interruptedWork = workInProgress.return;
    else
      resetContextDependencies(),
        resetHooksOnUnwind(),
        (interruptedWork = workInProgress);
    for (; null !== interruptedWork; )
      unwindInterruptedWork(interruptedWork.alternate, interruptedWork),
        (interruptedWork = interruptedWork.return);
    workInProgress = null;
  }
}
function prepareFreshStack(root, lanes) {
  root.finishedWork = null;
  root.finishedLanes = 0;
  var timeoutHandle = root.timeoutHandle;
  -1 !== timeoutHandle &&
    ((root.timeoutHandle = -1), cancelTimeout(timeoutHandle));
  resetWorkInProgressStack();
  workInProgressRoot = root;
  workInProgress = root = createWorkInProgress(root.current, null);
  workInProgressRootRenderLanes = renderLanes$1 = lanes;
  workInProgressSuspendedReason = 0;
  workInProgressThrownValue = null;
  workInProgressRootDidAttachPingListener = !1;
  workInProgressRootExitStatus = 0;
  workInProgressRootFatalError = null;
  workInProgressRootPingedLanes =
    workInProgressRootInterleavedUpdatedLanes =
    workInProgressRootSkippedLanes =
      0;
  workInProgressRootRecoverableErrors = workInProgressRootConcurrentErrors =
    null;
  finishQueueingConcurrentUpdates();
  return root;
}
function handleThrow(root, thrownValue) {
  ReactCurrentDispatcher$1.current = ContextOnlyDispatcher;
  ReactCurrentOwner$2.current = null;
  if (thrownValue === SuspenseException) {
    if (null === suspendedThenable) throw Error(formatProdErrorMessage(459));
    root = suspendedThenable;
    suspendedThenable = null;
    thrownValue = root;
    workInProgressSuspendedReason = shouldAttemptToSuspendUntilDataResolves()
      ? 2
      : 3;
  } else
    workInProgressSuspendedReason =
      thrownValue === SelectiveHydrationException
        ? 6
        : null !== thrownValue &&
          "object" === typeof thrownValue &&
          "function" === typeof thrownValue.then
        ? 4
        : 1;
  workInProgressThrownValue = thrownValue;
  null === workInProgress &&
    ((workInProgressRootExitStatus = 1),
    (workInProgressRootFatalError = thrownValue));
}
function shouldAttemptToSuspendUntilDataResolves() {
  if (
    0 !== (workInProgressRootSkippedLanes & 268435455) ||
    0 !== (workInProgressRootInterleavedUpdatedLanes & 268435455)
  )
    return !1;
  if (
    (workInProgressRootRenderLanes & 8388480) ===
    workInProgressRootRenderLanes
  )
    return null === shellBoundary;
  var handler = suspenseHandlerStackCursor.current;
  return null !== handler &&
    (workInProgressRootRenderLanes & 125829120) ===
      workInProgressRootRenderLanes
    ? handler === shellBoundary
    : !1;
}
function pushDispatcher(container) {
  container = getRootNode(container);
  lastCurrentDocument = getDocumentFromRoot(container);
  previousDispatcher = Dispatcher.current;
  Dispatcher.current = ReactDOMClientDispatcher;
  container = ReactCurrentDispatcher$2.current;
  ReactCurrentDispatcher$2.current = ContextOnlyDispatcher;
  return null === container ? ContextOnlyDispatcher : container;
}
function pushCacheDispatcher() {
  var prevCacheDispatcher = ReactCurrentCache.current;
  ReactCurrentCache.current = DefaultCacheDispatcher;
  return prevCacheDispatcher;
}
function renderDidSuspendDelayIfPossible() {
  workInProgressRootExitStatus = 4;
  null === workInProgressRoot ||
    (0 === (workInProgressRootSkippedLanes & 268435455) &&
      0 === (workInProgressRootInterleavedUpdatedLanes & 268435455)) ||
    markRootSuspended$1(workInProgressRoot, workInProgressRootRenderLanes);
}
function renderRootSync(root, lanes) {
  var prevExecutionContext = executionContext;
  executionContext |= 2;
  var prevDispatcher = pushDispatcher(root.containerInfo),
    prevCacheDispatcher = pushCacheDispatcher();
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes)
    (workInProgressTransitions = null), prepareFreshStack(root, lanes);
  a: do
    try {
      if (0 !== workInProgressSuspendedReason && null !== workInProgress) {
        lanes = workInProgress;
        var thrownValue = workInProgressThrownValue;
        switch (workInProgressSuspendedReason) {
          case 6:
            resetWorkInProgressStack();
            workInProgressRootExitStatus = 6;
            break a;
          default:
            (workInProgressSuspendedReason = 0),
              (workInProgressThrownValue = null),
              unwindSuspendedUnitOfWork(lanes, thrownValue);
        }
      }
      workLoopSync();
      break;
    } catch (thrownValue$198) {
      handleThrow(root, thrownValue$198);
    }
  while (1);
  resetContextDependencies();
  executionContext = prevExecutionContext;
  Dispatcher.current = previousDispatcher;
  previousDispatcher = null;
  ReactCurrentDispatcher$2.current = prevDispatcher;
  ReactCurrentCache.current = prevCacheDispatcher;
  if (null !== workInProgress) throw Error(formatProdErrorMessage(261));
  workInProgressRoot = null;
  workInProgressRootRenderLanes = 0;
  finishQueueingConcurrentUpdates();
  return workInProgressRootExitStatus;
}
function workLoopSync() {
  for (; null !== workInProgress; ) performUnitOfWork(workInProgress);
}
function renderRootConcurrent(root, lanes) {
  var prevExecutionContext = executionContext;
  executionContext |= 2;
  var prevDispatcher = pushDispatcher(root.containerInfo),
    prevCacheDispatcher = pushCacheDispatcher();
  if (workInProgressRoot !== root || workInProgressRootRenderLanes !== lanes)
    (workInProgressTransitions = null),
      resetRenderTimer(),
      prepareFreshStack(root, lanes);
  a: do
    try {
      if (0 !== workInProgressSuspendedReason && null !== workInProgress) {
        lanes = workInProgress;
        var thrownValue = workInProgressThrownValue;
        switch (workInProgressSuspendedReason) {
          case 1:
            workInProgressSuspendedReason = 0;
            workInProgressThrownValue = null;
            unwindSuspendedUnitOfWork(lanes, thrownValue);
            break;
          case 2:
            if (isThenableResolved(thrownValue)) {
              workInProgressSuspendedReason = 0;
              workInProgressThrownValue = null;
              replaySuspendedUnitOfWork(lanes);
              break;
            }
            lanes = function () {
              ensureRootIsScheduled(root, now());
            };
            thrownValue.then(lanes, lanes);
            break a;
          case 3:
            workInProgressSuspendedReason = 5;
            break a;
          case 5:
            isThenableResolved(thrownValue)
              ? ((workInProgressSuspendedReason = 0),
                (workInProgressThrownValue = null),
                replaySuspendedUnitOfWork(lanes))
              : ((workInProgressSuspendedReason = 0),
                (workInProgressThrownValue = null),
                unwindSuspendedUnitOfWork(lanes, thrownValue));
            break;
          case 4:
            workInProgressSuspendedReason = 0;
            workInProgressThrownValue = null;
            unwindSuspendedUnitOfWork(lanes, thrownValue);
            break;
          case 6:
            resetWorkInProgressStack();
            workInProgressRootExitStatus = 6;
            break a;
          default:
            throw Error(formatProdErrorMessage(462));
        }
      }
      workLoopConcurrent();
      break;
    } catch (thrownValue$200) {
      handleThrow(root, thrownValue$200);
    }
  while (1);
  resetContextDependencies();
  Dispatcher.current = previousDispatcher;
  previousDispatcher = null;
  ReactCurrentDispatcher$2.current = prevDispatcher;
  ReactCurrentCache.current = prevCacheDispatcher;
  executionContext = prevExecutionContext;
  if (null !== workInProgress) return 0;
  workInProgressRoot = null;
  workInProgressRootRenderLanes = 0;
  finishQueueingConcurrentUpdates();
  return workInProgressRootExitStatus;
}
function workLoopConcurrent() {
  for (; null !== workInProgress && !shouldYield(); )
    performUnitOfWork(workInProgress);
}
function performUnitOfWork(unitOfWork) {
  var next = beginWork$1(unitOfWork.alternate, unitOfWork, renderLanes$1);
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  null === next ? completeUnitOfWork(unitOfWork) : (workInProgress = next);
  ReactCurrentOwner$2.current = null;
}
function replaySuspendedUnitOfWork(unitOfWork) {
  var current = unitOfWork.alternate;
  switch (unitOfWork.tag) {
    case 2:
      unitOfWork.tag = 0;
    case 0:
    case 11:
      var Component = unitOfWork.type,
        unresolvedProps = unitOfWork.pendingProps;
      unresolvedProps =
        unitOfWork.elementType === Component
          ? unresolvedProps
          : resolveDefaultProps(Component, unresolvedProps);
      current = replayFunctionComponent(
        current,
        unitOfWork,
        unresolvedProps,
        Component,
        workInProgressRootRenderLanes
      );
      break;
    case 15:
      current = replayFunctionComponent(
        current,
        unitOfWork,
        unitOfWork.pendingProps,
        unitOfWork.type,
        workInProgressRootRenderLanes
      );
      break;
    default:
      resetContextDependencies(),
        resetHooksOnUnwind(),
        unwindInterruptedWork(current, unitOfWork),
        (unitOfWork = workInProgress =
          resetWorkInProgress(unitOfWork, renderLanes$1)),
        (current = beginWork$1(current, unitOfWork, renderLanes$1));
  }
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  null === current
    ? completeUnitOfWork(unitOfWork)
    : (workInProgress = current);
  ReactCurrentOwner$2.current = null;
}
function unwindSuspendedUnitOfWork(unitOfWork, thrownValue) {
  resetContextDependencies();
  resetHooksOnUnwind();
  var returnFiber = unitOfWork.return;
  if (null === returnFiber || null === workInProgressRoot)
    (workInProgressRootExitStatus = 1),
      (workInProgressRootFatalError = thrownValue),
      (workInProgress = null);
  else {
    try {
      a: {
        var root = workInProgressRoot,
          value = thrownValue;
        thrownValue = workInProgressRootRenderLanes;
        unitOfWork.flags |= 32768;
        if (
          null !== value &&
          "object" === typeof value &&
          "function" === typeof value.then
        ) {
          var wakeable = value,
            tag = unitOfWork.tag;
          if (
            0 === (unitOfWork.mode & 1) &&
            (0 === tag || 11 === tag || 15 === tag)
          ) {
            var currentSource = unitOfWork.alternate;
            currentSource
              ? ((unitOfWork.updateQueue = currentSource.updateQueue),
                (unitOfWork.memoizedState = currentSource.memoizedState),
                (unitOfWork.lanes = currentSource.lanes))
              : ((unitOfWork.updateQueue = null),
                (unitOfWork.memoizedState = null));
          }
          var suspenseBoundary = suspenseHandlerStackCursor.current;
          if (null !== suspenseBoundary) {
            switch (suspenseBoundary.tag) {
              case 13:
                unitOfWork.mode & 1 &&
                  (null === shellBoundary
                    ? renderDidSuspendDelayIfPossible()
                    : null === suspenseBoundary.alternate &&
                      0 === workInProgressRootExitStatus &&
                      (workInProgressRootExitStatus = 3));
                suspenseBoundary.flags &= -257;
                markSuspenseBoundaryShouldCapture(
                  suspenseBoundary,
                  returnFiber,
                  unitOfWork,
                  root,
                  thrownValue
                );
                var wakeables = suspenseBoundary.updateQueue;
                null === wakeables
                  ? (suspenseBoundary.updateQueue = new Set([wakeable]))
                  : wakeables.add(wakeable);
                break;
              case 22:
                if (suspenseBoundary.mode & 1) {
                  suspenseBoundary.flags |= 65536;
                  var offscreenQueue = suspenseBoundary.updateQueue;
                  if (null === offscreenQueue) {
                    var newOffscreenQueue = {
                      transitions: null,
                      markerInstances: null,
                      wakeables: new Set([wakeable])
                    };
                    suspenseBoundary.updateQueue = newOffscreenQueue;
                  } else {
                    var wakeables$97 = offscreenQueue.wakeables;
                    null === wakeables$97
                      ? (offscreenQueue.wakeables = new Set([wakeable]))
                      : wakeables$97.add(wakeable);
                  }
                  break;
                }
              default:
                throw Error(formatProdErrorMessage(435, suspenseBoundary.tag));
            }
            suspenseBoundary.mode & 1 &&
              attachPingListener(root, wakeable, thrownValue);
            break a;
          } else if (1 === root.tag) {
            attachPingListener(root, wakeable, thrownValue);
            renderDidSuspendDelayIfPossible();
            break a;
          } else value = Error(formatProdErrorMessage(426));
        } else if (
          isHydrating &&
          unitOfWork.mode & 1 &&
          ((wakeable = suspenseHandlerStackCursor.current), null !== wakeable)
        ) {
          0 === (wakeable.flags & 65536) && (wakeable.flags |= 256);
          markSuspenseBoundaryShouldCapture(
            wakeable,
            returnFiber,
            unitOfWork,
            root,
            thrownValue
          );
          queueHydrationError(createCapturedValueAtFiber(value, unitOfWork));
          break a;
        }
        root = value = createCapturedValueAtFiber(value, unitOfWork);
        4 !== workInProgressRootExitStatus &&
          (workInProgressRootExitStatus = 2);
        null === workInProgressRootConcurrentErrors
          ? (workInProgressRootConcurrentErrors = [root])
          : workInProgressRootConcurrentErrors.push(root);
        root = returnFiber;
        do {
          switch (root.tag) {
            case 3:
              var errorInfo = value;
              root.flags |= 65536;
              thrownValue &= -thrownValue;
              root.lanes |= thrownValue;
              var update = createRootErrorUpdate(root, errorInfo, thrownValue);
              enqueueCapturedUpdate(root, update);
              break a;
            case 1:
              tag = value;
              var ctor = root.type,
                instance = root.stateNode;
              if (
                0 === (root.flags & 128) &&
                ("function" === typeof ctor.getDerivedStateFromError ||
                  (null !== instance &&
                    "function" === typeof instance.componentDidCatch &&
                    (null === legacyErrorBoundariesThatAlreadyFailed ||
                      !legacyErrorBoundariesThatAlreadyFailed.has(instance))))
              ) {
                root.flags |= 65536;
                update = thrownValue & -thrownValue;
                root.lanes |= update;
                errorInfo = createClassErrorUpdate(root, tag, update);
                enqueueCapturedUpdate(root, errorInfo);
                break a;
              }
          }
          root = root.return;
        } while (null !== root);
      }
    } catch (error) {
      throw ((workInProgress = returnFiber), error);
    }
    completeUnitOfWork(unitOfWork);
  }
}
function completeUnitOfWork(unitOfWork) {
  var completedWork = unitOfWork;
  do {
    var current = completedWork.alternate;
    unitOfWork = completedWork.return;
    if (0 === (completedWork.flags & 32768)) {
      if (
        ((current = completeWork(current, completedWork, renderLanes$1)),
        null !== current)
      ) {
        workInProgress = current;
        return;
      }
    } else {
      current = unwindWork(current, completedWork);
      if (null !== current) {
        current.flags &= 16383;
        workInProgress = current;
        return;
      }
      if (null !== unitOfWork)
        (unitOfWork.flags |= 32768),
          (unitOfWork.subtreeFlags = 0),
          (unitOfWork.deletions = null);
      else {
        workInProgressRootExitStatus = 6;
        workInProgress = null;
        return;
      }
    }
    completedWork = completedWork.sibling;
    if (null !== completedWork) {
      workInProgress = completedWork;
      return;
    }
    workInProgress = completedWork = unitOfWork;
  } while (null !== completedWork);
  0 === workInProgressRootExitStatus && (workInProgressRootExitStatus = 5);
}
function commitRoot(root, recoverableErrors, transitions) {
  var previousUpdateLanePriority = currentUpdatePriority,
    prevTransition = ReactCurrentBatchConfig$3.transition;
  try {
    (ReactCurrentBatchConfig$3.transition = null),
      (currentUpdatePriority = 2),
      commitRootImpl(
        root,
        recoverableErrors,
        transitions,
        previousUpdateLanePriority
      );
  } finally {
    (ReactCurrentBatchConfig$3.transition = prevTransition),
      (currentUpdatePriority = previousUpdateLanePriority);
  }
  return null;
}
function commitRootImpl(
  root,
  recoverableErrors,
  transitions,
  renderPriorityLevel
) {
  do flushPassiveEffects();
  while (null !== rootWithPendingPassiveEffects);
  if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
  var finishedWork = root.finishedWork,
    lanes = root.finishedLanes;
  if (null === finishedWork) return null;
  root.finishedWork = null;
  root.finishedLanes = 0;
  if (finishedWork === root.current) throw Error(formatProdErrorMessage(177));
  root.callbackNode = null;
  root.callbackPriority = 0;
  var remainingLanes = finishedWork.lanes | finishedWork.childLanes;
  remainingLanes |= concurrentlyUpdatedLanes;
  markRootFinished(root, remainingLanes);
  root === workInProgressRoot &&
    ((workInProgress = workInProgressRoot = null),
    (workInProgressRootRenderLanes = 0));
  (0 === (finishedWork.subtreeFlags & 10256) &&
    0 === (finishedWork.flags & 10256)) ||
    rootDoesHavePassiveEffects ||
    ((rootDoesHavePassiveEffects = !0),
    (pendingPassiveEffectsRemainingLanes = remainingLanes),
    (pendingPassiveTransitions = transitions),
    scheduleCallback$2(NormalPriority, function () {
      flushPassiveEffects();
      return null;
    }));
  transitions = 0 !== (finishedWork.flags & 15990);
  if (0 !== (finishedWork.subtreeFlags & 15990) || transitions) {
    transitions = ReactCurrentBatchConfig$3.transition;
    ReactCurrentBatchConfig$3.transition = null;
    var previousPriority = currentUpdatePriority;
    currentUpdatePriority = 2;
    var prevExecutionContext = executionContext;
    executionContext |= 4;
    ReactCurrentOwner$2.current = null;
    var shouldFireAfterActiveInstanceBlur$203 = commitBeforeMutationEffects(
      root,
      finishedWork
    );
    commitMutationEffectsOnFiber(finishedWork, root);
    shouldFireAfterActiveInstanceBlur$203 &&
      ((_enabled = !0),
      dispatchAfterDetachedBlur(selectionInformation.focusedElem),
      (_enabled = !1));
    restoreSelection(selectionInformation);
    _enabled = !!eventsEnabled;
    selectionInformation = eventsEnabled = null;
    root.current = finishedWork;
    commitLayoutEffectOnFiber(root, finishedWork.alternate, finishedWork);
    requestPaint();
    executionContext = prevExecutionContext;
    currentUpdatePriority = previousPriority;
    ReactCurrentBatchConfig$3.transition = transitions;
  } else root.current = finishedWork;
  rootDoesHavePassiveEffects
    ? ((rootDoesHavePassiveEffects = !1),
      (rootWithPendingPassiveEffects = root),
      (pendingPassiveEffectsLanes = lanes))
    : releaseRootPooledCache(root, remainingLanes);
  remainingLanes = root.pendingLanes;
  0 === remainingLanes && (legacyErrorBoundariesThatAlreadyFailed = null);
  onCommitRoot(finishedWork.stateNode, renderPriorityLevel);
  ensureRootIsScheduled(root, now());
  if (null !== recoverableErrors)
    for (
      renderPriorityLevel = root.onRecoverableError, finishedWork = 0;
      finishedWork < recoverableErrors.length;
      finishedWork++
    )
      (lanes = recoverableErrors[finishedWork]),
        (remainingLanes = {
          digest: lanes.digest,
          componentStack: lanes.stack
        }),
        renderPriorityLevel(lanes.value, remainingLanes);
  if (hasUncaughtError)
    throw (
      ((hasUncaughtError = !1),
      (root = firstUncaughtError),
      (firstUncaughtError = null),
      root)
    );
  0 !== (pendingPassiveEffectsLanes & 3) &&
    0 !== root.tag &&
    flushPassiveEffects();
  remainingLanes = root.pendingLanes;
  0 !== (remainingLanes & 3)
    ? root === rootWithNestedUpdates
      ? nestedUpdateCount++
      : ((nestedUpdateCount = 0), (rootWithNestedUpdates = root))
    : (nestedUpdateCount = 0);
  flushSyncCallbacks();
  return null;
}
function releaseRootPooledCache(root, remainingLanes) {
  0 === (root.pooledCacheLanes &= remainingLanes) &&
    ((remainingLanes = root.pooledCache),
    null != remainingLanes &&
      ((root.pooledCache = null), releaseCache(remainingLanes)));
}
function flushPassiveEffects() {
  if (null !== rootWithPendingPassiveEffects) {
    var root$204 = rootWithPendingPassiveEffects,
      remainingLanes = pendingPassiveEffectsRemainingLanes;
    pendingPassiveEffectsRemainingLanes = 0;
    var renderPriority = lanesToEventPriority(pendingPassiveEffectsLanes),
      priority = 32 > renderPriority ? 32 : renderPriority;
    renderPriority = ReactCurrentBatchConfig$3.transition;
    var previousPriority = currentUpdatePriority;
    try {
      ReactCurrentBatchConfig$3.transition = null;
      currentUpdatePriority = priority;
      if (null === rootWithPendingPassiveEffects)
        var JSCompiler_inline_result = !1;
      else {
        priority = pendingPassiveTransitions;
        pendingPassiveTransitions = null;
        var root = rootWithPendingPassiveEffects,
          lanes = pendingPassiveEffectsLanes;
        rootWithPendingPassiveEffects = null;
        pendingPassiveEffectsLanes = 0;
        if (0 !== (executionContext & 6))
          throw Error(formatProdErrorMessage(331));
        var prevExecutionContext = executionContext;
        executionContext |= 4;
        commitPassiveUnmountOnFiber(root.current);
        commitPassiveMountOnFiber(root, root.current, lanes, priority);
        executionContext = prevExecutionContext;
        flushSyncCallbacks();
        if (
          injectedHook &&
          "function" === typeof injectedHook.onPostCommitFiberRoot
        )
          try {
            injectedHook.onPostCommitFiberRoot(rendererID, root);
          } catch (err) {}
        JSCompiler_inline_result = !0;
      }
      return JSCompiler_inline_result;
    } finally {
      (currentUpdatePriority = previousPriority),
        (ReactCurrentBatchConfig$3.transition = renderPriority),
        releaseRootPooledCache(root$204, remainingLanes);
    }
  }
  return !1;
}
function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
  sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
  sourceFiber = createRootErrorUpdate(rootFiber, sourceFiber, 2);
  rootFiber = enqueueUpdate$1(rootFiber, sourceFiber, 2);
  sourceFiber = requestEventTime();
  null !== rootFiber &&
    (markRootUpdated(rootFiber, 2, sourceFiber),
    ensureRootIsScheduled(rootFiber, sourceFiber));
}
function captureCommitPhaseError(sourceFiber, nearestMountedAncestor, error) {
  if (3 === sourceFiber.tag)
    captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
  else
    for (; null !== nearestMountedAncestor; ) {
      if (3 === nearestMountedAncestor.tag) {
        captureCommitPhaseErrorOnRoot(
          nearestMountedAncestor,
          sourceFiber,
          error
        );
        break;
      } else if (1 === nearestMountedAncestor.tag) {
        var instance = nearestMountedAncestor.stateNode;
        if (
          "function" ===
            typeof nearestMountedAncestor.type.getDerivedStateFromError ||
          ("function" === typeof instance.componentDidCatch &&
            (null === legacyErrorBoundariesThatAlreadyFailed ||
              !legacyErrorBoundariesThatAlreadyFailed.has(instance)))
        ) {
          sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
          sourceFiber = createClassErrorUpdate(
            nearestMountedAncestor,
            sourceFiber,
            2
          );
          nearestMountedAncestor = enqueueUpdate$1(
            nearestMountedAncestor,
            sourceFiber,
            2
          );
          sourceFiber = requestEventTime();
          null !== nearestMountedAncestor &&
            (markRootUpdated(nearestMountedAncestor, 2, sourceFiber),
            ensureRootIsScheduled(nearestMountedAncestor, sourceFiber));
          break;
        }
      }
      nearestMountedAncestor = nearestMountedAncestor.return;
    }
}
function attachPingListener(root, wakeable, lanes) {
  var pingCache = root.pingCache;
  if (null === pingCache) {
    pingCache = root.pingCache = new PossiblyWeakMap();
    var threadIDs = new Set();
    pingCache.set(wakeable, threadIDs);
  } else
    (threadIDs = pingCache.get(wakeable)),
      void 0 === threadIDs &&
        ((threadIDs = new Set()), pingCache.set(wakeable, threadIDs));
  threadIDs.has(lanes) ||
    ((workInProgressRootDidAttachPingListener = !0),
    threadIDs.add(lanes),
    (root = pingSuspendedRoot.bind(null, root, wakeable, lanes)),
    wakeable.then(root, root));
}
function pingSuspendedRoot(root, wakeable, pingedLanes) {
  var pingCache = root.pingCache;
  null !== pingCache && pingCache.delete(wakeable);
  wakeable = requestEventTime();
  root.pingedLanes |= root.suspendedLanes & pingedLanes;
  workInProgressRoot === root &&
    (workInProgressRootRenderLanes & pingedLanes) === pingedLanes &&
    (4 === workInProgressRootExitStatus ||
    (3 === workInProgressRootExitStatus &&
      (workInProgressRootRenderLanes & 125829120) ===
        workInProgressRootRenderLanes &&
      500 > now() - globalMostRecentFallbackTime)
      ? 0 === (executionContext & 2) && prepareFreshStack(root, 0)
      : (workInProgressRootPingedLanes |= pingedLanes));
  ensureRootIsScheduled(root, wakeable);
}
function retryTimedOutBoundary(boundaryFiber, retryLane) {
  0 === retryLane &&
    (0 === (boundaryFiber.mode & 1)
      ? (retryLane = 2)
      : ((retryLane = nextRetryLane),
        (nextRetryLane <<= 1),
        0 === (nextRetryLane & 125829120) && (nextRetryLane = 8388608)));
  var eventTime = requestEventTime();
  boundaryFiber = enqueueConcurrentRenderForLane(boundaryFiber, retryLane);
  null !== boundaryFiber &&
    (markRootUpdated(boundaryFiber, retryLane, eventTime),
    ensureRootIsScheduled(boundaryFiber, eventTime));
}
function retryDehydratedSuspenseBoundary(boundaryFiber) {
  var suspenseState = boundaryFiber.memoizedState,
    retryLane = 0;
  null !== suspenseState && (retryLane = suspenseState.retryLane);
  retryTimedOutBoundary(boundaryFiber, retryLane);
}
function resolveRetryWakeable(boundaryFiber, wakeable) {
  var retryLane = 0;
  switch (boundaryFiber.tag) {
    case 13:
      var retryCache = boundaryFiber.stateNode;
      var suspenseState = boundaryFiber.memoizedState;
      null !== suspenseState && (retryLane = suspenseState.retryLane);
      break;
    case 19:
      retryCache = boundaryFiber.stateNode;
      break;
    case 22:
      retryCache = boundaryFiber.stateNode._retryCache;
      break;
    default:
      throw Error(formatProdErrorMessage(314));
  }
  null !== retryCache && retryCache.delete(wakeable);
  retryTimedOutBoundary(boundaryFiber, retryLane);
}
var beginWork$1;
beginWork$1 = function (current, workInProgress, renderLanes) {
  if (null !== current)
    if (current.memoizedProps !== workInProgress.pendingProps)
      didReceiveUpdate = !0;
    else {
      if (
        0 === (current.lanes & renderLanes) &&
        0 === (workInProgress.flags & 128)
      )
        return (
          (didReceiveUpdate = !1),
          attemptEarlyBailoutIfNoScheduledUpdate(
            current,
            workInProgress,
            renderLanes
          )
        );
      didReceiveUpdate = 0 !== (current.flags & 131072) ? !0 : !1;
    }
  else
    (didReceiveUpdate = !1),
      isHydrating &&
        0 !== (workInProgress.flags & 1048576) &&
        pushTreeId(workInProgress, treeForkCount, workInProgress.index);
  workInProgress.lanes = 0;
  switch (workInProgress.tag) {
    case 2:
      var Component = workInProgress.type;
      resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress);
      current = workInProgress.pendingProps;
      prepareToReadContext(workInProgress, renderLanes);
      current = renderWithHooks(
        null,
        workInProgress,
        Component,
        current,
        void 0,
        renderLanes
      );
      Component = checkDidRenderIdHook();
      workInProgress.flags |= 1;
      workInProgress.tag = 0;
      isHydrating && Component && pushMaterializedTreeId(workInProgress);
      reconcileChildren(null, workInProgress, current, renderLanes);
      workInProgress = workInProgress.child;
      return workInProgress;
    case 16:
      Component = workInProgress.elementType;
      a: {
        resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress);
        current = workInProgress.pendingProps;
        var init = Component._init;
        Component = init(Component._payload);
        workInProgress.type = Component;
        init = workInProgress.tag = resolveLazyComponentTag(Component);
        current = resolveDefaultProps(Component, current);
        switch (init) {
          case 0:
            workInProgress = updateFunctionComponent(
              null,
              workInProgress,
              Component,
              current,
              renderLanes
            );
            break a;
          case 1:
            workInProgress = updateClassComponent(
              null,
              workInProgress,
              Component,
              current,
              renderLanes
            );
            break a;
          case 11:
            workInProgress = updateForwardRef(
              null,
              workInProgress,
              Component,
              current,
              renderLanes
            );
            break a;
          case 14:
            workInProgress = updateMemoComponent(
              null,
              workInProgress,
              Component,
              resolveDefaultProps(Component.type, current),
              renderLanes
            );
            break a;
        }
        throw Error(formatProdErrorMessage(306, Component, ""));
      }
      return workInProgress;
    case 0:
      return (
        (Component = workInProgress.type),
        (init = workInProgress.pendingProps),
        (init =
          workInProgress.elementType === Component
            ? init
            : resolveDefaultProps(Component, init)),
        updateFunctionComponent(
          current,
          workInProgress,
          Component,
          init,
          renderLanes
        )
      );
    case 1:
      return (
        (Component = workInProgress.type),
        (init = workInProgress.pendingProps),
        (init =
          workInProgress.elementType === Component
            ? init
            : resolveDefaultProps(Component, init)),
        updateClassComponent(
          current,
          workInProgress,
          Component,
          init,
          renderLanes
        )
      );
    case 3:
      a: {
        pushHostContainer(
          workInProgress,
          workInProgress.stateNode.containerInfo
        );
        if (null === current) throw Error(formatProdErrorMessage(387));
        Component = workInProgress.pendingProps;
        var prevState = workInProgress.memoizedState;
        init = prevState.element;
        cloneUpdateQueue(current, workInProgress);
        processUpdateQueue(workInProgress, Component, null, renderLanes);
        var nextState = workInProgress.memoizedState,
          root = workInProgress.stateNode;
        Component = nextState.cache;
        pushProvider(workInProgress, CacheContext, Component);
        Component !== prevState.cache &&
          propagateContextChange(workInProgress, CacheContext, renderLanes);
        Component = nextState.element;
        if (prevState.isDehydrated)
          if (
            ((prevState = {
              element: Component,
              isDehydrated: !1,
              cache: nextState.cache
            }),
            (workInProgress.updateQueue.baseState = prevState),
            (workInProgress.memoizedState = prevState),
            workInProgress.flags & 256)
          ) {
            init = createCapturedValueAtFiber(
              Error(formatProdErrorMessage(423)),
              workInProgress
            );
            workInProgress = mountHostRootWithoutHydrating(
              current,
              workInProgress,
              Component,
              renderLanes,
              init
            );
            break a;
          } else if (Component !== init) {
            init = createCapturedValueAtFiber(
              Error(formatProdErrorMessage(424)),
              workInProgress
            );
            workInProgress = mountHostRootWithoutHydrating(
              current,
              workInProgress,
              Component,
              renderLanes,
              init
            );
            break a;
          } else {
            nextHydratableInstance = getNextHydratable(
              workInProgress.stateNode.containerInfo.firstChild
            );
            hydrationParentFiber = workInProgress;
            isHydrating = !0;
            hydrationErrors = null;
            current = root.mutableSourceEagerHydrationData;
            if (null != current)
              for (init = 0; init < current.length; init += 2)
                (prevState = current[init]),
                  (prevState._workInProgressVersionPrimary = current[init + 1]),
                  workInProgressSources.push(prevState);
            renderLanes = mountChildFibers(
              workInProgress,
              null,
              Component,
              renderLanes
            );
            for (workInProgress.child = renderLanes; renderLanes; )
              (renderLanes.flags = (renderLanes.flags & -3) | 4096),
                (renderLanes = renderLanes.sibling);
          }
        else {
          resetHydrationState();
          if (Component === init) {
            workInProgress = bailoutOnAlreadyFinishedWork(
              current,
              workInProgress,
              renderLanes
            );
            break a;
          }
          reconcileChildren(current, workInProgress, Component, renderLanes);
        }
        workInProgress = workInProgress.child;
      }
      return workInProgress;
    case 26:
      return (
        pushHostContext(workInProgress),
        markRef(current, workInProgress),
        (workInProgress.memoizedState = getResource(
          workInProgress.type,
          workInProgress.pendingProps
        )),
        null
      );
    case 27:
      return (
        pushHostContext(workInProgress),
        null === current &&
          isHydrating &&
          ((Component = workInProgress.stateNode =
            resolveSingletonInstance(
              workInProgress.type,
              workInProgress.pendingProps,
              rootInstanceStackCursor.current
            )),
          (hydrationParentFiber = workInProgress),
          (nextHydratableInstance = getNextHydratable(Component.firstChild))),
        (Component = workInProgress.pendingProps.children),
        null !== current || isHydrating
          ? reconcileChildren(current, workInProgress, Component, renderLanes)
          : (workInProgress.child = reconcileChildFibers(
              workInProgress,
              null,
              Component,
              renderLanes
            )),
        markRef(current, workInProgress),
        workInProgress.child
      );
    case 5:
      return (
        pushHostContext(workInProgress),
        null === current && tryToClaimNextHydratableInstance(workInProgress),
        (Component = workInProgress.type),
        (init = workInProgress.pendingProps),
        (prevState = null !== current ? current.memoizedProps : null),
        (root = init.children),
        shouldSetTextContent(Component, init)
          ? (root = null)
          : null !== prevState &&
            shouldSetTextContent(Component, prevState) &&
            (workInProgress.flags |= 32),
        markRef(current, workInProgress),
        reconcileChildren(current, workInProgress, root, renderLanes),
        workInProgress.child
      );
    case 6:
      return (
        null === current && tryToClaimNextHydratableInstance(workInProgress),
        null
      );
    case 13:
      return updateSuspenseComponent(current, workInProgress, renderLanes);
    case 4:
      return (
        pushHostContainer(
          workInProgress,
          workInProgress.stateNode.containerInfo
        ),
        (Component = workInProgress.pendingProps),
        null === current
          ? (workInProgress.child = reconcileChildFibers(
              workInProgress,
              null,
              Component,
              renderLanes
            ))
          : reconcileChildren(current, workInProgress, Component, renderLanes),
        workInProgress.child
      );
    case 11:
      return (
        (Component = workInProgress.type),
        (init = workInProgress.pendingProps),
        (init =
          workInProgress.elementType === Component
            ? init
            : resolveDefaultProps(Component, init)),
        updateForwardRef(current, workInProgress, Component, init, renderLanes)
      );
    case 7:
      return (
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps,
          renderLanes
        ),
        workInProgress.child
      );
    case 8:
      return (
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps.children,
          renderLanes
        ),
        workInProgress.child
      );
    case 12:
      return (
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps.children,
          renderLanes
        ),
        workInProgress.child
      );
    case 10:
      a: {
        Component = workInProgress.type._context;
        init = workInProgress.pendingProps;
        prevState = workInProgress.memoizedProps;
        root = init.value;
        pushProvider(workInProgress, Component, root);
        if (null !== prevState)
          if (objectIs(prevState.value, root)) {
            if (prevState.children === init.children) {
              workInProgress = bailoutOnAlreadyFinishedWork(
                current,
                workInProgress,
                renderLanes
              );
              break a;
            }
          } else propagateContextChange(workInProgress, Component, renderLanes);
        reconcileChildren(current, workInProgress, init.children, renderLanes);
        workInProgress = workInProgress.child;
      }
      return workInProgress;
    case 9:
      return (
        (init = workInProgress.type),
        (Component = workInProgress.pendingProps.children),
        prepareToReadContext(workInProgress, renderLanes),
        (init = readContext(init)),
        (Component = Component(init)),
        (workInProgress.flags |= 1),
        reconcileChildren(current, workInProgress, Component, renderLanes),
        workInProgress.child
      );
    case 14:
      return (
        (Component = workInProgress.type),
        (init = resolveDefaultProps(Component, workInProgress.pendingProps)),
        (init = resolveDefaultProps(Component.type, init)),
        updateMemoComponent(
          current,
          workInProgress,
          Component,
          init,
          renderLanes
        )
      );
    case 15:
      return updateSimpleMemoComponent(
        current,
        workInProgress,
        workInProgress.type,
        workInProgress.pendingProps,
        renderLanes
      );
    case 17:
      return (
        (Component = workInProgress.type),
        (init = workInProgress.pendingProps),
        (init =
          workInProgress.elementType === Component
            ? init
            : resolveDefaultProps(Component, init)),
        resetSuspendedCurrentOnMountInLegacyMode(current, workInProgress),
        (workInProgress.tag = 1),
        prepareToReadContext(workInProgress, renderLanes),
        constructClassInstance(workInProgress, Component, init),
        mountClassInstance(workInProgress, Component, init, renderLanes),
        finishClassComponent(
          null,
          workInProgress,
          Component,
          !0,
          !1,
          renderLanes
        )
      );
    case 19:
      return updateSuspenseListComponent(current, workInProgress, renderLanes);
    case 21:
      return (
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps.children,
          renderLanes
        ),
        workInProgress.child
      );
    case 22:
      return updateOffscreenComponent(current, workInProgress, renderLanes);
    case 24:
      return (
        prepareToReadContext(workInProgress, renderLanes),
        (Component = readContext(CacheContext)),
        null === current
          ? ((init = peekCacheFromPool()),
            null === init &&
              ((init = workInProgressRoot),
              (prevState = createCache()),
              (init.pooledCache = prevState),
              prevState.refCount++,
              null !== prevState && (init.pooledCacheLanes |= renderLanes),
              (init = prevState)),
            (workInProgress.memoizedState = { parent: Component, cache: init }),
            initializeUpdateQueue(workInProgress),
            pushProvider(workInProgress, CacheContext, init))
          : (0 !== (current.lanes & renderLanes) &&
              (cloneUpdateQueue(current, workInProgress),
              processUpdateQueue(workInProgress, null, null, renderLanes)),
            (init = current.memoizedState),
            (prevState = workInProgress.memoizedState),
            init.parent !== Component
              ? ((init = { parent: Component, cache: Component }),
                (workInProgress.memoizedState = init),
                0 === workInProgress.lanes &&
                  (workInProgress.memoizedState =
                    workInProgress.updateQueue.baseState =
                      init),
                pushProvider(workInProgress, CacheContext, Component))
              : ((Component = prevState.cache),
                pushProvider(workInProgress, CacheContext, Component),
                Component !== init.cache &&
                  propagateContextChange(
                    workInProgress,
                    CacheContext,
                    renderLanes
                  ))),
        reconcileChildren(
          current,
          workInProgress,
          workInProgress.pendingProps.children,
          renderLanes
        ),
        workInProgress.child
      );
  }
  throw Error(formatProdErrorMessage(156, workInProgress.tag));
};
function scheduleCallback$2(priorityLevel, callback) {
  return scheduleCallback(priorityLevel, callback);
}
function FiberNode(tag, pendingProps, key, mode) {
  this.tag = tag;
  this.key = key;
  this.sibling =
    this.child =
    this.return =
    this.stateNode =
    this.type =
    this.elementType =
      null;
  this.index = 0;
  this.refCleanup = this.ref = null;
  this.pendingProps = pendingProps;
  this.dependencies =
    this.memoizedState =
    this.updateQueue =
    this.memoizedProps =
      null;
  this.mode = mode;
  this.subtreeFlags = this.flags = 0;
  this.deletions = null;
  this.childLanes = this.lanes = 0;
  this.alternate = null;
}
function createFiber(tag, pendingProps, key, mode) {
  return new FiberNode(tag, pendingProps, key, mode);
}
function shouldConstruct(Component) {
  Component = Component.prototype;
  return !(!Component || !Component.isReactComponent);
}
function resolveLazyComponentTag(Component) {
  if ("function" === typeof Component)
    return shouldConstruct(Component) ? 1 : 0;
  if (void 0 !== Component && null !== Component) {
    Component = Component.$$typeof;
    if (Component === REACT_FORWARD_REF_TYPE) return 11;
    if (Component === REACT_MEMO_TYPE) return 14;
  }
  return 2;
}
function createWorkInProgress(current, pendingProps) {
  var workInProgress = current.alternate;
  null === workInProgress
    ? ((workInProgress = createFiber(
        current.tag,
        pendingProps,
        current.key,
        current.mode
      )),
      (workInProgress.elementType = current.elementType),
      (workInProgress.type = current.type),
      (workInProgress.stateNode = current.stateNode),
      (workInProgress.alternate = current),
      (current.alternate = workInProgress))
    : ((workInProgress.pendingProps = pendingProps),
      (workInProgress.type = current.type),
      (workInProgress.flags = 0),
      (workInProgress.subtreeFlags = 0),
      (workInProgress.deletions = null));
  workInProgress.flags = current.flags & 14680064;
  workInProgress.childLanes = current.childLanes;
  workInProgress.lanes = current.lanes;
  workInProgress.child = current.child;
  workInProgress.memoizedProps = current.memoizedProps;
  workInProgress.memoizedState = current.memoizedState;
  workInProgress.updateQueue = current.updateQueue;
  pendingProps = current.dependencies;
  workInProgress.dependencies =
    null === pendingProps
      ? null
      : { lanes: pendingProps.lanes, firstContext: pendingProps.firstContext };
  workInProgress.sibling = current.sibling;
  workInProgress.index = current.index;
  workInProgress.ref = current.ref;
  workInProgress.refCleanup = current.refCleanup;
  return workInProgress;
}
function resetWorkInProgress(workInProgress, renderLanes) {
  workInProgress.flags &= 14680066;
  var current = workInProgress.alternate;
  null === current
    ? ((workInProgress.childLanes = 0),
      (workInProgress.lanes = renderLanes),
      (workInProgress.child = null),
      (workInProgress.subtreeFlags = 0),
      (workInProgress.memoizedProps = null),
      (workInProgress.memoizedState = null),
      (workInProgress.updateQueue = null),
      (workInProgress.dependencies = null),
      (workInProgress.stateNode = null))
    : ((workInProgress.childLanes = current.childLanes),
      (workInProgress.lanes = current.lanes),
      (workInProgress.child = current.child),
      (workInProgress.subtreeFlags = 0),
      (workInProgress.deletions = null),
      (workInProgress.memoizedProps = current.memoizedProps),
      (workInProgress.memoizedState = current.memoizedState),
      (workInProgress.updateQueue = current.updateQueue),
      (workInProgress.type = current.type),
      (renderLanes = current.dependencies),
      (workInProgress.dependencies =
        null === renderLanes
          ? null
          : {
              lanes: renderLanes.lanes,
              firstContext: renderLanes.firstContext
            }));
  return workInProgress;
}
function createFiberFromTypeAndProps(
  type,
  key,
  pendingProps,
  owner,
  mode,
  lanes
) {
  var fiberTag = 2;
  owner = type;
  if ("function" === typeof type) shouldConstruct(type) && (fiberTag = 1);
  else if ("string" === typeof type)
    fiberTag = isHostResourceType(
      type,
      pendingProps,
      contextStackCursor.current
    )
      ? 26
      : "html" === type || "head" === type || "body" === type
      ? 27
      : 5;
  else
    a: switch (type) {
      case REACT_FRAGMENT_TYPE:
        return createFiberFromFragment(pendingProps.children, mode, lanes, key);
      case REACT_STRICT_MODE_TYPE:
        fiberTag = 8;
        mode |= 8;
        0 !== (mode & 1) && (mode |= 16);
        break;
      case REACT_PROFILER_TYPE:
        return (
          (type = createFiber(12, pendingProps, key, mode | 2)),
          (type.elementType = REACT_PROFILER_TYPE),
          (type.lanes = lanes),
          type
        );
      case REACT_SUSPENSE_TYPE:
        return (
          (type = createFiber(13, pendingProps, key, mode)),
          (type.elementType = REACT_SUSPENSE_TYPE),
          (type.lanes = lanes),
          type
        );
      case REACT_SUSPENSE_LIST_TYPE:
        return (
          (type = createFiber(19, pendingProps, key, mode)),
          (type.elementType = REACT_SUSPENSE_LIST_TYPE),
          (type.lanes = lanes),
          type
        );
      case REACT_OFFSCREEN_TYPE:
        return createFiberFromOffscreen(pendingProps, mode, lanes, key);
      case REACT_LEGACY_HIDDEN_TYPE:
      case REACT_SCOPE_TYPE:
        return (
          (key = createFiber(21, pendingProps, key, mode)),
          (key.type = type),
          (key.elementType = type),
          (key.lanes = lanes),
          key
        );
      case REACT_CACHE_TYPE:
        return (
          (type = createFiber(24, pendingProps, key, mode)),
          (type.elementType = REACT_CACHE_TYPE),
          (type.lanes = lanes),
          type
        );
      default:
        if ("object" === typeof type && null !== type)
          switch (type.$$typeof) {
            case REACT_PROVIDER_TYPE:
              fiberTag = 10;
              break a;
            case REACT_CONTEXT_TYPE:
              fiberTag = 9;
              break a;
            case REACT_FORWARD_REF_TYPE:
              fiberTag = 11;
              break a;
            case REACT_MEMO_TYPE:
              fiberTag = 14;
              break a;
            case REACT_LAZY_TYPE:
              fiberTag = 16;
              owner = null;
              break a;
          }
        throw Error(
          formatProdErrorMessage(130, null == type ? type : typeof type, "")
        );
    }
  key = createFiber(fiberTag, pendingProps, key, mode);
  key.elementType = type;
  key.type = owner;
  key.lanes = lanes;
  return key;
}
function createFiberFromFragment(elements, mode, lanes, key) {
  elements = createFiber(7, elements, key, mode);
  elements.lanes = lanes;
  return elements;
}
function createFiberFromOffscreen(pendingProps, mode, lanes, key) {
  pendingProps = createFiber(22, pendingProps, key, mode);
  pendingProps.elementType = REACT_OFFSCREEN_TYPE;
  pendingProps.lanes = lanes;
  var primaryChildInstance = {
    _visibility: 1,
    _pendingVisibility: 1,
    _pendingMarkers: null,
    _retryCache: null,
    _transitions: null,
    _current: null,
    detach: function () {
      var fiber = primaryChildInstance._current;
      if (null === fiber) throw Error(formatProdErrorMessage(456));
      if (0 === (primaryChildInstance._pendingVisibility & 2)) {
        var root = enqueueConcurrentRenderForLane(fiber, 2);
        null !== root &&
          ((primaryChildInstance._pendingVisibility |= 2),
          scheduleUpdateOnFiber(root, fiber, 2, -1));
      }
    },
    attach: function () {
      var fiber = primaryChildInstance._current;
      if (null === fiber) throw Error(formatProdErrorMessage(456));
      if (0 !== (primaryChildInstance._pendingVisibility & 2)) {
        var root = enqueueConcurrentRenderForLane(fiber, 2);
        null !== root &&
          ((primaryChildInstance._pendingVisibility &= -3),
          scheduleUpdateOnFiber(root, fiber, 2, -1));
      }
    }
  };
  pendingProps.stateNode = primaryChildInstance;
  return pendingProps;
}
function createFiberFromText(content, mode, lanes) {
  content = createFiber(6, content, null, mode);
  content.lanes = lanes;
  return content;
}
function createFiberFromPortal(portal, mode, lanes) {
  mode = createFiber(
    4,
    null !== portal.children ? portal.children : [],
    portal.key,
    mode
  );
  mode.lanes = lanes;
  mode.stateNode = {
    containerInfo: portal.containerInfo,
    pendingChildren: null,
    implementation: portal.implementation
  };
  return mode;
}
function FiberRootNode(
  containerInfo,
  tag,
  hydrate,
  identifierPrefix,
  onRecoverableError
) {
  this.tag = tag;
  this.containerInfo = containerInfo;
  this.finishedWork =
    this.pingCache =
    this.current =
    this.pendingChildren =
      null;
  this.timeoutHandle = -1;
  this.callbackNode = this.pendingContext = this.context = null;
  this.callbackPriority = 0;
  this.eventTimes = createLaneMap(0);
  this.expirationTimes = createLaneMap(-1);
  this.entangledLanes =
    this.errorRecoveryDisabledLanes =
    this.finishedLanes =
    this.mutableReadLanes =
    this.expiredLanes =
    this.pingedLanes =
    this.suspendedLanes =
    this.pendingLanes =
      0;
  this.entanglements = createLaneMap(0);
  this.hiddenUpdates = createLaneMap(null);
  this.identifierPrefix = identifierPrefix;
  this.onRecoverableError = onRecoverableError;
  this.pooledCache = null;
  this.pooledCacheLanes = 0;
  this.hydrationCallbacks = this.mutableSourceEagerHydrationData = null;
  this.incompleteTransitions = new Map();
}
function createFiberRoot(
  containerInfo,
  tag,
  hydrate,
  initialChildren,
  hydrationCallbacks,
  isStrictMode,
  concurrentUpdatesByDefaultOverride,
  identifierPrefix,
  onRecoverableError
) {
  containerInfo = new FiberRootNode(
    containerInfo,
    tag,
    hydrate,
    identifierPrefix,
    onRecoverableError
  );
  containerInfo.hydrationCallbacks = hydrationCallbacks;
  1 === tag
    ? ((tag = 1),
      !0 === isStrictMode && (tag |= 24),
      concurrentUpdatesByDefaultOverride && (tag |= 32))
    : (tag = 0);
  isStrictMode = createFiber(3, null, null, tag);
  containerInfo.current = isStrictMode;
  isStrictMode.stateNode = containerInfo;
  concurrentUpdatesByDefaultOverride = createCache();
  concurrentUpdatesByDefaultOverride.refCount++;
  containerInfo.pooledCache = concurrentUpdatesByDefaultOverride;
  concurrentUpdatesByDefaultOverride.refCount++;
  isStrictMode.memoizedState = {
    element: initialChildren,
    isDehydrated: hydrate,
    cache: concurrentUpdatesByDefaultOverride
  };
  initializeUpdateQueue(isStrictMode);
  return containerInfo;
}
function createPortal(children, containerInfo, implementation) {
  var key =
    3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
  return {
    $$typeof: REACT_PORTAL_TYPE,
    key: null == key ? null : "" + key,
    children: children,
    containerInfo: containerInfo,
    implementation: implementation
  };
}
function updateContainer(element, container, parentComponent, callback) {
  parentComponent = container.current;
  var eventTime = requestEventTime(),
    lane = requestUpdateLane(parentComponent);
  null === container.context
    ? (container.context = emptyContextObject)
    : (container.pendingContext = emptyContextObject);
  container = createUpdate(eventTime, lane);
  container.payload = { element: element };
  callback = void 0 === callback ? null : callback;
  null !== callback && (container.callback = callback);
  element = enqueueUpdate$1(parentComponent, container, lane);
  null !== element &&
    (scheduleUpdateOnFiber(element, parentComponent, lane, eventTime),
    entangleTransitions(element, parentComponent, lane));
  return lane;
}
function markRetryLaneImpl(fiber, retryLane) {
  fiber = fiber.memoizedState;
  if (null !== fiber && null !== fiber.dehydrated) {
    var a = fiber.retryLane;
    fiber.retryLane = 0 !== a && a < retryLane ? a : retryLane;
  }
}
function markRetryLaneIfNotHydrated(fiber, retryLane) {
  markRetryLaneImpl(fiber, retryLane);
  (fiber = fiber.alternate) && markRetryLaneImpl(fiber, retryLane);
}
function emptyFindFiberByHostInstance() {
  return null;
}
var Dispatcher$1 = Internals.Dispatcher,
  defaultOnRecoverableError =
    "function" === typeof reportError
      ? reportError
      : function (error) {
          console.error(error);
        };
function ReactDOMRoot(internalRoot) {
  this._internalRoot = internalRoot;
}
ReactDOMHydrationRoot.prototype.render = ReactDOMRoot.prototype.render =
  function (children) {
    var root = this._internalRoot;
    if (null === root) throw Error(formatProdErrorMessage(409));
    updateContainer(children, root, null, null);
  };
ReactDOMHydrationRoot.prototype.unmount = ReactDOMRoot.prototype.unmount =
  function () {
    var root = this._internalRoot;
    if (null !== root) {
      this._internalRoot = null;
      var container = root.containerInfo;
      flushSync(function () {
        updateContainer(null, root, null, null);
      });
      container[internalContainerInstanceKey] = null;
    }
  };
function ReactDOMHydrationRoot(internalRoot) {
  this._internalRoot = internalRoot;
}
ReactDOMHydrationRoot.prototype.unstable_scheduleHydration = function (target) {
  if (target) {
    var updatePriority = getCurrentUpdatePriority$1();
    target = { blockedOn: null, target: target, priority: updatePriority };
    for (
      var i = 0;
      i < queuedExplicitHydrationTargets.length &&
      0 !== updatePriority &&
      updatePriority < queuedExplicitHydrationTargets[i].priority;
      i++
    );
    queuedExplicitHydrationTargets.splice(i, 0, target);
    0 === i && attemptExplicitHydrationTarget(target);
  }
};
function isValidContainer(node) {
  return !(
    !node ||
    (1 !== node.nodeType && 9 !== node.nodeType && 11 !== node.nodeType)
  );
}
function registerReactDOMEvent(target, domEventName, isCapturePhaseListener) {
  if (
    1 !== target.nodeType &&
    "function" !== typeof target.getChildContextValues
  )
    if ("function" === typeof target.addEventListener) {
      var eventSystemFlags = 1,
        listenerSet = getEventListenerSet(target),
        listenerSetKey =
          domEventName + "__" + (isCapturePhaseListener ? "capture" : "bubble");
      listenerSet.has(listenerSetKey) ||
        (isCapturePhaseListener && (eventSystemFlags |= 4),
        addTrappedEventListener(
          target,
          domEventName,
          eventSystemFlags,
          isCapturePhaseListener
        ),
        listenerSet.add(listenerSetKey));
    } else throw Error(formatProdErrorMessage(369));
}
_attemptSynchronousHydration = function (fiber) {
  switch (fiber.tag) {
    case 3:
      var root$206 = fiber.stateNode;
      if (root$206.current.memoizedState.isDehydrated) {
        var lanes = getHighestPriorityLanes(root$206.pendingLanes);
        0 !== lanes &&
          (markRootEntangled(root$206, lanes | 2),
          ensureRootIsScheduled(root$206, now()),
          0 === (executionContext & 6) &&
            (resetRenderTimer(), flushSyncCallbacks()));
      }
      break;
    case 13:
      flushSync(function () {
        var root = enqueueConcurrentRenderForLane(fiber, 2);
        if (null !== root) {
          var eventTime = requestEventTime();
          scheduleUpdateOnFiber(root, fiber, 2, eventTime);
        }
      }),
        markRetryLaneIfNotHydrated(fiber, 2);
  }
};
attemptContinuousHydration = function (fiber) {
  if (13 === fiber.tag) {
    var root = enqueueConcurrentRenderForLane(fiber, 134217728);
    if (null !== root) {
      var eventTime = requestEventTime();
      scheduleUpdateOnFiber(root, fiber, 134217728, eventTime);
    }
    markRetryLaneIfNotHydrated(fiber, 134217728);
  }
};
attemptHydrationAtCurrentPriority = function (fiber) {
  if (13 === fiber.tag) {
    var lane = requestUpdateLane(fiber),
      root = enqueueConcurrentRenderForLane(fiber, lane);
    if (null !== root) {
      var eventTime = requestEventTime();
      scheduleUpdateOnFiber(root, fiber, lane, eventTime);
    }
    markRetryLaneIfNotHydrated(fiber, lane);
  }
};
getCurrentUpdatePriority$1 = function () {
  return currentUpdatePriority;
};
attemptHydrationAtPriority = runWithPriority;
restoreImpl = function (domElement, tag, props) {
  switch (tag) {
    case "input":
      updateWrapper(domElement, props);
      tag = props.name;
      if ("radio" === props.type && null != tag) {
        for (props = domElement; props.parentNode; ) props = props.parentNode;
        props = props.querySelectorAll(
          "input[name=" + JSON.stringify("" + tag) + '][type="radio"]'
        );
        for (tag = 0; tag < props.length; tag++) {
          var otherNode = props[tag];
          if (otherNode !== domElement && otherNode.form === domElement.form) {
            var otherProps = getFiberCurrentPropsFromNode(otherNode);
            if (!otherProps) throw Error(formatProdErrorMessage(90));
            updateValueIfChanged(otherNode);
            updateWrapper(otherNode, otherProps);
          }
        }
      }
      break;
    case "textarea":
      updateWrapper$1(domElement, props);
      break;
    case "select":
      (tag = props.value),
        null != tag && updateOptions(domElement, !!props.multiple, tag, !1);
  }
};
batchedUpdatesImpl = batchedUpdates$1;
flushSyncImpl = flushSync;
Internals.Events = [
  getInstanceFromNode,
  getNodeFromInstance,
  getFiberCurrentPropsFromNode,
  enqueueStateRestore,
  restoreStateIfNeeded,
  batchedUpdates$1
];
var devToolsConfig$jscomp$inline_1673 = {
  findFiberByHostInstance: getClosestInstanceFromNode,
  bundleType: 0,
  version: "18.3.0-www-modern-3ff1540e9-20230209",
  rendererPackageName: "react-dom"
};
var internals$jscomp$inline_2072 = {
  bundleType: devToolsConfig$jscomp$inline_1673.bundleType,
  version: devToolsConfig$jscomp$inline_1673.version,
  rendererPackageName: devToolsConfig$jscomp$inline_1673.rendererPackageName,
  rendererConfig: devToolsConfig$jscomp$inline_1673.rendererConfig,
  overrideHookState: null,
  overrideHookStateDeletePath: null,
  overrideHookStateRenamePath: null,
  overrideProps: null,
  overridePropsDeletePath: null,
  overridePropsRenamePath: null,
  setErrorHandler: null,
  setSuspenseHandler: null,
  scheduleUpdate: null,
  currentDispatcherRef: ReactSharedInternals.ReactCurrentDispatcher,
  findHostInstanceByFiber: function (fiber) {
    fiber = findCurrentFiberUsingSlowPath(fiber);
    fiber = null !== fiber ? findCurrentHostFiberImpl(fiber) : null;
    return null === fiber ? null : fiber.stateNode;
  },
  findFiberByHostInstance:
    devToolsConfig$jscomp$inline_1673.findFiberByHostInstance ||
    emptyFindFiberByHostInstance,
  findHostInstancesForRefresh: null,
  scheduleRefresh: null,
  scheduleRoot: null,
  setRefreshHandler: null,
  getCurrentFiber: null,
  reconcilerVersion: "18.3.0-next-3ff1540e9-20230209"
};
if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
  var hook$jscomp$inline_2073 = __REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (
    !hook$jscomp$inline_2073.isDisabled &&
    hook$jscomp$inline_2073.supportsFiber
  )
    try {
      (rendererID = hook$jscomp$inline_2073.inject(
        internals$jscomp$inline_2072
      )),
        (injectedHook = hook$jscomp$inline_2073);
    } catch (err) {}
}
exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Internals;
exports.createComponentSelector = function (component) {
  return { $$typeof: COMPONENT_TYPE, value: component };
};
exports.createHasPseudoClassSelector = function (selectors) {
  return { $$typeof: HAS_PSEUDO_CLASS_TYPE, value: selectors };
};
exports.createPortal = function (children, container) {
  var key =
    2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
  if (!isValidContainer(container)) throw Error(formatProdErrorMessage(200));
  return createPortal(children, container, null, key);
};
exports.createRoleSelector = function (role) {
  return { $$typeof: ROLE_TYPE, value: role };
};
exports.createRoot = function (container, options) {
  if (!isValidContainer(container)) throw Error(formatProdErrorMessage(299));
  var isStrictMode = !1,
    concurrentUpdatesByDefaultOverride = !1,
    identifierPrefix = "",
    onRecoverableError = defaultOnRecoverableError;
  null !== options &&
    void 0 !== options &&
    (!0 === options.unstable_strictMode && (isStrictMode = !0),
    !0 === options.unstable_concurrentUpdatesByDefault &&
      (concurrentUpdatesByDefaultOverride = !0),
    void 0 !== options.identifierPrefix &&
      (identifierPrefix = options.identifierPrefix),
    void 0 !== options.onRecoverableError &&
      (onRecoverableError = options.onRecoverableError));
  options = createFiberRoot(
    container,
    1,
    !1,
    null,
    null,
    isStrictMode,
    concurrentUpdatesByDefaultOverride,
    identifierPrefix,
    onRecoverableError
  );
  container[internalContainerInstanceKey] = options.current;
  Dispatcher$1.current = ReactDOMClientDispatcher;
  listenToAllSupportedEvents(
    8 === container.nodeType ? container.parentNode : container
  );
  return new ReactDOMRoot(options);
};
exports.createTestNameSelector = function (id) {
  return { $$typeof: TEST_NAME_TYPE, value: id };
};
exports.createTextSelector = function (text) {
  return { $$typeof: TEXT_TYPE, value: text };
};
exports.findAllNodes = findAllNodes;
exports.findBoundingRects = function (hostRoot, selectors) {
  selectors = findAllNodes(hostRoot, selectors);
  hostRoot = [];
  for (var i = 0; i < selectors.length; i++)
    hostRoot.push(getBoundingRect(selectors[i]));
  for (selectors = hostRoot.length - 1; 0 < selectors; selectors--) {
    i = hostRoot[selectors];
    for (
      var targetLeft = i.x,
        targetRight = targetLeft + i.width,
        targetTop = i.y,
        targetBottom = targetTop + i.height,
        j = selectors - 1;
      0 <= j;
      j--
    )
      if (selectors !== j) {
        var otherRect = hostRoot[j],
          otherLeft = otherRect.x,
          otherRight = otherLeft + otherRect.width,
          otherTop = otherRect.y,
          otherBottom = otherTop + otherRect.height;
        if (
          targetLeft >= otherLeft &&
          targetTop >= otherTop &&
          targetRight <= otherRight &&
          targetBottom <= otherBottom
        ) {
          hostRoot.splice(selectors, 1);
          break;
        } else if (
          !(
            targetLeft !== otherLeft ||
            i.width !== otherRect.width ||
            otherBottom < targetTop ||
            otherTop > targetBottom
          )
        ) {
          otherTop > targetTop &&
            ((otherRect.height += otherTop - targetTop),
            (otherRect.y = targetTop));
          otherBottom < targetBottom &&
            (otherRect.height = targetBottom - otherTop);
          hostRoot.splice(selectors, 1);
          break;
        } else if (
          !(
            targetTop !== otherTop ||
            i.height !== otherRect.height ||
            otherRight < targetLeft ||
            otherLeft > targetRight
          )
        ) {
          otherLeft > targetLeft &&
            ((otherRect.width += otherLeft - targetLeft),
            (otherRect.x = targetLeft));
          otherRight < targetRight &&
            (otherRect.width = targetRight - otherLeft);
          hostRoot.splice(selectors, 1);
          break;
        }
      }
  }
  return hostRoot;
};
exports.flushSync = function (fn) {
  return flushSync(fn);
};
exports.focusWithin = function (hostRoot, selectors) {
  hostRoot = findFiberRootForHostRoot(hostRoot);
  selectors = findPaths(hostRoot, selectors);
  selectors = Array.from(selectors);
  for (hostRoot = 0; hostRoot < selectors.length; ) {
    var fiber = selectors[hostRoot++],
      tag = fiber.tag;
    if (!isHiddenSubtree(fiber)) {
      if (
        (5 === tag || 26 === tag || 27 === tag) &&
        setFocusIfFocusable(fiber.stateNode)
      )
        return !0;
      for (fiber = fiber.child; null !== fiber; )
        selectors.push(fiber), (fiber = fiber.sibling);
    }
  }
  return !1;
};
exports.getFindAllNodesFailureDescription = function (hostRoot, selectors) {
  var maxSelectorIndex = 0,
    matchedNames = [];
  hostRoot = [findFiberRootForHostRoot(hostRoot), 0];
  for (var index = 0; index < hostRoot.length; ) {
    var fiber = hostRoot[index++],
      tag = fiber.tag,
      selectorIndex = hostRoot[index++],
      selector = selectors[selectorIndex];
    if ((5 !== tag && 26 !== tag && 27 !== tag) || !isHiddenSubtree(fiber))
      if (
        (matchSelector(fiber, selector) &&
          (matchedNames.push(selectorToString(selector)),
          selectorIndex++,
          selectorIndex > maxSelectorIndex &&
            (maxSelectorIndex = selectorIndex)),
        selectorIndex < selectors.length)
      )
        for (fiber = fiber.child; null !== fiber; )
          hostRoot.push(fiber, selectorIndex), (fiber = fiber.sibling);
  }
  if (maxSelectorIndex < selectors.length) {
    for (hostRoot = []; maxSelectorIndex < selectors.length; maxSelectorIndex++)
      hostRoot.push(selectorToString(selectors[maxSelectorIndex]));
    return (
      "findAllNodes was able to match part of the selector:\n  " +
      (matchedNames.join(" > ") +
        "\n\nNo matching component was found for:\n  ") +
      hostRoot.join(" > ")
    );
  }
  return null;
};
exports.hydrateRoot = function (container, initialChildren, options) {
  if (!isValidContainer(container)) throw Error(formatProdErrorMessage(405));
  var mutableSources = (null != options && options.hydratedSources) || null,
    isStrictMode = !1,
    concurrentUpdatesByDefaultOverride = !1,
    identifierPrefix = "",
    onRecoverableError = defaultOnRecoverableError;
  null !== options &&
    void 0 !== options &&
    (!0 === options.unstable_strictMode && (isStrictMode = !0),
    !0 === options.unstable_concurrentUpdatesByDefault &&
      (concurrentUpdatesByDefaultOverride = !0),
    void 0 !== options.identifierPrefix &&
      (identifierPrefix = options.identifierPrefix),
    void 0 !== options.onRecoverableError &&
      (onRecoverableError = options.onRecoverableError));
  initialChildren = createFiberRoot(
    container,
    1,
    !0,
    initialChildren,
    null != options ? options : null,
    isStrictMode,
    concurrentUpdatesByDefaultOverride,
    identifierPrefix,
    onRecoverableError
  );
  initialChildren.context = emptyContextObject;
  options = initialChildren.current;
  isStrictMode = requestEventTime();
  concurrentUpdatesByDefaultOverride = requestUpdateLane(options);
  identifierPrefix = createUpdate(
    isStrictMode,
    concurrentUpdatesByDefaultOverride
  );
  identifierPrefix.callback = null;
  enqueueUpdate$1(
    options,
    identifierPrefix,
    concurrentUpdatesByDefaultOverride
  );
  initialChildren.current.lanes = concurrentUpdatesByDefaultOverride;
  markRootUpdated(
    initialChildren,
    concurrentUpdatesByDefaultOverride,
    isStrictMode
  );
  ensureRootIsScheduled(initialChildren, isStrictMode);
  container[internalContainerInstanceKey] = initialChildren.current;
  Dispatcher$1.current = ReactDOMClientDispatcher;
  listenToAllSupportedEvents(container);
  if (mutableSources)
    for (container = 0; container < mutableSources.length; container++)
      (options = mutableSources[container]),
        (isStrictMode = options._getVersion),
        (isStrictMode = isStrictMode(options._source)),
        null == initialChildren.mutableSourceEagerHydrationData
          ? (initialChildren.mutableSourceEagerHydrationData = [
              options,
              isStrictMode
            ])
          : initialChildren.mutableSourceEagerHydrationData.push(
              options,
              isStrictMode
            );
  return new ReactDOMHydrationRoot(initialChildren);
};
exports.observeVisibleRects = function (
  hostRoot,
  selectors,
  callback,
  options
) {
  hostRoot = findAllNodes(hostRoot, selectors);
  var disconnect = setupIntersectionObserver(
    hostRoot,
    callback,
    options
  ).disconnect;
  return {
    disconnect: function () {
      disconnect();
    }
  };
};
exports.preinit = function () {
  var dispatcher = Internals.Dispatcher.current;
  dispatcher && dispatcher.preinit.apply(this, arguments);
};
exports.preload = function () {
  var dispatcher = Internals.Dispatcher.current;
  dispatcher && dispatcher.preload.apply(this, arguments);
};
exports.unstable_batchedUpdates = batchedUpdates$1;
exports.unstable_createEventHandle = function (type, options) {
  function eventHandle(target, callback) {
    if ("function" !== typeof callback)
      throw Error(formatProdErrorMessage(370));
    doesTargetHaveEventHandle(target, eventHandle) ||
      (addEventHandleToTarget(target, eventHandle),
      registerReactDOMEvent(target, type, isCapturePhaseListener));
    var listener = {
        callback: callback,
        capture: isCapturePhaseListener,
        type: type
      },
      targetListeners = target[internalEventHandlerListenersKey] || null;
    null === targetListeners &&
      ((targetListeners = new Set()),
      (target[internalEventHandlerListenersKey] = targetListeners));
    targetListeners.add(listener);
    return function () {
      targetListeners.delete(listener);
    };
  }
  if (!allNativeEvents.has(type))
    throw Error(formatProdErrorMessage(372, type));
  var isCapturePhaseListener = !1;
  null != options &&
    ((options = options.capture),
    "boolean" === typeof options && (isCapturePhaseListener = options));
  return eventHandle;
};
exports.unstable_flushControlled = function (fn) {
  var prevExecutionContext = executionContext;
  executionContext |= 1;
  var prevTransition = ReactCurrentBatchConfig$3.transition,
    previousPriority = currentUpdatePriority;
  try {
    (ReactCurrentBatchConfig$3.transition = null),
      (currentUpdatePriority = 2),
      fn();
  } finally {
    (currentUpdatePriority = previousPriority),
      (ReactCurrentBatchConfig$3.transition = prevTransition),
      (executionContext = prevExecutionContext),
      0 === executionContext && (resetRenderTimer(), flushSyncCallbacks());
  }
};
exports.unstable_runWithPriority = runWithPriority;
exports.version = "18.3.0-next-3ff1540e9-20230209";
