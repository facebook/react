import React from 'react';
import ReactDOM from 'react-dom';
import TestCase from '../TestCase';
import Fixture from '../Fixture';
import browser from 'browser-detect';
import {stringify} from 'query-string';
import {loadStylesheet} from '../../utils/stylesheets';

const example = `
// Use this block of code to write out a custom test case
class MyTest extends React.Component {
  render() {
    return (
      <TestCase title="What went wrong?" description="">
        <TestCase.Steps>
          <li>How do we reproduce this problem?</li>
        </TestCase.Steps>

        <TestCase.ExpectedResult>
          What should we expect to happen?
        </TestCase.ExpectedResult>

        <Fixture>
          Your code goes here.
        </Fixture>
      </TestCase>
    )
  }
}

ReactDOM.render(<MyTest/>, mountNode);
`.trim();

const codeMirrorUrl = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.0.0/`;

let addedStyles = false;

export default class Playground extends React.Component {
  static defaultProps = {
    theme: 'monokai',
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

    import('component-playground').then(({default: ComponentPlayground}) => {
      this.setState({ComponentPlayground});
    });
  }

  generateGithubIssue = () => {
    const el = ReactDOM.findDOMNode(this.editor).querySelector('textarea');
    const platform = browser();

    const issue = [
      'I found a browser bug.',
      '\n```javascript',
      el.textContent,
      '```',
      '---',
      `**React Version:** ${React.version}`,
      `**Browser:** ${platform.name} ${platform.version}`,
      `**Operating System:** ${platform.os}`,
    ].join('\n');

    const query = stringify({title: 'I found a browser bug', body: issue});
    const url = `https://github.com/facebook/react/issues/new?${query}`;
    const tab = window.open(url, '_blank');

    tab.focus();
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
      <div className="root-layout">
        <ComponentPlayground
          key="playground"
          ref={el => (this.editor = el)}
          theme={this.props.theme}
          codeText={example}
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
