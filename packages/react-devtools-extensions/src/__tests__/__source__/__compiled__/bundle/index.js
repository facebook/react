'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
function Component() {
  const countState = React.useState(0);
  const count = countState[0];
  const setCount = countState[1];
  const darkMode = useIsDarkMode();
  const [isDarkMode] = darkMode;
  React.useEffect(() => {// ...
  }, []);

  const handleClick = () => setCount(count + 1);

  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement("div", null, "Dark mode? ", isDarkMode), /*#__PURE__*/React__default.createElement("div", null, "Count: ", count), /*#__PURE__*/React__default.createElement("button", {
    onClick: handleClick
  }, "Update count"));
}

function useIsDarkMode() {
  const darkModeState = React.useState(false);
  const [isDarkMode] = darkModeState;
  React.useEffect(function useEffectCreate() {// Here is where we may listen to a "theme" event...
  }, []);
  return [isDarkMode, () => {}];
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
function Component$1() {
  const [count, setCount] = React.useState(0);
  const isDarkMode = useIsDarkMode$1();
  const {
    foo
  } = useFoo();
  React.useEffect(() => {// ...
  }, []);

  const handleClick = () => setCount(count + 1);

  return /*#__PURE__*/React__default.createElement(React__default.Fragment, null, /*#__PURE__*/React__default.createElement("div", null, "Dark mode? ", isDarkMode), /*#__PURE__*/React__default.createElement("div", null, "Count: ", count), /*#__PURE__*/React__default.createElement("div", null, "Foo: ", foo), /*#__PURE__*/React__default.createElement("button", {
    onClick: handleClick
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
 * @flow
 */
const ThemeContext = /*#__PURE__*/React.createContext('bright');
function useTheme() {
  const theme = React.useContext(ThemeContext);
  React.useDebugValue(theme);
  return theme;
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
function Component$2() {
  const theme = useTheme();
  return /*#__PURE__*/React__default.createElement("div", null, "theme: ", theme);
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
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
 * @flow
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

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

function Component$5() {
  const [count, setCount] = React.useState(0);
  return /*#__PURE__*/React__default.createElement("div", null, /*#__PURE__*/React__default.createElement("p", null, "You clicked ", count, " times"), /*#__PURE__*/React__default.createElement("button", {
    onClick: () => setCount(count + 1)
  }, "Click me"));
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
function Component$6() {
  const [count, setCount] = React.useState(0);
  return /*#__PURE__*/React__default.createElement("div", null, /*#__PURE__*/React__default.createElement("p", null, "You clicked ", count, " times"), /*#__PURE__*/React__default.createElement("button", {
    onClick: () => setCount(count + 1)
  }, "Click me"));
}

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */
function Component$7() {
  const [count] = require('react').useState(0);

  return count;
}

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
  const handleDelete = React.useCallback(() => {
    removeItem(item);
  }, [item, removeItem]);
  const handleToggle = React.useCallback(() => {
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
