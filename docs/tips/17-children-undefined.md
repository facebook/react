---
id: children-undefined
title: this.props.children undefined
layout: tips
permalink: children-undefined.html
prev: references-to-components.html
---

You can't access the children of your component through `this.props.children`. `this.props.children` designates the children being **passed onto you** by the owner:

```js
var App = React.createClass({
  componentDidMount: function() {
    // This doesn't refer to the `span`s! It refers to the children between
    // last line's `<App></App>`, which are undefined.
    console.log(this.props.children);
  },

  render: function() {
    return <div><span/><span/></div>;
  }
});

React.render(<App></App>, mountNode);
```

To access your own subcomponents (the `span`s), place [refs](http://facebook.github.io/react/docs/more-about-refs.html) on them.
