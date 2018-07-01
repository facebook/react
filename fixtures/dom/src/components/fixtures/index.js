import RangeInputFixtures from './range-inputs';
import TextInputFixtures from './text-inputs';
import SelectFixtures from './selects';
import TextAreaFixtures from './textareas';
import InputChangeEvents from './input-change-events';
import NumberInputFixtures from './number-inputs';
import PasswordInputFixtures from './password-inputs';
import ButtonFixtures from './buttons';
import DateInputFixtures from './date-inputs';
import ErrorHandling from './error-handling';
import EventPooling from './event-pooling';
import CustomElementFixtures from './custom-elements';
import MediaEventsFixtures from './media-events';
import PointerEventsFixtures from './pointer-events';
import MouseEventsFixtures from './mouse-events';

const React = window.React;

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
    case '/date-inputs':
      return <DateInputFixtures />;
    case '/error-handling':
      return <ErrorHandling />;
    case '/event-pooling':
      return <EventPooling />;
    case '/custom-elements':
      return <CustomElementFixtures />;
    case '/media-events':
      return <MediaEventsFixtures />;
    case '/pointer-events':
      return <PointerEventsFixtures />;
    case '/mouse-events':
      return <MouseEventsFixtures />;
    default:
      return <p>Please select a test fixture.</p>;
  }
}

export default FixturesPage;
