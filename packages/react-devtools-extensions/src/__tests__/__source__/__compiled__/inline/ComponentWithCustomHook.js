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
  const [isDarkMode, setIsDarkMode] = (0, _react.useState)(0);
  (0, _react.useEffect)(function useEffectCreate() {// Here is where we may listen to a "theme" event...
  }, []);
  return isDarkMode;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbXBvbmVudFdpdGhDdXN0b21Ib29rLmpzIl0sIm5hbWVzIjpbIkNvbXBvbmVudCIsImNvdW50Iiwic2V0Q291bnQiLCJpc0RhcmtNb2RlIiwidXNlSXNEYXJrTW9kZSIsImhhbmRsZUNsaWNrIiwic2V0SXNEYXJrTW9kZSIsInVzZUVmZmVjdENyZWF0ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVNBOzs7Ozs7QUFUQTs7Ozs7Ozs7QUFXTyxTQUFTQSxTQUFULEdBQXFCO0FBQzFCLFFBQU0sQ0FBQ0MsS0FBRCxFQUFRQyxRQUFSLElBQW9CLHFCQUFTLENBQVQsQ0FBMUI7QUFDQSxRQUFNQyxVQUFVLEdBQUdDLGFBQWEsRUFBaEM7QUFFQSx3QkFBVSxNQUFNLENBQ2Q7QUFDRCxHQUZELEVBRUcsRUFGSDs7QUFJQSxRQUFNQyxXQUFXLEdBQUcsTUFBTUgsUUFBUSxDQUFDRCxLQUFLLEdBQUcsQ0FBVCxDQUFsQzs7QUFFQSxzQkFDRSx5RUFDRSx5REFBaUJFLFVBQWpCLENBREYsZUFFRSxxREFBYUYsS0FBYixDQUZGLGVBR0U7QUFBUSxJQUFBLE9BQU8sRUFBRUk7QUFBakIsb0JBSEYsQ0FERjtBQU9EOztBQUVELFNBQVNELGFBQVQsR0FBeUI7QUFDdkIsUUFBTSxDQUFDRCxVQUFELEVBQWFHLGFBQWIsSUFBOEIscUJBQVMsQ0FBVCxDQUFwQztBQUVBLHdCQUFVLFNBQVNDLGVBQVQsR0FBMkIsQ0FDbkM7QUFDRCxHQUZELEVBRUcsRUFGSDtBQUlBLFNBQU9KLFVBQVA7QUFDRCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSBGYWNlYm9vaywgSW5jLiBhbmQgaXRzIGFmZmlsaWF0ZXMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogQGZsb3dcbiAqL1xuXG5pbXBvcnQgUmVhY3QsIHt1c2VFZmZlY3QsIHVzZVN0YXRlfSBmcm9tICdyZWFjdCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBDb21wb25lbnQoKSB7XG4gIGNvbnN0IFtjb3VudCwgc2V0Q291bnRdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IGlzRGFya01vZGUgPSB1c2VJc0RhcmtNb2RlKCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAvLyAuLi5cbiAgfSwgW10pO1xuXG4gIGNvbnN0IGhhbmRsZUNsaWNrID0gKCkgPT4gc2V0Q291bnQoY291bnQgKyAxKTtcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2PkRhcmsgbW9kZT8ge2lzRGFya01vZGV9PC9kaXY+XG4gICAgICA8ZGl2PkNvdW50OiB7Y291bnR9PC9kaXY+XG4gICAgICA8YnV0dG9uIG9uQ2xpY2s9e2hhbmRsZUNsaWNrfT5VcGRhdGUgY291bnQ8L2J1dHRvbj5cbiAgICA8Lz5cbiAgKTtcbn1cblxuZnVuY3Rpb24gdXNlSXNEYXJrTW9kZSgpIHtcbiAgY29uc3QgW2lzRGFya01vZGUsIHNldElzRGFya01vZGVdID0gdXNlU3RhdGUoMCk7XG5cbiAgdXNlRWZmZWN0KGZ1bmN0aW9uIHVzZUVmZmVjdENyZWF0ZSgpIHtcbiAgICAvLyBIZXJlIGlzIHdoZXJlIHdlIG1heSBsaXN0ZW4gdG8gYSBcInRoZW1lXCIgZXZlbnQuLi5cbiAgfSwgW10pO1xuXG4gIHJldHVybiBpc0RhcmtNb2RlO1xufSJdfQ==
//# sourceURL=ComponentWithCustomHook.js