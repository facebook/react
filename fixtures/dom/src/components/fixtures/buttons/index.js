const React = window.React;

import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';

function onButtonClick() {
  window.alert(`This shouldn't have happened!`);
}

export default class ButtonTestCases extends React.Component {
  render() {
    return (
      <FixtureSet title="Buttons">
        <TestCase
          title="onClick with disabled buttons"
          description="The onClick event handler should not be invoked when clicking on a disabled buyaton">
          <TestCase.Steps>
            <li>Click on the disabled button</li>
          </TestCase.Steps>
          <TestCase.ExpectedResult>
            Nothing should happen
          </TestCase.ExpectedResult>
          <button disabled onClick={onButtonClick}>Click Me</button>
          </TestCase>
          <TestCase
            title="onClick with disabled buttons containing other elements"
            description="The onClick event handler should not be invoked when clicking on a disabled button that contains other elements">
          <TestCase.Steps>
            <li>Click on the disabled button, which contains a span</li>
          </TestCase.Steps>
          <TestCase.ExpectedResult>
            Nothing should happen
          </TestCase.ExpectedResult>
          <button disabled onClick={onButtonClick}>
            <span>Click Me</span>
          </button>
        </TestCase>
      </FixtureSet>
    );
  }
}
