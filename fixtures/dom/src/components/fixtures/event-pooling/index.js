import FixtureSet from '../../FixtureSet';
import MouseMove from './mouse-move';
import Persistence from './persistence';

const React = window.React;

class EventPooling extends React.Component {
  render() {
    return (
      <FixtureSet title="Event Pooling">
        <MouseMove />
        <Persistence />
      </FixtureSet>
    );
  }
}

export default EventPooling;
