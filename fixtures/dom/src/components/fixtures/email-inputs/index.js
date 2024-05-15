import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';
import JumpingCursorTestCase from './JumpingCursorTestCase';
import EmailEnabledAttributesTestCase from './EmailEnabledAttributesTestCase';
import EmailDisabledAttributesTestCase from './EmailDisabledAttributesTestCase';

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

        <TestCase.ExpectedResult>Cursor not moving.</TestCase.ExpectedResult>

        <JumpingCursorTestCase />
      </TestCase>

      <TestCase
        title="Attributes enabled"
        description={`
          Test enabled pattern, maxlength, multiple attributes.
        `}>
        <TestCase.Steps>
          <li>Type after existing text ',b@tt.com'</li>
          <li>Try to type spaces after typed text</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          Spaces not added. When cursor hovered over input, popup "Please match
          the requested format." is showed.
        </TestCase.ExpectedResult>

        <EmailEnabledAttributesTestCase />
      </TestCase>

      <TestCase
        title="Attributes disabled"
        description={`
          Test disabled maxlength, multiple attributes.
        `}>
        <TestCase.Steps>
          <li>Type after existing text ',b@tt.com'</li>
          <li>Try to type spaces after typed text</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          Spaces are added freely. When cursor hovered over input, popup "A part
          following '@' should not contain the symbol ','." is showed.
        </TestCase.ExpectedResult>

        <EmailDisabledAttributesTestCase />
      </TestCase>
    </FixtureSet>
  );
}

export default EmailInputs;
