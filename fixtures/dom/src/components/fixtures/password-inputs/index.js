import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';
import PasswordTestCase from './PasswordTestCase';

const React = window.React;

function NumberInputs() {
  return (
    <FixtureSet title="Password inputs">
      <TestCase
        title="The show password icon"
        description={`
          Some browsers have an unmask password icon that React accidentally
          prevents the display of.
        `}
        affectedBrowsers="IE Edge, IE 11">
        <TestCase.Steps>
          <li>Type any string (not an actual password)</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          The field should include the "unmasking password" icon.
        </TestCase.ExpectedResult>

        <PasswordTestCase />
      </TestCase>
    </FixtureSet>
  );
}

export default NumberInputs;
