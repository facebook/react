import getVersionTags from '../tags';

const React = window.React;

class VersionPicker extends React.Component {
  constructor(props, context) {
    super(props, context);
    const version = props.version || 'local';
    const versions = [version];
    this.state = {versions};
  }

  componentWillMount() {
    getVersionTags().then(tags => {
      let versions = tags.map(tag => tag.name.slice(1));
      versions = [`local`, ...versions];
      this.setState({versions});
    });
  }

  onChange = event => {
    this.props.onChange(event.target.value);
  };

  render() {
    const {version, id, name} = this.props;
    const {versions} = this.state;

    return (
      <select id={id} name={name} value={version} onChange={this.onChange}>
        {versions.map(version => (
          <option key={version} value={version}>
            {version}
          </option>
        ))}
      </select>
    );
  }
}

export default VersionPicker;
