import './hydration.css';
import {SAMPLE_CODE} from './data';
import {LiveProvider, LiveEditor, LiveError} from 'react-live';
import * as buble from 'buble';
import {reactPaths} from '../../../react-loader';
import qs from 'query-string';

const React = window.React;

class Hydration extends React.Component {
  state = {
    code: SAMPLE_CODE,
    hydrate: true,
  };

  setCode = code => {
    this.setState({code});
  };

  setCheckbox = event => {
    const {name, checked} = event.target;
    this.setState({[name]: checked});
  };

  render() {
    const {code, hydrate} = this.state;

    const src =
      '/renderer.html?' +
      qs.stringify({
        code: buble.transform(code).code,
        hydrate,
        ...reactPaths(),
      });

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
