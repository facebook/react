
var React = require('react');
var Noop = require('./NoopRenderer');
var assert = require('assert');

class Comp extends React.Component {
  render() {
    return this.props.active ? 'Active Comp' : 'Deactive Comp';
  }
}
const Children = (props) => props.children;
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
assert.deepEqual(
  Noop.getChildren(),
  [
    {
      type: 'main',
      children: [
        {type: 'div', children: [], prop: undefined},
        {text: 'Hello world'},
        {
          type: 'span',
          children: [
            {text: 'Number '},
            {text: '42'},
          ],
          prop: undefined,
        },
        {text: 'Active Comp'}
      ],
      prop: undefined,
    }
  ]
);

console.log('Reconciler package is Ok!');
