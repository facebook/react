"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Component = Component;

var _react = require("react");

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
const A = /*#__PURE__*/(0, _react.createContext)(1);
const B = /*#__PURE__*/(0, _react.createContext)(2);

function Component() {
  const a = (0, _react.useContext)(A);
  const b = (0, _react.useContext)(B); // prettier-ignore

  const c = (0, _react.useContext)(A),
        d = (0, _react.useContext)(B); // eslint-disable-line one-var

  return a + b + c + d;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzZWN0aW9ucyI6W3sib2Zmc2V0Ijp7ImxpbmUiOjAsImNvbHVtbiI6MH0sIm1hcCI6eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkNvbXBvbmVudFdpdGhNdWx0aXBsZUhvb2tzUGVyTGluZS5qcyJdLCJuYW1lcyI6WyJBIiwiQiIsIkNvbXBvbmVudCIsImEiLCJiIiwiYyIsImQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFTQTs7QUFUQTs7Ozs7Ozs7QUFXQSxNQUFNQSxDQUFDLGdCQUFHLDBCQUFjLENBQWQsQ0FBVjtBQUNBLE1BQU1DLENBQUMsZ0JBQUcsMEJBQWMsQ0FBZCxDQUFWOztBQUVPLFNBQVNDLFNBQVQsR0FBcUI7QUFDMUIsUUFBTUMsQ0FBQyxHQUFHLHVCQUFXSCxDQUFYLENBQVY7QUFDQSxRQUFNSSxDQUFDLEdBQUcsdUJBQVdILENBQVgsQ0FBVixDQUYwQixDQUkxQjs7QUFDQSxRQUFNSSxDQUFDLEdBQUcsdUJBQVdMLENBQVgsQ0FBVjtBQUFBLFFBQXlCTSxDQUFDLEdBQUcsdUJBQVdMLENBQVgsQ0FBN0IsQ0FMMEIsQ0FLa0I7O0FBRTVDLFNBQU9FLENBQUMsR0FBR0MsQ0FBSixHQUFRQyxDQUFSLEdBQVlDLENBQW5CO0FBQ0QiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgRmFjZWJvb2ssIEluYy4gYW5kIGl0cyBhZmZpbGlhdGVzLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqIEBmbG93XG4gKi9cblxuaW1wb3J0IHtjcmVhdGVDb250ZXh0LCB1c2VDb250ZXh0fSBmcm9tICdyZWFjdCc7XG5cbmNvbnN0IEEgPSBjcmVhdGVDb250ZXh0KDEpO1xuY29uc3QgQiA9IGNyZWF0ZUNvbnRleHQoMik7XG5cbmV4cG9ydCBmdW5jdGlvbiBDb21wb25lbnQoKSB7XG4gIGNvbnN0IGEgPSB1c2VDb250ZXh0KEEpO1xuICBjb25zdCBiID0gdXNlQ29udGV4dChCKTtcblxuICAvLyBwcmV0dGllci1pZ25vcmVcbiAgY29uc3QgYyA9IHVzZUNvbnRleHQoQSksIGQgPSB1c2VDb250ZXh0KEIpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG9uZS12YXJcblxuICByZXR1cm4gYSArIGIgKyBjICsgZDtcbn1cbiJdfX1dfQ==