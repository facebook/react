import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';

const React = window.React;
const ReactDOM = window.ReactDOM;

class SelectFixture extends React.Component {
  state = {value: ''};
  _nestedDOMNode = null;
  _singleFormDOMNode = null;
  _multipleFormDOMNode = null;

  onChange = event => {
    this.setState({value: event.target.value});
  };

  resetSingleOptionForm = event => {
    event.preventDefault();
    this._singleFormDOMNode.reset();
  };

  resetMultipleOptionForm = event => {
    event.preventDefault();
    this._multipleFormDOMNode.reset();
  };

  componentDidMount() {
    this._renderNestedSelect();
  }

  componentDidUpdate() {
    this._renderNestedSelect();
  }

  _renderNestedSelect() {
    ReactDOM.render(
      <select value={this.state.value} onChange={this.onChange}>
        <option value="">Select a color</option>
        <option value="red">Red</option>
        <option value="blue">Blue</option>
        <option value="green">Green</option>
      </select>,
      this._nestedDOMNode
    );
  }

  render() {
    return (
      <FixtureSet title="Selects" description="">
        <form className="field-group">
          <fieldset>
            <legend>Controlled</legend>
            <select value={this.state.value} onChange={this.onChange}>
              <option value="">Select a color</option>
              <option value="red">Red</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
            </select>
            <span className="hint">Value: {this.state.value}</span>
          </fieldset>
          <fieldset>
            <legend>Uncontrolled</legend>
            <select defaultValue="">
              <option value="">Select a color</option>
              <option value="red">Red</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
            </select>
          </fieldset>
          <fieldset>
            <legend>Controlled in nested subtree</legend>
            <div ref={node => (this._nestedDOMNode = node)} />
            <span className="hint">
              This should synchronize in both direction with the "Controlled".
            </span>
          </fieldset>
        </form>

        <TestCase title="A selected disabled option" relatedIssues="2803">
          <TestCase.Steps>
            <li>Open the select</li>
            <li>Select "1"</li>
            <li>Attempt to reselect "Please select an item"</li>
          </TestCase.Steps>

          <TestCase.ExpectedResult>
            The initial picked option should be "Please select an item", however
            it should not be a selectable option.
          </TestCase.ExpectedResult>

          <div className="test-fixture">
            <select defaultValue="">
              <option value="" disabled>
                Please select an item
              </option>
              <option>0</option>
              <option>1</option>
              <option>2</option>
            </select>
          </div>
        </TestCase>

        <TestCase title="An unselected disabled option" relatedIssues="2803">
          <TestCase.ExpectedResult>
            The initial picked option value should "0": the first non-disabled
            option.
          </TestCase.ExpectedResult>

          <div className="test-fixture">
            <select defaultValue="">
              <option disabled>Please select an item</option>
              <option>0</option>
              <option>1</option>
              <option>2</option>
            </select>
          </div>
        </TestCase>

        <TestCase title="A single select being reset">
          <TestCase.Steps>
            <li>Open the select</li>
            <li>Select "baz" or "foo"</li>
            <li>Click the "Reset" button</li>
          </TestCase.Steps>
          <TestCase.ExpectedResult>
            The select should be reset to the inital value, "bar"
          </TestCase.ExpectedResult>

          <div className="test-fixture">
            <form ref={n => (this._singleFormDOMNode = n)}>
              <select defaultValue="bar">
                <option value="foo">foo</option>
                <option value="bar">bar</option>
                <option value="baz">baz</option>
              </select>
              <button onClick={this.resetSingleOptionForm}>Reset</button>
            </form>
          </div>
        </TestCase>

        <TestCase title="A multiple select being reset">
          <TestCase.Steps>
            <li>Select any combination of options</li>
            <li>Click the "Reset" button</li>
          </TestCase.Steps>
          <TestCase.ExpectedResult>
            The select should be reset to the initial values "foo" and "baz"
          </TestCase.ExpectedResult>

          <div className="test-fixture">
            <form ref={n => (this._multipleFormDOMNode = n)}>
              <select multiple defaultValue={['foo', 'baz']}>
                <option value="foo">foo</option>
                <option value="bar">bar</option>
                <option value="baz">baz</option>
              </select>
              <button onClick={this.resetMultipleOptionForm}>Reset</button>
            </form>
          </div>
        </TestCase>
      </FixtureSet>
    );
  }
}

export default SelectFixture;
