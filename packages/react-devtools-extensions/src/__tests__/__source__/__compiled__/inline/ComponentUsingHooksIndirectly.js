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
  const countState = (0, _react.useState)(0);
  const count = countState[0];
  const setCount = countState[1];
  const darkMode = useIsDarkMode();
  const [isDarkMode, setDarkMode] = darkMode;
  (0, _react.useEffect)(() => {// ...
  }, []);

  const handleClick = () => setCount(count + 1);

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", null, "Dark mode? ", isDarkMode), /*#__PURE__*/_react.default.createElement("div", null, "Count: ", count), /*#__PURE__*/_react.default.createElement("button", {
    onClick: handleClick
  }, "Update count"));
}

function useIsDarkMode() {
  const darkModeState = (0, _react.useState)(false);
  const [isDarkMode] = darkModeState;
  (0, _react.useEffect)(function useEffectCreate() {// Here is where we may listen to a "theme" event...
  }, []);
  return [isDarkMode, () => {}];
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbXBvbmVudFVzaW5nSG9va3NJbmRpcmVjdGx5LmpzIl0sIm5hbWVzIjpbIkNvbXBvbmVudCIsImNvdW50U3RhdGUiLCJjb3VudCIsInNldENvdW50IiwiZGFya01vZGUiLCJ1c2VJc0RhcmtNb2RlIiwiaXNEYXJrTW9kZSIsInNldERhcmtNb2RlIiwiaGFuZGxlQ2xpY2siLCJkYXJrTW9kZVN0YXRlIiwidXNlRWZmZWN0Q3JlYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBU0E7Ozs7OztBQVRBOzs7Ozs7OztBQVdPLFNBQVNBLFNBQVQsR0FBcUI7QUFDMUIsUUFBTUMsVUFBVSxHQUFHLHFCQUFTLENBQVQsQ0FBbkI7QUFDQSxRQUFNQyxLQUFLLEdBQUdELFVBQVUsQ0FBQyxDQUFELENBQXhCO0FBQ0EsUUFBTUUsUUFBUSxHQUFHRixVQUFVLENBQUMsQ0FBRCxDQUEzQjtBQUVBLFFBQU1HLFFBQVEsR0FBR0MsYUFBYSxFQUE5QjtBQUNBLFFBQU0sQ0FBQ0MsVUFBRCxFQUFhQyxXQUFiLElBQTRCSCxRQUFsQztBQUVBLHdCQUFVLE1BQU0sQ0FDZDtBQUNELEdBRkQsRUFFRyxFQUZIOztBQUlBLFFBQU1JLFdBQVcsR0FBRyxNQUFNTCxRQUFRLENBQUNELEtBQUssR0FBRyxDQUFULENBQWxDOztBQUVBLHNCQUNFLHlFQUNFLHlEQUFpQkksVUFBakIsQ0FERixlQUVFLHFEQUFhSixLQUFiLENBRkYsZUFHRTtBQUFRLElBQUEsT0FBTyxFQUFFTTtBQUFqQixvQkFIRixDQURGO0FBT0Q7O0FBRUQsU0FBU0gsYUFBVCxHQUF5QjtBQUN2QixRQUFNSSxhQUFhLEdBQUcscUJBQVMsS0FBVCxDQUF0QjtBQUNBLFFBQU0sQ0FBQ0gsVUFBRCxJQUFlRyxhQUFyQjtBQUVBLHdCQUFVLFNBQVNDLGVBQVQsR0FBMkIsQ0FDbkM7QUFDRCxHQUZELEVBRUcsRUFGSDtBQUlBLFNBQU8sQ0FBQ0osVUFBRCxFQUFhLE1BQU0sQ0FBRSxDQUFyQixDQUFQO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgRmFjZWJvb2ssIEluYy4gYW5kIGl0cyBhZmZpbGlhdGVzLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqIEBmbG93XG4gKi9cblxuaW1wb3J0IFJlYWN0LCB7dXNlRWZmZWN0LCB1c2VTdGF0ZX0gZnJvbSAncmVhY3QnO1xuXG5leHBvcnQgZnVuY3Rpb24gQ29tcG9uZW50KCkge1xuICBjb25zdCBjb3VudFN0YXRlID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IGNvdW50ID0gY291bnRTdGF0ZVswXTtcbiAgY29uc3Qgc2V0Q291bnQgPSBjb3VudFN0YXRlWzFdO1xuXG4gIGNvbnN0IGRhcmtNb2RlID0gdXNlSXNEYXJrTW9kZSgpO1xuICBjb25zdCBbaXNEYXJrTW9kZSwgc2V0RGFya01vZGVdID0gZGFya01vZGU7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAvLyAuLi5cbiAgfSwgW10pO1xuXG4gIGNvbnN0IGhhbmRsZUNsaWNrID0gKCkgPT4gc2V0Q291bnQoY291bnQgKyAxKTtcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2PkRhcmsgbW9kZT8ge2lzRGFya01vZGV9PC9kaXY+XG4gICAgICA8ZGl2PkNvdW50OiB7Y291bnR9PC9kaXY+XG4gICAgICA8YnV0dG9uIG9uQ2xpY2s9e2hhbmRsZUNsaWNrfT5VcGRhdGUgY291bnQ8L2J1dHRvbj5cbiAgICA8Lz5cbiAgKTtcbn1cblxuZnVuY3Rpb24gdXNlSXNEYXJrTW9kZSgpIHtcbiAgY29uc3QgZGFya01vZGVTdGF0ZSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgW2lzRGFya01vZGVdID0gZGFya01vZGVTdGF0ZTtcblxuICB1c2VFZmZlY3QoZnVuY3Rpb24gdXNlRWZmZWN0Q3JlYXRlKCkge1xuICAgIC8vIEhlcmUgaXMgd2hlcmUgd2UgbWF5IGxpc3RlbiB0byBhIFwidGhlbWVcIiBldmVudC4uLlxuICB9LCBbXSk7XG5cbiAgcmV0dXJuIFtpc0RhcmtNb2RlLCAoKSA9PiB7fV07XG59XG4iXX0=