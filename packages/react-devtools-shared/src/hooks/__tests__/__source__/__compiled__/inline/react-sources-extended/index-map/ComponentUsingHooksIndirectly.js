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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzZWN0aW9ucyI6W3sib2Zmc2V0Ijp7ImxpbmUiOjAsImNvbHVtbiI6MH0sIm1hcCI6eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbXBvbmVudFVzaW5nSG9va3NJbmRpcmVjdGx5LmpzIl0sIm5hbWVzIjpbIkNvbXBvbmVudCIsImNvdW50U3RhdGUiLCJjb3VudCIsInNldENvdW50IiwiZGFya01vZGUiLCJ1c2VJc0RhcmtNb2RlIiwiaXNEYXJrTW9kZSIsImhhbmRsZUNsaWNrIiwiZGFya01vZGVTdGF0ZSIsInVzZUVmZmVjdENyZWF0ZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVNBOzs7Ozs7OztBQUVPLFNBQVNBLFNBQVQsR0FBcUI7QUFDMUIsUUFBTUMsVUFBVSxHQUFHLHFCQUFTLENBQVQsQ0FBbkI7QUFDQSxRQUFNQyxLQUFLLEdBQUdELFVBQVUsQ0FBQyxDQUFELENBQXhCO0FBQ0EsUUFBTUUsUUFBUSxHQUFHRixVQUFVLENBQUMsQ0FBRCxDQUEzQjtBQUVBLFFBQU1HLFFBQVEsR0FBR0MsYUFBYSxFQUE5QjtBQUNBLFFBQU0sQ0FBQ0MsVUFBRCxJQUFlRixRQUFyQjtBQUVBLHdCQUFVLE1BQU0sQ0FDZDtBQUNELEdBRkQsRUFFRyxFQUZIOztBQUlBLFFBQU1HLFdBQVcsR0FBRyxNQUFNSixRQUFRLENBQUNELEtBQUssR0FBRyxDQUFULENBQWxDOztBQUVBLHNCQUNFLHlFQUNFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLG9CQUFpQkksVUFBakIsQ0FERixlQUVFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGdCQUFhSixLQUFiLENBRkYsZUFHRTtBQUFRLElBQUEsT0FBTyxFQUFFSyxXQUFqQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxvQkFIRixDQURGO0FBT0Q7O0FBRUQsU0FBU0YsYUFBVCxHQUF5QjtBQUN2QixRQUFNRyxhQUFhLEdBQUcscUJBQVMsS0FBVCxDQUF0QjtBQUNBLFFBQU0sQ0FBQ0YsVUFBRCxJQUFlRSxhQUFyQjtBQUVBLHdCQUFVLFNBQVNDLGVBQVQsR0FBMkIsQ0FDbkM7QUFDRCxHQUZELEVBRUcsRUFGSDtBQUlBLFNBQU8sQ0FBQ0gsVUFBRCxFQUFhLE1BQU0sQ0FBRSxDQUFyQixDQUFQO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgRmFjZWJvb2ssIEluYy4gYW5kIGl0cyBhZmZpbGlhdGVzLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqIEBmbG93XG4gKi9cblxuaW1wb3J0IFJlYWN0LCB7dXNlRWZmZWN0LCB1c2VTdGF0ZX0gZnJvbSAncmVhY3QnO1xuXG5leHBvcnQgZnVuY3Rpb24gQ29tcG9uZW50KCkge1xuICBjb25zdCBjb3VudFN0YXRlID0gdXNlU3RhdGUoMCk7XG4gIGNvbnN0IGNvdW50ID0gY291bnRTdGF0ZVswXTtcbiAgY29uc3Qgc2V0Q291bnQgPSBjb3VudFN0YXRlWzFdO1xuXG4gIGNvbnN0IGRhcmtNb2RlID0gdXNlSXNEYXJrTW9kZSgpO1xuICBjb25zdCBbaXNEYXJrTW9kZV0gPSBkYXJrTW9kZTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIC4uLlxuICB9LCBbXSk7XG5cbiAgY29uc3QgaGFuZGxlQ2xpY2sgPSAoKSA9PiBzZXRDb3VudChjb3VudCArIDEpO1xuXG4gIHJldHVybiAoXG4gICAgPD5cbiAgICAgIDxkaXY+RGFyayBtb2RlPyB7aXNEYXJrTW9kZX08L2Rpdj5cbiAgICAgIDxkaXY+Q291bnQ6IHtjb3VudH08L2Rpdj5cbiAgICAgIDxidXR0b24gb25DbGljaz17aGFuZGxlQ2xpY2t9PlVwZGF0ZSBjb3VudDwvYnV0dG9uPlxuICAgIDwvPlxuICApO1xufVxuXG5mdW5jdGlvbiB1c2VJc0RhcmtNb2RlKCkge1xuICBjb25zdCBkYXJrTW9kZVN0YXRlID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbaXNEYXJrTW9kZV0gPSBkYXJrTW9kZVN0YXRlO1xuXG4gIHVzZUVmZmVjdChmdW5jdGlvbiB1c2VFZmZlY3RDcmVhdGUoKSB7XG4gICAgLy8gSGVyZSBpcyB3aGVyZSB3ZSBtYXkgbGlzdGVuIHRvIGEgXCJ0aGVtZVwiIGV2ZW50Li4uXG4gIH0sIFtdKTtcblxuICByZXR1cm4gW2lzRGFya01vZGUsICgpID0+IHt9XTtcbn1cbiJdLCJ4X3JlYWN0X3NvdXJjZXMiOltbeyJuYW1lcyI6WyI8bm8taG9vaz4iLCJjb3VudCIsImRhcmtNb2RlIiwiaXNEYXJrTW9kZSJdLCJtYXBwaW5ncyI6IkNBQUQ7YXFCQ0EsQVdEQTtpQmJFQSxBZUZBO29DVkdBLEFlSEEifV1dfX1dfQ==