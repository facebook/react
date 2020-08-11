import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';
import AttributeStringificationTestCase from './AttributeStringificationTestCase';

const React = window.React;

function AttributeStringification() {
  return (
    <FixtureSet title="Attribute stringification">
      <TestCase
        title="Stringification in attribute setters"
        description={`
          Some browsers fail to stringify objects passed to Element.setAttribute(NS)
          function. This test verifies that React correctly detects this and stringifies the value itself.
        `}
        affectedBrowsers="IE9">
        <TestCase.ExpectedResult>
          The Attribute value displayed below the input field is "stringified".
          The value is not "[object]".
        </TestCase.ExpectedResult>

        <AttributeStringificationTestCase />
      </TestCase>
    </FixtureSet>
  );
}

export default AttributeStringification;
