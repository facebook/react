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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbXBvbmVudFdpdGhFeHRlcm5hbEN1c3RvbUhvb2tzLmpzIl0sIm5hbWVzIjpbIkNvbXBvbmVudCIsInRoZW1lIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBU0E7O0FBQ0E7Ozs7QUFWQTs7Ozs7Ozs7QUFZQSxTQUFBQSxTQUFBLEdBQUE7QUFDQSxRQUFBQyxLQUFBLEdBQUEsd0JBQUE7QUFFQSxzQkFBQSxxREFBQUEsS0FBQSxDQUFBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgRmFjZWJvb2ssIEluYy4gYW5kIGl0cyBhZmZpbGlhdGVzLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqIEBmbG93XG4gKi9cblxuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB1c2VUaGVtZSBmcm9tICcuL3VzZVRoZW1lJztcblxuZXhwb3J0IGZ1bmN0aW9uIENvbXBvbmVudCgpIHtcbiAgY29uc3QgdGhlbWUgPSB1c2VUaGVtZSgpO1xuXG4gIHJldHVybiA8ZGl2PnRoZW1lOiB7dGhlbWV9PC9kaXY+O1xufVxuIl19