import Fixture from '../../Fixture';

const React = window.React;

class ReplaceEmailInput extends React.Component {
  state = {
    formSubmitted: false,
  };

  render() {
    return (
      <Fixture>
        <form
          className="control-box"
          onSubmit={event => {
            event.preventDefault();
            this.setState({formSubmitted: true});
          }}>
          <fieldset>
            <legend>Email</legend>
            {!this.state.formSubmitted ? (
              <input type="email" />
            ) : (
              <input type="text" disabled={true} />
            )}
          </fieldset>
        </form>
      </Fixture>
    );
  }
}

export default ReplaceEmailInput;
