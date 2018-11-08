import TestCase from '../../TestCase';
import HoverBox from './hover-box';

const React = window.React;

class Hover extends React.Component {
  state = {
    overs: 0,
    outs: 0,
    enters: 0,
    leaves: 0,
  };

  onOver = () => this.setState({overs: this.state.overs + 1});
  onOut = () => this.setState({outs: this.state.outs + 1});
  onEnter = () => this.setState({enters: this.state.enters + 1});
  onLeave = () => this.setState({leaves: this.state.leaves + 1});

  render() {
    const {overs, outs, enters, leaves} = this.state;

    return (
      <TestCase title="Hover" description="">
        <TestCase.Steps>
          <li>Hover over the above box and the obstacles</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          Overs and outs should increase when moving over the obstacles but
          enters and leaves should not.
        </TestCase.ExpectedResult>

        <HoverBox
          onOver={this.onOver}
          onOut={this.onOut}
          onEnter={this.onEnter}
          onLeave={this.onLeave}
        />

        <p>
          Pointer Overs: <b>{overs}</b> <br />
          Pointer Outs: <b>{outs}</b> <br />
          Pointer Enters: <b>{enters}</b> <br />
          Pointer Leaves: <b>{leaves}</b> <br />
        </p>
      </TestCase>
    );
  }
}

export default Hover;
