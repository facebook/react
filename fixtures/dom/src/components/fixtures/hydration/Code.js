import CodeMirror from 'react-codemirror';
import 'codemirror/lib/codemirror.css';
import './codemirror-gruvbox-dark.css';
import 'codemirror/mode/jsx/jsx';

const React = window.React;

const options = {
  mode: 'jsx',
  theme: 'gruvbox-dark',
};

export class CodeEditor extends React.Component {
  render() {
    const {code, onChange} = this.props;
    return <CodeMirror value={code} options={options} onChange={onChange} />;
  }
}

export class CodeError extends React.Component {
  render() {
    let {error, className} = this.props;
    return error ? <div className={className}>{error.message}</div> : null;
  }
}
