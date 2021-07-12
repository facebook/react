"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ListItem = ListItem;
exports.List = List;

var React = _interopRequireWildcard(require("react"));

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
function ListItem({
  item,
  removeItem,
  toggleItem
}) {
  const handleDelete = (0, React.useCallback)(() => {
    removeItem(item);
  }, [item, removeItem]);
  const handleToggle = (0, React.useCallback)(() => {
    toggleItem(item);
  }, [item, toggleItem]);
  return /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("button", {
    onClick: handleDelete
  }, "Delete"), /*#__PURE__*/React.createElement("label", null, /*#__PURE__*/React.createElement("input", {
    checked: item.isComplete,
    onChange: handleToggle,
    type: "checkbox"
  }), ' ', item.text));
}

function List(props) {
  const [newItemText, setNewItemText] = (0, React.useState)('');
  const [items, setItems] = (0, React.useState)([{
    id: 1,
    isComplete: true,
    text: 'First'
  }, {
    id: 2,
    isComplete: true,
    text: 'Second'
  }, {
    id: 3,
    isComplete: false,
    text: 'Third'
  }]);
  const [uid, setUID] = (0, React.useState)(4);
  const handleClick = (0, React.useCallback)(() => {
    if (newItemText !== '') {
      setItems([...items, {
        id: uid,
        isComplete: false,
        text: newItemText
      }]);
      setUID(uid + 1);
      setNewItemText('');
    }
  }, [newItemText, items, uid]);
  const handleKeyPress = (0, React.useCallback)(event => {
    if (event.key === 'Enter') {
      handleClick();
    }
  }, [handleClick]);
  const handleChange = (0, React.useCallback)(event => {
    setNewItemText(event.currentTarget.value);
  }, [setNewItemText]);
  const removeItem = (0, React.useCallback)(itemToRemove => setItems(items.filter(item => item !== itemToRemove)), [items]);
  const toggleItem = (0, React.useCallback)(itemToToggle => {
    // Dont use indexOf()
    // because editing props in DevTools creates a new Object.
    const index = items.findIndex(item => item.id === itemToToggle.id);
    setItems(items.slice(0, index).concat({ ...itemToToggle,
      isComplete: !itemToToggle.isComplete
    }).concat(items.slice(index + 1)));
  }, [items]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("h1", null, "List"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "New list item...",
    value: newItemText,
    onChange: handleChange,
    onKeyPress: handleKeyPress
  }), /*#__PURE__*/React.createElement("button", {
    disabled: newItemText === '',
    onClick: handleClick
  }, /*#__PURE__*/React.createElement("span", {
    role: "img",
    "aria-label": "Add item"
  }, "Add")), /*#__PURE__*/React.createElement("ul", null, items.map(item => /*#__PURE__*/React.createElement(ListItem, {
    key: item.id,
    item: item,
    removeItem: removeItem,
    toggleItem: toggleItem
  }))));
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlRvRG9MaXN0LmpzIl0sIm5hbWVzIjpbIkxpc3RJdGVtIiwiaXRlbSIsInJlbW92ZUl0ZW0iLCJ0b2dnbGVJdGVtIiwiaGFuZGxlRGVsZXRlIiwiaGFuZGxlVG9nZ2xlIiwiaXNDb21wbGV0ZSIsInRleHQiLCJMaXN0IiwicHJvcHMiLCJuZXdJdGVtVGV4dCIsInNldE5ld0l0ZW1UZXh0IiwiaXRlbXMiLCJzZXRJdGVtcyIsImlkIiwidWlkIiwic2V0VUlEIiwiaGFuZGxlQ2xpY2siLCJoYW5kbGVLZXlQcmVzcyIsImV2ZW50Iiwia2V5IiwiaGFuZGxlQ2hhbmdlIiwiY3VycmVudFRhcmdldCIsInZhbHVlIiwiaXRlbVRvUmVtb3ZlIiwiZmlsdGVyIiwiaXRlbVRvVG9nZ2xlIiwiaW5kZXgiLCJmaW5kSW5kZXgiLCJzbGljZSIsImNvbmNhdCIsIm1hcCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFTQTs7Ozs7O0FBVEE7Ozs7Ozs7O0FBWU8sU0FBU0EsUUFBVCxDQUFrQjtBQUFDQyxFQUFBQSxJQUFEO0FBQU9DLEVBQUFBLFVBQVA7QUFBbUJDLEVBQUFBO0FBQW5CLENBQWxCLEVBQWtEO0FBQ3ZELFFBQU1DLFlBQVksR0FBRyx1QkFBWSxNQUFNO0FBQ3JDRixJQUFBQSxVQUFVLENBQUNELElBQUQsQ0FBVjtBQUNELEdBRm9CLEVBRWxCLENBQUNBLElBQUQsRUFBT0MsVUFBUCxDQUZrQixDQUFyQjtBQUlBLFFBQU1HLFlBQVksR0FBRyx1QkFBWSxNQUFNO0FBQ3JDRixJQUFBQSxVQUFVLENBQUNGLElBQUQsQ0FBVjtBQUNELEdBRm9CLEVBRWxCLENBQUNBLElBQUQsRUFBT0UsVUFBUCxDQUZrQixDQUFyQjtBQUlBLHNCQUNFLDZDQUNFO0FBQVEsSUFBQSxPQUFPLEVBQUVDO0FBQWpCLGNBREYsZUFFRSxnREFDRTtBQUNFLElBQUEsT0FBTyxFQUFFSCxJQUFJLENBQUNLLFVBRGhCO0FBRUUsSUFBQSxRQUFRLEVBQUVELFlBRlo7QUFHRSxJQUFBLElBQUksRUFB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UDtBQUVFLElBQUEsV0FBVyxFQUFDLGtCQUZkO0FBR0UsSUFBQSxLQUFLLEVBQUVGLFdBSFQ7QUFJRSxJQUFBLFFBQVEsRUFBRVcsWUFKWjtBQUtFLElBQUEsVUFBVSxFQUFFSDtBQUxkLElBRkYsZUFTRTtBQUFRLElBQUEsUUFBUSxFQUFFUixXQUFXLEtBQUssRUFBbEM7QUFBc0MsSUFBQSxPQUFPLEVBQUVPO0FBQS9DLGtCQUNFO0FBQU0sSUFBQSxJQUFJLEVBQUMsS0FBWDtBQUFpQixrQkFBVztBQUE1QixXQURGLENBVEYsZUFjRSxnQ0FDR0wsS0FBSyxDQUFDbUIsR0FBTixDQUFVOUIsSUFBSSxpQkFDYixvQkFBQyxRQUFEO0FBQ0UsSUFBQSxHQUFHLEVBQUVBLElBQUksQ0FBQ2EsRUFEWjtBQUVFLElBQUEsSUFBSSxFQUFFYixJQUZSO0FBR0UsSUFBQSxVQUFVLEVBQUVDLFVBSGQ7QUFJRSxJQUFBLFVBQVUsRUFBRUM7QUFKZCxJQURELENBREgsQ0FkRixDQURGO0FBMkJEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIEZhY2Vib29rLCBJbmMuIGFuZCBpdHMgYWZmaWxpYXRlcy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqXG4gKiBAZmxvd1xuICovXG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7RnJhZ21lbnQsIHVzZUNhbGxiYWNrLCB1c2VTdGF0ZX0gZnJvbSAncmVhY3QnO1xuXG5leHBvcnQgZnVuY3Rpb24gTGlzdEl0ZW0oe2l0ZW0sIHJlbW92ZUl0ZW0sIHRvZ2dsZUl0ZW19KSB7XG4gIGNvbnN0IGhhbmRsZURlbGV0ZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICByZW1vdmVJdGVtKGl0ZW0pO1xuICB9LCBbaXRlbSwgcmVtb3ZlSXRlbV0pO1xuXG4gIGNvbnN0IGhhbmRsZVRvZ2dsZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICB0b2dnbGVJdGVtKGl0ZW0pO1xuICB9LCBbaXRlbSwgdG9nZ2xlSXRlbV0pO1xuXG4gIHJldHVybiAoXG4gICAgPGxpPlxuICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtoYW5kbGVEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgPGxhYmVsPlxuICAgICAgICA8aW5wdXRcbiAgICAgICAgICBjaGVja2VkPXtpdGVtLmlzQ29tcGxldGV9XG4gICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZVRvZ2dsZX1cbiAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICAvPnsnICd9XG4gICAgICAgIHtpdGVtLnRleHR9XG4gICAgICA8L2xhYmVsPlxuICAgIDwvbGk+XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBMaXN0KHByb3BzKSB7XG4gIGNvbnN0IFtuZXdJdGVtVGV4dCwgc2V0TmV3SXRlbVRleHRdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbaXRlbXMsIHNldEl0ZW1zXSA9IHVzZVN0YXRlKFtcbiAgICB7aWQ6IDEsIGlzQ29tcGxldGU6IHRydWUsIHRleHQ6ICdGaXJzdCd9LFxuICAgIHtpZDogMiwgaXNDb21wbGV0ZTogdHJ1ZSwgdGV4dDogJ1NlY29uZCd9LFxuICAgIHtpZDogMywgaXNDb21wbGV0ZTogZmFsc2UsIHRleHQ6ICdUaGlyZCd9LFxuICBdKTtcbiAgY29uc3QgW3VpZCwgc2V0VUlEXSA9IHVzZVN0YXRlKDQpO1xuXG4gIGNvbnN0IGhhbmRsZUNsaWNrID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGlmIChuZXdJdGVtVGV4dCAhPT0gJycpIHtcbiAgICAgIHNldEl0ZW1zKFtcbiAgICAgICAgLi4uaXRlbXMsXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogdWlkLFxuICAgICAgICAgIGlzQ29tcGxldGU6IGZhbHNlLFxuICAgICAgICAgIHRleHQ6IG5ld0l0ZW1UZXh0LFxuICAgICAgICB9LFxuICAgICAgXSk7XG4gICAgICBzZXRVSUQodWlkICsgMSk7XG4gICAgICBzZXROZXdJdGVtVGV4dCgnJyk7XG4gICAgfVxuICB9LCBbbmV3SXRlbVRleHQsIGl0ZW1zLCB1aWRdKTtcblxuICBjb25zdCBoYW5kbGVLZXlQcmVzcyA9IHVzZUNhbGxiYWNrKFxuICAgIGV2ZW50ID0+IHtcbiAgICAgIGlmIChldmVudC5rZXkgPT09ICdFbnRlcicpIHtcbiAgICAgICAgaGFuZGxlQ2xpY2soKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIFtoYW5kbGVDbGlja10sXG4gICk7XG5cbiAgY29uc3QgaGFuZGxlQ2hhbmdlID0gdXNlQ2FsbGJhY2soXG4gICAgZXZlbnQgPT4ge1xuICAgICAgc2V0TmV3SXRlbVRleHQoZXZlbnQuY3VycmVudFRhcmdldC52YWx1ZSk7XG4gICAgfSxcbiAgICBbc2V0TmV3SXRlbVRleHRdLFxuICApO1xuXG4gIGNvbnN0IHJlbW92ZUl0ZW0gPSB1c2VDYWxsYmFjayhcbiAgICBpdGVtVG9SZW1vdmUgPT4gc2V0SXRlbXMoaXRlbXMuZmlsdGVyKGl0ZW0gPT4gaXRlbSAhPT0gaXRlbVRvUmVtb3ZlKSksXG4gICAgW2l0ZW1zXSxcbiAgKTtcblxuICBjb25zdCB0b2dnbGVJdGVtID0gdXNlQ2FsbGJhY2soXG4gICAgaXRlbVRvVG9nZ2xlID0+IHtcbiAgICAgIC8vIERvbnQgdXNlIGluZGV4T2YoKVxuICAgICAgLy8gYmVjYXVzZSBlZGl0aW5nIHByb3BzIGluIERldlRvb2xzIGNyZWF0ZXMgYSBuZXcgT2JqZWN0LlxuICAgICAgY29uc3QgaW5kZXggPSBpdGVtcy5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBpdGVtVG9Ub2dnbGUuaWQpO1xuXG4gICAgICBzZXRJdGVtcyhcbiAgICAgICAgaXRlbXNcbiAgICAgICAgICAuc2xpY2UoMCwgaW5kZXgpXG4gICAgICAgICAgLmNvbmNhdCh7XG4gICAgICAgICAgICAuLi5pdGVtVG9Ub2dnbGUsXG4gICAgICAgICAgICBpc0NvbXBsZXRlOiAhaXRlbVRvVG9nZ2xlLmlzQ29tcGxldGUsXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY29uY2F0KGl0ZW1zLnNsaWNlKGluZGV4ICsgMSkpLFxuICAgICAgKTtcbiAgICB9LFxuICAgIFtpdGVtc10sXG4gICk7XG5cbiAgcmV0dXJuIChcbiAgICA8RnJhZ21lbnQ+XG4gICAgICA8aDE+TGlzdDwvaDE+XG4gICAgICA8aW5wdXRcbiAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICBwbGFjZWhvbGRlcj1cIk5ldyBsaXN0IGl0ZW0uLi5cIlxuICAgICAgICB2YWx1ZT17bmV3SXRlbVRleHR9XG4gICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVDaGFuZ2V9XG4gICAgICAgIG9uS2V5UHJlc3M9e2hhbmRsZUtleVByZXNzfVxuICAgICAgLz5cbiAgICAgIDxidXR0b24gZGlzYWJsZWQ9e25ld0l0ZW1UZXh0ID09PSAnJ30gb25DbGljaz17aGFuZGxlQ2xpY2t9PlxuICAgICAgICA8c3BhbiByb2xlPVwiaW1nXCIgYXJpYS1sYWJlbD1cIkFkZCBpdGVtXCI+XG4gICAgICAgICAgQWRkXG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPHVsPlxuICAgICAgICB7aXRlbXMubWFwKGl0ZW0gPT4gKFxuICAgICAgICAgIDxMaXN0SXRlbVxuICAgICAgICAgICAga2V5PXtpdGVtLmlkfVxuICAgICAgICAgICAgaXRlbT17aXRlbX1cbiAgICAgICAgICAgIHJlbW92ZUl0ZW09e3JlbW92ZUl0ZW19XG4gICAgICAgICAgICB0b2dnbGVJdGVtPXt0b2dnbGVJdGVtfVxuICAgICAgICAgIC8+XG4gICAgICAgICkpfVxuICAgICAgPC91bD5cbiAgICA8L0ZyYWdtZW50PlxuICApO1xufVxuIl19