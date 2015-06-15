# lodash v3.9.3

The [modern build](https://github.com/lodash/lodash/wiki/Build-Differences) of [lodash](https://lodash.com/) exported as [Node.js](http://nodejs.org/)/[io.js](https://iojs.org/) modules.

Generated using [lodash-cli](https://www.npmjs.com/package/lodash-cli):
```bash
$ lodash modularize modern exports=node -o ./
$ lodash modern -d -o ./index.js
```

## Installation

Using npm:

```bash
$ {sudo -H} npm i -g npm
$ npm i --save lodash
```

In Node.js/io.js:

```js
// load the modern build
var _ = require('lodash');
// or a method category
var array = require('lodash/array');
// or a method (great for smaller builds with browserify/webpack)
var chunk = require('lodash/array/chunk');
```

See the [package source](https://github.com/lodash/lodash/tree/3.9.3-npm) for more details.

**Note:**<br>
Don’t assign values to the [special variable](http://nodejs.org/api/repl.html#repl_repl_features) `_` when in the REPL.<br>
Install [n_](https://www.npmjs.com/package/n_) for a REPL that includes lodash by default.

## Module formats

lodash is also available in a variety of other builds & module formats.

 * npm packages for [modern](https://www.npmjs.com/package/lodash), [compatibility](https://www.npmjs.com/package/lodash-compat), & [per method](https://www.npmjs.com/browse/keyword/lodash-modularized) builds
 * AMD modules for [modern](https://github.com/lodash/lodash/tree/3.9.3-amd) & [compatibility](https://github.com/lodash/lodash-compat/tree/3.9.3-amd) builds
 * ES modules for the [modern](https://github.com/lodash/lodash/tree/3.9.3-es) build

## Further Reading

  * [API Documentation](https://lodash.com/docs)
  * [Build Differences](https://github.com/lodash/lodash/wiki/Build-Differences)
  * [Changelog](https://github.com/lodash/lodash/wiki/Changelog)
  * [Release Notes](https://github.com/lodash/lodash/releases)
  * [Roadmap](https://github.com/lodash/lodash/wiki/Roadmap)
  * [More Resources](https://github.com/lodash/lodash/wiki/Resources)

## Features

 * ~100% [code coverage](https://coveralls.io/r/lodash)
 * Follows [semantic versioning](http://semver.org/) for releases
 * [Lazily evaluated](http://filimanjaro.com/blog/2014/introducing-lazy-evaluation/) chaining
 * [_(…)](https://lodash.com/docs#_) supports intuitive chaining
 * [_.add](https://lodash.com/docs#add) for mathematical composition
 * [_.ary](https://lodash.com/docs#ary) & [_.rearg](https://lodash.com/docs#rearg) to change function argument limits & order
 * [_.at](https://lodash.com/docs#at) for cherry-picking collection values
 * [_.attempt](https://lodash.com/docs#attempt) to execute functions which may error without a try-catch
 * [_.before](https://lodash.com/docs#before) to complement [_.after](https://lodash.com/docs#after)
 * [_.bindKey](https://lodash.com/docs#bindKey) for binding [*“lazy”*](http://michaux.ca/articles/lazy-function-definition-pattern) defined methods
 * [_.chunk](https://lodash.com/docs#chunk) for splitting an array into chunks of a given size
 * [_.clone](https://lodash.com/docs#clone) supports shallow cloning of `Date` & `RegExp` objects
 * [_.cloneDeep](https://lodash.com/docs#cloneDeep) for deep cloning arrays & objects
 * [_.curry](https://lodash.com/docs#curry) & [_.curryRight](https://lodash.com/docs#curryRight) for creating [curried](http://hughfdjackson.com/javascript/why-curry-helps/) functions
 * [_.debounce](https://lodash.com/docs#debounce) & [_.throttle](https://lodash.com/docs#throttle) are cancelable & accept options for more control
 * [_.fill](https://lodash.com/docs#fill) to fill arrays with values
 * [_.findKey](https://lodash.com/docs#findKey) for finding keys
 * [_.flow](https://lodash.com/docs#flow) to complement [_.flowRight](https://lodash.com/docs#flowRight) (a.k.a `_.compose`)
 * [_.forEach](https://lodash.com/docs#forEach) supports exiting early
 * [_.forIn](https://lodash.com/docs#forIn) for iterating all enumerable properties
 * [_.forOwn](https://lodash.com/docs#forOwn) for iterating own properties
 * [_.get](https://lodash.com/docs#get) & [_.set](https://lodash.com/docs#set) for deep property getting & setting
 * [_.gt](https://lodash.com/docs#gt), [_.gte](https://lodash.com/docs#gte), [_.lt](https://lodash.com/docs#lt), & [_.lte](https://lodash.com/docs#lte) relational methods
 * [_.inRange](https://lodash.com/docs#inRange) for checking whether a number is within a given range
 * [_.isNative](https://lodash.com/docs#isNative) to check for native functions
 * [_.isPlainObject](https://lodash.com/docs#isPlainObject) & [_.toPlainObject](https://lodash.com/docs#toPlainObject) to check for & convert to `Object` objects
 * [_.isTypedArray](https://lodash.com/docs#isTypedArray) to check for typed arrays
 * [_.mapKeys](https://lodash.com/docs#mapKeys) for mapping keys to an object
 * [_.matches](https://lodash.com/docs#matches) supports deep object comparisons
 * [_.matchesProperty](https://lodash.com/docs#matchesProperty) to complement [_.matches](https://lodash.com/docs#matches) & [_.property](https://lodash.com/docs#property)
 * [_.method](https://lodash.com/docs#method) & [_.methodOf](https://lodash.com/docs#methodOf) to create functions that invoke methods
 * [_.merge](https://lodash.com/docs#merge) for a deep [_.extend](https://lodash.com/docs#extend)
 * [_.parseInt](https://lodash.com/docs#parseInt) for consistent cross-environment behavior
 * [_.pull](https://lodash.com/docs#pull), [_.pullAt](https://lodash.com/docs#pullAt), & [_.remove](https://lodash.com/docs#remove) for mutating arrays
 * [_.random](https://lodash.com/docs#random) supports returning floating-point numbers
 * [_.restParam](https://lodash.com/docs#restParam) & [_.spread](https://lodash.com/docs#spread) for applying rest parameters & spreading arguments to functions
 * [_.runInContext](https://lodash.com/docs#runInContext) for collisionless mixins & easier mocking
 * [_.slice](https://lodash.com/docs#slice) for creating subsets of array-like values
 * [_.sortByAll](https://lodash.com/docs#sortByAll) & [_.sortByOrder](https://lodash.com/docs#sortByOrder) for sorting by multiple properties & orders
 * [_.sum](https://lodash.com/docs#sum) to get the sum of values
 * [_.support](https://lodash.com/docs#support) for flagging environment features
 * [_.template](https://lodash.com/docs#template) supports [*“imports”*](https://lodash.com/docs#templateSettings-imports) options & [ES template delimiters](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-template-literal-lexical-components)
 * [_.transform](https://lodash.com/docs#transform) as a powerful alternative to [_.reduce](https://lodash.com/docs#reduce) for transforming objects
 * [_.unzipWith](https://lodash.com/docs#unzipWith) & [_.zipWith](https://lodash.com/docs#zipWith) to specify how grouped values should be combined
 * [_.xor](https://lodash.com/docs#xor) to complement [_.difference](https://lodash.com/docs#difference), [_.intersection](https://lodash.com/docs#intersection), & [_.union](https://lodash.com/docs#union)
 * [_.valuesIn](https://lodash.com/docs#valuesIn) for getting values of all enumerable properties
 * [_.bind](https://lodash.com/docs#bind), [_.curry](https://lodash.com/docs#curry), [_.partial](https://lodash.com/docs#partial), &
   [more](https://lodash.com/docs "_.bindKey, _.curryRight, _.partialRight") support customizable argument placeholders
 * [_.capitalize](https://lodash.com/docs#capitalize), [_.trim](https://lodash.com/docs#trim), &
   [more](https://lodash.com/docs "_.camelCase, _.deburr, _.endsWith, _.escapeRegExp, _.kebabCase, _.pad, _.padLeft, _.padRight, _.repeat, _.snakeCase, _.startCase, _.startsWith, _.trimLeft, _.trimRight, _.trunc, _.words") string methods
 * [_.clone](https://lodash.com/docs#clone), [_.isEqual](https://lodash.com/docs#isEqual), &
   [more](https://lodash.com/docs "_.assign, _.cloneDeep, _.merge") accept customizer callbacks
 * [_.dropWhile](https://lodash.com/docs#dropWhile), [_.takeWhile](https://lodash.com/docs#takeWhile), &
   [more](https://lodash.com/docs "_.drop, _.dropRight, _.dropRightWhile, _.take, _.takeRight, _.takeRightWhile") to complement [_.first](https://lodash.com/docs#first), [_.initial](https://lodash.com/docs#initial), [_.last](https://lodash.com/docs#last), & [_.rest](https://lodash.com/docs#rest)
 * [_.findLast](https://lodash.com/docs#findLast), [_.findLastKey](https://lodash.com/docs#findLastKey), &
   [more](https://lodash.com/docs "_.curryRight, _.dropRight, _.dropRightWhile, _.flowRight, _.forEachRight, _.forInRight, _.forOwnRight, _.padRight, partialRight, _.takeRight, _.trimRight, _.takeRightWhile") right-associative methods
 * [_.includes](https://lodash.com/docs#includes), [_.toArray](https://lodash.com/docs#toArray), &
   [more](https://lodash.com/docs "_.at, _.countBy, _.every, _.filter, _.find, _.findLast, _.findWhere, _.forEach, _.forEachRight, _.groupBy, _.indexBy, _.invoke, _.map, _.max, _.min, _.partition, _.pluck, _.reduce, _.reduceRight, _.reject, _.shuffle, _.size, _.some, _.sortBy, _.sortByAll, _.sortByOrder, _.sum, _.where") accept strings
 * [_#commit](https://lodash.com/docs#prototype-commit) & [_#plant](https://lodash.com/docs#prototype-plant) for working with chain sequences
 * [_#thru](https://lodash.com/docs#thru) to pass values thru a chain sequence

## Support

Tested in Chrome 41-42, Firefox 37-38, IE 6-11, MS Edge, Opera 28-29, Safari 5-8, ChakraNode 0.12.2, io.js 2.1.0, Node.js 0.8.28, 0.10.38, & 0.12.4, PhantomJS 1.9.8, RingoJS 0.11, & Rhino 1.7.6
Automated [browser](https://saucelabs.com/u/lodash) & [CI](https://travis-ci.org/lodash/lodash/) test runs are available. Special thanks to [Sauce Labs](https://saucelabs.com/) for providing automated browser testing.
