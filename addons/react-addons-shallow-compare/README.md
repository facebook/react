# react-addons-shallow-compare

>**Note:**
>This is a legacy React addon, and is no longer maintained.
>
>We don't encourage using it in new code, but it exists for backwards compatibility.  
>The recommended migration path is to use [`React.PureComponent`](https://facebook.github.io/react/docs/react-api.html#react.purecomponent) instead.

**Importing**

```javascript
import shallowCompare from 'react-addons-shallow-compare'; // ES6
var shallowCompare = require('react-addons-shallow-compare'); // ES5 with npm
```

If you prefer a `<script>` tag, you can get it from `React.addons.shallowCompare` with:

```html
<!-- development version -->
<script src="https://unpkg.com/react-addons-shallow-compare/react-addons-shallow-compare.js"></script>

<!-- production version -->
<script src="https://unpkg.com/react-addons-shallow-compare/react-addons-shallow-compare.min.js"></script>
```

In this case, make sure to put the `<script>` tag after React.


## Overview

Before [`React.PureComponent`](https://facebook.github.io/react/docs/react-api.html#react.purecomponent) was introduced, `shallowCompare` was commonly used to achieve the same functionality as [`PureRenderMixin`](https://www.npmjs.com/package/react-addons-pure-render-mixin) while using ES6 classes with React.

If your React component's render function is "pure" (in other words, it renders the same result given the same props and state), you can use this helper function for a performance boost in some cases.

Example:

```js
export class SampleComponent extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    return shallowCompare(this, nextProps, nextState);
  }

  render() {
    return <div className={this.props.className}>foo</div>;
  }
}
```

`shallowCompare` performs a shallow equality check on the current `props` and `nextProps` objects as well as the current `state` and `nextState` objects.  
It does this by iterating on the keys of the objects being compared and returning true when the values of a key in each object are not strictly equal.

`shallowCompare` returns `true` if the shallow comparison for props or state fails and therefore the component should update.  
`shallowCompare` returns `false` if the shallow comparison for props and state both pass and therefore the component does not need to update.
