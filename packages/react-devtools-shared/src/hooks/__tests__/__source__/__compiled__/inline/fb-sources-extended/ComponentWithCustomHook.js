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
  const {
    foo
  } = useFoo();
  (0, _react.useEffect)(() => {// ...
  }, []);

  const handleClick = () => setCount(count + 1);

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", null, "Dark mode? ", isDarkMode), /*#__PURE__*/_react.default.createElement("div", null, "Count: ", count), /*#__PURE__*/_react.default.createElement("div", null, "Foo: ", foo), /*#__PURE__*/_react.default.createElement("button", {
    onClick: handleClick
  }, "Update count"));
}

function useIsDarkMode() {
  const [isDarkMode] = (0, _react.useState)(false);
  (0, _react.useEffect)(function useEffectCreate() {// Here is where we may listen to a "theme" event...
  }, []);
  return isDarkMode;
}

function useFoo() {
  (0, _react.useDebugValue)('foo');
  return {
    foo: true
  };
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbXBvbmVudFdpdGhDdXN0b21Ib29rLmpzIl0sIm5hbWVzIjpbIkNvbXBvbmVudCIsImNvdW50Iiwic2V0Q291bnQiLCJpc0RhcmtNb2RlIiwidXNlSXNEYXJrTW9kZSIsImZvbyIsInVzZUZvbyIsImhhbmRsZUNsaWNrIiwidXNlRWZmZWN0Q3JlYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBU0E7Ozs7OztBQVRBOzs7Ozs7OztBQVdPLFNBQVNBLFNBQVQsR0FBcUI7QUFDMUIsUUFBTSxDQUFDQyxLQUFELEVBQVFDLFFBQVIsSUFBb0IscUJBQVMsQ0FBVCxDQUExQjtBQUNBLFFBQU1DLFVBQVUsR0FBR0MsYUFBYSxFQUFoQztBQUNBLFFBQU07QUFBQ0MsSUFBQUE7QUFBRCxNQUFRQyxNQUFNLEVBQXBCO0FBRUEsd0JBQVUsTUFBTSxDQUNkO0FBQ0QsR0FGRCxFQUVHLEVBRkg7O0FBSUEsUUFBTUMsV0FBVyxHQUFHLE1BQU1MLFFBQVEsQ0FBQ0QsS0FBSyxHQUFHLENBQVQsQ0FBbEM7O0FBRUEsc0JBQ0UseUVBQ0UseURBQWlCRSxVQUFqQixDQURGLGVBRUUscURBQWFGLEtBQWIsQ0FGRixlQUdFLG1EQUFXSSxHQUFYLENBSEYsZUFJRTtBQUFRLElBQUEsT0FBTyxFQUFFRTtBQUFqQixvQkFKRixDQURGO0FBUUQ7O0FBRUQsU0FBU0gsYUFBVCxHQUF5QjtBQUN2QixRQUFNLENBQUNELFVBQUQsSUFBZSxxQkFBUyxLQUFULENBQXJCO0FBRUEsd0JBQVUsU0FBU0ssZUFBVCxHQUEyQixDQUNuQztBQUNELEdBRkQsRUFFRyxFQUZIO0FBSUEsU0FBT0wsVUFBUDtBQUNEOztBQUVELFNBQVNHLE1BQVQsR0FBa0I7QUFDaEIsNEJBQWMsS0FBZDtBQUNBLFNBQU87QUFBQ0QsSUFBQUEsR0FBRyxFQUFFO0FBQU4sR0FBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIEZhY2Vib29rLCBJbmMuIGFuZCBpdHMgYWZmaWxpYXRlcy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqXG4gKiBAZmxvd1xuICovXG5cbmltcG9ydCBSZWFjdCwge3VzZURlYnVnVmFsdWUsIHVzZUVmZmVjdCwgdXNlU3RhdGV9IGZyb20gJ3JlYWN0JztcblxuZXhwb3J0IGZ1bmN0aW9uIENvbXBvbmVudCgpIHtcbiAgY29uc3QgW2NvdW50LCBzZXRDb3VudF0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgaXNEYXJrTW9kZSA9IHVzZUlzRGFya01vZGUoKTtcbiAgY29uc3Qge2Zvb30gPSB1c2VGb28oKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIC4uLlxuICB9LCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2xpY2sgPSAoKSA9PiBzZXRDb3VudChjb3VudCArIDEpO1xuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxkaXY+RGFyayBtb2RlPyB7aXNEYXJrTW9kZX08L2Rpdj5cbiAgICAgIDxkaXY+Q291bnQ6IHtjb3VudH08L2Rpdj5cbiAgICAgIDxkaXY+Rm9vOiB7Zm9vfTwvZGl2PlxuICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtoYW5kbGVDbGlja30+VXBkYXRlIGNvdW50PC9idXR0b24+XG4gICAgPC8+XG4gICk7XG59XG5cbmZ1bmN0aW9uIHVzZUlzRGFya01vZGUoKSB7XG4gIGNvbnN0IFtpc0RhcmtNb2RlXSA9IHVzZVN0YXRlKGZhbHNlKTtcblxuICB1c2VFZmZlY3QoZnVuY3Rpb24gdXNlRWZmZWN0Q3JlYXRlKCkge1xuICAgIC8vIEhlcmUgaXMgd2hlcmUgd2UgbWF5IGxpc3RlbiB0byBhIFwidGhlbWVcIiBldmVudC4uLlxuICB9LCBbXSk7XG5cbiAgcmV0dXJuIGlzRGFya01vZGU7XG59XG5cbmZ1bmN0aW9uIHVzZUZvbygpIHtcbiAgdXNlRGVidWdWYWx1ZSgnZm9vJyk7XG4gIHJldHVybiB7Zm9vOiB0cnVlfTtcbn1cbiJdLCJ4X2ZhY2Vib29rX3NvdXJjZXMiOltbbnVsbCxbeyJuYW1lcyI6WyI8bm8taG9vaz4iLCJjb3VudCIsImlzRGFya01vZGUiXSwibWFwcGluZ3MiOiJDQUFEO2E0QkNBLEFXREE7Y2xCRUEsQWVGQTtrQ2JFQSJ9XV1dfQ==