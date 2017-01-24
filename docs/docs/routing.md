---
id: routing
title: Routing
permalink: docs/routing.html
---

Routing is the process of choosing what to render based on the browser's current URL.

The simplest way to implement Routing in a React application is with a top-level Component that chooses which content to render by URL. For example, a top-level `App` component may decide what to render based on [window.location.pathname](https://developer.mozilla.org/en-US/docs/Web/API/Location):

```js
function Menu() {
  return (
    <div>
      <a href="/news">News</a>
      <a href="/profile">Profile</a>
    </div>
  );
}

function App({ location }) {
  render() {
    let content;
    if (location.pathname == '/news') {
      content = <h1>News</h1>;
    } else if (location.pathname == '/profile') {
      content = <h1>Profile</h1>;
    } else {
      content = <h1>Not Found</h1>;
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
  <App location={window.location} />,
  document.getElementById('root')
);
```

But while this app will work, it has one major issue; it will reload the entire page every time a user clicks a link.

## HTML5 History

The HTML5 [History API](https://developer.mozilla.org/en/docs/Web/API/History) makes it possible to update the browser's URL without causing a page reload. It also emits browser events when the user clicks *Back* or *Forward*. By using this API, you can write applications that respond faster and behave as expected when *Back* or *Forward* are clicked.

Single page applications will often make use of the following two parts of the History API:

- The [popstate](https://developer.mozilla.org/en-US/docs/Web/Events/popstate) browser event, which is emitted when *Back* or *Forward* are clicked
- The [History.pushState()](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method) method, which allows the app to replace the contents of the URL bar without actually navigating

## History objects

The HTML5 History API is not without issues.

Firstly, there are inconsistencies between how the different browsers use the `popstate` event. Some versions of Chrome and Safari will emit an event on page load while other versions won't.

Secondly, navigation events are only emitted when they're caused by external stimuli such as the *Back* or *Forward* buttons. When the application itself updates the URL, nothing will happen. This means that the application will need to manually pass the new URL from the link that caused it to the top-level component that is handling routing.

Typically, these issues are solved by creating a separate object which manages access to the HTML5 History API. This object will do two things:

- It will normalise events between browsers
- It will emit navigation events caused by both the application and external stimuli

While it is certainly possible to create your own object to manage access to the History API, in this guide we'll use the popular [history](https://github.com/mjackson/history) package.

```bash
npm install history --save
```

As the History API is global, our object will also need to be accessible everywhere.

```js
import createBrowserHistory from 'history/createBrowserHistory';

const history = createBrowserHistory();
```

This guide will use the following methods and properties from the `history` object:

```js
// Get the current location.
const location = history.location

// Listen for changes to the current location.
const unlisten = history.listen((location) => {
  // location is an object like window.location
  console.log(location.pathname)
})

// Change current location, adding a new entry to the
// browser history.
history.push('/home')
```

You can view the documentation for the full `history` object API at the [history](https://github.com/mjackson/history) package's page.

## Links

By default, HTML `<a>` elements will always cause the page to reload when clicked. If you'd like to update the URL using the History API, you'll need to cancel the default behaviour and then implement an alternative.

You could do this by adding an `onClick` handler to each individual `<a>` element, but since most links within an app will share the same logic, people often create a component for them. Instances of this component behave exactly like `<a>` elements, except that instead of refreshing the page, they will update the URL in-place using `history.push()`:

```js
class Link extends React.Component {
  constructor(props) {
    super(props)

    this.handleClick = this.handleClick.bind(this)
  }

  handleClick(event) {
    // Instead of letting the `<a>` element handle
    // onClick, do it here
    if (this.props.onClick) {
      this.props.onClick(event);
    }

    // Don't navigate if this.props.onClick called
    // e.preventDefault()
    if (event.defaultPrevented) {
      return;
    }

    // If target prop is set (e.g. to "_blank"),
    // let browser handle link.
    if (this.props.target) {
      return;
    }
    
    const isNotLeftClick = event.button !== 0;
    const isModified = !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
    if (isModified || isNotLeftClick) {
      return;
    }

    // Ensure the browser doesn't navigate
    event.preventDefault();
    
    // history.push() expects an object that takes the
    // same shape as `window.location`
    const pathname = this.props.href.split('?')[0];
    const search = this.props.href.slice(pathname.length);
    const location = { pathname, search };
    
    // Update the browser URL and notify any listeners
    // added via history.listen()
    history.push(location);
  }

  render() {
    return (
      <a {...this.props} onClick={this.handleClick}>
        {this.props.children}
      </a>
    );
  }
}
```

Use `<Link>` wherever you would normally use `<a>`. For example, the `Menu` component from the first example would use `<Link>`:

```js
function Menu() {
  return (
    <div>
      <Link href="/news">News</Link>
      <Link href="/profile">Profile</Link>
    </div>
  );
}
```

## Updating rendered content

When the URL is updated by `history.push()`, by default nothing will happen. In order to update the displayed content, you will need to listen for history events and take appropriate action.

Since the displayed content is decided by your `App` component, the current location will need to be available within that component's `render()` method. You could accomplish this by passing it in via `props`, but we'll take take the approach of storing it in [component state](/react/docs/state-and-lifecycle.html).

Assuming we're keeping the current location under the `location` key of `this.state`, this will involve four steps:

1. Setting the initial state to the current value of `history.location`.
2. Subscribing to history events once the component has initially rendered.
3. Updating the state whenever a new location is emitted.
4. Unsubscribing from history events when the component is unmounted.

```js
class App extends React.Component {
  constructor(props) {
    super(props);
    
    // Set the initial location
    this.state = {
      location: history.location
    };
  }
  
  componentDidMount() {
    // Subscribe after the component has mounted, in case the
    // component is being rendered server-side and subscribing
    // doesn't make sense
    this.unsubscribe = history.listen(location => {
      // Update the component state whenever the browser's
      // location is updated
      this.setState({ location })
    })
  }
  
  componentWillUnmount() {
    // Ensure our listener does not keep calling `setState` after
    // the component has been unmounted
    this.unsubscribe()
  }

  render() {
    const location = this.state.location;
  
    let content;
    if (location.pathname == '/news') {
      content = <h1>News</h1>;
    } else if (location.pathname == '/profile') {
      content = <h1>Profile</h1>;
    } else {
      content = <h1>Not Found</h1>;
    }
    
    return (
      <div>
        <Menu />
        <div>{content}</div>
      </div>
    );
  }
}
```


