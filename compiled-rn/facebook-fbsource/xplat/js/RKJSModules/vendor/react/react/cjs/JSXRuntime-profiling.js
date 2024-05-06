/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @generated SignedSource<<5ca9eeb178dcdb38a2d5649f74dbc0b1>>
 */

"use strict";
var dynamicFlagsUntyped = require("ReactNativeInternalFeatureFlags"),
  React = require("react"),
  disableDefaultPropsExceptForClasses =
    dynamicFlagsUntyped.disableDefaultPropsExceptForClasses,
  disableStringRefs = dynamicFlagsUntyped.disableStringRefs,
  enableFastJSX = dynamicFlagsUntyped.enableFastJSX,
  enableRefAsProp = dynamicFlagsUntyped.enableRefAsProp,
  REACT_LEGACY_ELEMENT_TYPE = Symbol.for("react.element"),
  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment");
function formatProdErrorMessage(code) {
  var url = "https://react.dev/errors/" + code;
  if (1 < arguments.length) {
    url += "?args[]=" + encodeURIComponent(arguments[1]);
    for (var i = 2; i < arguments.length; i++)
      url += "&args[]=" + encodeURIComponent(arguments[i]);
  }
  return (
    "Minified React error #" +
    code +
    "; visit " +
    url +
    " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
  );
}
var ReactSharedInternals =
  React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
function getOwner() {
  if (!disableStringRefs) {
    var dispatcher = ReactSharedInternals.A;
    return null === dispatcher ? null : dispatcher.getOwner();
  }
  return null;
}
var enableFastJSXWithStringRefs = enableFastJSX && enableRefAsProp,
  enableFastJSXWithoutStringRefs =
    enableFastJSXWithStringRefs && disableStringRefs;
function jsxProd(type, config, maybeKey) {
  var key = null,
    ref = null;
  void 0 !== maybeKey && (key = "" + maybeKey);
  void 0 !== config.key && (key = "" + config.key);
  void 0 === config.ref ||
    enableRefAsProp ||
    ((ref = config.ref),
    disableStringRefs || (ref = coerceStringRef(ref, getOwner(), type)));
  if (
    (!enableFastJSXWithoutStringRefs &&
      (!enableFastJSXWithStringRefs || "ref" in config)) ||
    "key" in config
  ) {
    maybeKey = {};
    for (var propName in config)
      "key" === propName ||
        (!enableRefAsProp && "ref" === propName) ||
        (enableRefAsProp && !disableStringRefs && "ref" === propName
          ? (maybeKey.ref = coerceStringRef(config[propName], getOwner(), type))
          : (maybeKey[propName] = config[propName]));
  } else maybeKey = config;
  if (!disableDefaultPropsExceptForClasses && type && type.defaultProps) {
    config = type.defaultProps;
    for (var propName$0 in config)
      void 0 === maybeKey[propName$0] &&
        (maybeKey[propName$0] = config[propName$0]);
  }
  propName$0 = getOwner();
  enableRefAsProp &&
    ((ref = maybeKey.ref), (ref = void 0 !== ref ? ref : null));
  return disableStringRefs
    ? {
        $$typeof: REACT_LEGACY_ELEMENT_TYPE,
        type: type,
        key: key,
        ref: ref,
        props: maybeKey
      }
    : {
        $$typeof: REACT_LEGACY_ELEMENT_TYPE,
        type: type,
        key: key,
        ref: ref,
        props: maybeKey,
        _owner: propName$0
      };
}
function coerceStringRef(mixedRef, owner, type) {
  if (disableStringRefs) return mixedRef;
  if ("string" !== typeof mixedRef)
    if ("number" === typeof mixedRef || "boolean" === typeof mixedRef)
      mixedRef = "" + mixedRef;
    else return mixedRef;
  var callback = stringRefAsCallbackRef.bind(null, mixedRef, type, owner);
  callback.__stringRef = mixedRef;
  callback.__type = type;
  callback.__owner = owner;
  return callback;
}
function stringRefAsCallbackRef(stringRef, type, owner, value) {
  if (!disableStringRefs) {
    if (!owner) throw Error(formatProdErrorMessage(290, stringRef));
    if (1 !== owner.tag) throw Error(formatProdErrorMessage(309));
    type = owner.stateNode;
    if (!type) throw Error(formatProdErrorMessage(147, stringRef));
    type = type.refs;
    null === value ? delete type[stringRef] : (type[stringRef] = value);
  }
}
exports.Fragment = REACT_FRAGMENT_TYPE;
exports.jsx = jsxProd;
exports.jsxs = jsxProd;
