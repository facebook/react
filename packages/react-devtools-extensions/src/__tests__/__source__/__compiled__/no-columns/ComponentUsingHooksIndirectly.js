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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbXBvbmVudFVzaW5nSG9va3NJbmRpcmVjdGx5LmpzIl0sIm5hbWVzIjpbIkNvbXBvbmVudCIsImNvdW50U3RhdGUiLCJjb3VudCIsInNldENvdW50IiwiZGFya01vZGUiLCJ1c2VJc0RhcmtNb2RlIiwiaXNEYXJrTW9kZSIsInNldERhcmtNb2RlIiwiaGFuZGxlQ2xpY2siLCJkYXJrTW9kZVN0YXRlIiwidXNlRWZmZWN0Q3JlYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBU0E7Ozs7OztBQVRBOzs7Ozs7OztBQVdBLFNBQUFBLFNBQUEsR0FBQTtBQUNBLFFBQUFDLFVBQUEsR0FBQSxxQkFBQSxDQUFBLENBQUE7QUFDQSxRQUFBQyxLQUFBLEdBQUFELFVBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxRQUFBRSxRQUFBLEdBQUFGLFVBQUEsQ0FBQSxDQUFBLENBQUE7QUFFQSxRQUFBRyxRQUFBLEdBQUFDLGFBQUEsRUFBQTtBQUNBLFFBQUEsQ0FBQUMsVUFBQSxFQUFBQyxXQUFBLElBQUFILFFBQUE7QUFFQSx3QkFBQSxNQUFBLENBQ0E7QUFDQSxHQUZBLEVBRUEsRUFGQTs7QUFJQSxRQUFBSSxXQUFBLEdBQUEsTUFBQUwsUUFBQSxDQUFBRCxLQUFBLEdBQUEsQ0FBQSxDQUFBOztBQUVBLHNCQUNBLHlFQUNBLHlEQUFBSSxVQUFBLENBREEsZUFFQSxxREFBQUosS0FBQSxDQUZBLGVBR0E7QUFBQSxJQUFBLE9BQUEsRUFBQU07QUFBQSxvQkFIQSxDQURBO0FBT0E7O0FBRUEsU0FBQUgsYUFBQSxHQUFBO0FBQ0EsUUFBQUksYUFBQSxHQUFBLHFCQUFBLEtBQUEsQ0FBQTtBQUNBLFFBQUEsQ0FBQUgsVUFBQSxJQUFBRyxhQUFBO0FBRUEsd0JBQUEsU0FBQUMsZUFBQSxHQUFBLENBQ0E7QUFDQSxHQUZBLEVBRUEsRUFGQTtBQUlBLFNBQUEsQ0FBQUosVUFBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSBGYWNlYm9vaywgSW5jLiBhbmQgaXRzIGFmZmlsaWF0ZXMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogQGZsb3dcbiAqL1xuXG5pbXBvcnQgUmVhY3QsIHt1c2VFZmZlY3QsIHVzZVN0YXRlfSBmcm9tICdyZWFjdCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBDb21wb25lbnQoKSB7XG4gIGNvbnN0IGNvdW50U3RhdGUgPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3QgY291bnQgPSBjb3VudFN0YXRlWzBdO1xuICBjb25zdCBzZXRDb3VudCA9IGNvdW50U3RhdGVbMV07XG5cbiAgY29uc3QgZGFya01vZGUgPSB1c2VJc0RhcmtNb2RlKCk7XG4gIGNvbnN0IFtpc0RhcmtNb2RlLCBzZXREYXJrTW9kZV0gPSBkYXJrTW9kZTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIC4uLlxuICB9LCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2xpY2sgPSAoKSA9PiBzZXRDb3VudChjb3VudCArIDEpO1xuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxkaXY+RGFyayBtb2RlPyB7aXNEYXJrTW9kZX08L2Rpdj5cbiAgICAgIDxkaXY+Q291bnQ6IHtjb3VudH08L2Rpdj5cbiAgICAgIDxidXR0b24gb25DbGljaz17aGFuZGxlQ2xpY2t9PlVwZGF0ZSBjb3VudDwvYnV0dG9uPlxuICAgIDwvPlxuICApO1xufVxuXG5mdW5jdGlvbiB1c2VJc0RhcmtNb2RlKCkge1xuICBjb25zdCBkYXJrTW9kZVN0YXRlID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbaXNEYXJrTW9kZV0gPSBkYXJrTW9kZVN0YXRlO1xuXG4gIHVzZUVmZmVjdChmdW5jdGlvbiB1c2VFZmZlY3RDcmVhdGUoKSB7XG4gICAgLy8gSGVyZSBpcyB3aGVyZSB3ZSBtYXkgbGlzdGVuIHRvIGEgXCJ0aGVtZVwiIGV2ZW50Li4uXG4gIH0sIFtdKTtcblxuICByZXR1cm4gW2lzRGFya01vZGUsICgpID0+IHt9XTtcbn1cbiJdfQ==