'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});
exports.default = testErrorStack;
exports.SOURCE_STACK_FRAME_LINE_NUMBER = void 0;

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
function testErrorStack() {
  // If source maps are applied, this Error will have a stack frame with line 12.
  throw Error('Test Error stack');
}

const SOURCE_STACK_FRAME_LINE_NUMBER = 12;
exports.SOURCE_STACK_FRAME_LINE_NUMBER = SOURCE_STACK_FRAME_LINE_NUMBER;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3RFcm9yclN0YWNrLmpzIl0sIm5hbWVzIjpbInRlc3RFcm9yclN0YWNrIiwiRXJyb3IiLCJTT1VSQ0VfU1RBQ0tfRlJBTUVfTElORV9OVU1CRVIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O0FBQUE7Ozs7Ozs7O0FBU2UsU0FBU0EsY0FBVCxHQUEwQjtBQUN2QztBQUNBLFFBQU1DLEtBQUssQ0FBQyxrQkFBRCxDQUFYO0FBQ0Q7O0FBRU0sTUFBTUMsOEJBQThCLEdBQUcsRUFBdkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvcHlyaWdodCAoYykgRmFjZWJvb2ssIEluYy4gYW5kIGl0cyBhZmZpbGlhdGVzLlxuICpcbiAqIFRoaXMgc291cmNlIGNvZGUgaXMgbGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlIGZvdW5kIGluIHRoZVxuICogTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLlxuICpcbiAqIEBmbG93XG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gdGVzdEVyb3JyU3RhY2soKSB7XG4gIC8vIElmIHNvdXJjZSBtYXBzIGFyZSBhcHBsaWVkLCB0aGlzIEVycm9yIHdpbGwgaGF2ZSBhIHN0YWNrIGZyYW1lIHdpdGggbGluZSAxMi5cbiAgdGhyb3cgRXJyb3IoJ1Rlc3QgRXJyb3Igc3RhY2snKTtcbn1cblxuZXhwb3J0IGNvbnN0IFNPVVJDRV9TVEFDS19GUkFNRV9MSU5FX05VTUJFUiA9IDEyOyJdfQ==
//# sourceURL=testErrorStack.js
