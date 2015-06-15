# node-haste [![Build Status](https://travis-ci.org/facebook/node-haste.png?branch=master)](https://travis-ci.org/facebook/node-haste)

Node Haste is a dependency management system for static resources for node.js


## How Does It Work?

The goal of node haste is to build or update a map of static resources in given
directories. For that it scans provided directories for static resources: JS,
CSS, Images, Tests, etc. Once the resources are found haste compares mtimes to
the resources in an existing map. It also checks for package.json configuration
changes. It then starts parsing all affected files to extract useful
information: dependencies, processing options, size, etc.
Once scanned it will update the map with the new data.


## Example

```js
var Haste = require('node-haste').Haste;
var loaders = require('node-haste').loaders;

// configure haste facade
var haste = new Haste(
  [
    new loaders.JSLoader({ networkSize: true }),
    new loaders.CSSLoader({ networkSize: true }),
    new ProjectConfigurationLoader(),
    new ResourceLoader()
  ],
  ['html']
);

// return current map, utilizing cache if available
haste.update('.cache', function(map) {
  assert(map instanceof ResourceMap);
});
```


## Testing

Node haste is covered with unit tests. The unit tests use Jasmine. Any
compatible runner can be used to run the tests.

```sh
$ npm install
$ npm test
```
