import CodeMirror from 'codemirror';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/jsx/jsx';
import './codemirror-paraiso-dark.css';

const React = window.React;

export class CodeEditor extends React.Component {
  shouldComponentUpdate() {
    return false;
  }

  componentDidMount() {
    const {onChange} = this.props;

    this.editor = CodeMirror.fromTextArea(this.textarea, {
      mode: 'jsx',
      theme: 'paraiso-dark',
    });

    this.editor.on('change', function(doc) {
      onChange(doc.getValue());
    });
  }

  componentWillUnmount() {
    if (this.editor) {
      this.editor.toTextArea();
    }
  }

  render() {
    return (
      <textarea
        ref={ref => (this.textarea = ref)}
        defaultValue={this.props.code}
        autoComplete="off"
      />
    );
  }
}

export class CodeError extends React.Component {
  render() {
    let {error, className} = this.props;
    return error ? <div className={className}>{error.message}</div> : null;
  }
}
