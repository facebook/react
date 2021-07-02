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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbXBvbmVudFdpdGhDdXN0b21Ib29rLmpzIl0sIm5hbWVzIjpbIkNvbXBvbmVudCIsImNvdW50Iiwic2V0Q291bnQiLCJpc0RhcmtNb2RlIiwidXNlSXNEYXJrTW9kZSIsImhhbmRsZUNsaWNrIiwidXNlRWZmZWN0Q3JlYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBU0E7Ozs7OztBQVRBOzs7Ozs7OztBQVdPLFNBQVNBLFNBQVQsR0FBcUI7QUFDMUIsUUFBTSxDQUFDQyxLQUFELEVBQVFDLFFBQVIsSUFBb0IscUJBQVMsQ0FBVCxDQUExQjtBQUNBLFFBQU1DLFVBQVUsR0FBR0MsYUFBYSxFQUFoQztBQUVBLHdCQUFVLE1BQU0sQ0FDZDtBQUNELEdBRkQsRUFFRyxFQUZIOztBQUlBLFFBQU1DLFdBQVcsR0FBRyxNQUFNSCxRQUFRLENBQUNELEtBQUssR0FBRyxDQUFULENBQWxDOztBQUVBLHNCQUNFLHlFQUNFLHlEQUFpQkUsVUFBakIsQ0FERixlQUVFLHFEQUFhRixLQUFiLENBRkYsZUFHRTtBQUFRLElBQUEsT0FBTyxFQUFFSTtBQUFqQixvQkFIRixDQURGO0FBT0Q7O0FBRUQsU0FBU0QsYUFBVCxHQUF5QjtBQUN2QixRQUFNLENBQUNELFVBQUQsSUFBZSxxQkFBUyxLQUFULENBQXJCO0FBRUEsd0JBQVUsU0FBU0csZUFBVCxHQUEyQixDQUNuQztBQUNELEdBRkQsRUFFRyxFQUZIO0FBSUEsU0FBT0gsVUFBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIEZhY2Vib29rLCBJbmMuIGFuZCBpdHMgYWZmaWxpYXRlcy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqXG4gKiBAZmxvd1xuICovXG5cbmltcG9ydCBSZWFjdCwge3VzZUVmZmVjdCwgdXNlU3RhdGV9IGZyb20gJ3JlYWN0JztcblxuZXhwb3J0IGZ1bmN0aW9uIENvbXBvbmVudCgpIHtcbiAgY29uc3QgW2NvdW50LCBzZXRDb3VudF0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgaXNEYXJrTW9kZSA9IHVzZUlzRGFya01vZGUoKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIC4uLlxuICB9LCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2xpY2sgPSAoKSA9PiBzZXRDb3VudChjb3VudCArIDEpO1xuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxkaXY+RGFyayBtb2RlPyB7aXNEYXJrTW9kZX08L2Rpdj5cbiAgICAgIDxkaXY+Q291bnQ6IHtjb3VudH08L2Rpdj5cbiAgICAgIDxidXR0b24gb25DbGljaz17aGFuZGxlQ2xpY2t9PlVwZGF0ZSBjb3VudDwvYnV0dG9uPlxuICAgIDwvPlxuICApO1xufVxuXG5mdW5jdGlvbiB1c2VJc0RhcmtNb2RlKCkge1xuICBjb25zdCBbaXNEYXJrTW9kZV0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgdXNlRWZmZWN0KGZ1bmN0aW9uIHVzZUVmZmVjdENyZWF0ZSgpIHtcbiAgICAvLyBIZXJlIGlzIHdoZXJlIHdlIG1heSBsaXN0ZW4gdG8gYSBcInRoZW1lXCIgZXZlbnQuLi5cbiAgfSwgW10pO1xuXG4gIHJldHVybiBpc0RhcmtNb2RlO1xufVxuIl19