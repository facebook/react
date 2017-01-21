const React = window.React;

const TestCase = React.createClass({
  getInitialState() {
    return { value: '' };
  },
  onChange(event) {
    this.setState({ value: event.target.value });
  },
  render() {
    return (
      <section className="test-case">
        <div>{this.props.children}</div>

        <div className="control-box">
          <fieldset>
            <legend>Controlled</legend>
            <input type="number" value={this.state.value} onChange={this.onChange} />
            <span className="hint"> Value: {JSON.stringify(this.state.value)}</span>
          </fieldset>

          <fieldset>
            <legend>Uncontrolled</legend>
            <input type="number" defaultValue={0.5} />
          </fieldset>
        </div>
      </section>
    );
  },
});

const NumberInputs = React.createClass({
  render() {
    return (
      <form>
        <h1>Number inputs</h1>
        <p>
          Number inputs inconsistently assign and report the value
          property depending on the browser.
        </p>

        <TestCase>
          <h2 className="type-subheading">
            The decimal place should not be lost when backspacing from
            "3.1" to "3."?
          </h2>

          <ol>
            <li>Type "3.1"</li>
            <li>Press backspace, eliminating the "1"</li>
            <li>The field should read "3.", preserving the decimal place</li>
          </ol>
          <p className="footnote">
            <b>Notes:</b> Chrome and Safari clear trailing
            decimals on blur. React makes this concession so that the
            value attribute remains in sync with the value property.
          </p>
        </TestCase>

        <TestCase>
          <h2 className="type-subheading">
            Supports decimal precision greater than 2 places
          </h2>

          <ol>
            <li>Type "0.01"</li>
            <li>The field should read "0.01"</li>
          </ol>
          <p className="footnote">
            <b>Notes:</b> Chrome and Safari clear trailing
            decimals on blur. React makes this concession so that the
            value attribute remains in sync with the value property.
          </p>
        </TestCase>

        <TestCase>
          <h2 className="type-subheading">
            Pressing "e" at the end of a number does not reset the value
          </h2>
          <ol>
            <li>Type "3.14"</li>
            <li>Press "e", so that the value reads "3.14e"</li>
            <li>The field should read "3.14e"</li>
          </ol>
          <p className="footnote">
            <b>Notes:</b> IE does not allow bad input typed into the end of the number.
            This makes it impossible to type "3.14e".
          </p>
        </TestCase>

        <TestCase>
          <h2 className="type-subheading">
            Pressing "ee" in the middle of a number does not clear the display value
          </h2>
          <ol>
            <li>Type "3.14"</li>
            <li>Move the text cursor to after the decimal place</li>
            <li>Press "e" twice, so that the value reads "3.ee14"</li>
            <li>The field should read "3.ee14"</li>
          </ol>
          <p className="footnote">
            <b>Notes:</b> IE does not allow bad input typed into the middle of the number.
            This makes it impossible to type "3.ee14".
          </p>
        </TestCase>

        <TestCase>
          <h2 className="type-subheading">
            Typing "3.0" preserves the trailing zero
          </h2>
          <ol>
            <li>Type "3.0"</li>
            <li>The field should read "3.0"</li>
          </ol>
        </TestCase>

        <TestCase>
          <h2 className="type-subheading">
            Inserting a decimal in to "300" maintains the trailing zeroes
          </h2>
          <ol>
            <li>Type "300"</li>
            <li>Move the cursor to after the "3"</li>
            <li>Type "."</li>
            <li>The field should read "3.00", not "3"</li>
          </ol>
        </TestCase>
      </form>
    );
  },
});

export default NumberInputs;
