# Displaying data

The most basic thing you can do with a UI is display some data. React makes it easy to display data, and automatically keeps it up-to-date when the data changes.

## Getting started

Let's look at a really simple example. Create a `hello-react.html` file with the following code:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Hello React</title>
    <script src="http://fb.me/react-0.4.0.min.js"></script>
    <script src="http://fb.me/JSXTransformer-0.4.0.js"></script>
  </head>
  <body>
    <div id="example"></div>
    <script type="text/jsx">

      // ** Your code goes here! **

    </script>
  </body>
</html>
```

For the rest of the documentation, we'll just focus on the JavaScript code and assume it's inserted into a template like the one above. Replace the placeholder comment above with the following JS:

```javascript
/** @jsx React.DOM */

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
  React.renderComponent(
    <HelloWorld date={new Date()} />,
    document.getElementById('example')
  );
}, 500);
```

## Reactive updates

View the finished code in a web browser and type your name into the text field. Notice that React is only changing the time string in the UI -- any input you put in the text field remains, even though you haven't written any code to manage this behavior. React figures it out for you and does the right thing.

## JSX syntax

We strongly believe that components are the right way to separate concerns rather than "templates" and "display logic." We think that markup and the code that generates it are intimately tied together. Additionally, display logic is often very complex and using template languages to express it becomes cumbersome.

We've found that the best solution for this problem is to generate markup directly from the JavaScript code such that you can use all of the expressive power of a real programming language to build UIs. In order to make this easier, we've added a *very* simple, **optional** HTML-like syntax for the function calls that generate markup called JSX. See [the JSX syntax documentation](syntax.html) for more information.