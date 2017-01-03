const React = window.React;
import '../../../styles/TextInputs.css';

const TextInputFixtures = React.createClass({
  getInitialState() {
    return {
      color: '#ffaaee',
    };
  },

  renderControlled(type) {
    let id = `controlled_${type}`;

    let onChange = e => {
      let value = e.target.value;
      if (type === 'number') {
        value = value === '' ? '' : parseFloat(value, 10) || 0
      }
      this.setState({
        [type] : value,
      });
    };

    let state = this.state[type] || '';

    return (
      <div key={type} className="field">
        <label htmlFor={id}>{type}</label>
        <input id={id} type={type} value={state} onChange={onChange} />
        &nbsp; &rarr; {JSON.stringify(state)}
      </div>
    );
  },

  renderUncontrolled(type) {
    let id = `uncontrolled_${type}`;
    return (
      <div key={type} className="field">
        <label htmlFor={id}>{type}</label>
        <input id={id} type={type} />
      </div>
    );
  },

  render() {
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input
    let types = [
      'text', 'email', 'number', 'url', 'tel',
      'color', 'date', 'datetime-local',
      'time', 'month', 'week', 'range', 'password',
    ];
    return (
      <form onSubmit={event => event.preventDefault()}>
        <fieldset>
          <legend>Controlled</legend>
          {types.map(this.renderControlled)}
        </fieldset>
        <fieldset>
          <legend>Uncontrolled</legend>
          {types.map(this.renderUncontrolled)}
        </fieldset>
      </form>
    );
  },
});

module.exports = TextInputFixtures;
