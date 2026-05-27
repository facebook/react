import TestCase from '../../TestCase';
import DragBox from './drag-box';

const React = window.React;

class Drag extends React.Component {
  render() {
    return (
      <TestCase title="Drag" description="">
        <TestCase.Steps>
          <li>Drag the circle below with any pointer tool</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          While dragging, the circle must have turn blue to indicate that a
          pointer capture was received.
        </TestCase.ExpectedResult>

        <DragBox />
      </TestCase>
    );
  }
}

export default Drag;
