import {parse, stringify} from 'query-string';
import getVersionTags from '../tags';
const React = window.React;

class Header extends React.Component {
  constructor(props, context) {
    super(props, context);
    const query = parse(window.location.search);
    const version = query.version || 'local';
    const versions = [version];
    this.state = {version, versions};
  }
  componentWillMount() {
    getVersionTags().then(tags => {
      let versions = tags.map(tag => tag.name.slice(1));
      versions = [`local`, ...versions];
      this.setState({versions});
    });
  }
  handleVersionChange(event) {
    const query = parse(window.location.search);
    query.version = event.target.value;
    if (query.version === 'local') {
      delete query.version;
    }
    window.location.search = stringify(query);
  }
  handleFixtureChange(event) {
    window.location.pathname = event.target.value;
  }
  render() {
    return (
      <header className="header">
        <div className="header__inner">
          <span className="header__logo">
            <img
              src="https://reactjs.org/img/logo.svg"
              alt=""
              width="32"
              height="32"
            />
            React Sandbox (v{React.version})
          </span>

          <div className="header-controls">
            <label htmlFor="example">
              <span className="sr-only">Select an example</span>
              <select
                value={window.location.pathname}
                onChange={this.handleFixtureChange}>
                <option value="/">Select a Fixture</option>
                <option value="/range-inputs">Range Inputs</option>
                <option value="/text-inputs">Text Inputs</option>
                <option value="/number-inputs">Number Input</option>
                <option value="/password-inputs">Password Input</option>
                <option value="/selects">Selects</option>
                <option value="/textareas">Textareas</option>
                <option value="/input-change-events">
                  Input change events
                </option>
                <option value="/buttons">Buttons</option>
                <option value="/date-inputs">Date Inputs</option>
                <option value="/error-handling">Error Handling</option>
                <option value="/event-pooling">Event Pooling</option>
                <option value="/custom-elements">Custom Elements</option>
              </select>
            </label>
            <label htmlFor="react_version">
              <span className="sr-only">Select a version to test</span>
              <select
                value={this.state.version}
                onChange={this.handleVersionChange}>
                {this.state.versions.map(version => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>
    );
  }
}

export default Header;
