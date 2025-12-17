import Fixture from '../../Fixture';
import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';

const React = window.React;

class ProgressFixture extends React.Component {
  state = {value: 0, max: 1, enabled: false, backwards: false};

  startTest = () => {
    this.setState({enabled: true}, () => {
      this.progressIntervalId = setInterval(() => {
        if (this.state.backwards) {
          if (this.state.value > 0) {
            this.setState({value: this.state.value - this.state.max / 100});
          } else {
            if (this.state.max === 10000) {
              this.resetTest();
            } else {
              this.setState({max: this.state.max * 100, backwards: false});
            }
          }
        } else {
          if (this.state.value < this.state.max) {
            this.setState({value: this.state.value + this.state.max / 100});
          } else {
            this.setState({backwards: true});
          }
        }
      }, 10);
    });
  };

  resetTest = () => {
    clearInterval(this.progressIntervalId);
    this.setState({value: 0, max: 1, enabled: false, backwards: false});
  };

  render() {
    return (
      <FixtureSet title="Progress">
        <TestCase title="Fill and reset progress bar">
          <TestCase.Steps>
            <li>Press enable button</li>
          </TestCase.Steps>

          <TestCase.ExpectedResult>
            When enabled, bar value should increase from 0% to 100% and
            backwards during three step loop: 0-1, 0-100, 0-10000. Reset button
            stops loop, sets value to 0 and max to 1.
          </TestCase.ExpectedResult>

          <Fixture>
            <div className="control-box">
              <fieldset>
                <legend>Controlled</legend>
                <progress
                  value={this.state.value}
                  max={this.state.max}></progress>
                <button
                  onClick={
                    this.state.enabled ? this.resetTest : this.startTest
                  }>
                  {this.state.enabled ? 'Reset' : 'Enable'}
                </button>
                <br />
                <span className="hint">
                  {' '}
                  max: {JSON.stringify(this.state.max)}
                </span>
                <span className="hint">
                  {' '}
                  value:{' '}
                  {JSON.stringify(
                    Math.round((this.state.value + Number.EPSILON) * 100) / 100
                  )}
                </span>
              </fieldset>
            </div>
          </Fixture>
        </TestCase>
      </FixtureSet>
    );
  }
}

export default ProgressFixture;
