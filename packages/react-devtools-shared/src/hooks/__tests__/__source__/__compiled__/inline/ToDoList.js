"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ListItem = ListItem;
exports.List = List;

var React = _interopRequireWildcard(require("react"));

var _jsxFileName = "";

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function () { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

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
  return /*#__PURE__*/React.createElement("li", {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 23,
      columnNumber: 5
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleDelete,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 24,
      columnNumber: 7
    }
  }, "Delete"), /*#__PURE__*/React.createElement("label", {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 25,
      columnNumber: 7
    }
  }, /*#__PURE__*/React.createElement("input", {
    checked: item.isComplete,
    onChange: handleToggle,
    type: "checkbox",
    __source: {
      fileName: _jsxFileName,
      lineNumber: 26,
      columnNumber: 9
    }
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
  return /*#__PURE__*/React.createElement(React.Fragment, {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 102,
      columnNumber: 5
    }
  }, /*#__PURE__*/React.createElement("h1", {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 103,
      columnNumber: 7
    }
  }, "List"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "New list item...",
    value: newItemText,
    onChange: handleChange,
    onKeyPress: handleKeyPress,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 104,
      columnNumber: 7
    }
  }), /*#__PURE__*/React.createElement("button", {
    disabled: newItemText === '',
    onClick: handleClick,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 111,
      columnNumber: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "img",
    "aria-label": "Add item",
    __source: {
      fileName: _jsxFileName,
      lineNumber: 112,
      columnNumber: 9
    }
  }, "Add")), /*#__PURE__*/React.createElement("ul", {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 116,
      columnNumber: 7
    }
  }, items.map(item => /*#__PURE__*/React.createElement(ListItem, {
    key: item.id,
    item: item,
    removeItem: removeItem,
    toggleItem: toggleItem,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 118,
      columnNumber: 11
    }
  }))));
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIlRvRG9MaXN0LmpzIl0sIm5hbWVzIjpbIkxpc3RJdGVtIiwiaXRlbSIsInJlbW92ZUl0ZW0iLCJ0b2dnbGVJdGVtIiwiaGFuZGxlRGVsZXRlIiwiaGFuZGxlVG9nZ2xlIiwiaXNDb21wbGV0ZSIsInRleHQiLCJMaXN0IiwicHJvcHMiLCJuZXdJdGVtVGV4dCIsInNldE5ld0l0ZW1UZXh0IiwiaXRlbXMiLCJzZXRJdGVtcyIsImlkIiwidWlkIiwic2V0VUlEIiwiaGFuZGxlQ2xpY2siLCJoYW5kbGVLZXlQcmVzcyIsImV2ZW50Iiwia2V5IiwiaGFuZGxlQ2hhbmdlIiwiY3VycmVudFRhcmdldCIsInZhbHVlIiwiaXRlbVRvUmVtb3ZlIiwiZmlsdGVyIiwiaXRlbVRvVG9nZ2xlIiwiaW5kZXgiLCJmaW5kSW5kZXgiLCJzbGljZSIsImNvbmNhdCIsIm1hcCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFTQTs7Ozs7Ozs7QUFHTyxTQUFTQSxRQUFULENBQWtCO0FBQUNDLEVBQUFBLElBQUQ7QUFBT0MsRUFBQUEsVUFBUDtBQUFtQkMsRUFBQUE7QUFBbkIsQ0FBbEIsRUFBa0Q7QUFDdkQsUUFBTUMsWUFBWSxHQUFHLHVCQUFZLE1BQU07QUFDckNGLElBQUFBLFVBQVUsQ0FBQ0QsSUFBRCxDQUFWO0FBQ0QsR0FGb0IsRUFFbEIsQ0FBQ0EsSUFBRCxFQUFPQyxVQUFQLENBRmtCLENBQXJCO0FBSUEsUUFBTUcsWUFBWSxHQUFHLHVCQUFZLE1BQU07QUFDckNGLElBQUFBLFVBQVUsQ0FBQ0YsSUFBRCxDQUFWO0FBQ0QsR0FGb0IsRUFFbEIsQ0FBQ0EsSUFBRCxFQUFPRSxVQUFQLENBRmtCLENBQXJCO0FBSUEsc0JBQ0U7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsa0JBQ0U7QUFBUSxJQUFBLE9BQU8sRUFBRUMsWUFBakI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsY0FERixlQUVFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGtCQUNFO0FB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Q0FBUjtBQVNELEdBZmdCLEVBZ0JqQixDQUFDZixLQUFELENBaEJpQixDQUFuQjtBQW1CQSxzQkFDRSxvQkFBQyxjQUFEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGtCQUNFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFlBREYsZUFFRTtBQUNFLElBQUEsSUFBSSxFQUFDLE1BRFA7QUFFRSxJQUFBLFdBQVcsRUFBQyxrQkFGZDtBQUdFLElBQUEsS0FBSyxFQUFFRixXQUhUO0FBSUUsSUFBQSxRQUFRLEVBQUVXLFlBSlo7QUFLRSxJQUFBLFVBQVUsRUFBRUgsY0FMZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUZGLGVBU0U7QUFBUSxJQUFBLFFBQVEsRUFBRVIsV0FBVyxLQUFLLEVBQWxDO0FBQXNDLElBQUEsT0FBTyxFQUFFTyxXQUEvQztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxrQkFDRTtBQUFNLElBQUEsSUFBSSxFQUFDLEtBQVg7QUFBaUIsa0JBQVcsVUFBNUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FERixDQVRGLGVBY0U7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsS0FDR0wsS0FBSyxDQUFDbUIsR0FBTixDQUFVOUIsSUFBSSxpQkFDYixvQkFBQyxRQUFEO0FBQ0UsSUFBQSxHQUFHLEVBQUVBLElBQUksQ0FBQ2EsRUFEWjtBQUVFLElBQUEsSUFBSSxFQUFFYixJQUZSO0FBR0UsSUFBQSxVQUFVLEVBQUVDLFVBSGQ7QUFJRSxJQUFBLFVBQVUsRUFBRUMsVUFKZDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQURELENBREgsQ0FkRixDQURGO0FBMkJEIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIEZhY2Vib29rLCBJbmMuIGFuZCBpdHMgYWZmaWxpYXRlcy5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS5cbiAqXG4gKiBAZmxvd1xuICovXG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7RnJhZ21lbnQsIHVzZUNhbGxiYWNrLCB1c2VTdGF0ZX0gZnJvbSAncmVhY3QnO1xuXG5leHBvcnQgZnVuY3Rpb24gTGlzdEl0ZW0oe2l0ZW0sIHJlbW92ZUl0ZW0sIHRvZ2dsZUl0ZW19KSB7XG4gIGNvbnN0IGhhbmRsZURlbGV0ZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICByZW1vdmVJdGVtKGl0ZW0pO1xuICB9LCBbaXRlbSwgcmVtb3ZlSXRlbV0pO1xuXG4gIGNvbnN0IGhhbmRsZVRvZ2dsZSA9IHVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICB0b2dnbGVJdGVtKGl0ZW0pO1xuICB9LCBbaXRlbSwgdG9nZ2xlSXRlbV0pO1xuXG4gIHJldHVybiAoXG4gICAgPGxpPlxuICAgICAgPGJ1dHRvbiBvbkNsaWNrPXtoYW5kbGVEZWxldGV9PkRlbGV0ZTwvYnV0dG9uPlxuICAgICAgPGxhYmVsPlxuICAgICAgICA8aW5wdXRcbiAgICAgICAgICBjaGVja2VkPXtpdGVtLmlzQ29tcGxldGV9XG4gICAgICAgICAgb25DaGFuZ2U9e2hhbmRsZVRvZ2dsZX1cbiAgICAgICAgICB0eXBlPVwiY2hlY2tib3hcIlxuICAgICAgICAvPnsnICd9XG4gICAgICAgIHtpdGVtLnRleHR9XG4gICAgICA8L2xhYmVsPlxuICAgIDwvbGk+XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBMaXN0KHByb3BzKSB7XG4gIGNvbnN0IFtuZXdJdGVtVGV4dCwgc2V0TmV3SXRlbVRleHRdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbaXRlbXMsIHNldEl0ZW1zXSA9IHVzZVN0YXRlKFtcbiAgICB7aWQ6IDEsIGlzQ29tcGxldGU6IHRydWUsIHRleHQ6ICdGaXJzdCd9LFxuICAgIHtpZDogMiwgaXNDb21wbGV0ZTogdHJ1ZSwgdGV4dDogJ1NlY29uZCd9LFxuICAgIHtpZDogMywgaXNDb21wbGV0ZTogZmFsc2UsIHRleHQ6ICdUaGlyZCd9LFxuICBdKTtcbiAgY29uc3QgW3VpZCwgc2V0VUlEXSA9IHVzZVN0YXRlKDQpO1xuXG4gIGNvbnN0IGhhbmRsZUNsaWNrID0gdXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGlmIChuZXdJdGVtVGV4dCAhPT0gJycpIHtcbiAgICAgIHNldEl0ZW1zKFtcbiAgICAgICAgLi4uaXRlbXMsXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogdWlkLFxuICAgICAgICAgIGlzQ29tcGxldGU6IGZhbHNlLFxuICAgICAgICAgIHRleHQ6IG5ld0l0ZW1UZXh0LFxuICAgICAgICB9LFxuICAgICAgXSk7XG4gICAgICBzZXRVSUQodWlkICsgMSk7XG4gICAgICBzZXROZXdJdGVtVGV4dCgnJyk7XG4gICAgfVxuICB9LCBbbmV3SXRlbVRleHQsIGl0ZW1zLCB1aWRdKTtcblxuICBjb25zdCBoYW5kbGVLZXlQcmVzcyA9IHVzZUNhbGxiYWNrKFxuICAgIGV2ZW50ID0+IHtcbiAgICAgIGlmIChldmVudC5rZXkgPT09ICdFbnRlcicpIHtcbiAgICAgICAgaGFuZGxlQ2xpY2soKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIFtoYW5kbGVDbGlja10sXG4gICk7XG5cbiAgY29uc3QgaGFuZGxlQ2hhbmdlID0gdXNlQ2FsbGJhY2soXG4gICAgZXZlbnQgPT4ge1xuICAgICAgc2V0TmV3SXRlbVRleHQoZXZlbnQuY3VycmVudFRhcmdldC52YWx1ZSk7XG4gICAgfSxcbiAgICBbc2V0TmV3SXRlbVRleHRdLFxuICApO1xuXG4gIGNvbnN0IHJlbW92ZUl0ZW0gPSB1c2VDYWxsYmFjayhcbiAgICBpdGVtVG9SZW1vdmUgPT4gc2V0SXRlbXMoaXRlbXMuZmlsdGVyKGl0ZW0gPT4gaXRlbSAhPT0gaXRlbVRvUmVtb3ZlKSksXG4gICAgW2l0ZW1zXSxcbiAgKTtcblxuICBjb25zdCB0b2dnbGVJdGVtID0gdXNlQ2FsbGJhY2soXG4gICAgaXRlbVRvVG9nZ2xlID0+IHtcbiAgICAgIC8vIERvbnQgdXNlIGluZGV4T2YoKVxuICAgICAgLy8gYmVjYXVzZSBlZGl0aW5nIHByb3BzIGluIERldlRvb2xzIGNyZWF0ZXMgYSBuZXcgT2JqZWN0LlxuICAgICAgY29uc3QgaW5kZXggPSBpdGVtcy5maW5kSW5kZXgoaXRlbSA9PiBpdGVtLmlkID09PSBpdGVtVG9Ub2dnbGUuaWQpO1xuXG4gICAgICBzZXRJdGVtcyhcbiAgICAgICAgaXRlbXNcbiAgICAgICAgICAuc2xpY2UoMCwgaW5kZXgpXG4gICAgICAgICAgLmNvbmNhdCh7XG4gICAgICAgICAgICAuLi5pdGVtVG9Ub2dnbGUsXG4gICAgICAgICAgICBpc0NvbXBsZXRlOiAhaXRlbVRvVG9nZ2xlLmlzQ29tcGxldGUsXG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY29uY2F0KGl0ZW1zLnNsaWNlKGluZGV4ICsgMSkpLFxuICAgICAgKTtcbiAgICB9LFxuICAgIFtpdGVtc10sXG4gICk7XG5cbiAgcmV0dXJuIChcbiAgICA8RnJhZ21lbnQ+XG4gICAgICA8aDE+TGlzdDwvaDE+XG4gICAgICA8aW5wdXRcbiAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICBwbGFjZWhvbGRlcj1cIk5ldyBsaXN0IGl0ZW0uLi5cIlxuICAgICAgICB2YWx1ZT17bmV3SXRlbVRleHR9XG4gICAgICAgIG9uQ2hhbmdlPXtoYW5kbGVDaGFuZ2V9XG4gICAgICAgIG9uS2V5UHJlc3M9e2hhbmRsZUtleVByZXNzfVxuICAgICAgLz5cbiAgICAgIDxidXR0b24gZGlzYWJsZWQ9e25ld0l0ZW1UZXh0ID09PSAnJ30gb25DbGljaz17aGFuZGxlQ2xpY2t9PlxuICAgICAgICA8c3BhbiByb2xlPVwiaW1nXCIgYXJpYS1sYWJlbD1cIkFkZCBpdGVtXCI+XG4gICAgICAgICAgQWRkXG4gICAgICAgIDwvc3Bhbj5cbiAgICAgIDwvYnV0dG9uPlxuICAgICAgPHVsPlxuICAgICAgICB7aXRlbXMubWFwKGl0ZW0gPT4gKFxuICAgICAgICAgIDxMaXN0SXRlbVxuICAgICAgICAgICAga2V5PXtpdGVtLmlkfVxuICAgICAgICAgICAgaXRlbT17aXRlbX1cbiAgICAgICAgICAgIHJlbW92ZUl0ZW09e3JlbW92ZUl0ZW19XG4gICAgICAgICAgICB0b2dnbGVJdGVtPXt0b2dnbGVJdGVtfVxuICAgICAgICAgIC8+XG4gICAgICAgICkpfVxuICAgICAgPC91bD5cbiAgICA8L0ZyYWdtZW50PlxuICApO1xufVxuIl19