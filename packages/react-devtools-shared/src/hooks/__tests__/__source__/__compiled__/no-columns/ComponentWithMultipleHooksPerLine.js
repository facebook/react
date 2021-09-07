"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Component = Component;

var _react = require("react");

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbXBvbmVudFdpdGhNdWx0aXBsZUhvb2tzUGVyTGluZS5qcyJdLCJuYW1lcyI6WyJBIiwiQiIsIkNvbXBvbmVudCIsImEiLCJiIiwiYyIsImQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFTQTs7QUFUQTs7Ozs7Ozs7QUFXQSxNQUFBQSxDQUFBLGdCQUFBLDBCQUFBLENBQUEsQ0FBQTtBQUNBLE1BQUFDLENBQUEsZ0JBQUEsMEJBQUEsQ0FBQSxDQUFBOztBQUVBLFNBQUFDLFNBQUEsR0FBQTtBQUNBLFFBQUFDLENBQUEsR0FBQSx1QkFBQUgsQ0FBQSxDQUFBO0FBQ0EsUUFBQUksQ0FBQSxHQUFBLHVCQUFBSCxDQUFBLENBQUEsQ0FGQSxDQUlBOztBQUNBLFFBQUFJLENBQUEsR0FBQSx1QkFBQUwsQ0FBQSxDQUFBO0FBQUEsUUFBQU0sQ0FBQSxHQUFBLHVCQUFBTCxDQUFBLENBQUEsQ0FMQSxDQUtBOztBQUVBLFNBQUFFLENBQUEsR0FBQUMsQ0FBQSxHQUFBQyxDQUFBLEdBQUFDLENBQUE7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSBGYWNlYm9vaywgSW5jLiBhbmQgaXRzIGFmZmlsaWF0ZXMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogQGZsb3dcbiAqL1xuXG5pbXBvcnQge2NyZWF0ZUNvbnRleHQsIHVzZUNvbnRleHR9IGZyb20gJ3JlYWN0JztcblxuY29uc3QgQSA9IGNyZWF0ZUNvbnRleHQoMSk7XG5jb25zdCBCID0gY3JlYXRlQ29udGV4dCgyKTtcblxuZXhwb3J0IGZ1bmN0aW9uIENvbXBvbmVudCgpIHtcbiAgY29uc3QgYSA9IHVzZUNvbnRleHQoQSk7XG4gIGNvbnN0IGIgPSB1c2VDb250ZXh0KEIpO1xuXG4gIC8vIHByZXR0aWVyLWlnbm9yZVxuICBjb25zdCBjID0gdXNlQ29udGV4dChBKSwgZCA9IHVzZUNvbnRleHQoQik7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgb25lLXZhclxuXG4gIHJldHVybiBhICsgYiArIGMgKyBkO1xufVxuIl19