import FixtureSet from '../../FixtureSet';
import TestCase from '../../TestCase';

const React = window.React;
const ReactDOM = window.ReactDOM;

const supportsCustomElements = typeof customElements !== 'undefined';

class HelloWorld extends React.Component {
  render() {
    return <h1>Hello, world!</h1>;
  }
}

if (supportsCustomElements) {
  // Babel breaks web components.
  // https://github.com/w3c/webcomponents/issues/587
  // eslint-disable-next-line no-new-func
  const MyElement = new Function(
    'React',
    'ReactDOM',
    'HelloWorld',
    `
    return class MyElement extends HTMLElement {
      constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode:'open' });
        ReactDOM.render(React.createElement(HelloWorld), shadowRoot);
      }
    }`
  )(React, ReactDOM, HelloWorld);
  customElements.define('my-element', MyElement);
}

export default class ButtonTestCases extends React.Component {
  render() {
    return (
      <FixtureSet
        title="Custom Elements"
        description="Support for Custom Element DOM standards.">
        <TestCase title="Rendering into shadow root">
          <TestCase.ExpectedResult>
            You should see "Hello, World" printed below.{' '}
          </TestCase.ExpectedResult>
          {supportsCustomElements ? (
            <my-element />
          ) : (
            <div>This browser does not support custom elements.</div>
          )}
        </TestCase>
      </FixtureSet>
    );
  }
}
