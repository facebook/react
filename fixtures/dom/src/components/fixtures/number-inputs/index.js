const React = window.React;

import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';
import NumberTestCase from './NumberTestCase';

function NumberInputs() {
  return (
    <FixtureSet
        title="Number inputs"
        description="Number inputs inconsistently assign and report the value
                     property depending on the browser."
    >
      <TestCase
          title="Backspacing"
          description="The decimal place should not be lost"
      >
        <TestCase.Steps>
          <li>Type "3.1"</li>
          <li>Press backspace, eliminating the "1"</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          The field should read "3.", preserving the decimal place
        </TestCase.ExpectedResult>

        <NumberTestCase />

        <p className="footnote">
          <b>Notes:</b> Chrome and Safari clear trailing
          decimals on blur. React makes this concession so that the
          value attribute remains in sync with the value property.
        </p>
      </TestCase>

      <TestCase
          title="Decimal precision"
          description="Supports decimal precision greater than 2 places"
      >
        <TestCase.Steps>
          <li>Type "0.01"</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          The field should read "0.01"
        </TestCase.ExpectedResult>

        <NumberTestCase />
      </TestCase>

      <TestCase
          title="Exponent form"
          description="Supports exponent form ('2e4')"
      >
        <TestCase.Steps>
          <li>Type "2e"</li>
          <li>Type 4, to read "2e4"</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          The field should read "2e4". The parsed value should read "20000"
        </TestCase.ExpectedResult>

        <NumberTestCase />
      </TestCase>

      <TestCase
          title="Exponent Form"
          description="Pressing 'e' at the end"
      >
        <TestCase.Steps>
          <li>Type "3.14"</li>
          <li>Press "e", so that the input reads "3.14e"</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          The field should read "3.14e", the parsed value should be empty
        </TestCase.ExpectedResult>

        <NumberTestCase />
      </TestCase>

      <TestCase
          title="Exponent Form"
          description="Supports pressing 'ee' in the middle of a number"
      >
        <TestCase.Steps>
          <li>Type "3.14"</li>
          <li>Move the text cursor to after the decimal place</li>
          <li>Press "e" twice, so that the value reads "3.ee14"</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          The field should read "3.ee14"
        </TestCase.ExpectedResult>

        <NumberTestCase />
      </TestCase>

      <TestCase
          title="Trailing Zeroes"
          description="Typing '3.0' preserves the trailing zero"
      >
        <TestCase.Steps>
          <li>Type "3.0"</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          The field should read "3.0"
        </TestCase.ExpectedResult>

        <NumberTestCase />
      </TestCase>

      <TestCase
          title="Inserting decimals precision"
          description="Inserting '.' in to '300' maintains the trailing zeroes"
      >
        <TestCase.Steps>
          <li>Type "300"</li>
          <li>Move the cursor to after the "3"</li>
          <li>Type "."</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          The field should read "3.00", not "3"
        </TestCase.ExpectedResult>
        <NumberTestCase />
      </TestCase>

      <TestCase
          title="Replacing numbers with -"
          description="Replacing a number with the '-' sign should not clear the value"
      >
        <TestCase.Steps>
          <li>Type "3"</li>
          <li>Select the entire value"</li>
          <li>Type '-' to replace '3' with '-'</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          The field should read "-", not be blank.
        </TestCase.ExpectedResult>
        <NumberTestCase />
      </TestCase>

      <TestCase
          title="Negative numbers"
          description="Typing minus when inserting a negative number should work"
      >
        <TestCase.Steps>
          <li>Type "-"</li>
          <li>Type '3'</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          The field should read "-3".
        </TestCase.ExpectedResult>
        <NumberTestCase />
      </TestCase>
    </FixtureSet>
  );
}

export default NumberInputs;
