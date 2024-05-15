"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Component = Component;

var _react = _interopRequireWildcard(require("react"));

var _jsxFileName = "";

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function Component() {
  const countState = (0, _react.useState)(0);
  const count = countState[0];
  const setCount = countState[1];
  const darkMode = useIsDarkMode();
  const [isDarkMode] = darkMode;
  (0, _react.useEffect)(() => {// ...
  }, []);

  const handleClick = () => setCount(count + 1);

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 28,
      columnNumber: 7
    }
  }, "Dark mode? ", isDarkMode), /*#__PURE__*/_react.default.createElement("div", {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 29,
      columnNumber: 7
    }
  }, "Count: ", count), /*#__PURE__*/_react.default.createElement("button", {
    onClick: handleClick,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 30,
      columnNumber: 7
    }
  }, "Update count"));
}

function useIsDarkMode() {
  const darkModeState = (0, _react.useState)(false);
  const [isDarkMode] = darkModeState;
  (0, _react.useEffect)(function useEffectCreate() {// Here is where we may listen to a "theme" event...
  }, []);
  return [isDarkMode, () => {}];
}
//# sourceMappingURL=ComponentUsingHooksIndirectly.js.map?foo=bar&param=some_value