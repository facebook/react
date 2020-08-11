import Fixture from '../../Fixture';

const React = window.React;

class AttributeStringificationTestCase extends React.Component {
  state = {
    title: {
      prop: 'if you see this, the test failed',
      toString: () => 'stringified',
    },
  };
  constructor(props) {
    super(props);
    this.input = React.createRef();
  }
  componentDidMount() {
    this.setState(
      Object.assign(this.state, {
        titleRead: this.input.current.getAttribute('title'),
      })
    );
  }

  render() {
    return (
      <Fixture>
        <div>
          <input ref={this.input} title={this.state.title} />
          <p>Attribute Value: {JSON.stringify(this.state.titleRead)}</p>
        </div>
      </Fixture>
    );
  }
}

export default AttributeStringificationTestCase;
