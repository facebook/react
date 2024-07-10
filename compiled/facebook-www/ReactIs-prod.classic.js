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
var dynamicFeatureFlags = require("ReactFeatureFlags"),
  enableDebugTracing = dynamicFeatureFlags.enableDebugTracing,
  enableRenderableContext = dynamicFeatureFlags.enableRenderableContext,
  enableTransitionTracing = dynamicFeatureFlags.enableTransitionTracing,
  renameElementSymbol = dynamicFeatureFlags.renameElementSymbol,
  REACT_LEGACY_ELEMENT_TYPE = Symbol.for("react.element"),
  REACT_ELEMENT_TYPE = renameElementSymbol
    ? Symbol.for("react.transitional.element")
    : REACT_LEGACY_ELEMENT_TYPE,
  REACT_PORTAL_TYPE = Symbol.for("react.portal"),
  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"),
  REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"),
  REACT_PROFILER_TYPE = Symbol.for("react.profiler"),
  REACT_PROVIDER_TYPE = Symbol.for("react.provider"),
  REACT_CONSUMER_TYPE = Symbol.for("react.consumer"),
  REACT_CONTEXT_TYPE = Symbol.for("react.context"),
  REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"),
  REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"),
  REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"),
  REACT_MEMO_TYPE = Symbol.for("react.memo"),
  REACT_LAZY_TYPE = Symbol.for("react.lazy"),
  REACT_SCOPE_TYPE = Symbol.for("react.scope"),
  REACT_DEBUG_TRACING_MODE_TYPE = Symbol.for("react.debug_trace_mode"),
  REACT_OFFSCREEN_TYPE = Symbol.for("react.offscreen"),
  REACT_LEGACY_HIDDEN_TYPE = Symbol.for("react.legacy_hidden"),
  REACT_TRACING_MARKER_TYPE = Symbol.for("react.tracing_marker"),
  REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference");
function typeOf(object) {
  if ("object" === typeof object && null !== object) {
    var $$typeof = object.$$typeof;
    switch ($$typeof) {
      case REACT_ELEMENT_TYPE:
        switch (((object = object.type), object)) {
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
          case REACT_SUSPENSE_TYPE:
          case REACT_SUSPENSE_LIST_TYPE:
            return object;
          default:
            switch (((object = object && object.$$typeof), object)) {
              case REACT_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
                return object;
              case REACT_CONSUMER_TYPE:
                if (enableRenderableContext) return object;
              case REACT_PROVIDER_TYPE:
                if (!enableRenderableContext) return object;
              default:
                return $$typeof;
            }
        }
      case REACT_PORTAL_TYPE:
        return $$typeof;
    }
  }
}
var ContextProvider = enableRenderableContext
  ? REACT_CONTEXT_TYPE
  : REACT_PROVIDER_TYPE;
exports.ContextConsumer = enableRenderableContext
  ? REACT_CONSUMER_TYPE
  : REACT_CONTEXT_TYPE;
exports.ContextProvider = ContextProvider;
exports.Element = REACT_ELEMENT_TYPE;
exports.ForwardRef = REACT_FORWARD_REF_TYPE;
exports.Fragment = REACT_FRAGMENT_TYPE;
exports.Lazy = REACT_LAZY_TYPE;
exports.Memo = REACT_MEMO_TYPE;
exports.Portal = REACT_PORTAL_TYPE;
exports.Profiler = REACT_PROFILER_TYPE;
exports.StrictMode = REACT_STRICT_MODE_TYPE;
exports.Suspense = REACT_SUSPENSE_TYPE;
exports.SuspenseList = REACT_SUSPENSE_LIST_TYPE;
exports.isContextConsumer = function (object) {
  return enableRenderableContext
    ? typeOf(object) === REACT_CONSUMER_TYPE
    : typeOf(object) === REACT_CONTEXT_TYPE;
};
exports.isContextProvider = function (object) {
  return enableRenderableContext
    ? typeOf(object) === REACT_CONTEXT_TYPE
    : typeOf(object) === REACT_PROVIDER_TYPE;
};
exports.isElement = function (object) {
  return (
    "object" === typeof object &&
    null !== object &&
    object.$$typeof === REACT_ELEMENT_TYPE
  );
};
exports.isForwardRef = function (object) {
  return typeOf(object) === REACT_FORWARD_REF_TYPE;
};
exports.isFragment = function (object) {
  return typeOf(object) === REACT_FRAGMENT_TYPE;
};
exports.isLazy = function (object) {
  return typeOf(object) === REACT_LAZY_TYPE;
};
exports.isMemo = function (object) {
  return typeOf(object) === REACT_MEMO_TYPE;
};
exports.isPortal = function (object) {
  return typeOf(object) === REACT_PORTAL_TYPE;
};
exports.isProfiler = function (object) {
  return typeOf(object) === REACT_PROFILER_TYPE;
};
exports.isStrictMode = function (object) {
  return typeOf(object) === REACT_STRICT_MODE_TYPE;
};
exports.isSuspense = function (object) {
  return typeOf(object) === REACT_SUSPENSE_TYPE;
};
exports.isSuspenseList = function (object) {
  return typeOf(object) === REACT_SUSPENSE_LIST_TYPE;
};
exports.isValidElementType = function (type) {
  return "string" === typeof type ||
    "function" === typeof type ||
    type === REACT_FRAGMENT_TYPE ||
    type === REACT_PROFILER_TYPE ||
    (enableDebugTracing && type === REACT_DEBUG_TRACING_MODE_TYPE) ||
    type === REACT_STRICT_MODE_TYPE ||
    type === REACT_SUSPENSE_TYPE ||
    type === REACT_SUSPENSE_LIST_TYPE ||
    type === REACT_LEGACY_HIDDEN_TYPE ||
    type === REACT_OFFSCREEN_TYPE ||
    type === REACT_SCOPE_TYPE ||
    (enableTransitionTracing && type === REACT_TRACING_MARKER_TYPE) ||
    ("object" === typeof type &&
      null !== type &&
      (type.$$typeof === REACT_LAZY_TYPE ||
        type.$$typeof === REACT_MEMO_TYPE ||
        type.$$typeof === REACT_CONTEXT_TYPE ||
        (!enableRenderableContext && type.$$typeof === REACT_PROVIDER_TYPE) ||
        (enableRenderableContext && type.$$typeof === REACT_CONSUMER_TYPE) ||
        type.$$typeof === REACT_FORWARD_REF_TYPE ||
        type.$$typeof === REACT_CLIENT_REFERENCE ||
        void 0 !== type.getModuleId))
    ? !0
    : !1;
};
exports.typeOf = typeOf;
