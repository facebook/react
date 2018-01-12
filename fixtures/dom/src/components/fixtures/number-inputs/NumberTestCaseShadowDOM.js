import Fixture from '../../Fixture';

const React = window.React;

class NumberTestCaseShadowDOM extends React.Component {
  state = {value: ''};

  controlledInputElementText = `<input
    type="number"
    value={this.state.value}
    onChange={this.onChange}
  />`;

  uncontrolledInputElementText = `<input type="number" defaultValue={0.5} />`;

  onChange = event => {
    const parsed = parseFloat(event.target.value, 10);
    const value = isNaN(parsed) ? '' : parsed;

    this.setState({value});
  };

  componentDidMount() {
    this.attachShadowDomElement("#shadow-dom-host-controlled", this.controlledInputElementText);
    this.attachShadowDomElement("#shadow-dom-host-uncontrolled", this.uncontrolledInputElementText);
  }

  attachShadowDomElement(hostElementId, stringHtmlElement) {
    var hostElement = document.querySelector(hostElementId);
    var shadow = hostElement.attachShadow({mode: 'open'});
    shadow.innerHTML = stringHtmlElement;
  }

  render() {
    return (
      <Fixture>
        <div>{this.props.children}</div>

        <div className="control-box">
          <fieldset>
            <legend>Controlled</legend>
            <span id="shadow-dom-host-controlled"></span>
            
            <span className="hint">
              {' '}
              Value: {JSON.stringify(this.state.value)}
            </span>
          </fieldset>

          <fieldset>
            <legend>Uncontrolled</legend>
            <span id="shadow-dom-host-uncontrolled"></span>
          </fieldset>
        </div>
      </Fixture>
    );
  }
}

export default NumberTestCaseShadowDOM;