"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Component = Component;

var _react = _interopRequireWildcard(require("react"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
function Component() {
  const [count, setCount] = (0, _react.useState)(0);
  const isDarkMode = useIsDarkMode();
  (0, _react.useEffect)(() => {// ...
  }, []);

  const handleClick = () => setCount(count + 1);

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", null, "Dark mode? ", isDarkMode), /*#__PURE__*/_react.default.createElement("div", null, "Count: ", count), /*#__PURE__*/_react.default.createElement("button", {
    onClick: handleClick
  }, "Update count"));
}

function useIsDarkMode() {
  const [isDarkMode] = (0, _react.useState)(false);
  (0, _react.useEffect)(function useEffectCreate() {// Here is where we may listen to a "theme" event...
  }, []);
  return isDarkMode;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbXBvbmVudFdpdGhDdXN0b21Ib29rLmpzIl0sIm5hbWVzIjpbIkNvbXBvbmVudCIsImNvdW50Iiwic2V0Q291bnQiLCJpc0RhcmtNb2RlIiwidXNlSXNEYXJrTW9kZSIsImhhbmRsZUNsaWNrIiwidXNlRWZmZWN0Q3JlYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBU0E7Ozs7OztBQVRBOzs7Ozs7OztBQVdBLFNBQUFBLFNBQUEsR0FBQTtBQUNBLFFBQUEsQ0FBQUMsS0FBQSxFQUFBQyxRQUFBLElBQUEscUJBQUEsQ0FBQSxDQUFBO0FBQ0EsUUFBQUMsVUFBQSxHQUFBQyxhQUFBLEVBQUE7QUFFQSx3QkFBQSxNQUFBLENBQ0E7QUFDQSxHQUZBLEVBRUEsRUFGQTs7QUFJQSxRQUFBQyxXQUFBLEdBQUEsTUFBQUgsUUFBQSxDQUFBRCxLQUFBLEdBQUEsQ0FBQSxDQUFBOztBQUVBLHNCQUNBLHlFQUNBLHlEQUFBRSxVQUFBLENBREEsZUFFQSxxREFBQUYsS0FBQSxDQUZBLGVBR0E7QUFBQSxJQUFBLE9BQUEsRUFBQUk7QUFBQSxvQkFIQSxDQURBO0FBT0E7O0FBRUEsU0FBQUQsYUFBQSxHQUFBO0FBQ0EsUUFBQSxDQUFBRCxVQUFBLElBQUEscUJBQUEsS0FBQSxDQUFBO0FBRUEsd0JBQUEsU0FBQUcsZUFBQSxHQUFBLENBQ0E7QUFDQSxHQUZBLEVBRUEsRUFGQTtBQUlBLFNBQUFILFVBQUE7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSBGYWNlYm9vaywgSW5jLiBhbmQgaXRzIGFmZmlsaWF0ZXMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogQGZsb3dcbiAqL1xuXG5pbXBvcnQgUmVhY3QsIHt1c2VFZmZlY3QsIHVzZVN0YXRlfSBmcm9tICdyZWFjdCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBDb21wb25lbnQoKSB7XG4gIGNvbnN0IFtjb3VudCwgc2V0Q291bnRdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IGlzRGFya01vZGUgPSB1c2VJc0RhcmtNb2RlKCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAvLyAuLi5cbiAgfSwgW10pO1xuXG4gIGNvbnN0IGhhbmRsZUNsaWNrID0gKCkgPT4gc2V0Q291bnQoY291bnQgKyAxKTtcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2PkRhcmsgbW9kZT8ge2lzRGFya01vZGV9PC9kaXY+XG4gICAgICA8ZGl2PkNvdW50OiB7Y291bnR9PC9kaXY+XG4gICAgICA8YnV0dG9uIG9uQ2xpY2s9e2hhbmRsZUNsaWNrfT5VcGRhdGUgY291bnQ8L2J1dHRvbj5cbiAgICA8Lz5cbiAgKTtcbn1cblxuZnVuY3Rpb24gdXNlSXNEYXJrTW9kZSgpIHtcbiAgY29uc3QgW2lzRGFya01vZGVdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIHVzZUVmZmVjdChmdW5jdGlvbiB1c2VFZmZlY3RDcmVhdGUoKSB7XG4gICAgLy8gSGVyZSBpcyB3aGVyZSB3ZSBtYXkgbGlzdGVuIHRvIGEgXCJ0aGVtZVwiIGV2ZW50Li4uXG4gIH0sIFtdKTtcblxuICByZXR1cm4gaXNEYXJrTW9kZTtcbn1cbiJdfQ==