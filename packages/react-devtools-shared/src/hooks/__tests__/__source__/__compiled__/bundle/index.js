'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);

var _jsxFileName = "/Users/bvaughn/Documents/git/react/packages/react-devtools-shared/src/hooks/__tests__/__source__/ComponentUsingHooksIndirectly.js";
function Component() {
  const countState = React.useState(0);
  const count = countState[0];
  const setCount = countState[1];
  const darkMode = useIsDarkMode();
  const [isDarkMode] = darkMode;
  React.useEffect(() => {// ...
  }, []);

  const handleClick = () => setCount(count + 1);

  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement("div", {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 28,
      columnNumber: 7
    }
  }, "Dark mode? ", isDarkMode), /*#__PURE__*/React__default.createElement("div", {
    __source: {
      fileName: _jsxFileName,
      lineNumber: 29,
      columnNumber: 7
    }
  }, "Count: ", count), /*#__PURE__*/React__default.createElement("button", {
    onClick: handleClick,
    __source: {
      fileName: _jsxFileName,
      lineNumber: 30,
      columnNumber: 7
    }
  }, "Update count"));
}

function useIsDarkMode() {
  const darkModeState = React.useState(false);
  const [isDarkMode] = darkModeState;
  React.useEffect(function useEffectCreate() {// Here is where we may listen to a "theme" event...
  }, []);
  return [isDarkMode, () => {}];
}

var _jsxFileName$1 = "/Users/bvaughn/Documents/git/react/packages/react-devtools-shared/src/hooks/__tests__/__source__/ComponentWithCustomHook.js";
function Component$1() {
  const [count, setCount] = React.useState(0);
  const isDarkMode = useIsDarkMode$1();
  const {
    foo
  } = useFoo();
  React.useEffect(() => {// ...
  }, []);

  const handleClick = () => setCount(count + 1);

  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement("div", {
    __source: {
      fileName: _jsxFileName$1,
      lineNumber: 25,
      columnNumber: 7
    }
  }, "Dark mode? ", isDarkMode), /*#__PURE__*/React__default.createElement("div", {
    __source: {
      fileName: _jsxFileName$1,
      lineNumber: 26,
      columnNumber: 7
    }
  }, "Count: ", count), /*#__PURE__*/React__default.createElement("div", {
    __source: {
      fileName: _jsxFileName$1,
      lineNumber: 27,
      columnNumber: 7
    }
  }, "Foo: ", foo), /*#__PURE__*/React__default.createElement("button", {
    onClick: handleClick,
    __source: {
      fileName: _jsxFileName$1,
      lineNumber: 28,
      columnNumber: 7
    }
  }, "Update count"));
}

function useIsDarkMode$1() {
  const [isDarkMode] = React.useState(false);
  React.useEffect(function useEffectCreate() {// Here is where we may listen to a "theme" event...
  }, []);
  return isDarkMode;
}

