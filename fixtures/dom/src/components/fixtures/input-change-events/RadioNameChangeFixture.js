const React = window.React;
const noop = n => n;

class RadioNameChangeFixture extends React.Component {
  state = {
    updated: false,
  };
  onClick = () => {
    this.setState(state => {
      return {updated: !state.updated};
    });
  };
  render() {
    const {updated} = this.state;
    const radioName = updated ? 'firstName' : 'secondName';
    return (
      <div>
        <label>
          <input
            type="radio"
            name={radioName}
            onChange={noop}
            checked={updated === true}
          />
          First Radio
        </label>

        <label>
          <input
            type="radio"
            name={radioName}
            onChange={noop}
            checked={updated === false}
          />
          Second Radio
        </label>

        <div>
          <button type="button" onClick={this.onClick}>Toggle</button>
        </div>
      </div>
    );
  }
}

export default RadioNameChangeFixture;
