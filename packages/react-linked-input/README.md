This component supports the ReactLink API (valueLink, etc) for input components.  Support for ReactLink on DOM elements will be removed from React.  This component may be used as a migration plan (so your code doesn't break in the next version of React) or may be used if you just like the ReactLink data binding semantics.  However, this component is not maintained, so use at your own risk.


```
var React = require('react');
var ReactDOM = require('react-dom');
var LinkedInput = require('react-linked-input');

var link = {value: 'boo', requestChange: function() {}};
React.render(<LinkedInput valueLink={link} />, container);
```
