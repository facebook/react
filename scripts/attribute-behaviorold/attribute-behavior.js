const React = require('react');
const ReactDOM = require('react-dom');

const jsdom = require('jsdom').jsdom;
global.document = jsdom('hello world');
global.window = document.defaultView;

const NULL = 'NULL';
const OBJECT = 'OBJECT';
const NEGATIVE_1 = 'NEGATIVE_1';
const ZERO = 'ZERO';
const INTEGER = 'INTEGER';
const NOT_A_NUMBER = 'NOT_A_NUMBER';
const FLOAT = 'FLOAT';
const STRING = 'STRING';
const TRUE = 'TRUE';
const FALSE = 'FALSE';
const SYMBOL = 'SYMBOL';
const FUNCTION = 'FUNCTION';

const configs = {
  [NULL]: {
    exampleValue: null,
  },
  [OBJECT]: {
    exampleValue: {
      toString() {
        return 'result of toString()';
      },
    },
    exampleDisplay: "{ toString() { return 'result of toString()'; } }",
  },
  [NEGATIVE_1]: {
    exampleValue: -1,
  },
  [ZERO]: {
    exampleValue: 0,
  },
  [INTEGER]: {
    exampleValue: 1,
  },
  [NOT_A_NUMBER]: {
    exampleValue: NaN,
  },
  [FLOAT]: {
    exampleValue: 99.99,
  },
  [STRING]: {
    exampleValue: 'a string',
    exampleDisplay: "'a string'",
  },
  [TRUE]: {
    exampleValue: true,
  },
  [FALSE]: {
    exampleValue: false,
  },
  [SYMBOL]: {
    exampleValue: Symbol('foo'),
    exampleDisplay: "Symbol('foo')",
  },
  [FUNCTION]: {
    exampleValue: function someFunction() {},
  },
};

const container = document.createElement('div');

function getRenderedDOMAttributeValue(attribute, givenValue) {
  try {
    const props = {
      [attribute]: givenValue,
    };
    ReactDOM.render(React.createElement('div', props, 'hi'), container);
    console.log(container.firstChild.className);
    return {result: container.firstChild.getAttribute(attribute)};
  } catch (e) {
    console.log(e);
    ReactDOM.unmountComponentAtNode(container);
    return null;
  }
}

console.log(getRenderedDOMAttributeValue('className', 'foo'));
