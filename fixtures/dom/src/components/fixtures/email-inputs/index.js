import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';
import JumpingCursorTestCase from './JumpingCursorTestCase';

const React = window.React;

function EmailInputs() {
  return (
    <FixtureSet title="Email inputs">
      <TestCase
        title="Spaces in email inputs"
        description={`
          Some browsers are trying to remove spaces from email inputs and after
          doing this place cursor to the beginning.
        `}
        affectedBrowsers="Chrome">
        <TestCase.Steps>
          <li>Type space and character</li>
          <li>Type character, space, character, delete last character</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          Cursor not moving.
        </TestCase.ExpectedResult>

        <JumpingCursorTestCase />
      </TestCase>
    </FixtureSet>
  );
}

export default EmailInputs;
