import './hydration.css';
import {SAMPLE_CODE} from './data';

const React = window.React;

class Hydration extends React.Component {
  state = {
    code: SAMPLE_CODE,
    hydrate: true,
  };

  setInput = event => {
    const {name, value} = event.target;
    this.setState({[name]: value});
  };

  setCheckbox = event => {
    const {name, checked} = event.target;
    this.setState({[name]: checked});
  };

  render() {
    const {code, hydrate} = this.state;

    const src = `/renderer.html?code=${escape(code)}&hydrate=${hydrate}`;

    return (
      <div className="hydration">
        <section className="hydration-editor">
          <header className="hydration-options">
            <label htmlFor="hydrate">
              <input
                id="hydrate"
                name="hydrate"
                type="checkbox"
                checked={hydrate}
                onChange={this.setCheckbox}
              />
              Hydrate
            </label>
          </header>
          <textarea
            className="hydration-code"
            name="code"
            value={code}
            onChange={this.setInput}
          />
        </section>
        <iframe className="hydration-frame" title="renderer" src={src} />
      </div>
    );
  }
}

export default Hydration;
