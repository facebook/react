---
id: routing
title: Routing
permalink: docs/routing.html
---

Routing is the process of choosing what to render based on the browser's current URL.

While URLs are an important part of the web, not all apps need to perform routing. For example, single-screen utilities and games will often be unaware of their URL. 

React itself does not have a built-in routing solution. But if you need one, component [state and lifecycle](/react/docs/state-and-lifecycle.html) are all you need to hook React up to the relevant browser APIs. This guide will take you through the process of building a simple Router using these tools.

There are also a number of community projects, such as [react-router](https://github.com/ReactTraining/react-router), that can handle this task for you.

## Displaying the correct content

The simplest way to implement Routing in a React application is with a top-level Component that chooses which content to render by URL. For example, a top-level `App` component may decide what to render based on [window.location.pathname](https://developer.mozilla.org/en-US/docs/Web/API/Location):

```js{13-20}
function Menu() {
  return (
    <div>
      <a href="/news">News</a>
      <a href="/profile">Profile</a>
    </div>
  );
}

function App() {
  const location = window.location;

  let content;
  if (location.pathname === '/news') {
    content = <h1>News</h1>;
  } else if (location.pathname === '/profile') {
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
```

But while this app will work, it has one major issue; it will reload the entire page every time a user clicks a link.

## HTML5 History

The HTML5 [History API](https://developer.mozilla.org/en/docs/Web/API/History) makes it possible to update the browser's URL without causing a page reload. It also emits browser events when the user clicks *Back* or *Forward*. By using this API, you can write applications that respond faster and behave as expected when *Back* or *Forward* are clicked.

Single page applications will often make use of the following two parts of the History API:

- The [popstate](https://developer.mozilla.org/en-US/docs/Web/Events/popstate) browser event on the `window` object, which is emitted when *Back* or *Forward* are clicked
- The [window.history.pushState()](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method) method, which allows the app to replace the contents of the URL bar without actually navigating

## History objects

The HTML5 History API is not without issues.

Firstly, there are inconsistencies between how the different browsers use the `popstate` event. Some versions of Chrome and Safari will emit an event on page load while other versions won't.

Secondly, navigation events are only emitted when they're caused by external stimuli such as the *Back* or *Forward* buttons. When the application itself updates the URL, nothing will happen. This means that the application will need to manually pass the new URL from the link that caused it to the top-level component that is handling routing.

Typically, these issues are solved by creating a separate object which manages access to the HTML5 History API. This object will do two things:

- It will normalise events between browsers
- It will emit navigation events caused by both the application and external stimuli

While it is certainly possible to create your own object to manage access to the History API, in this guide we'll use the popular [history](https://github.com/mjackson/history) package.

```bash
npm install --save history
```

As the History API is global, our object will also need to be accessible everywhere. For example, we can create a separate file and export the object from it, so that any other modules can later import it.

```js
import createBrowserHistory from 'history/createBrowserHistory';

const browserHistory = createBrowserHistory();

export default browserHistory;
```

This guide will use the following methods and properties from the `browserHistory` object:

-   `browserHistory.location`

    An object that contains the browser's current location. Its shape is similar to the object available at `window.location`:

    ```js
    {
      pathname: '/friends',
      query: '?page=1',
      hash: '#top'
    }
    ```

-   `browserHistory.listen(callbackFunction)`
    
    Subscribes to history events, returning a function that will cancel the subscription when called.

    While subscribed, the callback function will be called with the latest `location` each time the user navigates. For example:

    ```js
    const unlisten = browserHistory.listen((location) => {
      console.log(location.pathname);
    });
    
-   `browserHistory.push(location)`

    Adds a new entry to the browser history using `window.history.pushState()`, then calls any listeners registered with `browserHistory.listen()`

You can view the documentation for the full `browserHistory` object API at the [history](https://github.com/mjackson/history) package's page.

## Links

By default, HTML `<a>` elements will always cause the page to reload when clicked. If you'd like to update the URL using the History API, you'll need to cancel the default behaviour and then implement an alternative.

You could do this by adding an `onClick` handler to each individual `<a>` element, but since most links within an app will share the same logic, people often create a component for them. Instances of this component behave exactly like `<a>` elements, except that instead of refreshing the page, they will update the URL in-place using `browserHistory.push()`:

```js{47}
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

When the URL is updated by `browserHistory.push()`, by default nothing will happen. In order to update the displayed content, you will need to listen for history events and take appropriate action.

Since the displayed content is decided by your `App` component, the current location will need to be available within that component's `render()` method. You could accomplish this by passing it in via `props`, but we'll take take the approach of storing it in [component state](/react/docs/state-and-lifecycle.html).

Assuming we're keeping the current location under the `location` key of `this.state`, this will involve four steps:

1. Setting the initial state to the current value of `browserHistory.location`.
2. Subscribing to history events once the component has initially rendered.
3. Updating the state whenever a new location is emitted.
4. Unsubscribing from history events when the component is unmounted.

```js{6-8,18-20,30}
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
    // Ensure our listener does not keep calling `setState` after
    // the component has been unmounted
    this.unsubscribe();
  }

  render() {
    const location = this.state.location;
  
    let content;
    if (location.pathname === '/news') {
      content = <h1>News</h1>;
    } else if (location.pathname === '/profile') {
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


