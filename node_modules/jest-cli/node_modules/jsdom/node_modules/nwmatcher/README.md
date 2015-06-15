# [NWMatcher](http://dperini.github.io/nwmatcher/)

A fast CSS selector engine and matcher.


## Installation

To include NWMatcher in a standard web page:

```html
<script type="text/javascript" src="nwmatcher.js"></script>
```

To use it with Node.js:

```
$ npm install nwmatcher.js
```

NWMatcher currently supports browsers (as a global, `NW.Dom`) and headless environments (as a CommonJS module).


## Supported Selectors

Here is a list of all the CSS2/CSS3 [Supported selectors](https://github.com/dperini/nwmatcher/wiki/CSS-supported-selectors).


## Features and Compliance

You can read more about NWMatcher [features and compliance](https://github.com/dperini/nwmatcher/wiki/Features-and-compliance) on the wiki.


## API

### DOM Selection

#### `first( selector, context )`

Returns a reference to the first element matching `selector`, starting at `context`.

#### `match( element, selector, context )`

Returns `true` if `element` matches `selector`, starting at `context`; returns `false` otherwise.

#### `select( selector, context, callback )`

Returns an array of all the elements matching `selector`, starting at `context`. If `callback` is provided, it is invoked for each matching element.


### DOM Helpers

#### `byId( id, from )`

Returns a reference to the first element with ID `id`, optionally filtered to descendants of the element `from`.

#### `byTag( tag, from )`

Returns an array of elements having the specified tag name `tag`, optionally filtered to descendants of the element `from`.

#### `byClass( class, from )`

Returns an array of elements having the specified class name `class`, optionally filtered to descendants of the element `from`.

#### `byName( name, from )`

Returns an array of elements having the specified value `name` for their name attribute, optionally filtered to descendants of the element `from`.

#### `getAttribute( element, attribute )`

Return the value read from the attribute of `element` with name `attribute`, as a string.

#### `hasAttribute( element, attribute )`

Returns true `element` has an attribute with name `attribute` set; returns `false` otherwise.


### Engine Configuration

#### `configure( options )`

The following options exist and can be set to `true` or `false`:

* `CACHING`: enable caching of results
* `SHORTCUTS`: allow accepting mangled selectors
* `SIMPLENOT`: disallow nested complex `:not()` selectors
* `UNIQUE_ID`: disallow multiple elements with same ID
* `USE_QSAPI`: enable native `querySelectorAll` if available
* `USE_HTML5`: enable special HTML5 rules, related to the relationship between `:checked` and `:selected`
* `VERBOSITY`: choose between throwing errors or just console warnings

Example:

```js
NW.Dom.configure( { USE_QSAPI: false, VERBOSITY: false } );
```

#### `registerOperator( symbol, resolver )`

Registers a new symbol and its matching resolver in the operators table. Example:

```js
NW.Dom.registerOperator( '!=', 'n!="%m"' );
```

#### `registerSelector( name, rexp, func )`

Registers a new selector, with the matching regular expression and the appropriate resolver function, in the selectors table.
