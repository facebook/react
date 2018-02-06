import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';

const SUPPORTS_SHADOW_DOM = 'attachShadow' in HTMLElement.prototype;

const React = window.React;
const ReactDOM = window.ReactDOM;

class SelectFixture extends React.Component {
  render() {
    if (!SUPPORTS_SHADOW_DOM) {
      return <div>Browser does not support Shadow DOM, no tests to execute.</div>;
    }

    return (
      <FixtureSet title="Shadow DOM" description="">
        <TestCase title="Event listeners in shadow-dom" relatedIssues="4963">
          <TestCase.Steps>
            <li>Click on the orange box</li>
          </TestCase.Steps>
          <TestCase.ExpectedResult>
            The box should turn green
          </TestCase.ExpectedResult>
          <Shadow>
            <Box/>
          </Shadow>
        </TestCase>
      </FixtureSet>
    );
  }
}

class Shadow extends React.Component {
  componentDidMount() {
    this.ref.attachShadow({mode: 'open'});
    const el = document.createElement('div');
    this.ref.shadowRoot.appendChild(el);
    ReactDOM.render(this.props.children, el);
  }

  render() {
    return <div ref={ref => this.ref = ref}/>;
  }
}

class Box extends React.Component {
  state = {active: false};

  render() {
    const style = {
      height: 100,
      background: this.state.active ? 'green' : 'orange',
      color: 'white',
      marginBottom: 20
    };
    return <div onClick={() => this.setState({active: !this.state.active})} style={style}/>
  }
}


export default SelectFixture;
