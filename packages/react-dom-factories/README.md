# `react-addons-dom-factories`

> Note:
> `ReactDOMFactories` is a legacy add-on. Consider using
> `React.createFactory` or JSX instead.

Prior to version 16.0.0, React maintained a whitelist of
pre-configured DOM factories. These predefined factories have been
moved to the `react-addons-dom-factories` library.

## Example

```javascript
import ReactDOM from 'react-dom';
import DOM from 'react-addons-dom-factories'; // ES6

const greeting = DOM.div({ className: 'greeting' }, DOM.p(null, 'Hello, world!'));

ReactDOM.render(greeting, document.getElementById('app'))
```
