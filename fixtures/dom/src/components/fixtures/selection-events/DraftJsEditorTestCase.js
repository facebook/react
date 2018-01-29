import TestCase from '../../TestCase';
import Iframe from '../../Iframe';
const React = window.React;
const {EditorState, Editor} = window.Draft;


export default class DraftJsEditorTestCase extends React.Component {
  constructor(props) {
    super(props);
    this.state = {editorState: EditorState.createEmpty()};
    this.onChange = (editorState) => this.setState({editorState});
  }
  render() {
    return (
      <TestCase
        title="Cursor Position in a Draft.js Editor"
        description="Draft.js is a rich text editor system for React.
        This verifies that the selection restoration functionality it depends on
        works in an iframe.">
        <TestCase.Steps>
          <li>Enter some text into the Draft.js editor (grey outlined box)</li>
          <li>Change your cursor position to somewhere in the middle of the text</li>
          <li>Enter a new character</li>
        </TestCase.Steps>
        <TestCase.ExpectedResult>
          The cursor should not jump positions
        </TestCase.ExpectedResult>
        <Iframe height={60}>
          <div style={{ border: '1px solid grey' }}>
            <Editor editorState={this.state.editorState} onChange={this.onChange} />
          </div>
        </Iframe>
      </TestCase>
    );
  }
}
