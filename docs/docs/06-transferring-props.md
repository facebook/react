---
id: transferring-props
title: Transferring Props
permalink: transferring-props.html
prev: reusable-components.html
next: forms.html
---

It's a common pattern in React to wrap a component in an abstraction. The outer component exposes a simple property to do something that might have more complex implementation details.

You can use [JSX spread attributes](/react/docs/jsx-spread.html) to merge the old props with additional values:

```javascript
return <Component {...this.props} more="values" />;
```

If you don't use JSX, you can use any object helper such as ES6 `Object.assign` or Underscore `_.extend`:

```javascript
return Component(Object.assign({}, this.props, { more: 'values' }));
```

The rest of this tutorial explains best practices. It uses JSX and experimental ES7 syntax.

## Manual Transfer

Most of the time you should explicitly pass the properties down. That ensures that you only exposes a subset of the inner API, one that you know will work.

```javascript
var FancyCheckbox = React.createClass({
  render: function() {
    var fancyClass = this.props.checked ? 'FancyChecked' : 'FancyUnchecked';
    return (
      <div className={fancyClass} onClick={this.props.onClick}>
        {this.props.children}
      </div>
    );
  }
});
React.render(
  <FancyCheckbox checked={true} onClick={console.log.bind(console)}>
    Hello world!
  </FancyCheckbox>,
  document.body
);
```

But what about the `name` prop? Or the `title` prop? Or `onMouseOver`?

## Transferring with `...` in JSX

Sometimes it's fragile and tedious to pass every property along. In that case you can use [destructuring assignment](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) with rest properties to extract a set of unknown properties.

List out all the properties that you would like to consume, followed by `...other`.

```javascript
var { checked, ...other } = this.props;
```

This ensures that you pass down all the props EXCEPT the ones you're consuming yourself.

```javascript
var FancyCheckbox = React.createClass({
  render: function() {
    var { checked, ...other } = this.props;
    var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
    // `other` contains { onClick: console.log } but not the checked property
    return (
      <div {...other} className={fancyClass} />
    );
  }
});
React.render(
  <FancyCheckbox checked={true} onClick={console.log.bind(console)}>
    Hello world!
  </FancyCheckbox>,
  document.body
);
```

> NOTE:
> 
> In the example above, the `checked` prop is also a valid DOM attribute. If you didn't use destructuring in this way you might inadvertently pass it along.

Always use the destructuring pattern when transferring unknown `other` props.

```javascript
var FancyCheckbox = React.createClass({
  render: function() {
    var fancyClass = this.props.checked ? 'FancyChecked' : 'FancyUnchecked';
    // ANTI-PATTERN: `checked` would be passed down to the inner component
    return (
      <div {...this.props} className={fancyClass} />
    );
  }
});
```

## Consuming and Transferring the Same Prop

If your component wants to consume a property but also pass it along, you can repass it explicitly `checked={checked}`. This is preferable to passing the full `this.props` object since it's easier to refactor and lint.

```javascript
var FancyCheckbox = React.createClass({
  render: function() {
    var { checked, title, ...other } = this.props;
    var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
    var fancyTitle = checked ? 'X ' + title : 'O ' + title;
    return (
      <label>
        <input {...other}
          checked={checked}
          className={fancyClass}
          type="checkbox"
        />
        {fancyTitle}
      </label>
    );
  }
});
```

> NOTE:
> 
> Order matters. By putting the `{...other}` before your JSX props you ensure that the consumer of your component can't override them. In the example above we have guaranteed that the input will be of type `"checkbox"`.

## Rest and Spread Properties `...`

Rest properties allow you to extract the remaining properties from an object into a new object. It excludes every other property listed in the destructuring pattern.

This is an experimental implementation of an [ES7 proposal](https://github.com/sebmarkbage/ecmascript-rest-spread).

```javascript
var { x, y, ...z } = { x: 1, y: 2, a: 3, b: 4 };
x; // 1
y; // 2
z; // { a: 3, b: 4 }
```

> Note:
>
> Use the [JSX command-line tool](http://npmjs.org/package/react-tools) with the `--harmony` flag to activate the experimental ES7 syntax.

## Transferring with Underscore

If you don't use JSX, you can use a library to achieve the same pattern. Underscore supports `_.omit` to filter out properties and `_.extend` to copy properties onto a new object.

```javascript
var FancyCheckbox = React.createClass({
  render: function() {
    var checked = this.props.checked;
    var other = _.omit(this.props, 'checked');
    var fancyClass = checked ? 'FancyChecked' : 'FancyUnchecked';
    return (
      React.DOM.div(_.extend({}, other, { className: fancyClass }))
    );
  }
});
```
