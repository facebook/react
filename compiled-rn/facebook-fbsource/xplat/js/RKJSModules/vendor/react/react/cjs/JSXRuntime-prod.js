/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @nolint
 * @preventMunge
 * @generated SignedSource<<8027b340b0802f1154774d36f8da90fd>>
 */

"use strict";
var enableFastJSX = require("ReactNativeInternalFeatureFlags").enableFastJSX,
  REACT_LEGACY_ELEMENT_TYPE = Symbol.for("react.element"),
  REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"),
  enableFastJSXWithStringRefs = enableFastJSX && !0,
  enableFastJSXWithoutStringRefs = enableFastJSXWithStringRefs && !0;
function jsxProd(type, config, maybeKey) {
  var key = null;
  void 0 !== maybeKey && (key = "" + maybeKey);
  void 0 !== config.key && (key = "" + config.key);
  if (
    (!enableFastJSXWithoutStringRefs &&
      (!enableFastJSXWithStringRefs || "ref" in config)) ||
    "key" in config
  ) {
    maybeKey = {};
    for (var propName in config)
      "key" !== propName && (maybeKey[propName] = config[propName]);
  } else maybeKey = config;
  config = maybeKey.ref;
  return {
    $$typeof: REACT_LEGACY_ELEMENT_TYPE,
    type: type,
    key: key,
    ref: void 0 !== config ? config : null,
    props: maybeKey
  };
}
exports.Fragment = REACT_FRAGMENT_TYPE;
exports.jsx = jsxProd;
exports.jsxs = jsxProd;
