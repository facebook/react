import FixtureSet from '../../FixtureSet';
import Drag from './drag';
import Hover from './hover';

const React = window.React;

class PointerEvents extends React.Component {
  render() {
    return (
      <FixtureSet
        title="Pointer Events"
        description="Pointer Events are not supported in every browser. The examples below might not work in every browser. To test pointer events, make sure to use Google Chrome, Firefox, Internet Explorer, or Edge.">
        <Drag />
        <Hover />
      </FixtureSet>
    );
  }
}

export default PointerEvents;
