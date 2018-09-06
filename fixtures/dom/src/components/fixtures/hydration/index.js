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

  ready = false;

  componentDidMount() {
    window.addEventListener('message', this.handleMessage);
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleMessage);
  }

  injectCode = () => {
    this.send({
      type: 'code',
      payload: buble.transform(this.state.code).code,
    });
  };

  setFrame = frame => {
    this.frame = frame;
  };

  handleMessage = event => {
    switch (event.data.type) {
      case 'ready':
        this.ready = true;
        this.injectCode();
        break;
      default:
        throw new Error('Unrecognized message: ' + event.data.type);
      // do nothing
    }
  };

  send = message => {
    if (this.ready) {
      this.frame.contentWindow.postMessage(message, '*');
    }
  };

  setCode = code => {
    this.setState({code}, this.injectCode);
  };

  setCheckbox = event => {
    this.setState({
      [event.target.name]: event.target.checked,
    });
  };

  render() {
    const {code, hydrate} = this.state;
    const src = '/renderer.html?' + qs.stringify({hydrate, ...reactPaths()});

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
            ref={this.setFrame}
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
