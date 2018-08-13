import FixtureSet from '../../FixtureSet';
import MouseMovement from './mouse-movement';

const React = window.React;

class MouseEvents extends React.Component {
  render() {
    return (
      <FixtureSet title="Mouse Events">
        <MouseMovement />
      </FixtureSet>
    );
  }
}

export default MouseEvents;
