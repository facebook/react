import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';
import ControlledFormFixture from './ControlledFormFixture';
const React = window.React;

export default class FormStateCases extends React.Component {
  render() {
    return (
      <FixtureSet title="Form State">
        <TestCase
          title="Form state autofills from browser"
          description="Form start should autofill/autocomplete if user has autocomplete/autofill information saved. The user may need to set-up autofill or autocomplete with their specific browser.">
          <TestCase.Steps>
            <li>
              Set up autofill/autocomplete for your browser.
              <br />
              Instructions:
              <ul>
                <li>
                  <SafeLink
                    href="https://support.google.com/chrome/answer/142893?co=GENIE.Platform%3DDesktop&hl=en"
                    text="Google Chrome"
                  />
                </li>
                <li>
                  <SafeLink
                    href="https://support.mozilla.org/en-US/kb/autofill-logins-firefox"
                    text="Mozilla FireFox"
                  />
                </li>
                <li>
                  <SafeLink
                    href="https://support.microsoft.com/en-us/help/4027718/microsoft-edge-automatically-fill-info"
                    text="Microsoft Edge"
                  />
                </li>
              </ul>
            </li>
            <li>Click into any input.</li>
            <li>Select any autofill option.</li>
          </TestCase.Steps>
          <TestCase.ExpectedResult>
            Autofill options should appear when clicking into fields. Selected
            autofill options should change state (shown underneath, under
            "States").
          </TestCase.ExpectedResult>
          <ControlledFormFixture />
        </TestCase>
      </FixtureSet>
    );
  }
}

const SafeLink = ({text, href}) => {
  return (
    <a target="_blank" rel="noreferrer" href={href}>
      {text}
    </a>
  );
};
