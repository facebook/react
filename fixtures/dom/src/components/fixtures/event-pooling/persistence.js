import TestCase from '../../TestCase';
import HitBox from './hit-box';

const React = window.React;

class Persistence extends React.Component {
  state = {
    persisted: 0,
    pooled: [],
  };

  addPersisted = event => {
    let {persisted, pooled} = this.state;

    event.persist();

    if (event.type === 'mousemove') {
      this.setState({
        persisted: persisted + 1,
        pooled: pooled.filter(e => e !== event),
      });
    }
  };

  addPooled = event => {
    let {pooled} = this.state;

    if (event.type === 'mousemove' && pooled.indexOf(event) === -1) {
      this.setState({pooled: pooled.concat(event)});
    }
  };

  render() {
    const {pooled, persisted} = this.state;

    return (
      <TestCase title="Persistence" description="">
        <TestCase.Steps>
          <li>Mouse over the pooled event box</li>
          <li>Mouse over the persisted event box</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          The pool size should not increase above 1, but reduce to 0 when hovering over the persisted region.
        </TestCase.ExpectedResult>

        <h2>Add Pooled Event:</h2>
        <HitBox onMouseMove={this.addPooled} />

        <h2>Add Persisted Event:</h2>
        <HitBox onMouseMove={this.addPersisted} />

        <p>
          Pool size: {pooled.length}
        </p>

        <p>
          Persisted size: {persisted}
        </p>
      </TestCase>
    );
  }
}

export default Persistence;
