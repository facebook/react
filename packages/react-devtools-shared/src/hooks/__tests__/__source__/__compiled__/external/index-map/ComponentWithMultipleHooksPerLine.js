"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Component = Component;

var _react = require("react");

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
const A = /*#__PURE__*/(0, _react.createContext)(1);
const B = /*#__PURE__*/(0, _react.createContext)(2);

function Component() {
  const a = (0, _react.useContext)(A);
  const b = (0, _react.useContext)(B); // prettier-ignore

  const c = (0, _react.useContext)(A),
        d = (0, _react.useContext)(B); // eslint-disable-line one-var

  return a + b + c + d;
}
//# sourceMappingURL=ComponentWithMultipleHooksPerLine.js.map?foo=bar&param=some_value