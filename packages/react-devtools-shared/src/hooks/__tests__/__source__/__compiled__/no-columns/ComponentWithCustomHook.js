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
  const [count, setCount] = (0, _react.useState)(0);
  const isDarkMode = useIsDarkMode();
  const {
    foo
  } = useFoo();
  (0, _react.useEffect)(() => {// ...
  }, []);

  const handleClick = () => setCount(count + 1);

  return /*#__PURE__*/_react.default.createElement(_react.default.Fragment, null, /*#__PURE__*/_react.default.createElement("div", {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 25,
      columnNumber: 7
    }
  }, "Dark mode? ", isDarkMode), /*#__PURE__*/_react.default.createElement("div", {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 26,
      columnNumber: 7
    }
  }, "Count: ", count), /*#__PURE__*/_react.default.createElement("div", {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 27,
      columnNumber: 7
    }
  }, "Foo: ", foo), /*#__PURE__*/_react.default.createElement("button", {
    onClick: handleClick,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 28,
      columnNumber: 7
    }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbXBvbmVudFdpdGhDdXN0b21Ib29rLmpzIl0sIm5hbWVzIjpbIkNvbXBvbmVudCIsImNvdW50Iiwic2V0Q291bnQiLCJpc0RhcmtNb2RlIiwidXNlSXNEYXJrTW9kZSIsImZvbyIsInVzZUZvbyIsImhhbmRsZUNsaWNrIiwidXNlRWZmZWN0Q3JlYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBU0E7Ozs7Ozs7O0FBRUEsU0FBQUEsU0FBQSxHQUFBO0FBQ0EsUUFBQSxDQUFBQyxLQUFBLEVBQUFDLFFBQUEsSUFBQSxxQkFBQSxDQUFBLENBQUE7QUFDQSxRQUFBQyxVQUFBLEdBQUFDLGFBQUEsRUFBQTtBQUNBLFFBQUE7QUFBQUMsSUFBQUE7QUFBQSxNQUFBQyxNQUFBLEVBQUE7QUFFQSx3QkFBQSxNQUFBLENBQ0E7QUFDQSxHQUZBLEVBRUEsRUFGQTs7QUFJQSxRQUFBQyxXQUFBLEdBQUEsTUFBQUwsUUFBQSxDQUFBRCxLQUFBLEdBQUEsQ0FBQSxDQUFBOztBQUVBLHNCQUNBLHlFQUNBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLG9CQUFBRSxVQUFBLENBREEsZUFFQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxnQkFBQUYsS0FBQSxDQUZBLGVBR0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsY0FBQUksR0FBQSxDQUhBLGVBSUE7QUFBQSxJQUFBLE9BQUEsRUFBQUUsV0FBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxvQkFKQSxDQURBO0FBUUE7O0FBRUEsU0FBQUgsYUFBQSxHQUFBO0FBQ0EsUUFBQSxDQUFBRCxVQUFBLElBQUEscUJBQUEsS0FBQSxDQUFBO0FBRUEsd0JBQUEsU0FBQUssZUFBQSxHQUFBLENBQ0E7QUFDQSxHQUZBLEVBRUEsRUFGQTtBQUlBLFNBQUFMLFVBQUE7QUFDQTs7QUFFQSxTQUFBRyxNQUFBLEdBQUE7QUFDQSw0QkFBQSxLQUFBO0FBQ0EsU0FBQTtBQUFBRCxJQUFBQSxHQUFBLEVBQUE7QUFBQSxHQUFBO0FBQ0EiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgRmFjZWJvb2ssIEluYy4gYW5kIGl0cyBhZmZpbGlhdGVzLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqIEBmbG93XG4gKi9cblxuaW1wb3J0IFJlYWN0LCB7dXNlRGVidWdWYWx1ZSwgdXNlRWZmZWN0LCB1c2VTdGF0ZX0gZnJvbSAncmVhY3QnO1xuXG5leHBvcnQgZnVuY3Rpb24gQ29tcG9uZW50KCkge1xuICBjb25zdCBbY291bnQsIHNldENvdW50XSA9IHVzZVN0YXRlKDApO1xuICBjb25zdCBpc0RhcmtNb2RlID0gdXNlSXNEYXJrTW9kZSgpO1xuICBjb25zdCB7Zm9vfSA9IHVzZUZvbygpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgLy8gLi4uXG4gIH0sIFtdKTtcblxuICBjb25zdCBoYW5kbGVDbGljayA9ICgpID0+IHNldENvdW50KGNvdW50ICsgMSk7XG5cbiAgcmV0dXJuIChcbiAgICA8PlxuICAgICAgPGRpdj5EYXJrIG1vZGU/IHtpc0RhcmtNb2RlfTwvZGl2PlxuICAgICAgPGRpdj5Db3VudDoge2NvdW50fTwvZGl2PlxuICAgICAgPGRpdj5Gb286IHtmb299PC9kaXY+XG4gICAgICA8YnV0dG9uIG9uQ2xpY2s9e2hhbmRsZUNsaWNrfT5VcGRhdGUgY291bnQ8L2J1dHRvbj5cbiAgICA8Lz5cbiAgKTtcbn1cblxuZnVuY3Rpb24gdXNlSXNEYXJrTW9kZSgpIHtcbiAgY29uc3QgW2lzRGFya01vZGVdID0gdXNlU3RhdGUoZmFsc2UpO1xuXG4gIHVzZUVmZmVjdChmdW5jdGlvbiB1c2VFZmZlY3RDcmVhdGUoKSB7XG4gICAgLy8gSGVyZSBpcyB3aGVyZSB3ZSBtYXkgbGlzdGVuIHRvIGEgXCJ0aGVtZVwiIGV2ZW50Li4uXG4gIH0sIFtdKTtcblxuICByZXR1cm4gaXNEYXJrTW9kZTtcbn1cblxuZnVuY3Rpb24gdXNlRm9vKCkge1xuICB1c2VEZWJ1Z1ZhbHVlKCdmb28nKTtcbiAgcmV0dXJuIHtmb286IHRydWV9O1xufVxuIl19