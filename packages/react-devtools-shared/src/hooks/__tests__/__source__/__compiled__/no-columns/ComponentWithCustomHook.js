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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbXBvbmVudFdpdGhDdXN0b21Ib29rLmpzIl0sIm5hbWVzIjpbIkNvbXBvbmVudCIsImNvdW50Iiwic2V0Q291bnQiLCJpc0RhcmtNb2RlIiwidXNlSXNEYXJrTW9kZSIsImZvbyIsInVzZUZvbyIsImhhbmRsZUNsaWNrIiwidXNlRWZmZWN0Q3JlYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBU0E7Ozs7OztBQVRBOzs7Ozs7OztBQVdBLFNBQUFBLFNBQUEsR0FBQTtBQUNBLFFBQUEsQ0FBQUMsS0FBQSxFQUFBQyxRQUFBLElBQUEscUJBQUEsQ0FBQSxDQUFBO0FBQ0EsUUFBQUMsVUFBQSxHQUFBQyxhQUFBLEVBQUE7QUFDQSxRQUFBO0FBQUFDLElBQUFBO0FBQUEsTUFBQUMsTUFBQSxFQUFBO0FBRUEsd0JBQUEsTUFBQSxDQUNBO0FBQ0EsR0FGQSxFQUVBLEVBRkE7O0FBSUEsUUFBQUMsV0FBQSxHQUFBLE1BQUFMLFFBQUEsQ0FBQUQsS0FBQSxHQUFBLENBQUEsQ0FBQTs7QUFFQSxzQkFDQSx5RUFDQSx5REFBQUUsVUFBQSxDQURBLGVBRUEscURBQUFGLEtBQUEsQ0FGQSxlQUdBLG1EQUFBSSxHQUFBLENBSEEsZUFJQTtBQUFBLElBQUEsT0FBQSxFQUFBRTtBQUFBLG9CQUpBLENBREE7QUFRQTs7QUFFQSxTQUFBSCxhQUFBLEdBQUE7QUFDQSxRQUFBLENBQUFELFVBQUEsSUFBQSxxQkFBQSxLQUFBLENBQUE7QUFFQSx3QkFBQSxTQUFBSyxlQUFBLEdBQUEsQ0FDQTtBQUNBLEdBRkEsRUFFQSxFQUZBO0FBSUEsU0FBQUwsVUFBQTtBQUNBOztBQUVBLFNBQUFHLE1BQUEsR0FBQTtBQUNBLDRCQUFBLEtBQUE7QUFDQSxTQUFBO0FBQUFELElBQUFBLEdBQUEsRUFBQTtBQUFBLEdBQUE7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29weXJpZ2h0IChjKSBGYWNlYm9vaywgSW5jLiBhbmQgaXRzIGFmZmlsaWF0ZXMuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuXG4gKlxuICogQGZsb3dcbiAqL1xuXG5pbXBvcnQgUmVhY3QsIHt1c2VEZWJ1Z1ZhbHVlLCB1c2VFZmZlY3QsIHVzZVN0YXRlfSBmcm9tICdyZWFjdCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBDb21wb25lbnQoKSB7XG4gIGNvbnN0IFtjb3VudCwgc2V0Q291bnRdID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IGlzRGFya01vZGUgPSB1c2VJc0RhcmtNb2RlKCk7XG4gIGNvbnN0IHtmb299ID0gdXNlRm9vKCk7XG5cbiAgdXNlRWZmZWN0KCgpID0+IHtcbiAgICAvLyAuLi5cbiAgfSwgW10pO1xuXG4gIGNvbnN0IGhhbmRsZUNsaWNrID0gKCkgPT4gc2V0Q291bnQoY291bnQgKyAxKTtcblxuICByZXR1cm4gKFxuICAgIDw+XG4gICAgICA8ZGl2PkRhcmsgbW9kZT8ge2lzRGFya01vZGV9PC9kaXY+XG4gICAgICA8ZGl2PkNvdW50OiB7Y291bnR9PC9kaXY+XG4gICAgICA8ZGl2PkZvbzoge2Zvb308L2Rpdj5cbiAgICAgIDxidXR0b24gb25DbGljaz17aGFuZGxlQ2xpY2t9PlVwZGF0ZSBjb3VudDwvYnV0dG9uPlxuICAgIDwvPlxuICApO1xufVxuXG5mdW5jdGlvbiB1c2VJc0RhcmtNb2RlKCkge1xuICBjb25zdCBbaXNEYXJrTW9kZV0gPSB1c2VTdGF0ZShmYWxzZSk7XG5cbiAgdXNlRWZmZWN0KGZ1bmN0aW9uIHVzZUVmZmVjdENyZWF0ZSgpIHtcbiAgICAvLyBIZXJlIGlzIHdoZXJlIHdlIG1heSBsaXN0ZW4gdG8gYSBcInRoZW1lXCIgZXZlbnQuLi5cbiAgfSwgW10pO1xuXG4gIHJldHVybiBpc0RhcmtNb2RlO1xufVxuXG5mdW5jdGlvbiB1c2VGb28oKSB7XG4gIHVzZURlYnVnVmFsdWUoJ2ZvbycpO1xuICByZXR1cm4ge2ZvbzogdHJ1ZX07XG59XG4iXX0=