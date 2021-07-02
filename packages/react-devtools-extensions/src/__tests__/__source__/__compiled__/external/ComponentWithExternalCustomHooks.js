"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Component = Component;

var _react = _interopRequireDefault(require("react"));

var _useTheme = _interopRequireDefault(require("./useTheme"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
function Component() {
  const theme = (0, _useTheme.default)();
  return /*#__PURE__*/_react.default.createElement("div", null, "theme: ", theme);
}
//# sourceMappingURL=ComponentWithExternalCustomHooks.js.map