function useFoo() {
  React.useDebugValue('foo');
  return {
    foo: true
  };
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
const ThemeContext = /*#__PURE__*/React.createContext('bright');
function useTheme() {
  const theme = React.useContext(ThemeContext);
  React.useDebugValue(theme);
  return theme;
}

var _jsxFileName$2 = "/Users/bvaughn/Documents/git/react/packages/react-devtools-shared/src/hooks/__tests__/__source__/ComponentWithExternalCustomHooks.js";
function Component$2() {
  const theme = useTheme();
  return /*#__PURE__*/React__default.createElement("div", {
    __source: {
      fileName: _jsxFileName$2,
      lineNumber: 16,
      columnNumber: 10
    }
  }, "theme: ", theme);
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
const A = /*#__PURE__*/React.createContext(1);
const B = /*#__PURE__*/React.createContext(2);
function Component$3() {
  const a = React.useContext(A);
  const b = React.useContext(B); // prettier-ignore

  const c = React.useContext(A),
        d = React.useContext(B); // eslint-disable-line one-var

  return a + b + c + d;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */

const {
  useMemo,
  useState
} = React__default;

function Component$4(props) {
  const InnerComponent = useMemo(() => () => {
    const [state] = useState(0);
    return state;
  });
  props.callback(InnerComponent);
  return null;
}

var ComponentWithNestedHooks = {
  Component: Component$4
};
var ComponentWithNestedHooks_1 = ComponentWithNestedHooks.Component;

var _jsxFileName$3 = "/Users/bvaughn/Documents/git/react/packages/react-devtools-shared/src/hooks/__tests__/__source__/ContainingStringSourceMappingURL.js";

function Component$5() {
  const [count, setCount] = React.useState(0);
  return /*#__PURE__*/React__default.createElement("div", {
    __source: {
      fileName: _jsxFileName$3,
      lineNumber: 18,
      columnNumber: 5
    }
  }, /*#__PURE__*/React__default.createElement("p", {
    __source: {
      fileName: _jsxFileName$3,
      lineNumber: 19,
      columnNumber: 7
    }
  }, "You clicked ", count, " times"), /*#__PURE__*/React__default.createElement("button", {
    onClick: () => setCount(count + 1),
    __source: {
      fileName: _jsxFileName$3,
      lineNumber: 20,
      columnNumber: 7
    }
  }, "Click me"));
}

var _jsxFileName$4 = "/Users/bvaughn/Documents/git/react/packages/react-devtools-shared/src/hooks/__tests__/__source__/Example.js";
function Component$6() {
  const [count, setCount] = React.useState(0);
  return /*#__PURE__*/React__default.createElement("div", {
    __source: {
      fileName: _jsxFileName$4,
      lineNumber: 16,
      columnNumber: 5
    }
  }, /*#__PURE__*/React__default.createElement("p", {
    __source: {
      fileName: _jsxFileName$4,
      lineNumber: 17,
      columnNumber: 7
    }
  }, "You clicked ", count, " times"), /*#__PURE__*/React__default.createElement("button", {
    onClick: () => setCount(count + 1),
    __source: {
      fileName: _jsxFileName$4,
      lineNumber: 18,
      columnNumber: 7
    }
  }, "Click me"));
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * 
 */
function Component$7() {
  const [count] = require('react').useState(0);

  return count;
}

var _jsxFileName$5 = "/Users/bvaughn/Documents/git/react/packages/react-devtools-shared/src/hooks/__tests__/__source__/ToDoList.js";
function ListItem({
  item,
  removeItem,
  toggleItem
}) {
  const handleDelete = React.useCallback(() => {
    removeItem(item);
  }, [item, removeItem]);
  const handleToggle = React.useCallback(() => {
    toggleItem(item);
  }, [item, toggleItem]);
  return /*#__PURE__*/React.createElement("li", {
    __source: {
      fileName: _jsxFileName$5,
      lineNumber: 23,
      columnNumber: 5
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: handleDelete,
    __source: {
      fileName: _jsxFileName$5,
      lineNumber: 24,
      columnNumber: 7
    }
  }, "Delete"), /*#__PURE__*/React.createElement("label", {
    __source: {
      fileName: _jsxFileName$5,
      lineNumber: 25,
      columnNumber: 7
    }
  }, /*#__PURE__*/React.createElement("input", {
    checked: item.isComplete,
    onChange: handleToggle,
    type: "checkbox",
    __source: {
      fileName: _jsxFileName$5,
      lineNumber: 26,
      columnNumber: 9
    }
  }), ' ', item.text));
}
function List(props) {
  const [newItemText, setNewItemText] = React.useState('');
  const [items, setItems] = React.useState([{
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
  const [uid, setUID] = React.useState(4);
  const handleClick = React.useCallback(() => {
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
  const handleKeyPress = React.useCallback(event => {
    if (event.key === 'Enter') {
      handleClick();
    }
  }, [handleClick]);
  const handleChange = React.useCallback(event => {
    setNewItemText(event.currentTarget.value);
  }, [setNewItemText]);
  const removeItem = React.useCallback(itemToRemove => setItems(items.filter(item => item !== itemToRemove)), [items]);
  const toggleItem = React.useCallback(itemToToggle => {
    // Dont use indexOf()
    // because editing props in DevTools creates a new Object.
    const index = items.findIndex(item => item.id === itemToToggle.id);
    setItems(items.slice(0, index).concat({ ...itemToToggle,
      isComplete: !itemToToggle.isComplete
    }).concat(items.slice(index + 1)));
  }, [items]);
  return /*#__PURE__*/React.createElement(React.Fragment, {
    __source: {
      fileName: _jsxFileName$5,
      lineNumber: 102,
      columnNumber: 5
    }
  }, /*#__PURE__*/React.createElement("h1", {
    __source: {
      fileName: _jsxFileName$5,
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
      fileName: _jsxFileName$5,
      lineNumber: 104,
      columnNumber: 7
    }
  }), /*#__PURE__*/React.createElement("button", {
    disabled: newItemText === '',
    onClick: handleClick,
    __source: {
      fileName: _jsxFileName$5,
      lineNumber: 111,
      columnNumber: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    role: "img",
    "aria-label": "Add item",
    __source: {
      fileName: _jsxFileName$5,
      lineNumber: 112,
      columnNumber: 9
    }
  }, "Add")), /*#__PURE__*/React.createElement("ul", {
    __source: {
      fileName: _jsxFileName$5,
      lineNumber: 116,
      columnNumber: 7
    }
  }, items.map(item => /*#__PURE__*/React.createElement(ListItem, {
    key: item.id,
    item: item,
    removeItem: removeItem,
    toggleItem: toggleItem,
    __source: {
      fileName: _jsxFileName$5,
      lineNumber: 118,
      columnNumber: 11
    }
  }))));
}

var ToDoList = /*#__PURE__*/Object.freeze({
  __proto__: null,
  ListItem: ListItem,
  List: List
});

exports.ComponentUsingHooksIndirectly = Component;
exports.ComponentWithCustomHook = Component$1;
exports.ComponentWithExternalCustomHooks = Component$2;
exports.ComponentWithMultipleHooksPerLine = Component$3;
exports.ComponentWithNestedHooks = ComponentWithNestedHooks_1;
exports.ContainingStringSourceMappingURL = Component$5;
exports.Example = Component$6;
exports.InlineRequire = Component$7;
exports.ToDoList = ToDoList;
exports.useTheme = useTheme;
//# sourceMappingURL=index.js.map
