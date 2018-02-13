import TestCase from '../../TestCase';
import Iframe from '../../Iframe';
const React = window.React;
const ReactDOM = window.ReactDOM;
const {EditorState, Editor} = window.Draft;

class OnSelectIframe extends React.Component {
  state = {count: 0, value: 'Select Me!'};

  _onSelect = event => {
    this.setState(({count}) => ({count: count + 1}));
  };

  _onChange = event => {
    this.setState({value: event.target.value});
  };

  render() {
    const {count, value} = this.state;
    return (
      <Iframe height={60}>
        Selection Event Count: {count}
        <input
          type="text"
          onSelect={this._onSelect}
          value={value}
          onChange={this._onChange}
        />
      </Iframe>
    );
  }
}

export default class OnSelectEventTestCase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {editorState: EditorState.createEmpty()};
    this.onChange = editorState => {
      this.setState({editorState});
    };
  }
  render() {
    return (
      <TestCase
        title="onSelect events within iframes"
        description="onSelect events should fire for elements rendered inside iframes">
        <TestCase.Steps>
          <li>Highlight some of the text in the input below</li>
          <li>Move the cursor around using the arrow keys</li>
        </TestCase.Steps>
        <TestCase.ExpectedResult>
          The displayed count should increase as you highlight or move the
          cursor
        </TestCase.ExpectedResult>
        <OnSelectIframe />
      </TestCase>
    );
  }
}
