# dom-property-config

A set of dom property rendering instructions

`dom-property-config` contains the meta information on how to
  correctly and performantly update any given property for a
  DOM element.

## Example (property serializer)

You can use the `DOMAttributeNames` information to know how
  to serialize DOM element properties to attributes correctly

```js
var DOMAttributeNames = require('dom-property-config').DOMAttributeNames

function elementSerializer(virtualElement) {
  var attrs = []

  Object.keys(virtualElement.properties).forEach(function (key) {
    key = DOMAttributeNames[key] || key

    attrs.push(key + '=' + '"' + virtualElement.properties[key] + '"')
  })

  return '<' + virtualElement.tagName +
    attrs.length ? ' ' + attrs.join(' ') : '' +
    '</' + virtualElement.tagName + '>'
}
```

## Example (property updater)

You can use `Properties` information to know how to correctly
  mutate DOM properties on a live dom node

```js
var Constants = require('dom-property-config').Constants
var Properties = require('dom-property-config').Properties

function updateElement(element, virtualElement) {
  Object.keys(virtualElement.properties).forEach(function (key) {
    var strategy = Properties[key]

    if (strategy & Constants.MUST_USE_ATTRIBUTE) {
      element.setAttribute(key, virtualElement.properties[key])
    } else if (strategy & Constants.MUST_USE_PROPERTY) {
      element[key] = virtualElement.properties[key]
    }
  })
}
```

## Docs

### `var Properties = config.Properties`

The `Properties` object contains key value pairs that describe
  the updating strategy that should be used to update the
  named property on a DOM element.

The `key` is a virtual property name, not to be confused with
  a DOM element property name. There is a mapping of virtual
  property names to DOM element property names in 
  `config.DOMPropertyNames`

The `value` is either `null` which means it's not writable or
  some binary OR combination of `MUST_USE_PROPERTY`, 
  `MUST_USE_ATTRIBUTE`, `HAS_BOOLEAN_VALUE`, `HAS_SIDE_EFFECTS`,
  `HAS_NUMERIC_VALUE`, `HAS_POSITIVE_NUMERIC_VALUE`,
  `HAS_OVERLOADED_BOOLEAN_VALUE`

You can use this object of key values to determine what kind
  of DOM updating strategy you want to implement.

### `var Constants = config.Constants`

`Constants` contains the values of:

 - `MUST_USE_ATTRIBUTE`
 - `MUST_USE_PROPERTY`
 - `HAS_BOOLEAN_VALUE`
 - `HAS_SIDE_EFFECTS`
 - `HAS_NUMERIC_VALUE`
 - `HAS_POSITIVE_NUMERIC_VALUE`
 - `HAS_OVERLOADED_BOOLEAN_VALUE`

`MUST_USE_ATTRIBUTE` means you should use `elem.setAttribute` to
  update this property safely.

`MUST_USE_PROPERTY` means you should use `elem[key] = value` to
  update this property safely.

`HAS_BOOLEAN_VALUE` means you know this property is a boolean.
  this allows you to avoid serializing into `value=false`.

`HAS_SIDE_EFFECTS` means it is not safe to set this property.
  you should special case this property in your algorithm

`HAS_NUMERIC_VALUE` means you know this property is a number.
  this allows you to avoid serializing into `value=NaN`

`HAS_POSITIVE_NUMERIC_VALUE` means you know this property is
  a positive number. this allows you to avoid serializing into
  `value=-1`

`HAS_OVERLOADED_BOOLEAN_VALUE` means you know this property is
  both a string and a boolean. this means you should not
  serialize this property if it's `false`

### `var DOMAttributeNames = config.DOMAttributeNames`

The `DOMAttributeNames` object contains key value that describe
  how to turn properties into attributes.

The `key` is a virtual property name and the `value` is the
  relevant DOM element attribute name.

You can use this object to decided how to serialize your DOM
  properties into a string of HTML attributes

## Installation

`npm install dom-property-config`

## Contributors

 - React maintainers
 - Raynos

## Apache Licenced
