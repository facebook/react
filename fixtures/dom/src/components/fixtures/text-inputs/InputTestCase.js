import Fixture from '../../Fixture';
const React = window.React;

class InputTestCase extends React.Component {
  static defaultProps = {
    type: 'text',
    defaultValue: '',
    parseAs: 'text',
  };

  constructor() {
    super(...arguments);

    this.state = {
      value: this.props.defaultValue,
    };
  }

  onChange = event => {
    const raw = event.target.value;

    switch (this.props.type) {
      case 'number':
        const parsed = parseFloat(event.target.value, 10);

        this.setState({value: isNaN(parsed) ? '' : parsed});

        break;
      default:
        this.setState({value: raw});
    }
  };

  render() {
    const {children, type, defaultValue} = this.props;
    const {value} = this.state;

    return (
      <Fixture>
        <div>{children}</div>

        <div className="control-box">
          <fieldset>
            <legend>Controlled {type}</legend>
            <input type={type} value={value} onChange={this.onChange} />
            <p className="hint">
              Value: {JSON.stringify(this.state.value)}
            </p>
          </fieldset>

          <fieldset>
            <legend>Uncontrolled {type}</legend>
            <input type={type} defaultValue={defaultValue} />
          </fieldset>
        </div>
      </Fixture>
    );
  }
}

export default InputTestCase;
