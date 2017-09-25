import Fixture from '../../Fixture';
import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';
import InputTestCase from './InputTestCase';

const React = window.React;

class TextInputFixtures extends React.Component {
  render() {
    return (
      <FixtureSet
        title="Inputs"
        description="Common behavior across controled and uncontrolled inputs">
        <TestCase title="Numbers in a controlled text field with no handler">
          <TestCase.Steps>
            <li>Move the cursor to after "2" in the text field</li>
            <li>Type ".2" into the text input</li>
          </TestCase.Steps>

          <TestCase.ExpectedResult>
            The text field's value should not update.
          </TestCase.ExpectedResult>

          <Fixture>
            <div className="control-box">
              <fieldset>
                <legend>Value as number</legend>
                <input value={2} onChange={() => {}} />
              </fieldset>

              <fieldset>
                <legend>Value as string</legend>
                <input value={'2'} onChange={() => {}} />
              </fieldset>
            </div>
          </Fixture>

          <p className="footnote">
            This issue was first introduced when we added extra logic
            to number inputs to prevent unexpected behavior in Chrome
            and Safari (see the number input test case).
          </p>
        </TestCase>

        <TestCase title="Cursor when editing email inputs">
          <TestCase.Steps>
            <li>Type "user@example.com"</li>
            <li>Select "@"</li>
            <li>Type ".", to replace "@" with a period</li>
          </TestCase.Steps>

          <TestCase.ExpectedResult>
            The text field's cursor should not jump to the end.
          </TestCase.ExpectedResult>

          <InputTestCase type="email" defaultValue="" />
        </TestCase>

        <TestCase title="Cursor when editing url inputs">
          <TestCase.Steps>
            <li>Type "http://www.example.com"</li>
            <li>Select "www."</li>
            <li>Press backspace/delete</li>
          </TestCase.Steps>

          <TestCase.ExpectedResult>
            The text field's cursor should not jump to the end.
          </TestCase.ExpectedResult>

          <InputTestCase type="url" defaultValue="" />
        </TestCase>

        <TestCase title="All inputs" description="General test of all inputs">
          <InputTestCase type="text" defaultValue="Text" />
          <InputTestCase type="email" defaultValue="user@example.com" />
          <InputTestCase type="number" defaultValue={0} />
          <InputTestCase type="url" defaultValue="http://example.com" />
          <InputTestCase type="tel" defaultValue="555-555-5555" />
          <InputTestCase type="color" defaultValue="#ff0000" />
          <InputTestCase type="date" defaultValue="2017-01-01" />
          <InputTestCase
            type="datetime-local"
            defaultValue="2017-01-01T01:00"
          />
          <InputTestCase type="time" defaultValue="01:00" />
          <InputTestCase type="month" defaultValue="2017-01" />
          <InputTestCase type="week" defaultValue="2017-W01" />
          <InputTestCase type="range" defaultValue={0.5} />
          <InputTestCase type="password" defaultValue="" />
        </TestCase>
      </FixtureSet>
    );
  }
}

export default TextInputFixtures;
