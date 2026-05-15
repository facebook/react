import FixtureSet from '../../FixtureSet';
import MouseMovement from './mouse-movement';
import MouseEnter from './mouse-enter';

const React = window.React;

class MouseEvents extends React.Component {
  render() {
    return (
      <FixtureSet title="Mouse Events">
        <MouseMovement />
        <MouseEnter />
      </FixtureSet>
    );
  }
}

export default MouseEvents;
