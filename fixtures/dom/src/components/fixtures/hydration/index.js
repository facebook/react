import './hydration.css';
import VersionPicker from '../../VersionPicker';
import {SAMPLE_CODE} from './data';
import {CodeEditor, CodeError} from './Code';
import {compile} from './code-transformer';
import {reactPaths} from '../../../react-loader';
import qs from 'query-string';

const React = window.React;
// The Hydration fixture can render at a different version than the parent
// app. This allows rendering for versions of React older than the DOM
// test fixtures can support.
const initialVersion = qs.parse(window.location.search).version || 'local';

class Hydration extends React.Component {
  state = {
    error: null,
    code: SAMPLE_CODE,
    hydrate: true,
    version: initialVersion,
  };

  ready = false;

  componentDidMount() {
    window.addEventListener('message', this.handleMessage);
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleMessage);
  }

  handleMessage = event => {
    var data = JSON.parse(event.data);

    switch (data.type) {
      case 'ready':
        this.ready = true;
        this.injectCode();
        break;
      default:
        throw new Error(
          'Editor Error: Unrecognized message "' + data.type + '"'
        );
    }
  };

  injectCode = () => {
    try {
      this.send({
        type: 'code',
        payload: compile(this.state.code),
      });

      this.setState({error: null});
    } catch (error) {
      this.setState({error});
    }
  };

  send = message => {
    if (this.ready) {
      this.frame.contentWindow.postMessage(JSON.stringify(message), '*');
    }
  };

  setFrame = frame => {
    this.frame = frame;
  };

  setCode = code => {
    this.setState({code}, this.injectCode);
  };

  setCheckbox = event => {
    this.setState({
      [event.target.name]: event.target.checked,
    });
  };

  setVersion = version => {
    this.setState({version});
  };

  render() {
    const {code, error, hydrate, version} = this.state;
    const src =
      '/renderer.html?' + qs.stringify({hydrate, ...reactPaths(version)});

    return (
      <div className="hydration">
        <header className="hydration-options">
          <label htmlFor="hydrate">
            <input
              id="hydrate"
              name="hydrate"
              type="checkbox"
              checked={hydrate}
              onChange={this.setCheckbox}
            />
            Auto-Hydrate
          </label>

          <label htmlFor="hydration_version">
            Version:
            <VersionPicker
              id="hydration_version"
              name="hyration_version"
              version={version}
              onChange={this.setVersion}
            />
          </label>
        </header>

        <CodeEditor code={code} onChange={this.setCode} />

        <CodeError error={error} className="hydration-code-error" />

        <iframe
          ref={this.setFrame}
          className="hydration-sandbox"
          title="Hydration Preview"
          src={src}
        />
      </div>
    );
  }
}

export default Hydration;
