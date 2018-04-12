import Fixture from '../../Fixture';
import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';
import SwitchDateTestCase from './switch-date-test-case';

const React = window.React;

class DateInputFixtures extends React.Component {
  render() {
    return (
      <FixtureSet title="Dates" description="">
        <TestCase title="Switching between date and datetime-local">
          <TestCase.Steps>
            <li>Type a date into the date picker</li>
            <li>Toggle "Switch type"</li>
          </TestCase.Steps>

          <TestCase.ExpectedResult>
            The month, day, and year values should correctly transfer. The
            hours/minutes/seconds should not be discarded.
          </TestCase.ExpectedResult>

          <Fixture>
            <SwitchDateTestCase />
          </Fixture>
        </TestCase>
      </FixtureSet>
    );
  }
}

export default DateInputFixtures;
