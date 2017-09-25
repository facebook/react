
var React = require('react');
var Noop = require('./NoopRenderer');
var assert = require('assert');

class Comp extends React.Component {
  render() {
    return this.props.active ? 'Active Comp' : 'Deactive Comp';
  }
}
const Children = (props) => props.children;
const result = Noop.render(
  <main>
    <div>Hello</div>
    <Children>
      Hello world
      <span>{'Number '}{42}</span>
      <Comp active />
    </Children>
  </main>
);

console.log('Noop dumping Tree');
Noop.dumpTree();

Noop.flushDeferredPri();
console.log('Noop dumping Tree');
Noop.dumpTree();

