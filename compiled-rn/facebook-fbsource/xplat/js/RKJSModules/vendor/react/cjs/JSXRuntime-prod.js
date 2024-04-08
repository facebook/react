/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @generated SignedSource<<6a9bb0dff181629a2d212a3aa8871904>>
 */

"use strict";
var dynamicFlagsUntyped = require("ReactNativeInternalFeatureFlags"),
  React = require("react"),
  REACT_ELEMENT_TYPE = Symbol.for("react.element"),
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
var disableDefaultPropsExceptForClasses =
    dynamicFlagsUntyped.disableDefaultPropsExceptForClasses,
  ReactSharedInternals =
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
function jsxProd(type, config, maybeKey) {
  var key = null,
    ref = null;
  void 0 !== maybeKey && (key = "" + maybeKey);
  void 0 !== config.key && (key = "" + config.key);
  if (void 0 !== config.ref)
    a: {
      if (((ref = config.ref), "string" !== typeof ref))
        if ("number" === typeof ref || "boolean" === typeof ref) ref = "" + ref;
        else break a;
      ref = stringRefAsCallbackRef.bind(
        null,
        ref,
        type,
        ReactSharedInternals.owner
      );
    }
  maybeKey = {};
  for (var propName in config)
    "key" !== propName &&
      "ref" !== propName &&
      (maybeKey[propName] = config[propName]);
  if (!disableDefaultPropsExceptForClasses && type && type.defaultProps) {
    config = type.defaultProps;
    for (var propName$0 in config)
      void 0 === maybeKey[propName$0] &&
        (maybeKey[propName$0] = config[propName$0]);
  }
  return {
    $$typeof: REACT_ELEMENT_TYPE,
    type: type,
    key: key,
    ref: ref,
    props: maybeKey,
    _owner: ReactSharedInternals.owner
  };
}
function stringRefAsCallbackRef(stringRef, type, owner, value) {
  if (!owner) throw Error(formatProdErrorMessage(290, stringRef));
  if (1 !== owner.tag) throw Error(formatProdErrorMessage(309));
  type = owner.stateNode;
  if (!type) throw Error(formatProdErrorMessage(147, stringRef));
  type = type.refs;
  null === value ? delete type[stringRef] : (type[stringRef] = value);
}
exports.Fragment = REACT_FRAGMENT_TYPE;
exports.jsx = jsxProd;
exports.jsxs = jsxProd;
