import React from 'react';

class Header extends React.Component {
  constructor(props, context) {
    super(props, context);
    const version = 'local';
    const versions = [version];
    this.state = {version, versions};
  }
  componentWillMount() {
    let versions = [`local`];
    this.setState({versions}); // keeping this basic scaffold around in case we want to implement version switching in future
  }
  render() {
    return (
      <header className="header">
        <div className="header__inner">
          <span className="header__logo">
            <img src={'/react-logo.svg'} alt="" width="32" height="32" />
            React SSR Sandbox (v{React.version})
          </span>
        </div>
      </header>
    );
  }
}

export default Header;
