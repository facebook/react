import Fixture from '../../Fixture';
import NumberTestCase from './NumberTestCase';

const React = window.React;
const ReactDOM = window.ReactDOM;

class NumberTestCaseShadowDOM extends React.Component {
  componentWillMount() {
    class ShadowNumberInput extends HTMLElement {
      connectedCallback(){
        ReactDOM.render(<NumberTestCase />, this.attachShadow({ mode: 'open' }));
      }
    }

    customElements.define('shadow-number-input', ShadowNumberInput);
  }

  render() {
    return (
      <shadow-number-input {...this.props} />
    );
  }
}

export default NumberTestCaseShadowDOM;
