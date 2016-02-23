---
id: displaying-data
title: Displaying Data
permalink: displaying-data.html
prev: why-react.html
next: interactivity-and-dynamic-uis.html
---

The most basic thing you can do with a UI is display some data. React makes it easy to display data and automatically keeps the interface up-to-date when the data changes.

## Getting Started

Let's look at a really simple example. Create a `hello-react.html` file with the following code:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Hello React</title>
    <script src="https://fb.me/react-{{site.react_version}}.js"></script>
    <script src="https://fb.me/react-dom-{{site.react_version}}.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-core/5.8.23/browser.min.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/babel">

      // ** Your code goes here! **

    </script>
  </body>
</html>
```

For the rest of the documentation, we'll just focus on the JavaScript code and assume it's inserted into a template like the one above. Replace the placeholder comment above with the following:

```javascript
var HelloWorld = React.createClass({
  render: function() {
    return (
      <p>
        Hello, <input type="text" placeholder="Your name here" />!
        It is {this.props.date.toTimeString()}
      </p>
    );
  }
});

setInterval(function() {
  ReactDOM.render(
    <HelloWorld date={new Date()} />,
    document.getElementById('example')
  );
}, 500);
```

> Note:
>
> The JavaScript above uses [JSX](/react/docs/jsx-in-depth.html), an HTML-like syntax for creating
> JS objects.


## Reactive Updates

Open `hello-react.html` in a web browser and type your name into the text field. Notice that React is only changing the time string in the UI — any input you put in the text field remains, even though you haven't written any code to manage this behavior. React figures it out for you and does the right thing.

The way we are able to figure this out is that React does not manipulate the DOM unless it needs to. **It uses a fast, internal mock DOM to perform diffs and computes the most efficient DOM mutation for you.**

The inputs to this component are called `props` — short for "properties". They're passed as attributes in JSX syntax. You should think of these as immutable within the component, that is, **never write to `this.props`**.

## Components are Just Like Functions

React components are very simple. You can think of them as simple functions that take in `props` and `state` (discussed later) and render HTML. With this in mind, components are easy to reason about.

> Note:
>
> **One limitation**: React components can only render a single root node. If you want to return multiple nodes they *must* be wrapped in a single root.
