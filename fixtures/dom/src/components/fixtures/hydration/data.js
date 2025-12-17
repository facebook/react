export const SAMPLE_CODE = `
class Fixture extends React.Component {
  state = {
    value: 'asdf'
  }

  onChange(event) {
    this.setState({ value: event.target.value });
  }

  render() {
    const { value } = this.state;

    return (
      <form>
        <input value={value} onChange={this.onChange.bind(this)} />
        <p>Value: {value}</p>
      </form>
    );
  }
}
`.trim();
