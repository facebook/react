export const SAMPLE_CODE = `
class Fixture extends React.Component {
  constructor(props, context) {
    super(props, context)
    this.state = {
      value: 'asdf'
    }
  }

  onChange(event) {
    this.setState({ value: event.target.value })
  }

  render() {
    return React.createElement(
      'div',
      {},
      React.createElement('input', {
        value: this.state.value,
        onChange: this.onChange.bind(this),
      }),
      React.createElement('p', null, 'Value: ' + this.state.value)
    )
  }
}
`.trim();
