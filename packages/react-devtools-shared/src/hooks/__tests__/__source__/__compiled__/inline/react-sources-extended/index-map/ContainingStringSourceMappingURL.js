"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Component = Component;

var _react = _interopRequireWildcard(require("react"));

var _jsxFileName = "";

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// ?sourceMappingURL=([^\s'"]+)/gm
function Component() {
  const [count, setCount] = (0, _react.useState)(0);
  return /*#__PURE__*/_react.default.createElement("div", {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 18,
      columnNumber: 5
    }
  }, /*#__PURE__*/_react.default.createElement("p", {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 19,
      columnNumber: 7
    }
  }, "You clicked ", count, " times"), /*#__PURE__*/_react.default.createElement("button", {
    onClick: () => setCount(count + 1),
    __source: {
      fileName: _jsxFileName,
      lineNumber: 20,
      columnNumber: 7
    }
  }, "Click me"));
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzZWN0aW9ucyI6W3sib2Zmc2V0Ijp7ImxpbmUiOjAsImNvbHVtbiI6MH0sIm1hcCI6eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbnRhaW5pbmdTdHJpbmdTb3VyY2VNYXBwaW5nVVJMLmpzIl0sIm5hbWVzIjpbIkNvbXBvbmVudCIsImNvdW50Iiwic2V0Q291bnQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFTQTs7Ozs7Ozs7QUFFQTtBQUVPLFNBQVNBLFNBQVQsR0FBcUI7QUFDMUIsUUFBTSxDQUFDQyxLQUFELEVBQVFDLFFBQVIsSUFBb0IscUJBQVMsQ0FBVCxDQUExQjtBQUVBLHNCQUNFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGtCQUNFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHFCQUFnQkQsS0FBaEIsV0FERixlQUVFO0FBQVEsSUFBQSxPQUFPLEVBQUUsTUFBTUMsUUFBUSxDQUFDRCxLQUFLLEdBQUcsQ0FBVCxDQUEvQjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxnQkFGRixDQURGO0FBTUQiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgRmFjZWJvb2ssIEluYy4gYW5kIGl0cyBhZmZpbGlhdGVzLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqIEBmbG93XG4gKi9cblxuaW1wb3J0IFJlYWN0LCB7dXNlU3RhdGV9IGZyb20gJ3JlYWN0JztcblxuLy8gP3NvdXJjZU1hcHBpbmdVUkw9KFteXFxzJ1wiXSspL2dtXG5cbmV4cG9ydCBmdW5jdGlvbiBDb21wb25lbnQoKSB7XG4gIGNvbnN0IFtjb3VudCwgc2V0Q291bnRdID0gdXNlU3RhdGUoMCk7XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2PlxuICAgICAgPHA+WW91IGNsaWNrZWQge2NvdW50fSB0aW1lczwvcD5cbiAgICAgIDxidXR0b24gb25DbGljaz17KCkgPT4gc2V0Q291bnQoY291bnQgKyAxKX0+Q2xpY2sgbWU8L2J1dHRvbj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cbiJdLCJ4X3JlYWN0X3NvdXJjZXMiOltbeyJuYW1lcyI6WyI8bm8taG9vaz4iLCJjb3VudCJdLCJtYXBwaW5ncyI6IkNBQUQ7ZTRCQ0EsQVdEQSJ9XV19fV19