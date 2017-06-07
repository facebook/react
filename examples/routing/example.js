const createBrowserHistory = History.createBrowserHistory;
const browserHistory = createBrowserHistory();


// Start by navigating the user to `/`, as the example assumes that
// the example is run from the root directory.
browserHistory.push({ pathname: '/' });


class Link extends React.Component {
  constructor(props) {
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(event) {
    // Instead of letting the `<a>` element handle onClick, do it here
    if (this.props.onClick) {
      this.props.onClick(event);
    }

    // Don't navigate if this.props.onClick called e.preventDefault()
    if (event.defaultPrevented) {
      return;
    }

    // If target prop is set (e.g. to "_blank"), let browser handle link.
    if (this.props.target) {
      return;
    }
    
    // The browser will generally only navigate when the user left clicks.
    // Right clicks or modified clicks have other behaviors, so leave
    // these behaviors to the browser.
    const isNotLeftClick = event.button !== 0;
    const isModified = !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
    if (isModified || isNotLeftClick) {
      return;
    }

    // Ensure the browser doesn't navigate
    event.preventDefault();
    
    // Instead of a normal URL, browserHistory.push() expects an object with
    // `pathname` and `search` properties
    const pathname = this.props.href.split('?')[0];
    const search = this.props.href.slice(pathname.length);
    const location = {pathname, search};
    
    // Update the browser URL and notify any listeners added
    // via browserHistory.listen()
    browserHistory.push(location);
  }

  render() {
    return (
      <a {...this.props} onClick={this.handleClick}>
        {this.props.children}
      </a>
    );
  }
}


function Menu() {
  return (
    <div>
      <h2>Menu</h2>
      <ul>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/news">News</Link></li>
        <li><Link href="/profile">Profile</Link></li>
      </ul>
    </div>
  );
}


class App extends React.Component {
  constructor(props) {
    super(props);
    
    // Set the initial location
    this.state = {
      location: browserHistory.location
    };
  }
  
  componentDidMount() {
    // Listen for navigation events only after the component is mounted,
    // and save the latest location to component state.
    //
    // We do this here instead of in `constructor()`, as listening for
    // navigation events only makes sense when the component is mounted in
    // a browser -- not when it is being rendered server-side.
    this.unsubscribe = browserHistory.listen(location => {
      this.setState({location});
    });
  }
  
  componentWillUnmount() {
    // Ensure our listener does not keep calling `setState` after the component
    // the component has been unmounted
    this.unsubscribe();
  }

  render() {
    const location = this.state.location;
  
    let content;
    switch (location.pathname) {
      case '/':
        content = <h3>Home</h3>;
        break;

      case '/news':
        content = <h3>News</h3>;
        break;

      case '/profile':
        content = <h3>Profile</h3>;
        break;

      default:
        content = <h3>Not Found</h3>;
    }

    return (
      <div>
        <Menu />
        <div>{content}</div>
      </div>
    );
  }
}


ReactDOM.render(
  <App />,
  document.getElementById('container')
);
