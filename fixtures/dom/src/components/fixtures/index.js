const React = window.React;
import RangeInputFixtures from './range-inputs';
import TextInputFixtures from './text-inputs';
import SelectFixtures from './selects';
import TextAreaFixtures from './textareas';
import InputChangeEvents from './input-change-events';
import NumberInputFixtures from './number-inputs';
import PasswordInputFixtures from './password-inputs';
import ButtonFixtures from './buttons';
import ErrorHandling from './error-handling';

/**
 * A simple routing component that renders the appropriate
 * fixture based on the location pathname.
 */
function FixturesPage() {
  switch (window.location.pathname) {
    case '/text-inputs':
      return <TextInputFixtures />;
    case '/range-inputs':
      return <RangeInputFixtures />;
    case '/selects':
      return <SelectFixtures />;
    case '/textareas':
      return <TextAreaFixtures />;
    case '/input-change-events':
      return <InputChangeEvents />;
    case '/number-inputs':
      return <NumberInputFixtures />;
    case '/password-inputs':
      return <PasswordInputFixtures />;
    case '/buttons':
      return <ButtonFixtures />;
    case '/error-handling':
      return <ErrorHandling />;
    default:
      return <p>Please select a test fixture.</p>;
  }
}

module.exports = FixturesPage;
