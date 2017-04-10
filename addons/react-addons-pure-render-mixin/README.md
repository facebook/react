# react-addons-pure-render-mixin

>**Note:**
>This is a legacy React addon, and is no longer maintained.
>
>We don't encourage using it in new code, but it exists for backwards compatibility.  
>The recommended migration path is to use [`React.PureComponent`](https://facebook.github.io/react/docs/react-api.html#react.purecomponent) instead.

**Importing**

```javascript
import PureRenderMixin from 'react-addons-pure-render-mixin'; // ES6
var PureRenderMixin = require('react-addons-pure-render-mixin'); // ES5 with npm
```

If you prefer a `<script>` tag, you can get it from `React.addons.PureRenderMixin` with:

```html
<!-- development version -->
<script src="https://unpkg.com/react-addons-pure-render-mixin/react-addons-pure-render-mixin.js"></script>

<!-- production version -->
<script src="https://unpkg.com/react-addons-pure-render-mixin/react-addons-pure-render-mixin.min.js"></script>
```

In this case, make sure to put the `<script>` tag after React.

## Overview

If your React component's render function renders the same result given the same props and state, you can use this mixin for a performance boost in some cases.

Example:

```js
const createReactClass = require('create-react-class');

createReactClass({
  mixins: [PureRenderMixin],

  render: function() {
    return <div className={this.props.className}>foo</div>;
  }
});
```

Under the hood, the mixin implements [shouldComponentUpdate](https://facebook.github.io/react/docs/component-specs.html#updating-shouldcomponentupdate), in which it compares the current props and state with the next ones and returns `false` if the equalities pass.

> Note:
>
> This only shallowly compares the objects. If these contain complex data structures, it may produce false-negatives for deeper differences. Only mix into components which have simple props and state, or use `forceUpdate()` when you know deep data structures have changed. Or, consider using [immutable objects](https://facebook.github.io/immutable-js/) to facilitate fast comparisons of nested data.
>
> Furthermore, `shouldComponentUpdate` skips updates for the whole component subtree. Make sure all the children components are also "pure".
