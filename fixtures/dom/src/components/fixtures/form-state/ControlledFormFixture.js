import Fixture from '../../Fixture';
const React = window.React;

class ControlledFormFixture extends React.Component {
  constructor(props) {
    super(props);
    this.state = {name: '', email: ''};

    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
  }

  handleEmailChange(event) {
    this.setState({email: event.target.value});
  }

  handleNameChange(event) {
    this.setState({name: event.target.value});
  }

  render() {
    return (
      <Fixture>
        <form>
          <label>
            Name:
            <input
              type="text"
              value={this.state.name}
              onChange={this.handleNameChange}
              name="name"
              x-autocompletetype="name"
            />
          </label>
          <br />
          <label>
            Email:
            <input
              type="text"
              value={this.state.email}
              onChange={this.handleEmailChange}
              name="email"
              x-autocompletetype="email"
            />
          </label>
        </form>
        <br />
        <div>
          <span>States</span>
          <br />
          <span>Name: {this.state.name}</span>
          <br />
          <span>Email: {this.state.email}</span>
        </div>
      </Fixture>
    );
  }
}

export default ControlledFormFixture;
