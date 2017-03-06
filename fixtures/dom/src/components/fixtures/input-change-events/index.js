import React from 'react';

import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';
import RangeKeyboardFixture from './RangeKeyboardFixture';
import RadioClickFixture from './RadioClickFixture';
import InputPlaceholderFixture from './InputPlaceholderFixture';

class InputChangeEvents extends React.Component {
  render() {
    return (
      <FixtureSet
        title="Input change events"
        description="Tests proper behavior of the onChange event for inputs"
      >
        <TestCase
          title="Range keyboard changes"
          description={`
            Range inputs should fire onChange events for keyboard events
          `}
        >
          <TestCase.Steps>
            <li>Focus range input</li>
            <li>change value via the keyboard arrow keys</li>
          </TestCase.Steps>

          <TestCase.ExpectedResult>
            The <code>onKeyDown</code> call count should be equal to
            the <code>onChange</code> call count.
          </TestCase.ExpectedResult>

          <RangeKeyboardFixture />
        </TestCase>

        <TestCase
          title="Radio input clicks"
          description={`
            Radio inputs should only fire change events when the checked
            state changes.
          `}
          resolvedIn="16.0.0"
        >
          <TestCase.Steps>
            <li>Click on the Radio input (or label text)</li>
          </TestCase.Steps>

          <TestCase.ExpectedResult>
            The <code>onChange</code> call count should remain at 0
          </TestCase.ExpectedResult>

          <RadioClickFixture />
        </TestCase>

        <TestCase
          title="Inputs with placeholders"
          description={`
            Text inputs with placeholders should not trigger changes
            when the placeholder is altered
          `}
          resolvedIn="15.0.0"
          resolvedBy="#5004"
          affectedBrowsers="IE9+"
        >
          <TestCase.Steps>
            <li>Click on the Text input</li>
            <li>Click on the "Change placeholder" button</li>
          </TestCase.Steps>

          <TestCase.ExpectedResult>
            The <code>onChange</code> call count should remain at 0
          </TestCase.ExpectedResult>

          <InputPlaceholderFixture />
        </TestCase>
      </FixtureSet>
    );
  }
}


export default InputChangeEvents
