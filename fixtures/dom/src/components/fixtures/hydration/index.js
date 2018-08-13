import './hydration.css';
import {SAMPLE_CODE} from './data';
import * as buble from 'buble';

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

    const src = `/renderer.html?code=${escape(
      buble.transform(code).code
    )}&hydrate=${hydrate}`;

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

          <div className="hydration-code">
            <textarea onChange={this.setInput} value={code} />
          </div>
        </section>
        <iframe
          className="hydration-frame"
          title="Hydration Preview"
          src={src}
        />
      </div>
    );
  }
}

export default Hydration;
