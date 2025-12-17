import TestCase from '../../TestCase';
import HitBox from './hit-box';

const React = window.React;

class MouseMove extends React.Component {
  state = {
    events: [],
  };

  checkEvent = event => {
    let {events} = this.state;

    if (event.type === 'mousemove' && events.indexOf(event) === -1) {
      this.setState({events: events.concat(event)});
    }
  };

  render() {
    const {events} = this.state;

    return (
      <TestCase title="Mouse Move" description="">
        <TestCase.Steps>
          <li>Mouse over the box below</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          Mousemove should share the same instance of the event between
          dispatches.
        </TestCase.ExpectedResult>

        <HitBox onMouseMove={this.checkEvent} />

        <p>
          Was the event pooled?{' '}
          <b>
            {events.length ? (events.length <= 1 ? 'Yes' : 'No') : 'Unsure'} (
            {events.length} events)
          </b>
        </p>
      </TestCase>
    );
  }
}

export default MouseMove;
