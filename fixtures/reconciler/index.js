/**
 * @flow
 */
var React = require('react');
var Noop = require('./NoopRenderer');
var assert = require('assert');

class Comp extends React.Component {
  render() {
    return this.props.active ? 'Active Comp' : 'Deactive Comp';
  }
}
const Children = props => props.children;
Noop.render(
  <main>
    <div>Hello</div>
    <Children>
      Hello world
      <span>{'Number '}{42}</span>
      <Comp active />
    </Children>
  </main>
);
Noop.flush();
const actual = Noop.getChildren();
const expected = [
  {
    type: 'main',
    children: [
      {type: 'div', children: [], prop: undefined},
      {text: 'Hello world'},
      {
        type: 'span',
        children: [{text: 'Number '}, {text: '42'}],
        prop: undefined,
      },
      {text: 'Active Comp'},
    ],
    prop: undefined,
  },
];
assert.deepEqual(
  actual,
  expected,
  'Error. Noop.getChildren() returned unexpected value.\nExpected:\  ' +
    JSON.stringify(expected, null, 2) +
    '\n\nActual:\n  ' +
    JSON.stringify(actual, null, 2)
);

console.log('Reconciler package is Ok!');
