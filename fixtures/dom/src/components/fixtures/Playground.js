import React from 'react';
import ReactDOM from 'react-dom';
import TestCase from '../TestCase';
import Fixture from '../Fixture';
import {stringify, parse} from 'query-string';
import {loadStylesheet} from '../../utils/stylesheets';

const example = `
class App extends React.Component {
  render() {
    return (
      <div>
        <h1>Hello, world!</h1>
        <p>Use this space to write out a custom test case.</p>
      </div>
    );
  }
}

ReactDOM.render(<App/>, mountNode);
`.trim();

const codeMirrorUrl = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.0.0/`;

let addedStyles = false;

function extractURICode() {
  try {
    let hash = unescape(window.location.hash.slice(1));
    let query = parse(hash);

    return 'code' in query ? query.code : example;
  } catch (x) {
    console.error('Unable to parse code example', x);
  }

  return example;
}

export default class Playground extends React.Component {
  static defaultProps = {
    theme: 'monokai',
    defaultValue: extractURICode(),
  };

  state = {
    ComponentPlayground: null,
  };

  componentWillMount() {
    if (!addedStyles) {
      addedStyles = true;

      loadStylesheet(`${codeMirrorUrl}/codemirror.min.css`);
      loadStylesheet(`${codeMirrorUrl}/theme/${this.props.theme}.min.css`);
    }

    require.ensure('component-playground', require => {
      this.setState({
        ComponentPlayground: require('component-playground').default,
      });
    });
  }

  getCode() {
    const el = ReactDOM.findDOMNode(this.editor).querySelector('textarea');

    return el.textContent;
  }

  generateGithubIssue = () => {
    const issue = [
      'I found a browser bug.',
      '\n```javascript',
      this.getCode(),
      '```',
      '---',
      `**React Version:** ${React.version}`,
    ].join('\n');

    const query = stringify({title: 'I found a browser bug', body: issue});
    const url = `https://github.com/facebook/react/issues/new?${query}`;
    const tab = window.open(url, '_blank');

    tab.focus();
  };

  persist = event => {
    window.location.hash = stringify({code: this.getCode()});
  };

  render() {
    const {ComponentPlayground} = this.state;

    if (ComponentPlayground == null) {
      return (
        <div className="root-layout">
          <div className="playground">
            <pre className="playgroundCode empty">// One moment...</pre>
            <div className="playgroundPreview empty" />
          </div>
          <footer className="playgroundFooter">
            <button>File Github Issue</button>
            This will open a new tab to React on Github.
          </footer>
        </div>
      );
    }

    const scope = {
      React,
      ReactDOM,
      TestCase,
      Fixture,
    };

    return (
      <div className="root-layout" onKeyUp={this.persist}>
        <ComponentPlayground
          key="playground"
          ref={el => (this.editor = el)}
          theme={this.props.theme}
          codeText={this.props.defaultValue}
          noRender={false}
          scope={scope}
        />

        <footer className="playgroundFooter">
          <button onClick={this.generateGithubIssue}>File Github Issue</button>
          This will open a new tab to React on Github.
        </footer>
      </div>
    );
  }
}
