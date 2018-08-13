import './hydration.css';
import {SAMPLE_CODE} from './data';
import {LiveProvider, LiveEditor, LiveError} from 'react-live';
import * as buble from 'buble';

const React = window.React;

class Hydration extends React.Component {
  state = {
    code: SAMPLE_CODE,
    transformed: buble.transform(SAMPLE_CODE).code,
    hydrate: true,
  };

  setCode = code => {
    try {
      this.setState({
        code: code,
        transformed: buble.transform(code).code,
      });
    } catch (_error) {
      // Do nothing, ReactLive will show the error
    }
  };

  setCheckbox = event => {
    const {name, checked} = event.target;
    this.setState({[name]: checked});
  };

  render() {
    const {code, hydrate} = this.state;

    const transformed = buble.transform(code).code;
    const src = `/renderer.html?code=${escape(transformed)}&hydrate=${hydrate}`;

    return (
      <LiveProvider code={code}>
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
              <LiveEditor onChange={this.setCode} />
            </div>
          </section>
          <iframe
            className="hydration-frame"
            title="Hydration Preview"
            src={src}
          />
          <LiveError className="hydration-code-error" />
        </div>
      </LiveProvider>
    );
  }
}

export default Hydration;
