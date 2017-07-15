import React from 'react'
import ReactDOM from 'react-dom'
import ComponentPlayground from 'component-playground'
import TestCase from '../TestCase'
import Fixture from '../Fixture'

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
`.trim()

function loadStyleSheet(url) {
  let link = document.createElement('link')

  link.rel = 'stylesheet'
  link.href = url

  document.head.appendChild(link)
}

const codeMirrorUrl = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.0.0/`

let addedStyles = false

export default class Playground extends React.Component {
  static defaultProps = {
    theme: 'monokai'
  }

  componentWillMount() {
    if (!addedStyles) {
      addedStyles = true

      loadStyleSheet(`${codeMirrorUrl}/codemirror.min.css`)
      loadStyleSheet(`${codeMirrorUrl}/theme/${this.props.theme}.min.css`)
    }
  }

  generateGithubIssue = () => {
    const el = ReactDOM.findDOMNode(this.editor).querySelector('textarea')

    const template = escape('```javascript\n' + el.value + '\n```')

    const url = `https://github.com/facebook/react/issues/new?body=${template}`
    const tab = window.open(url,'_blank');

    tab.focus()
  }

  render() {
    const scope = {
      React,
      ReactDOM,
      TestCase,
      Fixture
    }

    return (
      <div className="root-layout">
        <ComponentPlayground
          key="playground"
          ref={el => this.editor = el}
          theme={this.props.theme}
          codeText={example}
          noRender={false}
          scope={scope}
        />

        <footer className="playgroundFooter">
          <button onClick={this.generateGithubIssue} target="_blank">
            File Github Issue
          </button>

          This will open a new tab to the React Github repository.
        </footer>
      </div>
    )
  }
}
